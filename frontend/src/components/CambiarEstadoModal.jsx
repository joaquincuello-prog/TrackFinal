import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import Badge from './Badge';
import { lotesService } from '../services/lotesService';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

const ESTADOS_DISPONIBLES = [
  { id: 'EN_PROCESO', label: 'En Proceso (Planta)', desc: 'Envasado y controles preliminares' },
  { id: 'CUARENTENA', label: 'Cuarentena (Espera)', desc: 'A la espera de análisis bromatológicos / microbiológicos' },
  { id: 'APROBADO', label: 'Aprobado para Venta', desc: 'Liberado por control de calidad' },
  { id: 'RECHAZADO', label: 'Rechazado (No Conforme)', desc: 'Desvío de calidad. Lote no apto para consumo' },
  { id: 'BLOQUEADO', label: 'Bloqueado Cautelar', desc: 'Inmovilizado por protocolo de Recall o Auditoría' },
  { id: 'DESPACHADO', label: 'Despachado a Cliente', desc: 'Entregado a transporte o distribuidor' },
];

export const CambiarEstadoModal = ({
  isOpen,
  onClose,
  lote,
  onSuccess,
}) => {
  const [nuevoEstado, setNuevoEstado] = useState(lote?.estado || 'EN_PROCESO');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!lote) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (nuevoEstado === lote.estado) {
      setError('Debes seleccionar un estado diferente al actual');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await lotesService.cambiarEstado(lote.codigo_lote_pt, nuevoEstado, motivo);
      onSuccess?.(nuevoEstado);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Error al actualizar estado del lote';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestión de Estado de Lote PT"
      subtitle={`Lote: ${lote.codigo_lote_pt} | Producto: ${lote.producto_nombre || 'N/D'}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Estado Actual */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Estado Vigente:</span>
          <Badge estado={lote.estado} />
        </div>

        {/* Selector de Nuevo Estado */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Seleccionar Nuevo Estado Operativo / Calidad
          </label>
          <div className="grid grid-cols-1 gap-2">
            {ESTADOS_DISPONIBLES.map((est) => {
              const isSelected = nuevoEstado === est.id;
              const isCurrent = lote.estado === est.id;

              return (
                <label
                  key={est.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-500 shadow-md'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  } ${isCurrent ? 'opacity-50' : ''}`}
                >
                  <input
                    type="radio"
                    name="nuevoEstado"
                    value={est.id}
                    checked={isSelected}
                    onChange={(e) => setNuevoEstado(e.target.value)}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">
                        {est.label}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] text-slate-500 font-mono italic">(Actual)</span>
                      )}
                    </div>
                    <p className="text-slate-400 mt-0.5">{est.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Motivo u Observación Auditable */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
            Motivo / Dictamen de Liberación / Observaciones
          </label>
          <textarea
            rows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: Aprobado tras análisis fisicoquímico y microbiológico conforme (Acidez Dornic 16°D, pH 6.65)."
            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            * Esta acción quedará registrada en el historial cronológico de trazabilidad con tu legajo.
          </p>
        </div>

        {/* Alerta de Error */}
        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-600/50 rounded-lg text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            icon={CheckCircle2}
          >
            Confirmar Cambio de Estado
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CambiarEstadoModal;
