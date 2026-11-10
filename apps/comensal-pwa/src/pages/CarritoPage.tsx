import React, { useState } from 'react';
import { HojaVid } from '../components/Logo';
import { useApp } from '../context/AppContext';
import { ClaveTexto } from '../lib/i18n';
import { NutriLinea, NutriTotal, sumarNutricion } from '../components/NutricionInfo';
import { otrosQueCoinciden } from '../lib/alergias';
import { PersonalizarModal } from '../components/PersonalizarModal';
import { nombreIngrediente } from '../lib/ingredientes';
import { esPersonalizable, hayPersonalizacion } from '../lib/personalizar';
import { ShoppingBag, Trash2, Plus, Minus, ArrowLeft, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface CarritoPageProps {
  onVolver: () => void;
  onComandaEnviada: () => void;
}

export const CarritoPage: React.FC<CarritoPageProps> = ({ onVolver, onComandaEnviada }) => {
  const {
    carrito,
    actualizarCantidad,
    eliminarDelCarrito,
    limpiarCarrito,
    totalPEN,
    alergiasDeclaradas,
    confirmarComanda,
    t,
    nombreAlergeno,
    comensales,
    nombreComensal,
    reasignarItem,
    itemAgotado,
    platos,
    idioma,
    personalizarItem,
  } = useApp();
  const [personalizando, setPersonalizando] = useState<string | null>(null);

  const [enviando, setEnviando] = useState<boolean>(false);
  const hayAgotados = carrito.some(itemAgotado);

  // Comprobar si algún item tiene conflicto con alergias declaradas
  // Cada ítem se compara con las alergias del comensal para quien se pidió
  const alergiasDe = (comensalId?: string) => comensales.find((c) => c.id === comensalId)?.alergias ?? alergiasDeclaradas;
  // Alergias estándar (por código del plato) y "Otros" (por las palabras que el comensal escribió)
  const conflictosDeItem = (i: (typeof carrito)[number]) => [
    ...(i.alergenos ?? []).filter((a) => alergiasDe(i.comensalId).includes(a)),
    ...otrosQueCoinciden(i.nombre, alergiasDe(i.comensalId)),
  ];
  const itemsConConflicto = carrito.filter((item) => conflictosDeItem(item).length > 0);
  const alergenosEnConflicto = [...new Set(itemsConConflicto.flatMap(conflictosDeItem))];

  // Información nutricional de lo que se está pidiendo (los ítems de bebida alcohólica por copa/botella no tienen ficha)
  const codigoDe = (id: string) => platos.find((p) => p.id === id)?.codigo;
  const itemsNutri = carrito.map((i) => ({ codigo: codigoDe(i.id), cantidad: i.cantidad, comensalId: i.comensalId, sin: i.sin }));
  const energiaPorComensal = comensales.length > 1
    ? comensales.map((c) => ({ c, tot: sumarNutricion(itemsNutri.filter((i) => i.comensalId === c.id)) })).filter((x) => x.tot)
    : [];

  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  const handleConfirmar = async () => {
    setEnviando(true);
    setErrorEnvio(null);
    try {
      await confirmarComanda();
      onComandaEnviada();
    } catch (e: any) {
      setErrorEnvio(e?.message ?? t('errEnvio'));
    } finally {
      setEnviando(false);
    }
  };

  if (carrito.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h3 className="font-serif-tacama text-xl font-bold text-stone-900">
          {t('vacioTitulo')}
        </h3>
        <p className="text-xs text-stone-500 max-w-xs mx-auto">
          {t('vacioDesc')}
        </p>
        <button
          onClick={onVolver}
          className="px-6 py-2.5 bg-[#577A17] text-white rounded-2xl text-xs font-semibold shadow hover:bg-[#466212] transition"
        >
          {t('explorar')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onVolver}
          className="flex items-center space-x-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 p-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('volverCarta')}</span>
        </button>
        <h2 className="font-serif-tacama text-lg font-bold text-stone-900">
          {t('resumen')}
        </h2>
        <button
          onClick={limpiarCarrito}
          className="text-xs text-stone-400 hover:text-rose-600 font-medium"
        >
          {t('vaciar')}
        </button>
      </div>

      {/* Allergen Warning Banner if conflicts detected */}
      {itemsConConflicto.length > 0 && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex items-start space-x-3 text-xs text-rose-900 shadow-sm">
          <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">{t('advTitulo')}</div>
            <p className="mt-0.5 text-rose-800">
              {t('advTexto', { n: alergenosEnConflicto.map(nombreAlergeno).join(', ') })}
            </p>
          </div>
        </div>
      )}

      {/* Cart items list */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-sm space-y-4">
        {carrito.map((item) => (
          <div
            key={item.lineaId ?? item.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-3 pb-4 border-b border-stone-100 last:border-0 last:pb-0"
          >
            <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-[#F4F8EA] flex items-center justify-center">
              {item.imagenUrl ? <img src={item.imagenUrl} alt="" className="w-full h-full object-cover" /> : <HojaVid className="w-7 h-7 opacity-30" />}
            </div>
            <div className="flex-1 min-w-[140px]">
              <span className="text-[10px] uppercase font-bold text-stone-400">
                {t(('t' + item.tipo) as ClaveTexto)}
              </span>
              <h4 className="font-serif-tacama text-sm font-bold text-stone-900">
                {item.nombre}
              </h4>
              <NutriLinea codigo={codigoDe(item.id)} />
              {hayPersonalizacion(item) && (
                <div className="mt-1 space-y-0.5">
                  {item.sin && item.sin.length > 0 && (
                    <p className={`text-[11px] font-semibold ${item.sinAlergia ? 'text-rose-700' : 'text-amber-700'}`}>
                      {t('perSin', { n: item.sin.map((id) => nombreIngrediente(id, idioma)).join(', ') })}
                    </p>
                  )}
                  {item.pedido && <p className="text-[11px] text-amber-700 italic">{t('perPedidoEtq', { n: item.pedido })}</p>}
                </div>
              )}
              {item.tipo === 'PLATO' && esPersonalizable(codigoDe(item.id)) && (
                <button
                  type="button"
                  onClick={() => setPersonalizando(item.lineaId ?? item.id)}
                  className="mt-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold text-[#466212] bg-white border border-[#CFE1A5] hover:border-[#577A17]"
                >
                  {t('perBoton')}
                </button>
              )}
              {itemAgotado(item) && (
                <p role="alert" className="text-[11px] font-bold text-rose-700">{t('agotado')}: {t('platoAgotadoCarrito', { n: item.nombre })}</p>
              )}
              {comensales.length > 1 && (
                <label className="mt-1 flex items-center gap-1.5 text-[11px] text-stone-500">
                  {t('asignarA')}
                  <select
                    value={item.comensalId}
                    onChange={(e) => reasignarItem(item.lineaId ?? item.id, e.target.value)}
                    className="border border-stone-300 rounded-md px-1.5 py-0.5 text-[11px] bg-white text-stone-800"
                  >
                    {comensales.map((c) => (
                      <option key={c.id} value={c.id}>{nombreComensal(c)}</option>
                    ))}
                  </select>
                </label>
              )}
              {item.notas && (
                <p className="text-[11px] text-amber-700 italic">{item.notas}</p>
              )}
              <div className="text-xs font-bold text-[#577A17] mt-1">
                S/ {(item.precioPEN * item.cantidad).toFixed(2)}
              </div>
            </div>

            <div className="ml-auto flex items-center space-x-3">
              <div className="flex items-center bg-stone-100 rounded-xl p-1 border border-stone-200">
                <button
                  onClick={() => actualizarCantidad(item.lineaId ?? item.id, -1)}
                  className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-stone-600 hover:bg-stone-200 shadow-xs"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-xs font-bold text-stone-900">
                  {item.cantidad}
                </span>
                <button
                  onClick={() => actualizarCantidad(item.lineaId ?? item.id, 1)}
                  className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-stone-600 hover:bg-stone-200 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => eliminarDelCarrito(item.lineaId ?? item.id)}
                className="text-stone-400 hover:text-rose-500 p-2"
                aria-label={t('eliminar')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Información nutricional de la selección */}
      <NutriTotal items={itemsNutri} />
      {energiaPorComensal.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-stone-200/80 space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#466212]">{t('nutriPorComensal')}</p>
          {energiaPorComensal.map(({ c, tot }) => (
            <div key={c.id} className="flex flex-wrap items-baseline justify-between gap-x-3 text-xs text-stone-700">
              <span className="font-medium">{nombreComensal(c)}</span>
              <span><strong className="text-stone-900">{Math.round(tot!.kcal).toLocaleString(idioma)} kcal</strong> · {Math.round(tot!.kj).toLocaleString(idioma)} kJ</span>
            </div>
          ))}
        </div>
      )}

      {/* Bill summary */}
      <div className="bg-stone-50 rounded-3xl p-5 border border-stone-200/80 space-y-2.5 text-xs text-stone-600">
        <div className="flex justify-between">
          <span>{t('subtotal')}</span>
          <span className="font-medium text-stone-900">S/ {(totalPEN / 1.18).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>{t('igv')}</span>
          <span className="font-medium text-stone-900">S/ {(totalPEN - totalPEN / 1.18).toFixed(2)}</span>
        </div>
        <div className="pt-2 border-t border-stone-200 flex justify-between text-sm font-bold text-stone-900">
          <span>{t('totalPagar')}</span>
          <span className="text-base text-[#577A17]">S/ {totalPEN.toFixed(2)}</span>
        </div>
      </div>

      {personalizando && (() => {
        const it = carrito.find((x) => (x.lineaId ?? x.id) === personalizando);
        const cod = it ? codigoDe(it.id) : undefined;
        return it && cod ? (
          <PersonalizarModal
            codigo={cod}
            plato={it.nombre}
            cantidad={it.cantidad}
            inicial={{ sin: it.sin ?? [], sinAlergia: !!it.sinAlergia, pedido: it.pedido ?? '' }}
            onGuardar={(p) => personalizarItem(personalizando, p)}
            onClose={() => setPersonalizando(null)}
          />
        ) : null;
      })()}

      {errorEnvio && (
        <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">{errorEnvio}</p>
      )}

      {/* Confirm CTA */}
      <button
        onClick={handleConfirmar}
        disabled={enviando || hayAgotados}
        className="w-full py-4 bg-gradient-to-r from-[#2E4310] via-[#577A17] to-[#466212] text-white rounded-2xl font-serif-tacama text-sm font-bold tracking-wider shadow-lg hover:shadow-xl transition disabled:opacity-50 flex items-center justify-center space-x-2"
      >
        <span>{enviando ? t('enviando') : t('confirmarEnviar')}</span>
      </button>
    </div>
  );
};
