// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { ChefApp } from './ChefApp';
import { helsinki } from '../test/fixtures/dates';
import { resolveMealSlotsForDate } from '../services/mealSlots';

const SERVICE_DATES = {
  mondayAug17: '2026-08-17',
  tuesdayAug18: '2026-08-18',
} as const;

describe('kitchen forecast page timing UX', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('keeps the resolved service date after cutoff without switching menus', async () => {
    let currentTime = helsinki(SERVICE_DATES.mondayAug17, '08:59:00');
    const clock = () => currentTime;

    vi.useFakeTimers();
    render(<ChefApp clock={clock} />);

    const mondaySlots = resolveMealSlotsForDate(SERVICE_DATES.mondayAug17)!;
    expect(screen.getByRole('time')).toHaveAttribute('dateTime', SERVICE_DATES.mondayAug17);
    expect(screen.getByText(mondaySlots.main.name)).toBeInTheDocument();

    currentTime = helsinki(SERVICE_DATES.mondayAug17, '09:05:00');
    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });

    expect(screen.getByRole('time')).toHaveAttribute('dateTime', SERVICE_DATES.mondayAug17);
    expect(screen.getByText(mondaySlots.main.name)).toBeInTheDocument();
    expect(screen.queryByText(resolveMealSlotsForDate(SERVICE_DATES.tuesdayAug18)!.main.name)).not.toBeInTheDocument();
    expect(screen.getByText('Forecast closed')).toBeInTheDocument();
  });
});
