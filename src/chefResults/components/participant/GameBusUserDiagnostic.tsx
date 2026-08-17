import { isChefResultsGameBusInvestigationEnabled } from '../../../gamebus/chefResultsInvestigation';
import { useGameBusAuthenticatedUser } from '../../useGameBusAuthenticatedUser';

/**
 * Investigation diagnostic for real GameBus identity from inputCollectionPari.me.
 * Visible in DEV or with #/chef-results?gamebusDebug=1 on deployed builds.
 */
export function GameBusUserDiagnostic() {
  if (!isChefResultsGameBusInvestigationEnabled()) return null;

  const { embedded, inputCollectionsReady, user } = useGameBusAuthenticatedUser();

  return (
    <div className="chef-results-dev-user" data-testid="gamebus-user-diagnostic">
      <h3 className="chef-results-dev-user__title">GameBus user</h3>
      {!embedded ? (
        <p className="chef-results-dev-user__hint">Standalone mode — no GameBus embed.</p>
      ) : !inputCollectionsReady ? (
        <p className="chef-results-dev-user__hint">Waiting for INPUT_COLLECTIONS…</p>
      ) : !user ? (
        <p className="chef-results-dev-user__hint">No authenticated GameBus user in payload.</p>
      ) : (
        <dl className="chef-results-dev-user__details">
          <div>
            <dt>Name</dt>
            <dd data-testid="gamebus-user-name">{user.name}</dd>
          </div>
          <div>
            <dt>ID</dt>
            <dd data-testid="gamebus-user-id">{user.id}</dd>
          </div>
        </dl>
      )}
      <p className="chef-results-dev-user__note">
        Real GameBus identity only — fixture calculation results still use the development
        fixture profile below.
      </p>
    </div>
  );
}
