import React, { useState } from 'react';
import { MessageSquareQuote } from 'lucide-react';
import { api } from '../lib/api';

export interface ItemMesa { platoId: string; nombre: string; etiquetaId?: string }
interface Guion { nombre: string; frase: string; argumentos: string[] }

// La carta se pide una sola vez: traduce el id del plato al código que usan las reglas de maridaje
let cartaCache: Promise<Map<string, string>> | null = null;
const codigosDePlato = () =>
  (cartaCache ??= api<{ data: any[] }>('/carta').then((r) => new Map(r.data.map((p) => [p.id as string, p.codigoInterno as string]))));

/** RF09: guion de apoyo para el mozo con los argumentos de venta de la etiqueta recomendada (o ya pedida). */
export const GuionVenta: React.FC<{ items?: ItemMesa[] }> = ({ items = [] }) => {
  const [abierto, setAbierto] = useState(false);
  const [guion, setGuion] = useState<Guion | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const vino = items.find((i) => i.etiquetaId);
  const fondo = items.find((i) => !i.etiquetaId);
  if (!vino && !fondo) return null;

  const cargar = async () => {
    setCargando(true);
    try {
      const codigoPlato = fondo ? (await codigosDePlato()).get(fondo.platoId) : undefined;
      let etiqueta = vino?.etiquetaId;
      if (!etiqueta && codigoPlato) {
        const { data } = await api<{ data: any[] }>(`/maridajes?plato=${encodeURIComponent(codigoPlato)}`);
        etiqueta = data[0]?.codigoInterno;
      }
      if (!etiqueta) { setMensaje('No hay una etiqueta disponible para sugerir con este pedido.'); return; }
      const { data } = await api<{ data: Guion }>(`/maridajes/guion?etiqueta=${encodeURIComponent(etiqueta)}${codigoPlato ? `&plato=${encodeURIComponent(codigoPlato)}` : ''}`);
      setGuion(data);
    } catch {
      setMensaje('No se pudo cargar el guion de venta.');
    } finally {
      setCargando(false);
    }
  };

  const alternar = () => {
    setAbierto((a) => !a);
    if (!abierto && !guion && !mensaje) void cargar();
  };

  return (
    <div className="text-[11px]">
      <button type="button" onClick={alternar} aria-expanded={abierto} className="text-[#466212] font-semibold underline underline-offset-2 flex items-center gap-1">
        <MessageSquareQuote className="w-3 h-3" />
        {vino ? 'Guion de venta de la etiqueta pedida' : 'Guion para sugerir vino o pisco'}
      </button>
      {abierto && (
        <div className="mt-1.5 bg-[#F4F8EA] border border-[#577A17]/30 rounded-xl px-3 py-2 text-stone-700 space-y-1">
          {cargando && <p className="animate-pulse">Preparando el guion…</p>}
          {mensaje && <p>{mensaje}</p>}
          {guion && (
            <>
              <p className="font-semibold text-stone-900">“{guion.frase}”</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {guion.argumentos.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
};
