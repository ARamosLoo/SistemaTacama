/**
 * build-nutricion.js — Calcula la información nutricional referencial de cada plato de la carta.
 *
 *   node infra/data/build-nutricion.js      genera apps/comensal-pwa/src/lib/nutricion.ts
 *
 * Método: cada plato se descompone en ingredientes con un peso aproximado de porción; la composición por
 * 100 g de cada ingrediente toma como referencia las Tablas Peruanas de Composición de Alimentos
 * (CENAN / Instituto Nacional de Salud, Minsa) y, cuando la tabla no trae el alimento en la forma servida
 * (cocido, frito), valores estándar de composición. La energía se calcula con los factores de Atwater
 * (4 kcal/g proteína y carbohidrato, 9 kcal/g grasa, 7 kcal/g alcohol) y 1 kcal = 4,184 kJ, igual que las TPCA.
 * Son ESTIMACIONES: la receta real del restaurante puede variar. Validar con la cocina o un nutricionista.
 */
const fs = require('fs');
const path = require('path');

// Composición por 100 g (o 100 ml en bebidas): [proteína g, grasa g, carbohidrato g, fibra g, alcohol g]
const I = {
  arroz: [2.4, 2.0, 25.2, 0.3, 0],                 // TPCA A2 arroz pulido cocido
  papaCocida: [2.0, 0.1, 20.0, 1.8, 0],
  papaAmarilla: [1.9, 0.1, 21.0, 1.5, 0],
  papaFrita: [3.5, 15, 36, 3.0, 0],
  puré: [2.0, 4.0, 16.0, 1.5, 0],
  camoteChips: [1.8, 28, 58, 5.0, 0],
  yucaFrita: [1.5, 14, 40, 2.5, 0],
  choclo: [3.2, 1.2, 21, 2.4, 0],
  pallar: [7.0, 0.5, 20, 5.5, 0],
  pollo: [31, 3.6, 0, 0, 0],                       // pechuga cocida
  musloPollo: [26, 9, 0, 0, 0],
  pollaApanado: [20, 14, 16, 0.8, 0],              // milanesa de pollo
  lomo: [27, 10, 0, 0, 0],
  lomoApanado: [22, 15, 15, 0.8, 0],
  asado: [26, 12, 0, 0, 0],
  molida: [20, 15, 0, 0, 0],
  cerdo: [25, 14, 0, 0, 0],
  panceta: [15, 45, 0, 0, 0],                      // chicharrón de panceta
  costilla: [22, 22, 0, 0, 0],
  tocino: [37, 42, 1.4, 0, 0],
  jamon: [18, 5, 1.5, 0, 0],
  salame: [22, 34, 2, 0, 0],
  pescado: [21, 3, 0, 0, 0],                       // TPCA pejerrey/perico ~105-110 kcal
  pescadoFrito: [18, 12, 10, 0.5, 0],
  langostino: [18, 1.5, 1.5, 0, 0],                // TPCA camarones 88 kcal
  mariscos: [15, 2, 3, 0, 0],                      // TPCA conchas / choros ~92 kcal
  quesoFresco: [18, 20, 3, 0, 0],
  quesoPeruano: [20, 24, 2, 0, 0],
  mozzarella: [22, 22, 2.2, 0, 0],
  parmesano: [36, 29, 4, 0, 0],
  gouda: [25, 27, 2, 0, 0],
  azul: [21, 29, 2.3, 0, 0],
  cheddar: [25, 33, 1.3, 0, 0],
  huevo: [12.6, 10, 1, 0, 0],
  yemas: [15.6, 27, 3.6, 0, 0],
  clara: [10.9, 0.2, 0.7, 0, 0],                   // TPCA J2 (kcal 51)
  leche: [3.2, 3.3, 4.8, 0, 0],
  evaporada: [6.8, 7.6, 10, 0, 0],
  condensada: [7.5, 8.5, 55, 0, 0],
  crema: [2.1, 35, 2.8, 0, 0],
  mantequilla: [0.9, 81, 0.1, 0, 0],               // TPCA D19
  aceite: [0, 100, 0, 0, 0],                       // TPCA D5
  mayonesa: [1, 75, 0.6, 0, 0],
  palta: [2.0, 15, 8.5, 6.7, 0],
  tomate: [0.9, 0.2, 3.9, 1.2, 0],
  cebolla: [1.1, 0.1, 9.3, 1.7, 0],
  lechuga: [1.4, 0.2, 2.9, 1.3, 0],
  zanahoria: [0.8, 0.2, 8, 3, 0],
  verduras: [2.0, 0.3, 9, 3, 0],                   // mix de verduras cocidas
  arveja: [5, 0.4, 14, 5, 0],
  esparrago: [2.2, 0.1, 3.9, 2, 0],
  aji: [1.9, 1, 9.2, 2, 0],                        // TPCA B4 ají amarillo molido
  limon: [0.4, 0.1, 6.9, 0.3, 0],
  aceituna: [0.8, 11, 6, 3, 0],
  platano: [1.3, 0.4, 31, 2.3, 0],                 // plátano maduro frito (dulce)
  pan: [9, 3, 56, 2.5, 0],
  brioche: [8.5, 12, 50, 2, 0],
  harina: [10, 1, 76, 2.7, 0],
  fideo: [5.8, 0.9, 30, 1.8, 0],
  masaHojaldre: [6, 26, 45, 2, 0],
  azucar: [0, 0, 100, 0, 0],                       // TPCA K1
  miel: [0.3, 0, 82, 0, 0],                        // TPCA K4
  chocolate: [5, 30, 60, 7, 0],
  fudge: [4, 15, 65, 2, 0],
  helado: [3.5, 11, 24, 0.5, 0],
  pecana: [9.2, 72, 14, 9.6, 0],
  pasas: [3, 0.5, 79, 4, 0],
  manzana: [0.3, 0.2, 14, 2.4, 0],
  salsaHuancaina: [4, 17, 6, 0.8, 0],
  guacamole: [1.6, 11, 6, 3, 0],
  salsaCriolla: [1, 4, 6, 1.5, 0],
  salsaBBQ: [1, 0.5, 35, 0.5, 0],
  salsaAji: [6, 14, 10, 1.2, 0],                   // salsa de ají de gallina (pan, leche, parmesano, nuez)
  salsaVino: [1.5, 3, 7, 0.5, 0],
  pesto: [5, 45, 5, 2, 0],
  tartara: [1, 60, 5, 0.3, 0],
  alioli: [1, 70, 2, 0, 0],
  aderezoCesar: [3, 45, 3, 0, 0],
  vinagreta: [0.3, 40, 4, 0, 0],
  tequenoQueso: [6.7, 22, 22.1, 1.0, 0],           // TPCA SE140 tequeños de queso
  tequenoAji: [9, 16, 24, 1.0, 0],
  tequenoLomo: [10, 14, 25, 1.2, 0],
  tequenoAsado: [11, 13, 24, 1.0, 0],
  empanada: [9, 20, 32, 1.8, 0],
  tamalCerdo: [6, 8, 28, 1.5, 0],
  tamalPollo: [7, 6, 27, 1.5, 0],                  // TPCA SE135 tamal de pollo (~150-190 kcal/100 g)
  humita: [5, 8, 28, 2, 0],
  carapulcra: [9, 10, 22, 3, 0],
  sopaSeca: [5, 6, 28, 1.5, 0],
  sopaSecaPicante: [8, 11, 22, 4, 0],
  bizcocho: [6, 10, 55, 1, 0],
  tresLeches: [4, 8, 30, 0.2, 0],
  tocinoCielo: [6, 14, 52, 0, 0],
  tortaChocolate: [5, 18, 55, 3, 0],
  brownie: [5, 22, 55, 3, 0],
  crocanteManzana: [3, 12, 50, 3, 0],
  piePecana: [5, 30, 50, 3, 0],
  // Bebidas (por 100 ml)
  pisco: [0, 0, 0, 0, 31.6],                       // 40 % vol
  vinoTinto: [0.1, 0, 2.6, 0, 9.9],
  vinoRosado: [0.1, 0, 3.0, 0, 9.5],
  espumoso: [0.2, 0, 3.0, 0, 9.5],
  vermouth: [0, 0, 15, 0, 12],
  campari: [0, 0, 25, 0, 19],
  aperol: [0, 0, 22, 0, 8.6],
  gingerAle: [0, 0, 9, 0, 0],
  tonica: [0, 0, 8.5, 0, 0],
  jarabe: [0, 0, 67, 0, 0],
  jugoMaracuya: [0.7, 0.2, 11, 0.5, 0],
  jugoPina: [0.4, 0.1, 13, 0.2, 0],
  jugoLimon: [0.4, 0.1, 6.9, 0.3, 0],
  chicha: [0.1, 0.1, 5.5, 0, 0],                   // TPCA H5 chicha morada con azúcar (24 kcal)
  limonada: [0.1, 0, 6.5, 0, 0],
  maracuyaRefresco: [0.3, 0, 8, 0, 0],
  gaseosa: [0, 0, 10.6, 0, 0],
  cafe: [0.1, 0.2, 0, 0, 0],
  lecheCafe: [3.2, 3.3, 4.8, 0, 0],
  agua: [0, 0, 0, 0, 0],
  infusion: [0, 0, 0, 0, 0],
  azucarTe: [0, 0, 100, 0, 0],
};

