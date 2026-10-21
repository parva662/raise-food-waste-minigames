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
  getGameBusInputCollectionsReceivedAt,
  getGameBusTask,
  startGameBusHandshake,
  subscribeGameBusInputCollections,
  subscribeGameBusTask,
} from '@/platform/gamebus/bridge';
import { extractGroupActivities, getRawKitchenSelfActivitiesInput, getRawKitchenSkillsTrainerActivitiesInput } from '@/platform/gamebus/groupActivities';
import { getAuthenticatedGameBusUser } from '@/platform/gamebus/inputCollections';
import { normalizeIngredientId } from '@/shared/identifiers/ingredientId';
import {
  isPortionRecipeAlreadyRecorded,
  isRescueAlreadyRecorded,
  isTrimAlreadyRecorded,
  normalizeRecipeId,
} from '@/products/kitchen-skills-challenge/domain/session/ingredientUniqueness';
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
  clearKitchenSkillsPostAttempt,
  hasKitchenSkillsPostAttempt,
  kitchenSkillsReviewAttemptKey,
  tryPostKitchenSkillsPortion,
  tryPostKitchenSkillsRescue,
  tryPostKitchenSkillsReview,
  tryPostKitchenSkillsTrim,
} from '@/products/kitchen-skills-challenge/gamebus/postActivity';
import { gamebusDevLog } from '@/platform/gamebus/devLog';
import { kitchenSkillsReviewDiagnosticPayload } from '@/products/kitchen-skills-challenge/gamebus/reviewPostErrors';
import {
  awaitingReviewsFromDispatchMarkers,
  clearKitchenSkillsReviewDispatchMarker,
  hasKitchenSkillsReviewDispatchMarker,
  isAwaitingReviewMissingFromRefreshedFeed,
  kitchenSkillsTrainerFeedFingerprint,
  markKitchenSkillsReviewDispatched,
} from '@/products/kitchen-skills-challenge/gamebus/reviewDispatchMarker';
import type {
  KitchenSkillsLockedSession,
  KitchenSkillsPortionEntry,
  KitchenSkillsRescueEntry,
  KitchenSkillsReviewEntry,
  KitchenSkillsReviewedModule,
  KitchenSkillsTrimEntry,
} from '@/products/kitchen-skills-challenge/domain/types';
import {
  buildKitchenSkillsTaskProgress,
  canFinishKitchenSkillsChallenge,
  canOpenKitchenSkillsReview,
  canStartAnotherKitchenSkillsRecipe,
  newRecipeBlockedReason,
  requiredKitchenSkillsSection,
  type KitchenSkillsTaskProgress,
} from '@/products/kitchen-skills-challenge/domain/session/challengeGate';
import {
  findReviewByIdentity,
  hasDuplicateReviewIdentity,
  isReviewPersistConfirmed,
  reviewIdentityKey,
} from '@/products/kitchen-skills-challenge/domain/session/reviewIdentity';
import { goToKitchenDaySection, type KitchenSkillsHashSection } from '@/app/routes';
import {
  latestPortionEntryBySubmittedAt,
  selectActivePortionEntry,
} from '@/products/kitchen-skills-challenge/domain/session/sessionRecipe';

export type KitchenSkillsCommitResult =
  | { ok: true; mode: 'local' }
  | { ok: true; mode: 'posted_awaiting_persist' }
  | { ok: false; reason: string; keepDraft: true; missing?: string[] };

