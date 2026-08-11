import { MenuStatusBanner } from '../components/MenuStatusBanner';
import { CLOSEOUT_CATEGORY_KEYS } from './types';
import { NO_CLOSEOUT_FORECAST_MESSAGE } from './forecast/gameBusChefForecastTypes';
import { forecastCategoryQuantity } from './forecast/parseGameBusChefForecast';
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
    headChefOptions,
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
    setHeadChefUserId,
    setPreparedQuantity,
    setOverproductionGrams,
    setPreparedError,
    setWasteError,
    finalize,
  } = useServiceCloseout({ clock, serviceDate });

  const chefForecastState = useCloseoutChefForecast(resolvedDate);
  const matchedForecast =
    chefForecastState.status === 'matched' ? chefForecastState.forecast : null;

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
            <ServiceCloseoutSubmittedForecast forecast={chefForecastState.forecast} />
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
                    <label className="closeout-service-row__label" htmlFor="closeout-head-chef">
                      Head chef today
                    </label>
                    <select
                      id="closeout-head-chef"
                      className="closeout-service-row__select"
                      disabled={!formInteractive}
                      value={draft.headChefUserId ?? ''}
                      onChange={(event) => {
                        const value = event.target.value;
                        setHeadChefUserId(value.length > 0 ? value : null);
                      }}
                    >
                      <option value="">Select head chef…</option>
                      {headChefOptions.map((member) => (
                        <option key={member.userId} value={member.userId}>
                          {member.displayName}
                        </option>
                      ))}
                    </select>
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
                      forecastQuantity={
                        matchedForecast ? forecastCategoryQuantity(matchedForecast, key) : undefined
                      }
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
                <ServiceCloseoutSummary draft={draft} finalizedCloseout={finalizedCloseout} />

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
