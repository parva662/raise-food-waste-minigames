import { describe, it, expect } from 'vitest';
import {
  buildActualVsEstimatedSurplusInsight,
  buildCategoryAriaLabel,
  getCategoryOutcomeKind,
  SURPLUS_COMPARISON_TOLERANCE_GRAMS,
} from './forecastInterpretation';

describe('buildActualVsEstimatedSurplusInsight', () => {
  it('returns approximately-the-same message when values are within tolerance', () => {
    const message = buildActualVsEstimatedSurplusInsight(610, 610 + SURPLUS_COMPARISON_TOLERANCE_GRAMS);
    expect(message).toMatch(/approximately the same surplus/);
  });

  it('returns lower surplus message when estimated is below actual', () => {
    const message = buildActualVsEstimatedSurplusInsight(610, 260);
    expect(message).toMatch(/350 g less surplus/);
  });

  it('returns higher surplus message when estimated is above actual', () => {
    const message = buildActualVsEstimatedSurplusInsight(610, 860);
    expect(message).toMatch(/250 g more surplus/);
  });

  it('compares underlying numeric values, not formatted strings', () => {
    const message = buildActualVsEstimatedSurplusInsight(1000.4, 1000.9);
    expect(message).toMatch(/approximately the same surplus/);
  });
});

describe('category outcome helpers', () => {
  it('classifies shortage, surplus, and on-target outcomes', () => {
    expect(getCategoryOutcomeKind(0, 250)).toBe('shortage');
    expect(getCategoryOutcomeKind(300, 0)).toBe('surplus');
    expect(getCategoryOutcomeKind(0, 0)).toBe('on-target');
  });

  it('builds accessible aria labels with category name and outcome', () => {
    expect(buildCategoryAriaLabel('Main', 'surplus', 300)).toBe(
      'Main: estimated surplus 300 grams',
    );
    expect(buildCategoryAriaLabel('Soup', 'shortage', 250)).toBe(
      'Soup: estimated shortage 250 grams',
    );
    expect(buildCategoryAriaLabel('Dessert', 'on-target', 0)).toBe('Dessert: on target');
  });
});
