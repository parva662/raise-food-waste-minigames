// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ChefResultsParticipantApp } from './ChefResultsParticipantApp';
import { ActualKitchenOutcomeSection } from './components/participant/ActualKitchenOutcomeSection';
import { ForecastImpactSection } from './components/participant/ForecastImpactSection';
import { TeamComparisonSection } from './components/participant/TeamComparisonSection';
import { ParticipantProgressSection } from './components/participant/ParticipantProgressSection';
import {
  buildActualVsEstimatedSurplusInsight,
  buildCustomerEstimateDifferenceLabel,
  buildPeerCustomerComparisonMessage,
  FORECAST_INPUT_SEPARATION_NOTE,
} from './forecastInterpretation';
import {
  buildAnonymousPeerBenchmark,
  buildParticipantPeerComparisonInsights,
} from './teamComparison';
import {
  buildParticipantProgressPeriodView,
  buildParticipantProgressServicePoints,
  buildProgressPeriodInterpretation,
  formatProgressPeriodRange,
} from './participantProgressData';
import type {
  ObservedCategoryReality,
  ObservedServiceReality,
  StaffCategorySimulation,
  StaffDailyResult,
} from './types';
import * as operationalCalendarModule from '../services/operationalServiceCalendar';

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
    actualCustomers: 280,
    main: { ...observedCategoryGrams(500), itemId: 'main' },
    vegetarian: { ...observedCategoryGrams(100), itemId: 'veg' },
    soup: { ...observedCategoryGrams(10), itemId: 'soup' },
    dessert: { ...observedCategoryGrams(0), itemId: 'dessert' },
  };
}

function categorySimulation(
  simulatedOverproductionGrams: number,
  simulatedShortageGrams = 0,
): StaffCategorySimulation {
  return {
    itemId: 'item',
    forecastQuantity: 200,
    portionWeightGrams: 350,
    forecastProductionWeightGrams: 70000,
    actualPreparedQuantity: 100,
    actualPreparedWeightGrams: 35000,
    measuredOverproductionGrams: 500,
    observedDemandWeightGrams: 34500,
    simulatedOverproductionGrams,
    simulatedShortageGrams,
  };
}

function staffResult(overrides: Partial<StaffDailyResult> = {}): StaffDailyResult {
  const base: StaffDailyResult = {
    serviceDate: '2026-07-27',
    userId: 'fixture-user-c',
    userName: 'Casey Chef',
    forecastCustomers: 300,
    actualCustomers: 280,
    customerForecastDifference: 20,
    customerForecastAbsoluteError: 20,
    main: categorySimulation(300),
    vegetarian: categorySimulation(100),
    soup: categorySimulation(0, 250),
    dessert: categorySimulation(40),
    totalSimulatedOverproductionGrams: 610,
    totalSimulatedShortageGrams: 250,
  };
  return { ...base, ...overrides };
}

describe('deterministic forecast interpretation', () => {
  it('describes production plan surplus approximately matching kitchen', () => {
    expect(buildActualVsEstimatedSurplusInsight(610, 610)).toMatch(/production plan/);
    expect(buildActualVsEstimatedSurplusInsight(610, 610)).toMatch(/approximately the same surplus/);
  });

  it('describes lower and higher production plan surplus', () => {
    expect(buildActualVsEstimatedSurplusInsight(610, 310)).toMatch(/less surplus/);
    expect(buildActualVsEstimatedSurplusInsight(610, 910)).toMatch(/more surplus/);
  });

  it('formats customer estimate high/low/on-target', () => {
    expect(buildCustomerEstimateDifferenceLabel(300, 280)).toEqual({
      primary: '+20',
      secondary: 'customers high',
    });
    expect(buildCustomerEstimateDifferenceLabel(265, 280)).toEqual({
      primary: '-15',
      secondary: 'customers low',
    });
    expect(buildCustomerEstimateDifferenceLabel(280, 280)).toEqual({
      primary: 'On target',
      secondary: null,
    });
  });

  it('uses readable customer peer comparison copy', () => {
    expect(buildPeerCustomerComparisonMessage(20, 50)).toMatch(/closer to actual attendance/);
    expect(buildPeerCustomerComparisonMessage(60, 20)).toMatch(/further from actual attendance/);
  });
});

describe('customer estimate vs production plan UX', () => {
  afterEach(() => cleanup());

  it('shows customer estimate and production plan separately', () => {
    render(<ForecastImpactSection result={staffResult()} observed={observedReality()} />);

    expect(screen.getByTestId('customer-estimate-card')).toBeInTheDocument();
    expect(screen.getByTestId('production-plan-card')).toBeInTheDocument();
    expect(screen.getByTestId('customer-estimate-predicted')).toHaveTextContent('300');
    expect(screen.getByTestId('customer-estimate-actual')).toHaveTextContent('280');
    expect(screen.getByTestId('customer-estimate-difference')).toHaveTextContent('customers high');
    expect(screen.getByTestId('forecast-input-separation-note')).toHaveTextContent(
      FORECAST_INPUT_SEPARATION_NOTE,
    );
    expect(screen.getByText('If your production plan had been used')).toBeInTheDocument();
    expect(screen.getByText('Estimated surplus')).toBeInTheDocument();
    expect(screen.getByText('Estimated shortage')).toBeInTheDocument();
  });

  it('shows actual kitchen customers served and surplus', () => {
    render(<ActualKitchenOutcomeSection observed={observedReality()} />);
    expect(screen.getByTestId('actual-customers-served')).toHaveTextContent('280');
    expect(screen.getByTestId('actual-kitchen-total')).toHaveTextContent('610 g');
  });
});

