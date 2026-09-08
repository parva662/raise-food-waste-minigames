import { describe, it, expect } from 'vitest';
import {
  buildAnonymousPeerBenchmark,
  buildParticipantPeerComparisonInsights,
  MIN_ANONYMOUS_PEER_COUNT,
  shortageRateGramsPerCustomer,
  surplusRateGramsPerCustomer,
} from './teamComparison';
import type { StaffCategorySimulation, StaffDailyResult } from './types';

function categorySimulation(
  simulatedOverproductionGrams: number,
  simulatedShortageGrams = 0,
): StaffCategorySimulation {
  return {
    itemId: 'main',
    forecastQuantity: 100,
    portionWeightGrams: 100,
    forecastProductionWeightGrams: 10000,
    actualPreparedQuantity: 100,
    actualPreparedWeightGrams: 10000,
    measuredOverproductionGrams: 0,
    observedDemandWeightGrams: 10000,
    simulatedOverproductionGrams,
    simulatedShortageGrams,
  };
}

function staffResult(overrides: Partial<StaffDailyResult> = {}): StaffDailyResult {
  const category = categorySimulation(0);
  const base: StaffDailyResult = {
    serviceDate: '2026-07-27',
    userId: 'you',
    userName: 'You',
    forecastCustomers: 100,
    actualCustomers: 100,
    customerForecastDifference: 0,
    customerForecastAbsoluteError: 0,
    main: category,
    vegetarian: { ...category, itemId: 'veg' },
    soup: { ...category, itemId: 'soup' },
    dessert: { ...category, itemId: 'dessert' },
    totalSimulatedOverproductionGrams: 100,
    totalSimulatedShortageGrams: 0,
  };

  return { ...base, ...overrides };
}

describe('buildAnonymousPeerBenchmark', () => {
  it('excludes the authenticated participant from peer median', () => {
    const participant = staffResult({
      userId: 'you',
      totalSimulatedOverproductionGrams: 100,
      actualCustomers: 100,
    });
    const peers = [
      staffResult({ userId: 'peer-a', totalSimulatedOverproductionGrams: 200, actualCustomers: 100 }),
      staffResult({ userId: 'peer-b', totalSimulatedOverproductionGrams: 300, actualCustomers: 100 }),
      staffResult({ userId: 'peer-c', totalSimulatedOverproductionGrams: 400, actualCustomers: 100 }),
    ];

    const benchmark = buildAnonymousPeerBenchmark([participant, ...peers], 'you');

    expect(benchmark.peerCount).toBe(3);
    expect(benchmark.peerOverproductionMedianGramsPerCustomer).toBe(3);
    expect(benchmark.participantOverproductionRateGramsPerCustomer).toBe(1);
  });

  it('requires at least three other staff before comparison is enabled', () => {
    const participant = staffResult({ userId: 'you' });
    const twoPeers = [
      staffResult({ userId: 'peer-a' }),
      staffResult({ userId: 'peer-b' }),
    ];

    const insufficient = buildAnonymousPeerBenchmark([participant, ...twoPeers], 'you');
    expect(insufficient.peerCount).toBe(2);
    expect(insufficient.canCompare).toBe(false);
    expect(MIN_ANONYMOUS_PEER_COUNT).toBe(3);

    const sufficient = buildAnonymousPeerBenchmark(
      [participant, ...twoPeers, staffResult({ userId: 'peer-c' })],
      'you',
    );
    expect(sufficient.peerCount).toBe(3);
    expect(sufficient.canCompare).toBe(true);
  });

  it('normalizes surplus and shortage to grams per customer', () => {
    const participant = staffResult({
      userId: 'you',
      totalSimulatedOverproductionGrams: 220,
      totalSimulatedShortageGrams: 30,
      actualCustomers: 100,
    });
    const peer = staffResult({
      userId: 'peer-a',
      totalSimulatedOverproductionGrams: 180,
      totalSimulatedShortageGrams: 50,
      actualCustomers: 100,
    });

    expect(surplusRateGramsPerCustomer(participant)).toBe(2.2);
    expect(shortageRateGramsPerCustomer(participant)).toBe(0.3);

    const benchmark = buildAnonymousPeerBenchmark(
      [
        participant,
        peer,
        staffResult({ userId: 'peer-b', totalSimulatedShortageGrams: 40, actualCustomers: 100 }),
        staffResult({ userId: 'peer-c', totalSimulatedShortageGrams: 60, actualCustomers: 100 }),
      ],
      'you',
    );
    expect(benchmark.peerOverproductionMedianGramsPerCustomer).toBeGreaterThan(0);
    expect(benchmark.peerShortageMedianGramsPerCustomer).toBeGreaterThan(0);
  });

  it('returns null rates when actualCustomers is zero or negative', () => {
    const invalid = staffResult({ actualCustomers: 0, totalSimulatedOverproductionGrams: 100 });
    expect(surplusRateGramsPerCustomer(invalid)).toBeNull();
    expect(shortageRateGramsPerCustomer(invalid)).toBeNull();
  });

  it('keeps customer forecast error in customer units', () => {
    const participant = staffResult({
      userId: 'you',
      customerForecastAbsoluteError: 20,
    });
    const peers = [
      staffResult({ userId: 'peer-a', customerForecastAbsoluteError: 27 }),
      staffResult({ userId: 'peer-b', customerForecastAbsoluteError: 30 }),
      staffResult({ userId: 'peer-c', customerForecastAbsoluteError: 24 }),
    ];

    const benchmark = buildAnonymousPeerBenchmark([participant, ...peers], 'you');
    expect(benchmark.participantCustomerError).toBe(20);
    expect(benchmark.peerCustomerErrorMedian).toBe(27);
  });
});

describe('buildParticipantPeerComparisonInsights', () => {
  it('returns readable customer peer comparison messages', () => {
    const participant = staffResult({
      userId: 'you',
      totalSimulatedOverproductionGrams: 220,
      actualCustomers: 100,
      customerForecastAbsoluteError: 20,
    });
    const peers = [
      staffResult({ userId: 'peer-a', totalSimulatedOverproductionGrams: 180, actualCustomers: 100, customerForecastAbsoluteError: 50 }),
      staffResult({ userId: 'peer-b', totalSimulatedOverproductionGrams: 180, actualCustomers: 100, customerForecastAbsoluteError: 50 }),
      staffResult({ userId: 'peer-c', totalSimulatedOverproductionGrams: 180, actualCustomers: 100, customerForecastAbsoluteError: 50 }),
    ];
    const benchmark = buildAnonymousPeerBenchmark([participant, ...peers], 'you');
    const insights = buildParticipantPeerComparisonInsights(participant, benchmark);

    expect(insights.overproductionMessage).toMatch(/above the other-staff median/);
    expect(insights.customerMessage).toMatch(/closer to actual attendance/);
  });

  it('returns no insights when peer threshold is not met', () => {
    const participant = staffResult({ userId: 'you' });
    const benchmark = buildAnonymousPeerBenchmark(
      [participant, staffResult({ userId: 'peer-a' }), staffResult({ userId: 'peer-b' })],
      'you',
    );
    const insights = buildParticipantPeerComparisonInsights(participant, benchmark);
    expect(insights.overproductionMessage).toBeNull();
    expect(insights.shortageMessage).toBeNull();
    expect(insights.customerMessage).toBeNull();
  });
});
