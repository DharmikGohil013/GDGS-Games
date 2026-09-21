// ─── Tower Stacker — Deluxe ───
// Slice-the-overhang stacking with perfect-drop streaks, rebuilt width rewards,
// rising camera, wind at altitude, and colour themes that shift as you climb.

import { createGameShell } from '../core/gameShell.js';
import { sfx, haptic } from '../core/audio.js';
import {
  Particles, FloatingTexts, Shake, fitCanvas, roundRect,
  clamp, lerp, rand, ease, TAU,
} from '../core/juice.js';

let shell = null;
let teardown = null;

const BLOCK_H = 34;
const START_W = 230;
const MIN_W = 14;
const PERFECT_TOL = 5.5;     // px of slop still counted as perfect
const BASE_SPEED = 2.4;
const MAX_SPEED = 8.2;

// Each 10 floors the palette shifts — visible, cheap progression feedback.
const THEMES = [
  { name: 'Dawn',      sky: ['#0B1026', '#2A1B57'], block: ['#8B5CF6', '#F43F8E'], accent: '#F9A8D4' },
  { name: 'Ocean',     sky: ['#04121F', '#0B3A57'], block: ['#22D3EE', '#3E6BFF'], accent: '#7DD3FC' },
  { name: 'Jungle',    sky: ['#04150F', '#0D3B2A'], block: ['#1FC98B', '#A3E635'], accent: '#BEF264' },
  { name: 'Ember',     sky: ['#1A0606', '#4A1206'], block: ['#FF5F4D', '#FFC93C'], accent: '#FDBA74' },
  { name: 'Void',      sky: ['#07070E', '#211145'], block: ['#A78BFA', '#22D3EE'], accent: '#C4B5FD' },
  { name: 'Aurora',    sky: ['#03121A', '#06364A'], block: ['#34D399', '#818CF8'], accent: '#6EE7B7' },
];

