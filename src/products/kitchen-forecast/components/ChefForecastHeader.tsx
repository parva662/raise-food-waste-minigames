import type { ChefSubmissionWindowStatus } from '@/products/kitchen-forecast/types';
import { formatCountdown } from '@/shared/time/formatCountdown';
import { formatDisplayDate } from '@/shared/time/dates';

interface ChefForecastHeaderProps {
  serviceDate: string;
  submissionWindow: ChefSubmissionWindowStatus;
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
    submissionWindow.phase === 'closed' ? 'chef-header--closed' : 'chef-header--open';

  return (
    <header className={`chef-header ${phaseClass}`}>
      <div className="chef-header__bar">
        <div className="chef-header__title-block">
          <p className="chef-header__eyebrow">Kitchen forecast</p>
          {serviceDate ? (
            <time className="chef-header__date" dateTime={serviceDate}>
              {formatDisplayDate(serviceDate)}
            </time>
          ) : (
            <p className="chef-header__date">Service date unavailable</p>
          )}
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
          Enter portions for this service day&apos;s menu. One forecast per service day.
        </p>
        <span className="chef-badge chef-badge--deadline">{submissionWindow.windowLabel}</span>
        <span className="chef-header__phase" role="status">
          {submissionWindow.message}
        </span>
      </div>
    </header>
  );
}
