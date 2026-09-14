import { formatManagementCategoryOutcome } from '../../managementFormat';
import { RESULT_CATEGORY_KEYS, RESULT_CATEGORY_LABELS } from '../../types';
import type { StaffDailyResult } from '../../types';
import { getCategoryOutcomeKind } from '../../forecastInterpretation';

interface CategoryOutcomeVisualProps {
  result: StaffDailyResult;
}

export function CategoryOutcomeVisual({ result }: CategoryOutcomeVisualProps) {
  return (
    <section className="participant-menu-outcomes" data-testid="category-outcome-visual">
      <h4 className="kitchen-mgmt-surface__subtitle">By menu item</h4>
      <div className="chef-results-table-wrap kitchen-mgmt-table-wrap">
        <table className="chef-results-table kitchen-mgmt-table">
          <thead>
            <tr>
              <th scope="col">Menu item</th>
              <th scope="col">Outcome</th>
            </tr>
          </thead>
          <tbody>
            {RESULT_CATEGORY_KEYS.map((key) => {
              const category = result[key];
              const kind = getCategoryOutcomeKind(
                category.simulatedOverproductionGrams,
                category.simulatedShortageGrams,
              );
              const outcome = formatManagementCategoryOutcome(
                category.simulatedOverproductionGrams,
                category.simulatedShortageGrams,
              );
              const rowClass =
                kind === 'surplus'
                  ? 'participant-menu-outcomes__row--surplus'
                  : kind === 'shortage'
                    ? 'participant-menu-outcomes__row--shortage'
                    : 'participant-menu-outcomes__row--target';

              return (
                <tr
                  key={key}
                  className={rowClass}
                  data-testid={`participant-category-outcome-${key}`}
                >
                  <th scope="row">{RESULT_CATEGORY_LABELS[key]}</th>
                  <td data-testid={`participant-category-outcome-label-${key}`}>{outcome}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
