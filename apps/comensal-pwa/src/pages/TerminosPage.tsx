import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/Modal';
import { MarcaTambo } from '../components/Logo';
import { PoliticaPrivacidadModal } from '../components/PoliticaPrivacidadModal';
import { Creditos } from '../components/Creditos';
import { ShieldCheck, Check, X, Smartphone, UserX, ChefHat, Lock } from 'lucide-react';

const PUNTOS = [
  { k: 'tycP1', Icono: Smartphone },
  { k: 'tycP2', Icono: UserX },
  { k: 'tycP3', Icono: ChefHat },
  { k: 'tycP4', Icono: Lock },
] as const;

const Contenido: React.FC = () => {
  const { t } = useApp();
  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-600 leading-relaxed">{t('tycIntro')}</p>
      <ul className="space-y-3">
        {PUNTOS.map(({ k, Icono }) => (
          <li key={k} className="flex gap-3 items-start">
            <span className="shrink-0 w-9 h-9 rounded-xl bg-[#E6F0D0] text-[#466212] flex items-center justify-center">
              <Icono className="w-[18px] h-[18px]" />
            </span>
            <span className="text-sm text-stone-800 leading-relaxed pt-1">{t(k)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/** Primera pantalla: el comensal acepta cómo se tratan sus datos antes de usar el sistema. */
export const TerminosPage: React.FC = () => {
  const { aceptarTerminos, t } = useApp();
  const [acepto, setAcepto] = useState(false);
  const [aceptoSalud, setAceptoSalud] = useState(false);
  const [verPolitica, setVerPolitica] = useState(false);
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-grow flex flex-col items-center px-5 pb-12 pt-4">
        <div className="w-full max-w-xl space-y-7">
          <div className="text-center space-y-4">
            <MarcaTambo />
            <div className="mx-auto w-14 h-14 rounded-2xl bg-[#577A17] text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="font-serif text-2xl md:text-3xl text-[#1F1F1F]">{t('tycTitulo')}</h1>
          </div>
          <Contenido />
          <label className="flex gap-3 items-start cursor-pointer bg-[#F4F8EA] border border-[#CFE1A5] rounded-2xl p-4">
            <input
              type="checkbox"
              checked={acepto}
              onChange={(e) => setAcepto(e.target.checked)}
              className="mt-0.5 w-5 h-5 accent-[#577A17] shrink-0"
            />
            <span className="text-sm text-stone-800 leading-relaxed">{t('tycAcepto')}</span>
          </label>
          <button type="button" onClick={() => setVerPolitica(true)} className="text-xs font-semibold text-[#466212] underline hover:text-[#2E4310]">
            {t('tycPolitica')}
          </button>
          <label className="flex gap-3 items-start cursor-pointer bg-[#F4F8EA] border border-[#CFE1A5] rounded-2xl p-4">
            <input
              type="checkbox"
              checked={aceptoSalud}
              onChange={(e) => setAceptoSalud(e.target.checked)}
              className="mt-0.5 w-5 h-5 accent-[#577A17] shrink-0"
            />
            <span className="text-sm text-stone-800 leading-relaxed">{t('tycSalud')}</span>
          </label>
          {verPolitica && <PoliticaPrivacidadModal onClose={() => setVerPolitica(false)} />}
          <button
            type="button"
            disabled={!acepto || !aceptoSalud}
            onClick={aceptarTerminos}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white bg-[#577A17] hover:bg-[#466212] disabled:bg-stone-300 transition shadow"
          >
            <Check className="w-4 h-4" /> {t('tycContinuar')}
          </button>
          <Creditos largo />
        </div>
      </div>
    </div>
  );
};

/** Consulta de los términos ya aceptados (enlace al pie de la carta). */
export const TerminosModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useApp();
  const [verPolitica, setVerPolitica] = useState(false);
  return (
    <Modal onClose={onClose} etiqueta={t('tycLink')}>
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#CFE1A5] max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-start justify-between">
          <h3 className="font-serif text-xl font-semibold text-[#1F1F1F]">{t('tycLink')}</h3>
          <button onClick={onClose} aria-label={t('tycCerrar')} className="text-stone-400 hover:text-stone-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <Contenido />
        <button type="button" onClick={() => setVerPolitica(true)} className="text-xs font-semibold text-[#466212] underline hover:text-[#2E4310]">
          {t('tycPolitica')}
        </button>
        {verPolitica && <PoliticaPrivacidadModal onClose={() => setVerPolitica(false)} />}
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
