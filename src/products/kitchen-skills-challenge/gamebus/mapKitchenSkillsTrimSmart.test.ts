import { describe, expect, it } from 'vitest';
import { buildKitchenSkillsTrimSmartActivityMessage } from '@/products/kitchen-skills-challenge/gamebus/buildKitchenSkillsTrimSmartActivityMessage';
import { kitchenSkillsTaskFixture } from '@/products/kitchen-skills-challenge/gamebus/kitchenSkillsTaskFixtures';
import { mapKitchenSkillsTrimSmart, orderedKitchenSkillsTrimPropertyRefs } from '@/products/kitchen-skills-challenge/gamebus/mapKitchenSkillsTrimSmart';
import type { KitchenSkillsTrimEntry } from '@/products/kitchen-skills-challenge/domain/types';

const entry: KitchenSkillsTrimEntry = {
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
  source: 'local',
};

describe('Kitchen Day Trim mapper contract', () => {
  it('posts the exact target property set', () => {
    expect(orderedKitchenSkillsTrimPropertyRefs()).toEqual([
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
    const values = mapKitchenSkillsTrimSmart(entry);
    expect(values.ingredientCategory).toEqual({ value: 'root' });
    expect(values.ingredientWeightGrams).toEqual({ value: 5000 });
    expect(values.trimTechniques).toEqual({ value: 'trimming' });
    expect(values.duration).toEqual({ value: 3, unit: 'minutes' });
    expect(values).not.toHaveProperty('practice');
    expect(values).not.toHaveProperty('participantWasteGrams');
    expect(values).not.toHaveProperty('wastePercentage');
  });

  it('uses the real preparation interval for ACTIVITY start and end', () => {
    const message = buildKitchenSkillsTrimSmartActivityMessage(kitchenSkillsTaskFixture, entry);
    expect(message.data.start).toBe(entry.preparationStartedAt);
    expect(message.data.end).toBe(entry.preparationEndedAt);
    expect(message.data.template).toBe('trimSmart');
  });
});
