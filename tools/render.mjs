// Renders each film frame by frame (deterministic: every frame is a function of t) and encodes WebM.
// Usage: node tools/render.mjs [A1 B2 ...]   (no args = all)   Needs Playwright (from apps/realifyai) and its bundled ffmpeg.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire('/Users/yashasri/realify-app/apps/realifyai/package.json');
const { chromium } = require('playwright');
const FFMPEG = path.join(os.homedir(), 'Library/Caches/ms-playwright/ffmpeg-1013/ffmpeg-mac');
const FPS = 24;
// id: [duration seconds, poster time]
const FILMS = { A1: [30, 21], A2: [30, 23], A3: [28, 22], B1: [32, 24], B2: [30, 24], B3: [30, 21], B4: [28, 21], C1: [32, 25], C2: [28, 15], D1: [32, 29], D2: [30, 23] };
const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(FILMS);

async function renderOne(browser, id) {
  const [dur, poster] = FILMS[id];
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('file://' + path.join(ROOT, 'film/film.html') + '?id=' + id);
  await page.evaluate(() => document.fonts.ready);
  const real = await page.evaluate(() => window.__DUR);
  if (real !== dur) throw new Error(`${id}: scene says ${real}s, config says ${dur}s`);
  const out = path.join(ROOT, 'v', `${id}.webm`);
  // Playwright's bundled ffmpeg is a minimal build: JPEG frames in over a pipe, VP9 WebM out.
  const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '/dev/stdin',
    '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '30', '-deadline', 'good', '-cpu-used', '4', '-row-mt', '1', '-pix_fmt', 'yuv420p', '-an', out]);
  let err = ''; ff.stderr.on('data', (d) => { err += d; }); ff.stdin.on('error', () => {});
  const closed = new Promise((res) => ff.on('close', res));
  const n = Math.round(dur * FPS);
  for (let k = 0; k < n; k++) {
    await page.evaluate((t) => window.__render(t), k / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (ff.exitCode !== null) break;
    if (!ff.stdin.write(buf)) await new Promise((r) => { ff.stdin.once('drain', r); ff.once('close', r); });
  }
  ff.stdin.end();
  const code = await closed;
  if (code !== 0) throw new Error(`${id}: ffmpeg failed\n${err.slice(-800)}`);
  await page.evaluate((t) => window.__render(t), poster);
  await page.screenshot({ path: path.join(ROOT, 'v', `${id}.jpg`), type: 'jpeg', quality: 90 });
  await page.close();
  console.log(id, `${dur}s`, (statSync(out).size / 1e6).toFixed(2) + ' MB');
}

const browser = await chromium.launch();
const queue = [...ids];
await Promise.all(Array.from({ length: 4 }, async () => { while (queue.length) { const id = queue.shift(); await renderOne(browser, id); } }));
await browser.close();
