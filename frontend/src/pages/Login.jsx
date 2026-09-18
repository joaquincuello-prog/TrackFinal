import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';
import { 
  Factory, 
  Lock, 
  Mail, 
  AlertCircle, 
  CheckCircle2, 
  UserCheck, 
  ShieldCheck, 
  HardHat, 
  FileCheck 
} from 'lucide-react';

const TEST_USERS = [
  {
    role: 'OPERARIO',
    name: 'Operario de Planta',
    email: 'operario@lacteossanantonio.com',
    pass: 'Operario123!',
    icon: HardHat,
    color: 'border-amber-500/40 text-amber-300 hover:bg-amber-950/40',
    desc: 'Envasado, captura y QR',
  },
  {
    role: 'SUPERVISOR',
    name: 'Supervisor de Despacho',
    email: 'despacho@lacteossanantonio.com',
    pass: 'Despacho123!',
    icon: ShieldCheck,
    color: 'border-blue-500/40 text-blue-300 hover:bg-blue-950/40',
    desc: 'Aprobación y control',
  },
  {
    role: 'AUDITOR',
    name: 'Auditor Bromatológico',
    email: 'calidad@lacteossanantonio.com',
    pass: 'Calidad123!',
    icon: FileCheck,
    color: 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/40',
    desc: 'Recall y Trazabilidad',
  },
  {
    role: 'ADMIN',
    name: 'Administrador General',
    email: 'admin@lacteossanantonio.com',
    pass: 'Admin123!',
    icon: UserCheck,
    color: 'border-purple-500/40 text-purple-300 hover:bg-purple-950/40',
    desc: 'Acceso y configuración',
  },
];

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const expiredSession = new URLSearchParams(location.search).get('expired');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setErrorMsg('Por favor ingrese email y contraseña');
      return;
    }

    setErrorMsg('');
    const res = await login(email, password);
    if (res.success) {
      if (res.usuario?.rol === 'OPERARIO') {
        navigate('/captura');
      } else {
        navigate('/lotes');
      }
    } else {
      setErrorMsg(res.error || 'Credenciales no válidas');
    }
  };

  const handleQuickLogin = async (user) => {
    setEmail(user.email);
    setPassword(user.pass);
    setErrorMsg('');
    const res = await login(user.email, user.pass);
    if (res.success) {
      if (res.usuario?.rol === 'OPERARIO') {
        navigate('/captura');
      } else {
        navigate('/lotes');
      }
    } else {
      setErrorMsg(res.error || 'Error al autenticar');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100">
      <div className="max-w-md w-full">
        {/* Cabecera Corporativa de Planta */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 border border-blue-400/40 shadow-2xl shadow-blue-600/40 mb-3">
            <Factory className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">TrackFinal</h1>
          <p className="text-slate-400 text-sm mt-1">
            Lácteos San Antonio S.A. — Terminal de Trazabilidad Industrial
          </p>
          <div className="inline-block mt-2">
            <span className="text-[11px] font-mono font-bold bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-blue-400">
              KIT AVZ-03 | Lote/Unidad
            </span>
          </div>
        </div>

        {/* Tarjeta de Inicio de Sesión */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          {expiredSession && (
            <div className="mb-4 p-3 bg-amber-950/70 border border-amber-500/50 rounded-lg text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Tu sesión de planta ha expirado. Por favor ingresá nuevamente.</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-950/70 border border-rose-500/50 rounded-lg text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Correo Electrónico Corporativo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operario@lacteossanantonio.com"
                  className="w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none touch-target"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Contraseña de Planta
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none touch-target font-mono"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={loading}
              className="mt-2 font-bold"
            >
              Ingresar al Sistema
            </Button>
          </form>

          {/* Accesos Rápidos de Prueba (Entorno de Evaluación PP2) */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="text-center mb-3">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                ⚡ Acceso Rápido de Prueba (Demo PP2)
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Seleccioná un perfil para iniciar sesión al instante con 1 clic:
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {TEST_USERS.map((u) => {
                const Icon = u.icon;
                return (
                  <button
                    key={u.role}
                    type="button"
                    onClick={() => handleQuickLogin(u)}
                    disabled={loading}
                    className={`flex flex-col items-start p-2.5 rounded-lg border bg-slate-950 transition-all text-left ${u.color}`}
                  >
                    <div className="flex items-center gap-1.5 w-full">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-bold leading-tight truncate">
                        {u.role}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 truncate mt-1">
                      {u.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Info adicional inferior */}
        <div className="mt-6 text-center text-xs text-slate-500">
          <p>SENASA N.° 1042 — Villa María, Córdoba</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
