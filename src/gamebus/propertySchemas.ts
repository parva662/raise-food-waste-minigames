/**
 * Proposed JSON Schemas for GameBus property templates (admin migration).
 * ACTIVITY payload uses shape B: { template, obj: { value: <schema value> } }.
 */
export const STUDENT_LUNCH_CHECKIN_PROPERTY_SCHEMAS = {
  targetDate: {
    reference: 'targetDate',
    displayName: 'Target date',
    activityLinkRequired: true,
    schema: { type: 'string', format: 'date' },
    example: { value: '2026-07-29' },
  },
  mealType: {
    reference: 'mealType',
    displayName: 'Meal type',
    activityLinkRequired: true,
    schema: { type: 'string', enum: ['regular', 'soup', 'no_lunch'] },
    example: { value: 'regular' },
  },
  mainItemId: {
    reference: 'mainItemId',
    displayName: 'Main dish id',
    activityLinkRequired: false,
    schema: { type: 'string', minLength: 1 },
    example: { value: 'chicken-steak-with-pesto-sauce-and-pasta' },
  },
  mainQuantity: {
    reference: 'mainQuantity',
    displayName: 'Main quantity',
    activityLinkRequired: true,
    schema: { type: 'integer', minimum: 0, maximum: 6 },
    example: { value: 2 },
  },
  vegetarianItemId: {
    reference: 'vegetarianItemId',
    displayName: 'Vegetarian dish id',
    activityLinkRequired: false,
    schema: { type: 'string', minLength: 1 },
    example: { value: 'chickpea-and-apricot-stew-with-pasta' },
  },
  vegetarianQuantity: {
    reference: 'vegetarianQuantity',
    displayName: 'Vegetarian quantity',
    activityLinkRequired: true,
    schema: { type: 'integer', minimum: 0, maximum: 6 },
    example: { value: 0 },
  },
  soupItemId: {
    reference: 'soupItemId',
    displayName: 'Soup id',
    activityLinkRequired: false,
    schema: { type: 'string', minLength: 1 },
    example: { value: 'pike-fish-ball-soup' },
  },
  soupQuantity: {
    reference: 'soupQuantity',
    displayName: 'Soup quantity',
    activityLinkRequired: true,
    schema: { type: 'integer', minimum: 0, maximum: 6 },
    example: { value: 1 },
  },
  dessertItemId: {
    reference: 'dessertItemId',
    displayName: 'Dessert id',
    activityLinkRequired: false,
    schema: { type: 'string', minLength: 1 },
    example: { value: 'mango-and-pear-lassi' },
  },
  dessertQuantity: {
    reference: 'dessertQuantity',
    displayName: 'Dessert quantity',
    activityLinkRequired: true,
    schema: { type: 'integer', minimum: 0, maximum: 6 },
    example: { value: 0 },
  },
  timingStatus: {
    reference: 'timingStatus',
    displayName: 'Timing status',
    activityLinkRequired: true,
    schema: { type: 'string', enum: ['on-time', 'late'] },
    example: { value: 'on-time' },
  },
  submittedAt: {
    reference: 'submittedAt',
    displayName: 'Submitted at',
    activityLinkRequired: true,
    schema: { type: 'string', format: 'date-time' },
    example: { value: '2026-07-28T12:00:00.000Z' },
  },
} as const;

/** Admin migration from live seven-property template to final twelve-property template. */
export const STUDENT_LUNCH_CHECKIN_ADMIN_MIGRATION = [
  { current: 'targetDate', action: 'reuse', final: 'targetDate' },
  { current: 'submittedAt', action: 'reuse', final: 'submittedAt' },
  { current: 'comingStatus', action: 'replace', final: 'mealType' },
  { current: 'selectedMain', action: 'replace', final: 'mainItemId + mainQuantity' },
  {
    current: 'selectedVegetarianOrNoVeg',
    action: 'replace',
    final: 'vegetarianItemId + vegetarianQuantity',
  },
  { current: 'selectedSoupOrNoSoup', action: 'replace', final: 'soupItemId + soupQuantity' },
  {
    current: 'selectedDessertOrNoDessert',
    action: 'replace',
    final: 'dessertItemId + dessertQuantity',
  },
  { current: null, action: 'add', final: 'timingStatus' },
] as const;
