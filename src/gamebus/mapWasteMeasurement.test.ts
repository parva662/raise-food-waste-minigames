/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { buildWasteMeasurementActivityMessage } from './buildWasteMeasurementActivityMessage';
import {
  mapWasteMeasurement,
  WASTE_MEASUREMENT_REQUIRED_REFS,
} from './mapWasteMeasurement';
import { propertyRefsForWasteMeasurementActivity } from './resolveWasteMeasurementProperties';
import { pariWasteMeasurementTaskFixture } from './wasteMeasurementTaskFixtures';
import {
  ingestInputCollectionsForTests,
  ingestTaskForTests,
  resetGameBusBridgeForTests,
  tryPostCloseoutActivity,
} from './bridge';
import {
  getRawChefForecastsInput,
  SERVICE_CLOSEOUT_CHEF_FORECASTS_REQUEST_KEY,
  SERVICE_CLOSEOUT_INPUT_COLLECTION_KEY,
  SERVICE_CLOSEOUT_INPUTS_COLLECTION_KEY_LEGACY,
} from './inputCollections';
import { SERVICE_CLOSEOUT_ACTIVITY_REF } from './appMode';
import { selectActivityTemplate } from './selectActivityTemplate';
import { pariStudentLunchTaskFixture } from './taskFixtures';
import { pariChefForecastTaskFixture } from './chefTaskFixtures';
import type { ServiceCloseout } from '../serviceCloseout/types';
import { isGameBusEmbed } from './detectEmbed';
import type { GameBusInputCollectionsPayload } from './types';

const closeout: ServiceCloseout = {
  targetDate: '2026-07-29',
  headChefUserId: 'fixture-user-e',
  actualCustomers: 150,
  main: {
    itemId: 'meatballs',
    preparedQuantity: 110,
    portionWeightGrams: 120,
    overproductionGrams: 850,
  },
  vegetarian: {
    itemId: 'pasta-primavera',
    preparedQuantity: 52,
    portionWeightGrams: 180,
    overproductionGrams: 360,
  },
  soup: {
    itemId: 'tomato-soup',
    preparedQuantity: 40,
    portionWeightGrams: 250,
    overproductionGrams: 500,
  },
  dessert: {
    itemId: 'yogurt-berries',
    preparedQuantity: 35,
    portionWeightGrams: 90,
    overproductionGrams: 100,
  },
  submittedAt: '2026-07-29T14:00:00.000Z',
};

const zeroWasteCloseout: ServiceCloseout = {
  ...closeout,
  main: { ...closeout.main, overproductionGrams: 0 },
  vegetarian: { ...closeout.vegetarian, overproductionGrams: 0 },
  soup: { ...closeout.soup, overproductionGrams: 0 },
  dessert: { ...closeout.dessert, overproductionGrams: 0 },
};

function propertyMap(message: ReturnType<typeof buildWasteMeasurementActivityMessage>) {
  return Object.fromEntries(message.data.properties.map((p) => [p.template, p.obj]));
}

const rawChefForecastsFixture = {
  docs: [{ id: 'forecast-1', template: 'chefForecast' }],
  totalDocs: 1,
};

const nestedInputCollections: GameBusInputCollectionsPayload = {
  [SERVICE_CLOSEOUT_INPUT_COLLECTION_KEY]: {
    [SERVICE_CLOSEOUT_CHEF_FORECASTS_REQUEST_KEY]: rawChefForecastsFixture,
  },
};

