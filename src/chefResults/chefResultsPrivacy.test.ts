import { describe, it, expect } from 'vitest';
import { buildFixtureDailyServiceResults } from './adapters/fixtureCalculationSource';
import { buildParticipantWeekSummary, findParticipantDailyResult } from './participantWeekData';
import {
  buildAnonymousTeamBenchmark,
  buildParticipantComparisonInsights,
  MIN_ANONYMOUS_COMPARISON_PARTICIPANTS,
} from './teamComparison';

describe('team comparison privacy utilities', () => {
  it('calculates anonymous team median from staff results', () => {
    const daily = buildFixtureDailyServiceResults('2026-07-27');
    expect(daily).not.toBeNull();
    const benchmark = buildAnonymousTeamBenchmark(daily!.staffResults);
    expect(benchmark.participantCount).toBe(3);
    expect(benchmark.overproductionMedianGrams).toBeGreaterThan(0);
    expect(benchmark.canShowRange).toBe(
      daily!.staffResults.length >= MIN_ANONYMOUS_COMPARISON_PARTICIPANTS,
    );
  });

  it('does not expose head chef separately in comparison insights', () => {
    const daily = buildFixtureDailyServiceResults('2026-07-27');
    const headChef = daily!.staffResults.find((result) => result.isHeadChef)!;
    const benchmark = buildAnonymousTeamBenchmark(daily!.staffResults);
    const insights = buildParticipantComparisonInsights(headChef, benchmark);
    expect(insights.overproductionMessage).not.toMatch(/head chef/i);
    expect(insights.shortageMessage).not.toMatch(/head chef/i);
  });
});

describe('participant week data', () => {
  it('includes only days the user participated', () => {
    const week = buildParticipantWeekSummary('fixture-user-a');
    expect(week.participatedServiceCount).toBe(3);
    expect(week.points.map((point) => point.serviceDate)).toEqual([
      '2026-07-27',
      '2026-07-29',
      '2026-07-30',
    ]);
  });

  it('does not treat absence as zero participation', () => {
    const week = buildParticipantWeekSummary('fixture-user-a');
    expect(week.points.some((point) => point.serviceDate === '2026-07-28')).toBe(false);
    expect(week.points.some((point) => point.serviceDate === '2026-07-31')).toBe(false);
  });
});

describe('category direction semantics', () => {
  it('participant daily result matches engine output exactly', () => {
    const daily = buildFixtureDailyServiceResults('2026-07-27');
    const own = findParticipantDailyResult('fixture-user-c', '2026-07-27');
    const engine = daily!.staffResults.find((result) => result.userId === 'fixture-user-c');
    expect(own).toEqual(engine);
  });
});
