export type AppMode =
  | 'student'
  | 'chef'
  | 'service-closeout'
  | 'chef-results'
  | 'chef-results-admin'
  | 'trim-smart';

export const STUDENT_ACTIVITY_REF = 'studentLunchCheckin';
export const CHEF_ACTIVITY_REF = 'chefForecast';
export const WASTE_MEASUREMENT_ACTIVITY_REF = 'wasteMeasurement';
export const TRIM_SMART_ACTIVITY_REF = 'trimSmart';

/** GameBus activity reference for service closeout submission. */
export const SERVICE_CLOSEOUT_ACTIVITY_REF = WASTE_MEASUREMENT_ACTIVITY_REF;

/** GitHub Pages–safe hash route for the chef forecast view. */
export const CHEF_HASH_ROUTE = '#/chef';

/** Hash route for the service closeout view. */
export const SERVICE_CLOSEOUT_HASH_ROUTE = '#/service-closeout';

/** Hash route for participant chef results (GameBus participant menu). */
export const CHEF_RESULTS_HASH_ROUTE = '#/chef-results';

/** Hidden admin/research route — route-level authorization required before production. */
export const CHEF_RESULTS_ADMIN_HASH_ROUTE = '#/chef-results-admin';

/** Trim Smart practical kitchen challenge (participant). */
export const TRIM_SMART_HASH_ROUTE = '#/waste/trim-smart';

function trimSmartHashMatches(hash: string): boolean {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const trimmed = raw.startsWith('/') ? raw.slice(1) : raw;
  const path = trimmed.split('?')[0];
  return path === 'waste/trim-smart';
}

export function getAppMode(): AppMode {
  if (typeof window === 'undefined') return 'student';
  const hash = window.location.hash;
  if (trimSmartHashMatches(hash)) {
    return 'trim-smart';
  }
  if (
    hash === CHEF_RESULTS_ADMIN_HASH_ROUTE ||
    hash.startsWith('#/chef-results-admin?') ||
    hash.startsWith('#/chef-results-admin/')
  ) {
    return 'chef-results-admin';
  }
  if (
    hash === CHEF_RESULTS_HASH_ROUTE ||
    hash.startsWith('#/chef-results?') ||
    (hash.startsWith('#/chef-results/') && !hash.startsWith('#/chef-results-admin'))
  ) {
    return 'chef-results';
  }
  if (hash === CHEF_HASH_ROUTE || hash.startsWith('#/chef?') || hash.startsWith('#/chef/')) {
    return 'chef';
  }
  if (
    hash === SERVICE_CLOSEOUT_HASH_ROUTE ||
    hash.startsWith('#/service-closeout?') ||
    hash.startsWith('#/service-closeout/')
  ) {
    return 'service-closeout';
  }
  return 'student';
}

export function getExpectedActivityRef(): string {
  const mode = getAppMode();
  if (mode === 'chef') return CHEF_ACTIVITY_REF;
  if (mode === 'service-closeout') {
    return SERVICE_CLOSEOUT_ACTIVITY_REF;
  }
  if (mode === 'trim-smart') {
    return TRIM_SMART_ACTIVITY_REF;
  }
  return STUDENT_ACTIVITY_REF;
}
