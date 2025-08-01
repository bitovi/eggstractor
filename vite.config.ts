import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ mode }) => {
  const isUI = process.env.BUILD_UI === 'true';

  const baseConfig = {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@ui': path.resolve(__dirname, './src/ui'),
        '@processors': path.resolve(__dirname, './src/processors'),
        '@services': path.resolve(__dirname, './src/services'),
        '@transformers': path.resolve(__dirname, './src/transformers'),
        '@types': path.resolve(__dirname, './src/types'),
        '@utils': path.resolve(__dirname, './src/utils'),
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
  };

  if (isUI) {
    // UI build configuration with inline CSS/JS
    return {
      ...baseConfig,
      plugins: [
        react({
          jsxRuntime: 'classic',
        }),
        viteSingleFile(),
      ],
      build: {
        target: 'es2017', // Compatible with Figma's JavaScript engine
        outDir: 'dist-ui',
        minify: false,
        rollupOptions: {
          input: './src/ui/index.html',
          output: {
            entryFileNames: 'ui.js',
            assetFileNames: '[name][extname]',
          },
        },
        sourcemap: mode === 'development',
      },
    };
  }

  // Code build configuration (main thread)
  return {
    ...baseConfig,
    plugins: [],
    build: {
      target: 'es2017', // Compatible with Figma's JavaScript engine
      outDir: 'dist',
      minify: false,
      lib: {
        entry: './src/code.ts',
        name: 'code',
        fileName: 'code',
        formats: ['iife'],
      },
      rollupOptions: {
        output: {
          extend: true,
        },
      },
      sourcemap: mode === 'development',
    },
  };
});
