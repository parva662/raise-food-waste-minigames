import { CHEF_NOT_ENTERED_LABEL } from '../types';

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

const PLANNED_QUANTITY_ROWS = [
  { label: 'Main', valueKey: 'mainQuantity' as const },
  { label: 'Vegetarian', valueKey: 'vegetarianQuantity' as const },
  { label: 'Soup', valueKey: 'soupQuantity' as const },
  { label: 'Dessert', valueKey: 'dessertQuantity' as const },
];

export function ChefForecastSummary({
  expectedCustomers,
  mainQuantity,
  vegetarianQuantity,
  soupQuantity,
  dessertQuantity,
}: ChefForecastSummaryProps) {
  const quantities = {
    mainQuantity,
    vegetarianQuantity,
    soupQuantity,
    dessertQuantity,
  };

  return (
    <aside className="chef-summary" aria-label="Forecast overview">
      <h2 className="chef-summary__title">Forecast overview</h2>
      <dl className="chef-summary__list">
        <div className="chef-summary__row">
          <dt>Expected customers</dt>
          <dd>{formatOptionalNumber(expectedCustomers)}</dd>
        </div>
      </dl>
      <h3 className="chef-summary__section">Planned quantities</h3>
      <dl className="chef-summary__list">
        {PLANNED_QUANTITY_ROWS.map((row) => (
          <div key={row.label} className="chef-summary__row">
            <dt>{row.label}</dt>
            <dd>{formatOptionalNumber(quantities[row.valueKey])}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
