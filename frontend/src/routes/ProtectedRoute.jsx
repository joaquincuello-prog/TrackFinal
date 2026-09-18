import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, isAuthenticated, initialLoading } = useAuth();

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 font-mono text-sm tracking-wider uppercase">
          Verificando credenciales de planta...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.rol)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border-2 border-rose-600/40 rounded-xl p-6 shadow-2xl text-center">
          <div className="w-16 h-16 bg-rose-950/60 border border-rose-500/50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-400">
            <ShieldAlert className="w-9 h-9" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">Acceso Restringido por Perfil</h2>
          <p className="text-slate-300 text-sm mb-4">
            Tu perfil actual es <span className="font-bold text-blue-400 font-mono">[{user?.rol}]</span>. 
            Este módulo requiere uno de los siguientes roles autorizados:
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {allowedRoles.map((role) => (
              <span key={role} className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-amber-400 font-semibold">
                {role}
              </span>
            ))}
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg flex items-center gap-2 border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" /> Volver atrás
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
