import { RESULT_CATEGORY_KEYS, RESULT_CATEGORY_LABELS } from '../types';
import type { ObservedServiceReality } from '../types';
import { formatGrams } from '../useChefResultsData';

interface ObservedServicePanelProps {
  observed: ObservedServiceReality;
}

export function ObservedServicePanel({ observed }: ObservedServicePanelProps) {
  return (
    <section className="chef-results-panel" data-testid="observed-service-panel">
      <h2 className="chef-results-panel__title">Observed service reality</h2>
      <p className="chef-results-panel__intro">
        Shared whole-canteen actuals for this service date. Every staff simulation is evaluated
        against this observed demand.
      </p>
      <dl className="chef-results-metrics">
        <div>
          <dt>Actual customers</dt>
          <dd>{observed.actualCustomers}</dd>
        </div>
      </dl>
      <div className="chef-results-table-wrap">
        <table className="chef-results-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Prepared</th>
              <th>Prepared weight</th>
              <th>Measured overproduction</th>
              <th>Observed demand</th>
            </tr>
          </thead>
          <tbody>
            {RESULT_CATEGORY_KEYS.map((key) => {
              const category = observed[key];
              return (
                <tr key={key}>
                  <td>{RESULT_CATEGORY_LABELS[key]}</td>
                  <td>{category.actualPreparedQuantity}</td>
                  <td>{formatGrams(category.actualPreparedWeightGrams)}</td>
                  <td>{formatGrams(category.measuredOverproductionGrams)}</td>
                  <td>{formatGrams(category.observedDemandWeightGrams)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
