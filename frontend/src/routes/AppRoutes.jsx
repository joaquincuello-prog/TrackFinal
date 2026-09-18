import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Layout
import MainLayout from '../layouts/MainLayout';

// Páginas
import Login from '../pages/Login';
import CapturaPlanta from '../pages/CapturaPlanta';
import LotesPT from '../pages/LotesPT';
import NotFound from '../pages/NotFound';

// Guarda
import ProtectedRoute from './ProtectedRoute';

// Redirección inteligente en la raíz según el rol
const RootRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.rol === 'OPERARIO') {
    return <Navigate to="/captura" replace />;
  }
  return <Navigate to="/lotes" replace />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Ruta Pública: Login */}
      <Route path="/login" element={<Login />} />

      {/* Rutas Protegidas en Layout Maestro */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Raíz del sistema */}
        <Route path="/" element={<RootRedirect />} />

        {/* Terminal de Captura Asistida en Planta (Puntos 1 a 6) */}
        <Route
          path="/captura"
          element={
            <ProtectedRoute allowedRoles={['OPERARIO', 'ADMIN']}>
              <CapturaPlanta />
            </ProtectedRoute>
          }
        />

        {/* Gestión de Lotes PT (QR, Estados, Filtros) */}
        <Route
          path="/lotes"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SUPERVISOR', 'OPERARIO', 'AUDITOR']}>
              <LotesPT />
            </ProtectedRoute>
          }
        />

        {/* Ruta 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
