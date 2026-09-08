// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRouter } from '../AppRouter';
import { ChefResultsAdminApp } from './ChefResultsAdminApp';
import { buildFixtureDailyServiceResults } from './adapters/fixtureCalculationSource';
import { sumMeasuredOverproductionGrams } from './actualKitchenOutcome';
import { getDocumentTitleForMode } from '../routing/documentTitle';
import * as detectEmbedModule from '../gamebus/detectEmbed';
import {
  ingestInputCollectionsForTests,
  resetGameBusBridgeForTests,
} from '../gamebus/bridge';

function mockStandaloneMode() {
  vi.spyOn(detectEmbedModule, 'isGameBusEmbed').mockReturnValue(false);
}

function setHash(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

describe('kitchen management dashboard route', () => {
  beforeEach(() => {
    mockStandaloneMode();
    setHash('#/chef-results-admin');
  });

  afterEach(() => {
    cleanup();
    setHash('');
    vi.restoreAllMocks();
  });

  it('renders ChefResultsAdminApp at #/chef-results-admin', () => {
    render(<AppRouter />);
    expect(screen.getByTestId('chef-results-admin-page')).toBeInTheDocument();
  });

  it('shows exactly one Kitchen Management Dashboard h1', () => {
    render(<AppRouter />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Kitchen Management Dashboard',
    );
  });

  it('removes prototype admin copy', () => {
    render(<AppRouter />);
    expect(screen.queryByText(/Research\/admin view/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Daily simulation results/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Provisional weekly summary/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/route-level authorization/i)).not.toBeInTheDocument();
  });

  it('uses Kitchen Management Dashboard document title', () => {
    expect(getDocumentTitleForMode('chef-results-admin')).toBe('Kitchen Management Dashboard');
  });

  it('does not show practical kitchen module content', () => {
    render(<AppRouter />);
    expect(screen.queryByText(/Trimming/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Portioning/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Reusing/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Preparation/i)).not.toBeInTheDocument();
  });
});

describe('kitchen management service selection', () => {
  beforeEach(() => {
    mockStandaloneMode();
  });

  afterEach(() => {
    cleanup();
    setHash('');
    vi.restoreAllMocks();
  });

  it('defaults to latest calculable fixture service date', () => {
    render(<ChefResultsAdminApp />);
    const select = screen.getByTestId('chef-results-admin-date-select') as HTMLSelectElement;
    expect(select.value).toBe('2026-07-31');
    expect(screen.getByTestId('kitchen-mgmt-selected-date')).toHaveTextContent(/Friday, 31 July 2026/);
  });

  it('allows selecting an older service date', async () => {
    const user = userEvent.setup();
    render(<ChefResultsAdminApp />);
    const select = screen.getByTestId('chef-results-admin-date-select');
    await user.selectOptions(select, '2026-07-27');
    expect((select as HTMLSelectElement).value).toBe('2026-07-27');
    expect(screen.getByTestId('kitchen-mgmt-selected-date')).toHaveTextContent(/Monday, 27 July 2026/);
    expect(screen.getByTestId('kitchen-mgmt-staff-results')).toBeInTheDocument();
  });

  it('does not show fixture results while embedded input is pending', () => {
    vi.spyOn(detectEmbedModule, 'isGameBusEmbed').mockReturnValue(true);
    render(<ChefResultsAdminApp />);
    expect(screen.getByTestId('chef-results-admin-pending')).toHaveTextContent(
      'Loading kitchen results…',
    );
    expect(screen.queryByTestId('kitchen-mgmt-service-overview')).not.toBeInTheDocument();
  });
});

describe('kitchen management service overview', () => {
  beforeEach(() => mockStandaloneMode());
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows operational metrics and category surplus for selected service', () => {
    const daily = buildFixtureDailyServiceResults('2026-07-31');
    expect(daily).not.toBeNull();
    const expectedTotal = sumMeasuredOverproductionGrams(daily!.observed);

    render(<ChefResultsAdminApp />);
    expect(screen.getByTestId('service-overview-customers')).toHaveTextContent(
      String(daily!.observed.actualCustomers),
    );
    expect(screen.getByTestId('service-overview-total-surplus')).toHaveTextContent(
      `${Math.round(expectedTotal).toLocaleString('en-GB')} g`,
    );
    expect(screen.getByTestId('service-overview-staff-count')).toHaveTextContent(
      String(daily!.staffResults.length),
    );
    expect(screen.getByTestId('service-overview-status')).toHaveTextContent('Completed');
    expect(screen.getByTestId('service-overview-surplus-main')).toBeInTheDocument();
    expect(screen.getByTestId('service-overview-surplus-vegetarian')).toBeInTheDocument();
    expect(screen.getByTestId('service-overview-surplus-soup')).toBeInTheDocument();
    expect(screen.getByTestId('service-overview-surplus-dessert')).toBeInTheDocument();
  });
});

