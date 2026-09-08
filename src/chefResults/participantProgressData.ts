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

export type ProgressComparisonDimension = {
  label: string;
  direction: 'down' | 'up' | 'unchanged' | null;
  displayValue: string;
  detail?: string | null;
};

export type ProgressPeriodComparison = {
  overproductionMessage: string | null;
  shortageMessage: string | null;
  noPreviousPeriodMessage: string | null;
  surplusComparison: ProgressComparisonDimension | null;
  shortageComparison: ProgressComparisonDimension | null;
  customerErrorComparison: ProgressComparisonDimension | null;
  interpretationMessage: string | null;
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
  emptyHelper: string | null;
  periodTitle: string;
  periodRangeLabel: string;
  previousPeriodTitle: string;
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

/** Monday starts for each Monday–Sunday week intersecting a calendar month, in order. */
export function getCalendarWeekMondaysForMonth(
  monthStart: string,
  monthEnd: string,
): readonly string[] {
  const mondays: string[] = [];
  let weekMonday = getCalendarWeekRangeContaining(monthStart).start;

  while (true) {
    const weekEnd = addDaysToIsoDate(weekMonday, 6);
    if (weekMonday > monthEnd) break;
    if (weekEnd >= monthStart) {
      mondays.push(weekMonday);
    }
    if (weekEnd >= monthEnd) break;
    weekMonday = addDaysToIsoDate(weekMonday, 7);
  }

  return mondays;
}

function getMonthCalendarWeekLabelMap(
  monthStart: string,
  monthEnd: string,
): ReadonlyMap<string, number> {
  const labels = new Map<string, number>();
  for (const [index, weekMonday] of getCalendarWeekMondaysForMonth(monthStart, monthEnd).entries()) {
    labels.set(weekMonday, index + 1);
  }
  return labels;
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
  const weekLabels = getMonthCalendarWeekLabelMap(monthStart, monthEnd);
  const grouped = new Map<string, ParticipantProgressServicePoint[]>();

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

function shortDayMonthLabel(isoDate: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    timeZone: OPERATIONAL_TIMEZONE,
  }).format(calendarUtcInstant(isoDate));
}

export function formatProgressPeriodRange(start: string, end: string): string {
  const startParts = parseIsoParts(start);
  const endParts = parseIsoParts(end);
  if (startParts.month === endParts.month && startParts.year === endParts.year) {
    const monthName = new Intl.DateTimeFormat('en-GB', {
      month: 'long',
      timeZone: OPERATIONAL_TIMEZONE,
    }).format(calendarUtcInstant(start));
    return `${startParts.day}–${endParts.day} ${monthName}`;
  }
  return `${shortDayMonthLabel(start)} – ${shortDayMonthLabel(end)}`;
}

const PROGRESS_RATE_TOLERANCE = 0.1;
const PROGRESS_PERCENT_TOLERANCE = 5;

function ratesApproximatelyEqual(current: number, previous: number): boolean {
  if (Math.abs(current - previous) <= PROGRESS_RATE_TOLERANCE) return true;
  if (previous === 0) return current === 0;
  const percentChange = Math.abs(((current - previous) / previous) * 100);
  return percentChange <= PROGRESS_PERCENT_TOLERANCE;
}

function buildSurplusComparisonDimension(
  current: number | null,
  previous: number | null,
): ProgressComparisonDimension | null {
  if (previous === null && current === null) {
    return {
      label: 'Estimated surplus',
      direction: null,
      displayValue: 'No % comparison',
      detail: 'Surplus could not be normalized per customer for either period.',
    };
  }
  if (previous === null) {
    return {
      label: 'Estimated surplus',
      direction: null,
      displayValue: 'No % comparison',
      detail: 'Previous period surplus could not be normalized per customer.',
    };
  }
  if (current === null) {
    return {
      label: 'Estimated surplus',
      direction: null,
      displayValue: 'No % comparison',
      detail: 'Current period surplus could not be normalized per customer.',
    };
  }
  if (previous === 0) {
    return {
      label: 'Estimated surplus',
      direction: null,
      displayValue: 'No % comparison',
      detail:
        'Previous period surplus was 0.0 g/customer, so a percentage change cannot be calculated.',
    };
  }
  const improvementPercent = ((previous - current) / previous) * 100;
  if (ratesApproximatelyEqual(current, previous)) {
    return { label: 'Estimated surplus', direction: 'unchanged', displayValue: 'No change' };
  }
  const rounded = Math.abs(improvementPercent).toFixed(0);
  if (improvementPercent > 0) {
    return { label: 'Estimated surplus', direction: 'down', displayValue: `↓ ${rounded}%` };
  }
  return { label: 'Estimated surplus', direction: 'up', displayValue: `↑ ${rounded}%` };
}

