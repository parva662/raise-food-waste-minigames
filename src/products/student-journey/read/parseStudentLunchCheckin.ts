import { readGameBusSlug } from '@/platform/gamebus/gameBusSlug';
import {
  filterActivitiesByTemplateReference,
  getActivityTemplateReference,
} from '@/platform/gamebus/groupActivities';
import { STUDENT_ACTIVITY_REF } from '@/app/routes';
import {
  STUDENT_LUNCH_CHECKIN_REQUIRED_REFS,
} from '@/products/lunch-declaration/gamebus/mapStudentLunchCheckin';
import type { MealChoice } from '@/shared/menu/mealChoice';

type RawProperty = {
  value?: { value?: unknown };
  template?: { slug?: string; name?: string };
};

type RawActivity = {
  id?: string;
  actor?: { id?: string; name?: string };
  createdAt?: string;
  template?: { slug?: string; name?: string };
  properties?: RawProperty[];
};

export type ParsedStudentLunchCheckin = {
  activityId: string;
  actorId: string;
  actorName: string;
  targetDate: string;
  mealType: MealChoice;
  mainQuantity: number;
  vegetarianQuantity: number;
  soupQuantity: number;
  dessertQuantity: number;
  submittedAt: string;
  createdAt: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readPropertyMap(activity: RawActivity): Map<string, unknown> {
  const map = new Map<string, unknown>();
  for (const property of activity.properties ?? []) {
    const ref = readGameBusSlug(property.template);
    if (!ref || typeof ref !== 'string') continue;
    map.set(ref, property.value?.value);
  }
  return map;
}

function readString(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) return null;
  return value.trim();
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function readMealType(value: unknown): MealChoice | null {
  const raw = readString(value);
  if (raw === 'regular' || raw === 'soup' || raw === 'no_lunch') return raw;
  return null;
}

/**
 * Parse a single GameBus activity as `studentLunchCheckin`.
 * Returns null when the template or required fields are missing/invalid.
 */
export function parseStudentLunchCheckinActivity(raw: unknown): ParsedStudentLunchCheckin | null {
  if (!isRecord(raw)) return null;
  if (getActivityTemplateReference(raw) !== STUDENT_ACTIVITY_REF) return null;

  const activity = raw as RawActivity;
  const propertyMap = readPropertyMap(activity);

  for (const ref of STUDENT_LUNCH_CHECKIN_REQUIRED_REFS) {
    if (!propertyMap.has(ref)) return null;
  }

  const targetDate = readString(propertyMap.get('targetDate'));
  const mealType = readMealType(propertyMap.get('mealType'));
  const mainQuantity = readNumber(propertyMap.get('mainQuantity'));
  const vegetarianQuantity = readNumber(propertyMap.get('vegetarianQuantity'));
  const soupQuantity = readNumber(propertyMap.get('soupQuantity'));
  const dessertQuantity = readNumber(propertyMap.get('dessertQuantity'));
  const submittedAt = readString(propertyMap.get('submittedAt'));
  const activityId = readString(activity.id);
  const actorId = readString(activity.actor?.id);

  if (
    !targetDate ||
    !mealType ||
    mainQuantity === null ||
    vegetarianQuantity === null ||
    soupQuantity === null ||
    dessertQuantity === null ||
    !submittedAt ||
    !activityId ||
    !actorId
  ) {
    return null;
  }

  return {
    activityId,
    actorId,
    actorName: readString(activity.actor?.name) ?? '',
    targetDate,
    mealType,
    mainQuantity,
    vegetarianQuantity,
    soupQuantity,
    dessertQuantity,
    submittedAt,
    createdAt: readString(activity.createdAt),
  };
}

/**
 * Keep one declaration per service date (latest `submittedAt`, then activity id).
 * Optionally restrict to the authenticated actor.
 */
export function buildStudentLunchHistory(
  activities: readonly unknown[],
  options?: { actorId?: string | null },
): ParsedStudentLunchCheckin[] {
  const lunchActivities = filterActivitiesByTemplateReference(activities, STUDENT_ACTIVITY_REF);
  const parsed: ParsedStudentLunchCheckin[] = [];

  for (const activity of lunchActivities) {
    const entry = parseStudentLunchCheckinActivity(activity);
    if (!entry) continue;
    if (options?.actorId && entry.actorId !== options.actorId) continue;
    parsed.push(entry);
  }

  const byDate = new Map<string, ParsedStudentLunchCheckin>();
  for (const entry of parsed) {
    const existing = byDate.get(entry.targetDate);
    if (!existing) {
      byDate.set(entry.targetDate, entry);
      continue;
    }
    if (
      entry.submittedAt > existing.submittedAt ||
      (entry.submittedAt === existing.submittedAt && entry.activityId > existing.activityId)
    ) {
      byDate.set(entry.targetDate, entry);
    }
  }

  return [...byDate.values()].sort((a, b) => {
    if (a.targetDate === b.targetDate) return b.submittedAt.localeCompare(a.submittedAt);
    return b.targetDate.localeCompare(a.targetDate);
  });
}