// [código, porción descriptiva, personas entre las que se comparte, receta [ingrediente, gramos]]
const R = [
  ['TAC-001', '60 g', 1, [['pecana', 0]]],
];
// Pecanas: ingrediente simple
I.pecanaSal = [9.2, 72, 14, 9.6, 0];
R.length = 0;
const add = (cod, porcion, personas, receta) => R.push([cod, porcion, personas, receta]);

add('TAC-001', '60 g', 1, [['pecanaSal', 55], ['aceite', 3]]);
add('TAC-002', '6 unidades', 1, [['tequenoQueso', 200], ['guacamole', 45]]);
add('TAC-003', '6 unidades', 1, [['tequenoAji', 200], ['guacamole', 45]]);
add('TAC-004', '6 unidades', 1, [['tequenoLomo', 200], ['salsaHuancaina', 45]]);
add('TAC-005', '6 unidades', 1, [['tequenoAsado', 200], ['guacamole', 45]]);
add('TAC-006', '9 unidades', 3, [['tequenoQueso', 100], ['tequenoAji', 100], ['tequenoLomo', 100], ['guacamole', 40], ['salsaHuancaina', 40]]);
add('TAC-007', 'tabla para compartir', 3, [['quesoPeruano', 150], ['pecanaSal', 25], ['pasas', 20], ['pan', 60], ['alioli', 20]]);
add('TAC-008', '1 plato', 1, [['yucaFrita', 200], ['salsaHuancaina', 60]]);
add('TAC-009', '1 empanada con ensalada', 1, [['empanada', 180], ['tomate', 40], ['lechuga', 30], ['aceite', 4]]);
add('TAC-010', 'para 3 personas', 3, [['yucaFrita', 150], ['panceta', 120], ['asado', 140], ['choclo', 120], ['tamalCerdo', 150], ['salsaHuancaina', 60], ['salsaCriolla', 60], ['aceite', 15]]);
add('TAC-011', '1 plato', 1, [['papaAmarilla', 190], ['aji', 15], ['aceite', 10], ['limon', 10], ['pollo', 65], ['mayonesa', 25], ['palta', 35], ['huevo', 20]]);
add('TAC-012', '1 plato', 1, [['papaAmarilla', 220], ['salsaHuancaina', 110], ['huevo', 45], ['aceituna', 10], ['lechuga', 15]]);
add('TAC-013', '1 plato', 1, [['palta', 130], ['verduras', 90], ['mayonesa', 30]]);
add('TAC-014', '1 plato', 1, [['palta', 100], ['langostino', 120], ['verduras', 80], ['mayonesa', 30], ['aceite', 8]]);
add('TAC-015', '1 plato', 1, [['pallar', 150], ['tomate', 60], ['cebolla', 30], ['aceite', 10], ['limon', 10]]);
add('TAC-016', '1 plato', 1, [['lechuga', 120], ['pan', 25], ['aceite', 8], ['parmesano', 15], ['pescado', 5], ['huevo', 30], ['aderezoCesar', 30]]);
add('TAC-017', '1 plato', 1, [['lechuga', 120], ['pan', 25], ['aceite', 8], ['parmesano', 15], ['pescado', 5], ['huevo', 30], ['aderezoCesar', 30], ['pollo', 130]]);
add('TAC-018', '1 plato', 1, [['lechuga', 80], ['tomate', 50], ['choclo', 40], ['zanahoria', 30], ['esparrago', 30], ['cebolla', 20], ['palta', 60], ['vinagreta', 25]]);
add('TAC-019', '1 tamal con salsa criolla', 1, [['tamalCerdo', 220], ['salsaCriolla', 50]]);
add('TAC-020', '1 tamal con salsa criolla', 1, [['tamalPollo', 220], ['salsaCriolla', 50]]);
add('TAC-021', '1 humita', 1, [['humita', 160]]);
add('TAC-022', '1 porción', 1, [['choclo', 220], ['aceite', 12], ['azucar', 8], ['leche', 30], ['huevo', 50], ['molida', 90], ['cebolla', 40], ['pasas', 10], ['aceituna', 10], ['quesoFresco', 20]]);
add('TAC-023', 'media tira', 1, [['costilla', 240], ['salsaBBQ', 60]]);
add('TAC-024', '1 plato con arroz y papa', 1, [['pollo', 130], ['salsaAji', 160], ['arroz', 150], ['papaCocida', 100], ['huevo', 25], ['aceituna', 8]]);
add('TAC-025', '1 plato', 1, [['arroz', 250], ['musloPollo', 150], ['arveja', 30], ['zanahoria', 30], ['aceite', 12], ['salsaCriolla', 60]]);
add('TAC-026', 'pollo con 2 guarniciones', 1, [['pollo', 200], ['aceite', 8], ['papaFrita', 120], ['arroz', 100]]);
add('TAC-027', 'milanesa con 2 guarniciones', 1, [['pollaApanado', 200], ['papaFrita', 120], ['arroz', 100]]);
add('TAC-028', '1 plato', 1, [['panceta', 190], ['camoteChips', 70], ['salsaCriolla', 70]]);
add('TAC-029', '1 plato', 1, [['cerdo', 170], ['aceite', 12], ['aji', 20], ['puré', 130], ['pallar', 80], ['arroz', 150]]);
add('TAC-030', '1 plato', 1, [['carapulcra', 200], ['cerdo', 70], ['sopaSeca', 140]]);
add('TAC-031', '1 plato', 1, [['fideo', 250], ['salsaHuancaina', 110], ['lomo', 150], ['salsaVino', 60]]);
add('TAC-032', '1 plato', 1, [['lomoApanado', 220], ['fideo', 230], ['pesto', 45]]);
add('TAC-033', '1 plato', 1, [['lomo', 150], ['cebolla', 60], ['tomate', 50], ['aceite', 12], ['papaFrita', 120], ['arroz', 140]]);
add('TAC-034', '1 plato', 1, [['asado', 190], ['salsaVino', 100], ['puré', 160], ['arroz', 150]]);
add('TAC-035', '1 plato', 1, [['pallar', 200], ['aceite', 14], ['aji', 20], ['lomoApanado', 200], ['arroz', 150]]);
add('TAC-036', '1 plato', 1, [['asado', 200], ['salsaVino', 100], ['pallar', 130], ['aceite', 10], ['arroz', 150]]);
add('TAC-037', '1 plato', 1, [['arroz', 260], ['lomo', 150], ['tomate', 60], ['aceite', 14], ['huevo', 55], ['platano', 70], ['aceite', 8]]);
add('TAC-038', '1 plato', 1, [['pescadoFrito', 200], ['papaFrita', 140], ['salsaCriolla', 60], ['tartara', 30]]);
add('TAC-039', '1 plato', 1, [['arroz', 270], ['mariscos', 150], ['salsaAji', 70], ['aceite', 10]]);
add('TAC-040', 'para 2 personas', 2, [['pallar', 130], ['carapulcra', 130], ['pollo', 90], ['salsaAji', 100], ['cerdo', 90], ['aceite', 10], ['arroz', 220]]);
add('TAC-041', 'menú kids', 1, [['pollaApanado', 130], ['papaFrita', 120]]);
add('TAC-042', 'menú kids', 1, [['molida', 80], ['pan', 60], ['cheddar', 20], ['papaFrita', 120]]);
add('TAC-043', 'menú kids', 1, [['asado', 90], ['salsaVino', 60], ['puré', 100], ['arroz', 100]]);
add('TAC-044', '1 copa', 1, [['helado', 120], ['fudge', 30]]);
add('TAC-045', '4 piezas', 1, [['pan', 120], ['alioli', 30]]);
add('TAC-046', 'pizza para compartir', 2, [['pan', 220], ['tomate', 60], ['mozzarella', 140], ['jamon', 80], ['aceite', 8]]);
add('TAC-047', 'pizza para compartir', 2, [['pan', 220], ['tomate', 40], ['mozzarella', 90], ['parmesano', 30], ['gouda', 50], ['azul', 40]]);
add('TAC-048', 'pizza para compartir', 2, [['pan', 220], ['tomate', 80], ['mozzarella', 140], ['aceite', 10]]);
add('TAC-049', 'pizza para compartir', 2, [['pan', 220], ['tomate', 50], ['mozzarella', 150], ['tocino', 40], ['salame', 50], ['molida', 70]]);
add('TAC-050', '1 sándwich con papas', 1, [['pan', 110], ['asado', 120], ['salsaVino', 60], ['cebolla', 40], ['papaFrita', 110]]);
add('TAC-051', '1 sándwich con chips', 1, [['pan', 110], ['panceta', 140], ['camoteChips', 60], ['salsaCriolla', 50]]);
add('TAC-052', '1 sándwich', 1, [['brioche', 100], ['pollo', 110], ['palta', 60], ['mayonesa', 25]]);
add('TAC-053', '1 hamburguesa', 1, [['brioche', 100], ['lomo', 70], ['cerdo', 70], ['cheddar', 25], ['aceite', 5]]);
add('TAC-054', '1 hamburguesa', 1, [['brioche', 100], ['lomo', 80], ['cerdo', 80], ['cheddar', 25], ['tocino', 20], ['huevo', 55], ['aceite', 6]]);
add('TAC-055', '1 porción', 1, [['tortaChocolate', 130]]);
add('TAC-056', '1 porción con helado', 1, [['brownie', 110], ['fudge', 30], ['helado', 70]]);
add('TAC-057', '1 porción', 1, [['bizcocho', 70], ['tresLeches', 130]]);
add('TAC-058', '1 porción con helado', 1, [['crocanteManzana', 150], ['helado', 70], ['azucar', 12]]);
add('TAC-059', '1 porción', 1, [['tocinoCielo', 110]]);
add('TAC-060', '1 porción', 1, [['piePecana', 130]]);
add('TAC-061', 'trilogía', 1, [['crocanteManzana', 90], ['brownie', 70], ['tresLeches', 90], ['bizcocho', 40], ['helado', 40]]);
add('TAC-062', '1 porción', 1, [['salsaCriolla', 80]]);
add('TAC-063', '1 porción', 1, [['arroz', 200]]);
add('TAC-064', '1 porción', 1, [['camoteChips', 100]]);
add('TAC-065', '1 porción', 1, [['papaFrita', 180]]);
add('TAC-066', '1 porción', 1, [['palta', 100]]);
add('TAC-067', '1 porción', 1, [['puré', 200]]);
add('TAC-068', '1 porción', 1, [['pallar', 160], ['aceite', 6]]);
add('TAC-069', '1 porción', 1, [['pallar', 200], ['aceite', 12], ['aji', 15]]);
add('TAC-070', '1 porción', 1, [['carapulcra', 200]]);
add('TAC-071', '1 porción', 1, [['sopaSeca', 200]]);
// Bebidas (ml)
add('TAC-072', '1 vaso (250 ml)', 1, [['pisco', 50], ['jugoLimon', 25], ['gingerAle', 140]]);
add('TAC-073', '1 vaso (250 ml)', 1, [['pisco', 50], ['jugoMaracuya', 30], ['gingerAle', 140]]);
add('TAC-074', '1 copa (150 ml)', 1, [['pisco', 50], ['jugoLimon', 25], ['jarabe', 20], ['clara', 20]]);
add('TAC-075', '1 copa (150 ml)', 1, [['pisco', 50], ['jugoMaracuya', 30], ['jarabe', 20], ['clara', 20]]);
add('TAC-076', '1 copa (100 ml)', 1, [['pisco', 50], ['vermouth', 40]]);
add('TAC-077', '1 copa (180 ml)', 1, [['vinoRosado', 60], ['pisco', 40], ['jugoPina', 40], ['jugoMaracuya', 20], ['jarabe', 20]]);
add('TAC-078', '1 copa (180 ml)', 1, [['vinoRosado', 60], ['pisco', 40], ['jarabe', 40], ['jugoLimon', 20]]);
add('TAC-079', '1 copa (220 ml)', 1, [['vinoRosado', 80], ['pisco', 30], ['jugoLimon', 20], ['jarabe', 20], ['aperol', 20], ['gingerAle', 50]]);
add('TAC-080', '1 copa (220 ml)', 1, [['vinoTinto', 80], ['pisco', 30], ['jarabe', 20], ['jugoLimon', 20], ['espumoso', 60]]);
add('TAC-081', '1 vaso (250 ml)', 1, [['pisco', 50], ['tonica', 200]]);
add('TAC-082', '1 vaso (250 ml)', 1, [['pisco', 50], ['tonica', 200]]);
add('TAC-083', '1 vaso (200 ml)', 1, [['pisco', 50], ['jugoPina', 80], ['jugoLimon', 20], ['miel', 20]]);
add('TAC-084', '1 copa (100 ml)', 1, [['pisco', 30], ['vermouth', 30], ['campari', 30]]);
add('TAC-085', '600 ml', 1, [['gaseosa', 600]]);
add('TAC-086', '1 botella', 1, [['agua', 500]]);
add('TAC-087', '1 botella', 1, [['agua', 500]]);
add('TAC-088', '1 vaso (300 ml)', 1, [['chicha', 300]]);
add('TAC-089', '500 ml', 1, [['chicha', 500]]);
add('TAC-090', '1 litro', 1, [['chicha', 1000]]);
add('TAC-091', '1 vaso (300 ml)', 1, [['maracuyaRefresco', 300]]);
add('TAC-092', '500 ml', 1, [['maracuyaRefresco', 500]]);
add('TAC-093', '1 litro', 1, [['maracuyaRefresco', 1000]]);
add('TAC-094', '1 vaso (300 ml)', 1, [['limonada', 300]]);
add('TAC-095', '500 ml', 1, [['limonada', 500]]);
add('TAC-096', '1 litro', 1, [['limonada', 1000]]);
add('TAC-097', '1 taza (200 ml)', 1, [['cafe', 200]]);
add('TAC-098', '1 taza (30 ml)', 1, [['cafe', 30]]);
add('TAC-099', '1 taza (60 ml)', 1, [['cafe', 60]]);
add('TAC-100', '1 taza (100 ml)', 1, [['cafe', 50], ['lecheCafe', 50]]);
add('TAC-101', '1 taza (200 ml)', 1, [['cafe', 60], ['lecheCafe', 140]]);
add('TAC-102', '1 taza (200 ml)', 1, [['infusion', 200]]);
add('TAC-103', '1 taza (200 ml)', 1, [['infusion', 200]]);
add('TAC-104', '1 taza (200 ml)', 1, [['infusion', 200]]);

