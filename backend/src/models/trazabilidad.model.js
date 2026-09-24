const db = require('../config/db');

/**
 * Repositorio de Genealogía y Trazabilidad Avanzada (KIT AVZ-03) - MySQL
 */
class TrazabilidadModel {
  /**
   * Helper para asegurar parseo JSON de payload QR
   */
  static _parseQrPayload(obj) {
    if (!obj) return obj;
    if (obj.codigo_qr_payload && typeof obj.codigo_qr_payload === 'string') {
      try {
        obj.codigo_qr_payload = JSON.parse(obj.codigo_qr_payload);
      } catch (e) {}
    }
    return obj;
  }

  /**
   * Trazabilidad hacia atrás (Backward): Obtiene el árbol genealógico completo de un lote PT.
   * Insumos consumidos, órdenes de producción, controles de calidad, eventos y despachos.
   */
  static async getGenealogiaAtras(codigoLotePT) {
    // 1. Datos básicos del lote PT y su Orden de Producción
    const queryLote = `
      SELECT 
        lpt.id AS lote_pt_id,
        lpt.codigo_lote_pt,
        pt.nombre AS producto_nombre,
        pt.codigo_sku,
        pt.unidad_medida,
        pt.temperatura_conservacion,
        lpt.cantidad_elaborada,
        lpt.fecha_elaboracion,
        lpt.fecha_vencimiento,
        lpt.estado AS estado_actual,
        lpt.ubicacion_deposito,
        lpt.codigo_qr_payload,
        op.id AS orden_produccion_id,
        op.numero_op,
        op.linea_produccion,
        op.estado AS estado_op
      FROM lotes_producto_terminado lpt
      JOIN ordenes_produccion op ON lpt.orden_produccion_id = op.id
      JOIN productos_terminados pt ON op.producto_terminado_id = pt.id
      WHERE lpt.codigo_lote_pt = ?
      LIMIT 1;
    `;
    const resLote = await db.query(queryLote, [codigoLotePT]);
    if (resLote.rows.length === 0) return null;

    const loteInfo = this._parseQrPayload(resLote.rows[0]);

    // 2. Insumos y materias primas consumidas
    const queryInsumos = `
      SELECT 
        mp.nombre AS materia_prima,
        mp.codigo_sku,
        lmp.codigo_lote_mp,
        lmp.proveedor,
        cmp.cantidad_consumida,
        mp.unidad_medida,
        cmp.timestamp_consumo,
        CONCAT(u.nombre, ' ', u.apellido) AS operario_registro
      FROM consumos_materia_prima cmp
      JOIN lotes_materia_prima lmp ON cmp.lote_mp_id = lmp.id
      JOIN materias_primas mp ON lmp.materia_prima_id = mp.id
      JOIN usuarios u ON cmp.operario_id = u.id
      WHERE cmp.orden_produccion_id = ?
      ORDER BY cmp.timestamp_consumo ASC;
    `;
    const resInsumos = await db.query(queryInsumos, [loteInfo.orden_produccion_id]);

    // 3. Bitácora de eventos de trazabilidad
    const queryEventos = `
      SELECT 
        et.id,
        et.etapa_nombre,
        et.linea_equipo,
        et.timestamp_evento,
        et.observaciones,
        pc.codigo_punto,
        pc.nombre AS punto_captura_nombre,
        CONCAT(u.nombre, ' ', u.apellido) AS operario_nombre
      FROM eventos_trazabilidad et
      JOIN puntos_captura pc ON et.punto_captura_id = pc.id
      JOIN usuarios u ON et.usuario_id = u.id
      WHERE et.lote_pt_id = ?
      ORDER BY et.timestamp_evento ASC;
    `;
    const resEventos = await db.query(queryEventos, [loteInfo.lote_pt_id]);

    // 4. Ensayos y Controles de Calidad Bromatológica
    const queryCalidad = `
      SELECT 
        cc.id,
        cc.fecha_control,
        cc.parametro_1_nombre,
        cc.parametro_1_valor,
        cc.parametro_2_nombre,
        cc.parametro_2_valor,
        cc.resultado,
        cc.observaciones,
        CONCAT(u.nombre, ' ', u.apellido) AS auditor_nombre
      FROM controles_calidad cc
      JOIN usuarios u ON cc.usuario_id = u.id
      WHERE cc.lote_pt_id = ?
      ORDER BY cc.fecha_control ASC;
    `;
    const resCalidad = await db.query(queryCalidad, [loteInfo.lote_pt_id]);

    // 5. Despachos y salidas a clientes
    const queryDespachos = `
      SELECT 
        d.id,
        d.numero_remito,
        d.fecha_despacho,
        d.cantidad_despachada,
        c.razon_social AS cliente_nombre,
        c.cuit AS cliente_cuit,
        c.direccion AS cliente_direccion,
        CONCAT(u.nombre, ' ', u.apellido) AS despachador_nombre
      FROM despachos d
      JOIN clientes c ON d.cliente_id = c.id
      JOIN usuarios u ON d.usuario_id = u.id
      WHERE d.lote_pt_id = ?
      ORDER BY d.fecha_despacho ASC;
    `;
    const resDespachos = await db.query(queryDespachos, [loteInfo.lote_pt_id]);

    return {
      lote_pt: loteInfo.codigo_lote_pt,
      producto: loteInfo.producto_nombre,
      sku: loteInfo.codigo_sku,
      unidad_medida: loteInfo.unidad_medida,
      temperatura_conservacion: loteInfo.temperatura_conservacion,
      cantidad_elaborada: loteInfo.cantidad_elaborada,
      fecha_elaboracion: loteInfo.fecha_elaboracion,
      fecha_vencimiento: loteInfo.fecha_vencimiento,
      estado_actual: loteInfo.estado_actual,
      ubicacion_deposito: loteInfo.ubicacion_deposito,
      codigo_qr_payload: loteInfo.codigo_qr_payload,
      orden_produccion: {
        numero_op: loteInfo.numero_op,
        linea: loteInfo.linea_produccion,
        estado: loteInfo.estado_op,
      },
      materias_primas_consumidas: resInsumos.rows,
      controles_calidad: resCalidad.rows,
      historial_eventos: resEventos.rows,
      despachos: resDespachos.rows,
    };
  }

