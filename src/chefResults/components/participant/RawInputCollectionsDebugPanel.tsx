import { useEffect, useState } from 'react';
import { isChefResultsGameBusDebugMode } from '../../../gamebus/chefResultsInvestigation';
import { formatRawInputCollectionsJson, startRawInputCollectionsCapture } from '../../rawInputCollectionsDiagnostic';

export function useRawInputCollectionsCapture(): unknown | null {
  const [rawData, setRawData] = useState<unknown | null>(null);

  useEffect(() => startRawInputCollectionsCapture(setRawData), []);

  return rawData;
}

export function RawInputCollectionsDebugPanel({ data }: { data: unknown | null }) {
  if (!isChefResultsGameBusDebugMode()) return null;

  return (
    <section
      className="chef-results-raw-input-collections"
      data-testid="raw-input-collections-debug"
    >
      <h3 className="chef-results-raw-input-collections__title">Raw INPUT_COLLECTIONS data</h3>
      {data === null ? (
        <p className="chef-results-raw-input-collections__waiting">
          Waiting for INPUT_COLLECTIONS from GameBus...
        </p>
      ) : (
        <pre className="chef-results-raw-input-collections__json" data-testid="raw-input-collections-json">
          {formatRawInputCollectionsJson(data)}
        </pre>
      )}
    </section>
  );
}
