import { describe, expect, it } from 'vitest';
import {
  extractGroupActivities,
  filterActivitiesByTemplateReference,
  getActivityTemplateReference,
  getRawKitchenGroupActivitiesInput,
  getRawKitchenSelfActivitiesInput,
  getRawKitchenSkillsTrainerActivitiesInput,
  KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY,
  KITCHEN_GROUP_INPUT_COLLECTION_KEY,
  KITCHEN_SKILLS_TRAINER_INPUT_COLLECTION_KEY,
} from '@/platform/gamebus/groupActivities';

describe('groupActivities input adapter', () => {
  it('reads kitchenGroupInput.activities from INPUT_COLLECTIONS', () => {
    const payload = {
      [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
        [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [{ id: 'a-1', template: { slug: 'chefForecast' } }],
      },
    };
    expect(getRawKitchenGroupActivitiesInput(payload)).toEqual([
      { id: 'a-1', template: { slug: 'chefForecast' } },
    ]);
  });

  it('reads kitchenGroupInputSelf.activities from INPUT_COLLECTIONS', () => {
    const payload = {
      kitchenGroupInputSelf: {
        activities: [{ id: 'me-1', template: { slug: 'trimSmart' } }],
      },
      kitchenGroupInput: {
        activities: [{ id: 'group-1', template: { slug: 'trimSmart' } }],
      },
    };
    expect(getRawKitchenSelfActivitiesInput(payload)).toEqual([
      { id: 'me-1', template: { slug: 'trimSmart' } },
    ]);
    expect(getRawKitchenGroupActivitiesInput(payload)).toEqual([
      { id: 'group-1', template: { slug: 'trimSmart' } },
    ]);
  });

  it('reads kitchenSkillsTrainerInput.activities and does not fall back to kitchenGroupInput', () => {
    const payload = {
      [KITCHEN_SKILLS_TRAINER_INPUT_COLLECTION_KEY]: {
        [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [{ id: 'ks-1', template: { slug: 'trimSmart' } }],
      },
      [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
        [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [{ id: 'forecast-1', template: { slug: 'chefForecast' } }],
      },
    };
    expect(getRawKitchenSkillsTrainerActivitiesInput(payload)).toEqual([
      { id: 'ks-1', template: { slug: 'trimSmart' } },
    ]);
    expect(getRawKitchenSkillsTrainerActivitiesInput({
      [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
        [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [{ id: 'forecast-1', template: { slug: 'chefForecast' } }],
      },
      activities: [{ id: 'top-level', template: { slug: 'trimSmart' } }],
    })).toBeUndefined();
  });

  it('extracts activities from paginated docs envelope', () => {
    const activities = [{ id: 'wm-1', template: { slug: 'wasteMeasurement' } }];
    expect(extractGroupActivities({ docs: activities, totalDocs: 1 })).toEqual(activities);
  });

  it('filters activities by template reference', () => {
    const activities = [
      { id: '1', template: { slug: 'chefForecast' } },
      { id: '2', template: { slug: 'wasteMeasurement' } },
      { id: '3', template: { slug: 'studentLunchCheckin' } },
    ];
    expect(filterActivitiesByTemplateReference(activities, 'chefForecast')).toHaveLength(1);
    expect(getActivityTemplateReference(activities[2])).toBe('studentLunchCheckin');
  });
});
