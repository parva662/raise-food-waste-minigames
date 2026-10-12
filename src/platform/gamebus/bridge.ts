import { getGameBusEmbedKind, requiresGameBusTaskHandshake } from '@/app/routes';
import { peekExpectedActivityRef } from '@/platform/gamebus/expectedActivityRef';
import { isGameBusEmbed } from '@/platform/gamebus/detectEmbed';
import { gamebusDevLog } from '@/platform/gamebus/devLog';
import { summarizeKitchenSkillsTrainerInput } from '@/platform/gamebus/groupActivities';
import {
  getInputCollectionKeys,
  getRawKitchenGroupActivitiesInput,
  getRawKitchenSkillsTrainerActivitiesInput,
} from '@/platform/gamebus/inputCollections';
import { logTaskStructureSanitized } from '@/platform/gamebus/logTaskStructure';
import { selectActivityTemplate } from '@/platform/gamebus/selectActivityTemplate';
import type {
  ActivityMessage,
  GameBusInputCollectionsPayload,
  InputCollectionsMessage,
  MenuItemMessage,
  TaskData,
  TaskMessage,
} from '@/platform/gamebus/types';

const HANDSHAKE_RETRY_MS = 875;

type TaskListener = (task: TaskData | null) => void;
type InputCollectionsListener = (data: GameBusInputCollectionsPayload | null) => void;

let taskData: TaskData | null = null;
let inputCollectionsData: GameBusInputCollectionsPayload | null = null;
let menuItemData: Record<string, unknown> | null = null;
/** Custom Page init complete (MENU_ITEM and/or INPUT_COLLECTIONS). Survives subscriber cleanup. */
let pageHandshakeComplete = false;
let hasPostedActivity = false;
const postedKeys = new Set<string>();
let submissionInFlight = false;
let keyedSubmissionInFlight = false;
let taskListener: TaskListener | null = null;
let inputCollectionsListener: InputCollectionsListener | null = null;
let messageHandlerAttached = false;
let hashChangeListenerAttached = false;
let activeHandshakeSubscribers = 0;
let handshakeRetryTimer: ReturnType<typeof setInterval> | null = null;
let iframeReadyAttempt = 0;

function isTaskMessage(data: unknown): data is TaskMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as TaskMessage).type === 'TASK' &&
    typeof (data as TaskMessage).data === 'object'
  );
}

function isInputCollectionsMessage(data: unknown): data is InputCollectionsMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as InputCollectionsMessage).type === 'INPUT_COLLECTIONS'
  );
}

function isMenuItemMessage(data: unknown): data is MenuItemMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as MenuItemMessage).type === 'MENU_ITEM'
  );
}

function messageType(data: unknown): string | undefined {
  if (typeof data === 'object' && data !== null && 'type' in data) {
    const t = (data as { type: unknown }).type;
    return typeof t === 'string' ? t : undefined;
  }
  return undefined;
}

function isTaskHandshakeComplete(): boolean {
  return taskData !== null;
}

function isCurrentHandshakeComplete(): boolean {
  return requiresGameBusTaskHandshake()
    ? isTaskHandshakeComplete()
    : pageHandshakeComplete;
}

function completePageHandshake(reason: string): void {
  if (pageHandshakeComplete) return;
  pageHandshakeComplete = true;
  stopHandshakeRetry();
  gamebusDevLog('custom page handshake complete', {
    reason,
    attempts: iframeReadyAttempt,
  });
}

function stopHandshakeRetry(): void {
  if (handshakeRetryTimer !== null) {
    clearInterval(handshakeRetryTimer);
    handshakeRetryTimer = null;
    gamebusDevLog('handshake retry stopped');
  }
}

function sendIframeReadyAttempt(): void {
  iframeReadyAttempt += 1;
  const message = { type: 'IFRAME_READY' as const };
  window.parent.postMessage(message, '*');
  gamebusDevLog('IFRAME_READY attempt', { attempt: iframeReadyAttempt });
}

