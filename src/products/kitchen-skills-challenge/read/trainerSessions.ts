import { getActivityTemplateReference } from '@/platform/gamebus/groupActivities';
import {
  evidencedRecipeModules,
  findRecipeModuleReview,
  hasDuplicateReviewIdentity,
  isLegacySessionReview,
  recipeModulesAwaitingAssessment,
  reviewIdentityKey,
  unattributedEvidenceModules,
} from '@/products/kitchen-skills-challenge/domain/session/reviewIdentity';
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

export function emptySessionReviews(): KitchenSkillsReviewEntry[] {
  return [];
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
  // Prefer a recipe-specific review when there is exactly one evidenced recipe for the module.
  const recipePairs = evidencedRecipeModules(session).filter((pair) => pair.module === module);
  if (recipePairs.length === 1) {
    const recipeReview = findRecipeModuleReview(session, recipePairs[0].recipeId, module);
    if (recipeReview) return recipeReview;
  }
  return session.moduleReviews[module];
}

/** Latest submitted module review for read-only summaries. */
export function latestModuleReview(
  session: KitchenSkillsTrainerSession,
): KitchenSkillsReviewEntry | null {
  const recipeReviews = session.reviews.filter((entry) => !isLegacySessionReview(entry));
  const legacy = KITCHEN_SKILLS_REVIEWED_MODULES.map(
    (module) => session.moduleReviews[module],
  ).filter((entry): entry is KitchenSkillsReviewEntry => entry !== null);
  const reviews = [...recipeReviews, ...legacy];
  if (reviews.length === 0) return null;
  return [...reviews].sort((left, right) => right.submittedAt.localeCompare(left.submittedAt))[0];
}

export function modulesWithEvidenceCount(session: KitchenSkillsTrainerSession): number {
  return (
    evidencedRecipeModules(session).length + unattributedEvidenceModules(session).length
  );
}

export function modulesReviewedCount(session: KitchenSkillsTrainerSession): number {
  const recipeReviewed = evidencedRecipeModules(session).filter(
    (pair) => findRecipeModuleReview(session, pair.recipeId, pair.module) !== null,
  ).length;
  const legacyReviewed = unattributedEvidenceModules(session).filter(
    (module) => session.moduleReviews[module] !== null,
  ).length;
  return recipeReviewed + legacyReviewed;
}

export function modulesAwaitingAssessmentCount(session: KitchenSkillsTrainerSession): number {
  const recipeAwaiting = recipeModulesAwaitingAssessment(session).length;
  const legacyAwaiting = unattributedEvidenceModules(session).filter(
    (module) => session.moduleReviews[module] === null,
  ).length;
  return recipeAwaiting + legacyAwaiting;
}

/** Assessment state from evidenced recipe-module pairs (plus unattributed legacy modules). */
export type KitchenSkillsSessionAssessmentStatus =
  | 'needs_assessment'
  | 'partially_reviewed'
  | 'reviewed';

export function sessionAssessmentStatus(
  session: KitchenSkillsTrainerSession,
): KitchenSkillsSessionAssessmentStatus {
  const evidenceCount = modulesWithEvidenceCount(session);
  const reviewedCount = modulesReviewedCount(session);
  const awaiting = modulesAwaitingAssessmentCount(session);
  if (evidenceCount === 0 || awaiting === evidenceCount) return 'needs_assessment';
  if (awaiting === 0 && reviewedCount === evidenceCount) return 'reviewed';
  return 'partially_reviewed';
}

export const KITCHEN_SKILLS_MODULE_SHORT_LABELS: Record<KitchenSkillsReviewedModule, string> = {
  trimSmart: 'Trim',
  rescueAndReuse: 'Rescue',
  portionPrecision: 'Portion',
};

export function sessionPendingStatusPhrases(session: KitchenSkillsTrainerSession): string[] {
  const phrases: string[] = [];
  for (const pair of evidencedRecipeModules(session)) {
    const label = KITCHEN_SKILLS_MODULE_SHORT_LABELS[pair.module];
    if (findRecipeModuleReview(session, pair.recipeId, pair.module)) {
      phrases.push(`${label} ✓`);
    } else {
      phrases.push(`${label} needs review`);
    }
  }
  for (const module of unattributedEvidenceModules(session)) {
    const label = KITCHEN_SKILLS_MODULE_SHORT_LABELS[module];
    if (session.moduleReviews[module]) phrases.push(`${label} ✓`);
    else phrases.push(`${label} needs review`);
  }
  return phrases;
}

export function sessionReviewedScorePhrases(session: KitchenSkillsTrainerSession): string[] {
  const phrases = evidencedRecipeModules(session).flatMap((pair) => {
    const review = findRecipeModuleReview(session, pair.recipeId, pair.module);
    if (!review) return [];
    return [
      `${KITCHEN_SKILLS_MODULE_SHORT_LABELS[pair.module]} ${review.timeEfficiencyScore}/${review.preparationQualityScore}`,
    ];
  });
  for (const module of unattributedEvidenceModules(session)) {
    const review = session.moduleReviews[module];
    if (!review) continue;
    phrases.push(
      `${KITCHEN_SKILLS_MODULE_SHORT_LABELS[module]} ${review.timeEfficiencyScore}/${review.preparationQualityScore}`,
    );
  }
  return phrases;
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
    if (sessionAssessmentStatus(session) === 'reviewed') reviewed.push(session);
    else needsAssessment.push(session);
  }
  return { needsAssessment, reviewed };
}

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
    if (!session.reviews) session.reviews = [];
    if (hasDuplicateReviewIdentity(session.reviews, review)) continue;
    session.reviews.push(review);

    if (isLegacySessionReview(review)) {
      if (session.moduleReviews[review.reviewedGame] === null) {
        session.moduleReviews[review.reviewedGame] = review;
      }
    }
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
      reviews: emptySessionReviews(),
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

export { reviewIdentityKey, findRecipeModuleReview, evidencedRecipeModules };
