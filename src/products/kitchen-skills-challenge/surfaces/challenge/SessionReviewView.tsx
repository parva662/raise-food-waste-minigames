import { SessionEvidence } from '@/products/kitchen-skills-challenge/surfaces/shared/SessionEvidence';
import { formatSessionDate } from '@/products/kitchen-skills-challenge/format';
import { useReadyKitchenSkillsSession } from '@/products/kitchen-skills-challenge/domain/session/KitchenSkillsSessionContext';
import { emptyModuleReviews } from '@/products/kitchen-skills-challenge/read/trainerSessions';
import type { KitchenSkillsModuleReviews } from '@/products/kitchen-skills-challenge/domain/types';

export function SessionReviewView() {
  const { session, trimEntries, rescueEntries, portionEntries, reviews } = useReadyKitchenSkillsSession();
  const moduleReviews = reviews
    .filter((entry) => entry.sessionId === session.sessionId)
    .reduce<KitchenSkillsModuleReviews>((acc, entry) => {
      const existing = acc[entry.reviewedGame];
      if (!existing || entry.submittedAt.localeCompare(existing.submittedAt) > 0) {
        acc[entry.reviewedGame] = entry;
      }
      return acc;
    }, emptyModuleReviews());
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
        moduleReviews={moduleReviews}
        collapsePortionTable
      />
    </section>
  );
}
