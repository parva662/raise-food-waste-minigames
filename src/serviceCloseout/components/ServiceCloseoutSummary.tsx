import {
  CLOSEOUT_CATEGORY_KEYS,
  CLOSEOUT_CATEGORY_LABELS,
  CLOSEOUT_NOT_ENTERED_LABEL,
  type CloseoutCategoryKey,
  type ServiceCloseout,
  type ServiceCloseoutDraft,
} from '../types';

interface ServiceCloseoutSummaryProps {
  draft: ServiceCloseoutDraft;
  finalizedCloseout: ServiceCloseout | null;
  recordedByName: string | null;
}

function formatOptional(value: number | null): string {
  return value === null ? CLOSEOUT_NOT_ENTERED_LABEL : String(value);
}

export function ServiceCloseoutSummary({
  draft,
  finalizedCloseout,
  recordedByName,
}: ServiceCloseoutSummaryProps) {
  const source = finalizedCloseout;
  const actualCustomers = source?.actualCustomers ?? draft.actualCustomers;

  return (
    <aside className="closeout-summary" aria-label="Service summary">
      <h2 className="closeout-summary__title">Service summary</h2>
      <dl className="closeout-summary__list">
        <div className="closeout-summary__row">
          <dt>Actual customers</dt>
          <dd>{formatOptional(actualCustomers)}</dd>
        </div>
        <div className="closeout-summary__row">
          <dt>Recorded by</dt>
          <dd>{recordedByName ?? CLOSEOUT_NOT_ENTERED_LABEL}</dd>
        </div>
      </dl>
      <h3 className="closeout-summary__section">Prepared / waste</h3>
      <dl className="closeout-summary__list">
        {CLOSEOUT_CATEGORY_KEYS.map((key: CloseoutCategoryKey) => {
          const category = source?.[key] ?? draft[key];
          const prepared =
            'preparedQuantity' in category && typeof category.preparedQuantity === 'number'
              ? category.preparedQuantity
              : category.preparedQuantity;
          const waste =
            'overproductionGrams' in category && typeof category.overproductionGrams === 'number'
              ? category.overproductionGrams
              : category.overproductionGrams;

          return (
            <div key={key} className="closeout-summary__row">
              <dt>{CLOSEOUT_CATEGORY_LABELS[key]}</dt>
              <dd>
                {prepared === null || waste === null
                  ? CLOSEOUT_NOT_ENTERED_LABEL
                  : `${prepared} / ${waste} g`}
              </dd>
            </div>
          );
        })}
      </dl>
    </aside>
  );
}
