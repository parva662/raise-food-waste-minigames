// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isChefResultsGameBusDebugMode,
  isChefResultsGameBusInvestigationEnabled,
} from './chefResultsInvestigation';

describe('chef results GameBus investigation flag', () => {
  const originalHash = window.location.hash;

  afterEach(() => {
    window.location.hash = originalHash;
    vi.unstubAllEnvs();
  });

  it('enables debug mode only on #/chef-results?gamebusDebug=1', () => {
    window.location.hash = '#/chef-results?gamebusDebug=1';
    expect(isChefResultsGameBusDebugMode()).toBe(true);
    expect(isChefResultsGameBusInvestigationEnabled()).toBe(true);
  });

  it('does not enable debug mode without the query flag', () => {
    vi.stubEnv('DEV', false);
    window.location.hash = '#/chef-results';
    expect(isChefResultsGameBusDebugMode()).toBe(false);
    expect(isChefResultsGameBusInvestigationEnabled()).toBe(false);
  });

  it('does not enable debug mode on other routes', () => {
    window.location.hash = '#/chef?gamebusDebug=1';
    expect(isChefResultsGameBusDebugMode()).toBe(false);
  });
});