function acceptTaskFromParent(data: TaskData): void {
  taskData = data;
  logTaskStructureSanitized(taskData);

  try {
    const expectedRef = peekExpectedActivityRef();
    if (expectedRef) {
      const selected = selectActivityTemplate(taskData, expectedRef);
      gamebusDevLog('TASK received', {
        taskId: taskData.id,
        activityTemplate: selected.reference,
        propertyTemplateCount: taskData.propertyTemplates?.length ?? 0,
      });
      gamebusDevLog('selected activity template', {
        reference: selected.reference,
        name: selected.name,
      });
    } else {
      gamebusDevLog('TASK received', {
        taskId: taskData.id,
        propertyTemplateCount: taskData.propertyTemplates?.length ?? 0,
      });
    }
  } catch (error) {
    gamebusDevLog('TASK received', {
      taskId: taskData.id,
      activityTemplateValidationSkipped:
        error instanceof Error ? error.message : 'activity ref not configured',
    });
  }

  stopHandshakeRetry();
  taskListener?.(taskData);
}

function acceptMenuItemFromParent(data: Record<string, unknown>): void {
  menuItemData = data;
  gamebusDevLog('MENU_ITEM received', {
    keys: Object.keys(data),
  });
  // Custom Tasks do not complete on MENU_ITEM; pages do.
  if (getGameBusEmbedKind() === 'custom-page') {
    completePageHandshake('menu-item');
  }
}

function acceptInputCollectionsFromParent(data: GameBusInputCollectionsPayload): void {
  inputCollectionsData = data;
  const keys = [...getInputCollectionKeys(data)];
  gamebusDevLog('INPUT_COLLECTIONS received', {
    collectionKeys: keys,
    kitchenSkillsTrainerInput: summarizeKitchenSkillsTrainerInput(data),
    kitchenSkillsTrainerActivities: getRawKitchenSkillsTrainerActivitiesInput(data),
    kitchenGroupActivities: getRawKitchenGroupActivitiesInput(data),
  });
  // Custom Tasks often receive INPUT_COLLECTIONS before TASK — do not stop retries.
  if (getGameBusEmbedKind() === 'custom-page') {
    completePageHandshake('input-collections');
  }
  inputCollectionsListener?.(inputCollectionsData);
}

function handleParentMessage(event: MessageEvent): void {
  if (event.source !== window.parent) {
    gamebusDevLog('ignored message source/type', {
      reason: 'wrong_source',
      type: messageType(event.data),
    });
    return;
  }

  const payload = event.data;

  if (isTaskMessage(payload)) {
    if (taskData) {
      gamebusDevLog('ignored message source/type', { reason: 'duplicate_task', type: 'TASK' });
      return;
    }
    acceptTaskFromParent(payload.data);
    return;
  }

  if (isMenuItemMessage(payload)) {
    const data =
      payload.data && typeof payload.data === 'object'
        ? (payload.data as Record<string, unknown>)
        : {};
    acceptMenuItemFromParent(data);
    return;
  }

  if (isInputCollectionsMessage(payload)) {
    acceptInputCollectionsFromParent(payload.data ?? {});
    return;
  }

  const type = messageType(payload);
  if (type) {
    gamebusDevLog('ignored message source/type', { reason: 'unsupported_type', type });
  }
}

function attachMessageListener(): void {
  if (typeof window === 'undefined' || messageHandlerAttached) return;
  window.addEventListener('message', handleParentMessage);
  messageHandlerAttached = true;
  gamebusDevLog('listener registered');
}

function detachMessageListener(): void {
  if (typeof window === 'undefined' || !messageHandlerAttached) return;
  window.removeEventListener('message', handleParentMessage);
  messageHandlerAttached = false;
}

function attachHashChangeListener(): void {
  if (typeof window === 'undefined' || hashChangeListenerAttached) return;
  window.addEventListener('hashchange', syncHandshakeForCurrentRoute);
  hashChangeListenerAttached = true;
}