function buildShortageComparisonDimension(
  current: number | null,
  previous: number | null,
): ProgressComparisonDimension | null {
  if (current === null || previous === null) return null;
  const delta = current - previous;
  if (Math.abs(delta) <= PROGRESS_RATE_TOLERANCE) {
    return { label: 'Estimated shortage', direction: 'unchanged', displayValue: 'No change' };
  }
  if (delta < 0) {
    return {
      label: 'Estimated shortage',
      direction: 'down',
      displayValue: `↓ ${Math.abs(delta).toFixed(1)} g/customer`,
    };
  }
  return {
    label: 'Estimated shortage',
    direction: 'up',
    displayValue: `↑ ${delta.toFixed(1)} g/customer`,
  };
}

function buildCustomerErrorComparisonDimension(
  current: number,
  previous: number,
): ProgressComparisonDimension | null {
  if (previous === 0 && current === 0) {
    return { label: 'Customer estimate error', direction: 'unchanged', displayValue: 'No change' };
  }
  const delta = current - previous;
  if (Math.abs(delta) <= 1) {
    return { label: 'Customer estimate error', direction: 'unchanged', displayValue: 'No change' };
  }
  if (delta < 0) {
    return {
      label: 'Customer estimate error',
      direction: 'down',
      displayValue: `↓ ${Math.abs(delta).toFixed(0)} customers`,
    };
  }
  return {
    label: 'Customer estimate error',
    direction: 'up',
    displayValue: `↑ ${delta.toFixed(0)} customers`,
  };
}

export function buildProgressPeriodInterpretation(
  current: ReturnType<typeof aggregateCustomerWeightedRates>,
  previous: ReturnType<typeof aggregateCustomerWeightedRates>,
  periodLabel: 'week' | 'month' | 'year',
): string | null {
  if (previous.servicesCompleted === 0) {
    return null;
  }

  const surplusComparable =
    previous.overproductionRateGramsPerCustomer !== null &&
    current.overproductionRateGramsPerCustomer !== null &&
    previous.overproductionRateGramsPerCustomer > 0;

  const shortageComparable =
    previous.shortageRateGramsPerCustomer !== null &&
    current.shortageRateGramsPerCustomer !== null;

  if (!surplusComparable && !shortageComparable) {
    return null;
  }

  let surplusLower = false;
  let surplusHigher = false;
  if (surplusComparable) {
    surplusLower =
      current.overproductionRateGramsPerCustomer! <
      previous.overproductionRateGramsPerCustomer! - PROGRESS_RATE_TOLERANCE;
    surplusHigher =
      current.overproductionRateGramsPerCustomer! >
      previous.overproductionRateGramsPerCustomer! + PROGRESS_RATE_TOLERANCE;
  }

  let shortageLower = false;
  let shortageHigher = false;
  if (shortageComparable) {
    shortageLower =
      current.shortageRateGramsPerCustomer! <
      previous.shortageRateGramsPerCustomer! - PROGRESS_RATE_TOLERANCE;
    shortageHigher =
      current.shortageRateGramsPerCustomer! >
      previous.shortageRateGramsPerCustomer! + PROGRESS_RATE_TOLERANCE;
  }

  if (surplusComparable) {
    if (!surplusLower && !surplusHigher && !shortageLower && !shortageHigher) {
      return `Forecast food outcomes were similar to the previous ${periodLabel}.`;
    }
    if (surplusLower && shortageLower) {
      return `Both estimated surplus and shortage decreased compared with the previous ${periodLabel}.`;
    }
    if (surplusLower && shortageHigher) {
      return 'Estimated surplus decreased, but estimated shortage increased.';
    }
    if (surplusHigher && shortageLower) {
      return 'Estimated shortage decreased, but estimated surplus increased.';
    }
    if (surplusHigher && shortageHigher) {
      return `Both estimated surplus and shortage increased compared with the previous ${periodLabel}.`;
    }
    if (surplusLower) {
      return `Estimated surplus decreased compared with the previous ${periodLabel}.`;
    }
    if (surplusHigher) {
      return `Estimated surplus increased compared with the previous ${periodLabel}.`;
    }
  }

  if (shortageLower && !shortageHigher) {
    return `Estimated shortage decreased compared with the previous ${periodLabel}.`;
  }
  if (shortageHigher && !shortageLower) {
    return `Estimated shortage increased compared with the previous ${periodLabel}.`;
  }
  if (!shortageLower && !shortageHigher) {
    return `Forecast food outcomes were similar to the previous ${periodLabel}.`;
  }
  return null;
}

