import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { MenuConversionResult } from './types.ts';
import type { DateShiftMetadata } from './dateShift.ts';
import { dedicatedMenuItemImagePath, categoryPlaceholderImagePath } from './imagePaths.ts';

export type MissingImageReportEntry = {
  itemId: string;
  name: string;
  category: string;
  expectedDedicatedPath: string;
  placeholderUsed: string;
};

export function scanDedicatedImageIds(publicRoot: string): Set<string> {
  const itemsDir = join(publicRoot, 'images', 'menu', 'items');
  if (!existsSync(itemsDir)) {
    return new Set();
  }
  const files = readdirSync(itemsDir);
  const ids = new Set<string>();
  for (const file of files) {
    const match = /^(.+)\.webp$/i.exec(file);
    if (match) ids.add(match[1]);
  }
  return ids;
}

export function buildMissingImagesReport(
  result: MenuConversionResult,
  dedicatedIds: Set<string>,
): MissingImageReportEntry[] {
  return result.foodCatalogue
    .map((entry) => {
      const hasDedicated = dedicatedIds.has(entry.id);
      if (hasDedicated) return null;
      return {
        itemId: entry.id,
        name: entry.name,
        category: entry.category,
        expectedDedicatedPath: `/${dedicatedMenuItemImagePath(entry.id)}`,
        placeholderUsed: `/${categoryPlaceholderImagePath(entry.category)}`,
      };
    })
    .filter((row): row is MissingImageReportEntry => row !== null)
    .sort((a, b) => a.itemId.localeCompare(b.itemId));
}

export function buildImageManifest(dedicatedIds: Set<string>, catalogueIds: string[]) {
  const manifest: Record<string, { hasDedicatedFile: boolean }> = {};
  for (const id of catalogueIds) {
    manifest[id] = { hasDedicatedFile: dedicatedIds.has(id) };
  }
  return manifest;
}

export function writeRuntimeMenuOutputs(
  repoRoot: string,
  result: MenuConversionResult,
  shift?: DateShiftMetadata,
): {
  missingImages: MissingImageReportEntry[];
  meta: {
    sourceWorkbook: string;
    generatedAt: string;
    menuVersion: string;
    dateRange: { start: string; end: string };
    dailyMenuCount: number;
    catalogueItemCount: number;
  };
} {
  const publicRoot = join(repoRoot, 'public');
  const dedicatedIds = scanDedicatedImageIds(publicRoot);
  const dates = result.dailyMenus.map((day) => day.date).sort();
  const dateRange = { start: dates[0] ?? '', end: dates[dates.length - 1] ?? '' };
  const menuVersion = `excel-${dateRange.start}-${dateRange.end}`;

  const meta = {
    sourceWorkbook: result.sourcePath,
    generatedAt: result.generatedAt,
    menuVersion,
    dateRange,
    dailyMenuCount: result.dailyMenus.length,
    catalogueItemCount: result.foodCatalogue.length,
    dateShift: shift
      ? {
          workbookStartDate: shift.workbookStartDate,
          runtimeStartDate: shift.runtimeStartDate,
          dateOffsetDays: shift.dateOffsetDays,
          workbookDateRange: shift.workbookDateRange,
          runtimeDateRange: shift.runtimeDateRange,
          runtimeEndDate: shift.runtimeEndDate,
        }
      : undefined,
  };

  const missingImages = buildMissingImagesReport(result, dedicatedIds);
  const imageManifest = buildImageManifest(
    dedicatedIds,
    result.foodCatalogue.map((entry) => entry.id),
  );

  const generatedDataDir = join(repoRoot, 'generated-data', 'menu');
  const runtimeDir = join(repoRoot, 'src', 'data', 'generated');
  mkdirSync(generatedDataDir, { recursive: true });
  mkdirSync(runtimeDir, { recursive: true });

  const catalogueForRuntime = result.foodCatalogue.map(({ sourceName: _s, ...entry }) => entry);

  writeFileSync(join(generatedDataDir, 'food-catalogue.json'), `${JSON.stringify(result.foodCatalogue, null, 2)}\n`);
  writeFileSync(join(generatedDataDir, 'daily-menus.json'), `${JSON.stringify(result.dailyMenus, null, 2)}\n`);
  writeFileSync(
    join(generatedDataDir, 'conversion-manifest.json'),
    `${JSON.stringify(
      {
        sourcePath: result.sourcePath,
        generatedAt: result.generatedAt,
        slugStrategy: result.slugStrategy,
        dailyMenuCount: result.dailyMenus.length,
        catalogueItemCount: result.foodCatalogue.length,
        dateRange,
        menuVersion,
        dateShift: shift ?? undefined,
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(join(generatedDataDir, 'missing-images.json'), `${JSON.stringify(missingImages, null, 2)}\n`);

  writeFileSync(join(runtimeDir, 'food-catalogue.json'), `${JSON.stringify(catalogueForRuntime, null, 2)}\n`);
  writeFileSync(join(runtimeDir, 'daily-menus.json'), `${JSON.stringify(result.dailyMenus, null, 2)}\n`);
  writeFileSync(join(runtimeDir, 'menu-meta.json'), `${JSON.stringify(meta, null, 2)}\n`);
  writeFileSync(join(runtimeDir, 'image-manifest.json'), `${JSON.stringify(imageManifest, null, 2)}\n`);
  writeFileSync(
    join(runtimeDir, 'README.md'),
    `# Generated runtime menu data

Do not edit these JSON files manually.

Regenerate with \`npm run menu:convert\` from \`reference/Example_menu.xlsx\`.
`,
  );

  return { missingImages, meta };
}

export function repoRootFromModule(moduleUrl: string): string {
  return resolve(dirname(moduleUrl), '../..');
}
