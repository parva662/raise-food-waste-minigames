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
          template: { slug: 'wasteMeasurement', name: 'Waste measurement' },
          createdAt: '2026-07-29T15:00:00.000Z',
          actor: { id: 'recorder-1', name: 'Recorder One' },
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
        },
      ],
    },
  };
}

function expectNoParticipantDebugUi() {
  expect(screen.queryByText('GameBus debug')).not.toBeInTheDocument();
  expect(screen.queryByTestId('chef-results-debug-panel')).not.toBeInTheDocument();
  expect(screen.queryByTestId('gamebus-user-diagnostic')).not.toBeInTheDocument();
  expect(screen.queryByTestId('debug-input-collections')).not.toBeInTheDocument();
  expect(screen.queryByTestId('debug-frontend-build')).not.toBeInTheDocument();
  expect(screen.queryByTestId('debug-input-collection-keys')).not.toBeInTheDocument();
  expect(screen.queryByTestId('debug-raw-activity-count')).not.toBeInTheDocument();
  expect(screen.queryByTestId('gamebus-user-id')).not.toBeInTheDocument();
  expect(screen.queryByTestId('gamebus-user-name')).not.toBeInTheDocument();
}

describe('participant INPUT_COLLECTIONS debug UI regression', () => {
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

  it('does not render INPUT_COLLECTIONS diagnostics on participant page with gamebusDebug=1', () => {
    ingestInputCollectionsForTests(embeddedKitchenPayload());
    render(<ChefResultsParticipantApp />);

    const frontendDiagnosticId = getChefResultsFrontendDiagnosticIdentifier();
    expect(screen.queryByText(frontendDiagnosticId.label)).not.toBeInTheDocument();
    expectNoParticipantDebugUi();
    expect(screen.getByTestId('chef-results-participant-page')).toBeInTheDocument();
  });

  it('does not render INPUT_COLLECTIONS diagnostics without gamebusDebug=1', () => {
    window.location.hash = '#/chef-results';
    ingestInputCollectionsForTests(embeddedKitchenPayload());
    render(<ChefResultsParticipantApp />);

    expectNoParticipantDebugUi();
  });
});
