import { useState } from 'react';
import { Calendar, Search, RotateCcw } from 'lucide-react';

const ESTADOS_DISPONIBLES = [
  'EN_PROCESO',
  'CUARENTENA',
  'APROBADO',
  'RECHAZADO',
  'DESPACHADO',
  'BLOQUEADO',
];

const LINEAS = [
  { value: '', label: 'Todas las líneas' },
  { value: 'Quesería 1', label: 'Quesería 1' },
  { value: 'Yogur 2', label: 'Yogur 2' },
  { value: 'Manteca 3', label: 'Manteca 3' },
  { value: 'Crema 4', label: 'Crema 4' },
];

/**
 * FiltrosAvanzados — Filtros reutilizables para LotesPT.
 * @param {{ onFiltrar: Function, productos: Array, loading: boolean }} props
 */
export default function FiltrosAvanzados({ onFiltrar, productos = [], loading = false }) {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [productoId, setProductoId] = useState('');
  const [lineaProduccion, setLineaProduccion] = useState('');
  const [estados, setEstados] = useState([]);
  const [loteMp, setLoteMp] = useState('');

  const toggleEstado = (estado) => {
    setEstados((prev) =>
      prev.includes(estado) ? prev.filter((e) => e !== estado) : [...prev, estado]
    );
  };

  const handleAplicar = (e) => {
    e.preventDefault();
    onFiltrar({
      desde,
      hasta,
      producto_id: productoId,
      linea_produccion: lineaProduccion,
      estados: estados.join(','),
      lote_mp: loteMp,
    });
  };

  const handleLimpiar = () => {
    setDesde('');
    setHasta('');
    setProductoId('');
    setLineaProduccion('');
    setEstados([]);
    setLoteMp('');
    onFiltrar({});
  };

  return (
    <form
      onSubmit={handleAplicar}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5"
    >
      {/* Grid de inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Desde */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
            <Calendar size={13} /> Desde
          </label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
          />
        </div>

        {/* Hasta */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
            <Calendar size={13} /> Hasta
          </label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
          />
        </div>

        {/* Producto/SKU */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-400">Producto / SKU</label>
          <select
            value={productoId}
            onChange={(e) => setProductoId(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
          >
            <option value="">Todos los productos</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} — {p.codigo_sku}
              </option>
            ))}
          </select>
        </div>

        {/* Línea de Elaboración */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-400">Línea de Elaboración</label>
          <select
            value={lineaProduccion}
            onChange={(e) => setLineaProduccion(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
          >
            {LINEAS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        {/* Lote de Materia Prima */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-400">Lote de Materia Prima</label>
          <input
            type="text"
            value={loteMp}
            onChange={(e) => setLoteMp(e.target.value)}
            placeholder="Ej: LMP-2024-001"
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Pills de estado */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-400">
          Estados{' '}
          <span className="text-slate-600">(selección múltiple)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {ESTADOS_DISPONIBLES.map((estado) => {
            const activo = estados.includes(estado);
            return (
              <button
                key={estado}
                type="button"
                onClick={() => toggleEstado(estado)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-150 ${
                  activo
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-300'
                }`}
              >
                {estado}
              </button>
            );
          })}
        </div>
      </div>

      {/* Botones */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-blue-400 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Search size={14} />
          Aplicar Filtros
        </button>
        <button
          type="button"
          onClick={handleLimpiar}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-transparent border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200 text-sm font-medium rounded-lg transition-colors"
        >
          <RotateCcw size={14} />
          Limpiar
        </button>
      </div>
    </form>
  );
}
