import type { GameBusChefForecast } from '../forecast/gameBusChefForecastTypes';

interface ServiceCloseoutSubmittedForecastProps {
  forecast: GameBusChefForecast;
  isSynthetic?: boolean;
}

export function ServiceCloseoutSubmittedForecast({
  forecast,
  isSynthetic = false,
}: ServiceCloseoutSubmittedForecastProps) {
  return (
    <section
      className="closeout-submitted-forecast"
      aria-label="Submitted forecast"
      data-testid="closeout-submitted-forecast"
    >
      {isSynthetic && (
        <p className="closeout-submitted-forecast__test-banner" data-testid="closeout-synthetic-forecast-banner">
          TEST DATA — synthetic forecast
        </p>
      )}
      <h2 className="closeout-submitted-forecast__title">Submitted forecast</h2>
      <dl className="closeout-submitted-forecast__facts">
        <div>
          <dt>Chef</dt>
          <dd data-testid="closeout-forecast-chef">{forecast.actorName}</dd>
        </div>
        <div>
          <dt>Expected customers</dt>
          <dd data-testid="closeout-forecast-customers">{forecast.forecastTotalCustomers}</dd>
        </div>
      </dl>
    </section>
  );
}
