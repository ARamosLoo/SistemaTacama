import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth, NOMBRE_ROL, Rol } from '../lib/auth';

interface Cuenta {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  createdAt: string;
}

const ROLES: Rol[] = ['ADMINISTRADOR', 'JEFE_SALON', 'MOZO', 'COCINA', 'SOMMELIER', 'ALMACEN'];
// Roles que ya no se asignan (Anfitrión y Caja): las cuentas antiguas los conservan hasta que se les asigne otro
const nombreRol = (r: string) => NOMBRE_ROL[r as Rol] ?? r.charAt(0) + r.slice(1).toLowerCase() + ' (en desuso)';
const mensajeDe = (e: unknown, por: string) => (e instanceof Error && e.message ? e.message : por);
const campo = 'w-full bg-[#F6F8F0] border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 placeholder-stone-500 focus:outline-none focus:border-[#577A17]';

// Contraseña inicial legible: letras y números, fácil de dictar
const generarClave = () => {
  const l = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ';
  const n = '23456789';
  const pick = (s: string, k: number) => Array.from({ length: k }, () => s[Math.floor(Math.random() * s.length)]).join('');
  return pick(l, 6) + pick(n, 3) + pick(l, 3);
};

export const CuentasPage: React.FC = () => {
  const { usuario } = useAuth();
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [nueva, setNueva] = useState({ nombre: '', email: '', rol: 'MOZO' as Rol, password: '' });
  const [creando, setCreando] = useState(false);
  const [clave, setClave] = useState<{ id: string; valor: string } | null>(null);

  const cargar = useCallback(async () => {
    try {
      const { data } = await api<{ data: Cuenta[] }>('/auth/usuarios');
      setCuentas(data);
      setError(null);
    } catch (e) {
      setError(mensajeDe(e, 'No se pudieron cargar las cuentas'));
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const ejecutar = async (accion: () => Promise<unknown>, ok: string) => {
    setError(null);
    setAviso(null);
    try {
      await accion();
      setAviso(ok);
    } catch (e) {
      setError(mensajeDe(e, 'No se pudo completar la acción'));
    } finally {
      cargar();
    }
  };

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreando(true);
    await ejecutar(async () => {
      await api('/auth/usuarios', { method: 'POST', body: nueva });
      setNueva({ nombre: '', email: '', rol: 'MOZO', password: '' });
    }, `Cuenta creada. Entregue el correo y la contraseña inicial a la persona.`);
    setCreando(false);
  };

  const actualizar = (id: string, cambios: Partial<Cuenta> & { password?: string }, ok: string) =>
    ejecutar(() => api(`/auth/usuarios/${id}`, { method: 'PATCH', body: cambios }), ok);

  return (
    <div className="space-y-6 animate-fade-in p-4 sm:p-6">
      <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-stone-200 shadow-md">
        <h2 className="font-serif-tacama text-xl font-bold text-stone-900">Cuentas del personal</h2>
        <p className="text-xs text-stone-600 mt-1">
          Cada persona ingresa con la cuenta que usted crea aquí. Las contraseñas se guardan cifradas: el sistema no puede mostrarlas, solo restablecerlas.
        </p>
      </div>

      {error && <div role="alert" className="bg-rose-50/60 border border-rose-500/50 rounded-xl p-3 text-xs text-rose-700">{error}</div>}
      {aviso && <div role="status" className="bg-emerald-50/50 border border-emerald-500/40 rounded-xl p-3 text-xs text-emerald-700">{aviso}</div>}

      <form onSubmit={crear} className="bg-[#FFFFFF] rounded-2xl border border-stone-200 p-5 space-y-4">
        <h3 className="text-sm font-bold text-stone-900">Nueva cuenta</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 block">
            <span className="text-[11px] font-semibold text-stone-600">Nombre completo</span>
            <input className={campo} required minLength={2} value={nueva.nombre} onChange={(e) => setNueva({ ...nueva, nombre: e.target.value })} placeholder="Ej.: Lucía Quispe" />
          </label>
          <label className="space-y-1 block">
            <span className="text-[11px] font-semibold text-stone-600">Correo</span>
            <input className={campo} type="email" required value={nueva.email} onChange={(e) => setNueva({ ...nueva, email: e.target.value })} placeholder="nombre@tacama.pe" />
          </label>
          <label className="space-y-1 block">
            <span className="text-[11px] font-semibold text-stone-600">Rol</span>
            <select className={campo} value={nueva.rol} onChange={(e) => setNueva({ ...nueva, rol: e.target.value as Rol })}>
              {ROLES.map((r) => <option key={r} value={r}>{NOMBRE_ROL[r]}</option>)}
            </select>
          </label>
          <label className="space-y-1 block">
            <span className="text-[11px] font-semibold text-stone-600">Contraseña inicial (mínimo 8, con letras y números)</span>
            <div className="flex gap-2">
              <input className={campo} required minLength={8} value={nueva.password} onChange={(e) => setNueva({ ...nueva, password: e.target.value })} autoComplete="new-password" />
              <button type="button" onClick={() => setNueva({ ...nueva, password: generarClave() })} className="shrink-0 px-3 py-2 rounded-lg bg-stone-300 hover:bg-stone-400 text-xs font-semibold text-stone-900">
                Generar
              </button>
            </div>
          </label>
        </div>
        <button type="submit" disabled={creando} className="px-4 py-2.5 rounded-xl bg-[#577A17] hover:bg-[#466212] disabled:opacity-60 text-white text-sm font-bold shadow">
          {creando ? 'Creando...' : 'Crear cuenta'}
        </button>
      </form>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {cuentas.map((c) => {
          const soyYo = c.id === usuario?.id;
          return (
            <article key={c.id} className={`bg-[#FFFFFF] rounded-2xl border p-4 space-y-3 ${c.activo ? 'border-stone-200' : 'border-stone-200 opacity-70'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-stone-900 truncate">{c.nombre}{soyYo && <span className="ml-2 text-[10px] font-semibold text-[#466212]">(usted)</span>}</h4>
                  <p className="text-xs text-stone-600 truncate">{c.email}</p>
                </div>
                <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${c.activo ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/40' : 'bg-stone-300/40 text-stone-600 border-stone-400'}`}>
                  {c.activo ? 'Activa' : 'Desactivada'}
                </span>
              </div>

              <label className="block space-y-1">
                <span className="text-[11px] font-semibold text-stone-600">Rol</span>
                <select
                  className={campo}
                  value={c.rol}
                  disabled={soyYo}
                  onChange={(e) => actualizar(c.id, { rol: e.target.value as Rol }, `Rol de ${c.nombre} actualizado.`)}
                >
                  {!ROLES.includes(c.rol) && <option value={c.rol} disabled>{nombreRol(c.rol)}</option>}
                  {ROLES.map((r) => <option key={r} value={r}>{NOMBRE_ROL[r]}</option>)}
                </select>
              </label>

              {clave?.id === c.id ? (
                <div className="space-y-2">
                  <input className={campo} value={clave.valor} onChange={(e) => setClave({ id: c.id, valor: e.target.value })} placeholder="Nueva contraseña" autoComplete="new-password" />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setClave({ id: c.id, valor: generarClave() })} className="px-3 py-1.5 rounded-lg bg-stone-300 hover:bg-stone-400 text-xs font-semibold text-stone-900">Generar</button>
                    <button
                      type="button"
                      onClick={() => { const v = clave.valor; setClave(null); actualizar(c.id, { password: v }, `Contraseña de ${c.nombre} restablecida.`); }}
                      className="px-3 py-1.5 rounded-lg bg-[#577A17] hover:bg-[#466212] text-xs font-bold text-white"
                    >
                      Guardar
                    </button>
                    <button type="button" onClick={() => setClave(null)} className="px-3 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-xs font-semibold text-stone-700">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setClave({ id: c.id, valor: '' })} className="px-3 py-1.5 rounded-lg bg-stone-300 hover:bg-stone-400 text-xs font-semibold text-stone-900">
                    Restablecer contraseña
                  </button>
                  {!soyYo && (
                    <button
                      type="button"
                      onClick={() => actualizar(c.id, { activo: !c.activo }, c.activo ? `Cuenta de ${c.nombre} desactivada.` : `Cuenta de ${c.nombre} activada.`)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${c.activo ? 'bg-rose-600/80 hover:bg-rose-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                    >
                      {c.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};
