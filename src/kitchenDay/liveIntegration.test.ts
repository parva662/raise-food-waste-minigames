/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ingestTaskForTests, resetGameBusBridgeForTests } from '../gamebus/bridge';
import { kitchenDayChefTaskFixture, kitchenDayTaskFixture } from '../gamebus/kitchenDayTaskFixtures';
import { mapKitchenDayTrimSmart, orderedKitchenDayTrimPropertyRefs } from '../gamebus/mapKitchenDayTrimSmart';
import { mapPortionPrecision, orderedPortionPrecisionPropertyRefs } from '../gamebus/mapPortionPrecision';
import { mapRescueAndReuse, orderedRescueAndReusePropertyRefs } from '../gamebus/mapRescueAndReuse';
import {
  KITCHEN_DAY_STUDENT_LIVE_BLOCK_REASON,
  KITCHEN_DAY_STUDENT_LIVE_INTEGRATION_READY,
  KITCHEN_DAY_TUTOR_LIVE_BLOCK_REASON,
  KITCHEN_DAY_TUTOR_LIVE_INTEGRATION_READY,
  canPostKitchenDayStudentActivity,
  canPostKitchenDayTutorReview,
} from './liveIntegration';
import {
  resetKitchenDayPostStateForTests,
  tryPostKitchenDayActivity,
  tryPostKitchenDayPortion,
  tryPostKitchenDayRescue,
  tryPostKitchenDayReview,
  tryPostKitchenDayTrim,
} from './postKitchenDayActivity';
import type {
  KitchenDayPortionEntry,
  KitchenDayRescueEntry,
  KitchenDayReviewEntry,
  KitchenDayTrimEntry,
} from './types';

