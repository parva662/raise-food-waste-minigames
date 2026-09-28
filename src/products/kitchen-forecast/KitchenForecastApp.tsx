import { MenuStatusBanner } from '@/shared/ui/MenuStatusBanner';
import { formatDisplayDate } from '@/shared/time/dates';
import { ChefForecastRow } from '@/products/kitchen-forecast/components/ChefForecastRow';
import { ChefForecastHeader } from '@/products/kitchen-forecast/components/ChefForecastHeader';
import { ChefForecastSummary } from '@/products/kitchen-forecast/components/ChefForecastSummary';
import { ChefExpectedCustomersField } from '@/products/kitchen-forecast/components/ChefExpectedCustomersField';
import { ChefAdditionalContext } from '@/products/kitchen-forecast/components/ChefAdditionalContext';
import { ChefSubmitPanel } from '@/products/kitchen-forecast/components/ChefSubmitPanel';
import { ChefZeroConfirmDialog } from '@/products/kitchen-forecast/components/ChefZeroConfirmDialog';
import { useChefForecast } from '@/products/kitchen-forecast/useChefForecast';
import { isGameBusEmbed, useGameBusEmbed } from '@/platform/gamebus';
import type { Clock } from '@/shared/time/clock';

interface ChefAppProps {
  /** Optional clock override for tests. */
  clock?: Clock;
}

export function KitchenForecastApp({ clock }: ChefAppProps = {}) {
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
              message="Could not resolve the kitchen forecast service date."
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
              Forecast submitted for {formatDisplayDate(serviceDate)}.
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
                    readOnly
                    helperText="Matches soup menu"
                    error={null}
                    onQuantityChange={() => {}}
                    onValidationError={() => {}}
                  />
                </div>
                <p id="chef-customers-support" className="chef-customers-field__support">
                  Enter expected customers and planned portions. Dessert is included with the soup
                  menu and follows the soup quantity automatically.
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

export { KitchenForecastApp as ChefApp };
