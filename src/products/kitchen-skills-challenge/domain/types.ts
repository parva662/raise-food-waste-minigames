export type KitchenSkillsRecordSource = 'local' | 'persisted';

export interface KitchenSkillsLockedSession {
  sessionId: string;
  sessionDate: string;
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

export interface KitchenSkillsReviewEntry {
  sessionId: string;
  sessionDate: string;
  submittedAt: string;
  timeEfficiencyScore: number;
  preparationQualityScore: number;
  chefFeedback?: string;
  source: KitchenSkillsRecordSource;
  persistId?: string;
}

export interface KitchenSkillsTrainerSession {
  actorId: string;
  actorName: string;
  sessionId: string;
  sessionDate: string;
  trimEntries: KitchenSkillsTrimEntry[];
  rescueEntries: KitchenSkillsRescueEntry[];
  portionEntries: KitchenSkillsPortionEntry[];
  review: KitchenSkillsReviewEntry | null;
}
