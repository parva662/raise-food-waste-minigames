import { formatInTimeZone } from 'date-fns-tz';
import type { MenuSlot } from './constants';

export type MenuPipelineErrorCode =
  | 'MISSING_HEADER'
  | 'MISSING_ITEM_NAME'
  | 'DUPLICATE_EXPLICIT_ID'
  | 'DUPLICATE_SLUG'
  | 'UNSUPPORTED_CATEGORY'
  | 'INVALID_DATE'
  | 'INVALID_WEEK'
  | 'INVALID_ROW_GROUP'
  | 'MERGED_CELLS'
  | 'UNSUPPORTED_SHEET';

export class MenuPipelineError extends Error {
  readonly code: MenuPipelineErrorCode;
  readonly sheet?: string;
  readonly row?: number;

  constructor(message: string, code: MenuPipelineErrorCode, sheet?: string, row?: number) {
    super(message);
    this.name = 'MenuPipelineError';
    this.code = code;
    this.sheet = sheet;
    this.row = row;
  }
}

export type WorkbookInspectionSheet = {
  name: string;
  usedRange: string | null;
  mergeCount: number;
  headerRow: string[];
  rowCount: number;
  weekNumber: number | null;
  weekValid: boolean;
  notes: string[];
};

export type WorkbookInspectionReport = {
  sourcePath: string;
  sheetNames: string[];
  sheets: WorkbookInspectionSheet[];
  mappingStatus: 'mappable' | 'unresolved';
  unresolved: string[];
  slotOrderPerDay: MenuSlot[];
  languagesDetected: string[];
  hasExplicitItemIdColumn: boolean;
  hasFormulas: boolean;
};

export type FoodCatalogueEntry = {
  id: string;
  name: string;
  category: 'classic' | 'vegetarian' | 'soup' | 'dessert';
  unit: string;
  maxQuantity: number;
  image: string;
  dietaryTags: string[];
  sourceName: string;
};

export type DailyMenuSlotEntry = {
  slot: MenuSlot;
  itemId: string;
  name: string;
  forecastQuantity: number;
  closed: boolean;
};

export type DailyMenuRecord = {
  date: string;
  sheetWeek: number;
  slots: DailyMenuSlotEntry[];
  closed: boolean;
};

export type MenuConversionResult = {
  sourcePath: string;
  generatedAt: string;
  slugStrategy: string;
  foodCatalogue: FoodCatalogueEntry[];
  dailyMenus: DailyMenuRecord[];
};

export function excelValueToIsoDate(value: unknown, timezone: string): string {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new MenuPipelineError('Invalid DATE cell', 'INVALID_DATE');
    }
    return formatInTimeZone(value, timezone, 'yyyy-MM-dd');
  }
  if (typeof value === 'number') {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(epoch.getTime() + value * 86_400_000);
    return formatInTimeZone(date, timezone, 'yyyy-MM-dd');
  }
  const text = String(value).trim();
  if (!text) {
    throw new MenuPipelineError('Empty DATE cell', 'INVALID_DATE');
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    throw new MenuPipelineError(`Invalid DATE value "${text}"`, 'INVALID_DATE');
  }
  return formatInTimeZone(parsed, timezone, 'yyyy-MM-dd');
}
