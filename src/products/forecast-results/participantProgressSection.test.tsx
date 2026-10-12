// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ParticipantProgressSection } from '@/products/forecast-results/participant/components/ParticipantProgressSection';
import { KitchenProgressSection } from '@/products/forecast-results/participant/components/KitchenProgressSection';
import { buildParticipantProgressServicePoints } from '@/products/forecast-results/calculations/participantProgressData';
import * as operationalCalendarModule from '@/shared/calendar/operationalServiceCalendar';
import { DEFAULT_FIXTURE_CURRENT_USER_ID } from '@/products/forecast-results/currentUserContext';

describe('ParticipantProgressSection', () => {
  beforeEach(() => {
    vi.spyOn(operationalCalendarModule, 'resolveForecastResultsServiceDate').mockReturnValue(
      '2026-07-31',
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows Your progress with default Recent view', () => {
    const points = buildParticipantProgressServicePoints(
      DEFAULT_FIXTURE_CURRENT_USER_ID,
      '2026-07-31',
    );
    render(<ParticipantProgressSection servicePoints={points} asOfServiceDate="2026-07-31" />);

    expect(screen.getByTestId('your-progress-section')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Recent' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByTestId('progress-recent-summary')).not.toBeInTheDocument();
    expect(screen.queryByTestId('progress-recent-chart')).not.toBeInTheDocument();
    expect(screen.getByTestId('progress-recent-list')).toBeInTheDocument();
  });

  it('keeps Recent compact and reserves summaries and charts for Trends', async () => {
    const user = userEvent.setup();
    const points = buildParticipantProgressServicePoints('fixture-user-c', '2026-07-31');
    render(<ParticipantProgressSection servicePoints={points} asOfServiceDate="2026-07-31" />);
    expect(screen.queryByTestId('progress-summary-cards')).not.toBeInTheDocument();
    expect(screen.queryByTestId('progress-trend-chart-svg')).not.toBeInTheDocument();
    expect(screen.getByTestId('progress-recent-list').querySelectorAll('li')).toHaveLength(4);
    await user.click(screen.getByTestId('progress-view-tab-trends'));
    expect(screen.getByTestId('progress-period-summary')).toBeInTheDocument();
    expect(screen.getAllByTestId('progress-trend-chart-svg')).toHaveLength(1);
  });

  it('switches to Trends and updates Week, Month, and Year panels', async () => {
    const user = userEvent.setup();
    const points = buildParticipantProgressServicePoints('fixture-user-c', '2026-07-31');
    render(<ParticipantProgressSection servicePoints={points} asOfServiceDate="2026-07-31" />);

    await user.click(screen.getByTestId('progress-view-tab-trends'));
    expect(screen.getByRole('tab', { name: 'Week' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('progress-period-summary')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Month' }));
    expect(screen.getByRole('tab', { name: 'Month' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('progress-panel-month')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Year' }));
    expect(screen.getByRole('tab', { name: 'Year' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('progress-panel-year')).toBeInTheDocument();
  });

  it('shows shortage, customer error, and completed services in Trends', async () => {
    const user = userEvent.setup();
    const points = buildParticipantProgressServicePoints('fixture-user-c', '2026-07-31');
    render(<ParticipantProgressSection servicePoints={points} asOfServiceDate="2026-07-31" />);

    await user.click(screen.getByTestId('progress-view-tab-trends'));
    expect(screen.getByTestId('progress-shortage-risk')).toBeInTheDocument();
    expect(screen.getByTestId('progress-average-customer-error')).toBeInTheDocument();
    expect(screen.getByTestId('progress-completed-services')).toHaveTextContent('4');
    expect(screen.queryByTestId('progress-recent-chart')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('progress-chart-bar-surplus').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('progress-chart-bar-shortage').length).toBeGreaterThan(0);
  });

  it('shows empty state for a Trends period without participant data', async () => {
    const user = userEvent.setup();
    const points = buildParticipantProgressServicePoints('fixture-user-c', '2026-07-31');
    render(<ParticipantProgressSection servicePoints={points} asOfServiceDate="2026-01-15" />);

    await user.click(screen.getByTestId('progress-view-tab-trends'));
    expect(screen.getByTestId('progress-period-empty')).toHaveTextContent(
      'No completed forecast results for this week yet.',
    );

    await user.click(screen.getByRole('tab', { name: 'Month' }));
    expect(screen.getByTestId('progress-period-empty')).toHaveTextContent(
      'No completed forecast results for this month yet.',
    );
  });

  it('shows one observation without claiming a trend', async () => {
    const user = userEvent.setup();
    const points = [
      {
        serviceDate: '2026-07-27',
        actualCustomers: 0,
        simulatedOverproductionGrams: 500,
        simulatedShortageGrams: 0,
        simulatedOverproductionGramsPerCustomer: null,
        simulatedShortageGramsPerCustomer: null,
        customerForecastAbsoluteError: 1,
      },
      {
        serviceDate: '2026-07-28',
        actualCustomers: 100,
        simulatedOverproductionGrams: 0,
        simulatedShortageGrams: 0,
        simulatedOverproductionGramsPerCustomer: 0,
        simulatedShortageGramsPerCustomer: 0,
        customerForecastAbsoluteError: 2,
      },
    ];

    render(<ParticipantProgressSection servicePoints={points} asOfServiceDate="2026-07-28" />);

    expect(screen.queryByTestId('progress-recent-chart')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('progress-view-tab-trends'));
    expect(screen.getByTestId('progress-trend-chart-svg')).toBeInTheDocument();
    expect(screen.getByTestId('progress-chart-single-point-note')).toHaveTextContent(
      /One data point/i,
    );
    expect(screen.getByTestId('progress-period-summary')).toBeInTheDocument();
  });

  it('counts several services in one monthly chart point without claiming one service', async () => {
    const user = userEvent.setup();
    const points = buildParticipantProgressServicePoints('fixture-user-c', '2026-07-31');
    render(<ParticipantProgressSection servicePoints={points} asOfServiceDate="2026-07-31" />);
    await user.click(screen.getByTestId('progress-view-tab-trends'));
    await user.click(screen.getByRole('tab', { name: 'Year' }));
    expect(screen.getByTestId('progress-completed-services')).toHaveTextContent('4');
    expect(screen.getByTestId('progress-chart-single-point-note')).toHaveTextContent('One data point');
    expect(screen.queryByText(/One completed service is shown/)).not.toBeInTheDocument();
  });
  it('does not render coworker names', () => {
    const points = buildParticipantProgressServicePoints('fixture-user-c', '2026-07-31');
    const { container } = render(
      <ParticipantProgressSection servicePoints={points} asOfServiceDate="2026-07-31" />,
    );
    expect(container.textContent).not.toMatch(/Aino Virtanen|Boris Lindström|Dmitri Koskinen/);
  });
});

describe('KitchenProgressSection scope label', () => {
  it('matches all-time scope in copy', () => {
    render(
      <KitchenProgressSection
        progress={{
          servicesCompletedCount: 3,
          anonymousTeamAverageSurplusGramsPerCustomer: 8.1,
          scopeLabel: 'All time',
        }}
      />,
    );
    expect(screen.getByTestId('kitchen-progress-scope-label')).toHaveTextContent('All time');
    expect(screen.getByText(/Team services all time/i)).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-progress-team-overproduction')).toHaveTextContent('8.1 g/customer');
  });
});
