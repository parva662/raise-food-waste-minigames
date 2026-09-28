export const TRIM_SMART_INGREDIENT_CATEGORIES = [
  'vegetables',
  'fruit',
  'meat',
  'fish',
  'dairy',
  'grains',
  'legumes',
  'other',
] as const;

export type TrimSmartIngredientCategory = (typeof TRIM_SMART_INGREDIENT_CATEGORIES)[number];

export const TRIM_SMART_PRACTICES = [
  'standard_practice',
  'careful_trimming',
  'whole_ingredient_use',
  'other',
] as const;

export type TrimSmartPractice = (typeof TRIM_SMART_PRACTICES)[number];

export interface TrimSmartSessionContext {
  sessionId: string;
  sessionDate: string;
  ingredientCategory: TrimSmartIngredientCategory;
  ingredientId: string;
  ingredientName: string;
  ingredientWeightGrams: number;
}

export interface TrimSmartParticipantInput {
  practice: TrimSmartPractice;
  participantWasteGrams: number;
}

export interface TrimSmartSubmission extends TrimSmartSessionContext, TrimSmartParticipantInput {
  submittedAt: string;
}

export type TrimSmartStep = 'ingredient' | 'practice' | 'measure';

export interface TrimSmartLockedSession {
  sessionId: string;
  sessionDate: string;
}

export interface TrimSmartLockedAttempt {
  ingredientCategory: TrimSmartIngredientCategory;
  ingredientName: string;
  ingredientWeightGrams: number;
}

export type TrimSmartSubmissionState = 'idle' | 'submitting' | 'submitted' | 'error';

export type TrimSmartScreen =
  | 'flow'
  | 'ingredient-recorded'
  | 'session-complete';
