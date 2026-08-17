import { describe, it, expect } from 'vitest';
import { aggregateWeeklyResults } from './aggregateWeeklyResults';
import {
  buildAllFixtureDailyServiceResults,
  buildFixtureDailyServiceResults,
  buildFixtureWeeklySummaries,
} from './adapters/fixtureCalculationSource';
import {
  calculateCustomerForecastAbsoluteError,
  calculateCustomerForecastDifference,
  calculateDailyServiceResults,
} from './calculateDailyResults';
import { calculateObservedCategory } from './calculateObservedCategory';
import { simulateFromQuantities } from './calculateStaffCategorySimulation';
import type {
  ChefForecastForCalculation,
  CloseoutForCalculation,
  ServiceDayParticipation,
} from './types';

const baseCloseout: CloseoutForCalculation = {
  targetDate: '2026-07-27',
  actualCustomers: 176,
  main: {
    itemId: 'main-item',
    preparedQuantity: 10,
    portionWeightGrams: 120,
    overproductionGrams: 0,
  },
  vegetarian: {
    itemId: 'veg-item',
    preparedQuantity: 5,
    portionWeightGrams: 180,
    overproductionGrams: 0,
  },
  soup: {
    itemId: 'soup-item',
    preparedQuantity: 4,
    portionWeightGrams: 250,
    overproductionGrams: 0,
  },
  dessert: {
    itemId: 'dessert-item',
    preparedQuantity: 3,
    portionWeightGrams: 90,
    overproductionGrams: 45,
  },
};

const participation: ServiceDayParticipation = {
  targetDate: '2026-07-27',
  participantUserIds: ['fixture-user-a', 'fixture-user-b'],
};

function forecastFor(
  userId: string,
  userName: string,
  overrides: Partial<ChefForecastForCalculation> = {},
): ChefForecastForCalculation {
  return {
    userId,
    userName,
    targetDate: '2026-07-27',
    forecastTotalCustomers: 180,
    main: { itemId: 'main-item', forecastQuantity: 10, portionWeightGrams: 120 },
    vegetarian: { itemId: 'veg-item', forecastQuantity: 5, portionWeightGrams: 180 },
    soup: { itemId: 'soup-item', forecastQuantity: 4, portionWeightGrams: 250 },
    dessert: { itemId: 'dessert-item', forecastQuantity: 3, portionWeightGrams: 90 },
    ...overrides,
  };
}

