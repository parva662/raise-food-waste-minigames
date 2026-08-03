import XLSX, { type WorkSheet } from 'xlsx';

const { readFile, utils } = XLSX;
import {
  CLOSED_ITEM_NAME,
  MENU_HEADER_LABELS,
  MENU_SLOT_ORDER,
  SHEET_WEEK_PATTERN,
} from './constants';
import { normalizeCellText, slugFromMenuItemName } from './normalize';
import {
  excelValueToIsoDate,
  MenuPipelineError,
  type DailyMenuRecord,
  type DailyMenuSlotEntry,
  type FoodCatalogueEntry,
  type MenuConversionResult,
  type WorkbookInspectionReport,
  type WorkbookInspectionSheet,
} from './types';

const TIMEZONE = 'Europe/Helsinki';

export type RawMenuRow = {
  sheet: string;
  rowNumber: number;
  name: string;
  quantity: number;
  dateIso: string;
  explicitId?: string;
};

function readSheetRows(
  sheetName: string,
  worksheet: WorkSheet,
): { header: string[]; rows: RawMenuRow[] } {
  if (worksheet['!merges'] && worksheet['!merges'].length > 0) {
    throw new MenuPipelineError(
      'Merged cells are not supported on menu sheets',
      'MERGED_CELLS',
      sheetName,
    );
  }

  const ref = worksheet['!ref'];
  if (!ref) {
    throw new MenuPipelineError('Sheet has no used range', 'MISSING_HEADER', sheetName);
  }

  const matrix = utils.sheet_to_json<(string | number | Date)[]>(worksheet, {
    header: 1,
    defval: '',
    raw: true,
  });

  if (matrix.length === 0) {
    throw new MenuPipelineError('Sheet is empty', 'MISSING_HEADER', sheetName);
  }

  const header = matrix[0].map((cell) => normalizeCellText(cell).toUpperCase());
  for (let i = 0; i < MENU_HEADER_LABELS.length; i += 1) {
    const expected = MENU_HEADER_LABELS[i];
    if (header[i] !== expected) {
      throw new MenuPipelineError(
        `Expected header column ${i + 1} "${expected}", got "${header[i] ?? ''}"`,
        'MISSING_HEADER',
        sheetName,
        1,
      );
    }
  }

  const explicitIdColumn = header.findIndex((h) => h === 'ID' || h === 'ITEM ID');
  const rows: RawMenuRow[] = [];

  for (let index = 1; index < matrix.length; index += 1) {
    const line = matrix[index];
    const rowNumber = index + 1;
    const name = normalizeCellText(line[0]);
    const quantityRaw = line[1];
    const dateRaw = line[2];

    if (!name && (quantityRaw === '' || quantityRaw === undefined) && !dateRaw) {
      continue;
    }

    if (!name) {
      throw new MenuPipelineError('MENU ITEMS name is required', 'MISSING_ITEM_NAME', sheetName, rowNumber);
    }

    const quantity =
      typeof quantityRaw === 'number'
        ? quantityRaw
        : Number.parseInt(normalizeCellText(quantityRaw), 10);
    if (Number.isNaN(quantity)) {
      throw new MenuPipelineError('QUANTITY must be a number', 'UNSUPPORTED_CATEGORY', sheetName, rowNumber);
    }

    const dateIso = excelValueToIsoDate(dateRaw, TIMEZONE);
    const explicitId =
      explicitIdColumn >= 0 ? normalizeCellText(line[explicitIdColumn]) || undefined : undefined;

    rows.push({ sheet: sheetName, rowNumber, name, quantity, dateIso, explicitId });
  }

  return { header: header.slice(0, 3), rows };
}

function parseWeekNumber(sheetName: string): number | null {
  const match = SHEET_WEEK_PATTERN.exec(sheetName.trim());
  if (!match) return null;
  const week = Number.parseInt(match[1], 10);
  return Number.isFinite(week) ? week : null;
}

