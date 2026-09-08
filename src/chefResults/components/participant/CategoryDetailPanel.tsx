import { RESULT_CATEGORY_KEYS, RESULT_CATEGORY_LABELS } from '../../types';
import type { StaffDailyResult } from '../../types';
import { formatGrams } from '../../useChefResultsData';
import {
  formatCategoryOutcomeLabel,
  getCategoryOutcomeKind,
} from '../../forecastInterpretation';

interface CategoryDetailPanelProps {
  result: StaffDailyResult;
}

export function CategoryDetailPanel({ result }: CategoryDetailPanelProps) {
  return (
    <section className="chef-results-category-detail" data-testid="category-detail-panel">
      <details>
        <summary>Technical details by menu item</summary>
        <div className="chef-results-category-detail__grid">
          {RESULT_CATEGORY_KEYS.map((key) => {
            const category = result[key];
            const kind = getCategoryOutcomeKind(
              category.simulatedOverproductionGrams,
              category.simulatedShortageGrams,
            );
            const grams =
              kind === 'shortage'
                ? category.simulatedShortageGrams
                : category.simulatedOverproductionGrams;
            const outcome = formatCategoryOutcomeLabel(kind, grams);
            const differenceGrams =
              category.forecastProductionWeightGrams - category.observedDemandWeightGrams;

            return (
              <article key={key} className="chef-results-category-detail__card">
                <h3>{RESULT_CATEGORY_LABELS[key]}</h3>
                <dl>
                  <div>
                    <dt>Forecast production</dt>
                    <dd>{formatGrams(category.forecastProductionWeightGrams)}</dd>
                  </div>
                  <div>
                    <dt>Actual amount needed</dt>
                    <dd>{formatGrams(category.observedDemandWeightGrams)}</dd>
                  </div>
                  <div>
                    <dt>Difference</dt>
                    <dd>{formatGrams(Math.abs(differenceGrams))}</dd>
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
