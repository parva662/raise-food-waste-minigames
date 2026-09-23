import { useState } from 'react';
import { useReadyKitchenDaySession } from './KitchenDaySessionContext';
import { parseKitchenDayReviewScore } from './review/scores';
import type { KitchenDayChefSession, KitchenDayReviewEntry } from './types';

function ReviewReadback({ review }: { review: KitchenDayReviewEntry }) {
  return (
    <section className="chef-results-panel" data-testid="kitchen-day-review-submitted">
      <h3 className="chef-results-panel__title">Tutor assessment</h3>
      <p className="chef-results-panel__intro">This Kitchen Day already has a session review.</p>
      <dl className="chef-results-metrics chef-results-metrics--compact">
        <div>
          <dt>Time efficiency</dt>
          <dd data-testid="kitchen-day-review-time-value">{review.timeEfficiencyScore}</dd>
        </div>
        <div>
          <dt>Preparation quality</dt>
          <dd data-testid="kitchen-day-review-quality-value">{review.preparationQualityScore}</dd>
        </div>
        {review.chefFeedback ? (
          <div>
            <dt>Feedback</dt>
            <dd data-testid="kitchen-day-review-feedback-value">{review.chefFeedback}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}

export function KitchenDayChefReviewForm({ selected }: { selected: KitchenDayChefSession }) {
  const { commitReview, findReviewBySessionId } = useReadyKitchenDaySession();
  const existing = selected.review ?? findReviewBySessionId(selected.sessionId);
  const [timeScore, setTimeScore] = useState('');
  const [qualityScore, setQualityScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (existing) {
    return <ReviewReadback review={existing} />;
  }

  const parsedTime = parseKitchenDayReviewScore(timeScore);
  const parsedQuality = parseKitchenDayReviewScore(qualityScore);

  return (
    <section className="chef-results-panel" data-testid="kitchen-day-review-form">
      <h3 className="chef-results-panel__title">Tutor assessment</h3>
      <p className="chef-results-panel__intro">
        Use the performance evidence above. These scores are your judgement and are not prefilled.
      </p>
      <p className="chef-results-empty" data-testid="kitchen-day-review-unscored">
        Scores stay unanswered until you enter 0–5. Zero is a valid score.
      </p>
      <label className="kitchen-day-field">
        Time efficiency (0–5)
        <input
          className="kitchen-day-input kitchen-day-input--numeric"
          data-testid="kitchen-day-review-time"
          inputMode="numeric"
          value={timeScore}
          onChange={(event) => setTimeScore(event.target.value)}
        />
      </label>
      <label className="kitchen-day-field">
        Preparation quality (0–5)
        <input
          className="kitchen-day-input kitchen-day-input--numeric"
          data-testid="kitchen-day-review-quality"
          inputMode="numeric"
          value={qualityScore}
          onChange={(event) => setQualityScore(event.target.value)}
        />
      </label>
      <label className="kitchen-day-field">
        Feedback (optional)
        <textarea
          className="kitchen-day-input"
          data-testid="kitchen-day-review-feedback"
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
        />
      </label>
      {error ? (
        <p className="kitchen-day-error" data-testid="kitchen-day-review-error">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        className="kitchen-day-button kitchen-day-button--primary"
        data-testid="kitchen-day-review-submit"
        onClick={() => {
          if (!parsedTime.ok || !parsedQuality.ok) {
            setError('Enter integer scores from 0 to 5. Blank is not a score.');
            return;
          }
          const result = commitReview({
            sessionId: selected.sessionId,
            sessionDate: selected.sessionDate,
            submittedAt: new Date().toISOString(),
            timeEfficiencyScore: parsedTime.value,
            preparationQualityScore: parsedQuality.value,
            ...(feedback.trim() ? { chefFeedback: feedback.trim() } : {}),
            source: 'local',
          });
          if (!result.ok) {
            setError(
              result.reason === 'tutor_live_blocked'
                ? 'Tutor assessment cannot be submitted from this page yet.'
                : result.reason === 'duplicate_review'
                  ? 'This Kitchen Day already has a session review.'
                  : 'The review could not be saved.',
            );
          }
        }}
      >
        Submit review
      </button>
    </section>
  );
}
