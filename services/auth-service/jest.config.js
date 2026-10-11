/** Configuración de Jest para el servicio de autenticación (TypeScript con ts-jest). */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/test/**/*.spec.ts'],
  // Los clientes de Prisma generados no se transforman
  transformIgnorePatterns: ['/node_modules/', '/generated/'],
};
