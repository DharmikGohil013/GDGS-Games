// Renders promo.html frame-by-frame with headless Chrome and pipes JPEGs into ffmpeg.
//   node render.mjs                -> video_noaudio.mp4 (60 s @ 30 fps, 1080x1080)
//   node render.mjs --stills 2,10  -> stills/t2.png, stills/t10.png
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const FPS = 30, DUR = 60, N = FPS * DUR;
const args = process.argv.slice(2);
const stillsArg = args.includes('--stills') ? args[args.indexOf('--stills') + 1] : null;

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--force-device-scale-factor=1', '--hide-scrollbars'],
});
const page = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.error('PAGE ERROR', e.message));
await page.goto(pathToFileURL(path.join(here, 'promo.html')).href);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });

if (stillsArg) {
  mkdirSync(path.join(here, 'stills'), { recursive: true });
  for (const s of stillsArg.split(',').map(Number)) {
    await page.evaluate(t => window.renderFrame(t), s);
    await page.screenshot({ path: path.join(here, 'stills', `t${s}.png`) });
    console.log('still', s);
  }
} else {
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', path.join(here, 'video_noaudio.mp4')],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < N; f++) {
    await page.evaluate(t => window.renderFrame(t), f / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 96 });
    if (!ff.stdin.write(buf)) await once(ff.stdin, 'drain');
    if (f % 150 === 0) console.log(`frame ${f}/${N}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await once(ff, 'close');
  console.log('done', ((Date.now() - t0) / 1000).toFixed(0) + 's');
}
await browser.close();
