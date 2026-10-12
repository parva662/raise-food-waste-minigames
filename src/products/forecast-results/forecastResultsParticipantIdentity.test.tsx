// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ForecastResultsParticipantApp } from '@/products/forecast-results/participant/ForecastResultsParticipantApp';
import {
  KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY,
  KITCHEN_GROUP_INPUT_COLLECTION_KEY,
} from '@/platform/gamebus/groupActivities';
import * as detectEmbedModule from '@/platform/gamebus/detectEmbed';
import * as operationalCalendarModule from '@/shared/calendar/operationalServiceCalendar';
import {
  ingestInputCollectionsForTests,
  resetGameBusBridgeForTests,
} from '@/platform/gamebus/bridge';
import {
  INPUT_COLLECTION_PARI_KEY,
  INPUT_COLLECTION_PARI_ME_REQUEST_KEY,
} from '@/platform/gamebus/inputCollections';
import { buildAnonymizedChefForecastActivity } from '@/products/service-closeout/forecast/fixtures/gameBusChefForecastActivities';
import {
  buildParticipantProgressServicePoints,
} from '@/products/forecast-results/calculations/participantProgressData';
import { getParticipantGroupResultServiceDates } from '@/products/forecast-results/adapters/groupCalculationSource';

const chefA = 'chef-a';
const chefB = 'chef-b';
const sep2 = '2026-09-02';
const sep7 = '2026-09-07';
const sep8 = '2026-09-08';

function mePayload(userId: string) {
  return {
    id: userId,
    firstName: 'Chef',
    lastName: userId === chefA ? 'A' : 'B',
    roles: ['chef'],
  };
}

function wasteMeasurementForDate(serviceDate: string) {
  return {
    id: `wm-${serviceDate}`,
    template: { slug: 'wasteMeasurement', name: 'Waste measurement' },
    createdAt: `${serviceDate}T15:00:00.000Z`,
    properties: [
      { template: { slug: 'serviceDate' }, value: { value: serviceDate } },
      { template: { slug: 'actualCustomers' }, value: { value: 140 } },
      { template: { slug: 'mainItemId' }, value: { value: 'meatballs' } },
      { template: { slug: 'preparedMainQuantity' }, value: { value: 110 } },
      { template: { slug: 'vegetarianItemId' }, value: { value: 'quorn' } },
      { template: { slug: 'preparedVegetarianQuantity' }, value: { value: 50 } },
      { template: { slug: 'soupItemId' }, value: { value: 'pumpkin-soup' } },
      { template: { slug: 'preparedSoupQuantity' }, value: { value: 40 } },
      { template: { slug: 'dessertItemId' }, value: { value: 'apple-compote' } },
      { template: { slug: 'preparedDessertQuantity' }, value: { value: 40 } },
      { template: { slug: 'overproductionMeatKg' }, value: { value: 0.3 } },
      { template: { slug: 'overproductionVegetarianKg' }, value: { value: 0.6 } },
      { template: { slug: 'overproductionSoupKg' }, value: { value: 0.1 } },
      { template: { slug: 'overproductionDessertKg' }, value: { value: 0.02 } },
      { template: { slug: 'submittedAt' }, value: { value: `${serviceDate}T15:00:00.000Z` } },
    ],
  };
}

function forecast(actorId: string, targetDate: string, customers: number, main = 100) {
  return buildAnonymizedChefForecastActivity({
    id: `${actorId}-${targetDate}`,
    actorId,
    actorName: actorId,
    targetDate,
    forecastTotalCustomers: customers,
    forecastMain: main,
  });
}

