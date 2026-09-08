import { describe, expect, it } from 'vitest';
import {
  KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY,
  KITCHEN_GROUP_INPUT_COLLECTION_KEY,
} from '../gamebus/groupActivities';
import { buildAnonymizedChefForecastActivity } from '../serviceCloseout/forecast/fixtures/gameBusChefForecastActivities';
import {
  aggregateCustomerWeightedRates,
  buildParticipantProgressPeriodView,
  buildParticipantProgressServicePoints,
  buildProgressPeriodComparison,
  getCalendarWeekRangeContaining,
  getCalendarWeekMondaysForMonth,
  getChartableProgressBuckets,
  getPreviousCalendarMonthRange,
  getPreviousCalendarWeekRange,
  getPreviousCalendarYearRange,
  staffResultToProgressPoint,
} from './participantProgressData';
import type { StaffDailyResult } from './types';

function staffResult(overrides: Partial<StaffDailyResult> = {}): StaffDailyResult {
  return {
    serviceDate: '2026-07-29',
    userId: 'user-a',
    userName: 'A',
    forecastCustomers: 150,
    actualCustomers: 150,
    customerForecastDifference: 0,
    customerForecastAbsoluteError: 0,
    main: {
      itemId: 'main',
      forecastQuantity: 100,
      portionWeightGrams: 350,
      forecastProductionWeightGrams: 35000,
      actualPreparedQuantity: 100,
      actualPreparedWeightGrams: 35000,
      measuredOverproductionGrams: 500,
      observedDemandWeightGrams: 34500,
      simulatedOverproductionGrams: 1000,
      simulatedShortageGrams: 0,
    },
    vegetarian: {
      itemId: 'veg',
      forecastQuantity: 50,
      portionWeightGrams: 350,
      forecastProductionWeightGrams: 17500,
      actualPreparedQuantity: 50,
      actualPreparedWeightGrams: 17500,
      measuredOverproductionGrams: 200,
      observedDemandWeightGrams: 17300,
      simulatedOverproductionGrams: 500,
      simulatedShortageGrams: 0,
    },
    soup: {
      itemId: 'soup',
      forecastQuantity: 40,
      portionWeightGrams: 300,
      forecastProductionWeightGrams: 12000,
      actualPreparedQuantity: 40,
      actualPreparedWeightGrams: 12000,
      measuredOverproductionGrams: 100,
      observedDemandWeightGrams: 11900,
      simulatedOverproductionGrams: 200,
      simulatedShortageGrams: 0,
    },
    dessert: {
      itemId: 'dessert',
      forecastQuantity: 30,
      portionWeightGrams: 200,
      forecastProductionWeightGrams: 6000,
      actualPreparedQuantity: 30,
      actualPreparedWeightGrams: 6000,
      measuredOverproductionGrams: 100,
      observedDemandWeightGrams: 5900,
      simulatedOverproductionGrams: 100,
      simulatedShortageGrams: 0,
    },
    totalSimulatedOverproductionGrams: 1800,
    totalSimulatedShortageGrams: 250,
    ...overrides,
  };
}

function wasteMeasurementActivity(serviceDate: string) {
  return {
    id: `wm-${serviceDate}`,
    template: { slug: 'wasteMeasurement', name: 'Waste measurement' },
    createdAt: `${serviceDate}T15:00:00.000Z`,
    properties: [
      { template: { slug: 'serviceDate' }, value: { value: serviceDate } },
      { template: { slug: 'actualCustomers' }, value: { value: 150 } },
      { template: { slug: 'mainItemId' }, value: { value: 'meatballs' } },
      { template: { slug: 'preparedMainQuantity' }, value: { value: 110 } },
      { template: { slug: 'vegetarianItemId' }, value: { value: 'quorn' } },
      { template: { slug: 'preparedVegetarianQuantity' }, value: { value: 52 } },
      { template: { slug: 'soupItemId' }, value: { value: 'pumpkin-soup' } },
      { template: { slug: 'preparedSoupQuantity' }, value: { value: 40 } },
      { template: { slug: 'dessertItemId' }, value: { value: 'apple-compote' } },
      { template: { slug: 'preparedDessertQuantity' }, value: { value: 35 } },
      { template: { slug: 'overproductionMeatKg' }, value: { value: 0.85 } },
      { template: { slug: 'overproductionVegetarianKg' }, value: { value: 0.36 } },
      { template: { slug: 'overproductionSoupKg' }, value: { value: 0.5 } },
      { template: { slug: 'overproductionDessertKg' }, value: { value: 0.18 } },
      { template: { slug: 'submittedAt' }, value: { value: `${serviceDate}T15:00:00.000Z` } },
    ],
  };
}

