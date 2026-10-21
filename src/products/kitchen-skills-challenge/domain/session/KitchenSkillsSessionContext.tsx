import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  isRescueAlreadyRecorded,
  isTrimAlreadyRecorded,
  normalizeRecipeId,
} from '@/products/kitchen-skills-challenge/domain/session/ingredientUniqueness';
import { ensureKitchenSkillsLockedSession } from '@/products/kitchen-skills-challenge/domain/session/lock';
import {
  buildKitchenSkillsSessionId,
  getKitchenSkillsSessionDate,
} from '@/products/kitchen-skills-challenge/domain/session/identity';
import {
  archiveFinishedKitchenSkillsAttempt,
  createKitchenSkillsAttemptId,
  guardKitchenSkillsAttempt,
  kitchenSkillsAttemptStorageKey,
  readKitchenSkillsAttempt,
  recordDispatchedKitchenSkillsEntry,
  resolveKitchenSkillsAttempt,
  type KitchenSkillsAttemptRecord,
} from '@/products/kitchen-skills-challenge/domain/session/attempt';
import { postKitchenSkillsChallengeExit } from '@/products/kitchen-skills-challenge/gamebus/postExit';
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
import { portionSubmissionInstantMs } from '@/products/kitchen-skills-challenge/domain/session/sessionRecipe';

export type KitchenSkillsCommitResult =
  | { ok: true; mode: 'local' }
  | { ok: true; mode: 'posted_awaiting_persist' }
  | { ok: false; reason: string; keepDraft: true; missing?: string[] };

interface KitchenSkillsSessionValue {
  status: 'initializing' | 'ready';
  session: KitchenSkillsLockedSession | null;
  /** Records of this attempt's recipe only. */
  trimEntries: KitchenSkillsTrimEntry[];
  rescueEntries: KitchenSkillsRescueEntry[];
  portionEntries: KitchenSkillsPortionEntry[];
  /** The attempt's single recipe (first saved Portion). */
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
  /** Finish was pressed: EXIT was sent and this attempt is closed. */
  finished: boolean;
  /** Another window finished or replaced this attempt; saving is blocked here. */
  closedElsewhere: boolean;
  /** Saves of this attempt sent to GameBus but not yet seen in its feed. */
  unconfirmedSaveCount: number;
  /** The attempt was reopened from this browser (reload or reopen before Finish). */
  resumed: boolean;
  setTrimInProgress: (value: boolean) => void;
  setReuseInProgress: (value: boolean) => void;
  enterReuse: () => void;
  addAnotherIngredient: () => void;
  openFinishSummary: () => void;
  closeFinishSummary: () => void;
  /** Ends the attempt: clears the browser attempt record and sends EXIT once. */
  finishChallenge: () => void;
}

type KitchenSkillsAttemptState = {
  session: KitchenSkillsLockedSession;
  /** localStorage key of the attempt record; null when not tracked (trainer, tests, no storage). */
  storageKey: string | null;
  recovered: KitchenSkillsAttemptRecord | null;
};

function earliestPortionEntry(
  entries: readonly KitchenSkillsPortionEntry[],
): KitchenSkillsPortionEntry | null {
  let earliest: KitchenSkillsPortionEntry | null = null;
  for (const entry of entries) {
    if (!earliest || portionSubmissionInstantMs(entry) < portionSubmissionInstantMs(earliest)) {
      earliest = entry;
    }
  }
  return earliest;
}

function sameRecipe(left: { recipeId?: string }, right: { recipeId?: string }): boolean {
  return normalizeRecipeId(left.recipeId) === normalizeRecipeId(right.recipeId);
}

function entriesForAttemptRecipe<T extends { recipeId?: string }>(
  entries: readonly T[],
  recipeId: string | null,
  portionCount: number,
): T[] {
  if (!recipeId) return [...entries];
  const attributed = entries.filter((entry) => normalizeRecipeId(entry.recipeId) === recipeId);
  const unattributed = entries.filter((entry) => !normalizeRecipeId(entry.recipeId));
  // Historical rows without recipeId attach only when this attempt has a single recipe.
  return portionCount <= 1 ? [...attributed, ...unattributed] : attributed;
}

