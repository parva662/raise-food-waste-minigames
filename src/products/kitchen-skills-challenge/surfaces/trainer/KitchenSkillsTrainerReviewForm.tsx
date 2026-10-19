import { useEffect, useRef, useState } from 'react';
import { useReadyKitchenSkillsSession } from '@/products/kitchen-skills-challenge/domain/session/KitchenSkillsSessionContext';
import { parseKitchenSkillsReviewScore } from '@/products/kitchen-skills-challenge/domain/assessment/scores';
import type {
  KitchenSkillsReviewedModule,
  KitchenSkillsReviewEntry,
  KitchenSkillsTrainerSession,
} from '@/products/kitchen-skills-challenge/domain/types';
import {
  findAwaitingRecipeModuleReview,
  findConfirmedRecipeModuleReview,
  recipeModuleHasEvidence,
} from '@/products/kitchen-skills-challenge/domain/session/reviewIdentity';
import { normalizeRecipeId } from '@/products/kitchen-skills-challenge/domain/session/ingredientUniqueness';
import {
  kitchenSkillsReviewAwaitingMessage,
  kitchenSkillsReviewCommitErrorMessage,
  kitchenSkillsReviewDiagnosticPayload,
  kitchenSkillsReviewSavedMessage,
} from '@/products/kitchen-skills-challenge/gamebus/reviewPostErrors';
import { gamebusDevLog } from '@/platform/gamebus/devLog';
import {
  EMPTY_REVIEW_DRAFT,
  type KitchenSkillsReviewFormDraft,
} from '@/products/kitchen-skills-challenge/surfaces/trainer/reviewDrafts';

function reviewTestId(reviewedGame: KitchenSkillsReviewedModule, suffix: string): string {
  return `kitchen-day-review-${reviewedGame}-${suffix}`;
}

/** Legacy unscoped testids for trimSmart — older tests still use these. */
function legacyTrimTestId(reviewedGame: KitchenSkillsReviewedModule, suffix: string): string | undefined {
  return reviewedGame === 'trimSmart' ? `kitchen-day-review-${suffix}` : undefined;
}

