import { getActivityTemplateReference } from '@/platform/gamebus/groupActivities';
import type {
  KitchenSkillsReviewedModule,
  KitchenSkillsReviewEntry,
  KitchenSkillsTrainerSession,
  KitchenSkillsTrainerStaffSummary,
} from '@/products/kitchen-skills-challenge/domain/types';
import { KITCHEN_SKILLS_REVIEWED_MODULES } from '@/products/kitchen-skills-challenge/domain/types';
import {
  parsePersistedPortionEntry,
  parsePersistedRescueEntry,
  parsePersistedReviewEntry,
  parsePersistedTrimEntry,
  readActivityActorId,
  readActivityActorName,
} from '@/products/kitchen-skills-challenge/read/kitchenSkillsReadModel';

const KITCHEN_SKILLS_EVIDENCE_TEMPLATES = ['trimSmart', 'rescueAndReuse', 'portionPrecision'] as const;

export function emptyModuleReviews(): KitchenSkillsTrainerSession['moduleReviews'] {
  return {
    trimSmart: null,
    rescueAndReuse: null,
    portionPrecision: null,
  };
}

export function moduleHasEvidence(
  session: KitchenSkillsTrainerSession,
  module: KitchenSkillsReviewedModule,
): boolean {
  switch (module) {
    case 'trimSmart':
      return session.trimEntries.length > 0;
    case 'rescueAndReuse':
      return session.rescueEntries.length > 0;
    case 'portionPrecision':
      return session.portionEntries.length > 0;
  }
}

export function findModuleReview(
  session: KitchenSkillsTrainerSession,
  module: KitchenSkillsReviewedModule,
): KitchenSkillsReviewEntry | null {
  return session.moduleReviews[module];
}

/** Latest submitted module review for read-only summaries until per-module UI lands. */
export function latestModuleReview(
  session: KitchenSkillsTrainerSession,
): KitchenSkillsReviewEntry | null {
  const reviews = KITCHEN_SKILLS_REVIEWED_MODULES.map((module) => session.moduleReviews[module]).filter(
    (entry): entry is KitchenSkillsReviewEntry => entry !== null,
  );
  if (reviews.length === 0) return null;
  return [...reviews].sort((left, right) => right.submittedAt.localeCompare(left.submittedAt))[0];
}

export function modulesAwaitingAssessmentCount(session: KitchenSkillsTrainerSession): number {
  let count = 0;
  for (const module of KITCHEN_SKILLS_REVIEWED_MODULES) {
    if (moduleHasEvidence(session, module) && findModuleReview(session, module) === null) {
      count += 1;
    }
  }
  return count;
}

export function modulesWithEvidenceCount(session: KitchenSkillsTrainerSession): number {
  return KITCHEN_SKILLS_REVIEWED_MODULES.filter((module) => moduleHasEvidence(session, module)).length;
}

export function modulesReviewedCount(session: KitchenSkillsTrainerSession): number {
  return KITCHEN_SKILLS_REVIEWED_MODULES.filter(
    (module) => moduleHasEvidence(session, module) && findModuleReview(session, module) !== null,
  ).length;
}

/** Assessment state from evidence + persisted module reviews only (not date). */
export type KitchenSkillsSessionAssessmentStatus =
  | 'needs_assessment'
  | 'partially_reviewed'
  | 'reviewed';

export function sessionAssessmentStatus(
  session: KitchenSkillsTrainerSession,
): KitchenSkillsSessionAssessmentStatus {
  const awaiting = modulesAwaitingAssessmentCount(session);
  if (awaiting === 0) return 'reviewed';
  if (modulesReviewedCount(session) > 0) return 'partially_reviewed';
  return 'needs_assessment';
}

export function isSessionAwaitingAssessment(session: KitchenSkillsTrainerSession): boolean {
  return modulesAwaitingAssessmentCount(session) > 0;
}

