import { FIXTURE_KITCHEN_STAFF } from '../serviceCloseout/fixtures/staffRotation';

/** Default fixture identity for participant results during development. */
export const DEFAULT_FIXTURE_CURRENT_USER_ID = 'fixture-user-c';

const STORAGE_KEY = 'chef-results-fixture-current-user-id';

/** Whether development-only fixture tooling (e.g. user selector) may render. */
export function isDevFixtureToolsEnabled(): boolean {
  return import.meta.env.DEV;
}

/**
 * Returns the active fixture user id for participant results.
 * Replace with authenticated GameBus actor id in a future phase.
 */
export function getFixtureCurrentUserId(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_FIXTURE_CURRENT_USER_ID;
  }
  const stored = window.sessionStorage.getItem(STORAGE_KEY);
  if (stored && FIXTURE_KITCHEN_STAFF.some((member) => member.userId === stored)) {
    return stored;
  }
  return DEFAULT_FIXTURE_CURRENT_USER_ID;
}

export function setFixtureCurrentUserId(userId: string): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(STORAGE_KEY, userId);
}

export function getFixtureCurrentUserDisplayName(): string {
  const userId = getFixtureCurrentUserId();
  return FIXTURE_KITCHEN_STAFF.find((member) => member.userId === userId)?.displayName ?? userId;
}
