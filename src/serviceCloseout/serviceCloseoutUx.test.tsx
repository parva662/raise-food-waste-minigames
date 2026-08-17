// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRouter } from '../AppRouter';
import { ServiceCloseoutApp } from './ServiceCloseoutApp';
import { MENU_DATES } from '../test/fixtures/dates';
import { resolveMealSlotsForDate } from '../services/mealSlots';
import * as datesModule from '../utils/dates';
import { CLOSEOUT_OVERPRODUCTION_EXCEEDS_PREPARED_ERROR } from './validation';
import { CLOSEOUT_INCOMPLETE_MESSAGE } from './types';

function setHash(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

function getPreparedInput(category: string) {
  const group = screen.getByRole('group', { name: new RegExp(`^${category}:`, 'i') });
  return within(group).getByLabelText(new RegExp(`${category} prepared portions`, 'i'));
}

function getWasteInput(category: string) {
  const group = screen.getByRole('group', { name: new RegExp(`^${category}:`, 'i') });
  return within(group).getByLabelText(new RegExp(`${category} overproduction waste`, 'i'));
}

async function fillCloseoutForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Actual customers'), '150');
  await user.type(getPreparedInput('Main'), '110');
  await user.type(getWasteInput('Main'), '850');
  await user.type(getPreparedInput('Vegetarian'), '52');
  await user.type(getWasteInput('Vegetarian'), '360');
  await user.type(getPreparedInput('Soup'), '40');
  await user.type(getWasteInput('Soup'), '500');
  await user.type(getPreparedInput('Dessert'), '35');
  await user.type(getWasteInput('Dessert'), '180');
}

describe('service closeout routing', () => {
  beforeEach(() => setHash(''));
  afterEach(() => {
    cleanup();
    setHash('');
    vi.restoreAllMocks();
  });

  it('loads service closeout route at #/service-closeout', () => {
    setHash('#/service-closeout');
    render(<AppRouter />);
    expect(screen.getByRole('heading', { name: 'Service closeout' })).toBeInTheDocument();
  });

  it('student root remains unchanged', () => {
    render(<AppRouter />);
    expect(screen.getByText(/Tomorrow.s lunch/)).toBeInTheDocument();
  });

  it('chef route remains unchanged', () => {
    setHash('#/chef');
    render(<AppRouter />);
    expect(screen.getByText("Tomorrow's kitchen forecast")).toBeInTheDocument();
    expect(screen.queryByTestId('closeout-input-collections-debug')).not.toBeInTheDocument();
  });

  it('shows INPUT_COLLECTIONS debug toggle only on service closeout in dev', async () => {
    setHash('#/service-closeout');
    render(<AppRouter />);
    expect(screen.getByTestId('closeout-input-collections-debug')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /show raw input_collections/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/GameBus input collections \(dev\)/i)).not.toBeInTheDocument();

    cleanup();
    setHash('');
    render(<AppRouter />);
    expect(screen.queryByTestId('closeout-input-collections-debug')).not.toBeInTheDocument();
  });
});

describe('service closeout UX', () => {
  beforeEach(() => {
    vi.spyOn(datesModule, 'getTodayIsoDate').mockReturnValue(MENU_DATES.runtimeWednesday);
    setHash('#/service-closeout');
  });

  afterEach(() => {
    cleanup();
    setHash('');
    vi.restoreAllMocks();
  });

  it('uses today service date and resolves menu categories', () => {
    const slots = resolveMealSlotsForDate(MENU_DATES.runtimeWednesday)!;
    render(<ServiceCloseoutApp />);
    expect(screen.getByText(slots.main.name)).toBeInTheDocument();
    expect(screen.getByText(slots.vegetarian.name)).toBeInTheDocument();
    expect(screen.getByText(slots.soup.name)).toBeInTheDocument();
    expect(screen.getByText(slots.dessert.name)).toBeInTheDocument();
  });

  it('shows read-only portion weights from fixture reference', () => {
    render(<ServiceCloseoutApp />);
    expect(screen.getByLabelText('Main standard portion weight')).toHaveTextContent('120 g / portion');
    expect(screen.getByLabelText('Soup standard portion weight')).toHaveTextContent('250 g / portion');
  });

  it('starts required fields blank and disables finalize', () => {
    render(<ServiceCloseoutApp />);
    expect(screen.getByLabelText('Actual customers')).toHaveValue('');
    expect(screen.getByTestId('closeout-recorded-by')).toHaveTextContent('—');
    expect(getPreparedInput('Main')).toHaveValue('');
    expect(getWasteInput('Main')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Finalize service' })).toBeDisabled();
    expect(screen.getByText(CLOSEOUT_INCOMPLETE_MESSAGE)).toBeInTheDocument();
  });

  it('accepts explicit zero as valid values', async () => {
    const user = userEvent.setup();
    render(<ServiceCloseoutApp />);
    await user.type(screen.getByLabelText('Actual customers'), '0');
    for (const category of ['Main', 'Vegetarian', 'Soup', 'Dessert']) {
      await user.type(getPreparedInput(category), '0');
      await user.type(getWasteInput(category), '0');
    }
    expect(screen.getByRole('button', { name: 'Finalize service' })).not.toBeDisabled();
  });

  it('rejects waste greater than prepared weight', async () => {
    const user = userEvent.setup();
    render(<ServiceCloseoutApp />);
    await user.type(getPreparedInput('Main'), '10');
    await user.type(getWasteInput('Main'), '1500');
    expect(screen.getByText(CLOSEOUT_OVERPRODUCTION_EXCEEDS_PREPARED_ERROR)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finalize service' })).toBeDisabled();
  });

  it('finalizes locally and prevents duplicate finalization', async () => {
    const user = userEvent.setup();
    render(<ServiceCloseoutApp />);
    await fillCloseoutForm(user);
    const button = screen.getByRole('button', { name: 'Finalize service' });
    expect(button).not.toBeDisabled();
    await user.click(button);
    expect(screen.getByText(/Service closeout finalized/)).toBeInTheDocument();
    expect(button).toBeDisabled();
    expect(screen.getByLabelText('Actual customers')).toBeDisabled();
  });

  it('blocks finalize on closed menu day', () => {
    vi.spyOn(datesModule, 'getTodayIsoDate').mockReturnValue(MENU_DATES.closedWorkbookDay);
    render(<ServiceCloseoutApp />);
    expect(screen.getByText(/cannot be finalized/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Finalize service' })).not.toBeInTheDocument();
  });
});
