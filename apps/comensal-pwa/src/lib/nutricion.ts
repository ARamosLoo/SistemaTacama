// Archivo generado por infra/data/build-nutricion.js: no editar a mano.
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

export const NUTRICION: Record<string, InfoNutricional> = {
  "TAC-001": {
    "porcion": "60 g",
    "personas": 1,
    "gramos": 60,
    "kcal": 435,
    "kj": 1820,
    "proteinas": 5,
    "grasas": 43,
    "carbohidratos": 8,
    "fibra": 5
  },
  "TAC-002": {
    "porcion": "6 unidades",
    "personas": 1,
    "gramos": 245,
    "kcal": 685,
    "kj": 2866,
    "proteinas": 14,
    "grasas": 49,
    "carbohidratos": 47,
    "fibra": 3
  },
  "TAC-003": {
    "porcion": "6 unidades",
    "personas": 1,
    "gramos": 245,
    "kcal": 610,
    "kj": 2552,
    "proteinas": 19,
    "grasas": 37,
    "carbohidratos": 51,
    "fibra": 3
  },
  "TAC-004": {
    "porcion": "6 unidades",
    "personas": 1,
    "gramos": 245,
    "kcal": 620,
    "kj": 2594,
    "proteinas": 22,
    "grasas": 36,
    "carbohidratos": 53,
    "fibra": 3
  },
  "TAC-005": {
    "porcion": "6 unidades",
    "personas": 1,
    "gramos": 245,
    "kcal": 570,
    "kj": 2385,
    "proteinas": 23,
    "grasas": 31,
    "carbohidratos": 51,
    "fibra": 3
  },
  "TAC-006": {
    "porcion": "9 unidades",
    "personas": 3,
    "gramos": 380,
    "kcal": 985,
    "kj": 4121,
    "proteinas": 28,
    "grasas": 63,
    "carbohidratos": 76,
    "fibra": 5
  },
  "TAC-007": {
    "porcion": "tabla para compartir",
    "personas": 3,
    "gramos": 275,
    "kcal": 1010,
    "kj": 4226,
    "proteinas": 39,
    "grasas": 70,
    "carbohidratos": 56,
    "fibra": 5
  },
  "TAC-008": {
    "porcion": "1 plato",
    "personas": 1,
    "gramos": 260,
    "kcal": 700,
    "kj": 2929,
    "proteinas": 5,
    "grasas": 38,
    "carbohidratos": 84,
    "fibra": 5
  },
  "TAC-009": {
    "porcion": "1 empanada con ensalada",
    "personas": 1,
    "gramos": 255,
    "kcal": 670,
    "kj": 2803,
    "proteinas": 17,
    "grasas": 40,
    "carbohidratos": 60,
    "fibra": 4
  },
  "TAC-010": {
    "porcion": "para 3 personas",
    "personas": 3,
    "gramos": 815,
    "kcal": 2025,
    "kj": 8473,
    "proteinas": 72,
    "grasas": 133,
    "carbohidratos": 134,
    "fibra": 10
  },
  "TAC-011": {
    "porcion": "1 plato",
    "personas": 1,
    "gramos": 370,
    "kcal": 640,
    "kj": 2678,
    "proteinas": 28,
    "grasas": 39,
    "carbohidratos": 45,
    "fibra": 6
  },
  "TAC-012": {
    "porcion": "1 plato",
    "personas": 1,
    "gramos": 400,
    "kcal": 495,
    "kj": 2071,
    "proteinas": 15,
    "grasas": 25,
    "carbohidratos": 54,
    "fibra": 5
  },
  "TAC-013": {
    "porcion": "1 plato",
    "personas": 1,
    "gramos": 250,
    "kcal": 475,
    "kj": 1987,
    "proteinas": 5,
    "grasas": 42,
    "carbohidratos": 19,
    "fibra": 11
  },
  "TAC-014": {
    "porcion": "1 plato",
    "personas": 1,
    "gramos": 340,
    "kcal": 600,
    "kj": 2510,
    "proteinas": 26,
    "grasas": 48,
    "carbohidratos": 18,
    "fibra": 9
  },
  "TAC-015": {
    "porcion": "1 plato",
    "personas": 1,
    "gramos": 260,
    "kcal": 285,
    "kj": 1192,
    "proteinas": 11,
    "grasas": 11,
    "carbohidratos": 36,
    "fibra": 10
  },
  "TAC-016": {
    "porcion": "1 plato",
    "personas": 1,
    "gramos": 235,
    "kcal": 405,
    "kj": 1695,
    "proteinas": 15,
    "grasas": 30,
    "carbohidratos": 19,
    "fibra": 2
  },
  "TAC-017": {
    "porcion": "1 plato",
    "personas": 1,
    "gramos": 365,
    "kcal": 610,
    "kj": 2552,
    "proteinas": 55,
    "grasas": 35,
    "carbohidratos": 19,
    "fibra": 2
  },
  "TAC-018": {
    "porcion": "1 plato",
    "personas": 1,
    "gramos": 335,
    "kcal": 295,
    "kj": 1234,
    "proteinas": 5,
    "grasas": 20,
    "carbohidratos": 24,
    "fibra": 8
  },
  "TAC-019": {
    "porcion": "1 tamal con salsa criolla",
    "personas": 1,
    "gramos": 270,
    "kcal": 490,
    "kj": 2050,
    "proteinas": 14,
    "grasas": 20,
    "carbohidratos": 65,
    "fibra": 4
  },
  "TAC-020": {
    "porcion": "1 tamal con salsa criolla",
    "personas": 1,
    "gramos": 270,
    "kcal": 450,
    "kj": 1883,
    "proteinas": 16,
    "grasas": 15,
    "carbohidratos": 62,
    "fibra": 4
  },
  "TAC-021": {
    "porcion": "1 humita",
    "personas": 1,
    "gramos": 160,
    "kcal": 325,
    "kj": 1360,
    "proteinas": 8,
    "grasas": 13,
    "carbohidratos": 45,
    "fibra": 3
  },
  "TAC-022": {
    "porcion": "1 porción",
    "personas": 1,
    "gramos": 490,
    "kcal": 775,
    "kj": 3243,
    "proteinas": 37,
    "grasas": 39,
    "carbohidratos": 69,
    "fibra": 7
  },
  "TAC-023": {
    "porcion": "media tira",
    "personas": 1,
    "gramos": 300,
    "kcal": 775,
    "kj": 3243,
    "proteinas": 53,
    "grasas": 53,
    "carbohidratos": 21,
    "fibra": 0
  },
  "TAC-024": {
    "porcion": "1 plato con arroz y papa",
    "personas": 1,
    "gramos": 575,
    "kcal": 835,
    "kj": 3494,
    "proteinas": 59,
    "grasas": 34,
    "carbohidratos": 75,
    "fibra": 4
  },
  "TAC-025": {
    "porcion": "1 plato",
    "personas": 1,
    "gramos": 530,
    "kcal": 780,
    "kj": 3264,
    "proteinas": 47,
    "grasas": 33,
    "carbohidratos": 73,
    "fibra": 4
  },
  "TAC-026": {
    "porcion": "pollo con 2 guarniciones",
    "personas": 1,
    "gramos": 430,
    "kcal": 865,
    "kj": 3619,
    "proteinas": 69,
    "grasas": 35,
    "carbohidratos": 68,
    "fibra": 4
  },
  "TAC-027": {
    "porcion": "milanesa con 2 guarniciones",
    "personas": 1,
    "gramos": 420,
    "kcal": 1020,
    "kj": 4268,
    "proteinas": 47,
    "grasas": 48,
    "carbohidratos": 100,
    "fibra": 6
  },
  "TAC-028": {
    "porcion": "1 plato",
    "personas": 1,
    "gramos": 330,
    "kcal": 1270,
    "kj": 5314,
    "proteinas": 30,
    "grasas": 108,
    "carbohidratos": 45,
    "fibra": 5
  },
  "TAC-029": {
    "porcion": "1 plato",
    "personas": 1,
    "gramos": 560,
    "kcal": 925,
    "kj": 3870,
    "proteinas": 55,
    "grasas": 45,
    "carbohidratos": 76,
    "fibra": 7
  },
  "TAC-030": {
    "porcion": "1 plato",
    "personas": 1,
    "gramos": 410,
    "kcal": 845,
    "kj": 3535,
    "proteinas": 43,
    "grasas": 38,
    "carbohidratos": 83,
    "fibra": 8
  },
  "TAC-031": {
    "porcion": "1 plato",
    "personas": 1,
    "gramos": 570,
    "kcal": 925,
    "kj": 3870,
    "proteinas": 60,
    "grasas": 38,
    "carbohidratos": 86,
    "fibra": 6
  },
  "TAC-032": {
    "porcion": "1 plato",
    "personas": 1,
    "gramos": 495,
    "kcal": 1170,
    "kj": 4895,
    "proteinas": 64,
    "grasas": 55,
    "carbohidratos": 104,
    "fibra": 7
  },
  "TAC-033": {
    "porcion": "1 plato",
    "personas": 1,
    "gramos": 530,
    "kcal": 970,
    "kj": 4058,
    "proteinas": 49,
    "grasas": 48,
    "carbohidratos": 86,
    "fibra": 6
  },
  "TAC-034": {
    "porcion": "1 plato",
    "personas": 1,
    "gramos": 600,
    "kcal": 830,
    "kj": 3473,
    "proteinas": 58,
    "grasas": 35,
    "carbohidratos": 70,
    "fibra": 3
  },
  "TAC-035": {
    "porcion": "1 plato",
    "personas": 1,
    "gramos": 585,
    "kcal": 1120,
    "kj": 4686,
    "proteinas": 62,
    "grasas": 48,
    "carbohidratos": 110,
    "fibra": 13
  },
  "TAC-036": {
    "porcion": "1 plato",
    "personas": 1,
    "gramos": 590,
    "kcal": 915,
    "kj": 3828,
    "proteinas": 66,
    "grasas": 41,
    "carbohidratos": 71,
    "fibra": 8
  },
  "TAC-037": {
    "porcion": "1 plato",
    "personas": 1,
    "gramos": 615,
    "kcal": 1015,
    "kj": 4247,
    "proteinas": 55,
    "grasas": 48,
    "carbohidratos": 90,
    "fibra": 3
  },
  "TAC-038": {
    "porcion": "1 plato",
    "personas": 1,
    "gramos": 430,
    "kcal": 1060,
    "kj": 4435,
    "proteinas": 42,
    "grasas": 65,
    "carbohidratos": 76,
    "fibra": 6
  },
  "TAC-039": {
    "porcion": "1 plato",
    "personas": 1,
    "gramos": 500,
    "kcal": 705,
    "kj": 2950,
    "proteinas": 33,
    "grasas": 28,
    "carbohidratos": 80,
    "fibra": 2
  },
  "TAC-040": {
    "porcion": "para 2 personas",
    "personas": 2,
    "gramos": 770,
    "kcal": 1330,
    "kj": 5565,
    "proteinas": 82,
    "grasas": 58,
    "carbohidratos": 120,
    "fibra": 13
  },
  "TAC-041": {
    "porcion": "menú kids",
    "personas": 1,
    "gramos": 250,
    "kcal": 705,
    "kj": 2950,
    "proteinas": 30,
    "grasas": 36,
    "carbohidratos": 64,
    "fibra": 5
  },
  "TAC-042": {
    "porcion": "menú kids",
    "personas": 1,
    "gramos": 280,
    "kcal": 775,
    "kj": 3243,
    "proteinas": 31,
    "grasas": 38,
    "carbohidratos": 77,
    "fibra": 5
  },
  "TAC-043": {
    "porcion": "menú kids",
    "personas": 1,
    "gramos": 350,
    "kcal": 465,
    "kj": 1946,
    "proteinas": 29,
    "grasas": 19,
    "carbohidratos": 45,
    "fibra": 2
  },
  "TAC-044": {
    "porcion": "1 copa",
    "personas": 1,
    "gramos": 150,
    "kcal": 375,
    "kj": 1569,
    "proteinas": 5,
    "grasas": 18,
    "carbohidratos": 48,
    "fibra": 1
  },
  "TAC-045": {
    "porcion": "4 piezas",
    "personas": 1,
    "gramos": 150,
    "kcal": 535,
    "kj": 2238,
    "proteinas": 11,
    "grasas": 25,
    "carbohidratos": 68,
    "fibra": 3
  },
  "TAC-046": {
    "porcion": "pizza para compartir",
    "personas": 2,
    "gramos": 510,
    "kcal": 1225,
    "kj": 5125,
    "proteinas": 66,
    "grasas": 50,
    "carbohidratos": 130,
    "fibra": 6
  },
  "TAC-047": {
    "porcion": "pizza para compartir",
    "personas": 2,
    "gramos": 470,
    "kcal": 1350,
    "kj": 5648,
    "proteinas": 72,
    "grasas": 60,
    "carbohidratos": 130,
    "fibra": 6
  },
  "TAC-048": {
    "porcion": "pizza para compartir",
    "personas": 2,
    "gramos": 450,
    "kcal": 1150,
    "kj": 4812,
    "proteinas": 51,
    "grasas": 48,
    "carbohidratos": 129,
    "fibra": 6
  },
  "TAC-049": {
    "porcion": "pizza para compartir",
    "personas": 2,
    "gramos": 580,
    "kcal": 1650,
    "kj": 6904,
    "proteinas": 93,
    "grasas": 84,
    "carbohidratos": 130,
    "fibra": 6
  },
  "TAC-050": {
    "porcion": "1 sándwich con papas",
    "personas": 1,
    "gramos": 440,
    "kcal": 945,
    "kj": 3954,
    "proteinas": 46,
    "grasas": 36,
    "carbohidratos": 109,
    "fibra": 7
  },
  "TAC-051": {
    "porcion": "1 sándwich con chips",
    "personas": 1,
    "gramos": 360,
    "kcal": 1295,
    "kj": 5418,
    "proteinas": 32,
    "grasas": 85,
    "carbohidratos": 99,
    "fibra": 7
  },
  "TAC-052": {
    "porcion": "1 sándwich",
    "personas": 1,
    "gramos": 295,
    "kcal": 790,
    "kj": 3305,
    "proteinas": 44,
    "grasas": 44,
    "carbohidratos": 55,
    "fibra": 6
  },
  "TAC-053": {
    "porcion": "1 hamburguesa",
    "personas": 1,
    "gramos": 270,
    "kcal": 785,
    "kj": 3284,
    "proteinas": 51,
    "grasas": 42,
    "carbohidratos": 50,
    "fibra": 2
  },
  "TAC-054": {
    "porcion": "1 hamburguesa",
    "personas": 1,
    "gramos": 365,
    "kcal": 1020,
    "kj": 4268,
    "proteinas": 71,
    "grasas": 59,
    "carbohidratos": 51,
    "fibra": 2
  },
  "TAC-055": {
    "porcion": "1 porción",
    "personas": 1,
    "gramos": 130,
    "kcal": 525,
    "kj": 2197,
    "proteinas": 7,
    "grasas": 23,
    "carbohidratos": 72,
    "fibra": 4
  },
  "TAC-056": {
    "porcion": "1 porción con helado",
    "personas": 1,
    "gramos": 210,
    "kcal": 750,
    "kj": 3138,
    "proteinas": 9,
    "grasas": 36,
    "carbohidratos": 97,
    "fibra": 4
  },
  "TAC-057": {
    "porcion": "1 porción",
    "personas": 1,
    "gramos": 200,
    "kcal": 505,
    "kj": 2113,
    "proteinas": 9,
    "grasas": 17,
    "carbohidratos": 78,
    "fibra": 1
  },
  "TAC-058": {
    "porcion": "1 porción con helado",
    "personas": 1,
    "gramos": 230,
    "kcal": 675,
    "kj": 2824,
    "proteinas": 7,
    "grasas": 26,
    "carbohidratos": 104,
    "fibra": 5
  },
  "TAC-059": {
    "porcion": "1 porción",
    "personas": 1,
    "gramos": 110,
    "kcal": 395,
    "kj": 1653,
    "proteinas": 7,
    "grasas": 15,
    "carbohidratos": 57,
    "fibra": 0
  },
  "TAC-060": {
    "porcion": "1 porción",
    "personas": 1,
    "gramos": 130,
    "kcal": 635,
    "kj": 2657,
    "proteinas": 7,
    "grasas": 39,
    "carbohidratos": 65,
    "fibra": 4
  },
  "TAC-061": {
    "porcion": "trilogía",
    "personas": 1,
    "gramos": 330,
    "kcal": 1000,
    "kj": 4184,
    "proteinas": 14,
    "grasas": 42,
    "carbohidratos": 142,
    "fibra": 6
  },
  "TAC-062": {
    "porcion": "1 porción",
    "personas": 1,
    "gramos": 80,
    "kcal": 50,
    "kj": 209,
    "proteinas": 1,
    "grasas": 3,
    "carbohidratos": 5,
    "fibra": 1
  },
  "TAC-063": {
    "porcion": "1 porción",
    "personas": 1,
    "gramos": 200,
    "kcal": 255,
    "kj": 1067,
    "proteinas": 5,
    "grasas": 4,
    "carbohidratos": 50,
    "fibra": 1
  },
  "TAC-064": {
    "porcion": "1 porción",
    "personas": 1,
    "gramos": 100,
    "kcal": 490,
    "kj": 2050,
    "proteinas": 2,
    "grasas": 28,
    "carbohidratos": 58,
    "fibra": 5
  },
  "TAC-065": {
    "porcion": "1 porción",
    "personas": 1,
    "gramos": 180,
    "kcal": 525,
    "kj": 2197,
    "proteinas": 6,
    "grasas": 27,
    "carbohidratos": 65,
    "fibra": 5
  },
  "TAC-066": {
    "porcion": "1 porción",
    "personas": 1,
    "gramos": 100,
    "kcal": 175,
    "kj": 732,
    "proteinas": 2,
    "grasas": 15,
    "carbohidratos": 9,
    "fibra": 7
  },
  "TAC-067": {
    "porcion": "1 porción",
    "personas": 1,
    "gramos": 200,
    "kcal": 215,
    "kj": 900,
    "proteinas": 4,
    "grasas": 8,
    "carbohidratos": 32,
    "fibra": 3
  },
  "TAC-068": {
    "porcion": "1 porción",
    "personas": 1,
    "gramos": 165,
    "kcal": 235,
    "kj": 983,
    "proteinas": 11,
    "grasas": 7,
    "carbohidratos": 32,
    "fibra": 9
  },
  "TAC-069": {
    "porcion": "1 porción",
    "personas": 1,
    "gramos": 225,
    "kcal": 340,
    "kj": 1423,
    "proteinas": 14,
    "grasas": 13,
    "carbohidratos": 41,
    "fibra": 11
  },
  "TAC-070": {
    "porcion": "1 porción",
    "personas": 1,
    "gramos": 200,
    "kcal": 430,
    "kj": 1799,
    "proteinas": 18,
    "grasas": 20,
    "carbohidratos": 44,
    "fibra": 6
  },
  "TAC-071": {
    "porcion": "1 porción",
    "personas": 1,
    "gramos": 200,
    "kcal": 370,
    "kj": 1548,
    "proteinas": 10,
    "grasas": 12,
    "carbohidratos": 56,
    "fibra": 3
  },
  "TAC-072": {
    "porcion": "1 vaso (250 ml)",
    "personas": 1,
    "gramos": 215,
    "kcal": 170,
    "kj": 711,
    "proteinas": 0,
    "grasas": 0,
    "carbohidratos": 14,
    "fibra": 0,
    "alcohol": 16
  },
  "TAC-073": {
    "porcion": "1 vaso (250 ml)",
    "personas": 1,
    "gramos": 220,
    "kcal": 175,
    "kj": 732,
    "proteinas": 0,
    "grasas": 0,
    "carbohidratos": 16,
    "fibra": 0,
    "alcohol": 16
  },
  "TAC-074": {
    "porcion": "1 copa (150 ml)",
    "personas": 1,
    "gramos": 115,
    "kcal": 180,
    "kj": 753,
    "proteinas": 2,
    "grasas": 0,
    "carbohidratos": 15,
    "fibra": 0,
    "alcohol": 16
  },
  "TAC-075": {
    "porcion": "1 copa (150 ml)",
    "personas": 1,
    "gramos": 120,
    "kcal": 190,
    "kj": 795,
    "proteinas": 2,
    "grasas": 0,
    "carbohidratos": 17,
    "fibra": 0,
    "alcohol": 16
  },
  "TAC-076": {
    "porcion": "1 copa (100 ml)",
    "personas": 1,
    "gramos": 90,
    "kcal": 170,
    "kj": 711,
    "proteinas": 0,
    "grasas": 0,
    "carbohidratos": 6,
    "fibra": 0,
    "alcohol": 21
  },
  "TAC-077": {
    "porcion": "1 copa (180 ml)",
    "personas": 1,
    "gramos": 180,
    "kcal": 220,
    "kj": 920,
    "proteinas": 0,
    "grasas": 0,
    "carbohidratos": 23,
    "fibra": 0,
    "alcohol": 18
  },
  "TAC-078": {
    "porcion": "1 copa (180 ml)",
    "personas": 1,
    "gramos": 160,
    "kcal": 250,
    "kj": 1046,
    "proteinas": 0,
    "grasas": 0,
    "carbohidratos": 30,
    "fibra": 0,
    "alcohol": 18
  },
  "TAC-079": {
    "porcion": "1 copa (220 ml)",
    "personas": 1,
    "gramos": 220,
    "kcal": 235,
    "kj": 983,
    "proteinas": 0,
    "grasas": 0,
    "carbohidratos": 26,
    "fibra": 0,
    "alcohol": 19
  },
  "TAC-080": {
    "porcion": "1 copa (220 ml)",
    "personas": 1,
    "gramos": 210,
    "kcal": 240,
    "kj": 1004,
    "proteinas": 0,
    "grasas": 0,
    "carbohidratos": 19,
    "fibra": 0,
    "alcohol": 23
  },
  "TAC-081": {
    "porcion": "1 vaso (250 ml)",
    "personas": 1,
    "gramos": 250,
    "kcal": 180,
    "kj": 753,
    "proteinas": 0,
    "grasas": 0,
    "carbohidratos": 17,
    "fibra": 0,
    "alcohol": 16
  },
  "TAC-082": {
    "porcion": "1 vaso (250 ml)",
    "personas": 1,
    "gramos": 250,
    "kcal": 180,
    "kj": 753,
    "proteinas": 0,
    "grasas": 0,
    "carbohidratos": 17,
    "fibra": 0,
    "alcohol": 16
  },
  "TAC-083": {
    "porcion": "1 vaso (200 ml)",
    "personas": 1,
    "gramos": 170,
    "kcal": 225,
    "kj": 941,
    "proteinas": 0,
    "grasas": 0,
    "carbohidratos": 28,
    "fibra": 0,
    "alcohol": 16
  },
  "TAC-084": {
    "porcion": "1 copa (100 ml)",
    "personas": 1,
    "gramos": 90,
    "kcal": 180,
    "kj": 753,
    "proteinas": 0,
    "grasas": 0,
    "carbohidratos": 12,
    "fibra": 0,
    "alcohol": 19
  },
  "TAC-085": {
    "porcion": "600 ml",
    "personas": 1,
    "gramos": 600,
    "kcal": 255,
    "kj": 1067,
    "proteinas": 0,
    "grasas": 0,
    "carbohidratos": 64,
    "fibra": 0
  },
  "TAC-086": {
    "porcion": "1 botella",
    "personas": 1,
    "gramos": 500,
    "kcal": 0,
    "kj": 0,
    "proteinas": 0,
    "grasas": 0,
    "carbohidratos": 0,
    "fibra": 0
  },
  "TAC-087": {
    "porcion": "1 botella",
    "personas": 1,
    "gramos": 500,
    "kcal": 0,
    "kj": 0,
    "proteinas": 0,
    "grasas": 0,
    "carbohidratos": 0,
    "fibra": 0
  },
  "TAC-088": {
    "porcion": "1 vaso (300 ml)",
    "personas": 1,
    "gramos": 300,
    "kcal": 70,
    "kj": 293,
    "proteinas": 0,
    "grasas": 0,
    "carbohidratos": 17,
    "fibra": 0
  },
  "TAC-089": {
    "porcion": "500 ml",
    "personas": 1,
    "gramos": 500,
    "kcal": 115,
    "kj": 481,
    "proteinas": 1,
    "grasas": 1,
    "carbohidratos": 28,
    "fibra": 0
  },
  "TAC-090": {
    "porcion": "1 litro",
    "personas": 1,
    "gramos": 1000,
    "kcal": 235,
    "kj": 983,
    "proteinas": 1,
    "grasas": 1,
    "carbohidratos": 55,
    "fibra": 0
  },
  "TAC-091": {
    "porcion": "1 vaso (300 ml)",
    "personas": 1,
    "gramos": 300,
    "kcal": 100,
    "kj": 418,
    "proteinas": 1,
    "grasas": 0,
    "carbohidratos": 24,
    "fibra": 0
  },
  "TAC-092": {
    "porcion": "500 ml",
    "personas": 1,
    "gramos": 500,
    "kcal": 165,
    "kj": 690,
    "proteinas": 2,
    "grasas": 0,
    "carbohidratos": 40,
    "fibra": 0
  },
  "TAC-093": {
    "porcion": "1 litro",
    "personas": 1,
    "gramos": 1000,
    "kcal": 330,
    "kj": 1381,
    "proteinas": 3,
    "grasas": 0,
    "carbohidratos": 80,
    "fibra": 0
  },
  "TAC-094": {
    "porcion": "1 vaso (300 ml)",
    "personas": 1,
    "gramos": 300,
    "kcal": 80,
    "kj": 335,
    "proteinas": 0,
    "grasas": 0,
    "carbohidratos": 20,
    "fibra": 0
  },
  "TAC-095": {
    "porcion": "500 ml",
    "personas": 1,
    "gramos": 500,
    "kcal": 130,
    "kj": 544,
    "proteinas": 1,
    "grasas": 0,
    "carbohidratos": 33,
    "fibra": 0
  },
  "TAC-096": {
    "porcion": "1 litro",
    "personas": 1,
    "gramos": 1000,
    "kcal": 265,
    "kj": 1109,
    "proteinas": 1,
    "grasas": 0,
    "carbohidratos": 65,
    "fibra": 0
  },
  "TAC-097": {
    "porcion": "1 taza (200 ml)",
    "personas": 1,
    "gramos": 200,
    "kcal": 5,
    "kj": 21,
    "proteinas": 0,
    "grasas": 0,
    "carbohidratos": 0,
    "fibra": 0
  },
  "TAC-098": {
    "porcion": "1 taza (30 ml)",
    "personas": 1,
    "gramos": 30,
    "kcal": 0,
    "kj": 0,
    "proteinas": 0,
    "grasas": 0,
    "carbohidratos": 0,
    "fibra": 0
  },
  "TAC-099": {
    "porcion": "1 taza (60 ml)",
    "personas": 1,
    "gramos": 60,
    "kcal": 0,
    "kj": 0,
    "proteinas": 0,
    "grasas": 0,
    "carbohidratos": 0,
    "fibra": 0
  },
  "TAC-100": {
    "porcion": "1 taza (100 ml)",
    "personas": 1,
    "gramos": 100,
    "kcal": 30,
    "kj": 126,
    "proteinas": 2,
    "grasas": 2,
    "carbohidratos": 2,
    "fibra": 0
  },
  "TAC-101": {
    "porcion": "1 taza (200 ml)",
    "personas": 1,
    "gramos": 200,
    "kcal": 90,
    "kj": 377,
    "proteinas": 5,
    "grasas": 5,
    "carbohidratos": 7,
    "fibra": 0
  },
  "TAC-102": {
    "porcion": "1 taza (200 ml)",
    "personas": 1,
    "gramos": 200,
    "kcal": 0,
    "kj": 0,
    "proteinas": 0,
    "grasas": 0,
    "carbohidratos": 0,
    "fibra": 0
  },
  "TAC-103": {
    "porcion": "1 taza (200 ml)",
    "personas": 1,
    "gramos": 200,
    "kcal": 0,
    "kj": 0,
    "proteinas": 0,
    "grasas": 0,
    "carbohidratos": 0,
    "fibra": 0
  },
  "TAC-104": {
    "porcion": "1 taza (200 ml)",
    "personas": 1,
    "gramos": 200,
    "kcal": 0,
    "kj": 0,
    "proteinas": 0,
    "grasas": 0,
    "carbohidratos": 0,
    "fibra": 0
  }
};

