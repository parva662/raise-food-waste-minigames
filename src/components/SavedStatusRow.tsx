import { CheckCircle2 } from 'lucide-react';
import { formatSubmissionTime } from '../utils/dates';

interface SavedStatusRowProps {
  updatedAt: string;
}

export function SavedStatusRow({ updatedAt }: SavedStatusRowProps) {
  return (
    <div className="saved-status-row saved-status-row--saved" role="status">
      <CheckCircle2 size={16} className="saved-status-row__icon" aria-hidden="true" />
      <div className="saved-status-row__text">
        <p className="saved-status-row__summary">Lunch saved</p>
        <p className="saved-status-row__time">
          Last updated at {formatSubmissionTime(updatedAt)}
        </p>
      </div>
    </div>
  );
}
