// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { ChefApp } from './ChefApp';
import { helsinki } from '../test/fixtures/dates';
import * as detectEmbedModule from '../gamebus/detectEmbed';
import { ingestTaskForTests, resetGameBusBridgeForTests } from '../gamebus/bridge';
import { pariChefForecastTaskFixture } from '../gamebus/chefTaskFixtures';
import { resolveMealSlotsForDate } from '../services/mealSlots';
import type { ActivityMessage } from '../gamebus/types';

const MONDAY = '2026-08-17';
const TUESDAY = '2026-08-18';

function getForecastForm() {
  return screen.getByLabelText('Menu forecast quantities');
}

function getExpectedCustomersInput() {
  return within(getForecastForm()).getByLabelText('Expected total customers');
}

function getCategoryInput(category: string) {
  const group = screen.getByRole('group', { name: new RegExp(`^${category}:`, 'i') });
  return within(group).getByRole('textbox');
}

function getSubmitButton() {
  return screen.getByRole('button', { name: 'Submit forecast' });
}

function fillForecast(values: {
  customers: string;
  main: string;
  vegetarian: string;
  soup: string;
}) {
  fireEvent.change(getExpectedCustomersInput(), { target: { value: values.customers } });
  fireEvent.change(getCategoryInput('Main'), { target: { value: values.main } });
  fireEvent.change(getCategoryInput('Vegetarian'), { target: { value: values.vegetarian } });
  fireEvent.change(getCategoryInput('Soup'), { target: { value: values.soup } });
}

/** Activities the parent frame actually received; a postMessage that threw delivered nothing. */
function postedActivities(postMessage: ReturnType<typeof vi.fn>): ActivityMessage[] {
  return postMessage.mock.calls
    .filter((_call, index) => postMessage.mock.results[index]?.type !== 'throw')
    .map((call) => call[0] as ActivityMessage)
    .filter((message) => message?.type === 'ACTIVITY');
}

function propertyMap(message: ActivityMessage) {
  return Object.fromEntries(message.data.properties.map((property) => [property.template, property.obj]));
}

