import { RESULT_CATEGORY_KEYS, RESULT_CATEGORY_LABELS } from '../../types';
import type { StaffDailyResult } from '../../types';
import { formatGrams } from '../../useChefResultsData';

interface CategoryDetailPanelProps {
  result: StaffDailyResult;
}

export function CategoryDetailPanel({ result }: CategoryDetailPanelProps) {
  return (
    <section className="chef-results-category-detail" data-testid="category-detail-panel">
      <details>
        <summary>Category details</summary>
        <div className="chef-results-category-detail__grid">
          {RESULT_CATEGORY_KEYS.map((key) => {
            const category = result[key];
            const outcome =
              category.simulatedOverproductionGrams > 0
                ? `Simulated overproduction ${formatGrams(category.simulatedOverproductionGrams)}`
                : category.simulatedShortageGrams > 0
                  ? `Simulated shortage ${formatGrams(category.simulatedShortageGrams)}`
                  : 'Close match';

            return (
              <article key={key} className="chef-results-category-detail__card">
                <h3>{RESULT_CATEGORY_LABELS[key]}</h3>
                <dl>
                  <div>
                    <dt>Forecast portions</dt>
                    <dd>{category.forecastQuantity}</dd>
                  </div>
                  <div>
                    <dt>Portion weight</dt>
                    <dd>{formatGrams(category.portionWeightGrams)}</dd>
                  </div>
                  <div>
                    <dt>Observed demand</dt>
                    <dd>{formatGrams(category.observedDemandWeightGrams)}</dd>
                  </div>
                  <div>
                    <dt>Outcome</dt>
                    <dd>{outcome}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      </details>
    </section>
  );
}
