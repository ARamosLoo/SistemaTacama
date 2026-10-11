/**
 * build-carta.js — genera infra/data/carta-tacama.json y etiquetas-tacama.json
 * a partir de la carta oficial del Tambo de Tacama (CARTA TAMACA.pdf).
 * Fuente única para los seeds de catalogo, maridaje e inventario.
 *
 * Alérgenos: la carta no los declara; se infieren de la descripción de cada plato
 * (ingredientes evidentes). Deben ser validados por la cocina antes de operar.
 *
 * Uso: node infra/data/build-carta.js
 */
const fs = require('fs');
const path = require('path');

// ── Etiquetas (vinos, espumosos y piscos citados en los maridajes sugeridos) ──
// precio: referencial (la carta entregada no incluye la carta de vinos)
const etiquetas = [
  // codigo, nombre, tipo, cepa, descripción, precio, rango, stock, umbral
  ['ESP-MAG', 'Espumoso Magnolia Alba (Semi seco)', 'VINO_ESPUMANTE', 'Semi seco', 'Espumoso suave y aromático, de burbuja fina y final ligeramente dulce.', 78, 'INTERMEDIO', 18, 4],
  ['ESP-ORQ', 'Espumoso Orquídea Negra (Brut)', 'VINO_ESPUMANTE', 'Brut', 'Espumoso seco y fresco, de burbuja persistente y notas cítricas.', 88, 'INTERMEDIO', 18, 4],
  ['ESP-ROS', 'Espumoso Rosa Salvaje (Extra Brut)', 'VINO_ESPUMANTE', 'Extra Brut', 'Espumoso rosado muy seco, con frutos rojos y gran frescura.', 95, 'PREMIUM', 12, 3],
  ['BLA-TRI', 'Blanco de Blancos "Triunfo"', 'VINO_BLANCO', 'Sauvignon Blanc, Chardonnay, Viognier', 'Blanco fresco y mineral, con notas cítricas y de flores blancas.', 95, 'INTERMEDIO', 48, 6],
  ['BLA-GBL', 'Gran Blanco Tres Cepas', 'VINO_BLANCO', 'Sauvignon Blanc, Chenin Blanc, Chardonnay', 'Blanco joven y frutal, de fácil trago y acidez equilibrada.', 58, 'ECONOMICO', 40, 6],
  ['BLA-DAN', 'Doña Ana', 'VINO_BLANCO', 'Chardonnay', 'Chardonnay de cuerpo medio, con notas de fruta tropical y vainilla suave.', 82, 'INTERMEDIO', 24, 4],
  ['BLA-AMB', 'Ambrosía', 'VINO_BLANCO', 'Nielluccio', 'Blanco aromático y delicado, con frutas blancas y un final persistente.', 90, 'INTERMEDIO', 16, 4],
  ['BLA-ALB', 'Albilla de Ica', 'VINO_BLANCO', 'Albilla', 'Vino dulce de uva Albilla, aromático y untuoso; ideal para postres.', 70, 'INTERMEDIO', 20, 4],
  ['TIN-SCA', 'Selección Especial "Triunfo" Carménère', 'VINO_TINTO', 'Carménère', 'Tinto de frutos rojos y notas especiadas, taninos suaves.', 98, 'INTERMEDIO', 24, 4],
  ['TIN-SPV', 'Selección Especial "Triunfo" Petit Verdot', 'VINO_TINTO', 'Petit Verdot', 'Tinto intenso con violetas, ciruelas y especias dulces.', 98, 'INTERMEDIO', 24, 4],
  ['TIN-SPT', 'Selección Especial "Triunfo" Petit Verdot - Tannat', 'VINO_TINTO', 'Petit Verdot, Tannat', 'Tinto estructurado, de gran cuerpo y final largo.', 102, 'INTERMEDIO', 20, 4],
  ['TIN-SMA', 'Selección Especial "Triunfo" Malbec', 'VINO_TINTO', 'Malbec', 'Malbec de fruta madura, redondo y de taninos amables.', 98, 'INTERMEDIO', 24, 4],
  ['TIN-SAL', 'Selección Especial "Triunfo" Alicante Bouschet', 'VINO_TINTO', 'Alicante Bouschet', 'Tinto de color profundo, con fruta negra y notas de cacao.', 105, 'PREMIUM', 14, 3],
  ['TIN-ORI', 'Origen', 'VINO_TINTO', 'Malbec, Carménère, Petit Verdot', 'Tinto del terroir de Tacama, equilibrado, de fruta fresca y especias.', 120, 'PREMIUM', 22, 4],
  ['TIN-TON', 'Vino Patrimonial Toñuz', 'VINO_TINTO', 'Quebranta, Tannat', 'Tinto patrimonial de uvas históricas del valle de Ica.', 135, 'PREMIUM', 12, 3],
  ['TIN-DMT', 'Don Manuel Tannat', 'VINO_TINTO', 'Tannat', 'Tinto emblemático de cuerpo robusto, taninos elegantes y notas de frutos negros.', 125, 'PREMIUM', 18, 4],
  ['TIN-DMP', 'Don Manuel Petit Verdot', 'VINO_TINTO', 'Petit Verdot', 'Tinto de gran estructura con violetas, cacao y roble.', 125, 'PREMIUM', 18, 4],
  ['TIN-GT3', 'Gran Tinto Tres Cepas', 'VINO_TINTO', 'Malbec, Petit Verdot, Tannat', 'Tinto frutado y equilibrado, fácil de beber.', 62, 'ECONOMICO', 45, 8],
  ['TIN-GTC', 'Gran Tinto Crianza', 'VINO_TINTO', 'Malbec', 'Malbec con paso por roble, notas de vainilla y fruta roja.', 72, 'ECONOMICO', 30, 6],
  ['PIS-QUE', 'Pisco Demonio de los Andes Quebranta', 'PISCO_PURO', 'Quebranta', 'Pisco puro de aromas a almendra y frutos secos, cuerpo pleno.', 68, 'INTERMEDIO', 36, 6],
  ['PIS-ACH', 'Pisco Demonio de los Andes Acholado', 'PISCO_ACHOLADO', 'Acholado', 'Destilado insignia de Tacama, complejo, floral y frutal.', 68, 'INTERMEDIO', 36, 6],
  ['PIS-ALB', 'Pisco Demonio de los Andes Albilla', 'PISCO_PURO', 'Albilla', 'Pisco aromático de uva Albilla, delicado y de final dulce.', 72, 'INTERMEDIO', 24, 4],
];

const E = Object.fromEntries(etiquetas.map((e) => [e[0], e[1]]));

// ── Platos ────────────────────────────────────────────────────
// Alérgenos: G gluten, L lácteos, H huevo, M mariscos, P pescado, S soya, N frutos secos, MO mostaza, SU sulfitos
const AL = { G: 'GLUTEN', L: 'LACTEOS', H: 'HUEVO', M: 'MARISCOS', P: 'PESCADO', S: 'SOYA', N: 'NUECES', MO: 'MOSTAZA', SU: 'SULFITOS' };

