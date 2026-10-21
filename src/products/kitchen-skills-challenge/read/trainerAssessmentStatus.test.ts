import { describe, expect, it } from 'vitest';
import {
  listSessionRecipeIds,
  recipeAssessmentStatus,
  recipeDisplayName,
  reviewIdentityKey,
} from '@/products/kitchen-skills-challenge/domain/session/reviewIdentity';
import { mergeKitchenSkillsRecords } from '@/products/kitchen-skills-challenge/read/kitchenSkillsReadModel';
import {
  buildKitchenSkillsTrainerStaffSummaries,
  emptyModuleReviews,
  partitionTrainerSessionsByAssessment,
  sessionAssessmentCounts,
  sessionAssessmentSlots,
  sessionAssessmentStatus,
} from '@/products/kitchen-skills-challenge/read/trainerSessions';
import type {
  KitchenSkillsPortionEntry,
  KitchenSkillsRescueEntry,
  KitchenSkillsReviewedModule,
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

function trim(recipeId: string | undefined, ingredientId = 'banana'): KitchenSkillsTrimEntry {
  return {
    sessionId: SESSION,
    sessionDate: '2026-10-20',
    submittedAt: '2026-10-20T08:38:03.000Z',
    ...(recipeId ? { recipeId } : {}),
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
  } as KitchenSkillsTrimEntry;
}

function rescue(recipeId: string | undefined, ingredientId = 'banana'): KitchenSkillsRescueEntry {
  return {
    sessionId: SESSION,
    sessionDate: '2026-10-20',
    submittedAt: '2026-10-20T08:38:13.000Z',
    ...(recipeId ? { recipeId } : {}),
    ingredientId,
    reusableWasteGrams: 20,
    reuseDestination: 'Stock',
    source: 'persisted',
  } as KitchenSkillsRescueEntry;
}

function confirmed(recipeId: string | undefined, module: KitchenSkillsReviewedModule): KitchenSkillsReviewEntry {
  return {
    sessionId: SESSION,
    sessionDate: '2026-10-20',
    submittedAt: '2026-10-20T08:40:22.000Z',
    ...(recipeId ? { recipeId } : {}),
    reviewedGame: module,
    timeEfficiencyScore: 2,
    preparationQualityScore: 4,
    source: 'persisted',
    persistId: `pid-${recipeId ?? 'legacy'}-${module}`,
  };
}

function awaiting(recipeId: string, module: KitchenSkillsReviewedModule): KitchenSkillsReviewEntry {
  return {
    ...confirmed(recipeId, module),
    submittedAt: '2026-10-20T08:41:00.000Z',
    source: 'local',
    persistId: undefined,
    awaitingPersist: true,
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
    moduleReviews: emptyModuleReviews(),
    ...partial,
  };
}

describe('trainer assessment status (three states)', () => {
  it('A: one recipe, Trim confirmed, Portion and Rescue awaiting → AWAITING CONFIRMATION, not partial', () => {
    const s = session({
      portionEntries: [portion('5', 'Banaanismoothie L, G')],
      trimEntries: [trim('5')],
      rescueEntries: [rescue('5')],
      reviews: [
        awaiting('5', 'portionPrecision'),
        confirmed('5', 'trimSmart'),
        awaiting('5', 'rescueAndReuse'),
      ],
    });
    expect(sessionAssessmentSlots(s).map((slot) => [slot.module, slot.state])).toEqual([
      ['portionPrecision', 'awaiting_confirmation'],
      ['trimSmart', 'reviewed'],
      ['rescueAndReuse', 'awaiting_confirmation'],
    ]);
    expect(sessionAssessmentCounts(s)).toEqual({ recorded: 3, confirmed: 1, awaiting: 2, outstanding: 0 });
    expect(sessionAssessmentStatus(s)).toBe('awaiting_confirmation');
    expect(recipeAssessmentStatus(s, '5')).toBe('awaiting_confirmation');
    const partition = partitionTrainerSessionsByAssessment([s]);
    expect(partition.awaitingConfirmation).toHaveLength(1);
    expect(partition.reviewed).toHaveLength(0);
    const [staff] = buildKitchenSkillsTrainerStaffSummaries([s]);
    expect(staff).toMatchObject({
      sessionsNeedingAssessment: 0,
      sessionsAwaitingConfirmation: 1,
      sessionsReviewed: 0,
      modulesAwaitingAssessment: 0,
    });
  });

  it('A: any module without a submission keeps the session and recipe in NEEDS ASSESSMENT', () => {
    const s = session({
      portionEntries: [portion('5')],
      trimEntries: [trim('5')],
      rescueEntries: [rescue('5')],
      reviews: [awaiting('5', 'portionPrecision'), confirmed('5', 'trimSmart')],
    });
    expect(sessionAssessmentCounts(s)).toEqual({ recorded: 3, confirmed: 1, awaiting: 1, outstanding: 1 });
    expect(sessionAssessmentStatus(s)).toBe('needs_assessment');
    expect(recipeAssessmentStatus(s, '5')).toBe('needs_assessment');
  });

  it('B: every evidenced module confirmed → REVIEWED', () => {
    const s = session({
      portionEntries: [portion('5')],
      trimEntries: [trim('5')],
      rescueEntries: [rescue('5')],
      reviews: [
        confirmed('5', 'portionPrecision'),
        confirmed('5', 'trimSmart'),
        confirmed('5', 'rescueAndReuse'),
      ],
    });
    expect(sessionAssessmentStatus(s)).toBe('reviewed');
    expect(partitionTrainerSessionsByAssessment([s]).reviewed).toHaveLength(1);
  });

  it('C: Portion only requires exactly one assessment', () => {
    const s = session({ portionEntries: [portion('5')] });
    expect(sessionAssessmentSlots(s).map((slot) => slot.module)).toEqual(['portionPrecision']);
    expect(sessionAssessmentStatus(s)).toBe('needs_assessment');
    const reviewed = session({ portionEntries: [portion('5')], reviews: [confirmed('5', 'portionPrecision')] });
    expect(sessionAssessmentStatus(reviewed)).toBe('reviewed');
  });

  it('D: recipes are assessed independently by sessionId + recipeId + reviewedGame', () => {
    const s = session({
      portionEntries: [portion('5'), portion('2')],
      trimEntries: [trim('5'), trim('2', 'carrot')],
      reviews: [confirmed('5', 'portionPrecision'), confirmed('5', 'trimSmart')],
    });
    expect(recipeAssessmentStatus(s, '5')).toBe('reviewed');
    expect(recipeAssessmentStatus(s, '2')).toBe('needs_assessment');
    expect(sessionAssessmentCounts(s)).toEqual({ recorded: 4, confirmed: 2, awaiting: 0, outstanding: 2 });
    expect(reviewIdentityKey(confirmed('5', 'trimSmart'))).not.toBe(reviewIdentityKey(confirmed('2', 'trimSmart')));
  });

  it('D: Trim/Rescue rows with their own recipeId stay reachable even without Portion', () => {
    const s = session({
      portionEntries: [portion('5'), portion('2')],
      trimEntries: [trim('179', 'onion')],
      rescueEntries: [rescue('179', 'onion')],
    });
    expect(listSessionRecipeIds(s)).toEqual(['5', '2', '179']);
    expect(sessionAssessmentSlots(s).filter((slot) => slot.recipeId === '179').map((slot) => slot.module)).toEqual([
      'trimSmart',
      'rescueAndReuse',
    ]);
    expect(recipeDisplayName(s, '179')).not.toBe('');
  });

  it('D: legacy Trim without recipeId attaches only to a sole Portion recipe; never guessed otherwise', () => {
    const single = session({ portionEntries: [portion('5')], trimEntries: [trim(undefined)] });
    expect(sessionAssessmentSlots(single).map((slot) => [slot.recipeId, slot.module])).toEqual([
      ['5', 'portionPrecision'],
      ['5', 'trimSmart'],
    ]);
    const ambiguous = session({ portionEntries: [portion('5'), portion('2')], trimEntries: [trim(undefined)] });
    const legacySlot = sessionAssessmentSlots(ambiguous).find((slot) => slot.module === 'trimSmart');
    expect(legacySlot).toEqual({ recipeId: null, module: 'trimSmart', state: 'needs_assessment' });
  });

  it('E: a review without recipeId never satisfies a recipe-level requirement', () => {
    const s = session({
      portionEntries: [portion('5')],
      reviews: [confirmed(undefined, 'portionPrecision')],
    });
    expect(sessionAssessmentStatus(s)).toBe('needs_assessment');
  });

  it('E: a feed update replaces the awaiting row and the session becomes REVIEWED', () => {
    const local = [awaiting('5', 'portionPrecision')];
    const merged = mergeKitchenSkillsRecords(
      local,
      [confirmed('5', 'portionPrecision')],
      (left, right) => reviewIdentityKey(left) === reviewIdentityKey(right),
    );
    expect(merged).toHaveLength(1);
    const s = session({ portionEntries: [portion('5')], reviews: merged });
    expect(sessionAssessmentStatus(s)).toBe('reviewed');
  });
});
