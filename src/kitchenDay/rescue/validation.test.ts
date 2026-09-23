import { describe, expect, it } from 'vitest';
import { canSaveRescueSuggestion, parseReusableWasteGrams, parseReuseDestination } from './validation';

describe('Rescue and Reuse validation', () => {
  it('accepts reusable amounts inside the Trim actual waste', () => {
    expect(parseReusableWasteGrams('0', 1000)).toEqual({ ok: true, value: 0 });
    expect(parseReusableWasteGrams('500', 1000).ok).toBe(true);
    expect(parseReusableWasteGrams('1000', 1000).ok).toBe(true);
    expect(parseReusableWasteGrams('1001', 1000).ok).toBe(false);
    expect(parseReusableWasteGrams('', 1000).ok).toBe(false);
  });

  it('requires non-empty free-text destination', () => {
    expect(parseReuseDestination('Carrot soup tomorrow').ok).toBe(true);
    expect(parseReuseDestination('Use in today\'s vegetable stock').ok).toBe(true);
    expect(parseReuseDestination('   ').ok).toBe(false);
  });

  it('blocks incomplete suggestions', () => {
    expect(
      canSaveRescueSuggestion({
        reusableRaw: '500',
        destinationRaw: '',
        actualWasteGrams: 1000,
      }),
    ).toBe(false);
    expect(
      canSaveRescueSuggestion({
        reusableRaw: '',
        destinationRaw: 'Stock',
        actualWasteGrams: 1000,
      }),
    ).toBe(false);
  });
});
