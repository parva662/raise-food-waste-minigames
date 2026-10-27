/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRouter } from '@/app/AppRouter';
import * as detectEmbed from '@/platform/gamebus/detectEmbed';
import {
  ingestInputCollectionsForTests,
  ingestTaskForTests,
  resetGameBusBridgeForTests,
} from '@/platform/gamebus/bridge';
import { kitchenSkillsTaskFixture } from '@/products/kitchen-skills-challenge/gamebus/kitchenSkillsTaskFixtures';
import { resetKitchenSkillsPostStateForTests } from '@/products/kitchen-skills-challenge/gamebus/postActivity';
import { resetKitchenSkillsAttemptStorageForTests } from '@/products/kitchen-skills-challenge/domain/session/attempt';
import {
  completeTrimAfterIngredient,
  recordHedelmatPortion,
  selectTrimIngredient,
  typeMassGrams,
} from '@/products/kitchen-skills-challenge/kitchenSkills.testSupport';

const me = { inputCollectionPari: { me: { id: 'student-1', firstName: 'S', lastName: 'One' } } };

function setHash(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

function posts(spy: { mock: { calls: unknown[][] } }, template: string) {
  return spy.mock.calls
    .map(
      (call) =>
        call[0] as {
          type?: string;
          data?: {
            template?: string;
            properties?: {
              template?: string | { slug?: string; ref?: string };
              obj?: { value?: unknown };
              value?: { value?: unknown };
            }[];
          };
        },
    )
    .filter((message) => message?.type === 'SILENT_ACTIVITY' && message.data?.template === template);
}

function propertyFrom(
  message: {
    data?: {
      properties?: {
        template?: string | { slug?: string; ref?: string };
        obj?: { value?: unknown };
        value?: { value?: unknown };
      }[];
    };
  },
  slug: string,
) {
  const property = message.data?.properties?.find((item) => {
    const ref = item.template;
    const name = typeof ref === 'string' ? ref : (ref?.ref ?? ref?.slug);
    return name === slug;
  });
  return property?.obj?.value ?? property?.value?.value;
}

describe('Staff Kitchen Skills Challenge bug fixes', () => {
  beforeEach(() => {
    setHash('#/kitchen-day');
  });

  afterEach(() => {
    cleanup();
    resetGameBusBridgeForTests();
    resetKitchenSkillsPostStateForTests();
    resetKitchenSkillsAttemptStorageForTests();
    setHash('');
    vi.restoreAllMocks();
  });

  it('KS-TRIM-001: unit switching preserves the physical quantity', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    const recipeInput = screen.getByTestId('kitchen-day-recipe-select');
    await user.click(recipeInput);
    await user.click(screen.getByRole('option', { name: 'Hedelmät M,G' }));
    // Banaani target is 1.5 kg → field starts in kg so typing 0.5 means 500 g.
    expect(screen.getByTestId('kitchen-day-actual-banaani-unit-kg')).toHaveAttribute('aria-pressed', 'true');
    await user.type(screen.getByTestId('kitchen-day-actual-banaani'), '0.5');
    await user.click(screen.getByTestId('kitchen-day-actual-banaani-unit-g'));
    expect(screen.getByTestId('kitchen-day-actual-banaani')).toHaveValue('500');
    await user.click(screen.getByTestId('kitchen-day-actual-banaani-unit-kg'));
    expect(screen.getByTestId('kitchen-day-actual-banaani')).toHaveValue('0.5');
  });

  it('KS-TRIM-002: Trim starting weight prefills from Portion actual grams and stays editable', async () => {
    const user = userEvent.setup();
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    const spy = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    ingestTaskForTests(kitchenSkillsTaskFixture);
    render(<AppRouter />);
    ingestInputCollectionsForTests({ ...me, kitchenGroupInputSelf: { activities: [] } });
    await screen.findByTestId('kitchen-day-portion');
    await recordHedelmatPortion(user);
    await selectTrimIngredient(user, 'Banaani', 'Banaani');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.queryByTestId('kitchen-day-trim-step-weight')).not.toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-trim-step-technique')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-starting-weight-unit-kg')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('kitchen-day-starting-weight')).toHaveValue('1.5');
    expect(screen.getByTestId('kitchen-day-starting-weight-source')).toBeInTheDocument();
    await user.clear(screen.getByTestId('kitchen-day-starting-weight'));
    await typeMassGrams(user, 'kitchen-day-starting-weight', '1800');
    await user.click(screen.getByTestId('kitchen-day-technique-trimming'));
    await user.click(screen.getByTestId('kitchen-day-technique-continue'));
    await typeMassGrams(user, 'kitchen-day-estimated-waste', '600');
    await user.click(screen.getByTestId('kitchen-day-estimate-continue'));
    await user.click(screen.getByTestId('kitchen-day-start-preparation'));
    await user.click(screen.getByTestId('kitchen-day-finish-preparation'));
    await user.click(screen.getByTestId('kitchen-day-timer-continue'));
    await typeMassGrams(user, 'kitchen-day-actual-waste', '450');
    await user.click(screen.getByTestId('kitchen-day-submit-trim'));
    const trimPosts = posts(spy, 'trimSmart');
    expect(trimPosts).toHaveLength(1);
    expect(propertyFrom(trimPosts[0]!, 'ingredientWeightGrams')).toBe(1800);
    expect(propertyFrom(trimPosts[0]!, 'actualWasteGrams')).toBe(450);
  });

  it('KS-TRIM-002: Portion quantity equal to recipe target still prefills Trim', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await recordHedelmatPortion(user);
    await selectTrimIngredient(user, 'Omena', 'Omena');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByTestId('kitchen-day-starting-weight')).toHaveValue('1.2');
    expect(screen.getByTestId('kitchen-day-starting-weight-unit-kg')).toHaveAttribute('aria-pressed', 'true');
  });

  it('KS-FINISH-003: successful journey does not show a student sync warning', async () => {
    const user = userEvent.setup();
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    ingestTaskForTests(kitchenSkillsTaskFixture);
    render(<AppRouter />);
    ingestInputCollectionsForTests({ ...me, kitchenGroupInputSelf: { activities: [] } });
    await screen.findByTestId('kitchen-day-portion');
    await recordHedelmatPortion(user);
    await selectTrimIngredient(user, 'Banaani', 'Banaani');
    await completeTrimAfterIngredient(user, '0');
    await user.click(screen.getByTestId('kitchen-day-open-finish-summary'));
    expect(screen.getByTestId('kitchen-day-finish-summary')).toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-finish-unconfirmed')).not.toBeInTheDocument();
    await user.click(screen.getByText('Show details'));
    expect(screen.getByTestId('kitchen-day-finish-local-dispatch-note')).toBeInTheDocument();
  });
});
