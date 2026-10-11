import React, { useEffect, useState } from 'react';
import { BoletaModal } from '../components/BoletaModal';
import { CambiarPlatoModal } from '../components/CambiarPlatoModal';
import type { ItemServidor } from '../context/AppContext';
import { useApp } from '../context/AppContext';
import { Clock, ChefHat, CheckCircle, Bell, Star, Wine, ArrowRight, Receipt, FileText } from 'lucide-react';

interface SeguimientoPageProps {
  onIrACsat: () => void;
  onVolverACarta: () => void;
}

export const SeguimientoPage: React.FC<SeguimientoPageProps> = ({ onIrACsat, onVolverACarta }) => {
  const { comandaActivaId, estadoComanda, mesa, carrito, totalPEN, cuenta, comandaServidor, anularItem, t } = useApp();
  const [verBoleta, setVerBoleta] = useState(false);
  const [cambiando, setCambiando] = useState<ItemServidor | null>(null);
  const [anulando, setAnulando] = useState<string | null>(null);
  const [errorCambio, setErrorCambio] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // Cuenta regresiva de la ventana de 5 minutos para cambiar o anular platos
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const restanteMs = comandaServidor?.ventanaHasta ? comandaServidor.ventanaHasta - Date.now() : 0;
  const puedeModificar = restanteMs > 0 && (estadoComanda === 'CONFIRMADA' || estadoComanda === 'EN_PREPARACION');
  const mmss = (ms: number) => {
    const total = Math.max(0, Math.ceil(ms / 1000));
    return String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
  };
  const itemsServidor = comandaServidor?.items ?? [];
  const totalServidor = itemsServidor.reduce((a, i) => a + i.precioUnit * i.cantidad, 0);

  const confirmarAnulacion = async (itemId: string) => {
    setErrorCambio(null);
    try {
      await anularItem(itemId);
    } catch (e: any) {
      setErrorCambio(e?.message ?? t('cambioError'));
    }
    setAnulando(null);
  };

  const etapas = [
    { estado: 'CONFIRMADA', label: t('e1'), desc: t('e1d') },
    { estado: 'EN_PREPARACION', label: t('e2'), desc: t('e2d') },
    { estado: 'LISTA', label: t('e3'), desc: t('e3d') },
    { estado: 'SERVIDA', label: t('e4'), desc: t('e4d') },
  ];

  const getEtapaIndex = () => {
    switch (estadoComanda) {
      case 'CONFIRMADA': return 0;
      case 'EN_PREPARACION': return 1;
      case 'LISTA': return 2;
      case 'SERVIDA':
      case 'CERRADA': return 3;
      default: return 0;
    }
  };

  const currentIndex = getEtapaIndex();

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6 animate-fade-in pb-24">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-amber-900/10 shadow-sm text-center space-y-2">
        <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold">
          <Clock className="w-3.5 h-3.5 animate-spin" />
          <span>{t('tiempoEst')}</span>
        </div>
        <h2 className="font-serif-tacama text-xl font-bold text-stone-900">
          {t('estadoPedido')} #{comandaActivaId}
        </h2>
        <p className="text-xs text-stone-500">{mesa}</p>
      </div>

      {/* Progress Timeline */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm space-y-6">
        <div className="space-y-6">
          {etapas.map((etapa, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <div key={etapa.estado} className="flex items-start gap-4 relative">
                {/* Connecting Line */}
                {idx < etapas.length - 1 && (
                  <div
                    className={`absolute left-4 top-8 bottom-0 w-0.5 -ml-px ${
                      idx < currentIndex ? 'bg-emerald-500' : 'bg-stone-200'
                    }`}
                  />
                )}

                {/* Circle Icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-[#577A17] text-amber-300 ring-4 ring-[#577A17]/20 animate-pulse'
                      : 'bg-stone-100 text-stone-400 border border-stone-300'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : isCurrent ? (
                    <ChefHat className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-bold">{idx + 1}</span>
                  )}
                </div>

                {/* Text */}
                <div className="flex-grow pt-0.5">
                  <h4
                    className={`text-sm font-bold ${
                      isCurrent
                        ? 'text-[#577A17]'
                        : isCompleted
                        ? 'text-stone-900'
                        : 'text-stone-400'
                    }`}
                  >
                    {etapa.label}
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                    {etapa.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {estadoComanda === 'ANULADA' && (
        <div role="status" className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-sm text-center font-semibold">
          {t('pedidoAnulado')}
        </div>
      )}

      {/* Detalle del pedido: se puede cambiar o anular platos durante los primeros 5 minutos */}
      <div className="bg-stone-50 rounded-3xl p-5 border border-stone-200/80 space-y-3">
        <h4 className="font-serif-tacama text-xs font-bold uppercase tracking-wider text-stone-500">
          {t('cambiosTitulo')} ({itemsServidor.length || carrito.length})
        </h4>

        {itemsServidor.length > 0 && estadoComanda !== 'ANULADA' && (
          <p className={`text-xs rounded-xl px-3 py-2 ${puedeModificar ? 'bg-[#F4F8EA] text-[#384F0F] border border-[#CFE1A5]' : 'bg-stone-100 text-stone-600'}`}>
            {puedeModificar ? t('cambiosVentana', { t: mmss(restanteMs) }) : t('cambiosCerrado')}
          </p>
        )}
        {errorCambio && <p role="alert" className="text-xs text-rose-700">{errorCambio}</p>}

        <div className="space-y-2">
          {(itemsServidor.length > 0
            ? itemsServidor.map((i) => (
                <div key={i.id} className="space-y-1.5">
                  <div className="flex justify-between gap-3 text-xs text-stone-700">
                    <span>{i.cantidad}x {i.platoNombre}</span>
                    <span className="font-semibold text-stone-900 shrink-0">S/ {(i.precioUnit * i.cantidad).toFixed(2)}</span>
                  </div>
                  {puedeModificar && anulando !== i.id && (
                    <div className="flex gap-2">
                      {!i.etiquetaId && (
                        <button type="button" onClick={() => setCambiando(i)} className="px-3 py-1 rounded-lg text-[11px] font-semibold text-[#466212] bg-white border border-[#CFE1A5] hover:border-[#577A17]">
                          {t('cambiar')}
                        </button>
                      )}
                      <button type="button" onClick={() => setAnulando(i.id)} className="px-3 py-1 rounded-lg text-[11px] font-semibold text-rose-700 bg-white border border-rose-200 hover:border-rose-400">
                        {t('anular')}
                      </button>
                    </div>
                  )}
                  {anulando === i.id && (
                    <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                      <span className="text-[11px] text-rose-800 flex-grow">{t('anularConfirma', { n: i.platoNombre })}</span>
                      <button type="button" onClick={() => confirmarAnulacion(i.id)} className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700">{t('anularSi')}</button>
                      <button type="button" onClick={() => setAnulando(null)} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-stone-700 bg-white border border-stone-300">{t('cancelar')}</button>
                    </div>
                  )}
                </div>
              ))
            : carrito.map((item) => (
                <div key={item.lineaId ?? item.id} className="flex justify-between text-xs text-stone-700">
                  <span>{item.cantidad}x {item.nombre}</span>
                  <span className="font-semibold text-stone-900">S/ {(item.precioPEN * item.cantidad).toFixed(2)}</span>
                </div>
              )))}
        </div>
        <div className="pt-2 border-t border-stone-200 flex justify-between text-xs font-bold text-stone-900">
          <span>{t('total')}</span>
          <span className="text-sm text-[#577A17]">S/ {(itemsServidor.length > 0 ? totalServidor : totalPEN).toFixed(2)}</span>
        </div>
        {itemsServidor.some((i) => i.etiquetaId) && puedeModificar && <p className="text-[10px] text-stone-500">{t('cambiarSoloPlatos')}</p>}
      </div>
      {cambiando && <CambiarPlatoModal item={cambiando} onClose={() => setCambiando(null)} />}

      {/* Action Buttons */}
      <div className="space-y-2">
        {estadoComanda === 'SERVIDA' && !cuenta.solicitada && (
          <div className="bg-[#F4F8EA] border border-[#CFE1A5] rounded-2xl p-4 space-y-3">
            <p className="text-xs text-stone-700 leading-relaxed flex gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0 mt-0.5" />
              <span>{t('cuentaRecomendacion')}</span>
            </p>
            <button
              onClick={onIrACsat}
              className="w-full py-3.5 bg-[#577A17] hover:bg-[#466212] text-white rounded-2xl font-semibold text-xs shadow transition flex items-center justify-center space-x-2"
            >
              <Receipt className="w-4 h-4" />
              <span>{t('pedirCuenta')}</span>
            </button>
          </div>
        )}

        {estadoComanda === 'SERVIDA' && cuenta.solicitada && !cuenta.boletaLista && (
          <div className="bg-white border border-stone-200 rounded-2xl p-4 text-center space-y-1">
            <div className="text-sm font-bold text-[#466212]">{t('cuentaSolicitada')}</div>
            {cuenta.metodoPago && (
              <p className="text-xs font-semibold text-stone-800">
                {t('metodoPagoEtq')}: {cuenta.metodoPago === 'EFECTIVO' ? t('pagoEfectivo') : cuenta.metodoPago === 'TARJETA' ? t('pagoTarjeta') : t('pagoTransferencia')}
              </p>
            )}
            <p className="text-xs text-stone-600 leading-relaxed">{t('cuentaSolicitadaDesc')}</p>
          </div>
        )}

        {(estadoComanda === 'SERVIDA' || estadoComanda === 'CERRADA') && cuenta.boletaLista && (
          <div className="bg-white border border-[#CFE1A5] rounded-2xl p-4 space-y-3 text-center">
            <div className="text-sm font-bold text-[#466212]">{t('boletaLista')}</div>
            <p className="text-xs text-stone-600 leading-relaxed">{t('boletaListaDesc')}</p>
            <button
              onClick={() => setVerBoleta(true)}
              className="w-full py-3 bg-[#577A17] hover:bg-[#466212] text-white rounded-2xl font-semibold text-xs shadow transition flex items-center justify-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>{t('verBoleta')}</span>
            </button>
          </div>
        )}
        {verBoleta && <BoletaModal onClose={() => setVerBoleta(false)} />}

        <button
          onClick={onVolverACarta}
          className="w-full py-3 bg-white border border-stone-200 text-stone-700 rounded-2xl font-semibold text-xs hover:bg-stone-50 transition"
        >
          {t('agregarMas')}
        </button>
      </div>
    </div>
  );
};