interface KitchenSkillsSessionValue {
  status: 'initializing' | 'ready';
  session: KitchenSkillsLockedSession | null;
  trimEntries: KitchenSkillsTrimEntry[];
  rescueEntries: KitchenSkillsRescueEntry[];
  portionEntries: KitchenSkillsPortionEntry[];
  /** Explicit active recipe for Trim / gates after the latest successful Portion save. */
  activeRecipeId: string | null;
  activePortionEntry: KitchenSkillsPortionEntry | null;
  reviews: KitchenSkillsReviewEntry[];
  groupSessions: KitchenSkillsTrainerSession[];
  /** Ingredient ids already trimmed for the active recipe. */
  recordedIngredientIds: string[];
  commitTrimEntry: (entry: KitchenSkillsTrimEntry) => KitchenSkillsCommitResult;
  commitRescueEntry: (entry: KitchenSkillsRescueEntry) => KitchenSkillsCommitResult;
  commitPortionEntry: (entry: KitchenSkillsPortionEntry) => KitchenSkillsCommitResult;
  commitReview: (entry: KitchenSkillsReviewEntry, studentActorId: string) => KitchenSkillsCommitResult;
  /**
   * True when a genuinely later GameBus feed (not the snapshot seen at dispatch) still lacks this
   * unconfirmed assessment for the student's session.
   */
  canReassessUnconfirmedReview: (entry: KitchenSkillsReviewEntry, studentActorId: string) => boolean;
  /**
   * Drop an unconfirmed assessment that a refreshed feed still lacks, so the tutor can assess
   * again. Refuses unless `canReassessUnconfirmedReview` holds.
   */
  discardUnconfirmedReview: (
    entry: KitchenSkillsReviewEntry,
    studentActorId: string,
  ) => boolean;
  findTrimByIngredientId: (
    ingredientId: string,
    recipeId?: string | null,
  ) => KitchenSkillsTrimEntry | undefined;
  findRescueByIngredientId: (
    ingredientId: string,
    recipeId?: string | null,
  ) => KitchenSkillsRescueEntry | undefined;
  findReviewBySessionAndModule: (
    sessionId: string,
    reviewedGame: KitchenSkillsReviewedModule,
    recipeId?: string | null,
  ) => KitchenSkillsReviewEntry | undefined;
  showFinishSummary: boolean;
  taskProgress: KitchenSkillsTaskProgress;
  requiredSection: Exclude<KitchenSkillsHashSection, 'review'>;
  reviewAllowed: boolean;
  canFinish: boolean;
  canStartAnotherRecipe: boolean;
  newRecipeBlockedReason: string | null;
  setTrimInProgress: (value: boolean) => void;
  setReuseInProgress: (value: boolean) => void;
  enterReuse: () => void;
  addAnotherIngredient: () => void;
  openFinishSummary: () => void;
  /** Return to Portion to pick a different unsaved recipe (same sessionId). */
  startAnotherRecipe: () => void;
  /** Resume Trim/Reuse for an already-saved Portion recipe without re-posting. */
  resumeSavedRecipe: (recipeId: string) => boolean;
}

const KitchenSkillsSessionContext = createContext<KitchenSkillsSessionValue | null>(null);

