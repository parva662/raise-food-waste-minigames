import type { GameBusChefForecast } from '../forecast/gameBusChefForecastTypes';

interface ServiceCloseoutSubmittedForecastProps {
  forecast: GameBusChefForecast;
}

export function ServiceCloseoutSubmittedForecast({
  forecast,
}: ServiceCloseoutSubmittedForecastProps) {
  return (
    <section
      className="closeout-submitted-forecast"
      aria-label="Submitted forecast"
      data-testid="closeout-submitted-forecast"
    >
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
