import baseConfig from '../../eslint.config.mjs';
import figmaPlugin from '@figma/eslint-plugin-figma-plugins';
import tsParser from '@typescript-eslint/parser';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url));

export default [
  // your workspace base config first
  ...baseConfig,

  // use the fork's flat preset directly
  figmaPlugin.flatConfigs.recommended,
  {
    files: ['vite.config.*', 'vitest.config.*', 'eslint.config.*'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        // Turn off TS-ESLint program for these files
        project: null,
        projectService: false,
      },
    },
    rules: {}, // keep plain linting only
  },
  // package-specific TS parser + project settings
  {
    files: ['src/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true, // 👈 auto-detect tsconfigs
        tsconfigRootDir,
      },
    },
    rules: {
      // Add any local overrides here if you want
      // e.g. '@figma/figma-plugins/ban-deprecated-id-params': 'error',
    },
  },
  {
    files: ['src/**/*.{test,jest}.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.test.json', // path is relative to this config file
        tsconfigRootDir, // must be a string path
      },
    },
    rules: {},
  },
];
