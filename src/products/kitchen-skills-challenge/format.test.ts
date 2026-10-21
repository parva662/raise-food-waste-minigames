import { describe, expect, it } from 'vitest';
import {
  formatDeltaPercentagePoints,
  formatDurationFromMinutes,
  formatGrams,
  formatRecipeAmount,
  formatReferenceDelta,
  formatWastePercent,
} from '@/products/kitchen-skills-challenge/format';

describe('Kitchen Day numeric formatting', () => {
  it('rounds waste percent to one decimal place', () => {
    expect(formatWastePercent(17.647058823529413)).toBe('17.6%');
    expect(formatWastePercent(9)).toBe('9.0%');
    expect(formatWastePercent(12)).toBe('12.0%');
  });

  it('humanizes duration from minutes', () => {
    expect(formatDurationFromMinutes(10 / 60)).toBe('10 sec');
    expect(formatDurationFromMinutes(1 + 24 / 60)).toBe('1 min 24 sec');
    expect(formatDurationFromMinutes(3 + 5 / 60)).toBe('3 min 5 sec');
    expect(formatDurationFromMinutes(3)).toBe('3 min');
    expect(formatDurationFromMinutes(0.17281666666666667)).toBe('10 sec');
  });

  it('formats reference comparison as human-readable points', () => {
    expect(formatReferenceDelta(4.5, 15)).toBe('10.5 percentage points below reference');
    expect(formatReferenceDelta(17.6, 12)).toBe('5.6 percentage points above reference');
    expect(formatReferenceDelta(12, 12)).toBe('at reference');
    expect(formatDeltaPercentagePoints(-1.9, 'short')).toBe('1.9 pp below reference');
    expect(formatDeltaPercentagePoints(0.8, 'short')).toBe('0.8 pp above reference');
  });

  it('formats weights in grams until they pass 1000 g', () => {
    expect(formatGrams(0)).toBe('0 g');
    expect(formatGrams(300)).toBe('300 g');
    expect(formatGrams(999)).toBe('999 g');
    expect(formatGrams(1000)).toBe('1000 g');
    expect(formatGrams(1001)).toBe('1.001 kg');
    expect(formatGrams(1250)).toBe('1.25 kg');
    expect(formatGrams(1850)).toBe('1.85 kg');
    expect(formatGrams(2000)).toBe('2 kg');
    expect(String(formatGrams(17.647058823529413))).not.toContain('17.647058823529413');
  });

  it('leaves volume amounts in their recorded unit', () => {
    expect(formatRecipeAmount(2.5, 'dL')).toBe('2.5 dL');
    expect(formatRecipeAmount(1, 'L')).toBe('1 L');
    expect(formatRecipeAmount(1250, 'g')).toBe('1.25 kg');
  });
});
