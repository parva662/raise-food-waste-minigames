import type { KitchenSkillsPortionEntry } from '@/products/kitchen-skills-challenge/domain/types';
import { selectKitchenSkillsActivityTemplate } from '@/products/kitchen-skills-challenge/gamebus/taskTemplates';
import type { SilentActivityMessage, TaskData } from '@/platform/gamebus/types';
import {
  mapPortionPrecision,
  orderedPortionPrecisionPropertyRefs,
  type PortionPrecisionPropertyRef,
} from '@/products/kitchen-skills-challenge/gamebus/mapPortionPrecision';

export function buildPortionPrecisionActivityMessage(
  task: TaskData,
  entry: KitchenSkillsPortionEntry,
): SilentActivityMessage {
  const template = selectKitchenSkillsActivityTemplate(task, 'portionPrecision');
  const values = mapPortionPrecision(entry);
  const start = new Date(entry.submittedAt);
  return {
    type: 'SILENT_ACTIVITY',
    data: {
      template,
      start: start.toISOString(),
      end: start.toISOString(),
      properties: orderedPortionPrecisionPropertyRefs().map((ref) => ({
        template: ref,
        obj: values[ref as PortionPrecisionPropertyRef] as Record<string, unknown>,
      })),
    },
  };
}
