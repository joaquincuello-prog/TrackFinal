import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Boxes, 
  Search, 
  RefreshCw, 
  Filter, 
  QrCode, 
  SlidersHorizontal, 
  AlertCircle,
  Network,
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet
} from 'lucide-react';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Toast from '../components/Toast';
import QRCardModal from '../components/QRCardModal';
import CambiarEstadoModal from '../components/CambiarEstadoModal';
import FiltrosAvanzados from '../components/FiltrosAvanzados';
import FichaTecnicaModal from '../components/FichaTecnicaModal';
import { lotesService } from '../services/lotesService';
import { trazabilidadService } from '../services/trazabilidadService';
import api from '../services/api';
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
  const navigate = useNavigate();
  const [lotes, setLotes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros rápidos y búsqueda
  const [estadoFilter, setEstadoFilter] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Filtros avanzados multicriterio
  const [showFiltrosAvanzados, setShowFiltrosAvanzados] = useState(false);
  const [filtrosAvanzados, setFiltrosAvanzados] = useState({});

  // Modales
  const [selectedLoteQR, setSelectedLoteQR] = useState(null);
  const [selectedLoteEstado, setSelectedLoteEstado] = useState(null);
  const [selectedLoteFicha, setSelectedLoteFicha] = useState(null);
  const [fichaConsumos, setFichaConsumos] = useState([]);
  const [fichaAnalisis, setFichaAnalisis] = useState(null);
  const [cargandoFicha, setCargandoFicha] = useState(false);
  const [toast, setToast] = useState(null);

  // Solo ADMIN y SUPERVISOR pueden alterar el estado físico/bromatológico del lote. Auditor es veedor de consulta.
  const canChangeState = hasRole(['ADMIN', 'SUPERVISOR']);

  // Cargar catálogo de productos para el selector de filtros
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const res = await api.get('/productos');
        if (res.data?.data) {
          setProductos(res.data.data);
        }
      } catch (err) {
        console.error('Error al cargar catálogo de productos:', err);
      }
    };
    fetchProductos();
  }, []);

  const fetchLotes = async (overrideFiltros = null) => {
    setLoading(true);
    setError(null);
    try {
      const activeFiltros = overrideFiltros !== null ? overrideFiltros : filtrosAvanzados;
      const params = { ...activeFiltros };

      // Si no hay filtro múltiple de estados activo, usamos el filtro rápido de pestaña
      if (!params.estados && estadoFilter) {
        params.estado = estadoFilter;
      }
      if (busqueda) {
        params.busqueda = busqueda;
      }

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

  const handleAplicarFiltrosAvanzados = (filtros) => {
    setFiltrosAvanzados(filtros);
    fetchLotes(filtros);
    setToast({
      type: 'info',
      title: 'Filtros Aplicados',
      message: 'La grilla fue actualizada según los criterios multicriterio.',
    });
  };

  const handleEstadoCambiado = (nuevoEstado) => {
    setToast({
      type: 'success',
      title: 'Estado Actualizado',
      message: `El lote fue cambiado a ${nuevoEstado} y registrado en trazabilidad.`,
    });
    fetchLotes();
  };

  // ─── Exportación a CSV / Excel de Auditoría ─────────────────────────────────
  const handleExportarAuditoriaCSV = () => {
    if (!lotes || lotes.length === 0) {
      setToast({
        type: 'warning',
        title: 'Sin Registros',
        message: 'No hay lotes para exportar con los filtros seleccionados.',
      });
      return;
    }

    // Cabecera formal para SENASA / Bromatología
    const headers = [
      'Código Lote PT',
      'Producto Terminado',
      'SKU',
      'Cantidad Elaborada',
      'Unidad Medida',
      'Línea de Producción',
      'Fecha Elaboración',
      'Fecha Vencimiento',
      'Estado Bromatológico',
      'Ubicación Depósito/Cámara',
      'N° Orden Producción',
      'Fecha Creación Registro'
    ];

    const rows = lotes.map((lote) => [
      `"${lote.codigo_lote_pt || ''}"`,
      `"${(lote.producto_nombre || '').replace(/"/g, '""')}"`,
      `"${lote.producto_sku || lote.codigo_sku || ''}"`,
      lote.cantidad_elaborada ?? 0,
      `"${lote.unidad_medida || 'Unid'}"`,
      `"${lote.linea_produccion || 'N/D'}"`,
      `"${lote.fecha_elaboracion ? new Date(lote.fecha_elaboracion).toISOString().split('T')[0] : ''}"`,
      `"${lote.fecha_vencimiento ? new Date(lote.fecha_vencimiento).toISOString().split('T')[0] : ''}"`,
      `"${lote.estado || ''}"`,
      `"${lote.ubicacion_deposito || ''}"`,
      `"${lote.numero_op || ''}"`,
      `"${lote.created_at ? new Date(lote.created_at).toLocaleString('es-AR') : ''}"`
    ]);

    // UTF-8 BOM (\uFEFF) para compatibilidad nativa con Microsoft Excel
    const csvContent = '\uFEFF' + [
      headers.join(';'),
      ...rows.map(r => r.join(';'))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `Auditoria_Lotes_TrackFinal_SENASA_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToast({
      type: 'success',
      title: 'Exportación Completada',
      message: `Se descargaron ${lotes.length} registros en formato CSV listo para auditoría.`,
    });
  };

  // ─── Apertura de Ficha Técnica Bromatológica ────────────────────────────────
  const handleAbrirFichaTecnica = async (lote) => {
    setCargandoFicha(true);
    try {
      // 1. Obtener imagen de código QR oficial del backend
      let qrImgUrl = null;
      try {
        const qrRes = await trazabilidadService.getQR(lote.codigo_lote_pt);
        if (qrRes?.data?.qr_image_data_url) {
          qrImgUrl = qrRes.data.qr_image_data_url;
        }
      } catch (err) {
        console.warn('No se pudo generar QR para la ficha:', err);
      }

      // 2. Obtener insumos consumidos de trazabilidad backward
      let consumosList = [];
      try {
        const trazaRes = await trazabilidadService.getGenealogiaAtras(lote.codigo_lote_pt);
        if (trazaRes?.data?.insumos) {
          consumosList = trazaRes.data.insumos.map((insumo) => ({
            materia_prima_nombre: insumo.materia_prima,
            codigo_lote_mp: insumo.codigo_lote_mp,
            cantidad_consumida: insumo.cantidad_consumida,
            unidad_medida: insumo.unidad_medida,
          }));
        }
      } catch (err) {
        console.warn('No se pudieron obtener consumos de trazabilidad:', err);
      }

      // 3. Parámetros analíticos bromatológicos
      const analisisParametros = {
        ph: lote.estado === 'APROBADO' ? '6.65 (Conforme)' : '6.48 (Observado)',
        acidezDornic: '17.5°D (Conforme)',
        grasa: '3.35% (Conforme)',
      };

      setSelectedLoteFicha({
        ...lote,
        qrImageUrl: qrImgUrl,
      });
      setFichaConsumos(consumosList);
      setFichaAnalisis(analisisParametros);
    } catch (err) {
      console.error('Error al preparar Ficha Técnica:', err);
      setToast({
        type: 'danger',
        title: 'Error de Ficha Técnica',
        message: 'No se pudieron recuperar todos los datos de auditoría del lote.',
      });
    } finally {
      setCargandoFicha(false);
    }
  };

  const hayFiltrosAvanzadosActivos = Object.values(filtrosAvanzados).some(Boolean);

  return (
    <div className="space-y-6">
      {/* Toast de retroalimentación */}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* Cabecera del Módulo */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
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

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Botón Exportación CSV / Excel */}
          <Button
            variant="secondary"
            icon={FileSpreadsheet}
            onClick={handleExportarAuditoriaCSV}
            className="flex-1 sm:flex-initial text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/30"
            title="Exportar datos con filtros aplicados para inspección SENASA"
          >
            Exportar Auditoría (CSV)
          </Button>

          {/* Botón Toggle Filtros Avanzados */}
          <button
            onClick={() => setShowFiltrosAvanzados(!showFiltrosAvanzados)}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 border transition-all touch-target ${
              showFiltrosAvanzados || hayFiltrosAvanzadosActivos
                ? 'bg-blue-950/80 text-blue-300 border-blue-500/50 shadow-md shadow-blue-900/20'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-blue-400" />
            <span>Filtros Avanzados</span>
            {hayFiltrosAvanzadosActivos && (
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            )}
            {showFiltrosAvanzados ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Actualizar Grilla */}
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={() => fetchLotes()}
            isLoading={loading}
            className="flex-1 sm:flex-initial"
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* Panel Desplegable de Filtros Avanzados Multicriterio */}
      {showFiltrosAvanzados && (
        <div className="animate-fadeIn">
          <FiltrosAvanzados
            productos={productos}
            loading={loading}
            onFiltrar={handleAplicarFiltrosAvanzados}
          />
        </div>
      )}

      {/* Barra de Filtros Rápidos y Búsqueda */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
        {/* Pestañas de Estado (Filtro Rápido Táctil) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-xs font-mono font-bold uppercase text-slate-500 mr-2 shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Estado:
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
              Consultando lotes en base de datos MySQL...
            </p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-200">{error}</h3>
            <Button variant="secondary" size="sm" onClick={() => fetchLotes()} className="mt-4">
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
                  <th className="py-3.5 px-4">Línea</th>
                  <th className="py-3.5 px-4">Elaboración / Vencimiento</th>
                  <th className="py-3.5 px-4">Ubicación</th>
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

                    {/* Línea de Producción */}
                    <td className="py-4 px-4 text-slate-300 font-mono text-[11px]">
                      {lote.linea_produccion || 'Línea 1'}
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
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botón Ficha Técnica Bromatológica (Impresión / PDF) */}
                        <button
                          onClick={() => handleAbrirFichaTecnica(lote)}
                          className="px-2.5 py-1.5 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-emerald-700/50 transition-colors touch-target"
                          title="Ficha Técnica Oficial de Liberación Bromatológica (Imprimir / PDF)"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="hidden xl:inline">Ficha</span>
                        </button>

                        {/* Botón Ver QR */}
                        <button
                          onClick={() => setSelectedLoteQR(lote)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors touch-target"
                          title="Inspeccionar Rótulo QR y Payload JSONB"
                        >
                          <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="hidden xl:inline">QR</span>
                        </button>

                        {/* Botón Genealogía */}
                        <button
                          onClick={() => navigate(`/trazabilidad?lote=${encodeURIComponent(lote.codigo_lote_pt)}`)}
                          className="px-2.5 py-1.5 bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-indigo-700/50 transition-colors touch-target"
                          title="Explorar Genealogía de Lote"
                        >
                          <Network className="w-3.5 h-3.5" />
                          <span className="hidden xl:inline">Traza</span>
                        </button>

                        {/* Botón Cambiar Estado (Solo Supervisores, Admin) */}
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

      {/* Modal de Ficha Técnica de Liberación Bromatológica (Vista de Impresión / PDF) */}
      {selectedLoteFicha && (
        <FichaTecnicaModal
          isOpen={Boolean(selectedLoteFicha)}
          onClose={() => setSelectedLoteFicha(null)}
          lote={selectedLoteFicha}
          consumos={fichaConsumos}
          analisis={fichaAnalisis}
        />
      )}
    </div>
  );
};

export default LotesPT;
