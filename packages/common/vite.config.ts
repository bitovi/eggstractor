import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  define: {
    __DEV__: mode !== 'production',
  },
  test: {
    environment: 'node',
    globals: true,
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
  },
}));