function detectFormulas(worksheet: WorkSheet): boolean {
  const ref = worksheet['!ref'];
  if (!ref) return false;
  const range = utils.decode_range(ref);
    for (let r = range.s.r; r <= range.e.r; r += 1) {
    for (let c = range.s.c; c <= range.e.c; c += 1) {
      const addr = utils.encode_cell({ r, c });
      const cell = worksheet[addr] as { f?: string } | undefined;
      if (cell?.f) return true;
    }
  }
  return false;
}

export function inspectWorkbookFile(filePath: string): WorkbookInspectionReport {
  const workbook = readFile(filePath, { cellDates: true, cellFormula: true });
  const sheets: WorkbookInspectionSheet[] = [];
  const unresolved: string[] = [];
  let hasFormulas = false;
  let hasExplicitItemIdColumn = false;

  for (const name of workbook.SheetNames) {
    const ws = workbook.Sheets[name];
    const weekNumber = parseWeekNumber(name);
    const weekValid = weekNumber !== null && weekNumber > 0;
    const notes: string[] = [];

    if (!weekValid) {
      notes.push('Sheet name does not match "Week <n>" pattern');
      unresolved.push(`Sheet "${name}": week label not parseable`);
    }

    if (ws['!merges']?.length) {
      unresolved.push(`Sheet "${name}": contains ${ws['!merges'].length} merged cell range(s)`);
    }

    if (detectFormulas(ws)) {
      hasFormulas = true;
      notes.push('Contains formula cells');
    }

    let headerRow: string[] = [];
    let rowCount = 0;
    try {
      const parsed = readSheetRows(name, ws);
      headerRow = parsed.header;
      rowCount = parsed.rows.length;
      hasExplicitItemIdColumn =
        hasExplicitItemIdColumn ||
        utils
          .sheet_to_json<string[]>(ws, { header: 1, defval: '' })[0]
          ?.some((h) => normalizeCellText(h).toUpperCase() === 'ID') === true;
    } catch (error) {
      if (error instanceof MenuPipelineError) {
        unresolved.push(`Sheet "${name}" row ${error.row ?? '?'}: ${error.message}`);
      } else {
        unresolved.push(`Sheet "${name}": ${(error as Error).message}`);
      }
    }

    sheets.push({
      name,
      usedRange: ws['!ref'] ?? null,
      mergeCount: ws['!merges']?.length ?? 0,
      headerRow,
      rowCount,
      weekNumber,
      weekValid,
      notes,
    });
  }

  const strictUnresolved = unresolved.filter((u) => !u.includes('formula'));
  return {
    sourcePath: filePath,
    sheetNames: workbook.SheetNames,
    sheets,
    mappingStatus: strictUnresolved.length === 0 ? 'mappable' : 'unresolved',
    unresolved,
    slotOrderPerDay: [...MENU_SLOT_ORDER],
    languagesDetected: ['en'],
    hasExplicitItemIdColumn,
    hasFormulas,
  };
}

function groupRowsByDate(rows: RawMenuRow[]): Map<string, RawMenuRow[]> {
  const groups = new Map<string, RawMenuRow[]>();
  for (const row of rows) {
    const list = groups.get(row.dateIso) ?? [];
    list.push(row);
    groups.set(row.dateIso, list);
  }
  return groups;
}

