// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChefApp } from './ChefApp';
import { MENU_DATES, SUBMISSION_TIMES } from '../test/fixtures/dates';
import * as operationalCalendarModule from '../services/operationalServiceCalendar';
import { buildChefActivityMessage } from '../gamebus/buildChefActivityMessage';
import { pariChefForecastTaskFixture } from '../gamebus/chefTaskFixtures';
import { resolveMealSlotsForDate } from '../services/mealSlots';
import { CHEF_CONFIG } from '../config/chef';
import { CHEF_INTEGER_RANGE_ERROR } from './validation';
import { CHEF_CONFIDENCE_OPTIONS } from './optionalFields';
import { CHEF_INCOMPLETE_FORM_MESSAGE } from './types';

const openWindowClock = () => SUBMISSION_TIMES.midday;

function getCategoryInput(category: string) {
  const group = screen.getByRole('group', { name: new RegExp(`^${category}:`, 'i') });
  return within(group).getByRole('textbox');
}

function getForecastForm() {
  return screen.getByLabelText('Menu forecast quantities');
}

function getExpectedCustomersInput() {
  return within(getForecastForm()).getByLabelText('Expected total customers');
}

function getForecastOverview() {
  return screen.getByLabelText('Forecast overview');
}

function renderChef() {
  return render(<ChefApp clock={openWindowClock} />);
}

async function fillAllForecastFields(
  user: ReturnType<typeof userEvent.setup>,
  values: {
    customers: string;
    main: string;
    vegetarian: string;
    soup: string;
    dessert: string;
  },
) {
  await user.type(getExpectedCustomersInput(), values.customers);
  await user.type(getCategoryInput('Main'), values.main);
  await user.type(getCategoryInput('Vegetarian'), values.vegetarian);
  await user.type(getCategoryInput('Soup'), values.soup);
  await user.type(getCategoryInput('Dessert'), values.dessert);
}