describe('kitchen forecast submission lifecycle', () => {
  let originalParent: Window;
  let postMessage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resetGameBusBridgeForTests();
    vi.spyOn(detectEmbedModule, 'isGameBusEmbed').mockReturnValue(true);
    postMessage = vi.fn();
    originalParent = window.parent;
    Object.defineProperty(window, 'parent', { configurable: true, value: { postMessage } });
  });

  afterEach(() => {
    cleanup();
    resetGameBusBridgeForTests();
    Object.defineProperty(window, 'parent', { configurable: true, value: originalParent });
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('submits directly from the form without a separate review screen', () => {
    ingestTaskForTests(pariChefForecastTaskFixture);
    render(<ChefApp clock={() => helsinki(MONDAY, '08:15:00')} />);

    fillForecast({ customers: '120', main: '50', vegetarian: '30', soup: '40' });
    fireEvent.click(getSubmitButton());

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const activities = postedActivities(postMessage);
    expect(activities).toHaveLength(1);
    expect(activities[0]!.data.template).toBe('chefForecast');
    expect(propertyMap(activities[0]!).targetDate).toEqual({ value: MONDAY });
    expect(screen.getByText(/Forecast submitted for/)).toBeInTheDocument();
  });

  it('records a complete ACTIVITY with on-time status and no forbidden properties', () => {
    ingestTaskForTests(pariChefForecastTaskFixture);
    render(<ChefApp clock={() => helsinki(MONDAY, '08:15:00')} />);

    fillForecast({ customers: '120', main: '50', vegetarian: '30', soup: '40' });
    fireEvent.click(getSubmitButton());

    const activities = postedActivities(postMessage);
    expect(activities).toHaveLength(1);
    const message = activities[0]!;
    expect(message.type).toBe('ACTIVITY');
    expect(message.type).not.toBe('SILENT_ACTIVITY');
    expect(message.data.template).toBe('chefForecast');
    expect(message.data.actors).toBeUndefined();
    expect(message.data.provider).toBeUndefined();

    const templates = message.data.properties.map((property) => property.template);
    expect(templates).toEqual([
      'targetDate',
      'forecastTotalCustomers',
      'mainItemId',
      'forecastMeat',
      'vegetarianItemId',
      'forecastVegetarian',
      'soupItemId',
      'forecastSoup',
      'dessertItemId',
      'forecastDessert',
      'timingStatus',
      'submittedAt',
    ]);
    for (const forbidden of [
      'chefId',
      'actors',
      'provider',
      'result',
      'accuracy',
      'waste',
      'points',
      'badge',
    ]) {
      expect(templates).not.toContain(forbidden);
    }

    const properties = propertyMap(message);
    expect(properties.timingStatus).toEqual({ value: 'on-time' });
    expect(properties.targetDate).toEqual({ value: MONDAY });
    expect(properties.forecastSoup).toEqual(properties.forecastDessert);
    expect(String(properties.submittedAt.value)).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(message.data.properties.every((property) => 'obj' in property && 'value' in property.obj)).toBe(
      true,
    );
  });

  it('does not create a second ACTIVITY after a successful forecast', () => {
    ingestTaskForTests(pariChefForecastTaskFixture);
    render(<ChefApp clock={() => helsinki(MONDAY, '08:15:00')} />);

    fillForecast({ customers: '120', main: '50', vegetarian: '30', soup: '40' });
    fireEvent.click(getSubmitButton());
    fireEvent.click(getSubmitButton());

    expect(postedActivities(postMessage)).toHaveLength(1);
    expect(getSubmitButton()).toBeDisabled();
    expect(screen.getByText(/Forecast submitted for Monday/)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('records nothing when the window closes before the completed form is sent', async () => {
    let currentTime = helsinki(MONDAY, '08:29:59');
    ingestTaskForTests(pariChefForecastTaskFixture);
    vi.useFakeTimers();
    render(<ChefApp clock={() => currentTime} />);

    fillForecast({ customers: '120', main: '50', vegetarian: '30', soup: '40' });
    expect(getSubmitButton()).toBeEnabled();

    currentTime = helsinki(MONDAY, '08:30:00');
    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });

    fireEvent.click(getSubmitButton());

    expect(screen.getByRole('time')).toHaveAttribute('dateTime', TUESDAY);
    expect(postedActivities(postMessage)).toHaveLength(0);
  });

  it('keeps the entered forecast on screen when the submission fails and allows one retry', () => {
    ingestTaskForTests(pariChefForecastTaskFixture);
    postMessage.mockImplementationOnce(() => {
      throw new Error('bridge unavailable');
    });
    render(<ChefApp clock={() => helsinki(MONDAY, '08:15:00')} />);

    fillForecast({ customers: '120', main: '50', vegetarian: '30', soup: '40' });
    fireEvent.click(getSubmitButton());

    expect(screen.getByRole('alert')).toHaveTextContent('Submission failed.');
    expect(screen.queryByText(/Forecast submitted/)).not.toBeInTheDocument();
    expect(postedActivities(postMessage)).toHaveLength(0);
    expect(getExpectedCustomersInput()).toHaveValue('120');
    expect(getCategoryInput('Main')).toHaveValue('50');
    expect(getCategoryInput('Vegetarian')).toHaveValue('30');
    expect(getCategoryInput('Soup')).toHaveValue('40');

    fireEvent.click(getSubmitButton());

    const activities = postedActivities(postMessage);
    expect(activities).toHaveLength(1);
    expect(propertyMap(activities[0]!).forecastTotalCustomers).toEqual({ value: 120 });
    expect(screen.getByText(/Forecast submitted for/)).toBeInTheDocument();
  });

  it('stops the retry once the eligible window for that service date has closed', async () => {
    let currentTime = helsinki(MONDAY, '08:29:00');
    ingestTaskForTests(pariChefForecastTaskFixture);
    postMessage.mockImplementationOnce(() => {
      throw new Error('bridge unavailable');
    });
    vi.useFakeTimers();
    render(<ChefApp clock={() => currentTime} />);

    fillForecast({ customers: '120', main: '50', vegetarian: '30', soup: '40' });
    fireEvent.click(getSubmitButton());
    expect(screen.getByRole('alert')).toHaveTextContent('Submission failed.');

    currentTime = helsinki(MONDAY, '08:30:00');
    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });

    fireEvent.click(getSubmitButton());

    expect(getSubmitButton()).toBeDisabled();
    expect(postedActivities(postMessage)).toHaveLength(0);
  });

  it('records nothing when the all-zero confirmation is cancelled', () => {
    ingestTaskForTests(pariChefForecastTaskFixture);
    render(<ChefApp clock={() => helsinki(MONDAY, '08:15:00')} />);

    fillForecast({ customers: '0', main: '0', vegetarian: '0', soup: '0' });
    fireEvent.click(getSubmitButton());

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(postedActivities(postMessage)).toHaveLength(0);
    expect(getExpectedCustomersInput()).toHaveValue('0');
    expect(getCategoryInput('Main')).toHaveValue('0');
    expect(getSubmitButton()).toBeEnabled();
  });

  it('submits every deliberate zero as the number zero once confirmed', () => {
    ingestTaskForTests(pariChefForecastTaskFixture);
    render(<ChefApp clock={() => helsinki(MONDAY, '08:15:00')} />);

    fillForecast({ customers: '0', main: '0', vegetarian: '0', soup: '0' });
    fireEvent.click(getSubmitButton());
    fireEvent.click(screen.getByRole('button', { name: 'Yes, submit zero forecast' }));

    const activities = postedActivities(postMessage);
    expect(activities).toHaveLength(1);
    const properties = propertyMap(activities[0]!);
    expect(properties.forecastTotalCustomers).toEqual({ value: 0 });
    expect(properties.forecastMeat).toEqual({ value: 0 });
    expect(properties.forecastVegetarian).toEqual({ value: 0 });
    expect(properties.forecastSoup).toEqual({ value: 0 });
    expect(properties.forecastDessert).toEqual({ value: 0 });
  });

  it('waits for the GameBus task before allowing submission', () => {
    render(<ChefApp clock={() => helsinki(MONDAY, '08:15:00')} />);

    fillForecast({ customers: '120', main: '50', vegetarian: '30', soup: '40' });

    expect(screen.getByText('Waiting for GameBus task…')).toBeInTheDocument();
    expect(getSubmitButton()).toBeDisabled();

    fireEvent.click(getSubmitButton());
    expect(postedActivities(postMessage)).toHaveLength(0);
  });

  it('does not post a partial ACTIVITY when the GameBus task is missing chefForecast', () => {
    ingestTaskForTests({
      ...pariChefForecastTaskFixture,
      activityTemplates: [
        {
          id: 'other',
          slug: 'otherActivity',
          name: 'Other',
          providers: [],
        },
      ],
    });
    render(<ChefApp clock={() => helsinki(MONDAY, '08:15:00')} />);

    fillForecast({ customers: '120', main: '50', vegetarian: '30', soup: '40' });
    fireEvent.click(getSubmitButton());

    expect(postedActivities(postMessage)).toHaveLength(0);
    expect(screen.getByRole('alert')).toHaveTextContent('Submission failed.');
    expect(getExpectedCustomersInput()).toHaveValue('120');
  });
});

