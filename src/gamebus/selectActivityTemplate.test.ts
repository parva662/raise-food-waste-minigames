import { describe, expect, it } from 'vitest';
import { pariChefForecastTaskFixture } from './chefTaskFixtures';
import { selectActivityTemplate } from './selectActivityTemplate';
import { pariStudentLunchTaskFixture } from './taskFixtures';
import { pariWasteMeasurementTaskFixture } from './wasteMeasurementTaskFixtures';

describe('selectActivityTemplate (GameBus slug field)', () => {
  it('selects chefForecast from activityTemplates[].slug', () => {
    expect(selectActivityTemplate(pariChefForecastTaskFixture, 'chefForecast').reference).toBe(
      'chefForecast',
    );
  });

  it('selects studentLunchCheckin from activityTemplates[].slug', () => {
    expect(selectActivityTemplate(pariStudentLunchTaskFixture).reference).toBe(
      'studentLunchCheckin',
    );
  });

  it('selects wasteMeasurement from activityTemplates[].slug', () => {
    expect(selectActivityTemplate(pariWasteMeasurementTaskFixture, 'wasteMeasurement').reference).toBe(
      'wasteMeasurement',
    );
  });

  it('reports (none) when slug does not match expected template', () => {
    const task = {
      ...pariChefForecastTaskFixture,
      activityTemplates: [
        {
          ...pariChefForecastTaskFixture.activityTemplates[0]!,
          slug: 'unexpectedTemplate',
        },
      ],
    };
    expect(() => selectActivityTemplate(task, 'chefForecast')).toThrow(
      /expected chefForecast.*Found: unexpectedTemplate/,
    );
  });
});
