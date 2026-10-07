import { useEffect, useMemo, useState } from 'react';
import { discardedWasteGrams } from '@/products/kitchen-skills-challenge/domain/trim/derived';
import { formatGrams } from '@/products/kitchen-skills-challenge/format';
import { useReadyKitchenSkillsSession } from '@/products/kitchen-skills-challenge/domain/session/KitchenSkillsSessionContext';
import { KitchenSkillsGramsInput } from '@/products/kitchen-skills-challenge/surfaces/shared/KitchenSkillsGramsInput';
import { canSaveRescueSuggestion, parseReusableWasteGrams, parseReuseDestination } from '@/products/kitchen-skills-challenge/domain/reuse/validation';

export function KitchenSkillsReuseView() {
  const { session, trimEntries, findRescueByIngredientId, commitRescueEntry, setReuseInProgress } =
    useReadyKitchenSkillsSession();
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

  useEffect(() => {
    setReuseInProgress(completedTrim.length > 0 && !complete);
    return () => setReuseInProgress(false);
  }, [complete, completedTrim.length, setReuseInProgress]);

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
    setSaved(true);
  }

  if (completedTrim.length === 0) {
    return (
      <section className="kitchen-day-card" data-testid="kitchen-day-rescue">
        <h2 className="kitchen-day-card__title">Reuse</h2>
        <p className="kitchen-day-card__copy" data-testid="kitchen-day-rescue-empty">
          Record an ingredient preparation entry with actual waste first.
        </p>
      </section>
    );
  }

  return (
    <section className="kitchen-day-card" data-testid="kitchen-day-rescue">
      <h2 className="kitchen-day-card__title">Reuse suggestion</h2>
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
          <p className="kitchen-day-reuse-waste" data-testid="kitchen-day-rescue-actual-waste">
            Actual waste {formatGrams(trim.actualWasteGrams)}
          </p>
        ) : null}
      </div>

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
          <label className="kitchen-day-field kitchen-day-field--compact">
            <span>Reusable amount</span>
            <div className="kitchen-day-input-row kitchen-day-input-row--grams">
              <KitchenSkillsGramsInput
                testId="kitchen-day-reusable-waste"
                value={reusableRaw}
                onChange={setReusableRaw}
              />
              <span className="kitchen-day-unit">g</span>
            </div>
          </label>
          {!reusable.ok && reusableRaw !== '' ? (
            <p className="kitchen-day-error" data-testid="kitchen-day-reusable-error">
              Reusable amount must be 0 g up to the actual waste.
            </p>
          ) : null}

          <label className="kitchen-day-field kitchen-day-field--compact">
            <span>Reuse destination</span>
            <textarea
              className="kitchen-day-input kitchen-day-input--destination"
              data-testid="kitchen-day-reuse-destination"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              rows={2}
            />
          </label>

          {discarded != null ? (
            <p data-testid="kitchen-day-discarded-waste">Discarded {formatGrams(discarded)}</p>
          ) : null}

          <div className="kitchen-day-form-actions kitchen-day-form-actions--sticky">
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
          </div>
        </>
      )}
    </section>
  );
}
