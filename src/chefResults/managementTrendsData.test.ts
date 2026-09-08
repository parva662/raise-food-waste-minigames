import { describe, expect, it } from 'vitest';
import { buildFixtureDailyServiceResults } from './adapters/fixtureCalculationSource';
import {
  buildManagementPeriodView,
  buildManagementTrendPoints,
  buildServiceTeamOverview,
  staffResultToManagementPoint,
} from './managementTrendsData';
import { aggregateCustomerWeightedRates } from './participantProgressData';

describe('managementTrendsData', () => {
  it('builds team trend points for all staff through as-of date', () => {
    const points = buildManagementTrendPoints('2026-07-29');
    expect(points.length).toBeGreaterThan(0);
    expect(points.every((point) => point.serviceDate <= '2026-07-29')).toBe(true);
    expect(new Set(points.map((point) => point.userId)).size).toBeGreaterThan(1);
  });

  it('excludes data after the selected as-of service date', () => {
    const through29 = buildManagementTrendPoints('2026-07-29');
    const through31 = buildManagementTrendPoints('2026-07-31');
    expect(through31.length).toBeGreaterThan(through29.length);
    expect(through29.every((point) => point.serviceDate <= '2026-07-29')).toBe(true);
  });

  it('aggregates team rates with customer weighting across staff-service results', () => {
    const points = buildManagementTrendPoints('2026-07-31');
    const weekView = buildManagementPeriodView(points, 'week', '2026-07-31');
    const weekPoints = points.filter(
      (point) => point.serviceDate >= '2026-07-27' && point.serviceDate <= '2026-07-31',
    );
    const aggregate = aggregateCustomerWeightedRates(weekPoints);
    expect(weekView.summary.teamSurplusRateGramsPerCustomer).toBe(
      aggregate.overproductionRateGramsPerCustomer,
    );
    expect(weekView.summary.staffForecastsEvaluated).toBeGreaterThan(0);
    expect(weekView.summary.completedServices).toBeGreaterThan(0);
    expect(JSON.stringify(weekView)).not.toMatch(/Infinity|NaN/);
  });

  it('builds per-staff customer-weighted period summaries', () => {
    const points = buildManagementTrendPoints('2026-07-31');
    const view = buildManagementPeriodView(points, 'year', '2026-07-31');
    const boris = view.staffSummaries.find((staff) => staff.userName === 'Boris Lindström');
    expect(boris).toBeDefined();
    expect(boris!.servicesParticipated).toBeGreaterThan(1);
    const borisPoints = points.filter((point) => point.userId === boris!.userId);
    const aggregate = aggregateCustomerWeightedRates(borisPoints);
    expect(boris!.surplusRateGramsPerCustomer).toBe(aggregate.overproductionRateGramsPerCustomer);
  });

  it('computes service team overview medians excluding null normalized rates', () => {
    const daily = buildFixtureDailyServiceResults('2026-07-31')!;
    const overview = buildServiceTeamOverview(daily.staffResults);
    expect(overview.staffParticipating).toBe(daily.staffResults.length);
    expect(overview.medianSurplusRateGramsPerCustomer).not.toBeNull();
    expect(overview.medianCustomerForecastError).not.toBeNull();
  });

  it('retains legitimate zero surplus rates in team overview', () => {
    const daily = buildFixtureDailyServiceResults('2026-07-31')!;
    const zeroResult = {
      ...daily.staffResults[0]!,
      actualCustomers: 100,
      totalSimulatedOverproductionGrams: 0,
      totalSimulatedShortageGrams: 0,
    };
    const overview = buildServiceTeamOverview([zeroResult]);
    expect(overview.medianSurplusRateGramsPerCustomer).toBe(0);
  });

  it('maps staff results to management points with unavailable normalization when customers are zero', () => {
    const daily = buildFixtureDailyServiceResults('2026-07-31')!;
    const point = staffResultToManagementPoint({
      ...daily.staffResults[0]!,
      actualCustomers: 0,
    });
    expect(point.simulatedOverproductionGramsPerCustomer).toBeNull();
    expect(point.simulatedShortageGramsPerCustomer).toBeNull();
  });
});
