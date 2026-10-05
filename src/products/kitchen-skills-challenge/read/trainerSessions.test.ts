import { describe, expect, it } from 'vitest';
import { getActivityTemplateReference } from '@/platform/gamebus/groupActivities';
import {
  buildKitchenSkillsTrainerSessions,
  buildKitchenSkillsTrainerStaffSummaries,
  classifyKitchenSkillsTrainerFeed,
} from '@/products/kitchen-skills-challenge/read/trainerSessions';
import type { KitchenSkillsReviewedModule } from '@/products/kitchen-skills-challenge/domain/types';

const sessionA = 'kitchen-day:task-1:user-1:2026-09-23';
const sessionB = 'kitchen-day:task-1:user-2:2026-09-23';
const sessionAEarlier = 'kitchen-day:task-1:user-1:2026-09-20';
const sessionALater = 'kitchen-day:task-1:user-1:2026-09-24';
const sessionSameDateA = 'kitchen-day:task-1:user-1:2026-09-23:am';
const sessionSameDateB = 'kitchen-day:task-1:user-1:2026-09-23:pm';

function trimActivity(
  actorId: string,
  sessionId: string,
  ingredientId: string,
  sessionDate = '2026-09-23',
) {
  return {
    id: `trim-${actorId}-${ingredientId}-${sessionId}`,
    actor: { id: actorId, name: actorId === 'user-1' ? 'Student One' : 'Student Two' },
    template: { slug: 'trimSmart' },
    start: `${sessionDate}T10:00:00.000Z`,
    end: `${sessionDate}T10:03:00.000Z`,
    properties: [
      { template: { slug: 'sessionId' }, value: { value: sessionId } },
      { template: { slug: 'sessionDate' }, value: { value: sessionDate } },
      { template: { slug: 'submittedAt' }, value: { value: `${sessionDate}T10:03:00.000Z` } },
      { template: { slug: 'ingredientId' }, value: { value: ingredientId } },
      { template: { slug: 'ingredientName' }, value: { value: ingredientId } },
      { template: { slug: 'ingredientCategory' }, value: { value: 'root' } },
      { template: { slug: 'ingredientWeightGrams' }, value: { value: 5000 } },
      { template: { slug: 'trimTechniques' }, value: { value: 'trimming' } },
      { template: { slug: 'estimatedWasteGrams' }, value: { value: 600 } },
      { template: { slug: 'actualWasteGrams' }, value: { value: 450 } },
      { template: { slug: 'duration' }, obj: { value: 3, unit: 'minutes' } },
    ],
  };
}

function rescueActivity(actorId: string, sessionId: string, ingredientId: string, sessionDate = '2026-09-23') {
  return {
    id: `rescue-${actorId}-${ingredientId}-${sessionId}`,
    actor: { id: actorId, name: actorId === 'user-1' ? 'Student One' : 'Student Two' },
    template: { slug: 'rescueAndReuse' },
    properties: [
      { template: { slug: 'sessionId' }, value: { value: sessionId } },
      { template: { slug: 'sessionDate' }, value: { value: sessionDate } },
      { template: { slug: 'ingredientId' }, value: { value: ingredientId } },
      { template: { slug: 'reusableWasteGrams' }, value: { value: 200 } },
      { template: { slug: 'reuseDestination' }, value: { value: 'Soup' } },
      { template: { slug: 'submittedAt' }, value: { value: `${sessionDate}T10:10:00.000Z` } },
    ],
  };
}

function portionActivity(actorId: string, sessionId: string, recipeId: string, sessionDate = '2026-09-23') {
  return {
    id: `portion-${actorId}-${recipeId}-${sessionId}`,
    actor: { id: actorId, name: actorId === 'user-1' ? 'Student One' : 'Student Two' },
    template: { slug: 'portionPrecision' },
    properties: [
      { template: { slug: 'sessionId' }, value: { value: sessionId } },
      { template: { slug: 'sessionDate' }, value: { value: sessionDate } },
      { template: { slug: 'submittedAt' }, value: { value: `${sessionDate}T11:00:00.000Z` } },
      { template: { slug: 'recipeId' }, value: { value: recipeId } },
      { template: { slug: 'recipeName' }, value: { value: recipeId } },
      { template: { slug: 'finalRecipeWeightGrams' }, value: { value: 1850 } },
      {
        template: { slug: 'recipeComposition' },
        value: {
          value: [{ ingredientId: 'yogurt', ingredientName: 'Yogurt', actualAmount: 1000, unit: 'g' }],
        },
      },
    ],
  };
}

