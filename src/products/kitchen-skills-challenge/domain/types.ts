export type KitchenSkillsRecordSource = 'local' | 'persisted';

export interface KitchenSkillsLockedSession {
  sessionId: string;
  sessionDate: string;
  /** Attempt suffix of `sessionId`; never displayed. */
  attemptId?: string;
}

export const TRIM_TECHNIQUES = [
  'peeling',
  'trimming',
  'julienne',
  'batonnet',
  'mince',
  'dice',
  'brunoise',
  'slice',
  'chiffonade',
  'other',
] as const;

export type TrimTechnique = (typeof TRIM_TECHNIQUES)[number];

export const PORTION_UNITS = ['g', 'kg', 'dL', 'L'] as const;
export type PortionUnit = (typeof PORTION_UNITS)[number];

export interface KitchenSkillsTrimEntry {
  sessionId: string;
  sessionDate: string;
  submittedAt: string;
  /** Required on new posts; absent on legacy GameBus activities. */
  recipeId?: string;
  ingredientId: string;
  ingredientName: string;
  ingredientWeightGrams: number;
  trimTechniques: TrimTechnique;
  estimatedWasteGrams: number;
  actualWasteGrams: number;
  durationMinutes: number;
  preparationStartedAt: string;
  preparationEndedAt: string;
  source: KitchenSkillsRecordSource;
  persistId?: string;
}

export interface KitchenSkillsRescueEntry {
  sessionId: string;
  sessionDate: string;
  /** Required on new posts; absent on legacy GameBus activities. */
  recipeId?: string;
  ingredientId: string;
  reusableWasteGrams: number;
  reuseDestination: string;
  submittedAt: string;
  source: KitchenSkillsRecordSource;
  persistId?: string;
}

export interface RecipeCompositionLine {
  ingredientId: string;
  ingredientName: string;
  actualAmount: number;
  unit: PortionUnit;
}

export interface KitchenSkillsPortionEntry {
  sessionId: string;
  sessionDate: string;
  submittedAt: string;
  recipeId: string;
  recipeName: string;
  recipeComposition: RecipeCompositionLine[];
  finalRecipeWeightGrams: number;
  source: KitchenSkillsRecordSource;
  persistId?: string;
}

/** Module discriminator for `wastePracticeReview.reviewedGame` — activity slugs, not display labels. */
export const KITCHEN_SKILLS_REVIEWED_MODULES = [
  'trimSmart',
  'rescueAndReuse',
  'portionPrecision',
] as const;

export type KitchenSkillsReviewedModule = (typeof KITCHEN_SKILLS_REVIEWED_MODULES)[number];

export const KITCHEN_SKILLS_MODULE_TITLES: Record<KitchenSkillsReviewedModule, string> = {
  trimSmart: 'Trim Smart',
  rescueAndReuse: 'Rescue & Reuse',
  portionPrecision: 'Portion Precision',
};

export interface KitchenSkillsReviewEntry {
  sessionId: string;
  sessionDate: string;
  submittedAt: string;
  /**
   * Present on historical per-module assessments.
   * Omitted on new session-level assessments and on older rows without recipe tracking.
   */
  recipeId?: string;
  /**
   * Present on historical per-module assessments (`trimSmart` | `rescueAndReuse` | `portionPrecision`).
   * Omitted on new session-level assessments — do not fabricate a module value for an overall review.
   */
  reviewedGame?: KitchenSkillsReviewedModule;
  timeEfficiencyScore: number;
  preparationQualityScore: number;
  chefFeedback?: string;
  source: KitchenSkillsRecordSource;
  persistId?: string;
  /**
   * Legacy flag for historical per-module dispatch UX. New session-level posts do not use awaiting screens.
   */
  awaitingPersist?: boolean;
}

/** One review slot per module — used for legacy session-level assessments only. */
export type KitchenSkillsModuleReviews = {
  trimSmart: KitchenSkillsReviewEntry | null;
  rescueAndReuse: KitchenSkillsReviewEntry | null;
  portionPrecision: KitchenSkillsReviewEntry | null;
};

export interface KitchenSkillsTrainerSession {
  actorId: string;
  actorName: string;
  sessionId: string;
  sessionDate: string;
  trimEntries: KitchenSkillsTrimEntry[];
  rescueEntries: KitchenSkillsRescueEntry[];
  portionEntries: KitchenSkillsPortionEntry[];
  /** All tutor reviews for this session (session-level, recipe-module, and legacy). */
  reviews: KitchenSkillsReviewEntry[];
  /**
   * Confirmed or local session-level assessment (no `reviewedGame` / no `recipeId`).
   * Historical per-module rows never populate this.
   */
  sessionAssessment: KitchenSkillsReviewEntry | null;
  /**
   * Historical per-module reviews without recipeId (pre-recipe tracking).
   * Recipe-specific module assessments live in {@link reviews}.
   */
  moduleReviews: KitchenSkillsModuleReviews;
}

export interface KitchenSkillsTrainerStaffSummary {
  actorId: string;
  actorName: string;
  sessions: KitchenSkillsTrainerSession[];
  sessionCount: number;
  latestSessionDate: string;
  /** Evidenced modules with no tutor submission yet. */
  modulesAwaitingAssessment: number;
  sessionsNeedingAssessment: number;
  sessionsAwaitingConfirmation: number;
  sessionsReviewed: number;
}