  /**
   * Trazabilidad hacia adelante (Forward / Recall):
   * Dada una materia prima o lote de insumo, encuentra todas las órdenes, lotes PT y clientes despachados.
   */
  static async getGenealogiaAdelante(codigoLoteMP) {
    // 1. Obtener información de la materia prima sospechosa
    const queryMP = `
      SELECT 
        lmp.id,
        lmp.codigo_lote_mp,
        mp.nombre AS materia_prima_nombre,
        mp.codigo_sku,
        lmp.proveedor,
        lmp.fecha_recepcion,
        lmp.fecha_vencimiento,
        lmp.cantidad_inicial,
        lmp.cantidad_actual,
        lmp.estado
      FROM lotes_materia_prima lmp
      JOIN materias_primas mp ON lmp.materia_prima_id = mp.id
      WHERE lmp.codigo_lote_mp = ?
      LIMIT 1;
    `;
    const resMP = await db.query(queryMP, [codigoLoteMP]);
    if (resMP.rows.length === 0) return null;

    const mpInfo = resMP.rows[0];

    // 2. Buscar lotes PT elaborados con esa MP y los clientes receptores
    const queryRecall = `
      SELECT 
        lpt.id AS lote_pt_id,
        lpt.codigo_lote_pt,
        pt.nombre AS producto_nombre,
        pt.codigo_sku,
        lpt.estado AS estado_lote_pt,
        lpt.fecha_elaboracion,
        lpt.fecha_vencimiento,
        d.id AS despacho_id,
        d.numero_remito,
        d.fecha_despacho,
        d.cantidad_despachada,
        c.cuit AS cliente_cuit,
        c.razon_social AS cliente_nombre,
        c.direccion AS cliente_direccion,
        c.telefono AS cliente_telefono
      FROM consumos_materia_prima cmp
      JOIN ordenes_produccion op ON cmp.orden_produccion_id = op.id
      JOIN lotes_producto_terminado lpt ON op.id = lpt.orden_produccion_id
      JOIN productos_terminados pt ON op.producto_terminado_id = pt.id
      LEFT JOIN despachos d ON lpt.id = d.lote_pt_id
      LEFT JOIN clientes c ON d.cliente_id = c.id
      WHERE cmp.lote_mp_id = ?
      ORDER BY lpt.id ASC, d.fecha_despacho ASC;
    `;
    const resRecall = await db.query(queryRecall, [mpInfo.id]);

    // Agrupar resultados por lote PT
    const lotesMap = new Map();
    let totalUnidadesDespachadas = 0;
    const clientesSet = new Set();

    for (const row of resRecall.rows) {
      if (!lotesMap.has(row.lote_pt_id)) {
        lotesMap.set(row.lote_pt_id, {
          codigo_lote_pt: row.codigo_lote_pt,
          producto: row.producto_nombre,
          sku: row.codigo_sku,
          estado: row.estado_lote_pt,
          fecha_elaboracion: row.fecha_elaboracion,
          fecha_vencimiento: row.fecha_vencimiento,
          clientes_destinatarios: [],
        });
      }

      if (row.despacho_id) {
        lotesMap.get(row.lote_pt_id).clientes_destinatarios.push({
          remito: row.numero_remito,
          fecha_despacho: row.fecha_despacho,
          cantidad_entregada: Number(row.cantidad_despachada),
          cliente: row.cliente_nombre,
          cuit: row.cliente_cuit,
          direccion: row.cliente_direccion,
          contacto_telefono: row.cliente_telefono,
        });
        totalUnidadesDespachadas += Number(row.cantidad_despachada);
        clientesSet.add(row.cliente_cuit);
      }
    }

    return {
      lote_mp: mpInfo.codigo_lote_mp,
      materia_prima: mpInfo.materia_prima_nombre,
      sku: mpInfo.codigo_sku,
      proveedor: mpInfo.proveedor,
      estado_lote_mp: mpInfo.estado,
      productos_afectados: Array.from(lotesMap.values()),
      total_clientes_notificar: clientesSet.size,
      total_unidades_despachadas: totalUnidadesDespachadas,
    };
  }
}

module.exports = TrazabilidadModel;
