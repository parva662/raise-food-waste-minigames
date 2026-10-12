// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  buildForecastIdentityDebugSnapshot,
  logForecastIdentityDebug,
} from '@/products/forecast-results/debug/logForecastIdentityDebug';
import {
  INPUT_COLLECTION_PARI_KEY,
  INPUT_COLLECTION_PARI_ME_REQUEST_KEY,
} from '@/platform/gamebus/inputCollections';
import {
  KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY,
  KITCHEN_GROUP_INPUT_COLLECTION_KEY,
} from '@/platform/gamebus/groupActivities';
import { buildAnonymizedChefForecastActivity } from '@/products/service-closeout/forecast/fixtures/gameBusChefForecastActivities';

describe('logForecastIdentityDebug', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.location.hash = '';
  });

  it('summarizes me.id, unique forecast actors, and matching forecast count', () => {
    const payload = {
      [INPUT_COLLECTION_PARI_KEY]: {
        [INPUT_COLLECTION_PARI_ME_REQUEST_KEY]: {
          id: 'chef-b',
          firstName: 'Chef',
          lastName: 'B',
        },
      },
      [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
        [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [
          buildAnonymizedChefForecastActivity({
            id: 'a1',
            actorId: 'chef-a',
            actorName: 'Chef A',
            targetDate: '2026-09-02',
          }),
          buildAnonymizedChefForecastActivity({
            id: 'a2',
            actorId: 'chef-a',
            actorName: 'Chef A',
            targetDate: '2026-09-08',
          }),
          {
            id: 'wm-1',
            template: { slug: 'wasteMeasurement', name: 'Waste measurement' },
            createdAt: '2026-09-02T15:00:00.000Z',
            properties: [
              { template: { slug: 'serviceDate' }, value: { value: '2026-09-02' } },
            ],
          },
        ],
      },
    };

    const snapshot = buildForecastIdentityDebugSnapshot(payload);
    expect(snapshot.authenticatedUserId).toBe('chef-b');
    expect(snapshot.uniqueForecastActorIds).toEqual(['chef-a']);
    expect(snapshot.forecastsMatchingAuthenticatedUser).toBe(0);
    expect(snapshot.matchingTargetDates).toEqual([]);
    expect(snapshot.closeoutServiceDates).toEqual(['2026-09-02']);
  });

  it('logs scalar lines only when gamebusDebug=1', () => {
    window.location.hash = '#/chef-results?gamebusDebug=1';
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    logForecastIdentityDebug({
      [INPUT_COLLECTION_PARI_KEY]: {
        [INPUT_COLLECTION_PARI_ME_REQUEST_KEY]: {
          id: 'chef-b',
          firstName: 'Chef',
          lastName: 'B',
        },
      },
      [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
        [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [
          buildAnonymizedChefForecastActivity({
            id: 'a1',
            actorId: 'chef-a',
            actorName: 'Chef A',
            targetDate: '2026-09-02',
          }),
        ],
      },
    });

    expect(infoSpy).toHaveBeenCalledWith('Authenticated user ID: chef-b');
    expect(infoSpy).toHaveBeenCalledWith('Unique Forecast actor IDs: chef-a');
    expect(infoSpy).toHaveBeenCalledWith('Forecasts matching authenticated user: 0');
    expect(infoSpy.mock.calls.every((call) => typeof call[0] === 'string')).toBe(true);
  });

  it('does not log without gamebusDebug=1', () => {
    window.location.hash = '#/chef-results';
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logForecastIdentityDebug({
      [INPUT_COLLECTION_PARI_KEY]: {
        [INPUT_COLLECTION_PARI_ME_REQUEST_KEY]: {
          id: 'chef-b',
          firstName: 'Chef',
          lastName: 'B',
        },
      },
    });
    expect(infoSpy).not.toHaveBeenCalled();
  });
});
