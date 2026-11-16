import React from 'react';
import { useApp } from '../context/AppContext';
import { insumosDe } from '../lib/glosario';
import { Plato } from '../types';

/** RF04: glosario de insumos y preparaciones peruanas del plato, en el idioma activo. */
export const GlosarioInsumos: React.FC<{ plato: Plato }> = ({ plato }) => {
  const { idioma, t } = useApp();
  const insumos = insumosDe(plato);
  if (insumos.length === 0) return null;
  return (
    <details className="mt-2 text-xs text-stone-700 group">
      <summary className="cursor-pointer font-semibold text-[#466212] list-none flex items-center gap-1">
        <span aria-hidden="true" className="inline-block transition-transform group-open:rotate-90">›</span>
        {t('insumosPeruanos')} ({insumos.length})
      </summary>
      <dl className="mt-1.5 space-y-1.5 bg-[#F4F8EA] border border-[#CFE1A5] rounded-xl p-2.5">
        {insumos.map((i) => (
          <div key={i.id}>
            <dt className="font-bold text-stone-900">{i.nombre[idioma]}</dt>
            <dd className="leading-relaxed">{i.texto[idioma]}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
};
