// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AppRouter } from '../AppRouter';
import { DEFAULT_FIXTURE_CURRENT_USER_ID } from './currentUserContext';

function setHash(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

describe('chef results routes', () => {
  beforeEach(() => {
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

  it('defaults to the latest available result date for the current fixture user', () => {
    setHash('#/chef-results');
    render(<AppRouter />);
    const select = screen.getByTestId('chef-results-date-select') as HTMLSelectElement;
    expect(select.value).toBe('2026-07-31');
    expect(screen.getByText(/Friday, 31 July 2026/)).toBeInTheDocument();
  });

  it('shows weekly section for participated days only', () => {
    render(<AppRouter />);
    expect(screen.getByTestId('your-week-section')).toBeInTheDocument();
    expect(screen.getByText(/services you took part in this week/i)).toBeInTheDocument();
    expect(screen.getAllByTestId('week-trend-over')[0]?.querySelectorAll('circle').length).toBe(4);
    expect(screen.getAllByTestId('week-trend-short')[0]?.querySelectorAll('circle').length).toBe(4);
  });

  it('uses participant-facing kitchen progress wording', () => {
    render(<AppRouter />);
    expect(screen.getByText('Services completed this week')).toBeInTheDocument();
    expect(screen.getByText('Anonymous team average simulated overproduction')).toBeInTheDocument();
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
    expect(screen.getByTestId('staff-result-fixture-user-a')).toBeInTheDocument();
    expect(screen.getByTestId('staff-result-fixture-user-b')).toBeInTheDocument();
    expect(screen.getByTestId('weekly-summary-panel')).toBeInTheDocument();
  });

  it('shows real staff names on admin page', () => {
    render(<AppRouter />);
    expect(screen.getByTestId('staff-result-fixture-user-a')).toHaveTextContent('Aino Virtanen');
  });
});
