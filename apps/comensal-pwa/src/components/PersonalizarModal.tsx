import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from './Modal';
import { nombreIngrediente } from '../lib/ingredientes';
import { MAX_PEDIDO, Personalizacion, SIN_PERSONALIZAR, ahorroDe, hayPersonalizacion, opcionesDe } from '../lib/personalizar';
import { X } from 'lucide-react';

interface Props {
  codigo: string;
  plato: string;
  cantidad: number;
  inicial?: Personalizacion;
  onGuardar: (p: Personalizacion) => Promise<void> | void;
  onClose: () => void;
}

/** Ventana para quitar ingredientes de un plato o escribir un pedido especial. */
export const PersonalizarModal: React.FC<Props> = ({ codigo, plato, cantidad, inicial, onGuardar, onClose }) => {
  const { t, idioma } = useApp();
  const opciones = opcionesDe(codigo);
  const [v, setV] = useState<Personalizacion>(inicial ?? SIN_PERSONALIZAR);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const alternar = (id: string) => setV((x) => ({ ...x, sin: x.sin.includes(id) ? x.sin.filter((y) => y !== id) : [...x.sin, id] }));
  const ahorro = ahorroDe(codigo, v.sin).kcal;

  const guardar = async (valor: Personalizacion) => {
    setGuardando(true);
    setError(null);
    try {
      await onGuardar(valor);
      onClose();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : t('perError'));
      setGuardando(false);
    }
  };

  return (
    <Modal onClose={onClose} etiqueta={t('perBoton')}>
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-[#CFE1A5] max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-100">
          <h3 className="font-serif text-lg font-semibold text-[#1F1F1F] leading-snug min-w-0">{t('perTitulo', { n: plato })}</h3>
          <button type="button" onClick={onClose} aria-label={t('cerrar')} className="text-stone-400 hover:text-stone-600 p-1 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto py-4 space-y-4 flex-grow pr-1">
          <section className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#466212]">{t('perQuitar')}</h4>
            {opciones.length === 0 ? (
              <p className="text-xs text-stone-600 leading-relaxed">{t('perSinLista')}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {opciones.map((id) => {
                  const marcado = v.sin.includes(id);
                  return (
                    <label
                      key={id}
                      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm cursor-pointer transition ${marcado ? 'bg-[#F4F8EA] border-[#577A17] text-[#2E4310] font-semibold' : 'bg-white border-stone-300 text-stone-700 hover:border-[#577A17]'}`}
                    >
                      <input type="checkbox" checked={marcado} onChange={() => alternar(id)} className="w-4 h-4 accent-[#577A17]" />
                      <span>{t('perSinUno', { n: nombreIngrediente(id, idioma) })}</span>
                    </label>
                  );
                })}
              </div>
            )}
            {ahorro > 0 && <p className="text-xs font-semibold text-[#466212]">{t('perAhorro', { n: ahorro })}</p>}
          </section>

          {v.sin.length > 0 && (
            <section className="space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={v.sinAlergia} onChange={(e) => setV({ ...v, sinAlergia: e.target.checked })} className="w-4 h-4 accent-rose-600" />
                <span className="text-sm font-semibold text-stone-800">{t('perAlergia')}</span>
              </label>
              {v.sinAlergia && (
                <p role="note" className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-3 leading-relaxed">{t('perAlergiaAviso')}</p>
              )}
            </section>
          )}

          <section className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#466212]" htmlFor="per-pedido">{t('perPedido')}</label>
            <textarea
              id="per-pedido"
              rows={2}
              maxLength={MAX_PEDIDO}
              value={v.pedido}
              onChange={(e) => setV({ ...v, pedido: e.target.value })}
              placeholder={t('perPedidoPlaceholder')}
              className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#577A17]/25 focus:border-[#577A17] resize-none"
            />
          </section>

          <p className="text-[11px] text-stone-500 leading-relaxed">{t('perAviso')}</p>
          {cantidad > 1 && <p className="text-[11px] text-stone-500 leading-relaxed">{t('perAplica', { n: cantidad })}</p>}
          {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
        </div>

        <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
          {hayPersonalizacion(inicial) ? (
            <button type="button" disabled={guardando} onClick={() => guardar(SIN_PERSONALIZAR)} className="text-xs font-semibold text-rose-700 underline disabled:opacity-60">
              {t('perLimpiar')}
            </button>
          ) : <span />}
          <div className="flex gap-2 ml-auto">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition">{t('cancelar')}</button>
            <button
              type="button"
              disabled={guardando}
              onClick={() => guardar(v)}
              className="px-5 py-2 text-xs font-bold bg-[#577A17] text-white rounded-xl shadow hover:bg-[#466212] transition disabled:opacity-60"
            >
              {t('perGuardar')}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
