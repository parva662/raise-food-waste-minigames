import type { TaskData } from './types';
import { WASTE_MEASUREMENT_REQUIRED_REFS } from './mapWasteMeasurement';

/** Runtime-like TASK for wasteMeasurement embedded service closeout tests. */
export const pariWasteMeasurementTaskFixture: TaskData = {
  id: 'task-closeout-1',
  href: 'embedded-task-closeout',
  type: 'USER_TRIGGERED_EMBEDDED',
  url: 'http://localhost:5193/#/service-closeout',
  order: 1,
  title: 'Service closeout',
  description: null,
  thumbnail: null,
  hero: null,
  cycle: null,
  isVisible: true,
  activityTemplates: [
    {
      id: '019f9404-8905-7f97-8f8b-00aa160da479',
      reference: 'wasteMeasurement',
      name: 'Waste measurement',
      providers: [],
      linkedProperties: WASTE_MEASUREMENT_REQUIRED_REFS.map((ref, index) => ({
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
