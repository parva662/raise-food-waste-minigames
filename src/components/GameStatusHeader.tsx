import { CANTEEN_CONFIG } from '../config/canteen';
import type { SubmissionWindowStatus } from '../types/declaration';
import { formatCountdown } from '../services/submissionWindow';
import { getTomorrowIsoDate, formatDisplayDate } from '../utils/dates';

interface GameStatusHeaderProps {
  submissionWindow: SubmissionWindowStatus;
  now: Date;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function GameStatusHeader({ submissionWindow, now }: GameStatusHeaderProps) {
  const tomorrowIso = getTomorrowIsoDate(now);
  const countdown =
    submissionWindow.countdownTargetIso !== null
      ? formatCountdown(now, submissionWindow.countdownTargetIso)
      : null;
  const deadlineLabel = `${pad(CANTEEN_CONFIG.submissionDeadlineHour)}:${pad(CANTEEN_CONFIG.submissionDeadlineMinute)}`;

  return (
    <header className="game-status-header">
      <div className="game-status-header__top">
        <div>
          <p className="game-status-header__eyebrow">Tomorrow&apos;s lunch</p>
          <time className="game-status-header__date" dateTime={tomorrowIso}>
            {formatDisplayDate(tomorrowIso)}
          </time>
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