const platos = [];
let n = 0;
/**
 * d(seccion, categoria, nombreEs, nombreEn, descEs, descEn, precio, opts)
 * opts: v (vegetariano), l (libre de lactosa), al (alérgenos), t (tags), p (picante 0-2),
 *       e (estilo ligero|contundente|dulce), mar (texto de maridaje), par ([[etiqueta, puntaje]...]), img, min
 */
function d(seccion, categoria, nombreEs, nombreEn, descEs, descEn, precio, o = {}) {
  n += 1;
  platos.push({
    codigo: 'TAC-' + String(n).padStart(3, '0'),
    seccion, categoria, nombreEs, nombreEn, descEs, descEn, precio,
    esVegetariano: !!o.v, libreLactosa: !!o.l,
    alergenos: (o.al || []).map((k) => AL[k]),
    tags: o.t || [], picante: o.p ?? 0, estilo: o.e || null,
    maridajeTexto: o.mar || null,
    maridaje: (o.par || []).map(([c, s]) => ({ etiqueta: c, puntaje: s })),
    imagen: o.img || null,
    tiempoPrep: o.min || (categoria === 'BEBIDA' ? 3 : 15),
  });
}

// PARA PICAR
d('PARA_PICAR', 'ENTRADA', 'Pecanas Iqueñas al Romero', 'Rosemary pecans from Ica', 'Saladitas y con su toque mediterráneo.', 'Salty, with a mediterranean touch.', 25,
  { v: true, al: ['N'], t: ['vegetariano', 'snack'], e: 'ligero', mar: 'Espumoso Magnolia Alba - Semi seco', par: [['ESP-MAG', 10]], img: 'pecanas', min: 5 });
const teq = 'Tequeños (6 unid.)';
const teqEn = 'Tequeños (6 pieces)';
d('PARA_PICAR', 'ENTRADA', teq + ' de queso con salsa guacamole', teqEn + ' - cheese with guacamole sauce', 'Crocantes tequeños rellenos de queso, con salsa guacamole.', 'Crispy cheese tequeños with guacamole sauce.', 20,
  { v: true, al: ['G', 'L'], t: ['vegetariano', 'frito', 'queso'], e: 'ligero', mar: 'Blanco de Blancos "Triunfo" - Sauvignon Blanc, Chardonnay, Viognier', par: [['BLA-TRI', 10], ['BLA-GBL', 8]], img: 'tequenos' });
d('PARA_PICAR', 'ENTRADA', teq + ' de ají de gallina con salsa guacamole', teqEn + ' - Aji de gallina with guacamole sauce', 'Tequeños rellenos de ají de gallina, con salsa guacamole.', 'Tequeños filled with aji de gallina, with guacamole sauce.', 23,
  { al: ['G', 'L', 'N'], t: ['pollo', 'frito', 'criollo'], p: 1, e: 'ligero', mar: 'Blanco de Blancos "Triunfo" - Sauvignon Blanc, Chardonnay, Viognier', par: [['BLA-TRI', 10], ['BLA-GBL', 8]], img: 'tequenos' });
d('PARA_PICAR', 'ENTRADA', teq + ' de lomo saltado con salsa huancaína', teqEn + ' - Lomo saltado with huancaina sauce', 'Tequeños rellenos de lomo saltado, con salsa huancaína.', 'Tequeños filled with lomo saltado, with huancaina sauce.', 24,
  { al: ['G', 'L', 'S'], t: ['res', 'frito', 'criollo'], p: 1, e: 'ligero', mar: 'Blanco de Blancos "Triunfo" - Sauvignon Blanc, Chardonnay, Viognier', par: [['BLA-TRI', 9], ['TIN-GTC', 8]], img: 'tequenos' });
d('PARA_PICAR', 'ENTRADA', teq + ' de asado al vino tinto con salsa guacamole', teqEn + ' - Roasted beef with guacamole sauce', 'Tequeños rellenos de asado al vino tinto, con salsa guacamole.', 'Tequeños filled with red wine roast beef, with guacamole sauce.', 24,
  { al: ['G', 'L', 'SU'], t: ['res', 'frito'], e: 'ligero', mar: 'Blanco de Blancos "Triunfo" - Sauvignon Blanc, Chardonnay, Viognier', par: [['BLA-TRI', 8], ['TIN-GTC', 9]], img: 'tequenos' });
d('PARA_PICAR', 'ENTRADA', 'Trilogía de tequeños (9 unid.)', 'Tequeños trilogy (9 pieces)', 'Tres sabores de tequeños para compartir.', 'Three flavours of tequeños to share.', 32,
  { al: ['G', 'L', 'S', 'SU'], t: ['res', 'pollo', 'queso', 'frito', 'compartir'], p: 1, e: 'ligero', mar: 'Blanco de Blancos "Triunfo" - Sauvignon Blanc, Chardonnay, Viognier', par: [['BLA-TRI', 10], ['BLA-GBL', 8]], img: 'tequenos' });
d('PARA_PICAR', 'ENTRADA', 'Tabla de quesos peruanos', 'Peruvian cheese platter', 'Quesos peruanos variados, con pecanas al romero, pasas y nuestro inigualable pan chapla.', 'Peruvian cheeses served with rosemary pecans, raisins and our unbeatable chapla bread.', 42,
  { v: true, al: ['L', 'N', 'G'], t: ['vegetariano', 'queso', 'compartir'], e: 'ligero', mar: 'Selección Especial "Triunfo" - Carménère', par: [['TIN-SCA', 10], ['ESP-ORQ', 8]], img: 'tabla_quesos' });
d('PARA_PICAR', 'ENTRADA', 'Clásicas yuquitas de la casa', 'Classic homemade yuquitas', 'Crocantitas, acompañadas de salsa huancaína.', 'Crunchy, served with our huancaina sauce.', 30,
  { v: true, al: ['L'], t: ['vegetariano', 'frito', 'queso'], p: 1, e: 'ligero', mar: 'Gran Blanco - Sauvignon Blanc, Chenin, Chardonnay', par: [['BLA-GBL', 10], ['BLA-TRI', 8]], img: 'yuquitas' });
d('PARA_PICAR', 'ENTRADA', 'Gran Empanada Tacama', 'Gran Tacama empanada', 'Masa hojaldrada rellena con el exquisito adobo de cerdo José Antonio, acompañado con una fresca ensalada de tomate y lechuga de la huerta.', 'Puff pastry filled with the exquisite José Antonio pork adobo, with a fresh tomato and lettuce salad from our garden.', 22,
  { al: ['G', 'L', 'H'], t: ['cerdo', 'criollo', 'tradicional'], p: 1, e: 'contundente', mar: 'Selección Especial "Triunfo" - Carménère', par: [['TIN-SCA', 10], ['TIN-GTC', 8]], img: 'empanada' });
d('PARA_PICAR', 'ENTRADA', 'Gran Piqueo Tacama (3 personas)', 'Grand Tacama criollo platter (serves three)', 'Una completa celebración criolla: crujientes yuquitas, dorados chicharrones de cerdo, suaves anticuchos con choclito al comino y nuestro clásico tamalito, con huancaína, ají y salsa criolla.', 'A real banquet. Crunchy yuquitas, crispy pork and tender anticuchos, served with buttered corn and our classic tamalito, with huancaina sauce and salsa criolla.', 99,
  { al: ['L', 'G', 'SU'], t: ['cerdo', 'res', 'criollo', 'compartir', 'tradicional'], p: 1, e: 'contundente', mar: 'Selección Especial "Triunfo" - Alicante Bouschet', par: [['TIN-SAL', 10], ['TIN-SPV', 8]], img: 'gran_piqueo', min: 25 });

