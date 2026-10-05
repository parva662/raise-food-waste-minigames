import {
  extractGroupActivities,
  filterActivitiesByTemplateReference,
  getRawKitchenGroupActivitiesInput,
} from '@/platform/gamebus/groupActivities';
import type { GameBusInputCollectionsPayload } from '@/platform/gamebus/types';
import { parseGameBusChefForecastActivities } from '@/products/service-closeout/forecast/parseGameBusChefForecast';
import { selectForecastsForDate } from '@/products/service-closeout/forecast/selectCloseoutForecast';
import { aggregateWeeklyResults } from '@/products/forecast-results/calculations/aggregateWeeklyResults';
import { calculateDailyServiceResults } from '@/products/forecast-results/calculations/calculateDailyResults';
import type {
  ChefForecastForCalculation,
  DailyServiceResults,
  ServiceDayParticipation,
  StaffWeeklySummary,
} from '@/products/forecast-results/types';
import { gameBusChefForecastToCalculationInput } from '@/products/forecast-results/adapters/chefForecastAdapter';
import {
  parseGameBusWasteMeasurementActivities,
  selectWasteMeasurementForDate,
} from '@/products/forecast-results/adapters/parseGameBusWasteMeasurement';
import { gameBusWasteMeasurementToCalculationInput } from '@/products/forecast-results/adapters/wasteMeasurementAdapter';
import { addDaysToIsoDate } from '@/shared/time/dates';
import { parse } from 'date-fns';

const CHEF_FORECAST_TEMPLATE = 'chefForecast';
const WASTE_MEASUREMENT_TEMPLATE = 'wasteMeasurement';

type ParsedGroupKitchenActivities = {
  chefForecasts: ReturnType<typeof parseGameBusChefForecastActivities>['valid'];
  wasteMeasurements: ReturnType<typeof parseGameBusWasteMeasurementActivities>['valid'];
};

let groupKitchenActivityParseCount = 0;

/** Test hook: count calls to `parseGroupKitchenActivities`. */
export function resetGroupKitchenActivityParseCountForTests(): void {
  groupKitchenActivityParseCount = 0;
}

export function getGroupKitchenActivityParseCountForTests(): number {
  return groupKitchenActivityParseCount;
}

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

