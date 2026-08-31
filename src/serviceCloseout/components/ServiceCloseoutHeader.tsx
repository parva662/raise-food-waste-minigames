import { formatDisplayDate } from '../../utils/dates';
import {
  formatCloseoutTestServiceDateLabel,
  isCloseoutDevDateOverrideActive,
  isCloseoutTestServiceDateOverrideActive,
} from '../closeoutServiceDate';

interface ServiceCloseoutHeaderProps {
  serviceDate: string;
}

export function ServiceCloseoutHeader({ serviceDate }: ServiceCloseoutHeaderProps) {
  const devOverrideActive = isCloseoutDevDateOverrideActive(serviceDate);
  const testOverrideActive = isCloseoutTestServiceDateOverrideActive(serviceDate);

  return (
    <header className="closeout-header">
      <div className="closeout-header__title-block">
        <h1 className="closeout-header__title">Service closeout</h1>
        <time className="closeout-header__date" dateTime={serviceDate}>
          {formatDisplayDate(serviceDate)}
        </time>
        {testOverrideActive && (
          <p
            className="closeout-header__test-date-override"
            data-testid="closeout-test-date-override"
            role="status"
          >
            TEST DATE OVERRIDE — Service date: {formatCloseoutTestServiceDateLabel(serviceDate)}
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
