export type GeneratedCatalogueEntry = {
  id: string;
  name: string;
  category: 'classic' | 'vegetarian' | 'soup' | 'dessert';
  unit: string;
  maxQuantity: number;
  image: string;
  dietaryTags: string[];
  sourceName?: string;
};

export type GeneratedDailyMenuSlot = {
  slot: 'main' | 'vegetarian' | 'soup' | 'dessert';
  itemId: string;
  name: string;
  forecastQuantity: number;
  closed: boolean;
};

export type GeneratedDailyMenu = {
  date: string;
  sheetWeek: number;
  slots: GeneratedDailyMenuSlot[];
  closed: boolean;
};

export type GeneratedMenuMeta = {
  sourceWorkbook: string;
  generatedAt: string;
  menuVersion: string;
  dateRange: { start: string; end: string };
  dailyMenuCount: number;
  catalogueItemCount: number;
  dateShift?: {
    workbookStartDate: string;
    runtimeStartDate: string;
    dateOffsetDays: number;
    workbookDateRange: { start: string; end: string };
    runtimeDateRange: { start: string; end: string };
    runtimeEndDate: string;
  };
};

export type ImageManifestEntry = {
  hasDedicatedFile: boolean;
};

export type ImageManifest = Record<string, ImageManifestEntry>;
