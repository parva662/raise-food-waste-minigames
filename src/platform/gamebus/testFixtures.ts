import type { TaskData } from '@/platform/gamebus/types';

/** Minimal TASK for platform transport tests. Not a product fixture. */
export function platformTaskFixture(slug = 'exampleActivity'): TaskData {
  return {
    id: 'platform-task-1',
    href: null,
    type: 'USER_TRIGGERED_EMBEDDED',
    url: null,
    order: 1,
    title: 'Platform fixture',
    description: null,
    thumbnail: null,
    hero: null,
    cycle: null,
    isVisible: true,
    activityTemplates: [
      {
        id: 'platform-template-1',
        slug,
        name: slug,
        providers: [],
        linkedProperties: [],
      },
    ],
    inputCollections: [],
    propertyTemplates: [],
    taskRules: [],
  };
}
