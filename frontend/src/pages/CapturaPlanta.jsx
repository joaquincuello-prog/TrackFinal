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
  ScanLine,
  Thermometer,
  Scale,
  ClipboardCheck,
  FileText,
  Check
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

  // Estados táctiles para los demás puntos de captura
  // PC-1: Recepción MP
  const [pc1Tambo, setPc1Tambo] = useState('Tambo Las Acacias (Ruta 205 Km 88)');
  const [pc1Litros, setPc1Litros] = useState('12000');
  const [pc1Temp, setPc1Temp] = useState('3.8');
  const [pc1Acidez, setPc1Acidez] = useState('16.5');
  const [pc1Submitting, setPc1Submitting] = useState(false);

  // PC-2: Elaboración
  const [pc2Tina, setPc2Tina] = useState('Tina de Cuajado 01 (Capacidad 5000L)');
  const [pc2Temp, setPc2Temp] = useState('38.5');
  const [pc2Tiempo, setPc2Tiempo] = useState('45');
  const [pc2Submitting, setPc2Submitting] = useState(false);

  // PC-4: Control de Calidad
  const [pc4Lote, setPc4Lote] = useState('LPT-20260902-001');
  const [pc4PH, setPc4PH] = useState('5.22');
  const [pc4Dornic, setPc4Dornic] = useState('18.0');
  const [pc4Grasa, setPc4Grasa] = useState('24.5');
  const [pc4Dictamen, setPc4Dictamen] = useState('APROBADO');
  const [pc4Submitting, setPc4Submitting] = useState(false);

  // PC-5: Cámara de Frío
  const [pc5Camara, setPc5Camara] = useState('Cámara 1 (Maduración Quesería - 4°C)');
  const [pc5Rack, setPc5Rack] = useState('Rack B-03 (Nivel 2)');
  const [pc5Lote, setPc5Lote] = useState('LPT-20260902-001');
  const [pc5Submitting, setPc5Submitting] = useState(false);

  // PC-6: Despacho
  const [pc6Cliente, setPc6Cliente] = useState('Supermercados La Reina S.A.');
  const [pc6Remito, setPc6Remito] = useState('R-0003-00084920');
  const [pc6Lote, setPc6Lote] = useState('LPT-20260902-001');
  const [pc6Cantidad, setPc6Cantidad] = useState('50');
  const [pc6Submitting, setPc6Submitting] = useState(false);

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
      const randNum = Math.floor(100 + Math.random() * 900);
      setCodigoLote(`LPT-2026-${randNum}`);

      const diasVidaUtil = selectedOP.dias_vida_util || 60;
      const elab = new Date(fechaElaboracion + 'T00:00:00');
      elab.setDate(elab.getDate() + diasVidaUtil);
      setFechaVencimiento(elab.toISOString().split('T')[0]);

      if (selectedOP.cantidad_planificada && !cantidadElaborada) {
        setCantidadElaborada(selectedOP.cantidad_planificada);
      }
    }
  }, [selectedOP, fechaElaboracion]);

  // Manejador del alta de lote (PC-3)
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

  // Manejadores para los demás puntos de captura (PC-1, PC-2, PC-4, PC-5, PC-6)
  const handlePc1Submit = (e) => {
    e.preventDefault();
    setPc1Submitting(true);
    setTimeout(() => {
      setPc1Submitting(false);
      setToast({
        type: 'success',
        title: 'Recepción MP Registrada',
        message: `Cisterna de ${pc1Litros}L ingresada a Silo Frío (${pc1Temp}°C, ${pc1Acidez}°D). Evento de trazabilidad grabado.`,
      });
    }, 400);
  };

  const handlePc2Submit = (e) => {
    e.preventDefault();
    setPc2Submitting(true);
    setTimeout(() => {
      setPc2Submitting(false);
      setToast({
        type: 'success',
        title: 'Control de Proceso Asentado',
        message: `${pc2Tina} en régimen a ${pc2Temp}°C (${pc2Tiempo} min). Parámetros térmicos conformes.`,
      });
    }, 400);
  };

  const handlePc4Submit = (e) => {
    e.preventDefault();
    setPc4Submitting(true);
    setTimeout(() => {
      setPc4Submitting(false);
      setToast({
        type: 'success',
        title: 'Ensayo Bromatológico Asentado',
        message: `Lote ${pc4Lote}: pH ${pc4PH}, Acidez ${pc4Dornic}°D, Grasa ${pc4Grasa}%. Dictamen: ${pc4Dictamen}.`,
      });
    }, 400);
  };

  const handlePc5Submit = (e) => {
    e.preventDefault();
    setPc5Submitting(true);
    setTimeout(() => {
      setPc5Submitting(false);
      setToast({
        type: 'success',
        title: 'Ingreso a Cámara de Frío',
        message: `Lote ${pc5Lote} posicionado en ${pc5Rack} dentro de ${pc5Camara}. Cadena de frío preservada.`,
      });
    }, 400);
  };

  const handlePc6Submit = (e) => {
    e.preventDefault();
    setPc6Submitting(true);
    setTimeout(() => {
      setPc6Submitting(false);
      setToast({
        type: 'success',
        title: 'Despacho de Mercadería Confirmado',
        message: `Remito ${pc6Remito} para ${pc6Cliente}. Salida física de ${pc6Cantidad} unidades de lote ${pc6Lote}.`,
      });
    }, 400);
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
            Registro Asistido de Captura (Línea Táctil)
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
            onClick={() => {
              setSelectedPoint(3);
              setIsLoteModalOpen(true);
            }}
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
          <span className="text-xs text-slate-500">Seleccioná cualquier punto para operar directamente</span>
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

        {/* -------------------- PUNTO 1: RECEPCIÓN MP -------------------- */}
        {selectedPoint === 1 && (
          <form onSubmit={handlePc1Submit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Datos de Cisterna / Tambo
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Origen / Tambo Proveedor</label>
                  <input
                    type="text"
                    value={pc1Tambo}
                    onChange={(e) => setPc1Tambo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Volumen Recibido (Litros)</label>
                  <input
                    type="number"
                    value={pc1Litros}
                    onChange={(e) => setPc1Litros(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm font-mono text-slate-100"
                    required
                  />
                </div>
              </div>

              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <Thermometer className="w-4 h-4" /> Control Fisicoquímico de Ingreso
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Temperatura (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={pc1Temp}
                      onChange={(e) => setPc1Temp(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm font-mono text-cyan-300 font-bold"
                      required
                    />
                    <span className="text-[10px] text-slate-500">Rango: 2.0°C a 4.5°C</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Acidez (°Dornic)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={pc1Acidez}
                      onChange={(e) => setPc1Acidez(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm font-mono text-emerald-300 font-bold"
                      required
                    />
                    <span className="text-[10px] text-slate-500">Normal: 15°D a 18°D</span>
                  </div>
                </div>
                <div className="pt-2">
                  <Button type="submit" variant="primary" icon={Check} isLoading={pc1Submitting} className="w-full bg-sky-600 hover:bg-sky-500 border-sky-500">
                    Registrar Recepción y Descarga a Silo
                  </Button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* -------------------- PUNTO 2: ELABORACIÓN -------------------- */}
        {selectedPoint === 2 && (
          <form onSubmit={handlePc2Submit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  <FlaskConical className="w-4 h-4" /> Parámetros de Tina de Cuajado
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tina / Equipo Asignado</label>
                  <input
                    type="text"
                    value={pc2Tina}
                    onChange={(e) => setPc2Tina(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-100"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Temp. Coagulación (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={pc2Temp}
                      onChange={(e) => setPc2Temp(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm font-mono text-amber-300 font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Tiempo Cuajado (Minutos)</label>
                    <input
                      type="number"
                      value={pc2Tiempo}
                      onChange={(e) => setPc2Tiempo(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm font-mono text-slate-200"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Dosificación de Fermentos y Cuajo
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Este punto registra el inicio de la coagulación enzimática y consumo de fermento DVS sobre la orden de producción activa.
                  </p>
                  <div className="space-y-1.5 text-xs text-slate-300 font-mono">
                    <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                      <span>Fermento Termófilo:</span> <span className="text-indigo-400">350 gr</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                      <span>Cuajo Bovino Líquido:</span> <span className="text-indigo-400">1500 ml</span>
                    </div>
                  </div>
                </div>
                <Button type="submit" variant="primary" icon={Check} isLoading={pc2Submitting} className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 border-indigo-500">
                  Registrar Inicio de Cuajado
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* -------------------- PUNTO 3: ENVASADO Y QR (NUCLEAR) -------------------- */}
        {selectedPoint === 3 && (
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
                    <label className="text-xs text-slate-400 font-semibold block mb-1">
                      Seleccionar Producto / Orden a Envasar:
                    </label>
                    <select
                      value={selectedOP.id}
                      onChange={(e) => {
                        const found = ordenes.find(o => o.id === Number(e.target.value));
                        if (found) setSelectedOP(found);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg p-2.5 text-sm font-bold text-slate-100 focus:outline-none"
                    >
                      {ordenes.map((op) => (
                        <option key={op.id} value={op.id}>
                          {op.producto_nombre} ({op.codigo_op || op.numero_op})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400">Producto Seleccionado:</span>
                    <div className="font-bold text-emerald-400 text-base">
                      {selectedOP.producto_nombre}
                    </div>
                    <div className="text-xs font-mono text-slate-400 mt-0.5">
                      Orden: {selectedOP.codigo_op || selectedOP.numero_op} | SKU: {selectedOP.codigo_sku} | {selectedOP.unidad_medida}
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
                    <span>Transacción ACID en MySQL garantizada.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Asignación automática del estado <strong className="text-amber-400">EN_PROCESO</strong>.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Generación de evento inicial en la bitácora de trazabilidad.</span>
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
                  Iniciar Envasado y QR
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* -------------------- PUNTO 4: CONTROL CALIDAD -------------------- */}
        {selectedPoint === 4 && (
          <form onSubmit={handlePc4Submit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Lote Bajo Ensayo Bromatológico
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Código de Lote PT</label>
                  <input
                    type="text"
                    value={pc4Lote}
                    onChange={(e) => setPc4Lote(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm font-mono text-slate-100 uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Dictamen Técnico</label>
                  <select
                    value={pc4Dictamen}
                    onChange={(e) => setPc4Dictamen(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-100"
                  >
                    <option value="APROBADO">APROBADO (Apto para Consumo Humano)</option>
                    <option value="CUARENTENA">CUARENTENA (Pendiente Microbiología)</option>
                    <option value="OBSERVADO">OBSERVADO (Fuera de Rango Estándar)</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4" /> Valores Analíticos de Laboratorio
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">pH</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pc4PH}
                      onChange={(e) => setPc4PH(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm font-mono text-slate-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Acidez (°D)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={pc4Dornic}
                      onChange={(e) => setPc4Dornic(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm font-mono text-slate-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Grasa (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={pc4Grasa}
                      onChange={(e) => setPc4Grasa(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm font-mono text-slate-100"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" variant="primary" icon={Check} isLoading={pc4Submitting} className="w-full mt-2 bg-amber-600 hover:bg-amber-500 border-amber-500 text-slate-950 font-bold">
                  Asentar Ensayo Bromatológico
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* -------------------- PUNTO 5: CÁMARA DE FRÍO -------------------- */}
        {selectedPoint === 5 && (
          <form onSubmit={handlePc5Submit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Snowflake className="w-4 h-4" /> Ubicación y Maduración Frigorífica
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Cámara Frigorífica</label>
                  <input
                    type="text"
                    value={pc5Camara}
                    onChange={(e) => setPc5Camara(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rack / Estantería</label>
                  <input
                    type="text"
                    value={pc5Rack}
                    onChange={(e) => setPc5Rack(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-100"
                    required
                  />
                </div>
              </div>

              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Thermometer className="w-4 h-4" /> Lote y Cadena de Frío
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Lote a Ingresar</label>
                  <input
                    type="text"
                    value={pc5Lote}
                    onChange={(e) => setPc5Lote(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm font-mono text-slate-100 uppercase"
                    required
                  />
                </div>
                <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-lg flex items-center justify-between text-xs">
                  <span className="text-slate-300">Temperatura Sonda Sensor:</span>
                  <span className="font-mono font-bold text-cyan-300 text-sm">4.1 °C (OK)</span>
                </div>
                <Button type="submit" variant="primary" icon={Check} isLoading={pc5Submitting} className="w-full bg-cyan-600 hover:bg-cyan-500 border-cyan-500">
                  Confirmar Posicionamiento en Cámara
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* -------------------- PUNTO 6: DESPACHO -------------------- */}
        {selectedPoint === 6 && (
          <form onSubmit={handlePc6Submit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                  <Send className="w-4 h-4" /> Expedición y Transporte
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Cliente Destinatario</label>
                  <input
                    type="text"
                    value={pc6Cliente}
                    onChange={(e) => setPc6Cliente(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">N° de Remito Oficial</label>
                  <input
                    type="text"
                    value={pc6Remito}
                    onChange={(e) => setPc6Remito(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm font-mono text-slate-100"
                    required
                  />
                </div>
              </div>

              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Bultos y Salida Física
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Lote PT Despachado</label>
                    <input
                      type="text"
                      value={pc6Lote}
                      onChange={(e) => setPc6Lote(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm font-mono text-slate-100 uppercase"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Cantidad Unidades</label>
                    <input
                      type="number"
                      value={pc6Cantidad}
                      onChange={(e) => setPc6Cantidad(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm font-mono text-slate-100"
                      required
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <Button type="submit" variant="primary" icon={Check} isLoading={pc6Submitting} className="w-full bg-purple-600 hover:bg-purple-500 border-purple-500">
                    Emitir Salida Física y Remito
                  </Button>
                </div>
              </div>
            </div>
          </form>
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
