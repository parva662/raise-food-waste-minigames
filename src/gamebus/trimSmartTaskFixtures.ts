import type { TaskData } from './types';
import { TRIM_SMART_REQUIRED_REFS } from './mapTrimSmart';

export const trimSmartTaskFixture: TaskData = {
  id: 'trim-smart-task-1',
  href: 'embedded-task-trim-smart',
  type: 'USER_TRIGGERED_EMBEDDED',
  url: 'http://localhost:5173/#/waste/trim-smart',
  order: 1,
  title: 'Trim Smart',
  description: null,
  thumbnail: null,
  hero: null,
  cycle: null,
  isVisible: true,
  activityTemplates: [
    {
      id: 'trim-smart-activity-1',
      slug: 'trimSmart',
      name: 'Trim Smart',
      providers: [],
      linkedProperties: TRIM_SMART_REQUIRED_REFS.map((ref, index) => ({
        order: index + 1,
        name: ref,
        required: true,
        ref,
      })),
    },
  ],
  inputCollections: [],
  propertyTemplates: [],
  taskRules: [],
};
