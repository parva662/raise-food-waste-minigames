import type { KitchenSkillsReviewedModule } from '@/products/kitchen-skills-challenge/domain/types';
import { isKitchenSkillsReviewScore } from '@/products/kitchen-skills-challenge/domain/assessment/scores';

/** Module scores carried inside one combined wastePracticeReview activity. */
export type CombinedModuleAssessmentScores = {
  timeEfficiencyScore: number;
  preparationQualityScore: number;
  chefFeedback?: string;
};

/**
 * Write model for one combined tutor submission (one recipe, one SILENT_ACTIVITY).
 * Only include modules that have student evidence and still need assessment.
 */
export type KitchenSkillsCombinedReviewEntry = {
  sessionId: string;
  sessionDate: string;
  submittedAt: string;
  recipeId: string;
  modules: Partial<Record<KitchenSkillsReviewedModule, CombinedModuleAssessmentScores>>;
};

export const COMBINED_REVIEW_IDENTITY_REFS = [
  'sessionId',
  'sessionDate',
  'submittedAt',
  'recipeId',
] as const;

export const COMBINED_MODULE_PROPERTY_SLUGS: Record<
  KitchenSkillsReviewedModule,
  { time: string; quality: string; feedback: string }
> = {
  portionPrecision: {
    time: 'portionTimeEfficiencyScore',
    quality: 'portionPreparationQualityScore',
    feedback: 'portionChefFeedback',
  },
  trimSmart: {
    time: 'trimTimeEfficiencyScore',
    quality: 'trimPreparationQualityScore',
    feedback: 'trimChefFeedback',
  },
  rescueAndReuse: {
    time: 'rescueTimeEfficiencyScore',
    quality: 'rescuePreparationQualityScore',
    feedback: 'rescueChefFeedback',
  },
};

export const COMBINED_REVIEW_MODULE_ORDER: readonly KitchenSkillsReviewedModule[] = [
  'portionPrecision',
  'trimSmart',
  'rescueAndReuse',
] as const;

export type CombinedWastePracticeReviewPropertyRef = string;

export function isCombinedReviewPropertySlug(slug: string): boolean {
  return Object.values(COMBINED_MODULE_PROPERTY_SLUGS).some(
    (entry) => entry.time === slug || entry.quality === slug || entry.feedback === slug,
  );
}

export function requiredCombinedScoreRefsForModules(
  modules: readonly KitchenSkillsReviewedModule[],
): string[] {
  const refs: string[] = [...COMBINED_REVIEW_IDENTITY_REFS];
  for (const module of COMBINED_REVIEW_MODULE_ORDER) {
    if (!modules.includes(module)) continue;
    const slugs = COMBINED_MODULE_PROPERTY_SLUGS[module];
    refs.push(slugs.time, slugs.quality);
  }
  return refs;
}

export function optionalCombinedFeedbackRefsForModules(
  modules: readonly KitchenSkillsReviewedModule[],
): string[] {
  return COMBINED_REVIEW_MODULE_ORDER.filter((module) => modules.includes(module)).map(
    (module) => COMBINED_MODULE_PROPERTY_SLUGS[module].feedback,
  );
}

export function validateCombinedModuleScores(
  modules: KitchenSkillsCombinedReviewEntry['modules'],
): { ok: true } | { ok: false; reason: 'invalid_scores' | 'empty_modules' } {
  const keys = COMBINED_REVIEW_MODULE_ORDER.filter((module) => modules[module] != null);
  if (keys.length === 0) return { ok: false, reason: 'empty_modules' };
  for (const module of keys) {
    const scores = modules[module]!;
    if (
      !isKitchenSkillsReviewScore(scores.timeEfficiencyScore) ||
      !isKitchenSkillsReviewScore(scores.preparationQualityScore)
    ) {
      return { ok: false, reason: 'invalid_scores' };
    }
  }
  return { ok: true };
}

export function orderedCombinedWastePracticeReviewPropertyRefs(
  entry: KitchenSkillsCombinedReviewEntry,
): string[] {
  const refs: string[] = [...COMBINED_REVIEW_IDENTITY_REFS];
  for (const module of COMBINED_REVIEW_MODULE_ORDER) {
    const scores = entry.modules[module];
    if (!scores) continue;
    const slugs = COMBINED_MODULE_PROPERTY_SLUGS[module];
    refs.push(slugs.time, slugs.quality);
    if (scores.chefFeedback?.trim()) refs.push(slugs.feedback);
  }
  return refs;
}

export function mapCombinedWastePracticeReview(
  entry: KitchenSkillsCombinedReviewEntry,
): Record<string, { value: string | number }> {
  const values: Record<string, { value: string | number }> = {
    sessionId: { value: entry.sessionId },
    sessionDate: { value: entry.sessionDate },
    submittedAt: { value: entry.submittedAt },
    recipeId: { value: entry.recipeId },
  };
  for (const module of COMBINED_REVIEW_MODULE_ORDER) {
    const scores = entry.modules[module];
    if (!scores) continue;
    const slugs = COMBINED_MODULE_PROPERTY_SLUGS[module];
    values[slugs.time] = { value: scores.timeEfficiencyScore };
    values[slugs.quality] = { value: scores.preparationQualityScore };
    if (scores.chefFeedback?.trim()) {
      values[slugs.feedback] = { value: scores.chefFeedback.trim() };
    }
  }
  return values;
}

/** Attempt key for one combined recipe submission (blocks double-dispatch). */
export function kitchenSkillsCombinedReviewAttemptKey(entry: {
  sessionId: string;
  recipeId: string;
}): string {
  return `review-combined:${entry.sessionId}:${entry.recipeId}`;
}
