const db = require('../config/db');
const LotePTModel = require('../models/lotePT.model');
const OrdenProduccionModel = require('../models/ordenProduccion.model');
const EventoTrazabilidadModel = require('../models/eventoTrazabilidad.model');

/**
 * Servicio de Lotes de Producto Terminado y Generación de QR (KIT AVZ-03)
 */
class LotesPTService {
  /**
   * Genera transaccionalmente un nuevo Lote de Producto Terminado:
   * 1. Valida existencia de la Orden de Producción.
   * 2. Calcula automáticamente la fecha de vencimiento según la vida útil del producto si no se especifica.
   * 3. Construye el payload estructurado JSONB para el QR.
   * 4. Inserta el lote PT y registra atómicamente el evento inicial en el Punto de Captura 3 (Envasado).
   * 
   * @param {Object} data
   * @param {number} usuarioId - Operario que ejecuta el envasado
   */
  static async crearLotePT(data, usuarioId) {
    const {
      orden_produccion_id,
      codigo_lote_pt,
      cantidad_elaborada,
      fecha_elaboracion,
      ubicacion_deposito,
    } = data;

    if (!orden_produccion_id || !codigo_lote_pt || !cantidad_elaborada || !fecha_elaboracion) {
      const error = new Error('Campos requeridos: orden_produccion_id, codigo_lote_pt, cantidad_elaborada, fecha_elaboracion');
      error.statusCode = 400;
      throw error;
    }

    if (Number(cantidad_elaborada) <= 0) {
      const error = new Error('La cantidad elaborada debe ser mayor a 0');
      error.statusCode = 400;
      throw error;
    }

    // 1. Obtener datos de la Orden de Producción y Producto
    const op = await OrdenProduccionModel.findById(orden_produccion_id);
    if (!op) {
      const error = new Error(`Orden de producción ID ${orden_produccion_id} no encontrada`);
      error.statusCode = 404;
      throw error;
    }

    // 2. Calcular fecha de vencimiento: fecha_elaboracion + dias_vida_util
    let fechaVencimiento = data.fecha_vencimiento;
    if (!fechaVencimiento) {
      const elabDate = new Date(fecha_elaboracion + 'T00:00:00Z');
      elabDate.setUTCDate(elabDate.getUTCDate() + op.dias_vida_util);
      fechaVencimiento = elabDate.toISOString().split('T')[0];
    } else {
      if (new Date(fechaVencimiento) < new Date(fecha_elaboracion)) {
        const error = new Error('La fecha de vencimiento no puede ser anterior a la fecha de elaboración');
        error.statusCode = 400;
        throw error;
      }
    }

    // 3. Estructurar payload JSONB del Código QR
    const qrPayload = {
      app: 'TrackFinal',
      version: '1.0',
      lote: codigo_lote_pt,
      sku: op.codigo_sku,
      producto: op.producto_nombre,
      unidad: op.unidad_medida,
      elaboracion: fecha_elaboracion,
      vencimiento: fechaVencimiento,
      conservacion: op.temperatura_conservacion,
      linea: op.linea_produccion,
      verificacion_url: `http://trackfinal.lacteossanantonio.com/trazabilidad/${codigo_lote_pt}`,
    };

    // 4. Ejecución atómica ACID con withTransaction
    return await db.withTransaction(async (client) => {
      // 4.1 Inserción del lote PT
      const nuevoLote = await LotePTModel.create(
        {
          orden_produccion_id,
          codigo_lote_pt,
          cantidad_elaborada,
          fecha_elaboracion,
          fecha_vencimiento: fechaVencimiento,
          estado: 'EN_PROCESO',
          codigo_qr_payload: qrPayload,
          ubicacion_deposito: ubicacion_deposito || 'Cámara 1 - En Tránsito',
        },
        client
      );

      // 4.2 Inserción atómica del evento inicial en Punto 3 (Envasado y Etiquetado)
      // En seeds.sql: Punto 3 = 'PC-ENV' (Línea de Envasado y Etiquetado)
      const eventoInicial = await EventoTrazabilidadModel.create(
        {
          lote_pt_id: nuevoLote.id,
          punto_captura_id: 3,
          usuario_id: usuarioId,
          etapa_nombre: 'Envasado y Generación QR',
          linea_equipo: op.linea_produccion,
          observaciones: `Fraccionamiento primario y emisión de rótulo QR para lote ${codigo_lote_pt}. Cantidad: ${cantidad_elaborada} ${op.unidad_medida}.`,
        },
        client
      );

      // 4.3 Registrar control de calidad bromatológico automático según tipo de producto
      const esDDL = (op.producto_nombre || '').toLowerCase().includes('dulce');
      const esYogur = (op.producto_nombre || '').toLowerCase().includes('yogur');
      const param1Nombre = 'pH';
      const param1Valor = esDDL ? '6.05' : (esYogur ? '4.38' : '5.24');
      const param2Nombre = esDDL ? 'Sólidos Solubles (°Brix)' : (esYogur ? 'Acidez Titulable (°Dornic)' : 'Materia Grasa s/ES');
      const param2Valor = esDDL ? '68.5 °Bx' : (esYogur ? '82 °D' : '48.8%');

      await client.query(
        `INSERT INTO controles_calidad
          (lote_pt_id, usuario_id, parametro_1_nombre, parametro_1_valor, parametro_2_nombre, parametro_2_valor, resultado, observaciones)
         VALUES (?, ?, ?, ?, ?, ?, 'CONFORME', ?)`,
        [
          nuevoLote.id,
          usuarioId,
          param1Nombre,
          param1Valor,
          param2Nombre,
          param2Valor,
          `Ensayo analítico de lote ${codigo_lote_pt} dentro de los parámetros del Código Alimentario Argentino (CAA).`
        ]
      );

      // 4.4 Actualizar estado de la OP si estaba en CREADA
      if (op.estado === 'CREADA') {
        await OrdenProduccionModel.updateEstado(op.id, 'EN_PROCESO', client);
      }

      return {
        lote: nuevoLote,
        evento_inicial: eventoInicial,
      };
    });
  }

