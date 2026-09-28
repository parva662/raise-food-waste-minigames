import type { TrimSmartSubmission } from '@/legacy/trim-smart-v1/types';

export function summarizeTrimSmartSession(completed: readonly TrimSmartSubmission[]) {
  const ingredientCount = completed.length;
  const totalStartingWeightGrams = completed.reduce(
    (sum, entry) => sum + entry.ingredientWeightGrams,
    0,
  );
  const totalPreparationWasteGrams = completed.reduce(
    (sum, entry) => sum + entry.participantWasteGrams,
    0,
  );
  return {
    ingredientCount,
    totalStartingWeightGrams,
    totalPreparationWasteGrams,
  };
}
