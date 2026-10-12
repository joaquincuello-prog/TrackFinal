import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { 
  Factory, 
  Boxes, 
  LogOut, 
  Shield, 
  User, 
  Activity, 
  Wifi, 
  WifiOff,
  Menu,
  X,
  Network,
  ScanLine,
  BarChart3
} from 'lucide-react';
import QRScannerModal from '../components/QRScannerModal';

export const MainLayout = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [apiOnline, setApiOnline] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  // Monitor healthcheck of backend
  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        await api.get('/health', { timeout: 3000 });
        if (isMounted) setApiOnline(true);
      } catch {
        if (isMounted) setApiOnline(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/captura',
      label: 'Terminal de Planta',
      icon: Factory,
      roles: ['OPERARIO', 'ADMIN'],
      badge: 'Puntos 1-6',
    },
    {
      to: '/lotes',
      label: 'Gestión de Lotes PT',
      icon: Boxes,
      roles: ['ADMIN', 'SUPERVISOR', 'OPERARIO', 'AUDITOR'],
      badge: 'Estados',
    },
    {
      to: '/trazabilidad',
      label: 'Trazabilidad y Recall',
      icon: Network,
      roles: ['ADMIN', 'SUPERVISOR', 'OPERARIO', 'AUDITOR'],
      badge: 'KIT AVZ-03',
    },
    {
      to: '/dashboard',
      label: 'Dashboard KPIs',
      icon: BarChart3,
      roles: ['ADMIN', 'SUPERVISOR', 'OPERARIO', 'AUDITOR'],
      badge: 'BI',
    }
  ];

  const filteredNavItems = navItems.filter(item => 
    !item.roles || item.roles.includes(user?.rol)
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100">
      {/* Top Industrial Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand / Company */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 border border-blue-400/30 flex items-center justify-center shadow-lg shadow-blue-600/30">
                <Factory className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg tracking-tight text-white">TrackFinal</span>
                  <span className="text-[10px] font-mono font-bold bg-blue-950 text-blue-400 border border-blue-800/60 px-1.5 py-0.5 rounded">
                    KIT AVZ-03
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  Lácteos San Antonio S.A.
                </div>
              </div>
            </div>

            {/* Middle: Navigation Links for Desktop */}
            <nav className="hidden md:flex items-center gap-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all touch-target ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-mono bg-slate-950/60 text-slate-300 px-1.5 py-0.5 rounded">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Right: Status & User Profile */}
            <div className="hidden sm:flex items-center gap-3">
              {/* Scan Button */}
              <button
                onClick={() => setScannerOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all mr-2"
                title="Abrir Escáner Inteligente"
              >
                <ScanLine className="w-4 h-4" />
                <span className="hidden lg:inline">Escanear Rótulo</span>
              </button>

              {/* API Connection Indicator */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${
                  apiOnline
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-950/40 text-rose-400 border-rose-500/30 animate-pulse'
                }`}
                title={apiOnline ? 'Conexión con Servidor PostgreSQL activa' : 'Sin conexión con API backend'}
              >
                {apiOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                <span className="text-[11px] font-medium">{apiOnline ? 'Online' : 'Desconectado'}</span>
              </div>

              {/* User Pill */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
                  {user?.nombre?.[0] || 'U'}
                </div>
                <div className="text-left leading-tight">
                  <div className="text-xs font-bold text-slate-200">
                    {user?.nombre} {user?.apellido}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-mono text-slate-400">
                      {user?.legajo || 'ID-000'}
                    </span>
                    <span className="text-[9px] font-mono font-bold uppercase px-1 rounded bg-slate-800 text-blue-400 border border-slate-700">
                      {user?.rol}
                    </span>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors touch-target flex items-center justify-center"
                title="Cerrar sesión / Fin de Turno"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Menu Trigger */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 touch-target"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 pt-2 pb-4 space-y-2">
            <div className="py-2 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-200">{user?.nombre} {user?.apellido}</div>
                <div className="text-[10px] text-slate-400 font-mono">{user?.legajo} - Rol: {user?.rol}</div>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-rose-400 flex items-center gap-1 font-bold py-1 px-2 rounded bg-rose-950/40 border border-rose-800/50"
              >
                <LogOut className="w-3.5 h-3.5" /> Salir
              </button>
            </div>
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold touch-target ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Industrial Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Establecimiento Habilitado SENASA N.° 1042 — Villa María, Córdoba</span>
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            TrackFinal v1.0.0 | Práctica Profesionalizante II
          </div>
        </div>
      </footer>

      {/* Global QR Scanner Modal */}
      <QRScannerModal 
        isOpen={scannerOpen} 
        onClose={() => setScannerOpen(false)} 
      />
    </div>
  );
};

export default MainLayout;
