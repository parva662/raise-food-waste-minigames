import { resolveMealSlotsForDate } from '../../services/mealSlots';
import {
  FIXTURE_CHEF_FORECASTS,
  type FixtureChefForecastRecord,
} from '../../serviceCloseout/fixtures/chefForecastFixtures';
import { FIXTURE_NORMALIZED_CLOSEOUTS } from '../../serviceCloseout/fixtures/closeoutFixtures';
import {
  FIXTURE_SERVICE_DAY_STAFF,
  getFixtureStaffDay,
  getStaffMemberById,
} from '../../serviceCloseout/fixtures/staffRotation';
import { getPortionWeightGrams } from '../../serviceCloseout/portionWeight';
import type { CloseoutCategoryKey } from '../../serviceCloseout/types';
import { aggregateWeeklyResults } from '../aggregateWeeklyResults';
import { calculateDailyServiceResults } from '../calculateDailyResults';
import { closeoutToCalculationInput } from './closeoutAdapter';
import type {
  ChefForecastForCalculation,
  DailyServiceResults,
  ServiceDayParticipation,
  StaffWeeklySummary,
} from '../types';

function forecastRecordToCalculationInput(
  record: FixtureChefForecastRecord,
): ChefForecastForCalculation | null {
  const slots = resolveMealSlotsForDate(record.targetDate);
  const staff = getStaffMemberById(record.userId);
  if (!slots || !staff) return null;

  const categoryInput = (key: CloseoutCategoryKey, forecastQuantity: number) => ({
    itemId: slots[key].id,
    forecastQuantity,
    portionWeightGrams: getPortionWeightGrams(slots[key].id, key),
  });

  return {
    userId: record.userId,
    userName: staff.displayName,
    targetDate: record.targetDate,
    forecastTotalCustomers: record.expectedCustomers,
    main: categoryInput('main', record.mainQuantity),
    vegetarian: categoryInput('vegetarian', record.vegetarianQuantity),
    soup: categoryInput('soup', record.soupQuantity),
    dessert: categoryInput('dessert', record.dessertQuantity),
  };
}

function participationFromFixture(targetDate: string): ServiceDayParticipation | null {
  const day = getFixtureStaffDay(targetDate);
  if (!day) return null;
  return {
    targetDate: day.targetDate,
    participantUserIds: day.participantUserIds,
  };
}

export function getFixtureServiceDates(): readonly string[] {
  return FIXTURE_SERVICE_DAY_STAFF.map((day) => day.targetDate);
}

export function buildFixtureChefForecastsForCalculation(): ChefForecastForCalculation[] {
  return FIXTURE_CHEF_FORECASTS.map(forecastRecordToCalculationInput).filter(
    (forecast): forecast is ChefForecastForCalculation => forecast !== null,
  );
}

export function buildFixtureDailyServiceResults(serviceDate: string): DailyServiceResults | null {
  const closeout = FIXTURE_NORMALIZED_CLOSEOUTS.find((entry) => entry.targetDate === serviceDate);
  const participation = participationFromFixture(serviceDate);
  if (!closeout || !participation) return null;

  const forecasts = buildFixtureChefForecastsForCalculation();
  return calculateDailyServiceResults(
    closeoutToCalculationInput(closeout),
    participation,
    forecasts,
  );
}

export function buildAllFixtureDailyServiceResults(): DailyServiceResults[] {
  return getFixtureServiceDates()
    .map((date) => buildFixtureDailyServiceResults(date))
    .filter((result): result is DailyServiceResults => result !== null);
}

export function buildFixtureWeeklySummaries(): StaffWeeklySummary[] {
  const dailyStaffResults = buildAllFixtureDailyServiceResults().flatMap(
    (day) => day.staffResults,
  );
  return aggregateWeeklyResults(dailyStaffResults);
}