describe('chef forecast UX', () => {
  beforeEach(() => {
    vi.spyOn(operationalCalendarModule, 'resolveChefForecastServiceDate').mockReturnValue(
      MENU_DATES.runtimeWednesday,
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders chef route with countdown and four categories', () => {
    renderChef();
    expect(screen.getByText('Time left')).toBeInTheDocument();
    const form = getForecastForm();
    expect(within(form).getByText('Main')).toBeInTheDocument();
    expect(within(form).getByText('Vegetarian')).toBeInTheDocument();
    expect(within(form).getByText('Soup')).toBeInTheDocument();
    expect(within(form).getByText('Dessert')).toBeInTheDocument();
    expect(within(form).getAllByText('portions').length).toBeGreaterThanOrEqual(4);
    expect(within(form).getByText('customers')).toBeInTheDocument();
  });

  it('shows independent forecast form instruction', () => {
    renderChef();
    expect(
      screen.getByText(
        'Enter the expected customer count and the quantity you plan to prepare for each menu item. These values are independent and do not need to match.',
      ),
    ).toBeInTheDocument();
  });

  it('starts all five numeric fields blank', () => {
    renderChef();
    expect(getExpectedCustomersInput()).toHaveValue('');
    expect(getCategoryInput('Main')).toHaveValue('');
    expect(getCategoryInput('Vegetarian')).toHaveValue('');
    expect(getCategoryInput('Soup')).toHaveValue('');
    expect(getCategoryInput('Dessert')).toHaveValue('');
  });

  it('distinguishes blank from explicit zero', async () => {
    const user = userEvent.setup();
    renderChef();

    await user.type(getCategoryInput('Main'), '0');
    expect(getCategoryInput('Main')).toHaveValue('0');
    expect(getCategoryInput('Vegetarian')).toHaveValue('');
  });

  it('disables submit while any required field is blank', async () => {
    const user = userEvent.setup();
    renderChef();

    const submitBtn = screen.getByRole('button', { name: 'Submit forecast' });
    expect(submitBtn).toBeDisabled();
    expect(screen.getAllByText(CHEF_INCOMPLETE_FORM_MESSAGE).length).toBeGreaterThan(0);

    await user.type(getExpectedCustomersInput(), '100');
    await user.type(getCategoryInput('Main'), '10');
    expect(submitBtn).toBeDisabled();
  });

  it('shows disabled-submit explanation before form is complete', () => {
    renderChef();
    expect(screen.getAllByText(CHEF_INCOMPLETE_FORM_MESSAGE).length).toBeGreaterThan(0);
  });

  it('accepts explicit zero as valid', async () => {
    const user = userEvent.setup();
    renderChef();

    await fillAllForecastFields(user, {
      customers: '0',
      main: '0',
      vegetarian: '0',
      soup: '0',
      dessert: '0',
    });

    expect(screen.getByRole('button', { name: 'Submit forecast' })).not.toBeDisabled();
  });

  it('rejects negative values', async () => {
    const user = userEvent.setup();
    renderChef();

    const mainInput = getCategoryInput('Main');
    await user.click(mainInput);
    await user.paste('-1');
    expect(screen.getByText(CHEF_INTEGER_RANGE_ERROR)).toBeInTheDocument();
  });

  it('rejects decimal values', async () => {
    const user = userEvent.setup();
    renderChef();

    const mainInput = getCategoryInput('Main');
    await user.click(mainInput);
    await user.paste('12.5');
    expect(screen.getByText(CHEF_INTEGER_RANGE_ERROR)).toBeInTheDocument();
  });

  it('rejects values above configured maximum', async () => {
    const user = userEvent.setup();
    renderChef();

    await user.type(
      getCategoryInput('Main'),
      String(CHEF_CONFIG.maxForecastQuantity + 1),
    );
    expect(screen.getByText(CHEF_INTEGER_RANGE_ERROR)).toBeInTheDocument();
  });

  it('uses visible label for expected customers aligned with menu rows', () => {
    renderChef();
    const input = getExpectedCustomersInput();
    expect(input).toBeInTheDocument();
    expect(input).not.toHaveAttribute('placeholder');
    expect(input.className).toContain('chef-forecast-row__input');
    expect(within(getForecastForm()).getByText('customers')).toBeInTheDocument();
  });

  it('enters 120 and updates forecast overview expected customers immediately', async () => {
    const user = userEvent.setup();
    renderChef();

    await user.type(getExpectedCustomersInput(), '120');
    expect(getExpectedCustomersInput()).toHaveValue('120');

    const overview = getForecastOverview();
    expect(within(overview).getByText('120')).toBeInTheDocument();
  });

  it('shows each menu quantity independently in forecast overview', async () => {
    const user = userEvent.setup();
    renderChef();

    await fillAllForecastFields(user, {
      customers: '150',
      main: '100',
      vegetarian: '100',
      soup: '50',
      dessert: '50',
    });

    const overview = getForecastOverview();
    expect(within(overview).getByText('150')).toBeInTheDocument();
    expect(within(overview).getByText('Planned quantities')).toBeInTheDocument();
    expect(within(overview).getAllByText('100').length).toBe(2);
    expect(within(overview).getAllByText('50').length).toBe(2);
  });

  it('accepts mismatched customer and menu forecasts without warning', async () => {
    const user = userEvent.setup();
    renderChef();

    await fillAllForecastFields(user, {
      customers: '150',
      main: '100',
      vegetarian: '100',
      soup: '50',
      dessert: '50',
    });

    expect(screen.queryByText(/meal portions minus/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/total meal portions/i)).not.toBeInTheDocument();
    expect(getForecastOverview().querySelector('.chef-summary__difference')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit forecast' })).not.toBeDisabled();
  });

  it('preserves explicit zero and clearing returns overview to Not entered', async () => {
    const user = userEvent.setup();
    renderChef();

    await user.type(getExpectedCustomersInput(), '0');
    expect(getExpectedCustomersInput()).toHaveValue('0');
    const overview = getForecastOverview();
    expect(within(overview).getByText('0')).toBeInTheDocument();

    await user.clear(getExpectedCustomersInput());
    expect(getExpectedCustomersInput()).toHaveValue('');
    expect(within(overview).getAllByText('Not entered').length).toBeGreaterThan(0);
  });

  it('shows incomplete guidance only near submit button', () => {
    renderChef();
    const messages = screen.getAllByText(CHEF_INCOMPLETE_FORM_MESSAGE);
    expect(messages.length).toBe(1);
    expect(messages[0]).toHaveAttribute('id', 'chef-submit-guidance');
  });

  it('enables submit when all five fields are valid', async () => {
    const user = userEvent.setup();
    renderChef();

    const submitBtn = screen.getByRole('button', { name: 'Submit forecast' });
    expect(submitBtn).toBeDisabled();

    await fillAllForecastFields(user, {
      customers: '120',
      main: '56',
      vegetarian: '2',
      soup: '67',
      dessert: '65',
    });

    expect(submitBtn).not.toBeDisabled();
    expect(screen.queryByText(CHEF_INCOMPLETE_FORM_MESSAGE)).not.toBeInTheDocument();
  });

  it('shows Not entered in forecast overview for unanswered values', () => {
    renderChef();
    const overview = getForecastOverview();
    expect(within(overview).getAllByText('Not entered').length).toBeGreaterThan(0);
  });

  it('does not render combined totals or arithmetic expressions', async () => {
    const user = userEvent.setup();
    renderChef();

    await fillAllForecastFields(user, {
      customers: '100',
      main: '80',
      vegetarian: '0',
      soup: '0',
      dessert: '0',
    });

    const overview = getForecastOverview();
    expect(within(overview).queryByText(/\+/)).not.toBeInTheDocument();
    expect(within(overview).queryByText(/100 \+ 100 \+ 50/)).not.toBeInTheDocument();
    expect(within(overview).queryByText(/total/i)).not.toBeInTheDocument();
    expect(within(overview).queryByText(/difference/i)).not.toBeInTheDocument();
  });

  it('does not block submission when forecasts differ across categories', async () => {
    const user = userEvent.setup();
    renderChef();

    await fillAllForecastFields(user, {
      customers: '100',
      main: '120',
      vegetarian: '0',
      soup: '0',
      dessert: '0',
    });

    const submitBtn = screen.getByRole('button', { name: 'Submit forecast' });
    expect(submitBtn).not.toBeDisabled();
    await user.click(submitBtn);
    expect(screen.getByText(/Forecast submitted/)).toBeInTheDocument();
  });

  it('shows zero confirmation for all-zero explicit forecast', async () => {
    const user = userEvent.setup();
    renderChef();

    await fillAllForecastFields(user, {
      customers: '0',
      main: '0',
      vegetarian: '0',
      soup: '0',
      dessert: '0',
    });
    await user.click(screen.getByRole('button', { name: 'Submit forecast' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Submit zero forecast?')).toBeInTheDocument();
  });

  it('allows confirmed zero forecast to proceed', async () => {
    const user = userEvent.setup();
    renderChef();

    await fillAllForecastFields(user, {
      customers: '0',
      main: '0',
      vegetarian: '0',
      soup: '0',
      dessert: '0',
    });
    await user.click(screen.getByRole('button', { name: 'Submit forecast' }));
    await user.click(screen.getByRole('button', { name: 'Yes, submit zero forecast' }));

    expect(screen.getByText(/Forecast submitted/)).toBeInTheDocument();
  });

  it('renders confidence radio group without default selection', () => {
    renderChef();
    const radios = screen.getAllByRole('radio', { name: /very low|low|moderate|high|very high/i });
    expect(radios.length).toBe(5);
    radios.forEach((radio) => expect(radio).not.toBeChecked());
  });

  it('maps confidence labels to schema values', async () => {
    const user = userEvent.setup();
    renderChef();

    const expected = [
      { label: 'Very low', value: 0 },
      { label: 'Low', value: 0.25 },
      { label: 'Moderate', value: 0.5 },
      { label: 'High', value: 0.75 },
      { label: 'Very high', value: 1 },
    ];

    for (const option of expected) {
      cleanup();
      renderChef();
      await user.click(screen.getByRole('radio', { name: option.label }));
      expect(screen.getByRole('radio', { name: option.label })).toBeChecked();
    }

    expect(CHEF_CONFIDENCE_OPTIONS.map((o) => o.value)).toEqual([0, 0.25, 0.5, 0.75, 1]);
    expect(screen.queryByText('0.25')).not.toBeInTheDocument();
    expect(screen.queryByText('0.75')).not.toBeInTheDocument();
  });

  it('renders additional context section in review column', () => {
    renderChef();
    expect(screen.getByText('Additional context — Optional')).toBeInTheDocument();
    expect(screen.getByLabelText('Note for this service day')).toBeInTheDocument();
  });

  it('does not change chefForecast payload shape', () => {
    const slots = resolveMealSlotsForDate(MENU_DATES.runtimeWednesday)!;
    const msg = buildChefActivityMessage(
      pariChefForecastTaskFixture,
      {
        targetDate: MENU_DATES.runtimeWednesday,
        timingStatus: 'on-time',
        submittedAt: '2026-07-28T12:00:00.000Z',
      },
      {
        expectedCustomers: 120,
        mainQuantity: 50,
        vegetarianQuantity: 30,
        soupQuantity: 40,
        dessertQuantity: 25,
        confidence: null,
        notes: '',
      },
      slots,
    );

    expect(msg.data.template).toBe('chefForecast');
    expect(msg.data.properties.map((p) => p.template)).toEqual([
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
    expect(msg.type).toBe('ACTIVITY');
    expect(msg.type).not.toBe('SILENT_ACTIVITY');
  });
});
