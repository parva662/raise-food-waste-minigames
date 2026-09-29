/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { postGameBusExit } from '@/platform/gamebus/exit';
import { postKitchenSkillsChallengeExit } from '@/products/kitchen-skills-challenge/gamebus/postExit';

describe('Kitchen Skills EXIT helper', () => {
  it('posts exactly { type: EXIT }', () => {
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    postKitchenSkillsChallengeExit();
    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith({ type: 'EXIT' }, '*');
    postGameBusExit();
    expect(postMessage.mock.calls[1]?.[0]).toEqual({ type: 'EXIT' });
  });
});
