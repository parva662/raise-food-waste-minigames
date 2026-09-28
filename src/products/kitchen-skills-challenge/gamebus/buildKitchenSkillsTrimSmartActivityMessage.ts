import type { KitchenSkillsTrimEntry } from '@/products/kitchen-skills-challenge/domain/types';
import { selectKitchenSkillsActivityTemplate } from '@/products/kitchen-skills-challenge/gamebus/taskTemplates';
import type { ActivityMessage, TaskData } from '@/platform/gamebus/types';
import {
  mapKitchenSkillsTrimSmart,
  orderedKitchenSkillsTrimPropertyRefs,
  type KitchenSkillsTrimPropertyRef,
} from '@/products/kitchen-skills-challenge/gamebus/mapKitchenSkillsTrimSmart';

export function buildKitchenSkillsTrimSmartActivityMessage(
  task: TaskData,
  entry: KitchenSkillsTrimEntry,
): ActivityMessage {
  const template = selectKitchenSkillsActivityTemplate(task, 'trimSmart');
  const values = mapKitchenSkillsTrimSmart(entry);
  return {
    type: 'ACTIVITY',
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
