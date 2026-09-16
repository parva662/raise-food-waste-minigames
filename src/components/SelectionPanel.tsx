import type { SubmissionWindowStatus } from '../types/declaration';
import type { MealSummaryLine } from '../utils/mealChoice';
import { ActionButtons } from './ActionButtons';
import { SavedStatusRow } from './SavedStatusRow';
import { formatDisplayDate } from '../utils/dates';
import type { LunchSubmitStatus, LunchUiStep } from '../hooks/useLunchSelection';

interface SelectionPanelProps {
  summaryLines: MealSummaryLine[];
  hasSavedDeclaration: boolean;
  updatedAt: string | null;
  lunchDate: string | null;
  uiStep: LunchUiStep;
  submitStatus: LunchSubmitStatus;
  submitError: string | null;
  isReviewDisabled: boolean;
  isConfirmDisabled: boolean;
  submissionWindow: SubmissionWindowStatus;
  menuInteractive: boolean;
  onReset: () => void;
  onEnterReview: () => void;
  onExitReview: () => void;
  onSubmit: () => void;
  showActions?: boolean;
}

export function SelectionPanel({
  summaryLines,
  hasSavedDeclaration,
  updatedAt,
  lunchDate,
  uiStep,
  submitStatus,
  submitError,
  isReviewDisabled,
  isConfirmDisabled,
  submissionWindow,
  menuInteractive,
  onReset,
  onEnterReview,
  onExitReview,
  onSubmit,
  showActions = true,
}: SelectionPanelProps) {
  const hasSummary = summaryLines.length > 0;
  const reviewing = uiStep === 'review';

  let statusText: string | null = null;
  if (submitStatus === 'sending') statusText = 'Sending declaration…';
  else if (submitStatus === 'failed' && submitError) statusText = submitError;
  else if (submitStatus === 'success') statusText = 'Declaration submitted successfully.';

  return (
    <aside className="selection-panel selection-panel--compact" data-testid="selection-panel">
      <h2 className="selection-panel__title">{reviewing ? 'Review declaration' : 'Your selection'}</h2>

      {lunchDate && (
        <p className="selection-panel__service-date" data-testid="review-service-date">
          Service date: {formatDisplayDate(lunchDate)}
        </p>
      )}

      {hasSavedDeclaration && updatedAt && (
        <>
          <SavedStatusRow updatedAt={updatedAt} />
          <p className="selection-panel__final-notice" role="status">
            Final — no changes allowed.
          </p>
        </>
      )}

      {!hasSavedDeclaration && submissionWindow.phase === 'open' && !reviewing && (
        <p className="selection-panel__lock-hint">
          Review your choices, then confirm once — your choice becomes final.
        </p>
      )}

      {hasSummary ? (
        <dl className="selection-panel__summary" data-testid="declaration-summary">
          {summaryLines.map((line) => (
            <div key={`${line.label}-${line.detail}`} className="selection-panel__summary-row">
              <dt>{line.label}</dt>
              <dd>{line.detail}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="selection-panel__hint">Choose a lunch type to begin.</p>
      )}

      {showActions && !hasSavedDeclaration && (
        <>
          {reviewing ? (
            <ActionButtons
              onPrimary={onSubmit}
              primaryLabel={submitStatus === 'sending' ? 'Sending…' : submitStatus === 'failed' ? 'Retry submit' : 'Confirm submission'}
              primaryDisabled={isConfirmDisabled && submitStatus !== 'failed'}
              secondaryLabel="Edit choices"
              onSecondary={onExitReview}
              secondaryDisabled={submitStatus === 'sending'}
              statusText={statusText}
              variant="panel"
            />
          ) : (
            menuInteractive && (
              <ActionButtons
                showReset
                onReset={onReset}
                onPrimary={onEnterReview}
                primaryLabel="Review declaration"
                primaryDisabled={isReviewDisabled}
                variant="panel"
              />
            )
          )}
        </>
      )}
    </aside>
  );
}
