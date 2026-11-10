import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { AlergenosModal } from './components/AlergenosModal';
import { CartaPage } from './pages/CartaPage';
import { CarritoPage } from './pages/CarritoPage';
import { SeguimientoPage } from './pages/SeguimientoPage';
import { CsatPage } from './pages/CsatPage';
import { BienvenidaPage } from './pages/BienvenidaPage';
import { TerminosPage, TerminosModal } from './pages/TerminosPage';
import { RecomendacionModal } from './components/RecomendacionModal';
import { Creditos } from './components/Creditos';
import { Utensils, ShoppingBag, Clock, HeartHandshake, CheckCircle2, ChevronRight } from 'lucide-react';

// Cierra el modo edición cuando el comensal guarda sus preferencias
const EnvolturaBienvenida: React.FC<{ onListo: () => void }> = ({ onListo }) => {
  const { perfil } = useApp();
  const previo = React.useRef(perfil);
  React.useEffect(() => {
    if (perfil !== previo.current) onListo();
  }, [perfil]);
  return (
    <>
      <BienvenidaPage />
      <div className="bg-white pb-8"><Creditos /></div>
    </>
  );
};

const MainContent: React.FC = () => {
  const [vistaActiva, setVistaActiva] = useState<'carta' | 'carrito' | 'seguimiento' | 'csat'>('carta');
  const { carrito, comandaActivaId, perfil, mesaConfigurada, t, mostrarRecomendacion, terminosAceptados, aviso, totalPEN } = useApp();
  const [editandoGustos, setEditandoGustos] = useState(false);
  const [verTerminos, setVerTerminos] = useState(false);

  const totalItems = carrito.reduce((acc, i) => acc + i.cantidad, 0);

  // Antes de todo: aceptación de términos y tratamiento de datos
  if (!terminosAceptados) return <TerminosPage />;

  // Primera pantalla: peruano / extranjero y preferencias de gusto
  if (!mesaConfigurada || editandoGustos) {
    return <EnvolturaBienvenida onListo={() => setEditandoGustos(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#F6F8F0] text-stone-900 flex flex-col font-sans">
      <Header vistaActiva={vistaActiva} setVistaActiva={setVistaActiva} />
      <AlergenosModal />
      {mostrarRecomendacion && <RecomendacionModal onIrAlCarrito={() => setVistaActiva('carrito')} />}

      <main className="flex-grow">
        {vistaActiva === 'carta' && <CartaPage onEditarGustos={() => setEditandoGustos(true)} />}
        {vistaActiva === 'carrito' && (
          <CarritoPage
            onVolver={() => setVistaActiva('carta')}
            onComandaEnviada={() => setVistaActiva('seguimiento')}
          />
        )}
        {vistaActiva === 'seguimiento' && (
          <SeguimientoPage
            onIrACsat={() => setVistaActiva('csat')}
            onVolverACarta={() => setVistaActiva('carta')}
          />
        )}
        {vistaActiva === 'csat' && (
          <CsatPage onFinalizar={() => setVistaActiva('seguimiento')} />
        )}
      </main>

      <footer className="px-4 pb-24 md:pb-6 text-center">
        <button type="button" onClick={() => setVerTerminos(true)} className="text-xs text-stone-500 underline hover:text-[#466212]">
          {t('tycLink')}
        </button>
        <Creditos largo className="mt-3" />
      </footer>
      {verTerminos && <TerminosModal onClose={() => setVerTerminos(false)} />}

      {/* Aviso al agregar un plato */}
      <div aria-live="polite" role="status" className="fixed top-16 inset-x-0 z-[60] flex justify-center px-4 pointer-events-none">
        {aviso && (
          <div className="flex items-center gap-2 bg-[#1F1F1F] text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg animate-fade-in max-w-full">
            <CheckCircle2 className="w-4 h-4 text-[#A9C96A] shrink-0" />
            <span className="truncate">{aviso}</span>
          </div>
        )}
      </div>

      {/* Resumen de la comanda siempre a mano mientras se mira la carta */}
      {vistaActiva === 'carta' && totalItems > 0 && (
        <div className="fixed inset-x-0 bottom-[68px] md:bottom-5 z-30 flex justify-center px-4 pointer-events-none">
          <button
            type="button"
            onClick={() => setVistaActiva('carrito')}
            className="pointer-events-auto w-full max-w-md flex items-center justify-between gap-3 bg-[#577A17] hover:bg-[#466212] text-white rounded-2xl px-4 py-3 shadow-xl transition"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <ShoppingBag className="w-4 h-4" /> {t('barraItems', { n: totalItems })}
            </span>
            <span className="flex items-center gap-1 text-sm font-bold">
              S/ {totalPEN.toFixed(2)} · {t('barraVer')} <ChevronRight className="w-4 h-4" />
            </span>
          </button>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-amber-900/10 py-2 px-6 shadow-lg md:hidden">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button
            onClick={() => setVistaActiva('carta')}
            className={`flex flex-col items-center space-y-1 ${
              vistaActiva === 'carta' ? 'text-[#577A17]' : 'text-stone-400'
            }`}
          >
            <Utensils className="w-5 h-5" />
            <span className="text-[10px] font-semibold">{t('carta')}</span>
          </button>

          <button
            onClick={() => setVistaActiva('carrito')}
            className={`flex flex-col items-center space-y-1 relative ${
              vistaActiva === 'carrito' ? 'text-[#577A17]' : 'text-stone-400'
            }`}
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold">{t('comanda')}</span>
          </button>

          {comandaActivaId && (
            <button
              onClick={() => setVistaActiva('seguimiento')}
              className={`flex flex-col items-center space-y-1 ${
                vistaActiva === 'seguimiento' ? 'text-[#577A17]' : 'text-stone-400'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{t('estado')}</span>
            </button>
          )}

          <button
            onClick={() => setVistaActiva('csat')}
            className={`flex flex-col items-center space-y-1 ${
              vistaActiva === 'csat' ? 'text-[#577A17]' : 'text-stone-400'
            }`}
          >
            <HeartHandshake className="w-5 h-5" />
            <span className="text-[10px] font-semibold">{t('opinion')}</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
};

export default App;
