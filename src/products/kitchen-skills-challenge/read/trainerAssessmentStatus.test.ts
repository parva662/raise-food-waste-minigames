import { describe, expect, it } from 'vitest';
import {
  findSessionLevelAssessment,
  isSessionLevelAssessment,
  reviewIdentityKey,
} from '@/products/kitchen-skills-challenge/domain/session/reviewIdentity';
import {
  buildKitchenSkillsTrainerStaffSummaries,
  emptyModuleReviews,
  partitionTrainerSessionsByAssessment,
  sessionAssessmentCounts,
  sessionAssessmentStatus,
} from '@/products/kitchen-skills-challenge/read/trainerSessions';
import type {
  KitchenSkillsPortionEntry,
  KitchenSkillsRescueEntry,
  KitchenSkillsReviewEntry,
  KitchenSkillsTrainerSession,
  KitchenSkillsTrimEntry,
} from '@/products/kitchen-skills-challenge/domain/types';

const SESSION = 'kitchen-day:task:staff1:2026-10-20';

function portion(recipeId: string, recipeName = `Recipe ${recipeId}`): KitchenSkillsPortionEntry {
  return {
    sessionId: SESSION,
    sessionDate: '2026-10-20',
    submittedAt: '2026-10-20T08:37:45.000Z',
    recipeId,
    recipeName,
    recipeComposition: [],
    finalRecipeWeightGrams: 1000,
    source: 'persisted',
  };
}

function trim(recipeId: string, ingredientId = 'banana'): KitchenSkillsTrimEntry {
  return {
    sessionId: SESSION,
    sessionDate: '2026-10-20',
    submittedAt: '2026-10-20T08:38:03.000Z',
    recipeId,
    ingredientId,
    ingredientName: ingredientId,
    ingredientWeightGrams: 500,
    trimTechniques: 'peeling',
    estimatedWasteGrams: 50,
    actualWasteGrams: 60,
    durationMinutes: 3,
    preparationStartedAt: '2026-10-20T08:35:00.000Z',
    preparationEndedAt: '2026-10-20T08:38:00.000Z',
    source: 'persisted',
  };
}

function rescue(recipeId: string, ingredientId = 'banana'): KitchenSkillsRescueEntry {
  return {
    sessionId: SESSION,
    sessionDate: '2026-10-20',
    submittedAt: '2026-10-20T08:38:13.000Z',
    recipeId,
    ingredientId,
    reusableWasteGrams: 20,
    reuseDestination: 'Stock',
    source: 'persisted',
  };
}

function sessionAssessment(partial: Partial<KitchenSkillsReviewEntry> = {}): KitchenSkillsReviewEntry {
  return {
    sessionId: SESSION,
    sessionDate: '2026-10-20',
    submittedAt: '2026-10-20T08:40:22.000Z',
    timeEfficiencyScore: 2,
    preparationQualityScore: 4,
    source: 'persisted',
    persistId: 'pid-session',
    ...partial,
  };
}

function historicalModule(
  recipeId: string,
  module: 'portionPrecision' | 'trimSmart' | 'rescueAndReuse',
): KitchenSkillsReviewEntry {
  return {
    sessionId: SESSION,
    sessionDate: '2026-10-20',
    submittedAt: '2026-10-20T08:40:22.000Z',
    recipeId,
    reviewedGame: module,
    timeEfficiencyScore: 2,
    preparationQualityScore: 4,
    source: 'persisted',
    persistId: `pid-${recipeId}-${module}`,
  };
}

function session(partial: Partial<KitchenSkillsTrainerSession>): KitchenSkillsTrainerSession {
  return {
    actorId: 'staff1',
    actorName: 'staff1 Staff',
    sessionId: SESSION,
    sessionDate: '2026-10-20',
    trimEntries: [],
    rescueEntries: [],
    portionEntries: [],
    reviews: [],
    sessionAssessment: null,
    moduleReviews: emptyModuleReviews(),
    ...partial,
  };
}

describe('trainer assessment status (session-level)', () => {
  it('needs assessment when evidence exists but no session assessment', () => {
    const s = session({
      portionEntries: [portion('5')],
      trimEntries: [trim('5')],
      rescueEntries: [rescue('5')],
    });
    expect(sessionAssessmentStatus(s)).toBe('needs_assessment');
    expect(sessionAssessmentCounts(s)).toEqual({
      recorded: 1,
      confirmed: 0,
      awaiting: 0,
      outstanding: 1,
    });
  });

  it('historical module reviews alone do not mark the session reviewed', () => {
    const s = session({
      portionEntries: [portion('5')],
      trimEntries: [trim('5')],
      reviews: [historicalModule('5', 'portionPrecision'), historicalModule('5', 'trimSmart')],
    });
    expect(sessionAssessmentStatus(s)).toBe('needs_assessment');
    expect(findSessionLevelAssessment(s)).toBeNull();
  });

  it('session assessment marks the session reviewed', () => {
    const assessment = sessionAssessment();
    const s = session({
      portionEntries: [portion('5')],
      trimEntries: [trim('5')],
      rescueEntries: [rescue('5')],
      reviews: [assessment],
      sessionAssessment: assessment,
    });
    expect(isSessionLevelAssessment(assessment)).toBe(true);
    expect(sessionAssessmentStatus(s)).toBe('reviewed');
    expect(sessionAssessmentCounts(s)).toEqual({
      recorded: 1,
      confirmed: 1,
      awaiting: 0,
      outstanding: 0,
    });
    expect(reviewIdentityKey(assessment)).toBe(`${SESSION}::__session__`);
  });

  it('partitions staff sessions into needs vs reviewed only', () => {
    const needs = session({
      sessionId: `${SESSION}:needs`,
      portionEntries: [{ ...portion('5'), sessionId: `${SESSION}:needs` }],
    });
    const assessment = sessionAssessment({ sessionId: `${SESSION}:done` });
    const done = session({
      sessionId: `${SESSION}:done`,
      portionEntries: [{ ...portion('5'), sessionId: `${SESSION}:done` }],
      reviews: [assessment],
      sessionAssessment: assessment,
    });
    const partitioned = partitionTrainerSessionsByAssessment([needs, done]);
    expect(partitioned.awaitingConfirmation).toEqual([]);
    expect(partitioned.needsAssessment.map((row) => row.sessionId)).toEqual([needs.sessionId]);
    expect(partitioned.reviewed.map((row) => row.sessionId)).toEqual([done.sessionId]);

    const staff = buildKitchenSkillsTrainerStaffSummaries([needs, done]);
    expect(staff[0]?.sessionsNeedingAssessment).toBe(1);
    expect(staff[0]?.sessionsReviewed).toBe(1);
    expect(staff[0]?.sessionsAwaitingConfirmation).toBe(0);
  });
});
