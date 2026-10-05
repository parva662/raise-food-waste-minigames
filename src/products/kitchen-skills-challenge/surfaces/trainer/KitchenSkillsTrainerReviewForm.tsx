import { useState } from 'react';
import { useReadyKitchenSkillsSession } from '@/products/kitchen-skills-challenge/domain/session/KitchenSkillsSessionContext';
import { parseKitchenSkillsReviewScore } from '@/products/kitchen-skills-challenge/domain/assessment/scores';
import type {
  KitchenSkillsReviewedModule,
  KitchenSkillsReviewEntry,
  KitchenSkillsTrainerSession,
} from '@/products/kitchen-skills-challenge/domain/types';
import {
  findModuleReview,
  moduleHasEvidence,
} from '@/products/kitchen-skills-challenge/read/trainerSessions';

function reviewTestId(reviewedGame: KitchenSkillsReviewedModule, suffix: string): string {
  return `kitchen-day-review-${reviewedGame}-${suffix}`;
}

/** Legacy unscoped testids for trimSmart — older tests still use these. */
function legacyTrimTestId(reviewedGame: KitchenSkillsReviewedModule, suffix: string): string | undefined {
  return reviewedGame === 'trimSmart' ? `kitchen-day-review-${suffix}` : undefined;
}

function ReviewReadback({
  review,
  moduleTitle,
  reviewedGame,
}: {
  review: KitchenSkillsReviewEntry;
  moduleTitle: string;
  reviewedGame: KitchenSkillsReviewedModule;
}) {
  return (
    <section className="chef-results-panel" data-testid={reviewTestId(reviewedGame, 'submitted')}>
      {legacyTrimTestId(reviewedGame, 'submitted') ? (
        <span hidden data-testid={legacyTrimTestId(reviewedGame, 'submitted')} />
      ) : null}
      <h3 className="chef-results-panel__title">{moduleTitle} tutor assessment</h3>
      <p className="chef-results-panel__intro">This {moduleTitle} module already has a tutor assessment.</p>
      <dl className="chef-results-metrics chef-results-metrics--compact">
        <div>
          <dt>Time efficiency</dt>
          <dd data-testid={reviewTestId(reviewedGame, 'time-value')}>
            {legacyTrimTestId(reviewedGame, 'time-value') ? (
              <span data-testid={legacyTrimTestId(reviewedGame, 'time-value')}>{review.timeEfficiencyScore}</span>
            ) : (
              review.timeEfficiencyScore
            )}
          </dd>
        </div>
        <div>
          <dt>Preparation quality</dt>
          <dd data-testid={reviewTestId(reviewedGame, 'quality-value')}>
            {legacyTrimTestId(reviewedGame, 'quality-value') ? (
              <span data-testid={legacyTrimTestId(reviewedGame, 'quality-value')}>
                {review.preparationQualityScore}
              </span>
            ) : (
              review.preparationQualityScore
            )}
          </dd>
        </div>
        {review.chefFeedback ? (
          <div>
            <dt>Feedback</dt>
            <dd data-testid={reviewTestId(reviewedGame, 'feedback-value')}>
              {legacyTrimTestId(reviewedGame, 'feedback-value') ? (
                <span data-testid={legacyTrimTestId(reviewedGame, 'feedback-value')}>{review.chefFeedback}</span>
              ) : (
                review.chefFeedback
              )}
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}

export function KitchenSkillsTrainerModuleReviewForm({
  selected,
  reviewedGame,
  moduleTitle,
}: {
  selected: KitchenSkillsTrainerSession;
  reviewedGame: KitchenSkillsReviewedModule;
  moduleTitle: string;
}) {
  const { commitReview, findReviewBySessionAndModule } = useReadyKitchenSkillsSession();
  const existing =
    findModuleReview(selected, reviewedGame) ??
    findReviewBySessionAndModule(selected.sessionId, reviewedGame);
  const [timeScore, setTimeScore] = useState('');
  const [qualityScore, setQualityScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!moduleHasEvidence(selected, reviewedGame)) {
    return null;
  }

  if (existing) {
    return <ReviewReadback review={existing} moduleTitle={moduleTitle} reviewedGame={reviewedGame} />;
  }

  const parsedTime = parseKitchenSkillsReviewScore(timeScore);
  const parsedQuality = parseKitchenSkillsReviewScore(qualityScore);
  const legacyForm = legacyTrimTestId(reviewedGame, 'form');
  const legacyTime = legacyTrimTestId(reviewedGame, 'time');
  const legacyQuality = legacyTrimTestId(reviewedGame, 'quality');
  const legacyFeedback = legacyTrimTestId(reviewedGame, 'feedback');
  const legacySubmit = legacyTrimTestId(reviewedGame, 'submit');
  const legacyUnscored = legacyTrimTestId(reviewedGame, 'unscored');
  const legacyError = legacyTrimTestId(reviewedGame, 'error');

  const submit = () => {
    if (!parsedTime.ok || !parsedQuality.ok) {
      setError('Enter integer scores from 0 to 5. Blank is not a score.');
      return;
    }
    const result = commitReview(
      {
        sessionId: selected.sessionId,
        sessionDate: selected.sessionDate,
        submittedAt: new Date().toISOString(),
        reviewedGame,
        timeEfficiencyScore: parsedTime.value,
        preparationQualityScore: parsedQuality.value,
        ...(feedback.trim() ? { chefFeedback: feedback.trim() } : {}),
        source: 'local',
      },
      selected.actorId,
    );
    if (!result.ok) {
      setError(
        result.reason === 'tutor_live_blocked'
          ? 'Tutor assessment cannot be submitted from this page yet.'
          : result.reason === 'duplicate_review'
            ? `This ${moduleTitle} module already has a tutor assessment.`
            : 'The review could not be saved.',
      );
    }
  };

  return (
    <section className="chef-results-panel" data-testid={reviewTestId(reviewedGame, 'form')}>
      {legacyForm ? <span hidden data-testid={legacyForm} /> : null}
      <h3 className="chef-results-panel__title">{moduleTitle} tutor assessment</h3>
      <p className="chef-results-panel__intro">
        Use the performance evidence above. These scores are your judgement and are not prefilled.
      </p>
      <p
        className="chef-results-empty"
        data-testid={legacyUnscored ?? reviewTestId(reviewedGame, 'unscored')}
      >
        Scores stay unanswered until you enter 0–5. Zero is a valid score.
      </p>
      <label className="kitchen-day-field">
        Time efficiency (0–5)
        <input
          className="kitchen-day-input kitchen-day-input--numeric"
          data-testid={legacyTime ?? reviewTestId(reviewedGame, 'time')}
          inputMode="numeric"
          value={timeScore}
          onChange={(event) => setTimeScore(event.target.value)}
        />
        {legacyTime ? <span hidden data-testid={reviewTestId(reviewedGame, 'time')} /> : null}
      </label>
      <label className="kitchen-day-field">
        Preparation quality (0–5)
        <input
          className="kitchen-day-input kitchen-day-input--numeric"
          data-testid={legacyQuality ?? reviewTestId(reviewedGame, 'quality')}
          inputMode="numeric"
          value={qualityScore}
          onChange={(event) => setQualityScore(event.target.value)}
        />
        {legacyQuality ? <span hidden data-testid={reviewTestId(reviewedGame, 'quality')} /> : null}
      </label>
      <label className="kitchen-day-field">
        Feedback (optional)
        <textarea
          className="kitchen-day-input"
          data-testid={legacyFeedback ?? reviewTestId(reviewedGame, 'feedback')}
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
        />
        {legacyFeedback ? <span hidden data-testid={reviewTestId(reviewedGame, 'feedback')} /> : null}
      </label>
      {error ? (
        <p className="kitchen-day-error" data-testid={legacyError ?? reviewTestId(reviewedGame, 'error')}>
          {error}
        </p>
      ) : null}
      <button
        type="button"
        className="kitchen-day-button kitchen-day-button--primary"
        data-testid={legacySubmit ?? reviewTestId(reviewedGame, 'submit')}
        onClick={submit}
      >
        Submit review
      </button>
      {legacySubmit ? (
        <span hidden data-testid={reviewTestId(reviewedGame, 'submit')} />
      ) : null}
    </section>
  );
}
