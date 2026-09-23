import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { isGameBusEmbed } from '../gamebus/detectEmbed';
import {
  getGameBusInputCollections,
  getGameBusTask,
  startGameBusHandshake,
  subscribeGameBusInputCollections,
  subscribeGameBusTask,
} from '../gamebus/bridge';
import { extractGroupActivities, getRawKitchenGroupActivitiesInput } from '../gamebus/groupActivities';
import { getAuthenticatedGameBusUser } from '../gamebus/inputCollections';
import { normalizeIngredientId } from '../trimSmart/ingredientId';
import { isIngredientAlreadyRecorded } from './session/ingredientUniqueness';
import { ensureKitchenDayLockedSession } from './session/lock';
import {
  buildKitchenDayReadModel,
  mergeKitchenDayRecords,
} from './read/kitchenDayReadModel';
import { tryPostKitchenDayPortion, tryPostKitchenDayRescue, tryPostKitchenDayTrim } from './postKitchenDayActivity';
import type {
  KitchenDayLockedSession,
  KitchenDayPortionEntry,
  KitchenDayRescueEntry,
  KitchenDayTrimEntry,
} from './types';

export type KitchenDayCommitResult =
  | { ok: true; mode: 'local' }
  | { ok: true; mode: 'posted_awaiting_persist' }
  | { ok: false; reason: string; keepDraft: true };

interface KitchenDaySessionValue {
  status: 'initializing' | 'ready';
  session: KitchenDayLockedSession | null;
  trimEntries: KitchenDayTrimEntry[];
  rescueEntries: KitchenDayRescueEntry[];
  portionEntries: KitchenDayPortionEntry[];
  recordedIngredientIds: string[];
  commitTrimEntry: (entry: KitchenDayTrimEntry) => KitchenDayCommitResult;
  commitRescueEntry: (entry: KitchenDayRescueEntry) => KitchenDayCommitResult;
  commitPortionEntry: (entry: KitchenDayPortionEntry) => KitchenDayCommitResult;
  findTrimByIngredientId: (ingredientId: string) => KitchenDayTrimEntry | undefined;
  findRescueByIngredientId: (ingredientId: string) => KitchenDayRescueEntry | undefined;
}

const KitchenDaySessionContext = createContext<KitchenDaySessionValue | null>(null);

function readPersistedForSession(sessionId: string): {
  trimEntries: KitchenDayTrimEntry[];
  rescueEntries: KitchenDayRescueEntry[];
  portionEntries: KitchenDayPortionEntry[];
} {
  const payload = getGameBusInputCollections();
  const actorId = getAuthenticatedGameBusUser(payload)?.id ?? null;
  const activities = extractGroupActivities(getRawKitchenGroupActivitiesInput(payload));
  return buildKitchenDayReadModel(activities, { sessionId, actorId });
}

