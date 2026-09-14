import type { ObservedServiceReality, StaffDailyResult } from '../../types';
import { sumMeasuredOverproductionGrams } from '../../actualKitchenOutcome';
import {
  buildActualVsEstimatedSurplusInsight,
  buildCustomerEstimateDifferenceLabel,
  FORECAST_INPUT_SEPARATION_NOTE,
} from '../../forecastInterpretation';
import { formatNormalizedRate } from '../../managementFormat';
import {
  shortageRateGramsPerCustomer,
  surplusRateGramsPerCustomer,
} from '../../teamComparison';
import { formatGrams } from '../../useChefResultsData';
import { CustomerEstimateCard } from './CustomerEstimateCard';
import { ProductionPlanCard } from './ProductionPlanCard';

interface ForecastImpactSectionProps {
  result: StaffDailyResult;
  observed: ObservedServiceReality;
}

export function ForecastImpactSection({ result, observed }: ForecastImpactSectionProps) {
  const actualSurplusGrams = sumMeasuredOverproductionGrams(observed);
  const estimatedSurplusGrams = result.totalSimulatedOverproductionGrams;
  const surplusInsight = buildActualVsEstimatedSurplusInsight(
    actualSurplusGrams,
    estimatedSurplusGrams,
  );
  const difference = buildCustomerEstimateDifferenceLabel(
    result.forecastCustomers,
    result.actualCustomers,
  );
  const surplusRate = surplusRateGramsPerCustomer(result);
  const shortageRate = shortageRateGramsPerCustomer(result);

  const differencePrimary =
    difference.primary === 'On target'
      ? 'On target'
      : difference.secondary === 'customers high'
        ? `${Math.abs(result.customerForecastDifference)} high`
        : `${Math.abs(result.customerForecastDifference)} low`;

  return (
    <section
      className="kitchen-mgmt-surface participant-your-forecast"
      data-testid="forecast-impact-section"
    >
      <h3 className="kitchen-mgmt-surface__title">Your forecast</h3>

      <div className="kitchen-mgmt-kpi-grid participant-forecast-kpis" data-testid="participant-forecast-kpis">
        <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--forecast">
          <p className="kitchen-mgmt-kpi__value" data-testid="participant-kpi-customer-estimate">
            {result.forecastCustomers}
          </p>
          <p className="kitchen-mgmt-kpi__label">Customer estimate</p>
        </article>
        <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--forecast">
          <p className="kitchen-mgmt-kpi__value" data-testid="participant-kpi-customer-difference">
            {differencePrimary}
          </p>
          <p className="kitchen-mgmt-kpi__label">
            {difference.primary === 'On target'
              ? 'Customer difference'
              : `vs ${result.actualCustomers} actual`}
          </p>
        </article>
        <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--surplus">
          <p className="kitchen-mgmt-kpi__value" data-testid="participant-kpi-estimated-surplus">
            {formatNormalizedRate(surplusRate)}
          </p>
          <p className="kitchen-mgmt-kpi__label">Estimated surplus</p>
          <p className="kitchen-mgmt-forecast-cell__secondary" data-testid="participant-kpi-surplus-absolute">
            {formatGrams(result.totalSimulatedOverproductionGrams)} total
          </p>
        </article>
        <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--shortage">
          <p className="kitchen-mgmt-kpi__value" data-testid="participant-kpi-estimated-shortage">
            {formatNormalizedRate(shortageRate)}
          </p>
          <p className="kitchen-mgmt-kpi__label">Estimated shortage</p>
          <p className="kitchen-mgmt-forecast-cell__secondary" data-testid="participant-kpi-shortage-absolute">
            {formatGrams(result.totalSimulatedShortageGrams)} total
          </p>
        </article>
      </div>

      <p className="kitchen-mgmt-snapshot-hint participant-forecast-hint">
        You make two forecasts: a customer estimate and a production plan.
      </p>

      <div className="kitchen-mgmt-detail-cards">
        <CustomerEstimateCard result={result} />
        <ProductionPlanCard result={result} surplusInsight={surplusInsight} />
      </div>

      <p className="chef-results-separation-note" data-testid="forecast-input-separation-note">
        {FORECAST_INPUT_SEPARATION_NOTE}
      </p>

    </section>
  );
}