export function initGame(container) {
  destroyGame();

  shell = createGameShell(container, {
    id: 'tower-stacker',
    title: 'Tower Stacker',
    accent: 'coral',
    accent2: 'gold',
    tagline: 'Stack high · Land perfect',
    howTo: [
      { key: 'Click / Tap', label: 'Drop the moving block' },
      { key: 'Space', label: 'Drop the moving block' },
      { key: 'Perfect', label: 'Land dead-centre to keep full width + bonus' },
      { key: '3 in a row', label: 'Perfect streak rebuilds lost width' },
    ],
    stats: [
      { key: 'score', label: 'Score' },
      { key: 'best', label: 'Best' },
      { key: 'floor', label: 'Floor' },
      { key: 'coins', label: 'Coins' },
    ],
    onStart: startRun,
    onRestart: startRun,
    onPause: () => { paused = true; },
    onResume: () => { paused = false; last = performance.now(); },
    onDestroy: cleanup,
  });

  // Local handle: destroyGame() nulls the module-level `shell`, and the
  // results screen is shown from a timeout that can outlive that.
  const gs = shell;
  let overTimer = null;

  const canvas = document.createElement('canvas');
  canvas.style.background = '#0B1026';
  shell.stage.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  shell.setControls(`
    <div class="gs-pad">
      <button class="gs-pad-btn" data-drop aria-label="Drop block">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
        <span>DROP</span>
      </button>
    </div>
  `);

  /* ── state ── */
  let W = 0, H = 0;
  let stack = [];            // { x, w, y, colorA, colorB, perfect }
  let mover = null;          // the block currently sliding
  let falling = [];          // sliced-off chunks tumbling away
  let cameraY = 0;
  let cameraTarget = 0;
  let floorCount = 0;
  let perfectStreak = 0;
  let bestStreak = 0;
  let perfects = 0;
  let speed = BASE_SPEED;
  let paused = false;
  let running = false;
  let over = false;
  let last = 0;
  let rafId = null;
  let time = 0;
  let flash = 0;

  const particles = new Particles(460);
  const floats = new FloatingTexts();
  const shake = new Shake();

  const themeFor = (floor) => THEMES[Math.floor(floor / 10) % THEMES.length];

  function resize() {
    const d = fitCanvas(canvas, shell.stage);
    W = d.w;
    H = d.h;
  }
  resize();
  const ro = new ResizeObserver(() => resize());
  ro.observe(shell.stage);

  /* ── run ── */
  function baseY() {
    return H - 90;
  }

  function startRun() {
    resize();
    stack = [];
    falling = [];
    particles.clear();
    floats.clear();
    cameraY = 0;
    cameraTarget = 0;
    floorCount = 0;
    perfectStreak = 0;
    bestStreak = 0;
    perfects = 0;
    speed = BASE_SPEED;
    paused = false;
    over = false;
    running = true;
    flash = 0;

    const theme = THEMES[0];
    stack.push({
      x: W / 2 - START_W / 2,
      w: START_W,
      y: baseY(),
      colorA: theme.block[0],
      colorB: theme.block[1],
      perfect: false,
    });

    shell.setStat('floor', 0);
    shell.setCombo(0);
    spawnMover();

    last = performance.now();
    if (!rafId) rafId = requestAnimationFrame(frame);
  }

  function spawnMover() {
    const top = stack[stack.length - 1];
    const theme = themeFor(floorCount + 1);
    const fromLeft = stack.length % 2 === 0;
    // Wind adds a slow sine wobble on top of the linear sweep at altitude.
    const wind = floorCount >= 18 ? clamp((floorCount - 18) / 40, 0, 1) : 0;

    mover = {
      w: top.w,
      y: top.y - BLOCK_H,
      x: fromLeft ? -top.w : W,
      dir: fromLeft ? 1 : -1,
      speed: speed,
      wind,
      phase: Math.random() * TAU,
      colorA: theme.block[0],
      colorB: theme.block[1],
    };
  }

  /* ── dropping ── */
  function drop() {
    if (!running || over || paused || !mover) return;

    const top = stack[stack.length - 1];
    const delta = mover.x - top.x;
    const overlap = mover.w - Math.abs(delta);

    if (overlap <= 0) {
      // Complete miss — the block tumbles and the run ends.
      falling.push({
        x: mover.x, y: mover.y, w: mover.w, h: BLOCK_H,
        vx: mover.dir * 2, vy: -2, rot: 0, vr: rand(-0.1, 0.1),
        colorA: mover.colorA, colorB: mover.colorB,
      });
      mover = null;
      return die('missed');
    }

    const isPerfect = Math.abs(delta) <= PERFECT_TOL;
    let newX = isPerfect ? top.x : (delta > 0 ? mover.x : top.x);
    let newW = isPerfect ? top.w : overlap;

    if (isPerfect) {
      perfectStreak++;
      bestStreak = Math.max(bestStreak, perfectStreak);
      perfects++;
      shell.countPerfect();

      // Three perfects in a row give width back — the comeback mechanic.
      if (perfectStreak >= 3 && newW < START_W) {
        const grow = Math.min(16, START_W - newW);
        newX -= grow / 2;
        newW += grow;
        floats.add(W / 2, mover.y - 46 - cameraY, 'WIDTH RESTORED', { color: '#7CF2C4', size: 16, life: 60, stroke: 'rgba(0,0,0,0.5)' });
      }
    } else {
      if (perfectStreak >= 3) shell.toast(`${perfectStreak}-perfect streak ended`, 'warn');
      perfectStreak = 0;

      // Slice the overhang off and let it fall.
      const sliceW = mover.w - overlap;
      const sliceX = delta > 0 ? mover.x + overlap : mover.x;
      falling.push({
        x: sliceX, y: mover.y, w: sliceW, h: BLOCK_H,
        vx: (delta > 0 ? 1 : -1) * rand(1.4, 2.8),
        vy: rand(-1.6, -0.4), rot: 0, vr: rand(-0.14, 0.14),
        colorA: mover.colorA, colorB: mover.colorB,
      });
      particles.burst({
        x: sliceX + sliceW / 2, y: mover.y + BLOCK_H / 2 - cameraY,
        count: 12, color: [mover.colorA, mover.colorB], speed: 3.6, size: 3.5, life: 28, gravity: 0.24, shape: 'square',
      });
    }

    const placed = {
      x: newX, y: mover.y, w: newW,
      colorA: mover.colorA, colorB: mover.colorB,
      perfect: isPerfect, placedAt: time,
    };
    stack.push(placed);
    floorCount++;

    // ── scoring ──
    const streakMult = 1 + Math.min(perfectStreak, 10) * 0.5;
    const base = isPerfect ? 50 : 15;
    const gained = Math.round(base * (isPerfect ? streakMult : 1) + floorCount * 2);
    shell.addScore(gained, { pop: true });
    shell.setStat('floor', floorCount);

    if (isPerfect) {
      shell.addCoins(2 + Math.min(perfectStreak, 8));
      shell.setCombo(perfectStreak + 1, 1);
      sfx.perfect();
      haptic([8, 24, 8]);
      flash = 1;
      shake.add(4 + Math.min(perfectStreak, 6));
      floats.add(newX + newW / 2, placed.y - 24 - cameraY, `PERFECT +${gained}`, {
        color: '#FFC93C', size: 20 + Math.min(perfectStreak, 6), life: 58, stroke: 'rgba(0,0,0,0.55)',
      });
      particles.burst({
        x: newX + newW / 2, y: placed.y - cameraY,
        count: 22 + perfectStreak * 3, color: ['#FFC93C', '#ffffff', mover.colorA],
        speed: 5.4, size: 4, life: 36, gravity: 0.08,
      });
    } else {
      shell.addCoins(1);
      shell.setCombo(0);
      sfx.land();
      haptic(12);
      shake.add(2.5);
      floats.add(newX + newW / 2, placed.y - 22 - cameraY, `+${gained}`, {
        color: '#E7EAF4', size: 17, stroke: 'rgba(0,0,0,0.5)',
      });
    }

    // ── escalation ──
    speed = Math.min(MAX_SPEED, BASE_SPEED + floorCount * 0.13);
    cameraTarget = Math.max(0, (floorCount - 6) * BLOCK_H);

    if (floorCount % 10 === 0) {
      const theme = themeFor(floorCount);
      shell.toast(`Floor ${floorCount} — ${theme.name} zone`, 'good');
      shell.addCoins(10);
      sfx.reward();
    }

    if (newW < MIN_W) return die('toothin');
    spawnMover();
  }

  function die(cause) {
    if (over) return;
    over = true;
    running = false;
    mover = null;
    shake.add(16);
    sfx.crash();
    haptic([30, 50, 60]);

    overTimer = setTimeout(() => {
      gs.gameOver({
        bestCombo: bestStreak + 1,
        eyebrow: cause === 'toothin' ? 'The tower got too thin' : 'You missed the stack',
        stats: [
          { label: 'Floors built', value: floorCount },
          { label: 'Perfect drops', value: perfects },
          { label: 'Best streak', value: bestStreak },
        ],
      });
    }, 620);
  }

  /* ── input ── */
  function onPointerDown(e) {
    if (e.target.closest('.gs-overlay, .gs-hud, button, a')) return;
    e.preventDefault();
    drop();
  }
  canvas.addEventListener('pointerdown', onPointerDown);

  function onKey(e) {
    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowDown') {
      if (shell.isPlaying) { e.preventDefault(); drop(); }
    }
  }
  window.addEventListener('keydown', onKey);

  const dropBtn = container.querySelector('[data-drop]');
  function onDropBtn(e) { e.preventDefault(); drop(); }
  dropBtn?.addEventListener('pointerdown', onDropBtn);

  /* ── update ── */
  function update(dt) {
    time += dt;

    if (mover) {
      const wobble = mover.wind * Math.sin(time / 420 + mover.phase) * 1.9;
      mover.x += (mover.dir * mover.speed + wobble) * dt * 0.06;

      const top = stack[stack.length - 1];
      const leftLimit = Math.min(-mover.w * 0.6, top.x - mover.w - 30);
      const rightLimit = Math.max(W + mover.w * 0.6, top.x + top.w + 30);
      if (mover.dir > 0 && mover.x > rightLimit) mover.dir = -1;
      if (mover.dir < 0 && mover.x + mover.w < leftLimit) mover.dir = 1;
    }

    cameraY = lerp(cameraY, cameraTarget, 1 - Math.pow(0.001, dt / 1000));

    for (let i = falling.length - 1; i >= 0; i--) {
      const f = falling[i];
      f.x += f.vx * dt * 0.06;
      f.y += f.vy * dt * 0.06;
      f.vy += 0.42 * dt * 0.06;
      f.rot += f.vr * dt * 0.06;
      if (f.y - cameraY > H + 200) falling.splice(i, 1);
    }

    if (flash > 0) flash = Math.max(0, flash - dt / 260);

    particles.update();
    floats.update();
    shake.update();
  }

  /* ── render ── */
  function drawSky() {
    const theme = themeFor(floorCount);
    const next = themeFor(floorCount + 10);
    // Blend between themes across the last 3 floors of a zone.
    const into = clamp(((floorCount % 10) - 7) / 3, 0, 1);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, into > 0 ? mixHex(theme.sky[0], next.sky[0], into) : theme.sky[0]);
    g.addColorStop(1, into > 0 ? mixHex(theme.sky[1], next.sky[1], into) : theme.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Parallax stars drift with the camera.
    ctx.save();
    for (let i = 0; i < 46; i++) {
      const sx = ((i * 137.5) % W);
      const sy = ((i * 89.3 + cameraY * 0.22) % (H + 60)) - 30;
      const tw = 0.3 + Math.abs(Math.sin(time / 900 + i)) * 0.55;
      ctx.globalAlpha = tw * 0.6;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.restore();

    if (flash > 0) {
      ctx.fillStyle = `rgba(255, 201, 60, ${flash * 0.16})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawBlock(b, y, alpha = 1, rot = 0) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const cxp = b.x + b.w / 2;
    const cyp = y + BLOCK_H / 2;
    if (rot) {
      ctx.translate(cxp, cyp);
      ctx.rotate(rot);
      ctx.translate(-cxp, -cyp);
    }
    const g = ctx.createLinearGradient(b.x, y, b.x + b.w, y + BLOCK_H);
    g.addColorStop(0, b.colorA);
    g.addColorStop(1, b.colorB);
    ctx.fillStyle = g;
    if (b.perfect) {
      ctx.shadowColor = '#FFC93C';
      ctx.shadowBlur = 16;
    }
    roundRect(ctx, b.x, y, b.w, b.h || BLOCK_H, 5);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Top highlight + bottom shade give the slab some depth.
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    roundRect(ctx, b.x + 2, y + 2, Math.max(0, b.w - 4), 5, 2.5);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    roundRect(ctx, b.x + 2, y + (b.h || BLOCK_H) - 7, Math.max(0, b.w - 4), 5, 2.5);
    ctx.fill();

    if (b.perfect) {
      ctx.strokeStyle = 'rgba(255, 201, 60, 0.85)';
      ctx.lineWidth = 1.6;
      roundRect(ctx, b.x, y, b.w, b.h || BLOCK_H, 5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function render() {
    ctx.save();
    shake.apply(ctx);
    drawSky();

    // Only draw what the camera can see.
    const firstVisible = Math.max(0, stack.length - Math.ceil(H / BLOCK_H) - 3);
    for (let i = firstVisible; i < stack.length; i++) {
      const b = stack[i];
      const y = b.y - cameraY;
      // Pop-in on the freshly placed block.
      const age = b.placedAt ? clamp((time - b.placedAt) / 180, 0, 1) : 1;
      const squash = b.placedAt && age < 1 ? 1 + (1 - ease.outCubic(age)) * 0.28 : 1;
      if (squash !== 1) {
        ctx.save();
        ctx.translate(b.x + b.w / 2, y + BLOCK_H);
        ctx.scale(squash, 2 - squash);
        ctx.translate(-(b.x + b.w / 2), -(y + BLOCK_H));
        drawBlock(b, y);
        ctx.restore();
      } else {
        drawBlock(b, y);
      }
    }

    falling.forEach((f) => drawBlock(f, f.y - cameraY, 0.9, f.rot));

    if (mover) {
      const top = stack[stack.length - 1];
      const y = mover.y - cameraY;
      // Guide line showing the target edges — teaches the perfect window.
      ctx.save();
      ctx.setLineDash([5, 7]);
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(top.x, y - 8);
      ctx.lineTo(top.x, y + BLOCK_H + 6);
      ctx.moveTo(top.x + top.w, y - 8);
      ctx.lineTo(top.x + top.w, y + BLOCK_H + 6);
      ctx.stroke();
      ctx.restore();

      // The block glows as it lines up with a perfect landing.
      const align = 1 - clamp(Math.abs(mover.x - top.x) / (top.w || 1), 0, 1);
      if (align > 0.9) {
        ctx.save();
        ctx.shadowColor = '#FFC93C';
        ctx.shadowBlur = 10 + (align - 0.9) * 220;
        drawBlock(mover, y);
        ctx.restore();
      } else {
        drawBlock(mover, y);
      }
    }

    particles.draw(ctx);
    floats.draw(ctx);

    // Perfect-streak banner
    if (perfectStreak >= 2 && running) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '900 15px Outfit, sans-serif';
      ctx.fillStyle = 'rgba(255, 201, 60, 0.92)';
      ctx.shadowColor = 'rgba(255,201,60,0.8)';
      ctx.shadowBlur = 14;
      ctx.fillText(`${perfectStreak} PERFECT IN A ROW`, W / 2, H - 34);
      ctx.restore();
    }
    ctx.restore();
  }

  function frame(now) {
    rafId = requestAnimationFrame(frame);
    const dt = Math.min(60, now - last);
    last = now;
    if (running && !paused && !over) update(dt);
    else { particles.update(); floats.update(); shake.update(); }
    render();
  }
  rafId = requestAnimationFrame(frame);

  function cleanup() {
    running = false;
    if (overTimer) { clearTimeout(overTimer); overTimer = null; }
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    ro.disconnect();
    canvas.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('keydown', onKey);
    dropBtn?.removeEventListener('pointerdown', onDropBtn);
  }

  teardown = cleanup;
}

/** Blend two #rrggbb colours — used for the zone-to-zone sky transition. */
function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(lerp((pa >> 16) & 255, (pb >> 16) & 255, t));
  const g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t));
  const bl = Math.round(lerp(pa & 255, pb & 255, t));
  return `rgb(${r},${g},${bl})`;
}

export function destroyGame() {
  if (teardown) { teardown(); teardown = null; }
  if (shell) { shell.destroy(); shell = null; }
}
