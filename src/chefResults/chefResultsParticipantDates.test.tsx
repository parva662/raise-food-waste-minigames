// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ChefResultsParticipantApp } from './ChefResultsParticipantApp';
import {
  KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY,
  KITCHEN_GROUP_INPUT_COLLECTION_KEY,
} from '../gamebus/groupActivities';
import * as detectEmbedModule from '../gamebus/detectEmbed';
import {
  ingestInputCollectionsForTests,
  resetGameBusBridgeForTests,
} from '../gamebus/bridge';
import {
  INPUT_COLLECTION_PARI_KEY,
  INPUT_COLLECTION_PARI_ME_REQUEST_KEY,
} from '../gamebus/inputCollections';
import { buildAnonymizedChefForecastActivity } from '../serviceCloseout/forecast/fixtures/gameBusChefForecastActivities';

const staff1Id = 'staff1-user';
const sep2 = '2026-09-02';
const sep8 = '2026-09-08';

function staff1MePayload() {
  return {
    id: staff1Id,
    firstName: 'Staff',
    lastName: 'One',
    roles: ['chef'],
  };
}

function wasteMeasurementForDate(serviceDate: string) {
  return {
    id: `wm-${serviceDate}`,
    template: { slug: 'wasteMeasurement', name: 'Waste measurement' },
    createdAt: `${serviceDate}T15:00:00.000Z`,
    properties: [
      { template: { slug: 'serviceDate' }, value: { value: serviceDate } },
      { template: { slug: 'actualCustomers' }, value: { value: 150 } },
      { template: { slug: 'mainItemId' }, value: { value: 'meatballs' } },
      { template: { slug: 'preparedMainQuantity' }, value: { value: 110 } },
      { template: { slug: 'vegetarianItemId' }, value: { value: 'quorn' } },
      { template: { slug: 'preparedVegetarianQuantity' }, value: { value: 52 } },
      { template: { slug: 'soupItemId' }, value: { value: 'pumpkin-soup' } },
      { template: { slug: 'preparedSoupQuantity' }, value: { value: 40 } },
      { template: { slug: 'dessertItemId' }, value: { value: 'apple-compote' } },
      { template: { slug: 'preparedDessertQuantity' }, value: { value: 35 } },
      { template: { slug: 'overproductionMeatKg' }, value: { value: 0.85 } },
      { template: { slug: 'overproductionVegetarianKg' }, value: { value: 0.36 } },
      { template: { slug: 'overproductionSoupKg' }, value: { value: 0.5 } },
      { template: { slug: 'overproductionDessertKg' }, value: { value: 0.18 } },
      { template: { slug: 'submittedAt' }, value: { value: `${serviceDate}T15:00:00.000Z` } },
    ],
  };
}

function embeddedPayload(activities: unknown[]) {
  return {
    [INPUT_COLLECTION_PARI_KEY]: {
      [INPUT_COLLECTION_PARI_ME_REQUEST_KEY]: staff1MePayload(),
    },
    [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
      [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: activities,
    },
  };
}

describe('participant-visible result dates in embedded mode', () => {
  let originalParent: Window;

  beforeEach(() => {
    resetGameBusBridgeForTests();
    vi.spyOn(detectEmbedModule, 'isGameBusEmbed').mockReturnValue(true);
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

  it('does not select a group-only Sep 2 result when staff1 did not forecast Sep 2', () => {
    ingestInputCollectionsForTests(
      embeddedPayload([
        buildAnonymizedChefForecastActivity({
          actorId: 'coworker',
          actorName: 'Coworker Chef',
          targetDate: sep2,
        }),
        wasteMeasurementForDate(sep2),
      ]),
    );
    render(<ChefResultsParticipantApp />);

    expect(screen.queryByTestId('chef-results-date-select')).not.toBeInTheDocument();
    expect(screen.getByTestId('participant-no-completed-results')).toBeInTheDocument();
    expect(screen.queryByText(/2 Sep 2026|Sep 2/)).not.toBeInTheDocument();
  });

  it('shows empty state when staff1 forecasted Sep 8 but closeout is missing', () => {
    ingestInputCollectionsForTests(
      embeddedPayload([
        buildAnonymizedChefForecastActivity({
          actorId: staff1Id,
          actorName: 'Staff One',
          targetDate: sep8,
        }),
      ]),
    );
    render(<ChefResultsParticipantApp />);

    expect(screen.getByTestId('participant-no-completed-results')).toHaveTextContent(
      'No completed forecast results yet.',
    );
    expect(screen.getByText(/Your result will appear after the service you forecast has been closed/)).toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-progress-section')).not.toBeInTheDocument();
    expect(screen.queryByTestId('team-comparison-section')).not.toBeInTheDocument();
  });

  it('shows Sep 8 results and team comparison after closeout and multiple staff forecasts', () => {
    ingestInputCollectionsForTests(
      embeddedPayload([
        buildAnonymizedChefForecastActivity({
          actorId: staff1Id,
          actorName: 'Staff One',
          targetDate: sep8,
        }),
        buildAnonymizedChefForecastActivity({
          id: 'coworker-forecast',
          actorId: 'coworker',
          actorName: 'Coworker Chef',
          targetDate: sep8,
        }),
        wasteMeasurementForDate(sep8),
      ]),
    );
    render(<ChefResultsParticipantApp />);

    const select = screen.getByTestId('chef-results-date-select') as HTMLSelectElement;
    expect(select.value).toBe(sep8);
    expect(screen.getByTestId('forecast-impact-section')).toBeInTheDocument();
    expect(screen.getByTestId('team-comparison-section')).toBeInTheDocument();
    expect(screen.queryByText('Coworker Chef')).not.toBeInTheDocument();
    expect(screen.getByTestId('kitchen-progress-section')).toBeInTheDocument();
  });

  it('renders the dashboard intro without duplicating participant header guidance', () => {
    ingestInputCollectionsForTests(
      embeddedPayload([
        buildAnonymizedChefForecastActivity({
          actorId: staff1Id,
          actorName: 'Staff One',
          targetDate: sep8,
        }),
        wasteMeasurementForDate(sep8),
      ]),
    );
    render(<ChefResultsParticipantApp />);

    expect(screen.getByTestId('participant-dashboard-intro')).toHaveTextContent(
      'Kitchen Staff Dashboard',
    );
    expect(screen.getByTestId('participant-dashboard-intro')).toHaveTextContent(
      'Results appear only when both your forecast and the service closeout are available.',
    );
  });
});
