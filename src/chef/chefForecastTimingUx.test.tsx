// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { ChefApp } from './ChefApp';
import { helsinki } from '../test/fixtures/dates';
import { resolveMealSlotsForDate } from '../services/mealSlots';
import {
  getChefAdvanceWindowEndInstant,
  getChefGraceWindowEndInstant,
} from '../services/chefForecastWindow';
import { getChefSubmissionWindowStatus } from './chefSubmissionWindow';

const SERVICE_DATES = {
  fridayAug14: '2026-08-14',
  saturdayAug15: '2026-08-15',
  mondayAug17: '2026-08-17',
  tuesdayAug18: '2026-08-18',
} as const;

function getExpectedCustomersInput() {
  const form = screen.getByLabelText('Menu forecast quantities');
  return within(form).getByLabelText('Expected total customers');
}

describe('kitchen forecast page timing UX', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('rolls from Monday to Tuesday after 08:30 without remounting', async () => {
    let currentTime = helsinki(SERVICE_DATES.mondayAug17, '08:29:59');
    const clock = () => currentTime;

    vi.useFakeTimers();
    render(<ChefApp clock={clock} />);

    const mondaySlots = resolveMealSlotsForDate(SERVICE_DATES.mondayAug17)!;
    const tuesdaySlots = resolveMealSlotsForDate(SERVICE_DATES.tuesdayAug18)!;

    expect(screen.getByRole('time')).toHaveAttribute('dateTime', SERVICE_DATES.mondayAug17);
    expect(screen.getByText(mondaySlots.main.name)).toBeInTheDocument();
    expect(screen.getByText('Forecast open')).toBeInTheDocument();

    currentTime = helsinki(SERVICE_DATES.mondayAug17, '08:30:01');
    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });

    expect(screen.getByRole('time')).toHaveAttribute('dateTime', SERVICE_DATES.tuesdayAug18);
    expect(screen.getByText(tuesdaySlots.main.name)).toBeInTheDocument();
    expect(screen.queryByText(mondaySlots.main.name)).not.toBeInTheDocument();
    expect(screen.getByText('Forecast open')).toBeInTheDocument();
    expect(screen.queryByText('Forecast closed')).not.toBeInTheDocument();
  });

  it('clears Monday draft values when the target rolls to Tuesday', async () => {
    let currentTime = helsinki(SERVICE_DATES.mondayAug17, '08:25:00');
    const clock = () => currentTime;

    vi.useFakeTimers();
    render(<ChefApp clock={clock} />);

    fireEvent.change(getExpectedCustomersInput(), { target: { value: '120' } });
    expect(getExpectedCustomersInput()).toHaveValue('120');

    currentTime = helsinki(SERVICE_DATES.mondayAug17, '08:30:01');
    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });

    expect(screen.getByRole('time')).toHaveAttribute('dateTime', SERVICE_DATES.tuesdayAug18);
    expect(getExpectedCustomersInput()).toHaveValue('');
  });

  it('does not carry Monday submitted state into Tuesday after cutoff rollover', async () => {
    let currentTime = helsinki(SERVICE_DATES.mondayAug17, '08:25:00');
    const clock = () => currentTime;

    vi.useFakeTimers();
    render(<ChefApp clock={clock} />);

    const form = screen.getByLabelText('Menu forecast quantities');
    fireEvent.change(within(form).getByLabelText('Expected total customers'), {
      target: { value: '100' },
    });
    for (const label of ['Main', 'Vegetarian', 'Soup', 'Dessert']) {
      const group = screen.getByRole('group', { name: new RegExp(`^${label}:`, 'i') });
      fireEvent.change(within(group).getByRole('textbox'), { target: { value: '10' } });
    }

    fireEvent.click(screen.getByRole('button', { name: 'Submit forecast' }));
    expect(screen.getByText(/Forecast submitted for/i)).toBeInTheDocument();

    currentTime = helsinki(SERVICE_DATES.mondayAug17, '08:30:01');
    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });

    expect(screen.getByRole('time')).toHaveAttribute('dateTime', SERVICE_DATES.tuesdayAug18);
    expect(screen.queryByText(/Forecast submitted for/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit forecast' })).toBeInTheDocument();
  });

  it('shows Tuesday immediately on a fresh Monday afternoon mount', () => {
    const clock = () => helsinki(SERVICE_DATES.mondayAug17, '15:37:00');
    render(<ChefApp clock={clock} />);

    const tuesdaySlots = resolveMealSlotsForDate(SERVICE_DATES.tuesdayAug18)!;
    expect(screen.getByRole('time')).toHaveAttribute('dateTime', SERVICE_DATES.tuesdayAug18);
    expect(screen.getByText(tuesdaySlots.main.name)).toBeInTheDocument();
    expect(screen.getByText('Forecast open')).toBeInTheDocument();
    expect(screen.queryByText('Forecast closed')).not.toBeInTheDocument();
  });

  it('keeps today as the target and stays closed before 08:00', () => {
    const clock = () => helsinki(SERVICE_DATES.mondayAug17, '07:59:59');
    render(<ChefApp clock={clock} />);

    expect(screen.getByRole('time')).toHaveAttribute('dateTime', SERVICE_DATES.mondayAug17);
    expect(screen.getByText('Forecast closed')).toBeInTheDocument();
    expect(screen.getByText('Opens 08:00 today')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit forecast' })).toBeDisabled();
  });

  it('opens the same-day window at 08:00 with today as the target', () => {
    const clock = () => helsinki(SERVICE_DATES.mondayAug17, '08:00:00');
    render(<ChefApp clock={clock} />);

    expect(screen.getByRole('time')).toHaveAttribute('dateTime', SERVICE_DATES.mondayAug17);
    expect(screen.getByText('Forecast open')).toBeInTheDocument();
    expect(screen.getByText('Deadline 08:30 today')).toBeInTheDocument();
  });

  it('shows no open window on a weekend day', () => {
    const clock = () => helsinki(SERVICE_DATES.saturdayAug15, '12:00:00');
    render(<ChefApp clock={clock} />);

    expect(screen.getByText('Forecast closed')).toBeInTheDocument();
    expect(screen.getByText('Opens 08:30 on the previous service day')).toBeInTheDocument();
  });

  it('renders the advance-window deadline badge after 08:30', () => {
    const clock = () => helsinki(SERVICE_DATES.mondayAug17, '15:37:00');
    render(<ChefApp clock={clock} />);

    expect(screen.getByText('Deadline midnight tonight')).toBeInTheDocument();
    expect(screen.queryByText('Deadline 08:30 today')).not.toBeInTheDocument();
  });

  it('counts down to the end of the current window, not to the service date', () => {
    const advance = getChefSubmissionWindowStatus(
      helsinki(SERVICE_DATES.mondayAug17, '15:37:00'),
      SERVICE_DATES.tuesdayAug18,
    );
    expect(advance.countdownTargetIso).toBe(
      getChefAdvanceWindowEndInstant(SERVICE_DATES.mondayAug17).toISOString(),
    );

    const grace = getChefSubmissionWindowStatus(
      helsinki(SERVICE_DATES.tuesdayAug18, '08:10:00'),
      SERVICE_DATES.tuesdayAug18,
    );
    expect(grace.countdownTargetIso).toBe(
      getChefGraceWindowEndInstant(SERVICE_DATES.tuesdayAug18).toISOString(),
    );
  });

  it('targets Monday from the Friday advance window', () => {
    const clock = () => helsinki(SERVICE_DATES.fridayAug14, '23:59:59');
    render(<ChefApp clock={clock} />);

    expect(screen.getByRole('time')).toHaveAttribute('dateTime', SERVICE_DATES.mondayAug17);
    expect(screen.getByText('Forecast open')).toBeInTheDocument();
  });
});
