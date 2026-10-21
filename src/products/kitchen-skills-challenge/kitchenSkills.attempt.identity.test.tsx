/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as detectEmbed from '@/platform/gamebus/detectEmbed';
import {
  ingestInputCollectionsForTests,
  ingestTaskForTests,
  resetGameBusBridgeForTests,
} from '@/platform/gamebus/bridge';
import { AppRouter } from '@/app/AppRouter';
import { kitchenSkillsTaskFixture } from '@/products/kitchen-skills-challenge/gamebus/kitchenSkillsTaskFixtures';
import { resetKitchenSkillsPostStateForTests } from '@/products/kitchen-skills-challenge/gamebus/postActivity';
import {
  recordBanaaniTrim,
  recordHedelmatPortion,
  recordOmenaTrim,
  recordRescueDecision,
} from '@/products/kitchen-skills-challenge/kitchenSkills.testSupport';
import { readKitchenSkillsAttempt, kitchenSkillsAttemptStorageKey } from '@/products/kitchen-skills-challenge/domain/session/attempt';

const me = { inputCollectionPari: { me: { id: 'student-1', firstName: 'S', lastName: 'One' } } };

function setHash(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

function posts(spy: { mock: { calls: unknown[][] } }, template: string) {
  return spy.mock.calls
    .map((call) => call[0] as { type?: string; data?: { template?: string; properties?: { template?: string | { slug?: string; ref?: string }; obj?: { value?: string }; value?: { value?: string } }[] } })
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
    const name = typeof ref === 'string' ? ref : ref?.ref ?? ref?.slug;
    return name === slug;
  });
  return property?.obj?.value ?? property?.value?.value;
}

function sessionIdFrom(message: { data?: { properties?: { template?: string | { slug?: string; ref?: string }; obj?: { value?: string }; value?: { value?: string } }[] } }) {
  return propertyFrom(message, 'sessionId');
}

