import type { DailyServiceResults, StaffDailyResult, ObservedServiceReality } from '../../types';
import type { ChefForecastForCalculation } from '../../types';
import type { AnonymousPeerBenchmark, ParticipantPeerComparisonInsight } from '../../teamComparison';
import { ActualKitchenOutcomeSection } from './ActualKitchenOutcomeSection';
import { CategoryDetailPanel } from './CategoryDetailPanel';
import { CategoryOutcomeVisual } from './CategoryOutcomeVisual';
import { ForecastImpactSection } from './ForecastImpactSection';
import { TeamComparisonSection } from './TeamComparisonSection';

interface ParticipantOverviewSectionProps {
  resultsReady: boolean;
  hasCloseout: boolean;
  isServiceDay: boolean;
  ownResult: StaffDailyResult | null;
  dailyResults: DailyServiceResults | null;
  pendingForecast: ChefForecastForCalculation | null;
  peerBenchmark: AnonymousPeerBenchmark | null;
  peerInsights: ParticipantPeerComparisonInsight | null;
}

function PendingForecastSummary({ forecast }: { forecast: ChefForecastForCalculation }) {
  return (
    <div className="kitchen-mgmt-surface" data-testid="participant-pending-forecast-summary">
      <h3 className="kitchen-mgmt-surface__title">Your submitted forecast</h3>
      <p className="kitchen-mgmt-snapshot-hint">
        Simulation metrics appear after service closeout is recorded.
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

export function ParticipantOverviewSection({
  resultsReady,
  hasCloseout,
  isServiceDay,
  ownResult,
  dailyResults,
  pendingForecast,
  peerBenchmark,
  peerInsights,
}: ParticipantOverviewSectionProps) {
  const observed: ObservedServiceReality | null = dailyResults?.observed ?? null;

  if (!isServiceDay) {
    return (
      <div className="participant-overview" data-testid="participant-overview-tab">
        <div className="kitchen-mgmt-surface" data-testid="participant-no-service-day">
          <p className="kitchen-mgmt-snapshot-message">No kitchen service is scheduled for this date.</p>
          <p className="kitchen-mgmt-snapshot-hint">
            You can still review your previous results in Progress.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="participant-overview" data-testid="participant-overview-tab">
      {resultsReady && !hasCloseout ? (
        <div className="kitchen-mgmt-surface" data-testid="participant-results-unavailable-closeout">
          <p className="kitchen-mgmt-snapshot-message">Waiting for service closeout</p>
          <p className="kitchen-mgmt-snapshot-hint">
            Result-dependent metrics for this service date will appear after the kitchen closeout is
            recorded. Your earlier Progress history stays available.
          </p>
        </div>
      ) : null}

      {resultsReady && !hasCloseout && pendingForecast ? (
        <PendingForecastSummary forecast={pendingForecast} />
      ) : null}

      {resultsReady && hasCloseout && !ownResult ? (
        <div className="kitchen-mgmt-surface" data-testid="participant-no-forecast-result">
          <p className="kitchen-mgmt-snapshot-message">No forecast for this service</p>
          <p className="kitchen-mgmt-snapshot-hint">
            You did not submit a valid forecast for this service date, so personal simulated
            comparison is unavailable. The actual kitchen outcome is still shown below.
          </p>
        </div>
      ) : null}

      {ownResult && dailyResults ? (
        <>
          <ForecastImpactSection result={ownResult} observed={dailyResults.observed} />
          <ActualKitchenOutcomeSection observed={dailyResults.observed} />
          <section className="kitchen-mgmt-surface participant-menu-section">
            <CategoryOutcomeVisual result={ownResult} />
            <CategoryDetailPanel result={ownResult} />
          </section>
        </>
      ) : null}

      {!ownResult && observed ? <ActualKitchenOutcomeSection observed={observed} /> : null}

      {ownResult && peerBenchmark && peerInsights ? (
        <TeamComparisonSection
          participant={ownResult}
          benchmark={peerBenchmark}
          insights={peerInsights}
        />
      ) : null}
    </div>
  );
}
