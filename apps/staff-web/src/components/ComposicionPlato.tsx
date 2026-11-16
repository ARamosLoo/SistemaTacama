import React, { useState } from 'react';
import { api } from '../lib/api';

interface Composicion { alergenos: string[]; ingredientes: string[]; catalogoAlergenos: { codigo: string; nombre: string }[] }

/** RF19: edición de los alérgenos y los ingredientes de un plato (jefe de salón y administrador). */
export const ComposicionPlato: React.FC<{ platoId: string; nombre: string }> = ({ platoId, nombre }) => {
  const [abierto, setAbierto] = useState(false);
  const [datos, setDatos] = useState<Composicion | null>(null);
  const [alergenos, setAlergenos] = useState<string[]>([]);
  const [ingredientes, setIngredientes] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);

  const abrir = async () => {
    setAbierto((a) => !a);
    if (abierto || datos) return;
    try {
      const { data } = await api<{ data: Composicion }>(`/admin/platos/${platoId}/composicion`);
      setDatos(data); setAlergenos(data.alergenos); setIngredientes(data.ingredientes.join(', '));
    } catch (e: any) { setMsg({ ok: false, texto: e.message ?? 'No se pudo cargar' }); }
  };

  const guardar = async () => {
    setGuardando(true); setMsg(null);
    try {
      const { data } = await api<{ data: Composicion }>(`/admin/platos/${platoId}/composicion`, {
        method: 'PUT',
        body: { alergenos, ingredientes: ingredientes.split(',').map((x) => x.trim()).filter(Boolean) },
      });
      setDatos(data); setAlergenos(data.alergenos); setIngredientes(data.ingredientes.join(', '));
      setMsg({ ok: true, texto: 'Guardado: la carta ya muestra el cambio.' });
    } catch (e: any) { setMsg({ ok: false, texto: e.message ?? 'No se pudo guardar' }); }
    finally { setGuardando(false); }
  };

  return (
    <div className="text-[11px]">
      <button type="button" onClick={abrir} aria-expanded={abierto} className="text-[#466212] font-semibold underline underline-offset-2">
        {abierto ? 'Ocultar ingredientes y alérgenos' : 'Ingredientes y alérgenos'}
      </button>
      {abierto && (
        <div className="mt-1.5 border border-stone-300 rounded-xl p-3 space-y-2 bg-stone-50">
          {!datos && !msg && <p className="animate-pulse">Cargando…</p>}
          {datos && (
            <>
              <fieldset>
                <legend className="font-bold text-stone-700 mb-1">Alérgenos de «{nombre}»</legend>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {datos.catalogoAlergenos.map((a) => (
                    <label key={a.codigo} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alergenos.includes(a.codigo)}
                        onChange={(e) => setAlergenos((x) => (e.target.checked ? [...x, a.codigo] : x.filter((c) => c !== a.codigo)))}
                        className="accent-[#577A17]"
                      />
                      {a.nombre}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="block">
                <span className="font-bold text-stone-700">Ingredientes (separados por coma)</span>
                <textarea
                  value={ingredientes}
                  onChange={(e) => setIngredientes(e.target.value)}
                  rows={3}
                  className="mt-1 w-full border border-stone-300 rounded-lg px-2 py-1 bg-white text-xs"
                />
              </label>
              <button type="button" onClick={guardar} disabled={guardando} className="px-3 py-1.5 bg-[#577A17] hover:bg-[#466212] text-white font-bold rounded-xl disabled:opacity-60">
                {guardando ? 'Guardando…' : 'Guardar composición'}
              </button>
            </>
          )}
          {msg && <p role="status" className={msg.ok ? 'text-emerald-700' : 'text-rose-700'}>{msg.texto}</p>}
        </div>
      )}
    </div>
  );
};
