// Configuración de ESLint (formato "flat", obligatorio desde ESLint 9) para todo el monorepo.
// Los servicios la usan automáticamente: `eslint "{src,test}/**/*.ts"` busca este archivo hacia arriba.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/generated/**', '**/node_modules/**', '**/coverage/**', '**/.turbo/**', '**/uploads/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
    },
    rules: {
      // Los servicios NestJS usan DTO con decoradores y `any` en los puntos de integración
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      // Variables sin uso: aviso (no error); se permiten las que empiezan con guion bajo
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
);
