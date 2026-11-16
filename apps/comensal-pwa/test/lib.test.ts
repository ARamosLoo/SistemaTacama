/** Pruebas unitarias de la PWA del comensal: alergias, notas para cocina, textos en 5 idiomas, stock y cola sin conexión (RNF14). */
import { describe, it, expect, beforeEach } from 'vitest';
import { otrosDesdeTexto, conflictosDe, contieneAlergia, excluyeProteina, esOtro, normalizar } from '../src/lib/alergias';
import { unirNotas, notaPersonalizacion, notasSinPersonalizacion, leerPersonalizacion, MAX_NOTAS } from '../src/lib/personalizar';
import { DICC, IDIOMAS, texto } from '../src/lib/i18n';
import { mensajeStock } from '../src/lib/stock';
import { leerCola, guardarCola, borrarCola, PedidoEnCola } from '../src/lib/colaOffline';

const plato = (extra: object = {}): any => ({
  nombre: 'Tequeños', descripcion: 'Rellenos de queso con salsa guacamole', tags: ['piqueo'],
  alergenos: [{ codigo: 'GLUTEN', nombre: 'Gluten' }, { codigo: 'LACTEOS', nombre: 'Lácteos' }], ...extra,
});

describe('Alergias (RF15, RF16)', () => {
  it('detecta los alérgenos declarados que contiene el plato', () => {
    expect(conflictosDe(plato(), ['GLUTEN'])).toEqual(['GLUTEN']);
    expect(conflictosDe(plato(), ['MARISCOS'])).toEqual([]);
    expect(contieneAlergia(plato(), ['LACTEOS', 'SOYA'])).toBe(true);
  });
  it('una alergia escrita con palabras propias coincide con el nombre o la descripción', () => {
    expect(contieneAlergia(plato(), ['OTRO:guacamole'])).toBe(true);
    expect(contieneAlergia(plato({ alergenos: [] }), ['OTRO:queso'])).toBe(true);
    expect(contieneAlergia(plato(), ['OTRO:kiwi'])).toBe(false);
  });
  it('compara sin tildes y con plurales', () => {
    expect(contieneAlergia(plato({ nombre: 'Ají de gallina', descripcion: '' }), ['OTRO:ajíes'])).toBe(true);
    expect(normalizar('  Maní ')).toBe('mani');
  });
  it('convierte el texto libre en entradas únicas y acotadas', () => {
    expect(otrosDesdeTexto('maní, kiwi; ají y kiwi')).toEqual(['OTRO:maní', 'OTRO:kiwi', 'OTRO:ají']);
    expect(otrosDesdeTexto('a, b, c, d, e, f, g, h, ii, jj, kk, ll, mm').length).toBeLessThanOrEqual(6);
    expect(esOtro('OTRO:kiwi')).toBe(true);
    expect(esOtro('GLUTEN')).toBe(false);
  });
  it('una alergia a pescado o mariscos excluye ese gusto', () => {
    expect(excluyeProteina('pescado', ['MARISCOS'])).toBe(true);
    expect(excluyeProteina('pollo', ['MARISCOS'])).toBe(false);
    expect(excluyeProteina('cerdo', ['OTRO:chancho'])).toBe(true);
  });
});

describe('Notas para cocina (RN02, RN11)', () => {
  it('arma la nota de personalización', () => {
    expect(notaPersonalizacion({ sin: [], sinAlergia: false, pedido: 'poco picante' })).toBe('PEDIDO: poco picante');
    expect(notaPersonalizacion(null)).toBe('');
  });
  it('quitar la personalización conserva el aviso de alergia', () => {
    expect(notasSinPersonalizacion('Comensal 1 | ALERGIA: Gluten | PEDIDO: poco picante')).toBe('Comensal 1 | ALERGIA: Gluten');
  });
  it('lee el pedido especial de una nota ya enviada', () => {
    expect(leerPersonalizacion('ALERGIA: Gluten | PEDIDO: sin sal').pedido).toBe('sin sal');
  });
  it('une partes sin romper el separador y respeta el límite del servidor', () => {
    expect(unirNotas(['a | b', null, '', 'c'])).toBe('a / b | c');
    expect(unirNotas(['x'.repeat(MAX_NOTAS + 50)]).length).toBe(MAX_NOTAS);
  });
});

