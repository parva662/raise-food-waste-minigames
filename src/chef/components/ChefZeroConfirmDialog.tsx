interface ChefZeroConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ChefZeroConfirmDialog({ open, onConfirm, onCancel }: ChefZeroConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="chef-zero-dialog-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="chef-zero-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chef-zero-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="chef-zero-dialog-title" className="chef-zero-dialog__title">
          Submit zero forecast?
        </h2>
        <p className="chef-zero-dialog__text">
          Expected customers and all portion forecasts are zero. Do you really want to submit this
          zero forecast?
        </p>
        <div className="chef-zero-dialog__actions">
          <button type="button" className="chef-zero-dialog__btn chef-zero-dialog__btn--cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="chef-zero-dialog__btn chef-zero-dialog__btn--confirm"
            onClick={onConfirm}
          >
            Yes, submit zero forecast
          </button>
        </div>
      </div>
    </div>
  );
}
