import { describe, expect, it } from 'vitest';
import { SERVICE_CLOSEOUT_CONFIG } from '@/products/service-closeout/config';

describe('SERVICE_CLOSEOUT_CONFIG', () => {
  it('enables synthetic forecast fallback only in development/test builds', () => {
    // Vitest runs under Vite DEV. Production `vite build` sets import.meta.env.DEV=false.
    expect(SERVICE_CLOSEOUT_CONFIG.syntheticForecastFallbackEnabled).toBe(import.meta.env.DEV);
    if (import.meta.env.PROD) {
      expect(SERVICE_CLOSEOUT_CONFIG.syntheticForecastFallbackEnabled).toBe(false);
    }
  });
});
