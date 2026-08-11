import { CLOSEOUT_INCOMPLETE_MESSAGE } from '../types';

interface ServiceCloseoutFinalizePanelProps {
  disabled: boolean;
  formComplete: boolean;
  hasValidationErrors: boolean;
  formInteractive: boolean;
  finalized: boolean;
  canFinalize: boolean;
  onFinalize: () => void;
}

export function ServiceCloseoutFinalizePanel({
  disabled,
  formComplete,
  hasValidationErrors,
  formInteractive,
  finalized,
  canFinalize,
  onFinalize,
}: ServiceCloseoutFinalizePanelProps) {
  const showIncompleteMessage =
    formInteractive && !finalized && !formComplete && !hasValidationErrors;

  const showUnauthorizedMessage = formInteractive && !finalized && !canFinalize;

  return (
    <div className="closeout-finalize-panel">
      {showIncompleteMessage && (
        <p
          id="closeout-finalize-guidance"
          className="closeout-finalize-panel__guidance"
          role="status"
        >
          {CLOSEOUT_INCOMPLETE_MESSAGE}
        </p>
      )}

      {showUnauthorizedMessage && (
        <p className="closeout-finalize-panel__guidance closeout-finalize-panel__guidance--warn" role="status">
          You do not have permission to finalize this service.
        </p>
      )}

      {finalized && (
        <p className="closeout-finalize-panel__success" role="status">
          Service closeout finalized for this session. Figures are saved locally until GameBus
          integration is enabled.
        </p>
      )}

      <button
        type="button"
        className="closeout-finalize-btn"
        disabled={disabled}
        onClick={onFinalize}
        aria-describedby={showIncompleteMessage ? 'closeout-finalize-guidance' : undefined}
      >
        Finalize service
      </button>
    </div>
  );
}
