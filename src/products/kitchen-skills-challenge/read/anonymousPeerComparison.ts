import { compareTrimSessionFromPortion } from '@/products/kitchen-skills-challenge/domain/trim/objectiveComparison';
import type {
  KitchenSkillsReviewedModule,
  KitchenSkillsTrainerSession,
} from '@/products/kitchen-skills-challenge/domain/types';

export const MIN_ANONYMOUS_PEER_COUNT = 3;

export type AnonymousPeerStatistic =
  | { status: 'hidden'; reason: 'not-enough-peers' }
  | { status: 'shown'; peerCount: number; median: number };

function median(values: readonly number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle]!;
  return (sorted[middle - 1]! + sorted[middle]!) / 2;
}

function anonymize(values: readonly number[]): AnonymousPeerStatistic {
  if (values.length < MIN_ANONYMOUS_PEER_COUNT) {
    return { status: 'hidden', reason: 'not-enough-peers' };
  }
  return { status: 'shown', peerCount: values.length, median: median(values) };
}

function sessionsByOtherActors(
  sessions: readonly KitchenSkillsTrainerSession[],
  viewerActorId: string | null,
): Map<string, KitchenSkillsTrainerSession[]> {
  const grouped = new Map<string, KitchenSkillsTrainerSession[]>();
  for (const session of sessions) {
    if (viewerActorId && session.actorId === viewerActorId) continue;
    const current = grouped.get(session.actorId) ?? [];
    current.push(session);
    grouped.set(session.actorId, current);
  }
  for (const [actorId, actorSessions] of grouped) {
    grouped.set(
      actorId,
      [...actorSessions].sort((left, right) => {
        const byDate = right.sessionDate.localeCompare(left.sessionDate);
        if (byDate !== 0) return byDate;
        return right.sessionId.localeCompare(left.sessionId);
      }),
    );
  }
  return grouped;
}

export function peerTrimDeltaStatistic(
  viewerActorId: string | null,
  peerSessions: readonly KitchenSkillsTrainerSession[],
): AnonymousPeerStatistic {
  const deltas: number[] = [];
  for (const actorSessions of sessionsByOtherActors(peerSessions, viewerActorId).values()) {
    const latest = actorSessions.find((session) => {
      const comparison = compareTrimSessionFromPortion(session.trimEntries, session.portionEntries);
      return comparison.status === 'available';
    });
    if (!latest) continue;
    const comparison = compareTrimSessionFromPortion(latest.trimEntries, latest.portionEntries);
    if (comparison.status === 'available') deltas.push(comparison.deltaPercentagePoints);
  }
  return anonymize(deltas);
}

export function peerModuleScoreStatistic(
  viewerActorId: string | null,
  peerSessions: readonly KitchenSkillsTrainerSession[],
  module: KitchenSkillsReviewedModule,
  score: 'timeEfficiencyScore' | 'preparationQualityScore',
): AnonymousPeerStatistic {
  const scores: number[] = [];
  for (const actorSessions of sessionsByOtherActors(peerSessions, viewerActorId).values()) {
    const latest = actorSessions.find((session) => session.moduleReviews[module] != null);
    const review = latest?.moduleReviews[module];
    if (review) scores.push(review[score]);
  }
  return anonymize(scores);
}
