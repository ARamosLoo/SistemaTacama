import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { MarcaTambo } from '../components/Logo';
import { ClaveTexto, ALERGENOS_NOMBRE } from '../lib/i18n';
import { Origen, PerfilComensal, Momento } from '../types';
import { Globe2, MapPin, ArrowLeft, Check, ChevronRight, Sparkles } from 'lucide-react';

const PROTEINAS: ClaveTexto[] = ['res', 'cerdo', 'pollo', 'pescado', 'vegetariano', 'cualquiera'];
const INTENSIDADES: { v: 0 | 1 | 2; k: ClaveTexto }[] = [
  { v: 0, k: 'suave' },
  { v: 1, k: 'moderado' },
  { v: 2, k: 'intenso' },
];
const ESTILOS: ClaveTexto[] = ['ligero', 'contundente', 'dulce'];
const ENTRADAS_TIPO: { v: string; k: ClaveTexto }[] = [
  { v: 'fresca', k: 'eFresca' },
  { v: 'crocante', k: 'eCrocante' },
  { v: 'cremosa', k: 'eCremosa' },
  { v: 'marina', k: 'eMarina' },
  { v: 'tradicional', k: 'eTradicional' },
];
const POSTRES_TIPO: { v: string; k: ClaveTexto }[] = [
  { v: 'chocolate', k: 'pChocolate' },
  { v: 'cremoso', k: 'pCremoso' },
  { v: 'frutal', k: 'pFrutal' },
  { v: 'frutos', k: 'pFrutos' },
  { v: 'variado', k: 'pVariado' },
];
// Códigos de alérgenos que se pueden declarar
const CODIGOS_ALERGENO = Object.keys(ALERGENOS_NOMBRE);

