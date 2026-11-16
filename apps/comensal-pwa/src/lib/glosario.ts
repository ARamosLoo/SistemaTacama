import type { Idioma } from './i18n';
import { normalizar } from './alergias';

/**
 * RF04 · Glosario de insumos y preparaciones peruanas, traducido a los cinco idiomas.
 * Cubre los términos que aparecen en los platos de la carta. Un término se muestra cuando el nombre o la descripción
 * del plato lo menciona (en español o en su traducción: las claves incluyen las variantes de cada idioma).
 */
export interface Insumo {
  id: string;
  claves: string[]; // sin tildes y en minúsculas
  nombre: Record<Idioma, string>;
  texto: Record<Idioma, string>;
}

// [id, claves, { es, en, fr, pt, de }: [nombre, explicación]]
type Fila = [string, string[], Record<Idioma, [string, string]>];

const FILAS: Fila[] = [
  ['papa', ['papa', 'potato', 'pomme de terre', 'batata', 'kartoffel'], {
    es: ['Papa', 'Tubérculo originario de los Andes: el Perú conserva miles de variedades, desde la papa amarilla hasta la nativa de colores.'],
    en: ['Potato', 'A tuber native to the Andes: Peru keeps thousands of varieties, from the yellow potato to colorful native ones.'],
    fr: ['Pomme de terre', 'Tubercule originaire des Andes : le Pérou conserve des milliers de variétés, de la jaune aux natives colorées.'],
    pt: ['Batata', 'Tubérculo originário dos Andes: o Peru conserva milhares de variedades, da batata amarela às nativas coloridas.'],
    de: ['Kartoffel', 'Knolle aus den Anden: Peru bewahrt tausende Sorten, von der gelben bis zu bunten Landsorten.'],
  }],
  ['pisco', ['pisco'], {
    es: ['Pisco', 'Aguardiente de uva peruano, destilado sin añadir agua ni aditivos. Base del chilcano y del pisco sour.'],
    en: ['Pisco', 'Peruvian grape brandy, distilled with no added water or additives. The base of the chilcano and the pisco sour.'],
    fr: ['Pisco', 'Eau-de-vie de raisin péruvienne, distillée sans eau ni additifs. Base du chilcano et du pisco sour.'],
    pt: ['Pisco', 'Aguardente de uva peruana, destilada sem água nem aditivos. Base do chilcano e do pisco sour.'],
    de: ['Pisco', 'Peruanischer Traubenbrand, ohne Wasser- oder Zusatzstoffe destilliert. Grundlage von Chilcano und Pisco Sour.'],
  }],
  ['pallares', ['pallares', 'pallar', 'lima bean', 'lima beans', 'haricot de lima', 'feijao de lima', 'limabohne', 'limabohnen'], {
    es: ['Pallares', 'Legumbre grande, harinosa y suave, típica de Ica. Se come en ensalada, guiso o picante.'],
    en: ['Pallares (lima beans)', 'A large, soft, floury legume typical of Ica. Eaten in salads, stews and spicy dishes.'],
    fr: ['Pallares (haricots de Lima)', 'Grosse légumineuse tendre et farineuse, typique d’Ica. En salade, en ragoût ou en plat épicé.'],
    pt: ['Pallares (feijão-de-lima)', 'Leguminosa grande, macia e farinhenta, típica de Ica. Come-se em salada, guisado ou picante.'],
    de: ['Pallares (Limabohnen)', 'Große, weiche, mehlige Hülsenfrucht, typisch für Ica. In Salat, Eintopf oder als scharfes Gericht.'],
  }],
  ['chicha', ['chicha'], {
    es: ['Chicha', 'Bebida tradicional andina: la morada se prepara con maíz morado, piña y canela; la de jora, con maíz fermentado.'],
    en: ['Chicha', 'Traditional Andean drink: chicha morada is made with purple corn, pineapple and cinnamon; chicha de jora with fermented corn.'],
    fr: ['Chicha', 'Boisson andine traditionnelle : la morada est faite de maïs violet, d’ananas et de cannelle ; la de jora, de maïs fermenté.'],
    pt: ['Chicha', 'Bebida andina tradicional: a morada leva milho roxo, abacaxi e canela; a de jora, milho fermentado.'],
    de: ['Chicha', 'Traditionelles Andengetränk: Chicha morada aus lila Mais, Ananas und Zimt; Chicha de jora aus fermentiertem Mais.'],
  }],
  ['salsa-criolla', ['salsa criolla', 'creole sauce', 'sauce creole', 'molho crioulo', 'kreolische sosse', 'kreolische soße'], {
    es: ['Salsa criolla', 'Cebolla roja en juliana con limón, ají y culantro. Acompaña casi todo plato criollo.'],
    en: ['Salsa criolla', 'Sliced red onion with lime, chili and cilantro. It accompanies almost every Creole dish.'],
    fr: ['Salsa criolla', 'Oignon rouge émincé avec citron vert, piment et coriandre. Accompagne presque tous les plats créoles.'],
    pt: ['Salsa criolla', 'Cebola roxa em tiras com limão, pimenta e coentro. Acompanha quase todo prato crioulo.'],
    de: ['Salsa criolla', 'Rote Zwiebelstreifen mit Limette, Chili und Koriander. Begleitet fast jedes kreolische Gericht.'],
  }],
  ['maracuya', ['maracuya', 'passion fruit', 'fruit de la passion', 'fruta do maracuja', 'passionsfrucht', 'maracuja'], {
    es: ['Maracuyá', 'Fruta de la pasión: ácida y aromática, muy usada en postres, jugos y cócteles.'],
    en: ['Maracuyá (passion fruit)', 'Sharp and fragrant, widely used in desserts, juices and cocktails.'],
    fr: ['Maracuyá (fruit de la passion)', 'Acidulé et parfumé, très utilisé en desserts, jus et cocktails.'],
    pt: ['Maracujá', 'Ácido e aromático, muito usado em sobremesas, sucos e coquetéis.'],
    de: ['Maracuyá (Passionsfrucht)', 'Säuerlich und aromatisch, viel verwendet in Desserts, Säften und Cocktails.'],
  }],
  ['huancaina', ['huancaina', 'huancaina sauce'], {
    es: ['Salsa a la huancaína', 'Crema de ají amarillo, queso fresco y galleta, que se sirve sobre papa cocida.'],
    en: ['Huancaína sauce', 'A creamy sauce of yellow chili, fresh cheese and crackers, served over boiled potato.'],
    fr: ['Sauce huancaína', 'Crème de piment jaune, fromage frais et biscuit, servie sur des pommes de terre bouillies.'],
    pt: ['Molho à huancaína', 'Creme de pimenta amarela, queijo fresco e bolacha, servido sobre batata cozida.'],
    de: ['Huancaína-Sauce', 'Cremige Sauce aus gelber Chili, Frischkäse und Keksen, über gekochten Kartoffeln serviert.'],
  }],
  ['aji-amarillo', ['aji amarillo', 'yellow chili', 'yellow chili pepper', 'piment jaune', 'pimenta amarela', 'gelbe chili'], {
    es: ['Ají amarillo', 'El chile más usado en la cocina peruana: picor medio, color dorado y aroma frutal.'],
    en: ['Ají amarillo', 'The most used chili in Peruvian cooking: medium heat, golden color and fruity aroma.'],
    fr: ['Ají amarillo', 'Le piment le plus utilisé au Pérou : piquant moyen, couleur dorée et arôme fruité.'],
    pt: ['Ají amarillo', 'A pimenta mais usada na cozinha peruana: picância média, cor dourada e aroma frutado.'],
    de: ['Ají amarillo', 'Die meistverwendete Chili Perus: mittlere Schärfe, goldene Farbe und fruchtiges Aroma.'],
  }],
  ['camote', ['camote', 'sweet potato', 'patate douce', 'batata-doce', 'batata doce', 'suesskartoffel', 'süßkartoffel'], {
    es: ['Camote', 'Batata dulce de pulpa anaranjada o morada. Se sirve cocida junto al ceviche y en guisos.'],
    en: ['Camote (sweet potato)', 'Sweet potato with orange or purple flesh. Served boiled beside ceviche and in stews.'],
    fr: ['Camote (patate douce)', 'Patate douce à chair orange ou violette. Servie cuite avec le ceviche et dans les ragoûts.'],
    pt: ['Camote (batata-doce)', 'Batata-doce de polpa laranja ou roxa. Servida cozida junto ao ceviche e em guisados.'],
    de: ['Camote (Süßkartoffel)', 'Süßkartoffel mit orangem oder lila Fleisch. Gekocht zum Ceviche und in Eintöpfen serviert.'],
  }],
  ['culantro', ['culantro', 'cilantro', 'coriander', 'coriandre', 'coentro', 'koriander'], {
    es: ['Culantro', 'Hierba de hoja verde intenso que da el color y el aroma al aderezo de muchos guisos peruanos.'],
    en: ['Culantro (cilantro)', 'A deep-green herb that gives color and aroma to the base of many Peruvian stews.'],
    fr: ['Culantro (coriandre)', 'Herbe vert intense qui donne couleur et arôme à la base de nombreux ragoûts péruviens.'],
    pt: ['Culantro (coentro)', 'Erva de folha verde intensa que dá cor e aroma ao refogado de muitos guisados peruanos.'],
    de: ['Culantro (Koriander)', 'Kräftig grünes Kraut, das der Grundlage vieler peruanischer Eintöpfe Farbe und Aroma gibt.'],
  }],
  ['pecanas', ['pecanas', 'pecan', 'pecans', 'noix de pecan', 'noz-pecan', 'nozes-pecan', 'pekannuss', 'pekannuesse', 'pekannüsse'], {
    es: ['Pecanas', 'Nuez de cáscara lisa que se cultiva en Ica. Es un fruto seco: contiene alérgeno.'],
    en: ['Pecans', 'A smooth-shelled nut grown in Ica. It is a tree nut: it contains an allergen.'],
    fr: ['Noix de pécan', 'Noix à coque lisse cultivée à Ica. C’est un fruit à coque : elle contient un allergène.'],
    pt: ['Nozes-pecã', 'Noz de casca lisa cultivada em Ica. É uma castanha: contém alérgeno.'],
    de: ['Pekannüsse', 'Glattschalige Nuss, die in Ica angebaut wird. Es ist eine Schalenfrucht: enthält ein Allergen.'],
  }],
  ['mote', ['mote'], {
    es: ['Mote', 'Maíz blanco grande, cocido y pelado. Se sirve como guarnición en platos de la sierra.'],
    en: ['Mote', 'Large white corn, boiled and peeled. Served as a side dish in Andean cooking.'],
    fr: ['Mote', 'Gros maïs blanc, cuit et pelé. Servi en accompagnement dans la cuisine andine.'],
    pt: ['Mote', 'Milho branco grande, cozido e descascado. Servido como acompanhamento na cozinha andina.'],
    de: ['Mote', 'Großer weißer Mais, gekocht und geschält. In der Andenküche als Beilage serviert.'],
  }],
  ['tamal', ['tamal', 'tamales', 'tamale'], {
    es: ['Tamal', 'Masa de maíz con relleno, envuelta en hoja de plátano o de maíz y cocida al vapor.'],
    en: ['Tamal', 'Corn dough with a filling, wrapped in banana or corn leaves and steamed.'],
    fr: ['Tamal', 'Pâte de maïs fourrée, enveloppée dans une feuille de bananier ou de maïs et cuite à la vapeur.'],
    pt: ['Tamal', 'Massa de milho recheada, envolta em folha de bananeira ou de milho e cozida no vapor.'],
    de: ['Tamal', 'Gefüllter Maisteig, in Bananen- oder Maisblätter gewickelt und gedämpft.'],
  }],
  ['carapulcra', ['carapulcra'], {
    es: ['Carapulcra', 'Guiso andino de papa seca (papa deshidratada), maní y ají panca; tradicional de Ica y Lima.'],
    en: ['Carapulcra', 'Andean stew of dried potato, peanuts and panca chili; traditional in Ica and Lima.'],
    fr: ['Carapulcra', 'Ragoût andin de pomme de terre séchée, cacahuètes et piment panca ; traditionnel à Ica et Lima.'],
    pt: ['Carapulcra', 'Guisado andino de batata seca, amendoim e pimenta panca; tradicional em Ica e Lima.'],
    de: ['Carapulcra', 'Andeneintopf aus getrockneten Kartoffeln, Erdnüssen und Panca-Chili; traditionell in Ica und Lima.'],
  }],
  ['sopa-seca', ['sopa seca'], {
    es: ['Sopa seca', 'Pasta con salsa de albahaca y tomate típica de Chincha e Ica; acompaña la carapulcra.'],
    en: ['Sopa seca', 'Pasta with a basil and tomato sauce typical of Chincha and Ica; served with carapulcra.'],
    fr: ['Sopa seca', 'Pâtes à la sauce basilic et tomate typiques de Chincha et Ica ; elles accompagnent la carapulcra.'],
    pt: ['Sopa seca', 'Massa com molho de manjericão e tomate típica de Chincha e Ica; acompanha a carapulcra.'],
    de: ['Sopa seca', 'Nudeln mit Basilikum-Tomatensauce, typisch für Chincha und Ica; wird zur Carapulcra gereicht.'],
  }],
  ['adobo', ['adobo'], {
    es: ['Adobo', 'Carne macerada en chicha de jora, vinagre y ají panca, luego cocida lentamente. Plato típico de Arequipa.'],
    en: ['Adobo', 'Meat marinated in chicha de jora, vinegar and panca chili, then slow-cooked. A typical dish from Arequipa.'],
    fr: ['Adobo', 'Viande marinée dans la chicha de jora, le vinaigre et le piment panca, puis mijotée. Plat typique d’Arequipa.'],
    pt: ['Adobo', 'Carne marinada em chicha de jora, vinagre e pimenta panca, depois cozida lentamente. Prato típico de Arequipa.'],
    de: ['Adobo', 'In Chicha de jora, Essig und Panca-Chili marinierter, langsam gegarter Braten. Typisch für Arequipa.'],
  }],
  ['chicharron', ['chicharron', 'chicharrones', 'chicharron de'], {
    es: ['Chicharrón', 'Carne (de cerdo o de pescado) frita hasta quedar crocante. Se sirve con camote y salsa criolla.'],
    en: ['Chicharrón', 'Meat (pork or fish) fried until crisp. Served with sweet potato and salsa criolla.'],
    fr: ['Chicharrón', 'Viande (porc ou poisson) frite jusqu’à devenir croustillante. Servie avec patate douce et salsa criolla.'],
    pt: ['Chicharrón', 'Carne (de porco ou peixe) frita até ficar crocante. Servida com batata-doce e salsa criolla.'],
    de: ['Chicharrón', 'Knusprig frittiertes Fleisch (Schwein oder Fisch). Mit Süßkartoffel und Salsa criolla serviert.'],
  }],
  ['aji-de-gallina', ['aji de gallina'], {
    es: ['Ají de gallina', 'Pollo deshilachado en crema de ají amarillo, pan y nueces, servido con arroz y papa.'],
    en: ['Ají de gallina', 'Shredded chicken in a cream of yellow chili, bread and walnuts, served with rice and potato.'],
    fr: ['Ají de gallina', 'Poulet effiloché dans une crème de piment jaune, pain et noix, servi avec riz et pomme de terre.'],
    pt: ['Ají de gallina', 'Frango desfiado em creme de pimenta amarela, pão e nozes, servido com arroz e batata.'],
    de: ['Ají de gallina', 'Zerzupftes Huhn in einer Creme aus gelber Chili, Brot und Walnüssen, mit Reis und Kartoffeln.'],
  }],
  ['choclo', ['choclo', 'corn on the cob', 'maiz tierno', 'mais frais'], {
    es: ['Choclo', 'Maíz tierno de granos grandes y blancos, típico de la sierra. Se sirve cocido o en humitas y pastel.'],
    en: ['Choclo', 'Fresh corn with large white kernels, typical of the highlands. Served boiled or in humitas and pies.'],
    fr: ['Choclo', 'Maïs frais à gros grains blancs, typique de la sierra. Servi cuit ou en humitas et tourtes.'],
    pt: ['Choclo', 'Milho verde de grãos grandes e brancos, típico da serra. Servido cozido ou em humitas e tortas.'],
    de: ['Choclo', 'Frischer Mais mit großen weißen Körnern, typisch für das Hochland. Gekocht oder in Humitas und Aufläufen.'],
  }],
  ['causa', ['causa'], {
    es: ['Causa', 'Puré frío de papa amarilla con limón y ají amarillo, relleno de pollo, atún o mariscos.'],
    en: ['Causa', 'Cold mashed yellow potato with lime and yellow chili, filled with chicken, tuna or seafood.'],
    fr: ['Causa', 'Purée froide de pomme de terre jaune au citron vert et piment jaune, garnie de poulet, thon ou fruits de mer.'],
    pt: ['Causa', 'Purê frio de batata amarela com limão e pimenta amarela, recheado com frango, atum ou frutos do mar.'],
    de: ['Causa', 'Kaltes Püree aus gelben Kartoffeln mit Limette und gelber Chili, gefüllt mit Huhn, Thunfisch oder Meeresfrüchten.'],
  }],
  ['humita', ['humita', 'humitas'], {
    es: ['Humita', 'Masa de choclo fresco molido, envuelta en la propia hoja del maíz y cocida al vapor.'],
    en: ['Humita', 'Ground fresh-corn dough wrapped in its own corn husk and steamed.'],
    fr: ['Humita', 'Pâte de maïs frais moulu, enveloppée dans sa propre feuille de maïs et cuite à la vapeur.'],
    pt: ['Humita', 'Massa de milho verde moído, envolta na própria palha do milho e cozida no vapor.'],
    de: ['Humita', 'Teig aus gemahlenem frischem Mais, in das eigene Maisblatt gewickelt und gedämpft.'],
  }],
  ['arroz-tapado', ['arroz tapado'], {
    es: ['Arroz tapado', 'Arroz “tapado” con un guiso de carne molida, aceitunas y huevo, típico de la cocina criolla.'],
    en: ['Arroz tapado', 'Rice “covered” with a ground-meat stew, olives and egg, typical of Creole cooking.'],
    fr: ['Arroz tapado', 'Riz « couvert » d’un ragoût de viande hachée, olives et œuf, typique de la cuisine créole.'],
    pt: ['Arroz tapado', 'Arroz “tapado” com guisado de carne moída, azeitonas e ovo, típico da cozinha crioula.'],
    de: ['Arroz tapado', 'Reis, „zugedeckt“ mit Hackfleischragout, Oliven und Ei, typisch für die kreolische Küche.'],
  }],
  ['muna', ['muna'], {
    es: ['Muña', 'Hierba andina aromática, de efecto digestivo, usada en infusiones y para aromatizar platos.'],
    en: ['Muña', 'An aromatic Andean herb with a digestive effect, used in infusions and to flavor dishes.'],
    fr: ['Muña', 'Herbe andine aromatique à effet digestif, utilisée en infusions et pour parfumer les plats.'],
    pt: ['Muña', 'Erva andina aromática, de efeito digestivo, usada em infusões e para aromatizar pratos.'],
    de: ['Muña', 'Aromatisches Andenkraut mit verdauungsfördernder Wirkung, für Aufgüsse und zum Würzen.'],
  }],
  ['anticucho', ['anticucho', 'anticuchos'], {
    es: ['Anticucho', 'Brochetas de carne marinada en ají panca y vinagre, asadas a la parrilla.'],
    en: ['Anticucho', 'Skewers of meat marinated in panca chili and vinegar, grilled.'],
    fr: ['Anticucho', 'Brochettes de viande marinée au piment panca et au vinaigre, grillées.'],
    pt: ['Anticucho', 'Espetos de carne marinada em pimenta panca e vinagre, grelhados.'],
    de: ['Anticucho', 'Fleischspieße, in Panca-Chili und Essig mariniert und gegrillt.'],
  }],
  ['piqueo', ['piqueo', 'piqueos'], {
    es: ['Piqueo', 'Picada: variedad de entradas pequeñas para compartir en la mesa.'],
    en: ['Piqueo', 'A sharing platter: a variety of small starters for the table.'],
    fr: ['Piqueo', 'Assortiment de petites entrées à partager à table.'],
    pt: ['Piqueo', 'Petiscos: variedade de pequenas entradas para compartilhar na mesa.'],
    de: ['Piqueo', 'Vorspeisenplatte: verschiedene kleine Vorspeisen zum Teilen am Tisch.'],
  }],
];

export const GLOSARIO: Insumo[] = FILAS.map(([id, claves, t]) => ({
  id,
  claves,
  nombre: Object.fromEntries((Object.keys(t) as Idioma[]).map((i) => [i, t[i][0]])) as Record<Idioma, string>,
  texto: Object.fromEntries((Object.keys(t) as Idioma[]).map((i) => [i, t[i][1]])) as Record<Idioma, string>,
}));

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Sin tildes, en minúsculas y con ß como "ss" (alemán)
const limpiar = (s: string) => normalizar(s).replace(/ß/g, 'ss');

/** Insumos del glosario mencionados por el nombre o la descripción de un plato (en el idioma en que se muestra). */
export function insumosDe(plato: { nombre: string; descripcion: string }): Insumo[] {
  const texto = ` ${limpiar(`${plato.nombre} ${plato.descripcion}`).replace(/[^a-z0-9ñ]+/g, ' ')} `;
  return GLOSARIO.filter((g) => g.claves.some((c) => new RegExp('\\s' + escapar(limpiar(c)) + 's?\\s').test(texto)));
}
