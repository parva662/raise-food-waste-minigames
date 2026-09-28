/**
 * Canonical hash-route registry for this single-SPA GameBus embed app.
 *
 * Product name vs legacy-stable URLs:
 * "Kitchen Skills Challenge" is the product.
 * `#/kitchen-day*` and the session prefix `kitchen-day:` are external/legacy contracts
 * (GameBus Custom Embed URLs and persisted activity session ids). Do not change them.
 */

export type AppMode =
  | 'student'
  | 'chef'
  | 'service-closeout'
  | 'chef-results'
  | 'chef-results-admin'
  | 'trim-smart'
  | 'kitchen-day'
  | 'kitchen-day-progress'
  | 'kitchen-day-tutor';

export type RouteSurface =
  | 'lunch-declaration'
  | 'kitchen-forecast'
  | 'service-closeout'
  | 'forecast-results-participant'
  | 'forecast-results-admin'
  | 'legacy-trim-smart-v1'
  | 'kitchen-skills-challenge'
  | 'kitchen-skills-progress'
  | 'kitchen-skills-trainer';

export type KitchenSkillsHashSection = 'trim' | 'reuse' | 'portion' | 'review';

export const STUDENT_ACTIVITY_REF = 'studentLunchCheckin';
export const CHEF_ACTIVITY_REF = 'chefForecast';
export const WASTE_MEASUREMENT_ACTIVITY_REF = 'wasteMeasurement';
export const TRIM_SMART_ACTIVITY_REF = 'trimSmart';
export const RESCUE_AND_REUSE_ACTIVITY_REF = 'rescueAndReuse';
export const PORTION_PRECISION_ACTIVITY_REF = 'portionPrecision';
export const WASTE_PRACTICE_REVIEW_ACTIVITY_REF = 'wastePracticeReview';
export const SERVICE_CLOSEOUT_ACTIVITY_REF = WASTE_MEASUREMENT_ACTIVITY_REF;

export const CHEF_HASH_ROUTE = '#/chef';
export const SERVICE_CLOSEOUT_HASH_ROUTE = '#/service-closeout';
export const CHEF_RESULTS_HASH_ROUTE = '#/chef-results';
export const CHEF_RESULTS_ADMIN_HASH_ROUTE = '#/chef-results-admin';
export const TRIM_SMART_HASH_ROUTE = '#/waste/trim-smart';
export const KITCHEN_DAY_HASH_ROUTE = '#/kitchen-day';
export const KITCHEN_DAY_PROGRESS_HASH_ROUTE = '#/kitchen-day-progress';
export const KITCHEN_DAY_TUTOR_HASH_ROUTE = '#/kitchen-day-tutor';
export const KITCHEN_SKILLS_CHALLENGE_HASH_ROUTE = KITCHEN_DAY_HASH_ROUTE;
export const KITCHEN_SKILLS_PROGRESS_HASH_ROUTE = KITCHEN_DAY_PROGRESS_HASH_ROUTE;
export const KITCHEN_SKILLS_TRAINER_HASH_ROUTE = KITCHEN_DAY_TUTOR_HASH_ROUTE;

export type AppRouteDefinition = {
  mode: AppMode;
  surface: RouteSurface;
  hash: string;
  title: string;
  postsActivity: boolean;
  expectedActivity: string | null;
};

export const APP_ROUTES: readonly AppRouteDefinition[] = [
  {
    mode: 'student',
    surface: 'lunch-declaration',
    hash: '',
    title: 'Student Lunch',
    postsActivity: true,
    expectedActivity: STUDENT_ACTIVITY_REF,
  },
  {
    mode: 'chef',
    surface: 'kitchen-forecast',
    hash: CHEF_HASH_ROUTE,
    title: 'Kitchen Forecast',
    postsActivity: true,
    expectedActivity: CHEF_ACTIVITY_REF,
  },
  {
    mode: 'service-closeout',
    surface: 'service-closeout',
    hash: SERVICE_CLOSEOUT_HASH_ROUTE,
    title: 'Service Closeout',
    postsActivity: true,
    expectedActivity: SERVICE_CLOSEOUT_ACTIVITY_REF,
  },
  {
    mode: 'chef-results',
    surface: 'forecast-results-participant',
    hash: CHEF_RESULTS_HASH_ROUTE,
    title: 'Forecast Results',
    postsActivity: false,
    expectedActivity: null,
  },
  {
    mode: 'chef-results-admin',
    surface: 'forecast-results-admin',
    hash: CHEF_RESULTS_ADMIN_HASH_ROUTE,
    title: 'Kitchen Management Dashboard',
    postsActivity: false,
    expectedActivity: null,
  },
  {
    mode: 'trim-smart',
    surface: 'legacy-trim-smart-v1',
    hash: TRIM_SMART_HASH_ROUTE,
    title: 'Trim Smart',
    postsActivity: true,
    expectedActivity: TRIM_SMART_ACTIVITY_REF,
  },
  {
    mode: 'kitchen-day',
    surface: 'kitchen-skills-challenge',
    hash: KITCHEN_DAY_HASH_ROUTE,
    title: 'Kitchen Skills Challenge',
    postsActivity: true,
    expectedActivity: TRIM_SMART_ACTIVITY_REF,
  },
  {
    mode: 'kitchen-day-progress',
    surface: 'kitchen-skills-progress',
    hash: KITCHEN_DAY_PROGRESS_HASH_ROUTE,
    title: 'Kitchen Skills Challenge Progress',
    postsActivity: false,
    expectedActivity: null,
  },
  {
    mode: 'kitchen-day-tutor',
    surface: 'kitchen-skills-trainer',
    hash: KITCHEN_DAY_TUTOR_HASH_ROUTE,
    title: 'Kitchen Skills Challenge Trainer',
    postsActivity: true,
    expectedActivity: WASTE_PRACTICE_REVIEW_ACTIVITY_REF,
  },
] as const;

