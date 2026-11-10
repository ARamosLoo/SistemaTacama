import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { MAX_LARGO_OTRO, esOtro, otrosDesdeTexto, textosOtros } from '../lib/alergias';

interface Props {
  alergias: string[];
  onCambio: (alergias: string[]) => void;
  /** 'chip' en el formulario de bienvenida; 'tarjeta' en la ventana de alergias */
  variante?: 'chip' | 'tarjeta';
}

/** Casilla "Otros" con un campo para escribir a qué más es alérgico el comensal. */
export const OtrasAlergias: React.FC<Props> = ({ alergias, onCambio, variante = 'chip' }) => {
  const { t } = useApp();
  const actuales = textosOtros(alergias);
  const [abierto, setAbierto] = useState(actuales.length > 0);
  const [crudo, setCrudo] = useState(actuales.join(', '));

  // Si la lista cambia desde fuera (por ejemplo "No tengo ninguna alergia"), el campo la sigue
  useEffect(() => {
    const desdeCrudo = otrosDesdeTexto(crudo).map((c) => c.toLowerCase()).join('|');
    const desdeLista = alergias.filter(esOtro).map((c) => c.toLowerCase()).join('|');
    if (desdeCrudo !== desdeLista) {
      setCrudo(actuales.join(', '));
      if (actuales.length === 0) setAbierto(false);
      else setAbierto(true);
    }
  }, [alergias.join('|')]);

  const escribir = (valor: string) => {
    setCrudo(valor);
    onCambio([...alergias.filter((c) => !esOtro(c)), ...otrosDesdeTexto(valor)]);
  };

  const alternar = () => {
    if (abierto) {
      setAbierto(false);
      setCrudo('');
      onCambio(alergias.filter((c) => !esOtro(c)));
    } else {
      setAbierto(true);
    }
  };

  return (
    <div className={variante === 'chip' ? 'w-full space-y-2' : 'col-span-2 space-y-2'}>
      <button
        type="button"
        aria-pressed={abierto}
        onClick={alternar}
        className={
          variante === 'chip'
            ? `px-4 py-2.5 rounded-full text-sm border transition ${abierto ? 'bg-[#577A17] border-[#577A17] text-white font-semibold' : 'bg-white border-stone-300 text-stone-700 hover:border-[#577A17]'}`
            : `w-full text-left p-3 rounded-xl border text-xs transition ${abierto ? 'bg-rose-50 border-rose-400 text-rose-900 font-semibold' : 'bg-stone-50/70 border-stone-200 text-stone-700 hover:bg-stone-100'}`
        }
      >
        {t('alOtros')}
      </button>
      {abierto && (
        <div className="space-y-1.5">
          <input
            type="text"
            value={crudo}
            maxLength={MAX_LARGO_OTRO * 4}
            onChange={(e) => escribir(e.target.value)}
            placeholder={t('alOtrosPlaceholder')}
            aria-label={t('alOtros')}
            className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#577A17]/25 focus:border-[#577A17]"
          />
          <p className="text-[11px] text-stone-500 leading-relaxed">{t('alOtrosAyuda')}</p>
        </div>
      )}
    </div>
  );
};
