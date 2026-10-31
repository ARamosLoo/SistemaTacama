import React, { useState } from 'react';
import { Modal } from './Modal';
import { useApp } from '../context/AppContext';
import { nombreIngrediente } from '../lib/ingredientes';
import { X, Check, ShieldAlert } from 'lucide-react';

interface Props {
  nombrePlato: string;
  /** Ingredientes que se pueden quitar de este plato */
  quitables: string[];
  /** Ingredientes ya marcados como "sin" (al editar un ítem del carrito) */
  inicial?: string[];
  textoConfirmar: string;
  onConfirmar: (sin: string[]) => void;
  onClose: () => void;
}

/** Permite al comensal marcar los ingredientes que NO desea en su plato. */
export const PersonalizarModal: React.FC<Props> = ({ nombrePlato, quitables, inicial = [], textoConfirmar, onConfirmar, onClose }) => {
  const { t, idioma } = useApp();
  const [sin, setSin] = useState<string[]>(inicial);
  const alternar = (c: string) => setSin((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  return (
    <Modal onClose={onClose} etiqueta={t('persTitulo')}>
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200">
        <div className="flex items-start justify-between gap-3 p-5 pb-3">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#1F1F1F]">{t('persTitulo')}</h2>
            <p className="text-xs text-stone-500 mt-0.5">{nombrePlato}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="p-2 -m-2 text-stone-400 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="px-5 text-xs text-stone-600">{t('persAyuda')}</p>

        <ul className="p-5 pt-3 space-y-2">
          {quitables.map((c) => {
            const quitado = sin.includes(c);
            return (
              <li key={c}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={quitado}
                  onClick={() => alternar(c)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left text-sm transition ${
                    quitado ? 'border-rose-300 bg-rose-50 text-rose-900' : 'border-stone-200 bg-white text-stone-800 hover:bg-stone-50'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${quitado ? 'bg-rose-600 border-rose-600 text-white' : 'border-stone-300'}`}>
                    {quitado && <Check className="w-3.5 h-3.5" />}
                  </span>
                  <span className={quitado ? 'line-through decoration-rose-400' : ''}>
                    {t('sinIngr')} {nombreIngrediente(c, idioma)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mx-5 mb-4 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-900">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{t('persAviso')}</span>
        </div>

        <div className="p-5 pt-0 flex gap-2">
          {sin.length > 0 && (
            <button type="button" onClick={() => setSin([])} className="px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50">
              {t('persReset')}
            </button>
          )}
          <button
            type="button"
            onClick={() => onConfirmar(sin)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#577A17] hover:bg-[#466212] text-white text-xs font-semibold shadow"
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </Modal>
  );
};
