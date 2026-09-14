import { formatChallengeGrams } from '../format';
import { summarizeTrimSmartSession } from '../sessionSummary';
import type { TrimSmartSubmission } from '../types';
import { TrimSmartSessionProgress } from './TrimSmartSessionProgress';

interface TrimSmartSessionCompleteProps {
  completed: TrimSmartSubmission[];
  showStartNewDemo: boolean;
  onStartNewDemo: () => void;
}

export function TrimSmartSessionComplete({
  completed,
  showStartNewDemo,
  onStartNewDemo,
}: TrimSmartSessionCompleteProps) {
  const summary = summarizeTrimSmartSession(completed);
  const countLabel =
    summary.ingredientCount === 1
      ? '1 ingredient recorded'
      : `${summary.ingredientCount} ingredients recorded`;

  return (
    <section className="trim-smart-card trim-smart-confirmation" data-testid="trim-smart-session-complete">
      <h2 className="trim-smart-card__title">Trim Smart session complete</h2>
      <p className="trim-smart-card__copy">{countLabel}</p>
      <dl className="trim-smart-confirmation__stats">
        <div>
          <dt>Total starting weight</dt>
          <dd>{formatChallengeGrams(summary.totalStartingWeightGrams)}</dd>
        </div>
        <div>
          <dt>Total preparation waste</dt>
          <dd>{formatChallengeGrams(summary.totalPreparationWasteGrams)}</dd>
        </div>
      </dl>
      <p className="trim-smart-card__copy">Your recorded ingredients have been submitted.</p>
      <p className="trim-smart-confirmation__note">Your chef review will appear later.</p>

      <TrimSmartSessionProgress completed={completed} listOnly />

      {showStartNewDemo ? (
        <button
          type="button"
          className="trim-smart-button trim-smart-button--secondary"
          onClick={onStartNewDemo}
          data-testid="trim-smart-start-new-demo"
        >
          Start new demo session
        </button>
      ) : null}
    </section>
  );
}
