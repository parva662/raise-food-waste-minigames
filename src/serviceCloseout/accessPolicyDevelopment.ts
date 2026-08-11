import type { CloseoutAccessPolicy } from './accessPolicy';

/**
 * Development-only access policy — allows finalization without GameBus identity.
 * Replace with a production policy backed by authenticated GameBus user context.
 */
export const developmentCloseoutAccessPolicy: CloseoutAccessPolicy = {
  getCurrentUserId(): string | null {
    return 'fixture-user-dev-closeout';
  },
  canFinalizeService(): boolean {
    return true;
  },
};
