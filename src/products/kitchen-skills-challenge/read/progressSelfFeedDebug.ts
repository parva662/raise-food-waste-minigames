import { getActivityTemplateReference } from '@/platform/gamebus/groupActivities';
import { gamebusDevLog } from '@/platform/gamebus/devLog';
import { parsePersistedReviewEntry } from '@/products/kitchen-skills-challenge/read/kitchenSkillsReadModel';
import {
  readActivityPropertyNumber,
  readActivityPropertyString,
} from '@/products/kitchen-skills-challenge/read/groupActivityProperties';
import { isKitchenSkillsReviewedModule } from '@/products/kitchen-skills-challenge/gamebus/mapWastePracticeReview';
import { isKitchenSkillsReviewScore } from '@/products/kitchen-skills-challenge/domain/assessment/scores';
import type { KitchenSkillsTrainerSession } from '@/products/kitchen-skills-challenge/domain/types';

export type KitchenSkillsSelfReviewParseFailure = {
  activityId: string | null;
  reason: string;
};

export type KitchenSkillsSelfFeedReviewSummary = {
  selfActivityCount: number;
  wastePracticeReviewCount: number;
  parsedReviewCount: number;
  parseFailures: KitchenSkillsSelfReviewParseFailure[];
  attachedReviews: Array<{
    sessionId: string;
    reviewedGame: string;
    timeEfficiencyScore: number;
    preparationQualityScore: number;
    hasFeedback: boolean;
  }>;
};

function activityId(activity: unknown): string | null {
  if (typeof activity !== 'object' || activity === null) return null;
  const id = (activity as { id?: unknown }).id;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function classifyReviewParseFailure(activity: unknown): string {
  if (getActivityTemplateReference(activity) !== 'wastePracticeReview') {
    return 'not_wastePracticeReview_or_unreadable_template';
  }
  const sessionId = readActivityPropertyString(activity, 'sessionId');
  const sessionDate = readActivityPropertyString(activity, 'sessionDate');
  const submittedAt = readActivityPropertyString(activity, 'submittedAt');
  const reviewedGame = readActivityPropertyString(activity, 'reviewedGame');
  const time = readActivityPropertyNumber(activity, 'timeEfficiencyScore');
  const quality = readActivityPropertyNumber(activity, 'preparationQualityScore');
  if (!sessionId) return 'missing_sessionId';
  if (!sessionDate) return 'missing_sessionDate';
  if (!submittedAt) return 'missing_submittedAt';
  if (!reviewedGame) return 'missing_reviewedGame';
  if (!isKitchenSkillsReviewedModule(reviewedGame)) return `invalid_reviewedGame:${reviewedGame}`;
  if (time == null) return 'missing_timeEfficiencyScore';
  if (quality == null) return 'missing_preparationQualityScore';
  if (!isKitchenSkillsReviewScore(time)) return `invalid_timeEfficiencyScore:${time}`;
  if (!isKitchenSkillsReviewScore(quality)) return `invalid_preparationQualityScore:${quality}`;
  return 'unknown';
}

export function summarizeKitchenSkillsSelfFeedReviews(
  activities: readonly unknown[],
  sessions: readonly KitchenSkillsTrainerSession[],
): KitchenSkillsSelfFeedReviewSummary {
  let wastePracticeReviewCount = 0;
  let parsedReviewCount = 0;
  const parseFailures: KitchenSkillsSelfReviewParseFailure[] = [];

  for (const activity of activities) {
    if (getActivityTemplateReference(activity) === 'wastePracticeReview') {
      wastePracticeReviewCount += 1;
      const parsed = parsePersistedReviewEntry(activity);
      if (parsed) parsedReviewCount += 1;
      else {
        parseFailures.push({
          activityId: activityId(activity),
          reason: classifyReviewParseFailure(activity),
        });
      }
    }
  }

  const attachedReviews = sessions.flatMap((session) =>
    (['trimSmart', 'rescueAndReuse', 'portionPrecision'] as const).flatMap((module) => {
      const review = session.moduleReviews[module];
      if (!review) return [];
      return [
        {
          sessionId: session.sessionId,
          reviewedGame: module,
          timeEfficiencyScore: review.timeEfficiencyScore,
          preparationQualityScore: review.preparationQualityScore,
          hasFeedback: Boolean(review.chefFeedback?.trim()),
        },
      ];
    }),
  );

  return {
    selfActivityCount: activities.length,
    wastePracticeReviewCount,
    parsedReviewCount,
    parseFailures,
    attachedReviews,
  };
}

/** Narrow Progress diagnostic: `?gamebusDebug=1` / DEV only via gamebusDevLog. */
export function logKitchenSkillsProgressSelfFeedDebug(
  activities: readonly unknown[],
  sessions: readonly KitchenSkillsTrainerSession[],
): void {
  gamebusDevLog(
    'kitchen-skills-progress.self-feed-reviews',
    summarizeKitchenSkillsSelfFeedReviews(activities, sessions),
  );
}
