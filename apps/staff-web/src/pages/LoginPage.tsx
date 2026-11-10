import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { emailRecordado } from '../lib/api';
import { MarcaTambo } from '../components/Logo';
import { Creditos } from '../components/Creditos';
import { Lock, Mail } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState(emailRecordado);
  const [password, setPassword] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [recordar, setRecordar] = useState(() => emailRecordado() !== '');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await login(email.trim(), password, recordar);
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8F0] flex flex-col items-center justify-center gap-5 p-4 text-stone-900">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-200">
        <div className="p-6 sm:p-10 space-y-6">
          <div className="space-y-3">
            <MarcaTambo />
            <h1 className="font-serif text-2xl text-center text-[#1F1F1F]">Portal del personal</h1>
            <p className="text-sm text-stone-600 text-center">Ingrese con la cuenta que le creó el administrador. Verá solo los módulos de su rol.</p>
          </div>

          <form onSubmit={entrar} className="space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-stone-700">Correo</span>
              <div className="mt-1 relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
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
                  type={verClave ? 'text' : 'password'}
                  name="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl pl-10 pr-20 py-2.5 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#577A17]/25 focus:border-[#577A17]"
                />
                <button
                  type="button"
                  onClick={() => setVerClave((v) => !v)}
                  aria-pressed={verClave}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold text-[#466212] hover:text-[#2E4310]"
                >
                  {verClave ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={recordar}
                onChange={(e) => setRecordar(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#577A17]"
              />
              <span className="text-xs text-stone-700 leading-relaxed">
                <strong className="font-semibold text-stone-900">Guardar mi cuenta en este dispositivo.</strong>{' '}
                Mantiene la sesión iniciada y recuerda su correo. La contraseña no se guarda en el sistema: si desea guardarla, su navegador se lo ofrecerá al ingresar. No lo use en equipos compartidos.
              </span>
            </label>

            {error && (
              <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3 rounded-xl text-sm font-bold text-white bg-[#577A17] hover:bg-[#466212] disabled:opacity-60 transition shadow"
            >
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
      <Creditos />
    </div>
  );
};
