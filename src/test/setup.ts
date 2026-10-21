import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { resetKitchenSkillsAttemptStorageForTests } from '@/products/kitchen-skills-challenge/domain/session/attempt';

afterEach(() => {
  resetKitchenSkillsAttemptStorageForTests();
});
