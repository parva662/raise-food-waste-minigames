import { describe, expect, it } from 'vitest';
import { kitchenDayTaskFixture } from '../gamebus/kitchenDayTaskFixtures';
import { trimSmartTaskFixture } from '../gamebus/trimSmartTaskFixtures';
import {
  assertKitchenDayTask,
  missingKitchenDayTaskTemplates,
  selectKitchenDayActivityTemplate,
} from './kitchenDayTask';

describe('Kitchen Day multi-template TASK', () => {
  it('accepts one TASK that lists all three Kitchen Day activity templates', () => {
    expect(missingKitchenDayTaskTemplates(kitchenDayTaskFixture)).toEqual([]);
    expect(selectKitchenDayActivityTemplate(kitchenDayTaskFixture, 'trimSmart')).toBe('trimSmart');
    expect(selectKitchenDayActivityTemplate(kitchenDayTaskFixture, 'rescueAndReuse')).toBe(
      'rescueAndReuse',
    );
    expect(selectKitchenDayActivityTemplate(kitchenDayTaskFixture, 'portionPrecision')).toBe(
      'portionPrecision',
    );
  });

  it('rejects a TASK that only has trimSmart', () => {
    expect(missingKitchenDayTaskTemplates(trimSmartTaskFixture)).toEqual([
      'rescueAndReuse',
      'portionPrecision',
    ]);
    expect(() => assertKitchenDayTask(trimSmartTaskFixture)).toThrow(
      /missing required activity templates: rescueAndReuse, portionPrecision/,
    );
  });
});
