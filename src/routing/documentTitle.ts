import type { AppMode } from '../gamebus/appMode';

const DOCUMENT_TITLES: Record<AppMode, string> = {
  student: "Tomorrow's Lunch",
  chef: 'Kitchen Forecast',
  'service-closeout': 'Service Closeout',
  'chef-results': 'Chef Results',
  'chef-results-admin': 'Chef Results Admin',
};

export function getDocumentTitleForMode(mode: AppMode): string {
  return DOCUMENT_TITLES[mode];
}

export function applyDocumentTitle(mode: AppMode): void {
  document.title = getDocumentTitleForMode(mode);
}
