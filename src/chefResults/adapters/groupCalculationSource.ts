import {
  extractGroupActivities,
  filterActivitiesByTemplateReference,
  getRawKitchenGroupActivitiesInput,
} from '../../gamebus/groupActivities';
import type { GameBusInputCollectionsPayload } from '../../gamebus/types';
import { parseGameBusChefForecastActivities } from '../../serviceCloseout/forecast/parseGameBusChefForecast';
import { selectForecastsForDate } from '../../serviceCloseout/forecast/selectCloseoutForecast';
import { aggregateWeeklyResults } from '../aggregateWeeklyResults';
import { calculateDailyServiceResults } from '../calculateDailyResults';
import type {
  ChefForecastForCalculation,
  DailyServiceResults,
  ServiceDayParticipation,
  StaffWeeklySummary,
} from '../types';
import { gameBusChefForecastToCalculationInput } from './chefForecastAdapter';
import {
  parseGameBusWasteMeasurementActivities,
  selectWasteMeasurementForDate,
} from './parseGameBusWasteMeasurement';
import { gameBusWasteMeasurementToCalculationInput } from './wasteMeasurementAdapter';

const CHEF_FORECAST_TEMPLATE = 'chefForecast';
const WASTE_MEASUREMENT_TEMPLATE = 'wasteMeasurement';

function participationFromForecasts(
  serviceDate: string,
  forecasts: readonly ChefForecastForCalculation[],
): ServiceDayParticipation {
  const participantUserIds = [
    ...new Set(
      forecasts.filter((forecast) => forecast.targetDate === serviceDate).map((f) => f.userId),
    ),
  ];
  return {
    targetDate: serviceDate,
    participantUserIds,
  };
}

function parseGroupKitchenActivities(inputCollections: GameBusInputCollectionsPayload | null) {
  const raw = getRawKitchenGroupActivitiesInput(inputCollections);
  const activities = extractGroupActivities(raw);
  const chefForecastActivities = filterActivitiesByTemplateReference(
    activities,
    CHEF_FORECAST_TEMPLATE,
  );
  const wasteMeasurementActivities = filterActivitiesByTemplateReference(
    activities,
    WASTE_MEASUREMENT_TEMPLATE,
  );

  const { valid: chefForecasts } = parseGameBusChefForecastActivities(chefForecastActivities);
  const { valid: wasteMeasurements } = parseGameBusWasteMeasurementActivities(
    wasteMeasurementActivities,
  );

  return { chefForecasts, wasteMeasurements };
}

export function buildChefForecastsForCalculationFromGroup(
  inputCollections: GameBusInputCollectionsPayload | null,
  serviceDate: string,
): ChefForecastForCalculation[] {
  const { chefForecasts } = parseGroupKitchenActivities(inputCollections);
  return selectForecastsForDate(chefForecasts, serviceDate)
    .map(gameBusChefForecastToCalculationInput)
    .filter((forecast): forecast is ChefForecastForCalculation => forecast !== null);
}

export function getGroupServiceDates(
  inputCollections: GameBusInputCollectionsPayload | null,
): readonly string[] {
  const { chefForecasts, wasteMeasurements } = parseGroupKitchenActivities(inputCollections);
  const dates = new Set<string>();

  for (const forecast of chefForecasts) {
    dates.add(forecast.targetDate);
  }
  for (const measurement of wasteMeasurements) {
    dates.add(measurement.serviceDate);
  }

  return [...dates].sort();
}

export function getGroupResultServiceDates(
  inputCollections: GameBusInputCollectionsPayload | null,
): readonly string[] {
  const { chefForecasts, wasteMeasurements } = parseGroupKitchenActivities(inputCollections);
  const closeoutDates = new Set(wasteMeasurements.map((entry) => entry.serviceDate));
  const dates: string[] = [];

  for (const date of closeoutDates) {
    const forecastsForDate = selectForecastsForDate(chefForecasts, date);
    if (forecastsForDate.length > 0) {
      dates.push(date);
    }
  }

  return dates.sort();
}

export function buildGroupDailyServiceResults(
  inputCollections: GameBusInputCollectionsPayload | null,
  serviceDate: string,
): DailyServiceResults | null {
  const { chefForecasts, wasteMeasurements } = parseGroupKitchenActivities(inputCollections);
  const wasteMeasurement = selectWasteMeasurementForDate(wasteMeasurements, serviceDate);
  if (!wasteMeasurement) return null;

  const forecasts = selectForecastsForDate(chefForecasts, serviceDate)
    .map(gameBusChefForecastToCalculationInput)
    .filter((forecast): forecast is ChefForecastForCalculation => forecast !== null);

  if (forecasts.length === 0) return null;

  const closeout = gameBusWasteMeasurementToCalculationInput(wasteMeasurement);
  const participation = participationFromForecasts(serviceDate, forecasts);

  return calculateDailyServiceResults(closeout, participation, forecasts);
}

export function buildAllGroupDailyServiceResults(
  inputCollections: GameBusInputCollectionsPayload | null,
): DailyServiceResults[] {
  return getGroupResultServiceDates(inputCollections)
    .map((date) => buildGroupDailyServiceResults(inputCollections, date))
    .filter((result): result is DailyServiceResults => result !== null);
}

export function buildGroupWeeklySummaries(
  inputCollections: GameBusInputCollectionsPayload | null,
): StaffWeeklySummary[] {
  const dailyStaffResults = buildAllGroupDailyServiceResults(inputCollections).flatMap(
    (day) => day.staffResults,
  );
  return aggregateWeeklyResults(dailyStaffResults);
}

export function getParticipantGroupResultServiceDates(
  inputCollections: GameBusInputCollectionsPayload | null,
  userId: string,
): readonly string[] {
  return buildAllGroupDailyServiceResults(inputCollections)
    .filter((day) => day.staffResults.some((result) => result.userId === userId))
    .map((day) => day.serviceDate)
    .sort();
}
