import { formatDurationFromMinutes, formatGrams } from '@/products/kitchen-skills-challenge/format';
import { normalizeRecipeId } from '@/products/kitchen-skills-challenge/domain/session/ingredientUniqueness';
import type {
  KitchenSkillsRescueEntry,
  KitchenSkillsTrimEntry,
} from '@/products/kitchen-skills-challenge/domain/types';

const SHORT_DESTINATION_MAX_LENGTH = 40;
const DESTINATION_PREVIEW_LENGTH = 48;

/** "260 g waste · 1 min 24 sec" for one saved Trim ingredient. */
export function trimSummaryDetail(entry: KitchenSkillsTrimEntry): string {
  return `${formatGrams(entry.actualWasteGrams)} waste · ${formatDurationFromMinutes(entry.durationMinutes)}`;
}

/**
 * A destination reads naturally after "to" only when it is a short phrase ("cake",
 * "staff soup"). Anything longer or sentence-like is shown as a quoted preview instead; the text
 * is never parsed or rewritten.
 */
export function isShortReuseDestination(destination: string): boolean {
  const text = destination.trim();
  return (
    text.length > 0 &&
    text.length <= SHORT_DESTINATION_MAX_LENGTH &&
    !/[\n.,;:!?]/.test(text)
  );
}

export function reuseDestinationPreview(destination: string): string {
  const text = destination.trim().replace(/\s+/g, ' ');
  if (text.length <= DESTINATION_PREVIEW_LENGTH) return text;
  return `${text.slice(0, DESTINATION_PREVIEW_LENGTH).trimEnd()}…`;
}

export type RescueSummaryLine = {
  ingredientName: string;
  /** "400 g to cake" or "400 g reused" when the destination is long. */
  detail: string;
  /** Quoted preview of a long destination; null when `detail` already contains it. */
  preview: string | null;
  fullDestination: string;
};

export function rescueSummaryLine(
  entry: KitchenSkillsRescueEntry,
  trimEntries: readonly KitchenSkillsTrimEntry[],
): RescueSummaryLine {
  const trim = trimEntries.find(
    (item) =>
      item.ingredientId === entry.ingredientId &&
      normalizeRecipeId(item.recipeId) === normalizeRecipeId(entry.recipeId),
  );
  const amount = formatGrams(entry.reusableWasteGrams);
  const destination = entry.reuseDestination.trim();
  const short = isShortReuseDestination(destination);
  return {
    ingredientName: trim?.ingredientName ?? entry.ingredientId,
    detail: short ? `${amount} to ${destination}` : `${amount} reused`,
    preview: short || !destination ? null : reuseDestinationPreview(destination),
    fullDestination: destination,
  };
}
