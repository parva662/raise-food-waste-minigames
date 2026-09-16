import { GameStatusHeader } from './components/GameStatusHeader';
import { MealSection } from './components/MealSection';
import { RegularLunchPanel } from './components/RegularLunchPanel';
import { SoupLunchPanel } from './components/SoupLunchPanel';
import { SelectionPanel } from './components/SelectionPanel';
import { SubmissionMessage } from './components/SubmissionMessage';
import { MenuStatusBanner } from './components/MenuStatusBanner';
import { ActionButtons } from './components/ActionButtons';
import { useLunchSelection } from './hooks/useLunchSelection';
import './styles.css';

function App() {
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
    activateMealChoice,
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

  const mealChoice = draft.mealChoice;
  const anotherSectionActive = mealChoice !== null;

  const regularActive = mealChoice === 'regular';
  const soupActive = mealChoice === 'soup';
  const noLunchActive = mealChoice === 'no_lunch';
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
                  sectionId="regular-lunch"
                  title="Regular lunch"
                  description="Choose the main dish, the vegetarian dish, or both."
                  active={regularActive}
                  muted={anotherSectionActive && !regularActive}
                  onActivate={() => activateMealChoice('regular')}
                  activateDisabled={!menuInteractive}
                >
                  <RegularLunchPanel
                    main={mealSlots.main}
                    vegetarian={mealSlots.vegetarian}
                    mainQuantity={draft.mainQuantity}
                    vegetarianQuantity={draft.vegetarianQuantity}
                    sectionActive={regularActive}
                    menuInteractive={menuInteractive}
                    onActivateSection={() => activateMealChoice('regular')}
                    onAdjustMain={(delta) => adjustPortion('main', delta)}
                    onAdjustVegetarian={(delta) => adjustPortion('vegetarian', delta)}
                  />
                </MealSection>

                <MealSection
                  sectionId="soup-lunch"
                  title="Soup lunch"
                  description="Choose your soup and dessert portions."
                  active={soupActive}
                  muted={anotherSectionActive && !soupActive}
                  onActivate={() => activateMealChoice('soup')}
                  activateDisabled={!menuInteractive}
                >
                  <SoupLunchPanel
                    soup={mealSlots.soup}
                    dessert={mealSlots.dessert}
                    soupQuantity={draft.soupQuantity}
                    dessertQuantity={draft.dessertQuantity}
                    sectionActive={soupActive}
                    menuInteractive={menuInteractive}
                    onActivateSection={() => activateMealChoice('soup')}
                    onAdjustSoup={(delta) => adjustPortion('soup', delta)}
                    onAdjustDessert={(delta) => adjustPortion('dessert', delta)}
                  />
                </MealSection>

                <MealSection
                  sectionId="no-lunch"
                  title="No lunch"
                  description="You will not eat at the canteen for the next service."
                  active={noLunchActive}
                  muted={anotherSectionActive && !noLunchActive}
                  onActivate={() => activateMealChoice('no_lunch')}
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

export default App;
