import { useMemo, useState } from 'react';
import { discardedWasteGrams } from '../trim/derived';
import { useReadyKitchenDaySession } from '../KitchenDaySessionContext';
import { canSaveRescueSuggestion, parseReusableWasteGrams, parseReuseDestination } from './validation';

export function KitchenDayRescueView() {
  const { session, trimEntries, findRescueByIngredientId, commitRescueEntry } =
    useReadyKitchenDaySession();
  const completedTrim = trimEntries;
  const [ingredientId, setIngredientId] = useState(completedTrim[0]?.ingredientId ?? '');
  const [reusableRaw, setReusableRaw] = useState('');
  const [destination, setDestination] = useState('');
  const [saved, setSaved] = useState(false);

  const trim = useMemo(
    () => completedTrim.find((entry) => entry.ingredientId === ingredientId),
    [completedTrim, ingredientId],
  );
  const existing = ingredientId ? findRescueByIngredientId(ingredientId) : undefined;
  const reusable = trim ? parseReusableWasteGrams(reusableRaw, trim.actualWasteGrams) : { ok: false as const, issue: 'invalid' as const };
  const dest = parseReuseDestination(destination);
  const discarded =
    trim && reusable.ok ? discardedWasteGrams(trim.actualWasteGrams, reusable.value) : null;

  function save() {
    if (!trim || !reusable.ok || !dest.ok || existing) return;
    const entry = {
      sessionId: session.sessionId,
      sessionDate: session.sessionDate,
      ingredientId: trim.ingredientId,
      reusableWasteGrams: reusable.value,
      reuseDestination: dest.value,
      submittedAt: new Date().toISOString(),
    };
    const result = commitRescueEntry({ ...entry, source: 'local' });
    if (!result.ok) return;
    if (result.mode === 'local') {
      setSaved(true);
    }
  }

  if (completedTrim.length === 0) {
    return (
      <section className="kd-card kd-card--rescue" data-testid="kitchen-day-rescue">
        <h2 className="kd-card__title">Reuse</h2>
        <p data-testid="kitchen-day-rescue-empty">
          Record an ingredient preparation entry with actual waste first. Reuse is not a separate inventory.
        </p>
        <a className="kd-button kd-button--primary" href="#/kitchen-day">
          Go to Trim Smart
        </a>
      </section>
    );
  }

  return (
    <section className="kd-card kd-card--rescue" data-testid="kitchen-day-rescue">
      <h2 className="kd-card__title">Reuse suggestion</h2>
      <label className="kd-field">
        <span>Ingredient</span>
        <select
          className="kd-input"
          data-testid="kitchen-day-rescue-ingredient"
          value={ingredientId}
          onChange={(event) => {
            setIngredientId(event.target.value);
            setReusableRaw('');
            setDestination('');
            setSaved(false);
          }}
        >
          {completedTrim.map((entry) => (
            <option key={entry.ingredientId} value={entry.ingredientId}>
              {entry.ingredientName}
            </option>
          ))}
        </select>
      </label>

      {trim ? (
        <p data-testid="kitchen-day-rescue-actual-waste">
          Actual waste from preparation: {trim.actualWasteGrams} g
        </p>
      ) : null}

      <label className="kd-field">
        <span>How much of that waste can be reused?</span>
        <div className="kd-input-row">
          <input
            className="kd-input kd-input--numeric"
            inputMode="decimal"
            data-testid="kitchen-day-reusable-waste"
            value={reusableRaw}
            onChange={(event) => setReusableRaw(event.target.value)}
          />
          <span className="kd-unit">g</span>
        </div>
      </label>
      {!reusable.ok && reusableRaw !== '' ? (
        <p className="kd-error" data-testid="kitchen-day-reusable-error">
          Reusable amount must be 0 g up to the actual waste.
        </p>
      ) : null}

      <label className="kd-field">
        <span>Where should it be used?</span>
        <textarea
          className="kd-input"
          data-testid="kitchen-day-reuse-destination"
          value={destination}
          onChange={(event) => setDestination(event.target.value)}
          rows={3}
        />
      </label>

      {discarded != null ? (
        <p data-testid="kitchen-day-discarded-waste">Discarded waste {discarded} g</p>
      ) : null}

      {saved || existing ? (
        <p data-testid="kitchen-day-rescue-saved">Reuse suggestion saved for this ingredient.</p>
      ) : (
        <button
          type="button"
          className="kd-button kd-button--primary"
          data-testid="kitchen-day-save-rescue"
          disabled={
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
      )}
    </section>
  );
}