const trimEntry: KitchenDayTrimEntry = {
  sessionId: 'kitchen-day:kitchen-day-task-1:user-1:2026-09-23',
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

const rescueEntry: KitchenDayRescueEntry = {
  sessionId: 'kitchen-day:kitchen-day-task-1:user-1:2026-09-23',
  sessionDate: '2026-09-23',
  ingredientId: 'carrot',
  reusableWasteGrams: 500,
  reuseDestination: 'Carrot soup tomorrow',
  submittedAt: '2026-09-23T10:10:00.000Z',
  source: 'local',
};

const portionEntry: KitchenDayPortionEntry = {
  sessionId: 'kitchen-day:kitchen-day-task-1:user-1:2026-09-23',
  sessionDate: '2026-09-23',
  submittedAt: '2026-09-23T11:00:00.000Z',
  recipeId: 'mayonnaise',
  recipeName: 'Mayonnaise',
  recipeComposition: [
    { ingredientId: 'yogurt', ingredientName: 'Yogurt', actualAmount: 1000, unit: 'g' },
  ],
  finalRecipeWeightGrams: 1850,
  source: 'local',
};

const reviewEntry: KitchenDayReviewEntry = {
  sessionId: 'kitchen-day:kitchen-day-task-1:user-1:2026-09-23',
  sessionDate: '2026-09-23',
  submittedAt: '2026-09-23T14:00:00.000Z',
  timeEfficiencyScore: 0,
  preparationQualityScore: 5,
  source: 'local',
};

function postedPropertyTemplates(message: { data: { properties: { template: string }[] } }) {
  return message.data.properties.map((property) => property.template);
}

describe('Kitchen Day split live integration gates', () => {
  beforeEach(() => {
    resetGameBusBridgeForTests();
    resetKitchenDayPostStateForTests();
  });

  afterEach(() => {
    resetGameBusBridgeForTests();
    resetKitchenDayPostStateForTests();
    vi.restoreAllMocks();
  });

  it('enables student posting and keeps tutor review blocked', () => {
    expect(KITCHEN_DAY_STUDENT_LIVE_INTEGRATION_READY).toBe(true);
    expect(KITCHEN_DAY_TUTOR_LIVE_INTEGRATION_READY).toBe(false);
    expect(canPostKitchenDayStudentActivity()).toBe(true);
    expect(canPostKitchenDayTutorReview()).toBe(false);
  });

  it('does not run a builder when the supplied gate is closed', () => {
    expect(
      tryPostKitchenDayActivity(
        kitchenDayChefTaskFixture,
        () => {
          throw new Error('builder must not run while this gate is closed');
        },
        'review:closed',
        false,
        KITCHEN_DAY_TUTOR_LIVE_BLOCK_REASON,
      ),
    ).toEqual({
      ok: false,
      reason: KITCHEN_DAY_TUTOR_LIVE_BLOCK_REASON,
    });
  });

  it('posts embedded Trim with the unchanged mapper payload', () => {
    ingestTaskForTests(kitchenDayTaskFixture);
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    const result = tryPostKitchenDayTrim(trimEntry);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.status).toBe('posted_awaiting_persist');
    expect(result.message.type).toBe('ACTIVITY');
    expect(result.message.data.template).toBe('trimSmart');
    expect(postedPropertyTemplates(result.message)).toEqual(orderedKitchenDayTrimPropertyRefs());
    expect(result.message.data.properties.map((property) => property.obj)).toEqual(
      orderedKitchenDayTrimPropertyRefs().map((ref) => mapKitchenDayTrimSmart(trimEntry)[ref]),
    );
    expect(postMessage).toHaveBeenCalledTimes(1);
  });

  it('posts embedded Rescue with the unchanged mapper payload', () => {
    ingestTaskForTests(kitchenDayTaskFixture);
    vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    const result = tryPostKitchenDayRescue(rescueEntry);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.message.data.template).toBe('rescueAndReuse');
    expect(postedPropertyTemplates(result.message)).toEqual(orderedRescueAndReusePropertyRefs());
    expect(result.message.data.properties.map((property) => property.obj)).toEqual(
      orderedRescueAndReusePropertyRefs().map((ref) => mapRescueAndReuse(rescueEntry)[ref]),
    );
  });

  it('posts embedded Portion with the unchanged mapper payload', () => {
    ingestTaskForTests(kitchenDayTaskFixture);
    vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    const result = tryPostKitchenDayPortion(portionEntry);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.message.data.template).toBe('portionPrecision');
    expect(postedPropertyTemplates(result.message)).toEqual(orderedPortionPrecisionPropertyRefs());
    expect(result.message.data.properties.map((property) => property.obj)).toEqual(
      orderedPortionPrecisionPropertyRefs().map((ref) => mapPortionPrecision(portionEntry)[ref]),
    );
  });

  it('blocks wastePracticeReview even when the tutor TASK is present', () => {
    ingestTaskForTests(kitchenDayChefTaskFixture);
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    expect(tryPostKitchenDayReview(reviewEntry)).toEqual({
      ok: false,
      reason: KITCHEN_DAY_TUTOR_LIVE_BLOCK_REASON,
    });
    expect(postMessage).not.toHaveBeenCalled();
  });

  it('does not post from standalone/local when no TASK is ingested', () => {
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    expect(tryPostKitchenDayTrim(trimEntry)).toEqual({ ok: false, reason: 'no_task' });
    expect(tryPostKitchenDayRescue(rescueEntry)).toEqual({ ok: false, reason: 'no_task' });
    expect(tryPostKitchenDayPortion(portionEntry)).toEqual({ ok: false, reason: 'no_task' });
    expect(tryPostKitchenDayReview(reviewEntry)).toEqual({
      ok: false,
      reason: KITCHEN_DAY_TUTOR_LIVE_BLOCK_REASON,
    });
    expect(postMessage).not.toHaveBeenCalled();
  });

  it('keeps student duplicate-attempt and TASK checks', () => {
    ingestTaskForTests(kitchenDayTaskFixture);
    vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    expect(tryPostKitchenDayTrim(trimEntry).ok).toBe(true);
    expect(tryPostKitchenDayTrim(trimEntry)).toEqual({ ok: false, reason: 'duplicate' });
    expect(tryPostKitchenDayRescue({ ...rescueEntry, ingredientId: 'unknown' }).ok).toBe(true);
  });

  it('does not expose student or tutor block tokens as LIVE E2E copy', () => {
    expect(KITCHEN_DAY_STUDENT_LIVE_BLOCK_REASON).toBe('student_live_blocked');
    expect(KITCHEN_DAY_TUTOR_LIVE_BLOCK_REASON).toBe('tutor_live_blocked');
    expect(KITCHEN_DAY_STUDENT_LIVE_BLOCK_REASON).not.toMatch(/LIVE E2E/i);
    expect(KITCHEN_DAY_TUTOR_LIVE_BLOCK_REASON).not.toMatch(/LIVE E2E/i);
  });
});
