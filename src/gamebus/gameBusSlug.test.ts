import { describe, expect, it } from 'vitest';
import { readGameBusLinkedPropertySlug, readGameBusSlug } from './gameBusSlug';

describe('readGameBusSlug', () => {
  it('reads slug from GameBus template objects', () => {
    expect(readGameBusSlug({ slug: 'chefForecast', name: 'Chef forecast' })).toBe('chefForecast');
    expect(readGameBusSlug({ reference: 'legacy' })).toBeUndefined();
  });
});

describe('readGameBusLinkedPropertySlug', () => {
  it('prefers slug over ref on linked property entries', () => {
    expect(readGameBusLinkedPropertySlug({ slug: 'targetDate', ref: 'ignored' })).toBe('targetDate');
    expect(readGameBusLinkedPropertySlug({ ref: 'targetDate' })).toBe('targetDate');
  });
});
