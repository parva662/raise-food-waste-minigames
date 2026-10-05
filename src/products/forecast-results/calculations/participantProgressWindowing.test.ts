import { describe, expect, it } from 'vitest';
import {
  buildDailyServiceChartBuckets,
  buildParticipantProgressPeriodView,
  filterParticipantProgressHistory,
  paginateParticipantProgressHistory,
  recentCompletedServicesLabel,
  takeRecentParticipantProgressPoints,
  type ParticipantProgressServicePoint,
} from '@/products/forecast-results/calculations/participantProgressData';

function point(serviceDate: string, over = 10, short = 2, error = 1): ParticipantProgressServicePoint {
  return {
    serviceDate,
    actualCustomers: 100,
    simulatedOverproductionGrams: over * 100,
    simulatedShortageGrams: short * 100,
    simulatedOverproductionGramsPerCustomer: over,
    simulatedShortageGramsPerCustomer: short,
    customerForecastAbsoluteError: error,
  };
}

describe('Forecast Progress windowing', () => {
  const many = Array.from({ length: 12 }, (_, index) => {
    const day = String(index + 1).padStart(2, '0');
    return point(`2026-09-${day}`, index + 1, 1, index);
  });

  it('Recent uses the last 8 completed services newest first', () => {
    const recent = takeRecentParticipantProgressPoints(many, 8);
    expect(recent).toHaveLength(8);
    expect(recent[0]?.serviceDate).toBe('2026-09-12');
    expect(recent[7]?.serviceDate).toBe('2026-09-05');
  });

  it('shows all available when fewer than 8 completed services exist', () => {
    const recent = takeRecentParticipantProgressPoints(many.slice(0, 3), 8);
    expect(recent).toHaveLength(3);
    expect(recentCompletedServicesLabel(recent)).toMatch(
      /^Last 3 completed services · 1 Sept? 2026 – 3 Sept? 2026$/,
    );
  });

  it('builds a bounded Recent daily chart (not lifetime raw)', () => {
    const recent = takeRecentParticipantProgressPoints(many, 8);
    const buckets = buildDailyServiceChartBuckets(
      [...recent].sort((left, right) => left.serviceDate.localeCompare(right.serviceDate)),
    );
    expect(buckets).toHaveLength(8);
    expect(buildDailyServiceChartBuckets(many).length).toBe(12);
  });

  it('filters History by date range newest first', () => {
    const filtered = filterParticipantProgressHistory(many, '2026-09-04', '2026-09-10');
    expect(filtered.map((item) => item.serviceDate)).toEqual([
      '2026-09-10',
      '2026-09-09',
      '2026-09-08',
      '2026-09-07',
      '2026-09-06',
      '2026-09-05',
      '2026-09-04',
    ]);
  });

  it('pages History at 10 rows per page', () => {
    const page1 = paginateParticipantProgressHistory(many, 1);
    const page2 = paginateParticipantProgressHistory(many, 2);
    expect(page1.pageItems).toHaveLength(10);
    expect(page2.pageItems).toHaveLength(2);
  });

  it('Trends still supports Week, Month, and Year calendar views', () => {
    const week = buildParticipantProgressPeriodView(many, 'week', '2026-09-12');
    const month = buildParticipantProgressPeriodView(many, 'month', '2026-09-12');
    const year = buildParticipantProgressPeriodView(many, 'year', '2026-09-12');
    expect(week.summary.servicesCompleted).toBeGreaterThan(0);
    expect(month.summary.buckets.length).toBeGreaterThan(0);
    expect(year.summary.buckets.length).toBe(1);
    expect(year.summary.buckets.length).toBeLessThanOrEqual(12);
  });
});
