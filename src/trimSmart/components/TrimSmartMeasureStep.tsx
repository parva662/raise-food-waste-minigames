import type { RefObject } from 'react';
import { formatPracticeLabel } from '../practiceLabels';
import type { TrimSmartLockedAttempt, TrimSmartPractice } from '../types';
import { TrimSmartContextSummary } from './TrimSmartContextSummary';

interface TrimSmartMeasureStepProps {
  attempt: TrimSmartLockedAttempt;
  practice: TrimSmartPractice;
  wasteInput: string;
  wasteError: string | null;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onWasteChange: (value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
  isSubmitting: boolean;
  submitError: string | null;
}

export function TrimSmartMeasureStep({
  attempt,
  practice,
  wasteInput,
  wasteError,
  headingRef,
  onWasteChange,
  onBack,
  onSubmit,
  canSubmit,
  isSubmitting,
  submitError,
}: TrimSmartMeasureStepProps) {
  const helperId = 'trim-smart-waste-helper';
  const errorId = 'trim-smart-waste-error';

  return (
    <section className="trim-smart-card" data-testid="trim-smart-step-measure">
      <h2 className="trim-smart-card__title" tabIndex={-1} ref={headingRef}>
        Measure your ingredient waste
      </h2>

      <TrimSmartContextSummary attempt={attempt} variant="measure" />

      <div className="trim-smart-waste-input-wrap">
        <label className="trim-smart-waste-label" htmlFor="trim-smart-waste-input">
          Preparation waste
        </label>
        <div className="trim-smart-waste-input-row">
          <input
            id="trim-smart-waste-input"
            className="trim-smart-waste-input"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={wasteInput}
            onChange={(event) => onWasteChange(event.target.value)}
            aria-describedby={`${helperId}${wasteError ? ` ${errorId}` : ''}`}
            aria-invalid={wasteError ? true : undefined}
            data-testid="trim-smart-waste-input"
          />
          <span className="trim-smart-waste-unit" aria-hidden="true">g</span>
        </div>
        <p id={helperId} className="trim-smart-helper">
          Weigh the ingredient material you discarded during preparation.
        </p>
        {wasteError ? (
          <p id={errorId} className="trim-smart-error" role="alert">
            {wasteError}
          </p>
        ) : null}
      </div>

      <div className="trim-smart-review" data-testid="trim-smart-review-summary">
        <span className="trim-smart-review__label">Selected approach</span>
        <span className="trim-smart-review__value">{formatPracticeLabel(practice)}</span>
      </div>

      {submitError ? (
        <p className="trim-smart-error trim-smart-error--block" role="alert" data-testid="trim-smart-submit-error">
          {submitError}
        </p>
      ) : null}

      <div className="trim-smart-actions">
        <button type="button" className="trim-smart-button trim-smart-button--secondary" onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className="trim-smart-button trim-smart-button--primary"
          disabled={!canSubmit || isSubmitting}
          onClick={onSubmit}
          data-testid="trim-smart-submit-button"
        >
          {isSubmitting ? 'Submitting…' : 'Submit result'}
        </button>
      </div>
    </section>
  );
}
