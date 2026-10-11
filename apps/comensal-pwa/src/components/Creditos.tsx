import React from 'react';
import { useApp } from '../context/AppContext';

/** Derechos de autor y aviso de proyecto académico (UTP). Se muestra al pie de las pantallas. */
export const Creditos: React.FC<{ largo?: boolean; className?: string }> = ({ largo = false, className = '' }) => {
  const { t } = useApp();
  return (
    <p className={`text-[10px] leading-relaxed text-stone-500 text-center max-w-md mx-auto px-4 ${className}`}>
      {t('creditosCorto')}
      {largo && <> {t('creditosLargo')}</>}
    </p>
  );
};
