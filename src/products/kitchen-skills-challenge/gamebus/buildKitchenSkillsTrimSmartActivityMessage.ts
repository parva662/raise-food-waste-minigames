import type { KitchenSkillsTrimEntry } from '@/products/kitchen-skills-challenge/domain/types';
import { selectKitchenSkillsActivityTemplate } from '@/products/kitchen-skills-challenge/gamebus/taskTemplates';
import type { SilentActivityMessage, TaskData } from '@/platform/gamebus/types';
import {
  mapKitchenSkillsTrimSmart,
  orderedKitchenSkillsTrimPropertyRefs,
  type KitchenSkillsTrimPropertyRef,
} from '@/products/kitchen-skills-challenge/gamebus/mapKitchenSkillsTrimSmart';

export function buildKitchenSkillsTrimSmartActivityMessage(
  task: TaskData,
  entry: KitchenSkillsTrimEntry,
): SilentActivityMessage {
  const template = selectKitchenSkillsActivityTemplate(task, 'trimSmart');
  const values = mapKitchenSkillsTrimSmart(entry);
  return {
    type: 'SILENT_ACTIVITY',
    data: {
      template,
      start: entry.preparationStartedAt,
      end: entry.preparationEndedAt,
      properties: orderedKitchenSkillsTrimPropertyRefs().map((ref) => ({
        template: ref,
        obj: values[ref as KitchenSkillsTrimPropertyRef] as Record<string, unknown>,
      })),
    },
  };
}
