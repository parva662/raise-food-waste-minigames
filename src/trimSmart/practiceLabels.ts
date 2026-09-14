import type { TrimSmartPractice } from './types';

export interface TrimSmartPracticeOption {
  id: TrimSmartPractice;
  title: string;
  description: string;
}

/** Participant-visible practice choices in Trim Smart v1 (schema still allows `other`). */
export const TRIM_SMART_VISIBLE_PRACTICE_OPTIONS: TrimSmartPracticeOption[] = [
  {
    id: 'standard_practice',
    title: 'Usual preparation',
    description: 'Prepare the ingredient using your usual method.',
  },
  {
    id: 'careful_trimming',
    title: 'Trim carefully',
    description: 'Remove only the parts that really need to be discarded.',
  },
  {
    id: 'whole_ingredient_use',
    title: 'Use as much as possible',
    description: 'Keep and use all suitable edible parts of the ingredient.',
  },
];

export function formatPracticeLabel(practice: TrimSmartPractice): string {
  const visible = TRIM_SMART_VISIBLE_PRACTICE_OPTIONS.find((option) => option.id === practice);
  if (visible) return visible.title;
  if (practice === 'other') return 'Another approach';
  return practice;
}
