import type { TaskData } from './types';
import { STUDENT_LUNCH_CHECKIN_REFS } from './mapStudentLunchCheckinLegacy';

/** Runtime-like TASK: properties live on the activity template, not TASK.data.propertyTemplates. */
export const pariStudentLunchTaskFixture: TaskData = {
  id: 'task-1',
  href: 'embedded-task-Pari',
  type: 'USER_TRIGGERED_EMBEDDED',
  url: 'http://localhost:5193/embed/task',
  order: 3,
  title: 'Pari',
  description: null,
  thumbnail: null,
  hero: null,
  cycle: null,
  isVisible: true,
  activityTemplates: [
    {
      id: '019f9404-88ec-7f31-89d6-8b2cbfbcab4f',
      reference: 'studentLunchCheckin',
      name: 'Student lunch check-in',
      providers: [],
      linkedProperties: STUDENT_LUNCH_CHECKIN_REFS.map((ref, index) => ({
        order: index + 1,
        name: ref,
        required: true,
        ref,
      })),
    },
  ],
  inputCollections: [],
  propertyTemplates: [
    {
      id: 'partial-only-targetDate',
      reference: 'targetDate',
      name: 'Target date',
      schema: {},
      defaultVisibility: 'public',
    },
  ],
  taskRules: [],
};
