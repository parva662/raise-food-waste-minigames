import { formatDisplayDate } from '../../utils/dates';
import { isCloseoutDevDateOverrideActive } from '../closeoutServiceDate';

interface ServiceCloseoutHeaderProps {
  serviceDate: string;
}

export function ServiceCloseoutHeader({ serviceDate }: ServiceCloseoutHeaderProps) {
  const devOverrideActive = isCloseoutDevDateOverrideActive(serviceDate);

  return (
    <header className="closeout-header">
      <div className="closeout-header__title-block">
        <h1 className="closeout-header__title">Service closeout</h1>
        <time className="closeout-header__date" dateTime={serviceDate}>
          {formatDisplayDate(serviceDate)}
        </time>
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
