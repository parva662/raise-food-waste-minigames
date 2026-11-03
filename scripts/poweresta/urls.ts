import {
  POWERESTA_API_ORIGIN,
  POWERESTA_LOGIN_PATH,
  POWERESTA_PUBLIC_BASE,
  type PowerestaRecipeListFilters,
} from './types.ts';

export function buildLoginUrl(origin: string = POWERESTA_API_ORIGIN): string {
  return `${origin.replace(/\/$/, '')}${POWERESTA_LOGIN_PATH}`;
}

export function buildPublicUrl(path: string, originPublicBase: string = POWERESTA_PUBLIC_BASE): string {
  const base = originPublicBase.replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function buildPublishedMenusUrl(siteName: string): string {
  return buildPublicUrl(`/publicmenu/menus/${encodeURIComponent(siteName)}/`);
}

export function buildPublishedMenuMetadataUrl(siteName: string, menuName: string): string {
  const query = new URLSearchParams({ menu: menuName });
  return `${buildPublicUrl(`/publicmenu/menu/${encodeURIComponent(siteName)}/`)}?${query.toString()}`;
}

export function buildPublishedMenuDatesUrl(
  siteName: string,
  menuName: string,
  dates: readonly string[],
): string {
  const query = new URLSearchParams({
    menu: menuName,
    dates: dates.join(','),
  });
  return `${buildPublicUrl(`/publicmenu/dates/${encodeURIComponent(siteName)}/`)}?${query.toString()}`;
}

export function buildLanguagesUrl(): string {
  return buildPublicUrl('/language/');
}

export function buildUnitOfMeasurementUrl(id: string): string {
  return buildPublicUrl(`/unitofmeasurement/${encodeURIComponent(id)}`);
}

export function buildRecipeDetailUrl(id: string, languageId: string): string {
  const query = new URLSearchParams({ _languageId: languageId });
  return `${buildPublicUrl(`/recipe/${encodeURIComponent(id)}/`)}?${query.toString()}`;
}

export function buildRecipeListUrl(filters: PowerestaRecipeListFilters = {}): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue;
    query.set(key, String(value));
  }
  const qs = query.toString();
  return qs ? `${buildPublicUrl('/recipe/')}?${qs}` : buildPublicUrl('/recipe/');
}
