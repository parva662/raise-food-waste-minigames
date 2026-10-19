import { useEffect, useState } from 'react';
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
  kitchenSkillsReviewCommitErrorMessage,
  kitchenSkillsReviewDiagnosticPayload,
} from '@/products/kitchen-skills-challenge/gamebus/reviewPostErrors';
import { gamebusDevLog } from '@/platform/gamebus/devLog';

export type KitchenSkillsReviewFormDraft = {
  timeScore: string;
  qualityScore: string;
  feedback: string;
};

const EMPTY_DRAFT: KitchenSkillsReviewFormDraft = {
  timeScore: '',
  qualityScore: '',
  feedback: '',
};

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
      <p className="chef-results-panel__intro">
        This {moduleTitle} assessment is confirmed saved.
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
  onRetry,
}: {
  review: KitchenSkillsReviewEntry;
  moduleTitle: string;
  reviewedGame: KitchenSkillsReviewedModule;
  onRetry: () => void;
}) {
  return (
    <section
      className="chef-results-panel"
      data-testid={reviewTestId(reviewedGame, 'awaiting')}
    >
      {legacyTrimTestId(reviewedGame, 'submitted') ? (
        <span hidden data-testid={legacyTrimTestId(reviewedGame, 'submitted')} />
      ) : null}
      <span hidden data-testid={reviewTestId(reviewedGame, 'submitted')} />
      <h3 className="chef-results-panel__title">Tutor assessment</h3>
      <p
        className="chef-results-panel__intro"
        data-testid={reviewTestId(reviewedGame, 'awaiting-note')}
      >
        Sent to GameBus — waiting for confirmation. This {moduleTitle} assessment is not marked
        reviewed until it appears in the trainer feed.
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
      <button
        type="button"
        className="kitchen-day-button"
        data-testid={legacyTrimTestId(reviewedGame, 'retry') ?? reviewTestId(reviewedGame, 'retry')}
        onClick={onRetry}
      >
        Retry submission
      </button>
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
  onDraftDirtyChange,
}: {
  selected: KitchenSkillsTrainerSession;
  recipeId: string;
  reviewedGame: KitchenSkillsReviewedModule;
  moduleTitle: string;
  /** Parent-owned draft so recipe/module switches do not lose unsaved scores. */
  draft?: KitchenSkillsReviewFormDraft;
  onDraftChange?: (draft: KitchenSkillsReviewFormDraft) => void;
  onDraftDirtyChange?: (dirty: boolean) => void;
}) {
  const { commitReview } = useReadyKitchenSkillsSession();
  const normalizedRecipeId = normalizeRecipeId(recipeId) ?? recipeId;
  const confirmed = findConfirmedRecipeModuleReview(selected, normalizedRecipeId, reviewedGame);
  const awaiting = findAwaitingRecipeModuleReview(selected, normalizedRecipeId, reviewedGame);
  const controlled = draft != null && onDraftChange != null;
  const [localDraft, setLocalDraft] = useState<KitchenSkillsReviewFormDraft>(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);

  const currentDraft = controlled ? draft! : localDraft;
  const setDraft = (next: KitchenSkillsReviewFormDraft) => {
    if (controlled) onDraftChange!(next);
    else setLocalDraft(next);
  };

  useEffect(() => {
    setError(null);
  }, [reviewedGame, selected.sessionId, normalizedRecipeId]);

  useEffect(() => {
    if (confirmed || awaiting) {
      onDraftDirtyChange?.(false);
      return;
    }
    const dirty =
      currentDraft.timeScore.trim().length > 0 ||
      currentDraft.qualityScore.trim().length > 0 ||
      currentDraft.feedback.trim().length > 0;
    onDraftDirtyChange?.(dirty);
    return () => onDraftDirtyChange?.(false);
  }, [confirmed, awaiting, currentDraft, onDraftDirtyChange]);

  if (!recipeModuleHasEvidence(selected, normalizedRecipeId, reviewedGame)) {
    return null;
  }

  if (confirmed) {
    return <ReviewReadback review={confirmed} moduleTitle={moduleTitle} reviewedGame={reviewedGame} />;
  }

  const submitEntry = (): KitchenSkillsReviewEntry | null => {
    const parsedTime = parseKitchenSkillsReviewScore(currentDraft.timeScore);
    const parsedQuality = parseKitchenSkillsReviewScore(currentDraft.qualityScore);
    if (!parsedTime.ok || !parsedQuality.ok) {
      setError('Enter integer scores from 0 to 5. Blank is not a score.');
      return null;
    }
    return {
      sessionId: selected.sessionId,
      sessionDate: selected.sessionDate,
      submittedAt: new Date().toISOString(),
      recipeId: normalizedRecipeId,
      reviewedGame,
      timeEfficiencyScore: parsedTime.value,
      preparationQualityScore: parsedQuality.value,
      ...(currentDraft.feedback.trim() ? { chefFeedback: currentDraft.feedback.trim() } : {}),
      source: 'local',
    };
  };

  const runCommit = (entry: KitchenSkillsReviewEntry) => {
    const result = commitReview(entry, selected.actorId);
    if (!result.ok) {
      const message = kitchenSkillsReviewCommitErrorMessage(result.reason, moduleTitle);
      setError(message);
      gamebusDevLog(
        'kitchen-skills-review.ui-error',
        kitchenSkillsReviewDiagnosticPayload(result.reason, entry),
      );
      return;
    }
    setError(null);
    onDraftDirtyChange?.(false);
  };

  if (awaiting) {
    return (
      <ReviewAwaiting
        review={awaiting}
        moduleTitle={moduleTitle}
        reviewedGame={reviewedGame}
        onRetry={() => {
          // Preserve scores in draft, then resubmit (commit clears awaiting + attempt key).
          setDraft({
            timeScore: String(awaiting.timeEfficiencyScore),
            qualityScore: String(awaiting.preparationQualityScore),
            feedback: awaiting.chefFeedback ?? '',
          });
          runCommit({
            ...awaiting,
            submittedAt: new Date().toISOString(),
            awaitingPersist: undefined,
          });
        }}
      />
    );
  }

  const parsedTime = parseKitchenSkillsReviewScore(currentDraft.timeScore);
  const parsedQuality = parseKitchenSkillsReviewScore(currentDraft.qualityScore);
  const canSubmit = parsedTime.ok && parsedQuality.ok;
  const timeInvalid = currentDraft.timeScore.trim().length > 0 && !parsedTime.ok;
  const qualityInvalid = currentDraft.qualityScore.trim().length > 0 && !parsedQuality.ok;
  const legacyForm = legacyTrimTestId(reviewedGame, 'form');
  const legacyTime = legacyTrimTestId(reviewedGame, 'time');
  const legacyQuality = legacyTrimTestId(reviewedGame, 'quality');
  const legacyFeedback = legacyTrimTestId(reviewedGame, 'feedback');
  const legacySubmit = legacyTrimTestId(reviewedGame, 'submit');
  const legacyUnscored = legacyTrimTestId(reviewedGame, 'unscored');
  const legacyError = legacyTrimTestId(reviewedGame, 'error');

  const submit = () => {
    const entry = submitEntry();
    if (!entry) return;
    runCommit(entry);
  };

  return (
    <section className="chef-results-panel kitchen-day-tutor-assessment" data-testid={reviewTestId(reviewedGame, 'form')}>
      {legacyForm ? <span hidden data-testid={legacyForm} /> : null}
      <h3 className="chef-results-panel__title">Tutor assessment</h3>
      <label className="kitchen-day-field">
        Time efficiency (0–5)
        <input
          className="kitchen-day-input kitchen-day-input--numeric"
          data-testid={legacyTime ?? reviewTestId(reviewedGame, 'time')}
          inputMode="numeric"
          maxLength={1}
          aria-invalid={timeInvalid || undefined}
          value={currentDraft.timeScore}
          onChange={(event) => {
            const next = acceptKitchenSkillsScoreInput(event.target.value);
            if (next !== null) setDraft({ ...currentDraft, timeScore: next });
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
          value={currentDraft.qualityScore}
          onChange={(event) => {
            const next = acceptKitchenSkillsScoreInput(event.target.value);
            if (next !== null) setDraft({ ...currentDraft, qualityScore: next });
          }}
        />
        {legacyQuality ? <span hidden data-testid={reviewTestId(reviewedGame, 'quality')} /> : null}
      </label>
      <label className="kitchen-day-field">
        Feedback (optional)
        <textarea
          className="kitchen-day-input"
          data-testid={legacyFeedback ?? reviewTestId(reviewedGame, 'feedback')}
          value={currentDraft.feedback}
          onChange={(event) => setDraft({ ...currentDraft, feedback: event.target.value })}
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
        Submit assessment
      </button>
      {legacySubmit ? (
        <span hidden data-testid={reviewTestId(reviewedGame, 'submit')} />
      ) : null}
    </section>
  );
}
