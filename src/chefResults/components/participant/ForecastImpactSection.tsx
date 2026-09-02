import type { StaffDailyResult } from '../../types';
import { CategoryDetailPanel } from './CategoryDetailPanel';
import { CategoryOutcomeVisual } from './CategoryOutcomeVisual';
import { SummaryCards } from './SummaryCards';

interface ForecastImpactSectionProps {
  result: StaffDailyResult;
}

export function ForecastImpactSection({ result }: ForecastImpactSectionProps) {
  return (
    <section
      className="chef-results-dashboard-section chef-results-forecast-impact"
      data-testid="forecast-impact-section"
    >
      <h2 className="chef-results-section-title">What would your forecast have produced?</h2>
      <p className="chef-results-section-intro">
        A simulation of what might have happened if your forecast quantities had been used as the
        production plan. These values are not the actual kitchen waste.
      </p>

      <SummaryCards result={result} />
      <CategoryOutcomeVisual result={result} />
      <CategoryDetailPanel result={result} />
    </section>
  );
}