describe('participant progress calculations', () => {
  it('normalizes daily simulated overproduction per customer', () => {
    const point = staffResultToProgressPoint(staffResult());
    expect(point.simulatedOverproductionGramsPerCustomer).toBe(12);
  });

  it('normalizes daily simulated shortage per customer', () => {
    const point = staffResultToProgressPoint(staffResult());
    expect(point.simulatedShortageGramsPerCustomer).toBeCloseTo(250 / 150);
  });

  it('never divides by zero when actualCustomers is zero or negative', () => {
    const point = staffResultToProgressPoint(staffResult({ actualCustomers: 0 }));
    expect(point.simulatedOverproductionGramsPerCustomer).toBeNull();
    expect(point.simulatedShortageGramsPerCustomer).toBeNull();

    const aggregate = aggregateCustomerWeightedRates([point]);
    expect(aggregate.overproductionRateGramsPerCustomer).toBeNull();
    expect(aggregate.shortageRateGramsPerCustomer).toBeNull();
  });

  it('uses customer-weighted aggregation instead of averaging daily rates', () => {
    const dayA = staffResultToProgressPoint(
      staffResult({
        serviceDate: '2026-07-27',
        actualCustomers: 100,
        totalSimulatedOverproductionGrams: 1000,
        totalSimulatedShortageGrams: 0,
        customerForecastAbsoluteError: 4,
      }),
    );
    const dayB = staffResultToProgressPoint(
      staffResult({
        serviceDate: '2026-07-28',
        actualCustomers: 400,
        totalSimulatedOverproductionGrams: 2000,
        totalSimulatedShortageGrams: 0,
        customerForecastAbsoluteError: 8,
      }),
    );

    const aggregate = aggregateCustomerWeightedRates([dayA, dayB]);
    expect(aggregate.overproductionRateGramsPerCustomer).toBe(6);
    expect(aggregate.meanCustomerForecastAbsoluteError).toBe(6);
  });

  it('starts calendar weeks on Monday', () => {
    expect(getCalendarWeekRangeContaining('2026-07-29')).toEqual({
      start: '2026-07-27',
      end: '2026-08-02',
    });
    expect(getPreviousCalendarWeekRange('2026-07-29')).toEqual({
      start: '2026-07-20',
      end: '2026-07-26',
    });
  });

  it('handles month and year boundary ranges', () => {
    expect(getPreviousCalendarMonthRange('2026-01-15')).toEqual({
      start: '2025-12-01',
      end: '2025-12-31',
    });
    expect(getPreviousCalendarYearRange('2026-07-31')).toEqual({
      start: '2025-01-01',
      end: '2025-12-31',
    });
  });

  it('includes only participant completed exact-date pairs up to asOfServiceDate', () => {
    const inputCollections = {
      [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
        [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [
          buildAnonymizedChefForecastActivity({
            actorId: 'me-user',
            targetDate: '2026-07-29',
          }),
          buildAnonymizedChefForecastActivity({
            id: 'future',
            actorId: 'me-user',
            targetDate: '2026-08-01',
          }),
          wasteMeasurementActivity('2026-07-29'),
          wasteMeasurementActivity('2026-08-01'),
        ],
      },
    };

    const points = buildParticipantProgressServicePoints('me-user', '2026-07-29', inputCollections);
    expect(points.map((point) => point.serviceDate)).toEqual(['2026-07-29']);
  });

  it('excludes forecast-only and closeout-only dates for the participant', () => {
    const inputCollections = {
      [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
        [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [
          buildAnonymizedChefForecastActivity({
            actorId: 'me-user',
            targetDate: '2026-07-28',
          }),
          wasteMeasurementActivity('2026-07-29'),
        ],
      },
    };

    expect(buildParticipantProgressServicePoints('me-user', '2026-07-31', inputCollections)).toEqual([]);
  });

  it('builds week buckets for completed services only', () => {
    const points = buildParticipantProgressServicePoints('fixture-user-c', '2026-07-31');
    const week = buildParticipantProgressPeriodView(points, 'week', '2026-07-31');
    expect(week.summary.buckets.map((bucket) => bucket.label)).toEqual(['Mon', 'Tue', 'Wed', 'Fri']);
    expect(week.summary.buckets.some((bucket) => bucket.label === 'Thu')).toBe(false);
  });

  it('derives five Monday–Sunday calendar weeks for July 2026', () => {
    expect(getCalendarWeekMondaysForMonth('2026-07-01', '2026-07-31')).toEqual([
      '2026-06-29',
      '2026-07-06',
      '2026-07-13',
      '2026-07-20',
      '2026-07-27',
    ]);
  });

  it('aggregates month buckets by Monday–Sunday calendar weeks clipped to the month', () => {
    const points = [
      staffResultToProgressPoint(
        staffResult({
          serviceDate: '2026-07-27',
          actualCustomers: 100,
          totalSimulatedOverproductionGrams: 1000,
          customerForecastAbsoluteError: 2,
        }),
      ),
      staffResultToProgressPoint(
        staffResult({
          serviceDate: '2026-07-31',
          actualCustomers: 100,
          totalSimulatedOverproductionGrams: 1000,
          customerForecastAbsoluteError: 2,
        }),
      ),
      staffResultToProgressPoint(
        staffResult({
          serviceDate: '2026-08-01',
          actualCustomers: 100,
          totalSimulatedOverproductionGrams: 2000,
          customerForecastAbsoluteError: 4,
        }),
      ),
    ];

    expect(getCalendarWeekRangeContaining('2026-07-31')).toEqual({
      start: '2026-07-27',
      end: '2026-08-02',
    });
    expect(getCalendarWeekRangeContaining('2026-08-01')).toEqual({
      start: '2026-07-27',
      end: '2026-08-02',
    });

    const july = buildParticipantProgressPeriodView(points, 'month', '2026-07-31');
    expect(july.summary.servicesCompleted).toBe(2);
    expect(july.summary.buckets).toHaveLength(1);
    expect(july.summary.buckets[0]?.label).toBe('Week 5');
    expect(july.summary.buckets[0]?.serviceDates).toEqual(['2026-07-27', '2026-07-31']);
    expect(july.summary.overproductionRateGramsPerCustomer).toBe(10);

    const august = buildParticipantProgressPeriodView(points, 'month', '2026-08-01');
    expect(august.summary.servicesCompleted).toBe(1);
    expect(august.summary.buckets).toHaveLength(1);
    expect(august.summary.buckets[0]?.label).toBe('Week 1');
    expect(august.summary.buckets[0]?.serviceDates).toEqual(['2026-08-01']);
    expect(august.summary.overproductionRateGramsPerCustomer).toBe(20);
  });

  it('labels a lone July 31 result as Week 5 and does not render empty earlier weeks', () => {
    const points = [
      staffResultToProgressPoint(
        staffResult({
          serviceDate: '2026-07-31',
          actualCustomers: 100,
          totalSimulatedOverproductionGrams: 1000,
          customerForecastAbsoluteError: 2,
        }),
      ),
    ];

    const july = buildParticipantProgressPeriodView(points, 'month', '2026-07-31');
    expect(july.summary.buckets).toHaveLength(1);
    expect(july.summary.buckets[0]?.label).toBe('Week 5');
    expect(getChartableProgressBuckets(july.summary.buckets)).toHaveLength(1);
  });

  it('excludes invalid normalized values from chartable buckets but keeps completed services', () => {
    const points = [
      staffResultToProgressPoint(
        staffResult({
          serviceDate: '2026-07-27',
          actualCustomers: 0,
          totalSimulatedOverproductionGrams: 500,
        }),
      ),
      staffResultToProgressPoint(
        staffResult({
          serviceDate: '2026-07-28',
          actualCustomers: 100,
          totalSimulatedOverproductionGrams: 0,
        }),
      ),
    ];

    const week = buildParticipantProgressPeriodView(points, 'week', '2026-07-28');
    expect(week.summary.servicesCompleted).toBe(2);
    expect(getChartableProgressBuckets(week.summary.buckets)).toHaveLength(1);
    expect(getChartableProgressBuckets(week.summary.buckets)[0]?.overproductionRateGramsPerCustomer).toBe(
      0,
    );
  });

  it('aggregates year buckets by calendar month', () => {
    const points = buildParticipantProgressServicePoints('fixture-user-c', '2026-07-31');
    const year = buildParticipantProgressPeriodView(points, 'year', '2026-07-31');
    expect(year.summary.buckets.length).toBeGreaterThan(0);
    expect(year.summary.buckets.every((bucket) => bucket.label.length >= 3)).toBe(true);
  });

  it('calculates previous week comparison and handles missing previous period', () => {
    const current = aggregateCustomerWeightedRates([
      staffResultToProgressPoint(
        staffResult({ actualCustomers: 100, totalSimulatedOverproductionGrams: 700 }),
      ),
    ]);
    const previous = aggregateCustomerWeightedRates([
      staffResultToProgressPoint(
        staffResult({ actualCustomers: 100, totalSimulatedOverproductionGrams: 1000 }),
      ),
    ]);

    const comparison = buildProgressPeriodComparison(current, previous, 'week');
    expect(comparison.overproductionMessage).toBe('↓ 30% estimated surplus vs previous week');
    expect(comparison.noPreviousPeriodMessage).toBeNull();
    expect(comparison.surplusComparison?.displayValue).toBe('↓ 30%');
    expect(JSON.stringify(comparison)).not.toMatch(/Infinity|NaN/);

    const noPrevious = buildProgressPeriodComparison(current, aggregateCustomerWeightedRates([]), 'week');
    expect(noPrevious.overproductionMessage).toBeNull();
    expect(noPrevious.noPreviousPeriodMessage).toBe('No previous week to compare yet.');
  });

  it('shows surplus unavailable when previous normalized rate is zero but period exists', () => {
    const current = aggregateCustomerWeightedRates([
      staffResultToProgressPoint(
        staffResult({
          actualCustomers: 100,
          totalSimulatedOverproductionGrams: 200,
          totalSimulatedShortageGrams: 2000,
          customerForecastAbsoluteError: 20,
        }),
      ),
    ]);
    const previous = aggregateCustomerWeightedRates([
      staffResultToProgressPoint(
        staffResult({
          actualCustomers: 100,
          totalSimulatedOverproductionGrams: 0,
          totalSimulatedShortageGrams: 14000,
          customerForecastAbsoluteError: 50,
        }),
      ),
    ]);

    const comparison = buildProgressPeriodComparison(current, previous, 'month');
    expect(comparison.noPreviousPeriodMessage).toBeNull();
    expect(comparison.overproductionMessage).toBeNull();
    expect(comparison.surplusComparison?.displayValue).toBe('No % comparison');
    expect(comparison.surplusComparison?.detail).toMatch(/0\.0 g\/customer/);
    expect(comparison.shortageComparison?.displayValue).toBe('↓ 120.0 g/customer');
    expect(comparison.customerErrorComparison?.displayValue).toBe('↓ 30 customers');
    expect(comparison.interpretationMessage).toMatch(/shortage decreased/);
    expect(comparison.interpretationMessage).not.toMatch(/surplus increased/);
  });

  it('shows surplus unavailable when previous surplus cannot be normalized but period exists', () => {
    const current = aggregateCustomerWeightedRates([
      staffResultToProgressPoint(
        staffResult({ actualCustomers: 100, totalSimulatedOverproductionGrams: 500 }),
      ),
    ]);
    const previous = aggregateCustomerWeightedRates([
      staffResultToProgressPoint(
        staffResult({ actualCustomers: 0, totalSimulatedOverproductionGrams: 500 }),
      ),
    ]);

    const comparison = buildProgressPeriodComparison(current, previous, 'week');
    expect(comparison.overproductionMessage).toBeNull();
    expect(comparison.noPreviousPeriodMessage).toBeNull();
    expect(comparison.surplusComparison?.displayValue).toBe('No % comparison');
    expect(comparison.surplusComparison?.detail).toMatch(/could not be normalized/);
  });

  it('uses latest duplicate forecast per actor/date from embedded group data', () => {
    const serviceDate = '2026-07-29';
    const inputCollections = {
      [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
        [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [
          buildAnonymizedChefForecastActivity({
            id: 'old',
            actorId: 'me-user',
            targetDate: serviceDate,
            submittedAt: '2026-07-28T10:00:00.000Z',
            forecastTotalCustomers: 100,
          }),
          buildAnonymizedChefForecastActivity({
            id: 'new',
            actorId: 'me-user',
            targetDate: serviceDate,
            submittedAt: '2026-07-28T16:00:00.000Z',
            forecastTotalCustomers: 160,
          }),
          wasteMeasurementActivity(serviceDate),
        ],
      },
    };

    const points = buildParticipantProgressServicePoints('me-user', serviceDate, inputCollections);
    expect(points).toHaveLength(1);
    expect(points[0]?.customerForecastAbsoluteError).toBe(10);
  });
});
