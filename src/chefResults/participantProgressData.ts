import { parse } from 'date-fns';
import type { GameBusInputCollectionsPayload } from '../gamebus/types';
import { CANTEEN_CONFIG } from '../config/canteen';
import { addDaysToIsoDate } from '../utils/dates';
import { buildAllFixtureDailyServiceResults } from './adapters/fixtureCalculationSource';
import {
  buildGroupDailyServiceResults,
  getParticipantGroupResultServiceDates,
} from './adapters/groupCalculationSource';
import type { StaffDailyResult } from './types';

const OPERATIONAL_TIMEZONE = CANTEEN_CONFIG.timezone;

export type ParticipantProgressServicePoint = {
  serviceDate: string;
  actualCustomers: number;
  simulatedOverproductionGrams: number;
  simulatedShortageGrams: number;
  simulatedOverproductionGramsPerCustomer: number | null;
  simulatedShortageGramsPerCustomer: number | null;
  customerForecastAbsoluteError: number;
};

export type ProgressPeriodTab = 'week' | 'month' | 'year';

export type ProgressChartBucket = {
  key: string;
  label: string;
  serviceDates: readonly string[];
  overproductionRateGramsPerCustomer: number | null;
  shortageRateGramsPerCustomer: number | null;
  servicesCompleted: number;
  meanCustomerForecastAbsoluteError: number;
};

export type ProgressPeriodComparison = {
  overproductionMessage: string | null;
  shortageMessage: string | null;
  noPreviousPeriodMessage: string | null;
};

export type ProgressPeriodSummary = {
  overproductionRateGramsPerCustomer: number | null;
  shortageRateGramsPerCustomer: number | null;
  meanCustomerForecastAbsoluteError: number;
  servicesCompleted: number;
  buckets: readonly ProgressChartBucket[];
  comparison: ProgressPeriodComparison;
};

export type ProgressPeriodView = {
  summary: ProgressPeriodSummary;
  emptyMessage: string | null;
};

