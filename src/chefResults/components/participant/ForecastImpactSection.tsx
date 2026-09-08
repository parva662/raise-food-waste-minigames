import type { ObservedServiceReality, StaffDailyResult } from '../../types';
import { sumMeasuredOverproductionGrams } from '../../actualKitchenOutcome';
import { buildActualVsEstimatedSurplusInsight } from '../../forecastInterpretation';
import { CategoryDetailPanel } from './CategoryDetailPanel';
import { CategoryOutcomeVisual } from './CategoryOutcomeVisual';
import { SummaryCards } from './SummaryCards';

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
      className="chef-results-dashboard-section chef-results-forecast-impact"
      data-testid="forecast-impact-section"
    >
      <h2 className="chef-results-section-title">If your forecast had been used</h2>
      <p className="chef-results-section-intro">
        We compare the amount your forecast would have prepared with the amount of food actually
        needed during service. This is an estimate, not waste attributed to you.
      </p>

      {surplusInsight ? (
        <p className="chef-results-surplus-insight" data-testid="actual-vs-estimated-surplus-insight">
          {surplusInsight}
        </p>
      ) : null}

      <SummaryCards result={result} />
      <CategoryOutcomeVisual result={result} />
      <CategoryDetailPanel result={result} />
    </section>
  );
}
