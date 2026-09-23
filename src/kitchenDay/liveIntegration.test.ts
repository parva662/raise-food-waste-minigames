import { describe, expect, it } from 'vitest';
import { kitchenDayTaskFixture } from '../gamebus/kitchenDayTaskFixtures';
import {
  KITCHEN_DAY_LIVE_BLOCK_REASON,
  canPostKitchenDayToGameBus,
} from './liveIntegration';
import { tryPostKitchenDayActivity } from './postKitchenDayActivity';

describe('Kitchen Day live integration guard', () => {
  it('blocks embedded target posting until GameBus admin alignment', () => {
    expect(canPostKitchenDayToGameBus()).toBe(false);
    expect(
      tryPostKitchenDayActivity(kitchenDayTaskFixture, () => {
        throw new Error('builder must not run while live posting is disabled');
      }, 'trim:test'),
    ).toEqual({
      ok: false,
      reason: KITCHEN_DAY_LIVE_BLOCK_REASON,
    });
  });
});
