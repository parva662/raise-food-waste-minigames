import { formatCustomerErrorCount, formatNormalizedRate } from '../../managementFormat';
import type { ServiceTeamOverview } from '../../managementTrendsData';

interface TeamOverviewSectionProps {
  overview: ServiceTeamOverview;
}

export function TeamOverviewSection({ overview }: TeamOverviewSectionProps) {
  return (
    <section className="kitchen-mgmt-section" data-testid="kitchen-mgmt-team-overview">
      <h2 className="kitchen-mgmt-section__title">Team overview</h2>
      <dl className="kitchen-mgmt-metrics">
        <div>
          <dt>Staff participating</dt>
          <dd data-testid="team-overview-staff-count">{overview.staffParticipating}</dd>
        </div>
        <div>
          <dt>Median estimated surplus</dt>
          <dd data-testid="team-overview-median-surplus">
            {formatNormalizedRate(overview.medianSurplusRateGramsPerCustomer)}
          </dd>
        </div>
        <div>
          <dt>Median estimated shortage</dt>
          <dd data-testid="team-overview-median-shortage">
            {formatNormalizedRate(overview.medianShortageRateGramsPerCustomer)}
          </dd>
        </div>
        <div>
          <dt>Median customer forecast error</dt>
          <dd data-testid="team-overview-median-customer-error">
            {overview.medianCustomerForecastError === null
              ? 'Unavailable'
              : formatCustomerErrorCount(overview.medianCustomerForecastError)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
