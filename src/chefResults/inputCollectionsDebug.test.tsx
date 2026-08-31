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
import { getChefResultsFrontendDiagnosticIdentifier } from './debug/frontendBuildIdentifier';

const serviceDate = '2026-07-29';

function embeddedKitchenPayload() {
  return {
    [INPUT_COLLECTION_PARI_KEY]: {
      [INPUT_COLLECTION_PARI_ME_REQUEST_KEY]: {
        id: 'real-user-abc',
        firstName: 'Test',
        lastName: 'Account',
      },
    },
    [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
      [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [
        buildAnonymizedChefForecastActivity({
          actorId: 'real-user-abc',
          actorName: 'Test Account',
          targetDate: serviceDate,
        }),
        {
          id: 'wm-1',
          template: { reference: 'wasteMeasurement', name: 'Waste measurement' },
          createdAt: '2026-07-29T15:00:00.000Z',
          actor: { id: 'recorder-1', name: 'Recorder One' },
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
        },
      ],
    },
  };
}

describe('INPUT_COLLECTIONS debug panel', () => {
  let originalParent: Window;

  beforeEach(() => {
    resetGameBusBridgeForTests();
    vi.spyOn(detectEmbedModule, 'isGameBusEmbed').mockReturnValue(true);
    window.sessionStorage.clear();
    window.location.hash = '#/chef-results?gamebusDebug=1';
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

  it('renders INPUT_COLLECTIONS diagnostics in gamebusDebug mode', () => {
    ingestInputCollectionsForTests(embeddedKitchenPayload());
    render(<ChefResultsParticipantApp />);

    const frontendDiagnosticId = getChefResultsFrontendDiagnosticIdentifier();
    expect(screen.getByText(frontendDiagnosticId.label)).toBeInTheDocument();
    expect(screen.getByTestId('debug-frontend-build')).toHaveTextContent(
      frontendDiagnosticId.value,
    );
    expect(screen.getByTestId('debug-input-collection-keys')).toHaveTextContent(
      'inputCollectionPari',
    );
    expect(screen.getByTestId('debug-input-collection-keys')).toHaveTextContent(
      'kitchenGroupInput',
    );
    expect(screen.getByTestId('debug-has-pari-me')).toHaveTextContent('yes');
    expect(screen.getByTestId('debug-has-kitchen-activities')).toHaveTextContent('yes');
    expect(screen.getByTestId('debug-raw-activities-shape')).toHaveTextContent('array');
    expect(screen.getByTestId('debug-raw-activity-count')).toHaveTextContent('2');
    expect(screen.getByTestId('debug-template-count-chefForecast')).toHaveTextContent(
      'chefForecast: 1',
    );
    expect(screen.getByTestId('debug-template-count-wasteMeasurement')).toHaveTextContent(
      'wasteMeasurement: 1',
    );
    expect(screen.getByTestId('debug-waste-activity-id')).toHaveTextContent('wm-1');
    expect(screen.getByTestId('debug-waste-property-refs')).toHaveTextContent('serviceDate');
    expect(screen.getByTestId('debug-waste-missing-required')).toHaveTextContent('none');
    expect(screen.getByTestId('debug-newest-group-activity-created-at')).toHaveTextContent(
      '2026-07-29',
    );
    expect(screen.getByTestId('debug-identity-source')).toHaveTextContent('inputCollectionPari.me');
  });

  it('does not render INPUT_COLLECTIONS diagnostics without gamebusDebug=1', () => {
    window.location.hash = '#/chef-results';
    ingestInputCollectionsForTests(embeddedKitchenPayload());
    render(<ChefResultsParticipantApp />);

    expect(screen.queryByTestId('gamebus-user-diagnostic')).not.toBeInTheDocument();
    expect(screen.queryByTestId('debug-input-collections')).not.toBeInTheDocument();
    expect(screen.queryByTestId('debug-frontend-build')).not.toBeInTheDocument();
  });
});
