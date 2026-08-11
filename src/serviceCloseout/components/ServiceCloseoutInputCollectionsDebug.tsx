import { useState } from 'react';
import {
  getInputCollectionKeys,
  getRawChefForecastsInput,
  SERVICE_CLOSEOUT_CHEF_FORECASTS_REQUEST_KEY,
  SERVICE_CLOSEOUT_INPUT_COLLECTION_KEY,
} from '../../gamebus/inputCollections';
import { useGameBusEmbed } from '../../gamebus/useGameBusEmbed';

function formatRawJson(value: unknown): string {
  if (value === undefined) return '(undefined)';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/**
 * Development-only inspector for raw INPUT_COLLECTIONS payloads.
 * Hidden behind an explicit toggle — not part of the operational closeout flow.
 */
export function ServiceCloseoutInputCollectionsDebug() {
  const [open, setOpen] = useState(false);

  if (!import.meta.env.DEV) return null;

  const { embedded, inputCollectionsReady, inputCollections } = useGameBusEmbed();
  const collectionKeys = getInputCollectionKeys(inputCollections);
  const rawChefForecasts = getRawChefForecastsInput(inputCollections);

  return (
    <aside className="closeout-input-collections-debug" data-testid="closeout-input-collections-debug">
      <button
        type="button"
        className="closeout-input-collections-debug__toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? 'Hide' : 'Show'} raw INPUT_COLLECTIONS (dev)
      </button>

      {open && (
        <div className="closeout-input-collections-debug__panel">
          <h2 className="closeout-input-collections-debug__title">GameBus input collections (dev)</h2>
          <dl className="closeout-input-collections-debug__list">
            <div>
              <dt>Embed mode</dt>
              <dd>{embedded ? 'yes' : 'no (standalone)'}</dd>
            </div>
            <div>
              <dt>INPUT_COLLECTIONS received</dt>
              <dd>{inputCollectionsReady ? 'yes' : 'no'}</dd>
            </div>
            <div>
              <dt>Collection keys</dt>
              <dd>{collectionKeys.length > 0 ? collectionKeys.join(', ') : '(none)'}</dd>
            </div>
            <div>
              <dt>
                Raw <code>{SERVICE_CLOSEOUT_INPUT_COLLECTION_KEY}</code>.
                <code>{SERVICE_CLOSEOUT_CHEF_FORECASTS_REQUEST_KEY}</code>
              </dt>
              <dd>
                <pre className="closeout-input-collections-debug__raw">
                  {formatRawJson(rawChefForecasts)}
                </pre>
              </dd>
            </div>
          </dl>
        </div>
      )}
    </aside>
  );
}
