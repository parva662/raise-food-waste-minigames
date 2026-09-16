import { Lock } from 'lucide-react';

interface ActionButtonsProps {
  onReset?: () => void;
  onPrimary: () => void;
  primaryLabel: string;
  primaryDisabled: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryDisabled?: boolean;
  showReset?: boolean;
  statusText?: string | null;
  variant?: 'panel' | 'sticky';
}

export function ActionButtons({
  onReset,
  onPrimary,
  primaryLabel,
  primaryDisabled,
  secondaryLabel,
  onSecondary,
  secondaryDisabled = false,
  showReset = false,
  statusText = null,
  variant = 'panel',
}: ActionButtonsProps) {
  return (
    <div className={`action-buttons action-buttons--${variant}`}>
      {showReset && onReset && (
        <button type="button" className="action-buttons__reset" onClick={onReset}>
          Reset all
        </button>
      )}
      {secondaryLabel && onSecondary && (
        <button
          type="button"
          className="action-buttons__reset"
          onClick={onSecondary}
          disabled={secondaryDisabled}
        >
          {secondaryLabel}
        </button>
      )}
      <button
        type="button"
        className="action-buttons__submit"
        onClick={onPrimary}
        disabled={primaryDisabled}
        aria-label={primaryLabel}
      >
        {primaryLabel}
      </button>
      {statusText && (
        <p className="action-buttons__lock-notice" role="status">
          {statusText}
        </p>
      )}
      {variant === 'panel' && !statusText && (
        <p className="action-buttons__lock-notice">
          <Lock size={12} aria-hidden="true" />
          After you confirm, your choice is final for this date.
        </p>
      )}
    </div>
  );
}
