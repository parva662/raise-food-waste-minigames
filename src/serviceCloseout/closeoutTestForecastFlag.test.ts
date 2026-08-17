// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup } from '@testing-library/react';
import { parseCloseoutTestForecastFlag } from './closeoutServiceDate';

describe('closeout test forecast flag', () => {
  const originalHash = window.location.hash;

  afterEach(() => {
    window.location.hash = originalHash;
    cleanup();
  });

  it('is disabled on the normal service closeout route', () => {
    window.location.hash = '#/service-closeout';
    expect(parseCloseoutTestForecastFlag()).toBe(false);
  });

  it('is enabled only with explicit testForecast=1 on service closeout', () => {
    window.location.hash = '#/service-closeout?testForecast=1';
    expect(parseCloseoutTestForecastFlag()).toBe(true);
  });

  it('is disabled on other routes even with testForecast=1', () => {
    window.location.hash = '#/chef?testForecast=1';
    expect(parseCloseoutTestForecastFlag()).toBe(false);
  });
});