export function KitchenDaySessionProvider({
  children,
  now,
  initialSession,
}: {
  children: ReactNode;
  now?: Date;
  initialSession?: KitchenDayLockedSession;
}) {
  const embedded = isGameBusEmbed();
  const [session, setSession] = useState<KitchenDayLockedSession | null>(() => {
    if (initialSession) return initialSession;
    if (embedded) return null;
    return ensureKitchenDayLockedSession(null, {
      embedded: false,
      taskId: undefined,
      now: now ?? new Date(),
    });
  });
  const [localTrim, setLocalTrim] = useState<KitchenDayTrimEntry[]>([]);
  const [localRescue, setLocalRescue] = useState<KitchenDayRescueEntry[]>([]);
  const [localPortion, setLocalPortion] = useState<KitchenDayPortionEntry[]>([]);
  const [persisted, setPersisted] = useState(() =>
    session ? readPersistedForSession(session.sessionId) : {
      trimEntries: [] as KitchenDayTrimEntry[],
      rescueEntries: [] as KitchenDayRescueEntry[],
      portionEntries: [] as KitchenDayPortionEntry[],
    },
  );

  useEffect(() => {
    if (!embedded) return;
    const stopHandshake = startGameBusHandshake();
    const unsubscribe = subscribeGameBusTask((task) => {
      setSession((current) => {
        if (current) return current;
        if (!task?.id) return null;
        return ensureKitchenDayLockedSession(null, {
          embedded: true,
          taskId: task.id,
          now: now ?? new Date(),
        });
      });
    });
    const existing = getGameBusTask();
    if (existing?.id) {
      setSession((current) =>
        current ??
        ensureKitchenDayLockedSession(null, {
          embedded: true,
          taskId: existing.id,
          now: now ?? new Date(),
        }),
      );
    }
    return () => {
      unsubscribe();
      stopHandshake();
    };
  }, [embedded, now]);

  useEffect(() => {
    if (!session) return;
    const sync = () => setPersisted(readPersistedForSession(session.sessionId));
    sync();
    return subscribeGameBusInputCollections(sync);
  }, [session]);

  const trimEntries = useMemo(
    () =>
      mergeKitchenDayRecords(localTrim, persisted.trimEntries, (left, right) =>
        left.ingredientId === right.ingredientId,
      ),
    [localTrim, persisted.trimEntries],
  );
  const rescueEntries = useMemo(
    () =>
      mergeKitchenDayRecords(localRescue, persisted.rescueEntries, (left, right) =>
        left.ingredientId === right.ingredientId,
      ),
    [localRescue, persisted.rescueEntries],
  );
  const portionEntries = useMemo(
    () =>
      mergeKitchenDayRecords(
        localPortion,
        persisted.portionEntries,
        (left, right) =>
          left.recipeId === right.recipeId && left.submittedAt === right.submittedAt,
      ),
    [localPortion, persisted.portionEntries],
  );

  const recordedIngredientIds = useMemo(
    () => trimEntries.map((entry) => entry.ingredientId),
    [trimEntries],
  );

  const commitTrimEntry = useCallback((entry: KitchenDayTrimEntry): KitchenDayCommitResult => {
    if (isIngredientAlreadyRecorded(recordedIngredientIds, entry.ingredientId)) {
      return { ok: false, reason: 'duplicate_ingredient', keepDraft: true };
    }
    if (isGameBusEmbed()) {
      const posted = tryPostKitchenDayTrim(entry);
      if (!posted.ok) {
        return { ok: false, reason: posted.reason, keepDraft: true };
      }
      return { ok: true, mode: 'posted_awaiting_persist' };
    }
    setLocalTrim((current) =>
      current.some((item) => item.ingredientId === entry.ingredientId)
        ? current
        : [...current, { ...entry, source: 'local' }],
    );
    return { ok: true, mode: 'local' };
  }, [recordedIngredientIds]);

  const commitRescueEntry = useCallback((entry: KitchenDayRescueEntry): KitchenDayCommitResult => {
    if (!trimEntries.some((item) => item.ingredientId === entry.ingredientId)) {
      return { ok: false, reason: 'missing_trim', keepDraft: true };
    }
    if (rescueEntries.some((item) => item.ingredientId === entry.ingredientId)) {
      return { ok: false, reason: 'duplicate_rescue', keepDraft: true };
    }
    if (isGameBusEmbed()) {
      const posted = tryPostKitchenDayRescue(entry);
      if (!posted.ok) {
        return { ok: false, reason: posted.reason, keepDraft: true };
      }
      return { ok: true, mode: 'posted_awaiting_persist' };
    }
    setLocalRescue((current) => [...current, { ...entry, source: 'local' }]);
    return { ok: true, mode: 'local' };
  }, [rescueEntries, trimEntries]);

  const commitPortionEntry = useCallback((entry: KitchenDayPortionEntry): KitchenDayCommitResult => {
    if (isGameBusEmbed()) {
      const posted = tryPostKitchenDayPortion(entry);
      if (!posted.ok) {
        return { ok: false, reason: posted.reason, keepDraft: true };
      }
      return { ok: true, mode: 'posted_awaiting_persist' };
    }
    setLocalPortion((current) => [...current, { ...entry, source: 'local' }]);
    return { ok: true, mode: 'local' };
  }, []);

  const findTrimByIngredientId = useCallback(
    (ingredientId: string) => trimEntries.find((entry) => entry.ingredientId === ingredientId),
    [trimEntries],
  );
  const findRescueByIngredientId = useCallback(
    (ingredientId: string) => rescueEntries.find((entry) => entry.ingredientId === ingredientId),
    [rescueEntries],
  );

  const value = useMemo<KitchenDaySessionValue>(
    () => ({
      status: session ? 'ready' : 'initializing',
      session,
      trimEntries,
      rescueEntries,
      portionEntries,
      recordedIngredientIds,
      commitTrimEntry,
      commitRescueEntry,
      commitPortionEntry,
      findTrimByIngredientId,
      findRescueByIngredientId,
    }),
    [
      session,
      trimEntries,
      rescueEntries,
      portionEntries,
      recordedIngredientIds,
      commitTrimEntry,
      commitRescueEntry,
      commitPortionEntry,
      findTrimByIngredientId,
      findRescueByIngredientId,
    ],
  );

  return (
    <KitchenDaySessionContext.Provider value={value}>{children}</KitchenDaySessionContext.Provider>
  );
}

export function useKitchenDaySession(): KitchenDaySessionValue {
  const value = useContext(KitchenDaySessionContext);
  if (!value) {
    throw new Error('useKitchenDaySession must be used within KitchenDaySessionProvider');
  }
  return value;
}

export function useReadyKitchenDaySession(): KitchenDaySessionValue & {
  session: KitchenDayLockedSession;
} {
  const value = useKitchenDaySession();
  if (!value.session) {
    throw new Error('Kitchen Day session is not ready');
  }
  return { ...value, session: value.session };
}

export function kitchenDayIngredientIdFromName(name: string): string | null {
  return normalizeIngredientId(name);
}
