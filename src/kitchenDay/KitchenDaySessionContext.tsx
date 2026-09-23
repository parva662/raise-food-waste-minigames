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
import { getGameBusTask, subscribeGameBusTask } from '../gamebus/bridge';
import { normalizeIngredientId } from '../trimSmart/ingredientId';
import { isIngredientAlreadyRecorded } from './session/ingredientUniqueness';
import { ensureKitchenDayLockedSession } from './session/lock';
import type {
  KitchenDayLockedSession,
  KitchenDayPortionEntry,
  KitchenDayRescueEntry,
  KitchenDayTrimEntry,
} from './types';

interface KitchenDaySessionValue {
  session: KitchenDayLockedSession;
  trimEntries: KitchenDayTrimEntry[];
  rescueEntries: KitchenDayRescueEntry[];
  portionEntries: KitchenDayPortionEntry[];
  recordedIngredientIds: string[];
  addTrimEntry: (entry: KitchenDayTrimEntry) => { ok: true } | { ok: false; reason: string };
  addRescueEntry: (entry: KitchenDayRescueEntry) => { ok: true } | { ok: false; reason: string };
  addPortionEntry: (entry: KitchenDayPortionEntry) => { ok: true } | { ok: false; reason: string };
  findTrimByIngredientId: (ingredientId: string) => KitchenDayTrimEntry | undefined;
  findRescueByIngredientId: (ingredientId: string) => KitchenDayRescueEntry | undefined;
}

const KitchenDaySessionContext = createContext<KitchenDaySessionValue | null>(null);

export function KitchenDaySessionProvider({
  children,
  now,
  initialSession,
}: {
  children: ReactNode;
  now?: Date;
  initialSession?: KitchenDayLockedSession;
}) {
  const [taskId, setTaskId] = useState<string | undefined>(() => getGameBusTask()?.id);
  const [session] = useState<KitchenDayLockedSession>(() =>
    initialSession ??
    ensureKitchenDayLockedSession(null, {
      embedded: isGameBusEmbed(),
      taskId: getGameBusTask()?.id,
      now: now ?? new Date(),
    }),
  );
  const [trimEntries, setTrimEntries] = useState<KitchenDayTrimEntry[]>([]);
  const [rescueEntries, setRescueEntries] = useState<KitchenDayRescueEntry[]>([]);
  const [portionEntries, setPortionEntries] = useState<KitchenDayPortionEntry[]>([]);

  useEffect(() => {
    return subscribeGameBusTask((task) => setTaskId(task?.id));
  }, []);

  void taskId;

  const recordedIngredientIds = useMemo(
    () => trimEntries.map((entry) => entry.ingredientId),
    [trimEntries],
  );

  const addTrimEntry = useCallback((entry: KitchenDayTrimEntry) => {
    if (isIngredientAlreadyRecorded(recordedIngredientIds, entry.ingredientId)) {
      return { ok: false as const, reason: 'duplicate_ingredient' };
    }
    setTrimEntries((current) => {
      if (current.some((item) => item.ingredientId === entry.ingredientId)) {
        return current;
      }
      return [...current, entry];
    });
    return { ok: true as const };
  }, [recordedIngredientIds]);

  const addRescueEntry = useCallback((entry: KitchenDayRescueEntry) => {
    const trim = trimEntries.find((item) => item.ingredientId === entry.ingredientId);
    if (!trim) return { ok: false as const, reason: 'missing_trim' };
    if (rescueEntries.some((item) => item.ingredientId === entry.ingredientId)) {
      return { ok: false as const, reason: 'duplicate_rescue' };
    }
    setRescueEntries((current) => [...current, entry]);
    return { ok: true as const };
  }, [rescueEntries, trimEntries]);

  const addPortionEntry = useCallback((entry: KitchenDayPortionEntry) => {
    setPortionEntries((current) => [...current, entry]);
    return { ok: true as const };
  }, []);

  const findTrimByIngredientId = useCallback(
    (ingredientId: string) => trimEntries.find((entry) => entry.ingredientId === ingredientId),
    [trimEntries],
  );

  const findRescueByIngredientId = useCallback(
    (ingredientId: string) => rescueEntries.find((entry) => entry.ingredientId === ingredientId),
    [rescueEntries],
  );

  const value = useMemo(
    () => ({
      session,
      trimEntries,
      rescueEntries,
      portionEntries,
      recordedIngredientIds,
      addTrimEntry,
      addRescueEntry,
      addPortionEntry,
      findTrimByIngredientId,
      findRescueByIngredientId,
    }),
    [
      session,
      trimEntries,
      rescueEntries,
      portionEntries,
      recordedIngredientIds,
      addTrimEntry,
      addRescueEntry,
      addPortionEntry,
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

export function kitchenDayIngredientIdFromName(name: string): string | null {
  return normalizeIngredientId(name);
}
