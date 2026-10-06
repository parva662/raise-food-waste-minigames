import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { isGameBusEmbed } from '@/platform/gamebus/detectEmbed';
import {
  getGameBusInputCollections,
  getGameBusTask,
  startGameBusHandshake,
  subscribeGameBusInputCollections,
  subscribeGameBusTask,
} from '@/platform/gamebus/bridge';
import { extractGroupActivities, getRawKitchenSelfActivitiesInput, getRawKitchenSkillsTrainerActivitiesInput } from '@/platform/gamebus/groupActivities';
import { getAuthenticatedGameBusUser } from '@/platform/gamebus/inputCollections';
import { normalizeIngredientId } from '@/shared/identifiers/ingredientId';
import { isIngredientAlreadyRecorded } from '@/products/kitchen-skills-challenge/domain/session/ingredientUniqueness';
import { ensureKitchenSkillsLockedSession } from '@/products/kitchen-skills-challenge/domain/session/lock';
import { isKitchenSkillsReviewScore } from '@/products/kitchen-skills-challenge/domain/assessment/scores';
import { buildKitchenSkillsTrainerSessions } from '@/products/kitchen-skills-challenge/read/trainerSessions';
import {
  buildKitchenSkillsReadModel,
  mergeKitchenSkillsRecords,
  parsePersistedReviewEntry,
} from '@/products/kitchen-skills-challenge/read/kitchenSkillsReadModel';
import type { KitchenSkillsTrainerSession } from '@/products/kitchen-skills-challenge/domain/types';
import {
  tryPostKitchenSkillsPortion,
  tryPostKitchenSkillsRescue,
  tryPostKitchenSkillsReview,
  tryPostKitchenSkillsTrim,
} from '@/products/kitchen-skills-challenge/gamebus/postActivity';
import type {
  KitchenSkillsLockedSession,
  KitchenSkillsPortionEntry,
  KitchenSkillsRescueEntry,
  KitchenSkillsReviewEntry,
  KitchenSkillsReviewedModule,
  KitchenSkillsTrimEntry,
} from '@/products/kitchen-skills-challenge/domain/types';
import {
  canOpenKitchenSkillsReview,
  requiredKitchenSkillsSection,
  type KitchenSkillsTaskProgress,
} from '@/products/kitchen-skills-challenge/domain/session/challengeGate';
import { goToKitchenDaySection, type KitchenSkillsHashSection } from '@/app/routes';

export type KitchenSkillsCommitResult =
  | { ok: true; mode: 'local' }
  | { ok: true; mode: 'posted_awaiting_persist' }
  | { ok: false; reason: string; keepDraft: true };

interface KitchenSkillsSessionValue {
  status: 'initializing' | 'ready';
  session: KitchenSkillsLockedSession | null;
  trimEntries: KitchenSkillsTrimEntry[];
  rescueEntries: KitchenSkillsRescueEntry[];
  portionEntries: KitchenSkillsPortionEntry[];
  reviews: KitchenSkillsReviewEntry[];
  groupSessions: KitchenSkillsTrainerSession[];
  recordedIngredientIds: string[];
  commitTrimEntry: (entry: KitchenSkillsTrimEntry) => KitchenSkillsCommitResult;
  commitRescueEntry: (entry: KitchenSkillsRescueEntry) => KitchenSkillsCommitResult;
  commitPortionEntry: (entry: KitchenSkillsPortionEntry) => KitchenSkillsCommitResult;
  commitReview: (entry: KitchenSkillsReviewEntry, studentActorId: string) => KitchenSkillsCommitResult;
  findTrimByIngredientId: (ingredientId: string) => KitchenSkillsTrimEntry | undefined;
  findRescueByIngredientId: (ingredientId: string) => KitchenSkillsRescueEntry | undefined;
  findReviewBySessionAndModule: (
    sessionId: string,
    reviewedGame: KitchenSkillsReviewedModule,
  ) => KitchenSkillsReviewEntry | undefined;
  showFinishSummary: boolean;
  taskProgress: KitchenSkillsTaskProgress;
  requiredSection: Exclude<KitchenSkillsHashSection, 'review'>;
  reviewAllowed: boolean;
  setTrimInProgress: (value: boolean) => void;
  enterReuse: () => void;
}

const KitchenSkillsSessionContext = createContext<KitchenSkillsSessionValue | null>(null);

function reviewDedupeKey(review: KitchenSkillsReviewEntry): string {
  return review.persistId ?? `${review.sessionId}::${review.reviewedGame}`;
}

