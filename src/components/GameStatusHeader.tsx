import { CANTEEN_CONFIG } from '../config/canteen';
import type { SubmissionWindowStatus } from '../types/declaration';
import { formatCountdown } from '../services/submissionWindow';
import { formatDisplayDate } from '../utils/dates';

interface GameStatusHeaderProps {
  submissionWindow: SubmissionWindowStatus;
  now: Date;
  lunchDate: string | null;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function GameStatusHeader({ submissionWindow, now, lunchDate }: GameStatusHeaderProps) {
  const countdown =
    submissionWindow.countdownTargetIso !== null
      ? formatCountdown(now, submissionWindow.countdownTargetIso)
      : null;
  const deadlineLabel = `${pad(CANTEEN_CONFIG.submissionDeadlineHour)}:${pad(CANTEEN_CONFIG.submissionDeadlineMinute)}`;

  return (
    <header className="game-status-header">
      <div className="game-status-header__top">
        <div>
          <p className="game-status-header__eyebrow">Next lunch service</p>
          {lunchDate ? (
            <time className="game-status-header__date" dateTime={lunchDate}>
              {formatDisplayDate(lunchDate)}
            </time>
          ) : (
            <p className="game-status-header__date">Service date unavailable</p>
          )}
        </div>
        {countdown !== null && submissionWindow.phase === 'open' && (
          <div className="game-status-header__countdown" aria-live="polite">
            <span className="game-status-header__countdown-label">Time left</span>
            <span className="game-status-header__countdown-value">{countdown}</span>
          </div>
        )}
      </div>

      {submissionWindow.phase === 'open' ? (
        <p className="game-status-header__deadline" role="status">
          Submit by {deadlineLabel}
        </p>
      ) : (
        <p className="game-status-header__phase" role="status">
          {submissionWindow.message}
        </p>
      )}
    </header>
  );
}
