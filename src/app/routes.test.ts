import { describe, expect, it } from 'vitest';
import {
  getAppMode,
  getExpectedActivityRef,
  getRouteDefinition,
  hashPath,
  kitchenDayHashFor,
  parseKitchenDaySection,
  PORTION_PRECISION_ACTIVITY_REF,
  RESCUE_AND_REUSE_ACTIVITY_REF,
  STUDENT_ACTIVITY_REF,
  TRIM_SMART_ACTIVITY_REF,
  WASTE_MEASUREMENT_ACTIVITY_REF,
  CHEF_ACTIVITY_REF,
  WASTE_PRACTICE_REVIEW_ACTIVITY_REF,
} from './routes';

describe('app route registry', () => {
  it('maps the empty hash to Lunch Declaration', () => {
    expect(getAppMode('')).toBe('student');
    expect(getRouteDefinition('student').surface).toBe('lunch-declaration');
    expect(getExpectedActivityRef('')).toBe(STUDENT_ACTIVITY_REF);
  });

  it('maps operational and results routes', () => {
    expect(getAppMode('#/chef')).toBe('chef');
    expect(getExpectedActivityRef('#/chef')).toBe(CHEF_ACTIVITY_REF);
    expect(getAppMode('#/service-closeout')).toBe('service-closeout');
    expect(getExpectedActivityRef('#/service-closeout')).toBe(WASTE_MEASUREMENT_ACTIVITY_REF);
    expect(getAppMode('#/chef-results')).toBe('chef-results');
    expect(getExpectedActivityRef('#/chef-results')).toBeNull();
    expect(getAppMode('#/chef-results-admin')).toBe('chef-results-admin');
    expect(getExpectedActivityRef('#/chef-results-admin')).toBeNull();
  });

  it('maps legacy Trim Smart v1 without colliding with Kitchen Skills Challenge', () => {
    expect(getAppMode('#/waste/trim-smart')).toBe('trim-smart');
    expect(getExpectedActivityRef('#/waste/trim-smart')).toBe(TRIM_SMART_ACTIVITY_REF);
    expect(getAppMode('#/kitchen-day')).not.toBe('trim-smart');
  });

  it('maps Kitchen Skills Challenge hashes including aliases', () => {
    expect(getAppMode('#/kitchen-day')).toBe('kitchen-day');
    expect(parseKitchenDaySection('#/kitchen-day')).toBe('portion');
    expect(getExpectedActivityRef('#/kitchen-day')).toBe(PORTION_PRECISION_ACTIVITY_REF);
    expect(parseKitchenDaySection('#/kitchen-day/trim')).toBe('trim');
    expect(getExpectedActivityRef('#/kitchen-day/trim')).toBe(TRIM_SMART_ACTIVITY_REF);
    expect(parseKitchenDaySection('#/kitchen-day/reuse')).toBe('reuse');
    expect(parseKitchenDaySection('#/kitchen-day/rescue')).toBe('reuse');
    expect(getExpectedActivityRef('#/kitchen-day/reuse')).toBe(RESCUE_AND_REUSE_ACTIVITY_REF);
    expect(parseKitchenDaySection('#/kitchen-day/portion')).toBe('portion');
    expect(getExpectedActivityRef('#/kitchen-day/portion')).toBe(PORTION_PRECISION_ACTIVITY_REF);
    expect(parseKitchenDaySection('#/kitchen-day/review')).toBe('review');
    expect(parseKitchenDaySection('#/kitchen-day/my-day')).toBe('review');
    expect(parseKitchenDaySection('#/kitchen-day/overview')).toBe('review');
    expect(getExpectedActivityRef('#/kitchen-day/review')).toBeNull();
    expect(kitchenDayHashFor('portion')).toBe('#/kitchen-day');
    expect(kitchenDayHashFor('trim')).toBe('#/kitchen-day/trim');
    expect(kitchenDayHashFor('reuse')).toBe('#/kitchen-day/reuse');
  });

  it('maps Kitchen Skills Challenge progress as a read-only surface', () => {
    expect(getAppMode('#/kitchen-day-progress')).toBe('kitchen-day-progress');
    expect(getExpectedActivityRef('#/kitchen-day-progress')).toBeNull();
    expect(getRouteDefinition('kitchen-day-progress').postsActivity).toBe(false);
  });

  it('maps the trainer surface and keeps the legacy kitchen-day-tutor hash', () => {
    expect(getAppMode('#/kitchen-day-tutor')).toBe('kitchen-day-tutor');
    expect(hashPath('#/kitchen-day-tutor?sessionId=abc')).toBe('kitchen-day-tutor');
    expect(getExpectedActivityRef('#/kitchen-day-tutor')).toBe(WASTE_PRACTICE_REVIEW_ACTIVITY_REF);
  });
});
