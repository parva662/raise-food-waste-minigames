import type { TrimSmartSubmission } from '../trimSmart/types';
import type { ActivityMessage, TaskData } from './types';
import { TRIM_SMART_ACTIVITY_REF } from './appMode';
import {
  mapTrimSmart,
  type TrimSmartPropertyRef,
} from './mapTrimSmart';
import {
  assertTrimSmartActivity,
  propertyRefsForTrimSmartActivity,
} from './resolveTrimSmartProperties';
import { selectActivityTemplate } from './selectActivityTemplate';

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
