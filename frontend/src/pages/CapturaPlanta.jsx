import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  FlaskConical, 
  QrCode, 
  ShieldCheck, 
  Snowflake, 
  Send, 
  Plus, 
  Calendar, 
  Clock, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  ScanLine 
} from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import QRCardModal from '../components/QRCardModal';
import { produccionService } from '../services/produccionService';
import { lotesService } from '../services/lotesService';
import { useAuth } from '../hooks/useAuth';

export const CapturaPlanta = () => {
  const { user } = useAuth();

  // Estados de Puntos de Captura
  const [selectedPoint, setSelectedPoint] = useState(3); // Por defecto Punto 3 (Envasado y QR)
  const [ordenes, setOrdenes] = useState([]);
  const [loadingOrdenes, setLoadingOrdenes] = useState(false);

  // Estados para Modal de Alta Lote PT (Punto 3)
  const [isLoteModalOpen, setIsLoteModalOpen] = useState(false);
  const [selectedOP, setSelectedOP] = useState(null);
  const [codigoLote, setCodigoLote] = useState('');
  const [cantidadElaborada, setCantidadElaborada] = useState('');
  const [fechaElaboracion, setFechaElaboracion] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [ubicacionDeposito, setUbicacionDeposito] = useState('Cámara de Frío 1 (Estantería A-03)');
  const [submittingLote, setSubmittingLote] = useState(false);
  const [formError, setFormError] = useState(null);

  // Estados para QR Card Modal y Toast
  const [nuevoLoteCreado, setNuevoLoteCreado] = useState(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Puntos de Captura del Circuito Industrial (KIT AVZ-03)
  const PUNTOS_CAPTURA = [
    {
      id: 1,
      codigo: 'PC-1',
      nombre: 'Recepción MP',
      desc: 'Ingreso cisterna de tambo, control de acidez y filtrado',
      icon: Truck,
      color: 'border-sky-500/40 hover:border-sky-400 bg-sky-950/20 text-sky-400',
      activeColor: 'ring-2 ring-sky-400 bg-sky-900/40 border-sky-400',
      badge: 'Insumos',
    },
    {
      id: 2,
      codigo: 'PC-2',
      nombre: 'Elaboración',
      desc: 'Pasteurización, cuajado, corte y dosificación en tina',
      icon: FlaskConical,
      color: 'border-indigo-500/40 hover:border-indigo-400 bg-indigo-950/20 text-indigo-400',
      activeColor: 'ring-2 ring-indigo-400 bg-indigo-900/40 border-indigo-400',
      badge: 'Proceso',
    },
    {
      id: 3,
      codigo: 'PC-3',
      nombre: 'Envasado y QR',
      desc: 'Fraccionado, pesaje y generación atómica de Rótulo QR',
      icon: QrCode,
      color: 'border-emerald-500/50 hover:border-emerald-400 bg-emerald-950/25 text-emerald-400',
      activeColor: 'ring-2 ring-emerald-400 bg-emerald-900/40 border-emerald-400',
      badge: '★ KIT AVZ-03',
      isPrimary: true,
    },
    {
      id: 4,
      codigo: 'PC-4',
      nombre: 'Control Calidad',
      desc: 'Liberación bromatológica, pH, grasa y microbiología',
      icon: ShieldCheck,
      color: 'border-amber-500/40 hover:border-amber-400 bg-amber-950/20 text-amber-400',
      activeColor: 'ring-2 ring-amber-400 bg-amber-900/40 border-amber-400',
      badge: 'Bromatología',
    },
    {
      id: 5,
      codigo: 'PC-5',
      nombre: 'Cámara de Frío',
      desc: 'Ingreso a depósito frigorífico (4°C a 6°C)',
      icon: Snowflake,
      color: 'border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/20 text-cyan-400',
      activeColor: 'ring-2 ring-cyan-400 bg-cyan-900/40 border-cyan-400',
      badge: 'Maduración',
    },
    {
      id: 6,
      codigo: 'PC-6',
      nombre: 'Despacho',
      desc: 'Control de expedición, remito y lectura QR a transporte',
      icon: Send,
      color: 'border-purple-500/40 hover:border-purple-400 bg-purple-950/20 text-purple-400',
      activeColor: 'ring-2 ring-purple-400 bg-purple-900/40 border-purple-400',
      badge: 'Expedición',
    },
  ];

  // Cargar órdenes de producción al montar
  useEffect(() => {
    const fetchOrdenes = async () => {
      setLoadingOrdenes(true);
      try {
        const res = await produccionService.getOrdenes();
        if (res && res.data) {
          setOrdenes(res.data);
          // Si hay órdenes, preseleccionar la primera activa
          const activa = res.data.find(o => o.estado === 'EN_PROCESO' || o.estado === 'CREADA') || res.data[0];
          if (activa) {
            setSelectedOP(activa);
          }
        }
      } catch (err) {
        console.warn('No se pudieron cargar las órdenes de producción:', err.message);
      } finally {
        setLoadingOrdenes(false);
      }
    };

    fetchOrdenes();
  }, []);

  // Calcular código de lote sugerido y fecha de vencimiento cuando cambia la OP o la fecha
  useEffect(() => {
    if (selectedOP) {
      // Generar código de lote sugerido LPT-2026-XXX
      const randNum = Math.floor(100 + Math.random() * 900);
      setCodigoLote(`LPT-2026-${randNum}`);

      // Calcular vencimiento según vida útil
      const diasVidaUtil = selectedOP.dias_vida_util || 60;
      const elab = new Date(fechaElaboracion + 'T00:00:00');
      elab.setDate(elab.getDate() + diasVidaUtil);
      setFechaVencimiento(elab.toISOString().split('T')[0]);

      if (selectedOP.cantidad_planificada && !cantidadElaborada) {
        setCantidadElaborada(selectedOP.cantidad_planificada);
      }
    }
  }, [selectedOP, fechaElaboracion]);

  // Manejador del alta de lote
  const handleCrearLote = async (e) => {
    e.preventDefault();
    if (!selectedOP || !codigoLote || !cantidadElaborada || !fechaElaboracion) {
      setFormError('Por favor completá todos los campos requeridos');
      return;
    }

    setSubmittingLote(true);
    setFormError(null);

    try {
      const payload = {
        orden_produccion_id: selectedOP.id,
        codigo_lote_pt: codigoLote.trim().toUpperCase(),
        cantidad_elaborada: Number(cantidadElaborada),
        fecha_elaboracion: fechaElaboracion,
        fecha_vencimiento: fechaVencimiento,
        ubicacion_deposito: ubicacionDeposito,
      };

      const res = await lotesService.crearLotePT(payload);
      
      if (res && res.success) {
        setIsLoteModalOpen(false);
        setToast({
          type: 'success',
          title: '¡Lote PT Generado con Éxito!',
          message: `Código ${res.data.codigo_lote_pt} registrado y rótulo QR generado.`,
        });

        // Configurar el nuevo lote para abrir el modal del rótulo QR
        setNuevoLoteCreado({
          ...res.data,
          producto_nombre: selectedOP.producto_nombre,
          producto_sku: selectedOP.codigo_sku,
          unidad_medida: selectedOP.unidad_medida,
          temperatura_conservacion: selectedOP.temperatura_conservacion,
        });
        setIsQRModalOpen(true);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Error al crear lote de producto terminado';
      setFormError(msg);
    } finally {
      setSubmittingLote(false);
    }
  };

  const activePointData = PUNTOS_CAPTURA.find(p => p.id === selectedPoint);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* Cabecera de la Terminal */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              Terminal Operativa de Planta
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Registro Asistido de Captura
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Operario en turno: <span className="font-bold text-slate-200">{user?.nombre} {user?.apellido}</span> ({user?.legajo}) — Planta Villa María
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="success"
            size="lg"
            icon={QrCode}
            onClick={() => setIsLoteModalOpen(true)}
            className="shadow-xl shadow-emerald-950/50"
          >
            + Envasar Lote PT con QR
          </Button>
        </div>
      </div>

      {/* Grid Táctil de Puntos de Captura (Ergonomía Industrial) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-slate-400">
            1. Puntos de Captura en Línea de Producción (Táctil)
          </h2>
          <span className="text-xs text-slate-500">Seleccioná un punto para operar</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {PUNTOS_CAPTURA.map((point) => {
            const Icon = point.icon;
            const isSelected = selectedPoint === point.id;

            return (
              <button
                key={point.id}
                onClick={() => setSelectedPoint(point.id)}
                className={`flex flex-col items-center text-center p-4 rounded-xl border transition-all duration-150 touch-target relative select-none ${
                  isSelected
                    ? point.activeColor + ' shadow-lg scale-[1.02]'
                    : point.color + ' bg-slate-900/60'
                }`}
              >
                {point.isPrimary && (
                  <span className="absolute -top-2 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500 text-slate-950 tracking-wider shadow">
                    NUCLEAR
                  </span>
                )}
                <div className="w-12 h-12 rounded-xl bg-slate-950/60 border border-current/20 flex items-center justify-center mb-2.5 shadow-inner">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono font-bold">{point.codigo}</span>
                <span className="text-sm font-bold mt-0.5 leading-tight text-slate-100">
                  {point.nombre}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                  {point.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel Dinámico del Punto de Captura Seleccionado */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
              {activePointData && <activePointData.icon className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs bg-blue-950 text-blue-400 px-2 py-0.5 rounded border border-blue-800/40">
                  {activePointData?.codigo}
                </span>
                <h3 className="text-lg font-bold text-white">
                  {activePointData?.nombre}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {activePointData?.desc}
              </p>
            </div>
          </div>

          {selectedPoint === 3 && (
            <Button
              variant="primary"
              size="normal"
              icon={Plus}
              onClick={() => setIsLoteModalOpen(true)}
            >
              Nuevo Registro en Este Punto
            </Button>
          )}
        </div>

        {/* Contenido según el Punto Seleccionado */}
        {selectedPoint === 3 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tarjeta de Orden de Producción Activa */}
            <div className="bg-slate-950 rounded-xl p-5 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold uppercase text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  Orden de Producción en Línea
                </span>
                {selectedOP && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                    {selectedOP.estado}
                  </span>
                )}
              </div>

              {loadingOrdenes ? (
                <div className="py-8 text-center text-slate-500 font-mono text-xs">
                  Cargando órdenes de producción...
                </div>
              ) : selectedOP ? (
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-500">Orden:</span>
                    <div className="text-lg font-extrabold text-slate-100 font-mono">
                      {selectedOP.codigo_op}
                    </div>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400">Producto a Elaborar:</span>
                    <div className="font-bold text-slate-200">
                      {selectedOP.producto_nombre}
                    </div>
                    <div className="text-xs font-mono text-slate-500 mt-0.5">
                      SKU: {selectedOP.codigo_sku} | {selectedOP.unidad_medida}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                      <span className="text-slate-500 block">Línea:</span>
                      <span className="font-semibold text-slate-300">{selectedOP.linea_produccion}</span>
                    </div>
                    <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                      <span className="text-slate-500 block">Vida Útil:</span>
                      <span className="font-semibold text-emerald-400">{selectedOP.dias_vida_util} días</span>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={() => setIsLoteModalOpen(true)}
                    className="mt-2"
                  >
                    Fraccionar y Generar Rótulo QR
                  </Button>
                </div>
              ) : (
                <div className="py-6 text-center text-slate-500 text-xs">
                  No hay órdenes de producción cargadas.
                </div>
              )}
            </div>

            {/* Guía Operativa de Envasado */}
            <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-3">
                  <ScanLine className="w-3.5 h-3.5 text-emerald-400" />
                  Protocolo Nuclear del KIT AVZ-03
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  En el **Punto de Captura 3**, el sistema crea atómicamente el lote de producto terminado, calculando la fecha de vencimiento garantizada por la vida útil del producto e inyectando un **código QR con estructura JSONB** apto para lectura con escáneres industriales de planta.
                </p>

                <div className="mt-4 space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Transacción ACID en PostgreSQL garantizada.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Asignación automática del estado <strong className="text-amber-400">EN_PROCESO</strong>.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Generación de evento inicial en la tabla de trazabilidad.</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                <Button
                  variant="success"
                  size="normal"
                  icon={QrCode}
                  onClick={() => setIsLoteModalOpen(true)}
                >
                  Iniciar Envasado
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Info para los otros puntos de captura */
          <div className="py-8 text-center max-w-md mx-auto">
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Info className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-200">
              Punto Operativo {activePointData?.nombre} ({activePointData?.codigo})
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Las lecturas de este punto registran eventos cronológicos de trazabilidad en la cadena de frío y expedición.
            </p>
            <div className="mt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedPoint(3)}
              >
                Volver al Punto Nuclear (Punto 3 - Envasado QR)
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE ALTA RÁPIDA DE LOTE PT (PUNTO 3) */}
      <Modal
        isOpen={isLoteModalOpen}
        onClose={() => setIsLoteModalOpen(false)}
        title="Alta Rápida de Lote PT con Rótulo QR"
        subtitle="Punto de Captura 3: Línea de Fraccionamiento y Marcado"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCrearLote} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-950/80 border border-rose-600/50 rounded-lg text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Selección de Orden de Producción */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Orden de Producción Asociada
            </label>
            <select
              value={selectedOP?.id || ''}
              onChange={(e) => {
                const found = ordenes.find(o => o.id === Number(e.target.value));
                setSelectedOP(found);
              }}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg p-3 text-sm text-slate-100 focus:outline-none touch-target"
              required
            >
              {ordenes.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.codigo_op} — {op.producto_nombre} ({op.codigo_sku})
                </option>
              ))}
            </select>
          </div>

          {/* Código de Lote Sugerido */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Código de Lote PT (Único)
              </label>
              <input
                type="text"
                value={codigoLote}
                onChange={(e) => setCodigoLote(e.target.value)}
                placeholder="LPT-2026-001"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg p-3 text-sm text-slate-100 font-mono uppercase focus:outline-none touch-target"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Cantidad Elaborada ({selectedOP?.unidad_medida || 'Unid'})
              </label>
              <input
                type="number"
                step="0.01"
                value={cantidadElaborada}
                onChange={(e) => setCantidadElaborada(e.target.value)}
                placeholder="1000"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg p-3 text-sm text-slate-100 font-mono focus:outline-none touch-target"
                required
              />
            </div>
          </div>

          {/* Fechas: Elaboración y Cálculo Dinámico de Vencimiento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Fecha Elaboración
              </label>
              <input
                type="date"
                value={fechaElaboracion}
                onChange={(e) => setFechaElaboracion(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg p-3 text-sm text-slate-100 focus:outline-none touch-target"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Vencimiento (Automático)
              </label>
              <input
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="w-full bg-slate-950 border border-emerald-600/40 text-emerald-300 rounded-lg p-3 text-sm font-bold focus:outline-none touch-target"
                required
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                * Calculado a +{selectedOP?.dias_vida_util || 60} días según ficha técnica.
              </span>
            </div>
          </div>

          {/* Ubicación de Depósito / Cámara */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
              Destino en Cámara de Frío
            </label>
            <input
              type="text"
              value={ubicacionDeposito}
              onChange={(e) => setUbicacionDeposito(e.target.value)}
              placeholder="Cámara de Frío 1 - Estantería A-03"
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg p-3 text-sm text-slate-100 focus:outline-none touch-target"
            />
          </div>

          {/* Botonera de Acción */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              variant="secondary"
              onClick={() => setIsLoteModalOpen(false)}
              disabled={submittingLote}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="success"
              size="lg"
              isLoading={submittingLote}
              icon={QrCode}
            >
              Generar Lote y Rótulo QR
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL DE VISTA PREVIA DEL RÓTULO QR GENERADO */}
      {nuevoLoteCreado && (
        <QRCardModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          lote={nuevoLoteCreado}
        />
      )}
    </div>
  );
};

export default CapturaPlanta;
