import { FIXTURE_KITCHEN_STAFF } from '../../../serviceCloseout/fixtures/staffRotation';
import {
  getFixtureCurrentUserId,
  isDevFixtureToolsEnabled,
  setFixtureCurrentUserId,
} from '../../currentUserContext';

export function FixtureCurrentUserSelector() {
  if (!isDevFixtureToolsEnabled()) return null;

  const currentUserId = getFixtureCurrentUserId();

  return (
    <div className="chef-results-dev-user" data-testid="fixture-current-user-selector">
      <label>
        <span>Development current user</span>
        <select
          value={currentUserId}
          onChange={(event) => {
            setFixtureCurrentUserId(event.target.value);
            window.location.reload();
          }}
        >
          {FIXTURE_KITCHEN_STAFF.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.displayName}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
