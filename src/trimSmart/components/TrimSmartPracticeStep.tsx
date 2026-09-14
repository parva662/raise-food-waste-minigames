import type { RefObject } from 'react';
import { TRIM_SMART_VISIBLE_PRACTICE_OPTIONS } from '../practiceLabels';
import type { TrimSmartLockedAttempt, TrimSmartPractice } from '../types';
import { TrimSmartContextSummary } from './TrimSmartContextSummary';

interface TrimSmartPracticeStepProps {
  attempt: TrimSmartLockedAttempt;
  headingRef: RefObject<HTMLHeadingElement | null>;
  selectedPractice: TrimSmartPractice | null;
  onSelectPractice: (practice: TrimSmartPractice) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function TrimSmartPracticeStep({
  attempt,
  headingRef,
  selectedPractice,
  onSelectPractice,
  onBack,
  onContinue,
}: TrimSmartPracticeStepProps) {
  return (
    <section className="trim-smart-card" data-testid="trim-smart-step-practice">
      <TrimSmartContextSummary attempt={attempt} />
      <h2 className="trim-smart-card__title" tabIndex={-1} ref={headingRef}>
        Choose your approach
      </h2>
      <p className="trim-smart-card__copy">How will you try to reduce ingredient waste?</p>

      <div className="trim-smart-practice-grid" role="radiogroup" aria-label="Preparation approach">
        {TRIM_SMART_VISIBLE_PRACTICE_OPTIONS.map((option) => {
          const isSelected = selectedPractice === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={
                isSelected
                  ? 'trim-smart-practice-card trim-smart-practice-card--selected'
                  : 'trim-smart-practice-card'
              }
              data-testid={`trim-smart-practice-${option.id}`}
              onClick={() => onSelectPractice(option.id)}
            >
              <span className="trim-smart-practice-card__header">
                <span className="trim-smart-practice-card__title">{option.title}</span>
                {isSelected ? (
                  <span className="trim-smart-practice-card__check" aria-hidden="true">✓</span>
                ) : null}
              </span>
              <span className="trim-smart-practice-card__description">{option.description}</span>
            </button>
          );
        })}
      </div>

      <div className="trim-smart-actions">
        <button type="button" className="trim-smart-button trim-smart-button--secondary" onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className="trim-smart-button trim-smart-button--primary"
          disabled={selectedPractice === null}
          onClick={onContinue}
        >
          Continue
        </button>
      </div>
    </section>
  );
}
