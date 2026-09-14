import { describe, expect, it } from 'vitest';
import { summarizeTrimSmartSession } from './sessionSummary';
import type { TrimSmartSubmission } from './types';

function entry(partial: Partial<TrimSmartSubmission> & Pick<TrimSmartSubmission, 'ingredientName'>): TrimSmartSubmission {
  return {
    sessionId: 'trim-smart:standalone:2026-09-14',
    sessionDate: '2026-09-14',
    ingredientCategory: 'vegetables',
    ingredientId: partial.ingredientName.toLowerCase(),
    ingredientName: partial.ingredientName,
    ingredientWeightGrams: partial.ingredientWeightGrams ?? 1000,
    participantWasteGrams: partial.participantWasteGrams ?? 0,
    practice: partial.practice ?? 'standard_practice',
    submittedAt: partial.submittedAt ?? '2026-09-14T10:00:00.000Z',
  };
}

describe('summarizeTrimSmartSession', () => {
  it('sums ingredient count, starting weight, and participant preparation waste', () => {
    const summary = summarizeTrimSmartSession([
      entry({ ingredientName: 'Carrot', ingredientWeightGrams: 1000, participantWasteGrams: 85 }),
      entry({ ingredientName: 'Onion', ingredientWeightGrams: 600, participantWasteGrams: 72 }),
      entry({ ingredientName: 'Potato', ingredientWeightGrams: 1500, participantWasteGrams: 110 }),
    ]);
    expect(summary.ingredientCount).toBe(3);
    expect(summary.totalStartingWeightGrams).toBe(3100);
    expect(summary.totalPreparationWasteGrams).toBe(267);
  });
});