function buildProgressCustomerInterpretation(
  current: ReturnType<typeof aggregateCustomerWeightedRates>,
  previous: ReturnType<typeof aggregateCustomerWeightedRates>,
): string | null {
  if (previous.servicesCompleted === 0) return null;
  const delta = current.meanCustomerForecastAbsoluteError - previous.meanCustomerForecastAbsoluteError;
  if (Math.abs(delta) <= 1) return null;
  if (delta < 0) {
    return 'Your average customer estimate was closer to actual attendance.';
  }
  return 'Your average customer estimate was further from actual attendance.';
}
export function buildProgressPeriodComparison(
  current: ReturnType<typeof aggregateCustomerWeightedRates>,
  previous: ReturnType<typeof aggregateCustomerWeightedRates>,
  periodLabel: 'week' | 'month' | 'year',
): ProgressPeriodComparison {
  const hasPreviousPeriod = previous.servicesCompleted > 0;

  const noPreviousPeriodMessage = hasPreviousPeriod
    ? null
    : `No previous ${periodLabel} to compare yet.`;

  const canCalculateSurplusPercent =
    hasPreviousPeriod &&
    current.overproductionRateGramsPerCustomer !== null &&
    previous.overproductionRateGramsPerCustomer !== null &&
    previous.overproductionRateGramsPerCustomer > 0;

  let overproductionMessage: string | null = null;
  if (canCalculateSurplusPercent) {
    const improvementPercent =
      ((previous.overproductionRateGramsPerCustomer! - current.overproductionRateGramsPerCustomer!) /
        previous.overproductionRateGramsPerCustomer!) *
      100;
    const rounded = Math.abs(improvementPercent).toFixed(0);
    if (improvementPercent > 0) {
      overproductionMessage = `↓ ${rounded}% estimated surplus vs previous ${periodLabel}`;
    } else if (improvementPercent < 0) {
      overproductionMessage = `↑ ${rounded}% estimated surplus vs previous ${periodLabel}`;
    } else {
      overproductionMessage = `Estimated surplus unchanged vs previous ${periodLabel}`;
    }
  }

  let shortageMessage: string | null = null;
  if (
    hasPreviousPeriod &&
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

  const surplusComparison = hasPreviousPeriod
    ? buildSurplusComparisonDimension(
        current.overproductionRateGramsPerCustomer,
        previous.overproductionRateGramsPerCustomer,
      )
    : null;
  const shortageComparison = hasPreviousPeriod
    ? buildShortageComparisonDimension(
        current.shortageRateGramsPerCustomer,
        previous.shortageRateGramsPerCustomer,
      )
    : null;
  const customerErrorComparison = hasPreviousPeriod
    ? buildCustomerErrorComparisonDimension(
        current.meanCustomerForecastAbsoluteError,
        previous.meanCustomerForecastAbsoluteError,
      )
    : null;

  let interpretationMessage = buildProgressPeriodInterpretation(current, previous, periodLabel);
  const customerInterpretation = buildProgressCustomerInterpretation(current, previous);
  if (customerInterpretation) {
    interpretationMessage = interpretationMessage
      ? `${interpretationMessage} ${customerInterpretation}`
      : customerInterpretation;
  }

  return {
    overproductionMessage,
    shortageMessage,
    noPreviousPeriodMessage,
    surplusComparison,
    shortageComparison,
    customerErrorComparison,
    interpretationMessage,
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
      ? `No completed forecast results for this ${tab} yet.`
      : null;

  const emptyHelper =
    currentPoints.length === 0
      ? 'Your trend will appear after a service you forecast has been closed.'
      : null;

  const periodTitle =
    tab === 'week'
      ? 'Week summary'
      : tab === 'month'
        ? `${shortMonthLabel(parseIsoParts(asOfServiceDate).month)} summary`
        : `${parseIsoParts(asOfServiceDate).year} summary`;

  const periodRangeLabel = formatProgressPeriodRange(currentRange.start, currentRange.end);

  const previousPeriodTitle =
    tab === 'week'
      ? 'Compared with previous week'
      : tab === 'month'
        ? 'Compared with previous month'
        : 'Compared with previous year';

  return {
    summary,
    emptyMessage,
    emptyHelper,
    periodTitle,
    periodRangeLabel,
    previousPeriodTitle,
  };
}

export function formatGramsPerCustomer(value: number | null): string {
  if (value === null) return '—';
  return `${value.toFixed(1)} g/customer`;
}

export function formatCustomerError(value: number): string {
  return `${value.toFixed(1)} customers`;
}

/** Buckets with a valid customer-normalized overproduction rate for chart rendering. */
export function getChartableProgressBuckets(
  buckets: readonly ProgressChartBucket[],
): ProgressChartBucket[] {
  return buckets.filter((bucket) => bucket.overproductionRateGramsPerCustomer !== null);
}
