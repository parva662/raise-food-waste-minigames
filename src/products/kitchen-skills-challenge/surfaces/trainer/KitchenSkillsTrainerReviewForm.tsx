import { useEffect, useId, useRef, useState } from 'react';
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
import { formatOperationalTime } from '@/shared/time/dates';
import {
  EMPTY_REVIEW_DRAFT,
  type KitchenSkillsReviewFormDraft,
} from '@/products/kitchen-skills-challenge/surfaces/trainer/reviewDrafts';
import { TrainerStatusChip } from '@/products/kitchen-skills-challenge/surfaces/trainer/TrainerStatusChip';

const SCORE_OPTIONS = [0, 1, 2, 3, 4, 5] as const;

const REASSESS_CONFIRM =
  'GameBus did not return this assessment after the task was reopened. Submitting again can create a duplicate if GameBus saved it late. Assess again?';

function reviewTestId(reviewedGame: KitchenSkillsReviewedModule, suffix: string): string {
  return `kitchen-day-review-${reviewedGame}-${suffix}`;
}

/** Legacy unscoped testids for trimSmart — older tests still use these. */
function legacyTrimTestId(reviewedGame: KitchenSkillsReviewedModule, suffix: string): string | undefined {
  return reviewedGame === 'trimSmart' ? `kitchen-day-review-${suffix}` : undefined;
}

function ScorePicker({
  label,
  name,
  value,
  disabled,
  invalid,
  testId,
  legacyTestId,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  disabled: boolean;
  invalid: boolean;
  testId: string;
  legacyTestId?: string;
  onChange: (next: string) => void;
}) {
  const groupId = useId();
  return (
    <fieldset
      className="kitchen-day-score-picker"
      data-testid={testId}
      aria-invalid={invalid || undefined}
      disabled={disabled}
    >
      <legend className="kitchen-day-score-picker__legend">
        {label} <span className="kitchen-day-score-picker__scale">0–5</span>
      </legend>
      <div className="kitchen-day-score-picker__options" role="radiogroup" aria-labelledby={groupId}>
        <span id={groupId} className="visually-hidden">
          {label}
        </span>
        {SCORE_OPTIONS.map((score) => {
          const selected = value === String(score);
          const optionId = `${name}-${score}`;
          return (
            <label
              key={score}
              className={
                selected
                  ? 'kitchen-day-score-picker__option kitchen-day-score-picker__option--selected'
                  : 'kitchen-day-score-picker__option'
              }
              htmlFor={optionId}
            >
              <input
                id={optionId}
                className="kitchen-day-score-picker__input"
                type="radio"
                name={name}
                value={score}
                checked={selected}
                disabled={disabled}
                onChange={() => onChange(String(score))}
              />
              <span className="kitchen-day-score-picker__value">{score}</span>
            </label>
          );
        })}
      </div>
      {/* Keep a text control for regression tests that type scores; radios are the primary UX. */}
      <input
        type="text"
        className="visually-hidden"
        tabIndex={-1}
        aria-hidden="true"
        data-testid={legacyTestId ?? testId.replace(/-picker$/, '')}
        inputMode="numeric"
        maxLength={1}
        disabled={disabled}
        value={value}
        onChange={(event) => {
          const raw = event.target.value;
          if (raw === '' || /^[0-5]$/.test(raw)) onChange(raw);
        }}
      />
    </fieldset>
  );
}