describe('mapWasteMeasurement / buildWasteMeasurementActivityMessage', () => {
  it('maps a valid Service Closeout to activity template wasteMeasurement', () => {
    const msg = buildWasteMeasurementActivityMessage(pariWasteMeasurementTaskFixture, closeout);
    expect(msg.data.template).toBe('wasteMeasurement');
  });

  it('maps service date to serviceDate', () => {
    const values = mapWasteMeasurement(closeout);
    expect(values.serviceDate).toEqual({ value: '2026-07-29' });
    const msg = buildWasteMeasurementActivityMessage(pariWasteMeasurementTaskFixture, closeout);
    expect(propertyMap(msg).serviceDate).toEqual({ value: '2026-07-29' });
  });

  it('maps actual customers correctly', () => {
    const values = mapWasteMeasurement(closeout);
    expect(values.actualCustomers).toEqual({ value: 150 });
  });

  it('maps Main item ID correctly', () => {
    expect(mapWasteMeasurement(closeout).mainItemId).toEqual({ value: 'meatballs' });
  });

  it('maps Main actual prepared quantity to preparedMainQuantity', () => {
    expect(mapWasteMeasurement(closeout).preparedMainQuantity).toEqual({ value: 110 });
  });

  it('maps Vegetarian item ID correctly', () => {
    expect(mapWasteMeasurement(closeout).vegetarianItemId).toEqual({ value: 'pasta-primavera' });
  });

  it('maps Vegetarian actual prepared quantity to preparedVegetarianQuantity', () => {
    expect(mapWasteMeasurement(closeout).preparedVegetarianQuantity).toEqual({ value: 52 });
  });

  it('maps Soup item ID correctly', () => {
    expect(mapWasteMeasurement(closeout).soupItemId).toEqual({ value: 'tomato-soup' });
  });

  it('maps Soup actual prepared quantity to preparedSoupQuantity', () => {
    expect(mapWasteMeasurement(closeout).preparedSoupQuantity).toEqual({ value: 40 });
  });

  it('maps Dessert item ID correctly', () => {
    expect(mapWasteMeasurement(closeout).dessertItemId).toEqual({ value: 'yogurt-berries' });
  });

  it('maps Dessert actual prepared quantity to preparedDessertQuantity', () => {
    expect(mapWasteMeasurement(closeout).preparedDessertQuantity).toEqual({ value: 35 });
  });

  it('maps kitchen-scale prepared quantities above the student range', () => {
    const kitchenScaleCloseout: ServiceCloseout = {
      ...closeout,
      main: { ...closeout.main, preparedQuantity: 44 },
      vegetarian: { ...closeout.vegetarian, preparedQuantity: 33 },
      soup: { ...closeout.soup, preparedQuantity: 33 },
      dessert: { ...closeout.dessert, preparedQuantity: 333 },
    };
    const msg = buildWasteMeasurementActivityMessage(
      pariWasteMeasurementTaskFixture,
      kitchenScaleCloseout,
    );
    const props = propertyMap(msg);

    expect(props.preparedMainQuantity).toEqual({ value: 44 });
    expect(props.preparedVegetarianQuantity).toEqual({ value: 33 });
    expect(props.preparedSoupQuantity).toEqual({ value: 33 });
    expect(props.preparedDessertQuantity).toEqual({ value: 333 });
  });

  it('does not emit student quantity property refs on wasteMeasurement', () => {
    const msg = buildWasteMeasurementActivityMessage(pariWasteMeasurementTaskFixture, closeout);
    const templates = msg.data.properties.map((p) => p.template);
    expect(templates).not.toContain('mainQuantity');
    expect(templates).not.toContain('vegetarianQuantity');
    expect(templates).not.toContain('soupQuantity');
    expect(templates).not.toContain('dessertQuantity');
  });

  it('maps Main 850 g waste to 0.85 overproductionMeatKg', () => {
    expect(mapWasteMeasurement(closeout).overproductionMeatKg).toEqual({ value: 0.85 });
  });

  it('maps Vegetarian grams to overproductionVegetarianKg', () => {
    expect(mapWasteMeasurement(closeout).overproductionVegetarianKg).toEqual({ value: 0.36 });
  });

  it('maps Soup grams to overproductionSoupKg', () => {
    expect(mapWasteMeasurement(closeout).overproductionSoupKg).toEqual({ value: 0.5 });
  });

  it('maps Dessert grams to overproductionDessertKg', () => {
    expect(mapWasteMeasurement(closeout).overproductionDessertKg).toEqual({ value: 0.1 });
  });

  it('maps 0 g waste to 0 kg', () => {
    const values = mapWasteMeasurement(zeroWasteCloseout);
    expect(values.overproductionMeatKg).toEqual({ value: 0 });
    expect(values.overproductionVegetarianKg).toEqual({ value: 0 });
    expect(values.overproductionSoupKg).toEqual({ value: 0 });
    expect(values.overproductionDessertKg).toEqual({ value: 0 });
  });

  it('maps submittedAt correctly', () => {
    expect(mapWasteMeasurement(closeout).submittedAt).toEqual({
      value: '2026-07-29T14:00:00.000Z',
    });
  });

  it('includes every required property ref in the final ACTIVITY', () => {
    const msg = buildWasteMeasurementActivityMessage(pariWasteMeasurementTaskFixture, closeout);
    const templates = msg.data.properties.map((p) => p.template);
    expect(templates).toEqual([...WASTE_MEASUREMENT_REQUIRED_REFS]);
    for (const ref of WASTE_MEASUREMENT_REQUIRED_REFS) {
      expect(templates).toContain(ref);
    }
  });

  it('posts exactly one ACTIVITY', () => {
    resetGameBusBridgeForTests();
    window.location.hash = '#/service-closeout';
    ingestTaskForTests(pariWasteMeasurementTaskFixture);
    const parentPostMessage = vi.fn();
    const originalParent = window.parent;
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: { postMessage: parentPostMessage },
    });

    const result = tryPostCloseoutActivity(closeout);

    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: originalParent,
    });
    resetGameBusBridgeForTests();
    window.location.hash = '';

    expect(result.ok).toBe(true);
    expect(parentPostMessage).toHaveBeenCalledTimes(1);
  });

  it('uses activity template exactly wasteMeasurement', () => {
    const msg = buildWasteMeasurementActivityMessage(pariWasteMeasurementTaskFixture, closeout);
    expect(msg.data.template).toBe('wasteMeasurement');
    expect(msg.type).toBe('ACTIVITY');
  });

  it('does not post SILENT_ACTIVITY', () => {
    const msg = buildWasteMeasurementActivityMessage(pariWasteMeasurementTaskFixture, closeout);
    expect(msg.type).not.toBe('SILENT_ACTIVITY');
  });

  it('does not post actualServiceData', () => {
    const msg = buildWasteMeasurementActivityMessage(pariWasteMeasurementTaskFixture, closeout);
    expect(msg.data.template).not.toBe('actualServiceData');
  });

  it('does not post wasteReflection', () => {
    const msg = buildWasteMeasurementActivityMessage(pariWasteMeasurementTaskFixture, closeout);
    expect(msg.data.template).not.toBe('wasteReflection');
  });

  it('does not post productionPlan', () => {
    const msg = buildWasteMeasurementActivityMessage(pariWasteMeasurementTaskFixture, closeout);
    expect(msg.data.template).not.toBe('productionPlan');
  });

  it('does not post kitchenServiceCloseout', () => {
    const msg = buildWasteMeasurementActivityMessage(pariWasteMeasurementTaskFixture, closeout);
    expect(msg.data.template).not.toBe('kitchenServiceCloseout');
  });

  it('does not copy chef forecast values into closeout activity', () => {
    const msg = buildWasteMeasurementActivityMessage(pariWasteMeasurementTaskFixture, closeout);
    const templates = msg.data.properties.map((p) => p.template);
    expect(templates).not.toContain('forecastTotalCustomers');
    expect(templates).not.toContain('forecastMeat');
    expect(templates).not.toContain('forecastVegetarian');
    expect(templates).not.toContain('forecastSoup');
    expect(templates).not.toContain('forecastDessert');
    expect(templates).not.toContain('timingStatus');
    expect(templates).not.toContain('targetDate');
    const props = propertyMap(msg);
    expect(props.forecastTotalCustomers).toBeUndefined();
  });

  it('does not include headChefUserId in activity properties', () => {
    const msg = buildWasteMeasurementActivityMessage(pariWasteMeasurementTaskFixture, closeout);
    const templates = msg.data.properties.map((p) => p.template);
    expect(templates).not.toContain('headChefUserId');
    expect(propertyMap(msg).headChefUserId).toBeUndefined();
  });

  it('does not send portion weights as GameBus properties', () => {
    const msg = buildWasteMeasurementActivityMessage(pariWasteMeasurementTaskFixture, closeout);
    const templates = msg.data.properties.map((p) => p.template);
    expect(templates).not.toContain('portionWeightGrams');
    expect(templates).not.toContain('mainPortionWeightGrams');
  });

  it('prevents duplicate Finalize click while submitting', () => {
    resetGameBusBridgeForTests();
    window.location.hash = '#/service-closeout';
    ingestTaskForTests(pariWasteMeasurementTaskFixture);
    const parentPostMessage = vi.fn();
    const originalParent = window.parent;
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: { postMessage: parentPostMessage },
    });

    const first = tryPostCloseoutActivity(closeout);
    const second = tryPostCloseoutActivity(closeout);

    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: originalParent,
    });
    resetGameBusBridgeForTests();
    window.location.hash = '';

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.reason).toBe('duplicate');
    expect(parentPostMessage).toHaveBeenCalledTimes(1);
    expect(parentPostMessage.mock.calls[0][0].type).toBe('ACTIVITY');
    expect(parentPostMessage.mock.calls[0][0].data.template).toBe('wasteMeasurement');
  });

  it('standalone local mode does not require GameBus task for mapper', () => {
    expect(isGameBusEmbed()).toBe(false);
    const msg = buildWasteMeasurementActivityMessage(pariWasteMeasurementTaskFixture, closeout);
    expect(msg.data.template).toBe('wasteMeasurement');
  });

  it('serviceCloseoutInput still retrieves chefForecasts unchanged', () => {
    resetGameBusBridgeForTests();
    ingestInputCollectionsForTests(nestedInputCollections);
    expect(getRawChefForecastsInput(nestedInputCollections)).toEqual(rawChefForecastsFixture);
    resetGameBusBridgeForTests();
  });

  it('legacy serviceCloseoutInputs alias still retrieves chefForecasts', () => {
    const legacyPayload: GameBusInputCollectionsPayload = {
      [SERVICE_CLOSEOUT_INPUTS_COLLECTION_KEY_LEGACY]: {
        [SERVICE_CLOSEOUT_CHEF_FORECASTS_REQUEST_KEY]: rawChefForecastsFixture,
      },
    };
    expect(getRawChefForecastsInput(legacyPayload)).toEqual(rawChefForecastsFixture);
  });

  it('SERVICE_CLOSEOUT_ACTIVITY_REF resolves to wasteMeasurement', () => {
    expect(SERVICE_CLOSEOUT_ACTIVITY_REF).toBe('wasteMeasurement');
  });

  it('propertyRefsForWasteMeasurementActivity returns canonical fifteen refs', () => {
    expect(propertyRefsForWasteMeasurementActivity(pariWasteMeasurementTaskFixture)).toEqual([
      ...WASTE_MEASUREMENT_REQUIRED_REFS,
    ]);
  });
});

describe('student and chef behaviour remain independent', () => {
  it('student fixture still maps studentLunchCheckin only', () => {
    expect(selectActivityTemplate(pariStudentLunchTaskFixture).reference).toBe('studentLunchCheckin');
  });

  it('chef fixture still maps chefForecast only', () => {
    expect(selectActivityTemplate(pariChefForecastTaskFixture, 'chefForecast').reference).toBe(
      'chefForecast',
    );
  });

  it('studentLunchCheckin still emits student quantity refs', () => {
    const templates = pariStudentLunchTaskFixture.activityTemplates[0]?.linkedProperties?.map(
      (property) => property.ref,
    );
    expect(templates).toContain('mainQuantity');
    expect(templates).toContain('vegetarianQuantity');
    expect(templates).toContain('soupQuantity');
    expect(templates).toContain('dessertQuantity');
  });

  it('chefForecast still uses forecast quantity refs', () => {
    const templates = pariChefForecastTaskFixture.activityTemplates[0]?.linkedProperties?.map(
      (property) => property.ref,
    );
    expect(templates).toContain('forecastMeat');
    expect(templates).toContain('forecastVegetarian');
    expect(templates).toContain('forecastSoup');
    expect(templates).toContain('forecastDessert');
  });
});