export function convertWorkbookFile(filePath: string): MenuConversionResult {
  const workbook = readFile(filePath, { cellDates: true, cellFormula: true });
  const catalogueById = new Map<string, FoodCatalogueEntry>();
  const slugOwners = new Map<string, string>();
  const explicitIds = new Set<string>();
  const dailyMenus: DailyMenuRecord[] = [];

  for (const sheetName of workbook.SheetNames) {
    const weekNumber = parseWeekNumber(sheetName);
    if (weekNumber === null || weekNumber <= 0) {
      throw new MenuPipelineError(
        `Unsupported sheet name "${sheetName}" (expected Week <number>)`,
        'INVALID_WEEK',
        sheetName,
      );
    }

    const ws = workbook.Sheets[sheetName];
    const { rows } = readSheetRows(sheetName, ws);
    const byDate = groupRowsByDate(rows);

    for (const [dateIso, dayRows] of byDate) {
      if (dayRows.length !== MENU_SLOT_ORDER.length) {
        const firstRow = dayRows[0]?.rowNumber ?? 0;
        throw new MenuPipelineError(
          `Expected ${MENU_SLOT_ORDER.length} menu rows for ${dateIso}, found ${dayRows.length}`,
          'INVALID_ROW_GROUP',
          sheetName,
          firstRow,
        );
      }

      const slots: DailyMenuSlotEntry[] = [];
      let dayClosed = true;

      for (let slotIndex = 0; slotIndex < MENU_SLOT_ORDER.length; slotIndex += 1) {
        const slot = MENU_SLOT_ORDER[slotIndex];
        const row = dayRows[slotIndex];
        const closed = row.name.toUpperCase() === CLOSED_ITEM_NAME;
        if (!closed) {
          dayClosed = false;
        }

        let itemId = row.explicitId;
        if (itemId) {
          if (explicitIds.has(itemId)) {
            throw new MenuPipelineError(
              `Duplicate explicit item ID "${itemId}"`,
              'DUPLICATE_EXPLICIT_ID',
              sheetName,
              row.rowNumber,
            );
          }
          explicitIds.add(itemId);
        } else if (!closed) {
          itemId = slugFromMenuItemName(row.name);
          const priorName = slugOwners.get(itemId);
          if (priorName && priorName !== row.name) {
            throw new MenuPipelineError(
              `Duplicate generated slug "${itemId}" for "${row.name}" and "${priorName}"`,
              'DUPLICATE_SLUG',
              sheetName,
              row.rowNumber,
            );
          }
          slugOwners.set(itemId, row.name);
        } else {
          itemId = `closed-${dateIso}-${slot}`;
        }

        if (!closed) {
          const category =
            slot === 'main'
              ? 'classic'
              : slot === 'vegetarian'
                ? 'vegetarian'
                : slot === 'soup'
                  ? 'soup'
                  : 'dessert';

          if (!catalogueById.has(itemId)) {
            catalogueById.set(itemId, {
              id: itemId,
              name: row.name,
              category,
              unit: slot === 'main' ? 'pieces' : slot === 'vegetarian' ? 'portion' : slot === 'soup' ? 'cups' : 'pieces',
              maxQuantity: slot === 'main' ? 6 : slot === 'vegetarian' ? 3 : 2,
              image: '',
              dietaryTags: category === 'vegetarian' ? ['vegetarian'] : category === 'classic' ? ['meat'] : [],
              sourceName: row.name,
            });
          }
        }

        slots.push({
          slot,
          itemId,
          name: row.name,
          forecastQuantity: row.quantity,
          closed,
        });
      }

      dailyMenus.push({
        date: dateIso,
        sheetWeek: weekNumber,
        slots,
        closed: dayClosed,
      });
    }
  }

  dailyMenus.sort((a, b) => a.date.localeCompare(b.date) || a.sheetWeek - b.sheetWeek);

  return {
    sourcePath: filePath,
    generatedAt: new Date().toISOString(),
    slugStrategy:
      'slugFromMenuItemName: NFKD normalize, lowercase, non-alphanumeric to hyphen, max 80 chars',
    foodCatalogue: [...catalogueById.values()].sort((a, b) => a.id.localeCompare(b.id)),
    dailyMenus,
  };
}

export function validateConversion(result: MenuConversionResult): string[] {
  const errors: string[] = [];
  const ids = new Set(result.foodCatalogue.map((e) => e.id));

  for (const day of result.dailyMenus) {
    for (const slot of day.slots) {
      if (slot.closed) continue;
      if (!ids.has(slot.itemId)) {
        errors.push(`Daily menu ${day.date} slot ${slot.slot} references unknown item id ${slot.itemId}`);
      }
    }
  }

  return errors;
}

export { readSheetRows, utils };
export { MenuPipelineError } from './types';
export type { MenuConversionResult, WorkbookInspectionReport } from './types';
