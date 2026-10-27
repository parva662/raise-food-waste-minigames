import type { DailyServiceResults, StaffDailyResult, ObservedServiceReality } from '@/products/forecast-results/types';
import type { ChefForecastForCalculation } from '@/products/forecast-results/types';
import type { AnonymousPeerBenchmark } from '@/products/forecast-results/calculations/teamComparison';
import { buildForecastPerformanceSummary } from '@/products/forecast-results/calculations/teamComparison';
import {
  formatCustomerError,
  formatGramsPerCustomer,
} from '@/products/forecast-results/calculations/participantProgressData';
import { formatServiceDateLong } from '@/products/forecast-results/displayFormat';
import { ActualKitchenOutcomeSection } from '@/products/forecast-results/participant/components/ActualKitchenOutcomeSection';
import { TeamComparisonSection } from '@/products/forecast-results/participant/components/TeamComparisonSection';

interface ParticipantOverviewSectionProps {
  hasCloseout: boolean;
  isServiceDay: boolean;
  ownResult: StaffDailyResult | null;
  latestOwnResult: StaffDailyResult | null;
  dailyResults: DailyServiceResults | null;
  pendingForecast: ChefForecastForCalculation | null;
  latestPeerBenchmark: AnonymousPeerBenchmark | null;
}

function PendingForecastSummary({ forecast }: { forecast: ChefForecastForCalculation }) {
  return (
    <div className="kitchen-mgmt-surface" data-testid="participant-pending-forecast-summary">
      <h3 className="kitchen-mgmt-surface__title">Your submitted forecast</h3>
      <p className="kitchen-mgmt-snapshot-hint" data-testid="pending-forecast-explanation">
        Your forecast results will be available once the kitchen&apos;s final service figures have
        been recorded.
      </p>
      <dl className="chef-results-pending-forecast">
        <div>
          <dt>Expected customers</dt>
          <dd data-testid="pending-forecast-customers">{forecast.forecastTotalCustomers}</dd>
        </div>
        <div>
          <dt>Main portions</dt>
          <dd data-testid="pending-forecast-main">{forecast.main.forecastQuantity}</dd>
        </div>
        <div>
          <dt>Vegetarian portions</dt>
          <dd data-testid="pending-forecast-vegetarian">{forecast.vegetarian.forecastQuantity}</dd>
        </div>
        <div>
          <dt>Soup-menu portions</dt>
          <dd data-testid="pending-forecast-soup">{forecast.soup.forecastQuantity}</dd>
        </div>
      </dl>
    </div>
  );
}

function LatestForecastResult({ result }: { result: StaffDailyResult | null }) {
  if (!result) {
    return (
      <section className="kitchen-mgmt-surface" data-testid="latest-forecast-empty">
        <h3 className="kitchen-mgmt-surface__title">Latest Forecast Result</h3>
        <p>No forecast results yet.</p>
      </section>
    );
  }

  const surplus =
    result.actualCustomers > 0
      ? result.totalSimulatedOverproductionGrams / result.actualCustomers
      : null;
  const shortage =
    result.actualCustomers > 0
      ? result.totalSimulatedShortageGrams / result.actualCustomers
      : null;

  return (
    <section className="kitchen-mgmt-surface" data-testid="latest-forecast-result">
      <h3 className="kitchen-mgmt-surface__title">Latest Forecast Result</h3>
      <p className="kitchen-mgmt-snapshot-hint" data-testid="latest-forecast-date">
        {formatServiceDateLong(result.serviceDate)}
      </p>
      <dl className="chef-results-latest-metrics">
        <div>
          <dt>Simulated surplus</dt>
          <dd data-testid="latest-surplus">{formatGramsPerCustomer(surplus)}</dd>
        </div>
        <div>
          <dt>Simulated shortage</dt>
          <dd data-testid="latest-shortage">{formatGramsPerCustomer(shortage)}</dd>
        </div>
        <div>
          <dt>Customer forecast error</dt>
          <dd data-testid="latest-customer-error">
            {formatCustomerError(result.customerForecastAbsoluteError)}
          </dd>
        </div>
      </dl>
    </section>
  );
}

export function ParticipantOverviewSection({
  hasCloseout,
  isServiceDay,
  ownResult,
  latestOwnResult,
  dailyResults,
  pendingForecast,
  latestPeerBenchmark,
}: ParticipantOverviewSectionProps) {
  const observed: ObservedServiceReality | null = dailyResults?.observed ?? null;
  const performanceSummary =
    latestPeerBenchmark !== null ? buildForecastPerformanceSummary(latestPeerBenchmark) : [];

  return (
    <div className="participant-overview" data-testid="participant-overview-tab">
      <LatestForecastResult result={latestOwnResult} />

      {latestOwnResult && latestPeerBenchmark ? (
        <TeamComparisonSection participant={latestOwnResult} benchmark={latestPeerBenchmark} />
      ) : null}

      {latestOwnResult && performanceSummary.length > 0 ? (
        <section
          className="kitchen-mgmt-surface chef-results-performance-summary"
          data-testid="forecast-performance-summary"
        >
          <h3 className="kitchen-mgmt-surface__title">Performance Summary</h3>
          <p data-testid="performance-summary-text">{performanceSummary.join(' ')}</p>
        </section>
      ) : null}

      {isServiceDay && !hasCloseout && pendingForecast ? (
        <details className="forecast-service-details">
          <summary>Your submitted forecast</summary>
          <PendingForecastSummary forecast={pendingForecast} />
        </details>
      ) : null}

      {isServiceDay && hasCloseout && !ownResult && observed ? (
        <details className="forecast-service-details">
          <summary>Current service · actual kitchen outcome</summary>
          <ActualKitchenOutcomeSection observed={observed} />
        </details>
      ) : null}
    </div>
  );
}
