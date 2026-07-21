import type { ActiveDeclaration } from '../../types/declaration';
import { CANTEEN_CONFIG } from '../../config/canteen';
import { buildInitialQuantities } from '../../utils/declaration';
import { getFixtureMenuItems } from './menus';
import { FIXTURE_LUNCH_DATE, SUBMISSION_TIMES } from './dates';

export function createFixtureDeclaration(
  overrides: Partial<ActiveDeclaration> = {},
): ActiveDeclaration {
  const menuItems = getFixtureMenuItems();
  const quantities = buildInitialQuantities(menuItems);
  quantities['rice-with-sauce'] = 1;

  return {
    studentId: CANTEEN_CONFIG.studentId,
    lunchDate: FIXTURE_LUNCH_DATE,
    menuCycleWeek: 1,
    menuVersion: CANTEEN_CONFIG.menuVersion,
    noLunch: false,
    selections: [
      {
        itemId: 'rice-with-sauce',
        name: 'Rice with Sauce',
        quantity: 1,
        unit: 'portion',
      },
    ],
    timingStatus: 'on-time',
    basePoints: 20,
    timingAdjustment: 5,
    totalPoints: 25,
    submittedAt: SUBMISSION_TIMES.midday.toISOString(),
    updatedAt: SUBMISSION_TIMES.midday.toISOString(),
    includeInForecast: true,
    ...overrides,
  };
}

export function createLegacyFixtureDeclaration(): Record<string, unknown> {
  const declaration = createFixtureDeclaration();
  return {
    ...declaration,
    points: 5,
    basePoints: undefined,
    timingAdjustment: undefined,
    totalPoints: undefined,
  };
}