function detachHashChangeListener(): void {
  if (typeof window === 'undefined' || !hashChangeListenerAttached) return;
  window.removeEventListener('hashchange', syncHandshakeForCurrentRoute);
  hashChangeListenerAttached = false;
}

function beginIframeReadyRetries(): void {
  if (isCurrentHandshakeComplete()) return;
  if (handshakeRetryTimer !== null) return;
  sendIframeReadyAttempt();
  handshakeRetryTimer = setInterval(() => {
    if (isCurrentHandshakeComplete()) {
      stopHandshakeRetry();
      return;
    }
    sendIframeReadyAttempt();
  }, HANDSHAKE_RETRY_MS);
}

/**
 * Align retry state with the current hash route (Custom Page vs Custom Task).
 * Page init messages already received complete the page handshake without requiring TASK.
 */
function syncHandshakeForCurrentRoute(): void {
  if (typeof window === 'undefined' || !isGameBusEmbed()) return;

  if (requiresGameBusTaskHandshake()) {
    if (isTaskHandshakeComplete()) {
      stopHandshakeRetry();
      return;
    }
    beginIframeReadyRetries();
    return;
  }

  if (menuItemData !== null || inputCollectionsData !== null) {
    completePageHandshake(
      menuItemData !== null && inputCollectionsData !== null
        ? 'route-sync-menu-and-collections'
        : menuItemData !== null
          ? 'route-sync-menu-item'
          : 'route-sync-input-collections',
    );
    return;
  }

  beginIframeReadyRetries();
}

/**
 * Register the parent message listener, then send IFRAME_READY with surface-aware retries:
 * Custom Tasks until TASK; Custom Pages until MENU_ITEM and/or INPUT_COLLECTIONS.
 */
export function startGameBusHandshake(): () => void {
  if (typeof window === 'undefined' || !isGameBusEmbed()) {
    return () => {};
  }

  activeHandshakeSubscribers += 1;
  if (activeHandshakeSubscribers === 1) {
    gamebusDevLog('embed detected');
  }

  attachMessageListener();
  attachHashChangeListener();
  syncHandshakeForCurrentRoute();

  let cleaned = false;
  return () => {
    if (cleaned) return;
    cleaned = true;
    activeHandshakeSubscribers = Math.max(0, activeHandshakeSubscribers - 1);
    if (activeHandshakeSubscribers === 0) {
      stopHandshakeRetry();
      detachMessageListener();
      detachHashChangeListener();
    }
  };
}

export function attachGameBusMessageListener(): () => void {
  if (typeof window === 'undefined') return () => {};
  attachMessageListener();
  return detachMessageListener;
}

/** @deprecated Use handshake retries via startGameBusHandshake */
export function postIframeReady(): void {
  sendIframeReadyAttempt();
}

export function subscribeGameBusTask(onTask: TaskListener): () => void {
  taskListener = onTask;
  onTask(taskData);
  return () => {
    if (taskListener === onTask) taskListener = null;
  };
}

export function subscribeGameBusInputCollections(
  onUpdate: InputCollectionsListener,
): () => void {
  inputCollectionsListener = onUpdate;
  onUpdate(inputCollectionsData);
  return () => {
    if (inputCollectionsListener === onUpdate) inputCollectionsListener = null;
  };
}

export function getGameBusTask(): TaskData | null {
  return taskData;
}

export function getGameBusInputCollections(): GameBusInputCollectionsPayload | null {
  return inputCollectionsData;
}

export function getGameBusMenuItem(): Record<string, unknown> | null {
  return menuItemData;
}

export function isGameBusPageHandshakeComplete(): boolean {
  return pageHandshakeComplete;
}

export function hasGameBusPostedActivity(): boolean {
  return hasPostedActivity;
}

export function hasGameBusPostedKey(key: string): boolean {
  return postedKeys.has(key);
}

export function isGameBusSubmissionInFlight(): boolean {
  return submissionInFlight;
}

export function getIframeReadyAttemptCountForTests(): number {
  return iframeReadyAttempt;
}

