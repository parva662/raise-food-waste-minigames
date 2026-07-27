import { RotateCcw, Lock } from 'lucide-react';

interface ActionButtonsProps {
  onReset: () => void;
  onSubmit: () => void;
  isSubmitDisabled: boolean;
  variant?: 'panel' | 'sticky';
}

export function ActionButtons({
  onReset,
  onSubmit,
  isSubmitDisabled,
  variant = 'panel',
}: ActionButtonsProps) {
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
        aria-label="Submit my lunch"
      >
        Submit my lunch
      </button>
      {variant === 'panel' && (
        <p className="action-buttons__lock-notice">
          <Lock size={12} aria-hidden="true" />
          After you submit, your choice is final for this date.
        </p>
      )}
    </div>
  );
}
