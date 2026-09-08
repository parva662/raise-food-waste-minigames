export function HowCalculatedDisclosure() {
  return (
    <details className="chef-results-how-calculated" data-testid="how-calculated-disclosure">
      <summary>How is this calculated?</summary>
      <div className="chef-results-how-calculated__content">
        <p>
          Customer forecast error compares your predicted number of customers with actual
          attendance.
        </p>
        <p>
          Estimated surplus and shortage compare the production quantities in your plan with the
          amount of each menu item actually needed during service.
        </p>
        <p>
          Observed demand is derived from prepared food minus the surplus recorded in Service
          Closeout.
        </p>
        <p>
          These estimates are feedback on your forecast and are not waste personally attributed to
          you.
        </p>
      </div>
    </details>
  );
}
