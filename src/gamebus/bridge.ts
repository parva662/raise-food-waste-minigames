import { buildActivityMessage } from './buildActivityMessage';
import { buildChefActivityMessage } from './buildChefActivityMessage';
import { buildWasteMeasurementActivityMessage } from './buildWasteMeasurementActivityMessage';
import { getExpectedActivityRef } from './appMode';
import { isGameBusEmbed } from './detectEmbed';
import { gamebusDevLog } from './devLog';
import {
  getInputCollectionKeys,
  getRawKitchenGroupActivitiesInput,
} from './inputCollections';
import { logTaskStructureSanitized } from './logTaskStructure';
import { selectActivityTemplate } from './selectActivityTemplate';
import type {
  ActivityMessage,
  GameBusInputCollectionsPayload,
  InputCollectionsMessage,
  TaskData,
  TaskMessage,
} from './types';
import type { ActiveDeclaration } from '../types/declaration';
import type { DailyMealSlots, MealDraft } from '../types/mealChoice';
import type { ChefForecastDraft, ChefForecastSubmission } from '../chef/types';
import type { ServiceCloseout } from '../serviceCloseout/types';

const HANDSHAKE_RETRY_MS = 875;

type TaskListener = (task: TaskData | null) => void;
type InputCollectionsListener = (data: GameBusInputCollectionsPayload | null) => void;

let taskData: TaskData | null = null;
let inputCollectionsData: GameBusInputCollectionsPayload | null = null;
let hasPostedActivity = false;
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
    const expectedRef = getExpectedActivityRef();
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

export function tryPostChefActivity(
  submission: ChefForecastSubmission,
  draft: ChefForecastDraft,
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
    const message = buildChefActivityMessage(taskData, submission, draft, slots);
    if (import.meta.env.DEV) {
      console.info('[gamebus] chefForecast ACTIVITY payload', message);
    }
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

export function tryPostCloseoutActivity(
  closeout: ServiceCloseout,
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
    const message = buildWasteMeasurementActivityMessage(taskData, closeout);
    if (import.meta.env.DEV) {
      console.info('[gamebus] wasteMeasurement ACTIVITY payload', message);
    }
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
  inputCollectionsData = null;
  hasPostedActivity = false;
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
