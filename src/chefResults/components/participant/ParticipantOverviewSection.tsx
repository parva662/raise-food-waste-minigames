import type { DailyServiceResults, StaffDailyResult } from '../../types';
import type { AnonymousPeerBenchmark, ParticipantPeerComparisonInsight } from '../../teamComparison';
import { ActualKitchenOutcomeSection } from './ActualKitchenOutcomeSection';
import { CategoryDetailPanel } from './CategoryDetailPanel';
import { CategoryOutcomeVisual } from './CategoryOutcomeVisual';
import { ForecastImpactSection } from './ForecastImpactSection';
import { TeamComparisonSection } from './TeamComparisonSection';

interface ParticipantOverviewSectionProps {
  resultsReady: boolean;
  hasCloseout: boolean;
  ownResult: StaffDailyResult | null;
  dailyResults: DailyServiceResults | null;
  peerBenchmark: AnonymousPeerBenchmark | null;
  peerInsights: ParticipantPeerComparisonInsight | null;
}

export function ParticipantOverviewSection({
  resultsReady,
  hasCloseout,
  ownResult,
  dailyResults,
  peerBenchmark,
  peerInsights,
}: ParticipantOverviewSectionProps) {
  return (
    <div className="participant-overview" data-testid="participant-overview-tab">
      {resultsReady && !hasCloseout ? (
        <div className="kitchen-mgmt-surface" data-testid="participant-results-unavailable-closeout">
          <p className="kitchen-mgmt-snapshot-message">Waiting for service closeout</p>
          <p className="kitchen-mgmt-snapshot-hint">
            Results for this service date will appear after the kitchen closeout is recorded.
          </p>
        </div>
      ) : null}

      {resultsReady && hasCloseout && !ownResult ? (
        <div className="kitchen-mgmt-surface" data-testid="participant-no-forecast-result">
          <p className="kitchen-mgmt-snapshot-message">No forecast for this service</p>
          <p className="kitchen-mgmt-snapshot-hint">
            You did not submit a valid forecast for this service date.
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
