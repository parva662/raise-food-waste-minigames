// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ParticipantProgressSection } from './components/participant/ParticipantProgressSection';
import { buildParticipantProgressServicePoints } from './participantProgressData';
import * as operationalCalendarModule from '../services/operationalServiceCalendar';
import { DEFAULT_FIXTURE_CURRENT_USER_ID } from './currentUserContext';

describe('ParticipantProgressSection', () => {
  beforeEach(() => {
    vi.spyOn(operationalCalendarModule, 'resolveChefResultsServiceDate').mockReturnValue(
      '2026-07-31',
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('replaces Your week with Your progress and default Week tab', () => {
    const points = buildParticipantProgressServicePoints(
      DEFAULT_FIXTURE_CURRENT_USER_ID,
      '2026-07-31',
    );
    render(<ParticipantProgressSection servicePoints={points} asOfServiceDate="2026-07-31" />);

    expect(screen.getByTestId('your-progress-section')).toBeInTheDocument();
    expect(screen.queryByTestId('your-week-section')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Week' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/Estimated surplus \(g\/customer\)/)).toBeInTheDocument();
    expect(
      screen.getByText(/normalized by the number of customers served/i),
    ).toBeInTheDocument();
  });

  it('switches tabs and updates the visible panel', async () => {
    const user = userEvent.setup();
    const points = buildParticipantProgressServicePoints('fixture-user-c', '2026-07-31');
    render(<ParticipantProgressSection servicePoints={points} asOfServiceDate="2026-07-31" />);

    await user.click(screen.getByRole('tab', { name: 'Month' }));
    expect(screen.getByRole('tab', { name: 'Month' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('progress-panel-month')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Year' }));
    expect(screen.getByRole('tab', { name: 'Year' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('progress-panel-year')).toBeInTheDocument();
  });

  it('shows shortage risk, customer error, and completed services', () => {
    const points = buildParticipantProgressServicePoints('fixture-user-c', '2026-07-31');
    render(<ParticipantProgressSection servicePoints={points} asOfServiceDate="2026-07-31" />);

    expect(screen.getByTestId('progress-shortage-risk')).toBeInTheDocument();
    expect(screen.getByTestId('progress-average-customer-error')).toBeInTheDocument();
    expect(screen.getByTestId('progress-completed-services')).toHaveTextContent('4');
    expect(screen.getByTestId('progress-bar-chart')).toBeInTheDocument();
  });

  it('shows empty state for a period without participant data', async () => {
    const user = userEvent.setup();
    const points = buildParticipantProgressServicePoints('fixture-user-c', '2026-07-31');
    render(<ParticipantProgressSection servicePoints={points} asOfServiceDate="2026-01-15" />);

    expect(screen.getByTestId('progress-period-empty')).toHaveTextContent(
      'No completed forecast results for this week.',
    );

    await user.click(screen.getByRole('tab', { name: 'Month' }));
    expect(screen.getByTestId('progress-period-empty')).toHaveTextContent(
      'No completed forecast results for this month.',
    );
  });

  it('does not render a bar for unavailable normalized values', () => {
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

    expect(screen.getByTestId('progress-bar-chart')).toBeInTheDocument();
    expect(screen.queryByTestId('progress-chart-unavailable')).not.toBeInTheDocument();
    expect(screen.getByText('0.0')).toBeInTheDocument();
    const bars = document.querySelectorAll('.chef-results-progress-chart__bar');
    expect(bars).toHaveLength(1);
  });

  it('does not render coworker names', () => {
    const points = buildParticipantProgressServicePoints('fixture-user-c', '2026-07-31');
    const { container } = render(
      <ParticipantProgressSection servicePoints={points} asOfServiceDate="2026-07-31" />,
    );
    expect(container.textContent).not.toMatch(/Aino Virtanen|Boris Lindström|Dmitri Koskinen/);
  });
});
