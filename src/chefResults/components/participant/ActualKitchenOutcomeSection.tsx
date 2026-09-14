import { formatMeasuredGrams } from '../../displayFormat';
import { sumMeasuredOverproductionGrams } from '../../actualKitchenOutcome';
import type { ObservedServiceReality } from '../../types';

interface ActualKitchenOutcomeSectionProps {
  observed: ObservedServiceReality;
}

export function ActualKitchenOutcomeSection({ observed }: ActualKitchenOutcomeSectionProps) {
  const totalGrams = sumMeasuredOverproductionGrams(observed);

  return (
    <section
      className="kitchen-mgmt-surface participant-kitchen-outcome"
      data-testid="actual-kitchen-outcome-section"
    >
      <h3 className="kitchen-mgmt-surface__title">Kitchen outcome</h3>
      <p className="kitchen-mgmt-snapshot-hint">
        What really happened in the kitchen after service (Service Closeout).
      </p>

      <div className="kitchen-mgmt-kpi-grid">
        <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--neutral">
          <p className="kitchen-mgmt-kpi__value" data-testid="actual-customers-served">
            {observed.actualCustomers}
          </p>
          <p className="kitchen-mgmt-kpi__label">Customers served</p>
        </article>
        <article className="kitchen-mgmt-kpi kitchen-mgmt-kpi--neutral">
          <p className="kitchen-mgmt-kpi__value" data-testid="actual-kitchen-total">
            {formatMeasuredGrams(totalGrams)}
          </p>
          <p className="kitchen-mgmt-kpi__label">Actual surplus after service</p>
        </article>
      </div>
    </section>
  );
}
