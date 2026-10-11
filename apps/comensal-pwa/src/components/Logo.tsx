import React from 'react';

/** Hoja de vid: isotipo de Tambo de Tacama (versión simplificada en SVG). */
export const HojaVid: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    <path
      d="M32 4c3 5 4 9 3 13 4-4 8-5 13-4-1 5-3 8-6 11 5-1 9 0 12 3-3 4-7 6-12 6 4 3 6 7 6 11-5 0-9-2-12-5 0 4-1 8-3 12h-2c-2-4-3-8-3-12-3 3-7 5-12 5 0-4 2-8 6-11-5 0-9-2-12-6 3-3 7-4 12-3-3-3-5-6-6-11 5-1 9 0 13 4-1-4 0-8 3-13z"
      fill="#577A17"
    />
    <path d="M32 18v36" stroke="#2E4310" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M32 30l-9-6M32 30l9-6M32 40l-8-5M32 40l8-5" stroke="#2E4310" strokeWidth="1.4" strokeLinecap="round" fill="none" />
  </svg>
);

/** Marca completa: TAMBO DE TACAMA con la hoja de vid. */
export const MarcaTambo: React.FC<{ compacto?: boolean }> = ({ compacto }) => (
  <div className="flex flex-col items-center leading-none">
    <span className={`font-serif tracking-wide text-[#1F1F1F] ${compacto ? 'text-base' : 'text-2xl'}`}>
      TAMBO DE TACAMA
    </span>
    <HojaVid className={compacto ? 'w-6 h-6 mt-0.5' : 'w-10 h-10 mt-1'} />
  </div>
);