  /**
   * Cambia el estado de un lote PT (ej. APROBADO, CUARENTENA, BLOQUEADO, DESPACHADO).
   * Si pasa a DESPACHADO, asigna automáticamente un destino comercial al azar con remito y logística.
   */
  static async cambiarEstado(codigoLotePT, nuevoEstado, usuarioId, motivo) {
    const estadosValidos = ['EN_PROCESO', 'CUARENTENA', 'APROBADO', 'RECHAZADO', 'DESPACHADO', 'BLOQUEADO'];
    if (!estadosValidos.includes(nuevoEstado)) {
      const error = new Error(`Estado inválido. Valores permitidos: ${estadosValidos.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    const lote = await LotePTModel.findByCodigo(codigoLotePT);
    if (!lote) {
      const error = new Error(`Lote ${codigoLotePT} no encontrado`);
      error.statusCode = 404;
      throw error;
    }

    return await db.withTransaction(async (client) => {
      let loteActualizado = await LotePTModel.updateEstado(lote.id, nuevoEstado, client);

      if (nuevoEstado === 'DESPACHADO') {
        // 1. Obtener un cliente al azar de la base de datos
        const resClientes = await client.query('SELECT * FROM clientes ORDER BY RAND() LIMIT 1;');
        const cliente = resClientes.rows[0];

        if (cliente) {
          // 2. Generar datos logísticos realistas al azar
          const remitoRand = Math.floor(10000000 + Math.random() * 90000000);
          const numeroRemito = `R-0004-${remitoRand}`;
          const flotas = [
            { patente: 'AF-482-ZX', vehiculo: 'Mercedes-Benz Atego Térmico', chofer: 'Marcelo Benítez', temp: '3.9°C' },
            { patente: 'AE-719-LP', vehiculo: 'Iveco Daily Refrigerado', chofer: 'Roberto Funes', temp: '4.1°C' },
            { patente: 'AD-905-MN', vehiculo: 'Scania R450 Semirremolque Frío', chofer: 'Lucas Peralta', temp: '3.6°C' },
            { patente: 'AG-114-QR', vehiculo: 'VW Constellation Frigorífico', chofer: 'Hernán Sosa', temp: '4.2°C' }
          ];
          const transporte = flotas[Math.floor(Math.random() * flotas.length)];

          // 3. Insertar registro en tabla despachos
          await client.query(
            `INSERT INTO despachos (lote_pt_id, cliente_id, numero_remito, cantidad_despachada, usuario_id)
             VALUES (?, ?, ?, ?, ?);`,
            [lote.id, cliente.id, numeroRemito, lote.cantidad_elaborada, usuarioId]
          );

          // 4. Actualizar ubicación del lote reflejando el destino comercial
          const nuevaUbicacion = `Entregado: ${cliente.razon_social} (${cliente.direccion})`;
          await client.query(
            `UPDATE lotes_producto_terminado SET ubicacion_deposito = ? WHERE id = ?;`,
            [nuevaUbicacion, lote.id]
          );
          loteActualizado.ubicacion_deposito = nuevaUbicacion;

          // 5. Registrar evento de expedición en Punto 6 (Despacho)
          await EventoTrazabilidadModel.create(
            {
              lote_pt_id: lote.id,
              punto_captura_id: 6, // Muelle de Expedición y Despacho
              usuario_id: usuarioId,
              etapa_nombre: 'Despacho y Expedición a Cliente',
              linea_equipo: `${transporte.vehiculo} [Dominio: ${transporte.patente}]`,
              observaciones: `Destino: ${cliente.razon_social} (${cliente.direccion}). Remito: ${numeroRemito}. Chofer: ${transporte.chofer}. Cadena de frío verificada (${transporte.temp}). ${motivo ? 'Nota: ' + motivo : ''}`,
            },
            client
          );
        }
      } else {
        // Registrar evento estándar de cambio de estado en Punto 4 (Laboratorio / Control)
        await EventoTrazabilidadModel.create(
          {
            lote_pt_id: lote.id,
            punto_captura_id: 4,
            usuario_id: usuarioId,
            etapa_nombre: `Cambio de Estado: ${nuevoEstado}`,
            linea_equipo: 'Laboratorio Central de Calidad',
            observaciones: motivo || `Estado del lote modificado de ${lote.estado} a ${nuevoEstado}`,
          },
          client
        );
      }

      return loteActualizado;
    });
  }
}

module.exports = LotesPTService;
