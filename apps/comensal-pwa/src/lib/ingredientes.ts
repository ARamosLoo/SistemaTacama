// Ingredientes que el comensal puede pedir que NO lleve su plato (cebolla, tomate, palta...).
// Solo se listan los que se pueden quitar sin cambiar el plato en sí: el insumo principal (la carne, el pallar,
// el ají de la salsa base...) no aparece. Los platos sin ingredientes quitables no muestran la opción.
// Validar la lista con cocina antes de operar.

import type { Idioma } from './i18n';

type Nombres = Record<Idioma, string>;

export const INGREDIENTES: Record<string, Nombres> = {
  cebolla: { es: 'cebolla', en: 'onion', fr: 'oignon', pt: 'cebola', de: 'Zwiebel' },
  tomate: { es: 'tomate', en: 'tomato', fr: 'tomate', pt: 'tomate', de: 'Tomate' },
  lechuga: { es: 'lechuga', en: 'lettuce', fr: 'laitue', pt: 'alface', de: 'Salat' },
  palta: { es: 'palta', en: 'avocado', fr: 'avocat', pt: 'abacate', de: 'Avocado' },
  mayonesa: { es: 'mayonesa', en: 'mayonnaise', fr: 'mayonnaise', pt: 'maionese', de: 'Mayonnaise' },
  huevo: { es: 'huevo', en: 'egg', fr: 'œuf', pt: 'ovo', de: 'Ei' },
  aceituna: { es: 'aceituna', en: 'olive', fr: 'olive', pt: 'azeitona', de: 'Olive' },
  pasas: { es: 'pasas', en: 'raisins', fr: 'raisins secs', pt: 'passas', de: 'Rosinen' },
  pecanas: { es: 'pecanas', en: 'pecans', fr: 'noix de pécan', pt: 'nozes-pecã', de: 'Pekannüsse' },
  verduras: { es: 'verduras', en: 'vegetables', fr: 'légumes', pt: 'legumes', de: 'Gemüse' },
  zanahoria: { es: 'zanahoria', en: 'carrot', fr: 'carotte', pt: 'cenoura', de: 'Karotte' },
  choclo: { es: 'choclo', en: 'corn', fr: 'maïs', pt: 'milho', de: 'Mais' },
  esparrago: { es: 'espárragos', en: 'asparagus', fr: 'asperges', pt: 'aspargos', de: 'Spargel' },
  arveja: { es: 'arvejitas', en: 'peas', fr: 'petits pois', pt: 'ervilhas', de: 'Erbsen' },
  cilantro: { es: 'culantro', en: 'coriander', fr: 'coriandre', pt: 'coentro', de: 'Koriander' },
  albahaca: { es: 'albahaca', en: 'basil', fr: 'basilic', pt: 'manjericão', de: 'Basilikum' },
  perejil: { es: 'perejil', en: 'parsley', fr: 'persil', pt: 'salsa', de: 'Petersilie' },
  aji: { es: 'ají (picante)', en: 'chili (spicy)', fr: 'piment (épicé)', pt: 'pimenta (picante)', de: 'Chili (scharf)' },
  ajo: { es: 'ajo', en: 'garlic', fr: 'ail', pt: 'alho', de: 'Knoblauch' },
  mostaza: { es: 'mostaza', en: 'mustard', fr: 'moutarde', pt: 'mostarda', de: 'Senf' },
  anchoas: { es: 'anchoas', en: 'anchovies', fr: 'anchois', pt: 'anchovas', de: 'Anchovis' },
  crutones: { es: 'crutones', en: 'croutons', fr: 'croûtons', pt: 'croutons', de: 'Croûtons' },
  parmesano: { es: 'queso parmesano', en: 'parmesan', fr: 'parmesan', pt: 'queijo parmesão', de: 'Parmesan' },
  queso: { es: 'queso', en: 'cheese', fr: 'fromage', pt: 'queijo', de: 'Käse' },
  quesoAzul: { es: 'queso azul', en: 'blue cheese', fr: 'fromage bleu', pt: 'queijo azul', de: 'Blauschimmelkäse' },
  vinagreta: { es: 'vinagreta', en: 'vinaigrette', fr: 'vinaigrette', pt: 'vinagrete', de: 'Vinaigrette' },
  guacamole: { es: 'salsa guacamole', en: 'guacamole sauce', fr: 'sauce guacamole', pt: 'molho guacamole', de: 'Guacamole-Sauce' },
  huancaina: { es: 'salsa huancaína', en: 'huancaína sauce', fr: 'sauce huancaína', pt: 'molho huancaína', de: 'Huancaína-Sauce' },
  criolla: { es: 'salsa criolla', en: 'criolla salsa', fr: 'salsa criolla', pt: 'molho criolla', de: 'Criolla-Salsa' },
  tartara: { es: 'salsa tártara', en: 'tartar sauce', fr: 'sauce tartare', pt: 'molho tártaro', de: 'Tartarsauce' },
  chimichurri: { es: 'chimichurri', en: 'chimichurri', fr: 'chimichurri', pt: 'chimichurri', de: 'Chimichurri' },
  alioli: { es: 'mayonesa alioli (ajo)', en: 'aioli mayonnaise (garlic)', fr: 'mayonnaise aïoli (ail)', pt: 'maionese aioli (alho)', de: 'Aioli-Mayonnaise (Knoblauch)' },
  salsaVino: { es: 'salsa de vino tinto', en: 'red wine sauce', fr: 'sauce au vin rouge', pt: 'molho de vinho tinto', de: 'Rotweinsauce' },
  platano: { es: 'platanitos maduros', en: 'ripe plantain', fr: 'banane plantain mûre', pt: 'banana-da-terra madura', de: 'reife Kochbananen' },
  tocino: { es: 'tocino', en: 'bacon', fr: 'lard', pt: 'bacon', de: 'Speck' },
  jamon: { es: 'jamón', en: 'ham', fr: 'jambon', pt: 'presunto', de: 'Schinken' },
  salame: { es: 'salame', en: 'salami', fr: 'salami', pt: 'salame', de: 'Salami' },
  carneMolida: { es: 'carne molida', en: 'ground beef', fr: 'bœuf haché', pt: 'carne moída', de: 'Hackfleisch' },
  fudge: { es: 'fudge (salsa de chocolate)', en: 'fudge (chocolate sauce)', fr: 'fudge (sauce au chocolat)', pt: 'fudge (calda de chocolate)', de: 'Fudge (Schokoladensauce)' },
  helado: { es: 'helado de vainilla', en: 'vanilla ice cream', fr: 'glace à la vanille', pt: 'sorvete de baunilha', de: 'Vanilleeis' },
  caramelo: { es: 'caramelo', en: 'caramel', fr: 'caramel', pt: 'caramelo', de: 'Karamell' },
};

