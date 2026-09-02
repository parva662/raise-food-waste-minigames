import { describe, expect, it } from 'vitest';
import { formatMeasuredGrams } from './displayFormat';

describe('formatMeasuredGrams', () => {
  it('formats grams with thousands separator and no kg conversion', () => {
    expect(formatMeasuredGrams(1140)).toBe('1,140 g');
    expect(formatMeasuredGrams(500)).toBe('500 g');
    expect(formatMeasuredGrams(20)).toBe('20 g');
  });
});
