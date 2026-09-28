import { SessionEvidence } from '@/products/kitchen-skills-challenge/surfaces/shared/SessionEvidence';
import { formatSessionDate } from '@/products/kitchen-skills-challenge/format';
import { useReadyKitchenDaySession } from '@/products/kitchen-skills-challenge/domain/session/KitchenSkillsSessionContext';

export function SessionReviewView() {
  const { session, trimEntries, rescueEntries, portionEntries, findReviewBySessionId } =
    useReadyKitchenDaySession();
  const review = findReviewBySessionId(session.sessionId);
  const missing: string[] = [];
  if (trimEntries.length === 0) missing.push('Trim Smart');
  if (portionEntries.length === 0) missing.push('Portion Precision');

  return (
    <section className="kitchen-day-card" data-testid="kitchen-day-overview">
      <header className="kitchen-day-review-header">
        <h2 className="kitchen-day-card__title">Session review</h2>
        <p className="kitchen-day-card__copy">This challenge session only. Submitted measurements cannot be edited here.</p>
        <p data-testid="kitchen-day-session-meta">{formatSessionDate(session.sessionDate)}</p>
        {missing.length > 0 ? (
          <div className="kitchen-day-review-status" data-testid="kitchen-day-review-status">
            <p>Still to complete:</p>
            <ul>
              {missing.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="kitchen-day-review-status kitchen-day-review-status--complete" data-testid="kitchen-day-review-status">
            ✓ Kitchen Skills Challenge complete
          </p>
        )}
      </header>
      <SessionEvidence
        trimEntries={trimEntries}
        rescueEntries={rescueEntries}
        portionEntries={portionEntries}
        review={review}
      />
    </section>
  );
}
