/**
 * Local-only visual evidence for the one-recipe Kitchen Skills workflow.
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
const trainerBase = 'http://localhost:5180/local-preview/kitchen-skills-trainer-harness.html';
const overflow = {};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tid = (id) => `[data-testid="${id}"]`;

async function open(page, width, height, url) {
  await page.setViewportSize({ width, height });
  await page.goto(url);
  const app = page.frameLocator('#app');
  await sleep(600);
  return app;
}

async function measure(page, name) {
  const result = await page.evaluate(() => {
    const doc = document.getElementById('app')?.contentDocument;
    if (!doc) return { error: 'no iframe' };
    const width = doc.documentElement.clientWidth;
    const offenders = [];
    for (const el of doc.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > width + 1 || r.left < -1)) {
        const style = getComputedStyle(el);
        if (style.position === 'fixed' || el.closest('.visually-hidden, .sr-only')) continue;
        offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} right=${Math.round(r.right)}`);
      }
    }
    return { width, scrollWidth: doc.documentElement.scrollWidth, offenders: offenders.slice(0, 8) };
  });
  overflow[name] = result;
  return result;
}

async function shot(page, name, { full = true } = {}) {
  await measure(page, name);
  if (full) {
    await page.evaluate(() => {
      const frame = document.getElementById('app');
      if (frame?.contentDocument) {
        frame.style.height = `${frame.contentDocument.documentElement.scrollHeight}px`;
      }
    });
    await sleep(200);
  }
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: full });
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

async function fillHedelmat(app) {
  await app.locator(tid('kitchen-day-recipe-select')).waitFor();
  await selectOption(app, 'kitchen-day-recipe-select', 'Hedelmät M,G');
  await app.locator(tid('kitchen-day-actual-banaani-unit-kg')).click();
  await app.locator(tid('kitchen-day-actual-banaani')).fill('1.5');
  await app.locator(tid('kitchen-day-actual-omena')).fill('1200');
  await app.locator(tid('kitchen-day-actual-viinirypale-tumma-kiveton')).fill('1000');
  await app.locator(tid('kitchen-day-final-recipe-weight')).fill('3700');
}

async function fillMustamakkara(app) {
  await selectOption(app, 'kitchen-day-recipe-select', 'FLOW mustamakkara');
  await app.locator(tid('kitchen-day-actual-tapola-gluteeniton')).fill('1974');
  await app.locator(tid('kitchen-day-actual-kaskein-750-g-puolukka-pakaste')).fill('1316');
  await app.locator(tid('kitchen-day-actual-deliverde-500g-rucola')).fill('263');
  await app.locator(tid('kitchen-day-actual-elonen-iso-ruisvuoka-1000g')).fill('1316');
  await app.locator(tid('kitchen-day-actual-coop-kidesokeri-1-kg')).fill('132');
  await app.locator(tid('kitchen-day-final-recipe-weight')).fill('5000');
}

async function recordBanaaniTrim(app) {
  await selectOption(app, 'kitchen-day-ingredient-name', 'Banaani');
  await app.getByRole('button', { name: 'Continue' }).click();
  await app.locator(tid('kitchen-day-starting-weight')).fill('1.5');
  await app.locator(tid('kitchen-day-starting-weight-unit-kg')).click();
  await app.locator(tid('kitchen-day-weight-continue')).click();
  await app.locator(tid('kitchen-day-technique-trimming')).click();
  await app.locator(tid('kitchen-day-technique-continue')).click();
  await app.locator(tid('kitchen-day-estimated-waste')).fill('300');
  await app.locator(tid('kitchen-day-estimate-continue')).click();
  await app.locator(tid('kitchen-day-start-preparation')).click();
  await sleep(400);
  await app.locator(tid('kitchen-day-finish-preparation')).click();
  await app.locator(tid('kitchen-day-timer-continue')).click();
  await app.locator(tid('kitchen-day-actual-waste')).fill('260');
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await context.newPage();

  let app = await open(page, 1200, 900, `${challengeBase}?actor=shot-full`);
  await app.locator(tid('kitchen-day-portion')).waitFor();
  await fillHedelmat(app);
  await shot(page, '01-portion-gkg-desktop-1200');

  await app.locator(tid('kitchen-day-submit-portion')).click();
  await app.locator(tid('kitchen-day-trim')).waitFor();
  await recordBanaaniTrim(app);
  await shot(page, '02-trim-measurement-desktop-1200');

  await app.locator(tid('kitchen-day-submit-trim')).click();
  await app.locator(tid('kitchen-day-trim-step-result')).waitFor();
  await shot(page, '03-trim-result-duration-desktop-1200');

  await app.locator(tid('kitchen-day-continue-reuse')).click();
  await app.locator(tid('kitchen-day-rescue')).waitFor();
  await app.locator(tid('kitchen-day-reusable-waste')).fill('200');
  await app.locator(tid('kitchen-day-reuse-destination')).fill('Wash the peel, dry it, then use it in cake.');
  await shot(page, '04-rescue-form-desktop-1200');

  await app.locator(tid('kitchen-day-save-rescue')).click();
  await app.locator(tid('kitchen-day-open-finish-summary')).click();
  await app.locator(tid('kitchen-day-finish-summary')).waitFor();
  await shot(page, '06-finish-all-modules-desktop-1200');

  app = await open(page, 1200, 900, `${challengeBase}?actor=shot-portion`);
  await app.locator(tid('kitchen-day-portion')).waitFor();
  await fillMustamakkara(app);
  await app.locator(tid('kitchen-day-submit-portion')).click();
  await app.locator(tid('kitchen-day-open-finish-summary')).click();
  await app.locator(tid('kitchen-day-finish-portion')).waitFor();
  await shot(page, '05-finish-portion-only-desktop-1200');

  app = await open(page, 390, 844, `${challengeBase}?actor=shot-mobile`);
  await app.locator(tid('kitchen-day-portion')).waitFor();
  await fillHedelmat(app);
  await shot(page, '10-mobile-challenge-390');

  app = await open(page, 768, 1024, `${challengeBase}?actor=shot-tablet`);
  await app.locator(tid('kitchen-day-portion')).waitFor();
  await fillHedelmat(app);
  await shot(page, '10b-tablet-challenge-768');

  app = await open(page, 320, 720, `${challengeBase}?actor=shot-reflow`);
  await app.locator(tid('kitchen-day-portion')).waitFor();
  await fillHedelmat(app);
  await shot(page, '11-reflow-challenge-320');

  const portionOnly = encodeURIComponent('kitchen-day:task:staff3:2026-10-19');
  app = await open(
    page,
    1200,
    900,
    `${trainerBase}?route=${encodeURIComponent(`/kitchen-day-tutor?actorId=staff3&sessionId=${portionOnly}`)}`,
  );
  await app.locator(tid('kitchen-day-tutor-session-progress')).waitFor();
  await shot(page, '07-tutor-portion-only-desktop-1200');

  const allThree = encodeURIComponent('kitchen-day:task:staff1:2026-10-20');
  app = await open(
    page,
    1200,
    900,
    `${trainerBase}?route=${encodeURIComponent(`/kitchen-day-tutor?actorId=staff1&sessionId=${allThree}`)}`,
  );
  await app.locator(tid('kitchen-day-tutor-module-tabs')).waitFor();
  await shot(page, '08-tutor-all-modules-desktop-1200');

  app = await open(page, 1200, 900, trainerBase);
  await app.locator(tid('kitchen-day-tutor-staff-staff5')).click();
  await app.locator(tid('kitchen-day-tutor-staff-sessions')).waitFor();
  await shot(page, '09-tutor-two-same-day-attempts-desktop-1200');

  await writeFile(path.join(outDir, 'overflow-check.json'), JSON.stringify(overflow, null, 2));
  await browser.close();
  console.log(JSON.stringify(overflow, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