// ENTRADAS
d('ENTRADAS', 'ENTRADA', 'Causa rellena con pollo', 'Chicken-stuffed causa', 'Uno de los platos más famosos de la gastronomía peruana. Papa, ají y limón son los protagonistas; se rellena con pollo, mayonesa y palta de nuestro huerto.', 'Mashed yellow potatoes stuffed with homegrown avocado and chicken with mayonnaise.', 25,
  { al: ['H'], t: ['pollo', 'criollo', 'frío', 'tradicional'], p: 1, e: 'ligero', mar: 'Gran Blanco Tres Cepas - Sauvignon Blanc, Chenin Blanc, Chardonnay', par: [['BLA-GBL', 10], ['BLA-TRI', 9]], img: 'causa_pollo' });
d('ENTRADAS', 'ENTRADA', 'Papa a la huancaína', 'Papa a la huancaina', 'Selecta papa amarilla sancochada y bañada generosamente con nuestra peruanísima salsa de ají amarillo y queso fresco.', 'Cooked potatoes, covered generously with our yellow pepper sauce and soft cheese.', 24,
  { v: true, al: ['L', 'H'], t: ['vegetariano', 'criollo', 'tradicional', 'frío'], p: 1, e: 'ligero', mar: 'Blanco de Blancos "Triunfo" - Sauvignon Blanc, Chardonnay, Viognier', par: [['BLA-TRI', 10], ['BLA-GBL', 8]], img: 'papa_huancaina' });
d('ENTRADAS', 'ENTRADA', 'Palta a la jardinera', 'Avocado with vegetables', 'Cremosa palta iqueña, coronada con un mix de verduras cocidas envueltas con mayonesa.', 'Soft avocado topped with a mix of cooked vegetables dressed in mayonnaise.', 24,
  { v: true, l: true, al: ['H'], t: ['vegetariano', 'frío'], e: 'ligero', mar: 'Espumoso Orquídea Negra - Brut', par: [['ESP-ORQ', 10], ['BLA-TRI', 8]], img: 'palta_jardinera' });
d('ENTRADAS', 'ENTRADA', 'Palta con langostinos en salsa anticuchera', 'Avocado with prawn in anticucho sauce', 'Tiernos langostinos grillados, acompañados de una mixtura de verduras cocidas envueltas en mayonesa sobre una base de palta.', 'Grilled prawns served with a mix of cooked vegetables on an avocado base, dressed in our anticucho sauce.', 35,
  { al: ['M', 'H', 'SU'], t: ['mariscos', 'frío'], p: 1, e: 'ligero', mar: 'Espumoso Rosa Salvaje - Extra Brut', par: [['ESP-ROS', 10], ['ESP-ORQ', 8]], img: 'palta_langostinos' });
d('ENTRADAS', 'ENTRADA', 'Ensalada iqueña de pallares', 'Lima bean salad from Ica', 'Tradicional de nuestra tierra: pallares cocidos, tomates, cebollas y un toque de albahaca. El pallar carga una ancestral historia que se remonta a las culturas preincaicas.', 'An Ica traditional dish. A combination of cooked lima beans, tomatoes, onions and a touch of basil.', 25,
  { v: true, l: true, t: ['vegetariano', 'tradicional_ica', 'frío'], e: 'ligero', mar: 'Doña Ana - Chardonnay', par: [['BLA-DAN', 10], ['BLA-TRI', 8]], img: 'ensalada_pallares' });
d('ENTRADAS', 'ENTRADA', "Ensalada Cesar's", "Caeser's salad", 'Lechuga con crutones, jugo de limón, aceite de oliva, huevos, salsa inglesa, anchoas, ajo, mostaza, queso parmesano y pimienta negra.', 'Lettuce salad with croutons, lemon juice, olive oil, eggs, english sauce, anchovies, garlic, mustard, parmesan cheese and black pepper.', 25,
  { al: ['G', 'H', 'P', 'MO', 'L'], t: ['ensalada', 'frío'], e: 'ligero', mar: 'Espumoso Orquídea Negra - Brut', par: [['ESP-ORQ', 10], ['BLA-TRI', 8]], img: 'ensalada_cesar' });
d('ENTRADAS', 'ENTRADA', "Ensalada Cesar's con pollo", "Caeser's salad with chicken", 'Nuestra ensalada César acompañada de pechuga de pollo.', "Our Caesar's salad topped with chicken breast.", 34,
  { al: ['G', 'H', 'P', 'MO', 'L'], t: ['pollo', 'ensalada', 'frío'], e: 'ligero', mar: 'Espumoso Orquídea Negra - Brut', par: [['ESP-ORQ', 10], ['BLA-TRI', 8]], img: 'ensalada_cesar' });
d('ENTRADAS', 'ENTRADA', 'Ensalada de la casa', 'House salad', 'Refrescantes lechugas del huerto, tomate, choclo, zanahoria, espárragos, cebolla blanca y palta acompañada con nuestra vinagreta.', 'Fresh lettuce, tomatoes, onions and avocado with our classic dressing.', 25,
  { v: true, l: true, t: ['vegetariano', 'ensalada', 'frío'], e: 'ligero', mar: 'Espumoso Orquídea Negra - Brut', par: [['ESP-ORQ', 10], ['BLA-GBL', 8]], img: 'ensalada_casa' });
d('ENTRADAS', 'ENTRADA', 'Tamalito criollo', 'Peruvian criollo tamale', 'Clásico tamal iqueño relleno de cerdo y acompañado con salsa criolla.', "Homemade with the classic Tacama's recipe. Stuffed with pork, served with salsa criolla.", 20,
  { al: ['N'], t: ['cerdo', 'criollo', 'tradicional_ica'], e: 'contundente', mar: 'Vino Patrimonial Toñuz - Quebranta, Tannat', par: [['TIN-TON', 10], ['TIN-GTC', 8]], img: 'tamalito_criollo' });
d('ENTRADAS', 'ENTRADA', 'Tamalito verde', 'Green tamalito', 'Tamalito de culantro relleno de pechuga de pollo, con salsa criolla. Una buena experiencia que querrá repetir.', 'Stuffed with chopped chicken breast, served with salsa criolla.', 20,
  { t: ['pollo', 'criollo', 'tradicional_ica'], e: 'ligero', mar: 'Gran Blanco Tres Cepas - Sauvignon Blanc, Chenin Blanc, Chardonnay', par: [['BLA-GBL', 10], ['BLA-TRI', 8]], img: 'tamalito_verde' });
d('ENTRADAS', 'ENTRADA', 'Humita de queso', 'Cheese humita', 'Suave humita casera preparada con choclito tierno a fuego lento.', 'Prepared with fresh corn and filled with cheese. Very good option.', 20,
  { v: true, al: ['L'], t: ['vegetariano', 'queso', 'tradicional_ica', 'caliente'], e: 'ligero', mar: 'Ambrosía - Nielluccio', par: [['BLA-AMB', 10], ['BLA-TRI', 8]], img: 'humita' });

