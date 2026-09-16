// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChefResultsParticipantApp } from './ChefResultsParticipantApp';
import * as detectEmbedModule from '../gamebus/detectEmbed';
import { resetGameBusBridgeForTests } from '../gamebus/bridge';
import { helsinki } from '../test/fixtures/dates';
import { mockExplicitClosures } from '../test/fixtures/serviceCalendar';
import { getFixtureCurrentUserId } from './currentUserContext';
import { buildParticipantProgressServicePoints } from './participantProgressData';

describe('participant dashboard midnight and no-service UX', () => {
  beforeEach(() => {
    resetGameBusBridgeForTests();
    vi.spyOn(detectEmbedModule, 'isGameBusEmbed').mockReturnValue(false);
    window.sessionStorage.clear();
    window.location.hash = '#/chef-results';
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    cleanup();
    resetGameBusBridgeForTests();
    window.sessionStorage.clear();
    window.location.hash = '';
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('updates Monday → Tuesday across Helsinki midnight without reload and keeps Progress', async () => {
    const userId = getFixtureCurrentUserId();
    const historical = buildParticipantProgressServicePoints(userId, '2026-09-07');
    expect(historical.length).toBeGreaterThan(0);

    vi.setSystemTime(helsinki('2026-09-07', '23:59:59'));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChefResultsParticipantApp />);

    expect(screen.getByTestId('dashboard-calendar-date')).toHaveTextContent(
      /Monday, 7 September 2026/,
    );
    expect(screen.getByTestId('dashboard-status-chip')).toHaveTextContent(
      /Waiting for service closeout|Result ready|No forecast for this service/,
    );

    await user.click(screen.getByTestId('participant-primary-tab-progress'));
    expect(screen.getByTestId('your-progress-section')).toBeInTheDocument();

    await act(async () => {
      vi.setSystemTime(helsinki('2026-09-08', '00:00:00'));
      await vi.advanceTimersByTimeAsync(2_000);
    });

    expect(screen.getByTestId('dashboard-calendar-date')).toHaveTextContent(
      /Tuesday, 8 September 2026/,
    );
    expect(screen.getByTestId('your-progress-section')).toBeInTheDocument();
    expect(screen.queryByTestId('progress-global-empty')).not.toBeInTheDocument();
  });

  it('switches Friday → Saturday to No service today while Progress stays visible', async () => {
    vi.setSystemTime(helsinki('2026-08-14', '23:59:59'));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ChefResultsParticipantApp />);

    expect(screen.getByTestId('dashboard-calendar-date')).toHaveTextContent(
      /Friday, 14 August 2026/,
    );

    await user.click(screen.getByTestId('participant-primary-tab-progress'));
    expect(screen.getByTestId('your-progress-section')).toBeInTheDocument();

    await act(async () => {
      vi.setSystemTime(helsinki('2026-08-15', '00:00:00'));
      await vi.advanceTimersByTimeAsync(2_000);
    });

    expect(screen.getByTestId('dashboard-calendar-date')).toHaveTextContent(
      /Saturday, 15 August 2026/,
    );
    expect(screen.getByTestId('dashboard-status-chip')).toHaveTextContent('No service today');

    await user.click(screen.getByTestId('participant-primary-tab-overview'));
    expect(screen.getByTestId('participant-no-service-day')).toHaveTextContent(
      /No kitchen service is scheduled for this date/,
    );

    await user.click(screen.getByTestId('participant-primary-tab-progress'));
    expect(screen.getByTestId('your-progress-section')).toBeInTheDocument();
  });

  it('switches Sunday → Monday and reevaluates operational-day Overview', async () => {
    vi.setSystemTime(helsinki('2026-08-16', '23:59:59'));
    render(<ChefResultsParticipantApp />);

    expect(screen.getByTestId('dashboard-status-chip')).toHaveTextContent('No service today');

    await act(async () => {
      vi.setSystemTime(helsinki('2026-08-17', '00:00:00'));
      await vi.advanceTimersByTimeAsync(2_000);
    });

    expect(screen.getByTestId('dashboard-calendar-date')).toHaveTextContent(
      /Monday, 17 August 2026/,
    );
    expect(screen.getByTestId('dashboard-status-chip')).not.toHaveTextContent('No service today');
    expect(screen.queryByTestId('participant-no-service-day')).not.toBeInTheDocument();
  });

  it('shows No service today for an explicitly closed weekday', () => {
    mockExplicitClosures('2026-09-07');
    vi.setSystemTime(helsinki('2026-09-07', '12:00:00'));
    render(<ChefResultsParticipantApp />);

    expect(screen.getByTestId('dashboard-calendar-date')).toHaveTextContent(
      /Monday, 7 September 2026/,
    );
    expect(screen.getByTestId('dashboard-status-chip')).toHaveTextContent('No service today');
    expect(screen.getByTestId('participant-no-service-day')).toBeInTheDocument();
  });
});
