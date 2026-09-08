// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AppRouter } from '../AppRouter';
import { DEFAULT_FIXTURE_CURRENT_USER_ID } from './currentUserContext';
import * as operationalCalendarModule from '../services/operationalServiceCalendar';

function setHash(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

describe('chef results routes', () => {
  beforeEach(() => {
    vi.spyOn(operationalCalendarModule, 'resolveChefResultsServiceDate').mockReturnValue('2026-07-31');
    setHash('');
    window.sessionStorage.clear();
    window.sessionStorage.setItem('chef-results-fixture-current-user-id', DEFAULT_FIXTURE_CURRENT_USER_ID);
  });

  afterEach(() => {
    cleanup();
    setHash('');
    window.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders participant view at #/chef-results', () => {
    setHash('#/chef-results');
    render(<AppRouter />);
    expect(screen.getByTestId('chef-results-participant-page')).toBeInTheDocument();
    expect(screen.getByText('Your result')).toBeInTheDocument();
  });

  it('renders preserved admin view at #/chef-results-admin', () => {
    setHash('#/chef-results-admin');
    render(<AppRouter />);
    expect(screen.getByTestId('chef-results-admin-page')).toBeInTheDocument();
    expect(screen.getByText('Kitchen admin results')).toBeInTheDocument();
    expect(screen.getByText('Daily simulation results')).toBeInTheDocument();
  });

  it('does not load chef forecast UI on participant route', () => {
    setHash('#/chef-results');
    render(<AppRouter />);
    expect(screen.queryByText("Tomorrow's kitchen forecast")).not.toBeInTheDocument();
  });
});

describe('participant privacy', () => {
  beforeEach(() => {
    vi.spyOn(operationalCalendarModule, 'resolveChefResultsServiceDate').mockReturnValue('2026-07-31');
    setHash('#/chef-results');
    window.sessionStorage.clear();
    window.sessionStorage.setItem('chef-results-fixture-current-user-id', 'fixture-user-c');
  });

  afterEach(() => {
    cleanup();
    setHash('');
    window.sessionStorage.clear();
  });

  it('displays only current fixture user identifiable summary data', () => {
    render(<AppRouter />);
    expect(screen.getByTestId('actual-kitchen-outcome-section')).toBeInTheDocument();
    expect(screen.getByTestId('forecast-impact-section')).toBeInTheDocument();
    expect(screen.getByTestId('participant-summary-cards')).toBeInTheDocument();
    expect(screen.getByTestId('category-outcome-visual')).toBeInTheDocument();
    expect(screen.queryByTestId('staff-result-fixture-user-a')).not.toBeInTheDocument();
    expect(screen.queryByTestId('staff-result-fixture-user-b')).not.toBeInTheDocument();
  });

  it('does not expose coworker names in participant content', () => {
    const { container } = render(<AppRouter />);
    const page = container.querySelector('[data-testid="chef-results-participant-page"]');
    expect(page).not.toBeNull();
    const clone = page!.cloneNode(true) as HTMLElement;
    clone.querySelector('[data-testid="fixture-current-user-selector"]')?.remove();
    const text = clone.textContent ?? '';
    expect(text).not.toMatch(/Aino Virtanen|Boris Lindström/);
    expect(text).not.toMatch(/fixture-user-a|fixture-user-b/);
    expect(clone.querySelector('[data-testid^="staff-result-"]')).toBeNull();
  });

  it('shows anonymous team comparison without head-chef labeling', () => {
    render(<AppRouter />);
    expect(screen.getByTestId('team-comparison-section')).toBeInTheDocument();
    expect(screen.queryByText('Head chef this service')).not.toBeInTheDocument();
    expect(screen.queryByText(/winner|loser|best employee|worst employee/i)).not.toBeInTheDocument();
  });

  it('shows the canonical service date in the participant header', () => {
    setHash('#/chef-results');
    render(<AppRouter />);
    expect(screen.queryByTestId('chef-results-date-select')).not.toBeInTheDocument();
    expect(screen.getByTestId('participant-results-header')).toHaveTextContent(/Friday, 31 July 2026/);
  });

  it('shows progress section for participated services', () => {
    render(<AppRouter />);
    expect(screen.getByTestId('your-progress-section')).toBeInTheDocument();
    expect(screen.getByText(/Your progress/i)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Week' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('progress-bar-chart')).toBeInTheDocument();
  });

  it('uses participant-facing kitchen progress wording', () => {
    render(<AppRouter />);
    expect(screen.getByText('Services completed this week')).toBeInTheDocument();
    expect(screen.getByText('Anonymous team average estimated surplus')).toBeInTheDocument();
    expect(screen.queryByText(/Fixture services/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Reserved for a future/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Informational only/i)).not.toBeInTheDocument();
  });

  it('does not expose composite score or ranking UI', () => {
    render(<AppRouter />);
    expect(screen.queryByText(/composite score|your score|total score/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/leaderboard|ranking|winner|loser/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('results-score-card')).not.toBeInTheDocument();
  });
});

describe('admin preservation', () => {
  beforeEach(() => {
    setHash('#/chef-results-admin');
  });

  afterEach(() => {
    cleanup();
    setHash('');
  });

  it('still exposes all fixture staff calculations', () => {
    render(<AppRouter />);
    expect(screen.getByTestId('observed-service-panel')).toBeInTheDocument();
    expect(screen.getByText('Staff simulations')).toBeInTheDocument();
    const select = screen.getByTestId('chef-results-admin-date-select') as HTMLSelectElement;
    expect(select.value).toBe('2026-07-31');
    expect(screen.getByTestId('staff-result-fixture-user-b')).toBeInTheDocument();
    expect(screen.getByTestId('staff-result-fixture-user-c')).toBeInTheDocument();
    expect(screen.getByTestId('staff-result-fixture-user-d')).toBeInTheDocument();
    expect(screen.getByTestId('weekly-summary-panel')).toBeInTheDocument();
  });

  it('shows real staff names on admin page', () => {
    render(<AppRouter />);
    expect(screen.getByTestId('staff-result-fixture-user-b')).toHaveTextContent('Boris Lindström');
  });
});