const salida = {};
for (const [cod, porcion, personas, receta] of R) {
  let p = 0, g = 0, c = 0, f = 0, a = 0, gramos = 0;
  for (const [ing, cant] of receta) {
    const x = I[ing];
    if (!x) throw new Error('ingrediente desconocido: ' + ing + ' en ' + cod);
    p += (x[0] * cant) / 100; g += (x[1] * cant) / 100; c += (x[2] * cant) / 100; f += (x[3] * cant) / 100; a += (x[4] * cant) / 100;
    gramos += cant;
  }
  const kcalExacta = 4 * p + 9 * g + 4 * c + 7 * a;
  const kcal = Math.round(kcalExacta / 5) * 5; // se redondea a 5 kcal: no hay precisión de laboratorio
  salida[cod] = {
    porcion, personas, gramos: Math.round(gramos / 5) * 5,
    kcal, kj: Math.round(kcal * 4.184),
    proteinas: Math.round(p), grasas: Math.round(g), carbohidratos: Math.round(c), fibra: Math.round(f),
    ...(a > 0.5 ? { alcohol: Math.round(a) } : {}),
  };
}


// ── Ingredientes que el comensal puede pedir que se quiten (entradas, principales, desayunos, menú kids y piqueos) ──
// [opción, [[ingrediente de la receta, gramos que se retiran], ...]]. El ahorro de energía y macronutrientes
// sale de la misma receta usada arriba. Las etiquetas de cada opción están en apps/comensal-pwa/src/lib/ingredientes.ts.
const g = (id, ...pares) => [id, pares];
const OPC = {
  'TAC-002': [g('guacamole', ['guacamole', 45])],
  'TAC-003': [g('guacamole', ['guacamole', 45])],
  'TAC-004': [g('huancaina', ['salsaHuancaina', 45])],
  'TAC-005': [g('guacamole', ['guacamole', 45])],
  'TAC-006': [g('guacamole', ['guacamole', 40]), g('huancaina', ['salsaHuancaina', 40])],
  'TAC-007': [g('pasas', ['pasas', 20]), g('pecanas', ['pecanaSal', 25]), g('alioli', ['alioli', 20]), g('pan', ['pan', 60])],
  'TAC-008': [g('huancaina', ['salsaHuancaina', 60])],
  'TAC-009': [g('ensalada', ['tomate', 40], ['lechuga', 30], ['aceite', 4])],
  'TAC-010': [g('salsaCriolla', ['salsaCriolla', 60]), g('huancaina', ['salsaHuancaina', 60]), g('choclo', ['choclo', 120])],
  'TAC-011': [g('palta', ['palta', 35]), g('mayonesa', ['mayonesa', 25]), g('huevo', ['huevo', 20])],
  'TAC-012': [g('huevo', ['huevo', 45]), g('aceitunas', ['aceituna', 10]), g('lechuga', ['lechuga', 15])],
  'TAC-013': [g('mayonesa', ['mayonesa', 30]), g('verduras', ['verduras', 90])],
  'TAC-014': [g('mayonesa', ['mayonesa', 30]), g('verduras', ['verduras', 80])],
  'TAC-015': [g('cebolla', ['cebolla', 30]), g('tomate', ['tomate', 60])],
  'TAC-016': [g('crutones', ['pan', 25], ['aceite', 8]), g('anchoas', ['pescado', 5]), g('parmesano', ['parmesano', 15]), g('huevo', ['huevo', 30])],
  'TAC-017': [g('crutones', ['pan', 25], ['aceite', 8]), g('anchoas', ['pescado', 5]), g('parmesano', ['parmesano', 15]), g('huevo', ['huevo', 30])],
  'TAC-018': [g('palta', ['palta', 60]), g('cebolla', ['cebolla', 20]), g('esparragos', ['esparrago', 30]), g('choclo', ['choclo', 40]), g('tomate', ['tomate', 50]), g('zanahoria', ['zanahoria', 30])],
  'TAC-019': [g('salsaCriolla', ['salsaCriolla', 50])],
  'TAC-020': [g('salsaCriolla', ['salsaCriolla', 50])],
  'TAC-022': [g('pasas', ['pasas', 10]), g('aceitunas', ['aceituna', 10]), g('huevo', ['huevo', 50]), g('cebolla', ['cebolla', 40]), g('queso', ['quesoFresco', 20])],
  'TAC-023': [g('salsaBBQ', ['salsaBBQ', 60])],
  'TAC-024': [g('huevo', ['huevo', 25]), g('aceitunas', ['aceituna', 8]), g('papa', ['papaCocida', 100]), g('arroz', ['arroz', 150])],
  'TAC-025': [g('salsaCriolla', ['salsaCriolla', 60]), g('arveja', ['arveja', 30]), g('zanahoria', ['zanahoria', 30])],
  'TAC-028': [g('salsaCriolla', ['salsaCriolla', 70]), g('chipsCamote', ['camoteChips', 70])],
  'TAC-029': [g('pure', ['puré', 130]), g('pallares', ['pallar', 80]), g('arroz', ['arroz', 150])],
  'TAC-030': [g('sopaSeca', ['sopaSeca', 140])],
  'TAC-031': [g('salsaVino', ['salsaVino', 60])],
  'TAC-033': [g('cebolla', ['cebolla', 60]), g('tomate', ['tomate', 50]), g('papasFritas', ['papaFrita', 120]), g('arroz', ['arroz', 140])],
  'TAC-034': [g('pure', ['puré', 160]), g('arroz', ['arroz', 150]), g('salsaVino', ['salsaVino', 100])],
  'TAC-035': [g('arroz', ['arroz', 150])],
  'TAC-036': [g('arroz', ['arroz', 150]), g('salsaVino', ['salsaVino', 100])],
  'TAC-037': [g('huevo', ['huevo', 55]), g('platano', ['platano', 70], ['aceite', 8])],
  'TAC-038': [g('salsaCriolla', ['salsaCriolla', 60]), g('tartara', ['tartara', 30]), g('papasFritas', ['papaFrita', 140])],
  'TAC-040': [g('arroz', ['arroz', 220])],
  'TAC-041': [g('papasFritas', ['papaFrita', 120])],
  'TAC-042': [g('queso', ['cheddar', 20]), g('papasFritas', ['papaFrita', 120])],
  'TAC-043': [g('pure', ['puré', 100]), g('arroz', ['arroz', 100]), g('salsaVino', ['salsaVino', 60])],
  'TAC-046': [g('jamon', ['jamon', 80])],
  'TAC-047': [g('quesoAzul', ['azul', 40]), g('gouda', ['gouda', 50]), g('parmesano', ['parmesano', 30])],
  'TAC-049': [g('tocino', ['tocino', 40]), g('salame', ['salame', 50]), g('carneMolida', ['molida', 70])],
  'TAC-050': [g('cebolla', ['cebolla', 40]), g('papasFritas', ['papaFrita', 110]), g('salsaVino', ['salsaVino', 60])],
  'TAC-051': [g('chipsCamote', ['camoteChips', 60]), g('salsaCriolla', ['salsaCriolla', 50])],
  'TAC-052': [g('palta', ['palta', 60]), g('mayonesa', ['mayonesa', 25])],
  'TAC-053': [g('queso', ['cheddar', 25])],
  'TAC-054': [g('queso', ['cheddar', 25]), g('tocino', ['tocino', 20]), g('huevo', ['huevo', 55])],
};
// Platos a los que se les puede personalizar el pedido (entradas, principales, desayunos, kids y piqueos)
const ROLES_PERSONALIZABLES = ['ENTRADA', 'FONDO', 'DESAYUNO', 'KIDS', 'PIQUEO'];
const personalizables = require('./carta-tacama.json').filter((p) => ROLES_PERSONALIZABLES.includes(p.rol)).map((p) => p.codigo);

