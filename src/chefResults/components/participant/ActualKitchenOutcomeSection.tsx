import { Users } from 'lucide-react';
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
      className="chef-results-subsection chef-results-actual-kitchen"
      data-testid="actual-kitchen-outcome-section"
    >
      <h3 className="chef-results-subsection-title">What happened in the kitchen?</h3>
      <p className="chef-results-subsection-intro">
        Prepared food left after service, recorded in Service Closeout.
      </p>

      <div className="chef-results-actual-kitchen__highlights">
        <div className="chef-results-actual-kitchen__highlight">
          <Users size={20} aria-hidden="true" />
          <div>
            <p className="chef-results-actual-kitchen__highlight-value" data-testid="actual-customers-served">
              {observed.actualCustomers}
            </p>
            <p className="chef-results-actual-kitchen__highlight-label">customers served</p>
          </div>
        </div>

        <div className="chef-results-actual-kitchen__highlight">
          <div>
            <p className="chef-results-actual-kitchen__highlight-value" data-testid="actual-kitchen-total">
              {formatMeasuredGrams(totalGrams)}
            </p>
            <p className="chef-results-actual-kitchen__highlight-label">actual surplus after service</p>
          </div>
        </div>
      </div>
    </section>
  );
}
