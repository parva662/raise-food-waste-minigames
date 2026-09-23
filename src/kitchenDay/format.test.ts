import { describe, expect, it } from 'vitest';
import {
  formatDurationFromMinutes,
  formatGrams,
  formatWastePercent,
} from './format';

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

  it('formats weights without raw floating-point output', () => {
    expect(formatGrams(300)).toBe('300 g');
    expect(formatGrams(1850)).toBe('1850 g');
    expect(String(formatGrams(17.647058823529413))).not.toContain('17.647058823529413');
  });
});
