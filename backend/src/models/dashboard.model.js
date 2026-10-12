const db = require('../config/db');

/**
 * Repositorio de consultas agregadas para el Dashboard de KPIs Industriales (KIT AVZ-03)
 * Todas las consultas son de solo lectura (SELECT) sobre los datos de trazabilidad.
 */
class DashboardModel {
  /**
   * Helper para construir cláusulas WHERE de filtro por rango de fechas
   */
  static _buildFechaConditions(filtros, values, alias = 'lpt') {
    let conditions = '';
    if (filtros.desde) {
      values.push(filtros.desde);
      conditions += ` AND ${alias}.fecha_elaboracion >= ?`;
    }
    if (filtros.hasta) {
      values.push(filtros.hasta);
      conditions += ` AND ${alias}.fecha_elaboracion <= ?`;
    }
    return conditions;
  }

  /**
   * Obtiene los KPIs de resumen principal del dashboard.
   * Calcula en una sola consulta: totales por estado y tasa de conformidad.
   * @param {Object} filtros - { desde, hasta }
   * @returns {Object} KPIs agregados
   */
  static async getKPIsResumen(filtros = {}) {
    const values = [];
    const fechaConditions = this._buildFechaConditions(filtros, values);

    const text = `
      SELECT 
        COUNT(*) AS totalLotes,
        SUM(CASE WHEN lpt.estado = 'APROBADO'    THEN 1 ELSE 0 END) AS lotesAprobados,
        SUM(CASE WHEN lpt.estado = 'CUARENTENA'  THEN 1 ELSE 0 END) AS lotesCuarentena,
        SUM(CASE WHEN lpt.estado = 'EN_PROCESO'  THEN 1 ELSE 0 END) AS lotesEnProceso,
        SUM(CASE WHEN lpt.estado = 'RECHAZADO'   THEN 1 ELSE 0 END) AS lotesRechazados,
        SUM(CASE WHEN lpt.estado = 'DESPACHADO'  THEN 1 ELSE 0 END) AS lotesDespachados,
        SUM(CASE WHEN lpt.estado = 'BLOQUEADO'   THEN 1 ELSE 0 END) AS lotesBloqueados
      FROM lotes_producto_terminado lpt
      WHERE 1=1
      ${fechaConditions}
    `;

    const { rows } = await db.query(text, values);
    const raw = rows[0] || {};

    const totalLotes = Number(raw.totalLotes) || 0;
    const lotesAprobados = Number(raw.lotesAprobados) || 0;
    const lotesDespachados = Number(raw.lotesDespachados) || 0;
    const lotesConformes = lotesAprobados + lotesDespachados;

    const tasaConformidad =
      totalLotes > 0
        ? Number(((lotesConformes / totalLotes) * 100).toFixed(1))
        : 0;

    return {
      totalLotes,
      lotesAprobados,
      lotesConformes,
      lotesCuarentena: Number(raw.lotesCuarentena) || 0,
      lotesEnProceso: Number(raw.lotesEnProceso) || 0,
      lotesRechazados: Number(raw.lotesRechazados) || 0,
      lotesDespachados,
      lotesBloqueados: Number(raw.lotesBloqueados) || 0,
      tasaConformidad,
    };
  }

  /**
   * Obtiene la distribución de lotes por estado para gráfico de dona/torta.
   * @param {Object} filtros - { desde, hasta }
   * @returns {Array} [{ estado, cantidad }]
   */
  static async getDistribucionEstados(filtros = {}) {
    const values = [];
    const fechaConditions = this._buildFechaConditions(filtros, values);

    const text = `
      SELECT 
        lpt.estado,
        COUNT(*) AS cantidad
      FROM lotes_producto_terminado lpt
      WHERE 1=1
      ${fechaConditions}
      GROUP BY lpt.estado
      ORDER BY cantidad DESC;
    `;

    const { rows } = await db.query(text, values);
    return rows.map((r) => ({
      estado: r.estado,
      cantidad: Number(r.cantidad),
    }));
  }

