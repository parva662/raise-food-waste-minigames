import { describe, expect, it } from 'vitest';
import {
  buildKitchenSkillsProgressPoints,
  filterModuleHistorySessions,
  paginateSessions,
  recentSessionsLabel,
  takeRecentSessions,
} from '@/products/kitchen-skills-challenge/read/progressModel';
import type { KitchenSkillsTrainerSession } from '@/products/kitchen-skills-challenge/domain/types';

function sessionStub(
  sessionId: string,
  sessionDate: string,
  reviewed = false,
): KitchenSkillsTrainerSession {
  return {
    actorId: 'user-1',
    actorName: 'Student',
    sessionId,
    sessionDate,
    trimEntries: [],
    rescueEntries: [],
    portionEntries: [],
    moduleReviews: {
      trimSmart: reviewed
        ? {
            sessionId,
            sessionDate,
            submittedAt: `${sessionDate}T15:00:00.000Z`,
            reviewedGame: 'trimSmart',
            timeEfficiencyScore: 3,
            preparationQualityScore: 4,
            source: 'persisted',
          }
        : null,
      rescueAndReuse: null,
      portionPrecision: null,
    },
  };
}

describe('Kitchen Day progress derived metrics', () => {
  it('recalculates ingredient accuracy and final-weight deviation from current reference data', () => {
    const points = buildKitchenSkillsProgressPoints([
      {
        actorId: 'user-1',
        actorName: 'Student',
        sessionId: 's1',
        sessionDate: '2026-09-22',
        trimEntries: [],
        rescueEntries: [],
        moduleReviews: {
          trimSmart: null,
          rescueAndReuse: null,
          portionPrecision: null,
        },
        portionEntries: [
          {
            sessionId: 's1',
            sessionDate: '2026-09-22',
            submittedAt: '2026-09-22T11:00:00.000Z',
            recipeId: '1',
            recipeName: 'Ankanrinta FLOW',
            finalRecipeWeightGrams: 13500,
            source: 'persisted',
            recipeComposition: [
              { ingredientId: 'ankka-rintafilee', ingredientName: 'Duck', actualAmount: 11250, unit: 'g' },
              { ingredientId: 'rosmariini-tuore-100g', ingredientName: 'Rosemary', actualAmount: 450, unit: 'g' },
              { ingredientId: 'berner-merisuola-keskikarkea-25', ingredientName: 'Salt', actualAmount: 900, unit: 'g' },
              { ingredientId: 'meira-luomu-mustapippuri', ingredientName: 'Pepper', actualAmount: 900, unit: 'g' },
            ],
          },
        ],
      },
    ]);
    expect(points[0]?.ingredientAccuracyPercent).toBe(100);
    expect(points[0]?.finalWeightDeviationPercent).toBe(0);
  });
});

describe('Kitchen Skills Progress windowing', () => {
  const many = Array.from({ length: 12 }, (_, index) => {
    const day = String(index + 1).padStart(2, '0');
    return sessionStub(`s-${day}`, `2026-09-${day}`, index % 2 === 0);
  });

  it('takes the newest 8 sessions for Recent and labels the calendar span', () => {
    const recent = takeRecentSessions(many, 8);
    expect(recent).toHaveLength(8);
    expect(recent[0]?.sessionId).toBe('s-12');
    expect(recent[7]?.sessionId).toBe('s-05');
    expect(recentSessionsLabel(recent)).toMatch(/^Last 8 sessions · 5 Sept? 2026 – 12 Sept? 2026$/);
  });

  it('keeps sparse history intact when fewer than 8 sessions exist', () => {
    const recent = takeRecentSessions(many.slice(0, 3), 8);
    expect(recent).toHaveLength(3);
    expect(recentSessionsLabel(recent)).toMatch(/^Last 3 sessions · 1 Sept? 2026 – 3 Sept? 2026$/);
  });

  it('filters History by date range and review status', () => {
    const reviewedOnly = filterModuleHistorySessions(many, 'trimSmart', {
      reviewStatus: 'reviewed',
      fromDate: '2026-09-04',
      toDate: '2026-09-10',
    });
    // Even indices are reviewed → calendar days 1,3,5,7,9,11; range 4–10 → 5,7,9.
    expect(reviewedOnly.map((session) => session.sessionId)).toEqual(['s-09', 's-07', 's-05']);
  });

  it('pages History at 10 rows by default', () => {
    const page1 = paginateSessions(many, 1);
    const page2 = paginateSessions(many, 2);
    expect(page1.pageItems).toHaveLength(10);
    expect(page1.totalPages).toBe(2);
    expect(page2.pageItems).toHaveLength(2);
    expect(page2.page).toBe(2);
  });
});