describe('Kitchen Skills attempt identity', () => {
  afterEach(() => {
    cleanup();
    resetGameBusBridgeForTests();
    resetKitchenSkillsPostStateForTests();
    setHash('');
    vi.restoreAllMocks();
  });

  it('D/V: two same-day attempts use different sessionIds and do not duplicate Portion', async () => {
    const user = userEvent.setup();
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    const spy = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    ingestTaskForTests(kitchenSkillsTaskFixture);
    setHash('#/kitchen-day');
    render(<AppRouter />);
    ingestInputCollectionsForTests({ ...me, kitchenGroupInputSelf: { activities: [] } });
    await screen.findByTestId('kitchen-day-portion');
    await recordHedelmatPortion(user);
    await screen.findByTestId('kitchen-day-trim');
    const first = posts(spy, 'portionPrecision');
    expect(first).toHaveLength(1);
    const firstId = sessionIdFrom(first[0]!);
    expect(firstId).toMatch(/^kitchen-day:kitchen-day-task-1:student-1:.*:.+/);

    await user.click(screen.getByTestId('kitchen-day-open-finish-summary'));
    await user.click(screen.getByTestId('kitchen-day-finish-challenge'));
    expect(spy).toHaveBeenCalledWith({ type: 'EXIT' }, '*');

    cleanup();
    resetGameBusBridgeForTests();
    resetKitchenSkillsPostStateForTests();
    spy.mockClear();
    ingestTaskForTests(kitchenSkillsTaskFixture);
    setHash('#/kitchen-day');
    render(<AppRouter />);
    ingestInputCollectionsForTests({ ...me, kitchenGroupInputSelf: { activities: [] } });
    await screen.findByTestId('kitchen-day-recipe-select');
    await recordHedelmatPortion(user);
    const second = posts(spy, 'portionPrecision');
    expect(second).toHaveLength(1);
    const secondId = sessionIdFrom(second[0]!);
    expect(secondId).toBeTruthy();
    expect(secondId).not.toBe(firstId);
  });

  it('F: reload before Finish recovers the same attempt without posting Portion again', async () => {
    const user = userEvent.setup();
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    const spy = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    ingestTaskForTests(kitchenSkillsTaskFixture);
    setHash('#/kitchen-day');
    render(<AppRouter />);
    ingestInputCollectionsForTests({ ...me, kitchenGroupInputSelf: { activities: [] } });
    await screen.findByTestId('kitchen-day-portion');
    await recordHedelmatPortion(user);
    expect(posts(spy, 'portionPrecision')).toHaveLength(1);
    const stored = readKitchenSkillsAttempt(kitchenSkillsAttemptStorageKey(kitchenSkillsTaskFixture.id, 'student-1'));
    expect(stored?.portion?.recipeName).toBe('Hedelmät M,G');

    cleanup();
    resetGameBusBridgeForTests();
    resetKitchenSkillsPostStateForTests();
    spy.mockClear();
    ingestTaskForTests(kitchenSkillsTaskFixture);
    setHash('#/kitchen-day');
    render(<AppRouter />);
    ingestInputCollectionsForTests({ ...me, kitchenGroupInputSelf: { activities: [] } });
    await screen.findByTestId('kitchen-day-portion-saved-card');
    expect(screen.getByTestId('kitchen-day-resumed')).toBeInTheDocument();
    expect(posts(spy, 'portionPrecision')).toHaveLength(0);
    expect(screen.queryByTestId('kitchen-day-finish-unconfirmed')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('kitchen-day-open-finish-summary'));
    expect(screen.getByTestId('kitchen-day-finish-unconfirmed')).toBeInTheDocument();
  });

  it('posts two distinct Rescue activities consecutively and does not lock the second ingredient', async () => {
    const user = userEvent.setup();
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    const spy = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    ingestTaskForTests(kitchenSkillsTaskFixture);
    setHash('#/kitchen-day');
    render(<AppRouter />);
    ingestInputCollectionsForTests({ ...me, kitchenGroupInputSelf: { activities: [] } });
    await screen.findByTestId('kitchen-day-portion');
    await recordHedelmatPortion(user);
    await recordBanaaniTrim(user);
    await user.click(screen.getByTestId('kitchen-day-add-another-ingredient'));
    await recordOmenaTrim(user, '200');
    await user.click(screen.getByTestId('kitchen-day-continue-reuse'));
    await recordRescueDecision(user, '200', 'Use in soup');
    expect(screen.queryByTestId('kitchen-day-finish-summary')).not.toBeInTheDocument();
    expect(posts(spy, 'rescueAndReuse')).toHaveLength(1);
    expect(propertyFrom(posts(spy, 'rescueAndReuse')[0]!, 'ingredientId')).toBe('banaani');
    expect(propertyFrom(posts(spy, 'rescueAndReuse')[0]!, 'reusableWasteGrams')).toBe(200);
    expect(screen.getByTestId('kitchen-day-rescue-ingredient')).toHaveDisplayValue('Omena');
    await recordRescueDecision(user, '0', 'Cannot be reused; discard');
    const rescuePosts = posts(spy, 'rescueAndReuse');
    expect(rescuePosts).toHaveLength(2);
    expect(propertyFrom(rescuePosts[1]!, 'ingredientId')).toBe('omena');
    expect(propertyFrom(rescuePosts[1]!, 'reusableWasteGrams')).toBe(0);
    expect(propertyFrom(rescuePosts[1]!, 'reuseDestination')).toBe('Cannot be reused; discard');
    expect(sessionIdFrom(rescuePosts[0]!)).toBe(sessionIdFrom(rescuePosts[1]!));
    expect(spy.mock.calls.some((call) => (call[0] as { type?: string }).type === 'EXIT')).toBe(false);
    await user.click(screen.getByTestId('kitchen-day-open-finish-summary'));
    await user.click(screen.getByTestId('kitchen-day-finish-challenge'));
    expect(spy).toHaveBeenCalledWith({ type: 'EXIT' }, '*');
    expect(posts(spy, 'rescueAndReuse')).toHaveLength(2);
  });

  it('reload between Rescue A and B keeps A and never reposts it', async () => {
    const user = userEvent.setup();
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    const spy = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    ingestTaskForTests(kitchenSkillsTaskFixture);
    setHash('#/kitchen-day');
    render(<AppRouter />);
    ingestInputCollectionsForTests({ ...me, kitchenGroupInputSelf: { activities: [] } });
    await screen.findByTestId('kitchen-day-portion');
    await recordHedelmatPortion(user);
    await recordBanaaniTrim(user);
    await user.click(screen.getByTestId('kitchen-day-add-another-ingredient'));
    await recordOmenaTrim(user, '200');
    await user.click(screen.getByTestId('kitchen-day-continue-reuse'));
    await recordRescueDecision(user, '200', 'Use in soup');
    expect(posts(spy, 'rescueAndReuse')).toHaveLength(1);

    cleanup();
    resetGameBusBridgeForTests();
    resetKitchenSkillsPostStateForTests();
    spy.mockClear();
    ingestTaskForTests(kitchenSkillsTaskFixture);
    setHash('#/kitchen-day/reuse');
    render(<AppRouter />);
    ingestInputCollectionsForTests({ ...me, kitchenGroupInputSelf: { activities: [] } });
    await screen.findByTestId('kitchen-day-rescue');
    expect(screen.getByTestId('kitchen-day-resumed')).toBeInTheDocument();
    expect(posts(spy, 'rescueAndReuse')).toHaveLength(0);
    expect(screen.getByTestId('kitchen-day-rescue-rescue-summary-banaani')).toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-rescue-ingredient')).toHaveDisplayValue('Omena');
    await recordRescueDecision(user, '0', 'Cannot be reused; discard');
    expect(posts(spy, 'rescueAndReuse')).toHaveLength(1);
    expect(propertyFrom(posts(spy, 'rescueAndReuse')[0]!, 'ingredientId')).toBe('omena');
  });
});
