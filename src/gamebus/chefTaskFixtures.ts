import type { TaskData } from './types';
import {
  CHEF_FORECAST_OPTIONAL_REFS,
  CHEF_FORECAST_REQUIRED_REFS,
} from './mapChefForecast';

/** Runtime-like TASK for chefForecast embedded tests (12 required + 2 optional links). */
export const pariChefForecastTaskFixture: TaskData = {
  id: 'task-chef-1',
  href: 'embedded-task-chef',
  type: 'USER_TRIGGERED_EMBEDDED',
  url: 'http://localhost:5193/#/chef',
  order: 1,
  title: 'Chef forecast',
  description: null,
  thumbnail: null,
  hero: null,
  cycle: null,
  isVisible: true,
  activityTemplates: [
    {
      id: '019f9404-88f4-742a-9846-f9097610bae7',
      reference: 'chefForecast',
      name: 'Chef forecast',
      providers: [],
      linkedProperties: [
        ...CHEF_FORECAST_REQUIRED_REFS.map((ref, index) => ({
          order: index + 1,
          name: ref,
          required: true,
          ref,
        })),
        ...CHEF_FORECAST_OPTIONAL_REFS.map((ref, index) => ({
          order: CHEF_FORECAST_REQUIRED_REFS.length + index + 1,
          name: ref,
          required: false,
          ref,
        })),
      ],
    },
  ],
  inputCollections: [],
  propertyTemplates: [],
  taskRules: [],
};

/** TASK fixture with optional templates unlinked (for optional omission tests). */
export const pariChefForecastRequiredOnlyTaskFixture: TaskData = {
  ...pariChefForecastTaskFixture,
  activityTemplates: [
    {
      ...pariChefForecastTaskFixture.activityTemplates![0],
      linkedProperties: CHEF_FORECAST_REQUIRED_REFS.map((ref, index) => ({
        order: index + 1,
        name: ref,
        required: true,
        ref,
      })),
    },
  ],
};
