import { useEffect, useMemo, useState } from 'react';
import { discardedWasteGrams } from '@/products/kitchen-skills-challenge/domain/trim/derived';
import { formatGrams } from '@/products/kitchen-skills-challenge/format';
import { useReadyKitchenSkillsSession } from '@/products/kitchen-skills-challenge/domain/session/KitchenSkillsSessionContext';
import { KitchenSkillsMassInput } from '@/products/kitchen-skills-challenge/surfaces/shared/KitchenSkillsMassInput';
import { RescueSummaryList } from '@/products/kitchen-skills-challenge/surfaces/shared/AttemptModuleLists';
import {
  canSaveRescueSuggestion,
  parseReusableWasteGrams,
  parseReuseDestination,
} from '@/products/kitchen-skills-challenge/domain/reuse/validation';
import { normalizeRecipeId } from '@/products/kitchen-skills-challenge/domain/session/ingredientUniqueness';

export function KitchenSkillsReuseView() {
  const {
    session,
    activeRecipeId,
    trimEntries,
    rescueEntries,
    commitRescueEntry,
    setReuseInProgress,
    taskProgress,
    closedElsewhere,
  } = useReadyKitchenSkillsSession();
  const completedTrim = useMemo(
    () => trimEntries.filter((entry) => entry.actualWasteGrams > 0),
    [trimEntries],
  );
  const openIngredientIds = taskProgress.remainingRescueIngredientIds;
  const openTrim = completedTrim.filter((entry) => openIngredientIds.includes(entry.ingredientId));
  const [ingredientId, setIngredientId] = useState(openTrim[0]?.ingredientId ?? '');
  const [reusableRaw, setReusableRaw] = useState('');
  const [destination, setDestination] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!ingredientId || !openIngredientIds.includes(ingredientId)) {
      setIngredientId(openIngredientIds[0] ?? '');
    }
  }, [ingredientId, openIngredientIds]);

  const trim = completedTrim.find((entry) => entry.ingredientId === ingredientId);
  const reusable = trim
    ? parseReusableWasteGrams(reusableRaw, trim.actualWasteGrams)
    : { ok: false as const, issue: 'invalid' as const };
  const dest = parseReuseDestination(destination);
  const discarded =
    trim && reusable.ok ? discardedWasteGrams(trim.actualWasteGrams, reusable.value) : null;
  const drafting = reusableRaw !== '' || destination.trim() !== '';

  useEffect(() => {
    setReuseInProgress(drafting);
    return () => setReuseInProgress(false);
  }, [drafting, setReuseInProgress]);

  function save() {
    if (!trim || !reusable.ok || !dest.ok) return;
    const recipeId = normalizeRecipeId(trim.recipeId ?? activeRecipeId);
    if (!recipeId) return;
    const result = commitRescueEntry({
      sessionId: session.sessionId,
      sessionDate: session.sessionDate,
      recipeId,
      ingredientId: trim.ingredientId,
      reusableWasteGrams: reusable.value,
      reuseDestination: dest.value,
      submittedAt: new Date().toISOString(),
      source: 'local',
    });
    if (!result.ok) {
      setSubmitError(
        result.reason === 'attempt_closed'
          ? 'This challenge was finished or restarted in another window.'
          : result.reason === 'duplicate_rescue'
            ? 'Rescue & Reuse is already recorded for this ingredient.'
            : 'This reuse entry could not be saved.',
      );
      return;
    }
    setSubmitError(null);
    setReusableRaw('');
    setDestination('');
  }

  if (completedTrim.length === 0) {
    return (
      <section className="kitchen-day-card" data-testid="kitchen-day-rescue">
        <h2 className="kitchen-day-card__title">Rescue &amp; Reuse</h2>
        <p className="kitchen-day-card__copy" data-testid="kitchen-day-rescue-empty">
          Record an ingredient preparation entry with actual waste first.
        </p>
      </section>
    );
  }

  return (
    <section className="kitchen-day-card" data-testid="kitchen-day-rescue">
      <h2 className="kitchen-day-card__title">Rescue &amp; Reuse</h2>

      {openTrim.length === 0 ? (
        <p className="kitchen-day-success" data-testid="kitchen-day-rescue-saved">
          Rescue &amp; Reuse is recorded for every trimmed ingredient.
        </p>
      ) : (
        <>
          <div className="kitchen-day-reuse-meta">
            <label className="kitchen-day-field kitchen-day-field--compact">
              <span>Ingredient</span>
              <select
                className="kitchen-day-input"
                data-testid="kitchen-day-rescue-ingredient"
                value={ingredientId}
                onChange={(event) => {
                  setIngredientId(event.target.value);
                  setReusableRaw('');
                  setDestination('');
                  setSubmitError(null);
                }}
              >
                {openTrim.map((entry) => (
                  <option key={`${entry.recipeId ?? 'legacy'}:${entry.ingredientId}`} value={entry.ingredientId}>
                    {entry.ingredientName}
                  </option>
                ))}
              </select>
            </label>
            {trim ? (
              <p className="kitchen-day-reuse-waste" data-testid="kitchen-day-rescue-actual-waste">
                Actual waste {formatGrams(trim.actualWasteGrams)}
              </p>
            ) : null}
          </div>

          <label className="kitchen-day-field kitchen-day-field--compact">
            <span>Reusable amount</span>
            <KitchenSkillsMassInput
              testId="kitchen-day-reusable-waste"
              unitGroupLabel="Reusable amount unit"
              value={reusableRaw}
              onChange={setReusableRaw}
            />
          </label>
          {!reusable.ok && reusableRaw !== '' ? (
            <p className="kitchen-day-error" data-testid="kitchen-day-reusable-error">
              Reusable amount must be 0 g up to the actual waste.
            </p>
          ) : null}
          {discarded != null ? (
            <p className="kitchen-day-reuse-discarded" data-testid="kitchen-day-discarded-waste">
              <span>Discarded</span> <strong>{formatGrams(discarded)}</strong>
            </p>
          ) : null}

          <label className="kitchen-day-field kitchen-day-field--compact">
            <span>Preparation method and reuse destination</span>
            <textarea
              className="kitchen-day-input kitchen-day-input--destination"
              data-testid="kitchen-day-reuse-destination"
              aria-describedby="kitchen-day-reuse-destination-hint"
              placeholder="Wash the peel, dry it, then use it in cake."
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              rows={3}
            />
            <small id="kitchen-day-reuse-destination-hint" className="kitchen-day-field__hint">
              Example: Wash the peel, dry it, then use it in cake.
            </small>
          </label>

          {submitError ? (
            <p className="kitchen-day-error" data-testid="kitchen-day-rescue-error">
              {submitError}
            </p>
          ) : null}

          <div className="kitchen-day-form-actions kitchen-day-form-actions--sticky">
            <button
              type="button"
              className="kitchen-day-button kitchen-day-button--primary"
              data-testid="kitchen-day-save-rescue"
              disabled={
                closedElsewhere ||
                !trim ||
                !canSaveRescueSuggestion({
                  reusableRaw,
                  destinationRaw: destination,
                  actualWasteGrams: trim.actualWasteGrams,
                })
              }
              onClick={save}
            >
              Save reuse
            </button>
          </div>
        </>
      )}

      {rescueEntries.length > 0 ? (
        <section className="kitchen-day-trim-saved" aria-labelledby="kitchen-day-rescue-saved-title">
          <h3 id="kitchen-day-rescue-saved-title" className="kitchen-day-trim-saved__title">
            Saved reuse
          </h3>
          <RescueSummaryList entries={rescueEntries} trimEntries={trimEntries} testIdPrefix="kitchen-day-rescue" />
        </section>
      ) : null}
    </section>
  );
}
