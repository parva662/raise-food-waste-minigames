import { CHEF_NOT_ENTERED_LABEL } from '@/products/kitchen-forecast/types';
import {
  formatPortionDifference,
  plannedPortionsDifference,
  totalPlannedLunchPortions,
} from '@/products/kitchen-forecast/chefSummary';

interface ChefForecastSummaryProps {
  expectedCustomers: number | null;
  mainQuantity: number | null;
  vegetarianQuantity: number | null;
  soupQuantity: number | null;
  dessertQuantity: number | null;
}

function formatOptionalNumber(value: number | null): string {
  return value === null ? CHEF_NOT_ENTERED_LABEL : String(value);
}

export function ChefForecastSummary({
  expectedCustomers,
  mainQuantity,
  vegetarianQuantity,
  soupQuantity,
}: ChefForecastSummaryProps) {
  const totalPlanned = totalPlannedLunchPortions({
    mainQuantity,
    vegetarianQuantity,
    soupQuantity,
  });
  const difference = plannedPortionsDifference({
    expectedCustomers,
    mainQuantity,
    vegetarianQuantity,
    soupQuantity,
  });
  const showMismatchWarning = difference !== null && difference !== 0;

  return (
    <aside className="chef-summary" aria-label="Forecast overview">
      <h2 className="chef-summary__title">Forecast overview</h2>
      <dl className="chef-summary__list">
        <div className="chef-summary__row">
          <dt>Expected customers</dt>
          <dd>{formatOptionalNumber(expectedCustomers)}</dd>
        </div>
        <div className="chef-summary__row">
          <dt>Planned Classic portions</dt>
          <dd>{formatOptionalNumber(mainQuantity)}</dd>
        </div>
        <div className="chef-summary__row">
          <dt>Planned Vegetarian portions</dt>
          <dd>{formatOptionalNumber(vegetarianQuantity)}</dd>
        </div>
        <div className="chef-summary__row">
          <dt>Planned Soup + Dessert packages</dt>
          <dd>{formatOptionalNumber(soupQuantity)}</dd>
        </div>
        <div className="chef-summary__row chef-summary__row--emphasis">
          <dt>Total planned lunch portions</dt>
          <dd data-testid="chef-total-planned-portions">{formatOptionalNumber(totalPlanned)}</dd>
        </div>
        <div className="chef-summary__row">
          <dt>Difference from expected customers</dt>
          <dd
            className={
              showMismatchWarning ? 'chef-summary__difference chef-summary__difference--warn' : 'chef-summary__difference'
            }
            data-testid="chef-portions-difference"
          >
            {difference === null ? CHEF_NOT_ENTERED_LABEL : formatPortionDifference(difference)}
          </dd>
        </div>
      </dl>
      {showMismatchWarning && (
        <p className="chef-summary__warning" role="status" data-testid="chef-portions-mismatch-warning">
          Planned portions differ from expected customers. This does not block submission — one customer
          may take more than one portion.
        </p>
      )}
    </aside>
  );
}
