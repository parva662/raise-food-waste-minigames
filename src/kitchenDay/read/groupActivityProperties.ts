function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readSlug(value: unknown): string | null {
  if (!isRecord(value)) return null;
  if (typeof value.slug === 'string') return value.slug;
  if (typeof value.ref === 'string') return value.ref;
  if (typeof value.template === 'string') return value.template;
  return null;
}

export function readActivityPropertyValue(activity: unknown, slug: string): unknown {
  if (!isRecord(activity) || !Array.isArray(activity.properties)) return undefined;
  for (const property of activity.properties) {
    if (!isRecord(property)) continue;
    const template = isRecord(property.template) ? readSlug(property.template) : readSlug(property);
    if (template !== slug) continue;
    if (isRecord(property.value) && 'value' in property.value) return property.value.value;
    if (isRecord(property.obj) && 'value' in property.obj) return property.obj.value;
    if ('value' in property) return property.value;
  }
  return undefined;
}

export function readActivityPropertyString(activity: unknown, slug: string): string | null {
  const value = readActivityPropertyValue(activity, slug);
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function readActivityPropertyNumber(activity: unknown, slug: string): number | null {
  const value = readActivityPropertyValue(activity, slug);
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
