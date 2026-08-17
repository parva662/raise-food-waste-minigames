// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServiceCloseoutApp } from './ServiceCloseoutApp';
import { MENU_DATES } from '../test/fixtures/dates';
import * as datesModule from '../utils/dates';
import { buildAnonymizedChefForecastActivity } from './forecast/fixtures/gameBusChefForecastActivities';
import type { CloseoutChefForecastResolution } from './forecast/gameBusChefForecastTypes';
import { NO_CLOSEOUT_FORECAST_MESSAGE } from './forecast/gameBusChefForecastTypes';
import { parseGameBusChefForecastActivities } from './forecast/parseGameBusChefForecast';

const { useCloseoutChefForecastMock } = vi.hoisted(() => ({
  useCloseoutChefForecastMock: vi.fn<() => CloseoutChefForecastResolution>(),
}));

vi.mock('./useCloseoutChefForecast', () => ({
  useCloseoutChefForecast: () => useCloseoutChefForecastMock(),
}));

function matchedForecastResolution(): CloseoutChefForecastResolution {
  const forecast = parseGameBusChefForecastActivities([
    buildAnonymizedChefForecastActivity({
      forecastMain: 100,
      forecastVegetarian: 48,
      forecastSoup: 36,
      forecastDessert: 30,
      includeDessert: true,
      actorName: 'Chef A. Example',
      forecastTotalCustomers: 142,
    }),
  ]).valid[0]!;

  return { status: 'matched', forecasts: [forecast] };
}

function getPreparedInput(category: string) {
  const group = screen.getByRole('group', { name: new RegExp(`^${category}:`, 'i') });
  return within(group).getByLabelText(new RegExp(`${category} prepared portions`, 'i'));
}

describe('service closeout forecast UI', () => {
  beforeEach(() => {
    vi.spyOn(datesModule, 'getTodayIsoDate').mockReturnValue(MENU_DATES.runtimeWednesday);
    useCloseoutChefForecastMock.mockReturnValue({ status: 'standalone', forecasts: [] });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows no-forecast message when embed has no matching forecast', () => {
    useCloseoutChefForecastMock.mockReturnValue({
      status: 'no_forecast',
      forecasts: [],
      message: NO_CLOSEOUT_FORECAST_MESSAGE,
    });

    render(<ServiceCloseoutApp />);
    expect(screen.getByTestId('closeout-no-forecast')).toHaveTextContent(
      NO_CLOSEOUT_FORECAST_MESSAGE,
    );
    expect(screen.queryByTestId('closeout-submitted-forecast')).not.toBeInTheDocument();
  });

  it('shows submitted forecast context when a match exists', () => {
    useCloseoutChefForecastMock.mockReturnValue(matchedForecastResolution());

    render(<ServiceCloseoutApp />);
    expect(screen.getByTestId('closeout-submitted-forecast')).toBeInTheDocument();
    expect(screen.getByTestId('closeout-forecast-chef')).toHaveTextContent('Chef A. Example');
    expect(screen.getByTestId('closeout-forecast-customers')).toHaveTextContent('142');
  });

  it('displays main, vegetarian, and soup forecasts read-only', () => {
    useCloseoutChefForecastMock.mockReturnValue(matchedForecastResolution());

    render(<ServiceCloseoutApp />);
    expect(screen.getByTestId('closeout-forecast-main')).toHaveTextContent('100 portions');
    expect(screen.getByTestId('closeout-forecast-vegetarian')).toHaveTextContent('48 portions');
    expect(screen.getByTestId('closeout-forecast-soup')).toHaveTextContent('36 portions');
  });

  it('displays dessert forecast when present', () => {
    useCloseoutChefForecastMock.mockReturnValue(matchedForecastResolution());

    render(<ServiceCloseoutApp />);
    expect(screen.getByTestId('closeout-forecast-dessert')).toHaveTextContent('30 portions');
  });

  it('shows em dash for missing dessert forecast without crashing', () => {
    const forecast = parseGameBusChefForecastActivities([
      buildAnonymizedChefForecastActivity(),
    ]).valid[0]!;
    useCloseoutChefForecastMock.mockReturnValue({ status: 'matched', forecasts: [forecast] });

    render(<ServiceCloseoutApp />);
    expect(screen.getByTestId('closeout-forecast-dessert')).toHaveTextContent('—');
  });

  it('keeps actual prepared inputs blank and never prefilled from forecast', () => {
    useCloseoutChefForecastMock.mockReturnValue(matchedForecastResolution());

    render(<ServiceCloseoutApp />);
    expect(getPreparedInput('Main')).toHaveValue('');
    expect(getPreparedInput('Vegetarian')).toHaveValue('');
    expect(getPreparedInput('Soup')).toHaveValue('');
    expect(getPreparedInput('Dessert')).toHaveValue('');
  });

  it('shows synthetic test banner when forecast is synthetic', () => {
    const forecast = parseGameBusChefForecastActivities([
      buildAnonymizedChefForecastActivity(),
    ]).valid[0]!;
    useCloseoutChefForecastMock.mockReturnValue({
      status: 'matched',
      forecasts: [forecast],
      isSynthetic: true,
    });

    render(<ServiceCloseoutApp />);
    expect(screen.getByTestId('closeout-synthetic-forecast-banner')).toHaveTextContent(
      'TEST DATA — synthetic forecast',
    );
  });

  it('allows actual prepared to differ from forecast after entry', async () => {
    const user = userEvent.setup();
    useCloseoutChefForecastMock.mockReturnValue(matchedForecastResolution());

    render(<ServiceCloseoutApp />);
    await user.type(getPreparedInput('Main'), '110');
    expect(screen.getByTestId('closeout-forecast-main')).toHaveTextContent('100 portions');
    expect(getPreparedInput('Main')).toHaveValue('110');
  });

  it('does not substitute tomorrow forecast in standalone mode', () => {
    useCloseoutChefForecastMock.mockReturnValue({ status: 'standalone', forecasts: [] });

    render(<ServiceCloseoutApp />);
    expect(screen.queryByTestId('closeout-submitted-forecast')).not.toBeInTheDocument();
    expect(screen.queryByTestId('closeout-no-forecast')).not.toBeInTheDocument();
    expect(MENU_DATES.runtimeThursday).not.toBe(MENU_DATES.runtimeWednesday);
  });

  it('keeps closeout form usable when forecast is missing', async () => {
    const user = userEvent.setup();
    useCloseoutChefForecastMock.mockReturnValue({
      status: 'no_forecast',
      forecasts: [],
      message: NO_CLOSEOUT_FORECAST_MESSAGE,
    });

    render(<ServiceCloseoutApp />);
    await user.type(screen.getByLabelText('Actual customers'), '120');
    expect(screen.getByLabelText('Actual customers')).toHaveValue('120');
  });
});
