import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'normal',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 touch-target';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs min-h-[36px]',
    normal: 'px-4 py-2.5 text-sm min-h-[44px]',
    lg: 'px-5 py-3 text-base min-h-[50px] font-semibold',
    touch: 'px-6 py-4 text-base min-h-[56px] font-bold tracking-wide',
  }[size] || 'px-4 py-2.5 text-sm min-h-[44px]';

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 border border-blue-500/40',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 border border-emerald-500/40',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 border border-rose-500/40',
    warning: 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20 border border-amber-500/40',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm',
    ghost: 'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white',
    dark: 'bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-750',
  }[variant] || 'bg-blue-600 hover:bg-blue-500 text-white';

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${widthClass} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          <span>Procesando...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 mr-2 shrink-0" />}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