  /**
   * Obtiene volumen de producción agrupado por línea de producción.
   * @param {Object} filtros - { desde, hasta, linea_produccion }
   * @returns {Array} [{ linea_produccion, total_unidades, cantidad_lotes }]
   */
  static async getVolumenPorLinea(filtros = {}) {
    const values = [];
    let conditions = '';

    if (filtros.desde) {
      values.push(filtros.desde);
      conditions += ` AND lpt.fecha_elaboracion >= ?`;
    }
    if (filtros.hasta) {
      values.push(filtros.hasta);
      conditions += ` AND lpt.fecha_elaboracion <= ?`;
    }
    if (filtros.linea_produccion) {
      values.push(filtros.linea_produccion);
      conditions += ` AND op.linea_produccion = ?`;
    }

    const text = `
      SELECT 
        op.linea_produccion,
        SUM(lpt.cantidad_elaborada) AS total_unidades,
        COUNT(lpt.id)               AS cantidad_lotes
      FROM lotes_producto_terminado lpt
      JOIN ordenes_produccion op ON lpt.orden_produccion_id = op.id
      WHERE 1=1
      ${conditions}
      GROUP BY op.linea_produccion
      ORDER BY total_unidades DESC;
    `;

    const { rows } = await db.query(text, values);
    return rows.map((r) => ({
      linea_produccion: r.linea_produccion || 'Sin asignar',
      total_unidades: Number(r.total_unidades) || 0,
      cantidad_lotes: Number(r.cantidad_lotes) || 0,
    }));
  }

  /**
   * Obtiene el listado de lotes con todos los filtros avanzados aplicados,
   * preparado para exportación CSV/Excel.
   * @param {Object} filtros - { desde, hasta, producto_id, linea_produccion, estados, busqueda, lote_mp }
   * @returns {Array} lotes enriquecidos con datos de producto y línea
   */
  static async getLotesConFiltrosAvanzados(filtros = {}) {
    const values = [];
    let conditions = '';

    if (filtros.desde) {
      values.push(filtros.desde);
      conditions += ` AND lpt.fecha_elaboracion >= ?`;
    }
    if (filtros.hasta) {
      values.push(filtros.hasta);
      conditions += ` AND lpt.fecha_elaboracion <= ?`;
    }
    if (filtros.busqueda) {
      values.push(`%${filtros.busqueda}%`);
      values.push(`%${filtros.busqueda}%`);
      conditions += ` AND (lpt.codigo_lote_pt LIKE ? OR pt.nombre LIKE ?)`;
    }
    if (filtros.producto_id) {
      values.push(Number(filtros.producto_id));
      conditions += ` AND pt.id = ?`;
    }
    if (filtros.linea_produccion) {
      values.push(filtros.linea_produccion);
      conditions += ` AND op.linea_produccion = ?`;
    }
    if (filtros.estados) {
      const estadosArr = Array.isArray(filtros.estados)
        ? filtros.estados
        : filtros.estados.split(',').map((s) => s.trim()).filter(Boolean);
      if (estadosArr.length > 0) {
        conditions += ` AND lpt.estado IN (?)`;
        values.push(estadosArr);
      }
    }
    if (filtros.lote_mp) {
      values.push(`%${filtros.lote_mp}%`);
      conditions += `
        AND lpt.orden_produccion_id IN (
          SELECT cmp.orden_produccion_id
          FROM consumos_materia_prima cmp
          JOIN lotes_materia_prima lmp ON cmp.lote_mp_id = lmp.id
          WHERE lmp.codigo_lote_mp LIKE ?
        )
      `;
    }

    const text = `
      SELECT 
        lpt.id,
        lpt.codigo_lote_pt,
        lpt.cantidad_elaborada,
        lpt.fecha_elaboracion,
        lpt.fecha_vencimiento,
        lpt.estado,
        lpt.ubicacion_deposito,
        lpt.created_at,
        op.numero_op,
        op.linea_produccion,
        pt.nombre      AS producto_nombre,
        pt.codigo_sku,
        pt.unidad_medida,
        pt.temperatura_conservacion
      FROM lotes_producto_terminado lpt
      JOIN ordenes_produccion op ON lpt.orden_produccion_id = op.id
      JOIN productos_terminados pt ON op.producto_terminado_id = pt.id
      WHERE 1=1
      ${conditions}
      ORDER BY lpt.created_at DESC;
    `;

    const { rows } = await db.query(text, values);
    return rows;
  }

