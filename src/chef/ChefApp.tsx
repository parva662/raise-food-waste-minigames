import { MenuStatusBanner } from '../components/MenuStatusBanner';
import { ChefForecastRow } from './components/ChefForecastRow';
import { ChefForecastHeader } from './components/ChefForecastHeader';
import { ChefForecastSummary } from './components/ChefForecastSummary';
import { ChefExpectedCustomersField } from './components/ChefExpectedCustomersField';
import { ChefAdditionalContext } from './components/ChefAdditionalContext';
import { ChefSubmitPanel } from './components/ChefSubmitPanel';
import { ChefZeroConfirmDialog } from './components/ChefZeroConfirmDialog';
import { useChefForecast } from './useChefForecast';
import { isGameBusEmbed, useGameBusEmbed } from '../gamebus';
import type { Clock } from '../services/submissionWindow';

interface ChefAppProps {
  /** Optional clock override for tests. */
  clock?: Clock;
}

export function ChefApp({ clock }: ChefAppProps = {}) {
  const embedded = isGameBusEmbed();
  const { taskReady } = useGameBusEmbed();

  const {
    state,
    draft,
    initialized,
    serviceDate,
    menuAvailability,
    mealSlots,
    submissionWindow,
    formInteractive,
    formComplete,
    isSubmitDisabled,
    hasSubmitted,
    calendarError,
    setExpectedCustomers,
    setMainQuantity,
    setVegetarianQuantity,
    setSoupQuantity,
    setDessertQuantity,
    setFieldError,
    setCustomersError,
    setConfidence,
    setNotes,
    setNotesError,
    submit,
    confirmZeroSubmit,
    cancelZeroSubmit,
    now,
  } = useChefForecast(clock);

  if (!initialized) {
    return null;
  }

  const hasValidationErrors =
    state.customersError !== null ||
    state.notesError !== null ||
    Object.values(state.fieldErrors).some((e) => e !== null && e !== undefined);

  const submissionOpen = submissionWindow.phase !== 'closed';

  return (
    <div className="app app--chef">
      <ChefForecastHeader
        serviceDate={serviceDate}
        submissionWindow={submissionWindow}
        now={now}
      />

      <main className="app-main chef-main">
        <div className="chef-shell">
          {calendarError && (
            <MenuStatusBanner
              message="Could not resolve the next service date."
              reason={calendarError}
            />
          )}
          {menuAvailability.status === 'closed' && (
            <MenuStatusBanner
              message="The canteen is closed on this date."
              reason={menuAvailability.reason}
            />
          )}
          {menuAvailability.status === 'unavailable' && (
            <MenuStatusBanner message="Menu not available for this date." />
          )}

          {hasSubmitted && (
            <div className="chef-submitted-banner" role="status">
              Forecast submitted. No further changes allowed for this service day.
            </div>
          )}

          {state.submitError && (
            <div className="chef-error-banner" role="alert">
              {state.submitError}
            </div>
          )}

          {menuAvailability.status === 'available' && mealSlots && (
            <div className="chef-layout">
              <div className="chef-form-column">
                <div className="chef-forecast-list" aria-label="Menu forecast quantities">
                  <ChefExpectedCustomersField
                    value={draft.expectedCustomers}
                    disabled={!formInteractive}
                    error={state.customersError}
                    onChange={setExpectedCustomers}
                    onValidationError={setCustomersError}
                  />
                  <ChefForecastRow
                    item={mealSlots.main}
                    categoryLabel="Main"
                    quantity={draft.mainQuantity}
                    disabled={!formInteractive}
                    error={state.fieldErrors.main ?? null}
                    onQuantityChange={setMainQuantity}
                    onValidationError={(error) => setFieldError('main', error)}
                  />
                  <ChefForecastRow
                    item={mealSlots.vegetarian}
                    categoryLabel="Vegetarian"
                    quantity={draft.vegetarianQuantity}
                    disabled={!formInteractive}
                    error={state.fieldErrors.vegetarian ?? null}
                    onQuantityChange={setVegetarianQuantity}
                    onValidationError={(error) => setFieldError('vegetarian', error)}
                  />
                  <ChefForecastRow
                    item={mealSlots.soup}
                    categoryLabel="Soup"
                    quantity={draft.soupQuantity}
                    disabled={!formInteractive}
                    error={state.fieldErrors.soup ?? null}
                    onQuantityChange={setSoupQuantity}
                    onValidationError={(error) => setFieldError('soup', error)}
                  />
                  <ChefForecastRow
                    item={mealSlots.dessert}
                    categoryLabel="Dessert"
                    quantity={draft.dessertQuantity}
                    disabled={!formInteractive}
                    error={state.fieldErrors.dessert ?? null}
                    onQuantityChange={setDessertQuantity}
                    onValidationError={(error) => setFieldError('dessert', error)}
                  />
                </div>
                <p id="chef-customers-support" className="chef-customers-field__support">
                  Enter the expected customer count and the quantity you plan to prepare for each
                  menu item. These values are independent and do not need to match.
                </p>
              </div>

              <div className="chef-review-column">
                <ChefForecastSummary
                  expectedCustomers={draft.expectedCustomers}
                  mainQuantity={draft.mainQuantity}
                  vegetarianQuantity={draft.vegetarianQuantity}
                  soupQuantity={draft.soupQuantity}
                  dessertQuantity={draft.dessertQuantity}
                />

                <ChefAdditionalContext
                  confidence={draft.confidence}
                  notes={draft.notes}
                  notesError={state.notesError}
                  disabled={!formInteractive}
                  onConfidenceChange={setConfidence}
                  onNotesChange={setNotes}
                  onNotesError={setNotesError}
                />

                <ChefSubmitPanel
                  disabled={isSubmitDisabled}
                  formComplete={formComplete}
                  hasValidationErrors={hasValidationErrors}
                  formInteractive={formInteractive}
                  hasSubmitted={hasSubmitted}
                  submissionOpen={submissionOpen}
                  waitingForTask={embedded && !taskReady}
                  onSubmit={submit}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      <ChefZeroConfirmDialog
        open={state.zeroConfirmOpen}
        onConfirm={confirmZeroSubmit}
        onCancel={cancelZeroSubmit}
      />
    </div>
  );
}
