export const CANTEEN_CONFIG = {
  studentId: 'demo-student-001',
  timezone: 'Europe/Helsinki',
  submissionDeadlineHour: 23,
  submissionDeadlineMinute: 0,
  submissionDeadlineSecond: 0,
  menuCycleStartDate: '2026-01-06',
  menuValidityStartDate: '2026-07-27',
  menuValidityEndDate: '2026-11-06',
  menuVersion: 'excel-dated-menu',
  menuCycleWeeks: 3,
} as const;

export type CanteenConfig = typeof CANTEEN_CONFIG;