describe('peer comparison table', () => {
  afterEach(() => cleanup());

  it('renders You and Other staff median rows without bars', () => {
    const participant = staffResult({ actualCustomers: 100, totalSimulatedOverproductionGrams: 220 });
    const peers = [
      participant,
      staffResult({ userId: 'peer-a', totalSimulatedOverproductionGrams: 180, actualCustomers: 100 }),
      staffResult({ userId: 'peer-b', totalSimulatedOverproductionGrams: 180, actualCustomers: 100 }),
      staffResult({ userId: 'peer-c', totalSimulatedOverproductionGrams: 180, actualCustomers: 100, totalSimulatedShortageGrams: 14030 }),
    ];
    const benchmark = buildAnonymousPeerBenchmark(peers, participant.userId);
    const insights = buildParticipantPeerComparisonInsights(participant, benchmark);

    render(
      <TeamComparisonSection participant={participant} benchmark={benchmark} insights={insights} />,
    );

    expect(screen.getByTestId('peer-comparison-table')).toBeInTheDocument();
    expect(screen.getByText('Other staff median')).toBeInTheDocument();
    expect(screen.queryByTestId('peer-surplus-bar-you')).not.toBeInTheDocument();
    expect(screen.getByTestId('peer-row-surplus')).toBeInTheDocument();
    expect(screen.getByTestId('peer-row-shortage')).toBeInTheDocument();
    expect(screen.getByTestId('peer-row-customer-error')).toBeInTheDocument();
    expect(screen.getByTestId('peer-comparison-aim')).toHaveTextContent(
      'The aim is to keep both surplus and shortage low.',
    );
    expect(screen.getByTestId('how-calculated-disclosure')).toBeInTheDocument();
  });
});

describe('progress summary and comparison', () => {
  it('shows week date range from canonical period', () => {
    const range = formatProgressPeriodRange('2026-07-27', '2026-08-02');
    expect(range).toBe('27 July – 2 August');
  });

  it('does not praise improvement when surplus falls but shortage rises', () => {
    const message = buildProgressPeriodInterpretation(
      {
        overproductionRateGramsPerCustomer: 2,
        shortageRateGramsPerCustomer: 3,
        meanCustomerForecastAbsoluteError: 10,
        servicesCompleted: 2,
      },
      {
        overproductionRateGramsPerCustomer: 4,
        shortageRateGramsPerCustomer: 1,
        meanCustomerForecastAbsoluteError: 12,
        servicesCompleted: 2,
      },
      'week',
    );
    expect(message).toMatch(/surplus decreased, but estimated shortage increased/);
    expect(message).not.toMatch(/improv/i);
  });

  it('shows both-decreased message when surplus and shortage fall', () => {
    const message = buildProgressPeriodInterpretation(
      {
        overproductionRateGramsPerCustomer: 1,
        shortageRateGramsPerCustomer: 0.5,
        meanCustomerForecastAbsoluteError: 8,
        servicesCompleted: 2,
      },
      {
        overproductionRateGramsPerCustomer: 3,
        shortageRateGramsPerCustomer: 2,
        meanCustomerForecastAbsoluteError: 12,
        servicesCompleted: 2,
      },
      'week',
    );
    expect(message).toMatch(/Both estimated surplus and shortage decreased/);
  });
});

describe('dashboard headings and progress discoverability', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    window.sessionStorage.clear();
  });

  beforeEach(() => {
    vi.spyOn(operationalCalendarModule, 'resolveChefResultsServiceDate').mockReturnValue('2026-07-31');
    window.sessionStorage.setItem('chef-results-fixture-current-user-id', 'fixture-user-a');
  });

  it('has exactly one h1 and shows progress without current result', () => {
    render(<ChefResultsParticipantApp />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Kitchen Staff Dashboard');
    expect(screen.queryByText('Your result')).not.toBeInTheDocument();
    expect(screen.getByTestId('your-progress-section')).toBeInTheDocument();
    expect(screen.getByTestId('progress-period-tabs')).toBeInTheDocument();
  });

  it('shows progress while current service has no personal forecast', () => {
    render(<ChefResultsParticipantApp />);
    expect(screen.getByTestId('participant-no-forecast-result')).toBeInTheDocument();
    expect(screen.queryByTestId('forecast-impact-section')).not.toBeInTheDocument();
    expect(screen.getByTestId('your-progress-section')).toBeInTheDocument();
    expect(screen.getByTestId('progress-bar-chart')).toBeInTheDocument();
  });
});

describe('ParticipantProgressSection period summary', () => {
  afterEach(() => cleanup());

  it('shows period summary metrics and previous comparison dimensions', () => {
    const points = buildParticipantProgressServicePoints('fixture-user-c', '2026-07-31');
    const period = buildParticipantProgressPeriodView(points, 'week', '2026-07-31');

    render(<ParticipantProgressSection servicePoints={points} asOfServiceDate="2026-07-31" />);

    expect(screen.getByTestId('progress-period-summary')).toBeInTheDocument();
    expect(screen.getByText('Week summary')).toBeInTheDocument();
    expect(screen.getByTestId('progress-average-overproduction')).toBeInTheDocument();
    expect(screen.getByTestId('progress-shortage-risk')).toBeInTheDocument();
    expect(screen.getByTestId('progress-average-customer-error')).toBeInTheDocument();
    expect(screen.getByTestId('progress-completed-services')).toBeInTheDocument();
    expect(screen.getByTestId('progress-previous-comparison')).toBeInTheDocument();
    expect(period.periodRangeLabel).toMatch(/July/);
  });
});
