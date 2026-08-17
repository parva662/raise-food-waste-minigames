/**
 * Authenticated GameBus user from Input Collection `inputCollectionPari.me`
 * (parent-fetched `/api/me` response).
 */

export type GameBusAuthenticatedUser = {
  id: string;
  name: string;
  image?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseUserRecord(record: Record<string, unknown>): GameBusAuthenticatedUser | null {
  const id = readNonEmptyString(record.id) ?? readNonEmptyString(record._id);
  const name = readNonEmptyString(record.name);
  if (!id || !name) return null;

  const image = readNonEmptyString(record.image) ?? undefined;
  return image ? { id, name, image } : { id, name };
}

/**
 * Defensive parser for the `/api/me` payload delivered through INPUT_COLLECTIONS.
 * Returns null when required fields are missing or the shape is not recognised.
 */
export function parseGameBusAuthenticatedUser(raw: unknown): GameBusAuthenticatedUser | null {
  if (!isRecord(raw)) return null;

  const direct = parseUserRecord(raw);
  if (direct) return direct;

  for (const key of ['user', 'data', 'me'] as const) {
    const nested = raw[key];
    if (isRecord(nested)) {
      const parsed = parseUserRecord(nested);
      if (parsed) return parsed;
    }
  }

  return null;
}
