import type { ObservedServiceReality, StaffDailyResult } from '../../types';
import { sumMeasuredOverproductionGrams } from '../../actualKitchenOutcome';
import {
  buildActualVsEstimatedSurplusInsight,
  FORECAST_INPUT_SEPARATION_NOTE,
} from '../../forecastInterpretation';
import { CategoryDetailPanel } from './CategoryDetailPanel';
import { CategoryOutcomeVisual } from './CategoryOutcomeVisual';
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

  return (
    <section
      className="chef-results-subsection chef-results-forecast-impact"
      data-testid="forecast-impact-section"
    >
      <h3 className="chef-results-subsection-title">Your forecast</h3>
      <p className="chef-results-subsection-intro">
        You make two forecasts: a customer estimate and a production plan.
      </p>

      <div className="chef-results-your-forecast">
        <CustomerEstimateCard result={result} />
        <ProductionPlanCard result={result} surplusInsight={surplusInsight} />
      </div>

      <p className="chef-results-separation-note" data-testid="forecast-input-separation-note">
        {FORECAST_INPUT_SEPARATION_NOTE}
      </p>

      <CategoryOutcomeVisual result={result} />
      <CategoryDetailPanel result={result} />
    </section>
  );
}
