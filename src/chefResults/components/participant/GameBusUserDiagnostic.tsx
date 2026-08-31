import { useMemo } from 'react';
import { isChefResultsGameBusDebugMode } from '../../../gamebus/chefResultsInvestigation';
import { buildGroupKitchenDiagnostics } from '../../adapters/groupCalculationSource';
import { buildInputCollectionsDebugInfo } from '../../debug/buildInputCollectionsDebugInfo';
import { getChefResultsFrontendDiagnosticIdentifier } from '../../debug/frontendBuildIdentifier';
import { useGameBusAuthenticatedUser } from '../../useGameBusAuthenticatedUser';
import { useGameBusEmbed } from '../../../gamebus/useGameBusEmbed';

interface GameBusUserDiagnosticProps {
  selectedDate?: string;
  currentUserId?: string;
  hasOwnResult?: boolean;
}

function yesNo(value: boolean): string {
  return value ? 'yes' : 'no';
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
  const inputCollectionsDebug = useMemo(() => {
    if (!embedded || !inputCollectionsReady) return null;
    return buildInputCollectionsDebugInfo(inputCollections);
  }, [embedded, inputCollections, inputCollectionsReady]);
  const diagnostics = useMemo(() => {
    if (!embedded || !inputCollectionsReady) return null;
    return buildGroupKitchenDiagnostics(inputCollections);
  }, [embedded, inputCollections, inputCollectionsReady]);

  const templateReferenceLines = inputCollectionsDebug
    ? Object.entries(inputCollectionsDebug.templateReferenceCounts).sort(([left], [right]) =>
        left.localeCompare(right),
      )
    : [];
  const frontendDiagnosticId = getChefResultsFrontendDiagnosticIdentifier();

  return (
    <div className="chef-results-dev-user" data-testid="gamebus-user-diagnostic">
      <h3 className="chef-results-dev-user__title">GameBus debug</h3>

      <dl className="chef-results-dev-user__details">
        <div>
          <dt>{frontendDiagnosticId.label}</dt>
          <dd data-testid="debug-frontend-build">{frontendDiagnosticId.value}</dd>
        </div>
      </dl>

      {!embedded ? (
        <p className="chef-results-dev-user__hint">Standalone mode — no GameBus embed.</p>
      ) : !inputCollectionsReady ? (
        <p className="chef-results-dev-user__hint">Waiting for INPUT_COLLECTIONS…</p>
      ) : (
        <>
          <dl className="chef-results-dev-user__details" data-testid="debug-input-collections">
            <div>
              <dt>Input collection keys</dt>
              <dd data-testid="debug-input-collection-keys">
                {inputCollectionsDebug?.inputCollectionKeys.join(', ') || '—'}
              </dd>
            </div>
            <div>
              <dt>Has inputCollectionPari.me</dt>
              <dd data-testid="debug-has-pari-me">
                {yesNo(inputCollectionsDebug?.hasInputCollectionPariMe ?? false)}
              </dd>
            </div>
            <div>
              <dt>Has kitchenGroupInput.activities</dt>
              <dd data-testid="debug-has-kitchen-activities">
                {yesNo(inputCollectionsDebug?.hasKitchenGroupInputActivities ?? false)}
              </dd>
            </div>
            <div>
              <dt>Raw group activities shape</dt>
              <dd data-testid="debug-raw-activities-shape">
                {inputCollectionsDebug?.rawActivitiesShape ?? '—'}
              </dd>
            </div>
            <div>
              <dt>Raw activity count</dt>
              <dd data-testid="debug-raw-activity-count">
                {inputCollectionsDebug?.rawActivityCount ?? 0}
              </dd>
            </div>
            <div>
              <dt>Newest group activity received</dt>
              <dd data-testid="debug-newest-group-activity-created-at">
                {inputCollectionsDebug?.newestGroupActivityCreatedAt || '—'}
              </dd>
            </div>
          </dl>

          {templateReferenceLines.length > 0 ? (
            <div data-testid="debug-template-reference-counts">
              <h4 className="chef-results-dev-user__subtitle">Activity template references</h4>
              <ul>
                {templateReferenceLines.map(([reference, count]) => (
                  <li key={reference} data-testid={`debug-template-count-${reference}`}>
                    {reference}: {count}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {inputCollectionsDebug?.newestWasteMeasurement ? (
            <div data-testid="debug-newest-waste-measurement">
              <h4 className="chef-results-dev-user__subtitle">Newest raw wasteMeasurement</h4>
              <dl className="chef-results-dev-user__details">
                <div>
                  <dt>Activity id</dt>
                  <dd data-testid="debug-waste-activity-id">
                    {inputCollectionsDebug.newestWasteMeasurement.activityId || '—'}
                  </dd>
                </div>
                <div>
                  <dt>Actor id</dt>
                  <dd data-testid="debug-waste-actor-id">
                    {inputCollectionsDebug.newestWasteMeasurement.actorId || '—'}
                  </dd>
                </div>
                <div>
                  <dt>Actor name</dt>
                  <dd data-testid="debug-waste-actor-name">
                    {inputCollectionsDebug.newestWasteMeasurement.actorName || '—'}
                  </dd>
                </div>
                <div>
                  <dt>createdAt</dt>
                  <dd data-testid="debug-waste-created-at">
                    {inputCollectionsDebug.newestWasteMeasurement.createdAt || '—'}
                  </dd>
                </div>
                <div>
                  <dt>Property count</dt>
                  <dd data-testid="debug-waste-property-count">
                    {inputCollectionsDebug.newestWasteMeasurement.propertyCount}
                  </dd>
                </div>
              </dl>
              <p className="chef-results-dev-user__hint">Property template references</p>
              <ul data-testid="debug-waste-property-refs">
                {inputCollectionsDebug.newestWasteMeasurement.propertyRefs.map((ref) => (
                  <li key={ref}>{ref}</li>
                ))}
              </ul>
              <p className="chef-results-dev-user__hint">Property values</p>
              <ul data-testid="debug-waste-property-values">
                {inputCollectionsDebug.newestWasteMeasurement.propertyEntries.map((entry) => (
                  <li key={entry.reference}>
                    {entry.reference} = {entry.displayValue}
                  </li>
                ))}
              </ul>
              <p className="chef-results-dev-user__hint">Missing from newest raw wasteMeasurement</p>
              <p data-testid="debug-waste-missing-required">
                {inputCollectionsDebug.newestWasteMeasurement.missingRequiredRefs.length === 0
                  ? 'none'
                  : inputCollectionsDebug.newestWasteMeasurement.missingRequiredRefs.join(', ')}
              </p>
            </div>
          ) : null}

          {inputCollectionsDebug && inputCollectionsDebug.newestChefForecastsByActor.length > 0 ? (
            <div data-testid="debug-newest-chef-forecasts">
              <h4 className="chef-results-dev-user__subtitle">Newest chefForecast per actor</h4>
              <ul>
                {inputCollectionsDebug.newestChefForecastsByActor.map((forecast) => (
                  <li
                    key={forecast.actorId ?? forecast.activityId ?? forecast.actorName ?? 'unknown'}
                    data-testid={`debug-chef-forecast-${forecast.actorId ?? 'unknown'}`}
                  >
                    {forecast.actorName || '—'} ({forecast.actorId || '—'}) — activity{' '}
                    {forecast.activityId || '—'} — targetDate {forecast.targetDate || '—'} — createdAt{' '}
                    {forecast.createdAt || '—'} — submittedAt {forecast.submittedAt || '—'}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <dl className="chef-results-dev-user__details" data-testid="debug-authenticated-user">
            <div>
              <dt>Identity source</dt>
              <dd data-testid="debug-identity-source">inputCollectionPari.me</dd>
            </div>
            <div>
              <dt>Authenticated user name</dt>
              <dd data-testid="gamebus-user-name">{user?.name || '—'}</dd>
            </div>
            <div>
              <dt>Authenticated user id</dt>
              <dd data-testid="gamebus-user-id">{user?.id || '—'}</dd>
            </div>
          </dl>
        </>
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
        Read-only diagnostics for INPUT_COLLECTIONS delivered to the iframe. Participant results
        still use group kitchen activities when embedded.
      </p>
    </div>
  );
}
