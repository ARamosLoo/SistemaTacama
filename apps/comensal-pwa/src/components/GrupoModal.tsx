import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from './Modal';
import { X, Users } from 'lucide-react';

/** Cambia la cantidad de personas de la mesa sin perder los perfiles ya configurados. */
export const GrupoModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { comensales, cambiarTamanoGrupo, nombreComensal, t } = useApp();
  const [cantidad, setCantidad] = useState(comensales.length);
  const quitan = comensales.slice(cantidad);
  const agregan = cantidad - comensales.length;

  const aplicar = () => {
    cambiarTamanoGrupo(cantidad);
    onClose();
  };

  return (
    <Modal onClose={onClose} etiqueta={t('grupoTitulo')}>
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#CFE1A5] space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#577A17] flex items-center justify-center text-white shadow-md">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-[#1F1F1F]">{t('grupoTitulo')}</h3>
          </div>
          <button onClick={onClose} aria-label={t('grupoCancelar')} className="text-stone-400 hover:text-stone-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={cantidad === n}
              onClick={() => setCantidad(n)}
              className={`w-11 h-11 rounded-full text-base font-bold border transition ${
                cantidad === n ? 'bg-[#577A17] text-white border-[#577A17] shadow-sm' : 'bg-white text-stone-700 border-stone-300 hover:border-[#577A17]'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        {agregan > 0 && <p className="text-xs text-stone-600 bg-[#F4F8EA] border border-[#CFE1A5] rounded-xl p-3">{t('grupoAgrega', { n: agregan })}</p>}
        {quitan.length > 0 && (
          <p className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-3">
            {t('grupoQuita', { n: quitan.map(nombreComensal).join(', '), m: nombreComensal(comensales[0]) })}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={aplicar}
            disabled={cantidad === comensales.length}
            className="w-full py-3 rounded-xl text-sm font-bold text-white bg-[#577A17] hover:bg-[#466212] disabled:bg-stone-300 transition"
          >
            {t('grupoAplicar')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-semibold text-[#466212] border-2 border-[#577A17] hover:bg-[#F4F8EA] transition"
          >
            {t('grupoCancelar')}
          </button>
        </div>
      </div>
    </Modal>
  );
};
