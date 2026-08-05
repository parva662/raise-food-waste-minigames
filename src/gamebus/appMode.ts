export type AppMode = 'student' | 'chef';

export const STUDENT_ACTIVITY_REF = 'studentLunchCheckin';
export const CHEF_ACTIVITY_REF = 'chefForecast';

/** GitHub Pages–safe hash route for the chef forecast view. */
export const CHEF_HASH_ROUTE = '#/chef';

export function getAppMode(): AppMode {
  if (typeof window === 'undefined') return 'student';
  const hash = window.location.hash;
  if (hash === CHEF_HASH_ROUTE || hash.startsWith('#/chef?') || hash.startsWith('#/chef/')) {
    return 'chef';
  }
  return 'student';
}

export function getExpectedActivityRef(): string {
  return getAppMode() === 'chef' ? CHEF_ACTIVITY_REF : STUDENT_ACTIVITY_REF;
}