export function partitionTrainerSessionsByAssessment(
  sessions: readonly KitchenSkillsTrainerSession[],
): {
  needsAssessment: KitchenSkillsTrainerSession[];
  reviewed: KitchenSkillsTrainerSession[];
} {
  const needsAssessment: KitchenSkillsTrainerSession[] = [];
  const reviewed: KitchenSkillsTrainerSession[] = [];
  for (const session of sessions) {
    if (isSessionAwaitingAssessment(session)) needsAssessment.push(session);
    else reviewed.push(session);
  }
  return { needsAssessment, reviewed };
}

export const KITCHEN_SKILLS_MODULE_SHORT_LABELS: Record<KitchenSkillsReviewedModule, string> = {
  trimSmart: 'Trim',
  rescueAndReuse: 'Rescue',
  portionPrecision: 'Portion',
};

export function attachModuleReviewToMatchingSessions(
  sessions: Iterable<KitchenSkillsTrainerSession>,
  activity: unknown,
  review: KitchenSkillsReviewEntry,
  options: { requireActorMatch?: boolean } = {},
): void {
  const requireActorMatch = options.requireActorMatch !== false;
  const reviewActorId = readActivityActorId(activity);
  const candidates = [...sessions].filter((session) => session.sessionId === review.sessionId);
  if (candidates.length === 0) return;

  const targetSessions = requireActorMatch
    ? reviewActorId != null
      ? candidates.filter((session) => session.actorId === reviewActorId)
      : candidates.length === 1
        ? candidates
        : []
    : candidates;

  for (const session of targetSessions) {
    if (session.moduleReviews[review.reviewedGame] !== null) continue;
    session.moduleReviews[review.reviewedGame] = review;
  }
}

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
      moduleReviews: emptyModuleReviews(),
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
    attachModuleReviewToMatchingSessions(sessions.values(), activity, review);
  }

  return [...sessions.values()].sort((left, right) => {
    const byName = left.actorName.localeCompare(right.actorName);
    if (byName !== 0) return byName;
    const byDate = right.sessionDate.localeCompare(left.sessionDate);
    if (byDate !== 0) return byDate;
    return left.sessionId.localeCompare(right.sessionId);
  });
}

export function buildKitchenSkillsTrainerStaffSummaries(
  sessions: readonly KitchenSkillsTrainerSession[],
): KitchenSkillsTrainerStaffSummary[] {
  const byActor = new Map<string, KitchenSkillsTrainerStaffSummary>();

  for (const session of sessions) {
    const existing = byActor.get(session.actorId);
    if (existing) {
      existing.sessions.push(session);
      existing.sessionCount += 1;
      if (session.sessionDate.localeCompare(existing.latestSessionDate) > 0) {
        existing.latestSessionDate = session.sessionDate;
      }
      existing.modulesAwaitingAssessment += modulesAwaitingAssessmentCount(session);
      continue;
    }
    byActor.set(session.actorId, {
      actorId: session.actorId,
      actorName: session.actorName,
      sessions: [session],
      sessionCount: 1,
      latestSessionDate: session.sessionDate,
      modulesAwaitingAssessment: modulesAwaitingAssessmentCount(session),
    });
  }

  return [...byActor.values()].sort((left, right) => {
    if (left.modulesAwaitingAssessment !== right.modulesAwaitingAssessment) {
      return right.modulesAwaitingAssessment - left.modulesAwaitingAssessment;
    }
    return left.actorName.localeCompare(right.actorName);
  });
}

export function findKitchenSkillsTrainerSession(
  sessions: readonly KitchenSkillsTrainerSession[],
  sessionId: string | null,
  actorId?: string | null,
): KitchenSkillsTrainerSession | undefined {
  if (!sessionId) return undefined;
  return sessions.find(
    (session) =>
      session.sessionId === sessionId &&
      (actorId == null || actorId === '' || session.actorId === actorId),
  );
}
