import { getRouteDefinition, type AppMode } from '@/app/routes';

export function getDocumentTitleForMode(mode: AppMode): string {
  return getRouteDefinition(mode).title;
}

export function applyDocumentTitle(mode: AppMode): void {
  document.title = getDocumentTitleForMode(mode);
}