function addMissing<T extends { recipeId?: string; ingredientId?: string }>(
  current: readonly T[],
  incoming: readonly T[],
): T[] {
  const next = [...current];
  for (const item of incoming) {
    if (!next.some((existing) => sameRecipe(existing, item) && existing.ingredientId === item.ingredientId)) {
      next.push(item);
    }
  }
  return next;
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
  trackAttempt = false,
}: {
  children: ReactNode;
  now?: Date;
  initialSession?: KitchenSkillsLockedSession;
  /**
   * Student challenge only: keep the attempt identity and dispatched saves in localStorage so a
   * reload resumes the same attempt instead of starting a new one.
   */
  trackAttempt?: boolean;
}) {
  const embedded = isGameBusEmbed();
  const tryLockEmbeddedAttempt = useCallback((): KitchenSkillsAttemptState | null => {
    const task = getGameBusTask();
    const actorId = getAuthenticatedGameBusUser(getGameBusInputCollections())?.id;
    if (!task?.id || !actorId) return null;
    const at = now ?? new Date();
    if (trackAttempt) {
      const key = kitchenSkillsAttemptStorageKey(task.id, actorId);
      const resolved = resolveKitchenSkillsAttempt({
        key,
        today: getKitchenSkillsSessionDate(at),
        now: at,
        buildSessionId: (attemptId, sessionDate) =>
          buildKitchenSkillsSessionId({
            embedded: true,
            taskId: task.id,
            actorId,
            sessionDate,
            attemptId,
          }),
      });
      return {
        session: {
          sessionId: resolved.record.sessionId,
          sessionDate: resolved.record.sessionDate,
          attemptId: resolved.record.attemptId,
        },
        storageKey: resolved.persisted ? key : null,
        recovered: resolved.resumed ? resolved.record : null,
      };
    }
    return {
      session: ensureKitchenSkillsLockedSession(null, {
        embedded: true,
        taskId: task.id,
        actorId,
        attemptId: createKitchenSkillsAttemptId(),
        now: at,
      }),
      storageKey: null,
      recovered: null,
    };
  }, [now, trackAttempt]);

  const [attempt, setAttempt] = useState<KitchenSkillsAttemptState | null>(() => {
    if (initialSession) return { session: initialSession, storageKey: null, recovered: null };
    if (embedded) return tryLockEmbeddedAttempt();
    const at = now ?? new Date();
    if (trackAttempt) {
      const key = kitchenSkillsAttemptStorageKey('standalone', 'local');
      const resolved = resolveKitchenSkillsAttempt({
        key,
        today: getKitchenSkillsSessionDate(at),
        now: at,
        buildSessionId: (attemptId, sessionDate) =>
          buildKitchenSkillsSessionId({
            embedded: false,
            taskId: undefined,
            sessionDate,
            attemptId,
          }),
      });
      return {
        session: {
          sessionId: resolved.record.sessionId,
          sessionDate: resolved.record.sessionDate,
          attemptId: resolved.record.attemptId,
        },
        storageKey: resolved.persisted ? key : null,
        recovered: resolved.resumed ? resolved.record : null,
      };
    }
    return {
      session: ensureKitchenSkillsLockedSession(null, {
        embedded: false,
        taskId: undefined,
        attemptId: createKitchenSkillsAttemptId(),
        now: at,
      }),
      storageKey: null,
      recovered: null,
    };
  });
  const attemptRef = useRef(attempt);
  useEffect(() => {
    attemptRef.current = attempt;
  });
  const session = attempt?.session ?? null;
  const [localTrim, setLocalTrim] = useState<KitchenSkillsTrimEntry[]>(
    () => attempt?.recovered?.trim ?? [],
  );
  const [localRescue, setLocalRescue] = useState<KitchenSkillsRescueEntry[]>(
    () => attempt?.recovered?.rescue ?? [],
  );
  const [localPortion, setLocalPortion] = useState<KitchenSkillsPortionEntry[]>(() =>
    attempt?.recovered?.portion ? [attempt.recovered.portion] : [],
  );
  const [localReviews, setLocalReviews] = useState<KitchenSkillsReviewEntry[]>([]);
  const [showFinishSummary, setShowFinishSummary] = useState(false);
  const [finished, setFinished] = useState(false);
  const [closedElsewhere, setClosedElsewhere] = useState(false);
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
    // A replayed TASK / INPUT_COLLECTIONS never replaces the locked attempt.
    const lockOnce = () => {
      if (attemptRef.current) return;
      const next = tryLockEmbeddedAttempt();
      if (!next) return;
      attemptRef.current = next;
      setAttempt(next);
      if (next.recovered) {
        const recovered = next.recovered;
        setLocalPortion(recovered.portion ? [recovered.portion] : []);
        setLocalTrim(recovered.trim);
        setLocalRescue(recovered.rescue);
      }
    };
    const unsubscribeTask = subscribeGameBusTask(() => lockOnce());
    const unsubscribeInputs = subscribeGameBusInputCollections(lockOnce);
    lockOnce();
    return () => {
      unsubscribeTask();
      unsubscribeInputs();
      stopHandshake();
    };
  }, [embedded, tryLockEmbeddedAttempt]);

  // Another window of the same task + participant saved, finished, or replaced this attempt.
  useEffect(() => {
    const storageKey = attempt?.storageKey;
    const attemptId = attempt?.session.attemptId;
    if (!storageKey || !attemptId) return;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      const record = readKitchenSkillsAttempt(storageKey);
      if (!record || record.attemptId !== attemptId) {
        setClosedElsewhere(true);
        return;
      }
      if (record.portion) {
        const portion = record.portion;
        setLocalPortion((current) =>
          current.some((item) => sameRecipe(item, portion)) ? current : [...current, portion],
        );
      }
      setLocalTrim((current) => addMissing(current, record.trim));
      setLocalRescue((current) => addMissing(current, record.rescue));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [attempt]);

  useEffect(() => {
    if (!session) return;
    const sync = () => {
      setPersisted(readPersistedForSession(session.sessionId));
    };
    sync();
    return subscribeGameBusInputCollections(sync);
  }, [session]);

  const allTrimEntries = useMemo(
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
  const allRescueEntries = useMemo(
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
  const allPortionEntries = useMemo(
    () =>
      mergeKitchenSkillsRecords(
        localPortion,
        persisted.portionEntries,
        (left, right) => normalizeRecipeId(left.recipeId) === normalizeRecipeId(right.recipeId),
      ),
    [localPortion, persisted.portionEntries],
  );
  const activePortionEntry = useMemo(
    () => earliestPortionEntry(allPortionEntries),
    [allPortionEntries],
  );
  const activeRecipeId = normalizeRecipeId(activePortionEntry?.recipeId) ?? null;
  const portionEntries = useMemo(
    () => (activePortionEntry ? [activePortionEntry] : []),
    [activePortionEntry],
  );
  const trimEntries = useMemo(
    () => entriesForAttemptRecipe(allTrimEntries, activeRecipeId, allPortionEntries.length),
    [allTrimEntries, activeRecipeId, allPortionEntries.length],
  );
  const rescueEntries = useMemo(
    () => entriesForAttemptRecipe(allRescueEntries, activeRecipeId, allPortionEntries.length),
    [allRescueEntries, activeRecipeId, allPortionEntries.length],
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

  const recordedIngredientIds = useMemo(
    () => trimEntries.map((entry) => entry.ingredientId),
    [trimEntries],
  );

  /**
   * Re-check the shared attempt record right before posting, so a second window cannot post a
   * second Portion or repeat a Trim/Rescue save, and a finished attempt cannot receive more saves.
   */
  const checkAttemptBeforePost = useCallback(():
    | { ok: true; record: KitchenSkillsAttemptRecord | null }
    | { ok: false; reason: string } => {
    if (finished) return { ok: false, reason: 'attempt_closed' };
    const current = attemptRef.current;
    const storageKey = current?.storageKey;
    const attemptId = current?.session.attemptId;
    if (!storageKey || !attemptId) return { ok: true, record: null };
    const guard = guardKitchenSkillsAttempt(storageKey, attemptId);
    if (guard.status === 'closed') {
      setClosedElsewhere(true);
      return { ok: false, reason: 'attempt_closed' };
    }
    return { ok: true, record: guard.status === 'open' ? guard.record : null };
  }, [finished]);

  const rememberDispatched = useCallback(
    (
      entry:
        | { module: 'portion'; value: KitchenSkillsPortionEntry }
        | { module: 'trim'; value: KitchenSkillsTrimEntry }
        | { module: 'rescue'; value: KitchenSkillsRescueEntry },
    ) => {
      const current = attemptRef.current;
      if (!current?.storageKey || !current.session.attemptId) return;
      recordDispatchedKitchenSkillsEntry(current.storageKey, current.session.attemptId, entry);
    },
    [],
  );

  const commitTrimEntry = useCallback((entry: KitchenSkillsTrimEntry): KitchenSkillsCommitResult => {
    const recipeId = normalizeRecipeId(entry.recipeId);
    if (!recipeId) {
      return { ok: false, reason: 'missing_recipe', keepDraft: true };
    }
    if (activeRecipeId && recipeId !== activeRecipeId) {
      return { ok: false, reason: 'recipe_not_in_attempt', keepDraft: true };
    }
    if (isTrimAlreadyRecorded(trimEntries, recipeId, entry.ingredientId)) {
      return { ok: false, reason: 'duplicate_ingredient', keepDraft: true };
    }
    const guard = checkAttemptBeforePost();
    if (!guard.ok) return { ok: false, reason: guard.reason, keepDraft: true };
    if (guard.record && isTrimAlreadyRecorded(guard.record.trim, recipeId, entry.ingredientId)) {
      setLocalTrim((current) => addMissing(current, guard.record?.trim ?? []));
      return { ok: false, reason: 'duplicate_ingredient', keepDraft: true };
    }
    const normalized: KitchenSkillsTrimEntry = { ...entry, recipeId, source: 'local' };
    if (isGameBusEmbed()) {
      const posted = tryPostKitchenSkillsTrim(normalized);
      if (!posted.ok) {
        return { ok: false, reason: posted.reason, keepDraft: true };
      }
      rememberDispatched({ module: 'trim', value: normalized });
      setLocalTrim((current) =>
        isTrimAlreadyRecorded(current, recipeId, entry.ingredientId) ? current : [...current, normalized],
      );
      return { ok: true, mode: 'posted_awaiting_persist' };
    }
    rememberDispatched({ module: 'trim', value: normalized });
    setLocalTrim((current) =>
      isTrimAlreadyRecorded(current, recipeId, entry.ingredientId) ? current : [...current, normalized],
    );
    return { ok: true, mode: 'local' };
  }, [trimEntries, activeRecipeId, checkAttemptBeforePost, rememberDispatched]);

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
    const guard = checkAttemptBeforePost();
    if (!guard.ok) return { ok: false, reason: guard.reason, keepDraft: true };
    if (guard.record && isRescueAlreadyRecorded(guard.record.rescue, recipeId, entry.ingredientId)) {
      setLocalRescue((current) => addMissing(current, guard.record?.rescue ?? []));
      return { ok: false, reason: 'duplicate_rescue', keepDraft: true };
    }
    const normalized: KitchenSkillsRescueEntry = { ...entry, recipeId, source: 'local' };
    if (isGameBusEmbed()) {
      const posted = tryPostKitchenSkillsRescue(normalized);
      if (!posted.ok) {
        return { ok: false, reason: posted.reason, keepDraft: true };
      }
      rememberDispatched({ module: 'rescue', value: normalized });
      setLocalRescue((current) => [...current, normalized]);
      return { ok: true, mode: 'posted_awaiting_persist' };
    }
    rememberDispatched({ module: 'rescue', value: normalized });
    setLocalRescue((current) => [...current, normalized]);
    return { ok: true, mode: 'local' };
  }, [rescueEntries, trimEntries, checkAttemptBeforePost, rememberDispatched]);

  const commitPortionEntry = useCallback(
    (entry: KitchenSkillsPortionEntry): KitchenSkillsCommitResult => {
      const recipeId = normalizeRecipeId(entry.recipeId);
      if (!recipeId) {
        return { ok: false, reason: 'missing_recipe', keepDraft: true };
      }
      if (allPortionEntries.length > 0) {
        return { ok: false, reason: 'portion_already_saved', keepDraft: true };
      }
      const guard = checkAttemptBeforePost();
      if (!guard.ok) return { ok: false, reason: guard.reason, keepDraft: true };
      if (guard.record?.portion) {
        const saved = guard.record.portion;
        setLocalPortion((current) => (current.length > 0 ? current : [saved]));
        return { ok: false, reason: 'portion_already_saved', keepDraft: true };
      }
      const normalized: KitchenSkillsPortionEntry = { ...entry, recipeId, source: 'local' };
      if (isGameBusEmbed()) {
        const posted = tryPostKitchenSkillsPortion(normalized);
        if (!posted.ok) {
          return { ok: false, reason: posted.reason, keepDraft: true };
        }
        rememberDispatched({ module: 'portion', value: normalized });
        setLocalPortion((current) => [...current, normalized]);
        setShowFinishSummary(false);
        return { ok: true, mode: 'posted_awaiting_persist' };
      }
      rememberDispatched({ module: 'portion', value: normalized });
      setLocalPortion((current) => [...current, normalized]);
      setShowFinishSummary(false);
      return { ok: true, mode: 'local' };
    },
    [allPortionEntries, checkAttemptBeforePost, rememberDispatched],
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

  const closeFinishSummary = useCallback(() => {
    setShowFinishSummary(false);
  }, []);

  const finishChallenge = useCallback(() => {
    if (finished || allPortionEntries.length === 0) return;
    const remainingRescue = trimEntries.filter(
      (entry) =>
        entry.actualWasteGrams > 0 &&
        !rescueEntries.some((rescue) => rescue.ingredientId === entry.ingredientId),
    );
    if (remainingRescue.length > 0) return;
    const current = attemptRef.current;
    if (current?.storageKey && current.session.attemptId) {
      archiveFinishedKitchenSkillsAttempt(current.storageKey, current.session.attemptId);
    }
    setFinished(true);
    setShowFinishSummary(false);
    postKitchenSkillsChallengeExit();
  }, [finished, allPortionEntries.length, trimEntries, rescueEntries]);

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
        trimInProgress,
        reuseInProgress,
      }),
    [portionEntries, trimEntries, rescueEntries, trimInProgress, reuseInProgress],
  );
  const requiredSection = requiredKitchenSkillsSection(taskProgress);
  const reviewAllowed = canOpenKitchenSkillsReview(taskProgress);
  const canFinish = canFinishKitchenSkillsChallenge(taskProgress) && !finished;
  const unconfirmedSaveCount = embedded
    ? [...portionEntries, ...trimEntries, ...rescueEntries].filter((entry) => entry.source === 'local')
        .length
    : 0;
  const resumed = Boolean(attempt?.recovered);

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
      finished,
      closedElsewhere,
      unconfirmedSaveCount,
      resumed,
      setTrimInProgress,
      setReuseInProgress,
      enterReuse,
      addAnotherIngredient,
      openFinishSummary,
      closeFinishSummary,
      finishChallenge,
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
      finished,
      closedElsewhere,
      unconfirmedSaveCount,
      resumed,
      taskProgress,
      requiredSection,
      reviewAllowed,
      enterReuse,
      addAnotherIngredient,
      openFinishSummary,
      closeFinishSummary,
      finishChallenge,
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
