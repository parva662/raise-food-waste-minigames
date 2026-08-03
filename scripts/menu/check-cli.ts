import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateConversion, type MenuConversionResult } from './workbook.ts';
import { buildImageManifest, scanDedicatedImageIds } from './runtimeMenu.ts';
import { categoryPlaceholderImagePath, dedicatedMenuItemImagePath } from './imagePaths.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const generatedDir = resolve(root, 'generated-data/menu');
const runtimeDir = resolve(root, 'src/data/generated');
const publicRoot = resolve(root, 'public');

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

const requiredGenerated = ['food-catalogue.json', 'daily-menus.json', 'conversion-manifest.json', 'missing-images.json'];
const requiredRuntime = ['food-catalogue.json', 'daily-menus.json', 'menu-meta.json', 'image-manifest.json'];

for (const file of requiredGenerated) {
  if (!existsSync(resolve(generatedDir, file))) {
    console.error(`Missing generated-data file: ${file}. Run npm run menu:convert.`);
    process.exit(1);
  }
}

for (const file of requiredRuntime) {
  if (!existsSync(resolve(runtimeDir, file))) {
    console.error(`Missing runtime file src/data/generated/${file}. Run npm run menu:convert.`);
    process.exit(1);
  }
}

const foodCatalogue = readJson<MenuConversionResult['foodCatalogue']>(resolve(generatedDir, 'food-catalogue.json'));
const dailyMenus = readJson<MenuConversionResult['dailyMenus']>(resolve(generatedDir, 'daily-menus.json'));
const runtimeCatalogue = readJson<typeof foodCatalogue>(resolve(runtimeDir, 'food-catalogue.json'));
const runtimeDaily = readJson<typeof dailyMenus>(resolve(runtimeDir, 'daily-menus.json'));
const manifest = readJson<{ dateRange?: { start: string; end: string }; menuVersion?: string }>(
  resolve(generatedDir, 'conversion-manifest.json'),
);

const result: MenuConversionResult = {
  sourcePath: manifest.dateRange ? 'synced' : 'unknown',
  generatedAt: new Date(0).toISOString(),
  slugStrategy: '',
  foodCatalogue,
  dailyMenus,
};

const errors = validateConversion(result);

const catalogueIds = new Set(foodCatalogue.map((entry) => entry.id));
if (catalogueIds.size !== foodCatalogue.length) {
  errors.push('Duplicate catalogue item IDs detected');
}

const dates = new Set<string>();
for (const day of dailyMenus) {
  if (dates.has(day.date)) {
    errors.push(`Duplicate daily menu date ${day.date}`);
  }
  dates.add(day.date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date)) {
    errors.push(`Invalid date ${day.date}`);
  }
  if (day.slots.length !== 4) {
    errors.push(`Daily menu ${day.date} must have exactly 4 slots`);
  }
  for (const slot of day.slots) {
    if (!catalogueIds.has(slot.itemId) && !slot.closed && !slot.itemId.startsWith('closed-')) {
      errors.push(`Daily menu ${day.date} slot ${slot.slot} references unknown item ${slot.itemId}`);
    }
    const entry = foodCatalogue.find((item) => item.id === slot.itemId);
    if (entry && !entry.category) {
      errors.push(`Catalogue item ${slot.itemId} missing category`);
    }
  }
}

if (JSON.stringify(runtimeCatalogue) !== JSON.stringify(foodCatalogue.map(({ sourceName, ...rest }) => rest))) {
  errors.push('Runtime food-catalogue.json is out of sync with generated-data/menu/food-catalogue.json');
}

if (JSON.stringify(runtimeDaily) !== JSON.stringify(dailyMenus)) {
  errors.push('Runtime daily-menus.json is out of sync with generated-data/menu/daily-menus.json');
}

const dedicatedIds = scanDedicatedImageIds(publicRoot);
const imageManifest = buildImageManifest(dedicatedIds, [...catalogueIds]);

for (const entry of foodCatalogue) {
  if (!entry.id || !entry.name) {
    errors.push(`Catalogue item missing id or name`);
  }
  const placeholder = categoryPlaceholderImagePath(entry.category);
  const dedicated = dedicatedMenuItemImagePath(entry.id);
  if (!placeholder || !dedicated) {
    errors.push(`Image path resolution failed for ${entry.id}`);
  }
  const hasDedicated = imageManifest[entry.id]?.hasDedicatedFile === true;
  if (!hasDedicated && !placeholder) {
    errors.push(`No placeholder for category ${entry.category}`);
  }
}

const runtimeManifest = readJson<typeof imageManifest>(resolve(runtimeDir, 'image-manifest.json'));
if (JSON.stringify(runtimeManifest) !== JSON.stringify(imageManifest)) {
  errors.push('Runtime image-manifest.json is out of sync with public/images/menu/items scan');
}

if (errors.length > 0) {
  console.error('Validation failed:');
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

console.log('Generated menu data validated successfully.');
