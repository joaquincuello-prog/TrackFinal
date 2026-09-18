import React from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon, Home } from 'lucide-react';
import Button from '../components/Button';

export const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-amber-400 mb-4 shadow-xl">
        <AlertOctagon className="w-9 h-9" />
      </div>
      <h1 className="text-4xl font-extrabold text-white font-mono">404</h1>
      <h2 className="text-lg font-bold text-slate-300 mt-2">Página o Módulo no Encontrado</h2>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
        La ruta a la que intentás acceder no existe en la terminal de planta de Lácteos San Antonio S.A.
      </p>
      <Link to="/">
        <Button variant="primary" icon={Home}>
          Volver al Inicio
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
