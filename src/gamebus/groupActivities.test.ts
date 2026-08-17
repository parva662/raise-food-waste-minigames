import { describe, expect, it } from 'vitest';
import {
  extractGroupActivities,
  filterActivitiesByTemplateReference,
  getActivityTemplateReference,
  getRawKitchenGroupActivitiesInput,
  KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY,
  KITCHEN_GROUP_INPUT_COLLECTION_KEY,
} from './groupActivities';

describe('groupActivities input adapter', () => {
  it('reads kitchenGroupInput.activities from INPUT_COLLECTIONS', () => {
    const payload = {
      [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
        [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [{ id: 'a-1', template: { reference: 'chefForecast' } }],
      },
    };
    expect(getRawKitchenGroupActivitiesInput(payload)).toEqual([
      { id: 'a-1', template: { reference: 'chefForecast' } },
    ]);
  });

  it('extracts activities from paginated docs envelope', () => {
    const activities = [{ id: 'wm-1', template: { reference: 'wasteMeasurement' } }];
    expect(extractGroupActivities({ docs: activities, totalDocs: 1 })).toEqual(activities);
  });

  it('filters activities by template reference', () => {
    const activities = [
      { id: '1', template: { reference: 'chefForecast' } },
      { id: '2', template: { reference: 'wasteMeasurement' } },
      { id: '3', template: { reference: 'studentLunchCheckin' } },
    ];
    expect(filterActivitiesByTemplateReference(activities, 'chefForecast')).toHaveLength(1);
    expect(getActivityTemplateReference(activities[2])).toBe('studentLunchCheckin');
  });
});
