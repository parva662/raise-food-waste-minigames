import type { SelectionEntry } from '../types/menu';
import type { SubmitButtonState } from '../utils/declaration';
import type { SubmissionWindowStatus } from '../types/declaration';
import type { PointsBreakdown } from '../utils/points';
import { SelectedItem } from './SelectedItem';
import { NoLunchOption } from './NoLunchOption';
import { ActionButtons } from './ActionButtons';
import { SavedStatusRow } from './SavedStatusRow';
import { SubmissionStatusPanel } from './SubmissionStatusPanel';

interface SelectionPanelProps {
  selections: SelectionEntry[];
  itemCount: number;
  totalPortions: number;
  progressPercent: number;
  noLunch: boolean;
  hasSavedDeclaration: boolean;
  updatedAt: string | null;
  savedScoring: PointsBreakdown | null;
  submitButtonState: SubmitButtonState;
  isSubmitDisabled: boolean;
  isDirty: boolean;
  menuChanged: boolean;
  submissionWindow: SubmissionWindowStatus;
  submissionNow: Date;
  menuInteractive: boolean;
  onIncrement: (itemId: string) => void;
  onDecrement: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  onNoLunchToggle: () => void;
  onReset: () => void;
  onSubmit: () => void;
  showActions?: boolean;
}

export function SelectionPanel({
  selections,
  itemCount,
  totalPortions,
  progressPercent,
  noLunch,
  hasSavedDeclaration,
  updatedAt,
  savedScoring,
  submitButtonState,
  isSubmitDisabled,
  isDirty,
  menuChanged,
  submissionWindow,
  submissionNow,
  menuInteractive,
  onIncrement,
  onDecrement,
  onRemove,
  onNoLunchToggle,
  onReset,
  onSubmit,
  showActions = true,
}: SelectionPanelProps) {
  const hasSelections = selections.length > 0 || noLunch;

  return (
    <aside className="selection-panel">
      <div className="selection-panel__header">
        <h2 className="selection-panel__title">Your Selection</h2>
        <span className="selection-panel__badge">
          {itemCount} {itemCount === 1 ? 'item' : 'items'} &bull; {totalPortions}{' '}
          {totalPortions === 1 ? 'portion' : 'portions'}
        </span>
      </div>

      <SubmissionStatusPanel status={submissionWindow} now={submissionNow} />

      {hasSavedDeclaration && updatedAt && savedScoring && (
        <SavedStatusRow scoring={savedScoring} updatedAt={updatedAt} />
      )}

      {menuChanged && (
        <p className="selection-panel__menu-changed" role="status">
          The menu for this date has changed. Please review and confirm your selection again.
        </p>
      )}

      <div
        className="selection-panel__progress"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Selection progress"
      >
        <div
          className="selection-panel__progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <p className="selection-panel__hint">
        {hasSelections
          ? 'You can still add or remove items.'
          : 'Your selected items will appear here.'}
      </p>

      {selections.length > 0 && (
        <ul className="selection-panel__list">
          {selections.map((entry) => (
            <SelectedItem
              key={entry.itemId}
              entry={entry}
              onIncrement={() => onIncrement(entry.itemId)}
              onDecrement={() => onDecrement(entry.itemId)}
              onRemove={() => onRemove(entry.itemId)}
              disabled={noLunch || !menuInteractive}
            />
          ))}
        </ul>
      )}

      <NoLunchOption
        active={noLunch}
        onToggle={onNoLunchToggle}
        disabled={!menuInteractive}
      />

      {showActions && (
        <ActionButtons
          onReset={onReset}
          onSubmit={onSubmit}
          submitButtonState={submitButtonState}
          isSubmitDisabled={isSubmitDisabled}
          hasSavedDeclaration={hasSavedDeclaration}
          isDirty={isDirty}
          menuChanged={menuChanged}
          menuInteractive={menuInteractive}
          variant="panel"
        />
      )}
    </aside>
  );
}
