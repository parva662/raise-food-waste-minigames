import type { GameBusInputCollectionsPayload } from '../gamebus/types';
import { CANTEEN_CONFIG } from '../config/canteen';
import { buildAllFixtureDailyServiceResults } from './adapters/fixtureCalculationSource';
import {
  buildGroupDailyServiceResults,
  getGroupResultServiceDates,
} from './adapters/groupCalculationSource';
import {
  aggregateCustomerWeightedRates,
  buildParticipantProgressPeriodView,
  buildProgressPeriodComparison,
  formatProgressPeriodRange,
  getCalendarMonthRangeContaining,
  getCalendarWeekRangeContaining,
  getCalendarYearRangeContaining,
  getPreviousCalendarMonthRange,
  getPreviousCalendarWeekRange,
  getPreviousCalendarYearRange,
  getCalendarWeekMondaysForMonth,
  staffResultToProgressPoint,
  type ParticipantProgressServicePoint,
  type ProgressChartBucket,
  type ProgressPeriodTab,
  type ProgressPeriodView,
} from './participantProgressData';
import {
  shortageRateGramsPerCustomer,
  surplusRateGramsPerCustomer,
} from './teamComparison';
import type { StaffDailyResult } from './types';

const OPERATIONAL_TIMEZONE = CANTEEN_CONFIG.timezone;

export type ManagementTrendPoint = ParticipantProgressServicePoint & {
  userId: string;
  userName: string;
};

export type ServiceTeamOverview = {
  staffParticipating: number;
  medianSurplusRateGramsPerCustomer: number | null;
  medianShortageRateGramsPerCustomer: number | null;
  medianCustomerForecastError: number | null;
};

export type StaffPeriodSummary = {
  userId: string;
  userName: string;
  servicesParticipated: number;
  surplusRateGramsPerCustomer: number | null;
  shortageRateGramsPerCustomer: number | null;
  meanCustomerForecastAbsoluteError: number;
};

export type ManagementPeriodSummary = {
  teamSurplusRateGramsPerCustomer: number | null;
  teamShortageRateGramsPerCustomer: number | null;
  meanCustomerForecastAbsoluteError: number;
  completedServices: number;
  staffForecastsEvaluated: number;
  buckets: readonly ProgressChartBucket[];
  comparison: ReturnType<typeof buildProgressPeriodComparison>;
};

export type ManagementPeriodView = {
  summary: ManagementPeriodSummary;
  staffSummaries: readonly StaffPeriodSummary[];
  emptyMessage: string | null;
  periodTitle: string;
  periodRangeLabel: string;
  previousPeriodTitle: string;
  interpretationMessage: string | null;
};

function calendarUtcInstant(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function parseIsoParts(isoDate: string): { year: number; month: number; day: number } {
  const [year, month, day] = isoDate.split('-').map(Number);
  return { year, month, day };
}

function shortWeekdayLabel(isoDate: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    timeZone: OPERATIONAL_TIMEZONE,
  }).format(calendarUtcInstant(isoDate));
}

function shortMonthLabel(month: number): string {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    timeZone: OPERATIONAL_TIMEZONE,
  }).format(new Date(Date.UTC(2026, month - 1, 1, 12, 0, 0)));
}

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

function isIsoDateWithinRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

function filterPointsInRange(
  points: readonly ManagementTrendPoint[],
  start: string,
  end: string,
  asOfServiceDate: string,
): ManagementTrendPoint[] {
  return points.filter(
    (point) =>
      point.serviceDate >= start && point.serviceDate <= end && point.serviceDate <= asOfServiceDate,
  );
}

export function staffResultToManagementPoint(result: StaffDailyResult): ManagementTrendPoint {
  return {
    ...staffResultToProgressPoint(result),
    userId: result.userId,
    userName: result.userName,
  };
}

export function buildManagementTrendPoints(
  asOfServiceDate: string,
  inputCollections?: GameBusInputCollectionsPayload | null,
): readonly ManagementTrendPoint[] {
  const points: ManagementTrendPoint[] = [];

  if (inputCollections !== undefined) {
    const dates = getGroupResultServiceDates(inputCollections).filter(
      (date) => date <= asOfServiceDate,
    );
    for (const date of dates) {
      const daily = buildGroupDailyServiceResults(inputCollections, date);
      if (!daily) continue;
      for (const result of daily.staffResults) {
        points.push(staffResultToManagementPoint(result));
      }
    }
  } else {
    for (const day of buildAllFixtureDailyServiceResults()) {
      if (day.serviceDate > asOfServiceDate) continue;
      for (const result of day.staffResults) {
        points.push(staffResultToManagementPoint(result));
      }
    }
  }

  return points.sort(
    (left, right) =>
      left.serviceDate.localeCompare(right.serviceDate) || left.userName.localeCompare(right.userName),
  );
}

