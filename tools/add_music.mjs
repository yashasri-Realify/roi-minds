// Adds the music to each film: the WAV is played through WebAudio in headless Chromium and recorded to Opus by
// MediaRecorder (Playwright's bundled ffmpeg has no audio encoder), then muxed with the untouched video track
// using `-c copy`. The silent originals are kept in film/silent/. Serve this folder on :8765 first.
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire('/Users/yashasri/realify-app/apps/realifyai/package.json');
const { chromium } = require('playwright');
const FFMPEG = path.join(os.homedir(), 'Library/Caches/ms-playwright/ffmpeg-1013/ffmpeg-mac');
const IDS = process.argv.slice(2).length ? process.argv.slice(2) : ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'D1', 'D2'];
const BASE = 'http://127.0.0.1:8765';
mkdirSync(path.join(ROOT, 'film/silent'), { recursive: true });
mkdirSync(path.join(ROOT, '.audio'), { recursive: true });

async function record(browser, id) {
  const page = await browser.newPage();
  await page.goto(`${BASE}/README.md`);   // any same-origin page
  const b64 = await page.evaluate(async (url) => {
    const ctx = new AudioContext();
    await ctx.resume();
    const buf = await ctx.decodeAudioData(await (await fetch(url)).arrayBuffer());
    const dest = ctx.createMediaStreamDestination();
    const src = ctx.createBufferSource(); src.buffer = buf; src.connect(dest);
    const rec = new MediaRecorder(dest.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 160000 });
    const chunks = []; rec.ondataavailable = (e) => chunks.push(e.data);
    const done = new Promise((r) => { rec.onstop = r; });
    rec.start(); src.start(); src.onended = () => setTimeout(() => rec.stop(), 300);
    await done;
    const bytes = new Uint8Array(await new Blob(chunks).arrayBuffer());
    let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }, `${BASE}/music/${id}.wav`);
  await page.close();
  const rawAudio = path.join(ROOT, '.audio', `${id}.webm`);
  writeFileSync(rawAudio, Buffer.from(b64, 'base64'));
  const silent = path.join(ROOT, 'film/silent', `${id}.webm`);
  if (!existsSync(silent)) copyFileSync(path.join(ROOT, 'v', `${id}.webm`), silent);
  const out = path.join(ROOT, '.audio', `${id}.muxed.webm`);
  const r = spawnSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', silent, '-i', rawAudio, '-map', '0:v:0', '-map', '1:a:0', '-c', 'copy', '-shortest', out], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`${id}: mux failed\n${r.stderr.slice(-600)}`);
  renameSync(out, path.join(ROOT, 'v', `${id}.webm`));
  console.log(id, 'ok');
}

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const queue = [...IDS];
await Promise.all(Array.from({ length: 6 }, async () => { while (queue.length) { const id = queue.shift(); await record(browser, id); } }));
await browser.close();
rmSync(path.join(ROOT, '.audio'), { recursive: true, force: true });