function reviewDedupeKey(review: KitchenSkillsReviewEntry): string {
  return review.persistId ?? reviewIdentityKey(review);
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
  feedReceivedAt: number | null;
  feedFingerprint: string | null;
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
    feedReceivedAt: payload ? getGameBusInputCollectionsReceivedAt() : null,
    feedFingerprint: payload ? kitchenSkillsTrainerFeedFingerprint(trainerActivities) : null,
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
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(null);
  const [showFinishSummary, setShowFinishSummary] = useState(false);
  const [trimInProgress, setTrimInProgress] = useState(false);
  const [reuseInProgress, setReuseInProgress] = useState(false);
  const [persisted, setPersisted] = useState(() =>
    session ? readPersistedForSession(session.sessionId) : {
      trimEntries: [] as KitchenSkillsTrimEntry[],
      rescueEntries: [] as KitchenSkillsRescueEntry[],
      portionEntries: [] as KitchenSkillsPortionEntry[],
      reviews: [] as KitchenSkillsReviewEntry[],
      groupSessions: [] as KitchenSkillsTrainerSession[],
      feedReceivedAt: null as number | null,
      feedFingerprint: null as string | null,
    },
  );
  const [markerVersion, setMarkerVersion] = useState(0);

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
      mergeKitchenSkillsRecords(
        localTrim,
        persisted.trimEntries,
        (left, right) =>
          left.ingredientId === right.ingredientId &&
          normalizeRecipeId(left.recipeId) === normalizeRecipeId(right.recipeId),
      ),
    [localTrim, persisted.trimEntries],
  );
  const rescueEntries = useMemo(
    () =>
      mergeKitchenSkillsRecords(
        localRescue,
        persisted.rescueEntries,
        (left, right) =>
          left.ingredientId === right.ingredientId &&
          normalizeRecipeId(left.recipeId) === normalizeRecipeId(right.recipeId),
      ),
    [localRescue, persisted.rescueEntries],
  );
  const portionEntries = useMemo(
    () =>
      mergeKitchenSkillsRecords(
        localPortion,
        persisted.portionEntries,
        (left, right) => normalizeRecipeId(left.recipeId) === normalizeRecipeId(right.recipeId),
      ),
    [localPortion, persisted.portionEntries],
  );
  const markerAwaitingReviews = useMemo(
    () =>
      awaitingReviewsFromDispatchMarkers(
        persisted.groupSessions.map((session) => ({
          actorId: session.actorId,
          sessionId: session.sessionId,
        })),
      ),
    // markerVersion: re-read sessionStorage after a deliberate discard.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [persisted.groupSessions, markerVersion],
  );

  const reviews = useMemo(
    () =>
      mergeKitchenSkillsRecords(
        [...localReviews, ...markerAwaitingReviews],
        persisted.reviews,
        (left, right) => reviewIdentityKey(left) === reviewIdentityKey(right),
      ),
    [localReviews, markerAwaitingReviews, persisted.reviews],
  );

  // Clear non-authoritative dispatch markers once the feed confirms persistence.
  useEffect(() => {
    for (const session of persisted.groupSessions) {
      for (const review of session.reviews) {
        if (!isReviewPersistConfirmed(review)) continue;
        clearKitchenSkillsReviewDispatchMarker(session.actorId, review);
      }
    }
  }, [persisted.groupSessions]);

  /** Trainer list/detail must see awaiting local reviews until GameBus hydrates them. */
  const groupSessions = useMemo(() => {
    const awaitingLocals = [...localReviews, ...markerAwaitingReviews];
    if (awaitingLocals.length === 0) return persisted.groupSessions;
    return persisted.groupSessions.map((session) => {
      const localsForSession = awaitingLocals.filter(
        (review) => review.sessionId === session.sessionId,
      );
      if (localsForSession.length === 0) return session;
      const mergedReviews = mergeKitchenSkillsRecords(
        localsForSession,
        session.reviews,
        (left, right) => reviewIdentityKey(left) === reviewIdentityKey(right),
      );
      return { ...session, reviews: mergedReviews };
    });
  }, [persisted.groupSessions, localReviews, markerAwaitingReviews]);

  // Keep explicit active recipe when still present; otherwise restore latest by submittedAt
  // (reload / hydration). Tab navigation alone must not change the active recipe.
  useEffect(() => {
    const latest = latestPortionEntryBySubmittedAt(portionEntries);
    if (!latest) {
      setActiveRecipeId(null);
      return;
    }
    setActiveRecipeId((current) => {
      if (current && portionEntries.some((entry) => entry.recipeId === current)) {
        return current;
      }
      return latest.recipeId;
    });
  }, [portionEntries]);

  const activePortionEntry = useMemo(
    () => selectActivePortionEntry(portionEntries, activeRecipeId),
    [portionEntries, activeRecipeId],
  );

  const recordedIngredientIds = useMemo(() => {
    const active = normalizeRecipeId(activeRecipeId);
    return trimEntries
      .filter((entry) => normalizeRecipeId(entry.recipeId) === active)
      .map((entry) => entry.ingredientId);
  }, [trimEntries, activeRecipeId]);

  const commitTrimEntry = useCallback((entry: KitchenSkillsTrimEntry): KitchenSkillsCommitResult => {
    const recipeId = normalizeRecipeId(entry.recipeId);
    if (!recipeId) {
      return { ok: false, reason: 'missing_recipe', keepDraft: true };
    }
    if (isTrimAlreadyRecorded(trimEntries, recipeId, entry.ingredientId)) {
      return { ok: false, reason: 'duplicate_ingredient', keepDraft: true };
    }
    const normalized = { ...entry, recipeId };
    if (isGameBusEmbed()) {
      const posted = tryPostKitchenSkillsTrim(normalized);
      if (!posted.ok) {
        return { ok: false, reason: posted.reason, keepDraft: true };
      }
      setLocalTrim((current) =>
        isTrimAlreadyRecorded(current, recipeId, entry.ingredientId)
          ? current
          : [...current, { ...normalized, source: 'local' }],
      );
      return { ok: true, mode: 'posted_awaiting_persist' };
    }
    setLocalTrim((current) =>
      isTrimAlreadyRecorded(current, recipeId, entry.ingredientId)
        ? current
        : [...current, { ...normalized, source: 'local' }],
    );
    return { ok: true, mode: 'local' };
  }, [trimEntries]);

  const commitRescueEntry = useCallback((entry: KitchenSkillsRescueEntry): KitchenSkillsCommitResult => {
    const recipeId = normalizeRecipeId(entry.recipeId);
    if (!recipeId) {
      return { ok: false, reason: 'missing_recipe', keepDraft: true };
    }
    if (
      !trimEntries.some(
        (item) =>
          item.ingredientId === entry.ingredientId && normalizeRecipeId(item.recipeId) === recipeId,
      )
    ) {
      return { ok: false, reason: 'missing_trim', keepDraft: true };
    }
    if (isRescueAlreadyRecorded(rescueEntries, recipeId, entry.ingredientId)) {
      return { ok: false, reason: 'duplicate_rescue', keepDraft: true };
    }
    const normalized = { ...entry, recipeId };
    if (isGameBusEmbed()) {
      const posted = tryPostKitchenSkillsRescue(normalized);
      if (!posted.ok) {
        return { ok: false, reason: posted.reason, keepDraft: true };
      }
      setLocalRescue((current) => [...current, { ...normalized, source: 'local' }]);
      setShowFinishSummary(true);
      return { ok: true, mode: 'posted_awaiting_persist' };
    }
    setLocalRescue((current) => [...current, { ...normalized, source: 'local' }]);
    setShowFinishSummary(true);
    return { ok: true, mode: 'local' };
  }, [rescueEntries, trimEntries]);

  const commitPortionEntry = useCallback(
    (entry: KitchenSkillsPortionEntry): KitchenSkillsCommitResult => {
      const recipeId = normalizeRecipeId(entry.recipeId);
      if (!recipeId) {
        return { ok: false, reason: 'missing_recipe', keepDraft: true };
      }
      if (
        isPortionRecipeAlreadyRecorded(
          portionEntries.map((item) => item.recipeId),
          recipeId,
        )
      ) {
        return { ok: false, reason: 'duplicate_recipe', keepDraft: true };
      }
      const gateProgress = buildKitchenSkillsTaskProgress({
        portionEntries,
        trimEntries,
        rescueEntries,
        activeRecipeId,
        trimInProgress,
        reuseInProgress,
      });
      if (!canStartAnotherKitchenSkillsRecipe(gateProgress)) {
        return { ok: false, reason: 'unfinished_recipe', keepDraft: true };
      }
      const normalized = { ...entry, recipeId };
      if (isGameBusEmbed()) {
        const posted = tryPostKitchenSkillsPortion(normalized);
        if (!posted.ok) {
          return { ok: false, reason: posted.reason, keepDraft: true };
        }
        setLocalPortion((current) => [...current, { ...normalized, source: 'local' }]);
        setActiveRecipeId(recipeId);
        setShowFinishSummary(false);
        return { ok: true, mode: 'posted_awaiting_persist' };
      }
      setLocalPortion((current) => [...current, { ...normalized, source: 'local' }]);
      setActiveRecipeId(recipeId);
      setShowFinishSummary(false);
      return { ok: true, mode: 'local' };
    },
    [
      portionEntries,
      trimEntries,
      rescueEntries,
      activeRecipeId,
      trimInProgress,
      reuseInProgress,
    ],
  );

  const enterReuse = useCallback(() => {
    setTrimInProgress(false);
    setShowFinishSummary(false);
    goToKitchenDaySection('reuse');
  }, [setTrimInProgress]);

  const addAnotherIngredient = useCallback(() => {
    setShowFinishSummary(false);
    goToKitchenDaySection('trim');
  }, []);

  const openFinishSummary = useCallback(() => {
    setShowFinishSummary(true);
  }, []);

  const startAnotherRecipe = useCallback(() => {
    setShowFinishSummary(false);
    setTrimInProgress(false);
    setReuseInProgress(false);
    goToKitchenDaySection('portion');
  }, []);

  const resumeSavedRecipe = useCallback(
    (recipeId: string): boolean => {
      const normalized = normalizeRecipeId(recipeId);
      if (!normalized) return false;
      if (!portionEntries.some((entry) => normalizeRecipeId(entry.recipeId) === normalized)) {
        return false;
      }
      setActiveRecipeId(normalized);
      setShowFinishSummary(false);
      setTrimInProgress(false);
      setReuseInProgress(false);
      goToKitchenDaySection('trim');
      return true;
    },
    [portionEntries],
  );

  const commitReview = useCallback((entry: KitchenSkillsReviewEntry, studentActorId: string): KitchenSkillsCommitResult => {
    if (
      !isKitchenSkillsReviewScore(entry.timeEfficiencyScore) ||
      !isKitchenSkillsReviewScore(entry.preparationQualityScore)
    ) {
      return { ok: false, reason: 'invalid_scores', keepDraft: true };
    }
    if (!normalizeRecipeId(entry.recipeId ?? '')) {
      return { ok: false, reason: 'missing_recipe', keepDraft: true };
    }
    if (hasDuplicateReviewIdentity(reviews, entry)) {
      return { ok: false, reason: 'duplicate_review', keepDraft: true };
    }

    const actorId = studentActorId.trim();
    const attemptKey = kitchenSkillsReviewAttemptKey(entry);
    const existing = findReviewByIdentity(reviews, entry);

    // Dispatched-but-unconfirmed must never post again (no GameBus ACK / idempotency).
    if (
      existing?.awaitingPersist ||
      hasKitchenSkillsPostAttempt(attemptKey) ||
      (actorId !== '' && hasKitchenSkillsReviewDispatchMarker(actorId, entry))
    ) {
      gamebusDevLog(
        'kitchen-skills-review.already-dispatched',
        kitchenSkillsReviewDiagnosticPayload('already_dispatched', entry),
      );
      return { ok: false, reason: 'already_dispatched', keepDraft: true };
    }

    if (isGameBusEmbed()) {
      const posted = tryPostKitchenSkillsReview(entry, actorId);
      if (!posted.ok) {
        // Definite pre-dispatch failure: attempt key was not recorded — retry is allowed.
        gamebusDevLog(
          'kitchen-skills-review.commit-failed',
          kitchenSkillsReviewDiagnosticPayload(posted.reason, entry, {
            missing: posted.missing,
          }),
        );
        return {
          ok: false,
          reason: posted.reason,
          keepDraft: true,
          ...(posted.missing?.length ? { missing: posted.missing } : {}),
        };
      }
      markKitchenSkillsReviewDispatched(actorId, entry, persisted.feedFingerprint);
      setLocalReviews((current) => {
        const withoutIdentity = current.filter(
          (item) => reviewIdentityKey(item) !== reviewIdentityKey(entry),
        );
        return [
          ...withoutIdentity,
          { ...entry, source: 'local', awaitingPersist: true },
        ];
      });
      return { ok: true, mode: 'posted_awaiting_persist' };
    }

    // Non-embed: local commit is authoritative (no GameBus round-trip).
    setLocalReviews((current) =>
      hasDuplicateReviewIdentity(current, entry)
        ? current
        : [
            ...current.filter((item) => reviewIdentityKey(item) !== reviewIdentityKey(entry)),
            {
              ...entry,
              source: 'local',
              persistId: `local:${reviewIdentityKey(entry)}`,
            },
          ],
    );
    return { ok: true, mode: 'local' };
  }, [reviews, persisted.feedFingerprint]);

  const canReassessUnconfirmedReview = useCallback(
    (entry: KitchenSkillsReviewEntry, studentActorId: string): boolean => {
      const actorId = studentActorId.trim();
      const existing = findReviewByIdentity(reviews, entry);
      if (!actorId || !existing || isReviewPersistConfirmed(existing)) return false;
      return isAwaitingReviewMissingFromRefreshedFeed(existing, actorId, {
        receivedAtMs: persisted.feedReceivedAt,
        fingerprint: persisted.feedFingerprint,
        sessionInFeed: persisted.groupSessions.some(
          (session) => session.actorId === actorId && session.sessionId === existing.sessionId,
        ),
      });
    },
    [reviews, persisted.feedReceivedAt, persisted.feedFingerprint, persisted.groupSessions],
  );

  const discardUnconfirmedReview = useCallback(
    (entry: KitchenSkillsReviewEntry, studentActorId: string): boolean => {
      if (!canReassessUnconfirmedReview(entry, studentActorId)) return false;
      const existing = findReviewByIdentity(reviews, entry);
      if (!existing) return false;
      const actorId = studentActorId.trim();
      clearKitchenSkillsReviewDispatchMarker(actorId, existing);
      clearKitchenSkillsPostAttempt(kitchenSkillsReviewAttemptKey(existing));
      setLocalReviews((current) =>
        current.filter((item) => reviewIdentityKey(item) !== reviewIdentityKey(existing)),
      );
      setMarkerVersion((version) => version + 1);
      gamebusDevLog(
        'kitchen-skills-review.discarded-unconfirmed',
        kitchenSkillsReviewDiagnosticPayload('missing_after_feed_refresh', existing),
      );
      return true;
    },
    [reviews, canReassessUnconfirmedReview],
  );

  const findTrimByIngredientId = useCallback(
    (ingredientId: string, recipeId?: string | null) => {
      const scope = normalizeRecipeId(recipeId) ?? normalizeRecipeId(activeRecipeId);
      return trimEntries.find(
        (entry) =>
          entry.ingredientId === ingredientId &&
          (scope ? normalizeRecipeId(entry.recipeId) === scope : true),
      );
    },
    [trimEntries, activeRecipeId],
  );
  const findRescueByIngredientId = useCallback(
    (ingredientId: string, recipeId?: string | null) => {
      const scope = normalizeRecipeId(recipeId) ?? normalizeRecipeId(activeRecipeId);
      return rescueEntries.find(
        (entry) =>
          entry.ingredientId === ingredientId &&
          (scope ? normalizeRecipeId(entry.recipeId) === scope : true),
      );
    },
    [rescueEntries, activeRecipeId],
  );
  const findReviewBySessionAndModule = useCallback(
    (sessionId: string, reviewedGame: KitchenSkillsReviewedModule, recipeId?: string | null) => {
      const rid = normalizeRecipeId(recipeId ?? '');
      if (rid) {
        return reviews.find(
          (entry) =>
            entry.sessionId === sessionId &&
            entry.reviewedGame === reviewedGame &&
            normalizeRecipeId(entry.recipeId ?? '') === rid,
        );
      }
      return reviews.find(
        (entry) =>
          entry.sessionId === sessionId &&
          entry.reviewedGame === reviewedGame &&
          !normalizeRecipeId(entry.recipeId ?? ''),
      );
    },
    [reviews],
  );

  const taskProgress = useMemo<KitchenSkillsTaskProgress>(
    () =>
      buildKitchenSkillsTaskProgress({
        portionEntries,
        trimEntries,
        rescueEntries,
        activeRecipeId,
        trimInProgress,
        reuseInProgress,
      }),
    [
      portionEntries,
      trimEntries,
      rescueEntries,
      activeRecipeId,
      trimInProgress,
      reuseInProgress,
    ],
  );
  const requiredSection = requiredKitchenSkillsSection(taskProgress);
  const reviewAllowed = canOpenKitchenSkillsReview(taskProgress);
  const canFinish = canFinishKitchenSkillsChallenge(taskProgress);
  const canStartAnotherRecipe = canStartAnotherKitchenSkillsRecipe(taskProgress);
  const blockedNewRecipeReason = newRecipeBlockedReason(taskProgress);

  const value = useMemo<KitchenSkillsSessionValue>(
    () => ({
      status: session ? 'ready' : 'initializing',
      session,
      trimEntries,
      rescueEntries,
      portionEntries,
      activeRecipeId,
      activePortionEntry,
      reviews,
      groupSessions,
      recordedIngredientIds,
      commitTrimEntry,
      commitRescueEntry,
      commitPortionEntry,
      commitReview,
      canReassessUnconfirmedReview,
      discardUnconfirmedReview,
      findTrimByIngredientId,
      findRescueByIngredientId,
      findReviewBySessionAndModule,
      showFinishSummary: showFinishSummary && canFinish,
      taskProgress,
      requiredSection,
      reviewAllowed,
      canFinish,
      canStartAnotherRecipe,
      newRecipeBlockedReason: blockedNewRecipeReason,
      setTrimInProgress,
      setReuseInProgress,
      enterReuse,
      addAnotherIngredient,
      openFinishSummary,
      startAnotherRecipe,
      resumeSavedRecipe,
    }),
    [
      session,
      trimEntries,
      rescueEntries,
      portionEntries,
      activeRecipeId,
      activePortionEntry,
      reviews,
      groupSessions,
      recordedIngredientIds,
      commitTrimEntry,
      commitRescueEntry,
      commitPortionEntry,
      commitReview,
      canReassessUnconfirmedReview,
      discardUnconfirmedReview,
      findTrimByIngredientId,
      findRescueByIngredientId,
      findReviewBySessionAndModule,
      showFinishSummary,
      canFinish,
      canStartAnotherRecipe,
      blockedNewRecipeReason,
      taskProgress,
      requiredSection,
      reviewAllowed,
      enterReuse,
      addAnotherIngredient,
      openFinishSummary,
      startAnotherRecipe,
      resumeSavedRecipe,
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
