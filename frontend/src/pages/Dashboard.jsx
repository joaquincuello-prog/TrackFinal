import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  ShieldX,
  Clock,
  Zap,
  Truck,
  PackageCheck,
  Building2,
  ShieldCheck,
  Download,
  RefreshCw,
  Activity,
  ExternalLink,
  CalendarClock,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { dashboardService } from '../services/dashboardService';

// ─── Colores por estado ────────────────────────────────────────────────────────
const ESTADO_COLORS = {
  APROBADO: '#10b981',
  CUARENTENA: '#f97316',
  EN_PROCESO: '#f59e0b',
  RECHAZADO: '#f43f5e',
  DESPACHADO: '#0ea5e9',
  BLOQUEADO: '#dc2626',
};

// ─── Skeleton loader ───────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-slate-800 rounded-2xl ${className}`} />
  );
}

// ─── Tooltip personalizado para Pie ───────────────────────────────────────────
function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 shadow-lg">
      <p className="font-semibold">{name}</p>
      <p className="text-slate-300">
        Cantidad: <span className="text-white font-bold">{value}</span>
      </p>
    </div>
  );
}

// ─── Tooltip para Bar ─────────────────────────────────────────────────────────
function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 shadow-lg">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <span className="font-bold text-white">{Number(p.value).toLocaleString('es-AR')}</span>
        </p>
      ))}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ titulo, valor, subtitulo, icono: Icono, colorClass, pulse = false }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl bg-slate-800 ${colorClass}`}>
        <Icono size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-400 font-medium truncate">{titulo}</p>
        <p className={`text-2xl font-bold text-slate-100 mt-0.5 ${pulse ? 'animate-pulse text-rose-400' : ''}`}>
          {valor ?? '—'}
        </p>
        {subtitulo && (
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">{subtitulo}</p>
        )}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState(null);
  const [distribucion, setDistribucion] = useState([]);
  const [volumenLinea, setVolumenLinea] = useState([]);
  const [panel, setPanel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtroDesde) params.desde = filtroDesde;
      if (filtroHasta) params.hasta = filtroHasta;

      const [kpisData, distData, volData, panelData] = await Promise.all([
        dashboardService.getKPIs(params),
        dashboardService.getDistribucionEstados(params),
        dashboardService.getVolumenPorLinea(params),
        dashboardService.getPanelOperativo(params).catch(() => null),
      ]);
      setKpis(kpisData);
      setDistribucion(Array.isArray(distData) ? distData : []);
      setVolumenLinea(Array.isArray(volData) ? volData : []);
      setPanel(panelData);
    } catch (err) {
      console.error('[Dashboard] Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  }, [filtroDesde, filtroHasta]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // ─── Exportar reporte CSV ────────────────────────────────────────────────────
  const handleExportarCSV = async () => {
    setExportando(true);
    try {
      const params = {};
      if (filtroDesde) params.desde = filtroDesde;
      if (filtroHasta) params.hasta = filtroHasta;
      const lotes = await dashboardService.exportarLotes(params);
      if (!Array.isArray(lotes) || lotes.length === 0) {
        alert('No hay lotes para exportar con el rango seleccionado.');
        return;
      }

      const headers = [
        'Codigo Lote PT',
        'Producto',
        'SKU',
        'Orden Produccion',
        'Linea Produccion',
        'Cantidad Elaborada',
        'Unidad',
        'Estado',
        'Fecha Elaboracion',
        'Fecha Vencimiento',
        'Ubicacion Deposito',
      ];

      const rows = lotes.map((l) => [
        l.codigo_lote_pt,
        `"${(l.producto_nombre || '').replace(/"/g, '""')}"`,
        l.codigo_sku || '',
        l.numero_op || '',
        `"${(l.linea_produccion || '').replace(/"/g, '""')}"`,
        l.cantidad_elaborada,
        l.unidad_medida || '',
        l.estado,
        l.fecha_elaboracion ? String(l.fecha_elaboracion).slice(0, 10) : '',
        l.fecha_vencimiento ? String(l.fecha_vencimiento).slice(0, 10) : '',
        `"${(l.ubicacion_deposito || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent =
        '\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `reporte_trazabilidad_lotes_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[Dashboard] Error al exportar CSV:', err);
    } finally {
      setExportando(false);
    }
  };

  // ─── Conformidad color ───────────────────────────────────────────────────────
  const conformidadColor = () => {
    const v = kpis?.tasaConformidad ?? 0;
    if (v >= 80) return 'text-emerald-400';
    if (v >= 60) return 'text-yellow-400';
    return 'text-rose-400';
  };

  const maxUnidadesProducto = Math.max(
    ...(panel?.produccion_por_producto?.map((p) => p.total_unidades) || [1]),
    1
  );

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 space-y-8">

      {/* ── HEADER ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 size={26} className="text-blue-400" />
            Dashboard de Control Industrial
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            KPIs de Trazabilidad, Calidad y Despachos de Mercado — Lácteos San Antonio S.A.
          </p>
        </div>

        {/* Filtros de fecha y acciones */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Desde</label>
            <input
              type="date"
              value={filtroDesde}
              onChange={(e) => setFiltroDesde(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Hasta</label>
            <input
              type="date"
              value={filtroHasta}
              onChange={(e) => setFiltroHasta(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          {(filtroDesde || filtroHasta) && (
            <button
              onClick={() => {
                setFiltroDesde('');
                setFiltroHasta('');
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition-colors"
            >
              Limpiar
            </button>
          )}
          <button
            onClick={cargarDatos}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-blue-400' : 'text-blue-400'} />
            Actualizar
          </button>
          <button
            onClick={handleExportarCSV}
            disabled={exportando || loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-950/50 transition-colors disabled:opacity-50"
          >
            <Download size={14} />
            {exportando ? 'Exportando...' : 'Exportar CSV'}
          </button>
        </div>
      </div>

      {/* ── MTTT CARD ─────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 border border-blue-500/30 rounded-2xl p-6 shadow-xl shadow-blue-950/30">
        <div className="mb-4">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">
            KPI de Impacto Principal
          </p>
          <h2 className="text-lg font-bold text-slate-100">
            MTTT — Mean Time to Trace
          </h2>
          <p className="text-sm text-slate-400">
            Impacto cuantitativo de la Transformación Digital
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-4">
          {/* ANTES */}
          <div className="flex-1 bg-rose-950/40 border border-rose-500/30 rounded-xl p-5 flex flex-col items-center text-center gap-2">
            <span className="text-[10px] font-bold text-rose-400 border border-rose-500/40 bg-rose-900/30 px-2 py-0.5 rounded-full uppercase tracking-widest">
              ANTES — Sistema Manual
            </span>
            <Clock size={28} className="text-rose-400 mt-1" />
            <p className="text-3xl font-extrabold text-rose-300">24–48 hs</p>
            <p className="text-xs text-rose-400/80">
              Búsqueda manual en archivadores físicos
            </p>
          </div>

          {/* VS */}
          <div className="flex items-center justify-center">
            <span className="text-slate-500 font-bold text-lg px-2">vs</span>
          </div>

          {/* AHORA */}
          <div className="flex-1 bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-5 flex flex-col items-center text-center gap-2">
            <span className="text-[10px] font-bold text-emerald-400 border border-emerald-500/40 bg-emerald-900/30 px-2 py-0.5 rounded-full uppercase tracking-widest">
              AHORA — Sistema 4.0
            </span>
            <Zap size={28} className="text-emerald-400 mt-1" />
            <p className="text-3xl font-extrabold text-emerald-300">&lt; 5 seg</p>
            <p className="text-xs text-emerald-400/80">
              Consulta por QR o código de lote en TrackFinal
            </p>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-blue-300/70 font-medium border-t border-slate-800 pt-3">
          ⚡ Mejora de eficiencia:{' '}
          <span className="text-blue-300 font-bold">99.99%</span> de reducción en tiempo
          de rastreo bromatológico
        </div>
      </div>

      {/* ── KPI NUMÉRICOS PRINCIPALES ─────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-[88px]" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              titulo="Total de Lotes"
              valor={kpis?.totalLotes}
              subtitulo={`${kpis?.lotesAprobados ?? 0} en stock · ${kpis?.lotesDespachados ?? 0} despachados`}
              icono={Boxes}
              colorClass="text-blue-400"
            />
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-slate-800 text-emerald-400">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Tasa de Conformidad</p>
                <p className={`text-2xl font-bold mt-0.5 ${conformidadColor()}`}>
                  {kpis?.tasaConformidad != null ? `${kpis.tasaConformidad}%` : '—'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Lotes aprobados + despachados
                </p>
              </div>
            </div>
            <KpiCard
              titulo="Lotes en Cuarentena"
              valor={kpis?.lotesCuarentena}
              subtitulo="Pendientes de liberación QC"
              icono={AlertTriangle}
              colorClass="text-orange-400"
            />
            <KpiCard
              titulo="Lotes Bloqueados"
              valor={kpis?.lotesBloqueados}
              subtitulo={(kpis?.lotesBloqueados ?? 0) > 0 ? 'Retención sanitaria activa' : 'Sin alertas críticas'}
              icono={ShieldX}
              colorClass="text-rose-500"
              pulse={(kpis?.lotesBloqueados ?? 0) > 0}
            />
          </div>

          {/* ── SEGUNDA FILA DE KPIs OPERATIVOS (PLANTA Y MERCADO) ──────────────── */}
          {panel?.resumen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <KpiCard
                titulo="Unidades Producidas"
                valor={panel.resumen.unidades_producidas.toLocaleString('es-AR')}
                subtitulo="Volumen total elaborado en planta"
                icono={PackageCheck}
                colorClass="text-indigo-400"
              />
              <KpiCard
                titulo="Unidades Despachadas"
                valor={panel.resumen.unidades_despachadas.toLocaleString('es-AR')}
                subtitulo={`${kpis?.lotesDespachados ?? 0} lotes enviados a mercado`}
                icono={Truck}
                colorClass="text-sky-400"
              />
              <KpiCard
                titulo="Clientes Abastecidos"
                valor={panel.resumen.clientes_abastecidos}
                subtitulo="Distribuidores y cadenas con trazabilidad Forward"
                icono={Building2}
                colorClass="text-amber-400"
              />
              <KpiCard
                titulo="Cobertura Genealógica"
                valor={`${panel.resumen.cobertura_trazabilidad}%`}
                subtitulo={`${panel.resumen.lotes_trazables} lotes con MP + QC completo`}
                icono={ShieldCheck}
                colorClass="text-teal-400"
              />
            </div>
          )}
        </div>
      )}

      {/* ── GRÁFICOS ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Gráfico 1 — Distribución de Estados (Donut) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">
              Distribución de Estados de Lotes
            </h3>
            {distribucion.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-slate-600 text-sm">
                Sin datos disponibles
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={distribucion}
                    dataKey="cantidad"
                    nameKey="estado"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={2}
                  >
                    {distribucion.map((entry) => (
                      <Cell
                        key={entry.estado}
                        fill={ESTADO_COLORS[entry.estado] ?? '#64748b'}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    formatter={(value, entry) => (
                      <span className="text-xs text-slate-300">
                        {value}{' '}
                        <span className="text-slate-500">
                          ({entry.payload?.cantidad ?? 0})
                        </span>
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Gráfico 2 — Volumen por Línea (Bar) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">
              Volumen de Producción por Línea
            </h3>
            {volumenLinea.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-slate-600 text-sm">
                Sin datos disponibles
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={volumenLinea} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="linea_produccion"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                  />
                  <Tooltip content={<BarTooltip />} />
                  <Legend
                    formatter={(value) => (
                      <span className="text-xs text-slate-300">{value}</span>
                    )}
                  />
                  <Bar dataKey="total_unidades" name="Total Unidades" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cantidad_lotes" name="Cant. Lotes" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* ── PRODUCCIÓN POR PRODUCTO & DESTINATARIOS DE MERCADO ────────────────── */}
      {!loading && panel && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Producción por Producto Terminado */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <PackageCheck size={16} className="text-indigo-400" />
                Producción por Producto Terminado
              </h3>
              <span className="text-xs text-slate-500">
                {panel.produccion_por_producto?.length || 0} referencias activas
              </span>
            </div>

            {!panel.produccion_por_producto?.length ? (
              <p className="text-sm text-slate-500 py-8 text-center">Sin producción registrada</p>
            ) : (
              <div className="space-y-4">
                {panel.produccion_por_producto.map((prod) => {
                  const pct = Math.round((prod.total_unidades / maxUnidadesProducto) * 100);
                  return (
                    <div key={prod.producto} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-200">{prod.producto}</span>
                        <span className="text-slate-400">
                          <strong className="text-slate-100">
                            {prod.total_unidades.toLocaleString('es-AR')}
                          </strong>{' '}
                          {prod.unidad_medida} ({prod.cantidad_lotes} lotes)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full"
                          style={{ width: `${Math.max(pct, 6)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Despachos por Cliente (Forward Tracking Resumen) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Truck size={16} className="text-sky-400" />
                Destinatarios de Mercado (Despachos por Cliente)
              </h3>
              <span className="text-xs text-slate-500">Trazabilidad Hacia Adelante</span>
            </div>

            {!panel.despachos_por_cliente?.length ? (
              <p className="text-sm text-slate-500 py-8 text-center">
                No hay despachos registrados aún
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 uppercase">
                      <th className="text-left py-2 px-2">Cliente / Destino</th>
                      <th className="text-center py-2 px-2">Lotes</th>
                      <th className="text-right py-2 px-2">Unidades</th>
                    </tr>
                  </thead>
                  <tbody>
                    {panel.despachos_por_cliente.map((cli) => (
                      <tr
                        key={cli.cliente}
                        className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-2.5 px-2">
                          <p className="font-semibold text-slate-200">{cli.cliente}</p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[260px]">
                            {cli.direccion}
                          </p>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-sky-950/60 border border-sky-500/30 text-sky-300 font-semibold">
                            {cli.lotes_recibidos}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-bold text-slate-100">
                          {cli.unidades_recibidas.toLocaleString('es-AR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ALERTAS SANITARIAS / VENCIMIENTO & ACTIVIDAD RECIENTE EN PLANTA ──── */}
      {!loading && panel && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Alertas de Lotes */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <CalendarClock size={16} className="text-amber-400" />
                Alertas Sanitarias y de Vencimiento
              </h3>
              <span className="text-xs text-slate-500">
                Retenidos o vence en &le; {panel.resumen?.dias_alerta ?? 15} días
              </span>
            </div>

            {!panel.alertas?.length ? (
              <div className="py-8 text-center text-emerald-400/80 text-sm">
                ✓ Sin lotes retenidos ni próximos a vencer
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {panel.alertas.map((al) => {
                  const badgeStyle =
                    al.tipo_alerta === 'BLOQUEO' || al.tipo_alerta === 'VENCIDO'
                      ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                      : al.tipo_alerta === 'CUARENTENA'
                      ? 'bg-orange-950/60 border-orange-500/40 text-orange-300'
                      : 'bg-amber-950/60 border-amber-500/40 text-amber-300';

                  return (
                    <div
                      key={al.codigo_lote_pt}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-400">
                            {al.codigo_lote_pt}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeStyle}`}
                          >
                            {al.estado}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5 truncate">{al.producto}</p>
                        <p className="text-[11px] text-slate-500">
                          Vence: {al.fecha_vencimiento ? String(al.fecha_vencimiento).slice(0, 10) : '—'}{' '}
                          ({al.dias_restantes >= 0 ? `en ${al.dias_restantes} días` : `vencido hace ${Math.abs(al.dias_restantes)} días`})
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/trazabilidad?lote=${encodeURIComponent(al.codigo_lote_pt)}`)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-blue-300 font-medium shrink-0 transition-colors"
                        title="Auditar lote en Genealogía y Recall"
                      >
                        Auditar <ExternalLink size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Últimos Eventos en Puntos de Captura */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Activity size={16} className="text-emerald-400" />
                Actividad Reciente en Puntos de Captura (Planta)
              </h3>
              <span className="text-xs text-slate-500">Últimos 8 eventos</span>
            </div>

            {!panel.ultimos_eventos?.length ? (
              <p className="text-sm text-slate-500 py-8 text-center">
                Sin eventos registrados en línea
              </p>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {panel.ultimos_eventos.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                          {ev.codigo_punto}
                        </span>
                        <span className="text-xs font-semibold text-slate-200">
                          {ev.etapa_nombre}
                        </span>
                        <span className="font-mono text-xs text-blue-400">
                          {ev.codigo_lote_pt}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Equipo: <span className="text-slate-300">{ev.linea_equipo || 'Estación Planta'}</span> · Operario:{' '}
                        <span className="text-slate-300">{ev.operario}</span>
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-500 shrink-0">
                      {ev.timestamp_evento
                        ? new Date(ev.timestamp_evento).toLocaleString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TABLA ALTERNATIVA DE ESTADOS ──────────────────────────────────────── */}
      {!loading && distribucion.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">
            Detalle por Estado
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                </tr>
              </thead>
              <tbody>
                {distribucion.map((row) => (
                  <tr
                    key={row.estado}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-2 px-3">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full mr-2"
                        style={{ backgroundColor: ESTADO_COLORS[row.estado] ?? '#64748b' }}
                      />
                      <span className="text-slate-300 font-medium">{row.estado}</span>
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-100">
                      {row.cantidad}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
