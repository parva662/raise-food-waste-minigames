import {
  rescueSummaryLine,
  trimSummaryDetail,
} from '@/products/kitchen-skills-challenge/domain/attemptSummary';
import type {
  KitchenSkillsRescueEntry,
  KitchenSkillsTrimEntry,
} from '@/products/kitchen-skills-challenge/domain/types';

/** Compact per-ingredient Trim list: "Banaani / 260 g waste · 1 min 24 sec". */
export function TrimSummaryList({
  entries,
  testIdPrefix,
}: {
  entries: readonly KitchenSkillsTrimEntry[];
  testIdPrefix: string;
}) {
  return (
    <ul className="kitchen-day-summary-list" data-testid={`${testIdPrefix}-trim-summary`}>
      {entries.map((entry) => (
        <li
          key={`${entry.recipeId ?? 'legacy'}:${entry.ingredientId}`}
          className="kitchen-day-summary-list__item"
          data-testid={`${testIdPrefix}-trim-summary-${entry.ingredientId}`}
        >
          <span className="kitchen-day-summary-list__name">{entry.ingredientName}</span>
          <span className="kitchen-day-summary-list__detail">{trimSummaryDetail(entry)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Compact Rescue list: "Appelsiini · 400 g to cake", or quantity plus a quoted preview. */
export function RescueSummaryList({
  entries,
  trimEntries,
  testIdPrefix,
}: {
  entries: readonly KitchenSkillsRescueEntry[];
  trimEntries: readonly KitchenSkillsTrimEntry[];
  testIdPrefix: string;
}) {
  return (
    <ul className="kitchen-day-summary-list" data-testid={`${testIdPrefix}-rescue-summary`}>
      {entries.map((entry) => {
        const line = rescueSummaryLine(entry, trimEntries);
        return (
          <li
            key={`${entry.recipeId ?? 'legacy'}:${entry.ingredientId}`}
            className="kitchen-day-summary-list__item"
            data-testid={`${testIdPrefix}-rescue-summary-${entry.ingredientId}`}
          >
            <span className="kitchen-day-summary-list__name">{line.ingredientName}</span>
            <span className="kitchen-day-summary-list__detail">
              {line.detail}
              {line.preview ? (
                <span className="kitchen-day-summary-list__preview" title={line.fullDestination}>
                  {' '}
                  · “{line.preview}”
                </span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
