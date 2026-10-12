const snapshot = require('./db.snapshot.json');

// Clonar estado inicial desde el snapshot exportado de MySQL trackfinal_db
const store = JSON.parse(JSON.stringify(snapshot));

const nextId = (table) => {
  const arr = store[table] || [];
  return arr.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0) + 1;
};

const todayStr = () => new Date().toISOString().slice(0, 10);
const nowStr = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

const diffDaysFromToday = (dateStr) => {
  if (!dateStr) return 999;
  const d = new Date(String(dateStr).slice(0, 10) + 'T00:00:00Z');
  const t = new Date(todayStr() + 'T00:00:00Z');
  return Math.round((d - t) / (1000 * 60 * 60 * 24));
};

/**
 * Motor en memoria compatible con las consultas SQL de TrackFinal.
 * Se activa automáticamente en Vercel / entornos serverless cuando no hay un servidor MySQL externo configurado.
 */
async function executeMemoryQuery(rawSql, params = []) {
  const sql = rawSql.replace(/\s+/g, ' ').trim();
  const upper = sql.toUpperCase();

  // 0. Healthcheck / Server info
  if (upper.includes('SELECT NOW()')) {
    return {
      rows: [{ now: nowStr(), db_name: 'trackfinal_cloud_memory', version: '8.0-Vercel-Memory' }],
      insertId: null,
      affectedRows: 0,
    };
  }

  // 1. USUARIOS
  if (upper.includes('FROM USUARIOS U') && upper.includes('LOWER(U.EMAIL)')) {
    const email = String(params[0] || '').toLowerCase().trim();
    const u = store.usuarios.find((x) => String(x.email).toLowerCase() === email);
    if (!u) return { rows: [], insertId: null, affectedRows: 0 };
    const r = store.roles.find((x) => x.id === u.rol_id) || {};
    return {
      rows: [{ ...u, rol: r.nombre }],
      insertId: null,
      affectedRows: 0,
    };
  }

  if (upper.includes('FROM USUARIOS U') && upper.includes('WHERE U.ID =')) {
    const id = Number(params[0]);
    const u = store.usuarios.find((x) => Number(x.id) === id);
    if (!u) return { rows: [], insertId: null, affectedRows: 0 };
    const r = store.roles.find((x) => x.id === u.rol_id) || {};
    return {
      rows: [{ ...u, rol: r.nombre }],
      insertId: null,
      affectedRows: 0,
    };
  }

  // 2. PRODUCTOS TERMINADOS
  if (upper.includes('FROM PRODUCTOS_TERMINADOS') && !upper.includes('JOIN')) {
    if (upper.includes('WHERE ID =')) {
      const id = Number(params[0]);
      const p = store.productos_terminados.find((x) => Number(x.id) === id);
      return { rows: p ? [p] : [], insertId: null, affectedRows: 0 };
    }
    return { rows: [...store.productos_terminados], insertId: null, affectedRows: 0 };
  }

  // 3. MATERIAS PRIMAS Y LOTES MP
  if (upper.includes('FROM MATERIAS_PRIMAS') && !upper.includes('JOIN')) {
    return { rows: [...store.materias_primas], insertId: null, affectedRows: 0 };
  }

  if (upper.includes('FROM LOTES_MATERIA_PRIMA LMP') && upper.includes("LMP.ESTADO = 'DISPONIBLE'")) {
    const rows = store.lotes_materia_prima
      .filter((lmp) => lmp.estado === 'DISPONIBLE' && Number(lmp.cantidad_actual) > 0)
      .map((lmp) => {
        const mp = store.materias_primas.find((m) => m.id === lmp.materia_prima_id) || {};
        return {
          ...lmp,
          materia_prima_nombre: mp.nombre,
          codigo_sku: mp.codigo_sku,
          unidad_medida: mp.unidad_medida,
        };
      });
    return { rows, insertId: null, affectedRows: 0 };
  }

  if (upper.includes('FROM LOTES_MATERIA_PRIMA LMP') && upper.includes('WHERE LMP.ID =')) {
    const id = Number(params[0]);
    const lmp = store.lotes_materia_prima.find((x) => Number(x.id) === id);
    if (!lmp) return { rows: [], insertId: null, affectedRows: 0 };
    const mp = store.materias_primas.find((m) => m.id === lmp.materia_prima_id) || {};
    return {
      rows: [{ ...lmp, materia_prima_nombre: mp.nombre, unidad_medida: mp.unidad_medida }],
      insertId: null,
      affectedRows: 0,
    };
  }

  if (upper.startsWith('SELECT * FROM LOTES_MATERIA_PRIMA WHERE ID =')) {
    const id = Number(params[0]);
    const lmp = store.lotes_materia_prima.find((x) => Number(x.id) === id);
    return { rows: lmp ? [lmp] : [], insertId: null, affectedRows: 0 };
  }

  if (upper.startsWith('UPDATE LOTES_MATERIA_PRIMA SET CANTIDAD_ACTUAL')) {
    const [nuevaCant, nuevoEstado, id] = params;
    const lmp = store.lotes_materia_prima.find((x) => Number(x.id) === Number(id));
    if (lmp) {
      lmp.cantidad_actual = Number(nuevaCant);
      lmp.estado = nuevoEstado;
    }
    return { rows: [], insertId: null, affectedRows: lmp ? 1 : 0 };
  }

  if (upper.startsWith("UPDATE LOTES_MATERIA_PRIMA SET ESTADO = 'CUARENTENA'")) {
    const codigo = String(params[0] || '').trim().toUpperCase();
    const lmp = store.lotes_materia_prima.find(
      (x) => String(x.codigo_lote_mp).trim().toUpperCase() === codigo
    );
    if (lmp) lmp.estado = 'CUARENTENA';
    return { rows: [], insertId: null, affectedRows: lmp ? 1 : 0 };
  }

  // 4. ÓRDENES DE PRODUCCIÓN
  if (upper.includes('FROM ORDENES_PRODUCCION OP') && upper.includes('JOIN PRODUCTOS_TERMINADOS PT') && !upper.includes('LOTES_PRODUCTO_TERMINADO')) {
    const enrichOp = (op) => {
      const pt = store.productos_terminados.find((p) => p.id === op.producto_terminado_id) || {};
      return {
        ...op,
        producto_nombre: pt.nombre,
        codigo_sku: pt.codigo_sku,
        dias_vida_util: pt.dias_vida_util,
        unidad_medida: pt.unidad_medida,
        temperatura_conservacion: pt.temperatura_conservacion,
      };
    };
    if (upper.includes('WHERE OP.ID =')) {
      const id = Number(params[0]);
      const op = store.ordenes_produccion.find((x) => Number(x.id) === id);
      return { rows: op ? [enrichOp(op)] : [], insertId: null, affectedRows: 0 };
    }
    return {
      rows: store.ordenes_produccion.map(enrichOp).sort((a, b) => b.id - a.id),
      insertId: null,
      affectedRows: 0,
    };
  }

  if (upper.startsWith('UPDATE ORDENES_PRODUCCION')) {
    const estado = params[0];
    const id = Number(params[params.length - 1]);
    const op = store.ordenes_produccion.find((x) => Number(x.id) === id);
    if (op) {
      op.estado = estado;
      if (estado === 'FINALIZADA') op.fecha_fin = nowStr();
    }
    return { rows: [], insertId: null, affectedRows: op ? 1 : 0 };
  }

  // 5. CONSUMOS MATERIA PRIMA
  if (upper.startsWith('INSERT INTO CONSUMOS_MATERIA_PRIMA')) {
    const [orden_produccion_id, lote_mp_id, cantidad_consumida, operario_id] = params;
    const id = nextId('consumos_materia_prima');
    const row = {
      id,
      orden_produccion_id: Number(orden_produccion_id),
      lote_mp_id: Number(lote_mp_id),
      cantidad_consumida: Number(cantidad_consumida),
      operario_id: Number(operario_id),
      timestamp_consumo: nowStr(),
    };
    store.consumos_materia_prima.push(row);
    return { rows: [], insertId: id, affectedRows: 1 };
  }

  if (upper.startsWith('SELECT * FROM CONSUMOS_MATERIA_PRIMA WHERE ID =')) {
    const id = Number(params[0]);
    const row = store.consumos_materia_prima.find((x) => Number(x.id) === id);
    return { rows: row ? [row] : [], insertId: null, affectedRows: 0 };
  }

  if (upper.includes('FROM CONSUMOS_MATERIA_PRIMA CMP') && upper.includes('WHERE CMP.ORDEN_PRODUCCION_ID =')) {
    const opId = Number(params[0]);
    const selectsLmpId = upper.includes('SELECT LMP.ID');
    const rows = store.consumos_materia_prima
      .filter((c) => Number(c.orden_produccion_id) === opId)
      .map((cmp) => {
        const lmp = store.lotes_materia_prima.find((l) => l.id === cmp.lote_mp_id) || {};
        const mp = store.materias_primas.find((m) => m.id === lmp.materia_prima_id) || {};
        const u = store.usuarios.find((usr) => usr.id === cmp.operario_id) || {};
        return {
          id: selectsLmpId ? lmp.id : cmp.id,
          lote_mp_id: lmp.id,
          orden_produccion_id: cmp.orden_produccion_id,
          materia_prima: mp.nombre,
          materia_prima_nombre: mp.nombre,
          codigo_sku: mp.codigo_sku,
          codigo_lote_mp: lmp.codigo_lote_mp,
          proveedor: lmp.proveedor,
          fecha_recepcion: lmp.fecha_recepcion,
          fecha_vencimiento: lmp.fecha_vencimiento,
          cantidad_inicial: lmp.cantidad_inicial,
          cantidad_actual: lmp.cantidad_actual,
          estado: lmp.estado,
          cantidad_consumida: cmp.cantidad_consumida,
          unidad_medida: mp.unidad_medida,
          timestamp_consumo: cmp.timestamp_consumo,
          operario_registro: `${u.nombre || ''} ${u.apellido || ''}`.trim(),
          operario_nombre: `${u.nombre || ''} ${u.apellido || ''}`.trim(),
        };
      });
    return { rows, insertId: null, affectedRows: 0 };
  }

  // 6. CLIENTES Y DESPACHOS
  if (upper.includes('FROM CLIENTES ORDER BY RAND()')) {
    const rand = store.clientes[Math.floor(Math.random() * store.clientes.length)];
    return { rows: rand ? [rand] : [], insertId: null, affectedRows: 0 };
  }

  if (upper.includes('FROM CLIENTES') && !upper.includes('JOIN')) {
    return { rows: [...store.clientes], insertId: null, affectedRows: 0 };
  }

  if (upper.startsWith('INSERT INTO DESPACHOS')) {
    const [lote_pt_id, cliente_id, numero_remito, cantidad_despachada, usuario_id] = params;
    const id = nextId('despachos');
    const row = {
      id,
      lote_pt_id: Number(lote_pt_id),
      cliente_id: Number(cliente_id),
      numero_remito,
      fecha_despacho: nowStr(),
      cantidad_despachada: Number(cantidad_despachada),
      usuario_id: Number(usuario_id),
    };
    store.despachos.push(row);
    return { rows: [], insertId: id, affectedRows: 1 };
  }

  if (upper.startsWith('SELECT * FROM DESPACHOS WHERE ID =')) {
    const id = Number(params[0]);
    const row = store.despachos.find((x) => Number(x.id) === id);
    return { rows: row ? [row] : [], insertId: null, affectedRows: 0 };
  }

  if (upper.includes('FROM DESPACHOS D') && upper.includes('WHERE D.LOTE_PT_ID =')) {
    const loteId = Number(params[0]);
    const rows = store.despachos
      .filter((d) => Number(d.lote_pt_id) === loteId)
      .map((d) => {
        const c = store.clientes.find((cl) => cl.id === d.cliente_id) || {};
        const u = store.usuarios.find((usr) => usr.id === d.usuario_id) || {};
        return {
          id: d.id,
          numero_remito: d.numero_remito,
          fecha_despacho: d.fecha_despacho,
          cantidad_despachada: d.cantidad_despachada,
          cliente_nombre: c.razon_social,
          cliente_cuit: c.cuit,
          cliente_direccion: c.direccion,
          cliente_telefono: c.telefono,
          despachador_nombre: `${u.nombre || ''} ${u.apellido || ''}`.trim(),
        };
      });
    return { rows, insertId: null, affectedRows: 0 };
  }

  if (upper.includes('FROM DESPACHOS D') && upper.includes('JOIN LOTES_PRODUCTO_TERMINADO LPT') && !upper.includes('GROUP BY')) {
    const rows = store.despachos.map((d) => {
      const lpt = store.lotes_producto_terminado.find((l) => l.id === d.lote_pt_id) || {};
      const op = store.ordenes_produccion.find((o) => o.id === lpt.orden_produccion_id) || {};
      const pt = store.productos_terminados.find((p) => p.id === op.producto_terminado_id) || {};
      const c = store.clientes.find((cl) => cl.id === d.cliente_id) || {};
      const u = store.usuarios.find((usr) => usr.id === d.usuario_id) || {};
      return {
        id: d.id,
        numero_remito: d.numero_remito,
        fecha_despacho: d.fecha_despacho,
        cantidad_despachada: d.cantidad_despachada,
        codigo_lote_pt: lpt.codigo_lote_pt,
        producto_nombre: pt.nombre,
        unidad_medida: pt.unidad_medida,
        cliente_nombre: c.razon_social,
        cliente_cuit: c.cuit,
        despachador_nombre: `${u.nombre || ''} ${u.apellido || ''}`.trim(),
      };
    });
    return { rows, insertId: null, affectedRows: 0 };
  }

  // 7. EVENTOS DE TRAZABILIDAD Y CONTROLES DE CALIDAD
  if (upper.startsWith('INSERT INTO EVENTOS_TRAZABILIDAD')) {
    const id = nextId('eventos_trazabilidad');
    let row;
    if (params.length === 4) {
      // Recall insert: (lote_pt_id, 4, usuario_id, 'Bloqueo Preventivo Recall', motivo)
      row = {
        id,
        lote_pt_id: Number(params[0]),
        punto_captura_id: 4,
        usuario_id: Number(params[1]),
        etapa_nombre: 'Bloqueo Preventivo Recall',
        linea_equipo: 'Laboratorio / Calidad',
        timestamp_evento: nowStr(),
        observaciones: params[2],
      };
    } else {
      const [lote_pt_id, punto_captura_id, usuario_id, etapa_nombre, linea_equipo, observaciones] = params;
      row = {
        id,
        lote_pt_id: Number(lote_pt_id),
        punto_captura_id: Number(punto_captura_id),
        usuario_id: Number(usuario_id),
        etapa_nombre,
        linea_equipo: linea_equipo || null,
        timestamp_evento: nowStr(),
        observaciones: observaciones || null,
      };
    }
    store.eventos_trazabilidad.push(row);
    return { rows: [], insertId: id, affectedRows: 1 };
  }

  if (upper.startsWith('SELECT * FROM EVENTOS_TRAZABILIDAD WHERE ID =')) {
    const id = Number(params[0]);
    const row = store.eventos_trazabilidad.find((x) => Number(x.id) === id);
    return { rows: row ? [row] : [], insertId: null, affectedRows: 0 };
  }

  if (upper.includes('FROM EVENTOS_TRAZABILIDAD ET') && upper.includes('WHERE ET.LOTE_PT_ID =')) {
    const loteId = Number(params[0]);
    const rows = store.eventos_trazabilidad
      .filter((e) => Number(e.lote_pt_id) === loteId)
      .map((et) => {
        const pc = store.puntos_captura.find((p) => p.id === et.punto_captura_id) || {};
        const u = store.usuarios.find((usr) => usr.id === et.usuario_id) || {};
        return {
          ...et,
          codigo_punto: pc.codigo_punto,
          punto_captura_nombre: pc.nombre,
          operario_nombre: `${u.nombre || ''} ${u.apellido || ''}`.trim(),
          operario_legajo: u.legajo,
        };
      });
    return { rows, insertId: null, affectedRows: 0 };
  }

  if (upper.startsWith('INSERT INTO CONTROLES_CALIDAD')) {
    const [lote_pt_id, usuario_id, p1n, p1v, p2n, p2v, obs] = params;
    const id = nextId('controles_calidad');
    store.controles_calidad.push({
      id,
      lote_pt_id: Number(lote_pt_id),
      usuario_id: Number(usuario_id),
      fecha_control: nowStr(),
      parametro_1_nombre: p1n,
      parametro_1_valor: p1v,
      parametro_2_nombre: p2n,
      parametro_2_valor: p2v,
      resultado: 'CONFORME',
      observaciones: obs,
    });
    return { rows: [], insertId: id, affectedRows: 1 };
  }

  if (upper.includes('FROM CONTROLES_CALIDAD CC') && upper.includes('WHERE CC.LOTE_PT_ID =')) {
    const loteId = Number(params[0]);
    const rows = store.controles_calidad
      .filter((cc) => Number(cc.lote_pt_id) === loteId)
      .map((cc) => {
        const u = store.usuarios.find((usr) => usr.id === cc.usuario_id) || {};
        return {
          ...cc,
          auditor_nombre: `${u.nombre || ''} ${u.apellido || ''}`.trim(),
        };
      });
    return { rows, insertId: null, affectedRows: 0 };
  }

  // 8. LOTES DE PRODUCTO TERMINADO (CRUD + BÚSQUEDA + TRAZABILIDAD)
  if (upper.startsWith('INSERT INTO LOTES_PRODUCTO_TERMINADO')) {
    const [
      orden_produccion_id,
      codigo_lote_pt,
      cantidad_elaborada,
      fecha_elaboracion,
      fecha_vencimiento,
      estado,
      codigo_qr_payload,
      ubicacion_deposito,
    ] = params;
    const id = nextId('lotes_producto_terminado');
    const row = {
      id,
      orden_produccion_id: Number(orden_produccion_id),
      codigo_lote_pt,
      cantidad_elaborada: Number(cantidad_elaborada),
      fecha_elaboracion,
      fecha_vencimiento,
      estado: estado || 'EN_PROCESO',
      codigo_qr_payload:
        typeof codigo_qr_payload === 'string'
          ? JSON.parse(codigo_qr_payload)
          : codigo_qr_payload,
      ubicacion_deposito: ubicacion_deposito || 'Cámara 1 - En Tránsito',
      created_at: nowStr(),
    };
    store.lotes_producto_terminado.push(row);
    return { rows: [], insertId: id, affectedRows: 1 };
  }

  if (upper.startsWith('SELECT * FROM LOTES_PRODUCTO_TERMINADO WHERE ID =')) {
    const id = Number(params[0]);
    const row = store.lotes_producto_terminado.find((x) => Number(x.id) === id);
    return { rows: row ? [row] : [], insertId: null, affectedRows: 0 };
  }

  if (upper.startsWith('UPDATE LOTES_PRODUCTO_TERMINADO SET ESTADO =')) {
    if (upper.includes("SET ESTADO = 'CUARENTENA' WHERE ID =")) {
      const id = Number(params[0]);
      const l = store.lotes_producto_terminado.find((x) => Number(x.id) === id);
      if (l) l.estado = 'CUARENTENA';
      return { rows: [], insertId: null, affectedRows: l ? 1 : 0 };
    }
    const [nuevoEstado, idOrCode] = params;
    const l = store.lotes_producto_terminado.find(
      (x) => Number(x.id) === Number(idOrCode) || x.codigo_lote_pt === idOrCode
    );
    if (l) l.estado = nuevoEstado;
    return { rows: [], insertId: null, affectedRows: l ? 1 : 0 };
  }

  if (upper.startsWith('UPDATE LOTES_PRODUCTO_TERMINADO SET UBICACION_DEPOSITO =')) {
    const [ubicacion, id] = params;
    const l = store.lotes_producto_terminado.find((x) => Number(x.id) === Number(id));
    if (l) l.ubicacion_deposito = ubicacion;
    return { rows: [], insertId: null, affectedRows: l ? 1 : 0 };
  }

  // Helper para enriquecer lotes PT
  const enrichLotePT = (lpt) => {
    const op = store.ordenes_produccion.find((o) => o.id === lpt.orden_produccion_id) || {};
    const pt = store.productos_terminados.find((p) => p.id === op.producto_terminado_id) || {};
    return {
      ...lpt,
      lote_pt_id: lpt.id,
      estado_actual: lpt.estado,
      numero_op: op.numero_op,
      linea_produccion: op.linea_produccion,
      estado_op: op.estado,
      producto_id: pt.id,
      producto_nombre: pt.nombre,
      codigo_sku: pt.codigo_sku,
      unidad_medida: pt.unidad_medida,
      dias_vida_util: pt.dias_vida_util,
      temperatura_conservacion: pt.temperatura_conservacion,
    };
  };

  if (
    upper.includes('FROM LOTES_PRODUCTO_TERMINADO LPT') &&
    (upper.includes('WHERE LPT.CODIGO_LOTE_PT =') ||
      upper.includes('WHERE UPPER(TRIM(LPT.CODIGO_LOTE_PT)) = UPPER(TRIM(?))'))
  ) {
    const code = String(params[0] || '').trim().toUpperCase();
    const lpt = store.lotes_producto_terminado.find(
      (x) => String(x.codigo_lote_pt).trim().toUpperCase() === code
    );
    return { rows: lpt ? [enrichLotePT(lpt)] : [], insertId: null, affectedRows: 0 };
  }

  if (upper.includes('FROM LOTES_PRODUCTO_TERMINADO LPT') && upper.includes('WHERE LPT.ID =')) {
    const id = Number(params[0]);
    const lpt = store.lotes_producto_terminado.find((x) => Number(x.id) === id);
    return { rows: lpt ? [enrichLotePT(lpt)] : [], insertId: null, affectedRows: 0 };
  }

  // 9. TRAZABILIDAD HACIA ADELANTE (FORWARD / RECALL)
  if (
    upper.includes('FROM LOTES_MATERIA_PRIMA LMP') &&
    upper.includes('WHERE UPPER(TRIM(LMP.CODIGO_LOTE_MP)) = UPPER(TRIM(?))')
  ) {
    const code = String(params[0] || '').trim().toUpperCase();
    const lmp = store.lotes_materia_prima.find(
      (x) => String(x.codigo_lote_mp).trim().toUpperCase() === code
    );
    if (!lmp) return { rows: [], insertId: null, affectedRows: 0 };
    const mp = store.materias_primas.find((m) => m.id === lmp.materia_prima_id) || {};
    return {
      rows: [{ ...lmp, materia_prima_nombre: mp.nombre, codigo_sku: mp.codigo_sku }],
      insertId: null,
      affectedRows: 0,
    };
  }

  if (upper.includes('FROM CONSUMOS_MATERIA_PRIMA CMP') && upper.includes('WHERE CMP.LOTE_MP_ID =')) {
    const loteMpId = Number(params[0]);
    const specificLotePtId = params[1] ? Number(params[1]) : null;
    const opIds = store.consumos_materia_prima
      .filter((c) => Number(c.lote_mp_id) === loteMpId)
      .map((c) => c.orden_produccion_id);

    const lotesAfectados = store.lotes_producto_terminado.filter(
      (l) =>
        opIds.includes(l.orden_produccion_id) &&
        (!specificLotePtId || Number(l.id) === specificLotePtId)
    );

    const rows = [];
    for (const lpt of lotesAfectados) {
      const enriched = enrichLotePT(lpt);
      const despachosLote = store.despachos.filter((d) => Number(d.lote_pt_id) === Number(lpt.id));
      if (despachosLote.length === 0) {
        rows.push({
          ...enriched,
          estado_lote_pt: lpt.estado,
          despacho_id: null,
        });
      } else {
        for (const d of despachosLote) {
          const c = store.clientes.find((cl) => cl.id === d.cliente_id) || {};
          rows.push({
            ...enriched,
            estado_lote_pt: lpt.estado,
            despacho_id: d.id,
            numero_remito: d.numero_remito,
            fecha_despacho: d.fecha_despacho,
            cantidad_despachada: d.cantidad_despachada,
            cliente_cuit: c.cuit,
            cliente_nombre: c.razon_social,
            cliente_direccion: c.direccion,
            cliente_telefono: c.telefono,
          });
        }
      }
    }
    return { rows, insertId: null, affectedRows: 0 };
  }

  // 10. DASHBOARD QUERIES
  if (upper.includes('COUNT(*) AS TOTALLOTES') && upper.includes('LOTESAPROBADOS')) {
    const lotes = store.lotes_producto_terminado;
    const countBy = (st) => lotes.filter((l) => l.estado === st).length;
    return {
      rows: [
        {
          totalLotes: lotes.length,
          lotesAprobados: countBy('APROBADO'),
          lotesCuarentena: countBy('CUARENTENA'),
          lotesEnProceso: countBy('EN_PROCESO'),
          lotesRechazados: countBy('RECHAZADO'),
          lotesDespachados: countBy('DESPACHADO'),
          lotesBloqueados: countBy('BLOQUEADO'),
        },
      ],
      insertId: null,
      affectedRows: 0,
    };
  }

  if (upper.includes('GROUP BY LPT.ESTADO')) {
    const map = {};
    for (const l of store.lotes_producto_terminado) {
      map[l.estado] = (map[l.estado] || 0) + 1;
    }
    const rows = Object.entries(map)
      .map(([estado, cantidad]) => ({ estado, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
    return { rows, insertId: null, affectedRows: 0 };
  }

  if (upper.includes('GROUP BY OP.LINEA_PRODUCCION')) {
    const map = {};
    for (const l of store.lotes_producto_terminado) {
      const op = store.ordenes_produccion.find((o) => o.id === l.orden_produccion_id) || {};
      const linea = op.linea_produccion || 'Sin asignar';
      if (!map[linea]) map[linea] = { linea_produccion: linea, total_unidades: 0, cantidad_lotes: 0 };
      map[linea].total_unidades += Number(l.cantidad_elaborada) || 0;
      map[linea].cantidad_lotes += 1;
    }
    const rows = Object.values(map).sort((a, b) => b.total_unidades - a.total_unidades);
    return { rows, insertId: null, affectedRows: 0 };
  }

  if (upper.includes('UNIDADES_PRODUCIDAS') && upper.includes('UNIDADES_DESPACHADAS')) {
    const unidades_producidas = store.lotes_producto_terminado.reduce(
      (s, l) => s + (Number(l.cantidad_elaborada) || 0),
      0
    );
    const unidades_despachadas = store.despachos.reduce(
      (s, d) => s + (Number(d.cantidad_despachada) || 0),
      0
    );
    const clientes_abastecidos = new Set(store.despachos.map((d) => d.cliente_id)).size;
    const total_lotes = store.lotes_producto_terminado.length;
    return {
      rows: [
        {
          unidades_producidas,
          unidades_despachadas,
          clientes_abastecidos,
          lotes_trazables: total_lotes,
          total_lotes,
        },
      ],
      insertId: null,
      affectedRows: 0,
    };
  }

  if (upper.includes('GROUP BY PT.ID, PT.NOMBRE, PT.UNIDAD_MEDIDA')) {
    const map = {};
    for (const l of store.lotes_producto_terminado) {
      const enriched = enrichLotePT(l);
      const key = enriched.producto_id;
      if (!map[key]) {
        map[key] = {
          producto: enriched.producto_nombre,
          unidad_medida: enriched.unidad_medida,
          cantidad_lotes: 0,
          total_unidades: 0,
        };
      }
      map[key].cantidad_lotes += 1;
      map[key].total_unidades += Number(l.cantidad_elaborada) || 0;
    }
    return {
      rows: Object.values(map).sort((a, b) => b.total_unidades - a.total_unidades),
      insertId: null,
      affectedRows: 0,
    };
  }

  if (upper.includes('GROUP BY C.ID, C.RAZON_SOCIAL, C.DIRECCION')) {
    const map = {};
    for (const d of store.despachos) {
      const c = store.clientes.find((cl) => cl.id === d.cliente_id) || {};
      if (!map[c.id]) {
        map[c.id] = {
          cliente: c.razon_social,
          direccion: c.direccion,
          lotesSet: new Set(),
          unidades_recibidas: 0,
          ultimo_despacho: d.fecha_despacho,
        };
      }
      map[c.id].lotesSet.add(d.lote_pt_id);
      map[c.id].unidades_recibidas += Number(d.cantidad_despachada) || 0;
    }
    const rows = Object.values(map)
      .map((x) => ({
        cliente: x.cliente,
        direccion: x.direccion,
        lotes_recibidos: x.lotesSet.size,
        unidades_recibidas: x.unidades_recibidas,
        ultimo_despacho: x.ultimo_despacho,
      }))
      .sort((a, b) => b.unidades_recibidas - a.unidades_recibidas);
    return { rows, insertId: null, affectedRows: 0 };
  }

  if (upper.includes('TIPO_ALERTA')) {
    const diasAlerta = Number(params[0]) || 15;
    const rows = store.lotes_producto_terminado
      .map((l) => {
        const enriched = enrichLotePT(l);
        const dias_restantes = diffDaysFromToday(l.fecha_vencimiento);
        let tipo_alerta = 'POR_VENCER';
        if (l.estado === 'BLOQUEADO' || l.estado === 'RECHAZADO') tipo_alerta = 'BLOQUEO';
        else if (l.estado === 'CUARENTENA') tipo_alerta = 'CUARENTENA';
        else if (dias_restantes < 0) tipo_alerta = 'VENCIDO';
        return {
          codigo_lote_pt: l.codigo_lote_pt,
          producto: enriched.producto_nombre,
          estado: l.estado,
          fecha_vencimiento: l.fecha_vencimiento,
          ubicacion_deposito: l.ubicacion_deposito,
          dias_restantes,
          tipo_alerta,
        };
      })
      .filter(
        (r) =>
          ['CUARENTENA', 'BLOQUEADO', 'RECHAZADO'].includes(r.estado) ||
          (r.estado !== 'DESPACHADO' && r.dias_restantes <= diasAlerta)
      )
      .slice(0, 12);
    return { rows, insertId: null, affectedRows: 0 };
  }

  if (upper.includes('FROM EVENTOS_TRAZABILIDAD ET') && upper.includes('LIMIT 8')) {
    const rows = [...store.eventos_trazabilidad]
      .sort((a, b) => Number(b.id) - Number(a.id))
      .slice(0, 8)
      .map((et) => {
        const lpt = store.lotes_producto_terminado.find((l) => l.id === et.lote_pt_id) || {};
        const pc = store.puntos_captura.find((p) => p.id === et.punto_captura_id) || {};
        const u = store.usuarios.find((usr) => usr.id === et.usuario_id) || {};
        return {
          id: et.id,
          etapa_nombre: et.etapa_nombre,
          timestamp_evento: et.timestamp_evento,
          linea_equipo: et.linea_equipo,
          codigo_lote_pt: lpt.codigo_lote_pt,
          codigo_punto: pc.codigo_punto,
          punto_captura: pc.nombre,
          operario: `${u.nombre || ''} ${u.apellido || ''}`.trim(),
        };
      });
    return { rows, insertId: null, affectedRows: 0 };
  }

  // Listado general de lotes PT (LotePTModel.getAll y Dashboard export)
  if (upper.includes('FROM LOTES_PRODUCTO_TERMINADO LPT') && upper.includes('ORDER BY LPT.CREATED_AT DESC')) {
    let rows = store.lotes_producto_terminado.map(enrichLotePT);
    let pIdx = 0;

    if (upper.includes('AND LPT.ESTADO = ?')) {
      const st = params[pIdx++];
      rows = rows.filter((r) => r.estado === st);
    }
    if (upper.includes('AND LPT.ESTADO IN (?)')) {
      const arr = Array.isArray(params[pIdx]) ? params[pIdx] : [params[pIdx]];
      pIdx++;
      rows = rows.filter((r) => arr.includes(r.estado));
    }
    if (upper.includes('AND (LPT.CODIGO_LOTE_PT LIKE ? OR PT.NOMBRE LIKE ?)')) {
      const term = String(params[pIdx] || '').replace(/%/g, '').toLowerCase();
      pIdx += 2;
      rows = rows.filter(
        (r) =>
          String(r.codigo_lote_pt).toLowerCase().includes(term) ||
          String(r.producto_nombre).toLowerCase().includes(term)
      );
    }
    if (upper.includes('AND LPT.FECHA_ELABORACION >= ?')) {
      const desde = String(params[pIdx++]).slice(0, 10);
      rows = rows.filter((r) => String(r.fecha_elaboracion).slice(0, 10) >= desde);
    }
    if (upper.includes('AND LPT.FECHA_ELABORACION <= ?')) {
      const hasta = String(params[pIdx++]).slice(0, 10);
      rows = rows.filter((r) => String(r.fecha_elaboracion).slice(0, 10) <= hasta);
    }
    if (upper.includes('AND PT.ID = ?')) {
      const pid = Number(params[pIdx++]);
      rows = rows.filter((r) => Number(r.producto_id) === pid);
    }
    if (upper.includes('AND OP.LINEA_PRODUCCION = ?')) {
      const lin = params[pIdx++];
      rows = rows.filter((r) => r.linea_produccion === lin);
    }
    if (upper.includes('WHERE LMP.CODIGO_LOTE_MP LIKE ?')) {
      const mpTerm = String(params[pIdx++] || '').replace(/%/g, '').toLowerCase();
      const matchingMpIds = store.lotes_materia_prima
        .filter((m) => String(m.codigo_lote_mp).toLowerCase().includes(mpTerm))
        .map((m) => m.id);
      const matchingOpIds = store.consumos_materia_prima
        .filter((c) => matchingMpIds.includes(c.lote_mp_id))
        .map((c) => c.orden_produccion_id);
      rows = rows.filter((r) => matchingOpIds.includes(r.orden_produccion_id));
    }

    rows.sort((a, b) => Number(b.id) - Number(a.id));
    return { rows, insertId: null, affectedRows: 0 };
  }

  return { rows: [], insertId: null, affectedRows: 0 };
}

module.exports = { executeMemoryQuery };
