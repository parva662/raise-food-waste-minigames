/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ingestTaskForTests, resetGameBusBridgeForTests } from '@/platform/gamebus/bridge';
import { kitchenSkillsTrainerTaskFixture, kitchenSkillsTaskFixture } from '@/products/kitchen-skills-challenge/gamebus/kitchenSkillsTaskFixtures';
import { mapKitchenSkillsTrimSmart, orderedKitchenSkillsTrimPropertyRefs } from '@/products/kitchen-skills-challenge/gamebus/mapKitchenSkillsTrimSmart';
import { mapPortionPrecision, orderedPortionPrecisionPropertyRefs } from '@/products/kitchen-skills-challenge/gamebus/mapPortionPrecision';
import { mapRescueAndReuse, orderedRescueAndReusePropertyRefs } from '@/products/kitchen-skills-challenge/gamebus/mapRescueAndReuse';
import { mapWastePracticeReview, orderedWastePracticeReviewPropertyRefs } from '@/products/kitchen-skills-challenge/gamebus/mapWastePracticeReview';
import {
  KITCHEN_SKILLS_STUDENT_LIVE_BLOCK_REASON,
  KITCHEN_SKILLS_STUDENT_LIVE_INTEGRATION_READY,
  KITCHEN_SKILLS_TRAINER_LIVE_BLOCK_REASON,
  KITCHEN_SKILLS_TRAINER_LIVE_INTEGRATION_READY,
  canPostKitchenSkillsStudentActivity,
  canPostKitchenSkillsTrainerReview,
} from '@/products/kitchen-skills-challenge/gamebus/liveIntegration';
import {
  resetKitchenSkillsPostStateForTests,
  tryPostKitchenSkillsActivity,
  tryPostKitchenSkillsPortion,
  tryPostKitchenSkillsRescue,
  tryPostKitchenSkillsReview,
  tryPostKitchenSkillsTrim,
} from '@/products/kitchen-skills-challenge/gamebus/postActivity';
import type {
  KitchenSkillsPortionEntry,
  KitchenSkillsRescueEntry,
  KitchenSkillsReviewEntry,
  KitchenSkillsTrimEntry,
} from '@/products/kitchen-skills-challenge/domain/types';

const trimEntry: KitchenSkillsTrimEntry = {
  sessionId: 'kitchen-day:kitchen-day-task-1:user-1:2026-09-23',
  sessionDate: '2026-09-23',
  submittedAt: '2026-09-23T10:05:00.000Z',
  ingredientId: 'carrot',
  ingredientName: 'Carrot',
  ingredientWeightGrams: 5000,
  trimTechniques: 'trimming',
  estimatedWasteGrams: 600,
  actualWasteGrams: 450,
  durationMinutes: 3,
  preparationStartedAt: '2026-09-23T10:00:00.000Z',
  preparationEndedAt: '2026-09-23T10:03:00.000Z',
  source: 'local',
};

const rescueEntry: KitchenSkillsRescueEntry = {
  sessionId: 'kitchen-day:kitchen-day-task-1:user-1:2026-09-23',
  sessionDate: '2026-09-23',
  ingredientId: 'carrot',
  reusableWasteGrams: 500,
  reuseDestination: 'Carrot soup tomorrow',
  submittedAt: '2026-09-23T10:10:00.000Z',
  source: 'local',
};

