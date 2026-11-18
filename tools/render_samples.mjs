// HTML -> PDF and PNG for the two sample documents. Needs Playwright (from apps/realifyai).
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire('/Users/yashasri/realify-app/apps/realifyai/package.json');
const { chromium } = require('playwright');
const DOCS = [['audit', 'Realify-24-hour-audit-sample'], ['note', 'Realify-weekly-client-note-sample']];
const browser = await chromium.launch();
for (const [name, pdf] of DOCS) {
  const page = await browser.newPage({ viewport: { width: 816, height: 1056 }, deviceScaleFactor: 1.5 });
  await page.goto('file://' + path.join(ROOT, 'samples', name + '.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(ROOT, 'samples', name + '.png') });
  await page.pdf({ path: path.join(ROOT, 'samples', pdf + '.pdf'), width: '8.5in', height: '11in', printBackground: true });
  await page.close();
  console.log(name, 'ok');
}
await browser.close();
