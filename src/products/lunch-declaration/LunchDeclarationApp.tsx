import { GameStatusHeader } from '@/products/lunch-declaration/components/GameStatusHeader';
import { MealSection } from '@/products/lunch-declaration/components/MealSection';
import { RegularLunchPanel } from '@/products/lunch-declaration/components/RegularLunchPanel';
import { SoupDessertPackagePanel } from '@/products/lunch-declaration/components/SoupDessertPackagePanel';
import { SelectionPanel } from '@/products/lunch-declaration/components/SelectionPanel';
import { SubmissionMessage } from '@/products/lunch-declaration/components/SubmissionMessage';
import { MenuStatusBanner } from '@/shared/ui/MenuStatusBanner';
import { ActionButtons } from '@/products/lunch-declaration/components/ActionButtons';
import { useLunchSelection } from '@/products/lunch-declaration/useLunchSelection';

function LunchDeclarationApp() {
  const {
    state,
    draft,
    summaryLines,
    hasSavedDeclaration,
    isSubmitDisabled,
    isReviewDisabled,
    initialized,
    lunchDate,
    calendarUnavailable,
    menuAvailability,
    mealSlots,
    submissionWindow,
    menuInteractive,
    uiStep,
    submitStatus,
    submitError,
    activateLunchOption,
    adjustPortion,
    resetDraft,
    enterReview,
    exitReview,
    submit,
    clearSuccess,
    now,
  } = useLunchSelection();

  if (!initialized) {
    return null;
  }

  const lunchOption = draft.lunchOption ?? null;
  const anotherSectionActive = lunchOption !== null;

  const classicActive = lunchOption === 'classic';
  const vegetarianActive = lunchOption === 'vegetarian';
  const soupActive = lunchOption === 'soup';
  const noLunchActive = lunchOption === 'no_lunch';
  const showEditor = uiStep === 'edit' && !hasSavedDeclaration;

  return (
    <div className="app">
      <GameStatusHeader
        submissionWindow={submissionWindow}
        now={now}
        lunchDate={lunchDate}
      />

      <main className="app-main app-main--compact">
        {calendarUnavailable && (
          <MenuStatusBanner
            message="Lunch declaration is unavailable right now. We couldn't find an upcoming lunch service. Please check again later."
          />
        )}
        {!calendarUnavailable && lunchDate && menuAvailability.status === 'closed' && (
          <MenuStatusBanner
            message="The canteen is closed on this service date."
            reason={menuAvailability.reason}
          />
        )}
        {!calendarUnavailable && lunchDate && menuAvailability.status === 'unavailable' && (
          <MenuStatusBanner message="Menu data for this service could not be loaded. The service date is unchanged — please try again later." />
        )}

        <div className="app-layout">
          <div className="menu-column">
            {showEditor && menuAvailability.status === 'available' && mealSlots && (
              <div className="meal-sections">
                <MealSection
                  sectionId="classic-dish"
                  title="Classic dish"
                  description="Choose only the classic main dish."
                  active={classicActive}
                  muted={anotherSectionActive && !classicActive}
                  onActivate={() => activateLunchOption('classic')}
                  activateDisabled={!menuInteractive}
                >
                  <RegularLunchPanel
                    item={mealSlots.main}
                    categoryLabel="Classic dish"
                    quantity={draft.mainQuantity}
                    sectionActive={classicActive}
                    menuInteractive={menuInteractive}
                    onActivateSection={() => activateLunchOption('classic')}
                    onAdjust={(delta) => adjustPortion('main', delta)}
                    ariaLabel="Classic dish"
                  />
                </MealSection>

                <MealSection
                  sectionId="vegetarian-dish"
                  title="Vegetarian dish"
                  description="Choose only the vegetarian dish."
                  active={vegetarianActive}
                  muted={anotherSectionActive && !vegetarianActive}
                  onActivate={() => activateLunchOption('vegetarian')}
                  activateDisabled={!menuInteractive}
                >
                  <RegularLunchPanel
                    item={mealSlots.vegetarian}
                    categoryLabel="Vegetarian dish"
                    quantity={draft.vegetarianQuantity}
                    sectionActive={vegetarianActive}
                    menuInteractive={menuInteractive}
                    onActivateSection={() => activateLunchOption('vegetarian')}
                    onAdjust={(delta) => adjustPortion('vegetarian', delta)}
                    ariaLabel="Vegetarian dish"
                  />
                </MealSection>

                <MealSection
                  sectionId="soup-dessert-package"
                  title="Soup + Dessert package"
                  description="Soup and dessert are always taken together. Adjust one package quantity."
                  active={soupActive}
                  muted={anotherSectionActive && !soupActive}
                  onActivate={() => activateLunchOption('soup')}
                  activateDisabled={!menuInteractive}
                >
                  <SoupDessertPackagePanel
                    soup={mealSlots.soup}
                    dessert={mealSlots.dessert}
                    packageQuantity={draft.soupQuantity}
                    sectionActive={soupActive}
                    menuInteractive={menuInteractive}
                    onActivateSection={() => activateLunchOption('soup')}
                    onAdjustPackage={(delta) => adjustPortion('soup_dessert', delta)}
                  />
                </MealSection>

                <MealSection
                  sectionId="no-lunch"
                  title="No lunch"
                  description="You will not eat at the canteen for the next service."
                  active={noLunchActive}
                  muted={anotherSectionActive && !noLunchActive}
                  onActivate={() => activateLunchOption('no_lunch')}
                  activateDisabled={!menuInteractive}
                  fullSectionActivate
                />
              </div>
            )}
          </div>

          <div className="selection-column">
            <SelectionPanel
              summaryLines={summaryLines}
              hasSavedDeclaration={hasSavedDeclaration}
              updatedAt={state.savedSnapshot?.updatedAt ?? null}
              lunchDate={lunchDate}
              uiStep={uiStep}
              submitStatus={submitStatus}
              submitError={submitError}
              isReviewDisabled={isReviewDisabled}
              isConfirmDisabled={isSubmitDisabled}
              submissionWindow={submissionWindow}
              menuInteractive={menuInteractive}
              onReset={resetDraft}
              onEnterReview={enterReview}
              onExitReview={exitReview}
              onSubmit={submit}
              showActions
            />
          </div>
        </div>
      </main>

      <SubmissionMessage message={state.successMessage} onDismiss={clearSuccess} />

      {menuInteractive && uiStep === 'edit' && (
        <div className="mobile-action-bar" aria-label="Actions">
          <ActionButtons
            showReset
            onReset={resetDraft}
            onPrimary={enterReview}
            primaryLabel="Review declaration"
            primaryDisabled={isReviewDisabled}
            variant="sticky"
          />
        </div>
      )}
    </div>
  );
}

export default LunchDeclarationApp;
