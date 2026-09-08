import { describe, it, expect } from 'vitest';
import { buildFixtureDailyServiceResults } from './adapters/fixtureCalculationSource';
import { buildParticipantProgressServicePoints } from './participantProgressData';
import { findParticipantDailyResult } from './participantWeekData';
import {
  buildAnonymousPeerBenchmark,
  buildParticipantPeerComparisonInsights,
  MIN_ANONYMOUS_PEER_COUNT,
} from './teamComparison';

describe('peer comparison privacy utilities', () => {
  it('calculates anonymous peer median excluding the participant', () => {
    const daily = buildFixtureDailyServiceResults('2026-07-27');
    expect(daily).not.toBeNull();
    const participant = daily!.staffResults[0]!;
    const benchmark = buildAnonymousPeerBenchmark(daily!.staffResults, participant.userId);
    expect(benchmark.peerCount).toBe(daily!.staffResults.length - 1);
    expect(benchmark.peerOverproductionMedianGramsPerCustomer).toBeGreaterThan(0);
    expect(benchmark.canCompare).toBe(
      benchmark.peerCount >= MIN_ANONYMOUS_PEER_COUNT,
    );
  });

  it('does not expose privileged role labels in comparison insights', () => {
    const daily = buildFixtureDailyServiceResults('2026-07-27');
    const participant = daily!.staffResults[0]!;
    const benchmark = buildAnonymousPeerBenchmark(daily!.staffResults, participant.userId);
    const insights = buildParticipantPeerComparisonInsights(participant, benchmark);
    if (insights.overproductionMessage) {
      expect(insights.overproductionMessage).not.toMatch(/head chef/i);
    }
    if (insights.shortageMessage) {
      expect(insights.shortageMessage).not.toMatch(/head chef/i);
    }
  });
});

describe('participant progress data', () => {
  it('includes only days the user participated', () => {
    const points = buildParticipantProgressServicePoints('fixture-user-a', '2026-07-31');
    expect(points).toHaveLength(3);
    expect(points.map((point) => point.serviceDate)).toEqual([
      '2026-07-27',
      '2026-07-29',
      '2026-07-30',
    ]);
  });

  it('does not treat absence as zero participation', () => {
    const points = buildParticipantProgressServicePoints('fixture-user-a', '2026-07-31');
    expect(points.some((point) => point.serviceDate === '2026-07-28')).toBe(false);
    expect(points.some((point) => point.serviceDate === '2026-07-31')).toBe(false);
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
