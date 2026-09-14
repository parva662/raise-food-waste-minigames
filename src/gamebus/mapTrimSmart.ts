import type { TrimSmartSubmission } from '../trimSmart/types';

export const TRIM_SMART_REQUIRED_REFS = [
  'sessionId',
  'sessionDate',
  'ingredientCategory',
  'ingredientId',
  'ingredientName',
  'ingredientWeightGrams',
  'participantWasteGrams',
  'practice',
  'submittedAt',
] as const;

export type TrimSmartPropertyRef = (typeof TRIM_SMART_REQUIRED_REFS)[number];

export type TrimSmartValueMap = {
  [K in TrimSmartPropertyRef]: { value: TrimSmartSubmission[K] };
};

export function orderedTrimSmartPropertyRefs(): readonly TrimSmartPropertyRef[] {
  return TRIM_SMART_REQUIRED_REFS;
}

export function mapTrimSmart(submission: TrimSmartSubmission): TrimSmartValueMap {
  return {
    sessionId: { value: submission.sessionId },
    sessionDate: { value: submission.sessionDate },
    ingredientCategory: { value: submission.ingredientCategory },
    ingredientId: { value: submission.ingredientId },
    ingredientName: { value: submission.ingredientName },
    ingredientWeightGrams: { value: submission.ingredientWeightGrams },
    participantWasteGrams: { value: submission.participantWasteGrams },
    practice: { value: submission.practice },
    submittedAt: { value: submission.submittedAt },
  };
}
