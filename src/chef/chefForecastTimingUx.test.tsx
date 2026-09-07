// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { ChefApp } from './ChefApp';
import { helsinki } from '../test/fixtures/dates';
import { resolveMealSlotsForDate } from '../services/mealSlots';
import { getChefForecastCutoffInstant } from '../services/chefForecastEligibilityPolicy';
import { getChefSubmissionWindowStatus } from './chefSubmissionWindow';

const SERVICE_DATES = {
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

  it('renders the deadline label from central policy', () => {
    const clock = () => helsinki(SERVICE_DATES.mondayAug17, '15:37:00');
    render(<ChefApp clock={clock} />);

    expect(screen.getByText('Deadline 08:30 on service day')).toBeInTheDocument();
    expect(screen.queryByText('Deadline 09:00 on service day')).not.toBeInTheDocument();
  });

  it('counts down to Tuesday 08:30 Helsinki when Monday afternoon targets Tuesday', () => {
    const now = helsinki(SERVICE_DATES.mondayAug17, '15:37:00');
    const status = getChefSubmissionWindowStatus(now, SERVICE_DATES.tuesdayAug18);
    expect(status.countdownTargetIso).toBe(
      getChefForecastCutoffInstant(SERVICE_DATES.tuesdayAug18).toISOString(),
    );
  });
});
