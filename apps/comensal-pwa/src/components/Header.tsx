import React from 'react';
import { useApp } from '../context/AppContext';
import { HojaVid } from './Logo';
import { ShieldAlert, ShoppingBag, Sparkles } from 'lucide-react';

interface HeaderProps {
  vistaActiva: 'carta' | 'carrito' | 'seguimiento' | 'csat';
  setVistaActiva: (vista: 'carta' | 'carrito' | 'seguimiento' | 'csat') => void;
}

export const Header: React.FC<HeaderProps> = ({ setVistaActiva }) => {
  const { mesa, alergiasDeclaradas, setModalAlergenosAbierto, carrito, comandaActivaId, t } = useApp();

  const totalItems = carrito.reduce((acc, i) => acc + i.cantidad, 0);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-200 px-4 py-2.5">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Marca y mesa */}
        <button type="button" className="flex items-center space-x-2.5 text-left" onClick={() => setVistaActiva('carta')} aria-label="TacamaMesa">
          <HojaVid className="w-9 h-9" />
          <div>
            <h1 className="font-serif text-base font-semibold tracking-wide text-[#1F1F1F] leading-tight">TAMBO DE TACAMA</h1>
            <p className="text-xs font-medium text-stone-500">{mesa}</p>
          </div>
        </button>

        {/* Controles */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setModalAlergenosAbierto(true)}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              alergiasDeclaradas.length > 0
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : 'bg-white hover:bg-stone-50 text-stone-700 border border-stone-300'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{alergiasDeclaradas.length > 0 ? `${alergiasDeclaradas.length} ${t('alergias')}` : t('alergias')}</span>
          </button>

          {comandaActivaId ? (
            <button
              onClick={() => setVistaActiva('seguimiento')}
              className="flex items-center space-x-1.5 bg-[#577A17] text-white px-3 py-1.5 rounded-full text-xs font-medium shadow hover:bg-[#466212] transition"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>{t('pedidoCurso')}</span>
            </button>
          ) : (
            <button
              onClick={() => setVistaActiva('carrito')}
              className="relative p-2 bg-[#577A17] text-white rounded-full hover:bg-[#466212] transition shadow"
              aria-label={t('comanda')}
            >
              <ShoppingBag className="w-4 h-4" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#1F1F1F] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
                  {totalItems}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
