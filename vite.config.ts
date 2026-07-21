/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/raise-food-waste-minigames/' : '/',
  plugins: [react()],
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: [
        'src/services/**/*.ts',
        'src/repositories/**/*.ts',
        'src/utils/**/*.ts',
        'src/hooks/**/*.ts',
      ],
      exclude: ['**/*.test.ts', '**/*.test.tsx', 'src/test/**'],
    },
  },
}));
