import type { AppMode } from '../gamebus/appMode';

const DOCUMENT_TITLES: Record<AppMode, string> = {
  student: 'Student Lunch',
  chef: 'Kitchen Forecast',
  'service-closeout': 'Service Closeout',
  'chef-results': 'Chef Results',
  'chef-results-admin': 'Kitchen Management Dashboard',
  'trim-smart': 'Trim Smart',
  'kitchen-day': 'Kitchen Day',
  'kitchen-day-progress': 'Kitchen Day Progress',
  'kitchen-day-tutor': 'Kitchen Day Tutor',
};

export function getDocumentTitleForMode(mode: AppMode): string {
  return DOCUMENT_TITLES[mode];
}

export function applyDocumentTitle(mode: AppMode): void {
  document.title = getDocumentTitleForMode(mode);
}