// ESPECIALIDADES
d('ESPECIALIDADES', 'PRINCIPAL', 'Pastel de choclo', 'Corn pie (pastel de choclo)', 'Nuestra exquisita receta de toda la vida, relleno con carne. Hoy la compartimos con ustedes.', 'A traditional house corn pie with spices, stuffed with ground meat, olives, egg, tomato sauce and raisins.', 37,
  { al: ['H', 'L'], t: ['res', 'criollo', 'tradicional'], e: 'contundente', mar: 'Origen - Malbec & Malbec', par: [['TIN-ORI', 10], ['TIN-SMA', 8]], img: 'pastel_choclo', min: 20 });
d('ESPECIALIDADES', 'PRINCIPAL', 'Costillas de cerdo BBQ', 'BBQ pork ribs', 'Una de las recetas más populares y queridas. Textura jugosa, sabor ahumado e irresistible salsa.', 'One of the most popular and beloved recipes. Juicy texture, smoky flavor and irresistible sauce.', 70,
  { al: ['S', 'SU'], t: ['cerdo', 'ahumado'], e: 'contundente', mar: 'Vino Patrimonial Toñuz - Quebranta, Tannat', par: [['TIN-TON', 10], ['TIN-DMT', 9]], img: 'costillas', min: 25 });
d('ESPECIALIDADES', 'PRINCIPAL', 'Ají de gallina', 'Aji de gallina', 'Un tradicional plato peruano. La perfecta preparación de nuestra suave salsa de ají amarillo hace de esta opción un éxito asegurado. Con papas sancochadas y arroz blanco.', 'A traditional peruvian dish. Chicken in a creamy cheese and yellow chilli sauce (not spicy). Served with boiled potatoes and white rice on the side.', 39,
  { al: ['L', 'N', 'G', 'H'], t: ['pollo', 'criollo', 'tradicional'], p: 1, e: 'contundente', mar: 'Blanco de Blancos "Triunfo" - Sauvignon Blanc, Chardonnay, Viognier', par: [['BLA-TRI', 10], ['BLA-DAN', 9]], img: 'aji_gallina' });
d('ESPECIALIDADES', 'PRINCIPAL', 'Arroz con pollo', 'Chicken with rice (arroz con pollo)', 'Un delicioso equilibrio de culantro, zanahoria y arverjitas con salsa criolla.', 'Chicken served with delicious rice seasoned with coriander, cooked with carrots, green peas and red pepper. Served with our fresh peruvian salsa criolla on the side.', 39,
  { t: ['pollo', 'criollo', 'tradicional'], e: 'contundente', mar: 'Selección Especial "Triunfo" - Petit Verdot', par: [['TIN-SPV', 10], ['TIN-GTC', 8]], img: 'arroz_pollo' });
d('ESPECIALIDADES', 'PRINCIPAL', 'Pollo a la plancha', 'Grilled chicken', 'Con dos guarniciones a elegir: papas fritas amarillas, ensalada fresca o arroz blanco.', 'Choice of two sides: rice, salad or crispy fries.', 39,
  { l: true, t: ['pollo', 'ligero'], e: 'ligero', mar: 'Gran Blanco Tres Cepas - Sauvignon Blanc, Chenin Blanc, Chardonnay', par: [['BLA-GBL', 10], ['BLA-TRI', 8]], img: 'pollo_plancha' });
d('ESPECIALIDADES', 'PRINCIPAL', 'Milanesa de pollo', 'Chicken milanesa', 'Con dos guarniciones a elegir: papas fritas amarillas, ensalada fresca o arroz blanco.', 'Choice of two sides: rice, salad or crispy fries.', 42,
  { l: true, al: ['G', 'H'], t: ['pollo', 'frito'], e: 'contundente', mar: 'Gran Blanco Tres Cepas - Sauvignon Blanc, Chenin Blanc, Chardonnay', par: [['BLA-GBL', 10], ['BLA-TRI', 8]], img: 'pollo_plancha' });
d('ESPECIALIDADES', 'PRINCIPAL', 'Chicharrón de cerdo', 'Crispy pork rinds', 'Doradita y crujiente panceta, acompañada de chips de camote y por supuesto nuestra atrevida salsa criolla.', 'Crispy, deep-fried pork, served with crispy sweet potatoes, and unique creole sauce.', 49,
  { l: true, t: ['cerdo', 'frito', 'criollo'], e: 'contundente', mar: 'Selección Especial Triunfo, Alicante Bouschet', par: [['TIN-SAL', 10], ['TIN-SPV', 8]], img: 'chicharron_cerdo' });
d('ESPECIALIDADES', 'PRINCIPAL', 'Adobo de cerdo "José Antonio"', 'Pork adobo "José Antonio"', 'Guiso macerado con diversos ajíes y especias, acompañado de puré de pallares verdes y arroz blanco.', 'Pork stew made with various peppers and spices, served with green lima beans purée and white rice.', 52,
  { al: ['SU'], t: ['cerdo', 'criollo', 'tradicional_ica'], p: 1, e: 'contundente', mar: 'Selección Especial Triunfo, Petit Verdot', par: [['TIN-SPV', 10], ['TIN-DMP', 9]], img: 'adobo_cerdo', min: 20 });
d('ESPECIALIDADES', 'PRINCIPAL', 'Carapulcra con sopa seca', 'Carapulcra with sopa seca', 'Uno de los platos más antiguos del Perú. Papa seca sancochada y guisada con carne de chancho, acompañada de sopa seca a base de fideos con aderezo de albahaca, pollo y perejil.', 'Dried potato simmered with pork meat, served with sopa seca, made with noodles, basil, chicken, parsley and other ingredients.', 48,
  { al: ['G'], t: ['cerdo', 'pollo', 'tradicional_ica', 'criollo'], p: 1, e: 'contundente', mar: 'Selección Especial Triunfo, Petit Verdot - Tannat', par: [['TIN-SPT', 10], ['TIN-DMT', 9]], img: 'carapulcra', min: 20 });
d('ESPECIALIDADES', 'PRINCIPAL', 'Fettuccine a la huancaína con lomo fino', 'Fettuccine a la huancaina with lomo fino', 'Deliciosos fetuccinis a la huancaína con medallón de lomo en salsa de vino tinto.', 'Fettuccine with huancaina sauce, served with a beef tenderloin in a red wine sauce reduction.', 62,
  { al: ['G', 'L', 'H', 'SU'], t: ['res', 'pasta'], p: 1, e: 'contundente', mar: 'Don Manuel, Tannat', par: [['TIN-DMT', 10], ['TIN-SPT', 8]], img: 'fettuccine' });
d('ESPECIALIDADES', 'PRINCIPAL', 'Spaguetti al pesto con apanado especial', 'Pesto with breaded tenderloin', 'Nuestra sábana de lomo fino, en esta ocasión acompañada de un casero spaguetti al pesto.', 'Our special breaded tender loin, with a homemade-like pesto spaghetti.', 59,
  { al: ['G', 'L', 'N', 'H'], t: ['res', 'pasta', 'frito'], e: 'contundente', mar: 'Selección Especial Triunfo, Carménère', par: [['TIN-SCA', 10], ['TIN-ORI', 8]], img: 'spaguetti_pesto' });
