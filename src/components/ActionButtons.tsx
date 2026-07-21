import { RotateCcw, Lock } from 'lucide-react';
import type { SubmitButtonState } from '../utils/declaration';

interface ActionButtonsProps {
  onReset: () => void;
  onSubmit: () => void;
  submitButtonState: SubmitButtonState;
  isSubmitDisabled: boolean;
  hasSavedDeclaration: boolean;
  isDirty?: boolean;
  menuChanged?: boolean;
  menuInteractive?: boolean;
  variant?: 'panel' | 'sticky';
}

const SUBMIT_LABELS: Record<SubmitButtonState, string> = {
  submit: 'Submit my lunch',
  update: 'Update my lunch',
};

export function ActionButtons({
  onReset,
  onSubmit,
  submitButtonState,
  isSubmitDisabled,
  hasSavedDeclaration,
  isDirty = false,
  menuChanged = false,
  menuInteractive = true,
  variant = 'panel',
}: ActionButtonsProps) {
  const submitLabel = SUBMIT_LABELS[submitButtonState];
  const showUpdateHelper =
    variant === 'panel' &&
    hasSavedDeclaration &&
    menuInteractive &&
    !menuChanged;

  return (
    <div className={`action-buttons action-buttons--${variant}`}>
      <button type="button" className="action-buttons__reset" onClick={onReset}>
        <RotateCcw size={16} aria-hidden="true" />
        Reset all
      </button>
      <button
        type="button"
        className="action-buttons__submit"
        onClick={onSubmit}
        disabled={isSubmitDisabled}
        aria-label={submitLabel}
      >
        {submitLabel}
      </button>
      {variant === 'panel' && !hasSavedDeclaration && (
        <p className="action-buttons__lock-notice">
          <Lock size={12} aria-hidden="true" />
          Your selection will be saved when you submit.
        </p>
      )}
      {showUpdateHelper && !isDirty && (
        <p className="action-buttons__helper" role="status">
          Change your selection to update your lunch.
        </p>
      )}
      {showUpdateHelper && isDirty && (
        <p className="action-buttons__helper action-buttons__helper--unsaved" role="status">
          You have unsaved changes.
        </p>
      )}
    </div>
  );
}
