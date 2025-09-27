/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ mode }) => {
  const isDev = mode !== 'production';
  return {
    define: {
      __DEV__: isDev,
    },
    root: __dirname,
    cacheDir: '../../node_modules/.vite/packages/ui',
    base: './',
    server: {
      port: 4200,
      host: 'localhost',
    },
    preview: {
      port: 4300,
      host: 'localhost',
    },
    plugins: [
      react(),
      // Figma requires the ui to only be html and css. All javascript must be
      // inlined.
      viteSingleFile(),
    ],
    css: {
      // show CSS in devtools while developing
      devSourcemap: isDev,
    },
    build: {
      outDir: './dist',
      // Avoid emptying the output since Figma will crash if the file is missing
      // between builds.
      emptyOutDir: false,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      sourcemap: isDev ? 'inline' : false,
      cssMinify: !isDev,
    },
    esbuild: {
      sourcemap: isDev,
      keepNames: isDev,
    },
    test: {
      name: '@eggstractor/ui',
      watch: false,
      globals: true,
      environment: 'jsdom',
      include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      reporters: ['default'],
      coverage: {
        reportsDirectory: './test-output/vitest/coverage',
        provider: 'v8' as const,
      },
    },
  };
});