d('ESPECIALIDADES', 'PRINCIPAL', 'Lomo saltado', 'Lomo saltado', 'El rey de la comida criolla. Lo servimos jugoso, flambeado con pisco y acompañado con crocantes papas fritas amarillas y arroz blanco.', 'The king of peruvian gastronomy. Tender filet mignon sautéed with ripe and juicy tomatoes and onions, flamed with pisco. Served with french fries and perfectly cooked white rice.', 62,
  { l: true, al: ['S'], t: ['res', 'criollo', 'tradicional'], p: 1, e: 'contundente', mar: 'Don Manuel, Petit Verdot', par: [['TIN-DMP', 10], ['TIN-SPV', 9], ['TIN-GT3', 8]], img: 'lomo_saltado' });
d('ESPECIALIDADES', 'PRINCIPAL', 'Asado al vino tinto', 'Roasted beef with red wine sauce', 'Preparado con vino de nuestra bodega. Lo servimos con el mejor puré de papas amarillas y un perfecto arroz blanco.', 'Roast beef with Viña Tacama red wine sauce, served with mashed potatoes and our perfectly cooked white rice.', 50,
  { al: ['L', 'SU'], t: ['res', 'tradicional'], e: 'contundente', mar: 'Gran Tinto Tres Cepas - Malbec, Petit Verdot, Tannat', par: [['TIN-GT3', 10], ['TIN-SMA', 8]], img: 'asado_vino', min: 20 });
d('ESPECIALIDADES', 'PRINCIPAL', 'Picante de pallares con sábana de lomo fino', 'Picante de pallares with sábana de lomo', 'El tradicional pallar iqueño toma la forma de un riquísimo picante, acompañado de una jugosa sábana de lomo apanada y arroz blanco.', 'Lima beans stew served with breaded tenderloin.', 59,
  { al: ['G', 'H', 'L'], t: ['res', 'tradicional_ica', 'criollo'], p: 1, e: 'contundente', mar: 'Doña Ana, Chardonnay', par: [['BLA-DAN', 10], ['BLA-TRI', 8]], img: 'picante_pallares' });
d('ESPECIALIDADES', 'PRINCIPAL', 'Seco de res con morusa de pallares', 'Dried beef with pallares morusa', 'Tierno asado de tira en salsa de culantro, acompañado de una suave morusa de pallares y arroz blanco.', 'Tender roast strip in coriander sauce, accompanied by a soft pallares morusa and white rice.', 65,
  { t: ['res', 'tradicional_ica', 'criollo'], e: 'contundente', mar: 'Origen - Carménère, Malbec', par: [['TIN-ORI', 10], ['TIN-SCA', 9]], img: 'seco_res', min: 25 });
d('ESPECIALIDADES', 'PRINCIPAL', 'Arroz tapado del Tambo', 'Tambo stuffed rice (arroz tapado)', 'Arroz del Tambo relleno con doble porción de una sabrosísima salsa de carne preparada con lomo picadito y los mejores tomates de nuestro huerto. Con huevo frito, platanitos maduros y chimichurri de la casa.', 'The Tambo rice, stuffed with a meat sauce prepared with chopped tenderloin and our best homegrown tomatoes. Served with fried eggs and plantains.', 60,
  { al: ['H'], t: ['res', 'criollo', 'tradicional'], e: 'contundente', mar: 'Origen - Carménère, Malbec', par: [['TIN-ORI', 10], ['TIN-SCA', 9]], img: 'arroz_tapado' });
d('ESPECIALIDADES', 'PRINCIPAL', 'Chicharrón de la pesca del día', 'Crispy fish', 'Acompañado de nuestras papas fritas, salsa criolla y tártara de la casa.', 'Crunchy fried white fish, accompanied by our classic fries, tartar sauce and onion salad.', 65,
  { al: ['P', 'G', 'H'], t: ['pescado', 'frito'], e: 'contundente', mar: 'Ambrosía - Nielluccio', par: [['BLA-AMB', 10], ['BLA-TRI', 9]], img: 'chicharron_pescado' });
d('ESPECIALIDADES', 'PRINCIPAL', 'Arroz con mariscos', 'Seafood rice', 'Cremoso arroz con mixtura de mariscos en salsa de ají amarillo y vino blanco.', 'Creamy rice with a mix of fresh seafood, flambéed in white wine.', 65,
  { al: ['M', 'P', 'SU'], t: ['mariscos'], p: 1, e: 'contundente', mar: 'Blancos de Blancos "Triunfo" - Sauvignon Blanc', par: [['BLA-TRI', 10], ['BLA-DAN', 8]], img: 'arroz_mariscos' });
d('ESPECIALIDADES', 'PRINCIPAL', 'Piqueo Iqueño', 'Iqueño sampler (piqueo iqueño)', 'Excelente opción para probar las mejores especialidades iqueñas al estilo de la casa hacienda: picante de pallares, carapulcra, ají de gallina, adobo de cerdo y arroz blanco.', "A snack to try the best iqueño dishes with the hacienda's recipe.", 89,
  { al: ['G', 'L', 'N', 'H'], t: ['cerdo', 'pollo', 'tradicional_ica', 'criollo', 'compartir'], p: 1, e: 'contundente', mar: 'Origen - Petit Verdot, Malbec', par: [['TIN-ORI', 10], ['TIN-SPV', 9]], img: 'piqueo_iqueno', min: 25 });

// KIDS
d('KIDS', 'PRINCIPAL', 'Milanesa de pollo con papas fritas (Kids)', 'Chicken milanesa with french fries (Kids)', 'Menú Kids: milanesa de pollo con papas fritas.', 'Kid\'s menu: chicken milanesa with french fries.', 29, { l: true, al: ['G', 'H'], t: ['pollo', 'frito', 'kids'], e: 'ligero', img: 'ref_kids_milanesa' });
d('KIDS', 'PRINCIPAL', 'Cheese burger con papas fritas (Kids)', 'Cheese burger with french fries (Kids)', 'Menú Kids: hamburguesa con queso y papas fritas.', 'Kid\'s menu: cheese burger with french fries.', 29, { al: ['G', 'L'], t: ['res', 'frito', 'kids'], e: 'ligero', img: 'ref_kids_burger' });
d('KIDS', 'PRINCIPAL', 'Asado con puré y arroz (Kids)', 'Roasted beef with mashed potatoes and rice (Kids)', 'Menú Kids: asado en salsa marrón con puré de papas y arroz blanco.', 'Kid\'s menu: roasted beef with brown sauce served with mashed potatoes and white rice.', 29, { al: ['L'], t: ['res', 'kids'], e: 'ligero', img: 'ref_kids_asado' });
d('KIDS', 'POSTRE', 'Helado con fudge (Kids)', 'Ice cream with fudge (Kids)', 'Menú Kids: helado de vainilla con fudge.', 'Kid\'s menu: vanilla ice cream with fudge.', 7, { v: true, al: ['L'], t: ['vegetariano', 'dulce', 'kids'], e: 'dulce', min: 5 });

