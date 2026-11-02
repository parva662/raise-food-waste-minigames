/** Runtime lunch schedule configuration for generated demo menus. */
export const MENU_RUNTIME_SCHEDULE = {
  /** First weekday served by the React app (Monday). */
  runtimeStartDate: '2026-07-27',
  /**
   * Last weekday covered by cycled sample menus (inclusive).
   * Historical 1:1 remap still starts at runtimeStartDate; extension fills through this date.
   */
  runtimeEndDate: '2027-04-30',
  /**
   * First weekday of the cycle-extension period after the preserved historical block.
   * (2026-11-01 is Sunday — no service.)
   */
  extensionStartDate: '2026-11-02',
} as const;
