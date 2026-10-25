import { describe, expect, it } from 'vitest';
import {
  isShortReuseDestination,
  rescueSummaryLine,
  reuseDestinationPreview,
  trimSummaryDetail,
} from '@/products/kitchen-skills-challenge/domain/attemptSummary';
import type { KitchenSkillsRescueEntry, KitchenSkillsTrimEntry } from '@/products/kitchen-skills-challenge/domain/types';

const trim: KitchenSkillsTrimEntry = {
  sessionId: 's',
  sessionDate: '2026-10-21',
  submittedAt: '2026-10-21T10:00:00.000Z',
  recipeId: '42',
  ingredientId: 'banaani',
  ingredientName: 'Banaani',
  ingredientWeightGrams: 1500,
  trimTechniques: 'peeling',
  estimatedWasteGrams: 300,
  actualWasteGrams: 260,
  durationMinutes: 1 + 24 / 60,
  preparationStartedAt: '2026-10-21T10:00:00.000Z',
  preparationEndedAt: '2026-10-21T10:01:24.000Z',
  source: 'local',
};

const rescue = (destination: string, grams = 400): KitchenSkillsRescueEntry => ({
  sessionId: 's',
  sessionDate: '2026-10-21',
  recipeId: '42',
  ingredientId: 'appelsiini',
  reusableWasteGrams: grams,
  reuseDestination: destination,
  submittedAt: '2026-10-21T10:05:00.000Z',
  source: 'local',
});

describe('Kitchen Skills attempt summary copy', () => {
  it('shows actual waste and duration for a Trim ingredient', () => {
    expect(trimSummaryDetail(trim)).toBe('260 g waste · 1 min 24 sec');
  });

  it('uses "to X" only for a short destination phrase', () => {
    expect(isShortReuseDestination('cake')).toBe(true);
    expect(isShortReuseDestination('staff soup')).toBe(true);
    expect(isShortReuseDestination('Wash the peel, dry it, then use it in cake.')).toBe(false);
    const orangeTrim: KitchenSkillsTrimEntry = { ...trim, ingredientId: 'appelsiini', ingredientName: 'Appelsiini' };
    expect(rescueSummaryLine(rescue('cake'), [orangeTrim])).toEqual({
      ingredientName: 'Appelsiini',
      detail: '400 g to cake',
      preview: null,
      fullDestination: 'cake',
    });
  });

  it('does not invent a destination from a longer preparation method', () => {
    const text = 'Wash the peel, dry it, then use it in cake.';
    const line = rescueSummaryLine(rescue(text), []);
    expect(line.detail).toBe('400 g reused');
    expect(line.preview).toBe(reuseDestinationPreview(text));
    expect(line.fullDestination).toBe(text);
    expect(line.preview).not.toBe('cake');
  });
});
