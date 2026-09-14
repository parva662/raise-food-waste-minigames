import { formatChallengeGrams } from '../format';
import { formatPracticeLabel } from '../practiceLabels';
import { summarizeTrimSmartSession } from '../sessionSummary';
import type { TrimSmartSubmission } from '../types';

interface TrimSmartSessionProgressProps {
  completed: TrimSmartSubmission[];
  listOnly?: boolean;
}

export function TrimSmartSessionProgress({ completed, listOnly = false }: TrimSmartSessionProgressProps) {
  if (completed.length === 0) return null;

  const summary = summarizeTrimSmartSession(completed);
  const countLabel =
    summary.ingredientCount === 1
      ? '1 ingredient recorded'
      : `${summary.ingredientCount} ingredients recorded`;

  return (
    <section className="trim-smart-session-progress" data-testid="trim-smart-session-progress">
      {listOnly ? null : (
        <>
          <h2 className="trim-smart-session-progress__title">Trim Smart session</h2>
          <p className="trim-smart-session-progress__meta">{countLabel}</p>
          <p className="trim-smart-session-progress__totals">
            Total preparation waste{' '}
            <strong>{formatChallengeGrams(summary.totalPreparationWasteGrams)}</strong>
          </p>
        </>
      )}

      <ul className="trim-smart-session-progress__list">
        {completed.map((entry) => (
          <li key={`${entry.submittedAt}-${entry.ingredientName}-${entry.ingredientWeightGrams}`}>
            <span className="trim-smart-session-progress__item-name">{entry.ingredientName}</span>
            <span className="trim-smart-session-progress__item-detail">
              {formatChallengeGrams(entry.ingredientWeightGrams)} →{' '}
              {formatChallengeGrams(entry.participantWasteGrams)} waste
            </span>
            <span className="trim-smart-session-progress__item-practice">
              {formatPracticeLabel(entry.practice)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
