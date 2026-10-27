// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ForecastResultsParticipantApp } from '@/products/forecast-results/participant/ForecastResultsParticipantApp';
import {
  KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY,
  KITCHEN_GROUP_INPUT_COLLECTION_KEY,
} from '@/platform/gamebus/groupActivities';
import * as detectEmbedModule from '@/platform/gamebus/detectEmbed';
import * as operationalCalendarModule from '@/shared/calendar/operationalServiceCalendar';
import {
  ingestInputCollectionsForTests,
  resetGameBusBridgeForTests,
} from '@/platform/gamebus/bridge';
import {
  INPUT_COLLECTION_PARI_KEY,
  INPUT_COLLECTION_PARI_ME_REQUEST_KEY,
} from '@/platform/gamebus/inputCollections';
import { buildAnonymizedChefForecastActivity } from '@/products/service-closeout/forecast/fixtures/gameBusChefForecastActivities';
import { RESULTS_PENDING_EXPLANATION } from '@/products/forecast-results/participant/components/DashboardHeader';

const chefId = 'status-chef';
const coworkerId = 'status-coworker';
const earlierDate = '2026-09-02';
const serviceDate = '2026-09-08';

function mePayload(userId: string) {
  return {
    id: userId,
    firstName: 'Status',
    lastName: 'Chef',
    roles: ['chef'],
  };
}

function wasteMeasurementForDate(date: string) {
  return {
    id: `wm-${date}`,
    template: { slug: 'wasteMeasurement', name: 'Waste measurement' },
    createdAt: `${date}T15:00:00.000Z`,
    properties: [
      { template: { slug: 'serviceDate' }, value: { value: date } },
      { template: { slug: 'actualCustomers' }, value: { value: 140 } },
      { template: { slug: 'mainItemId' }, value: { value: 'meatballs' } },
      { template: { slug: 'preparedMainQuantity' }, value: { value: 110 } },
      { template: { slug: 'vegetarianItemId' }, value: { value: 'quorn' } },
      { template: { slug: 'preparedVegetarianQuantity' }, value: { value: 50 } },
      { template: { slug: 'soupItemId' }, value: { value: 'pumpkin-soup' } },
      { template: { slug: 'preparedSoupQuantity' }, value: { value: 40 } },
      { template: { slug: 'dessertItemId' }, value: { value: 'apple-compote' } },
      { template: { slug: 'preparedDessertQuantity' }, value: { value: 40 } },
      { template: { slug: 'overproductionMeatKg' }, value: { value: 0.3 } },
      { template: { slug: 'overproductionVegetarianKg' }, value: { value: 0.6 } },
      { template: { slug: 'overproductionSoupKg' }, value: { value: 0.1 } },
      { template: { slug: 'overproductionDessertKg' }, value: { value: 0.02 } },
      { template: { slug: 'submittedAt' }, value: { value: `${date}T15:00:00.000Z` } },
    ],
  };
}

function embeddedPayload(userId: string, activities: unknown[]) {
  return {
    [INPUT_COLLECTION_PARI_KEY]: {
      [INPUT_COLLECTION_PARI_ME_REQUEST_KEY]: mePayload(userId),
    },
    [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
      [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: activities,
    },
  };
}

describe('My Forecast Performance current-service status messaging', () => {
  let originalParent: Window;

  beforeEach(() => {
    resetGameBusBridgeForTests();
    vi.spyOn(detectEmbedModule, 'isGameBusEmbed').mockReturnValue(true);
    vi.spyOn(operationalCalendarModule, 'resolveForecastResultsServiceDate').mockReturnValue(
      serviceDate,
    );
    window.sessionStorage.clear();
    window.location.hash = '#/chef-results';
    originalParent = window.parent;
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: { postMessage: vi.fn() },
    });
  });

  afterEach(() => {
    cleanup();
    resetGameBusBridgeForTests();
    window.sessionStorage.clear();
    window.location.hash = '';
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: originalParent,
    });
    vi.restoreAllMocks();
  });

  it('shows Results pending when the chef submitted a forecast but closeout is missing', () => {
    ingestInputCollectionsForTests(
      embeddedPayload(chefId, [
        buildAnonymizedChefForecastActivity({
          actorId: chefId,
          actorName: 'Status Chef',
          targetDate: earlierDate,
          forecastTotalCustomers: 120,
        }),
        wasteMeasurementForDate(earlierDate),
        buildAnonymizedChefForecastActivity({
          id: 'current-forecast',
          actorId: chefId,
          actorName: 'Status Chef',
          targetDate: serviceDate,
          forecastTotalCustomers: 150,
        }),
      ]),
    );
    render(<ForecastResultsParticipantApp />);

    expect(screen.getByTestId('dashboard-status-chip')).toHaveTextContent('Results pending');
    expect(screen.getByTestId('dashboard-status-explanation')).toHaveTextContent(
      RESULTS_PENDING_EXPLANATION,
    );
    expect(screen.queryByText(/Waiting for service closeout/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('latest-forecast-date')).toHaveTextContent(/2 September 2026/);
    expect(screen.getByTestId('pending-forecast-explanation')).toHaveTextContent(
      RESULTS_PENDING_EXPLANATION,
    );
  });

  it('shows Result ready when personal forecast and matching closeout exist for the same service date', () => {
    ingestInputCollectionsForTests(
      embeddedPayload(chefId, [
        buildAnonymizedChefForecastActivity({
          actorId: chefId,
          actorName: 'Status Chef',
          targetDate: serviceDate,
          forecastTotalCustomers: 150,
        }),
        wasteMeasurementForDate(serviceDate),
      ]),
    );
    render(<ForecastResultsParticipantApp />);

    expect(screen.getByTestId('dashboard-status-chip')).toHaveTextContent('Result ready');
    expect(screen.queryByTestId('dashboard-status-explanation')).not.toBeInTheDocument();
    expect(screen.getByTestId('latest-forecast-result')).toBeInTheDocument();
    expect(screen.getByTestId('latest-forecast-date')).toHaveTextContent(/8 September 2026/);
    expect(screen.queryByText(/Waiting for service closeout/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Results pending/i)).not.toBeInTheDocument();
  });

  it('shows No forecast for this service when the chef has no personal forecast, even without closeout', () => {
    ingestInputCollectionsForTests(
      embeddedPayload(chefId, [
        buildAnonymizedChefForecastActivity({
          actorId: coworkerId,
          actorName: 'Coworker Chef',
          targetDate: serviceDate,
          forecastTotalCustomers: 180,
        }),
      ]),
    );
    render(<ForecastResultsParticipantApp />);

    expect(screen.getByTestId('dashboard-status-chip')).toHaveTextContent(
      'No forecast for this service',
    );
    expect(screen.queryByText(/Results pending/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Waiting for service closeout/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-status-explanation')).not.toBeInTheDocument();
    expect(screen.queryByTestId('participant-pending-forecast-summary')).not.toBeInTheDocument();
    expect(screen.queryByText('Coworker Chef')).not.toBeInTheDocument();
  });
});
