import type {
  KitchenSkillsPortionEntry,
  KitchenSkillsRescueEntry,
  KitchenSkillsTrimEntry,
} from '@/products/kitchen-skills-challenge/domain/types';

/**
 * Browser-side record of the current challenge attempt for one GameBus task + participant.
 *
 * It keeps the attempt identity stable across reloads and remembers which saves this browser
 * already dispatched, so they are never posted twice. It is NOT proof that GameBus persisted
 * anything: entries recovered from it stay unconfirmed until they appear in the GameBus feed.
 */
export interface KitchenSkillsAttemptRecord {
  version: 1;
  attemptId: string;
  sessionId: string;
  sessionDate: string;
  startedAt: string;
  portion: KitchenSkillsPortionEntry | null;
  trim: KitchenSkillsTrimEntry[];
  rescue: KitchenSkillsRescueEntry[];
}

export type KitchenSkillsAttemptGuard =
  | { status: 'open'; record: KitchenSkillsAttemptRecord }
  | { status: 'closed' }
  | { status: 'unavailable' };

const STORAGE_PREFIX = 'ks-attempt:v1:';
const ATTEMPT_ID_PATTERN = /^[a-z0-9]{6,32}$/;

export function kitchenSkillsAttemptStorageKey(taskId: string, actorId: string): string {
  return `${STORAGE_PREFIX}${taskId.trim()}:${actorId.trim()}`;
}

export function isKitchenSkillsAttemptStorageKey(key: string | null): boolean {
  return Boolean(key?.startsWith(STORAGE_PREFIX));
}

export function createKitchenSkillsAttemptId(random: () => number = Math.random): string {
  const time = Date.now().toString(36);
  const suffix = Array.from({ length: 6 }, () => Math.floor(random() * 36).toString(36)).join('');
  return `${time}${suffix}`;
}

export function isKitchenSkillsAttemptId(value: unknown): value is string {
  return typeof value === 'string' && ATTEMPT_ID_PATTERN.test(value);
}

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is KitchenSkillsAttemptRecord {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<KitchenSkillsAttemptRecord>;
  return (
    candidate.version === 1 &&
    isKitchenSkillsAttemptId(candidate.attemptId) &&
    typeof candidate.sessionId === 'string' &&
    typeof candidate.sessionDate === 'string' &&
    typeof candidate.startedAt === 'string' &&
    Array.isArray(candidate.trim) &&
    Array.isArray(candidate.rescue) &&
    (candidate.portion === null || typeof candidate.portion === 'object')
  );
}

export function readKitchenSkillsAttempt(key: string): KitchenSkillsAttemptRecord | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeKitchenSkillsAttempt(key: string, record: KitchenSkillsAttemptRecord): boolean {
  const store = storage();
  if (!store) return false;
  try {
    store.setItem(key, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

/** Clears the stored attempt only when it still belongs to `attemptId`. */
export function clearKitchenSkillsAttempt(key: string, attemptId: string): void {
  const store = storage();
  if (!store) return;
  try {
    const current = readKitchenSkillsAttempt(key);
    if (current && current.attemptId !== attemptId) return;
    store.removeItem(key);
  } catch {
    // Storage failures leave the record; the next open resumes it rather than losing work.
  }
}

export function hasDispatchedKitchenSkillsWork(record: KitchenSkillsAttemptRecord): boolean {
  return record.portion !== null || record.trim.length > 0 || record.rescue.length > 0;
}

export function resetKitchenSkillsAttemptStorageForTests(): void {
  const store = storage();
  if (!store) return;
  const keys: string[] = [];
  for (let index = 0; index < store.length; index += 1) {
    const key = store.key(index);
    if (key?.startsWith(STORAGE_PREFIX)) keys.push(key);
  }
  for (const key of keys) store.removeItem(key);
}

export function isKitchenSkillsAttemptStorageAvailable(): boolean {
  const store = storage();
  if (!store) return false;
  try {
    const probe = `${STORAGE_PREFIX}probe`;
    store.setItem(probe, '1');
    store.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resume the stored unfinished attempt, or start a new one.
 *
 * A stored attempt from an earlier Helsinki date is resumed only when this browser already
 * dispatched work for it (so its saves keep one identity); an empty stale attempt is replaced.
 */
export function resolveKitchenSkillsAttempt(options: {
  key: string;
  today: string;
  now: Date;
  buildSessionId: (attemptId: string, sessionDate: string) => string;
  createAttemptId?: () => string;
}): { record: KitchenSkillsAttemptRecord; resumed: boolean; persisted: boolean } {
  const existing = readKitchenSkillsAttempt(options.key);
  if (
    existing &&
    existing.sessionId === options.buildSessionId(existing.attemptId, existing.sessionDate) &&
    (existing.sessionDate === options.today || hasDispatchedKitchenSkillsWork(existing))
  ) {
    return { record: existing, resumed: true, persisted: true };
  }
  const attemptId = (options.createAttemptId ?? createKitchenSkillsAttemptId)();
  const record: KitchenSkillsAttemptRecord = {
    version: 1,
    attemptId,
    sessionId: options.buildSessionId(attemptId, options.today),
    sessionDate: options.today,
    startedAt: options.now.toISOString(),
    portion: null,
    trim: [],
    rescue: [],
  };
  const persisted = writeKitchenSkillsAttempt(options.key, record);
  return { record, resumed: false, persisted };
}

/** Re-reads storage so another window's Finish or saves are respected before posting. */
export function guardKitchenSkillsAttempt(key: string, attemptId: string): KitchenSkillsAttemptGuard {
  if (!isKitchenSkillsAttemptStorageAvailable()) return { status: 'unavailable' };
  const record = readKitchenSkillsAttempt(key);
  if (!record || record.attemptId !== attemptId) return { status: 'closed' };
  return { status: 'open', record };
}

export function recordDispatchedKitchenSkillsEntry(
  key: string,
  attemptId: string,
  entry:
    | { module: 'portion'; value: KitchenSkillsPortionEntry }
    | { module: 'trim'; value: KitchenSkillsTrimEntry }
    | { module: 'rescue'; value: KitchenSkillsRescueEntry },
): boolean {
  const record = readKitchenSkillsAttempt(key);
  if (!record || record.attemptId !== attemptId) return false;
  const value = { ...entry.value, source: 'local' as const };
  const next: KitchenSkillsAttemptRecord =
    entry.module === 'portion'
      ? { ...record, portion: value as KitchenSkillsPortionEntry }
      : entry.module === 'trim'
        ? { ...record, trim: [...record.trim, value as KitchenSkillsTrimEntry] }
        : { ...record, rescue: [...record.rescue, value as KitchenSkillsRescueEntry] };
  return writeKitchenSkillsAttempt(key, next);
}
