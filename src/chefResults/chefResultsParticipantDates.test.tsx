// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ChefResultsParticipantApp } from './ChefResultsParticipantApp';
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

const staff1Id = 'staff1-user';
const testAccountId = 'test-account-user';
const sep2 = '2026-09-02';
const sep7 = '2026-09-07';
const sep8 = '2026-09-08';

function mePayload(userId: string) {
  return {
    id: userId,
    firstName: 'Staff',
    lastName: 'One',
    roles: ['chef'],
  };
}

function wasteMeasurementForDate(
  serviceDate: string,
  overrides: {
    submittedAt?: string;
    actualCustomers?: number;
    overproductionMeatKg?: number;
    overproductionVegetarianKg?: number;
    overproductionSoupKg?: number;
    overproductionDessertKg?: number;
  } = {},
) {
  return {
    id: `wm-${serviceDate}`,
    template: { slug: 'wasteMeasurement', name: 'Waste measurement' },
    createdAt: `${serviceDate}T15:00:00.000Z`,
    properties: [
      { template: { slug: 'serviceDate' }, value: { value: serviceDate } },
      { template: { slug: 'actualCustomers' }, value: { value: overrides.actualCustomers ?? 140 } },
      { template: { slug: 'mainItemId' }, value: { value: 'meatballs' } },
      { template: { slug: 'preparedMainQuantity' }, value: { value: 110 } },
      { template: { slug: 'vegetarianItemId' }, value: { value: 'quorn' } },
      { template: { slug: 'preparedVegetarianQuantity' }, value: { value: 50 } },
      { template: { slug: 'soupItemId' }, value: { value: 'pumpkin-soup' } },
      { template: { slug: 'preparedSoupQuantity' }, value: { value: 40 } },
      { template: { slug: 'dessertItemId' }, value: { value: 'apple-compote' } },
      { template: { slug: 'preparedDessertQuantity' }, value: { value: 40 } },
      {
        template: { slug: 'overproductionMeatKg' },
        value: { value: overrides.overproductionMeatKg ?? 0.3 },
      },
      {
        template: { slug: 'overproductionVegetarianKg' },
        value: { value: overrides.overproductionVegetarianKg ?? 0.6 },
      },
      {
        template: { slug: 'overproductionSoupKg' },
        value: { value: overrides.overproductionSoupKg ?? 0.1 },
      },
      {
        template: { slug: 'overproductionDessertKg' },
        value: { value: overrides.overproductionDessertKg ?? 0.02 },
      },
      {
        template: { slug: 'submittedAt' },
        value: { value: overrides.submittedAt ?? `${serviceDate}T15:00:00.000Z` },
      },
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

describe('canonical participant results in embedded mode', () => {
  let originalParent: Window;

  beforeEach(() => {
    resetGameBusBridgeForTests();
    vi.spyOn(detectEmbedModule, 'isGameBusEmbed').mockReturnValue(true);
    vi.spyOn(operationalCalendarModule, 'resolveChefResultsServiceDate').mockReturnValue(sep7);
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

  it('does not use an old Sep 2 result when the canonical date is Sep 7', () => {
    ingestInputCollectionsForTests(
      embeddedPayload(testAccountId, [
        buildAnonymizedChefForecastActivity({
          actorId: testAccountId,
          actorName: 'Test Account',
          targetDate: sep2,
          forecastTotalCustomers: 160,
        }),
        wasteMeasurementForDate(sep2),
        wasteMeasurementForDate(sep7),
      ]),
    );
    render(<ChefResultsParticipantApp />);

    expect(screen.queryByTestId('chef-results-date-select')).not.toBeInTheDocument();
    expect(screen.getByTestId('participant-no-forecast-result')).toHaveTextContent(
      'No forecast result for Monday, 7 September 2026.',
    );
    expect(screen.queryByText('34.27 kg')).not.toBeInTheDocument();
    expect(screen.queryByTestId('forecast-impact-section')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-progress-section')).not.toBeInTheDocument();
  });

  it('shows no closeout state when the canonical date has no wasteMeasurement yet', () => {
    ingestInputCollectionsForTests(
      embeddedPayload(staff1Id, [
        buildAnonymizedChefForecastActivity({
          actorId: staff1Id,
          actorName: 'Staff One',
          targetDate: sep8,
        }),
      ]),
    );
    render(<ChefResultsParticipantApp />);

    expect(screen.getByTestId('participant-results-unavailable-closeout')).toHaveTextContent(
      'Results are not available yet for Monday, 7 September 2026.',
    );
    expect(screen.queryByTestId('kitchen-progress-section')).not.toBeInTheDocument();
    expect(screen.queryByTestId('team-comparison-section')).not.toBeInTheDocument();
  });

  it('shows no forecast state when Monday closeout exists but the user did not forecast Monday', () => {
    ingestInputCollectionsForTests(
      embeddedPayload(testAccountId, [
        buildAnonymizedChefForecastActivity({
          actorId: 'coworker',
          actorName: 'Coworker Chef',
          targetDate: sep7,
        }),
        wasteMeasurementForDate(sep7),
      ]),
    );
    render(<ChefResultsParticipantApp />);

    expect(screen.getByTestId('participant-no-forecast-result')).toHaveTextContent(
      'You did not submit a valid forecast for this service date.',
    );
    expect(screen.queryByTestId('forecast-impact-section')).not.toBeInTheDocument();
  });

  it('shows Monday results and team comparison for the canonical date', () => {
    ingestInputCollectionsForTests(
      embeddedPayload(staff1Id, [
        buildAnonymizedChefForecastActivity({
          actorId: staff1Id,
          actorName: 'Staff One',
          targetDate: sep7,
        }),
        buildAnonymizedChefForecastActivity({
          id: 'coworker-forecast',
          actorId: 'coworker',
          actorName: 'Coworker Chef',
          targetDate: sep7,
        }),
        wasteMeasurementForDate(sep7),
      ]),
    );
    render(<ChefResultsParticipantApp />);

    expect(screen.getByText(/Service date: Monday, 7 September 2026/)).toBeInTheDocument();
    expect(screen.queryByTestId('chef-results-date-select')).not.toBeInTheDocument();
    expect(screen.getByTestId('forecast-impact-section')).toBeInTheDocument();
    expect(screen.getByTestId('team-comparison-section')).toBeInTheDocument();
    expect(screen.queryByText('Coworker Chef')).not.toBeInTheDocument();
    expect(screen.getByTestId('kitchen-progress-section')).toBeInTheDocument();
  });

  it('never pairs a Sep 8 forecast with a Sep 7 closeout', () => {
    ingestInputCollectionsForTests(
      embeddedPayload(staff1Id, [
        buildAnonymizedChefForecastActivity({
          actorId: staff1Id,
          actorName: 'Staff One',
          targetDate: sep8,
        }),
        wasteMeasurementForDate(sep7),
      ]),
    );
    render(<ChefResultsParticipantApp />);

    expect(screen.getByTestId('participant-no-forecast-result')).toBeInTheDocument();
    expect(screen.queryByTestId('forecast-impact-section')).not.toBeInTheDocument();
  });

  it('uses the latest duplicate Monday forecast for the canonical date', () => {
    ingestInputCollectionsForTests(
      embeddedPayload(staff1Id, [
        buildAnonymizedChefForecastActivity({
          id: 'f-old',
          actorId: staff1Id,
          actorName: 'Staff One',
          targetDate: sep7,
          submittedAt: '2026-09-06T10:00:00.000Z',
          forecastTotalCustomers: 100,
        }),
        buildAnonymizedChefForecastActivity({
          id: 'f-new',
          actorId: staff1Id,
          actorName: 'Staff One',
          targetDate: sep7,
          submittedAt: '2026-09-06T16:00:00.000Z',
          forecastTotalCustomers: 142,
        }),
        wasteMeasurementForDate(sep7),
      ]),
    );
    render(<ChefResultsParticipantApp />);

    expect(screen.getByTestId('participant-summary-cards')).toHaveTextContent('142');
    expect(screen.getByTestId('participant-summary-cards')).not.toHaveTextContent('100');
  });

  it('resolves the same canonical date for every authenticated staff account', () => {
    const canonicalSpy = vi.spyOn(operationalCalendarModule, 'resolveChefResultsServiceDate');
    canonicalSpy.mockReturnValue(sep7);

    ingestInputCollectionsForTests(
      embeddedPayload(staff1Id, [wasteMeasurementForDate(sep7)]),
    );
    const { unmount } = render(<ChefResultsParticipantApp />);
    expect(canonicalSpy).toHaveBeenCalled();
    unmount();

    ingestInputCollectionsForTests(
      embeddedPayload(testAccountId, [wasteMeasurementForDate(sep7)]),
    );
    render(<ChefResultsParticipantApp />);
    expect(canonicalSpy.mock.results.every((result) => result.value === sep7)).toBe(true);
  });
});
