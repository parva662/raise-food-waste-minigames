export const CANTEEN_CONFIG = {
  studentId: 'demo-student-001',
  timezone: 'Europe/Helsinki',
  onTimeDeadlineHour: 18,
  onTimeDeadlineMinute: 0,
  onTimeDeadlineSecond: 0,
  lateDeadlineHour: 23,
  lateDeadlineMinute: 0,
  lateDeadlineSecond: 0,
  basePoints: 20 as const,
  onTimeBonus: 5 as const,
  latePenalty: -5 as const,
  menuCycleStartDate: '2026-01-06',
  menuValidityStartDate: '2026-01-01',
  menuValidityEndDate: '2026-12-31',
  menuVersion: '2026-v1',
  menuCycleWeeks: 3,
} as const;

export type CanteenConfig = typeof CANTEEN_CONFIG;
