/// <reference types='vitest' />
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => ({
  define: {
    __DEV__: mode !== 'production',
  },
  build: {
    // Avoid emptying the output since Figma will crash if the file is missing
    // between builds.
    emptyOutDir: false,
    target: 'es2017', // 👈 forces esbuild to rewrite object spread, etc.
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'figma',
      fileName: () => `index.js`,
      formats: ['iife'],
    },
    rollupOptions: {
      external: [], // ⬅ empty means "bundle everything"
      output: {
        // If you have any dynamic imports, inline them for a single file
        inlineDynamicImports: true,
      },
    },
  },
  test: {
    environment: 'node',
    globals: true,
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
  },
}));
