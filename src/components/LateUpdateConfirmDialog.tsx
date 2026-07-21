import { useEffect, useRef } from 'react';
import { getLateTotalPoints, getOnTimeTotalPoints } from '../utils/points';

interface LateUpdateConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LateUpdateConfirmDialog({
  open,
  onConfirm,
  onCancel,
}: LateUpdateConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const onTimeTotal = getOnTimeTotalPoints();
  const lateTotal = getLateTotalPoints();

  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="confirm-dialog-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="late-update-title"
        aria-describedby="late-update-desc"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="late-update-title" className="confirm-dialog__title">
          Confirm late update
        </h2>
        <p id="late-update-desc" className="confirm-dialog__message">
          You currently have {onTimeTotal} points for an on-time submission. Updating now will
          replace your declaration and reduce the score to {lateTotal} points. Your updated
          selection will still be included in the canteen estimate.
        </p>
        <div className="confirm-dialog__actions">
          <button type="button" className="confirm-dialog__cancel" ref={cancelRef} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="confirm-dialog__confirm" onClick={onConfirm}>
            Update and accept {lateTotal} points
          </button>
        </div>
      </div>
    </div>
  );
}
