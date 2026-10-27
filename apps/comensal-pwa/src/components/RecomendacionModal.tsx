import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from './Modal';
import { HojaVid } from './Logo';
import { NutriLinea, NutriTotal } from './NutricionInfo';
import { TIPO_ETIQUETA, ClaveTexto } from '../lib/i18n';
import { fotoEtiqueta, rotuloFoto } from '../lib/fotos';
import { motivosDeRecomendacion, Motivo } from '../lib/motivos';
import { MaridajeRecomendacion, Plato } from '../types';
import { X, Check, Wine, Coffee, Plus, ChevronRight, Sparkles, ShoppingBag } from 'lucide-react';

// Si hay empate de afinidad entre los maridajes del plato, se prefiere el tipo de bebida
// que va con el estilo de comida elegido por el comensal.
const TIPOS_POR_ESTILO: Record<string, string[]> = {
  ligero: ['VINO_BLANCO', 'VINO_ESPUMANTE'],
  contundente: ['VINO_TINTO'],
  dulce: ['PISCO_PURO', 'PISCO_ACHOLADO', 'VINO_BLANCO'],
};

type Curso = 'entrada' | 'fondo' | 'postre' | 'piqueo' | 'bebida';

interface Alternativa {
  id: string;
  nombre: string;
  coincidencia: number;
  elegir: () => void;
}

interface Tarjeta {
  id: string; // identifica la opción elegida (para marcar "agregado")
  clave: ClaveTexto;
  titulo: string;
  subtitulo?: string;
  precio: number;
  aviso?: string | null; // aviso de stock de la bebida sugerida
  plato?: Plato; // para mostrar descripción, dieta y alérgenos
  motivos?: Motivo[]; // por qué se recomienda
  imagen?: string;
  coincidencia?: number;
  icono?: React.ReactNode;
  alternativas?: Alternativa[];
  agregar: () => void;
  opcional?: boolean; // extra para compartir: no entra en "agregar todo"
}

/**
 * Ventana emergente con la comida completa recomendada: entrada y postre (si los pidió),
 * plato de fondo y bebida. Cada curso muestra la mejor opción y hasta 2 alternativas para cambiarla.
 * En el almuerzo la bebida es venta cruzada de productos Tacama: siempre un vino o un pisco, nunca un
 * refresco; sigue al plato de fondo elegido. En el desayuno no se sugiere alcohol: se recomienda lo que
 * se suele tomar de desayuno (café, infusión o jugo) según el estilo de comida elegido.
 */