function reviewActivity(
  actorId: string,
  sessionId: string,
  reviewedGame: KitchenSkillsReviewedModule,
  sessionDate = '2026-09-23',
) {
  return {
    id: `review-${actorId}-${reviewedGame}-${sessionId}`,
    actor: { id: actorId, name: actorId === 'user-1' ? 'Student One' : 'Student Two' },
    template: { slug: 'wastePracticeReview' },
    properties: [
      { template: { slug: 'sessionId' }, value: { value: sessionId } },
      { template: { slug: 'sessionDate' }, value: { value: sessionDate } },
      { template: { slug: 'submittedAt' }, value: { value: `${sessionDate}T15:00:00.000Z` } },
      { template: { slug: 'reviewedGame' }, value: { value: reviewedGame } },
      { template: { slug: 'timeEfficiencyScore' }, value: { value: 4 } },
      { template: { slug: 'preparationQualityScore' }, value: { value: 3 } },
    ],
  };
}

describe('Kitchen Day chef session grouping', () => {
  it('groups completed records by participant actor and sessionId, not date only', () => {
    const sessions = buildKitchenSkillsTrainerSessions([
      trimActivity('user-1', sessionA, 'carrot'),
      trimActivity('user-2', sessionB, 'onion'),
    ]);
    expect(sessions).toHaveLength(2);
    expect(sessions.map((session) => session.sessionId).sort()).toEqual([sessionA, sessionB].sort());
    expect(sessions.find((session) => session.actorId === 'user-1')?.trimEntries[0]?.ingredientId).toBe(
      'carrot',
    );
    expect(sessions.find((session) => session.actorId === 'user-2')?.trimEntries[0]?.ingredientId).toBe(
      'onion',
    );
  });

  it('does not treat incomplete or actor-less activities as completed evidence', () => {
    const sessions = buildKitchenSkillsTrainerSessions([
      { template: { slug: 'trimSmart' }, properties: [] },
      { ...trimActivity('user-1', sessionA, 'carrot'), actor: undefined },
    ]);
    expect(sessions).toHaveLength(0);
  });

  it('produces no sessions from a Chef-group /groups/activities mix with no Kitchen Skills templates', () => {
    const templates = ['chefForecast', 'wasteMeasurement', 'studentLunchCheckin'] as const;
    const activities = Array.from({ length: 96 }, (_, index) => ({
      id: `group-${index}`,
      actor: { id: `chef-${index % 4}`, name: `Chef ${index % 4}` },
      template: { slug: templates[index % templates.length], name: templates[index % templates.length] },
      properties: [{ template: { slug: 'submittedAt', name: 'Submitted at' }, value: { value: '2026-09-23T10:00:00.000Z' } }],
    }));
    const classified = classifyKitchenSkillsTrainerFeed(activities);
    expect(classified.total).toBe(96);
    expect(classified.kitchenSkillsEvidenceCount).toBe(0);
    expect(classified.parsedEvidenceCount).toBe(0);
    expect(classified.templateCounts.trimSmart).toBeUndefined();
    expect(classified.templateCounts.rescueAndReuse).toBeUndefined();
    expect(classified.templateCounts.portionPrecision).toBeUndefined();
    expect(buildKitchenSkillsTrainerSessions(activities)).toEqual([]);
  });

  it('reads live group template objects as slug, not string template or reference', () => {
    expect(getActivityTemplateReference({ template: { slug: 'chefForecast', name: 'Chef forecast' } })).toBe(
      'chefForecast',
    );
    expect(getActivityTemplateReference({ template: 'trimSmart' })).toBeNull();
    expect(getActivityTemplateReference({ template: { reference: 'trimSmart' } })).toBeNull();
    expect(
      buildKitchenSkillsTrainerSessions([
        { ...trimActivity('user-1', sessionA, 'carrot'), template: 'trimSmart' },
      ]),
    ).toEqual([]);
  });

  it('buildKitchenSkillsTrainerStaffSummaries prioritizes staff awaiting assessment', () => {
    const sessions = buildKitchenSkillsTrainerSessions([
      trimActivity('user-1', sessionA, 'carrot'),
      reviewActivity('user-1', sessionA, 'trimSmart'),
      trimActivity('user-2', sessionB, 'onion'),
      rescueActivity('user-2', sessionB, 'onion'),
    ]);
    const staff = buildKitchenSkillsTrainerStaffSummaries(sessions);
    expect(staff.map((row) => row.actorId)).toEqual(['user-2', 'user-1']);
    expect(staff[0]?.modulesAwaitingAssessment).toBe(2);
    expect(staff[1]?.modulesAwaitingAssessment).toBe(0);
  });

  it('attaches a module review to the matching module only', () => {
    const sessions = buildKitchenSkillsTrainerSessions([
      trimActivity('user-1', sessionA, 'carrot'),
      rescueActivity('user-1', sessionA, 'carrot'),
      portionActivity('user-1', sessionA, 'mayonnaise'),
      reviewActivity('user-1', sessionA, 'trimSmart'),
    ]);
    expect(sessions).toHaveLength(1);
    const session = sessions[0]!;
    expect(session.moduleReviews.trimSmart?.reviewedGame).toBe('trimSmart');
    expect(session.moduleReviews.rescueAndReuse).toBeNull();
    expect(session.moduleReviews.portionPrecision).toBeNull();
  });

  it('does not let a Trim review fill Rescue or Portion', () => {
    const sessions = buildKitchenSkillsTrainerSessions([
      trimActivity('user-1', sessionA, 'carrot'),
      rescueActivity('user-1', sessionA, 'carrot'),
      portionActivity('user-1', sessionA, 'mayonnaise'),
      reviewActivity('user-1', sessionA, 'trimSmart'),
    ]);
    const session = sessions[0]!;
    expect(session.moduleReviews.trimSmart).not.toBeNull();
    expect(session.moduleReviews.rescueAndReuse).toBeNull();
    expect(session.moduleReviews.portionPrecision).toBeNull();
  });

  it('keeps two sessions on the same date distinct by sessionId', () => {
    const sessions = buildKitchenSkillsTrainerSessions([
      trimActivity('user-1', sessionSameDateA, 'carrot'),
      trimActivity('user-1', sessionSameDateB, 'onion'),
    ]);
    expect(sessions).toHaveLength(2);
    expect(sessions.map((session) => session.sessionId).sort()).toEqual(
      [sessionSameDateA, sessionSameDateB].sort(),
    );
    expect(sessions.find((session) => session.sessionId === sessionSameDateA)?.trimEntries[0]?.ingredientId).toBe(
      'carrot',
    );
    expect(sessions.find((session) => session.sessionId === sessionSameDateB)?.trimEntries[0]?.ingredientId).toBe(
      'onion',
    );
  });

  it('never cross-associates reviews between two students on the same date', () => {
    const sharedSessionId = 'kitchen-day:task-1:shared:2026-09-23';
    const sessions = buildKitchenSkillsTrainerSessions([
      trimActivity('user-1', sharedSessionId, 'carrot'),
      trimActivity('user-2', sharedSessionId, 'onion'),
      reviewActivity('user-1', sharedSessionId, 'trimSmart'),
    ]);
    const one = sessions.find((session) => session.actorId === 'user-1')!;
    const two = sessions.find((session) => session.actorId === 'user-2')!;
    expect(one.moduleReviews.trimSmart).not.toBeNull();
    expect(two.moduleReviews.trimSmart).toBeNull();
  });

  it('orders staff sessions newest-first by sessionDate', () => {
    const sessions = buildKitchenSkillsTrainerSessions([
      trimActivity('user-1', sessionAEarlier, 'carrot', '2026-09-20'),
      trimActivity('user-1', sessionALater, 'onion', '2026-09-24'),
      trimActivity('user-1', sessionA, 'potato', '2026-09-23'),
    ]);
    expect(sessions.map((session) => session.sessionDate)).toEqual([
      '2026-09-24',
      '2026-09-23',
      '2026-09-20',
    ]);
    const staff = buildKitchenSkillsTrainerStaffSummaries(sessions);
    expect(staff).toHaveLength(1);
    expect(staff[0]?.sessions.map((session) => session.sessionDate)).toEqual([
      '2026-09-24',
      '2026-09-23',
      '2026-09-20',
    ]);
  });
});
