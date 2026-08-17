import { describe, expect, it } from 'vitest';
import { SERVICE_CLOSEOUT_CONFIG } from './serviceCloseout';

describe('SERVICE_CLOSEOUT_CONFIG', () => {
  it('enables synthetic forecast fallback for the current RAISE test phase', () => {
    expect(SERVICE_CLOSEOUT_CONFIG.syntheticForecastFallbackEnabled).toBe(true);
  });
});
