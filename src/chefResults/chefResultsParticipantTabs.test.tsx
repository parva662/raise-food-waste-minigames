// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChefResultsParticipantApp } from './ChefResultsParticipantApp';
import { DEFAULT_FIXTURE_CURRENT_USER_ID } from './currentUserContext';
import * as operationalCalendarModule from '../services/operationalServiceCalendar';
import * as detectEmbedModule from '../gamebus/detectEmbed';

describe('kitchen staff dashboard primary tabs', () => {
  beforeEach(() => {
    vi.spyOn(detectEmbedModule, 'isGameBusEmbed').mockReturnValue(false);
    vi.spyOn(operationalCalendarModule, 'resolveChefResultsServiceDate').mockReturnValue(
      '2026-07-31',
    );
    window.sessionStorage.clear();
    window.sessionStorage.setItem(
      'chef-results-fixture-current-user-id',
      DEFAULT_FIXTURE_CURRENT_USER_ID,
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows one H1 and Overview / Progress tabs with Overview default', () => {
    render(<ChefResultsParticipantApp />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Kitchen Staff Dashboard');
    expect(screen.getByTestId('participant-primary-tab-overview')).toBeInTheDocument();
    expect(screen.getByTestId('participant-primary-tab-progress')).toBeInTheDocument();
    expect(screen.getByTestId('participant-primary-panel-overview')).not.toHaveAttribute('hidden');
    expect(screen.getByTestId('participant-primary-panel-progress')).toHaveAttribute('hidden');
    expect(screen.getByTestId('forecast-impact-section')).toBeInTheDocument();
    expect(screen.queryByTestId('your-progress-section')).not.toBeInTheDocument();
  });

  it('keeps service date and status visible when switching to Progress', async () => {
    const user = userEvent.setup();
    render(<ChefResultsParticipantApp />);
    expect(screen.getByTestId('participant-results-header')).toHaveTextContent(/31 July 2026/);
    await user.click(screen.getByTestId('participant-primary-tab-progress'));
    expect(screen.getByTestId('your-progress-section')).toBeInTheDocument();
    expect(screen.queryByTestId('forecast-impact-section')).not.toBeInTheDocument();
    expect(screen.getByTestId('participant-results-header')).toHaveTextContent(/31 July 2026/);
    expect(screen.getByTestId('dashboard-status-chip')).toBeInTheDocument();
  });

  it('supports keyboard navigation on primary tabs', async () => {
    const user = userEvent.setup();
    render(<ChefResultsParticipantApp />);
    const overviewTab = screen.getByTestId('participant-primary-tab-overview');
    overviewTab.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByTestId('participant-primary-tab-progress')).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('does not show progress period tabs on Overview', () => {
    render(<ChefResultsParticipantApp />);
    expect(screen.queryByTestId('progress-period-tabs')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-progress-section')).not.toBeInTheDocument();
  });
});
