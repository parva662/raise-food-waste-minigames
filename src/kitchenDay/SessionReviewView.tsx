import { SessionEvidence } from './SessionEvidence';
import { formatSessionDate } from './format';
import { useReadyKitchenDaySession } from './KitchenDaySessionContext';

export function SessionReviewView() {
  const { session, trimEntries, rescueEntries, portionEntries, findReviewBySessionId } =
    useReadyKitchenDaySession();
  const review = findReviewBySessionId(session.sessionId);
  const missing: string[] = [];
  if (trimEntries.length === 0) missing.push('Trim Smart');
  if (portionEntries.length === 0) missing.push('Portion Precision');

  return (
    <section className="kitchen-day-card" data-testid="kitchen-day-overview">
      <h2 className="kitchen-day-card__title">Session review</h2>
      <p className="kitchen-day-card__copy">This Kitchen Day only. Submitted measurements cannot be edited here.</p>
      <p data-testid="kitchen-day-session-meta">{formatSessionDate(session.sessionDate)}</p>
      {missing.length > 0 ? (
        <p className="kitchen-day-helper">Still to record: {missing.join(', ')}.</p>
      ) : (
        <p className="kitchen-day-helper">All required modules have at least one completed record.</p>
      )}
      <SessionEvidence
        trimEntries={trimEntries}
        rescueEntries={rescueEntries}
        portionEntries={portionEntries}
        review={review}
      />
    </section>
  );
}