function calendarUtcInstant(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function parseIsoParts(isoDate: string): { year: number; month: number; day: number } {
  const [year, month, day] = isoDate.split('-').map(Number);
  return { year, month, day };
}

function formatIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function staffResultToProgressPoint(result: StaffDailyResult): ParticipantProgressServicePoint {
  const actualCustomers = result.actualCustomers;
  const overPerCustomer =
    actualCustomers > 0 ? result.totalSimulatedOverproductionGrams / actualCustomers : null;
  const shortPerCustomer =
    actualCustomers > 0 ? result.totalSimulatedShortageGrams / actualCustomers : null;

  return {
    serviceDate: result.serviceDate,
    actualCustomers,
    simulatedOverproductionGrams: result.totalSimulatedOverproductionGrams,
    simulatedShortageGrams: result.totalSimulatedShortageGrams,
    simulatedOverproductionGramsPerCustomer: overPerCustomer,
    simulatedShortageGramsPerCustomer: shortPerCustomer,
    customerForecastAbsoluteError: result.customerForecastAbsoluteError,
  };
}

export function buildParticipantProgressServicePoints(
  userId: string,
  asOfServiceDate: string,
  inputCollections?: GameBusInputCollectionsPayload | null,
): readonly ParticipantProgressServicePoint[] {
  const points: ParticipantProgressServicePoint[] = [];

  if (inputCollections !== undefined) {
    const participantDates = getParticipantGroupResultServiceDates(inputCollections, userId).filter(
      (date) => date <= asOfServiceDate,
    );
    for (const date of participantDates) {
      const daily = buildGroupDailyServiceResults(inputCollections, date);
      const own = daily?.staffResults.find((result) => result.userId === userId);
      if (own) {
        points.push(staffResultToProgressPoint(own));
      }
    }
  } else {
    for (const day of buildAllFixtureDailyServiceResults()) {
      if (day.serviceDate > asOfServiceDate) continue;
      const own = day.staffResults.find((result) => result.userId === userId);
      if (own) {
        points.push(staffResultToProgressPoint(own));
      }
    }
  }

  return points.sort((left, right) => left.serviceDate.localeCompare(right.serviceDate));
}

export function getCalendarWeekRangeContaining(isoDate: string): { start: string; end: string } {
  const parsed = parse(isoDate, 'yyyy-MM-dd', new Date());
  const dayIndex = parsed.getDay();
  const daysFromMonday = dayIndex === 0 ? 6 : dayIndex - 1;
  const monday = addDaysToIsoDate(isoDate, -daysFromMonday);
  const sunday = addDaysToIsoDate(monday, 6);
  return { start: monday, end: sunday };
}

export function getPreviousCalendarWeekRange(isoDate: string): { start: string; end: string } {
  const { start } = getCalendarWeekRangeContaining(isoDate);
  return getCalendarWeekRangeContaining(addDaysToIsoDate(start, -1));
}

export function getCalendarMonthRangeContaining(isoDate: string): { start: string; end: string } {
  const { year, month } = parseIsoParts(isoDate);
  const lastDay = new Date(year, month, 0).getDate();
  return {
    start: formatIsoDate(year, month, 1),
    end: formatIsoDate(year, month, lastDay),
  };
}

export function getPreviousCalendarMonthRange(isoDate: string): { start: string; end: string } {
  const { year, month } = parseIsoParts(isoDate);
  const previousMonth = month === 1 ? 12 : month - 1;
  const previousYear = month === 1 ? year - 1 : year;
  const lastDay = new Date(previousYear, previousMonth, 0).getDate();
  return {
    start: formatIsoDate(previousYear, previousMonth, 1),
    end: formatIsoDate(previousYear, previousMonth, lastDay),
  };
}

export function getCalendarYearRangeContaining(isoDate: string): { start: string; end: string } {
  const { year } = parseIsoParts(isoDate);
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

export function getPreviousCalendarYearRange(isoDate: string): { start: string; end: string } {
  const { year } = parseIsoParts(isoDate);
  const previousYear = year - 1;
  return { start: `${previousYear}-01-01`, end: `${previousYear}-12-31` };
}

function isIsoDateWithinRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

function filterPointsInRange(
  points: readonly ParticipantProgressServicePoint[],
  start: string,
  end: string,
  asOfServiceDate: string,
): ParticipantProgressServicePoint[] {
  return points.filter(
    (point) =>
      point.serviceDate >= start && point.serviceDate <= end && point.serviceDate <= asOfServiceDate,
  );
}

export function aggregateCustomerWeightedRates(points: readonly ParticipantProgressServicePoint[]): {
  overproductionRateGramsPerCustomer: number | null;
  shortageRateGramsPerCustomer: number | null;
  meanCustomerForecastAbsoluteError: number;
  servicesCompleted: number;
} {
  if (points.length === 0) {
    return {
      overproductionRateGramsPerCustomer: null,
      shortageRateGramsPerCustomer: null,
      meanCustomerForecastAbsoluteError: 0,
      servicesCompleted: 0,
    };
  }

  const valid = points.filter((point) => point.actualCustomers > 0);
  const totalCustomers = valid.reduce((sum, point) => sum + point.actualCustomers, 0);
  const totalOverproduction = valid.reduce(
    (sum, point) => sum + point.simulatedOverproductionGrams,
    0,
  );
  const totalShortage = valid.reduce((sum, point) => sum + point.simulatedShortageGrams, 0);

  return {
    overproductionRateGramsPerCustomer:
      totalCustomers > 0 ? totalOverproduction / totalCustomers : null,
    shortageRateGramsPerCustomer: totalCustomers > 0 ? totalShortage / totalCustomers : null,
    meanCustomerForecastAbsoluteError:
      points.reduce((sum, point) => sum + point.customerForecastAbsoluteError, 0) / points.length,
    servicesCompleted: points.length,
  };
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

function monthWeekBucketIndex(dayOfMonth: number): number {
  return Math.ceil(dayOfMonth / 7);
}

function buildWeekBuckets(points: readonly ParticipantProgressServicePoint[]): ProgressChartBucket[] {
  return points.map((point) => {
    const aggregate = aggregateCustomerWeightedRates([point]);
    return {
      key: point.serviceDate,
      label: shortWeekdayLabel(point.serviceDate),
      serviceDates: [point.serviceDate],
      overproductionRateGramsPerCustomer: aggregate.overproductionRateGramsPerCustomer,
      shortageRateGramsPerCustomer: aggregate.shortageRateGramsPerCustomer,
      servicesCompleted: 1,
      meanCustomerForecastAbsoluteError: point.customerForecastAbsoluteError,
    };
  });
}

function buildMonthBuckets(
  points: readonly ParticipantProgressServicePoint[],
  monthStart: string,
  monthEnd: string,
): ProgressChartBucket[] {
  const grouped = new Map<number, ParticipantProgressServicePoint[]>();

  for (const point of points) {
    if (!isIsoDateWithinRange(point.serviceDate, monthStart, monthEnd)) continue;
    const { day } = parseIsoParts(point.serviceDate);
    const bucketIndex = monthWeekBucketIndex(day);
    const existing = grouped.get(bucketIndex) ?? [];
    existing.push(point);
    grouped.set(bucketIndex, existing);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left - right)
    .map(([bucketIndex, bucketPoints]) => {
      const aggregate = aggregateCustomerWeightedRates(bucketPoints);
      return {
        key: `week-${bucketIndex}`,
        label: `Week ${bucketIndex}`,
        serviceDates: bucketPoints.map((point) => point.serviceDate),
        overproductionRateGramsPerCustomer: aggregate.overproductionRateGramsPerCustomer,
        shortageRateGramsPerCustomer: aggregate.shortageRateGramsPerCustomer,
        servicesCompleted: aggregate.servicesCompleted,
        meanCustomerForecastAbsoluteError: aggregate.meanCustomerForecastAbsoluteError,
      };
    });
}

function buildYearBuckets(points: readonly ParticipantProgressServicePoint[]): ProgressChartBucket[] {
  const grouped = new Map<number, ParticipantProgressServicePoint[]>();

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
        serviceDates: bucketPoints.map((point) => point.serviceDate),
        overproductionRateGramsPerCustomer: aggregate.overproductionRateGramsPerCustomer,
        shortageRateGramsPerCustomer: aggregate.shortageRateGramsPerCustomer,
        servicesCompleted: aggregate.servicesCompleted,
        meanCustomerForecastAbsoluteError: aggregate.meanCustomerForecastAbsoluteError,
      };
    });
}