/** Allow empty or a single digit 0–5; reject other keystrokes/paste. */
function acceptKitchenSkillsScoreInput(raw: string): string | null {
  if (raw === '') return '';
  if (/^[0-5]$/.test(raw)) return raw;
  return null;
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
      <h3 className="chef-results-panel__title">Tutor assessment</h3>
      <p className="chef-results-panel__intro" data-testid={reviewTestId(reviewedGame, 'saved-note')}>
        {kitchenSkillsReviewSavedMessage()} This {moduleTitle} assessment is confirmed in GameBus.
      </p>
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

function ReviewAwaiting({
  review,
  moduleTitle,
  reviewedGame,
}: {
  review: KitchenSkillsReviewEntry;
  moduleTitle: string;
  reviewedGame: KitchenSkillsReviewedModule;
}) {
  return (
    <section
      className="chef-results-panel"
      data-testid={legacyTrimTestId(reviewedGame, 'awaiting') ?? reviewTestId(reviewedGame, 'awaiting')}
    >
      {legacyTrimTestId(reviewedGame, 'awaiting') ? (
        <span hidden data-testid={reviewTestId(reviewedGame, 'awaiting')} />
      ) : null}
      {legacyTrimTestId(reviewedGame, 'submitted') ? (
        <span hidden data-testid={legacyTrimTestId(reviewedGame, 'submitted')} />
      ) : null}
      <span hidden data-testid={reviewTestId(reviewedGame, 'submitted')} />
      <h3 className="chef-results-panel__title">Tutor assessment</h3>
      <p
        className="chef-results-panel__intro"
        data-testid={reviewTestId(reviewedGame, 'awaiting-note')}
      >
        {kitchenSkillsReviewAwaitingMessage()} This {moduleTitle} assessment is not marked reviewed
        until it appears in the trainer feed. Do not submit again.
      </p>
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
  recipeId,
  reviewedGame,
  moduleTitle,
  draft,
  onDraftChange,
}: {
  selected: KitchenSkillsTrainerSession;
  recipeId: string;
  reviewedGame: KitchenSkillsReviewedModule;
  moduleTitle: string;
  /** Parent-owned draft so recipe/module switches do not lose unsaved scores. */
  draft: KitchenSkillsReviewFormDraft;
  onDraftChange: (draft: KitchenSkillsReviewFormDraft) => void;
}) {
  const { commitReview } = useReadyKitchenSkillsSession();
  const normalizedRecipeId = normalizeRecipeId(recipeId) ?? recipeId;
  const confirmed = findConfirmedRecipeModuleReview(selected, normalizedRecipeId, reviewedGame);
  const awaiting = findAwaitingRecipeModuleReview(selected, normalizedRecipeId, reviewedGame);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);

  useEffect(() => {
    setError(null);
    setSending(false);
    sendingRef.current = false;
  }, [reviewedGame, selected.sessionId, normalizedRecipeId]);

  if (!recipeModuleHasEvidence(selected, normalizedRecipeId, reviewedGame)) {
    return null;
  }

  if (confirmed) {
    return <ReviewReadback review={confirmed} moduleTitle={moduleTitle} reviewedGame={reviewedGame} />;
  }

  if (awaiting) {
    return (
      <ReviewAwaiting review={awaiting} moduleTitle={moduleTitle} reviewedGame={reviewedGame} />
    );
  }

  const parsedTime = parseKitchenSkillsReviewScore(draft.timeScore);
  const parsedQuality = parseKitchenSkillsReviewScore(draft.qualityScore);
  const canSubmit = parsedTime.ok && parsedQuality.ok && !sending;
  const timeInvalid = draft.timeScore.trim().length > 0 && !parsedTime.ok;
  const qualityInvalid = draft.qualityScore.trim().length > 0 && !parsedQuality.ok;
  const legacyForm = legacyTrimTestId(reviewedGame, 'form');
  const legacyTime = legacyTrimTestId(reviewedGame, 'time');
  const legacyQuality = legacyTrimTestId(reviewedGame, 'quality');
  const legacyFeedback = legacyTrimTestId(reviewedGame, 'feedback');
  const legacySubmit = legacyTrimTestId(reviewedGame, 'submit');
  const legacyUnscored = legacyTrimTestId(reviewedGame, 'unscored');
  const legacyError = legacyTrimTestId(reviewedGame, 'error');

  const submit = () => {
    if (sendingRef.current) return;
    if (!parsedTime.ok || !parsedQuality.ok) {
      setError('Enter integer scores from 0 to 5. Blank is not a score.');
      return;
    }
    sendingRef.current = true;
    setSending(true);
    const entry: KitchenSkillsReviewEntry = {
      sessionId: selected.sessionId,
      sessionDate: selected.sessionDate,
      submittedAt: new Date().toISOString(),
      recipeId: normalizedRecipeId,
      reviewedGame,
      timeEfficiencyScore: parsedTime.value,
      preparationQualityScore: parsedQuality.value,
      ...(draft.feedback.trim() ? { chefFeedback: draft.feedback.trim() } : {}),
      source: 'local',
    };
    const result = commitReview(entry, selected.actorId);
    if (!result.ok) {
      sendingRef.current = false;
      setSending(false);
      const message = kitchenSkillsReviewCommitErrorMessage(result.reason, moduleTitle);
      setError(message);
      gamebusDevLog(
        'kitchen-skills-review.ui-error',
        kitchenSkillsReviewDiagnosticPayload(result.reason, entry),
      );
      return;
    }
    setError(null);
    // Clear unsent draft once dispatched (scores remain visible on awaiting panel).
    onDraftChange(EMPTY_REVIEW_DRAFT);
    sendingRef.current = false;
    setSending(false);
  };

  return (
    <section className="chef-results-panel kitchen-day-tutor-assessment" data-testid={reviewTestId(reviewedGame, 'form')}>
      {legacyForm ? <span hidden data-testid={legacyForm} /> : null}
      <h3 className="chef-results-panel__title">Tutor assessment</h3>
      {sending ? (
        <p className="chef-results-panel__intro" data-testid={reviewTestId(reviewedGame, 'sending')}>
          Sending assessment…
        </p>
      ) : null}
      <label className="kitchen-day-field">
        Time efficiency (0–5)
        <input
          className="kitchen-day-input kitchen-day-input--numeric"
          data-testid={legacyTime ?? reviewTestId(reviewedGame, 'time')}
          inputMode="numeric"
          maxLength={1}
          aria-invalid={timeInvalid || undefined}
          disabled={sending}
          value={draft.timeScore}
          onChange={(event) => {
            const next = acceptKitchenSkillsScoreInput(event.target.value);
            if (next !== null) onDraftChange({ ...draft, timeScore: next });
          }}
        />
        {legacyTime ? <span hidden data-testid={reviewTestId(reviewedGame, 'time')} /> : null}
      </label>
      <label className="kitchen-day-field">
        Preparation quality (0–5)
        <input
          className="kitchen-day-input kitchen-day-input--numeric"
          data-testid={legacyQuality ?? reviewTestId(reviewedGame, 'quality')}
          inputMode="numeric"
          maxLength={1}
          aria-invalid={qualityInvalid || undefined}
          disabled={sending}
          value={draft.qualityScore}
          onChange={(event) => {
            const next = acceptKitchenSkillsScoreInput(event.target.value);
            if (next !== null) onDraftChange({ ...draft, qualityScore: next });
          }}
        />
        {legacyQuality ? <span hidden data-testid={reviewTestId(reviewedGame, 'quality')} /> : null}
      </label>
      <label className="kitchen-day-field">
        Feedback (optional)
        <textarea
          className="kitchen-day-input"
          data-testid={legacyFeedback ?? reviewTestId(reviewedGame, 'feedback')}
          disabled={sending}
          value={draft.feedback}
          onChange={(event) => onDraftChange({ ...draft, feedback: event.target.value })}
        />
        {legacyFeedback ? <span hidden data-testid={reviewTestId(reviewedGame, 'feedback')} /> : null}
      </label>
      {error ? (
        <p className="kitchen-day-error" data-testid={legacyError ?? reviewTestId(reviewedGame, 'error')}>
          {error}
        </p>
      ) : null}
      <p
        className="chef-results-empty"
        hidden
        data-testid={legacyUnscored ?? reviewTestId(reviewedGame, 'unscored')}
      >
        Scores stay unanswered until you enter 0–5.
      </p>
      <button
        type="button"
        className="kitchen-day-button kitchen-day-button--primary"
        data-testid={legacySubmit ?? reviewTestId(reviewedGame, 'submit')}
        disabled={!canSubmit}
        onClick={submit}
      >
        {sending ? 'Sending…' : 'Submit assessment'}
      </button>
      {legacySubmit ? (
        <span hidden data-testid={reviewTestId(reviewedGame, 'submit')} />
      ) : null}
    </section>
  );
}
