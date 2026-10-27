import React from 'react';
import { NUTRICION, InfoNutricional } from '../lib/nutricion';
import { useApp } from '../context/AppContext';

/** Información nutricional referencial de un plato por su código de carta (undefined si no hay datos). */
export const nutriDe = (codigo?: string): InfoNutricional | undefined => (codigo ? NUTRICION[codigo] : undefined);

interface Totales { kcal: number; kj: number; proteinas: number; grasas: number; carbohidratos: number; fibra: number }

/** Suma la información nutricional de varios platos (cada uno con su cantidad). */
export function sumarNutricion(items: { codigo?: string; cantidad?: number }[]): Totales | null {
  const t: Totales = { kcal: 0, kj: 0, proteinas: 0, grasas: 0, carbohidratos: 0, fibra: 0 };
  let hay = false;
  for (const it of items) {
    const n = nutriDe(it.codigo);
    if (!n) continue;
    hay = true;
    const c = it.cantidad ?? 1;
    t.kcal += n.kcal * c; t.kj += n.kj * c; t.proteinas += n.proteinas * c; t.grasas += n.grasas * c;
    t.carbohidratos += n.carbohidratos * c; t.fibra += n.fibra * c;
  }
  return hay ? t : null;
}

const useFmt = () => {
  const { idioma } = useApp();
  return (n: number) => Math.round(n).toLocaleString(idioma);
};

/** Línea corta: "320 kcal · 1.339 kJ" (y por persona si el plato se comparte). */
export const NutriLinea: React.FC<{ codigo?: string; className?: string }> = ({ codigo, className = '' }) => {
  const { t } = useApp();
  const f = useFmt();
  const n = nutriDe(codigo);
  if (!n) return null;
  return (
    <p className={`text-[11px] text-stone-600 ${className}`}>
      <span className="font-semibold text-stone-800">{f(n.kcal)} kcal</span> · {f(n.kj)} kJ
      {n.personas > 1 && <span className="block text-stone-500">{t('nutriCompartir', { kcal: f(n.kcal / n.personas), n: n.personas })}</span>}
    </p>
  );
};

const Dato: React.FC<{ etiqueta: string; valor: string }> = ({ etiqueta, valor }) => (
  <div className="bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-center min-w-0">
    <div className="text-xs font-bold text-stone-900">{valor}</div>
    <div className="text-[10px] text-stone-500 leading-tight break-words">{etiqueta}</div>
  </div>
);

/** Desplegable con el detalle de macronutrientes de un plato. */
export const NutriDetalle: React.FC<{ codigo?: string }> = ({ codigo }) => {
  const { t } = useApp();
  const f = useFmt();
  const n = nutriDe(codigo);
  if (!n) return null;
  return (
    <details className="group mt-2 rounded-xl border border-stone-200 bg-[#F7F8FA] px-3 py-2">
      <summary className="cursor-pointer select-none text-[11px] font-semibold text-[#466212] list-none flex items-center justify-between gap-2">
        <span>{t('nutriTitulo')}</span>
        <span className="text-stone-500 font-normal">{f(n.kcal)} kcal · {f(n.kj)} kJ</span>
      </summary>
      <div className="pt-2 space-y-2">
        <p className="text-[10px] text-stone-500">{t('nutriPorcion', { p: n.porcion })}</p>
        <div className={`grid gap-1.5 ${n.alcohol ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'}`}>
          <Dato etiqueta={t('nutriProteinas')} valor={`${f(n.proteinas)} g`} />
          <Dato etiqueta={t('nutriGrasas')} valor={`${f(n.grasas)} g`} />
          <Dato etiqueta={t('nutriCarbos')} valor={`${f(n.carbohidratos)} g`} />
          <Dato etiqueta={t('nutriFibra')} valor={`${f(n.fibra)} g`} />
          {!!n.alcohol && <Dato etiqueta={t('nutriAlcohol')} valor={`${f(n.alcohol)} g`} />}
        </div>
        <p className="text-[10px] text-stone-500 leading-relaxed">{t('nutriNota')}</p>
      </div>
    </details>
  );
};

/** Resumen de una selección: energía total y macronutrientes. */
export const NutriTotal: React.FC<{ items: { codigo?: string; cantidad?: number }[]; titulo?: string; compacto?: boolean }> = ({ items, titulo, compacto }) => {
  const { t } = useApp();
  const f = useFmt();
  const tot = sumarNutricion(items);
  if (!tot) return null;
  return (
    <div className="bg-[#F4F8EA] border border-[#CFE1A5] rounded-2xl p-3 space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#466212]">{titulo ?? t('nutriTotal')}</span>
        <span className="text-sm font-bold text-stone-900">{f(tot.kcal)} kcal <span className="font-normal text-stone-600">· {f(tot.kj)} kJ</span></span>
      </div>
      {!compacto && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <Dato etiqueta={t('nutriProteinas')} valor={`${f(tot.proteinas)} g`} />
          <Dato etiqueta={t('nutriGrasas')} valor={`${f(tot.grasas)} g`} />
          <Dato etiqueta={t('nutriCarbos')} valor={`${f(tot.carbohidratos)} g`} />
          <Dato etiqueta={t('nutriFibra')} valor={`${f(tot.fibra)} g`} />
        </div>
      )}
      <p className="text-[10px] text-stone-600 leading-relaxed">{t('nutriNota')}</p>
    </div>
  );
};