function payload(userId: string, activities: unknown[]) {
  return {
    [INPUT_COLLECTION_PARI_KEY]: {
      [INPUT_COLLECTION_PARI_ME_REQUEST_KEY]: mePayload(userId),
    },
    [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
      [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: activities,
    },
  };
}

function renderAs(userId: string, activities: unknown[], serviceDate: string) {
  vi.spyOn(operationalCalendarModule, 'resolveForecastResultsServiceDate').mockReturnValue(
    serviceDate,
  );
  resetGameBusBridgeForTests();
  ingestInputCollectionsForTests(payload(userId, activities));
  return render(<ForecastResultsParticipantApp />);
}

describe('forecast participant identity', () => {
  let originalParent: Window;

  beforeEach(() => {
    resetGameBusBridgeForTests();
    vi.spyOn(detectEmbedModule, 'isGameBusEmbed').mockReturnValue(true);
    window.sessionStorage.clear();
    window.location.hash = '#/chef-results';
    originalParent = window.parent;
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: { postMessage: vi.fn() },
    });
  });

  afterEach(() => {
    cleanup();
    resetGameBusBridgeForTests();
    window.sessionStorage.clear();
    window.location.hash = '';
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: originalParent,
    });
    vi.restoreAllMocks();
  });

  const splitHistory = [
    forecast(chefA, sep2, 100),
    wasteMeasurementForDate(sep2),
    forecast(chefB, sep7, 180),
    wasteMeasurementForDate(sep7),
  ];

  it('gives two authenticated chefs different personal histories', async () => {
    const user = userEvent.setup();
    renderAs(chefA, splitHistory, sep7);
    expect(screen.getByTestId('latest-forecast-date')).toHaveTextContent(/2 September 2026/);
    expect(screen.queryByTestId(`progress-recent-row-${sep7}`)).not.toBeInTheDocument();
    await user.click(screen.getByTestId('participant-primary-tab-progress'));
    expect(screen.getByTestId(`progress-recent-row-${sep2}`)).toBeInTheDocument();
    expect(screen.queryByTestId(`progress-recent-row-${sep7}`)).not.toBeInTheDocument();
    const chefASurplus = screen.getByTestId(`progress-recent-row-${sep2}`).textContent;

    cleanup();
    renderAs(chefB, splitHistory, sep7);
    expect(screen.getByTestId('latest-forecast-date')).toHaveTextContent(/7 September 2026/);
    expect(screen.queryByText(/2 September 2026/)).not.toBeInTheDocument();
    await user.click(screen.getByTestId('participant-primary-tab-progress'));
    expect(screen.getByTestId(`progress-recent-row-${sep7}`)).toBeInTheDocument();
    expect(screen.queryByTestId(`progress-recent-row-${sep2}`)).not.toBeInTheDocument();
    expect(screen.getByTestId(`progress-recent-row-${sep7}`).textContent).not.toBe(chefASurplus);
  });

  it('does not fill personal history from group history when the chef has zero own activities', async () => {
    const user = userEvent.setup();
    const activities = [forecast(chefA, sep7, 100), wasteMeasurementForDate(sep7)];
    renderAs(chefB, activities, sep7);

    expect(screen.getByTestId('latest-forecast-empty')).toHaveTextContent('No forecast results yet.');
    expect(screen.queryByTestId('latest-forecast-result')).not.toBeInTheDocument();
    expect(screen.queryByText(chefA)).not.toBeInTheDocument();
    expect(screen.queryByText('4.12 kg')).not.toBeInTheDocument();
    expect(screen.queryByText('fixture-user-c')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('participant-primary-tab-progress'));
    expect(screen.getByTestId('progress-global-empty')).toHaveTextContent(
      'No completed forecast results yet.',
    );
    expect(screen.queryByTestId(`progress-recent-row-${sep7}`)).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-progress-section')).not.toBeInTheDocument();
  });

  it('shows one own forecast and closeout pair', async () => {
    const user = userEvent.setup();
    renderAs(chefA, [forecast(chefA, sep7, 160), wasteMeasurementForDate(sep7)], sep7);
    expect(screen.getByTestId('latest-forecast-date')).toHaveTextContent(/7 September 2026/);
    expect(screen.getByTestId('latest-surplus')).toHaveTextContent('g/customer');
    expect(screen.getByTestId('latest-shortage')).toHaveTextContent('g/customer');
    expect(screen.getByTestId('latest-customer-error')).toHaveTextContent('customers');
    await user.click(screen.getByTestId('participant-primary-tab-progress'));
    expect(screen.getByTestId(`progress-recent-row-${sep7}`)).toBeInTheDocument();
    expect(screen.getByTestId('progress-recent-list').querySelectorAll('li')).toHaveLength(1);
  });

  it('keeps earlier own history while the current service waits for closeout', async () => {
    const user = userEvent.setup();
    renderAs(
      chefA,
      [
        forecast(chefA, sep2, 110),
        wasteMeasurementForDate(sep2),
        forecast(chefA, sep8, 150),
      ],
      sep8,
    );
    expect(screen.getByTestId('dashboard-status-chip')).toHaveTextContent(
      'Waiting for service closeout',
    );
    expect(screen.getByTestId('latest-forecast-date')).toHaveTextContent(/2 September 2026/);
    await user.click(screen.getByTestId('participant-primary-tab-progress'));
    expect(screen.getByTestId(`progress-recent-row-${sep2}`)).toBeInTheDocument();
    expect(screen.queryByTestId(`progress-recent-row-${sep8}`)).not.toBeInTheDocument();
  });

  it('does not keep the previous account history after an account switch', async () => {
    const user = userEvent.setup();
    renderAs(chefA, splitHistory, sep7);
    await user.click(screen.getByTestId('participant-primary-tab-progress'));
    expect(screen.getByTestId(`progress-recent-row-${sep2}`)).toBeInTheDocument();

    cleanup();
    renderAs(chefB, splitHistory, sep7);
    await user.click(screen.getByTestId('participant-primary-tab-progress'));
    expect(screen.queryByTestId(`progress-recent-row-${sep2}`)).not.toBeInTheDocument();
    expect(screen.getByTestId(`progress-recent-row-${sep7}`)).toBeInTheDocument();
  });

  it('replaces identity in a mounted dashboard and clears every personal view for a zero-activity account', async () => {
    const user = userEvent.setup();
    window.sessionStorage.setItem('chef-results-fixture-current-user-id', 'fixture-user-c');
    renderAs(chefA, splitHistory, sep7);
    await user.click(screen.getByTestId('participant-primary-tab-progress'));
    await user.click(screen.getByTestId('progress-view-tab-history'));
    expect(screen.getByTestId('progress-history-list')).toHaveTextContent('2 September 2026');
    act(() => ingestInputCollectionsForTests(payload(chefB, splitHistory)));
    expect(screen.queryByText(/2 September 2026/)).not.toBeInTheDocument();
    expect(screen.getByTestId(`progress-recent-row-${sep7}`)).toBeInTheDocument();
    act(() => ingestInputCollectionsForTests(payload('chef-with-no-activities', splitHistory)));
    for (const view of ['recent', 'trends', 'history']) {
      await user.click(screen.getByTestId(`progress-view-tab-${view}`));
      expect(screen.getByTestId('progress-global-empty')).toHaveTextContent('No completed forecast results yet.');
      expect(screen.queryByTestId('progress-summary-cards')).not.toBeInTheDocument();
      expect(screen.queryByTestId('progress-trend-chart-svg')).not.toBeInTheDocument();
      expect(screen.queryByTestId('kitchen-progress-section')).not.toBeInTheDocument();
      expect(screen.queryByTestId(`progress-recent-row-${sep2}`)).not.toBeInTheDocument();
      expect(screen.queryByTestId(`progress-recent-row-${sep7}`)).not.toBeInTheDocument();
    }
    await user.click(screen.getByTestId('participant-primary-tab-overview'));
    expect(screen.getByTestId('latest-forecast-empty')).toBeInTheDocument();
    act(() => ingestInputCollectionsForTests({ kitchenGroupInput: { activities: splitHistory } }));
    expect(screen.queryByTestId('latest-forecast-result')).not.toBeInTheDocument();
    cleanup();
    renderAs('chef-with-no-activities', splitHistory, sep7);
    expect(screen.getByTestId('latest-forecast-empty')).toBeInTheDocument();
  });
  it('keeps a fresh zero-activity account empty when the group has the seven live-incident service dates', async () => {
    const user = userEvent.setup();
    const dates = ['2026-09-02', '2026-09-08', '2026-09-09', '2026-09-15', '2026-09-16', '2026-09-22', '2026-10-06'];
    const activities = dates.flatMap((date) => [forecast(chefA, date, 164), wasteMeasurementForDate(date)]);
    expect(getParticipantGroupResultServiceDates(payload(chefA, activities), chefA)).toEqual(dates);
    for (let load = 0; load < 2; load += 1) {
      renderAs(chefB, activities, '2026-10-12');
      expect(screen.getByTestId('latest-forecast-empty')).toBeInTheDocument();
      await user.click(screen.getByTestId('participant-primary-tab-progress'));
      for (const view of ['recent', 'trends', 'history']) {
        await user.click(screen.getByTestId(`progress-view-tab-${view}`));
        expect(screen.getByTestId('progress-global-empty')).toBeInTheDocument();
        expect(screen.queryByTestId('progress-summary-cards')).not.toBeInTheDocument();
        expect(screen.queryByTestId('progress-trend-chart-svg')).not.toBeInTheDocument();
        expect(screen.queryByTestId('progress-history-list')).not.toBeInTheDocument();
        for (const date of dates) expect(screen.queryByTestId(`progress-recent-row-${date}`)).not.toBeInTheDocument();
      }
      cleanup();
    }
  });
  it('reconstructs the same personal history after reload', () => {
    renderAs(chefA, splitHistory, sep7);
    const surplus = screen.getByTestId('latest-surplus').textContent;
    const date = screen.getByTestId('latest-forecast-date').textContent;
    cleanup();
    resetGameBusBridgeForTests();
    ingestInputCollectionsForTests(payload(chefA, splitHistory));
    render(<ForecastResultsParticipantApp />);
    expect(screen.getByTestId('latest-surplus')).toHaveTextContent(surplus ?? '');
    expect(screen.getByTestId('latest-forecast-date')).toHaveTextContent(date ?? '');
  });

  it('does not treat a forecast with no actor id as personal history', () => {
    const nameless = forecast(chefA, sep2, 100);
    const withoutActorId = { ...nameless, actor: { name: 'Chef A' } };
    const activities = [withoutActorId, wasteMeasurementForDate(sep2)];
    const collections = payload(chefA, activities);

    expect(getParticipantGroupResultServiceDates(collections, chefA)).toEqual([]);
    expect(buildParticipantProgressServicePoints(chefA, sep7, collections)).toEqual([]);
    expect(buildParticipantProgressServicePoints(chefB, sep7, collections)).toEqual([]);

    renderAs(chefA, activities, sep7);
    expect(screen.getByTestId('latest-forecast-empty')).toHaveTextContent('No forecast results yet.');
    expect(screen.queryByText('fixture-user-c')).not.toBeInTheDocument();
  });

  it('compares you and team in g/customer and stays anonymous', () => {
    renderAs(
      chefA,
      [
        forecast(chefA, sep7, 100, 80),
        forecast(chefB, sep7, 180, 140),
        wasteMeasurementForDate(sep7),
      ],
      sep7,
    );
    expect(screen.getByTestId('peer-surplus-you').textContent).toMatch(/g\/customer/);
    expect(screen.getByTestId('peer-surplus-median').textContent).toMatch(/g\/customer/);
    expect(screen.getByTestId('peer-surplus-difference').textContent).toMatch(
      /g\/customer (lower|higher) than team/,
    );
    expect(screen.getByTestId('peer-surplus-you').textContent).not.toBe(
      screen.getByTestId('peer-surplus-median').textContent?.replace('Team:', 'You:'),
    );
    expect(screen.getByTestId('peer-shortage-you').textContent).toMatch(/g\/customer/);
    expect(screen.getByTestId('peer-customer-error-you').textContent).toMatch(/customers/);
    expect(screen.getByTestId('peer-customer-error-median').textContent).toMatch(/customers/);
    expect(screen.queryByText(/ kg/)).not.toBeInTheDocument();
    expect(screen.queryByText(chefB)).not.toBeInTheDocument();
    expect(screen.getByTestId('team-comparison-section')).toHaveTextContent(/not included/i);
    expect(screen.getByTestId('forecast-performance-summary')).toBeInTheDocument();
    expect(screen.queryByText(/overall|0–100|stars|ranking|good\/bad/i)).not.toBeInTheDocument();
  });

  it('keeps Overview You vs Team readable at 390px width', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 844 });
    renderAs(
      chefA,
      [
        forecast(chefA, sep7, 100, 80),
        forecast(chefB, sep7, 180, 140),
        wasteMeasurementForDate(sep7),
      ],
      sep7,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('My forecast performance');
    expect(screen.getByTestId('latest-forecast-result')).toBeInTheDocument();
    expect(screen.getByTestId('team-comparison-section')).toBeInTheDocument();
    expect(screen.getByTestId('peer-surplus-you')).toBeVisible();
    expect(screen.getByTestId('peer-surplus-median')).toBeVisible();
    expect(screen.getByTestId('peer-shortage-you')).toBeVisible();
    expect(screen.getByTestId('peer-customer-error-you')).toBeVisible();
  });
});
