import { describe, expect, it } from 'vitest';
import { selectActivityTemplate } from '@/platform/gamebus/selectActivityTemplate';
import { platformTaskFixture } from '@/platform/gamebus/testFixtures';

describe('selectActivityTemplate (GameBus slug field)', () => {
  it('selects the expected template slug', () => {
    expect(selectActivityTemplate(platformTaskFixture('alpha'), 'alpha').reference).toBe('alpha');
  });

  it('selects among multiple templates by slug', () => {
    const task = platformTaskFixture('alpha');
    task.activityTemplates.push({
      id: 'platform-template-2',
      slug: 'beta',
      name: 'beta',
      providers: [],
      linkedProperties: [],
    });
    expect(selectActivityTemplate(task, 'beta').reference).toBe('beta');
  });

  it('reports (none) when slug does not match expected template', () => {
    const task = platformTaskFixture('unexpectedTemplate');
    expect(() => selectActivityTemplate(task, 'alpha')).toThrow(
      /expected alpha.*Found: unexpectedTemplate/,
    );
  });
});
