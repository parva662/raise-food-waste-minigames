import { normalizeIngredientId } from './ingredientId';
import type {
  TrimSmartLockedAttempt,
  TrimSmartLockedSession,
  TrimSmartPractice,
  TrimSmartSubmission,
} from './types';

export function buildTrimSmartSubmission(options: {
  session: TrimSmartLockedSession;
  attempt: TrimSmartLockedAttempt;
  practice: TrimSmartPractice;
  participantWasteGrams: number;
  submittedAt: string;
}): TrimSmartSubmission {
  const ingredientId = normalizeIngredientId(options.attempt.ingredientName);
  if (!ingredientId) {
    throw new Error('ingredientName is required to derive ingredientId');
  }

  return {
    sessionId: options.session.sessionId,
    sessionDate: options.session.sessionDate,
    ingredientCategory: options.attempt.ingredientCategory,
    ingredientId,
    ingredientName: options.attempt.ingredientName.trim(),
    ingredientWeightGrams: options.attempt.ingredientWeightGrams,
    practice: options.practice,
    participantWasteGrams: options.participantWasteGrams,
    submittedAt: options.submittedAt,
  };
}
