import { Info } from 'lucide-react';
import { AppHeader } from './components/AppHeader';
import { CategoryLegend } from './components/CategoryLegend';
import { MenuSection } from './components/MenuSection';
import { SelectionPanel } from './components/SelectionPanel';
import { ActionButtons } from './components/ActionButtons';
import { SubmissionMessage } from './components/SubmissionMessage';
import { LateUpdateConfirmDialog } from './components/LateUpdateConfirmDialog';
import { MenuStatusBanner } from './components/MenuStatusBanner';
import { categoryOrder } from './data/menu';
import { useLunchSelection } from './hooks/useLunchSelection';
import './styles.css';

function App() {
  const {
    state,
    selections,
    summary,
    progressPercent,
    hasSavedDeclaration,
    isDirty,
    submitButtonState,
    isSubmitDisabled,
    savedScoring,
    initialized,
    menuAvailability,
    menuItems,
    submissionWindow,
    menuInteractive,
    getQuantity,
    increment,
    decrement,
    removeItem,
    setNoLunch,
    resetDraft,
    submit,
    confirmLateUpdate,
    cancelLateUpdate,
    clearSuccess,
    now,
  } = useLunchSelection();

  if (!initialized) {
    return null;
  }

  const menuDisabled = state.noLunch || !menuInteractive;

  return (
    <div className="app">
      <AppHeader />

      <main className="app-main">
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
            <div className="menu-column__header">
              <h2 className="menu-column__title">Tomorrow&apos;s Menu</h2>
              <CategoryLegend />
            </div>

            {menuAvailability.status === 'available' &&
              categoryOrder.map((category) => (
                <MenuSection
                  key={category.key}
                  title={category.title}
                  category={category.key}
                  items={menuItems.filter((item) => item.category === category.key)}
                  getQuantity={getQuantity}
                  onIncrement={increment}
                  onDecrement={decrement}
                  disabled={menuDisabled}
                />
              ))}

            {menuAvailability.status === 'available' && (
              <div className="info-panel">
                <Info size={18} className="info-panel__icon" aria-hidden="true" />
                <p>
                  Choose any items and quantities. You can combine classic and vegetarian options.
                </p>
              </div>
            )}
          </div>

          <div className="selection-column">
            <SelectionPanel
              selections={selections}
              itemCount={summary.itemCount}
              totalPortions={summary.totalPortions}
              progressPercent={progressPercent}
              noLunch={state.noLunch}
              hasSavedDeclaration={hasSavedDeclaration}
              updatedAt={state.savedSnapshot?.updatedAt ?? null}
              savedScoring={savedScoring}
              submitButtonState={submitButtonState}
              isSubmitDisabled={isSubmitDisabled}
              isDirty={isDirty}
              menuChanged={state.menuChanged}
              submissionWindow={submissionWindow}
              submissionNow={now}
              menuInteractive={menuInteractive}
              onIncrement={increment}
              onDecrement={decrement}
              onRemove={removeItem}
              onNoLunchToggle={() => setNoLunch(!state.noLunch)}
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

      <LateUpdateConfirmDialog
        open={state.showLateConfirm}
        onConfirm={confirmLateUpdate}
        onCancel={cancelLateUpdate}
      />

      <div className="mobile-action-bar" aria-label="Actions">
        <ActionButtons
          onReset={resetDraft}
          onSubmit={submit}
          submitButtonState={submitButtonState}
          isSubmitDisabled={isSubmitDisabled}
          hasSavedDeclaration={hasSavedDeclaration}
          variant="sticky"
        />
      </div>
    </div>
  );
}

export default App;
