// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ForecastResultsAdminApp } from '@/products/forecast-results/admin/ForecastResultsAdminApp';
import { buildKitchenSkillsManagementSummary } from '@/products/forecast-results/admin/skills/buildKitchenSkillsManagementSummary';
import { OverviewSection } from '@/products/forecast-results/admin/components/OverviewSection';
import {
  KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY,
  KITCHEN_GROUP_INPUT_COLLECTION_KEY,
  KITCHEN_SKILLS_TRAINER_INPUT_COLLECTION_KEY,
} from '@/platform/gamebus/groupActivities';
import {
  INPUT_COLLECTION_PARI_KEY,
  INPUT_COLLECTION_PARI_ME_REQUEST_KEY,
} from '@/platform/gamebus/inputCollections';
import * as detectEmbedModule from '@/platform/gamebus/detectEmbed';
import {
  ingestInputCollectionsForTests,
  resetGameBusBridgeForTests,
} from '@/platform/gamebus/bridge';
import { buildAnonymizedChefForecastActivity } from '@/products/service-closeout/forecast/fixtures/gameBusChefForecastActivities';

const forecastOnlyDate = '2026-10-08';

function mePayload() {
  return {
    id: 'admin-user',
    firstName: 'Admin',
    lastName: 'Researcher',
  };
}