// DE NUESTRO HORNO DE LEÑA
d('HORNO_LENA', 'ENTRADA', 'Pan chapla', 'Chapla bread', 'Pan serrano calientito salido de nuestro horno de leña, acompañado de mayonesa alioli (ajo). Cuatro piezas.', 'Warm bread like in the Andes (four pieces).', 6, { v: true, al: ['G', 'H'], t: ['vegetariano', 'snack'], e: 'ligero', img: 'pan_chapla', min: 8 });
d('HORNO_LENA', 'PRINCIPAL', 'Pizza Americana', 'Ham and cheese pizza', 'Clásica de clásicas, crujiente pizza con jamón.', 'Crispy pizza with ham, mozzarella and pomodoro sauce.', 30, { al: ['G', 'L'], t: ['cerdo', 'queso', 'pizza'], e: 'contundente', mar: 'Gran Tinto Crianza - Malbec', par: [['TIN-GTC', 10], ['TIN-GT3', 8]], img: 'pizza_americana', min: 18 });
d('HORNO_LENA', 'PRINCIPAL', 'Pizza cuatro quesos', 'Four cheeses pizza', 'Mozzarella, parmesano, gouda y queso azul.', 'A delicious mix of mozzarella, soft paria, gouda and blue cheese.', 31, { v: true, al: ['G', 'L'], t: ['vegetariano', 'queso', 'pizza'], e: 'contundente', mar: 'Selección Especial "Triunfo" - Petit Verdot, Tannat', par: [['TIN-SPT', 10], ['TIN-SPV', 8]], img: 'pizza_cuatro_quesos', min: 18 });
d('HORNO_LENA', 'PRINCIPAL', 'Pizza Margarita', 'Margherita pizza', 'Con tomate y albahaca de nuestro huerto.', 'With pomodoro sauce and basil.', 30, { v: true, al: ['G', 'L'], t: ['vegetariano', 'queso', 'pizza'], e: 'ligero', mar: 'Origen - Carménère, Malbec', par: [['TIN-ORI', 10], ['TIN-SCA', 8]], img: 'pizza_margarita', min: 18 });
d('HORNO_LENA', 'PRINCIPAL', 'Pizza full meat', 'Full meat pizza', 'Con tocino, salame y carne molida.', 'With bacon, salami and ground beef.', 40, { al: ['G', 'L'], t: ['res', 'cerdo', 'pizza'], e: 'contundente', mar: 'Don Manuel - Petit Verdot', par: [['TIN-DMP', 10], ['TIN-SPV', 8]], img: 'pizza_full_meat', min: 18 });

// SANDWICHES Y HAMBURGUESAS
d('SANDWICHES', 'PRINCIPAL', 'Sandwich de asado al vino', 'Roast beef sandwich', 'Servido con dulces cebollitas, crujientes papas fritas amarillas y una gran salsa de vino tinto.', 'Served with caramelized onions, crunchy yellow fried potatoes and a special wine sauce.', 25, { l: true, al: ['G', 'SU'], t: ['res', 'sandwich'], e: 'contundente', mar: 'Gran Tinto Tres Cepas - Malbec, Petit Verdot, Tannat', par: [['TIN-GT3', 10], ['TIN-GTC', 8]], img: 'sandwich_asado' });
d('SANDWICHES', 'PRINCIPAL', 'Pan con chicharrón', 'Crispy pork belly sandwich', 'De panceta con chips de camote y salsita criolla.', 'Crispy and crunchy pork, served with fried sweet potatoes, and our unique salsa criolla.', 25, { l: true, al: ['G'], t: ['cerdo', 'sandwich', 'criollo'], e: 'contundente', mar: 'Selección Especial "Triunfo" - Petit Verdot', par: [['TIN-SPV', 10], ['TIN-GTC', 8]], img: 'pan_chicharron' });
d('SANDWICHES', 'PRINCIPAL', 'Sandwich de pollo, palta y mayonesa', 'Chicken & avocado sandwich', 'Pollo deshilachado, palta iqueña y cremosa mayonesa en nuestro pan brioche de la casa.', 'Light, chapla bread, filled with shredded chicken, Ica avocado and soft homemade mayonnaise.', 23, { al: ['G', 'H', 'L'], t: ['pollo', 'sandwich', 'ligero'], e: 'ligero', mar: 'Gran Blanco - Sauvignon Blanc, Chenin, Chardonnay', par: [['BLA-GBL', 10], ['BLA-TRI', 8]], img: 'sandwich_pollo' });
d('SANDWICHES', 'PRINCIPAL', 'Tambo burger', 'Tambo burger', 'Blend de lomo y cerdo, cheddar en pan brioche de la casa.', 'Classic, made with beef tenderloin, served with lettuce, tomato, onions, cheddar cheese, crunchy french fries, on a homemade brioche bread.', 32, { al: ['G', 'L', 'H'], t: ['res', 'cerdo', 'sandwich'], e: 'contundente', mar: 'Selección Especial "Triunfo" - Malbec', par: [['TIN-SMA', 10], ['TIN-ORI', 8]], img: 'tambo_burger' });
d('SANDWICHES', 'PRINCIPAL', 'Tambo royal', 'Tambo royal', 'Blend de lomo y cerdo, cheddar, tocino y huevo en pan brioche de la casa.', 'Classic, made with beef tenderloin, served with lettuce, tomato, onions, cheddar cheese, bacon, fried egg, crunchy french fries, on a homemade brioche bread.', 37, { al: ['G', 'L', 'H'], t: ['res', 'cerdo', 'sandwich'], e: 'contundente', mar: 'Origen - Malbec & Malbec', par: [['TIN-ORI', 10], ['TIN-SMA', 9]], img: 'tambo_royal' });

