import React from 'react';

const ESTADO_CONFIG = {
  EN_PROCESO: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
    label: 'En Proceso',
  },
  CUARENTENA: {
    bg: 'bg-orange-500/15',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    dot: 'bg-orange-400',
    label: 'Cuarentena',
  },
  APROBADO: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
    label: 'Aprobado',
  },
  RECHAZADO: {
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    dot: 'bg-rose-400',
    label: 'Rechazado',
  },
  DESPACHADO: {
    bg: 'bg-sky-500/15',
    text: 'text-sky-400',
    border: 'border-sky-500/30',
    dot: 'bg-sky-400',
    label: 'Despachado',
  },
  BLOQUEADO: {
    bg: 'bg-red-600/20',
    text: 'text-red-300',
    border: 'border-red-600/40',
    dot: 'bg-red-500 animate-ping',
    label: 'Bloqueado',
  },
};

export const Badge = ({ estado, showDot = true, size = 'normal' }) => {
  const config = ESTADO_CONFIG[estado] || {
    bg: 'bg-slate-800',
    text: 'text-slate-300',
    border: 'border-slate-700',
    dot: 'bg-slate-400',
    label: estado || 'Indefinido',
  };

  const sizeClasses = size === 'small' 
    ? 'text-xs px-2 py-0.5' 
    : 'text-xs font-semibold px-2.5 py-1 tracking-wide';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono uppercase ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      )}
      {config.label}
    </span>
  );
};

export default Badge;
