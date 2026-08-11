/**
 * DEVELOPMENT FIXTURES ONLY — fictional kitchen staff for closeout UI and future calculation tests.
 * Not production data. Not sent to GameBus in this phase.
 */

export type FixtureKitchenStaffMember = {
  userId: string;
  displayName: string;
};

export const FIXTURE_KITCHEN_STAFF: readonly FixtureKitchenStaffMember[] = [
  { userId: 'fixture-user-a', displayName: 'Aino Virtanen' },
  { userId: 'fixture-user-b', displayName: 'Boris Lindström' },
  { userId: 'fixture-user-c', displayName: 'Camila Niemi' },
  { userId: 'fixture-user-d', displayName: 'Dmitri Koskinen' },
  { userId: 'fixture-user-e', displayName: 'Eeva Salo' },
] as const;

export type FixtureServiceDayStaff = {
  targetDate: string;
  participantUserIds: readonly string[];
  headChefUserId: string;
};

/**
 * Five consecutive weekday service dates with rotating participation and head chef.
 * Aligns with MENU_DATES.runtimeMonday … runtimeFriday in test fixtures.
 */
export const FIXTURE_SERVICE_DAY_STAFF: readonly FixtureServiceDayStaff[] = [
  {
    targetDate: '2026-07-27',
    participantUserIds: ['fixture-user-a', 'fixture-user-b', 'fixture-user-c'],
    headChefUserId: 'fixture-user-a',
  },
  {
    targetDate: '2026-07-28',
    participantUserIds: ['fixture-user-b', 'fixture-user-c', 'fixture-user-d'],
    headChefUserId: 'fixture-user-c',
  },
  {
    targetDate: '2026-07-29',
    participantUserIds: ['fixture-user-a', 'fixture-user-c', 'fixture-user-e'],
    headChefUserId: 'fixture-user-e',
  },
  {
    targetDate: '2026-07-30',
    participantUserIds: ['fixture-user-a', 'fixture-user-b', 'fixture-user-d', 'fixture-user-e'],
    headChefUserId: 'fixture-user-b',
  },
  {
    targetDate: '2026-07-31',
    participantUserIds: ['fixture-user-b', 'fixture-user-c', 'fixture-user-d'],
    headChefUserId: 'fixture-user-d',
  },
] as const;

export function getFixtureStaffDay(targetDate: string): FixtureServiceDayStaff | undefined {
  return FIXTURE_SERVICE_DAY_STAFF.find((day) => day.targetDate === targetDate);
}

export function getHeadChefOptionsForDate(targetDate: string): FixtureKitchenStaffMember[] {
  const day = getFixtureStaffDay(targetDate);
  if (!day) {
    return [...FIXTURE_KITCHEN_STAFF];
  }
  const idSet = new Set(day.participantUserIds);
  return FIXTURE_KITCHEN_STAFF.filter((member) => idSet.has(member.userId));
}

export function getStaffMemberById(userId: string): FixtureKitchenStaffMember | undefined {
  return FIXTURE_KITCHEN_STAFF.find((member) => member.userId === userId);
}