const Chip: React.FC<{ activo: boolean; onClick: () => void; children: React.ReactNode }> = ({ activo, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={activo}
    className={`px-4 py-2.5 rounded-full text-sm font-medium border transition flex items-center gap-1.5 ${
      activo
        ? 'bg-[#577A17] text-white border-[#577A17] shadow-sm'
        : 'bg-white text-stone-700 border-stone-300 hover:border-[#577A17] hover:text-[#466212]'
    }`}
  >
    {activo && <Check className="w-3.5 h-3.5" />}
    {children}
  </button>
);

/** Indicador de avance: cantidad de personas, origen y gustos (en edición solo los dos últimos). */
const Progreso: React.FC<{ paso: number; total: number }> = ({ paso, total }) => {
  const { t } = useApp();
  return (
    <div className="space-y-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={paso} aria-label={t('progreso', { n: paso, m: total })}>
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < paso ? 'bg-[#577A17]' : 'bg-stone-200'}`} />
        ))}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 text-center">{t('progreso', { n: paso, m: total })}</p>
    </div>
  );
};

const Pregunta: React.FC<{ titulo: string; obligatoria: boolean; children: React.ReactNode }> = ({ titulo, obligatoria, children }) => (
  <fieldset className="space-y-3">
    <legend className="font-serif text-lg text-[#1F1F1F]">
      {titulo}
      {obligatoria && <span className="text-[#577A17] ml-1" aria-hidden="true">*</span>}
    </legend>
    <div className="flex flex-wrap gap-2">{children}</div>
  </fieldset>
);

interface FormularioProps {
  multi: boolean; // se está configurando una mesa con varios comensales
  indice: number;
  total: number;
  esUltimo: boolean;
}

/** Formulario de alergias y gustos de UN comensal. */
const FormularioComensal: React.FC<FormularioProps> = ({ multi, indice, total, esUltimo }) => {
  const { guardarPerfil, perfil, momento, setMomento, setMostrarRecomendacion, alergiasDeclaradas, setAlergiasDeclaradas, nombreAlergeno, comensales, avanzarComensal, retrocederComensal, reiniciarMesa, mesaConfigurada, terminarConfiguracion, renombrarComensal, t } = useApp();
  const sigueOtro = multi && !esUltimo; // falta configurar a otro comensal después de este
  const [paso, setPaso] = useState<'origen' | 'gustos'>(perfil ? 'gustos' : 'origen');
  const [origen, setOrigen] = useState<Origen | null>(perfil?.origen ?? null);
  const [proteinas, setProteinas] = useState<string[]>(perfil?.proteinas ?? []);
  const [intensidad, setIntensidad] = useState<0 | 1 | 2 | null>(perfil?.intensidad ?? null);
  const [estilo, setEstilo] = useState<PerfilComensal['estilo']>(perfil?.estilo ?? null);
  const [alergias, setAlergias] = useState<string[]>(alergiasDeclaradas);
  const [sinAlergias, setSinAlergias] = useState<boolean>(!!perfil?.alergiasRespondidas && alergiasDeclaradas.length === 0);
  const [quiereEntrada, setQuiereEntrada] = useState<boolean | null>(perfil?.quiereEntrada ?? null);
  const [entradaPref, setEntradaPref] = useState<string[]>(perfil?.entradaPref ?? []);
  const [quierePostre, setQuierePostre] = useState<boolean | null>(perfil?.quierePostre ?? null);
  const [postrePref, setPostrePref] = useState<string[]>(perfil?.postrePref ?? []);
  const [esNino, setEsNino] = useState<boolean>(perfil?.esNino ?? false);
  // El peruano responde solo una pregunta rápida (qué le gusta comer); el resto es opcional y se despliega a pedido
  const [detalle, setDetalle] = useState<boolean>(!!perfil && !perfil.omitido && (perfil.intensidad !== null || perfil.estilo !== null));
  const [intento, setIntento] = useState(false);
  const [errorAlergias, setErrorAlergias] = useState(false);

  const obligatorio = origen === 'extranjero';
  const esDesayuno = momento === 'desayuno';
  const alergiaRespondida = sinAlergias || alergias.length > 0;
  const detallado = obligatorio || detalle; // extranjero: todas las preguntas; peruano: solo si pide contar más
  const completo =
    alergiaRespondida &&
    (esNino || (
    proteinas.length > 0 &&
    (!detallado || (
    intensidad !== null &&
    estilo !== null &&
    (esDesayuno || (quiereEntrada !== null && (quiereEntrada === false || entradaPref.length > 0))) &&
    (esDesayuno || (quierePostre !== null && (quierePostre === false || postrePref.length > 0)))))));

  const alternar = (lista: string[], set: (v: string[]) => void, k: string) =>
    set(lista.includes(k) ? lista.filter((x) => x !== k) : [...lista, k]);

  // Con alergia a mariscos o a pescado no se ofrece la opción "Pescados y mariscos" entre los gustos
  const sinPescado = alergias.includes('MARISCOS') || alergias.includes('PESCADO');
  useEffect(() => {
    if (sinPescado) setProteinas((prev) => prev.filter((x) => x !== 'pescado'));
  }, [sinPescado]);

  const toggleAlergia = (codigo: string) => {
    setSinAlergias(false);
    setErrorAlergias(false);
    alternar(alergias, setAlergias, codigo);
  };
  const marcarSinAlergias = () => {
    setAlergias([]);
    setErrorAlergias(false);
    setSinAlergias((v) => !v);
  };

  // Lleva al comensal a la pregunta de alergias cuando falta responderla
  const exigirAlergias = () => {
    setErrorAlergias(true);
    document.getElementById('q-alergias')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const elegirOrigen = (o: Origen) => {
    setOrigen(o);
    setPaso('gustos');
  };

  const toggleProteina = (k: string) =>
    setProteinas((prev) => {
      if (k === 'cualquiera') return prev.includes(k) ? [] : ['cualquiera'];
      const sin = prev.filter((x) => x !== 'cualquiera');
      return sin.includes(k) ? sin.filter((x) => x !== k) : [...sin, k];
    });

  // verRecomendacion: abre la ventana con la comida recomendada (entrada y postre si los pidió, fondo y bebida); si no, va a la carta personalizada
  const continuar = (verRecomendacion: boolean) => {
    if (!alergiaRespondida) {
      exigirAlergias();
      return;
    }
    if (!completo) {
      setIntento(true);
      return;
    }
    setAlergiasDeclaradas(alergias); // las alergias declaradas aquí se aplican a toda la carta y a la comanda
    guardarPerfil({
      origen: origen!, proteinas,
      intensidad: detallado ? intensidad : null, estilo: detallado ? estilo : null,
      tradicional: true, // toda recomendación prioriza la cocina tradicional de Ica
      // Respuesta rápida: entrada y postre se recomiendan sin gustos específicos (los más pedidos)
      quiereEntrada: esDesayuno ? false : detallado ? quiereEntrada : true, entradaPref: detallado && !esDesayuno && quiereEntrada ? entradaPref : [],
      quierePostre: esDesayuno ? false : detallado ? quierePostre : true, postrePref: detallado && !esDesayuno && quierePostre ? postrePref : [],
      alergiasRespondidas: true, omitido: false, esNino,
    });
    if (sigueOtro) {
      avanzarComensal();
      return;
    }
    terminarConfiguracion();
    setMostrarRecomendacion(verRecomendacion);
  };

  const omitir = () => {
    if (!alergiaRespondida) {
      exigirAlergias();
      return;
    }
    setAlergiasDeclaradas(alergias);
    guardarPerfil({
      origen: 'peruano', proteinas: [], intensidad: null, estilo: null, tradicional: true,
      quiereEntrada: null, entradaPref: [], quierePostre: null, postrePref: [], alergiasRespondidas: true, omitido: true, esNino,
    });
    if (sigueOtro) avanzarComensal();
    else terminarConfiguracion();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-grow flex flex-col items-center px-5 pb-12 pt-4">
        <div className="w-full max-w-2xl space-y-8">
          <Progreso paso={(paso === 'origen' ? 2 : 3) - (mesaConfigurada ? 1 : 0)} total={mesaConfigurada ? 2 : 3} />
          <div className="text-center space-y-4">
            <MarcaTambo />
            <h1 className="font-serif text-2xl md:text-3xl text-[#1F1F1F]">{t('onbTitulo')}</h1>
            <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed">{t('onbSub')}</p>
          </div>

          {paso === 'origen' && (
            <section className="space-y-4 animate-fade-in" aria-labelledby="q-origen">
              {!mesaConfigurada && (
                <button
                  type="button"
                  onClick={indice > 0 ? retrocederComensal : reiniciarMesa}
                  className="flex items-center gap-1 text-sm text-stone-600 hover:text-[#466212]"
                >
                  <ArrowLeft className="w-4 h-4" /> {indice > 0 ? t('atrasComensal') : t('atrasCantidad')}
                </button>
              )}
              <h2 id="q-origen" className="text-center font-serif text-lg text-[#1F1F1F]">{t('onbOrigen')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => elegirOrigen('peruano')}
                  className="text-left bg-white border-2 border-stone-200 hover:border-[#577A17] rounded-2xl p-6 transition shadow-sm hover:shadow-md group"
                >
                  <MapPin className="w-8 h-8 text-[#577A17] mb-3" />
                  <h3 className="font-serif text-xl text-[#1F1F1F] group-hover:text-[#466212]">{t('peruano')}</h3>
                  <p className="text-sm text-stone-600 mt-1 leading-relaxed">{t('peruanoDesc')}</p>
                </button>
                <button
                  type="button"
                  onClick={() => elegirOrigen('extranjero')}
                  className="text-left bg-white border-2 border-stone-200 hover:border-[#577A17] rounded-2xl p-6 transition shadow-sm hover:shadow-md group"
                >
                  <Globe2 className="w-8 h-8 text-[#577A17] mb-3" />
                  <h3 className="font-serif text-xl text-[#1F1F1F] group-hover:text-[#466212]">{t('extranjero')}</h3>
                  <p className="text-sm text-stone-600 mt-1 leading-relaxed">{t('extranjeroDesc')}</p>
                </button>
              </div>
            </section>
          )}

          {paso === 'gustos' && (
            <section className="space-y-7 animate-fade-in" aria-labelledby="t-gustos">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPaso('origen')}
                  className="flex items-center gap-1 text-sm text-stone-600 hover:text-[#466212]"
                >
                  <ArrowLeft className="w-4 h-4" /> {t('atras')}
                </button>
                <span className="text-xs font-medium uppercase tracking-wider bg-[#E6F0D0] text-[#384F0F] px-3 py-1 rounded-full">
                  {origen === 'extranjero' ? t('extranjero') : t('peruano')}
                </span>
              </div>

              {multi && (
                <div className="bg-[#F4F8EA] border border-[#CFE1A5] rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#466212]">{t('comensalDe', { n: indice + 1, total })}</p>
                  <label className="block">
                    <span className="text-xs text-stone-600">{t('nombreOpc')}</span>
                    <input
                      type="text"
                      value={comensales[indice]?.nombre ?? ''}
                      onChange={(e) => renombrarComensal(indice, e.target.value)}
                      maxLength={24}
                      className="mt-1 w-full border border-stone-300 rounded-xl px-3 py-2 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#577A17]/25 focus:border-[#577A17]"
                    />
                  </label>
                </div>
              )}

              {(!multi || indice === 0) && (
              <fieldset className="space-y-3">
                <legend className="font-serif text-lg text-[#1F1F1F]">{t('momentoTitulo')}</legend>
                <div className="flex flex-wrap gap-2">
                  {(['desayuno', 'almuerzo'] as Momento[]).map((m) => (
                    <Chip key={m} activo={momento === m} onClick={() => setMomento(m)}>{t(m)}</Chip>
                  ))}
                </div>
              </fieldset>
              )}

              <Pregunta titulo={t('qNino')} obligatoria={false}>
                <Chip activo={esNino} onClick={() => setEsNino(true)}>{t('siSimple')}</Chip>
                <Chip activo={!esNino} onClick={() => setEsNino(false)}>{t('noSimple')}</Chip>
              </Pregunta>
              {esNino && <p className="text-xs text-stone-500 -mt-4">{t('ninoAyuda')}</p>}

              {!obligatorio && (
                <button
                  type="button"
                  onClick={omitir}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-[#466212] border-2 border-[#577A17] bg-white hover:bg-[#F4F8EA] transition"
                >
                  {t('omitir')} <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {errorAlergias && (
                <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
                  {t('faltanAlergias')}
                </p>
              )}

              {!esNino && (
              <div className="bg-[#F7F8FA] border border-stone-200 rounded-2xl p-4">
                <h2 id="t-gustos" className="font-serif text-xl text-[#1F1F1F]">{t('gustoTitulo')}</h2>
                <p className="text-sm text-stone-600 mt-1">{obligatorio ? t('gustoObligatorio') : t('gustoOpcional')}</p>
              </div>
              )}

              <div id="q-alergias" className={`space-y-2 rounded-2xl ${errorAlergias ? 'ring-2 ring-rose-300 p-3' : ''}`}>
                <Pregunta titulo={t('qAlergias')} obligatoria={true}>
                  <Chip activo={sinAlergias} onClick={marcarSinAlergias}>{t('ningunaAlergia')}</Chip>
                  {CODIGOS_ALERGENO.filter((c) => !(esNino && c === 'SULFITOS')).map((c) => (
                    <Chip key={c} activo={alergias.includes(c)} onClick={() => toggleAlergia(c)}>{nombreAlergeno(c)}</Chip>
                  ))}
                </Pregunta>
                <p className="text-xs text-stone-500">{t('alergiaAyuda')}</p>
              </div>

              {!esNino && (<>
              <Pregunta titulo={t('qProteina')} obligatoria={obligatorio}>
                {PROTEINAS.filter((k) => !(k === 'pescado' && sinPescado)).map((k) => (
                  <Chip key={k} activo={proteinas.includes(k)} onClick={() => toggleProteina(k)}>{t(k)}</Chip>
                ))}
              </Pregunta>

              {detallado && (<>
              <Pregunta titulo={t('qIntensidad')} obligatoria={obligatorio}>
                {INTENSIDADES.map((i) => (
                  <Chip key={i.k} activo={intensidad === i.v} onClick={() => setIntensidad(i.v)}>{t(i.k)}</Chip>
                ))}
              </Pregunta>

              <Pregunta titulo={t('qEstilo')} obligatoria={obligatorio}>
                {ESTILOS.map((k) => (
                  <Chip key={k} activo={estilo === k} onClick={() => setEstilo(k as PerfilComensal['estilo'])}>{t(k)}</Chip>
                ))}
              </Pregunta>

              {!esDesayuno && (<>
              <Pregunta titulo={t('qEntrada')} obligatoria={obligatorio}>
                <Chip activo={quiereEntrada === true} onClick={() => setQuiereEntrada(true)}>{t('siSimple')}</Chip>
                <Chip activo={quiereEntrada === false} onClick={() => setQuiereEntrada(false)}>{t('noSimple')}</Chip>
              </Pregunta>
              {quiereEntrada && (
                <Pregunta titulo={t('qEntradaTipo')} obligatoria={obligatorio}>
                  {ENTRADAS_TIPO.map((o) => (
                    <Chip key={o.v} activo={entradaPref.includes(o.v)} onClick={() => alternar(entradaPref, setEntradaPref, o.v)}>{t(o.k)}</Chip>
                  ))}
                </Pregunta>
              )}
              </>)}

              {!esDesayuno && (<>
              <Pregunta titulo={t('qPostre')} obligatoria={obligatorio}>
                <Chip activo={quierePostre === true} onClick={() => setQuierePostre(true)}>{t('siSimple')}</Chip>
                <Chip activo={quierePostre === false} onClick={() => setQuierePostre(false)}>{t('noSimple')}</Chip>
              </Pregunta>
              {quierePostre && (
                <Pregunta titulo={t('qPostreTipo')} obligatoria={obligatorio}>
                  {POSTRES_TIPO.map((o) => (
                    <Chip key={o.v} activo={postrePref.includes(o.v)} onClick={() => alternar(postrePref, setPostrePref, o.v)}>{t(o.k)}</Chip>
                  ))}
                </Pregunta>
              )}
              </>)}
              </>)}

              {!detallado && (
                <div className="space-y-2">
                  <p className="text-xs text-stone-500">{t('rapidaAyuda')}</p>
                  <button type="button" onClick={() => setDetalle(true)} className="text-sm font-semibold text-[#466212] underline hover:text-[#2E4310]">
                    {t('contarMas')}
                  </button>
                </div>
              )}

              </>)}

              {intento && !completo && (
                <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
                  {t('faltan')}
                </p>
              )}

              {sigueOtro ? (
                <div className="flex flex-col gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => continuar(false)}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition shadow ${
                      completo ? 'bg-[#577A17] hover:bg-[#466212]' : 'bg-stone-400'
                    }`}
                  >
                    {t('siguienteComensal')} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => continuar(true)}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition shadow ${
                    completo ? 'bg-[#577A17] hover:bg-[#466212]' : 'bg-stone-400'
                  }`}
                >
                  <Sparkles className="w-4 h-4" /> {t('continuar')}
                </button>
                <button
                  type="button"
                  onClick={() => continuar(false)}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold border-2 transition ${
                    completo ? 'text-[#466212] border-[#577A17] hover:bg-[#F4F8EA]' : 'text-stone-400 border-stone-300'
                  }`}
                >
                  {t('verCartaPersonalizada')} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