// Código de carta → ingredientes que se pueden quitar, en orden de aparición.
export const QUITABLES: Record<string, string[]> = {
  'TAC-002': ['guacamole'],
  'TAC-003': ['guacamole'],
  'TAC-004': ['huancaina'],
  'TAC-005': ['guacamole'],
  'TAC-006': ['guacamole', 'huancaina'],
  'TAC-007': ['pecanas', 'pasas'],
  'TAC-008': ['huancaina'],
  'TAC-009': ['tomate', 'lechuga'],
  'TAC-010': ['huancaina', 'criolla', 'choclo', 'aji'],
  'TAC-011': ['mayonesa', 'palta'],
  'TAC-012': ['huevo', 'aceituna', 'lechuga'],
  'TAC-013': ['mayonesa', 'verduras'],
  'TAC-014': ['mayonesa', 'verduras', 'palta'],
  'TAC-015': ['tomate', 'cebolla', 'albahaca'],
  'TAC-016': ['crutones', 'parmesano', 'anchoas', 'huevo', 'ajo', 'mostaza'],
  'TAC-017': ['crutones', 'parmesano', 'anchoas', 'huevo', 'ajo', 'mostaza'],
  'TAC-018': ['tomate', 'choclo', 'zanahoria', 'esparrago', 'cebolla', 'palta', 'vinagreta'],
  'TAC-019': ['criolla'],
  'TAC-020': ['criolla'],
  'TAC-022': ['pasas', 'aceituna', 'huevo', 'cebolla'],
  'TAC-024': ['huevo', 'aceituna'],
  'TAC-025': ['arveja', 'zanahoria', 'cilantro', 'criolla'],
  'TAC-028': ['criolla'],
  'TAC-030': ['albahaca', 'perejil'],
  'TAC-033': ['cebolla', 'tomate', 'aji'],
  'TAC-037': ['huevo', 'platano', 'chimichurri', 'tomate'],
  'TAC-038': ['criolla', 'tartara'],
  'TAC-042': ['queso'],
  'TAC-044': ['fudge'],
  'TAC-045': ['alioli'],
  'TAC-046': ['jamon'],
  'TAC-047': ['quesoAzul'],
  'TAC-048': ['albahaca'],
  'TAC-049': ['tocino', 'salame', 'carneMolida'],
  'TAC-050': ['cebolla', 'salsaVino'],
  'TAC-051': ['criolla'],
  'TAC-052': ['palta', 'mayonesa'],
  'TAC-053': ['queso'],
  'TAC-054': ['queso', 'tocino', 'huevo'],
  'TAC-056': ['fudge', 'helado'],
  'TAC-058': ['helado', 'caramelo'],
};

export const quitablesDe = (codigo?: string): string[] => (codigo ? QUITABLES[codigo] ?? [] : []);

export const nombreIngrediente = (clave: string, idioma: Idioma): string => INGREDIENTES[clave]?.[idioma] ?? clave;

/** Nota para la cocina (siempre en español): "SIN: cebolla, tomate". */
export const notaSin = (claves: string[]): string => (claves.length ? 'SIN: ' + claves.map((c) => nombreIngrediente(c, 'es')).join(', ') : '');
