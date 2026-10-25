/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { buildKitchenSkillsStudentProgressSessions } from '@/products/kitchen-skills-challenge/read/studentProgressSessions';
import { buildKitchenSkillsTrainerSessions } from '@/products/kitchen-skills-challenge/read/trainerSessions';

const sessionA = 'kitchen-day:task-1:user-a:2026-10-12';
const sessionB = 'kitchen-day:task-1:user-b:2026-10-12';

const identityA = { actorId: 'user-a', actorName: 'Student A' };
const identityB = { actorId: 'user-b', actorName: 'Student B' };

function trimActivity(overrides: Record<string, unknown> = {}) {
  return {
    id: 'act-trim-a',
    actor: { id: 'user-a', name: 'Student A' },
    template: { slug: 'trimSmart' },
    start: '2026-10-12T10:00:00.000Z',
    end: '2026-10-12T10:03:00.000Z',
    properties: [
      { template: { slug: 'sessionId' }, value: { value: sessionA } },
      { template: { slug: 'sessionDate' }, value: { value: '2026-10-12' } },
      { template: { slug: 'submittedAt' }, value: { value: '2026-10-12T10:03:00.000Z' } },
      { template: { slug: 'ingredientId' }, value: { value: 'carrot' } },
      { template: { slug: 'ingredientName' }, value: { value: 'Carrot' } },
      { template: { slug: 'ingredientWeightGrams' }, value: { value: 5000 } },
      { template: { slug: 'trimTechniques' }, value: { value: 'trimming' } },
      { template: { slug: 'estimatedWasteGrams' }, value: { value: 600 } },
      { template: { slug: 'actualWasteGrams' }, value: { value: 450 } },
      { template: { slug: 'duration' }, obj: { value: 3, unit: 'minutes' } },
    ],
    ...overrides,
  };
}

function portionActivity(overrides: Record<string, unknown> = {}) {
  return {
    id: 'act-portion-a',
    actor: { id: 'user-a', name: 'Student A' },
    template: { slug: 'portionPrecision' },
    properties: [
      { template: { slug: 'sessionId' }, value: { value: sessionA } },
      { template: { slug: 'sessionDate' }, value: { value: '2026-10-12' } },
      { template: { slug: 'submittedAt' }, value: { value: '2026-10-12T11:00:00.000Z' } },
      { template: { slug: 'recipeId' }, value: { value: 'mayonnaise' } },
      { template: { slug: 'recipeName' }, value: { value: 'Mayonnaise' } },
      { template: { slug: 'finalRecipeWeightGrams' }, value: { value: 1850 } },
      {
        template: { slug: 'recipeComposition' },
        value: {
          value: [{ ingredientId: 'yogurt', ingredientName: 'Yogurt', actualAmount: 1000, unit: 'g' }],
        },
      },
    ],
    ...overrides,
  };
}

function rescueActivity(overrides: Record<string, unknown> = {}) {
  return {
    id: 'act-rescue-a',
    actor: { id: 'user-a', name: 'Student A' },
    template: { slug: 'rescueAndReuse' },
    properties: [
      { template: { slug: 'sessionId' }, value: { value: sessionA } },
      { template: { slug: 'sessionDate' }, value: { value: '2026-10-12' } },
      { template: { slug: 'ingredientId' }, value: { value: 'carrot' } },
      { template: { slug: 'reusableWasteGrams' }, value: { value: 200 } },
      { template: { slug: 'reuseDestination' }, value: { value: 'Soup' } },
      { template: { slug: 'submittedAt' }, value: { value: '2026-10-12T10:10:00.000Z' } },
    ],
    ...overrides,
  };
}

function reviewActivity(overrides: Record<string, unknown> = {}) {
  return {
    id: 'act-review-a',
    actor: { id: 'user-a', name: 'Student A' },
    createdBy: { id: 'tutor-1', name: 'Tutor' },
    template: { slug: 'wastePracticeReview' },
    properties: [
      { template: { slug: 'sessionId' }, value: { value: sessionA } },
      { template: { slug: 'sessionDate' }, value: { value: '2026-10-12' } },
      { template: { slug: 'submittedAt' }, value: { value: '2026-10-12T15:00:00.000Z' } },
      { template: { slug: 'reviewedGame' }, value: { value: 'trimSmart' } },
      { template: { slug: 'timeEfficiencyScore' }, value: { value: 4 } },
      { template: { slug: 'preparationQualityScore' }, value: { value: 5 } },
      { template: { slug: 'chefFeedback' }, value: { value: 'Good tip control.' } },
    ],
    ...overrides,
  };
}

