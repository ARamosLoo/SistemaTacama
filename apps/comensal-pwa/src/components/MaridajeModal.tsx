import React, { useState, useEffect } from 'react';
import { fotoEtiqueta } from '../lib/fotos';
import { Plato, MaridajeRecomendacion } from '../types';
import { useApp } from '../context/AppContext';
import { Modal } from './Modal';
import { TIPO_ETIQUETA } from '../lib/i18n';
import { Wine, X, Plus, Check } from 'lucide-react';

interface MaridajeModalProps {
  plato: Plato | null;
  onClose: () => void;
}

export const MaridajeModal: React.FC<MaridajeModalProps> = ({ plato, onClose }) => {
  const { obtenerMaridajes, agregarAlCarrito, avisoStock, idioma, t } = useApp();
  const [recomendaciones, setRecomendaciones] = useState<MaridajeRecomendacion[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [agregados, setAgregados] = useState<string[]>([]);

  useEffect(() => {
    if (plato) {
      setCargando(true);
      obtenerMaridajes(plato).then((recs) => {
        setRecomendaciones(recs);
        setCargando(false);
      });
    }
  }, [plato]);

  if (!plato) return null;

  const handleAgregarVino = (rec: MaridajeRecomendacion, tipoVenta: 'COPA' | 'BOTELLA') => {
    const esCopa = tipoVenta === 'COPA' && rec.precioCopaPEN;
    const precio = esCopa ? rec.precioCopaPEN! : rec.precioBotellaPEN;
    const nombre = `${rec.nombre} (${esCopa ? t('copa') : t('botella')})`;

    agregarAlCarrito({
      id: `${rec.etiquetaId}-${tipoVenta.toLowerCase()}`,
      tipo: rec.tipo.startsWith('PISCO') ? 'PISCO' : 'VINO',
      nombre,
      precioPEN: precio,
      notas: `Maridaje sugerido para ${plato.nombre}`,
      imagenUrl: fotoEtiqueta({ tipo: rec.tipo }),
    });

    setAgregados((prev) => [...prev, `${rec.etiquetaId}-${tipoVenta}`]);
  };

  return (
    <Modal onClose={onClose} etiqueta={`${t('marTitulo')} ${plato.nombre}`}>
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-900/10 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#577A17] to-[#8FB339] flex items-center justify-center text-white shadow-md">
              <Wine className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  Sommelier Tacama
                </span>
              </div>
              <h3 className="font-serif-tacama text-lg font-bold text-stone-900 leading-tight mt-0.5">
                {t('marTitulo')} {plato.nombre}
              </h3>
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar modal de maridaje" className="text-stone-400 hover:text-stone-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto py-4 flex-grow space-y-4">
          {cargando ? (
            <div className="py-12 text-center text-stone-400 text-sm animate-pulse">
              {t('consultando')}
            </div>
          ) : recomendaciones.length === 0 ? (
            <div className="py-8 text-center text-stone-500 text-sm">
              No hay maridajes registrados para este plato en este momento.
            </div>
          ) : (
            recomendaciones.map((rec) => {
              const copaAgregada = agregados.includes(`${rec.etiquetaId}-COPA`);
              const botellaAgregada = agregados.includes(`${rec.etiquetaId}-BOTELLA`);

              return (
                <div
                  key={rec.etiquetaId}
                  className="bg-stone-50/80 border border-amber-900/15 rounded-2xl p-4 shadow-sm hover:border-amber-700/30 transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[11px] font-semibold text-[#577A17] uppercase tracking-wide">
                        {rec.linea}
                      </span>
                      <h4 className="font-serif-tacama font-bold text-base text-stone-900">
                        {rec.nombre}
                      </h4>
                      <span className="inline-block text-xs font-medium text-stone-500 bg-stone-200/60 px-2 py-0.5 rounded-md mt-0.5">
                        {TIPO_ETIQUETA[rec.tipo]?.[idioma] ?? rec.tipo} · {avisoStock(rec.etiquetaId) ?? `${rec.stockActual} ${t('botellas')}`}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 bg-amber-50 text-amber-800 text-xs font-bold px-2 py-1 rounded-full border border-amber-200">
                      <span>{rec.puntuacionAfinidad}% {t('afinidad')}</span>
                    </div>
                  </div>

                  {/* Sommelier Note */}
                  <div className="text-xs text-stone-600 bg-white/80 p-3 rounded-xl border border-stone-200/60 my-3 italic">
                    "{t('marMotivo')}: {plato.maridajeTexto ?? ''}."
                  </div>

                  {/* Pricing & Add to order */}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-200/40">
                    <div className="space-y-0.5">
                      {rec.precioCopaPEN && (
                        <div className="text-xs text-stone-600">
                          {t('copa')}: <span className="font-bold text-stone-900">S/ {rec.precioCopaPEN.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="text-xs text-stone-600">
                        {t('botella')}: <span className="font-bold text-[#577A17]">S/ {rec.precioBotellaPEN.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {rec.precioCopaPEN && (
                        <button
                          type="button"
                          onClick={() => handleAgregarVino(rec, 'COPA')}
                          className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-sm ${
                            copaAgregada
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'
                          }`}
                        >
                          {copaAgregada ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                          <span>{copaAgregada ? t('copaLista') : `+ ${t('copa')}`}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleAgregarVino(rec, 'BOTELLA')}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-sm ${
                          botellaAgregada
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#577A17] text-white hover:bg-[#466212]'
                        }`}
                      >
                        {botellaAgregada ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        <span>{botellaAgregada ? t('botellaLista') : `+ ${t('botella')}`}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-xl transition"
          >
            {t('volverCarta')}
          </button>
        </div>
      </div>
    </Modal>
  );
};
