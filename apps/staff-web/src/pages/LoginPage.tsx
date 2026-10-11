import React, { useState } from 'react';
import { CUENTAS_DEMO, NOMBRE_ROL, ACCESO_POR_ROL, useAuth } from '../lib/auth';
import { MarcaTambo } from '../components/Logo';
import { Creditos } from '../components/Creditos';
import { LogIn, Lock, Mail, KeyRound } from 'lucide-react';

const NOMBRE_MODULO: Record<string, string> = {
  kds: 'Cocina', mesas: 'Mesas', sommelier: 'Sommelier', inventario: 'Inventario', analitica: 'KPIs',
};

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const entrar = async (e?: React.FormEvent, cuenta?: { email: string; password: string }) => {
    e?.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await login(cuenta?.email ?? email, cuenta?.password ?? password);
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col items-center justify-center gap-5 p-4 text-stone-900">
      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-200">
        {/* Formulario */}
        <div className="p-8 md:p-10 space-y-6">
          <div className="space-y-3">
            <MarcaTambo />
            <h1 className="font-serif text-2xl text-center text-[#1F1F1F]">Portal del personal</h1>
            <p className="text-sm text-stone-600 text-center">Ingrese con su cuenta. Verá solo los módulos de su rol.</p>
          </div>

          <form onSubmit={(e) => entrar(e)} className="space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-stone-700">Correo</span>
              <div className="mt-1 relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@tacama.pe"
                  className="w-full border border-stone-300 rounded-xl pl-10 pr-3 py-2.5 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#577A17]/25 focus:border-[#577A17]"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-stone-700">Contraseña</span>
              <div className="mt-1 relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl pl-10 pr-3 py-2.5 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#577A17]/25 focus:border-[#577A17]"
                />
              </div>
            </label>

            {error && (
              <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-[#577A17] hover:bg-[#466212] disabled:opacity-60 transition shadow"
            >
              <LogIn className="w-4 h-4" /> {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        {/* Accesos por rol */}
        <div className="bg-[#F4F8EA] p-8 md:p-10 border-t md:border-t-0 md:border-l border-stone-200 space-y-4">
          <div>
            <h2 className="font-serif text-lg text-[#2E4310] flex items-center gap-2">
              <KeyRound className="w-5 h-5" /> Accesos por rol
            </h2>
            <p className="text-xs text-[#466212] mt-1">Cuentas de desarrollo. Toque una para ingresar con ese rol.</p>
          </div>
          <ul className="space-y-2">
            {CUENTAS_DEMO.map((c) => (
              <li key={c.rol}>
                <button
                  type="button"
                  disabled={cargando}
                  onClick={() => entrar(undefined, c)}
                  className="w-full text-left bg-white hover:border-[#577A17] border border-[#CFE1A5] rounded-xl px-4 py-2.5 transition disabled:opacity-60"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-[#1F1F1F]">{NOMBRE_ROL[c.rol]}</span>
                    <span className="text-[11px] text-stone-500 truncate">{c.email}</span>
                  </div>
                  <div className="text-[11px] text-[#577A17] mt-0.5">
                    {ACCESO_POR_ROL[c.rol].map((m) => NOMBRE_MODULO[m]).join(' · ')}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Creditos />
    </div>
  );
};
