/**
 * Local-harness browser acceptance for the complete Kitchen Skills student journey.
 * Synthetic GameBus TASK + empty self-feed. Posts are recorded, never persisted.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(
  __dirname,
  '..',
  'docs',
  'product',
  'screenshots',
  'kitchen-skills-single-recipe',
);
const challengeBase = 'http://localhost:5180/local-preview/kitchen-skills-challenge-harness.html';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tid = (id) => `[data-testid="${id}"]`;

const checks = [];

function record(name, ok, detail = '') {
  checks.push({ name, ok, detail });
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`${mark}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function expectOk(name, actual, expected) {
  const ok = actual === expected;
  record(name, ok, ok ? String(actual) : `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  if (!ok) throw new Error(`Check failed: ${name}`);
}

async function expectTrue(name, actual, detail = '') {
  record(name, Boolean(actual), detail);
  if (!actual) throw new Error(`Check failed: ${name}`);
}

async function open(page, width, height, url) {
  await page.setViewportSize({ width, height });
  await page.goto(url);
  const app = page.frameLocator('#app');
  await sleep(600);
  return app;
}

async function shot(page, name) {
  await page.evaluate(() => {
    const frame = document.getElementById('app');
    if (frame?.contentDocument) {
      frame.style.height = `${frame.contentDocument.documentElement.scrollHeight}px`;
    }
  });
  await sleep(200);
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true });
  await page.evaluate(() => {
    const frame = document.getElementById('app');
    if (frame) frame.style.height = '';
  });
}

async function selectOption(app, inputTestId, optionName) {
  const input = app.locator(tid(inputTestId));
  await input.click();
  await input.fill('');
  await input.type(optionName.slice(0, 12), { delay: 20 });
  await app.getByRole('option', { name: optionName }).click();
}

async function fillGrams(app, testId, value) {
  await app.locator(tid(`${testId}-unit-g`)).click();
  await app.locator(tid(testId)).fill(value);
}

async function recordTrim(app, ingredientName, actualWasteGrams) {
  await selectOption(app, 'kitchen-day-ingredient-name', ingredientName);
  await app.getByRole('button', { name: 'Continue' }).click();
  await app.locator(tid('kitchen-day-starting-weight')).fill('1.5');
  await app.locator(tid('kitchen-day-weight-continue')).click();
  await app.locator(tid('kitchen-day-technique-trimming')).click();
  await app.locator(tid('kitchen-day-technique-continue')).click();
  await fillGrams(app, 'kitchen-day-estimated-waste', '300');
  await app.locator(tid('kitchen-day-estimate-continue')).click();
  await app.locator(tid('kitchen-day-start-preparation')).click();
  await sleep(400);
  await app.locator(tid('kitchen-day-finish-preparation')).click();
  await app.locator(tid('kitchen-day-timer-continue')).click();
  await fillGrams(app, 'kitchen-day-actual-waste', actualWasteGrams);
  await app.locator(tid('kitchen-day-submit-trim')).click();
  await app.locator(tid('kitchen-day-trim-step-result')).waitFor();
}

async function readPosts(page) {
  return page.evaluate(() => window.__challengePosts ?? []);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const actor = `accept-journey-${Date.now()}`;
  const url = `${challengeBase}?actor=${encodeURIComponent(actor)}`;
  const browser = await chromium.launch();
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await context.newPage();

  try {
    const app = await open(page, 1200, 900, url);
    await app.locator(tid('kitchen-day-portion')).waitFor();
    await selectOption(app, 'kitchen-day-recipe-select', 'Hedelmät M,G');

    await expectOk(
      'kg default on Portion mass field',
      await app.locator(tid('kitchen-day-actual-banaani-unit-kg')).getAttribute('aria-pressed'),
      'true',
    );
    await app.locator(tid('kitchen-day-actual-banaani-unit-g')).click();
    await expectOk(
      'g is selectable on Portion mass field',
      await app.locator(tid('kitchen-day-actual-banaani-unit-g')).getAttribute('aria-pressed'),
      'true',
    );
    await app.locator(tid('kitchen-day-actual-banaani-unit-kg')).click();
    await expectOk(
      'kg remains selected after toggling back',
      await app.locator(tid('kitchen-day-actual-banaani-unit-kg')).getAttribute('aria-pressed'),
      'true',
    );

    await app.locator(tid('kitchen-day-actual-banaani')).fill('1.5');
    await app.locator(tid('kitchen-day-actual-omena')).fill('1.2');
    await app.locator(tid('kitchen-day-actual-viinirypale-tumma-kiveton')).fill('1');
    await app.locator(tid('kitchen-day-final-recipe-weight')).fill('3.7');
    await shot(page, '12-acceptance-portion-kg-g-desktop-1200');
    await app.locator(tid('kitchen-day-submit-portion')).click();
    await app.locator(tid('kitchen-day-trim')).waitFor();
    record('Portion recipe saved and Trim opened', true, 'Hedelmät M,G');

    await recordTrim(app, 'Banaani', '450');
    await app.locator(tid('kitchen-day-add-another-ingredient')).click();
    await recordTrim(app, 'Omena', '200');
    record('Trim recorded for two eligible ingredients', true, 'Banaani 450 g, Omena 200 g');

    await app.locator(tid('kitchen-day-continue-reuse')).click();
    await app.locator(tid('kitchen-day-rescue')).waitFor();
    await expectTrue(
      'Rescue starts with two pending ingredients',
      (await app.locator(tid('kitchen-day-rescue-remaining')).textContent())?.includes(
        '2 ingredients still need a reuse decision',
      ),
    );

    await fillGrams(app, 'kitchen-day-reusable-waste', '200');
    await app.locator(tid('kitchen-day-reuse-destination')).fill('Use in soup');
    await app.locator(tid('kitchen-day-save-rescue')).click();
    await app.locator(tid('kitchen-day-rescue-rescue-summary-banaani')).waitFor();
    await expectTrue(
      'Rescue remaining count drops to one after A',
      (await app.locator(tid('kitchen-day-rescue-remaining')).textContent())?.includes(
        '1 ingredient still needs a reuse decision',
      ),
    );
    await expectOk(
      'Ingredient B remains available after Rescue A',
      await app.locator(tid('kitchen-day-rescue-ingredient')).inputValue(),
      'omena',
    );
    await expectTrue(
      'Finish stays blocked after Rescue A only',
      (await app.locator(tid('kitchen-day-open-finish-summary')).count()) === 0,
    );
    await expectTrue(
      'Pending Rescue bar remains after Rescue A',
      (await app.locator(tid('kitchen-day-pending-rescue-bar')).count()) === 1,
    );
    await shot(page, '13-acceptance-rescue-after-a-desktop-1200');

    await fillGrams(app, 'kitchen-day-reusable-waste', '0');
    await app.locator(tid('kitchen-day-reuse-destination')).fill('Cannot be reused; discard');
    await app.locator(tid('kitchen-day-save-rescue')).click();
    await app.locator(tid('kitchen-day-rescue-rescue-summary-omena')).waitFor();
    await app.locator(tid('kitchen-day-open-finish-summary')).click();
    await app.locator(tid('kitchen-day-finish-summary')).waitFor();

    const banaaniRescue = await app.locator(tid('kitchen-day-finish-rescue-summary-banaani')).textContent();
    const omenaRescue = await app.locator(tid('kitchen-day-finish-rescue-summary-omena')).textContent();
    await expectTrue(
      'Finish summary includes Rescue A',
      Boolean(banaaniRescue?.includes('200 g') && banaaniRescue.includes('Use in soup')),
      banaaniRescue ?? '',
    );
    await expectTrue(
      'Finish summary includes Rescue B 0 g reusable',
      Boolean(omenaRescue?.includes('0 g reused') && omenaRescue.includes('Cannot be reused; discard')),
      omenaRescue ?? '',
    );
    await shot(page, '14-acceptance-finish-both-rescue-desktop-1200');

    await app.locator(tid('kitchen-day-finish-challenge')).click();
    await app.locator(tid('kitchen-day-finished')).waitFor();
    const posts = await readPosts(page);
    const exitCount = posts.filter((item) => item?.type === 'EXIT').length;
    const templates = posts
      .filter((item) => item?.type === 'SILENT_ACTIVITY')
      .map((item) => item?.data?.template);
    await expectOk('EXIT dispatched after Finish', exitCount, 1);
    await expectTrue(
      'Harness recorded Portion, two Trim, and two Rescue posts',
      templates.filter((name) => name === 'portionPrecision').length === 1 &&
        templates.filter((name) => name === 'trimSmart').length === 2 &&
        templates.filter((name) => name === 'rescueAndReuse').length === 2,
      templates.join(', '),
    );
    await shot(page, '15-acceptance-finished-desktop-1200');

    const app2 = await open(page, 1200, 900, url);
    await app2.locator(tid('kitchen-day-recipe-select')).waitFor();
    await expectTrue(
      'Reopen after Finish is a new attempt (recipe select, not resumed)',
      (await app2.locator(tid('kitchen-day-resumed')).count()) === 0 &&
        (await app2.locator(tid('kitchen-day-recipe-select')).count()) === 1,
    );
    await shot(page, '16-acceptance-reopen-new-attempt-desktop-1200');
    record(
      'Harness posts are not live GameBus persistence',
      true,
      'synthetic TASK + empty self-feed; no ACK',
    );
  } finally {
    const result = {
      harness: challengeBase,
      actorPrefix: 'accept-journey-*',
      liveGameBusPersistence: false,
      checks,
      passed: checks.every((item) => item.ok),
      screenshots: [
        '12-acceptance-portion-kg-g-desktop-1200.png',
        '13-acceptance-rescue-after-a-desktop-1200.png',
        '14-acceptance-finish-both-rescue-desktop-1200.png',
        '15-acceptance-finished-desktop-1200.png',
        '16-acceptance-reopen-new-attempt-desktop-1200.png',
      ],
    };
    await writeFile(path.join(outDir, 'acceptance-journey.json'), JSON.stringify(result, null, 2));
    await browser.close();
    if (!result.passed) process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
