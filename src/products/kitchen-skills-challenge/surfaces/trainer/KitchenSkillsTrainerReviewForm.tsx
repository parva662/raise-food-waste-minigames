import { useEffect, useId, useState } from 'react';
import { useReadyKitchenSkillsSession } from '@/products/kitchen-skills-challenge/domain/session/KitchenSkillsSessionContext';
import { parseKitchenSkillsReviewScore } from '@/products/kitchen-skills-challenge/domain/assessment/scores';
import type {
  KitchenSkillsReviewEntry,
  KitchenSkillsTrainerSession,
} from '@/products/kitchen-skills-challenge/domain/types';
import { findSessionLevelAssessment } from '@/products/kitchen-skills-challenge/domain/session/reviewIdentity';
import {
  kitchenSkillsReviewCommitErrorMessage,
  kitchenSkillsReviewDiagnosticPayload,
  kitchenSkillsReviewSavedMessage,
} from '@/products/kitchen-skills-challenge/gamebus/reviewPostErrors';
import { gamebusDevLog } from '@/platform/gamebus/devLog';
import {
  EMPTY_REVIEW_DRAFT,
  type KitchenSkillsReviewFormDraft,
} from '@/products/kitchen-skills-challenge/surfaces/trainer/reviewDrafts';

const SCORE_OPTIONS = [0, 1, 2, 3, 4, 5] as const;

function ScorePicker({
  label,
  name,
  value,
  disabled,
  invalid,
  testId,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  disabled: boolean;
  invalid: boolean;
  testId: string;
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
      <input
        type="text"
        className="visually-hidden"
        tabIndex={-1}
        aria-hidden="true"
        data-testid={testId.replace(/-picker$/, '')}
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

function ReviewReadback({ review }: { review: KitchenSkillsReviewEntry }) {
  return (
    <section className="chef-results-panel" data-testid="kitchen-day-review-submitted">
      <h3 className="chef-results-panel__title">Tutor assessment</h3>
      <p className="chef-results-panel__intro" data-testid="kitchen-day-review-saved-note">
        {kitchenSkillsReviewSavedMessage()}
      </p>
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

export function KitchenSkillsTrainerReviewForm({
  selected,
  draft,
  onDraftChange,
}: {
  selected: KitchenSkillsTrainerSession;
  draft: KitchenSkillsReviewFormDraft;
  onDraftChange: (draft: KitchenSkillsReviewFormDraft) => void;
}) {
  const { commitReview } = useReadyKitchenSkillsSession();
  const existing = findSessionLevelAssessment(selected);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setError(null);
    setSubmitting(false);
  }, [selected.sessionId]);

  if (existing) {
    return <ReviewReadback review={existing} />;
  }

  const timeScore = draft.timeScore;
  const qualityScore = draft.qualityScore;
  const feedback = draft.feedback;
  const parsedTime = parseKitchenSkillsReviewScore(timeScore);
  const parsedQuality = parseKitchenSkillsReviewScore(qualityScore);
  const timeInvalid = timeScore.trim() !== '' && !parsedTime.ok;
  const qualityInvalid = qualityScore.trim() !== '' && !parsedQuality.ok;

  const submit = () => {
    if (!parsedTime.ok || !parsedQuality.ok) {
      setError('Enter integer scores from 0 to 5. Blank is not a score.');
      return;
    }
    const entry: KitchenSkillsReviewEntry = {
      sessionId: selected.sessionId,
      sessionDate: selected.sessionDate,
      submittedAt: new Date().toISOString(),
      timeEfficiencyScore: parsedTime.value,
      preparationQualityScore: parsedQuality.value,
      ...(feedback.trim() ? { chefFeedback: feedback.trim() } : {}),
      source: 'local',
    };
    setSubmitting(true);
    const result = commitReview(entry, selected.actorId);
    if (!result.ok) {
      setSubmitting(false);
      gamebusDevLog(
        'kitchen-skills-review.ui-commit-failed',
        kitchenSkillsReviewDiagnosticPayload(result.reason, entry, {
          missing: result.missing,
        }),
      );
      setError(kitchenSkillsReviewCommitErrorMessage(result.reason, 'Tutor', result.missing));
      return;
    }
    onDraftChange(EMPTY_REVIEW_DRAFT);
    setError(null);
    setSubmitting(false);
  };

  return (
    <section className="chef-results-panel" data-testid="kitchen-day-review-form">
      <h3 className="chef-results-panel__title">Tutor assessment</h3>
      <p className="chef-results-panel__intro">
        Use the performance evidence above. These scores are your judgement for this whole challenge
        session and are not prefilled.
      </p>
      <p className="chef-results-empty" data-testid="kitchen-day-review-unscored">
        Scores stay unanswered until you enter 0–5. Zero is a valid score.
      </p>
      <ScorePicker
        label="Time efficiency"
        name={`time-${selected.sessionId}`}
        value={timeScore}
        disabled={submitting}
        invalid={timeInvalid}
        testId="kitchen-day-review-time-picker"
        onChange={(next) => onDraftChange({ ...draft, timeScore: next })}
      />
      <ScorePicker
        label="Preparation quality"
        name={`quality-${selected.sessionId}`}
        value={qualityScore}
        disabled={submitting}
        invalid={qualityInvalid}
        testId="kitchen-day-review-quality-picker"
        onChange={(next) => onDraftChange({ ...draft, qualityScore: next })}
      />
      <label className="kitchen-day-field">
        Feedback (optional)
        <textarea
          className="kitchen-day-input"
          data-testid="kitchen-day-review-feedback"
          disabled={submitting}
          value={feedback}
          onChange={(event) => onDraftChange({ ...draft, feedback: event.target.value })}
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
        disabled={submitting}
        onClick={submit}
      >
        Submit review
      </button>
    </section>
  );
}