describe('Student Progress identity isolation', () => {
  it('A: authenticated A with A-owned evidence shows only A sessions', () => {
    const sessions = buildKitchenSkillsStudentProgressSessions(
      [trimActivity(), rescueActivity(), portionActivity()],
      identityA,
    );
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.actorId).toBe('user-a');
    expect(sessions[0]?.sessionId).toBe(sessionA);
    expect(sessions[0]?.trimEntries).toHaveLength(1);
    expect(sessions[0]?.rescueEntries).toHaveLength(1);
    expect(sessions[0]?.portionEntries).toHaveLength(1);
  });

  it('B: authenticated A with B-owned evidence shows no sessions (Pari incident)', () => {
    const foreign = trimActivity({
      id: 'act-trim-b',
      actor: { id: '019ff626-7728-7a60-8547-da4ab1243c79', name: 'Other' },
      properties: [
        { template: { slug: 'sessionId' }, value: { value: sessionB } },
        { template: { slug: 'sessionDate' }, value: { value: '2026-10-12' } },
        { template: { slug: 'submittedAt' }, value: { value: '2026-10-12T10:03:00.000Z' } },
        { template: { slug: 'ingredientId' }, value: { value: 'onion' } },
        { template: { slug: 'ingredientName' }, value: { value: 'Onion' } },
        { template: { slug: 'ingredientWeightGrams' }, value: { value: 1000 } },
        { template: { slug: 'trimTechniques' }, value: { value: 'dice' } },
        { template: { slug: 'estimatedWasteGrams' }, value: { value: 100 } },
        { template: { slug: 'actualWasteGrams' }, value: { value: 80 } },
        { template: { slug: 'duration' }, obj: { value: 2, unit: 'minutes' } },
      ],
    });
    // Authenticated Pari-shaped id with foreign actor activities in the self feed.
    const sessions = buildKitchenSkillsStudentProgressSessions([foreign], {
      actorId: '019f9427-f664-7a79-817d-783529e30803',
      actorName: 'Pari Chef',
    });
    expect(sessions).toEqual([]);
  });

  it('C: mixed A/B activities keep only correctly attributable A sessions', () => {
    const sessions = buildKitchenSkillsStudentProgressSessions(
      [
        trimActivity(),
        trimActivity({
          id: 'act-trim-b',
          actor: { id: 'user-b', name: 'Student B' },
          properties: [
            { template: { slug: 'sessionId' }, value: { value: sessionB } },
            { template: { slug: 'sessionDate' }, value: { value: '2026-10-12' } },
            { template: { slug: 'submittedAt' }, value: { value: '2026-10-12T10:03:00.000Z' } },
            { template: { slug: 'ingredientId' }, value: { value: 'onion' } },
            { template: { slug: 'ingredientName' }, value: { value: 'Onion' } },
            { template: { slug: 'ingredientWeightGrams' }, value: { value: 1000 } },
            { template: { slug: 'trimTechniques' }, value: { value: 'dice' } },
            { template: { slug: 'estimatedWasteGrams' }, value: { value: 100 } },
            { template: { slug: 'actualWasteGrams' }, value: { value: 80 } },
            { template: { slug: 'duration' }, obj: { value: 2, unit: 'minutes' } },
          ],
        }),
      ],
      identityA,
    );
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.actorId).toBe('user-a');
    expect(sessions[0]?.sessionId).toBe(sessionA);
  });

  it('D: tutor assessment created by tutor for student A attaches to A session/module', () => {
    const sessions = buildKitchenSkillsStudentProgressSessions(
      [trimActivity(), reviewActivity()],
      identityA,
    );
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.moduleReviews.trimSmart?.timeEfficiencyScore).toBe(4);
    expect(sessions[0]?.moduleReviews.trimSmart?.chefFeedback).toBe('Good tip control.');
  });

  it('E: tutor assessment for unrelated student B does not appear in A Progress', () => {
    const sessions = buildKitchenSkillsStudentProgressSessions(
      [
        trimActivity(),
        reviewActivity({
          id: 'act-review-b',
          actor: { id: 'user-b', name: 'Student B' },
          createdBy: { id: 'tutor-1' },
          properties: [
            { template: { slug: 'sessionId' }, value: { value: sessionB } },
            { template: { slug: 'sessionDate' }, value: { value: '2026-10-12' } },
            { template: { slug: 'submittedAt' }, value: { value: '2026-10-12T15:00:00.000Z' } },
            { template: { slug: 'reviewedGame' }, value: { value: 'trimSmart' } },
            { template: { slug: 'timeEfficiencyScore' }, value: { value: 1 } },
            { template: { slug: 'preparationQualityScore' }, value: { value: 1 } },
          ],
        }),
      ],
      identityA,
    );
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.sessionId).toBe(sessionA);
    expect(sessions[0]?.moduleReviews.trimSmart).toBeNull();
  });

  it('F: missing authenticated identity fails closed', () => {
    expect(buildKitchenSkillsStudentProgressSessions([trimActivity()], {})).toEqual([]);
    expect(
      buildKitchenSkillsStudentProgressSessions([trimActivity()], { actorId: null, actorName: null }),
    ).toEqual([]);
    expect(
      buildKitchenSkillsStudentProgressSessions([trimActivity()], { actorId: '  ', actorName: 'X' }),
    ).toEqual([]);
  });

  it('G: switching authenticated account A → B drops previous account history', () => {
    const feed = [
      trimActivity(),
      trimActivity({
        id: 'act-trim-b',
        actor: { id: 'user-b', name: 'Student B' },
        properties: [
          { template: { slug: 'sessionId' }, value: { value: sessionB } },
          { template: { slug: 'sessionDate' }, value: { value: '2026-10-12' } },
          { template: { slug: 'submittedAt' }, value: { value: '2026-10-12T10:03:00.000Z' } },
          { template: { slug: 'ingredientId' }, value: { value: 'onion' } },
          { template: { slug: 'ingredientName' }, value: { value: 'Onion' } },
          { template: { slug: 'ingredientWeightGrams' }, value: { value: 1000 } },
          { template: { slug: 'trimTechniques' }, value: { value: 'dice' } },
          { template: { slug: 'estimatedWasteGrams' }, value: { value: 100 } },
          { template: { slug: 'actualWasteGrams' }, value: { value: 80 } },
          { template: { slug: 'duration' }, obj: { value: 2, unit: 'minutes' } },
        ],
      }),
    ];
    const asA = buildKitchenSkillsStudentProgressSessions(feed, identityA);
    const asB = buildKitchenSkillsStudentProgressSessions(feed, identityB);
    expect(asA.map((s) => s.sessionId)).toEqual([sessionA]);
    expect(asB.map((s) => s.sessionId)).toEqual([sessionB]);
    expect(asA[0]?.actorId).toBe('user-a');
    expect(asB[0]?.actorId).toBe('user-b');
  });

  it('H: reload with same identity keeps correctly isolated personal history', () => {
    const feed = [trimActivity(), portionActivity(), reviewActivity()];
    const first = buildKitchenSkillsStudentProgressSessions(feed, identityA);
    const reloaded = buildKitchenSkillsStudentProgressSessions(feed, identityA);
    expect(reloaded).toEqual(first);
    expect(reloaded[0]?.moduleReviews.trimSmart?.preparationQualityScore).toBe(5);
  });

  it('does not attribute actor-less activities (cannot prove ownership when self feed is untrusted)', () => {
    const selfActivity = trimActivity({ actor: undefined });
    expect(buildKitchenSkillsTrainerSessions([selfActivity])).toEqual([]);
    expect(buildKitchenSkillsStudentProgressSessions([selfActivity], identityA)).toEqual([]);
  });

  it('does not invent sessions from Chef-group activities that are not owned evidence', () => {
    expect(
      buildKitchenSkillsStudentProgressSessions(
        [
          {
            id: 'group-forecast',
            actor: { id: 'chef-1', name: 'Chef' },
            template: { slug: 'chefForecast' },
            properties: [],
          },
        ],
        identityA,
      ),
    ).toEqual([]);
  });

  it('shows Trim / Reuse / Portion before any tutor review exists for owned evidence', () => {
    const sessions = buildKitchenSkillsStudentProgressSessions(
      [trimActivity(), rescueActivity(), portionActivity()],
      identityA,
    );
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.moduleReviews.trimSmart).toBeNull();
    expect(sessions[0]?.moduleReviews.rescueAndReuse).toBeNull();
    expect(sessions[0]?.moduleReviews.portionPrecision).toBeNull();
  });

  it('surfaces a tutor review for A even when no evidence activity exists for that sessionId', () => {
    const sessions = buildKitchenSkillsStudentProgressSessions([reviewActivity()], identityA);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.actorId).toBe('user-a');
    expect(sessions[0]?.moduleReviews.trimSmart?.timeEfficiencyScore).toBe(4);
    expect(sessions[0]?.trimEntries).toEqual([]);
  });

  it('attaches three independent module reviews without mixing foreign ownership', () => {
    const otherSession = 'kitchen-day:task-1:user-a:2026-10-13';
    const sessions = buildKitchenSkillsStudentProgressSessions(
      [
        trimActivity(),
        rescueActivity(),
        portionActivity(),
        trimActivity({
          id: 'act-trim-other',
          properties: [
            { template: { slug: 'sessionId' }, value: { value: otherSession } },
            { template: { slug: 'sessionDate' }, value: { value: '2026-10-13' } },
            { template: { slug: 'submittedAt' }, value: { value: '2026-10-13T10:03:00.000Z' } },
            { template: { slug: 'ingredientId' }, value: { value: 'onion' } },
            { template: { slug: 'ingredientName' }, value: { value: 'Onion' } },
            { template: { slug: 'ingredientWeightGrams' }, value: { value: 1000 } },
            { template: { slug: 'trimTechniques' }, value: { value: 'dice' } },
            { template: { slug: 'estimatedWasteGrams' }, value: { value: 100 } },
            { template: { slug: 'actualWasteGrams' }, value: { value: 80 } },
            { template: { slug: 'duration' }, obj: { value: 2, unit: 'minutes' } },
          ],
        }),
        reviewActivity({
          id: 'act-review-trim',
          properties: [
            { template: { slug: 'sessionId' }, value: { value: sessionA } },
            { template: { slug: 'sessionDate' }, value: { value: '2026-10-12' } },
            { template: { slug: 'submittedAt' }, value: { value: '2026-10-12T15:00:00.000Z' } },
            { template: { slug: 'reviewedGame' }, value: { value: 'trimSmart' } },
            { template: { slug: 'timeEfficiencyScore' }, value: { value: 1 } },
            { template: { slug: 'preparationQualityScore' }, value: { value: 2 } },
          ],
        }),
        reviewActivity({
          id: 'act-review-rescue',
          properties: [
            { template: { slug: 'sessionId' }, value: { value: sessionA } },
            { template: { slug: 'sessionDate' }, value: { value: '2026-10-12' } },
            { template: { slug: 'submittedAt' }, value: { value: '2026-10-12T15:01:00.000Z' } },
            { template: { slug: 'reviewedGame' }, value: { value: 'rescueAndReuse' } },
            { template: { slug: 'timeEfficiencyScore' }, value: { value: 3 } },
            { template: { slug: 'preparationQualityScore' }, value: { value: 4 } },
          ],
        }),
        reviewActivity({
          id: 'act-review-portion',
          properties: [
            { template: { slug: 'sessionId' }, value: { value: sessionA } },
            { template: { slug: 'sessionDate' }, value: { value: '2026-10-12' } },
            { template: { slug: 'submittedAt' }, value: { value: '2026-10-12T15:02:00.000Z' } },
            { template: { slug: 'reviewedGame' }, value: { value: 'portionPrecision' } },
            { template: { slug: 'timeEfficiencyScore' }, value: { value: 5 } },
            { template: { slug: 'preparationQualityScore' }, value: { value: 0 } },
          ],
        }),
        reviewActivity({
          id: 'act-review-other-session',
          properties: [
            { template: { slug: 'sessionId' }, value: { value: otherSession } },
            { template: { slug: 'sessionDate' }, value: { value: '2026-10-13' } },
            { template: { slug: 'submittedAt' }, value: { value: '2026-10-13T15:00:00.000Z' } },
            { template: { slug: 'reviewedGame' }, value: { value: 'trimSmart' } },
            { template: { slug: 'timeEfficiencyScore' }, value: { value: 2 } },
            { template: { slug: 'preparationQualityScore' }, value: { value: 2 } },
          ],
        }),
        // Foreign review must not attach even if sessionId collides with A's evidence.
        reviewActivity({
          id: 'act-review-foreign',
          actor: { id: 'user-b', name: 'Student B' },
          properties: [
            { template: { slug: 'sessionId' }, value: { value: sessionA } },
            { template: { slug: 'sessionDate' }, value: { value: '2026-10-12' } },
            { template: { slug: 'submittedAt' }, value: { value: '2026-10-12T16:00:00.000Z' } },
            { template: { slug: 'reviewedGame' }, value: { value: 'trimSmart' } },
            { template: { slug: 'timeEfficiencyScore' }, value: { value: 0 } },
            { template: { slug: 'preparationQualityScore' }, value: { value: 0 } },
          ],
        }),
      ],
      identityA,
    );
    expect(sessions).toHaveLength(2);
    const first = sessions.find((session) => session.sessionId === sessionA);
    const second = sessions.find((session) => session.sessionId === otherSession);
    expect(first?.moduleReviews.trimSmart?.timeEfficiencyScore).toBe(1);
    expect(first?.moduleReviews.rescueAndReuse?.timeEfficiencyScore).toBe(3);
    expect(first?.moduleReviews.portionPrecision?.timeEfficiencyScore).toBe(5);
    expect(second?.moduleReviews.trimSmart?.timeEfficiencyScore).toBe(2);
  });

  it('keeps two same-day attempts by the same student as separate records', () => {
    const morning = 'kitchen-day:task-1:user-a:2026-10-12:morning1';
    const afternoon = 'kitchen-day:task-1:user-a:2026-10-12:afterid2';
    const sessions = buildKitchenSkillsStudentProgressSessions(
      [
        trimActivity({
          id: 'act-trim-morning',
          properties: [
            { template: { slug: 'sessionId' }, value: { value: morning } },
            { template: { slug: 'sessionDate' }, value: { value: '2026-10-12' } },
            { template: { slug: 'submittedAt' }, value: { value: '2026-10-12T07:03:00.000Z' } },
            { template: { slug: 'ingredientId' }, value: { value: 'carrot' } },
            { template: { slug: 'ingredientName' }, value: { value: 'Carrot' } },
            { template: { slug: 'ingredientWeightGrams' }, value: { value: 5000 } },
            { template: { slug: 'trimTechniques' }, value: { value: 'trimming' } },
            { template: { slug: 'estimatedWasteGrams' }, value: { value: 600 } },
            { template: { slug: 'actualWasteGrams' }, value: { value: 450 } },
            { template: { slug: 'duration' }, obj: { value: 3, unit: 'minutes' } },
          ],
        }),
        trimActivity({
          id: 'act-trim-afternoon',
          properties: [
            { template: { slug: 'sessionId' }, value: { value: afternoon } },
            { template: { slug: 'sessionDate' }, value: { value: '2026-10-12' } },
            { template: { slug: 'submittedAt' }, value: { value: '2026-10-12T14:03:00.000Z' } },
            { template: { slug: 'ingredientId' }, value: { value: 'carrot' } },
            { template: { slug: 'ingredientName' }, value: { value: 'Carrot' } },
            { template: { slug: 'ingredientWeightGrams' }, value: { value: 4000 } },
            { template: { slug: 'trimTechniques' }, value: { value: 'peeling' } },
            { template: { slug: 'estimatedWasteGrams' }, value: { value: 500 } },
            { template: { slug: 'actualWasteGrams' }, value: { value: 400 } },
            { template: { slug: 'duration' }, obj: { value: 2, unit: 'minutes' } },
          ],
        }),
      ],
      identityA,
    );
    expect(sessions.map((session) => session.sessionId).sort()).toEqual([afternoon, morning].sort());
    expect(sessions).toHaveLength(2);
  });
});