describe('Textos en 5 idiomas (RF03, RNF07)', () => {
  const clavesEs = Object.keys(DICC.es);
  it('hay 5 idiomas y cada uno tiene todas las claves del español', () => {
    expect(IDIOMAS).toEqual(['es', 'en', 'fr', 'pt', 'de']);
    for (const idioma of IDIOMAS) {
      const faltan = clavesEs.filter((k) => !(k in DICC[idioma]) || String((DICC[idioma] as any)[k]).trim() === '');
      expect(faltan, `faltan en ${idioma}`).toEqual([]);
    }
  });
  it('cada traducción conserva los mismos marcadores {…} que el español', () => {
    const marcadores = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');
    for (const idioma of IDIOMAS) {
      const mal = clavesEs.filter((k) => marcadores((DICC[idioma] as any)[k]) !== marcadores((DICC.es as any)[k]));
      expect(mal, `marcadores distintos en ${idioma}`).toEqual([]);
    }
  });
  it('sustituye los marcadores', () => {
    expect(texto('es', 'alergiaOcultos' as any, { n: 3 })).toContain('3');
    expect(texto('en', 'platoAgotadoCarrito' as any, { n: 'Lomo' })).toContain('Lomo');
  });
  it('los textos nuevos de reglas existen en todos los idiomas', () => {
    for (const k of ['mayorEdadAlcohol', 'confirmoConflictoAlergeno', 'alergiaOcultos', 'sinConexionPedido', 'eliminarMisDatos', 'datosEliminados']) {
      for (const idioma of IDIOMAS) expect((DICC[idioma] as any)[k], `${k} en ${idioma}`).toBeTruthy();
    }
  });
});

describe('Aviso de stock', () => {
  const t = (clave: string, vars?: any) => `${clave}${vars ? JSON.stringify(vars) : ''}`;
  it('agotada, crítica, baja y con stock de sobra', () => {
    expect(mensajeStock({ nivel: 'AGOTADO', stockActual: 0, minutosRestantes: null } as any, t as any)).toBe('etqAgotada');
    expect(mensajeStock({ nivel: 'CRITICO', stockActual: 2, minutosRestantes: null } as any, t as any)).toContain('stockUltimas');
    expect(mensajeStock({ nivel: 'BAJO', stockActual: 4, minutosRestantes: 60 } as any, t as any)).toContain('stockAgotaEn');
    expect(mensajeStock({ nivel: 'OK', stockActual: 20, minutosRestantes: null } as any, t as any)).toBeNull();
  });
});

describe('RNF14 · cola de pedidos sin conexión', () => {
  beforeEach(() => localStorage.clear());
  const pedido: PedidoEnCola = { cuerpo: { mesaId: 'm1', items: [{ platoId: 'p1' }] }, codigos: ['GLUTEN'], claveComanda: 'tacama.comanda:QR-1', creadoEn: '2026-11-15T12:00:00Z' };
  it('guarda, lee y borra el pedido pendiente', () => {
    expect(leerCola()).toBeNull();
    guardarCola(pedido);
    expect(leerCola()).toEqual(pedido);
    borrarCola();
    expect(leerCola()).toBeNull();
  });
  it('conserva el avance si la red cae a mitad del envío', () => {
    guardarCola({ ...pedido, comandaId: 'c1', restriccionesOk: true });
    expect(leerCola()).toMatchObject({ comandaId: 'c1', restriccionesOk: true });
  });
  it('un contenido dañado se ignora', () => {
    localStorage.setItem('tacama.cola.pedido', '{no es json');
    expect(leerCola()).toBeNull();
  });
});
