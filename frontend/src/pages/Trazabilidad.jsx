import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Network, Search, AlertTriangle, ArrowLeftRight, Activity, 
  FlaskConical, Truck, CheckCircle2, ShieldAlert, Box, Users, Clock, QrCode,
  ShieldCheck, MapPin, FileText, Thermometer, UserCheck, Calendar, Cpu
} from 'lucide-react';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Toast from '../components/Toast';
import QRScannerModal from '../components/QRScannerModal';
import { trazabilidadService } from '../services/trazabilidadService';
import { useAuth } from '../hooks/useAuth';

export const Trazabilidad = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasRole } = useAuth();
  
  // Modos: 'BACKWARD' o 'FORWARD'
  const [activeTab, setActiveTab] = useState('BACKWARD');
  const [busqueda, setBusqueda] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  
  const [toast, setToast] = useState(null);
  const [bloqueando, setBloqueando] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Leer lote de la URL al montar o cambiar params
  useEffect(() => {
    const lote = searchParams.get('lote');
    const tabParam = searchParams.get('modo');
    if (lote) {
      const cleanLote = lote.trim();
      setBusqueda(cleanLote);
      if (tabParam === 'FORWARD' || cleanLote.toUpperCase().startsWith('LMP-')) {
        setActiveTab('FORWARD');
        fetchTrazabilidadConFallback('FORWARD', cleanLote);
      } else {
        setActiveTab('BACKWARD');
        fetchTrazabilidadConFallback('BACKWARD', cleanLote);
      }
    }
  }, [searchParams]);

  // Consulta inteligente con fallback cruzado
  const fetchTrazabilidadConFallback = async (modo, loteQuery) => {
    if (!loteQuery) return;
    const cleanQuery = loteQuery.trim();
    setLoading(true);
    setError(null);
    setData(null);

    try {
      let res;
      if (modo === 'BACKWARD') {
        res = await trazabilidadService.getGenealogiaAtras(cleanQuery);
      } else {
        res = await trazabilidadService.getGenealogiaAdelante(cleanQuery);
      }
      setData(res);
    } catch (err) {
      // Fallback cruzado automático: si no se encontró en la pestaña actual, intentar en la otra
      const otroModo = modo === 'BACKWARD' ? 'FORWARD' : 'BACKWARD';
      try {
        let fallbackRes;
        if (otroModo === 'BACKWARD') {
          fallbackRes = await trazabilidadService.getGenealogiaAtras(cleanQuery);
        } else {
          fallbackRes = await trazabilidadService.getGenealogiaAdelante(cleanQuery);
        }
        setActiveTab(otroModo);
        setData(fallbackRes);
      } catch (fallbackErr) {
        console.error(fallbackErr);
        setError(err.response?.data?.error || fallbackErr.response?.data?.error || 'No se encontró registro para el código consultado.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Cambiar de pestaña manteniendo la búsqueda activa
  const handleTabChange = (nuevoModo) => {
    setActiveTab(nuevoModo);
    setError(null);
    if (busqueda.trim()) {
      fetchTrazabilidadConFallback(nuevoModo, busqueda.trim());
    } else {
      setData(null);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!busqueda.trim()) return;
    const clean = busqueda.trim();

    let targetMode = activeTab;
    if (clean.toUpperCase().startsWith('LMP-')) {
      targetMode = 'FORWARD';
      setActiveTab('FORWARD');
    }

    setSearchParams({ lote: clean, modo: targetMode });
    fetchTrazabilidadConFallback(targetMode, clean);
  };

  // Callback al escanear código QR desde el modal
  const handleScanSuccess = (scannedLote) => {
    if (!scannedLote) return;
    const clean = scannedLote.trim();
    setBusqueda(clean);

    let targetMode = activeTab;
    if (clean.toUpperCase().startsWith('LMP-')) {
      targetMode = 'FORWARD';
      setActiveTab('FORWARD');
    } else if (clean.toUpperCase().startsWith('LPT-') && activeTab !== 'FORWARD') {
      targetMode = 'BACKWARD';
      setActiveTab('BACKWARD');
    }

    setSearchParams({ lote: clean, modo: targetMode });
    fetchTrazabilidadConFallback(targetMode, clean);
  };

  const handleBloqueoPreventivo = async () => {
    if (!data || !data.lote_mp) return;
    const motivo = prompt('FUNDAMENTACIÓN TÉCNICA SANITARIA PARA BLOQUEO PREVENTIVO (RECALL):');
    if (!motivo) return;

    setBloqueando(true);
    try {
      const res = await trazabilidadService.bloqueoPreventivoRecall(data.lote_mp, motivo);
      setToast({
        type: 'success',
        title: 'Bloqueo Cautelar Activado',
        message: `Protocolo ejecutado. ${res.total_lotes_bloqueados} lotes en CUARENTENA.`,
      });
      fetchTrazabilidadConFallback('FORWARD', busqueda || data.lote_mp);
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Error en Bloqueo',
        message: err.response?.data?.error || 'No se pudo ejecutar el bloqueo.',
      });
    } finally {
      setBloqueando(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* Modal de Escáner QR Integrado */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScanSuccess}
      />

      {/* Cabecera */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Network className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Genealogía y Trazabilidad Avanzada
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700">KIT AVZ-03</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              1. Escaneo Hacia Atrás (Origen, Materias Primas y Calidad) | 2. Escaneo Hacia Adelante (Mercado, Destinatarios y Logística)
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          icon={QrCode}
          onClick={() => setIsScannerOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
        >
          Escanear Rótulo QR / Cámara
        </Button>
      </div>

      {/* Controles de Búsqueda y Pestañas */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-max">
            <button
              type="button"
              onClick={() => handleTabChange('BACKWARD')}
              className={`flex-1 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'BACKWARD' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              1. Hacia Atrás (Backward / Origen)
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('FORWARD')}
              className={`flex-1 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'FORWARD' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Truck className="w-4 h-4" />
              2. Hacia Adelante (Forward / Destino y Recall)
            </button>
          </div>

          {/* Accesos rápidos de lotes de ejemplo */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-slate-500 font-mono">Ejemplos rápidos:</span>
            <button
              type="button"
              onClick={() => { setBusqueda('LPT-20260902-001'); fetchTrazabilidadConFallback(activeTab, 'LPT-20260902-001'); }}
              className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-blue-400 border border-slate-800 font-mono"
            >
              Queso (LPT-20260902-001)
            </button>
            <button
              type="button"
              onClick={() => { setBusqueda('LPT-20260905-DDL1'); fetchTrazabilidadConFallback(activeTab, 'LPT-20260905-DDL1'); }}
              className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-amber-400 border border-slate-800 font-mono"
            >
              Dulce de Leche (LPT-20260905-DDL1)
            </button>
            <button
              type="button"
              onClick={() => { setBusqueda('LMP-20260901-01'); setActiveTab('FORWARD'); fetchTrazabilidadConFallback('FORWARD', 'LMP-20260901-01'); }}
              className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-rose-400 border border-slate-800 font-mono"
            >
              Insumo Leche (LMP-20260901-01)
            </button>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={
                activeTab === 'BACKWARD'
                  ? 'Escanee o ingrese Lote PT (ej: LPT-20260902-001 o LPT-20260905-DDL1)'
                  : 'Escanee o ingrese Lote PT o Materia Prima (ej: LPT-20260902-001 o LMP-20260901-01)'
              }
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl text-slate-100 placeholder-slate-500 font-mono text-sm focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              icon={QrCode}
              onClick={() => setIsScannerOpen(true)}
              className="border-indigo-600/40 text-indigo-300 hover:bg-indigo-950/60"
            >
              Escanear
            </Button>
            <Button type="submit" variant="primary" icon={Search} isLoading={loading}>
              Rastrear
            </Button>
          </div>
        </form>
      </div>

      {/* Estado de Error */}
      {error && (
        <div className="bg-rose-950/20 border border-rose-900/50 rounded-2xl p-8 text-center text-rose-400">
          <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-80" />
          <h3 className="text-lg font-bold">Error de Trazabilidad</h3>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Loader */}
      {loading && !error && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-mono text-slate-400 animate-pulse">Reconstruyendo cadena de trazabilidad...</p>
        </div>
      )}

      {/* Aviso: datos recibidos pero sin estructura esperada para la pestaña activa */}
      {data && !loading && !error &&
        !((activeTab === 'BACKWARD' && data.lote_pt) || (activeTab === 'FORWARD' && data.lote_mp)) && (
        <div className="bg-amber-950/20 border border-amber-800/50 rounded-2xl p-6 text-center text-amber-300 text-sm">
          El código fue leído, pero no se encontró información de trazabilidad para esta vista.
          Probá cambiar de pestaña o volver a escanear.
        </div>
      )}

      {/* =====================================================================
          1. VISTA BACKWARD (HACIA ATRÁS: ORIGEN, INSUMOS, PROVEEDORES, PROCESO)
         ===================================================================== */}
      {data && activeTab === 'BACKWARD' && data.lote_pt && (
        <div className="space-y-6 animate-fade-in">
          {/* Ficha Principal del Producto Terminado y Orden de Producción */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                    1. Trazabilidad Hacia Atrás (Backward / Origen)
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-white">{data.producto}</div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-blue-400 font-mono text-lg font-bold">{data.lote_pt}</span>
                  <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    SKU: {data.sku}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge estado={data.estado_actual} />
                <Button
                  size="sm"
                  variant="secondary"
                  icon={Truck}
                  onClick={() => handleTabChange('FORWARD')}
                  className="border-indigo-500/40 text-indigo-300"
                >
                  Ver Destino / Mercado (Forward)
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-slate-800 text-sm">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-xs text-slate-500 block mb-1">Elaboración</span>
                <span className="font-mono text-slate-200 font-semibold">
                  {new Date(data.fecha_elaboracion).toLocaleDateString('es-AR')}
                </span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-xs text-slate-500 block mb-1">Vencimiento</span>
                <span className="font-mono text-rose-400 font-bold">
                  {new Date(data.fecha_vencimiento).toLocaleDateString('es-AR')}
                </span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-xs text-slate-500 block mb-1">Volumen Elaborado</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {data.cantidad_elaborada} {data.unidad_medida}
                </span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-xs text-slate-500 block mb-1">Orden Producción</span>
                <span className="font-mono text-indigo-300 font-bold block">
                  {data.orden_produccion?.numero_op}
                </span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-xs text-slate-500 block mb-1">Máquina / Línea</span>
                <span className="text-slate-200 font-semibold text-xs block">
                  {data.orden_produccion?.linea}
                </span>
              </div>
            </div>
          </div>

          {/* SECCIÓN A: MATERIAS PRIMAS Y PROVEEDORES */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-indigo-400" />
                Materias Primas, Lotes de Ingredientes y Proveedores
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {data.materias_primas_consumidas?.length || 0} insumos intervenientes
              </span>
            </div>

            {data.materias_primas_consumidas && data.materias_primas_consumidas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.materias_primas_consumidas.map((mp, idx) => (
                  <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="font-bold text-slate-100 text-base">{mp.materia_prima}</div>
                        <div className="text-xs font-mono text-indigo-400 font-bold mt-0.5">
                          Lote MP: {mp.codigo_lote_mp} <span className="text-slate-500">({mp.codigo_sku})</span>
                        </div>
                      </div>
                      <div className="bg-emerald-950/60 border border-emerald-700/50 px-2.5 py-1 rounded-lg text-right shrink-0">
                        <div className="font-mono text-sm font-bold text-emerald-400">
                          {mp.cantidad_consumida} {mp.unidad_medida}
                        </div>
                        <div className="text-[10px] text-slate-400">Dosificado</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 text-xs">
                      <div>
                        <span className="text-slate-500 block">Proveedor de Origen:</span>
                        <span className="font-semibold text-slate-200">{mp.proveedor}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Recepción en Fábrica:</span>
                        <span className="font-mono text-amber-300">
                          {mp.fecha_recepcion ? new Date(mp.fecha_recepcion).toLocaleDateString('es-AR') : 'Registrada en Silo'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Operario Dosificador:</span>
                        <span className="text-slate-300 font-medium">{mp.operario_registro}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Fecha/Hora Dosificación:</span>
                        <span className="font-mono text-slate-400">
                          {mp.timestamp_consumo ? new Date(mp.timestamp_consumo).toLocaleString('es-AR') : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 text-sm bg-slate-950 rounded-xl border border-slate-800">
                No se registraron consumos de materias primas para esta orden.
              </div>
            )}
          </div>

          {/* SECCIÓN B: PROCESO INTERNO (CONTROLES DE CALIDAD Y LÍNEA DE TIEMPO) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Controles de Calidad Bromatológica Aprobados */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Controles de Calidad y Laboratorio Aprobados
              </h3>

              {data.controles_calidad && data.controles_calidad.length > 0 ? (
                <div className="space-y-4">
                  {data.controles_calidad.map((cc) => (
                    <div key={cc.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <span className="text-xs font-mono text-slate-400">
                          Fecha Ensayo: {new Date(cc.fecha_control).toLocaleString('es-AR')}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                          cc.resultado === 'CONFORME'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/60'
                            : 'bg-rose-950 text-rose-400 border border-rose-700/60'
                        }`}>
                          ✓ {cc.resultado}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                          <span className="text-[11px] text-slate-400 block">{cc.parametro_1_nombre}</span>
                          <span className="font-mono text-base font-extrabold text-cyan-400">{cc.parametro_1_valor}</span>
                        </div>
                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                          <span className="text-[11px] text-slate-400 block">{cc.parametro_2_nombre}</span>
                          <span className="font-mono text-base font-extrabold text-amber-400">{cc.parametro_2_valor}</span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-300 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-blue-400" />
                        <span>Auditor / Bromatólogo: <strong className="text-white">{cc.auditor_nombre}</strong></span>
                      </div>

                      {cc.observaciones && (
                        <div className="text-xs bg-slate-900/70 p-2.5 rounded-lg text-slate-400 border border-slate-800/80 italic">
                          "{cc.observaciones}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs bg-slate-950 rounded-xl border border-slate-800">
                  El lote aún no registra ensayos de laboratorio cerrados.
                </div>
              )}
            </div>

            {/* Línea de Tiempo de Proceso Interno (Máquinas y Operarios) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-blue-400" />
                Proceso Interno: Máquinas, Etapas y Operarios
              </h3>
              <div className="relative border-l-2 border-slate-800 ml-3 space-y-6">
                {data.historial_eventos?.map((evento) => (
                  <div key={evento.id} className="relative pl-6">
                    <span className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-blue-900 border-2 border-blue-500"></span>
                    <div className="text-xs font-mono text-slate-500 mb-0.5">
                      {new Date(evento.timestamp_evento).toLocaleString('es-AR')}
                    </div>
                    <div className="font-bold text-slate-100 text-sm">{evento.etapa_nombre}</div>
                    <div className="text-xs text-blue-400 font-medium mt-0.5">
                      Punto: {evento.punto_captura_nombre} ({evento.codigo_punto})
                    </div>
                    {evento.linea_equipo && (
                      <div className="text-xs text-amber-300 font-mono mt-0.5 flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5" /> Máquina / Equipo: {evento.linea_equipo}
                      </div>
                    )}
                    <div className="text-xs text-slate-300 mt-0.5">
                      Operario a cargo: <strong>{evento.operario_nombre}</strong>
                    </div>
                    {evento.observaciones && (
                      <div className="text-[11px] bg-slate-950 p-2.5 rounded-lg text-slate-400 border border-slate-800 mt-1.5">
                        {evento.observaciones}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          2. VISTA FORWARD (HACIA ADELANTE: UBICACIÓN, DESTINATARIOS, DESPACHO)
         ===================================================================== */}
      {data && activeTab === 'FORWARD' && data.lote_mp && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Origen y Resumen de Impacto en Mercado */}
          <div className="bg-indigo-950/20 border border-indigo-800/50 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div>
                <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">
                  2. Escaneo Hacia Adelante (Forward / Tracking de Mercado y Recall)
                </h2>
                <div className="text-2xl font-extrabold text-white">
                  Insumo Base: {data.materia_prima} ({data.lote_mp})
                </div>
                <div className="text-sm text-slate-300 mt-1">
                  Proveedor: <strong className="text-white">{data.proveedor}</strong>
                  {data.fecha_recepcion && (
                    <span className="ml-3 text-xs font-mono text-slate-400">
                      Recepción: {new Date(data.fecha_recepcion).toLocaleDateString('es-AR')}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <Badge estado={data.estado_lote_mp} />
                {hasRole(['ADMIN', 'SUPERVISOR']) && (
                  <Button
                    variant="primary"
                    icon={ShieldAlert}
                    className="bg-rose-600 hover:bg-rose-700 text-white border-rose-500"
                    onClick={handleBloqueoPreventivo}
                    isLoading={bloqueando}
                  >
                    Aplicar Bloqueo Preventivo (Recall)
                  </Button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-indigo-900/40">
              <div className="bg-slate-950/70 p-4 rounded-xl text-center border border-slate-800">
                <Box className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                <div className="text-2xl font-mono font-bold text-white">{data.productos_afectados?.length || 0}</div>
                <div className="text-xs text-slate-400 uppercase">Lotes PT Rastreados</div>
              </div>
              <div className="bg-slate-950/70 p-4 rounded-xl text-center border border-slate-800">
                <Users className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <div className="text-2xl font-mono font-bold text-white">{data.total_clientes_notificar || 0}</div>
                <div className="text-xs text-slate-400 uppercase">Destinatarios / Clientes</div>
              </div>
              <div className="bg-slate-950/70 p-4 rounded-xl text-center border border-slate-800">
                <Truck className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <div className="text-2xl font-mono font-bold text-white">{data.total_unidades_despachadas || 0}</div>
                <div className="text-xs text-slate-400 uppercase">Unidades Entregadas</div>
              </div>
            </div>
          </div>

          {/* Detalle de Lotes PT, Ubicación Actual, Destinatarios y Datos de Despacho */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Truck className="w-5 h-5 text-emerald-400" />
              Ubicación en Cadena Logística, Destinatarios y Datos de Despacho
            </h3>
            
            <div className="space-y-6">
              {data.productos_afectados?.map((pt) => (
                <div key={pt.codigo_lote_pt} className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                  {/* Cabecera del Lote y Eslabón de la Cadena */}
                  <div className="p-5 bg-slate-900/80 border-b border-slate-800 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-extrabold text-white">{pt.producto}</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/50">
                          {pt.codigo_lote_pt}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-300">
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                          <MapPin className="w-4 h-4" />
                          Eslabón Actual: {pt.eslabon_cadena}
                        </span>
                        <span className="text-slate-400">
                          Ubicación Física: <strong className="text-slate-200">{pt.ubicacion_actual}</strong>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge estado={pt.estado} />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setBusqueda(pt.codigo_lote_pt);
                          handleTabChange('BACKWARD');
                        }}
                      >
                        Ver Origen (Backward)
                      </Button>
                    </div>
                  </div>
                  
                  {/* Lista de Destinatarios y Datos Logísticos de Transporte */}
                  {pt.clientes_destinatarios && pt.clientes_destinatarios.length > 0 ? (
                    <div className="p-5 space-y-4">
                      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-4 h-4" />
                        Destinatarios Comerciales y Guías de Despacho Registradas
                      </h4>
                      <div className="grid grid-cols-1 gap-4">
                        {pt.clientes_destinatarios.map((d, i) => (
                          <div key={i} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 border-b border-slate-800 pb-3">
                              <div>
                                <div className="text-base font-extrabold text-white flex items-center gap-2">
                                  {d.cliente}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                  CUIT: <span className="font-mono text-slate-300">{d.cuit}</span> | Dirección: <strong className="text-slate-200">{d.direccion}</strong>
                                  {d.contacto_telefono && ` | Tel: ${d.contacto_telefono}`}
                                </div>
                              </div>
                              <div className="bg-emerald-950/50 border border-emerald-700/50 px-3 py-1.5 rounded-lg text-right shrink-0">
                                <div className="font-mono text-base font-extrabold text-emerald-400">
                                  {d.cantidad_entregada} {pt.unidad_medida || 'Unid'}
                                </div>
                                <div className="text-[10px] text-emerald-300 uppercase font-bold">Entregado</div>
                              </div>
                            </div>

                            {/* Datos de Despacho: Remito, Guía, Fecha, Patente y Cadena de Frío */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                                <span className="text-slate-500 block">Remito / Guía Transporte:</span>
                                <span className="font-mono font-bold text-amber-300">{d.remito}</span>
                                <span className="font-mono text-[11px] text-slate-400 block">Guía: {d.guia_transporte}</span>
                              </div>
                              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                                <span className="text-slate-500 block">Fecha Salida de Fábrica:</span>
                                <span className="font-mono font-semibold text-slate-200">
                                  {new Date(d.fecha_despacho).toLocaleString('es-AR')}
                                </span>
                              </div>
                              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                                <span className="text-slate-500 block">Vehículo y Patente:</span>
                                <span className="font-mono font-bold text-blue-400">Dominio: {d.patente_vehiculo}</span>
                                <span className="text-[11px] text-slate-400 block">{d.vehiculo} ({d.chofer})</span>
                              </div>
                              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                                <span className="text-slate-500 block">Condiciones Envío / Frío:</span>
                                <span className="font-mono font-semibold text-cyan-300 flex items-center gap-1">
                                  <Thermometer className="w-3.5 h-3.5" /> {d.condicion_envio}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 bg-slate-950/60 text-xs text-slate-400 flex items-center justify-between">
                      <div>
                        <strong className="text-slate-200">En Stock Central de Fábrica:</strong> Este lote se encuentra almacenado en <strong>{pt.ubicacion_actual}</strong> y aún no registra salidas hacia clientes externos.
                      </div>
                      <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 font-mono text-slate-400">
                        Sin despachos externos
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trazabilidad;
