export type KitchenDayRecordSource = 'local' | 'persisted';

export interface KitchenDayLockedSession {
  sessionId: string;
  sessionDate: string;
}

export const KITCHEN_DAY_INGREDIENT_CATEGORIES = [
  'root',
  'leafy',
  'fruit',
  'stem',
  'herbs',
  'other',
] as const;

export type KitchenDayIngredientCategory = (typeof KITCHEN_DAY_INGREDIENT_CATEGORIES)[number];

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

export interface KitchenDayTrimEntry {
  sessionId: string;
  sessionDate: string;
  submittedAt: string;
  ingredientId: string;
  ingredientName: string;
  ingredientCategory: KitchenDayIngredientCategory;
  ingredientWeightGrams: number;
  trimTechniques: TrimTechnique;
  estimatedWasteGrams: number;
  actualWasteGrams: number;
  durationMinutes: number;
  preparationStartedAt: string;
  preparationEndedAt: string;
  source: KitchenDayRecordSource;
  persistId?: string;
}

export interface KitchenDayRescueEntry {
  sessionId: string;
  sessionDate: string;
  ingredientId: string;
  reusableWasteGrams: number;
  reuseDestination: string;
  submittedAt: string;
  source: KitchenDayRecordSource;
  persistId?: string;
}

export interface RecipeCompositionLine {
  ingredientId: string;
  ingredientName: string;
  actualAmount: number;
  unit: PortionUnit;
}

export interface KitchenDayPortionEntry {
  sessionId: string;
  sessionDate: string;
  submittedAt: string;
  recipeId: string;
  recipeName: string;
  recipeComposition: RecipeCompositionLine[];
  finalRecipeWeightGrams: number;
  source: KitchenDayRecordSource;
  persistId?: string;
}

export interface KitchenDayReviewEntry {
  sessionId: string;
  sessionDate: string;
  submittedAt: string;
  timeEfficiencyScore: number;
  preparationQualityScore: number;
  chefFeedback?: string;
  source: KitchenDayRecordSource;
  persistId?: string;
}

export interface KitchenDayChefSession {
  actorId: string;
  actorName: string;
  sessionId: string;
  sessionDate: string;
  trimEntries: KitchenDayTrimEntry[];
  rescueEntries: KitchenDayRescueEntry[];
  portionEntries: KitchenDayPortionEntry[];
  review: KitchenDayReviewEntry | null;
}

export type KitchenDaySection = 'trim' | 'reuse' | 'portion' | 'review';
