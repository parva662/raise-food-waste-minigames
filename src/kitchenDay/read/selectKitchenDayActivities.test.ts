import { describe, expect, it } from 'vitest';
import { extractGroupActivities } from '../../gamebus/groupActivities';
import { historicalTrimSamplesFromGroupActivities, selectKitchenDayActivities } from './selectKitchenDayActivities';

describe('Kitchen Day group-activity selectors', () => {
  it('filters Kitchen Day templates from existing group activities', () => {
    const activities = extractGroupActivities([
      { template: { slug: 'trimSmart' }, properties: [] },
      { template: { slug: 'chefForecast' }, properties: [] },
      { template: { slug: 'portionPrecision' }, properties: [] },
    ]);
    expect(selectKitchenDayActivities(activities).map((item) => (item as { template: { slug: string } }).template.slug)).toEqual([
      'trimSmart',
      'portionPrecision',
    ]);
  });

  it('reads historical waste from target or v1 Trim properties', () => {
    const samples = historicalTrimSamplesFromGroupActivities([
      {
        template: { slug: 'trimSmart' },
        properties: [
          { template: { slug: 'ingredientId' }, value: { value: 'carrot' } },
          { template: { slug: 'ingredientWeightGrams' }, value: { value: 1000 } },
          { template: { slug: 'actualWasteGrams' }, value: { value: 90 } },
        ],
      },
      {
        template: { slug: 'trimSmart' },
        properties: [
          { template: { slug: 'ingredientId' }, value: { value: 'onion' } },
          { template: { slug: 'ingredientWeightGrams' }, value: { value: 500 } },
          { template: { slug: 'participantWasteGrams' }, value: { value: 50 } },
        ],
      },
    ]);
    expect(samples).toEqual([
      { ingredientId: 'carrot', ingredientWeightGrams: 1000, actualWasteGrams: 90 },
      { ingredientId: 'onion', ingredientWeightGrams: 500, actualWasteGrams: 50 },
    ]);
  });
});
