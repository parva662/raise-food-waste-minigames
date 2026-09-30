import { getActivityTemplateReference } from '@/platform/gamebus/groupActivities';
import type { KitchenSkillsTrainerSession } from '@/products/kitchen-skills-challenge/domain/types';
import {
  parsePersistedPortionEntry,
  parsePersistedRescueEntry,
  parsePersistedReviewEntry,
  parsePersistedTrimEntry,
  readActivityActorId,
  readActivityActorName,
} from '@/products/kitchen-skills-challenge/read/kitchenSkillsReadModel';

const KITCHEN_SKILLS_EVIDENCE_TEMPLATES = ['trimSmart', 'rescueAndReuse', 'portionPrecision'] as const;

export function chefSessionKey(actorId: string, sessionId: string): string {
  return `${actorId}::${sessionId}`;
}

export type KitchenSkillsTrainerFeedClassification = {
  total: number;
  templateCounts: Record<string, number>;
  kitchenSkillsEvidenceCount: number;
  parsedEvidenceCount: number;
  parsedEvidenceMissingActorCount: number;
  kitchenSkillsTemplateUnparseableCount: number;
};

/**
 * Classify a Kitchen Skills trainer activity feed the way the session builder does.
 * Sessions are created only from parsed trim/rescue/portion activities that also have `actor.id`.
 */
export function classifyKitchenSkillsTrainerFeed(
  activities: readonly unknown[],
): KitchenSkillsTrainerFeedClassification {
  const templateCounts: Record<string, number> = {};
  let kitchenSkillsEvidenceCount = 0;
  let parsedEvidenceCount = 0;
  let parsedEvidenceMissingActorCount = 0;
  let kitchenSkillsTemplateUnparseableCount = 0;
  const evidenceTemplates = new Set<string>(KITCHEN_SKILLS_EVIDENCE_TEMPLATES);

  for (const activity of activities) {
    const template = getActivityTemplateReference(activity) ?? '(missing)';
    templateCounts[template] = (templateCounts[template] ?? 0) + 1;
    const isEvidenceTemplate = evidenceTemplates.has(template);
    if (isEvidenceTemplate) kitchenSkillsEvidenceCount += 1;
    const parsed =
      parsePersistedTrimEntry(activity) ??
      parsePersistedRescueEntry(activity) ??
      parsePersistedPortionEntry(activity);
    if (parsed) {
      if (readActivityActorId(activity)) parsedEvidenceCount += 1;
      else parsedEvidenceMissingActorCount += 1;
    } else if (isEvidenceTemplate) {
      kitchenSkillsTemplateUnparseableCount += 1;
    }
  }

  return {
    total: activities.length,
    templateCounts,
    kitchenSkillsEvidenceCount,
    parsedEvidenceCount,
    parsedEvidenceMissingActorCount,
    kitchenSkillsTemplateUnparseableCount,
  };
}

export function buildKitchenSkillsTrainerSessions(
  activities: readonly unknown[],
): KitchenSkillsTrainerSession[] {
  const sessions = new Map<string, KitchenSkillsTrainerSession>();

  const ensure = (activity: unknown, sessionId: string, sessionDate: string) => {
    const actorId = readActivityActorId(activity);
    if (!actorId) return null;
    const key = chefSessionKey(actorId, sessionId);
    const existing = sessions.get(key);
    if (existing) return existing;
    const created: KitchenSkillsTrainerSession = {
      actorId,
      actorName: readActivityActorName(activity) ?? actorId,
      sessionId,
      sessionDate,
      trimEntries: [],
      rescueEntries: [],
      portionEntries: [],
      review: null,
    };
    sessions.set(key, created);
    return created;
  };

  for (const activity of activities) {
    const trim = parsePersistedTrimEntry(activity);
    if (trim) {
      const session = ensure(activity, trim.sessionId, trim.sessionDate);
      session?.trimEntries.push(trim);
      continue;
    }
    const rescue = parsePersistedRescueEntry(activity);
    if (rescue) {
      const session = ensure(activity, rescue.sessionId, rescue.sessionDate);
      session?.rescueEntries.push(rescue);
      continue;
    }
    const portion = parsePersistedPortionEntry(activity);
    if (portion) {
      const session = ensure(activity, portion.sessionId, portion.sessionDate);
      session?.portionEntries.push(portion);
    }
  }

  for (const activity of activities) {
    const review = parsePersistedReviewEntry(activity);
    if (!review) continue;
    for (const session of sessions.values()) {
      if (session.sessionId === review.sessionId && !session.review) {
        session.review = review;
      }
    }
  }

  return [...sessions.values()].sort((left, right) => {
    const byName = left.actorName.localeCompare(right.actorName);
    if (byName !== 0) return byName;
    return left.sessionId.localeCompare(right.sessionId);
  });
}

export function findKitchenSkillsTrainerSession(
  sessions: readonly KitchenSkillsTrainerSession[],
  sessionId: string | null,
): KitchenSkillsTrainerSession | undefined {
  if (!sessionId) return undefined;
  return sessions.find((session) => session.sessionId === sessionId);
}
