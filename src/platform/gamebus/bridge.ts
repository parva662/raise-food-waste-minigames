import { peekExpectedActivityRef } from '@/platform/gamebus/expectedActivityRef';
import { isGameBusEmbed } from '@/platform/gamebus/detectEmbed';
import { gamebusDevLog } from '@/platform/gamebus/devLog';
import {
  getInputCollectionKeys,
  getRawKitchenGroupActivitiesInput,
} from '@/platform/gamebus/inputCollections';
import { logTaskStructureSanitized } from '@/platform/gamebus/logTaskStructure';
import { selectActivityTemplate } from '@/platform/gamebus/selectActivityTemplate';
import type {
  ActivityMessage,
  GameBusInputCollectionsPayload,
  InputCollectionsMessage,
  TaskData,
  TaskMessage,
} from '@/platform/gamebus/types';

const HANDSHAKE_RETRY_MS = 875;

type TaskListener = (task: TaskData | null) => void;
type InputCollectionsListener = (data: GameBusInputCollectionsPayload | null) => void;

let taskData: TaskData | null = null;
let inputCollectionsData: GameBusInputCollectionsPayload | null = null;
let hasPostedActivity = false;
let chefForecastPostedTargetDate: string | null = null;
const trimSmartPostedAttemptKeys = new Set<string>();
let trimSmartSubmissionInFlight = false;
let submissionInFlight = false;
let taskListener: TaskListener | null = null;
let inputCollectionsListener: InputCollectionsListener | null = null;
let messageHandlerAttached = false;
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

function messageType(data: unknown): string | undefined {
  if (typeof data === 'object' && data !== null && 'type' in data) {
    const t = (data as { type: unknown }).type;
    return typeof t === 'string' ? t : undefined;
  }
  return undefined;
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

function acceptInputCollectionsFromParent(data: GameBusInputCollectionsPayload): void {
  inputCollectionsData = data;
  const keys = [...getInputCollectionKeys(data)];
  gamebusDevLog('INPUT_COLLECTIONS received', {
    collectionKeys: keys,
    kitchenGroupActivities: getRawKitchenGroupActivitiesInput(data),
  });
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

function beginIframeReadyRetries(): void {
  if (taskData !== null) return;
  sendIframeReadyAttempt();
  if (handshakeRetryTimer !== null) return;
  handshakeRetryTimer = setInterval(() => {
    if (taskData !== null) {
      stopHandshakeRetry();
      return;
    }
    sendIframeReadyAttempt();
  }, HANDSHAKE_RETRY_MS);
}

/**
 * Register the parent message listener, then send IFRAME_READY (with retries until TASK).
 */
export function startGameBusHandshake(): () => void {
  if (typeof window === 'undefined' || !isGameBusEmbed()) {
    return () => {};
  }

  gamebusDevLog('embed detected');

  attachMessageListener();
  beginIframeReadyRetries();

  return () => {
    stopHandshakeRetry();
    detachMessageListener();
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

export function hasGameBusPostedActivity(): boolean {
  return hasPostedActivity;
}

export function hasGameBusPostedChefForecastForDate(targetDate: string): boolean {
  return chefForecastPostedTargetDate === targetDate;
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

export type ActivityDuplicatePolicy =
  | { type: 'once' }
  | { type: 'chef-date'; targetDate: string }
  | { type: 'attempt-key'; key: string };

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
  const duplicate =
    policy.type === 'once'
      ? hasPostedActivity
      : policy.type === 'chef-date'
        ? chefForecastPostedTargetDate === policy.targetDate
        : trimSmartPostedAttemptKeys.has(policy.key);
  if (duplicate) {
    gamebusDevLog(
      policy.type === 'attempt-key'
        ? 'trimSmart submission blocked as duplicate attempt'
        : 'submission blocked as duplicate',
    );
    return { ok: false, reason: 'duplicate' };
  }

  const inFlight = policy.type === 'attempt-key' ? trimSmartSubmissionInFlight : submissionInFlight;
  if (inFlight) {
    gamebusDevLog(
      policy.type === 'attempt-key'
        ? 'trimSmart submission blocked as in flight'
        : 'submission blocked as duplicate',
    );
    return { ok: false, reason: 'in_flight' };
  }
  if (!taskData) {
    return { ok: false, reason: 'no_task' };
  }

  if (policy.type === 'attempt-key') {
    trimSmartSubmissionInFlight = true;
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
    } else if (policy.type === 'chef-date') {
      hasPostedActivity = true;
      chefForecastPostedTargetDate = policy.targetDate;
    } else {
      trimSmartPostedAttemptKeys.add(policy.key);
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
    if (policy.type === 'attempt-key') {
      trimSmartSubmissionInFlight = false;
    } else {
      submissionInFlight = false;
    }
  }
}

/** Test-only reset */
export function resetGameBusBridgeForTests(): void {
  stopHandshakeRetry();
  detachMessageListener();
  taskData = null;
  inputCollectionsData = null;
  hasPostedActivity = false;
  chefForecastPostedTargetDate = null;
  trimSmartPostedAttemptKeys.clear();
  trimSmartSubmissionInFlight = false;
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
