// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { ChefApp } from './ChefApp';
import { buildChefActivityMessage } from '../gamebus/buildChefActivityMessage';
import { pariChefForecastTaskFixture } from '../gamebus/chefTaskFixtures';
import { resolveMealSlotsForDate } from '../services/mealSlots';
import { MENU_DATES } from '../test/fixtures/dates';
import * as operationalCalendarModule from '../services/operationalServiceCalendar';

function getSoupInput() {
  const group = screen.getByRole('group', { name: /^Soup:/i });
  return within(group).getByRole('textbox');
}

function getDessertInput() {
  const group = screen.getByRole('group', { name: /^Dessert:/i });
  return within(group).getByRole('textbox');
}

function getMainInput() {
  const group = screen.getByRole('group', { name: /^Main:/i });
  return within(group).getByRole('textbox');
}

function getVegetarianInput() {
  const group = screen.getByRole('group', { name: /^Vegetarian:/i });
  return within(group).getByRole('textbox');
}

function getExpectedCustomersInput() {
  const form = screen.getByLabelText('Menu forecast quantities');
  return within(form).getByLabelText('Expected total customers');
}

describe('chef soup and dessert sync', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.spyOn(operationalCalendarModule, 'resolveChefForecastServiceDate').mockReturnValue(
      MENU_DATES.runtimeWednesday,
    );
  });

  it('sets dessert to 50 when soup is 50', () => {
    render(<ChefApp />);
    fireEvent.change(getSoupInput(), { target: { value: '50' } });
    expect(getSoupInput()).toHaveValue('50');
    expect(getDessertInput()).toHaveValue('50');
  });

  it('sets dessert to 0 when soup is 0', () => {
    render(<ChefApp />);
    fireEvent.change(getSoupInput(), { target: { value: '0' } });
    expect(getSoupInput()).toHaveValue('0');
    expect(getDessertInput()).toHaveValue('0');
  });

  it('clears dessert when soup is cleared', () => {
    render(<ChefApp />);
    fireEvent.change(getSoupInput(), { target: { value: '50' } });
    fireEvent.change(getSoupInput(), { target: { value: '' } });
    expect(getSoupInput()).toHaveValue('');
    expect(getDessertInput()).toHaveValue('');
  });

  it('does not allow independent dessert editing', () => {
    render(<ChefApp />);
    fireEvent.change(getSoupInput(), { target: { value: '50' } });
    expect(getDessertInput()).toBeDisabled();
    fireEvent.change(getDessertInput(), { target: { value: '42' } });
    expect(getDessertInput()).toHaveValue('50');
  });

  it('submits matching forecastSoup and forecastDessert values', () => {
    const mealSlots = resolveMealSlotsForDate(MENU_DATES.runtimeWednesday)!;
    const submission = {
      targetDate: MENU_DATES.runtimeWednesday,
      timingStatus: 'on-time' as const,
      submittedAt: '2026-07-28T12:00:00.000Z',
    };
    const message = buildChefActivityMessage(pariChefForecastTaskFixture, submission, {
      expectedCustomers: 100,
      mainQuantity: 80,
      vegetarianQuantity: 20,
      soupQuantity: 50,
      dessertQuantity: 50,
      confidence: null,
      notes: '',
    }, mealSlots);
    const props = Object.fromEntries(message.data.properties.map((p) => [p.template, p.obj]));
    expect(props.forecastSoup).toEqual({ value: 50 });
    expect(props.forecastDessert).toEqual({ value: 50 });
  });

  it('keeps main and vegetarian independent from soup', () => {
    render(<ChefApp />);
    fireEvent.change(getMainInput(), { target: { value: '70' } });
    fireEvent.change(getVegetarianInput(), { target: { value: '15' } });
    fireEvent.change(getSoupInput(), { target: { value: '50' } });
    expect(getMainInput()).toHaveValue('70');
    expect(getVegetarianInput()).toHaveValue('15');
    expect(getDessertInput()).toHaveValue('50');
  });

  it('keeps expected customers independent from soup', () => {
    render(<ChefApp />);
    fireEvent.change(getExpectedCustomersInput(), { target: { value: '120' } });
    fireEvent.change(getSoupInput(), { target: { value: '50' } });
    expect(getExpectedCustomersInput()).toHaveValue('120');
    expect(getDessertInput()).toHaveValue('50');
  });

  it('shows dessert helper copy', () => {
    render(<ChefApp />);
    expect(screen.getByText('Matches soup menu')).toBeInTheDocument();
  });
});