export const RecomendacionModal: React.FC<{ onIrAlCarrito: () => void }> = ({ onIrAlCarrito }) => {
  const { menuRecomendado, perfil, momento, platos, etiquetas, alergiasDeclaradas, comensales, activoIdx, seleccionarComensal, nombreComensal, obtenerMaridajes, agregarAlCarrito, avisoStock, nombreAlergeno, setMostrarRecomendacion, t, idioma } = useApp();
  const varios = comensales.length > 1;
  const comensalActivo = comensales[activoIdx];
  const [bebidaVino, setBebidaVino] = useState<MaridajeRecomendacion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [agregado, setAgregado] = useState<Record<string, boolean>>({});
  const [sel, setSel] = useState<Record<Curso, number>>({ entrada: 0, fondo: 0, postre: 0, piqueo: 0, bebida: 0 });

  useEffect(() => {
    setSel({ entrada: 0, fondo: 0, postre: 0, piqueo: 0, bebida: 0 });
  }, [activoIdx]);

  const cerrar = () => setMostrarRecomendacion(false);
  // Las marcas de "agregado" se llevan por comensal
  const kid = (id: string) => `${comensalActivo?.id}:${id}`;
  const evitaVino = alergiasDeclaradas.includes('SULFITOS');
  const esDesayuno = momento === 'desayuno';
  const esNino = !!perfil?.esNino;

  const indice = (curso: Curso) => {
    const lista = menuRecomendado?.[curso] ?? [];
    return sel[curso] < lista.length ? sel[curso] : 0;
  };
  const opcion = (curso: Curso) => (menuRecomendado?.[curso] ?? [])[indice(curso)] ?? null;
  const fondo = opcion('fondo')?.plato;

  // Bebida de almuerzo: maridaje del plato de fondo elegido (siempre vino o pisco)
  useEffect(() => {
    let activo = true;
    setCargando(true);
    if (!fondo || esDesayuno || esNino) {
      setBebidaVino(null);
      setCargando(false);
      return;
    }
    obtenerMaridajes(fondo).then((recs) => {
      if (!activo) return;
      const preferidos = TIPOS_POR_ESTILO[perfil?.estilo ?? ''] ?? [];
      // Con alergia a sulfitos solo se consideran piscos
      const posibles = evitaVino ? recs.filter((r) => r.tipo.startsWith('PISCO')) : recs;
      const mejor = Math.max(0, ...posibles.map((r) => r.puntuacionAfinidad));
      const empatadas = posibles.filter((r) => r.puntuacionAfinidad === mejor);
      let elegida: MaridajeRecomendacion | null = empatadas.find((r) => preferidos.includes(r.tipo)) ?? empatadas[0] ?? null;

      // Si el plato no tiene un maridaje utilizable, se toma un pisco (o vino) del catálogo con stock
      if (!elegida) {
        const catalogo = etiquetas
          .filter((e) => e.stockActual > 0 && (evitaVino ? e.tipo.startsWith('PISCO') : true))
          .sort((x, y) => (preferidos.includes(y.tipo) ? 1 : 0) - (preferidos.includes(x.tipo) ? 1 : 0) || x.precioBotellaPEN - y.precioBotellaPEN);
        const e = catalogo[0];
        if (e) elegida = { etiquetaId: e.id, nombre: e.nombre, linea: e.linea, tipo: e.tipo, precioBotellaPEN: e.precioBotellaPEN, precioCopaPEN: e.precioCopaPEN, stockActual: e.stockActual, explicacionSommelier: e.notaCata, puntuacionAfinidad: 0 };
      }
      setBebidaVino(elegida);
      setCargando(false);
    });
    return () => { activo = false; };
  }, [fondo?.id, perfil?.estilo, evitaVino, etiquetas.length, esDesayuno, esNino]);

  const marcar = (id: string, fn: () => void) => () => {
    fn();
    setAgregado((a) => ({ ...a, [kid(id)]: true }));
  };

  const platoCarta = (p: Plato) => () =>
    agregarAlCarrito({ id: p.id, tipo: 'PLATO', nombre: p.nombre, precioPEN: p.precioPEN, alergenos: p.alergenos.map((a) => a.codigo), imagenUrl: p.imagenUrl });

  // Tarjeta de un curso con sus alternativas (las otras opciones de la lista)
  const tarjetaCurso = (curso: Curso, clave: ClaveTexto): Tarjeta | null => {
    const lista = menuRecomendado?.[curso] ?? [];
    const actual = opcion(curso);
    if (!actual) return null;
    const actualIdx = indice(curso);
    return {
      id: actual.plato.id,
      clave,
      titulo: actual.plato.nombre,
      precio: actual.plato.precioPEN,
      imagen: actual.plato.imagenUrl,
      coincidencia: actual.coincidencia,
      alternativas: lista
        .map((o, i) => ({ o, i }))
        .filter(({ i }) => i !== actualIdx)
        .map(({ o, i }) => ({ id: o.plato.id, nombre: o.plato.nombre, coincidencia: o.coincidencia, elegir: () => setSel((s) => ({ ...s, [curso]: i })) })),
      plato: actual.plato,
      motivos: motivosDeRecomendacion(actual.plato, curso === 'bebida' ? 'fondo' : curso, perfil, { populares: !!menuRecomendado?.populares, esNino, alergias: alergiasDeclaradas.map(nombreAlergeno) }),
      agregar: platoCarta(actual.plato),
    };
  };

  const tarjetas: Tarjeta[] = [];
  const entrada = tarjetaCurso('entrada', 'recEntrada');
  const principal = tarjetaCurso('fondo', esDesayuno ? 'recDesayuno' : 'recFondo');
  const postre = tarjetaCurso('postre', 'recPostre');
  const piqueo = tarjetaCurso('piqueo', 'recPiqueo');
  if (entrada) tarjetas.push(entrada);
  if (principal) tarjetas.push(principal);
  if (postre) tarjetas.push(postre);

  // Niños (almuerzo o desayuno): chicha morada, limonada, maracuyá o gaseosa; nunca vino, pisco ni café.
  // El principal es la chicha y las demás quedan como alternativas.
  if (esNino && fondo) {
    const ORDEN = ['TAC-088', 'TAC-094', 'TAC-091', 'TAC-085'];
    const ok = ORDEN.map((c) => platos.find((p) => p.codigo === c)).filter(
      (p): p is Plato => !!p && p.disponible && !p.alergenos.some((a) => alergiasDeclaradas.includes(a.codigo)),
    );
    const i = sel.bebida < ok.length ? sel.bebida : 0;
    const b = ok[i];
    if (b) {
      tarjetas.push({
        id: b.id,
        clave: 'recBebida',
        titulo: b.nombre,
        motivos: [{ k: 'motivoBebidaNino' }],
        precio: b.precioPEN,
        imagen: b.imagenUrl,
        icono: <Coffee className="w-8 h-8 text-[#577A17]" />,
        alternativas: ok.map((o, j) => ({ o, j })).filter(({ j }) => j !== i).map(({ o, j }) => ({ id: o.id, nombre: o.nombre, coincidencia: 0, elegir: () => setSel((x) => ({ ...x, bebida: j })) })),
        agregar: platoCarta(b),
      });
    }
  }

  // Bebida de desayuno (adultos): café, infusión o jugo, según el estilo de comida; sin alérgenos declarados
  if (esDesayuno && !esNino && fondo) {
    const candidatas = platos
      .filter((p) => p.disponible && p.tags.includes('desayuno_bebida') && !p.alergenos.some((a) => alergiasDeclaradas.includes(a.codigo)))
      .sort((a, b) => (b.estilo === perfil?.estilo ? 1 : 0) - (a.estilo === perfil?.estilo ? 1 : 0) || b.precioPEN - a.precioPEN);
    const b = candidatas[0];
    if (b) {
      tarjetas.push({
        id: b.id,
        clave: 'recBebida',
        titulo: b.nombre,
        motivos: [{ k: 'motivoBebidaDesayuno' }],
        precio: b.precioPEN,
        imagen: b.imagenUrl,
        icono: <Coffee className="w-8 h-8 text-[#577A17]" />,
        agregar: platoCarta(b),
      });
    }
  }

  // Bebida de almuerzo: vino o pisco que marida con el plato de fondo
  if (!esDesayuno && bebidaVino && fondo) {
    const esPisco = bebidaVino.tipo.startsWith('PISCO');
    const usaCopa = !esPisco && !!bebidaVino.precioCopaPEN;
    const idBebida = `${bebidaVino.etiquetaId}-${usaCopa ? 'copa' : 'botella'}`;
    tarjetas.push({
      id: idBebida,
      clave: 'recBebida',
      titulo: bebidaVino.nombre,
      subtitulo: `${TIPO_ETIQUETA[bebidaVino.tipo]?.[idioma] ?? ''} · ${t('recMarida', { n: fondo.nombre })}`,
      precio: usaCopa ? bebidaVino.precioCopaPEN! : bebidaVino.precioBotellaPEN,
      aviso: avisoStock(bebidaVino.etiquetaId),
      motivos: [{ k: 'motivoBebidaVino', v: { n: fondo.nombre } }],
      imagen: fotoEtiqueta({ tipo: bebidaVino.tipo }),
      icono: <Wine className="w-8 h-8 text-[#577A17]" />,
      agregar: () =>
        agregarAlCarrito({
          id: idBebida,
          tipo: esPisco ? 'PISCO' : 'VINO',
          nombre: `${bebidaVino.nombre} (${usaCopa ? t('copa') : t('botella')})`,
          precioPEN: usaCopa ? bebidaVino.precioCopaPEN! : bebidaVino.precioBotellaPEN,
          notas: `${t('marMotivo')}: ${fondo.nombre}`,
          imagenUrl: fotoEtiqueta({ tipo: bebidaVino.tipo }),
        }),
    });
  }

  if (piqueo) tarjetas.push({ ...piqueo, opcional: true });

  const incluidas = tarjetas.filter((c) => !c.opcional);
  const agregarTodo = () => {
    incluidas.forEach((c) => {
      if (!agregado[kid(c.id)]) c.agregar();
    });
    setAgregado((a) => ({ ...a, ...Object.fromEntries(incluidas.map((c) => [kid(c.id), true])) }));
  };
  const todoAgregado = incluidas.length > 0 && incluidas.every((c) => agregado[kid(c.id)]);
  const algunAgregado = Object.keys(agregado).length > 0;
  const irAlCarrito = () => {
    cerrar();
    onIrAlCarrito();
  };

  return (
    <Modal onClose={cerrar} etiqueta={t('recTitulo')}>
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#CFE1A5] relative max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-[#577A17] flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-semibold text-[#1F1F1F]">{t('recTitulo')}</h3>
              {varios && comensalActivo ? (
                <p className="text-xs font-semibold text-[#466212]">{t('recPara', { n: nombreComensal(comensalActivo) })}{menuRecomendado?.populares ? ` · ${t('recPopular')}` : ''}</p>
              ) : (
                <p className="text-xs text-stone-600">{menuRecomendado?.populares ? t('recPopularSub') : esNino ? t('recSubNino') : t('recSub')}</p>
              )}
            </div>
          </div>
          <button onClick={cerrar} aria-label={t('cerrar')} className="text-stone-400 hover:text-stone-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {varios && (
          <div className="flex flex-wrap gap-2 pt-3" role="group" aria-label={t('pidiendoPara')}>
            {comensales.map((c, i) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={i === activoIdx}
                onClick={() => seleccionarComensal(i)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition flex items-center gap-1.5 ${
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
          </div>
        )}

        <div className="overflow-y-auto py-4 space-y-3 flex-grow pr-1">
          {tarjetas.length === 0 && !cargando && <p className="text-sm text-stone-500 text-center py-6">{t('recSinDatos')}</p>}
          {cargando && <p className="text-sm text-stone-500 text-center py-2">{t('consultando')}</p>}
          {menuRecomendado?.sinFondoVegetariano && (
            <div role="note" className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-xs text-amber-900 leading-relaxed">
              <strong className="block uppercase tracking-wide text-[10px] mb-0.5">{t('recFondo')}</strong>
              {t('sinFondoVegetariano')}
            </div>
          )}
          {tarjetas.map((c) => (
            <div key={c.clave} className="bg-[#F7F8FA] border border-stone-200 rounded-2xl p-3 space-y-2">
              <div className="flex gap-3">
                <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-[#F4F8EA] flex items-center justify-center">
                  {c.imagen ? <img src={c.imagen} alt="" className="w-full h-full object-cover" /> : c.icono ?? <HojaVid className="w-9 h-9 opacity-40" />}
                  {rotuloFoto(c.imagen) && <span className="absolute inset-x-0 bottom-0 bg-black/55 text-white text-[8px] text-center py-0.5">{t(rotuloFoto(c.imagen)!)}</span>}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#577A17]">{t(c.clave)}</span>
                    {!!c.coincidencia && !menuRecomendado?.populares && !esNino && (
                      <span className="text-[10px] font-bold bg-[#577A17] text-white px-2 py-0.5 rounded-full">
                        {c.coincidencia}% {t('coincidencia')}
                      </span>
                    )}
                  </div>
                  <h4 className="font-serif text-sm font-semibold text-[#1F1F1F] leading-snug">{c.titulo}</h4>
                  {c.subtitulo && <p className="text-[11px] text-stone-500 italic">{c.subtitulo}</p>}
                  {c.aviso && <p className="text-[11px] font-bold text-orange-700">{c.aviso}</p>}
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-sm font-bold text-[#466212]">S/ {c.precio.toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={marcar(c.id, c.agregar)}
                      disabled={agregado[kid(c.id)]}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        agregado[kid(c.id)] ? 'bg-[#E6F0D0] text-[#384F0F]' : 'bg-[#577A17] hover:bg-[#466212] text-white'
                      }`}
                    >
                      {agregado[kid(c.id)] ? <><Check className="w-3.5 h-3.5" /> {t('recAgregado')}</> : <><Plus className="w-3.5 h-3.5" /> {t('agregar')}</>}
                    </button>
                  </div>
                </div>
              </div>

              {c.plato && (
                <div className="space-y-2">
                  <p className="text-xs text-stone-600 leading-relaxed">{c.plato.descripcion}</p>
                  <NutriLinea codigo={c.plato.codigo} />
                  <div className="flex flex-wrap gap-1.5">
                    {c.plato.esVegetariano && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E6F0D0] text-[#384F0F]">{t('vegetariano')}</span>}
                    {c.plato.alergenos.length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                        {t('contiene')}: {c.plato.alergenos.map((a) => nombreAlergeno(a.codigo)).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {c.motivos && c.motivos.length > 0 && (
                <div className="bg-[#F4F8EA] border border-[#CFE1A5] rounded-xl px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#466212] mb-1">{t('motivoPorque')}</p>
                  <ul className="list-disc pl-4 text-xs text-stone-700 space-y-0.5">
                    {c.motivos.map((m, i) => (
                      <li key={i}>
                        {t(m.k, {
                          ...(m.v ?? {}),
                          ...Object.fromEntries(Object.entries(m.vt ?? {}).map(([k, v]) => [k, t(v).toLowerCase()])),
                        })}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {c.alternativas && c.alternativas.length > 0 && (
                <div className="pt-2 border-t border-stone-200">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-1.5">{t('otrasOpciones')}</p>
                  <div className="flex flex-col gap-1.5">
                    {c.alternativas.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={a.elegir}
                        className="flex items-center justify-between gap-2 text-left text-xs bg-white border border-stone-200 hover:border-[#577A17] hover:text-[#466212] rounded-lg px-3 py-1.5 transition"
                      >
                        <span className="truncate">{a.nombre}</span>
                        {!!a.coincidencia && !menuRecomendado?.populares && !esNino && <span className="shrink-0 font-semibold text-[#577A17]">{a.coincidencia}%</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-stone-100 flex flex-col gap-2">
          <NutriTotal compacto titulo={t('nutriTotalComida')} items={tarjetas.filter((c) => c.plato && !c.opcional).map((c) => ({ codigo: c.plato!.codigo }))} />
          {todoAgregado ? (
            <button
              type="button"
              onClick={irAlCarrito}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-[#577A17] hover:bg-[#466212] transition"
            >
              <ShoppingBag className="w-4 h-4" /> {t('irCarrito')}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={agregarTodo}
                disabled={incluidas.length === 0}
                className="w-full py-3 rounded-xl text-sm font-bold text-white bg-[#577A17] hover:bg-[#466212] disabled:bg-stone-300 transition"
              >
                {t('agregarTodo')}
              </button>
              {algunAgregado && (
                <button
                  type="button"
                  onClick={irAlCarrito}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-[#384F0F] bg-[#E6F0D0] hover:bg-[#D8E8B8] transition"
                >
                  <ShoppingBag className="w-4 h-4" /> {t('irCarrito')}
                </button>
              )}
            </>
          )}
          <button
            type="button"
            onClick={cerrar}
            className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold text-[#466212] border-2 border-[#577A17] hover:bg-[#F4F8EA] transition"
          >
            {t('verCartaPersonalizada')} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Modal>
  );
};
