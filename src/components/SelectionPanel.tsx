import type { SubmissionWindowStatus } from '../types/declaration';
import type { PointsBreakdown } from '../utils/points';
import type { MealSummaryLine } from '../utils/mealChoice';
import { ActionButtons } from './ActionButtons';
import { SavedStatusRow } from './SavedStatusRow';

interface SelectionPanelProps {
  summaryLines: MealSummaryLine[];
  hasSavedDeclaration: boolean;
  updatedAt: string | null;
  savedScoring: PointsBreakdown | null;
  isSubmitDisabled: boolean;
  submissionWindow: SubmissionWindowStatus;
  menuInteractive: boolean;
  onReset: () => void;
  onSubmit: () => void;
  showActions?: boolean;
}

export function SelectionPanel({
  summaryLines,
  hasSavedDeclaration,
  updatedAt,
  savedScoring,
  isSubmitDisabled,
  submissionWindow,
  menuInteractive,
  onReset,
  onSubmit,
  showActions = true,
}: SelectionPanelProps) {
  const hasSummary = summaryLines.length > 0;
  const pointsNow = submissionWindow.totalPointsIfSubmittedNow;

  return (
    <aside className="selection-panel selection-panel--compact">
      <h2 className="selection-panel__title">Your selection</h2>

      {hasSavedDeclaration && updatedAt && savedScoring && (
        <>
          <SavedStatusRow scoring={savedScoring} updatedAt={updatedAt} />
          <p className="selection-panel__final-notice" role="status">
            Final — no changes allowed.
          </p>
        </>
      )}

      {!hasSavedDeclaration && pointsNow !== null && (
        <p className="selection-panel__points-now">
          Submit now for <strong>{pointsNow} points</strong>
        </p>
      )}

      {hasSummary ? (
        <dl className="selection-panel__summary">
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

      {!hasSavedDeclaration && (
        <p className="selection-panel__lock-hint">
          One submit only — your choice becomes final.
        </p>
      )}

      {showActions && menuInteractive && !hasSavedDeclaration && (
        <ActionButtons
          onReset={onReset}
          onSubmit={onSubmit}
          isSubmitDisabled={isSubmitDisabled}
          variant="panel"
        />
      )}
    </aside>
  );
}