// Cada opción debe tener su nombre en los 5 idiomas en apps/comensal-pwa/src/lib/ingredientes.ts; si falta, la cocina
// recibiría el identificador crudo ("huancaina") y la personalización guardada no se podría releer.
const etiquetas = fs.readFileSync(path.join(__dirname, '../../apps/comensal-pwa/src/lib/ingredientes.ts'), 'utf8');
const idsConNombre = new Set([...etiquetas.matchAll(/^ {2}(\w+): \[/gm)].map((m) => m[1]));
const sinNombre = [...new Set(Object.values(OPC).flat().map(([id]) => id))].filter((id) => !idsConNombre.has(id));
if (sinNombre.length) throw new Error('ingredientes sin nombre en ingredientes.ts: ' + sinNombre.join(', '));

const QUITAR = {};
for (const [cod, opciones] of Object.entries(OPC)) {
  if (!personalizables.includes(cod)) throw new Error('plato no personalizable: ' + cod);
  QUITAR[cod] = {};
  for (const [id, pares] of opciones) {
    let p = 0, gr = 0, c = 0;
    for (const [ing, cant] of pares) {
      const x = I[ing];
      if (!x) throw new Error('ingrediente desconocido ' + ing);
      p += (x[0] * cant) / 100; gr += (x[1] * cant) / 100; c += (x[2] * cant) / 100;
    }
    const kcal = Math.round((4 * p + 9 * gr + 4 * c) / 5) * 5;
    QUITAR[cod][id] = { kcal, kj: Math.round(kcal * 4.184), proteinas: Math.round(p), grasas: Math.round(gr), carbohidratos: Math.round(c) };
  }
}

// Todos los platos de la carta deben tener información
const carta = require('./carta-tacama.json');
const faltan = carta.filter((p) => !salida[p.codigo]).map((p) => p.codigo);
if (faltan.length) throw new Error('sin información nutricional: ' + faltan.join(', '));

const ts = `// Archivo generado por infra/data/build-nutricion.js: no editar a mano.
// Información nutricional REFERENCIAL por porción servida, calculada con las Tablas Peruanas de Composición de
// Alimentos (CENAN / INS, Minsa) como referencia y recetas estándar. Valores aproximados.

export interface InfoNutricional {
  porcion: string;       // porción servida
  personas: number;      // entre cuántas personas se comparte (1 = individual)
  gramos: number;        // peso aproximado de la porción (g o ml)
  kcal: number;
  kj: number;
  proteinas: number;     // g
  grasas: number;        // g
  carbohidratos: number; // g
  fibra: number;         // g
  alcohol?: number;      // g
}

export const NUTRICION: Record<string, InfoNutricional> = ${JSON.stringify(salida, null, 2)};

/** Energía y macronutrientes que se descuentan al quitar cada ingrediente de un plato. */
export interface AhorroIngrediente { kcal: number; kj: number; proteinas: number; grasas: number; carbohidratos: number }
export const QUITAR: Record<string, Record<string, AhorroIngrediente>> = ${JSON.stringify(QUITAR, null, 2)};

/** Códigos de los platos a los que se puede personalizar el pedido (entradas, principales, desayunos, kids y piqueos). */
export const PERSONALIZABLES: string[] = ${JSON.stringify(personalizables)};
`;
fs.writeFileSync(path.join(__dirname, '../../apps/comensal-pwa/src/lib/nutricion.ts'), ts);
console.log('platos con información nutricional:', Object.keys(salida).length);
const muestra = ['TAC-012', 'TAC-033', 'TAC-024', 'TAC-056', 'TAC-072', 'TAC-088', 'TAC-010', 'TAC-048'];
for (const k of muestra) console.log(k, JSON.stringify(salida[k]));
