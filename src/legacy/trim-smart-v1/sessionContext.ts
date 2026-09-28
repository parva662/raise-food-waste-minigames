export interface HashRouteParts {
  path: string;
  searchParams: URLSearchParams;
}

/** Parse path and query from `window.location.hash` (without leading #). */
export function parseHashRoute(hash: string): HashRouteParts {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const trimmed = raw.startsWith('/') ? raw.slice(1) : raw;
  const queryIndex = trimmed.indexOf('?');
  const path = queryIndex >= 0 ? trimmed.slice(0, queryIndex) : trimmed;
  const query = queryIndex >= 0 ? trimmed.slice(queryIndex + 1) : '';
  return {
    path,
    searchParams: new URLSearchParams(query),
  };
}

export function isTrimSmartHashPath(path: string): boolean {
  return path === 'waste/trim-smart';
}
