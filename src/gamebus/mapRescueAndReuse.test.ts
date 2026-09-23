import { describe, expect, it } from 'vitest';
import { mapRescueAndReuse, orderedRescueAndReusePropertyRefs } from './mapRescueAndReuse';

describe('Rescue and Reuse mapper contract', () => {
  it('posts only the target join and suggestion fields', () => {
    expect(orderedRescueAndReusePropertyRefs()).toEqual([
      'sessionId',
      'sessionDate',
      'ingredientId',
      'reusableWasteGrams',
      'reuseDestination',
      'submittedAt',
    ]);
    const values = mapRescueAndReuse({
      sessionId: 'kitchen-day:standalone:2026-09-23',
      sessionDate: '2026-09-23',
      ingredientId: 'carrot',
      reusableWasteGrams: 500,
      reuseDestination: 'Carrot soup tomorrow',
      submittedAt: '2026-09-23T10:10:00.000Z',
    });
    expect(Object.keys(values)).toEqual([...orderedRescueAndReusePropertyRefs()]);
    expect(values).not.toHaveProperty('ingredientName');
    expect(values).not.toHaveProperty('ingredientCategory');
    expect(values).not.toHaveProperty('ingredientWeightGrams');
    expect(values).not.toHaveProperty('sourceActivityId');
    expect(values).not.toHaveProperty('preparationEntryId');
    expect(values).not.toHaveProperty('discardedWasteGrams');
  });
});
