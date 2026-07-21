import { CheckCircle2, AlertCircle } from 'lucide-react';
import { formatSubmissionTime } from '../utils/dates';
import type { PointsBreakdown } from '../utils/points';
import { formatPointsBreakdown, formatSavedStatusSummary } from '../utils/points';

interface SavedStatusRowProps {
  scoring: PointsBreakdown;
  updatedAt: string;
}

export function SavedStatusRow({ scoring, updatedAt }: SavedStatusRowProps) {
  const isOnTime = scoring.timingStatus === 'on-time';
  const Icon = isOnTime ? CheckCircle2 : AlertCircle;
  const statusLabel = isOnTime ? 'On-time lunch saved' : 'Late lunch saved';

  return (
    <div
      className={`saved-status-row saved-status-row--${scoring.timingStatus}`}
      role="status"
      aria-label={`${statusLabel}. ${formatSavedStatusSummary(scoring)}. Last updated at ${formatSubmissionTime(updatedAt)}.`}
    >
      <Icon size={16} className="saved-status-row__icon" aria-hidden="true" />
      <div className="saved-status-row__text">
        <p className="saved-status-row__summary">{formatSavedStatusSummary(scoring)}</p>
        <p className="saved-status-row__breakdown">{formatPointsBreakdown(scoring)}</p>
        <p className="saved-status-row__time">
          Last updated at {formatSubmissionTime(updatedAt)}
        </p>
      </div>
    </div>
  );
}
