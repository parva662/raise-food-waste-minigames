import { formatDisplayDate } from '../../utils/dates';
import {
  formatCloseoutServiceDateLabel,
  isCloseoutDevDateOverrideActive,
  isServiceCloseoutLiveTestServiceDateActive,
} from '../closeoutServiceDate';

interface ServiceCloseoutHeaderProps {
  serviceDate: string;
}

export function ServiceCloseoutHeader({ serviceDate }: ServiceCloseoutHeaderProps) {
  const devOverrideActive = isCloseoutDevDateOverrideActive(serviceDate);
  const liveTestDateActive = isServiceCloseoutLiveTestServiceDateActive(serviceDate);

  return (
    <header className="closeout-header">
      <div className="closeout-header__title-block">
        <h1 className="closeout-header__title">Service closeout</h1>
        <time className="closeout-header__date" dateTime={serviceDate}>
          {formatDisplayDate(serviceDate)}
        </time>
        {liveTestDateActive && (
          <p
            className="closeout-header__test-date-override"
            data-testid="closeout-test-date-override"
            role="status"
          >
            TEST DATE OVERRIDE — Service date: {formatCloseoutServiceDateLabel(serviceDate)}
          </p>
        )}
        {devOverrideActive && (
          <p className="closeout-header__dev-date" data-testid="closeout-dev-date-label">
            Test service date: {formatDisplayDate(serviceDate)}
          </p>
        )}
      </div>
      <p className="closeout-header__description">
        Record the final figures for today&apos;s lunch service. These values will later be used to
        evaluate the kitchen forecasts.
      </p>
    </header>
  );
}
