import { CHEF_CONFIG } from '../../config/chef';
import type { SubmissionWindowStatus } from '../../types/declaration';
import { formatCountdown } from '../../services/submissionWindow';
import { formatDisplayDate } from '../../utils/dates';

interface ChefForecastHeaderProps {
  serviceDate: string;
  submissionWindow: SubmissionWindowStatus;
  now: Date;
}

export function ChefForecastHeader({
  serviceDate,
  submissionWindow,
  now,
}: ChefForecastHeaderProps) {
  const countdown =
    submissionWindow.countdownTargetIso !== null
      ? formatCountdown(now, submissionWindow.countdownTargetIso)
      : null;

  const phaseClass =
    submissionWindow.phase === 'closed'
      ? 'chef-header--closed'
      : submissionWindow.phase === 'late'
        ? 'chef-header--late'
        : 'chef-header--open';

  return (
    <header className={`chef-header ${phaseClass}`}>
      <div className="chef-header__bar">
        <div className="chef-header__title-block">
          <p className="chef-header__eyebrow">Tomorrow&apos;s kitchen forecast</p>
          <time className="chef-header__date" dateTime={serviceDate}>
            {formatDisplayDate(serviceDate)}
          </time>
        </div>
        {countdown !== null && submissionWindow.phase !== 'closed' && (
          <div className="chef-header__countdown" aria-live="polite">
            <span className="chef-header__countdown-label">Time left</span>
            <span className="chef-header__countdown-value">{countdown}</span>
          </div>
        )}
      </div>

      <div className="chef-header__meta">
        <p className="chef-header__instruction">
          Enter portions for tomorrow&apos;s menu. One forecast per service day.
        </p>
        <span className="chef-badge chef-badge--deadline">
          Deadline {CHEF_CONFIG.lateDeadlineHour}:00 (day before)
        </span>
        <span className="chef-header__phase" role="status">
          {submissionWindow.message}
        </span>
      </div>
    </header>
  );
}
