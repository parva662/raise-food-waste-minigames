/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as detectEmbed from '@/platform/gamebus/detectEmbed';
import { ingestInputCollectionsForTests, ingestTaskForTests, resetGameBusBridgeForTests } from '@/platform/gamebus/bridge';
import { AppRouter } from '@/app/AppRouter';
import { kitchenSkillsTaskFixture } from '@/products/kitchen-skills-challenge/gamebus/kitchenSkillsTaskFixtures';
import { resetKitchenSkillsPostStateForTests } from '@/products/kitchen-skills-challenge/gamebus/postActivity';
import { recordHedelmatPortion } from '@/products/kitchen-skills-challenge/kitchenSkills.testSupport';

const me = { inputCollectionPari: { me: { id: 'student-1', firstName: 'S', lastName: 'One' } } };

function setHash(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

/**
 * Previously observed (old main, reconstructed before this workflow change):
 * Two recipes in one challenge shared one day-scoped sessionId. Local Portion rows lived
 * only in memory. After an iframe reload that replayed the task-open feed (empty or stale),
 * the second recipe vanished from preview/history and the student could post the first recipe
 * again. That repro passed against origin/main at 784d4a3 before this branch replaced the
 * workflow. Live GameBus student data was not available to confirm the production root cause.
 *
 * Remaining persistence limit (not claimed fixed by removing the feature): a successful
 * postMessage is not GameBus confirmation. The attempt record recovers dispatched-but-
 * unhydrated work as unconfirmed local rows. An incomplete self-feed still cannot prove
 * that GameBus persisted the activity.
 */
describe('REPRO: old multi-recipe disappearance vs new one-recipe attempt', () => {
  afterEach(() => {
    cleanup();
    resetGameBusBridgeForTests();
    resetKitchenSkillsPostStateForTests();
    setHash('');
    vi.restoreAllMocks();
  });

  it('no longer offers a second Portion recipe inside the same attempt', async () => {
    const user = userEvent.setup();
    vi.spyOn(detectEmbed, 'isGameBusEmbed').mockReturnValue(true);
    vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    ingestTaskForTests(kitchenSkillsTaskFixture);
    setHash('#/kitchen-day');
    render(<AppRouter />);
    ingestInputCollectionsForTests({ ...me, kitchenGroupInputSelf: { activities: [] } });
    await screen.findByTestId('kitchen-day-portion');
    await recordHedelmatPortion(user);
    await user.click(screen.getByTestId('kitchen-day-nav-portion'));
    expect(screen.queryByTestId('kitchen-day-start-another-recipe')).not.toBeInTheDocument();
    expect(screen.queryByTestId('kitchen-day-recipe-select')).not.toBeInTheDocument();
    expect(screen.getByTestId('kitchen-day-portion-saved-card')).toBeInTheDocument();
  });
});
