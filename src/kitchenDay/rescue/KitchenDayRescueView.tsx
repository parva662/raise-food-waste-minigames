import { useMemo, useState } from 'react';
import { discardedWasteGrams } from '../trim/derived';
import { formatGrams } from '../format';
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
  const reusable = trim
    ? parseReusableWasteGrams(reusableRaw, trim.actualWasteGrams)
    : { ok: false as const, issue: 'invalid' as const };
  const dest = parseReuseDestination(destination);
  const discarded =
    trim && reusable.ok ? discardedWasteGrams(trim.actualWasteGrams, reusable.value) : null;
  const complete = Boolean(saved || existing);

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
      <section className="kitchen-day-card" data-testid="kitchen-day-rescue">
        <h2 className="kitchen-day-card__title">Reuse</h2>
        <p className="kitchen-day-card__copy" data-testid="kitchen-day-rescue-empty">
          Record an ingredient preparation entry with actual waste first.
        </p>
        <a className="kitchen-day-button kitchen-day-button--primary" href="#/kitchen-day">
          Go to Trim Smart
        </a>
      </section>
    );
  }

  return (
    <section className="kitchen-day-card" data-testid="kitchen-day-rescue">
      <h2 className="kitchen-day-card__title">Reuse suggestion</h2>
      <label className="kitchen-day-field">
        <span>Ingredient</span>
        <select
          className="kitchen-day-input"
          data-testid="kitchen-day-rescue-ingredient"
          value={ingredientId}
          onChange={(event) => {
            setIngredientId(event.target.value);
            setReusableRaw('');
            setDestination('');
            setSaved(false);
          }}
          disabled={complete}
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
          Actual waste {formatGrams(trim.actualWasteGrams)}
        </p>
      ) : null}

      {complete && existing ? (
        <div className="kitchen-day-success" data-testid="kitchen-day-rescue-saved">
          <p>Reuse suggestion saved for this ingredient.</p>
          <p>Reusable {formatGrams(existing.reusableWasteGrams)}</p>
          <p>Destination {existing.reuseDestination}</p>
          {trim ? (
            <p data-testid="kitchen-day-discarded-waste">
              Discarded {formatGrams(discardedWasteGrams(trim.actualWasteGrams, existing.reusableWasteGrams))}
            </p>
          ) : null}
        </div>
      ) : (
        <>
          <label className="kitchen-day-field">
            <span>Reusable amount</span>
            <div className="kitchen-day-input-row">
              <input
                className="kitchen-day-input kitchen-day-input--numeric"
                inputMode="decimal"
                data-testid="kitchen-day-reusable-waste"
                value={reusableRaw}
                onChange={(event) => setReusableRaw(event.target.value)}
              />
              <span className="kitchen-day-unit">g</span>
            </div>
          </label>
          {!reusable.ok && reusableRaw !== '' ? (
            <p className="kitchen-day-error" data-testid="kitchen-day-reusable-error">
              Reusable amount must be 0 g up to the actual waste.
            </p>
          ) : null}

          <label className="kitchen-day-field">
            <span>Reuse destination</span>
            <textarea
              className="kitchen-day-input"
              data-testid="kitchen-day-reuse-destination"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              rows={3}
            />
          </label>

          {discarded != null ? (
            <p data-testid="kitchen-day-discarded-waste">Discarded {formatGrams(discarded)}</p>
          ) : null}

          <button
            type="button"
            className="kitchen-day-button kitchen-day-button--primary"
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
        </>
      )}
    </section>
  );
}
