export function SubmissionRulesMessage() {
  return (
    <p className="submission-rules" aria-label="Submission scoring rules">
      This lunch task is worth <strong>20 points</strong>. Submit by <strong>18:00</strong> to earn
      a <span className="submission-rules__positive">+5 bonus</span>. Late submissions are accepted
      until <strong>23:00</strong> with a{' '}
      <span className="submission-rules__warning">-5 penalty</span> and are still included in the
      canteen estimate.
    </p>
  );
}