export function buildServiceTeamOverview(
  staffResults: readonly StaffDailyResult[],
): ServiceTeamOverview {
  const surplusRates = staffResults
    .map(surplusRateGramsPerCustomer)
    .filter((value): value is number => value !== null);
  const shortageRates = staffResults
    .map(shortageRateGramsPerCustomer)
    .filter((value): value is number => value !== null);
  const customerErrors = staffResults.map((result) => result.customerForecastAbsoluteError);

  return {
    staffParticipating: staffResults.length,
    medianSurplusRateGramsPerCustomer: median(surplusRates),
    medianShortageRateGramsPerCustomer: median(shortageRates),
    medianCustomerForecastError:
      customerErrors.length > 0 ? median(customerErrors) : null,
  };
}

function buildTeamWeekBuckets(points: readonly ManagementTrendPoint[]): ProgressChartBucket[] {
  const grouped = new Map<string, ManagementTrendPoint[]>();
  for (const point of points) {
    const existing = grouped.get(point.serviceDate) ?? [];
    existing.push(point);
    grouped.set(point.serviceDate, existing);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([serviceDate, dayPoints]) => {
      const aggregate = aggregateCustomerWeightedRates(dayPoints);
      return {
        key: serviceDate,
        label: shortWeekdayLabel(serviceDate),
        serviceDates: [serviceDate],
        overproductionRateGramsPerCustomer: aggregate.overproductionRateGramsPerCustomer,
        shortageRateGramsPerCustomer: aggregate.shortageRateGramsPerCustomer,
        servicesCompleted: 1,
        meanCustomerForecastAbsoluteError: aggregate.meanCustomerForecastAbsoluteError,
      };
    });
}

function buildTeamMonthBuckets(
  points: readonly ManagementTrendPoint[],
  monthStart: string,
  monthEnd: string,
): ProgressChartBucket[] {
  const weekLabels = new Map<string, number>();
  for (const [index, weekMonday] of getCalendarWeekMondaysForMonth(monthStart, monthEnd).entries()) {
    weekLabels.set(weekMonday, index + 1);
  }

  const grouped = new Map<string, ManagementTrendPoint[]>();

  for (const point of points) {
    if (!isIsoDateWithinRange(point.serviceDate, monthStart, monthEnd)) continue;
    const weekMonday = getCalendarWeekRangeContaining(point.serviceDate).start;
    const existing = grouped.get(weekMonday) ?? [];
    existing.push(point);
    grouped.set(weekMonday, existing);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([weekMonday, bucketPoints]) => {
      const aggregate = aggregateCustomerWeightedRates(bucketPoints);
      const weekNumber = weekLabels.get(weekMonday);
      return {
        key: `week-${weekMonday}`,
        label: weekNumber ? `Week ${weekNumber}` : `Week ${weekMonday}`,
        serviceDates: [...new Set(bucketPoints.map((point) => point.serviceDate))],
        overproductionRateGramsPerCustomer: aggregate.overproductionRateGramsPerCustomer,
        shortageRateGramsPerCustomer: aggregate.shortageRateGramsPerCustomer,
        servicesCompleted: new Set(bucketPoints.map((point) => point.serviceDate)).size,
        meanCustomerForecastAbsoluteError: aggregate.meanCustomerForecastAbsoluteError,
      };
    });
}

function buildTeamYearBuckets(points: readonly ManagementTrendPoint[]): ProgressChartBucket[] {
  const grouped = new Map<number, ManagementTrendPoint[]>();

  for (const point of points) {
    const { month } = parseIsoParts(point.serviceDate);
    const existing = grouped.get(month) ?? [];
    existing.push(point);
    grouped.set(month, existing);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left - right)
    .map(([month, bucketPoints]) => {
      const aggregate = aggregateCustomerWeightedRates(bucketPoints);
      return {
        key: `month-${month}`,
        label: shortMonthLabel(month),
        serviceDates: [...new Set(bucketPoints.map((point) => point.serviceDate))],
        overproductionRateGramsPerCustomer: aggregate.overproductionRateGramsPerCustomer,
        shortageRateGramsPerCustomer: aggregate.shortageRateGramsPerCustomer,
        servicesCompleted: new Set(bucketPoints.map((point) => point.serviceDate)).size,
        meanCustomerForecastAbsoluteError: aggregate.meanCustomerForecastAbsoluteError,
      };
    });
}

