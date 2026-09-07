// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ChefResultsParticipantApp } from './ChefResultsParticipantApp';
import { ChefResultsAdminApp } from './ChefResultsAdminApp';
import { DEFAULT_FIXTURE_CURRENT_USER_ID } from './currentUserContext';
import {
  KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY,
  KITCHEN_GROUP_INPUT_COLLECTION_KEY,
} from '../gamebus/groupActivities';
import * as detectEmbedModule from '../gamebus/detectEmbed';
import * as operationalCalendarModule from '../services/operationalServiceCalendar';
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
    template: { slug: 'wasteMeasurement', name: 'Waste measurement' },
    createdAt: '2026-07-29T15:00:00.000Z',
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
      { template: { slug: 'submittedAt' }, value: { value: '2026-07-29T15:00:00.000Z' } },
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
    vi.spyOn(operationalCalendarModule, 'resolveChefResultsServiceDate').mockReturnValue(serviceDate);
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

  it('shows the canonical service date in the participant header without a date picker', () => {
    ingestInputCollectionsForTests(embeddedKitchenPayload());
    render(<ChefResultsParticipantApp />);

    expect(screen.queryByTestId('chef-results-date-select')).not.toBeInTheDocument();
    expect(screen.getByText(/Service date: Wednesday, 29 July 2026/)).toBeInTheDocument();
  });

  it('shows only the authenticated user result on the participant page', () => {
    ingestInputCollectionsForTests(embeddedKitchenPayload());
    render(<ChefResultsParticipantApp />);

    expect(screen.getByTestId('actual-kitchen-outcome-section')).toBeInTheDocument();
    expect(screen.getByTestId('forecast-impact-section')).toBeInTheDocument();
    expect(screen.getByTestId('participant-summary-cards')).toBeInTheDocument();
    expect(screen.queryByText('Coworker Chef')).not.toBeInTheDocument();
    expect(screen.queryByText('coworker-user')).not.toBeInTheDocument();
  });

  it('shows no forecast state when the current user has no forecast for the canonical date', () => {
    ingestInputCollectionsForTests(
      embeddedKitchenPayload({ includeCurrentUserForecast: false, includeCoworkerForecast: true }),
    );
    render(<ChefResultsParticipantApp />);

    expect(screen.queryByTestId('chef-results-date-select')).not.toBeInTheDocument();
    expect(screen.getByTestId('participant-no-forecast-result')).toHaveTextContent(
      'You did not submit a valid forecast for this service date.',
    );
    expect(screen.queryByTestId('kitchen-progress-section')).not.toBeInTheDocument();
    expect(screen.queryByTestId('your-week-section')).not.toBeInTheDocument();
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

  it('shows parser diagnostics only in debug mode at the bottom', () => {
    window.location.hash = '#/chef-results?gamebusDebug=1';
    ingestInputCollectionsForTests(embeddedKitchenPayload());
    render(<ChefResultsParticipantApp />);

    const debugPanel = screen.getByTestId('chef-results-debug-panel');
    expect(debugPanel.tagName).toBe('DETAILS');
    expect(debugPanel).not.toHaveAttribute('open');
    expect(screen.getByTestId('gamebus-kitchen-diagnostics')).toBeInTheDocument();
    expect(screen.getByTestId('debug-calculable-dates')).toHaveTextContent(serviceDate);
    expect(screen.getByTestId('debug-current-user-has-result')).toHaveTextContent('yes');

    const outcome = screen.getByTestId('actual-kitchen-outcome-section');
    expect(outcome.compareDocumentPosition(debugPanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('hides parser diagnostics in normal participant mode', () => {
    ingestInputCollectionsForTests(embeddedKitchenPayload());
    render(<ChefResultsParticipantApp />);

    expect(screen.queryByTestId('chef-results-debug-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('gamebus-kitchen-diagnostics')).not.toBeInTheDocument();
  });
});

describe('embedded chef results loading boundary', () => {
  let originalParent: Window;

  beforeEach(() => {
    resetGameBusBridgeForTests();
    vi.spyOn(detectEmbedModule, 'isGameBusEmbed').mockReturnValue(true);
    vi.spyOn(operationalCalendarModule, 'resolveChefResultsServiceDate').mockReturnValue(serviceDate);
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

  it('does not render fixture result cards while INPUT_COLLECTIONS is pending', () => {
    render(<ChefResultsParticipantApp />);

    expect(screen.getByTestId('chef-results-pending')).toHaveTextContent('Loading kitchen results…');
    expect(screen.queryByTestId('participant-summary-cards')).not.toBeInTheDocument();
    expect(screen.queryByTestId('category-outcome-visual')).not.toBeInTheDocument();
    expect(screen.queryByTestId('team-comparison-section')).not.toBeInTheDocument();
  });

  it('does not render the service-date dropdown while INPUT_COLLECTIONS is pending', () => {
    render(<ChefResultsParticipantApp />);

    expect(screen.queryByTestId('chef-results-date-select')).not.toBeInTheDocument();
  });

  it('does not render fixture kitchen progress while INPUT_COLLECTIONS is pending', () => {
    render(<ChefResultsParticipantApp />);

    expect(screen.queryByTestId('kitchen-progress-section')).not.toBeInTheDocument();
    expect(screen.queryByText('5')).not.toBeInTheDocument();
    expect(screen.queryByText('4.12 kg')).not.toBeInTheDocument();
  });

  it('does not render fixture your week history while INPUT_COLLECTIONS is pending', () => {
    render(<ChefResultsParticipantApp />);

    expect(screen.queryByTestId('your-week-section')).not.toBeInTheDocument();
    expect(screen.queryByTestId('week-trend-over')).not.toBeInTheDocument();
  });
});

describe('standalone chef results fixtures', () => {
  beforeEach(() => {
    resetGameBusBridgeForTests();
    vi.spyOn(detectEmbedModule, 'isGameBusEmbed').mockReturnValue(false);
    vi.spyOn(operationalCalendarModule, 'resolveChefResultsServiceDate').mockReturnValue('2026-07-31');
    window.sessionStorage.clear();
    window.sessionStorage.setItem(
      'chef-results-fixture-current-user-id',
      DEFAULT_FIXTURE_CURRENT_USER_ID,
    );
  });

  afterEach(() => {
    cleanup();
    resetGameBusBridgeForTests();
    window.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('still renders fixture participant results in standalone mode', () => {
    render(<ChefResultsParticipantApp />);

    expect(screen.queryByTestId('chef-results-pending')).not.toBeInTheDocument();
    expect(screen.getByTestId('actual-kitchen-outcome-section')).toBeInTheDocument();
    expect(screen.getByTestId('forecast-impact-section')).toBeInTheDocument();
    expect(screen.getByTestId('participant-summary-cards')).toBeInTheDocument();
    expect(screen.getByTestId('your-week-section')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-progress-section')).toBeInTheDocument();
    expect(screen.queryByTestId('chef-results-date-select')).not.toBeInTheDocument();
    expect(screen.getByText(/Service date: Friday, 31 July 2026/)).toBeInTheDocument();
  });
});
