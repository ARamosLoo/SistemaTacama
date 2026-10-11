import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from './Modal';
import { BoletaDatos, BoletaTextos } from '../lib/boleta';
import { guardarBoletaPdf, compartirBoleta } from '../lib/boletaArchivo';
import { X, FileDown, Share2 } from 'lucide-react';

/** Comprobante de consumo digital: se puede imprimir, guardar como PDF o descargar. */
export const BoletaModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { obtenerBoleta, t } = useApp();
  const [d, setD] = useState<BoletaDatos | null>(null);
  const [error, setError] = useState(false);
  const [ocupado, setOcupado] = useState<'pdf' | 'compartir' | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    obtenerBoleta().then(setD).catch(() => setError(true));
  }, []);

  const textos: BoletaTextos = {
    pago: t('metodoPagoEtq'), metodos: { EFECTIVO: t('pagoEfectivo'), TARJETA: t('pagoTarjeta'), TRANSFERENCIA: t('pagoTransferencia') },
    titulo: t('boletaTitulo'), mesa: t('mesaEtq'), fecha: t('boletaFecha'), detalle: t('boletaDetalle'),
    subtotal: t('boletaSubtotal'), igv: 'IGV (18%)', total: t('total'), nota: t('boletaNota'), gracias: t('boletaGracias'),
  };

  return (
    <Modal onClose={onClose} etiqueta={t('boletaTitulo')}>
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#CFE1A5] max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="font-serif text-xl font-semibold text-[#1F1F1F]">{t('boletaTitulo')}</h3>
            {d && <p className="text-xs text-stone-500">{d.codigo} · {d.mesa}</p>}
          </div>
          <button onClick={onClose} aria-label={t('tycCerrar')} className="text-stone-400 hover:text-stone-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto py-4 flex-grow text-sm">
          {error && <p className="text-rose-700 text-center py-6">{t('boletaError')}</p>}
          {!d && !error && <p className="text-stone-500 text-center py-6">{t('consultando')}</p>}
          {d && (
            <>
              <ul className="space-y-1.5">
                {d.items.map((i, k) => (
                  <li key={k} className="flex justify-between gap-3">
                    <span>{i.cantidad} x {i.nombre}</span>
                    <span className="font-medium">S/ {i.subtotal.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 pt-3 border-t border-stone-200 space-y-1 text-stone-600">
                <div className="flex justify-between"><span>{textos.subtotal}</span><span>S/ {d.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>IGV (18%)</span><span>S/ {d.igv.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-[#1F1F1F] text-base pt-1"><span>{textos.total}</span><span className="text-[#466212]">S/ {d.total.toFixed(2)}</span></div>
              </div>
              <p className="text-[11px] text-stone-500 mt-4 leading-relaxed">{textos.nota}</p>
            </>
          )}
        </div>

        {d && (
          <div className="pt-3 border-t border-stone-100 flex flex-col gap-2">
            {aviso && <p role="status" className="text-[11px] text-stone-600 text-center leading-relaxed">{aviso}</p>}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={ocupado !== null}
                onClick={async () => {
                  setOcupado('pdf'); setAviso(null);
                  try { await guardarBoletaPdf(d, textos); } catch { setAviso(t('boletaError')); }
                  setOcupado(null);
                }}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-[#577A17] hover:bg-[#466212] disabled:opacity-60 transition"
              >
                <FileDown className="w-4 h-4" /> {ocupado === 'pdf' ? t('boletaGenerando') : t('boletaPdf')}
              </button>
              <button
                type="button"
                disabled={ocupado !== null}
                onClick={async () => {
                  setOcupado('compartir'); setAviso(null);
                  try {
                    const r = await compartirBoleta(d, textos);
                    if (r === 'descargado') setAviso(t('boletaCompartirNota'));
                  } catch { setAviso(t('boletaError')); }
                  setOcupado(null);
                }}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-[#466212] border-2 border-[#577A17] hover:bg-[#F4F8EA] disabled:opacity-60 transition"
              >
                <Share2 className="w-4 h-4" /> {ocupado === 'compartir' ? t('boletaGenerando') : t('boletaCompartir')}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
