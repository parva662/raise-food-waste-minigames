import { getActivityTemplateReference } from '@/platform/gamebus/groupActivities';
import {
  evidencedRecipeModules,
  findConfirmedRecipeModuleReview,
  findRecipeModuleReview,
  findSessionLevelAssessment,
  hasDuplicateReviewIdentity,
  isLegacySessionReview,
  isReviewPersistConfirmed,
  isSessionLevelAssessment,
  listSessionRecipeIds,
  recipeAssessmentStatus,
  recipeModuleAssessmentState,
  reviewIdentityKey,
  unattributedEvidenceModules,
  type KitchenSkillsModuleAssessmentState,
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

/** Trainer presentation order only; GameBus slugs and student flow order are unchanged. */
export const KITCHEN_SKILLS_TRAINER_MODULE_ORDER: readonly KitchenSkillsReviewedModule[] = [
  'portionPrecision',
  'trimSmart',
  'rescueAndReuse',
];

export function sortModulesForTrainer(
  modules: readonly KitchenSkillsReviewedModule[],
): KitchenSkillsReviewedModule[] {
  return KITCHEN_SKILLS_TRAINER_MODULE_ORDER.filter((module) => modules.includes(module));
}

export type KitchenSkillsAssessmentSlot = {
  /** Null for legacy evidence that cannot be attributed to a recipe. */
  recipeId: string | null;
  module: KitchenSkillsReviewedModule;
  state: KitchenSkillsModuleAssessmentState;
};

/** Every assessment the session requires, recipe by recipe in trainer module order. */
export function sessionAssessmentSlots(
  session: KitchenSkillsTrainerSession,
): KitchenSkillsAssessmentSlot[] {
  const pairs = evidencedRecipeModules(session);
  const slots: KitchenSkillsAssessmentSlot[] = [];
  for (const recipeId of listSessionRecipeIds(session)) {
    const modules = sortModulesForTrainer(
      pairs.filter((pair) => pair.recipeId === recipeId).map((pair) => pair.module),
    );
    for (const module of modules) {
      slots.push({
        recipeId,
        module,
        state: recipeModuleAssessmentState(session, recipeId, module),
      });
    }
  }
  for (const module of sortModulesForTrainer(unattributedEvidenceModules(session))) {
    const review = session.moduleReviews[module];
    slots.push({
      recipeId: null,
      module,
      state: !review
        ? 'needs_assessment'
        : isReviewPersistConfirmed(review)
          ? 'reviewed'
          : 'awaiting_confirmation',
    });
  }
  return slots;
}

export type KitchenSkillsSessionAssessmentCounts = {
  recorded: number;
  confirmed: number;
  awaiting: number;
  outstanding: number;
};

export function sessionAssessmentCounts(
  session: KitchenSkillsTrainerSession,
): KitchenSkillsSessionAssessmentCounts {
  const assessment = findSessionLevelAssessment(session);
  if (assessment) {
    return { recorded: 1, confirmed: 1, awaiting: 0, outstanding: 0 };
  }
  // Evidence exists → one outstanding session assessment; no evidence → nothing to assess.
  const hasEvidence =
    session.portionEntries.length > 0 ||
    session.trimEntries.length > 0 ||
    session.rescueEntries.length > 0;
  return {
    recorded: hasEvidence ? 1 : 0,
    confirmed: 0,
    awaiting: 0,
    outstanding: hasEvidence ? 1 : 0,
  };
}

export function modulesWithEvidenceCount(session: KitchenSkillsTrainerSession): number {
  return sessionAssessmentCounts(session).recorded;
}

export function modulesReviewedCount(session: KitchenSkillsTrainerSession): number {
  return sessionAssessmentCounts(session).confirmed;
}

/** Evidenced modules with no tutor submission at all (awaiting-confirmation ones excluded). */
export function modulesAwaitingAssessmentCount(session: KitchenSkillsTrainerSession): number {
  return sessionAssessmentCounts(session).outstanding;
}

/**
 * Restored session-level workflow: REVIEWED when a session assessment exists
 * (local after submit, or persisted). Historical per-module rows alone never
 * mark the whole session reviewed. Awaiting confirmation is unused for new posts.
 */
export type KitchenSkillsSessionAssessmentStatus = KitchenSkillsModuleAssessmentState;

export function sessionAssessmentStatus(
  session: KitchenSkillsTrainerSession,
): KitchenSkillsSessionAssessmentStatus {
  const assessment = findSessionLevelAssessment(session);
  if (!assessment) return 'needs_assessment';
  return 'reviewed';
}

export const KITCHEN_SKILLS_MODULE_SHORT_LABELS: Record<KitchenSkillsReviewedModule, string> = {
  trimSmart: 'Trim',
  rescueAndReuse: 'Rescue',
  portionPrecision: 'Portion',
};

export const KITCHEN_SKILLS_ASSESSMENT_STATE_LABELS: Record<KitchenSkillsModuleAssessmentState, string> = {
  needs_assessment: 'Needs assessment',
  awaiting_confirmation: 'Awaiting confirmation',
  reviewed: 'Reviewed',
};

/** Recorded modules for a session row, e.g. "Portion · Trim · Rescue". */
export function sessionRecordedModuleLabels(session: KitchenSkillsTrainerSession): string[] {
  const modules = new Set(sessionAssessmentSlots(session).map((slot) => slot.module));
  return sortModulesForTrainer([...modules]).map(
    (module) => KITCHEN_SKILLS_MODULE_SHORT_LABELS[module],
  );
}

export function isSessionAwaitingAssessment(session: KitchenSkillsTrainerSession): boolean {
  return modulesAwaitingAssessmentCount(session) > 0;
}

export function partitionTrainerSessionsByAssessment(
  sessions: readonly KitchenSkillsTrainerSession[],
): {
  needsAssessment: KitchenSkillsTrainerSession[];
  awaitingConfirmation: KitchenSkillsTrainerSession[];
  reviewed: KitchenSkillsTrainerSession[];
} {
  const needsAssessment: KitchenSkillsTrainerSession[] = [];
  const awaitingConfirmation: KitchenSkillsTrainerSession[] = [];
  const reviewed: KitchenSkillsTrainerSession[] = [];
  for (const session of sessions) {
    const status = sessionAssessmentStatus(session);
    if (status === 'reviewed') reviewed.push(session);
    else if (status === 'awaiting_confirmation') awaitingConfirmation.push(session);
    else needsAssessment.push(session);
  }
  return { needsAssessment, awaitingConfirmation, reviewed };
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

    if (isSessionLevelAssessment(review)) {
      if (!session.sessionAssessment) session.sessionAssessment = review;
      continue;
    }

    if (isLegacySessionReview(review) && review.reviewedGame) {
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
      sessionAssessment: null,
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
    const status = sessionAssessmentStatus(session);
    let summary = byActor.get(session.actorId);
    if (!summary) {
      summary = {
        actorId: session.actorId,
        actorName: session.actorName,
        sessions: [],
        sessionCount: 0,
        latestSessionDate: session.sessionDate,
        modulesAwaitingAssessment: 0,
        sessionsNeedingAssessment: 0,
        sessionsAwaitingConfirmation: 0,
        sessionsReviewed: 0,
      };
      byActor.set(session.actorId, summary);
    }
    summary.sessions.push(session);
    summary.sessionCount += 1;
    if (session.sessionDate.localeCompare(summary.latestSessionDate) > 0) {
      summary.latestSessionDate = session.sessionDate;
    }
    summary.modulesAwaitingAssessment += modulesAwaitingAssessmentCount(session);
    if (status === 'needs_assessment') summary.sessionsNeedingAssessment += 1;
    else if (status === 'awaiting_confirmation') summary.sessionsAwaitingConfirmation += 1;
    else summary.sessionsReviewed += 1;
  }

  return [...byActor.values()].sort((left, right) => {
    if (left.sessionsNeedingAssessment !== right.sessionsNeedingAssessment) {
      return right.sessionsNeedingAssessment - left.sessionsNeedingAssessment;
    }
    if (left.sessionsAwaitingConfirmation !== right.sessionsAwaitingConfirmation) {
      return right.sessionsAwaitingConfirmation - left.sessionsAwaitingConfirmation;
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

export {
  reviewIdentityKey,
  findRecipeModuleReview,
  findConfirmedRecipeModuleReview,
  evidencedRecipeModules,
  recipeAssessmentStatus,
  isReviewPersistConfirmed,
};
