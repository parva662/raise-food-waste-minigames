import { SessionEvidence } from '@/products/kitchen-skills-challenge/surfaces/shared/SessionEvidence';
import { postKitchenSkillsChallengeExit } from '@/products/kitchen-skills-challenge/gamebus/postExit';
import { useReadyKitchenSkillsSession } from '@/products/kitchen-skills-challenge/domain/session/KitchenSkillsSessionContext';

export function KitchenSkillsFinishSummary() {
  const { trimEntries, rescueEntries, portionEntries } = useReadyKitchenSkillsSession();

  return (
    <div className="chef-zero-dialog-backdrop kitchen-day-finish-backdrop" role="presentation">
      <div
        className="chef-zero-dialog kitchen-day-finish-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kitchen-day-finish-title"
        data-testid="kitchen-day-finish-summary"
      >
        <h2 id="kitchen-day-finish-title" className="chef-zero-dialog__title">
          Challenge complete
        </h2>
        <p className="chef-zero-dialog__text">Your Trim, Reuse, and Portion results for this session.</p>
        <SessionEvidence
          trimEntries={trimEntries}
          rescueEntries={rescueEntries}
          portionEntries={portionEntries}
          testIdPrefix="kitchen-day-finish"
        />
        <div className="chef-zero-dialog__actions">
          <button
            type="button"
            className="chef-zero-dialog__btn chef-zero-dialog__btn--confirm kitchen-day-button kitchen-day-button--primary"
            data-testid="kitchen-day-finish-challenge"
            onClick={() => postKitchenSkillsChallengeExit()}
          >
            Finish challenge
          </button>
        </div>
      </div>
    </div>
  );
}