describe('chef results calculation engine', () => {
  it('calculates actual prepared weight as quantity × portion weight', () => {
    const observed = calculateObservedCategory({
      itemId: 'main-item',
      preparedQuantity: 10,
      portionWeightGrams: 120,
      overproductionGrams: 0,
    });
    expect(observed.actualPreparedWeightGrams).toBe(1200);
  });

  it('calculates observed demand as prepared weight minus measured overproduction', () => {
    const observed = calculateObservedCategory({
      itemId: 'main-item',
      preparedQuantity: 10,
      portionWeightGrams: 120,
      overproductionGrams: 200,
    });
    expect(observed.observedDemandWeightGrams).toBe(1000);
  });

  it('returns zero simulated overproduction and shortage when forecast matches observed demand', () => {
    const result = simulateFromQuantities(10, 100, 0, 10);
    expect(result.observedDemandWeightGrams).toBe(1000);
    expect(result.forecastProductionWeightGrams).toBe(1000);
    expect(result.simulatedOverproductionGrams).toBe(0);
    expect(result.simulatedShortageGrams).toBe(0);
  });

  it('returns simulated overproduction only when forecast is above observed demand', () => {
    const result = simulateFromQuantities(10, 100, 0, 12);
    expect(result.simulatedOverproductionGrams).toBe(200);
    expect(result.simulatedShortageGrams).toBe(0);
  });

  it('returns simulated shortage only when forecast is below observed demand', () => {
    const result = simulateFromQuantities(10, 100, 0, 8);
    expect(result.simulatedOverproductionGrams).toBe(0);
    expect(result.simulatedShortageGrams).toBe(200);
  });

  it('calculates each category independently', () => {
    const daily = calculateDailyServiceResults(baseCloseout, participation, [
      forecastFor('fixture-user-a', 'Aino Virtanen'),
    ]);
    expect(daily.observed.main.observedDemandWeightGrams).toBe(1200);
    expect(daily.observed.vegetarian.observedDemandWeightGrams).toBe(900);
    expect(daily.staffResults[0].main.simulatedOverproductionGrams).toBe(0);
    expect(daily.staffResults[0].soup.simulatedOverproductionGrams).toBe(0);
  });

  it('calculates signed customer forecast difference', () => {
    expect(calculateCustomerForecastDifference(180, 176)).toBe(4);
    expect(calculateCustomerForecastDifference(170, 176)).toBe(-6);
  });

  it('calculates customer absolute error', () => {
    expect(calculateCustomerForecastAbsoluteError(180, 176)).toBe(4);
    expect(calculateCustomerForecastAbsoluteError(170, 176)).toBe(6);
  });

  it('evaluates multiple staff against identical observed reality', () => {
    const daily = calculateDailyServiceResults(baseCloseout, participation, [
      forecastFor('fixture-user-a', 'Aino Virtanen', {
        main: { itemId: 'main-item', forecastQuantity: 10, portionWeightGrams: 120 },
      }),
      forecastFor('fixture-user-b', 'Boris Lindström', {
        forecastTotalCustomers: 200,
        main: { itemId: 'main-item', forecastQuantity: 12, portionWeightGrams: 120 },
      }),
    ]);

    expect(daily.staffResults).toHaveLength(2);
    expect(daily.staffResults[0].main.observedDemandWeightGrams).toBe(
      daily.staffResults[1].main.observedDemandWeightGrams,
    );
    expect(daily.staffResults[0].main.simulatedOverproductionGrams).toBe(0);
    expect(daily.staffResults[1].main.simulatedOverproductionGrams).toBe(240);
    expect(daily.staffResults[0].actualCustomers).toBe(176);
    expect(daily.staffResults[1].actualCustomers).toBe(176);
  });

  it('evaluates each participating staff member independently', () => {
    const daily = calculateDailyServiceResults(baseCloseout, participation, [
      forecastFor('fixture-user-a', 'Aino Virtanen'),
      forecastFor('fixture-user-b', 'Boris Lindström'),
    ]);
    expect(daily.staffResults).toHaveLength(2);
    expect(daily.staffResults[0].main.observedDemandWeightGrams).toBe(
      daily.staffResults[1].main.observedDemandWeightGrams,
    );
  });

  it('does not evaluate staff absent on the service date', () => {
    const daily = calculateDailyServiceResults(baseCloseout, participation, [
      forecastFor('fixture-user-c', 'Camila Niemi'),
    ]);
    expect(daily.staffResults).toHaveLength(0);
  });

  it('aggregates weekly metrics across different participation counts', () => {
    const summaries = aggregateWeeklyResults([
      {
        serviceDate: '2026-07-27',
        userId: 'fixture-user-a',
        userName: 'Aino Virtanen',
        forecastCustomers: 180,
        actualCustomers: 176,
        customerForecastDifference: 4,
        customerForecastAbsoluteError: 4,
        main: simulateFromQuantities(10, 100, 0, 10, 'main'),
        vegetarian: simulateFromQuantities(5, 100, 0, 5, 'veg'),
        soup: simulateFromQuantities(4, 100, 0, 4, 'soup'),
        dessert: simulateFromQuantities(3, 100, 0, 3, 'dessert'),
        totalSimulatedOverproductionGrams: 0,
        totalSimulatedShortageGrams: 0,
      },
      {
        serviceDate: '2026-07-28',
        userId: 'fixture-user-a',
        userName: 'Aino Virtanen',
        forecastCustomers: 175,
        actualCustomers: 182,
        customerForecastDifference: -7,
        customerForecastAbsoluteError: 7,
        main: simulateFromQuantities(10, 100, 0, 12, 'main'),
        vegetarian: simulateFromQuantities(5, 100, 0, 5, 'veg'),
        soup: simulateFromQuantities(4, 100, 0, 4, 'soup'),
        dessert: simulateFromQuantities(3, 100, 0, 3, 'dessert'),
        totalSimulatedOverproductionGrams: 200,
        totalSimulatedShortageGrams: 0,
      },
      {
        serviceDate: '2026-07-28',
        userId: 'fixture-user-b',
        userName: 'Boris Lindström',
        forecastCustomers: 190,
        actualCustomers: 182,
        customerForecastDifference: 8,
        customerForecastAbsoluteError: 8,
        main: simulateFromQuantities(10, 100, 0, 10, 'main'),
        vegetarian: simulateFromQuantities(5, 100, 0, 5, 'veg'),
        soup: simulateFromQuantities(4, 100, 0, 4, 'soup'),
        dessert: simulateFromQuantities(3, 100, 0, 3, 'dessert'),
        totalSimulatedOverproductionGrams: 0,
        totalSimulatedShortageGrams: 0,
      },
    ]);

    const aino = summaries.find((summary) => summary.userId === 'fixture-user-a');
    const boris = summaries.find((summary) => summary.userId === 'fixture-user-b');
    expect(aino?.participatedServiceCount).toBe(2);
    expect(boris?.participatedServiceCount).toBe(1);
    expect(aino?.meanAbsoluteCustomerForecastError).toBe(5.5);
    expect(aino?.totalSimulatedOverproductionGrams).toBe(200);
  });
});

describe('fixture-backed chef results', () => {
  it('produces Monday main simulation worked example: 720 g simulated overproduction for user A', () => {
    const daily = buildFixtureDailyServiceResults('2026-07-27');
    expect(daily).not.toBeNull();
    const aino = daily!.staffResults.find((result) => result.userId === 'fixture-user-a');
    expect(aino).toBeDefined();
    // Observed main: 118 × 120 g = 14_160 g prepared; −480 g waste = 13_680 g demand
    // Forecast main: 120 × 120 g = 14_400 g → +720 g simulated overproduction
    expect(daily!.observed.main.observedDemandWeightGrams).toBe(13680);
    expect(aino!.main.simulatedOverproductionGrams).toBe(720);
    expect(aino!.main.simulatedShortageGrams).toBe(0);
  });

  it('builds daily results for all fixture service dates', () => {
    expect(buildAllFixtureDailyServiceResults()).toHaveLength(5);
  });

  it('builds weekly summaries from fixture participation', () => {
    const summaries = buildFixtureWeeklySummaries();
    expect(summaries.length).toBeGreaterThan(0);
    expect(summaries.some((summary) => summary.participatedServiceCount > 1)).toBe(true);
  });
});
