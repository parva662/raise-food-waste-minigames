// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { ActualKitchenOutcomeSection } from './components/participant/ActualKitchenOutcomeSection';
import { ForecastImpactSection } from './components/participant/ForecastImpactSection';
import { TeamComparisonSection } from './components/participant/TeamComparisonSection';
import {
  buildAnonymousPeerBenchmark,
  buildParticipantPeerComparisonInsights,
} from './teamComparison';
import type {
  ObservedCategoryReality,
  ObservedServiceReality,
  StaffCategorySimulation,
  StaffDailyResult,
} from './types';

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

  it('section 1 shows actual kitchen surplus from observed reality', () => {
    render(<ActualKitchenOutcomeSection observed={observedReality()} />);

    const section = screen.getByTestId('actual-kitchen-outcome-section');
    expect(section).toHaveTextContent('What happened in the kitchen?');
    expect(screen.getByTestId('actual-kitchen-total')).toHaveTextContent('1,140 g');
    expect(screen.getByTestId('actual-customers-served')).toHaveTextContent('150');
    expect(section).not.toHaveTextContent('Simulated');
  });

  it('section 2 shows customer estimate and production plan separately', () => {
    render(<ForecastImpactSection result={staffResult()} observed={observedReality()} />);

    const section = screen.getByTestId('forecast-impact-section');
    expect(section).toHaveTextContent('Your forecast');
    expect(screen.getByTestId('customer-estimate-card')).toBeInTheDocument();
    expect(screen.getByTestId('production-plan-card')).toBeInTheDocument();
    expect(within(section).getByText('Estimated surplus')).toBeInTheDocument();
    expect(within(section).getByText('34.27 kg')).toBeInTheDocument();
    expect(within(section).getByText('Estimated shortage')).toBeInTheDocument();
    expect(within(section).getByText('250 g')).toBeInTheDocument();
    expect(within(section).queryByText('Simulated overproduction')).not.toBeInTheDocument();
  });

  it('by-menu-item visual uses Too little / On target / Too much without duplicate zero labels', () => {
    render(<ForecastImpactSection result={staffResult()} observed={observedReality()} />);

    const visual = screen.getByTestId('category-outcome-visual');
    expect(within(visual).getByText('By menu item')).toBeInTheDocument();
    expect(within(visual).getAllByText('On target').length).toBeGreaterThan(0);
    expect(within(visual).getAllByText('Too little').length).toBeGreaterThan(0);
    expect(within(visual).getAllByText('Too much').length).toBeGreaterThan(0);
    expect(within(visual).getByText(/250 g estimated shortage/)).toBeInTheDocument();
    expect(within(visual).queryByText('Category simulation')).not.toBeInTheDocument();
    expect(within(visual).queryByText(/^0$/)).not.toBeInTheDocument();

    const mainScale = within(visual).getAllByRole('img')[0];
    expect(mainScale).toHaveAttribute('aria-label', 'Main: estimated surplus 13820 grams');
  });

  it('section 3 compares against other staff with peer table', () => {
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
      {
        ...participant,
        userId: 'peer-c',
        userName: 'Peer C',
        totalSimulatedOverproductionGrams: 33000,
        totalSimulatedShortageGrams: 200,
        customerForecastAbsoluteError: 12,
      },
    ];
    const benchmark = buildAnonymousPeerBenchmark(peers, participant.userId);
    const insights = buildParticipantPeerComparisonInsights(participant, benchmark);

    render(
      <TeamComparisonSection participant={participant} benchmark={benchmark} insights={insights} />,
    );

    const section = screen.getByTestId('team-comparison-section');
    expect(section).toHaveTextContent('Compared with other staff');
    expect(section).toHaveTextContent('Other staff median');
    expect(screen.getByTestId('peer-comparison-table')).toBeInTheDocument();
    expect(screen.queryByTestId('peer-surplus-bar-you')).not.toBeInTheDocument();
    expect(section).not.toHaveTextContent('Simulated overproduction — anonymous team range');
    expect(section).not.toHaveTextContent('Peer A');
  });

  it('shows insufficient peers message when fewer than three other staff', () => {
    const participant = staffResult();
    const benchmark = buildAnonymousPeerBenchmark(
      [participant, { ...participant, userId: 'peer-a' }],
      participant.userId,
    );
    const insights = buildParticipantPeerComparisonInsights(participant, benchmark);

    render(
      <TeamComparisonSection participant={participant} benchmark={benchmark} insights={insights} />,
    );

    expect(screen.getByTestId('peer-comparison-unavailable')).toHaveTextContent(
      /Not enough other staff results/,
    );
  });
});
