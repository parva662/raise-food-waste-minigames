/**
 * TEMPORARY — Student Lunch GameBus submission diagnostics (linked-property validation investigation).
 * Remove this file and its imports from bridge.ts / buildActivityMessage.ts / useLunchSelection.ts when complete.
 */
import {
  findActivityTemplate,
  resolveLinkedPropertyRefs,
  STUDENT_LUNCH_CHECKIN_REF,
} from '../resolveActivityProperties';
import { selectActivityTemplate } from '../selectActivityTemplate';
import type { ActivityMessage, TaskData } from '../types';

export const STUDENT_GAMEBUS_DEBUG_LOG_PREFIX = '[STUDENT GAMEBUS DEBUG]';

export function logStudentTaskBeforeSubmission(task: TaskData): void {
  const activityTemplates = task.activityTemplates ?? [];
  let selected: { reference: string; name: string | null } | null = null;
  try {
    selected = selectActivityTemplate(task, STUDENT_LUNCH_CHECKIN_REF);
  } catch {
    // Log partial TASK shape even when template selection would fail.
  }

  const activityTemplate = findActivityTemplate(task, STUDENT_LUNCH_CHECKIN_REF);

  console.log(`${STUDENT_GAMEBUS_DEBUG_LOG_PREFIX} task`, {
    taskId: task.id,
    activityTemplateSlug: selected?.reference ?? null,
    activityTemplateName: selected?.name ?? null,
    taskActivityTemplateSlugs: activityTemplates.map((entry) => entry.slug),
    activityLinkedPropertySlugs: activityTemplate
      ? resolveLinkedPropertyRefs(activityTemplate)
      : [],
    taskPropertyTemplateSlugs: (task.propertyTemplates ?? []).map((entry) => entry.slug),
  });
}

export function logStudentExpectedPropertyRefs(propertyRefs: readonly string[]): void {
  console.log(`${STUDENT_GAMEBUS_DEBUG_LOG_PREFIX} expected property refs`, propertyRefs);
}

export function summarizeStudentActivityMessage(message: ActivityMessage): {
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

export function logStudentActivityBeforePostMessage(message: ActivityMessage): void {
  console.log(`${STUDENT_GAMEBUS_DEBUG_LOG_PREFIX} sending ACTIVITY`, message);
  console.log(
    `${STUDENT_GAMEBUS_DEBUG_LOG_PREFIX} sending ACTIVITY summary`,
    summarizeStudentActivityMessage(message),
  );
}

export function logStudentPostMessageReturned(): void {
  console.log(`${STUDENT_GAMEBUS_DEBUG_LOG_PREFIX} postMessage returned`);
}

export function logStudentSubmissionException(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`${STUDENT_GAMEBUS_DEBUG_LOG_PREFIX} build/submission exception`, message, error);
}

export function logStudentTryPostActivityResult(
  result: { ok: true; message: ActivityMessage } | { ok: false; reason: string },
): void {
  console.log(`${STUDENT_GAMEBUS_DEBUG_LOG_PREFIX} tryPostActivity result`, result);
}
