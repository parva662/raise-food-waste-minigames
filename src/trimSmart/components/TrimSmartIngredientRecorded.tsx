import { formatChallengeGrams } from '../format';
import { formatPracticeLabel } from '../practiceLabels';
import type { TrimSmartSubmission } from '../types';

interface TrimSmartIngredientRecordedProps {
  submission: TrimSmartSubmission;
  onAddAnother: () => void;
  onFinishSession: () => void;
}

export function TrimSmartIngredientRecorded({
  submission,
  onAddAnother,
  onFinishSession,
}: TrimSmartIngredientRecordedProps) {
  return (
    <section className="trim-smart-card trim-smart-confirmation" data-testid="trim-smart-ingredient-recorded">
      <h2 className="trim-smart-card__title">Ingredient recorded</h2>
      <p className="trim-smart-confirmation__ingredient">{submission.ingredientName}</p>
      <dl className="trim-smart-confirmation__stats">
        <div>
          <dt>Starting weight</dt>
          <dd>{formatChallengeGrams(submission.ingredientWeightGrams)}</dd>
        </div>
        <div>
          <dt>Preparation waste</dt>
          <dd>{formatChallengeGrams(submission.participantWasteGrams)}</dd>
        </div>
        <div>
          <dt>Approach</dt>
          <dd>{formatPracticeLabel(submission.practice)}</dd>
        </div>
      </dl>

      <div className="trim-smart-actions trim-smart-actions--stacked">
        <button
          type="button"
          className="trim-smart-button trim-smart-button--primary"
          onClick={onAddAnother}
          data-testid="trim-smart-add-another"
        >
          Add another ingredient
        </button>
        <button
          type="button"
          className="trim-smart-button trim-smart-button--secondary"
          onClick={onFinishSession}
          data-testid="trim-smart-finish-session"
        >
          Finish session
        </button>
      </div>
    </section>
  );
}
