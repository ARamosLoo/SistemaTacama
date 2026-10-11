import React from 'react';
import { rotuloFoto } from '../lib/fotos';
import { Plato } from '../types';
import { useApp } from '../context/AppContext';
import { HojaVid } from './Logo';
import { Wine, Plus, ShieldAlert, Leaf } from 'lucide-react';

interface PlatoCardProps {
  plato: Plato;
  onAbrirMaridaje: (plato: Plato) => void;
  coincidencia?: number;
}

export const PlatoCard: React.FC<PlatoCardProps> = ({ plato, onAbrirMaridaje, coincidencia }) => {
  const { agregarAlCarrito, alergiasDeclaradas, t, nombreAlergeno } = useApp();

  // Comprobar si el plato contiene algún alérgeno declarado por el usuario
  const conflictoAlergeno = plato.alergenos.filter((a) => alergiasDeclaradas.includes(a.codigo));
  const tieneConflicto = conflictoAlergeno.length > 0;
  const esBebida = plato.categoria === 'BEBIDA' || plato.seccion === 'GUARNICIONES';

  return (
    <article
      className={`bg-white rounded-2xl overflow-hidden shadow-sm border transition-all duration-300 hover:shadow-md flex flex-col ${
        tieneConflicto ? 'border-rose-300 ring-1 ring-rose-300' : 'border-stone-200'
      }`}
    >
      {/* Foto */}
      {(!esBebida || !!plato.imagenUrl) && (
        <div className="relative h-44 w-full bg-[#F4F8EA] overflow-hidden group">
          {plato.imagenUrl ? (
            <img
              src={plato.imagenUrl}
              alt={plato.nombre}
              className={`w-full h-full object-cover object-center group-hover:scale-105 transition duration-500 ${plato.disponible ? '' : 'grayscale opacity-60'}`}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <HojaVid className="w-14 h-14 opacity-30" />
            </div>
          )}
          {rotuloFoto(plato.imagenUrl) && (
            <div className="absolute bottom-3 right-3 bg-black/55 text-white px-2 py-0.5 rounded-full text-[10px] font-medium">{t(rotuloFoto(plato.imagenUrl)!)}</div>
          )}
          {coincidencia !== undefined && (
            <div className="absolute top-3 left-3 bg-[#577A17] text-white px-2.5 py-1 rounded-full text-[11px] font-bold shadow">
              {coincidencia}% {t('coincidencia')}
            </div>
          )}
          {tieneConflicto && (
            <div className="absolute bottom-3 left-3 bg-rose-600/95 text-white px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center space-x-1 shadow-md">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{t('contiene')}: {conflictoAlergeno.map((a) => nombreAlergeno(a.codigo)).join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex-grow">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-serif text-base font-semibold text-[#1F1F1F] leading-snug">{plato.nombre}</h3>
          {!plato.disponible && <span className="inline-block mt-1 text-[11px] font-bold uppercase tracking-wide text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">{t('agotado')}</span>}
            <span className="shrink-0 text-sm font-bold text-[#466212]">S/ {plato.precioPEN.toFixed(2)}</span>
          </div>

          {(plato.esVegetariano || plato.libreLactosa) && (
            <div className="flex gap-1.5 mt-1.5">
              {plato.esVegetariano && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#E6F0D0] text-[#384F0F] px-2 py-0.5 rounded-full">
                  <Leaf className="w-3 h-3" /> {t('vegetariano_b')}
                </span>
              )}
              {plato.libreLactosa && (
                <span className="text-[10px] font-semibold bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full">
                  {t('libreLactosa')}
                </span>
              )}
            </div>
          )}

          {plato.descripcion && plato.descripcion !== plato.nombre && !['Guarnición.', 'Side dish.', 'Accompagnement.', 'Guarnição.', 'Beilage.'].includes(plato.descripcion) && (
            <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed mt-2">{plato.descripcion}</p>
          )}

          {plato.maridajeTexto && (
            <p className="text-xs text-[#577A17] italic mt-2">
              {t('maridajeSug')}: {plato.maridajeTexto}
            </p>
          )}

          {plato.alergenos.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {plato.alergenos.map((a) => (
                <span
                  key={a.codigo}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                    alergiasDeclaradas.includes(a.codigo)
                      ? 'bg-rose-100 text-rose-800 font-bold border border-rose-200'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {nombreAlergeno(a.codigo)}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between gap-2">
          {plato.maridajeTexto && (
            <button
              type="button"
              onClick={() => onAbrirMaridaje(plato)}
              className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-[#F4F8EA] hover:bg-[#E6F0D0] text-[#384F0F] rounded-xl text-xs font-semibold border border-[#CFE1A5] transition"
            >
              <Wine className="w-3.5 h-3.5" />
              <span>{t('verMaridaje')}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              agregarAlCarrito({
                id: plato.id,
                tipo: 'PLATO',
                nombre: plato.nombre,
                precioPEN: plato.precioPEN,
                alergenos: plato.alergenos.map((a) => a.codigo),
                imagenUrl: plato.imagenUrl,
              })
            }
            disabled={!plato.disponible}
            className="flex-1 flex items-center justify-center space-x-1 px-4 py-2 bg-[#577A17] hover:bg-[#466212] text-white rounded-xl text-xs font-semibold shadow transition disabled:bg-stone-300 disabled:shadow-none disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{plato.disponible ? t('agregar') : t('agotado')}</span>
          </button>
        </div>
      </div>
    </article>
  );
};
