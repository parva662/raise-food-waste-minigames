import { SessionEvidence } from '@/products/kitchen-skills-challenge/surfaces/shared/SessionEvidence';
import { formatSessionDate } from '@/products/kitchen-skills-challenge/format';
import { useReadyKitchenSkillsSession } from '@/products/kitchen-skills-challenge/domain/session/KitchenSkillsSessionContext';
import { emptyModuleReviews } from '@/products/kitchen-skills-challenge/read/trainerSessions';
import {
  isLegacySessionReview,
  listSessionRecipeIds,
  recipeDisplayName,
} from '@/products/kitchen-skills-challenge/domain/session/reviewIdentity';
import type {
  KitchenSkillsModuleReviews,
  KitchenSkillsReviewEntry,
  KitchenSkillsTrainerSession,
} from '@/products/kitchen-skills-challenge/domain/types';
import { KITCHEN_SKILLS_MODULE_TITLES } from '@/products/kitchen-skills-challenge/domain/types';
import { normalizeRecipeId } from '@/products/kitchen-skills-challenge/domain/session/ingredientUniqueness';

function reviewsAsModuleMap(
  reviews: readonly KitchenSkillsReviewEntry[],
): KitchenSkillsModuleReviews {
  return reviews.reduce<KitchenSkillsModuleReviews>((acc, entry) => {
    const existing = acc[entry.reviewedGame];
    if (!existing || entry.submittedAt.localeCompare(existing.submittedAt) > 0) {
      acc[entry.reviewedGame] = entry;
    }
    return acc;
  }, emptyModuleReviews());
}

export function SessionReviewView() {
  const { session, trimEntries, rescueEntries, portionEntries, reviews } =
    useReadyKitchenSkillsSession();
  const sessionReviews = reviews.filter((entry) => entry.sessionId === session.sessionId);
  const legacyReviews = sessionReviews.filter(isLegacySessionReview);
  const recipeReviews = sessionReviews.filter((entry) => !isLegacySessionReview(entry));
  // Single-recipe / legacy fallback for SessionEvidence module slots.
  const moduleReviews =
    listSessionRecipeIds({
      portionEntries,
      trimEntries,
      rescueEntries,
      reviews: sessionReviews,
      moduleReviews: emptyModuleReviews(),
      actorId: '',
      actorName: '',
      sessionId: session.sessionId,
      sessionDate: session.sessionDate,
    } satisfies KitchenSkillsTrainerSession).length <= 1
      ? reviewsAsModuleMap(sessionReviews)
      : emptyModuleReviews();
  const missing: string[] = [];
  if (trimEntries.length === 0) missing.push('Trim Smart');
  if (portionEntries.length === 0) missing.push('Portion Precision');

  const recipeIds = listSessionRecipeIds({
    portionEntries,
    trimEntries,
    rescueEntries,
    reviews: sessionReviews,
    moduleReviews: emptyModuleReviews(),
    actorId: '',
    actorName: '',
    sessionId: session.sessionId,
    sessionDate: session.sessionDate,
  });

  return (
    <section className="kitchen-day-card" data-testid="kitchen-day-overview">
      <header className="kitchen-day-review-header">
        <h2 className="kitchen-day-card__title">Session review</h2>
        <p className="kitchen-day-card__copy">
          This challenge session only. Submitted measurements cannot be edited here.
        </p>
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
          <p
            className="kitchen-day-review-status kitchen-day-review-status--complete"
            data-testid="kitchen-day-review-status"
          >
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
        showWasteAnalytics={false}
      />
      {legacyReviews.length > 0 ? (
        <section data-testid="kitchen-day-legacy-session-reviews">
          <h3>Historical session-level assessment</h3>
          <ul>
            {legacyReviews.map((review) => (
              <li key={review.persistId ?? `${review.reviewedGame}-${review.submittedAt}`}>
                {KITCHEN_SKILLS_MODULE_TITLES[review.reviewedGame]}: time{' '}
                {review.timeEfficiencyScore}/5, quality {review.preparationQualityScore}/5
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {recipeReviews.length > 0 && recipeIds.length > 1 ? (
        <section data-testid="kitchen-day-recipe-tutor-reviews">
          <h3>Tutor assessments by recipe</h3>
          <ul>
            {recipeReviews.map((review) => {
              const rid = normalizeRecipeId(review.recipeId ?? '') ?? review.recipeId;
              const name = rid
                ? recipeDisplayName(
                    {
                      portionEntries,
                      trimEntries,
                      rescueEntries,
                      reviews: sessionReviews,
                      moduleReviews: emptyModuleReviews(),
                      actorId: '',
                      actorName: '',
                      sessionId: session.sessionId,
                      sessionDate: session.sessionDate,
                    },
                    rid,
                  )
                : 'Recipe';
              return (
                <li
                  key={review.persistId ?? reviewIdentityFallback(review)}
                  data-testid={`kitchen-day-recipe-review-${rid}-${review.reviewedGame}`}
                >
                  {name} · {KITCHEN_SKILLS_MODULE_TITLES[review.reviewedGame]}: time{' '}
                  {review.timeEfficiencyScore}/5, quality {review.preparationQualityScore}/5
                  {review.chefFeedback ? ` — ${review.chefFeedback}` : ''}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </section>
  );
}

function reviewIdentityFallback(review: KitchenSkillsReviewEntry): string {
  return `${review.sessionId}:${review.recipeId ?? 'legacy'}:${review.reviewedGame}:${review.submittedAt}`;
}