function buildStaffPeriodSummaries(points: readonly ManagementTrendPoint[]): StaffPeriodSummary[] {
  const grouped = new Map<string, ManagementTrendPoint[]>();
  for (const point of points) {
    const existing = grouped.get(point.userId) ?? [];
    existing.push(point);
    grouped.set(point.userId, existing);
  }

  return [...grouped.values()]
    .map((userPoints) => {
      const aggregate = aggregateCustomerWeightedRates(userPoints);
      return {
        userId: userPoints[0]!.userId,
        userName: userPoints[0]!.userName,
        servicesParticipated: new Set(userPoints.map((point) => point.serviceDate)).size,
        surplusRateGramsPerCustomer: aggregate.overproductionRateGramsPerCustomer,
        shortageRateGramsPerCustomer: aggregate.shortageRateGramsPerCustomer,
        meanCustomerForecastAbsoluteError: aggregate.meanCustomerForecastAbsoluteError,
      };
    })
    .sort((left, right) => left.userName.localeCompare(right.userName));
}

function buildTeamPeriodSummary(
  currentPoints: readonly ManagementTrendPoint[],
  previousPoints: readonly ManagementTrendPoint[],
  tab: ProgressPeriodTab,
  monthStart: string,
  monthEnd: string,
): ManagementPeriodSummary {
  const currentAggregate = aggregateCustomerWeightedRates(currentPoints);
  const previousAggregate = aggregateCustomerWeightedRates(previousPoints);

  const buckets =
    tab === 'week'
      ? buildTeamWeekBuckets(currentPoints)
      : tab === 'month'
        ? buildTeamMonthBuckets(currentPoints, monthStart, monthEnd)
        : buildTeamYearBuckets(currentPoints);

  return {
    teamSurplusRateGramsPerCustomer: currentAggregate.overproductionRateGramsPerCustomer,
    teamShortageRateGramsPerCustomer: currentAggregate.shortageRateGramsPerCustomer,
    meanCustomerForecastAbsoluteError: currentAggregate.meanCustomerForecastAbsoluteError,
    completedServices: new Set(currentPoints.map((point) => point.serviceDate)).size,
    staffForecastsEvaluated: currentPoints.length,
    buckets,
    comparison: buildProgressPeriodComparison(currentAggregate, previousAggregate, tab),
  };
}

export function buildManagementPeriodView(
  points: readonly ManagementTrendPoint[],
  tab: ProgressPeriodTab,
  asOfServiceDate: string,
): ManagementPeriodView {
  const currentRange =
    tab === 'week'
      ? getCalendarWeekRangeContaining(asOfServiceDate)
      : tab === 'month'
        ? getCalendarMonthRangeContaining(asOfServiceDate)
        : getCalendarYearRangeContaining(asOfServiceDate);

  const previousRange =
    tab === 'week'
      ? getPreviousCalendarWeekRange(asOfServiceDate)
      : tab === 'month'
        ? getPreviousCalendarMonthRange(asOfServiceDate)
        : getPreviousCalendarYearRange(asOfServiceDate);

  const currentPoints = filterPointsInRange(
    points,
    currentRange.start,
    currentRange.end,
    asOfServiceDate,
  );
  const previousPoints = filterPointsInRange(
    points,
    previousRange.start,
    previousRange.end,
    asOfServiceDate,
  );

  const monthRange = getCalendarMonthRangeContaining(asOfServiceDate);
  const summary = buildTeamPeriodSummary(
    currentPoints,
    previousPoints,
    tab,
    monthRange.start,
    monthRange.end,
  );

  const periodTitle =
    tab === 'week'
      ? 'Week summary'
      : tab === 'month'
        ? `${shortMonthLabel(parseIsoParts(asOfServiceDate).month)} summary`
        : `${parseIsoParts(asOfServiceDate).year} summary`;

  const previousPeriodTitle =
    tab === 'week'
      ? 'Compared with previous week'
      : tab === 'month'
        ? 'Compared with previous month'
        : 'Compared with previous year';

  return {
    summary,
    staffSummaries: buildStaffPeriodSummaries(currentPoints),
    emptyMessage:
      currentPoints.length === 0
        ? `No completed forecasting results for this ${tab} yet.`
        : null,
    periodTitle,
    periodRangeLabel: formatProgressPeriodRange(currentRange.start, currentRange.end),
    previousPeriodTitle,
    interpretationMessage: summary.comparison.interpretationMessage,
  };
}

/** Re-export participant period view builder for regression parity tests only. */
export function buildParticipantPeriodViewForComparison(
  points: readonly ParticipantProgressServicePoint[],
  tab: ProgressPeriodTab,
  asOfServiceDate: string,
): ProgressPeriodView {
  return buildParticipantProgressPeriodView(points, tab, asOfServiceDate);
}
