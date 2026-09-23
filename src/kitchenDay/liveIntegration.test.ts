import { describe, expect, it } from 'vitest';
import { buildKitchenDayTrimSmartActivityMessage } from '../gamebus/buildKitchenDayTrimSmartActivityMessage';
import {
  KITCHEN_DAY_LIVE_BLOCK_REASON,
  canPostKitchenDayToGameBus,
} from './liveIntegration';
import { tryPostKitchenDayActivity } from './postKitchenDayActivity';
import type { KitchenDayTrimEntry } from './types';

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

describe('Kitchen Day live integration guard', () => {
  it('blocks embedded target posting until GameBus admin alignment', () => {
    expect(canPostKitchenDayToGameBus()).toBe(false);
    expect(tryPostKitchenDayActivity(buildKitchenDayTrimSmartActivityMessage(entry))).toEqual({
      ok: false,
      reason: KITCHEN_DAY_LIVE_BLOCK_REASON,
    });
  });
});
