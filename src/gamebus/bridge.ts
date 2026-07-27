import { buildActivityMessage, selectActivityTemplate } from './buildActivityMessage';
import { isGameBusEmbed } from './detectEmbed';
import { gamebusDevLog } from './devLog';
import { logTaskStructureSanitized } from './logTaskStructure';
import type { ActivityMessage, TaskData, TaskMessage } from './types';
import type { ActiveDeclaration } from '../types/declaration';
import type { DailyMealSlots, MealDraft } from '../types/mealChoice';

const HANDSHAKE_RETRY_MS = 875;

type Listener = (task: TaskData | null) => void;

let taskData: TaskData | null = null;
let hasPostedActivity = false;
let submissionInFlight = false;
let listener: Listener | null = null;
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
  const selected = selectActivityTemplate(taskData);
  gamebusDevLog('TASK received', {
    taskId: taskData.id,
    activityTemplate: selected.reference,
    propertyTemplateCount: taskData.propertyTemplates?.length ?? 0,
  });
  gamebusDevLog('selected activity template', {
    reference: selected.reference,
    name: selected.name,
  });
  stopHandshakeRetry();
  listener?.(taskData);
}

function handleParentMessage(event: MessageEvent): void {
  if (event.source !== window.parent) {
    gamebusDevLog('ignored message source/type', {
      reason: 'wrong_source',
      type: messageType(event.data),
    });
    return;
  }

  if (!isTaskMessage(event.data)) {
    const type = messageType(event.data);
    if (type) {
      gamebusDevLog('ignored message source/type', { reason: 'not_task', type });
    }
    return;
  }

  if (taskData) {
    gamebusDevLog('ignored message source/type', { reason: 'duplicate_task', type: 'TASK' });
    return;
  }

  acceptTaskFromParent(event.data.data);
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

export function subscribeGameBusTask(onTask: Listener): () => void {
  listener = onTask;
  onTask(taskData);
  return () => {
    if (listener === onTask) listener = null;
  };
}

export function getGameBusTask(): TaskData | null {
  return taskData;
}

export function hasGameBusPostedActivity(): boolean {
  return hasPostedActivity;
}

export function isGameBusSubmissionInFlight(): boolean {
  return submissionInFlight;
}

export function getIframeReadyAttemptCountForTests(): number {
  return iframeReadyAttempt;
}

export function tryPostActivity(
  declaration: ActiveDeclaration,
  draft: MealDraft,
  slots: DailyMealSlots,
): { ok: true; message: ActivityMessage } | { ok: false; reason: string } {
  if (hasPostedActivity) {
    gamebusDevLog('submission blocked as duplicate');
    return { ok: false, reason: 'duplicate' };
  }
  if (submissionInFlight) {
    gamebusDevLog('submission blocked as duplicate');
    return { ok: false, reason: 'in_flight' };
  }
  if (!taskData) {
    return { ok: false, reason: 'no_task' };
  }

  submissionInFlight = true;
  try {
    const message = buildActivityMessage(taskData, declaration, draft, slots);
    window.parent.postMessage(message, '*');
    hasPostedActivity = true;
    gamebusDevLog('ACTIVITY sent', {
      type: message.type,
      template: message.data.template,
      propertyCount: message.data.properties.length,
    });
    return { ok: true, message };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'build_failed',
    };
  } finally {
    submissionInFlight = false;
  }
}

/** Test-only reset */
export function resetGameBusBridgeForTests(): void {
  stopHandshakeRetry();
  detachMessageListener();
  taskData = null;
  hasPostedActivity = false;
  submissionInFlight = false;
  listener = null;
  iframeReadyAttempt = 0;
}

export function ingestTaskForTests(task: TaskData): void {
  if (taskData) return;
  acceptTaskFromParent(task);
}
