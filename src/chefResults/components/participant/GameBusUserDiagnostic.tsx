import { useMemo } from 'react';
import { isChefResultsGameBusDebugMode } from '../../../gamebus/chefResultsInvestigation';
import { buildGroupKitchenDiagnostics } from '../../adapters/groupCalculationSource';
import { useGameBusAuthenticatedUser } from '../../useGameBusAuthenticatedUser';
import { useGameBusEmbed } from '../../../gamebus/useGameBusEmbed';

interface GameBusUserDiagnosticProps {
  selectedDate?: string;
  currentUserId?: string;
  hasOwnResult?: boolean;
}

/**
 * Diagnostic for real GameBus identity and kitchen group activity parsing.
 * Visible only with #/chef-results?gamebusDebug=1.
 */
export function GameBusUserDiagnostic({
  selectedDate = '',
  currentUserId = '',
  hasOwnResult = false,
}: GameBusUserDiagnosticProps) {
  if (!isChefResultsGameBusDebugMode()) return null;

  const { embedded, inputCollections, inputCollectionsReady } = useGameBusEmbed();
  const { user } = useGameBusAuthenticatedUser();
  const diagnostics = useMemo(() => {
    if (!embedded || !inputCollectionsReady) return null;
    return buildGroupKitchenDiagnostics(inputCollections);
  }, [embedded, inputCollections, inputCollectionsReady]);

  return (
    <div className="chef-results-dev-user" data-testid="gamebus-user-diagnostic">
      <h3 className="chef-results-dev-user__title">GameBus debug</h3>
      {!embedded ? (
        <p className="chef-results-dev-user__hint">Standalone mode — no GameBus embed.</p>
      ) : !inputCollectionsReady ? (
        <p className="chef-results-dev-user__hint">Waiting for INPUT_COLLECTIONS…</p>
      ) : !user ? (
        <p className="chef-results-dev-user__hint">No authenticated GameBus user in payload.</p>
      ) : (
        <dl className="chef-results-dev-user__details">
          <div>
            <dt>Authenticated user name</dt>
            <dd data-testid="gamebus-user-name">{user.name}</dd>
          </div>
          <div>
            <dt>Authenticated user id</dt>
            <dd data-testid="gamebus-user-id">{user.id}</dd>
          </div>
        </dl>
      )}

      {diagnostics ? (
        <dl className="chef-results-dev-user__details" data-testid="gamebus-kitchen-diagnostics">
          <div>
            <dt>Total group activities</dt>
            <dd data-testid="debug-total-activities">{diagnostics.totalActivities}</dd>
          </div>
          <div>
            <dt>chefForecast activities</dt>
            <dd data-testid="debug-chef-forecast-activities">{diagnostics.chefForecastActivityCount}</dd>
          </div>
          <div>
            <dt>Valid chefForecast</dt>
            <dd data-testid="debug-valid-chef-forecasts">{diagnostics.validChefForecastCount}</dd>
          </div>
          <div>
            <dt>Rejected chefForecast</dt>
            <dd data-testid="debug-rejected-chef-forecasts">{diagnostics.rejectedChefForecastCount}</dd>
          </div>
          <div>
            <dt>wasteMeasurement activities</dt>
            <dd data-testid="debug-waste-measurement-activities">
              {diagnostics.wasteMeasurementActivityCount}
            </dd>
          </div>
          <div>
            <dt>Valid wasteMeasurement</dt>
            <dd data-testid="debug-valid-waste-measurements">
              {diagnostics.validWasteMeasurementCount}
            </dd>
          </div>
          <div>
            <dt>Rejected wasteMeasurement</dt>
            <dd data-testid="debug-rejected-waste-measurements">
              {diagnostics.rejectedWasteMeasurementCount}
            </dd>
          </div>
          <div>
            <dt>Forecast targetDates</dt>
            <dd data-testid="debug-forecast-target-dates">
              {diagnostics.forecastTargetDates.join(', ') || '—'}
            </dd>
          </div>
          <div>
            <dt>wasteMeasurement serviceDates</dt>
            <dd data-testid="debug-waste-service-dates">
              {diagnostics.wasteServiceDates.join(', ') || '—'}
            </dd>
          </div>
          <div>
            <dt>Calculable result dates</dt>
            <dd data-testid="debug-calculable-dates">
              {diagnostics.calculableResultDates.join(', ') || '—'}
            </dd>
          </div>
          <div>
            <dt>Selected service date</dt>
            <dd data-testid="debug-selected-date">{selectedDate || '—'}</dd>
          </div>
          <div>
            <dt>Current user has calculated result</dt>
            <dd data-testid="debug-current-user-has-result">{hasOwnResult ? 'yes' : 'no'}</dd>
          </div>
          {currentUserId ? (
            <div>
              <dt>Current user id (selection)</dt>
              <dd data-testid="debug-current-user-id">{currentUserId}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {diagnostics && diagnostics.rejectedChefForecasts.length > 0 ? (
        <details className="chef-results-dev-user__rejections">
          <summary>Rejected chefForecast activities</summary>
          <ul data-testid="debug-rejected-chef-forecast-list">
            {diagnostics.rejectedChefForecasts.map((entry, index) => (
              <li key={`${entry.activityId ?? 'unknown'}-${index}`}>
                {entry.activityId ?? 'unknown'}: {entry.reason}
                {entry.detail ? ` (${entry.detail})` : ''}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {diagnostics && diagnostics.rejectedWasteMeasurements.length > 0 ? (
        <details className="chef-results-dev-user__rejections">
          <summary>Rejected wasteMeasurement activities</summary>
          <ul data-testid="debug-rejected-waste-measurement-list">
            {diagnostics.rejectedWasteMeasurements.map((entry, index) => (
              <li key={`${entry.activityId ?? 'unknown'}-${index}`}>
                {entry.activityId ?? 'unknown'}: {entry.reason}
                {entry.detail ? ` (${entry.detail})` : ''}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <p className="chef-results-dev-user__note">
        Real GameBus identity from inputCollectionPari.me. Participant results use group kitchen
        activities when embedded.
      </p>
    </div>
  );
}