  /**
   * Panel operativo: indicadores de mercado, alertas y actividad reciente.
   * Respeta el filtro de fechas de elaboración (desde / hasta).
   * @param {Object} filtros - { desde, hasta, diasAlerta }
   */
  static async getPanelOperativo(filtros = {}) {
    const diasAlerta = Number(filtros.diasAlerta) || 15;

    // 1. Volúmenes producidos y despachados, clientes abastecidos y trazabilidad documental
    const v1 = [];
    const f1 = this._buildFechaConditions(filtros, v1);
    const { rows: volRows } = await db.query(
      `
      SELECT
        COALESCE(SUM(lpt.cantidad_elaborada), 0) AS unidades_producidas,
        (SELECT COALESCE(SUM(d.cantidad_despachada), 0)
           FROM despachos d JOIN lotes_producto_terminado l2 ON d.lote_pt_id = l2.id
          WHERE 1=1 ${f1.replace(/lpt\./g, 'l2.')}) AS unidades_despachadas,
        (SELECT COUNT(DISTINCT d.cliente_id)
           FROM despachos d JOIN lotes_producto_terminado l3 ON d.lote_pt_id = l3.id
          WHERE 1=1 ${f1.replace(/lpt\./g, 'l3.')}) AS clientes_abastecidos,
        SUM(CASE WHEN EXISTS (SELECT 1 FROM consumos_materia_prima c WHERE c.orden_produccion_id = lpt.orden_produccion_id)
                  AND EXISTS (SELECT 1 FROM controles_calidad q WHERE q.lote_pt_id = lpt.id)
                 THEN 1 ELSE 0 END) AS lotes_trazables,
        COUNT(*) AS total_lotes
      FROM lotes_producto_terminado lpt
      WHERE 1=1 ${f1}
      `,
      [...v1, ...v1, ...v1]
    );
    const vol = volRows[0] || {};
    const totalLotes = Number(vol.total_lotes) || 0;
    const lotesTrazables = Number(vol.lotes_trazables) || 0;

    // 2. Producción por producto
    const v2 = [];
    const f2 = this._buildFechaConditions(filtros, v2);
    const { rows: prodRows } = await db.query(
      `
      SELECT pt.nombre AS producto, pt.unidad_medida,
             COUNT(lpt.id) AS cantidad_lotes,
             COALESCE(SUM(lpt.cantidad_elaborada), 0) AS total_unidades
      FROM lotes_producto_terminado lpt
      JOIN ordenes_produccion op ON lpt.orden_produccion_id = op.id
      JOIN productos_terminados pt ON op.producto_terminado_id = pt.id
      WHERE 1=1 ${f2}
      GROUP BY pt.id, pt.nombre, pt.unidad_medida
      ORDER BY total_unidades DESC;
      `,
      v2
    );

    // 3. Despachos por cliente (destinatarios del mercado)
    const v3 = [];
    const f3 = this._buildFechaConditions(filtros, v3);
    const { rows: cliRows } = await db.query(
      `
      SELECT c.razon_social AS cliente, c.direccion,
             COUNT(DISTINCT d.lote_pt_id) AS lotes_recibidos,
             COALESCE(SUM(d.cantidad_despachada), 0) AS unidades_recibidas,
             MAX(d.fecha_despacho) AS ultimo_despacho
      FROM despachos d
      JOIN clientes c ON d.cliente_id = c.id
      JOIN lotes_producto_terminado lpt ON d.lote_pt_id = lpt.id
      WHERE 1=1 ${f3}
      GROUP BY c.id, c.razon_social, c.direccion
      ORDER BY unidades_recibidas DESC
      LIMIT 8;
      `,
      v3
    );

    // 4. Alertas: próximos a vencer (no despachados) y lotes retenidos
    const { rows: alertRows } = await db.query(
      `
      SELECT lpt.codigo_lote_pt, pt.nombre AS producto, lpt.estado,
             lpt.fecha_vencimiento, lpt.ubicacion_deposito,
             DATEDIFF(lpt.fecha_vencimiento, CURDATE()) AS dias_restantes,
             CASE
               WHEN lpt.estado IN ('BLOQUEADO', 'RECHAZADO') THEN 'BLOQUEO'
               WHEN lpt.estado = 'CUARENTENA' THEN 'CUARENTENA'
               WHEN DATEDIFF(lpt.fecha_vencimiento, CURDATE()) < 0 THEN 'VENCIDO'
               ELSE 'POR_VENCER'
             END AS tipo_alerta
      FROM lotes_producto_terminado lpt
      JOIN ordenes_produccion op ON lpt.orden_produccion_id = op.id
      JOIN productos_terminados pt ON op.producto_terminado_id = pt.id
      WHERE lpt.estado IN ('CUARENTENA', 'BLOQUEADO', 'RECHAZADO')
         OR (lpt.estado <> 'DESPACHADO' AND DATEDIFF(lpt.fecha_vencimiento, CURDATE()) <= ?)
      ORDER BY FIELD(tipo_alerta, 'VENCIDO', 'BLOQUEO', 'CUARENTENA', 'POR_VENCER'), lpt.fecha_vencimiento ASC
      LIMIT 12;
      `,
      [diasAlerta]
    );

    // 5. Últimos movimientos registrados en los puntos de captura
    const { rows: evRows } = await db.query(
      `
      SELECT et.id, et.etapa_nombre, et.timestamp_evento, et.linea_equipo,
             lpt.codigo_lote_pt, pc.codigo_punto, pc.nombre AS punto_captura,
             CONCAT(u.nombre, ' ', u.apellido) AS operario
      FROM eventos_trazabilidad et
      JOIN lotes_producto_terminado lpt ON et.lote_pt_id = lpt.id
      JOIN puntos_captura pc ON et.punto_captura_id = pc.id
      JOIN usuarios u ON et.usuario_id = u.id
      ORDER BY et.timestamp_evento DESC, et.id DESC
      LIMIT 8;
      `
    );

    return {
      resumen: {
        unidades_producidas: Number(vol.unidades_producidas) || 0,
        unidades_despachadas: Number(vol.unidades_despachadas) || 0,
        clientes_abastecidos: Number(vol.clientes_abastecidos) || 0,
        lotes_trazables: lotesTrazables,
        cobertura_trazabilidad: totalLotes > 0 ? Number(((lotesTrazables / totalLotes) * 100).toFixed(1)) : 0,
        dias_alerta: diasAlerta,
      },
      produccion_por_producto: prodRows.map((r) => ({
        producto: r.producto,
        unidad_medida: r.unidad_medida,
        cantidad_lotes: Number(r.cantidad_lotes) || 0,
        total_unidades: Number(r.total_unidades) || 0,
      })),
      despachos_por_cliente: cliRows.map((r) => ({
        cliente: r.cliente,
        direccion: r.direccion,
        lotes_recibidos: Number(r.lotes_recibidos) || 0,
        unidades_recibidas: Number(r.unidades_recibidas) || 0,
        ultimo_despacho: r.ultimo_despacho,
      })),
      alertas: alertRows.map((r) => ({ ...r, dias_restantes: Number(r.dias_restantes) })),
      ultimos_eventos: evRows,
    };
  }
}

module.exports = DashboardModel;
