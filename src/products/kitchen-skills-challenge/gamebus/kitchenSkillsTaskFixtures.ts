import { KITCHEN_SKILLS_TRIM_REQUIRED_REFS } from '@/products/kitchen-skills-challenge/gamebus/mapKitchenSkillsTrimSmart';
import { PORTION_PRECISION_REQUIRED_REFS } from '@/products/kitchen-skills-challenge/gamebus/mapPortionPrecision';
import { RESCUE_AND_REUSE_REQUIRED_REFS } from '@/products/kitchen-skills-challenge/gamebus/mapRescueAndReuse';
import { WASTE_PRACTICE_REVIEW_REQUIRED_REFS } from '@/products/kitchen-skills-challenge/gamebus/mapWastePracticeReview';
import type { TaskData } from '@/platform/gamebus/types';

function linked(refs: readonly string[]) {
  return refs.map((ref, index) => ({
    order: index + 1,
    name: ref,
    required: true,
    ref,
  }));
}

export const kitchenSkillsTaskFixture: TaskData = {
  id: 'kitchen-day-task-1',
  href: 'embedded-task-kitchen-day',
  type: 'USER_TRIGGERED_EMBEDDED',
  url: 'http://localhost:5173/#/kitchen-day',
  order: 1,
  title: 'Kitchen Day',
  description: null,
  thumbnail: null,
  hero: null,
  cycle: null,
  isVisible: true,
  activityTemplates: [
    {
      id: 'kd-trim',
      slug: 'trimSmart',
      name: 'Trim Smart',
      providers: [],
      linkedProperties: linked(KITCHEN_SKILLS_TRIM_REQUIRED_REFS),
    },
    {
      id: 'kd-rescue',
      slug: 'rescueAndReuse',
      name: 'Rescue and reuse',
      providers: [],
      linkedProperties: linked(RESCUE_AND_REUSE_REQUIRED_REFS),
    },
    {
      id: 'kd-portion',
      slug: 'portionPrecision',
      name: 'Portion Precision',
      providers: [],
      linkedProperties: linked(PORTION_PRECISION_REQUIRED_REFS),
    },
  ],
  inputCollections: [],
  propertyTemplates: [],
  taskRules: [],
};

export const kitchenSkillsTrainerTaskFixture: TaskData = {
  ...kitchenSkillsTaskFixture,
  id: 'kitchen-day-chef-task-1',
  title: 'Kitchen Day chef review',
  url: 'http://localhost:5173/#/kitchen-day/chef',
  activityTemplates: [
    ...kitchenSkillsTaskFixture.activityTemplates,
    {
      id: 'kd-review',
      slug: 'wastePracticeReview',
      name: 'Waste practice review',
      providers: [],
      linkedProperties: linked(WASTE_PRACTICE_REVIEW_REQUIRED_REFS),
    },
  ],
};
