import { RESULT_CATEGORY_KEYS, RESULT_CATEGORY_LABELS } from '../../types';
import type { StaffDailyResult } from '../../types';
import { formatGrams } from '../../useChefResultsData';

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
    <section className="chef-results-category-visual" data-testid="category-outcome-visual">
      <h2 className="chef-results-section-title">What would your forecast have produced?</h2>
      <p className="chef-results-section-intro">
        Each bar shows simulated shortage (left), close match (centre), or simulated overproduction
        (right). Values are not actual waste.
      </p>

      <div className="chef-results-diverging-list">
        {RESULT_CATEGORY_KEYS.map((key) => {
          const category = result[key];
          const shortagePct = scalePercent(category.simulatedShortageGrams, maxMagnitude);
          const overPct = scalePercent(category.simulatedOverproductionGrams, maxMagnitude);
          const isClose =
            category.simulatedShortageGrams === 0 && category.simulatedOverproductionGrams === 0;

          return (
            <article key={key} className="chef-results-diverging-item">
              <div className="chef-results-diverging-item__header">
                <h3>{RESULT_CATEGORY_LABELS[key]}</h3>
                <p className="chef-results-diverging-item__values">
                  {category.simulatedShortageGrams > 0 && (
                    <span className="chef-results-tone--shortage">
                      Shortage {formatGrams(category.simulatedShortageGrams)}
                    </span>
                  )}
                  {isClose && <span className="chef-results-tone--neutral">Close match</span>}
                  {category.simulatedOverproductionGrams > 0 && (
                    <span className="chef-results-tone--over">
                      Overproduction {formatGrams(category.simulatedOverproductionGrams)}
                    </span>
                  )}
                </p>
              </div>

              <div
                className="chef-results-diverging-scale"
                role="img"
                aria-label={`${RESULT_CATEGORY_LABELS[key]} simulated outcome`}
              >
                <div
                  className="chef-results-diverging-scale__shortage"
                  style={{ width: `${shortagePct}%` }}
                />
                <div className="chef-results-diverging-scale__axis">
                  <div className="chef-results-diverging-scale__center-line" aria-hidden="true" />
                  <span className="chef-results-diverging-scale__center-label">
                    {isClose ? 'Close match' : '0'}
                  </span>
                </div>
                <div
                  className="chef-results-diverging-scale__over"
                  style={{ width: `${overPct}%` }}
                />
              </div>

              <div className="chef-results-diverging-scale__legend" aria-hidden="true">
                <span>Shortage</span>
                <span>{isClose ? 'Close match' : '0'}</span>
                <span>Overproduction</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
