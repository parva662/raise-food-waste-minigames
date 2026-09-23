import { describe, expect, it } from 'vitest';
import { buildKitchenDayTrimSmartActivityMessage } from './buildKitchenDayTrimSmartActivityMessage';
import { mapKitchenDayTrimSmart, orderedKitchenDayTrimPropertyRefs } from './mapKitchenDayTrimSmart';
import type { KitchenDayTrimEntry } from '../kitchenDay/types';

const entry: KitchenDayTrimEntry = {
  sessionId: 'kitchen-day:standalone:2026-09-23',
  sessionDate: '2026-09-23',
  submittedAt: '2026-09-23T10:05:00.000Z',
  ingredientId: 'carrot',
  ingredientName: 'Carrot',
  ingredientCategory: 'root',
  ingredientWeightGrams: 5000,
  trimTechniques: 'trimming',
  estimatedWasteGrams: 600,
  actualWasteGrams: 450,
  durationMinutes: 3,
  preparationStartedAt: '2026-09-23T10:00:00.000Z',
  preparationEndedAt: '2026-09-23T10:03:00.000Z',
};

describe('Kitchen Day Trim mapper contract', () => {
  it('posts the exact target property set', () => {
    expect(orderedKitchenDayTrimPropertyRefs()).toEqual([
      'sessionId',
      'sessionDate',
      'submittedAt',
      'ingredientId',
      'ingredientName',
      'ingredientCategory',
      'ingredientWeightGrams',
      'trimTechniques',
      'estimatedWasteGrams',
      'actualWasteGrams',
      'duration',
    ]);
    const values = mapKitchenDayTrimSmart(entry);
    expect(values.ingredientCategory).toEqual({ value: 'root' });
    expect(values.ingredientWeightGrams).toEqual({ value: 5000 });
    expect(values.trimTechniques).toEqual({ value: 'trimming' });
    expect(values.duration).toEqual({ value: 3, unit: 'minutes' });
    expect(values).not.toHaveProperty('practice');
    expect(values).not.toHaveProperty('participantWasteGrams');
    expect(values).not.toHaveProperty('wastePercentage');
  });

  it('uses the real preparation interval for ACTIVITY start and end', () => {
    const message = buildKitchenDayTrimSmartActivityMessage(entry);
    expect(message.data.start).toBe(entry.preparationStartedAt);
    expect(message.data.end).toBe(entry.preparationEndedAt);
    expect(message.data.template).toBe('trimSmart');
  });
});
