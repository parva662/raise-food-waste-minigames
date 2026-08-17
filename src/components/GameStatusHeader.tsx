import { CANTEEN_CONFIG } from '../config/canteen';
import type { SubmissionWindowStatus } from '../types/declaration';
import { formatCountdown } from '../services/submissionWindow';
import { getTomorrowIsoDate, formatDisplayDate } from '../utils/dates';

interface GameStatusHeaderProps {
  submissionWindow: SubmissionWindowStatus;
  now: Date;
}

export function GameStatusHeader({ submissionWindow, now }: GameStatusHeaderProps) {
  const tomorrowIso = getTomorrowIsoDate(now);
  const countdown =
    submissionWindow.countdownTargetIso !== null
      ? formatCountdown(now, submissionWindow.countdownTargetIso)
      : null;

  return (
    <header className="game-status-header">
      <div className="game-status-header__top">
        <div>
          <p className="game-status-header__eyebrow">Tomorrow&apos;s lunch</p>
          <time className="game-status-header__date" dateTime={tomorrowIso}>
            {formatDisplayDate(tomorrowIso)}
          </time>
        </div>
        {countdown !== null && submissionWindow.phase !== 'closed' && (
          <div className="game-status-header__countdown" aria-live="polite">
            <span className="game-status-header__countdown-label">Time left</span>
            <span className="game-status-header__countdown-value">{countdown}</span>
          </div>
        )}
      </div>

      <div className="game-status-header__badges" role="list" aria-label="Scoring">
        <span className="points-badge points-badge--base" role="listitem">
          {CANTEEN_CONFIG.basePoints} base
        </span>
        <span className="points-badge points-badge--bonus" role="listitem">
          +{CANTEEN_CONFIG.onTimeBonus} on-time
        </span>
        <span className="points-badge points-badge--penalty" role="listitem">
          {CANTEEN_CONFIG.latePenalty} late
        </span>
        <span className="points-badge points-badge--deadline" role="listitem">
          Submit by {CANTEEN_CONFIG.onTimeDeadlineHour}:00
        </span>
      </div>

      <p className="game-status-header__phase" role="status">
        {submissionWindow.message}
        {submissionWindow.totalPointsIfSubmittedNow !== null && (
          <strong className="game-status-header__now-points">
            {' '}
            → {submissionWindow.totalPointsIfSubmittedNow} pts now
          </strong>
        )}
      </p>
    </header>
  );
}
