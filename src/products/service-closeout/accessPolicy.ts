/**
 * Authorization boundary for service closeout finalization.
 * Production should enforce that only authorized kitchen staff may finalize.
 */
export interface CloseoutAccessPolicy {
  /** Authenticated GameBus user id when available; null in standalone dev. */
  getCurrentUserId(): string | null;
  canFinalizeService(): boolean;
}
