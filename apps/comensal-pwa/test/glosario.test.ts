/** RF04 · glosario de insumos peruanos: completo en los 5 idiomas y bien asociado a los platos. */
import { describe, it, expect } from 'vitest';
import { GLOSARIO, insumosDe } from '../src/lib/glosario';
import { IDIOMAS } from '../src/lib/i18n';

const plato = (nombre: string, descripcion = '') => ({ nombre, descripcion });
const ids = (p: { nombre: string; descripcion: string }) => insumosDe(p).map((x) => x.id);

describe('Glosario de insumos (RF04)', () => {
  it('cada término tiene nombre y explicación en los 5 idiomas', () => {
    expect(GLOSARIO.length).toBeGreaterThanOrEqual(20);
    for (const g of GLOSARIO) {
      for (const idioma of IDIOMAS) {
        expect(g.nombre[idioma]?.trim(), `${g.id} nombre ${idioma}`).toBeTruthy();
        expect(g.texto[idioma]?.trim().length, `${g.id} texto ${idioma}`).toBeGreaterThan(20);
      }
    }
  });
  it('los identificadores no se repiten', () => {
    expect(new Set(GLOSARIO.map((g) => g.id)).size).toBe(GLOSARIO.length);
  });
  it('detecta insumos en el nombre y en la descripción, con o sin tildes y en plural', () => {
    expect(ids(plato('Ensalada iqueña de pallares', 'Salsa criolla y ají amarillo'))).toEqual(expect.arrayContaining(['pallares', 'salsa-criolla', 'aji-amarillo']));
    expect(ids(plato('Tamales', 'con camote y choclo'))).toEqual(expect.arrayContaining(['tamal', 'camote', 'choclo']));
    expect(ids(plato('Postre', 'crema de MARACUYÁ'))).toContain('maracuya');
  });
  it('reconoce las variantes en otros idiomas', () => {
    expect(ids(plato('Lima bean salad', 'with sweet potato and passion fruit'))).toEqual(expect.arrayContaining(['pallares', 'camote', 'maracuya']));
    expect(ids(plato('Salade', 'patate douce et coriandre'))).toEqual(expect.arrayContaining(['camote', 'culantro']));
    expect(ids(plato('Kartoffel', 'mit Süßkartoffel'))).toEqual(expect.arrayContaining(['papa', 'camote']));
  });
  it('no confunde palabras parecidas', () => {
    expect(ids(plato('Papaya con miel', 'fruta fresca'))).not.toContain('papa');
    expect(ids(plato('Plato sin insumos del glosario', 'agua y sal'))).toEqual([]);
  });
});