function parseGroupKitchenActivities(
  inputCollections: GameBusInputCollectionsPayload | null,
): ParsedGroupKitchenActivities {
  groupKitchenActivityParseCount += 1;
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

function getGroupResultServiceDatesFromParsed(
  parsed: ParsedGroupKitchenActivities,
): readonly string[] {
  const closeoutDates = new Set(parsed.wasteMeasurements.map((entry) => entry.serviceDate));
  const dates: string[] = [];

  for (const date of closeoutDates) {
    const forecastsForDate = selectForecastsForDate(parsed.chefForecasts, date);
    if (forecastsForDate.length > 0) {
      dates.push(date);
    }
  }

  return dates.sort();
}

function getParticipantGroupResultServiceDatesFromParsed(
  parsed: ParsedGroupKitchenActivities,
  authenticatedUserId: string,
): readonly string[] {
  if (!authenticatedUserId) return [];

  const closeoutDates = new Set(parsed.wasteMeasurements.map((entry) => entry.serviceDate));
  const dates: string[] = [];

  for (const date of closeoutDates) {
    const forecastsForDate = selectForecastsForDate(parsed.chefForecasts, date);
    if (forecastsForDate.some((forecast) => forecast.actorId === authenticatedUserId)) {
      dates.push(date);
    }
  }

  return dates.sort();
}

function buildGroupDailyServiceResultsFromParsed(
  parsed: ParsedGroupKitchenActivities,
  serviceDate: string,
): DailyServiceResults | null {
  const wasteMeasurement = selectWasteMeasurementForDate(parsed.wasteMeasurements, serviceDate);
  if (!wasteMeasurement) return null;

  const forecasts = selectForecastsForDate(parsed.chefForecasts, serviceDate)
    .map(gameBusChefForecastToCalculationInput)
    .filter((forecast): forecast is ChefForecastForCalculation => forecast !== null);

  if (forecasts.length === 0) return null;

  const closeout = gameBusWasteMeasurementToCalculationInput(wasteMeasurement);
  const participation = participationFromForecasts(serviceDate, forecasts);

  return calculateDailyServiceResults(closeout, participation, forecasts);
}

export type GroupKitchenCalculationCache = {
  getDailyServiceResults(serviceDate: string): DailyServiceResults | null;
  getGroupResultServiceDates(): readonly string[];
  getParticipantResultServiceDates(authenticatedUserId: string): readonly string[];
  hasCloseoutForDate(serviceDate: string): boolean;
  getParticipantEligibleForecastForDate(
    authenticatedUserId: string,
    serviceDate: string,
  ): ChefForecastForCalculation | null;
};

export function createGroupKitchenCalculationCache(
  inputCollections: GameBusInputCollectionsPayload | null,
): GroupKitchenCalculationCache {
  const parsed = parseGroupKitchenActivities(inputCollections);
  const dailyByDate = new Map<string, DailyServiceResults>();

  for (const date of getGroupResultServiceDatesFromParsed(parsed)) {
    const daily = buildGroupDailyServiceResultsFromParsed(parsed, date);
    if (daily) {
      dailyByDate.set(date, daily);
    }
  }

  return {
    getDailyServiceResults(serviceDate: string) {
      return dailyByDate.get(serviceDate) ?? null;
    },
    getGroupResultServiceDates() {
      return getGroupResultServiceDatesFromParsed(parsed);
    },
    getParticipantResultServiceDates(authenticatedUserId: string) {
      return getParticipantGroupResultServiceDatesFromParsed(parsed, authenticatedUserId);
    },
    hasCloseoutForDate(serviceDate: string) {
      return selectWasteMeasurementForDate(parsed.wasteMeasurements, serviceDate) !== null;
    },
    getParticipantEligibleForecastForDate(authenticatedUserId: string, serviceDate: string) {
      if (!authenticatedUserId) return null;
      const selected = selectForecastsForDate(parsed.chefForecasts, serviceDate).find(
        (forecast) => forecast.actorId === authenticatedUserId,
      );
      if (!selected) return null;
      return gameBusChefForecastToCalculationInput(selected);
    },
  };
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
  cache?: GroupKitchenCalculationCache | null,
): readonly string[] {
  if (cache) return cache.getGroupResultServiceDates();
  return getGroupResultServiceDatesFromParsed(parseGroupKitchenActivities(inputCollections));
}

/** Service dates where the authenticated participant has a valid forecast and a matching closeout. */
export function getParticipantGroupResultServiceDates(
  inputCollections: GameBusInputCollectionsPayload | null,
  authenticatedUserId: string,
  cache?: GroupKitchenCalculationCache | null,
): readonly string[] {
  if (!authenticatedUserId) return [];
  if (cache) return cache.getParticipantResultServiceDates(authenticatedUserId);
  return getParticipantGroupResultServiceDatesFromParsed(
    parseGroupKitchenActivities(inputCollections),
    authenticatedUserId,
  );
}

export function getLatestParticipantGroupResultDate(
  inputCollections: GameBusInputCollectionsPayload | null,
  authenticatedUserId: string,
): string | null {
  const dates = getParticipantGroupResultServiceDates(inputCollections, authenticatedUserId);
  if (dates.length === 0) return null;
  return dates[dates.length - 1]!;
}

export function buildGroupDailyServiceResults(
  inputCollections: GameBusInputCollectionsPayload | null,
  serviceDate: string,
  cache?: GroupKitchenCalculationCache | null,
): DailyServiceResults | null {
  if (cache) return cache.getDailyServiceResults(serviceDate);
  return buildGroupDailyServiceResultsFromParsed(
    parseGroupKitchenActivities(inputCollections),
    serviceDate,
  );
}

/** Closeout-only observed reality when no eligible staff forecasts exist for the date. */
export function buildGroupCloseoutOnlyResults(
  inputCollections: GameBusInputCollectionsPayload | null,
  serviceDate: string,
): DailyServiceResults | null {
  const { wasteMeasurements } = parseGroupKitchenActivities(inputCollections);
  const wasteMeasurement = selectWasteMeasurementForDate(wasteMeasurements, serviceDate);
  if (!wasteMeasurement) return null;

  const closeout = gameBusWasteMeasurementToCalculationInput(wasteMeasurement);
  return calculateDailyServiceResults(
    closeout,
    { targetDate: serviceDate, participantUserIds: [] },
    [],
  );
}

export function getGroupAdminServiceDates(
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

export type AdminServicePartialState =
  | { kind: 'complete'; dailyResults: DailyServiceResults }
  | { kind: 'closeout_only'; dailyResults: DailyServiceResults }
  | {
      kind: 'forecast_only';
      serviceDate: string;
      staffForecasts: readonly ChefForecastForCalculation[];
    }
  | { kind: 'empty'; serviceDate: string };

export function resolveAdminServicePartialState(
  inputCollections: GameBusInputCollectionsPayload | null,
  serviceDate: string,
): AdminServicePartialState {
  const { chefForecasts, wasteMeasurements } = parseGroupKitchenActivities(inputCollections);
  const wasteMeasurement = selectWasteMeasurementForDate(wasteMeasurements, serviceDate);
  const forecasts = selectForecastsForDate(chefForecasts, serviceDate)
    .map(gameBusChefForecastToCalculationInput)
    .filter((forecast): forecast is ChefForecastForCalculation => forecast !== null);

  if (wasteMeasurement && forecasts.length > 0) {
    const closeout = gameBusWasteMeasurementToCalculationInput(wasteMeasurement);
    const participation = participationFromForecasts(serviceDate, forecasts);
    return {
      kind: 'complete',
      dailyResults: calculateDailyServiceResults(closeout, participation, forecasts),
    };
  }

  if (wasteMeasurement) {
    const closeoutOnly = buildGroupCloseoutOnlyResults(inputCollections, serviceDate);
    if (closeoutOnly) {
      return { kind: 'closeout_only', dailyResults: closeoutOnly };
    }
  }

  if (forecasts.length > 0) {
    return { kind: 'forecast_only', serviceDate, staffForecasts: forecasts };
  }

  return { kind: 'empty', serviceDate };
}

export function hasGroupCloseoutForDate(
  inputCollections: GameBusInputCollectionsPayload | null,
  serviceDate: string,
  cache?: GroupKitchenCalculationCache | null,
): boolean {
  if (cache) return cache.hasCloseoutForDate(serviceDate);
  const { wasteMeasurements } = parseGroupKitchenActivities(inputCollections);
  return selectWasteMeasurementForDate(wasteMeasurements, serviceDate) !== null;
}

/** Eligible forecast for one authenticated actor on a target date, ignoring closeout presence. */
export function getParticipantEligibleForecastForDate(
  inputCollections: GameBusInputCollectionsPayload | null,
  authenticatedUserId: string,
  serviceDate: string,
  cache?: GroupKitchenCalculationCache | null,
): ChefForecastForCalculation | null {
  if (!authenticatedUserId) return null;
  if (cache) {
    return cache.getParticipantEligibleForecastForDate(authenticatedUserId, serviceDate);
  }
  const { chefForecasts } = parseGroupKitchenActivities(inputCollections);
  const selected = selectForecastsForDate(chefForecasts, serviceDate).find(
    (forecast) => forecast.actorId === authenticatedUserId,
  );
  if (!selected) return null;
  return gameBusChefForecastToCalculationInput(selected);
}

export function buildAllGroupDailyServiceResults(
  inputCollections: GameBusInputCollectionsPayload | null,
  cache?: GroupKitchenCalculationCache | null,
): DailyServiceResults[] {
  const resolvedCache = cache ?? createGroupKitchenCalculationCache(inputCollections);
  return resolvedCache
    .getGroupResultServiceDates()
    .map((date) => resolvedCache.getDailyServiceResults(date))
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

export type KitchenProgressSummary = {
  servicesCompletedCount: number;
  anonymousTeamAverageOverproductionGrams: number;
  scopeLabel: string;
};

export const EMPTY_KITCHEN_PROGRESS: KitchenProgressSummary = {
  servicesCompletedCount: 0,
  anonymousTeamAverageOverproductionGrams: 0,
  scopeLabel: 'This week',
};

export function buildGroupKitchenProgress(
  inputCollections: GameBusInputCollectionsPayload | null,
): KitchenProgressSummary {
  const days = buildAllGroupDailyServiceResults(inputCollections);
  return buildKitchenProgressFromDays(days, 'All time');
}

export function buildParticipantKitchenProgress(
  inputCollections: GameBusInputCollectionsPayload | null,
  userId: string,
  options?: {
    asOfServiceDate?: string;
    cache?: GroupKitchenCalculationCache | null;
  },
): KitchenProgressSummary {
  const cache = options?.cache ?? null;
  const participantDates = getParticipantGroupResultServiceDates(inputCollections, userId, cache);
  if (participantDates.length === 0) {
    return EMPTY_KITCHEN_PROGRESS;
  }

  if (!options?.asOfServiceDate) {
    const days = participantDates
      .map((date) => buildGroupDailyServiceResults(inputCollections, date, cache))
      .filter((result): result is DailyServiceResults => result !== null);
    return buildKitchenProgressFromDays(days, 'All time');
  }

  const scopedDates = filterParticipantDatesToCurrentWeek(
    participantDates,
    options.asOfServiceDate,
  );

  const days = scopedDates
    .map((date) => buildGroupDailyServiceResults(inputCollections, date, cache))
    .filter((result): result is DailyServiceResults => result !== null);

  return buildKitchenProgressFromDays(days, 'This week');
}

function getCalendarWeekRangeContaining(isoDate: string): { start: string; end: string } {
  const parsed = parse(isoDate, 'yyyy-MM-dd', new Date());
  const dayIndex = parsed.getDay();
  const daysFromMonday = dayIndex === 0 ? 6 : dayIndex - 1;
  const monday = addDaysToIsoDate(isoDate, -daysFromMonday);
  const sunday = addDaysToIsoDate(monday, 6);
  return { start: monday, end: sunday };
}

function filterParticipantDatesToCurrentWeek(
  participantDates: readonly string[],
  asOfServiceDate?: string,
): readonly string[] {
  if (!asOfServiceDate) return participantDates;
  const { start, end } = getCalendarWeekRangeContaining(asOfServiceDate);
  return participantDates.filter(
    (date) => date >= start && date <= end && date <= asOfServiceDate,
  );
}

export function anonymousTeamAverageOverproductionForDay(
  daily: DailyServiceResults,
): number {
  const teamTotal = daily.staffResults.reduce(
    (inner, result) => inner + result.totalSimulatedOverproductionGrams,
    0,
  );
  return teamTotal / Math.max(1, daily.staffResults.length);
}

function buildKitchenProgressFromDays(
  days: DailyServiceResults[],
  scopeLabel: string,
): KitchenProgressSummary {
  if (days.length === 0) {
    return { servicesCompletedCount: 0, anonymousTeamAverageOverproductionGrams: 0, scopeLabel };
  }

  const anonymousTeamAverageOverproductionGrams =
    days.reduce((sum, day) => {
      const teamTotal = day.staffResults.reduce(
        (inner, result) => inner + result.totalSimulatedOverproductionGrams,
        0,
      );
      return sum + teamTotal / Math.max(1, day.staffResults.length);
    }, 0) / days.length;

  return {
    servicesCompletedCount: days.length,
    anonymousTeamAverageOverproductionGrams,
    scopeLabel,
  };
}

export type GroupKitchenDiagnostics = {
  totalActivities: number;
  chefForecastActivityCount: number;
  validChefForecastCount: number;
  rejectedChefForecastCount: number;
  rejectedChefForecasts: readonly {
    activityId: string | null;
    reason: string;
    detail?: string;
  }[];
  wasteMeasurementActivityCount: number;
  validWasteMeasurementCount: number;
  rejectedWasteMeasurementCount: number;
  rejectedWasteMeasurements: readonly {
    activityId: string | null;
    reason: string;
    detail?: string;
  }[];
  forecastTargetDates: readonly string[];
  wasteServiceDates: readonly string[];
  calculableResultDates: readonly string[];
};

function formatRejectedDetail(
  reason: string,
  missingRefs?: readonly string[],
  invalidRefs?: readonly string[],
): string | undefined {
  if (missingRefs?.length) return `missing ${missingRefs.join(', ')}`;
  if (invalidRefs?.length) return `invalid ${invalidRefs.join(', ')}`;
  return reason;
}

export function buildGroupKitchenDiagnostics(
  inputCollections: GameBusInputCollectionsPayload | null,
): GroupKitchenDiagnostics {
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

  const chefParse = parseGameBusChefForecastActivities(chefForecastActivities);
  const wasteParse = parseGameBusWasteMeasurementActivities(wasteMeasurementActivities);

  const forecastTargetDates = [...new Set(chefParse.valid.map((forecast) => forecast.targetDate))].sort();
  const wasteServiceDates = [...new Set(wasteParse.valid.map((entry) => entry.serviceDate))].sort();
  const calculableResultDates = getGroupResultServiceDates(inputCollections);

  return {
    totalActivities: activities.length,
    chefForecastActivityCount: chefForecastActivities.length,
    validChefForecastCount: chefParse.valid.length,
    rejectedChefForecastCount: chefParse.rejected.length,
    rejectedChefForecasts: chefParse.rejected.map((entry) => ({
      activityId: entry.activityId,
      reason: entry.reason,
      detail: formatRejectedDetail(entry.reason, entry.missingRefs, entry.invalidRefs),
    })),
    wasteMeasurementActivityCount: wasteMeasurementActivities.length,
    validWasteMeasurementCount: wasteParse.valid.length,
    rejectedWasteMeasurementCount: wasteParse.rejected.length,
    rejectedWasteMeasurements: wasteParse.rejected.map((entry) => ({
      activityId: entry.activityId,
      reason: entry.reason,
      detail: formatRejectedDetail(entry.reason, entry.missingRefs, entry.invalidRefs),
    })),
    forecastTargetDates,
    wasteServiceDates,
    calculableResultDates,
  };
}
