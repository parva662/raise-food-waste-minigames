import { describe, expect, it } from 'vitest';
import {
  peerModuleScoreStatistic,
  peerTrimDeltaStatistic,
} from '@/products/kitchen-skills-challenge/read/anonymousPeerComparison';
import type {
  KitchenSkillsPortionEntry,
  KitchenSkillsReviewEntry,
  KitchenSkillsTrainerSession,
  KitchenSkillsTrimEntry,
} from '@/products/kitchen-skills-challenge/domain/types';

function trim(
  actorId: string,
  sessionSuffix: string,
  ingredientId: string,
  starting: number,
  removed: number,
): KitchenSkillsTrimEntry {
  const sessionId = `kitchen-day:t:${actorId}:${sessionSuffix}`;
  return {
    sessionId,
    sessionDate: sessionSuffix,
    submittedAt: `${sessionSuffix}T10:00:00.000Z`,
    ingredientId,
    ingredientName: ingredientId,
    ingredientWeightGrams: starting,
    trimTechniques: 'trimming',
    estimatedWasteGrams: removed,
    actualWasteGrams: removed,
    durationMinutes: 3,
    preparationStartedAt: `${sessionSuffix}T09:00:00.000Z`,
    preparationEndedAt: `${sessionSuffix}T09:03:00.000Z`,
    source: 'persisted',
  };
}

function portion(actorId: string, sessionSuffix: string): KitchenSkillsPortionEntry {
  const sessionId = `kitchen-day:t:${actorId}:${sessionSuffix}`;
  return {
    sessionId,
    sessionDate: sessionSuffix,
    submittedAt: `${sessionSuffix}T08:00:00.000Z`,
    recipeId: '42',
    recipeName: 'Hedelmät M,G',
    recipeComposition: [],
    finalRecipeWeightGrams: 3700,
    source: 'persisted',
  };
}

function review(
  actorId: string,
  sessionSuffix: string,
  time: number,
  quality: number,
): KitchenSkillsReviewEntry {
  return {
    sessionId: `kitchen-day:t:${actorId}:${sessionSuffix}`,
    sessionDate: sessionSuffix,
    submittedAt: `${sessionSuffix}T15:00:00.000Z`,
    reviewedGame: 'trimSmart',
    timeEfficiencyScore: time,
    preparationQualityScore: quality,
    source: 'persisted',
  };
}

function session(
  actorId: string,
  sessionSuffix: string,
  options: {
    trim?: KitchenSkillsTrimEntry[];
    withPortion?: boolean;
    review?: KitchenSkillsReviewEntry | null;
  },
): KitchenSkillsTrainerSession {
  const sessionId = `kitchen-day:t:${actorId}:${sessionSuffix}`;
  return {
    actorId,
    actorName: `Student ${actorId}`,
    sessionId,
    sessionDate: sessionSuffix,
    trimEntries: options.trim ?? [],
    rescueEntries: [],
    portionEntries: options.withPortion ? [portion(actorId, sessionSuffix)] : [],
    moduleReviews: {
      trimSmart: options.review ?? null,
      rescueAndReuse: null,
      portionPrecision: null,
    },
  };
}

describe('anonymous Kitchen Skills peer comparison', () => {
  it('hides the statistic when fewer than 3 other participants have data', () => {
    const peers = [
      session('p1', '2026-09-21', {
        trim: [trim('p1', '2026-09-21', 'banaani', 1000, 100)],
        withPortion: true,
      }),
      session('p2', '2026-09-21', {
        trim: [trim('p2', '2026-09-21', 'banaani', 1000, 200)],
        withPortion: true,
      }),
    ];
    expect(peerTrimDeltaStatistic('me', peers)).toEqual({ status: 'hidden', reason: 'not-enough-peers' });
  });

  it('uses one latest valid Trim result per peer and returns a median without identities', () => {
    const peers = [
      session('p1', '2026-09-20', {
        trim: [trim('p1', '2026-09-20', 'banaani', 1000, 370)],
        withPortion: true,
      }),
      session('p1', '2026-09-22', {
        trim: [trim('p1', '2026-09-22', 'banaani', 1000, 100)],
        withPortion: true,
      }),
      session('p2', '2026-09-22', {
        trim: [trim('p2', '2026-09-22', 'banaani', 1000, 370)],
        withPortion: true,
      }),
      session('p3', '2026-09-22', {
        trim: [trim('p3', '2026-09-22', 'banaani', 1000, 370)],
        withPortion: true,
      }),
      session('me', '2026-09-22', {
        trim: [trim('me', '2026-09-22', 'banaani', 1000, 50)],
        withPortion: true,
      }),
    ];
    const statistic = peerTrimDeltaStatistic('me', peers);
    expect(statistic.status).toBe('shown');
    if (statistic.status !== 'shown') return;
    expect(statistic.peerCount).toBe(3);
    expect(statistic.median).toBe(0);
    expect(JSON.stringify(statistic)).not.toMatch(/p1|p2|p3|Student/);
  });

  it('compares like-for-like tutor scores with one latest review per peer', () => {
    const peers = [
      session('p1', '2026-09-20', { review: review('p1', '2026-09-20', 1, 1) }),
      session('p1', '2026-09-22', { review: review('p1', '2026-09-22', 5, 4) }),
      session('p2', '2026-09-22', { review: review('p2', '2026-09-22', 3, 4) }),
      session('p3', '2026-09-22', { review: review('p3', '2026-09-22', 4, 5) }),
    ];
    const time = peerModuleScoreStatistic('me', peers, 'trimSmart', 'timeEfficiencyScore');
    expect(time.status).toBe('shown');
    if (time.status !== 'shown') return;
    expect(time.peerCount).toBe(3);
    expect(time.median).toBe(4);
    expect(JSON.stringify(time)).not.toMatch(/p1|Student/);
  });
});