// POSTRES
d('POSTRES', 'POSTRE', 'Torta de chocolate', 'Chocolate cake', 'Clásica y deliciosa.', 'Classic and delicious.', 24, { v: true, al: ['G', 'H', 'L'], t: ['vegetariano', 'dulce', 'chocolate'], e: 'dulce', mar: 'Pisco Demonio de los Andes - Quebranta', par: [['PIS-QUE', 10], ['BLA-ALB', 8]], img: 'torta_chocolate', min: 8 });
d('POSTRES', 'POSTRE', 'Brownie "Cerro Prieto"', '"Cerro Prieto" brownie', 'En honor al paisaje que nos acompaña. Servido con fudge y helado de vainilla.', 'Served with fudge and vanilla ice cream.', 24, { v: true, al: ['G', 'H', 'L', 'N'], t: ['vegetariano', 'dulce', 'chocolate', 'frutos_secos'], e: 'dulce', mar: 'Pisco Demonio de los Andes - Acholado', par: [['PIS-ACH', 10], ['BLA-ALB', 8]], img: 'brownie', min: 8 });
d('POSTRES', 'POSTRE', 'Tres leches', 'Tres leches cake', 'Esponjoso bizcocho mojadito sumergido en una perfecta combinación de tres leches. Una sutil alternativa para endulzar el paladar de nuestros invitados.', 'Spongy and creamy cake moistened with three different sweet milk sauces.', 24, { v: true, al: ['G', 'H', 'L'], t: ['vegetariano', 'dulce', 'cremoso'], e: 'dulce', mar: 'Pisco Demonio de los Andes - Albilla', par: [['PIS-ALB', 10], ['BLA-ALB', 9]], img: 'tres_leches', min: 8 });
d('POSTRES', 'POSTRE', 'Crocante de manzana', 'Apple crumble', 'Calentito, servido con helado de vainilla y cubierta de caramelo.', 'Hot, served with vanilla ice cream and delicate caramel topping.', 24, { v: true, al: ['G', 'L', 'N'], t: ['vegetariano', 'dulce', 'frutal', 'caliente'], e: 'dulce', mar: 'Albilla de Ica', par: [['BLA-ALB', 10], ['PIS-ALB', 8]], img: 'crocante_manzana', min: 10 });
d('POSTRES', 'POSTRE', 'Tocino del cielo', 'Tocino del cielo', 'Hemos revelado el secreto de esta antigua receta familiar. Elaborado a base de yemas, leche y azúcar, cocido tres horas en baño María. ¡Único!', 'Made with egg yolks, milk and sugar, cooked for three hours. Unique!', 24, { v: true, al: ['H', 'L'], t: ['vegetariano', 'dulce', 'tradicional', 'cremoso'], e: 'dulce', mar: 'Pisco Demonio de los Andes - Quebranta', par: [['PIS-QUE', 10], ['BLA-ALB', 8]], img: 'tocino_cielo', min: 8 });
d('POSTRES', 'POSTRE', 'Pie de pecanas "El Lagar"', '"El Lagar" pecan pie', 'Las pecanas de Tacama son excepcionales. Se creó para ellas el pie de pecanas "El Lagar", uno de los postres preferidos de nuestros visitantes.', 'Pecans from Tacama are exceptional. This we created "El Lagar" pecan pie, one of our visitors all-time favorite.', 26, { v: true, al: ['G', 'H', 'L', 'N'], t: ['vegetariano', 'dulce', 'frutos_secos'], e: 'dulce', mar: 'Pisco Demonio de los Andes - Quebranta', par: [['PIS-QUE', 10], ['BLA-ALB', 8]], img: 'pie_pecanas', min: 8 });
d('POSTRES', 'POSTRE', 'Trilogía de postres', 'Dessert trilogy', 'Disfruta de tus postres favoritos juntos: crocante de manzana, brownie y tres leches.', 'A sampler of apple crumble, brownie and tres leches cake.', 39, { v: true, al: ['G', 'H', 'L', 'N'], t: ['vegetariano', 'dulce', 'compartir', 'variado', 'chocolate', 'cremoso', 'frutal'], e: 'dulce', mar: 'Pisco Gran Demonio de los Andes - Acholado', par: [['PIS-ACH', 10], ['BLA-ALB', 8]], img: 'trilogia_postres', min: 10 });

// GUARNICIONES
const g = (es, en, p, o = {}) => d('GUARNICIONES', 'PRINCIPAL', es, en, 'Guarnición.', 'Side dish.', p, { min: 8, ...o });
g('Salsa criolla', 'Creole sauce', 5, { v: true, l: true, t: ['vegetariano'] });
g('Arroz blanco', 'White rice', 6, { v: true, l: true, t: ['vegetariano'] });
g('Chips de camote', 'Sweet potatoes chips', 11, { v: true, l: true, t: ['vegetariano'] });
g('Papas fritas', 'French fries', 12, { v: true, l: true, t: ['vegetariano'] });
g('Palta', 'Avocado', 12, { v: true, l: true, t: ['vegetariano'] });
g('Puré de papas', 'Mashed potatoes', 12, { v: true, al: ['L'], t: ['vegetariano'] });
g('Puré de pallares verdes', 'Green lima beans purée', 14, { v: true, al: ['L'], t: ['vegetariano', 'tradicional_ica'] });
g('Picante de pallares', 'Spicy lima beans', 14, { v: true, al: ['L'], t: ['vegetariano', 'tradicional_ica'], p: 1 });
g('Carapulcra sin presa', 'Carapulcra with no meat', 14, { t: ['tradicional_ica'], p: 1 });
g('Sopa seca', 'Sopa seca', 15, { al: ['G'], t: ['tradicional_ica'] });

// COCTELERÍA
const c = (es, desc, p, extra = {}) => d('COCTELERIA', 'BEBIDA', es, es, desc, desc, p, { al: ['SU'].filter(() => extra.su), t: ['coctel', 'pisco'], e: 'ligero', ...extra });
c('Chilcano clásico', 'Pisco Demonio de los Andes, zumo de limón, bitter & Ginger Ale.', 24);
c('Chilcano maracuyá', 'Pisco Demonio de los Andes, zumo de maracuyá, bitter & Ginger Ale.', 26);
c('Tambo Sour', 'Pisco Demonio de los Andes, zumo de limón, jarabe simple, clara de huevo & bitter.', 27, { al: ['H'] });
c('Maracuyá Sour', 'Pisco Demonio de los Andes, zumo de maracuyá, jarabe simple, clara de huevo & bitter.', 28, { al: ['H'] });
c('Capitán', 'Pisco Demonio de los Andes, vermouth Rosso & bitter.', 29, { su: true });
c('Centenario', "Albilla d'Ica, Pisco Demonio de los Andes, zumo de piña & maracuyá y jarabe de goma.", 30, { su: true });
c('Amore del Tambo', 'Amore de Ica, Pisco Demonio de los Andes, jarabe de fresa, zumo de limón & bitter.', 30, { su: true });
c('Rosado de vendimia', 'Vino rosado, Pisco Demonio de los Andes Albilla, zumo de limón, jarabe de fresa, aperol & ginger ale.', 30, { su: true });
c('Tinto de vendimia', 'Vino tinto, Pisco Demonio de los Andes Quebranta, cordial de naranja, zumo de limón, espumoso.', 32, { su: true });
c('Pisco Tonic clásico', 'Pisco Demonio de los Andes, pieles cítricas, romero & agua tónica.', 32);
c('Demonio Tonic', 'Pisco Demonio de los Andes, flor de Jamaica, agua tónica.', 33);
c('Tambo Punch', 'Pisco Demonio de los Andes, zumo de piña ahumada, zumo de limón & miel picaronera.', 33);
c('Negroni "Atardecer" (Premium)', 'Pisco Premium Leyenda, vermouth, campari y gotas de bitter con ahumado en palo santo.', 40, { su: true });

// BEBIDAS
const b = (es, en, p, t = []) => d('BEBIDAS', 'BEBIDA', es, en, es, en, p, { v: true, t: ['bebida', 'sin_alcohol', ...t], min: 2 });
b('Gaseosa (600 ml)', 'Soda (600 ml)', 8);
b('Agua Premium Munay (botella ecológica retornable)', 'Munay Premium water (returnable eco bottle)', 10);
b('Agua Premium Munay (con botella)', 'Munay Premium water (with bottle)', 40);
b('Chicha morada (vaso)', 'Purple corn drink (glass)', 6.5, ['tradicional']);
b('Chicha morada (1/2 L)', 'Purple corn drink (1/2 L)', 13, ['tradicional']);
b('Chicha morada (1 L)', 'Purple corn drink (1 L)', 25, ['tradicional']);
b('Maracuyá (vaso)', 'Passion fruit juice (glass)', 6.5);
b('Maracuyá (1/2 L)', 'Passion fruit juice (1/2 L)', 13);
b('Maracuyá (1 L)', 'Passion fruit juice (1 L)', 26);
b('Limonada (vaso)', 'Lemonade (glass)', 6.5);
b('Limonada (1/2 L)', 'Lemonade (1/2 L)', 13);
b('Limonada (1 L)', 'Lemonade (1 L)', 26);

