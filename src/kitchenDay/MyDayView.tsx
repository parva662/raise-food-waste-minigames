import { discardedWasteGrams } from './trim/derived';
import { INGREDIENT_CATEGORY_LABELS } from './trim/categories';
import { useKitchenDaySession } from './KitchenDaySessionContext';

export function MyDayView() {
  const { session, trimEntries, rescueEntries, portionEntries, findRescueByIngredientId } =
    useKitchenDaySession();

  return (
    <section className="kd-card" data-testid="kitchen-day-overview">
      <h2 className="kd-card__title">My day</h2>
      <p className="kd-card__copy">Read-only record of this kitchen session. Submitted measurements cannot be edited here.</p>
      <dl className="kd-meta" data-testid="kitchen-day-session-meta">
        <div>
          <dt>Session date</dt>
          <dd>{session.sessionDate}</dd>
        </div>
        <div>
          <dt>Session id</dt>
          <dd>{session.sessionId}</dd>
        </div>
      </dl>

      <h3 className="kd-subtitle">Ingredient preparation</h3>
      {trimEntries.length === 0 ? (
        <p className="kd-helper">No preparation entries yet.</p>
      ) : (
        <ul className="kd-list" data-testid="kitchen-day-trim-list">
          {trimEntries.map((entry) => {
            const rescue = findRescueByIngredientId(entry.ingredientId);
            return (
              <li key={entry.ingredientId} data-testid={`kitchen-day-trim-${entry.ingredientId}`}>
                <strong>{entry.ingredientName}</strong>
                <span>
                  {INGREDIENT_CATEGORY_LABELS[entry.ingredientCategory]} · {entry.actualWasteGrams} g waste
                </span>
                {rescue ? (
                  <span data-testid={`kitchen-day-rescue-${entry.ingredientId}`}>
                    Reuse {rescue.reusableWasteGrams} g → {rescue.reuseDestination}. Discarded{' '}
                    {discardedWasteGrams(entry.actualWasteGrams, rescue.reusableWasteGrams)} g
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <h3 className="kd-subtitle">Portion Precision</h3>
      {portionEntries.length === 0 ? (
        <p className="kd-helper">No recipes recorded yet.</p>
      ) : (
        <ul className="kd-list" data-testid="kitchen-day-portion-list">
          {portionEntries.map((entry) => (
            <li key={`${entry.recipeId}-${entry.submittedAt}`} data-testid={`kitchen-day-portion-${entry.recipeId}`}>
              <strong>{entry.recipeName}</strong>
              <span>Final weight {entry.finalRecipeWeightGrams} g</span>
            </li>
          ))}
        </ul>
      )}

      <p className="kd-helper" hidden={rescueEntries.length === 0}>
        {rescueEntries.length} reuse suggestion{rescueEntries.length === 1 ? '' : 's'} recorded.
      </p>
    </section>
  );
}
