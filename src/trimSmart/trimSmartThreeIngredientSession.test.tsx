// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRouter } from '../AppRouter';
import * as bridge from '../gamebus/bridge';
import * as detectEmbed from '../gamebus/detectEmbed';
import { trimSmartTaskFixture } from '../gamebus/trimSmartTaskFixtures';
import type { ActivityMessage } from '../gamebus/types';

function setHash(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

async function submitIngredient(
  user: ReturnType<typeof userEvent.setup>,
  options: { name: string; weight: string; practiceTestId: string; waste: string },
) {
  await user.selectOptions(screen.getByTestId('trim-smart-category-select'), 'vegetables');
  await user.type(screen.getByTestId('trim-smart-ingredient-name'), options.name);
  await user.type(screen.getByTestId('trim-smart-starting-weight'), options.weight);
  await user.click(screen.getByTestId('trim-smart-start-challenge'));
  await user.click(screen.getByTestId(options.practiceTestId));
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  await user.type(screen.getByTestId('trim-smart-waste-input'), options.waste);
  await user.click(screen.getByTestId('trim-smart-submit-button'));
}

function trimSmartActivityMessages(): ActivityMessage[] {
  return vi
    .mocked(window.parent.postMessage)
    .mock.calls.map((call) => call[0] as ActivityMessage)
    .filter((message) => message?.type === 'ACTIVITY' && message.data?.template === 'trimSmart');
}

function propertyValue(message: ActivityMessage, template: string): unknown {
  const property = message.data.properties.find((entry) => entry.template === template);
  return property?.obj?.value;
}

describe('trim smart three-ingredient session GameBus regression', () => {
  beforeEach(() => {
    setHash('#/waste/trim-smart');
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    bridge.resetGameBusBridgeForTests();
    bridge.ingestTaskForTests(trimSmartTaskFixture);
    vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    setHash('');
    bridge.resetGameBusBridgeForTests();
    vi.restoreAllMocks();
  });

  it('posts exactly three trimSmart ACTIVITIES with shared session identity and correct totals', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);

    await submitIngredient(user, {
      name: 'Carrot',
      weight: '1000',
      practiceTestId: 'trim-smart-practice-careful_trimming',
      waste: '85',
    });
    await user.click(screen.getByTestId('trim-smart-add-another'));

    await submitIngredient(user, {
      name: 'Onion',
      weight: '600',
      practiceTestId: 'trim-smart-practice-standard_practice',
      waste: '72',
    });
    await user.click(screen.getByTestId('trim-smart-add-another'));

    await submitIngredient(user, {
      name: 'Potato',
      weight: '1500',
      practiceTestId: 'trim-smart-practice-whole_ingredient_use',
      waste: '110',
    });

    const messagesAfterSubmits = trimSmartActivityMessages();
    expect(messagesAfterSubmits).toHaveLength(3);

    await user.click(screen.getByTestId('trim-smart-finish-session'));
    expect(trimSmartActivityMessages()).toHaveLength(3);

    const [carrot, onion, potato] = messagesAfterSubmits;
    const sessionId = propertyValue(carrot, 'sessionId');
    const sessionDate = propertyValue(carrot, 'sessionDate');

    expect(sessionId).toBeTruthy();
    expect(sessionDate).toBeTruthy();
    expect(propertyValue(onion, 'sessionId')).toBe(sessionId);
    expect(propertyValue(potato, 'sessionId')).toBe(sessionId);
    expect(propertyValue(onion, 'sessionDate')).toBe(sessionDate);
    expect(propertyValue(potato, 'sessionDate')).toBe(sessionDate);

    expect(propertyValue(carrot, 'ingredientName')).toBe('Carrot');
    expect(propertyValue(onion, 'ingredientName')).toBe('Onion');
    expect(propertyValue(potato, 'ingredientName')).toBe('Potato');
    expect(propertyValue(carrot, 'ingredientWeightGrams')).toBe(1000);
    expect(propertyValue(onion, 'ingredientWeightGrams')).toBe(600);
    expect(propertyValue(potato, 'ingredientWeightGrams')).toBe(1500);
    expect(propertyValue(carrot, 'participantWasteGrams')).toBe(85);
    expect(propertyValue(onion, 'participantWasteGrams')).toBe(72);
    expect(propertyValue(potato, 'participantWasteGrams')).toBe(110);
    expect(propertyValue(carrot, 'practice')).toBe('careful_trimming');
    expect(propertyValue(onion, 'practice')).toBe('standard_practice');
    expect(propertyValue(potato, 'practice')).toBe('whole_ingredient_use');

    const submittedAts = [
      propertyValue(carrot, 'submittedAt'),
      propertyValue(onion, 'submittedAt'),
      propertyValue(potato, 'submittedAt'),
    ];
    expect(new Set(submittedAts).size).toBe(3);

    for (const message of messagesAfterSubmits) {
      const templates = message.data.properties.map((entry) => entry.template);
      expect(templates).not.toContain('sessionCategoryWasteGrams');
      expect(templates).not.toContain('chefPerformanceScore');
    }

    const complete = screen.getByTestId('trim-smart-session-complete');
    expect(complete).toHaveTextContent('3 ingredients recorded');
    expect(complete).toHaveTextContent('3,100 g');
    expect(complete).toHaveTextContent('267 g');
  });
});
