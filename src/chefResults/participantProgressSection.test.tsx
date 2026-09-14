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

  it('shows Your progress with default Week tab', () => {
    const points = buildParticipantProgressServicePoints(
      DEFAULT_FIXTURE_CURRENT_USER_ID,
      '2026-07-31',
    );
    render(<ParticipantProgressSection servicePoints={points} asOfServiceDate="2026-07-31" />);

    expect(screen.getByTestId('your-progress-section')).toBeInTheDocument();
    expect(screen.queryByTestId('your-week-section')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Week' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('progress-period-summary')).toBeInTheDocument();
    expect(screen.getByTestId('progress-chart-legend')).toBeInTheDocument();
  });

  it('renders period summary before the trend chart in document order', () => {
    const points = buildParticipantProgressServicePoints('fixture-user-c', '2026-07-31');
    render(<ParticipantProgressSection servicePoints={points} asOfServiceDate="2026-07-31" />);

    const summary = screen.getByTestId('progress-period-summary');
    const chart = screen.getByTestId('progress-bar-chart');
    expect(summary.compareDocumentPosition(chart) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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
    expect(screen.getAllByTestId('progress-chart-bar-surplus').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('progress-chart-bar-shortage').length).toBeGreaterThan(0);
  });

  it('shows empty state for a period without participant data', async () => {
    const user = userEvent.setup();
    const points = buildParticipantProgressServicePoints('fixture-user-c', '2026-07-31');
    render(<ParticipantProgressSection servicePoints={points} asOfServiceDate="2026-01-15" />);

    expect(screen.getByTestId('progress-period-empty')).toHaveTextContent(
      'No completed forecast results for this week yet.',
    );

    await user.click(screen.getByRole('tab', { name: 'Month' }));
    expect(screen.getByTestId('progress-period-empty')).toHaveTextContent(
      'No completed forecast results for this month yet.',
    );
  });

  it('shows not-enough-data message when fewer than two chartable buckets', () => {
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

    expect(screen.getByTestId('progress-chart-unavailable')).toHaveTextContent(
      /Not enough completed services/i,
    );
    expect(screen.queryByTestId('progress-trend-chart-svg')).not.toBeInTheDocument();
    expect(screen.getByTestId('progress-period-summary')).toBeInTheDocument();
  });

  it('does not render coworker names', () => {
    const points = buildParticipantProgressServicePoints('fixture-user-c', '2026-07-31');
    const { container } = render(
      <ParticipantProgressSection servicePoints={points} asOfServiceDate="2026-07-31" />,
    );
    expect(container.textContent).not.toMatch(/Aino Virtanen|Boris Lindström|Dmitri Koskinen/);
  });
});
