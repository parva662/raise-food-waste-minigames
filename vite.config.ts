/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/raise-food-waste-minigames/' : '/',
  plugins: [react()],
  test: {
    environment: 'node',
  },
}));
