/// <reference types='vitest' />
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const isDev = mode !== 'production';
  return {
    define: {
      __DEV__: isDev,
    },
    root: __dirname,
    cacheDir: '../../node_modules/.vite/packages/figma',
    base: './',
    build: {
      // Avoid emptying the output since Figma will crash if the file is missing
      // between builds.
      emptyOutDir: false,
      // Forces esbuild to rewrite object spread, etc.
      // This is needed for Figma's JS environment.
      target: 'es2017',
      sourcemap: isDev ? 'inline' : false,
      minify: isDev ? false : 'esbuild',
      lib: {
        entry: path.resolve(__dirname, 'src/index.ts'),
        name: 'figma',
        fileName: () => `index.js`,
        formats: ['iife'],
      },
      rollupOptions: {
        external: [], // ⬅ empty means "bundle everything"
        output: {
          // Inline dynamic imports for a single file
          inlineDynamicImports: true,
        },
      },
    },
    esbuild: {
      sourcemap: isDev,
      keepNames: isDev,
    },
    test: {
      environment: 'node',
      globals: true,
      typecheck: {
        tsconfig: './tsconfig.test.json',
      },
    },
  };
});
