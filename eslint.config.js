import tsParser   from '@typescript-eslint/parser';
import tsPlugin   from '@typescript-eslint/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks':        reactHooks,
      'react-refresh':      reactRefresh,
    },
    rules: {
      /* ── TypeScript type-aware rules ─────────────────────── */
      ...tsPlugin.configs['recommended-type-checked'].rules,
      ...tsPlugin.configs['stylistic-type-checked'].rules,

      /* ── React ───────────────────────────────────────────── */
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      /* ── Custom overrides ────────────────────────────────── */
      '@typescript-eslint/no-misused-promises':          'error',
      '@typescript-eslint/no-floating-promises':         'error',
      '@typescript-eslint/await-thenable':               'error',
      '@typescript-eslint/consistent-type-imports':      ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unnecessary-condition':     'warn',
      '@typescript-eslint/prefer-nullish-coalescing':    'error',
      '@typescript-eslint/prefer-optional-chain':        'error',
      '@typescript-eslint/no-explicit-any':              'error',
      '@typescript-eslint/explicit-function-return-type':['warn', { allowExpressions: true }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];
