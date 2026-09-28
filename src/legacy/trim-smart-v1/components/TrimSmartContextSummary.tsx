import { formatIngredientCategoryLabel } from '@/legacy/trim-smart-v1/categoryLabels';
import { formatChallengeGrams } from '@/legacy/trim-smart-v1/format';
import type { TrimSmartLockedAttempt } from '@/legacy/trim-smart-v1/types';

interface TrimSmartContextSummaryProps {
  attempt: TrimSmartLockedAttempt;
  variant?: 'compact' | 'measure';
}

export function TrimSmartContextSummary({ attempt, variant = 'compact' }: TrimSmartContextSummaryProps) {
  const categoryLabel = formatIngredientCategoryLabel(attempt.ingredientCategory);
  const weightLabel = formatChallengeGrams(attempt.ingredientWeightGrams);
  const meta =
    variant === 'measure'
      ? `${categoryLabel} · Starting weight ${weightLabel}`
      : `${categoryLabel} · ${weightLabel}`;

  return (
    <div className="trim-smart-context-summary" data-testid="trim-smart-context-summary">
      <p className="trim-smart-context-summary__name">{attempt.ingredientName}</p>
      <p className="trim-smart-context-summary__meta">{meta}</p>
    </div>
  );
}
