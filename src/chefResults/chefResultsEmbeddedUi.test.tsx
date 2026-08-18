// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ChefResultsParticipantApp } from './ChefResultsParticipantApp';
import { ChefResultsAdminApp } from './ChefResultsAdminApp';
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

const serviceDate = '2026-07-29';

function realMePayload(overrides: Record<string, unknown> = {}) {
  return {
    id: 'real-user-abc',
    firstName: 'Test',
    lastName: 'Account',
    email: 'hidden@example.com',
    roles: ['chef'],
    ...overrides,
  };
}

function wasteMeasurementActivity() {
  return {
    id: 'wm-1',
    template: { reference: 'wasteMeasurement', name: 'Waste measurement' },
    createdAt: '2026-07-29T15:00:00.000Z',
    properties: [
      { template: { reference: 'serviceDate' }, value: { value: serviceDate } },
      { template: { reference: 'actualCustomers' }, value: { value: 150 } },
      { template: { reference: 'mainItemId' }, value: { value: 'meatballs' } },
      { template: { reference: 'preparedMainQuantity' }, value: { value: 110 } },
      { template: { reference: 'vegetarianItemId' }, value: { value: 'quorn' } },
      { template: { reference: 'preparedVegetarianQuantity' }, value: { value: 52 } },
      { template: { reference: 'soupItemId' }, value: { value: 'pumpkin-soup' } },
      { template: { reference: 'preparedSoupQuantity' }, value: { value: 40 } },
      { template: { reference: 'dessertItemId' }, value: { value: 'apple-compote' } },
      { template: { reference: 'preparedDessertQuantity' }, value: { value: 35 } },
      { template: { reference: 'overproductionMeatKg' }, value: { value: 0.85 } },
      { template: { reference: 'overproductionVegetarianKg' }, value: { value: 0.36 } },
      { template: { reference: 'overproductionSoupKg' }, value: { value: 0.5 } },
      { template: { reference: 'overproductionDessertKg' }, value: { value: 0.18 } },
      { template: { reference: 'submittedAt' }, value: { value: '2026-07-29T15:00:00.000Z' } },
    ],
  };
}

function embeddedKitchenPayload(options?: {
  includeCurrentUserForecast?: boolean;
  includeCoworkerForecast?: boolean;
}) {
  const includeCurrentUserForecast = options?.includeCurrentUserForecast ?? true;
  const includeCoworkerForecast = options?.includeCoworkerForecast ?? true;
  const activities = [
    ...(includeCurrentUserForecast
      ? [
          buildAnonymizedChefForecastActivity({
            actorId: 'real-user-abc',
            actorName: 'Test Account',
            targetDate: serviceDate,
          }),
        ]
      : []),
    ...(includeCoworkerForecast
      ? [
          buildAnonymizedChefForecastActivity({
            id: 'coworker-forecast',
            actorId: 'coworker-user',
            actorName: 'Coworker Chef',
            targetDate: serviceDate,
          }),
        ]
      : []),
    wasteMeasurementActivity(),
  ];

  return {
    [INPUT_COLLECTION_PARI_KEY]: {
      [INPUT_COLLECTION_PARI_ME_REQUEST_KEY]: realMePayload(),
    },
    [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
      [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: activities,
    },
  };
}

describe('embedded chef results UI', () => {
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
    vi.unstubAllEnvs();
  });

  it('shows all calculable service dates in the participant dropdown', () => {
    ingestInputCollectionsForTests(embeddedKitchenPayload());
    render(<ChefResultsParticipantApp />);

    const select = screen.getByTestId('chef-results-date-select') as HTMLSelectElement;
    expect(select.options).toHaveLength(1);
    expect(select.value).toBe(serviceDate);
  });

  it('shows only the authenticated user result on the participant page', () => {
    ingestInputCollectionsForTests(embeddedKitchenPayload());
    render(<ChefResultsParticipantApp />);

    expect(screen.getByTestId('participant-summary-cards')).toBeInTheDocument();
    expect(screen.queryByText('Coworker Chef')).not.toBeInTheDocument();
    expect(screen.queryByText('coworker-user')).not.toBeInTheDocument();
  });

  it('keeps calculable dates visible when the current user has no forecast', () => {
    ingestInputCollectionsForTests(
      embeddedKitchenPayload({ includeCurrentUserForecast: false, includeCoworkerForecast: true }),
    );
    render(<ChefResultsParticipantApp />);

    const select = screen.getByTestId('chef-results-date-select') as HTMLSelectElement;
    expect(select.value).toBe(serviceDate);
    expect(screen.getByTestId('participant-no-result')).toHaveTextContent(
      'You did not submit a forecast for this service date.',
    );
  });

  it('uses real embedded kitchen progress instead of fixture leakage', () => {
    ingestInputCollectionsForTests(embeddedKitchenPayload());
    render(<ChefResultsParticipantApp />);

    expect(screen.getByTestId('kitchen-progress-services-count')).toHaveTextContent('1');
    expect(screen.getByTestId('kitchen-progress-team-overproduction').textContent).not.toBe('4.12 kg');
    expect(screen.getByTestId('kitchen-progress-team-overproduction').textContent).not.toBe('5');
  });

  it('shows real actor names on the admin page', () => {
    ingestInputCollectionsForTests(embeddedKitchenPayload());
    render(<ChefResultsAdminApp />);

    expect(screen.getByTestId('staff-result-real-user-abc')).toHaveTextContent('Test Account');
    expect(screen.getByTestId('staff-result-coworker-user')).toHaveTextContent('Coworker Chef');
  });

  it('shows parser diagnostics only in debug mode', () => {
    window.location.hash = '#/chef-results?gamebusDebug=1';
    ingestInputCollectionsForTests(embeddedKitchenPayload());
    render(<ChefResultsParticipantApp />);

    expect(screen.getByTestId('gamebus-kitchen-diagnostics')).toBeInTheDocument();
    expect(screen.getByTestId('debug-calculable-dates')).toHaveTextContent(serviceDate);
    expect(screen.getByTestId('debug-current-user-has-result')).toHaveTextContent('yes');
  });

  it('hides parser diagnostics in normal participant mode', () => {
    ingestInputCollectionsForTests(embeddedKitchenPayload());
    render(<ChefResultsParticipantApp />);

    expect(screen.queryByTestId('gamebus-kitchen-diagnostics')).not.toBeInTheDocument();
  });
});
