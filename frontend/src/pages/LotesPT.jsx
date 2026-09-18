import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Search, 
  RefreshCw, 
  Filter, 
  QrCode, 
  SlidersHorizontal, 
  Calendar, 
  Layers, 
  AlertCircle,
  Eye
} from 'lucide-react';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Toast from '../components/Toast';
import QRCardModal from '../components/QRCardModal';
import CambiarEstadoModal from '../components/CambiarEstadoModal';
import { lotesService } from '../services/lotesService';
import { useAuth } from '../hooks/useAuth';

const FILTROS_ESTADO = [
  { id: '', label: 'Todos' },
  { id: 'EN_PROCESO', label: 'En Proceso' },
  { id: 'CUARENTENA', label: 'Cuarentena' },
  { id: 'APROBADO', label: 'Aprobados' },
  { id: 'RECHAZADO', label: 'Rechazados' },
  { id: 'DESPACHADO', label: 'Despachados' },
  { id: 'BLOQUEADO', label: 'Bloqueados' },
];

export const LotesPT = () => {
  const { user, hasRole } = useAuth();
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [estadoFilter, setEstadoFilter] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [selectedLoteQR, setSelectedLoteQR] = useState(null);
  const [selectedLoteEstado, setSelectedLoteEstado] = useState(null);
  const [toast, setToast] = useState(null);

  const canChangeState = hasRole(['ADMIN', 'SUPERVISOR', 'AUDITOR']);

  const fetchLotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (estadoFilter) params.estado = estadoFilter;
      if (busqueda) params.busqueda = busqueda;

      const res = await lotesService.getLotes(params);
      if (res && res.data) {
        setLotes(res.data);
      }
    } catch (err) {
      console.error('Error al cargar lotes:', err);
      setError('No se pudo conectar con el servidor de base de datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLotes();
  }, [estadoFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLotes();
  };

  const handleEstadoCambiado = (nuevoEstado) => {
    setToast({
      type: 'success',
      title: 'Estado Actualizado',
      message: `El lote fue cambiado a ${nuevoEstado} y registrado en trazabilidad.`,
    });
    fetchLotes();
  };

  return (
    <div className="space-y-6">
      {/* Toast de retroalimentación */}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* Cabecera del Módulo */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Boxes className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Gestión de Lotes de Producto Terminado
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Control de existencias, ciclo de vida, rótulos QR y liberación bromatológica
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={fetchLotes}
            isLoading={loading}
            className="w-full sm:w-auto"
          >
            Actualizar Grilla
          </Button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
        {/* Pestañas de Estado (Filtro Rápido Táctil) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-xs font-mono font-bold uppercase text-slate-500 mr-2 shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filtrar:
          </span>
          {FILTROS_ESTADO.map((f) => {
            const isSelected = estadoFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setEstadoFilter(f.id)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all touch-target ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Buscador de Texto */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por código de lote (ej: LPT-2026-001) o nombre de producto..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none touch-target font-sans"
            />
          </div>
          <Button type="submit" variant="primary" icon={Search}>
            Buscar
          </Button>
        </form>
      </div>

      {/* Grilla de Lotes PT */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Consultando lotes en base de datos PostgreSQL...
            </p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-200">{error}</h3>
            <Button variant="secondary" size="sm" onClick={fetchLotes} className="mt-4">
              Reintentar Conexión
            </Button>
          </div>
        ) : lotes.length === 0 ? (
          <div className="py-16 text-center max-w-sm mx-auto">
            <Boxes className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-200">No se encontraron lotes</h3>
            <p className="text-xs text-slate-400 mt-1">
              No hay registros que coincidan con los filtros aplicados. Podés generar nuevos lotes desde la Terminal de Captura.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Lote PT</th>
                  <th className="py-3.5 px-4">Producto Terminado</th>
                  <th className="py-3.5 px-4">Cantidad</th>
                  <th className="py-3.5 px-4">Elaboración / Vencimiento</th>
                  <th className="py-3.5 px-4">Ubicación Cámara</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {lotes.map((lote) => (
                  <tr key={lote.id || lote.codigo_lote_pt} className="hover:bg-slate-800/40 transition-colors">
                    {/* Código Lote */}
                    <td className="py-4 px-4 font-mono font-bold text-blue-400">
                      {lote.codigo_lote_pt}
                    </td>

                    {/* Producto */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-200">
                        {lote.producto_nombre || 'Producto PT'}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        SKU: {lote.producto_sku || lote.codigo_sku || 'N/D'}
                      </div>
                    </td>

                    {/* Cantidad */}
                    <td className="py-4 px-4 font-medium text-slate-200">
                      <span className="font-mono font-bold">{lote.cantidad_elaborada}</span>{' '}
                      <span className="text-slate-400 text-[11px]">{lote.unidad_medida || 'Unid'}</span>
                    </td>

                    {/* Fechas */}
                    <td className="py-4 px-4">
                      <div className="text-slate-300">
                        Elab: <span className="font-mono">{lote.fecha_elaboracion ? new Date(lote.fecha_elaboracion).toLocaleDateString('es-AR') : 'N/D'}</span>
                      </div>
                      <div className="text-rose-400 font-medium">
                        Vence: <span className="font-mono">{lote.fecha_vencimiento ? new Date(lote.fecha_vencimiento).toLocaleDateString('es-AR') : 'N/D'}</span>
                      </div>
                    </td>

                    {/* Ubicación */}
                    <td className="py-4 px-4 text-slate-400 font-mono text-[11px]">
                      {lote.ubicacion_deposito || 'Cámara 1'}
                    </td>

                    {/* Estado */}
                    <td className="py-4 px-4">
                      <Badge estado={lote.estado} />
                    </td>

                    {/* Acciones por Fila */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Botón Ver QR */}
                        <button
                          onClick={() => setSelectedLoteQR(lote)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors touch-target"
                          title="Inspeccionar Rótulo QR y Payload JSONB"
                        >
                          <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                          <span>QR</span>
                        </button>

                        {/* Botón Cambiar Estado (Solo Supervisores, Admin, Auditor) */}
                        {canChangeState && (
                          <button
                            onClick={() => setSelectedLoteEstado(lote)}
                            className="px-2.5 py-1.5 bg-blue-950/60 hover:bg-blue-900 text-blue-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-blue-700/50 transition-colors touch-target"
                            title="Cambiar Estado del Lote"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>Estado</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Rótulo QR */}
      {selectedLoteQR && (
        <QRCardModal
          isOpen={Boolean(selectedLoteQR)}
          onClose={() => setSelectedLoteQR(null)}
          lote={selectedLoteQR}
        />
      )}

      {/* Modal de Cambio de Estado */}
      {selectedLoteEstado && (
        <CambiarEstadoModal
          isOpen={Boolean(selectedLoteEstado)}
          onClose={() => setSelectedLoteEstado(null)}
          lote={selectedLoteEstado}
          onSuccess={handleEstadoCambiado}
        />
      )}
    </div>
  );
};

export default LotesPT;
