/**
 * Live GameBus ingest is blocked until Phase 0 admin alignment.
 * Target mappers still implement the approved contract.
 */
export const KITCHEN_DAY_LIVE_INTEGRATION_READY = false;

export const KITCHEN_DAY_LIVE_BLOCK_REASON =
  'LIVE E2E BLOCKED BY GAMEBUS ADMIN ALIGNMENT';

export function canPostKitchenDayToGameBus(): boolean {
  return KITCHEN_DAY_LIVE_INTEGRATION_READY;
}

export function assertKitchenDayLivePostAllowed(): void {
  if (!canPostKitchenDayToGameBus()) {
    throw new Error(KITCHEN_DAY_LIVE_BLOCK_REASON);
  }
}