/** Energía y macronutrientes que se descuentan al quitar cada ingrediente de un plato. */
export interface AhorroIngrediente { kcal: number; kj: number; proteinas: number; grasas: number; carbohidratos: number }
export const QUITAR: Record<string, Record<string, AhorroIngrediente>> = {
  "TAC-002": {
    "guacamole": {
      "kcal": 60,
      "kj": 251,
      "proteinas": 1,
      "grasas": 5,
      "carbohidratos": 3
    }
  },
  "TAC-003": {
    "guacamole": {
      "kcal": 60,
      "kj": 251,
      "proteinas": 1,
      "grasas": 5,
      "carbohidratos": 3
    }
  },
  "TAC-004": {
    "huancaina": {
      "kcal": 85,
      "kj": 356,
      "proteinas": 2,
      "grasas": 8,
      "carbohidratos": 3
    }
  },
  "TAC-005": {
    "guacamole": {
      "kcal": 60,
      "kj": 251,
      "proteinas": 1,
      "grasas": 5,
      "carbohidratos": 3
    }
  },
  "TAC-006": {
    "guacamole": {
      "kcal": 50,
      "kj": 209,
      "proteinas": 1,
      "grasas": 4,
      "carbohidratos": 2
    },
    "huancaina": {
      "kcal": 75,
      "kj": 314,
      "proteinas": 2,
      "grasas": 7,
      "carbohidratos": 2
    }
  },
  "TAC-007": {
    "pasas": {
      "kcal": 65,
      "kj": 272,
      "proteinas": 1,
      "grasas": 0,
      "carbohidratos": 16
    },
    "pecanas": {
      "kcal": 185,
      "kj": 774,
      "proteinas": 2,
      "grasas": 18,
      "carbohidratos": 4
    },
    "alioli": {
      "kcal": 130,
      "kj": 544,
      "proteinas": 0,
      "grasas": 14,
      "carbohidratos": 0
    },
    "pan": {
      "kcal": 170,
      "kj": 711,
      "proteinas": 5,
      "grasas": 2,
      "carbohidratos": 34
    }
  },
  "TAC-008": {
    "huancaina": {
      "kcal": 115,
      "kj": 481,
      "proteinas": 2,
      "grasas": 10,
      "carbohidratos": 4
    }
  },
  "TAC-009": {
    "ensalada": {
      "kcal": 50,
      "kj": 209,
      "proteinas": 1,
      "grasas": 4,
      "carbohidratos": 2
    }
  },
  "TAC-010": {
    "salsaCriolla": {
      "kcal": 40,
      "kj": 167,
      "proteinas": 1,
      "grasas": 2,
      "carbohidratos": 4
    },
    "huancaina": {
      "kcal": 115,
      "kj": 481,
      "proteinas": 2,
      "grasas": 10,
      "carbohidratos": 4
    },
    "choclo": {
      "kcal": 130,
      "kj": 544,
      "proteinas": 4,
      "grasas": 1,
      "carbohidratos": 25
    }
  },
  "TAC-011": {
    "palta": {
      "kcal": 60,
      "kj": 251,
      "proteinas": 1,
      "grasas": 5,
      "carbohidratos": 3
    },
    "mayonesa": {
      "kcal": 170,
      "kj": 711,
      "proteinas": 0,
      "grasas": 19,
      "carbohidratos": 0
    },
    "huevo": {
      "kcal": 30,
      "kj": 126,
      "proteinas": 3,
      "grasas": 2,
      "carbohidratos": 0
    }
  },
  "TAC-012": {
    "huevo": {
      "kcal": 65,
      "kj": 272,
      "proteinas": 6,
      "grasas": 5,
      "carbohidratos": 0
    },
    "aceitunas": {
      "kcal": 15,
      "kj": 63,
      "proteinas": 0,
      "grasas": 1,
      "carbohidratos": 1
    },
    "lechuga": {
      "kcal": 5,
      "kj": 21,
      "proteinas": 0,
      "grasas": 0,
      "carbohidratos": 0
    }
  },
  "TAC-013": {
    "mayonesa": {
      "kcal": 205,
      "kj": 858,
      "proteinas": 0,
      "grasas": 23,
      "carbohidratos": 0
    },
    "verduras": {
      "kcal": 40,
      "kj": 167,
      "proteinas": 2,
      "grasas": 0,
      "carbohidratos": 8
    }
  },
  "TAC-014": {
    "mayonesa": {
      "kcal": 205,
      "kj": 858,
      "proteinas": 0,
      "grasas": 23,
      "carbohidratos": 0
    },
    "verduras": {
      "kcal": 35,
      "kj": 146,
      "proteinas": 2,
      "grasas": 0,
      "carbohidratos": 7
    }
  },
  "TAC-015": {
    "cebolla": {
      "kcal": 15,
      "kj": 63,
      "proteinas": 0,
      "grasas": 0,
      "carbohidratos": 3
    },
    "tomate": {
      "kcal": 15,
      "kj": 63,
      "proteinas": 1,
      "grasas": 0,
      "carbohidratos": 2
    }
  },
  "TAC-016": {
    "crutones": {
      "kcal": 145,
      "kj": 607,
      "proteinas": 2,
      "grasas": 9,
      "carbohidratos": 14
    },
    "anchoas": {
      "kcal": 5,
      "kj": 21,
      "proteinas": 1,
      "grasas": 0,
      "carbohidratos": 0
    },
    "parmesano": {
      "kcal": 65,
      "kj": 272,
      "proteinas": 5,
      "grasas": 4,
      "carbohidratos": 1
    },
    "huevo": {
      "kcal": 45,
      "kj": 188,
      "proteinas": 4,
      "grasas": 3,
      "carbohidratos": 0
    }
  },
  "TAC-017": {
    "crutones": {
      "kcal": 145,
      "kj": 607,
      "proteinas": 2,
      "grasas": 9,
      "carbohidratos": 14
    },
    "anchoas": {
      "kcal": 5,
      "kj": 21,
      "proteinas": 1,
      "grasas": 0,
      "carbohidratos": 0
    },
    "parmesano": {
      "kcal": 65,
      "kj": 272,
      "proteinas": 5,
      "grasas": 4,
      "carbohidratos": 1
    },
    "huevo": {
      "kcal": 45,
      "kj": 188,
      "proteinas": 4,
      "grasas": 3,
      "carbohidratos": 0
    }
  },
  "TAC-018": {
    "palta": {
      "kcal": 105,
      "kj": 439,
      "proteinas": 1,
      "grasas": 9,
      "carbohidratos": 5
    },
    "cebolla": {
      "kcal": 10,
      "kj": 42,
      "proteinas": 0,
      "grasas": 0,
      "carbohidratos": 2
    },
    "esparragos": {
      "kcal": 10,
      "kj": 42,
      "proteinas": 1,
      "grasas": 0,
      "carbohidratos": 1
    },
    "choclo": {
      "kcal": 45,
      "kj": 188,
      "proteinas": 1,
      "grasas": 0,
      "carbohidratos": 8
    },
    "tomate": {
      "kcal": 10,
      "kj": 42,
      "proteinas": 0,
      "grasas": 0,
      "carbohidratos": 2
    },
    "zanahoria": {
      "kcal": 10,
      "kj": 42,
      "proteinas": 0,
      "grasas": 0,
      "carbohidratos": 2
    }
  },
  "TAC-019": {
    "salsaCriolla": {
      "kcal": 30,
      "kj": 126,
      "proteinas": 1,
      "grasas": 2,
      "carbohidratos": 3
    }
  },
  "TAC-020": {
    "salsaCriolla": {
      "kcal": 30,
      "kj": 126,
      "proteinas": 1,
      "grasas": 2,
      "carbohidratos": 3
    }
  },
  "TAC-022": {
    "pasas": {
      "kcal": 35,
      "kj": 146,
      "proteinas": 0,
      "grasas": 0,
      "carbohidratos": 8
    },
    "aceitunas": {
      "kcal": 15,
      "kj": 63,
      "proteinas": 0,
      "grasas": 1,
      "carbohidratos": 1
    },
    "huevo": {
      "kcal": 70,
      "kj": 293,
      "proteinas": 6,
      "grasas": 5,
      "carbohidratos": 1
    },
    "cebolla": {
      "kcal": 15,
      "kj": 63,
      "proteinas": 0,
      "grasas": 0,
      "carbohidratos": 4
    },
    "queso": {
      "kcal": 55,
      "kj": 230,
      "proteinas": 4,
      "grasas": 4,
      "carbohidratos": 1
    }
  },
  "TAC-023": {
    "salsaBBQ": {
      "kcal": 90,
      "kj": 377,
      "proteinas": 1,
      "grasas": 0,
      "carbohidratos": 21
    }
  },
  "TAC-024": {
    "huevo": {
      "kcal": 35,
      "kj": 146,
      "proteinas": 3,
      "grasas": 3,
      "carbohidratos": 0
    },
    "aceitunas": {
      "kcal": 10,
      "kj": 42,
      "proteinas": 0,
      "grasas": 1,
      "carbohidratos": 0
    },
    "papa": {
      "kcal": 90,
      "kj": 377,
      "proteinas": 2,
      "grasas": 0,
      "carbohidratos": 20
    },
    "arroz": {
      "kcal": 195,
      "kj": 816,
      "proteinas": 4,
      "grasas": 3,
      "carbohidratos": 38
    }
  },
  "TAC-025": {
    "salsaCriolla": {
      "kcal": 40,
      "kj": 167,
      "proteinas": 1,
      "grasas": 2,
      "carbohidratos": 4
    },
    "arveja": {
      "kcal": 25,
      "kj": 105,
      "proteinas": 2,
      "grasas": 0,
      "carbohidratos": 4
    },
    "zanahoria": {
      "kcal": 10,
      "kj": 42,
      "proteinas": 0,
      "grasas": 0,
      "carbohidratos": 2
    }
  },
  "TAC-028": {
    "salsaCriolla": {
      "kcal": 45,
      "kj": 188,
      "proteinas": 1,
      "grasas": 3,
      "carbohidratos": 4
    },
    "chipsCamote": {
      "kcal": 345,
      "kj": 1443,
      "proteinas": 1,
      "grasas": 20,
      "carbohidratos": 41
    }
  },
  "TAC-029": {
    "pure": {
      "kcal": 140,
      "kj": 586,
      "proteinas": 3,
      "grasas": 5,
      "carbohidratos": 21
    },
    "pallares": {
      "kcal": 90,
      "kj": 377,
      "proteinas": 6,
      "grasas": 0,
      "carbohidratos": 16
    },
    "arroz": {
      "kcal": 195,
      "kj": 816,
      "proteinas": 4,
      "grasas": 3,
      "carbohidratos": 38
    }
  },
  "TAC-030": {
    "sopaSeca": {
      "kcal": 260,
      "kj": 1088,
      "proteinas": 7,
      "grasas": 8,
      "carbohidratos": 39
    }
  },
  "TAC-031": {
    "salsaVino": {
      "kcal": 35,
      "kj": 146,
      "proteinas": 1,
      "grasas": 2,
      "carbohidratos": 4
    }
  },
  "TAC-033": {
    "cebolla": {
      "kcal": 25,
      "kj": 105,
      "proteinas": 1,
      "grasas": 0,
      "carbohidratos": 6
    },
    "tomate": {
      "kcal": 10,
      "kj": 42,
      "proteinas": 0,
      "grasas": 0,
      "carbohidratos": 2
    },
    "papasFritas": {
      "kcal": 350,
      "kj": 1464,
      "proteinas": 4,
      "grasas": 18,
      "carbohidratos": 43
    },
    "arroz": {
      "kcal": 180,
      "kj": 753,
      "proteinas": 3,
      "grasas": 3,
      "carbohidratos": 35
    }
  },
  "TAC-034": {
    "pure": {
      "kcal": 175,
      "kj": 732,
      "proteinas": 3,
      "grasas": 6,
      "carbohidratos": 26
    },
    "arroz": {
      "kcal": 195,
      "kj": 816,
      "proteinas": 4,
      "grasas": 3,
      "carbohidratos": 38
    },
    "salsaVino": {
      "kcal": 60,
      "kj": 251,
      "proteinas": 2,
      "grasas": 3,
      "carbohidratos": 7
    }
  },
  "TAC-035": {
    "arroz": {
      "kcal": 195,
      "kj": 816,
      "proteinas": 4,
      "grasas": 3,
      "carbohidratos": 38
    }
  },
  "TAC-036": {
    "arroz": {
      "kcal": 195,
      "kj": 816,
      "proteinas": 4,
      "grasas": 3,
      "carbohidratos": 38
    },
    "salsaVino": {
      "kcal": 60,
      "kj": 251,
      "proteinas": 2,
      "grasas": 3,
      "carbohidratos": 7
    }
  },
  "TAC-037": {
    "huevo": {
      "kcal": 80,
      "kj": 335,
      "proteinas": 7,
      "grasas": 6,
      "carbohidratos": 1
    },
    "platano": {
      "kcal": 165,
      "kj": 690,
      "proteinas": 1,
      "grasas": 8,
      "carbohidratos": 22
    }
  },
  "TAC-038": {
    "salsaCriolla": {
      "kcal": 40,
      "kj": 167,
      "proteinas": 1,
      "grasas": 2,
      "carbohidratos": 4
    },
    "tartara": {
      "kcal": 170,
      "kj": 711,
      "proteinas": 0,
      "grasas": 18,
      "carbohidratos": 2
    },
    "papasFritas": {
      "kcal": 410,
      "kj": 1715,
      "proteinas": 5,
      "grasas": 21,
      "carbohidratos": 50
    }
  },
  "TAC-040": {
    "arroz": {
      "kcal": 280,
      "kj": 1172,
      "proteinas": 5,
      "grasas": 4,
      "carbohidratos": 55
    }
  },
  "TAC-041": {
    "papasFritas": {
      "kcal": 350,
      "kj": 1464,
      "proteinas": 4,
      "grasas": 18,
      "carbohidratos": 43
    }
  },
  "TAC-042": {
    "queso": {
      "kcal": 80,
      "kj": 335,
      "proteinas": 5,
      "grasas": 7,
      "carbohidratos": 0
    },
    "papasFritas": {
      "kcal": 350,
      "kj": 1464,
      "proteinas": 4,
      "grasas": 18,
      "carbohidratos": 43
    }
  },
  "TAC-043": {
    "pure": {
      "kcal": 110,
      "kj": 460,
      "proteinas": 2,
      "grasas": 4,
      "carbohidratos": 16
    },
    "arroz": {
      "kcal": 130,
      "kj": 544,
      "proteinas": 2,
      "grasas": 2,
      "carbohidratos": 25
    },
    "salsaVino": {
      "kcal": 35,
      "kj": 146,
      "proteinas": 1,
      "grasas": 2,
      "carbohidratos": 4
    }
  },
  "TAC-046": {
    "jamon": {
      "kcal": 100,
      "kj": 418,
      "proteinas": 14,
      "grasas": 4,
      "carbohidratos": 1
    }
  },
  "TAC-047": {
    "quesoAzul": {
      "kcal": 140,
      "kj": 586,
      "proteinas": 8,
      "grasas": 12,
      "carbohidratos": 1
    },
    "gouda": {
      "kcal": 175,
      "kj": 732,
      "proteinas": 13,
      "grasas": 14,
      "carbohidratos": 1
    },
    "parmesano": {
      "kcal": 125,
      "kj": 523,
      "proteinas": 11,
      "grasas": 9,
      "carbohidratos": 1
    }
  },
  "TAC-049": {
    "tocino": {
      "kcal": 215,
      "kj": 900,
      "proteinas": 15,
      "grasas": 17,
      "carbohidratos": 1
    },
    "salame": {
      "kcal": 200,
      "kj": 837,
      "proteinas": 11,
      "grasas": 17,
      "carbohidratos": 1
    },
    "carneMolida": {
      "kcal": 150,
      "kj": 628,
      "proteinas": 14,
      "grasas": 11,
      "carbohidratos": 0
    }
  },
  "TAC-050": {
    "cebolla": {
      "kcal": 15,
      "kj": 63,
      "proteinas": 0,
      "grasas": 0,
      "carbohidratos": 4
    },
    "papasFritas": {
      "kcal": 320,
      "kj": 1339,
      "proteinas": 4,
      "grasas": 17,
      "carbohidratos": 40
    },
    "salsaVino": {
      "kcal": 35,
      "kj": 146,
      "proteinas": 1,
      "grasas": 2,
      "carbohidratos": 4
    }
  },
  "TAC-051": {
    "chipsCamote": {
      "kcal": 295,
      "kj": 1234,
      "proteinas": 1,
      "grasas": 17,
      "carbohidratos": 35
    },
    "salsaCriolla": {
      "kcal": 30,
      "kj": 126,
      "proteinas": 1,
      "grasas": 2,
      "carbohidratos": 3
    }
  },
  "TAC-052": {
    "palta": {
      "kcal": 105,
      "kj": 439,
      "proteinas": 1,
      "grasas": 9,
      "carbohidratos": 5
    },
    "mayonesa": {
      "kcal": 170,
      "kj": 711,
      "proteinas": 0,
      "grasas": 19,
      "carbohidratos": 0
    }
  },
  "TAC-053": {
    "queso": {
      "kcal": 100,
      "kj": 418,
      "proteinas": 6,
      "grasas": 8,
      "carbohidratos": 0
    }
  },
  "TAC-054": {
    "queso": {
      "kcal": 100,
      "kj": 418,
      "proteinas": 6,
      "grasas": 8,
      "carbohidratos": 0
    },
    "tocino": {
      "kcal": 105,
      "kj": 439,
      "proteinas": 7,
      "grasas": 8,
      "carbohidratos": 0
    },
    "huevo": {
      "kcal": 80,
      "kj": 335,
      "proteinas": 7,
      "grasas": 6,
      "carbohidratos": 1
    }
  }
};

/** Códigos de los platos a los que se puede personalizar el pedido (entradas, principales, desayunos, kids y piqueos). */
export const PERSONALIZABLES: string[] = ["TAC-001","TAC-002","TAC-003","TAC-004","TAC-005","TAC-006","TAC-007","TAC-008","TAC-009","TAC-010","TAC-011","TAC-012","TAC-013","TAC-014","TAC-015","TAC-016","TAC-017","TAC-018","TAC-019","TAC-020","TAC-021","TAC-022","TAC-023","TAC-024","TAC-025","TAC-026","TAC-027","TAC-028","TAC-029","TAC-030","TAC-031","TAC-032","TAC-033","TAC-034","TAC-035","TAC-036","TAC-037","TAC-038","TAC-039","TAC-040","TAC-041","TAC-042","TAC-043","TAC-046","TAC-047","TAC-048","TAC-049","TAC-050","TAC-051","TAC-052","TAC-053","TAC-054"];
