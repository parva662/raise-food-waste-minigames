import { buildKitchenDayTrimSmartActivityMessage } from '../gamebus/buildKitchenDayTrimSmartActivityMessage';
import { buildPortionPrecisionActivityMessage } from '../gamebus/buildPortionPrecisionActivityMessage';
import { buildRescueAndReuseActivityMessage } from '../gamebus/buildRescueAndReuseActivityMessage';
import type { ActivityMessage } from '../gamebus/types';
import { KITCHEN_DAY_LIVE_BLOCK_REASON, canPostKitchenDayToGameBus } from './liveIntegration';
import type {
  KitchenDayPortionEntry,
  KitchenDayRescueEntry,
  KitchenDayTrimEntry,
} from './types';

export function tryPostKitchenDayActivity(
  message: ActivityMessage,
): { ok: true } | { ok: false; reason: string } {
  if (!canPostKitchenDayToGameBus()) {
    return { ok: false, reason: KITCHEN_DAY_LIVE_BLOCK_REASON };
  }
  window.parent.postMessage(message, '*');
  return { ok: true };
}

export function tryPostKitchenDayTrim(entry: KitchenDayTrimEntry) {
  return tryPostKitchenDayActivity(buildKitchenDayTrimSmartActivityMessage(entry));
}

export function tryPostKitchenDayRescue(entry: KitchenDayRescueEntry) {
  return tryPostKitchenDayActivity(buildRescueAndReuseActivityMessage(entry));
}

export function tryPostKitchenDayPortion(entry: KitchenDayPortionEntry) {
  return tryPostKitchenDayActivity(buildPortionPrecisionActivityMessage(entry));
}