function forecastOnlyPayload() {
  return {
    [INPUT_COLLECTION_PARI_KEY]: {
      [INPUT_COLLECTION_PARI_ME_REQUEST_KEY]: mePayload(),
    },
    [KITCHEN_GROUP_INPUT_COLLECTION_KEY]: {
      [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [
        buildAnonymizedChefForecastActivity({
          actorId: 'chef-a',
          actorName: 'Chef Alpha',
          targetDate: forecastOnlyDate,
          forecastTotalCustomers: 260,
        }),
        buildAnonymizedChefForecastActivity({
          id: 'forecast-b',
          actorId: 'chef-b',
          actorName: 'Chef Beta',
          targetDate: forecastOnlyDate,
          forecastTotalCustomers: 250,
        }),
      ],
    },
  };
}

function trimActivity(actorId: string, actorName: string, sessionId: string, sessionDate: string) {
  return {
    id: `trim-${actorId}-${sessionId}`,
    actor: { id: actorId, name: actorName },
    template: { slug: 'trimSmart' },
    start: `${sessionDate}T10:00:00.000Z`,
    end: `${sessionDate}T10:03:00.000Z`,
    properties: [
      { template: { slug: 'sessionId' }, value: { value: sessionId } },
      { template: { slug: 'sessionDate' }, value: { value: sessionDate } },
      { template: { slug: 'submittedAt' }, value: { value: `${sessionDate}T10:03:00.000Z` } },
      { template: { slug: 'ingredientId' }, value: { value: 'carrot' } },
      { template: { slug: 'ingredientName' }, value: { value: 'Carrot' } },
      { template: { slug: 'ingredientCategory' }, value: { value: 'root' } },
      { template: { slug: 'ingredientWeightGrams' }, value: { value: 5000 } },
      { template: { slug: 'trimTechniques' }, value: { value: 'trimming' } },
      { template: { slug: 'estimatedWasteGrams' }, value: { value: 600 } },
      { template: { slug: 'actualWasteGrams' }, value: { value: 450 } },
      { template: { slug: 'duration' }, obj: { value: 3, unit: 'minutes' } },
    ],
  };
}

function reviewActivity(
  actorId: string,
  actorName: string,
  sessionId: string,
  sessionDate: string,
  reviewedGame: string,
) {
  return {
    id: `review-${actorId}-${reviewedGame}`,
    actor: { id: actorId, name: actorName },
    createdBy: { id: 'tutor-1', name: 'Tutor One' },
    template: { slug: 'wastePracticeReview' },
    properties: [
      { template: { slug: 'sessionId' }, value: { value: sessionId } },
      { template: { slug: 'sessionDate' }, value: { value: sessionDate } },
      { template: { slug: 'submittedAt' }, value: { value: `${sessionDate}T12:00:00.000Z` } },
      { template: { slug: 'reviewedGame' }, value: { value: reviewedGame } },
      { template: { slug: 'timeEfficiencyScore' }, value: { value: 4 } },
      { template: { slug: 'preparationQualityScore' }, value: { value: 5 } },
      { template: { slug: 'chefFeedback' }, value: { value: 'Solid work' } },
    ],
  };
}

describe('unified Kitchen Management Dashboard', () => {
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

  it('keeps full Forecast navigation visible for forecast-only 8 Oct 2026 service', async () => {
    const user = userEvent.setup();
    ingestInputCollectionsForTests(forecastOnlyPayload());
    render(<ForecastResultsAdminApp />);

    expect(screen.getByTestId('kitchen-mgmt-area-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-mgmt-primary-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-mgmt-service-overview')).toBeInTheDocument();
    expect(screen.getByTestId('service-overview-staff-count')).toHaveTextContent('2');
    expect(screen.getByTestId('service-overview-customers')).toHaveTextContent('Unavailable');
    expect(screen.getByTestId('service-overview-total-surplus')).toHaveTextContent('Unavailable');
    expect(screen.getByTestId('service-overview-status')).toHaveTextContent(
      'Waiting for service closeout',
    );
    expect(screen.getByTestId('chef-results-admin-forecast-staff-list')).toHaveTextContent(
      'Chef Alpha',
    );
    expect(screen.getByTestId('chef-results-admin-forecast-staff-list')).toHaveTextContent(
      'Chef Beta',
    );

    await user.click(screen.getByTestId('kitchen-mgmt-primary-tab-staff'));
    expect(screen.getByTestId('kitchen-mgmt-staff-results')).toBeInTheDocument();
    expect(screen.getByTestId('staff-result-name-chef-a')).toHaveTextContent('Chef Alpha');
    expect(screen.getByTestId('staff-result-name-chef-b')).toHaveTextContent('Chef Beta');
    expect(screen.getByTestId('staff-forecast-cell-chef-a')).toHaveTextContent('260');
    expect(screen.getByTestId('staff-forecast-cell-chef-b')).toHaveTextContent('250');

    await user.click(screen.getByTestId('kitchen-mgmt-primary-tab-trends'));
    expect(screen.getByTestId('kitchen-mgmt-trends')).toBeInTheDocument();

    await user.click(screen.getByTestId('kitchen-mgmt-primary-tab-history'));
    expect(screen.getByTestId('kitchen-mgmt-history')).toBeInTheDocument();
    expect(screen.getByTestId(`kitchen-mgmt-history-status-${forecastOnlyDate}`)).toHaveTextContent(
      'Waiting for service closeout',
    );
  });

  it('shows Kitchen Skills unavailable when trainer collection is missing', async () => {
    const user = userEvent.setup();
    ingestInputCollectionsForTests(forecastOnlyPayload());
    render(<ForecastResultsAdminApp />);
    await user.click(screen.getByTestId('kitchen-mgmt-area-tab-skills'));
    expect(screen.getByTestId('kitchen-mgmt-skills-unavailable')).toBeInTheDocument();
    expect(screen.queryByTestId('skills-kpi-participants')).not.toBeInTheDocument();
  });

  it('renders Kitchen Skills summaries from kitchenSkillsTrainerInput only', async () => {
    const user = userEvent.setup();
    const sessionA = 'kitchen-day:t:user-1:2026-09-23';
    const sessionB = 'kitchen-day:t:user-2:2026-09-24';
    ingestInputCollectionsForTests({
      ...forecastOnlyPayload(),
      [KITCHEN_SKILLS_TRAINER_INPUT_COLLECTION_KEY]: {
        [KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY]: [
          trimActivity('user-1', 'Student One', sessionA, '2026-09-23'),
          trimActivity('user-2', 'Student Two', sessionB, '2026-09-24'),
          reviewActivity('user-1', 'Student One', sessionA, '2026-09-23', 'trimSmart'),
        ],
      },
    });
    render(<ForecastResultsAdminApp />);
    await user.click(screen.getByTestId('kitchen-mgmt-area-tab-skills'));

    expect(screen.getByTestId('skills-kpi-participants')).toHaveTextContent('2');
    expect(screen.getByTestId('skills-kpi-sessions')).toHaveTextContent('2');
    expect(screen.getByTestId('skills-kpi-activities')).toHaveTextContent('2');
    expect(screen.getByTestId('skills-kpi-awaiting')).toHaveTextContent('1');
    expect(screen.getByTestId('skills-module-bar-trimSmart')).toBeInTheDocument();

    await user.click(screen.getByTestId('kitchen-mgmt-skills-tab-participants'));
    expect(screen.getByTestId('skills-participant-row-user-1')).toHaveTextContent('Student One');
    expect(screen.getByTestId('skills-participant-row-user-2')).toHaveTextContent('Student Two');

    await user.click(screen.getByTestId('kitchen-mgmt-skills-tab-assessments'));
    expect(screen.getByTestId(`skills-assessment-row-${sessionA}-trimSmart`)).toHaveTextContent(
      'Student One',
    );
    expect(screen.getByTestId(`skills-assessment-row-${sessionA}-trimSmart`)).toHaveTextContent(
      '4 / 5',
    );
    expect(screen.getByTestId(`skills-assessment-row-${sessionA}-trimSmart`)).toHaveTextContent(
      '5 / 5',
    );
    expect(screen.queryByText(/overall score|composite/i)).not.toBeInTheDocument();
  });
});

describe('Kitchen Skills management summary builder', () => {
  it('does not invent awaiting assessment for modules without evidence', () => {
    const sessionId = 'kitchen-day:t:user-1:2026-09-23';
    const summary = buildKitchenSkillsManagementSummary([
      trimActivity('user-1', 'Student One', sessionId, '2026-09-23'),
    ]);
    expect(summary.modulesAwaitingAssessment).toBe(1);
    expect(summary.moduleActivityCounts.rescueAndReuse).toBe(0);
    expect(summary.moduleActivityCounts.portionPrecision).toBe(0);
  });

  it('attributes assessments only to matching actor/session/module', () => {
    const sessionA = 'kitchen-day:t:user-1:2026-09-23';
    const sessionB = 'kitchen-day:t:user-2:2026-09-23';
    const summary = buildKitchenSkillsManagementSummary([
      trimActivity('user-1', 'Student One', sessionA, '2026-09-23'),
      trimActivity('user-2', 'Student Two', sessionB, '2026-09-23'),
      reviewActivity('user-1', 'Student One', sessionA, '2026-09-23', 'trimSmart'),
    ]);
    expect(summary.assessments).toHaveLength(1);
    expect(summary.assessments[0]?.actorId).toBe('user-1');
    expect(summary.assessments[0]?.sessionId).toBe(sessionA);
  });
});

describe('OverviewSection incomplete states', () => {
  afterEach(() => cleanup());

  it('renders forecast-only KPIs without fabricating closeout metrics', () => {
    render(
      <OverviewSection
        view={{
          kind: 'forecast_only',
          serviceDate: forecastOnlyDate,
          staffForecasts: [
            {
              userId: 'chef-a',
              userName: 'Chef Alpha',
              targetDate: forecastOnlyDate,
              forecastTotalCustomers: 260,
              main: { itemId: 'main', forecastQuantity: 100, portionWeightGrams: 120 },
              vegetarian: { itemId: 'veg', forecastQuantity: 40, portionWeightGrams: 120 },
              soup: { itemId: 'soup', forecastQuantity: 30, portionWeightGrams: 200 },
              dessert: { itemId: 'dessert', forecastQuantity: 20, portionWeightGrams: 80 },
            },
          ],
        }}
      />,
    );
    expect(screen.getByTestId('service-overview-staff-count')).toHaveTextContent('1');
    expect(screen.getByTestId('service-overview-customers')).toHaveTextContent('Unavailable');
    expect(screen.getByTestId('service-overview-total-surplus')).toHaveTextContent('Unavailable');
  });
});
