import { calculateObservedCategory } from './calculateObservedCategory';
import { calculateStaffCategorySimulation } from './calculateStaffCategorySimulation';
import type {
  ChefForecastForCalculation,
  CloseoutForCalculation,
  DailyServiceResults,
  ObservedServiceReality,
  ResultCategoryKey,
  ServiceDayParticipation,
  StaffDailyResult,
} from './types';
import { RESULT_CATEGORY_KEYS } from './types';

export function calculateCustomerForecastDifference(
  forecastCustomers: number,
  actualCustomers: number,
): number {
  return forecastCustomers - actualCustomers;
}

export function calculateCustomerForecastAbsoluteError(
  forecastCustomers: number,
  actualCustomers: number,
): number {
  return Math.abs(calculateCustomerForecastDifference(forecastCustomers, actualCustomers));
}

function buildObservedServiceReality(closeout: CloseoutForCalculation): ObservedServiceReality {
  return {
    serviceDate: closeout.targetDate,
    actualCustomers: closeout.actualCustomers,
    headChefUserId: closeout.headChefUserId,
    main: calculateObservedCategory(closeout.main),
    vegetarian: calculateObservedCategory(closeout.vegetarian),
    soup: calculateObservedCategory(closeout.soup),
    dessert: calculateObservedCategory(closeout.dessert),
  };
}

function sumCategoryGrams(
  result: StaffDailyResult,
  field: 'simulatedOverproductionGrams' | 'simulatedShortageGrams',
): number {
  return RESULT_CATEGORY_KEYS.reduce((total, key) => total + result[key][field], 0);
}

function evaluateStaffForecast(
  observed: ObservedServiceReality,
  forecast: ChefForecastForCalculation,
  isHeadChef: boolean,
): StaffDailyResult {
  const categories = Object.fromEntries(
    RESULT_CATEGORY_KEYS.map((key) => [
      key,
      calculateStaffCategorySimulation(observed[key], forecast[key]),
    ]),
  ) as Pick<StaffDailyResult, ResultCategoryKey>;

  const staffResult: StaffDailyResult = {
    serviceDate: observed.serviceDate,
    userId: forecast.userId,
    userName: forecast.userName,
    isHeadChef,
    forecastCustomers: forecast.forecastTotalCustomers,
    actualCustomers: observed.actualCustomers,
    customerForecastDifference: calculateCustomerForecastDifference(
      forecast.forecastTotalCustomers,
      observed.actualCustomers,
    ),
    customerForecastAbsoluteError: calculateCustomerForecastAbsoluteError(
      forecast.forecastTotalCustomers,
      observed.actualCustomers,
    ),
    ...categories,
    totalSimulatedOverproductionGrams: 0,
    totalSimulatedShortageGrams: 0,
  };

  staffResult.totalSimulatedOverproductionGrams = sumCategoryGrams(
    staffResult,
    'simulatedOverproductionGrams',
  );
  staffResult.totalSimulatedShortageGrams = sumCategoryGrams(staffResult, 'simulatedShortageGrams');

  return staffResult;
}

/**
 * Evaluates each participating staff forecast against one shared observed closeout.
 * Staff without a forecast on the date are omitted.
 */
export function calculateDailyServiceResults(
  closeout: CloseoutForCalculation,
  participation: ServiceDayParticipation,
  forecasts: readonly ChefForecastForCalculation[],
): DailyServiceResults {
  const observed = buildObservedServiceReality(closeout);
  const participantSet = new Set(participation.participantUserIds);

  const staffResults = forecasts
    .filter(
      (forecast) =>
        forecast.targetDate === closeout.targetDate && participantSet.has(forecast.userId),
    )
    .map((forecast) =>
      evaluateStaffForecast(
        observed,
        forecast,
        forecast.userId === participation.headChefUserId,
      ),
    )
    .sort((a, b) => a.userName.localeCompare(b.userName));

  return {
    serviceDate: closeout.targetDate,
    observed,
    staffResults,
  };
}
