import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Star, CheckCircle2, Banknote, CreditCard, Landmark } from 'lucide-react';

interface CsatPageProps {
  onFinalizar: () => void;
}

export const CsatPage: React.FC<CsatPageProps> = ({ onFinalizar }) => {
  const { enviarCsat, csatEnviado, estadoComanda, cuenta, solicitarCuenta, totalPEN, t } = useApp();
  const [metodo, setMetodo] = useState<'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | null>(null);
  const [monto, setMonto] = useState<string>('');
  const montoNum = monto.trim() === '' ? undefined : Number(monto);
  const montoInvalido = metodo === 'EFECTIVO' && montoNum !== undefined && (!Number.isFinite(montoNum) || montoNum < totalPEN);
  const [puntuacion, setPuntuacion] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comentario, setComentario] = useState<string>('');
  const [enviando, setEnviando] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (puntuacion === null || !metodo || montoInvalido) return;
    setEnviando(true);
    setError(null);
    try {
      await enviarCsat(puntuacion, comentario);
      await solicitarCuenta(false, metodo, metodo === 'EFECTIVO' ? montoNum : undefined);
    } catch (err: any) {
      setError(err?.message ?? 'Error');
    }
    setEnviando(false);
  };

  // Sin opinión: el comensal igual puede pedir la cuenta
  const pedirSinCalificar = async () => {
    if (!metodo || montoInvalido) return;
    setEnviando(true);
    setError(null);
    try {
      await solicitarCuenta(true, metodo, metodo === 'EFECTIVO' ? montoNum : undefined);
    } catch (err: any) {
      setError(err?.message ?? 'Error');
    }
    setEnviando(false);
  };

  // La calificación y la cuenta se habilitan cuando el mozo confirma la entrega
  if (estadoComanda !== 'SERVIDA' && estadoComanda !== 'CERRADA') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-3 animate-fade-in">
        <div className="w-14 h-14 rounded-full bg-[#E6F0D0] text-[#466212] flex items-center justify-center mx-auto">
          <Star className="w-7 h-7" />
        </div>
        <p className="text-sm text-stone-600 leading-relaxed">{t('csatBloqueado')}</p>
      </div>
    );
  }

  if (csatEnviado && cuenta.solicitada) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h3 className="font-serif-tacama text-2xl font-bold text-stone-900">
          {t('gracias')}
        </h3>
        <p className="text-xs text-stone-600 max-w-xs mx-auto leading-relaxed">
          {t('graciasCuenta')}
        </p>
        <button
          onClick={onFinalizar}
          className="px-6 py-2.5 bg-[#577A17] text-white rounded-2xl text-xs font-semibold shadow hover:bg-[#466212] transition"
        >
          {t('verEstadoPedido')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6 animate-fade-in pb-24">
      <div className="text-center space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
          {t('csatBadge')}
        </span>
        <h2 className="font-serif-tacama text-2xl font-bold text-stone-900">
          {t('csatTitulo')}
        </h2>
        <p className="text-sm text-stone-700 font-medium leading-relaxed">
          {t('csatIntro')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm space-y-6">
        {/* Star rating */}
        <div className="flex justify-center space-x-2 py-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setPuntuacion(star)}
              aria-label={t('estrellas', { n: star })}
              className="p-1 text-stone-200 hover:text-amber-400 focus:outline-none transition transform hover:scale-110"
            >
              <Star
                className={`w-10 h-10 ${
                  puntuacion !== null && star <= puntuacion
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-stone-300'
                }`}
              />
            </button>
          ))}
        </div>

        <div className="text-center text-xs font-semibold text-stone-700">
          {puntuacion === null && <span className="text-stone-500 font-normal">{t('elegirEstrellas')}</span>}
          {puntuacion === 5 && t('s5')}
          {puntuacion === 4 && t('s4')}
          {puntuacion === 3 && t('s3')}
          {puntuacion === 2 && t('s2')}
          {puntuacion === 1 && t('s1')}
        </div>

        {/* Comment field */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-stone-700">
            {t('csatComentarios')}
          </label>
          <textarea
            rows={4}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder={t('csatPlaceholder')}
            className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#577A17]/20 focus:border-[#577A17]"
          />
        </div>

        {/* Método de pago: el mozo llega con lo necesario para el cobro */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-stone-700">{t('metodoPagoTitulo')}</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              ['EFECTIVO', t('pagoEfectivo'), Banknote],
              ['TARJETA', t('pagoTarjeta'), CreditCard],
              ['TRANSFERENCIA', t('pagoTransferencia'), Landmark],
            ] as const).map(([k, nombre, Icono]) => (
              <button
                key={k}
                type="button"
                aria-pressed={metodo === k}
                onClick={() => setMetodo(k)}
                className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-2xl border text-[11px] font-semibold text-center transition ${
                  metodo === k ? 'bg-[#577A17] text-white border-[#577A17] shadow-sm' : 'bg-white text-stone-700 border-stone-300 hover:border-[#577A17]'
                }`}
              >
                <Icono className="w-5 h-5" />
                {nombre}
              </button>
            ))}
          </div>
          {metodo === 'EFECTIVO' && (
            <div className="space-y-1">
              <p className="text-[11px] text-stone-500">{t('pagoEfectivoAyuda')}</p>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder={`S/ ${totalPEN.toFixed(2)}`}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#577A17]/20 focus:border-[#577A17]"
              />
              {montoInvalido && <p role="alert" className="text-[11px] text-rose-700">{t('pagoMontoBajo', { n: totalPEN.toFixed(2) })}</p>}
            </div>
          )}
          {metodo === 'TARJETA' && <p className="text-[11px] text-stone-500">{t('pagoTarjetaAyuda')}</p>}
          {metodo === 'TRANSFERENCIA' && <p className="text-[11px] text-stone-500">{t('pagoTransferenciaAyuda')}</p>}
          {!metodo && <p className="text-[11px] text-stone-500">{t('elegirPago')}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={enviando || puntuacion === null || !metodo || montoInvalido}
          className="w-full py-3.5 bg-[#577A17] hover:bg-[#466212] text-white rounded-2xl font-serif-tacama text-xs font-bold tracking-wider shadow transition disabled:opacity-50"
        >
          {enviando ? t('enviandoVal') : t('enviarYPedir')}
        </button>
        {error && <p role="alert" className="text-xs text-rose-700 text-center">{error}</p>}
        <button
          type="button"
          onClick={pedirSinCalificar}
          disabled={enviando || !metodo || montoInvalido}
          className="w-full text-xs text-stone-500 underline hover:text-stone-700 disabled:opacity-50"
        >
          {t('prefieroNoCalificar')}
        </button>
      </form>
    </div>
  );
};
