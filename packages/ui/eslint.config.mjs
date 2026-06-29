import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  ...nx.configs['flat/react'],
  {
    files: ['src/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}'],
    // Override or add rules here
    rules: {},
  },
  {
    // Web Workers use `self` instead of `window`; allow it for worker files.
    files: ['src/**/*.worker.ts'],
    languageOptions: {
      globals: {
        self: 'readonly',
      },
    },
    rules: {
      'no-restricted-globals': 'off',
    },
  },
];
