import { describe, expect, it } from 'vitest';
import { mapTrimSmart, orderedTrimSmartPropertyRefs } from './mapTrimSmart';
import type { TrimSmartSubmission } from '../trimSmart/types';

const submission: TrimSmartSubmission = {
  sessionId: 'session-001',
  sessionDate: '2026-09-14',
  ingredientCategory: 'vegetables',
  ingredientId: 'carrot',
  ingredientName: 'Carrot',
  ingredientWeightGrams: 1000,
  participantWasteGrams: 125,
  practice: 'careful_trimming',
  submittedAt: '2026-09-14T10:00:00.000Z',
};

describe('mapTrimSmart', () => {
  it('uses canonical property order', () => {
    expect(orderedTrimSmartPropertyRefs()).toEqual([
      'sessionId',
      'sessionDate',
      'ingredientCategory',
      'ingredientId',
      'ingredientName',
      'ingredientWeightGrams',
      'participantWasteGrams',
      'practice',
      'submittedAt',
    ]);
  });

  it('maps values without participant identity fields', () => {
    const values = mapTrimSmart(submission);
    expect(values.participantWasteGrams).toEqual({ value: 125 });
    expect(values.practice).toEqual({ value: 'careful_trimming' });
    expect(values).not.toHaveProperty('participantId');
    expect(values).not.toHaveProperty('chefPerformanceScore');
    expect(values).not.toHaveProperty('sessionCategoryWasteGrams');
  });
});
