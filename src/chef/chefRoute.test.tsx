// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AppRouter } from '../AppRouter';
import { resolveMealSlotsForDate } from '../services/mealSlots';
import { MENU_DATES } from '../test/fixtures/dates';
import * as datesModule from '../utils/dates';

function setHash(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

describe('App routing', () => {
  beforeEach(() => {
    setHash('');
  });

  afterEach(() => {
    cleanup();
    setHash('');
    vi.restoreAllMocks();
  });

  it('student root loads student lunch UI', () => {
    render(<AppRouter />);
    expect(screen.getByText(/Tomorrow.s lunch/)).toBeInTheDocument();
    expect(screen.queryByText('Tomorrow\'s kitchen forecast')).not.toBeInTheDocument();
  });

  it('chef route loads chef forecast UI without changing student root', () => {
    setHash('#/chef');
    render(<AppRouter />);
    expect(screen.getByText('Tomorrow\'s kitchen forecast')).toBeInTheDocument();
    expect(screen.queryByText(/Tomorrow.s lunch/)).not.toBeInTheDocument();
  });

  it('known available date shows four menu forecast cards on chef route', () => {
    vi.spyOn(datesModule, 'getTomorrowIsoDate').mockReturnValue(MENU_DATES.runtimeWednesday);
    setHash('#/chef');
    const slots = resolveMealSlotsForDate(MENU_DATES.runtimeWednesday)!;
    render(<AppRouter />);
    expect(screen.getByText(slots.main.name)).toBeInTheDocument();
    expect(screen.getByText(slots.vegetarian.name)).toBeInTheDocument();
    expect(screen.getByText(slots.soup.name)).toBeInTheDocument();
    expect(screen.getByText(slots.dessert.name)).toBeInTheDocument();
    expect(screen.getAllByText('portions').length).toBeGreaterThanOrEqual(4);
  });

  it('chef route shows submit forecast button', () => {
    setHash('#/chef');
    render(<AppRouter />);
    expect(screen.getByRole('button', { name: 'Submit forecast' })).toBeInTheDocument();
  });
});