describe('kitchen management staff table', () => {
  beforeEach(() => mockStandaloneMode());
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lists named staff with normalized metrics and no ranking language', () => {
    const daily = buildFixtureDailyServiceResults('2026-07-31')!;
    render(<ChefResultsAdminApp />);

    const rows = daily.staffResults.map((result) =>
      screen.getByTestId(`staff-result-row-${result.userId}`),
    );
    expect(rows).toHaveLength(daily.staffResults.length);

    const names = rows.map((row) => within(row).getByRole('rowheader').textContent);
    expect(names).toEqual([...names].sort((left, right) => left!.localeCompare(right!)));

    for (const result of daily.staffResults) {
      expect(screen.getByTestId(`staff-result-name-${result.userId}`)).toHaveTextContent(
        result.userName,
      );
    }

    expect(screen.queryByText(/1st|2nd|best|worst|winner/i)).not.toBeInTheDocument();
    expect(JSON.stringify(screen.getByTestId('kitchen-mgmt-staff-table').textContent)).not.toMatch(
      /Infinity|NaN/,
    );
  });
});

describe('kitchen management staff detail', () => {
  beforeEach(() => mockStandaloneMode());
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('opens, replaces, and closes staff detail on the same page', async () => {
    const user = userEvent.setup();
    const daily = buildFixtureDailyServiceResults('2026-07-31')!;
    const first = [...daily.staffResults].sort((a, b) => a.userName.localeCompare(b.userName))[0]!;
    const second = [...daily.staffResults].sort((a, b) => a.userName.localeCompare(b.userName))[1]!;

    render(<ChefResultsAdminApp />);

    await user.click(screen.getByTestId(`staff-view-details-${first.userId}`));
    expect(screen.getByTestId('kitchen-mgmt-staff-detail')).toBeInTheDocument();
    expect(screen.getByText(`${first.userName} — service detail`)).toBeInTheDocument();
    expect(screen.getByTestId('staff-detail-predicted')).toHaveTextContent(
      String(first.forecastCustomers),
    );

    await user.click(screen.getByTestId(`staff-view-details-${second.userId}`));
    expect(screen.getByText(`${second.userName} — service detail`)).toBeInTheDocument();

    await user.click(screen.getByTestId('kitchen-mgmt-staff-detail-close'));
    expect(screen.queryByTestId('kitchen-mgmt-staff-detail')).not.toBeInTheDocument();
  });

  it('shows menu item outcomes for all categories', async () => {
    const user = userEvent.setup();
    const daily = buildFixtureDailyServiceResults('2026-07-31')!;
    const staff = daily.staffResults[0]!;

    render(<ChefResultsAdminApp />);
    await user.click(screen.getByTestId(`staff-view-details-${staff.userId}`));

    for (const key of ['main', 'vegetarian', 'soup', 'dessert'] as const) {
      expect(screen.getByTestId(`staff-detail-outcome-${key}`)).toBeInTheDocument();
      const category = staff[key];
      const text = screen.getByTestId(`staff-detail-outcome-${key}`).textContent ?? '';
      if (category.simulatedShortageGrams > 0) {
        expect(text).toMatch(/estimated shortage/i);
      } else if (category.simulatedOverproductionGrams > 0) {
        expect(text).toMatch(/estimated surplus/i);
      } else {
        expect(text).toMatch(/On target/i);
      }
    }
  });
});

describe('kitchen management team overview and trends', () => {
  beforeEach(() => mockStandaloneMode());
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows team overview medians for selected service', () => {
    render(<ChefResultsAdminApp />);
    expect(screen.getByTestId('kitchen-mgmt-team-overview')).toBeInTheDocument();
    expect(screen.getByTestId('team-overview-staff-count').textContent).not.toBe('0');
    expect(screen.queryByText(/team score|composite/i)).not.toBeInTheDocument();
  });

  it('shows week month year management trends anchored to selected service date', async () => {
    const user = userEvent.setup();
    render(<ChefResultsAdminApp />);
    expect(screen.getByTestId('kitchen-mgmt-trends')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-mgmt-trend-panel-week')).toBeInTheDocument();
    expect(screen.getByTestId('mgmt-completed-services')).toBeInTheDocument();
    expect(screen.getByTestId('mgmt-staff-forecasts-evaluated')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-mgmt-staff-period-table')).toBeInTheDocument();

    await user.click(screen.getByTestId('kitchen-mgmt-tab-month'));
    expect(screen.getByTestId('kitchen-mgmt-trend-panel-month')).toBeInTheDocument();

    await user.click(screen.getByTestId('kitchen-mgmt-tab-year'));
    expect(screen.getByTestId('kitchen-mgmt-trend-panel-year')).toBeInTheDocument();
  });
});

describe('kitchen management embedded admin names', () => {
  let originalParent: Window;

  beforeEach(() => {
    resetGameBusBridgeForTests();
    vi.spyOn(detectEmbedModule, 'isGameBusEmbed').mockReturnValue(true);
    originalParent = window.parent;
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: { postMessage: vi.fn() },
    });
  });

  afterEach(() => {
    cleanup();
    resetGameBusBridgeForTests();
    Object.defineProperty(window, 'parent', { configurable: true, value: originalParent });
    vi.restoreAllMocks();
  });

  it('shows real actor names on embedded admin page', async () => {
    const { embeddedKitchenPayloadForAdmin } = await import('./chefResultsManagementTestFixtures');
    ingestInputCollectionsForTests(embeddedKitchenPayloadForAdmin());
    render(<ChefResultsAdminApp />);
    expect(screen.getByTestId('staff-result-name-real-user-abc')).toHaveTextContent('Test Account');
    expect(screen.getByTestId('staff-result-name-coworker-user')).toHaveTextContent('Coworker Chef');
  });
});
