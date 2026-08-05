import { CHEF_INCOMPLETE_FORM_MESSAGE } from '../types';

interface ChefSubmitPanelProps {
  disabled: boolean;
  formComplete: boolean;
  hasValidationErrors: boolean;
  formInteractive: boolean;
  hasSubmitted: boolean;
  submissionOpen: boolean;
  waitingForTask: boolean;
  onSubmit: () => void;
}

export function ChefSubmitPanel({
  disabled,
  formComplete,
  hasValidationErrors,
  formInteractive,
  hasSubmitted,
  submissionOpen,
  waitingForTask,
  onSubmit,
}: ChefSubmitPanelProps) {
  const showIncompleteMessage =
    formInteractive && !hasSubmitted && submissionOpen && !formComplete && !hasValidationErrors;

  const showWaitingMessage = formInteractive && !hasSubmitted && waitingForTask && formComplete;

  return (
    <div className="chef-submit-panel">
      {showIncompleteMessage && (
        <p
          id="chef-submit-guidance"
          className="chef-submit-panel__guidance"
          role="status"
          aria-live="polite"
        >
          {CHEF_INCOMPLETE_FORM_MESSAGE}
        </p>
      )}

      {showWaitingMessage && (
        <p className="chef-submit-panel__guidance" role="status">
          Waiting for GameBus task…
        </p>
      )}

      <button
        type="button"
        className="chef-submit-btn"
        disabled={disabled}
        onClick={onSubmit}
        aria-describedby={showIncompleteMessage ? 'chef-submit-guidance' : undefined}
      >
        Submit forecast
      </button>
    </div>
  );
}
