import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../lib/api';
import { BookOpen, Search, ImageUp, CheckCircle2, AlertTriangle, PackageX, Save } from 'lucide-react';

interface PlatoAdmin {
  id: string;
  codigoInterno: string;
  nombreEs: string;
  categoria: string;
  seccion: string | null;
  precioBase: number;
  disponible: boolean;
  imagenUrl: string | null;
}

const NOMBRE_SECCION = (s: string | null) =>
  (s ?? 'SIN SECCIÓN').toLowerCase().replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

/** Reduce la foto a un máximo de 1200 px (JPG) antes de enviarla: ahorra datos y espacio. */
function prepararFoto(archivo: File): Promise<string> {
  return new Promise((ok, fail) => {
    const lector = new FileReader();
    lector.onerror = () => fail(new Error('No se pudo leer la imagen'));
    lector.onload = () => {
      const img = new Image();
      img.onerror = () => fail(new Error('El archivo no es una imagen válida'));
      img.onload = () => {
        const escala = Math.min(1, 1200 / Math.max(img.width, img.height));
        const cv = document.createElement('canvas');
        cv.width = Math.round(img.width * escala);
        cv.height = Math.round(img.height * escala);
        cv.getContext('2d')!.drawImage(img, 0, 0, cv.width, cv.height);
        ok(cv.toDataURL('image/jpeg', 0.85));
      };
      img.src = String(lector.result);
    };
    lector.readAsDataURL(archivo);
  });
}

