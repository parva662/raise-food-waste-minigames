// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { ActualKitchenOutcomeSection } from './components/participant/ActualKitchenOutcomeSection';
import { ForecastImpactSection } from './components/participant/ForecastImpactSection';
import { TeamComparisonSection } from './components/participant/TeamComparisonSection';
import {
  buildAnonymousTeamBenchmark,
  buildParticipantComparisonInsights,
} from './teamComparison';
import type { ObservedCategoryReality, ObservedServiceReality, StaffCategorySimulation, StaffDailyResult } from './types';

function observedCategoryGrams(grams: number): ObservedCategoryReality {
  return {
    itemId: 'item',
    actualPreparedQuantity: 100,
    portionWeightGrams: 350,
    actualPreparedWeightGrams: 35000,
    measuredOverproductionGrams: grams,
    observedDemandWeightGrams: 35000 - grams,
  };
}

function observedReality(): ObservedServiceReality {
  return {
    serviceDate: '2026-07-27',
    actualCustomers: 150,
    main: { ...observedCategoryGrams(500), itemId: 'main' },
    vegetarian: { ...observedCategoryGrams(600), itemId: 'veg' },
    soup: { ...observedCategoryGrams(20), itemId: 'soup' },
    dessert: { ...observedCategoryGrams(20), itemId: 'dessert' },
  };
}

function categorySimulation(
  simulatedOverproductionGrams: number,
  simulatedShortageGrams = 0,
  measuredOverproductionGrams = 500,
): StaffCategorySimulation {
  return {
    itemId: 'item',
    forecastQuantity: 200,
    portionWeightGrams: 350,
    forecastProductionWeightGrams: 70000,
    actualPreparedQuantity: 100,
    actualPreparedWeightGrams: 35000,
    measuredOverproductionGrams,
    observedDemandWeightGrams: 35000 - measuredOverproductionGrams,
    simulatedOverproductionGrams,
    simulatedShortageGrams,
  };
}

function staffResult(): StaffDailyResult {
  return {
    serviceDate: '2026-07-27',
    userId: 'fixture-user-c',
    userName: 'Casey Chef',
    forecastCustomers: 160,
    actualCustomers: 150,
    customerForecastDifference: 10,
    customerForecastAbsoluteError: 10,
    main: categorySimulation(13820, 0, 500),
    vegetarian: categorySimulation(12000, 0, 600),
    soup: categorySimulation(0, 250, 20),
    dessert: categorySimulation(8450, 0, 20),
    totalSimulatedOverproductionGrams: 34270,
    totalSimulatedShortageGrams: 250,
  };
}

describe('participant dashboard sections', () => {
  afterEach(() => {
    cleanup();
  });

  it('section 1 shows measured kitchen overproduction from observed reality', () => {
    render(<ActualKitchenOutcomeSection observed={observedReality()} />);

    const section = screen.getByTestId('actual-kitchen-outcome-section');
    expect(section).toHaveTextContent('Actual kitchen overproduction');
    expect(screen.getByTestId('actual-kitchen-total')).toHaveTextContent('1,140 g');
    expect(screen.getByTestId('actual-kitchen-main')).toHaveTextContent('500 g');
    expect(screen.getByTestId('actual-kitchen-vegetarian')).toHaveTextContent('600 g');
    expect(screen.getByTestId('actual-kitchen-soup')).toHaveTextContent('20 g');
    expect(screen.getByTestId('actual-kitchen-dessert')).toHaveTextContent('20 g');
    expect(section).not.toHaveTextContent('34.27 kg');
    expect(section).not.toHaveTextContent('Simulated');
  });

  it('section 2 shows customer forecast and simulated totals separately from actual waste', () => {
    render(<ForecastImpactSection result={staffResult()} />);

    const section = screen.getByTestId('forecast-impact-section');
    expect(section).toHaveTextContent('What would your forecast have produced?');
    expect(section).toHaveTextContent('These values are not the actual kitchen waste');

    const summary = screen.getByTestId('participant-summary-cards');
    expect(within(summary).getByText('Customer forecast')).toBeInTheDocument();
    expect(within(summary).getByText('Predicted')).toBeInTheDocument();
    expect(within(summary).getByText('160')).toBeInTheDocument();
    expect(within(summary).getByText('Actual')).toBeInTheDocument();
    expect(within(summary).getByText('150')).toBeInTheDocument();
    expect(within(summary).getByText('Simulated overproduction')).toBeInTheDocument();
    expect(within(summary).getByText('34.27 kg')).toBeInTheDocument();
    expect(within(summary).getByText('Simulated shortage')).toBeInTheDocument();
    expect(within(summary).getByText('250 g')).toBeInTheDocument();
    expect(section).not.toHaveTextContent('1,140 g');
  });

  it('section 2 category simulation identifies shortage, close match, and overproduction', () => {
    render(<ForecastImpactSection result={staffResult()} />);

    const visual = screen.getByTestId('category-outcome-visual');
    expect(within(visual).getByText('Category simulation')).toBeInTheDocument();
    expect(within(visual).getByText(/Shortage 250 g/)).toBeInTheDocument();
    expect(within(visual).getByText(/Overproduction 13\.82 kg/)).toBeInTheDocument();
    expect(within(visual).getByText(/Overproduction 12\.00 kg/)).toBeInTheDocument();
    expect(within(visual).getByText(/Overproduction 8\.45 kg/)).toBeInTheDocument();
  });

  it('section 3 compares forecast performance using simulated metrics', () => {
    const participant = staffResult();
    const peers: StaffDailyResult[] = [
      participant,
      {
        ...participant,
        userId: 'peer-a',
        userName: 'Peer A',
        totalSimulatedOverproductionGrams: 30000,
        totalSimulatedShortageGrams: 400,
        customerForecastAbsoluteError: 5,
      },
      {
        ...participant,
        userId: 'peer-b',
        userName: 'Peer B',
        totalSimulatedOverproductionGrams: 36000,
        totalSimulatedShortageGrams: 100,
        customerForecastAbsoluteError: 15,
      },
    ];
    const benchmark = buildAnonymousTeamBenchmark(peers);
    const insights = buildParticipantComparisonInsights(participant, benchmark);

    render(
      <TeamComparisonSection participant={participant} benchmark={benchmark} insights={insights} />,
    );

    const section = screen.getByTestId('team-comparison-section');
    expect(section).toHaveTextContent('How your forecast compares with the team');
    expect(section).toHaveTextContent('forecast performance');
    expect(section).toHaveTextContent('same actual kitchen outcome');
    expect(section).toHaveTextContent('simulated overproduction');
    expect(section).not.toHaveTextContent('Peer A');
    expect(section).not.toHaveTextContent('Peer B');
  });
});