function dedupePersistedReviews(
  reviews: readonly KitchenSkillsReviewEntry[],
): KitchenSkillsReviewEntry[] {
  const byKey = new Map<string, KitchenSkillsReviewEntry>();
  for (const review of reviews) {
    const key = reviewDedupeKey(review);
    if (!byKey.has(key)) byKey.set(key, review);
  }
  return [...byKey.values()];
}

function readPersistedForSession(sessionId: string): {
  trimEntries: KitchenSkillsTrimEntry[];
  rescueEntries: KitchenSkillsRescueEntry[];
  portionEntries: KitchenSkillsPortionEntry[];
  reviews: KitchenSkillsReviewEntry[];
  groupSessions: KitchenSkillsTrainerSession[];
} {
  const payload = getGameBusInputCollections();
  const trainerActivities = extractGroupActivities(getRawKitchenSkillsTrainerActivitiesInput(payload));
  const selfActivities = extractGroupActivities(getRawKitchenSelfActivitiesInput(payload));
  const reviewsFromActivities = (activities: readonly unknown[]) =>
    activities
      .map((activity) => parsePersistedReviewEntry(activity))
      .filter((entry): entry is KitchenSkillsReviewEntry => entry !== null);
  return {
    ...buildKitchenSkillsReadModel(selfActivities, { sessionId }),
    // Session Review in the student embed must see tutor assessments even when they
    // arrive only via the self feed (or only via the trainer feed).
    reviews: dedupePersistedReviews([
      ...reviewsFromActivities(selfActivities),
      ...reviewsFromActivities(trainerActivities),
    ]),
    groupSessions: buildKitchenSkillsTrainerSessions(trainerActivities),
  };
}