const portionEntry: KitchenSkillsPortionEntry = {
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

const reviewEntry: KitchenSkillsReviewEntry = {
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
    resetKitchenSkillsPostStateForTests();
  });

  afterEach(() => {
    resetGameBusBridgeForTests();
    resetKitchenSkillsPostStateForTests();
    vi.restoreAllMocks();
  });

  it('enables student posting and trainer review posting', () => {
    expect(KITCHEN_SKILLS_STUDENT_LIVE_INTEGRATION_READY).toBe(true);
    expect(KITCHEN_SKILLS_TRAINER_LIVE_INTEGRATION_READY).toBe(true);
    expect(canPostKitchenSkillsStudentActivity()).toBe(true);
    expect(canPostKitchenSkillsTrainerReview()).toBe(true);
  });

  it('does not run a builder when the supplied gate is closed', () => {
    expect(
      tryPostKitchenSkillsActivity(
        kitchenSkillsTrainerTaskFixture,
        () => {
          throw new Error('builder must not run while this gate is closed');
        },
        'review:closed',
        false,
        KITCHEN_SKILLS_TRAINER_LIVE_BLOCK_REASON,
      ),
    ).toEqual({
      ok: false,
      reason: KITCHEN_SKILLS_TRAINER_LIVE_BLOCK_REASON,
    });
  });

  it('posts embedded Trim with the unchanged mapper payload', () => {
    ingestTaskForTests(kitchenSkillsTaskFixture);
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    const result = tryPostKitchenSkillsTrim(trimEntry);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.status).toBe('posted_awaiting_persist');
    expect(result.message.type).toBe('SILENT_ACTIVITY');
    expect(result.message.data.template).toBe('trimSmart');
    expect(postedPropertyTemplates(result.message)).toEqual(orderedKitchenSkillsTrimPropertyRefs());
    expect(postedPropertyTemplates(result.message)).not.toContain('ingredientCategory');
    expect(result.message.data.properties.map((property) => property.obj)).toEqual(
      orderedKitchenSkillsTrimPropertyRefs().map((ref) => mapKitchenSkillsTrimSmart(trimEntry)[ref]),
    );
    expect(postMessage).toHaveBeenCalledTimes(1);
  });

  it('posts embedded Rescue with the unchanged mapper payload', () => {
    ingestTaskForTests(kitchenSkillsTaskFixture);
    vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    const result = tryPostKitchenSkillsRescue(rescueEntry);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.message.type).toBe('SILENT_ACTIVITY');
    expect(result.message.data.template).toBe('rescueAndReuse');
    expect(postedPropertyTemplates(result.message)).toEqual(orderedRescueAndReusePropertyRefs());
    expect(result.message.data.properties.map((property) => property.obj)).toEqual(
      orderedRescueAndReusePropertyRefs().map((ref) => mapRescueAndReuse(rescueEntry)[ref]),
    );
  });

  it('posts embedded Portion with the unchanged mapper payload', () => {
    ingestTaskForTests(kitchenSkillsTaskFixture);
    vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    const result = tryPostKitchenSkillsPortion(portionEntry);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.message.type).toBe('SILENT_ACTIVITY');
    expect(result.message.data.template).toBe('portionPrecision');
    expect(postedPropertyTemplates(result.message)).toEqual(orderedPortionPrecisionPropertyRefs());
    expect(result.message.data.properties.map((property) => property.obj)).toEqual(
      orderedPortionPrecisionPropertyRefs().map((ref) => mapPortionPrecision(portionEntry)[ref]),
    );
  });

  it('posts wastePracticeReview as SILENT_ACTIVITY for the selected student actor', () => {
    ingestTaskForTests(kitchenSkillsTrainerTaskFixture);
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    const result = tryPostKitchenSkillsReview(reviewEntry, 'user-1');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.message.type).toBe('SILENT_ACTIVITY');
    expect(result.message.data.template).toBe('wastePracticeReview');
    expect(result.message.data.actors).toEqual(['user-1']);
    expect(result.message.data.start).toBe(reviewEntry.submittedAt);
    expect(result.message.data.end).toBe(reviewEntry.submittedAt);
    expect(postedPropertyTemplates(result.message)).toEqual([
      'sessionId',
      'sessionDate',
      'submittedAt',
      'timeEfficiencyScore',
      'preparationQualityScore',
    ]);
    expect(postedPropertyTemplates(result.message)).not.toContain('studentId');
    expect(result.message.data.properties.map((property) => property.obj)).toEqual(
      orderedWastePracticeReviewPropertyRefs(reviewEntry).map(
        (ref) => mapWastePracticeReview(reviewEntry)[ref],
      ),
    );
    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith(result.message, '*');
    expect(postMessage.mock.calls.some((call) => call[0] && (call[0] as { type?: string }).type === 'EXIT')).toBe(
      false,
    );
    expect(postMessage.mock.calls.some((call) => call[0] && (call[0] as { type?: string }).type === 'ACTIVITY')).toBe(
      false,
    );
  });

  it('rejects a second wastePracticeReview for the same session', () => {
    ingestTaskForTests(kitchenSkillsTrainerTaskFixture);
    vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    expect(tryPostKitchenSkillsReview(reviewEntry, 'user-1').ok).toBe(true);
    expect(tryPostKitchenSkillsReview(reviewEntry, 'user-1')).toEqual({ ok: false, reason: 'duplicate' });
  });

  it('does not post a review without a selected student actor id', () => {
    ingestTaskForTests(kitchenSkillsTrainerTaskFixture);
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    expect(tryPostKitchenSkillsReview(reviewEntry, '  ')).toEqual({
      ok: false,
      reason: 'missing_student_actor',
    });
    expect(postMessage).not.toHaveBeenCalled();
  });

  it('does not post from standalone/local when no TASK is ingested', () => {
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    expect(tryPostKitchenSkillsTrim(trimEntry)).toEqual({ ok: false, reason: 'no_task' });
    expect(tryPostKitchenSkillsRescue(rescueEntry)).toEqual({ ok: false, reason: 'no_task' });
    expect(tryPostKitchenSkillsPortion(portionEntry)).toEqual({ ok: false, reason: 'no_task' });
    expect(tryPostKitchenSkillsReview(reviewEntry, 'user-1')).toEqual({ ok: false, reason: 'no_task' });
    expect(postMessage).not.toHaveBeenCalled();
  });

  it('keeps student duplicate-attempt and TASK checks', () => {
    ingestTaskForTests(kitchenSkillsTaskFixture);
    vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    expect(tryPostKitchenSkillsTrim(trimEntry).ok).toBe(true);
    expect(tryPostKitchenSkillsTrim(trimEntry)).toEqual({ ok: false, reason: 'duplicate' });
    expect(tryPostKitchenSkillsRescue({ ...rescueEntry, ingredientId: 'unknown' }).ok).toBe(true);
  });

  it('does not expose student or tutor block tokens as LIVE E2E copy', () => {
    expect(KITCHEN_SKILLS_STUDENT_LIVE_BLOCK_REASON).toBe('student_live_blocked');
    expect(KITCHEN_SKILLS_TRAINER_LIVE_BLOCK_REASON).toBe('tutor_live_blocked');
    expect(KITCHEN_SKILLS_STUDENT_LIVE_BLOCK_REASON).not.toMatch(/LIVE E2E/i);
    expect(KITCHEN_SKILLS_TRAINER_LIVE_BLOCK_REASON).not.toMatch(/LIVE E2E/i);
  });
});
