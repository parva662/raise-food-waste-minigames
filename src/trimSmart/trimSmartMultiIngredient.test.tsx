// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppRouter } from '../AppRouter';
import * as bridge from '../gamebus/bridge';
import * as detectEmbed from '../gamebus/detectEmbed';
import { trimSmartTaskFixture } from '../gamebus/trimSmartTaskFixtures';

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

describe('trim smart multi-ingredient session', () => {
  beforeEach(() => {
    setHash('#/waste/trim-smart');
    vi.spyOn(bridge, 'tryPostTrimSmartActivity').mockImplementation((_submission, _attemptPostKey) => {
      return {
        ok: true,
        message: {
          type: 'ACTIVITY',
          data: {
            template: 'trimSmart',
            properties: [],
          },
        } as never,
      };
    });
    bridge.resetGameBusBridgeForTests();
    bridge.ingestTaskForTests(trimSmartTaskFixture);
  });

  afterEach(() => {
    cleanup();
    setHash('');
    bridge.resetGameBusBridgeForTests();
    vi.restoreAllMocks();
  });

  it('records three ingredients and finishes with session totals', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);

    await submitIngredient(user, {
      name: 'Carrot',
      weight: '1000',
      practiceTestId: 'trim-smart-practice-careful_trimming',
      waste: '85',
    });
    expect(screen.getByTestId('trim-smart-ingredient-recorded')).toBeInTheDocument();
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
    await user.click(screen.getByTestId('trim-smart-finish-session'));

    const complete = screen.getByTestId('trim-smart-session-complete');
    expect(complete).toBeInTheDocument();
    expect(complete).toHaveTextContent('3 ingredients recorded');
    expect(complete).toHaveTextContent('3,100 g');
    expect(complete).toHaveTextContent('267 g');
  });

  it('posts separate trimSmart activities with shared session identity', async () => {
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    const postSpy = vi.mocked(bridge.tryPostTrimSmartActivity);
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

    expect(postSpy).toHaveBeenCalledTimes(2);
    const first = postSpy.mock.calls[0]![0];
    const second = postSpy.mock.calls[1]![0];
    expect(first.sessionId).toBe(second.sessionId);
    expect(first.sessionDate).toBe(second.sessionDate);
    expect(first.ingredientName).toBe('Carrot');
    expect(second.ingredientName).toBe('Onion');
    expect(first.submittedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(second.submittedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(postSpy.mock.calls[0]![1]).not.toBe(postSpy.mock.calls[1]![1]);
  });

  it('resets current attempt fields when adding another ingredient', async () => {
    const user = userEvent.setup();
    render(<AppRouter />);
    await submitIngredient(user, {
      name: 'Carrot',
      weight: '1000',
      practiceTestId: 'trim-smart-practice-careful_trimming',
      waste: '85',
    });
    await user.click(screen.getByTestId('trim-smart-add-another'));
    expect(screen.getByTestId('trim-smart-ingredient-name')).toHaveValue('');
    expect(screen.getByTestId('trim-smart-starting-weight')).toHaveValue('');
    expect(screen.getByTestId('trim-smart-header-recorded-count')).toHaveTextContent('1 ingredient recorded');
  });
});