export function buildProgressPeriodComparison(
  current: ReturnType<typeof aggregateCustomerWeightedRates>,
  previous: ReturnType<typeof aggregateCustomerWeightedRates>,
  periodLabel: 'week' | 'month' | 'year',
): ProgressPeriodComparison {
  const noPreviousPeriodMessage =
    previous.servicesCompleted === 0
      ? `No previous ${periodLabel} to compare yet.`
      : null;

  let overproductionMessage: string | null = null;
  if (
    previous.servicesCompleted > 0 &&
    previous.overproductionRateGramsPerCustomer !== null &&
    current.overproductionRateGramsPerCustomer !== null &&
    previous.overproductionRateGramsPerCustomer > 0
  ) {
    const improvementPercent =
      ((previous.overproductionRateGramsPerCustomer - current.overproductionRateGramsPerCustomer) /
        previous.overproductionRateGramsPerCustomer) *
      100;
    const rounded = Math.abs(improvementPercent).toFixed(0);
    if (improvementPercent > 0) {
      overproductionMessage = `↓ ${rounded}% simulated overproduction vs previous ${periodLabel}`;
    } else if (improvementPercent < 0) {
      overproductionMessage = `↑ ${rounded}% simulated overproduction vs previous ${periodLabel}`;
    } else {
      overproductionMessage = `Simulated overproduction unchanged vs previous ${periodLabel}`;
    }
  }

  let shortageMessage: string | null = null;
  if (
    previous.servicesCompleted > 0 &&
    previous.shortageRateGramsPerCustomer !== null &&
    current.shortageRateGramsPerCustomer !== null
  ) {
    const delta = current.shortageRateGramsPerCustomer - previous.shortageRateGramsPerCustomer;
    if (delta > 0) {
      shortageMessage = `↑ ${delta.toFixed(1)} g/customer vs previous ${periodLabel}`;
    } else if (delta < 0) {
      shortageMessage = `↓ ${Math.abs(delta).toFixed(1)} g/customer vs previous ${periodLabel}`;
    } else {
      shortageMessage = `Shortage risk unchanged vs previous ${periodLabel}`;
    }
  }

  return {
    overproductionMessage,
    shortageMessage,
    noPreviousPeriodMessage,
  };
}

function buildPeriodSummary(
  points: readonly ParticipantProgressServicePoint[],
  previousPoints: readonly ParticipantProgressServicePoint[],
  tab: ProgressPeriodTab,
  monthStart: string,
  monthEnd: string,
): ProgressPeriodSummary {
  const aggregate = aggregateCustomerWeightedRates(points);
  const previousAggregate = aggregateCustomerWeightedRates(previousPoints);

  const buckets =
    tab === 'week'
      ? buildWeekBuckets(points)
      : tab === 'month'
        ? buildMonthBuckets(points, monthStart, monthEnd)
        : buildYearBuckets(points);

  return {
    ...aggregate,
    buckets,
    comparison: buildProgressPeriodComparison(aggregate, previousAggregate, tab),
  };
}

export function buildParticipantProgressPeriodView(
  points: readonly ParticipantProgressServicePoint[],
  tab: ProgressPeriodTab,
  asOfServiceDate: string,
): ProgressPeriodView {
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
  const summary = buildPeriodSummary(
    currentPoints,
    previousPoints,
    tab,
    monthRange.start,
    monthRange.end,
  );

  const emptyMessage =
    currentPoints.length === 0
      ? `No completed forecast results for this ${tab}.`
      : null;

  return { summary, emptyMessage };
}

export function formatGramsPerCustomer(value: number | null): string {
  if (value === null) return '—';
  return `${value.toFixed(1)} g/customer`;
}

export function formatCustomerError(value: number): string {
  return `${value.toFixed(1)} customers`;
}
