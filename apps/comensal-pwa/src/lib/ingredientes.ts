import type { Idioma } from './i18n';

// Nombre de cada ingrediente que el comensal puede pedir que se quite de un plato (es, en, fr, pt, de).
// Las opciones disponibles por plato salen de infra/data/build-nutricion.js (tabla QUITAR).
type Nombre = [string, string, string, string, string];
const N: Record<string, Nombre> = {
  guacamole: ['guacamole', 'guacamole', 'guacamole', 'guacamole', 'Guacamole'],
  huancaina: ['salsa huancaína', 'huancaína sauce', 'sauce huancaína', 'molho huancaína', 'Huancaína-Sauce'],
  pasas: ['pasas', 'raisins', 'raisins secs', 'uvas-passas', 'Rosinen'],
  pecanas: ['pecanas', 'pecans', 'noix de pécan', 'nozes-pecã', 'Pekannüsse'],
  alioli: ['alioli', 'aioli', 'aïoli', 'aioli', 'Aioli'],
  pan: ['pan', 'bread', 'pain', 'pão', 'Brot'],
  ensalada: ['ensalada', 'salad', 'salade', 'salada', 'Salat'],
  salsaCriolla: ['salsa criolla', 'criolla onion relish', 'salsa criolla (oignons)', 'salsa criolla (cebola)', 'Salsa criolla (Zwiebelsalat)'],
  choclo: ['choclo', 'Andean corn', 'maïs andin', 'milho andino', 'Andenmais'],
  palta: ['palta', 'avocado', 'avocat', 'abacate', 'Avocado'],
  mayonesa: ['mayonesa', 'mayonnaise', 'mayonnaise', 'maionese', 'Mayonnaise'],
  huevo: ['huevo', 'egg', 'œuf', 'ovo', 'Ei'],
  aceitunas: ['aceitunas', 'olives', 'olives', 'azeitonas', 'Oliven'],
  lechuga: ['lechuga', 'lettuce', 'laitue', 'alface', 'Kopfsalat'],
  verduras: ['verduras cocidas', 'cooked vegetables', 'légumes cuits', 'legumes cozidos', 'gekochtes Gemüse'],
  cebolla: ['cebolla', 'onion', 'oignon', 'cebola', 'Zwiebel'],
  tomate: ['tomate', 'tomato', 'tomate', 'tomate', 'Tomate'],
  crutones: ['crutones', 'croutons', 'croûtons', 'croutons', 'Croutons'],
  anchoas: ['anchoas', 'anchovies', 'anchois', 'anchovas', 'Sardellen'],
  parmesano: ['queso parmesano', 'parmesan', 'parmesan', 'parmesão', 'Parmesan'],
  esparragos: ['espárragos', 'asparagus', 'asperges', 'aspargos', 'Spargel'],
  zanahoria: ['zanahoria', 'carrot', 'carotte', 'cenoura', 'Karotte'],
  papa: ['papa', 'potato', 'pomme de terre', 'batata', 'Kartoffel'],
  arroz: ['arroz', 'rice', 'riz', 'arroz', 'Reis'],
  arveja: ['arvejas', 'peas', 'petits pois', 'ervilhas', 'Erbsen'],
  chipsCamote: ['chips de camote', 'sweet potato chips', 'chips de patate douce', 'chips de batata-doce', 'Süßkartoffel-Chips'],
  pure: ['puré de papas', 'mashed potatoes', 'purée de pommes de terre', 'purê de batata', 'Kartoffelpüree'],
  pallares: ['pallares', 'lima beans', 'haricots de Lima', 'feijão-de-lima', 'Limabohnen'],
  sopaSeca: ['sopa seca', 'sopa seca (pasta)', 'sopa seca (pâtes)', 'sopa seca (macarrão)', 'Sopa seca (Nudeln)'],
  salsaVino: ['salsa de vino tinto', 'red wine sauce', 'sauce au vin rouge', 'molho de vinho tinto', 'Rotweinsauce'],
  papasFritas: ['papas fritas', 'french fries', 'frites', 'batatas fritas', 'Pommes frites'],
  platano: ['plátano frito', 'fried plantain', 'banane plantain frite', 'banana frita', 'gebratene Kochbanane'],
  tartara: ['salsa tártara', 'tartar sauce', 'sauce tartare', 'molho tártaro', 'Remoulade'],
  queso: ['queso', 'cheese', 'fromage', 'queijo', 'Käse'],
  jamon: ['jamón', 'ham', 'jambon', 'presunto', 'Schinken'],
  quesoAzul: ['queso azul', 'blue cheese', 'fromage bleu', 'queijo azul', 'Blauschimmelkäse'],
  gouda: ['queso gouda', 'gouda', 'gouda', 'gouda', 'Gouda'],
  tocino: ['tocino', 'bacon', 'lard fumé', 'bacon', 'Speck'],
  salame: ['salame', 'salami', 'salami', 'salame', 'Salami'],
  carneMolida: ['carne molida', 'ground beef', 'viande hachée', 'carne moída', 'Hackfleisch'],
  salsaBBQ: ['salsa BBQ', 'BBQ sauce', 'sauce barbecue', 'molho barbecue', 'BBQ-Sauce'],
};
const COL: Record<Idioma, number> = { es: 0, en: 1, fr: 2, pt: 3, de: 4 };

export const nombreIngrediente = (id: string, idioma: Idioma): string => (N[id] ?? [id, id, id, id, id])[COL[idioma]];
export const idIngredientePorNombreEs = (nombre: string): string | undefined =>
  Object.keys(N).find((k) => N[k][0].toLowerCase() === nombre.trim().toLowerCase());