export const CartaAdminPage: React.FC = () => {
  const [platos, setPlatos] = useState<PlatoAdmin[]>([]);
  const [precios, setPrecios] = useState<Record<string, string>>({});
  const [busqueda, setBusqueda] = useState('');
  const [seccion, setSeccion] = useState('TODAS');
  const [soloAgotados, setSoloAgotados] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const { data } = await api<{ data: PlatoAdmin[] }>('/admin/platos');
      setPlatos(data);
      setError(null);
    } catch (e: any) {
      setError(e.message ?? 'No se pudo cargar la carta');
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const notificar = (msg: string) => {
    setAviso(msg);
    setTimeout(() => setAviso(null), 3500);
  };

  const cambiar = async (p: PlatoAdmin, cambios: { precioBase?: number; disponible?: boolean }, mensaje: string) => {
    setOcupado(p.id);
    try {
      await api(`/admin/platos/${p.id}`, { method: 'PATCH', body: cambios });
      setPrecios((x) => { const { [p.id]: _, ...resto } = x; return resto; });
      await cargar();
      notificar(mensaje);
      setError(null);
    } catch (e: any) {
      setError(e.message ?? 'No se pudo guardar el cambio');
    } finally {
      setOcupado(null);
    }
  };

  const subirFoto = async (p: PlatoAdmin, archivo?: File) => {
    if (!archivo) return;
    setOcupado(p.id);
    try {
      const imagen = await prepararFoto(archivo);
      await api(`/admin/platos/${p.id}/foto`, { method: 'POST', body: { imagen } });
      await cargar();
      notificar(`Foto de "${p.nombreEs}" actualizada`);
      setError(null);
    } catch (e: any) {
      setError(e.message ?? 'No se pudo subir la foto');
    } finally {
      setOcupado(null);
    }
  };

  const secciones = useMemo(() => [...new Set(platos.map((p) => p.seccion ?? 'SIN SECCIÓN'))], [platos]);
  const agotados = platos.filter((p) => !p.disponible).length;

  const visibles = platos
    .filter((p) => seccion === 'TODAS' || (p.seccion ?? 'SIN SECCIÓN') === seccion)
    .filter((p) => !soloAgotados || !p.disponible)
    .filter((p) => !busqueda.trim() || (p.nombreEs + ' ' + p.codigoInterno).toLowerCase().includes(busqueda.trim().toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in p-4 sm:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FFFFFF] p-5 rounded-2xl border border-stone-200 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#577A17] to-[#2E4310] flex items-center justify-center text-white shadow-md">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h2 className="font-serif-tacama text-xl font-bold text-stone-900">Administración de la carta</h2>
            <p className="text-xs text-stone-600">
              Marca platos agotados, cambia precios y sube fotos. Los comensales ven el cambio al instante.
            </p>
          </div>
        </div>
        <div className="text-xs text-stone-600 flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-stone-200 border border-stone-300">{platos.length} platos</span>
          <span className={`px-2.5 py-1 rounded-full border ${agotados ? 'bg-rose-500/20 text-rose-700 border-rose-500/40' : 'bg-stone-200 border-stone-300'}`}>{agotados} agotados</span>
        </div>
      </div>

      {error && <div className="bg-rose-50/60 border border-rose-500/50 rounded-xl p-3 text-xs text-rose-700 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>}
      {aviso && <div role="status" className="bg-emerald-50/60 border border-emerald-500/50 rounded-xl p-3 text-xs text-emerald-700 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{aviso}</div>}

      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-grow max-w-md">
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar plato o código"
            className="w-full bg-stone-100 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-sm text-stone-900 placeholder-stone-500 focus:outline-none focus:border-[#577A17]"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer select-none">
          <input type="checkbox" checked={soloAgotados} onChange={(e) => setSoloAgotados(e.target.checked)} className="accent-[#577A17] w-4 h-4" />
          Solo agotados
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {['TODAS', ...secciones].map((s) => (
          <button
            key={s}
            onClick={() => setSeccion(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
              seccion === s ? 'bg-[#577A17] text-white border-[#577A17]' : 'text-stone-700 border-stone-300 hover:border-stone-500'
            }`}
          >
            {s === 'TODAS' ? 'Todas' : NOMBRE_SECCION(s)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {visibles.map((p) => {
          const edicion = precios[p.id];
          const precioNuevo = edicion !== undefined ? Number(edicion) : p.precioBase;
          const modificado = edicion !== undefined && Number.isFinite(precioNuevo) && precioNuevo !== p.precioBase;
          return (
            <div
              key={p.id}
              className={`bg-[#FFFFFF] rounded-2xl border p-4 flex gap-4 transition ${p.disponible ? 'border-stone-200' : 'border-rose-500/40 bg-rose-50/10'}`}
            >
              <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-stone-100 flex items-center justify-center relative">
                {p.imagenUrl ? (
                  <img src={p.imagenUrl} alt="" className={`w-full h-full object-cover ${p.disponible ? '' : 'grayscale opacity-60'}`} />
                ) : (
                  <ImageUp className="w-7 h-7 text-stone-500" />
                )}
                <label
                  title="Cambiar foto"
                  className="absolute inset-x-0 bottom-0 bg-black/65 hover:bg-black/80 text-[10px] text-white text-center py-1 cursor-pointer flex items-center justify-center gap-1"
                >
                  <ImageUp className="w-3 h-3" /> Cambiar foto
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={ocupado === p.id}
                    onChange={(e) => { subirFoto(p, e.target.files?.[0]); e.target.value = ''; }}
                  />
                </label>
              </div>

              <div className="flex-grow min-w-0 space-y-2">
                <div>
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-stone-500 font-bold">
                    <span className="font-mono">{p.codigoInterno}</span>
                    <span>·</span>
                    <span>{NOMBRE_SECCION(p.seccion)}</span>
                  </div>
                  <h3 className="font-serif-tacama text-sm font-bold text-stone-900 leading-snug">{p.nombreEs}</h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-stone-100 border border-stone-300 rounded-xl px-2.5 py-1.5">
                    <span className="text-xs text-stone-600">S/</span>
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={edicion ?? p.precioBase.toFixed(2)}
                      onChange={(e) => setPrecios((x) => ({ ...x, [p.id]: e.target.value }))}
                      aria-label={`Precio de ${p.nombreEs}`}
                      className="w-20 bg-transparent text-sm font-bold text-amber-700 focus:outline-none"
                    />
                  </div>
                  {modificado && (
                    <button
                      onClick={() => cambiar(p, { precioBase: precioNuevo }, `Precio de "${p.nombreEs}": S/ ${precioNuevo.toFixed(2)}`)}
                      disabled={ocupado === p.id}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 disabled:opacity-60"
                    >
                      <Save className="w-3.5 h-3.5" /> Guardar precio
                    </button>
                  )}
                  <button
                    onClick={() => cambiar(p, { disponible: !p.disponible }, p.disponible ? `"${p.nombreEs}" marcado como agotado` : `"${p.nombreEs}" disponible de nuevo`)}
                    disabled={ocupado === p.id}
                    className={`ml-auto px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 border transition disabled:opacity-60 ${
                      p.disponible
                        ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/40 hover:bg-emerald-500/25'
                        : 'bg-rose-500/20 text-rose-700 border-rose-500/50 hover:bg-rose-500/30'
                    }`}
                  >
                    {p.disponible ? <><CheckCircle2 className="w-3.5 h-3.5" /> Disponible</> : <><PackageX className="w-3.5 h-3.5" /> Agotado</>}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {visibles.length === 0 && <div className="lg:col-span-2 text-center text-sm text-stone-500 py-10">No hay platos que coincidan.</div>}
      </div>
    </div>
  );
};
