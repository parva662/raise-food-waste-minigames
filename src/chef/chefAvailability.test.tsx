// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ChefApp } from './ChefApp';
import { helsinki, MENU_DATES, SUBMISSION_TIMES } from '../test/fixtures/dates';
import * as menuResolverModule from '../services/menuResolver';
import * as operationalCalendarModule from '../services/operationalServiceCalendar';
import { OperationalCalendarError } from '../services/operationalServiceCalendar';

describe('ChefApp menu availability', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('CLOSED day disables forecast submission', () => {
    vi.spyOn(operationalCalendarModule, 'resolveChefForecastServiceDate').mockReturnValue(
      MENU_DATES.closedWorkbookDay,
    );
    vi.spyOn(menuResolverModule, 'resolveMenuForDate').mockReturnValue({
      status: 'closed',
      reason: 'Canteen closed',
    });
    render(<ChefApp clock={() => SUBMISSION_TIMES.midday} />);
    expect(screen.getByText('The canteen is closed on this date.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit forecast' })).not.toBeInTheDocument();
  });

  it('missing date disables forecast submission', () => {
    vi.spyOn(operationalCalendarModule, 'resolveChefForecastServiceDate').mockReturnValue(
      MENU_DATES.missingFromWorkbook,
    );
    render(<ChefApp clock={() => SUBMISSION_TIMES.midday} />);
    expect(screen.getByText('Menu not available for this date.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit forecast' })).not.toBeInTheDocument();
  });

  it('keeps the resolved target date when its menu data is unavailable', () => {
    const wednesdayWithoutMenu = MENU_DATES.missingFromWorkbook;
    render(<ChefApp clock={() => helsinki(wednesdayWithoutMenu, '08:10:00')} />);

    expect(screen.getByRole('time')).toHaveAttribute('dateTime', wednesdayWithoutMenu);
    expect(screen.getByText('Menu not available for this date.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit forecast' })).not.toBeInTheDocument();
    expect(
      screen.queryByText('Could not resolve the kitchen forecast service date.'),
    ).not.toBeInTheDocument();
  });

  it('renders calendar error banner instead of a blank page when service date resolution fails', () => {
    vi.spyOn(operationalCalendarModule, 'resolveChefForecastServiceDate').mockImplementation(() => {
      throw new OperationalCalendarError('No service date within the menu calendar.');
    });
    render(<ChefApp clock={() => SUBMISSION_TIMES.midday} />);
    expect(screen.getByText('Could not resolve the kitchen forecast service date.')).toBeInTheDocument();
    expect(screen.getByText('No service date within the menu calendar.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit forecast' })).not.toBeInTheDocument();
  });
});
