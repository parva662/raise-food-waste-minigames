import { formatMeasuredGrams } from '../../displayFormat';
import { sumMeasuredOverproductionGrams } from '../../actualKitchenOutcome';
import { RESULT_CATEGORY_KEYS, RESULT_CATEGORY_LABELS } from '../../types';
import type { ObservedServiceReality } from '../../types';

interface ActualKitchenOutcomeSectionProps {
  observed: ObservedServiceReality;
}

export function ActualKitchenOutcomeSection({ observed }: ActualKitchenOutcomeSectionProps) {
  const totalGrams = sumMeasuredOverproductionGrams(observed);

  return (
    <section
      className="chef-results-dashboard-section chef-results-actual-kitchen"
      data-testid="actual-kitchen-outcome-section"
    >
      <h2 className="chef-results-section-title">What happened in the kitchen?</h2>
      <p className="chef-results-section-intro">
        Prepared food left after service, recorded in Service Closeout.
      </p>

      <div className="chef-results-actual-kitchen__total">
        <p className="chef-results-actual-kitchen__total-label">Actual surplus after service</p>
        <p className="chef-results-actual-kitchen__total-value" data-testid="actual-kitchen-total">
          {formatMeasuredGrams(totalGrams)}
        </p>
      </div>

      <dl className="chef-results-actual-kitchen__categories">
        {RESULT_CATEGORY_KEYS.map((key) => (
          <div key={key} className="chef-results-actual-kitchen__category">
            <dt>{RESULT_CATEGORY_LABELS[key]}</dt>
            <dd data-testid={`actual-kitchen-${key}`}>
              {formatMeasuredGrams(observed[key].measuredOverproductionGrams)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
