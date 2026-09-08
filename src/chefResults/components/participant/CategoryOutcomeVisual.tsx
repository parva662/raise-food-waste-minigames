import { RESULT_CATEGORY_KEYS, RESULT_CATEGORY_LABELS } from '../../types';
import type { StaffDailyResult } from '../../types';
import {
  buildCategoryAriaLabel,
  formatCategoryOutcomeLabel,
  getCategoryOutcomeKind,
} from '../../forecastInterpretation';

interface CategoryOutcomeVisualProps {
  result: StaffDailyResult;
}

function scalePercent(value: number, maxValue: number): number {
  if (maxValue <= 0) return 0;
  return Math.min(100, (value / maxValue) * 100);
}

export function CategoryOutcomeVisual({ result }: CategoryOutcomeVisualProps) {
  const maxMagnitude = Math.max(
    1,
    ...RESULT_CATEGORY_KEYS.flatMap((key) => [
      result[key].simulatedOverproductionGrams,
      result[key].simulatedShortageGrams,
    ]),
  );

  return (
    <div className="chef-results-category-visual" data-testid="category-outcome-visual">
      <h3 className="chef-results-subsection-title">By menu item</h3>
      <p className="chef-results-subsection-intro">
        See where your forecast would have prepared too little, close to the amount needed, or more
        than needed.
      </p>

      <div className="chef-results-diverging-list">
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
          const shortagePct = scalePercent(category.simulatedShortageGrams, maxMagnitude);
          const overPct = scalePercent(category.simulatedOverproductionGrams, maxMagnitude);
          const outcomeLabel = formatCategoryOutcomeLabel(kind, grams);
          const ariaLabel = buildCategoryAriaLabel(RESULT_CATEGORY_LABELS[key], kind, grams);

          return (
            <article key={key} className="chef-results-diverging-item">
              <div className="chef-results-diverging-item__header">
                <h3>{RESULT_CATEGORY_LABELS[key]}</h3>
                <p className="chef-results-diverging-item__outcome">{outcomeLabel}</p>
              </div>

              <div className="chef-results-diverging-scale" role="img" aria-label={ariaLabel}>
                <div
                  className="chef-results-diverging-scale__shortage"
                  style={{ width: `${shortagePct}%` }}
                />
                <div className="chef-results-diverging-scale__axis">
                  <div className="chef-results-diverging-scale__center-line" aria-hidden="true" />
                  <span className="chef-results-diverging-scale__center-label">On target</span>
                </div>
                <div
                  className="chef-results-diverging-scale__over"
                  style={{ width: `${overPct}%` }}
                />
              </div>

              <div className="chef-results-diverging-scale__legend" aria-hidden="true">
                <span>Too little</span>
                <span>On target</span>
                <span>Too much</span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
