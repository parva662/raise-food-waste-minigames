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
    savedScoring,
    initialized,
    menuAvailability,
    mealSlots,
    submissionWindow,
    menuInteractive,
    activateMealChoice,
    adjustPortion,
    resetDraft,
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

  return (
    <div className="app">
      <GameStatusHeader submissionWindow={submissionWindow} now={now} />

      <main className="app-main app-main--compact">
        {menuAvailability.status === 'closed' && (
          <MenuStatusBanner
            message="The canteen is closed on this date."
            reason={menuAvailability.reason}
          />
        )}
        {menuAvailability.status === 'unavailable' && (
          <MenuStatusBanner message="Menu not available for this date." />
        )}

        <div className="app-layout">
          <div className="menu-column">
            {menuAvailability.status === 'available' && mealSlots && (
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
                  description="You will not eat at the canteen tomorrow."
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
              savedScoring={savedScoring}
              isSubmitDisabled={isSubmitDisabled}
              submissionWindow={submissionWindow}
              menuInteractive={menuInteractive}
              onReset={resetDraft}
              onSubmit={submit}
              showActions
            />
          </div>
        </div>
      </main>

      <SubmissionMessage
        message={state.successMessage}
        pointsMessage={state.successPointsMessage}
        onDismiss={clearSuccess}
      />

      {menuInteractive && (
        <div className="mobile-action-bar" aria-label="Actions">
          <ActionButtons
            onReset={resetDraft}
            onSubmit={submit}
            isSubmitDisabled={isSubmitDisabled}
            variant="sticky"
          />
        </div>
      )}
    </div>
  );
}

export default App;