describe('kitchen forecast task boundaries', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('offers no owner, staff, or service-date selection control', () => {
    render(<ChefApp clock={() => helsinki(MONDAY, '08:15:00')} />);

    expect(screen.getByRole('time')).toHaveAttribute('dateTime', MONDAY);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(document.querySelector('input[type="date"]')).toBeNull();
    expect(screen.queryByLabelText(/staff|chef id|owner|on behalf/i)).not.toBeInTheDocument();
  });

  it('collects no actual production, service, or waste data', () => {
    render(<ChefApp clock={() => helsinki(MONDAY, '08:15:00')} />);

    expect(screen.queryByLabelText(/actual|served|prepared|waste|leftover/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/waste/i)).not.toBeInTheDocument();
  });

  it('shows the target service date menu as read-only content', () => {
    const slots = resolveMealSlotsForDate(MONDAY)!;
    render(<ChefApp clock={() => helsinki(MONDAY, '08:15:00')} />);

    for (const item of [slots.main, slots.vegetarian, slots.soup, slots.dessert]) {
      expect(screen.getByText(item.name)).toBeInTheDocument();
    }
    expect(getCategoryInput('Main')).toBeEnabled();
    expect(getCategoryInput('Dessert')).toBeDisabled();
    expect(screen.queryByRole('button', { name: /add|rename|remove|replace/i })).not.toBeInTheDocument();
  });
});