export function hashPath(hash: string = typeof window === 'undefined' ? '' : window.location.hash): string {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const trimmed = raw.startsWith('/') ? raw.slice(1) : raw;
  return trimmed.split('?')[0] ?? '';
}

function hashSearch(hash: string = typeof window === 'undefined' ? '' : window.location.hash): string {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const trimmed = raw.startsWith('/') ? raw.slice(1) : raw;
  return trimmed.split('?')[1] ?? '';
}

export function parseKitchenDaySection(
  hash: string = typeof window === 'undefined' ? '' : window.location.hash,
): KitchenSkillsHashSection {
  const path = hashPath(hash);
  if (path === 'kitchen-day/reuse' || path === 'kitchen-day/rescue') return 'reuse';
  if (path === 'kitchen-day/portion') return 'portion';
  if (path === 'kitchen-day/review' || path === 'kitchen-day/my-day' || path === 'kitchen-day/overview') {
    return 'review';
  }
  return 'trim';
}

export function parseKitchenDaySelectedSessionId(
  hash: string = typeof window === 'undefined' ? '' : window.location.hash,
): string | null {
  const sessionId = new URLSearchParams(hashSearch(hash)).get('sessionId')?.trim();
  return sessionId && sessionId.length > 0 ? sessionId : null;
}

export function kitchenDayHashFor(section: KitchenSkillsHashSection): string {
  if (section === 'trim') return KITCHEN_DAY_HASH_ROUTE;
  return `${KITCHEN_DAY_HASH_ROUTE}/${section}`;
}

export function kitchenDayTutorHashFor(sessionId?: string): string {
  if (!sessionId) return KITCHEN_DAY_TUTOR_HASH_ROUTE;
  return `${KITCHEN_DAY_TUTOR_HASH_ROUTE}?sessionId=${encodeURIComponent(sessionId)}`;
}

export function kitchenDayHashMatches(hash: string): boolean {
  const path = hashPath(hash);
  return path === 'kitchen-day' || path.startsWith('kitchen-day/');
}

export function kitchenDayProgressHashMatches(hash: string): boolean {
  return hashPath(hash) === 'kitchen-day-progress';
}

export function kitchenDayTutorHashMatches(hash: string): boolean {
  return hashPath(hash) === 'kitchen-day-tutor';
}

function trimSmartHashMatches(hash: string): boolean {
  return hashPath(hash) === 'waste/trim-smart';
}

export function getAppMode(hash: string = typeof window === 'undefined' ? '' : window.location.hash): AppMode {
  if (typeof window === 'undefined' && hash === '') return 'student';
  if (trimSmartHashMatches(hash)) return 'trim-smart';
  if (kitchenDayProgressHashMatches(hash)) return 'kitchen-day-progress';
  if (kitchenDayTutorHashMatches(hash)) return 'kitchen-day-tutor';
  if (kitchenDayHashMatches(hash)) return 'kitchen-day';
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

export function getRouteDefinition(mode: AppMode = getAppMode()): AppRouteDefinition {
  const found = APP_ROUTES.find((route) => route.mode === mode);
  if (!found) {
    throw new Error(`Unknown app mode: ${mode}`);
  }
  return found;
}

/**
 * Activity template expected for TASK logging / mapper selection on posting surfaces.
 * Read-only surfaces return null (they must not pretend to post trimSmart).
 */
export function getExpectedActivityRef(
  hash: string = typeof window === 'undefined' ? '' : window.location.hash,
): string | null {
  const mode = getAppMode(hash);
  if (mode === 'kitchen-day') {
    const section = parseKitchenDaySection(hash);
    if (section === 'reuse') return RESCUE_AND_REUSE_ACTIVITY_REF;
    if (section === 'portion') return PORTION_PRECISION_ACTIVITY_REF;
    if (section === 'review') return null;
    return TRIM_SMART_ACTIVITY_REF;
  }
  return getRouteDefinition(mode).expectedActivity;
}
