import { MenuStatusBanner } from '../components/MenuStatusBanner';
import { getAuthenticatedGameBusUser } from '../gamebus/inputCollections';
import { useGameBusEmbed } from '../gamebus/useGameBusEmbed';
import { CLOSEOUT_CATEGORY_KEYS } from './types';
import { NO_CLOSEOUT_FORECAST_MESSAGE } from './forecast/gameBusChefForecastTypes';
import { buildStaffForecastEntries } from './forecast/formatStaffForecasts';
import { CloseoutIntegerInput } from './components/CloseoutIntegerInput';
import { ServiceCloseoutHeader } from './components/ServiceCloseoutHeader';
import { ServiceCloseoutCategoryRow } from './components/ServiceCloseoutCategoryRow';
import { ServiceCloseoutSummary } from './components/ServiceCloseoutSummary';
import { ServiceCloseoutFinalizePanel } from './components/ServiceCloseoutFinalizePanel';
import { ServiceCloseoutSubmittedForecast } from './components/ServiceCloseoutSubmittedForecast';
import { ServiceCloseoutInputCollectionsDebug } from './components/ServiceCloseoutInputCollectionsDebug';
import { useCloseoutChefForecast } from './useCloseoutChefForecast';
import { useServiceCloseout, type Clock } from './useServiceCloseout';

interface ServiceCloseoutAppProps {
  clock?: Clock;
  serviceDate?: string;
}

export function ServiceCloseoutApp({ clock, serviceDate }: ServiceCloseoutAppProps = {}) {
  const {
    draft,
    serviceDate: resolvedDate,
    menuAvailability,
    mealSlots,
    formComplete,
    hasValidationErrors,
    formInteractive,
    isFinalizeDisabled,
    canFinalizeByPolicy,
    finalizedCloseout,
    finalizeError,
    state,
    setActualCustomers,
    setCustomersError,
    setPreparedQuantity,
    setOverproductionGrams,
    setPreparedError,
    setWasteError,
    finalize,
  } = useServiceCloseout({ clock, serviceDate });

  const { inputCollections } = useGameBusEmbed();
  const authenticatedUser = getAuthenticatedGameBusUser(inputCollections);
  const recordedByName = authenticatedUser?.name ?? null;

  const chefForecastState = useCloseoutChefForecast(resolvedDate);
  const matchedForecasts =
    chefForecastState.status === 'matched' ? chefForecastState.forecasts : [];

  const finalized = state.status === 'finalized';

  return (
    <div className="app app--closeout">
      <ServiceCloseoutHeader serviceDate={resolvedDate} />

      <main className="app-main closeout-main">
        <div className="closeout-shell">
          {menuAvailability.status === 'closed' && (
            <MenuStatusBanner
              message="The canteen is closed on this date."
              reason={menuAvailability.reason}
            />
          )}
          {menuAvailability.status === 'unavailable' && (
            <MenuStatusBanner message="Menu not available for this date." />
          )}

          {finalizeError && (
            <div className="closeout-error-banner" role="alert">
              {finalizeError}
            </div>
          )}

          {chefForecastState.status === 'matched' && (
            <ServiceCloseoutSubmittedForecast
              forecasts={matchedForecasts}
              isSynthetic={chefForecastState.isSynthetic}
            />
          )}

          {chefForecastState.status === 'no_forecast' && (
            <p className="closeout-no-forecast-message" role="status" data-testid="closeout-no-forecast">
              {NO_CLOSEOUT_FORECAST_MESSAGE}
            </p>
          )}

          {menuAvailability.status === 'available' && mealSlots && (
            <div className="closeout-layout">
              <div className="closeout-form-column">
                <section className="closeout-service-fields" aria-label="Service-level figures">
                  <div className="closeout-service-row">
                    <label className="closeout-service-row__label" htmlFor="closeout-actual-customers">
                      Actual customers
                    </label>
                    <div className="closeout-service-row__input-wrap">
                      <CloseoutIntegerInput
                        id="closeout-actual-customers"
                        className="closeout-grid__input"
                        value={draft.actualCustomers}
                        disabled={!formInteractive}
                        error={state.customersError}
                        fieldLabel="Actual customers"
                        mode="quantity"
                        describedBy={
                          state.customersError ? 'closeout-customers-error' : undefined
                        }
                        onChange={setActualCustomers}
                        onValidationError={setCustomersError}
                      />
                      <span className="closeout-grid__unit">customers</span>
                    </div>
                    {state.customersError && (
                      <p id="closeout-customers-error" className="closeout-service-row__error" role="alert">
                        {state.customersError}
                      </p>
                    )}
                  </div>

                  <div className="closeout-service-row">
                    <span className="closeout-service-row__label">Recorded by</span>
                    <p
                      className="closeout-service-row__recorded-by"
                      data-testid="closeout-recorded-by"
                    >
                      {recordedByName ?? '—'}
                    </p>
                  </div>
                </section>

                <div className="closeout-grid" aria-label="Category closeout quantities">
                  <div className="closeout-grid__header" aria-hidden="true">
                    <span>Category / dish</span>
                    <span>Submitted forecast</span>
                    <span>Actual prepared</span>
                    <span>Portion weight</span>
                    <span>Overproduction</span>
                  </div>

                  {CLOSEOUT_CATEGORY_KEYS.map((key) => (
                    <ServiceCloseoutCategoryRow
                      key={key}
                      categoryKey={key}
                      itemName={mealSlots[key].name}
                      itemId={mealSlots[key].id}
                      preparedQuantity={draft[key].preparedQuantity}
                      overproductionGrams={draft[key].overproductionGrams}
                      forecastEntries={buildStaffForecastEntries(matchedForecasts, key)}
                      preparedError={state.categoryErrors[key].prepared}
                      wasteError={state.categoryErrors[key].waste}
                      disabled={!formInteractive}
                      onPreparedChange={(value) => setPreparedQuantity(key, value)}
                      onWasteChange={(value) => setOverproductionGrams(key, value)}
                      onPreparedError={(error) => setPreparedError(key, error)}
                      onWasteError={(error) => setWasteError(key, error)}
                    />
                  ))}
                </div>
              </div>

              <div className="closeout-review-column">
                <ServiceCloseoutSummary
                  draft={draft}
                  finalizedCloseout={finalizedCloseout}
                  recordedByName={recordedByName}
                />

                <ServiceCloseoutFinalizePanel
                  disabled={isFinalizeDisabled}
                  formComplete={formComplete}
                  hasValidationErrors={hasValidationErrors}
                  formInteractive={formInteractive}
                  finalized={finalized}
                  canFinalize={canFinalizeByPolicy}
                  onFinalize={finalize}
                />
              </div>
            </div>
          )}

          {menuAvailability.status !== 'available' && (
            <p className="closeout-unavailable-message" role="status">
              Service closeout cannot be finalized because today&apos;s menu is not available.
            </p>
          )}
        </div>
      </main>
      <ServiceCloseoutInputCollectionsDebug />
    </div>
  );
}