export type ActivityPostResult =
  | { ok: true; message: ActivityMessage }
  | { ok: false; reason: string };

/**
 * Duplicate / in-flight policy for ACTIVITY posts.
 * - `once`: one successful post per embed lifetime (also blocks later `once` posts)
 * - `key`: unique key; `markOnce` also sets the global one-shot flag (forecast-style)
 * - keyed posts without `markOnce` use a separate in-flight flag (multi-entry games)
 */
export type ActivityDuplicatePolicy =
  | { type: 'once' }
  | { type: 'key'; key: string; markOnce?: boolean };

export type ActivityPostHooks = {
  logTask?: (task: TaskData) => void;
  beforePost?: (message: ActivityMessage) => void;
  afterPost?: () => void;
  onError?: (error: unknown) => void;
  devPayloadLabel?: string;
};

/**
 * Post an already-built ACTIVITY message. Product adapters build the payload;
 * this transport owns handshake, TASK, duplicate, and in-flight guards.
 */
export function tryPostBuiltActivity(
  buildMessage: (task: TaskData) => ActivityMessage,
  policy: ActivityDuplicatePolicy,
  hooks: ActivityPostHooks = {},
): ActivityPostResult {
  const usesKeyedInFlight = policy.type === 'key' && !policy.markOnce;
  const duplicate =
    policy.type === 'once' ? hasPostedActivity : postedKeys.has(policy.key);
  if (duplicate) {
    gamebusDevLog('submission blocked as duplicate');
    return { ok: false, reason: 'duplicate' };
  }

  const inFlight = usesKeyedInFlight ? keyedSubmissionInFlight : submissionInFlight;
  if (inFlight) {
    gamebusDevLog(usesKeyedInFlight ? 'submission blocked as in flight' : 'submission blocked as duplicate');
    return { ok: false, reason: 'in_flight' };
  }
  if (!taskData) {
    return { ok: false, reason: 'no_task' };
  }

  if (usesKeyedInFlight) {
    keyedSubmissionInFlight = true;
  } else {
    submissionInFlight = true;
  }

  try {
    hooks.logTask?.(taskData);
    const message = buildMessage(taskData);
    if (hooks.devPayloadLabel && import.meta.env.DEV) {
      console.info(`[gamebus] ${hooks.devPayloadLabel} ACTIVITY payload`, message);
    }
    hooks.beforePost?.(message);
    window.parent.postMessage(message, '*');
    hooks.afterPost?.();
    if (policy.type === 'once') {
      hasPostedActivity = true;
    } else {
      postedKeys.add(policy.key);
      if (policy.markOnce) {
        hasPostedActivity = true;
      }
    }
    gamebusDevLog('ACTIVITY sent', {
      type: message.type,
      template: message.data.template,
      propertyCount: message.data.properties.length,
    });
    return { ok: true, message };
  } catch (error) {
    hooks.onError?.(error);
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'build_failed',
    };
  } finally {
    if (usesKeyedInFlight) {
      keyedSubmissionInFlight = false;
    } else {
      submissionInFlight = false;
    }
  }
}

/** Test-only reset */
export function resetGameBusBridgeForTests(): void {
  stopHandshakeRetry();
  detachMessageListener();
  detachHashChangeListener();
  activeHandshakeSubscribers = 0;
  taskData = null;
  inputCollectionsData = null;
  menuItemData = null;
  pageHandshakeComplete = false;
  hasPostedActivity = false;
  postedKeys.clear();
  keyedSubmissionInFlight = false;
  submissionInFlight = false;
  taskListener = null;
  inputCollectionsListener = null;
  iframeReadyAttempt = 0;
}

export function ingestTaskForTests(task: TaskData): void {
  if (taskData) return;
  acceptTaskFromParent(task);
}

export function ingestInputCollectionsForTests(
  data: GameBusInputCollectionsPayload,
): void {
  acceptInputCollectionsFromParent(data);
}

export function ingestMenuItemForTests(data: Record<string, unknown> = {}): void {
  acceptMenuItemFromParent(data);
}
