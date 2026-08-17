import type { GameBusChefForecast } from '../forecast/gameBusChefForecastTypes';

interface ServiceCloseoutSubmittedForecastProps {
  forecasts: readonly GameBusChefForecast[];
  isSynthetic?: boolean;
}

export function ServiceCloseoutSubmittedForecast({
  forecasts,
  isSynthetic = false,
}: ServiceCloseoutSubmittedForecastProps) {
  const chefNames = forecasts.map((forecast) => forecast.actorName).join(', ');
  const customerForecasts = forecasts
    .map((forecast) => `${forecast.actorName} — ${forecast.forecastTotalCustomers}`)
    .join('\n');

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
          <dt>Chef{forecasts.length > 1 ? 's' : ''}</dt>
          <dd data-testid="closeout-forecast-chef">{chefNames}</dd>
        </div>
        <div>
          <dt>Expected customers</dt>
          <dd data-testid="closeout-forecast-customers" className="closeout-submitted-forecast__multiline">
            {customerForecasts}
          </dd>
        </div>
      </dl>
    </section>
  );
}