/** Primer paso: cuántas personas hay en la mesa. */
const CantidadComensales: React.FC = () => {
  const { iniciarMesa, t } = useApp();
  const [cantidad, setCantidad] = useState(1);
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-grow flex flex-col items-center px-5 pb-12 pt-4">
        <div className="w-full max-w-2xl space-y-8">
          <Progreso paso={1} total={3} />
          <div className="text-center space-y-4">
            <MarcaTambo />
            <h1 className="font-serif text-2xl md:text-3xl text-[#1F1F1F]">{t('onbTitulo')}</h1>
            <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed">{t('onbSub')}</p>
          </div>
          <section className="space-y-5 animate-fade-in" aria-labelledby="q-cantidad">
            <h2 id="q-cantidad" className="text-center font-serif text-lg text-[#1F1F1F]">{t('qCantidad')}</h2>
            <div className="flex flex-wrap justify-center gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={cantidad === n}
                  onClick={() => setCantidad(n)}
                  className={`w-12 h-12 rounded-full text-base font-bold border transition ${
                    cantidad === n ? 'bg-[#577A17] text-white border-[#577A17] shadow-sm' : 'bg-white text-stone-700 border-stone-300 hover:border-[#577A17]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs text-stone-500 text-center max-w-md mx-auto">{t('cantidadAyuda')}</p>
            <button
              type="button"
              onClick={() => iniciarMesa(cantidad)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white bg-[#577A17] hover:bg-[#466212] transition shadow"
            >
              {t('continuarMesa')} <ChevronRight className="w-4 h-4" />
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export const BienvenidaPage: React.FC = () => {
  const { comensales, activoIdx, mesaConfigurada } = useApp();
  // Sin comensales definidos: se pregunta cuántas personas son. Luego, un formulario por comensal.
  if (comensales.length === 0) return <CantidadComensales />;
  const multi = !mesaConfigurada && comensales.length > 1; // al editar más tarde se trata de un solo comensal
  return <FormularioComensal key={activoIdx} multi={multi} indice={activoIdx} total={comensales.length} esUltimo={activoIdx === comensales.length - 1} />;
};
