import React from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from './Modal';
import { POLITICA } from '../lib/legal';
import { X } from 'lucide-react';

/** Política de privacidad completa. El texto en español es el vinculante; los demás idiomas ven la traducción al inglés. */
export const PoliticaPrivacidadModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { idioma, t } = useApp();
  const texto = POLITICA[idioma === 'es' ? 'es' : 'en'];
  return (
    <Modal onClose={onClose} etiqueta={texto.titulo}>
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#CFE1A5] max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="font-serif text-xl font-semibold text-[#1F1F1F]">{texto.titulo}</h3>
            <p className="text-[11px] text-stone-500">{texto.actualizada} · Ley N.º 29733</p>
          </div>
          <button onClick={onClose} aria-label={t('tycCerrar')} className="text-stone-400 hover:text-stone-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto py-4 space-y-4 flex-grow pr-1">
          {texto.secciones.map((s) => (
            <section key={s.titulo}>
              <h4 className="text-sm font-bold text-[#384F0F]">{s.titulo}</h4>
              <p className="text-sm text-stone-700 leading-relaxed mt-1">{s.texto}</p>
            </section>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl text-sm font-semibold text-[#466212] border-2 border-[#577A17] hover:bg-[#F4F8EA] transition"
        >
          {t('tycCerrar')}
        </button>
      </div>
    </Modal>
  );
};
