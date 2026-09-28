import type { TrimSmartSubmission } from '@/legacy/trim-smart-v1/types';
import type { ActivityMessage, TaskData } from '@/platform/gamebus/types';
import { TRIM_SMART_ACTIVITY_REF } from '@/app/routes';
import {
  mapTrimSmart,
  type TrimSmartPropertyRef,
} from '@/platform/gamebus/mapTrimSmart';
import {
  assertTrimSmartActivity,
  propertyRefsForTrimSmartActivity,
} from '@/platform/gamebus/resolveTrimSmartProperties';
import { selectActivityTemplate } from '@/platform/gamebus/selectActivityTemplate';

export function buildTrimSmartActivityMessage(
  task: TaskData,
  submission: TrimSmartSubmission,
): ActivityMessage {
  const { reference: templateRef } = selectActivityTemplate(task, TRIM_SMART_ACTIVITY_REF);
  assertTrimSmartActivity(task, templateRef);

  const propertyRefs = propertyRefsForTrimSmartActivity(task);
  const values = mapTrimSmart(submission);

  const properties = propertyRefs.map((ref) => ({
    template: ref,
    obj: values[ref as TrimSmartPropertyRef] as Record<string, unknown>,
  }));

  const start = new Date(submission.submittedAt);
  const end = new Date(start.getTime() + 60_000);

  return {
    type: 'ACTIVITY',
    data: {
      template: templateRef,
      start: start.toISOString(),
      end: end.toISOString(),
      properties,
    },
  };
}