export function KitchenSkillsSessionProvider({
  children,
  now,
  initialSession,
}: {
  children: ReactNode;
  now?: Date;
  initialSession?: KitchenSkillsLockedSession;
}) {
  const embedded = isGameBusEmbed();
  const tryLockEmbeddedSession = useCallback((): KitchenSkillsLockedSession | null => {
    const task = getGameBusTask();
    const actorId = getAuthenticatedGameBusUser(getGameBusInputCollections())?.id;
    if (!task?.id || !actorId) return null;
    return ensureKitchenSkillsLockedSession(null, {
      embedded: true,
      taskId: task.id,
      actorId,
      now: now ?? new Date(),
    });
  }, [now]);

  const [session, setSession] = useState<KitchenSkillsLockedSession | null>(() => {
    if (initialSession) return initialSession;
    if (embedded) return tryLockEmbeddedSession();
    return ensureKitchenSkillsLockedSession(null, {
      embedded: false,
      taskId: undefined,
      now: now ?? new Date(),
    });
  });
  const [localTrim, setLocalTrim] = useState<KitchenSkillsTrimEntry[]>([]);
  const [localRescue, setLocalRescue] = useState<KitchenSkillsRescueEntry[]>([]);
  const [localPortion, setLocalPortion] = useState<KitchenSkillsPortionEntry[]>([]);
  const [localReviews, setLocalReviews] = useState<KitchenSkillsReviewEntry[]>([]);
  const [showFinishSummary, setShowFinishSummary] = useState(false);
  const [trimInProgress, setTrimInProgress] = useState(false);
  const [reuseEntered, setReuseEntered] = useState(false);
  const [persisted, setPersisted] = useState(() =>
    session ? readPersistedForSession(session.sessionId) : {
      trimEntries: [] as KitchenSkillsTrimEntry[],
      rescueEntries: [] as KitchenSkillsRescueEntry[],
      portionEntries: [] as KitchenSkillsPortionEntry[],
      reviews: [] as KitchenSkillsReviewEntry[],
      groupSessions: [] as KitchenSkillsTrainerSession[],
    },
  );

  useEffect(() => {
    if (!embedded) return;
    const stopHandshake = startGameBusHandshake();
    const lockOnce = () => {
      setSession((current) => current ?? tryLockEmbeddedSession());
    };
    const unsubscribeTask = subscribeGameBusTask(() => lockOnce());
    const unsubscribeInputs = subscribeGameBusInputCollections(lockOnce);
    lockOnce();
    return () => {
      unsubscribeTask();
      unsubscribeInputs();
      stopHandshake();
    };
  }, [embedded, tryLockEmbeddedSession]);

  useEffect(() => {
    if (!session) return;
    const sync = () => {
      setPersisted(readPersistedForSession(session.sessionId));
    };
    sync();
    return subscribeGameBusInputCollections(sync);
  }, [session]);

  const trimEntries = useMemo(
    () =>
      mergeKitchenSkillsRecords(localTrim, persisted.trimEntries, (left, right) =>
        left.ingredientId === right.ingredientId,
      ),
    [localTrim, persisted.trimEntries],
  );
  const rescueEntries = useMemo(
    () =>
      mergeKitchenSkillsRecords(localRescue, persisted.rescueEntries, (left, right) =>
        left.ingredientId === right.ingredientId,
      ),
    [localRescue, persisted.rescueEntries],
  );
  const portionEntries = useMemo(
    () =>
      mergeKitchenSkillsRecords(
        localPortion,
        persisted.portionEntries,
        (left, right) =>
          left.recipeId === right.recipeId && left.submittedAt === right.submittedAt,
      ),
    [localPortion, persisted.portionEntries],
  );
  const reviews = useMemo(
    () =>
      mergeKitchenSkillsRecords(
        localReviews,
        persisted.reviews,
        (left, right) =>
          left.sessionId === right.sessionId && left.reviewedGame === right.reviewedGame,
      ),
    [localReviews, persisted.reviews],
  );

  const recordedIngredientIds = useMemo(
    () => trimEntries.map((entry) => entry.ingredientId),
    [trimEntries],
  );

  const commitTrimEntry = useCallback((entry: KitchenSkillsTrimEntry): KitchenSkillsCommitResult => {
    if (isIngredientAlreadyRecorded(recordedIngredientIds, entry.ingredientId)) {
      return { ok: false, reason: 'duplicate_ingredient', keepDraft: true };
    }
    if (isGameBusEmbed()) {
      const posted = tryPostKitchenSkillsTrim(entry);
      if (!posted.ok) {
        return { ok: false, reason: posted.reason, keepDraft: true };
      }
      setLocalTrim((current) =>
        current.some((item) => item.ingredientId === entry.ingredientId)
          ? current
          : [...current, { ...entry, source: 'local' }],
      );
      return { ok: true, mode: 'posted_awaiting_persist' };
    }
    setLocalTrim((current) =>
      current.some((item) => item.ingredientId === entry.ingredientId)
        ? current
        : [...current, { ...entry, source: 'local' }],
    );
    return { ok: true, mode: 'local' };
  }, [recordedIngredientIds]);

  const commitRescueEntry = useCallback((entry: KitchenSkillsRescueEntry): KitchenSkillsCommitResult => {
    if (!trimEntries.some((item) => item.ingredientId === entry.ingredientId)) {
      return { ok: false, reason: 'missing_trim', keepDraft: true };
    }
    if (rescueEntries.some((item) => item.ingredientId === entry.ingredientId)) {
      return { ok: false, reason: 'duplicate_rescue', keepDraft: true };
    }
    if (isGameBusEmbed()) {
      const posted = tryPostKitchenSkillsRescue(entry);
      if (!posted.ok) {
        return { ok: false, reason: posted.reason, keepDraft: true };
      }
      setLocalRescue((current) => [...current, { ...entry, source: 'local' }]);
      setShowFinishSummary(true);
      return { ok: true, mode: 'posted_awaiting_persist' };
    }
    setLocalRescue((current) => [...current, { ...entry, source: 'local' }]);
    setShowFinishSummary(true);
    return { ok: true, mode: 'local' };
  }, [rescueEntries, trimEntries]);

  const commitPortionEntry = useCallback((entry: KitchenSkillsPortionEntry): KitchenSkillsCommitResult => {
    if (isGameBusEmbed()) {
      const posted = tryPostKitchenSkillsPortion(entry);
      if (!posted.ok) {
        return { ok: false, reason: posted.reason, keepDraft: true };
      }
      setLocalPortion((current) => [...current, { ...entry, source: 'local' }]);
      return { ok: true, mode: 'posted_awaiting_persist' };
    }
    setLocalPortion((current) => [...current, { ...entry, source: 'local' }]);
    return { ok: true, mode: 'local' };
  }, []);

  const enterReuse = useCallback(() => {
    setReuseEntered(true);
    setTrimInProgress(false);
    goToKitchenDaySection('reuse');
  }, []);

  const commitReview = useCallback((entry: KitchenSkillsReviewEntry, studentActorId: string): KitchenSkillsCommitResult => {
    if (
      !isKitchenSkillsReviewScore(entry.timeEfficiencyScore) ||
      !isKitchenSkillsReviewScore(entry.preparationQualityScore)
    ) {
      return { ok: false, reason: 'invalid_scores', keepDraft: true };
    }
    if (
      reviews.some(
        (item) => item.sessionId === entry.sessionId && item.reviewedGame === entry.reviewedGame,
      )
    ) {
      return { ok: false, reason: 'duplicate_review', keepDraft: true };
    }
    if (isGameBusEmbed()) {
      const posted = tryPostKitchenSkillsReview(entry, studentActorId);
      if (!posted.ok) {
        return { ok: false, reason: posted.reason, keepDraft: true };
      }
      setLocalReviews((current) =>
        current.some(
          (item) => item.sessionId === entry.sessionId && item.reviewedGame === entry.reviewedGame,
        )
          ? current
          : [...current, { ...entry, source: 'local' }],
      );
      return { ok: true, mode: 'posted_awaiting_persist' };
    }
    setLocalReviews((current) =>
      current.some(
        (item) => item.sessionId === entry.sessionId && item.reviewedGame === entry.reviewedGame,
      )
        ? current
        : [...current, { ...entry, source: 'local' }],
    );
    return { ok: true, mode: 'local' };
  }, [reviews]);

  const findTrimByIngredientId = useCallback(
    (ingredientId: string) => trimEntries.find((entry) => entry.ingredientId === ingredientId),
    [trimEntries],
  );
  const findRescueByIngredientId = useCallback(
    (ingredientId: string) => rescueEntries.find((entry) => entry.ingredientId === ingredientId),
    [rescueEntries],
  );
  const findReviewBySessionAndModule = useCallback(
    (sessionId: string, reviewedGame: KitchenSkillsReviewedModule) =>
      reviews.find(
        (entry) => entry.sessionId === sessionId && entry.reviewedGame === reviewedGame,
      ),
    [reviews],
  );

  const taskProgress = useMemo<KitchenSkillsTaskProgress>(
    () => ({
      portionComplete: portionEntries.length > 0,
      trimCount: trimEntries.length,
      reuseComplete: rescueEntries.length > 0,
      reuseEntered: reuseEntered || rescueEntries.length > 0,
      trimInProgress,
    }),
    [portionEntries.length, trimEntries.length, rescueEntries.length, reuseEntered, trimInProgress],
  );
  const requiredSection = requiredKitchenSkillsSection(taskProgress);
  const reviewAllowed = canOpenKitchenSkillsReview(taskProgress);

  const value = useMemo<KitchenSkillsSessionValue>(
    () => ({
      status: session ? 'ready' : 'initializing',
      session,
      trimEntries,
      rescueEntries,
      portionEntries,
      reviews,
      groupSessions: persisted.groupSessions,
      recordedIngredientIds,
      commitTrimEntry,
      commitRescueEntry,
      commitPortionEntry,
      commitReview,
      findTrimByIngredientId,
      findRescueByIngredientId,
      findReviewBySessionAndModule,
      showFinishSummary,
      taskProgress,
      requiredSection,
      reviewAllowed,
      setTrimInProgress,
      enterReuse,
    }),
    [
      session,
      trimEntries,
      rescueEntries,
      portionEntries,
      reviews,
      persisted.groupSessions,
      recordedIngredientIds,
      commitTrimEntry,
      commitRescueEntry,
      commitPortionEntry,
      commitReview,
      findTrimByIngredientId,
      findRescueByIngredientId,
      findReviewBySessionAndModule,
      showFinishSummary,
      taskProgress,
      requiredSection,
      reviewAllowed,
      enterReuse,
    ],
  );

  return (
    <KitchenSkillsSessionContext.Provider value={value}>{children}</KitchenSkillsSessionContext.Provider>
  );
}

export function useKitchenSkillsSession(): KitchenSkillsSessionValue {
  const value = useContext(KitchenSkillsSessionContext);
  if (!value) {
    throw new Error('useKitchenSkillsSession must be used within KitchenSkillsSessionProvider');
  }
  return value;
}

export function useReadyKitchenSkillsSession(): KitchenSkillsSessionValue & {
  session: KitchenSkillsLockedSession;
} {
  const value = useKitchenSkillsSession();
  if (!value.session) {
    throw new Error('Kitchen Day session is not ready');
  }
  return { ...value, session: value.session };
}

export function kitchenSkillsIngredientIdFromName(name: string): string | null {
  return normalizeIngredientId(name);
}