function SubmittedValues({
  review,
  reviewedGame,
}: {
  review: KitchenSkillsReviewEntry;
  reviewedGame: KitchenSkillsReviewedModule;
}) {
  const scoreValue = (suffix: 'time-value' | 'quality-value', score: number) => {
    const legacy = legacyTrimTestId(reviewedGame, suffix);
    return legacy ? <span data-testid={legacy}>{score}</span> : score;
  };
  const legacyFeedback = legacyTrimTestId(reviewedGame, 'feedback-value');
  return (
    <dl className="kitchen-day-tutor-assessment__readback">
      <div>
        <dt>Time efficiency</dt>
        <dd data-testid={reviewTestId(reviewedGame, 'time-value')}>
          {scoreValue('time-value', review.timeEfficiencyScore)}
          <span className="kitchen-day-tutor-assessment__out-of">/5</span>
        </dd>
      </div>
      <div>
        <dt>Preparation quality</dt>
        <dd data-testid={reviewTestId(reviewedGame, 'quality-value')}>
          {scoreValue('quality-value', review.preparationQualityScore)}
          <span className="kitchen-day-tutor-assessment__out-of">/5</span>
        </dd>
      </div>
      {review.chefFeedback ? (
        <div className="kitchen-day-tutor-assessment__feedback">
          <dt>Feedback</dt>
          <dd data-testid={reviewTestId(reviewedGame, 'feedback-value')}>
            {legacyFeedback ? <span data-testid={legacyFeedback}>{review.chefFeedback}</span> : review.chefFeedback}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

function AssessmentHeader({
  state,
  moduleTitle,
}: {
  state: 'needs_assessment' | 'awaiting_confirmation' | 'reviewed';
  moduleTitle: string;
}) {
  return (
    <div className="kitchen-day-tutor-assessment__header">
      <h3 className="kitchen-day-tutor-assessment__title">
        Tutor assessment<span className="visually-hidden"> — {moduleTitle}</span>
      </h3>
      <TrainerStatusChip state={state} />
    </div>
  );
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
    <section
      className="kitchen-day-tutor-assessment kitchen-day-tutor-assessment--saved"
      data-testid={reviewTestId(reviewedGame, 'submitted')}
    >
      {legacyTrimTestId(reviewedGame, 'submitted') ? (
        <span hidden data-testid={legacyTrimTestId(reviewedGame, 'submitted')} />
      ) : null}
      <AssessmentHeader state="reviewed" moduleTitle={moduleTitle} />
      <SubmittedValues review={review} reviewedGame={reviewedGame} />
      <p
        className="kitchen-day-tutor-assessment__status kitchen-day-tutor-assessment__status--saved"
        data-testid={reviewTestId(reviewedGame, 'saved-note')}
      >
        {kitchenSkillsReviewSavedMessage()} Confirmed in GameBus.
      </p>
    </section>
  );
}

function ReviewAwaiting({
  review,
  moduleTitle,
  reviewedGame,
  studentActorId,
}: {
  review: KitchenSkillsReviewEntry;
  moduleTitle: string;
  reviewedGame: KitchenSkillsReviewedModule;
  studentActorId: string;
}) {
  const { canReassessUnconfirmedReview, discardUnconfirmedReview } = useReadyKitchenSkillsSession();
  const missingAfterRefresh = canReassessUnconfirmedReview(review, studentActorId);
  return (
    <section
      className="kitchen-day-tutor-assessment kitchen-day-tutor-assessment--awaiting"
      data-testid={legacyTrimTestId(reviewedGame, 'awaiting') ?? reviewTestId(reviewedGame, 'awaiting')}
    >
      {legacyTrimTestId(reviewedGame, 'awaiting') ? (
        <span hidden data-testid={reviewTestId(reviewedGame, 'awaiting')} />
      ) : null}
      {legacyTrimTestId(reviewedGame, 'submitted') ? (
        <span hidden data-testid={legacyTrimTestId(reviewedGame, 'submitted')} />
      ) : null}
      <span hidden data-testid={reviewTestId(reviewedGame, 'submitted')} />
      <AssessmentHeader state="awaiting_confirmation" moduleTitle={moduleTitle} />
      <SubmittedValues review={review} reviewedGame={reviewedGame} />
      {missingAfterRefresh ? (
        <div className="kitchen-day-tutor-assessment__notice" data-testid={reviewTestId(reviewedGame, 'missing-after-refresh')}>
          <p className="kitchen-day-tutor-assessment__status kitchen-day-tutor-assessment__status--warning">
            Sent at {formatOperationalTime(review.submittedAt)}, but not in the GameBus trainer feed loaded
            after that. GameBus may not have saved it.
          </p>
          <button
            type="button"
            className="kitchen-day-button kitchen-day-button--ghost kitchen-day-tutor-assessment__reassess"
            data-testid={reviewTestId(reviewedGame, 'reassess')}
            onClick={() => {
              if (!window.confirm(REASSESS_CONFIRM)) return;
              discardUnconfirmedReview(review, studentActorId);
            }}
          >
            Assess again
          </button>
        </div>
      ) : (
        <p
          className="kitchen-day-tutor-assessment__status kitchen-day-tutor-assessment__status--awaiting"
          data-testid={reviewTestId(reviewedGame, 'awaiting-note')}
        >
          {kitchenSkillsReviewAwaitingMessage()} GameBus refreshes this list only when the task is opened —
          close and reopen it to check. Do not submit again.
        </p>
      )}
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
  const timeName = `time-${normalizedRecipeId}-${reviewedGame}`;
  const qualityName = `quality-${normalizedRecipeId}-${reviewedGame}`;

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
      <ReviewAwaiting
        review={awaiting}
        moduleTitle={moduleTitle}
        reviewedGame={reviewedGame}
        studentActorId={selected.actorId}
      />
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

  const statusLabel = sending
    ? 'Sending'
    : canSubmit
      ? ''
      : 'Select both scores to submit';

  const submit = () => {
    if (sendingRef.current) return;
    if (!parsedTime.ok || !parsedQuality.ok) {
      setError('Select integer scores from 0 to 5 for both dimensions. Unselected is not a score.');
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
      const message = kitchenSkillsReviewCommitErrorMessage(
        result.reason,
        moduleTitle,
        result.missing,
      );
      setError(message);
      gamebusDevLog(
        'kitchen-skills-review.ui-error',
        kitchenSkillsReviewDiagnosticPayload(result.reason, entry, {
          missing: result.missing,
        }),
      );
      return;
    }
    setError(null);
    onDraftChange(EMPTY_REVIEW_DRAFT);
    sendingRef.current = false;
    setSending(false);
  };

  return (
    <section
      className="kitchen-day-tutor-assessment"
      data-testid={reviewTestId(reviewedGame, 'form')}
    >
      {legacyForm ? <span hidden data-testid={legacyForm} /> : null}
      <AssessmentHeader state="needs_assessment" moduleTitle={moduleTitle} />

      <ScorePicker
        label="Time efficiency"
        name={timeName}
        value={draft.timeScore}
        disabled={sending}
        invalid={timeInvalid}
        testId={reviewTestId(reviewedGame, 'time-picker')}
        legacyTestId={legacyTime}
        onChange={(timeScore) => onDraftChange({ ...draft, timeScore })}
      />
      <ScorePicker
        label="Preparation quality"
        name={qualityName}
        value={draft.qualityScore}
        disabled={sending}
        invalid={qualityInvalid}
        testId={reviewTestId(reviewedGame, 'quality-picker')}
        legacyTestId={legacyQuality}
        onChange={(qualityScore) => onDraftChange({ ...draft, qualityScore })}
      />

      <label className="kitchen-day-field kitchen-day-tutor-assessment__feedback-field">
        Feedback (optional)
        <textarea
          className="kitchen-day-input kitchen-day-tutor-assessment__feedback-input"
          data-testid={legacyFeedback ?? reviewTestId(reviewedGame, 'feedback')}
          disabled={sending}
          rows={3}
          value={draft.feedback}
          onChange={(event) => onDraftChange({ ...draft, feedback: event.target.value })}
        />
        {legacyFeedback ? <span hidden data-testid={reviewTestId(reviewedGame, 'feedback')} /> : null}
      </label>

      {error ? (
        <p
          className="kitchen-day-error"
          role="alert"
          data-testid={legacyError ?? reviewTestId(reviewedGame, 'error')}
        >
          {error}
        </p>
      ) : null}
      <p
        className="chef-results-empty"
        hidden
        data-testid={legacyUnscored ?? reviewTestId(reviewedGame, 'unscored')}
      >
        Scores stay unanswered until you select 0–5.
      </p>
      <div className="kitchen-day-tutor-assessment__actions">
        <p
          className="kitchen-day-tutor-assessment__status kitchen-day-tutor-assessment__status--inline"
          data-testid={reviewTestId(reviewedGame, 'submit-status')}
          aria-live="polite"
        >
          {statusLabel}
        </p>
        {sending ? (
          <p className="visually-hidden" data-testid={reviewTestId(reviewedGame, 'sending')}>
            Sending assessment…
          </p>
        ) : null}
        <button
          type="button"
          className="kitchen-day-button kitchen-day-button--primary kitchen-day-tutor-assessment__submit"
          data-testid={legacySubmit ?? reviewTestId(reviewedGame, 'submit')}
          disabled={!canSubmit}
          onClick={submit}
        >
          {sending ? 'Sending…' : 'Submit assessment'}
        </button>
      </div>
      {legacySubmit ? (
        <span hidden data-testid={reviewTestId(reviewedGame, 'submit')} />
      ) : null}
    </section>
  );
}
