/**
 * TEMPORARY — Chef Forecast GameBus submission diagnostics (Raoul / iframe-close investigation).
 * Remove this file and its imports from bridge.ts / useChefForecast.ts when debugging is complete.
 */
import { CHEF_ACTIVITY_REF } from '../appMode';
import { findActivityTemplate, resolveLinkedPropertyRefs } from '../resolveActivityProperties';
import { selectActivityTemplate } from '../selectActivityTemplate';
import type { ActivityMessage, TaskData } from '../types';

export const CHEF_GAMEBUS_DEBUG_LOG_PREFIX = '[CHEF GAMEBUS DEBUG]';

let parentMessageSnifferAttached = false;

function onChefParentMessage(event: MessageEvent): void {
  if (typeof window === 'undefined') return;
  if (event.source !== window.parent) return;
  console.log(`${CHEF_GAMEBUS_DEBUG_LOG_PREFIX} parent message received`, event.data);
}

/** Passive listener — logs only; does not change GameBus message handling. */
export function armChefParentMessageDiagnostic(): void {
  if (typeof window === 'undefined' || parentMessageSnifferAttached) return;
  window.addEventListener('message', onChefParentMessage);
  parentMessageSnifferAttached = true;
}

export function resetChefParentMessageDiagnosticForTests(): void {
  if (typeof window === 'undefined' || !parentMessageSnifferAttached) return;
  window.removeEventListener('message', onChefParentMessage);
  parentMessageSnifferAttached = false;
}

export function logChefTaskBeforeSubmission(task: TaskData): void {
  const selected = selectActivityTemplate(task, CHEF_ACTIVITY_REF);
  const activityTemplate = findActivityTemplate(task, CHEF_ACTIVITY_REF);

  console.log(`${CHEF_GAMEBUS_DEBUG_LOG_PREFIX} task`, {
    taskId: task.id,
    activityTemplateReference: selected.reference,
    activityTemplateName: selected.name,
    taskPropertyTemplateRefs: (task.propertyTemplates ?? []).map((entry) => entry.reference),
    activityLinkedPropertyRefs: activityTemplate ? resolveLinkedPropertyRefs(activityTemplate) : [],
  });
}

export function summarizeChefActivityMessage(message: ActivityMessage): {
  activityTemplate: string;
  propertyCount: number;
  propertyTemplateRefs: string[];
  propertyValues: { template: string; obj: Record<string, unknown> }[];
} {
  return {
    activityTemplate: message.data.template,
    propertyCount: message.data.properties.length,
    propertyTemplateRefs: message.data.properties.map((property) => property.template),
    propertyValues: message.data.properties.map((property) => ({
      template: property.template,
      obj: property.obj,
    })),
  };
}

export function logChefActivityBeforePostMessage(message: ActivityMessage): void {
  console.log(`${CHEF_GAMEBUS_DEBUG_LOG_PREFIX} sending ACTIVITY`, message);
  console.log(
    `${CHEF_GAMEBUS_DEBUG_LOG_PREFIX} sending ACTIVITY summary`,
    summarizeChefActivityMessage(message),
  );
}

export function logChefPostMessageReturned(): void {
  console.log(`${CHEF_GAMEBUS_DEBUG_LOG_PREFIX} postMessage returned`);
}

export function logChefSubmissionException(error: unknown): void {
  console.error(`${CHEF_GAMEBUS_DEBUG_LOG_PREFIX} submission exception`, error);
}

export function logChefTryPostActivityResult(
  result: { ok: true; message: ActivityMessage } | { ok: false; reason: string },
): void {
  console.log(`${CHEF_GAMEBUS_DEBUG_LOG_PREFIX} tryPostChefActivity result`, result);
}
