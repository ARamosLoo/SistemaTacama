import React, { useState } from 'react';
import { fotoEtiqueta } from '../lib/fotos';
import { useApp } from '../context/AppContext';
import { PlatoCard } from '../components/PlatoCard';
import { MaridajeModal } from '../components/MaridajeModal';
import { GrupoModal } from '../components/GrupoModal';
import { Plato } from '../types';
import { SECCIONES, TIPO_ETIQUETA } from '../lib/i18n';
import { Search, Wine, SlidersHorizontal, Sparkles, Users } from 'lucide-react';

const GRUPO_BEBIDAS = ['BEBIDAS', 'CAFE', 'INFUSIONES'];

export const CartaPage: React.FC<{ onEditarGustos: () => void }> = ({ onEditarGustos }) => {
  const { platos: todosLosPlatos, etiquetas, agregarAlCarrito, cargandoCarta, errorCarta, idioma, recomendados, perfil, momento, setMomento, comensales, activoIdx, seleccionarComensal, nombreComensal, setMostrarRecomendacion, avisoStock, t } = useApp();
  // La carta se segmenta por momento del día: solo se muestran los platos de desayuno o de almuerzo
  const platos = todosLosPlatos.filter((p) => p.momentos.includes(momento.toUpperCase()));
  const [categoriaActiva, setCategoriaActiva] = useState<string>('TODOS');
  const [busqueda, setBusqueda] = useState<string>('');
  const [platoParaMaridaje, setPlatoParaMaridaje] = useState<Plato | null>(null);
  const [grupoAbierto, setGrupoAbierto] = useState(false);

  const etiquetaSeccion = (id: string) => {
    const s = SECCIONES.find((x) => x.id === id);
    return s ? s.nombres[idioma] : id;
  };

  const hayEnSeccion = (id: string) => platos.some((p) => (id === 'BEBIDAS_GRUPO' ? GRUPO_BEBIDAS.includes(p.seccion) : p.seccion === id));
  const categorias = [
    { id: 'TODOS', label: t('todo') },
    ...SECCIONES.filter((s) => hayEnSeccion(s.id)).map((s) => ({ id: s.id, label: s.nombres[idioma] })),
    { id: 'VINOS', label: t('vinos') },
  ];

  // Si la sección elegida no existe en el otro momento, vuelve a toda la carta
  React.useEffect(() => {
    if (categoriaActiva !== 'TODOS' && categoriaActiva !== 'VINOS' && !hayEnSeccion(categoriaActiva)) setCategoriaActiva('TODOS');
  }, [momento, todosLosPlatos.length]);

  const q = busqueda.trim().toLowerCase();
  const coincideBusqueda = (p: Plato) =>
    !q || p.nombre.toLowerCase().includes(q) || p.descripcion.toLowerCase().includes(q);

  const enSeccion = (p: Plato, id: string) =>
    id === 'BEBIDAS_GRUPO' ? GRUPO_BEBIDAS.includes(p.seccion) : p.seccion === id;

  const idsMostrar = categoriaActiva === 'TODOS' ? SECCIONES.map((s) => s.id) : [categoriaActiva];
  const bloques = idsMostrar
    .map((id) => ({ id, platos: platos.filter((p) => enSeccion(p, id) && coincideBusqueda(p)) }))
    .filter((b) => b.platos.length > 0);

  const mostrarRecomendados = perfil && !perfil.omitido && categoriaActiva === 'TODOS' && !q;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-fade-in pb-24">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden shadow-sm bg-gradient-to-r from-[#2E4310] via-[#466212] to-[#577A17] text-white p-6 md:p-8">
        <div className="max-w-xl space-y-2 relative z-10">
          <div className="inline-flex items-center space-x-2 bg-white/15 border border-white/25 px-3 py-1 rounded-full text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('heroBadge')}</span>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold">{t('heroTitulo')}</h2>
          <p className="text-sm text-white/90 leading-relaxed font-light">{t('heroDesc')}</p>
        </div>
      </div>

      {/* Momento del día */}
      <div className="inline-flex bg-white border border-stone-300 rounded-full p-1" role="group" aria-label={t('momentoTitulo')}>
        {(['desayuno', 'almuerzo'] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={momento === m}
            onClick={() => setMomento(m)}
            className={`px-5 py-1.5 rounded-full text-sm font-semibold transition ${
              momento === m ? 'bg-[#577A17] text-white shadow-sm' : 'text-stone-600 hover:text-[#466212]'
            }`}
          >
            {t(m)}
          </button>
        ))}
      </div>

      {/* Comensal para quien se pide (mesas con varias personas) */}
      {(
        <div className="space-y-1.5" role="group" aria-label={t('pidiendoPara')}>
          {comensales.length > 1 && <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">{t('pidiendoPara')}</p>}
          <div className="flex flex-wrap gap-2">
            {comensales.map((c, i) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={i === activoIdx}
                onClick={() => seleccionarComensal(i)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition flex items-center gap-1.5 ${
                  i === activoIdx ? 'bg-[#1F1F1F] text-white border-[#1F1F1F]' : 'bg-white text-stone-700 border-stone-300 hover:border-[#1F1F1F]'
                }`}
              >
                {nombreComensal(c)}
                {c.alergias.length > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${i === activoIdx ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-800'}`}>
                    {c.alergias.length}
                  </span>
                )}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setGrupoAbierto(true)}
              className="px-4 py-2 rounded-full text-sm font-semibold border border-dashed border-stone-400 text-stone-600 hover:border-[#577A17] hover:text-[#466212] transition flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" /> {t('grupoCambiar')}
            </button>
          </div>
        </div>
      )}
      {grupoAbierto && <GrupoModal onClose={() => setGrupoAbierto(false)} />}

      {/* Búsqueda y categorías */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('buscar')}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-white border border-stone-300 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#577A17]/25 focus:border-[#577A17]"
          />
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar" role="tablist">
          {categorias.map((cat) => (
            <button
              key={cat.id}
              role="tab"
              aria-selected={categoriaActiva === cat.id}
              onClick={() => setCategoriaActiva(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                categoriaActiva === cat.id
                  ? 'bg-[#577A17] text-white shadow-sm'
                  : 'bg-white text-stone-700 border border-stone-300 hover:border-[#577A17]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recomendaciones por gusto */}
      {mostrarRecomendados && (
        <section className="space-y-3 bg-[#F4F8EA] border border-[#CFE1A5] rounded-2xl p-4" aria-labelledby="t-rec">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 id="t-rec" className="font-serif text-lg font-semibold text-[#2E4310]">{t('recomendados')}</h3>
              <p className="text-xs text-[#466212]">{t('recomendadosSub')}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setMostrarRecomendacion(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#577A17] hover:bg-[#466212] px-3 py-1.5 rounded-full"
              >
                <Sparkles className="w-3.5 h-3.5" /> {t('continuar')}
              </button>
              <button
                type="button"
                onClick={onEditarGustos}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#466212] bg-white border border-[#CFE1A5] hover:border-[#577A17] px-3 py-1.5 rounded-full"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" /> {t('editarGustos')}
              </button>
            </div>
          </div>
          {recomendados.length === 0 ? (
            <p className="text-sm text-stone-600">{t('sinRecomendaciones')}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recomendados.map((r) => (
                <PlatoCard key={r.plato.id} plato={r.plato} coincidencia={r.coincidencia} onAbrirMaridaje={(p) => setPlatoParaMaridaje(p)} />
              ))}
            </div>
          )}
        </section>
      )}

      {perfil?.omitido && categoriaActiva === 'TODOS' && !q && (
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => setMostrarRecomendacion(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#577A17] hover:bg-[#466212] px-3 py-1.5 rounded-full"
          >
            <Sparkles className="w-3.5 h-3.5" /> {t('continuar')}
          </button>
          <button
            type="button"
            onClick={onEditarGustos}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#466212] bg-white border border-[#CFE1A5] hover:border-[#577A17] px-3 py-1.5 rounded-full"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" /> {t('editarGustos')}
          </button>
        </div>
      )}

      {/* Vinos y piscos */}
      {categoriaActiva === 'VINOS' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-semibold text-[#1F1F1F] flex items-center gap-2">
              <Wine className="w-5 h-5 text-[#577A17]" />
              {t('vinos')}
            </h3>
            <span className="text-xs text-stone-500 font-medium">{t('stock')}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {etiquetas.map((etq) => (
              <div key={etq.id} className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-start gap-3">
                    <img src={fotoEtiqueta(etq)} alt="" loading="lazy" className="w-20 h-20 rounded-xl object-cover shrink-0 bg-[#F4F8EA]" />
                    <div className="flex-grow">
                      <span className="text-[10px] font-bold uppercase text-[#577A17] tracking-wider">{etq.linea}</span>
                      <h4 className="font-serif font-semibold text-base text-[#1F1F1F]">{etq.nombre}</h4>
                      <span className="text-xs text-stone-500">
                        {TIPO_ETIQUETA[etq.tipo]?.[idioma] ?? etq.tipo} · {etq.stockActual} {t('botellas')}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-[#466212] text-sm">S/ {etq.precioBotellaPEN.toFixed(2)}</div>
                      {etq.precioCopaPEN && <div className="text-[11px] text-stone-500">S/ {etq.precioCopaPEN.toFixed(2)}</div>}
                    </div>
                  </div>
                  <p className="text-xs text-stone-600 mt-2 italic bg-[#F7F8FA] p-2.5 rounded-xl border border-stone-100">{etq.notaCata}</p>
                </div>
                {avisoStock(etq.id) && (
                  <p className={`text-xs font-bold ${etq.agotado ? 'text-rose-700' : etq.nivel === 'CRITICO' ? 'text-orange-700' : 'text-amber-700'}`}>
                    {avisoStock(etq.id)}
                  </p>
                )}
                <div className="flex space-x-2 pt-2 border-t border-stone-100">
                  {etq.precioCopaPEN && (
                    <button
                      onClick={() => agregarAlCarrito({ id: `${etq.id}-copa`, tipo: 'VINO', nombre: `${etq.nombre} (${t('copa')})`, precioPEN: etq.precioCopaPEN!, imagenUrl: fotoEtiqueta(etq) })}
                      disabled={etq.agotado}
                      className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      + {t('copa')}
                    </button>
                  )}
                  <button
                    onClick={() => agregarAlCarrito({ id: `${etq.id}-botella`, tipo: etq.tipo.startsWith('PISCO') ? 'PISCO' : 'VINO', nombre: `${etq.nombre} (${t('botella')})`, precioPEN: etq.precioBotellaPEN, imagenUrl: fotoEtiqueta(etq) })}
                    disabled={etq.agotado}
                    className="flex-1 py-2 bg-[#577A17] hover:bg-[#466212] text-white rounded-xl text-xs font-semibold shadow transition disabled:bg-stone-300 disabled:shadow-none disabled:cursor-not-allowed"
                  >
                    + {t('botella')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {cargandoCarta && platos.length === 0 && <p className="text-sm text-stone-500 text-center py-10">{t('cargando')}</p>}
          {errorCarta && platos.length === 0 && <p className="text-sm text-rose-700 text-center py-10">{errorCarta}</p>}
          {!cargandoCarta && platos.length > 0 && bloques.length === 0 && (
            <p className="text-sm text-stone-500 text-center py-10">{t('sinResultados')}</p>
          )}
          {bloques.map((b) => (
            <section key={b.id} aria-labelledby={`sec-${b.id}`} className="space-y-4">
              <h3 id={`sec-${b.id}`} className="font-serif text-2xl text-[#1F1F1F] border-b border-stone-200 pb-2">
                {etiquetaSeccion(b.id)}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {b.platos.map((plato) => (
                  <PlatoCard key={plato.id} plato={plato} onAbrirMaridaje={(p) => setPlatoParaMaridaje(p)} />
                ))}
              </div>
            </section>
          ))}
          {bloques.length > 0 && (
            <p className="text-[11px] text-stone-500 text-center pt-2">
              {t('leyenda')} · {t('preciosIncluyen')}
            </p>
          )}
        </div>
      )}

      <MaridajeModal plato={platoParaMaridaje} onClose={() => setPlatoParaMaridaje(null)} />
    </div>
  );
};