// CAFÉ (café 100% peruano de La Merced, Chanchamayo, Junín; descafeinado disponible)
const cf = (es, en, p) => d('CAFE', 'BEBIDA', es, en, 'Café 100% peruano de La Merced, Chanchamayo (Junín). Disponible descafeinado.', '100% Peruvian coffee from La Merced, Chanchamayo (Junín). Decaf available.', p, { v: true, t: ['cafe', 'sin_alcohol'], min: 4 });
cf('Americano', 'Americano', 9);
cf('Expresso', 'Espresso', 8);
cf('Expresso doble', 'Double espresso', 15);
cf('Cortado', 'Cortado', 9.5);
cf('Capuccino', 'Cappuccino', 14);

// INFUSIONES
const inf = (es, en, p) => d('INFUSIONES', 'BEBIDA', es, en, 'Hierbas aromáticas de nuestro biohuerto Tacama.', 'Aromatic herbs from our Tacama organic garden.', p, { v: true, l: true, t: ['infusion', 'sin_alcohol'], min: 4 });
inf('Manzanilla', 'Chamomile', 8);
inf('Té, canela y clavo', 'Tea, cinnamon and clove', 8);
inf('Infusión natural (anís, hierba luisa, menta o muña)', 'Natural infusion (anise, lemongrass, mint or muña)', 8);

// ── Rol en la comida y momento del día ────────────────────────
// rol: ENTRADA | FONDO | DESAYUNO (plato principal de desayuno) | POSTRE | COMPLEMENTO | KIDS | BEBIDA
// momentos: DESAYUNO y/o ALMUERZO. La carta del PDF no separa desayuno de almuerzo:
// los sandwiches se tratan como desayuno (criterio a validar con el restaurante).
const AMBOS = ['DESAYUNO', 'ALMUERZO'];
const DIR_FOTOS = require('path').join(__dirname, '../../apps/comensal-pwa/public/platos');
// Prioridad: foto del PDF > foto real <CODIGO>.jpg > ilustración ilu_<CODIGO>.jpg (ver ilustraciones.js)
for (const p of platos) {
  if (p.imagen) continue;
  const ex = (n) => fs.existsSync(require('path').join(DIR_FOTOS, n + '.jpg'));
  if (ex(p.codigo)) p.imagen = p.codigo;
  else if (ex('ilu_' + p.codigo)) p.imagen = 'ilu_' + p.codigo;
}
for (const p of platos) {
  if (['PARA_PICAR', 'ENTRADAS'].includes(p.seccion)) p.rol = 'ENTRADA';
  else if (p.seccion === 'ESPECIALIDADES') p.rol = 'FONDO';
  else if (p.seccion === 'HORNO_LENA') p.rol = p.nombreEs === 'Pan chapla' ? 'COMPLEMENTO' : 'FONDO';
  else if (p.seccion === 'SANDWICHES') p.rol = /burger|royal/i.test(p.nombreEs) ? 'FONDO' : 'DESAYUNO';
  else if (p.seccion === 'POSTRES') p.rol = 'POSTRE';
  else if (p.seccion === 'KIDS') p.rol = p.categoria === 'POSTRE' ? 'KIDS_POSTRE' : 'KIDS';
  else if (p.seccion === 'GUARNICIONES') p.rol = 'COMPLEMENTO';
  else p.rol = 'BEBIDA';

  p.momentos = ['ALMUERZO'];
  if (p.rol === 'DESAYUNO') p.momentos = ['DESAYUNO'];
  // Tamalitos y humita son de desayuno: no se consideran como entrada de almuerzo.
  if (['Tamalito criollo', 'Tamalito verde', 'Humita de queso'].includes(p.nombreEs)) p.momentos = ['DESAYUNO'];
  if (['Tamalito criollo', 'Tamalito verde', 'Humita de queso'].includes(p.nombreEs)) p.rol = 'DESAYUNO';
  if (p.nombreEs === 'Pan chapla') p.momentos = AMBOS;
  // Marcas (v) y (L): solo las que figuran en la carta impresa. Platos y guarniciones sin marca
  // en el PDF no se declaran vegetarianos ni libres de lactosa, aunque lo parezcan.
  const SIN_MARCA = ['Tequeños (6 unid.) de queso con salsa guacamole', 'Humita de queso', 'Torta de chocolate', 'Tocino del cielo', 'Pie de pecanas "El Lagar"', 'Trilogía de postres', 'Helado con fudge (Kids)'];
  if (p.seccion === 'GUARNICIONES' || SIN_MARCA.includes(p.nombreEs)) {
    p.esVegetariano = false;
    p.libreLactosa = false;
    p.tags = p.tags.filter((x) => x !== 'vegetariano');
  }
  // Piqueos: pizzas del horno de leña y tablas/piqueos grandes se piden para compartir en la mesa,
  // no como plato de fondo individual.
  if (p.seccion === 'HORNO_LENA' && p.rol === 'FONDO') { p.rol = 'PIQUEO'; p.tags.push('compartir'); }
  if (p.tags.includes('compartir') && ['ENTRADA', 'FONDO'].includes(p.rol)) p.rol = 'PIQUEO';
  if (['BEBIDAS', 'CAFE', 'INFUSIONES'].includes(p.seccion)) p.momentos = AMBOS;
}

// Bebidas que se suelen tomar en el desayuno, con el estilo de comida con el que se recomiendan.
// Capuccino y Cortado llevan leche (alérgeno lácteos).
const BEBIDA_DESAYUNO = {
  'Capuccino': 'contundente',
  'Americano': 'contundente',
  'Manzanilla': 'ligero',
  'Té, canela y clavo': 'ligero',
  'Infusión natural (anís, hierba luisa, menta o muña)': 'ligero',
  'Maracuyá (vaso)': 'dulce',
  'Chicha morada (vaso)': 'dulce',
};
for (const p of platos) {
  if (BEBIDA_DESAYUNO[p.nombreEs]) {
    p.estilo = BEBIDA_DESAYUNO[p.nombreEs];
    p.tags.push('desayuno_bebida');
  }
  if (['Capuccino', 'Cortado'].includes(p.nombreEs) && !p.alergenos.includes('LACTEOS')) p.alergenos.push('LACTEOS');
}

// ── Salida ────────────────────────────────────────────────────
const dir = __dirname;
fs.writeFileSync(path.join(dir, 'carta-tacama.json'), JSON.stringify(platos, null, 2));
fs.writeFileSync(path.join(dir, 'etiquetas-tacama.json'), JSON.stringify(
  etiquetas.map(([codigo, nombre, tipo, cepa, descripcion, precio, rango, stock, umbral]) => ({ codigo, nombre, tipo, cepa, descripcion, precio, rango, stock, umbral })), null, 2));
console.log(`${platos.length} platos, ${etiquetas.length} etiquetas`);
const sinPar = platos.flatMap((p) => p.maridaje.map((m) => m.etiqueta)).filter((c) => !E[c]);
if (sinPar.length) console.log('Etiquetas inexistentes:', sinPar);
