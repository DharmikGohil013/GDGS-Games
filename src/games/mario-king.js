// ─── Mario King — six-kingdom pixel platformer ───
// A hand-built side-scrolling platformer: run/jump physics with coyote time and
// jump buffering, stomp-to-kill enemies with an air-chain combo, moving platforms,
// hazards, coins, a star power-up and an extra life, six kingdoms of rising
// difficulty, and a three-hit boss fight to close it out.

import { createGameShell } from '../core/gameShell.js';
import { sfx, tone, noise, haptic } from '../core/audio.js';
import {
  Particles, FloatingTexts, Shake, fitCanvas,
  clamp, lerp, rand,
} from '../core/juice.js';

let shell = null;
let teardown = null;

/* ───────────────────────── virtual world + physics ───────────────────────── */

const VH = 540;                 // fixed virtual height; width follows the viewport
const GROUND_Y = 452;           // top surface of the ground plane
const GRAVITY = 2500;
const MAX_FALL = 980;
const MOVE_MAX = 210;
const ACCEL_GROUND = 1500;
const ACCEL_AIR = 900;
const FRICTION = 1700;
const JUMP_VELOCITY = -840;
const JUMP_CUT_FLOOR = JUMP_VELOCITY * 0.5;
const COYOTE_MS = 110;
const JUMP_BUFFER_MS = 130;
const STOMP_BOUNCE = -560;
const INVULN_MS = 1500;
const KNOCKBACK = 230;
const COMBO_WINDOW_MS = 1400;

const PLAYER_W = 26, PLAYER_H = 40, DUCK_H = 22;
const GRUMP_W = 30, GRUMP_H = 26;
const HOPPER_W = 28, HOPPER_H = 28;
const BOSS_W = 78, BOSS_H = 92;
const PROJ_W = 18, PROJ_H = 18, PROJ_Y_OFFSET = 48; // spawns at standing head height, ducking clears it

/* ───────────────────────── pixel-art sprites ───────────────────────── */

const HERO_PALETTE = { H: '#E64541', F: '#FFD1A6', M: '#4A2E1A', B: '#2255CC', S: '#E64541', G: '#FFFFFF', Y: '#5C3A21' };
const HERO_TOP = [
  '..HHHHHH..',
  '.HHHHHHHH.',
  '.HHHHHHHH.',
  '..FFFFFF..',
  '.FFFFFFFF.',
  '.FFMMMMFF.',
  '.SSFFFFSS.',
  '.SSSSSSSS.',
  '..SBBBBS..',
  '.GBBBBBBG.',
  '..BBBBBB..',
];
const HERO_STAND = [...HERO_TOP, '..BB..BB..', '..YY..YY..', '..YY..YY..'];
const HERO_RUN_A = [...HERO_TOP, '.YY....YY.', '..YY..YY..', '...YY.YY..'];
const HERO_RUN_B = [...HERO_TOP, '...YY.YY..', '..YY..YY..', '.YY....YY.'];
const HERO_JUMP = [...HERO_TOP, '..BB..BB..', '...YYYY...', '...YYYY...'];
const HERO_DUCK = [
  '.HHHHHHHH.',
  '..FFFFFF..',
  '.FFMMMMFF.',
  '.SSFFFFSS.',
  '.SSSSSSSS.',
  '.GBBBBBBG.',
  '.BB....BB.',
  '.YY....YY.',
];

const GRUMP_PALETTE = { D: '#8B4A2B', L: '#B5723F', E: '#FFFFFF', P: '#1A1006', T: '#3A2211' };
const GRUMP_A = ['.DDDDDDDD.', 'DDDDDDDDDD', 'DDEDDDDEDD', 'DDPDDDDPDD', 'DDDDDDDDDD', 'LLLLLLLLLL', '.TT....TT.', '.TT....TT.'];
const GRUMP_B = ['.DDDDDDDD.', 'DDDDDDDDDD', 'DDEDDDDEDD', 'DDPDDDDPDD', 'DDDDDDDDDD', 'LLLLLLLLLL', 'TT....TT..', '.TT....TT.'];

const HOPPER_PALETTE = { D: '#2F9E4F', L: '#79D28C', E: '#FFFFFF', P: '#0E2A14', T: '#1F5C2B' };
const HOPPER_UP = ['.DDDDDDDD.', 'DDDDDDDDDD', 'DDEDDDDEDD', 'DDPDDDDPDD', 'DDDDDDDDDD', 'LLLLLLLLLL', '.T.....T..', '..T...T...'];
const HOPPER_DOWN = ['.DDDDDDDD.', 'DDDDDDDDDD', 'DDEDDDDEDD', 'DDPDDDDPDD', 'DDDDDDDDDD', 'LLLLLLLLLL', '.TT....TT.', '.TT....TT.'];

const BOSS_PALETTE = { C: '#FFD700', J: '#FF3355', D: '#8B4A2B', E: '#FFFFFF', P: '#1A1006', M: '#2A1608', R: '#7C2D8E', T: '#3A2211' };
const BOSS_FRAME = [
  '...CCCCCCCCCC...',
  '..C.C..C..C.C...',
  '..CCCCCCCCCC....',
  '....J....J......',
  '.DDDDDDDDDDDDDD.',
  'DDDDDDDDDDDDDDDD',
  'DDEDDDDDDDDEDDDD',
  'DDPDDDDDDDDPDDDD',
  'DDDDDDMMMMDDDDDD',
  'DDDDDDDDDDDDDDDD',
  '.RRRRRRRRRRRRRR.',
  'RRRRRRRRRRRRRRRR',
  'RRRRRRRRRRRRRRRR',
  '.RRRRRRRRRRRRRR.',
  '..TT........TT..',
  '..TT........TT..',
  '..TT........TT..',
];

function drawPixels(ctx, rows, palette, x, y, scale, flip) {
  const width = rows[0].length;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (flip) { ctx.translate(width * scale, 0); ctx.scale(-1, 1); }
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === '.') continue;
      const color = palette[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(c * scale), Math.round(r * scale), Math.ceil(scale) + 0.6, Math.ceil(scale) + 0.6);
    }
  }
  ctx.restore();
}

function drawStar(ctx, cx, cy, outerR, innerR, color) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawHeart(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  const s = size;
  ctx.moveTo(cx, cy + s * 0.62);
  ctx.bezierCurveTo(cx - s, cy - s * 0.1, cx - s * 0.5, cy - s, cx, cy - s * 0.32);
  ctx.bezierCurveTo(cx + s * 0.5, cy - s, cx + s, cy - s * 0.1, cx, cy + s * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/* ───────────────────────── kingdom themes ───────────────────────── */

const KINGDOMS = [
  { name: 'Grass Kingdom', sky: ['#1B2A47', '#3B6998'], ground: '#4A7C42', dirt: '#5C3A21', platform: '#5C9E4A', accent: '#8BC34A', deco: 'hills' },
  { name: 'Desert Kingdom', sky: ['#3D1820', '#A34A32'], ground: '#C2B280', dirt: '#7A5C3E', platform: '#DAA520', accent: '#F4A460', deco: 'dunes' },
  { name: 'Cave Kingdom', sky: ['#050510', '#1B1636'], ground: '#4B4458', dirt: '#241F2E', platform: '#6E5F94', accent: '#B084F5', deco: 'crystals' },
  { name: 'Ice Kingdom', sky: ['#0F1B29', '#254159'], ground: '#DFE6E9', dirt: '#636E72', platform: '#74B9FF', accent: '#FFFFFF', deco: 'ice' },
  { name: 'Sky Kingdom', sky: ['#101433', '#3A3F7A'], ground: '#8C7CF6', dirt: '#4A3F8A', platform: '#C6B8FF', accent: '#E9D8FF', deco: 'clouds' },
  { name: 'Castle Kingdom', sky: ['#1A0505', '#3A0A0A'], ground: '#4A1010', dirt: '#2B0505', platform: '#6B1A1A', accent: '#FF4500', deco: 'castle' },
];

/* ───────────────────────── level authoring helpers ───────────────────────── */

function coinArc(cx, topY, count, spread) {
  const arr = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    arr.push({ x: cx - spread / 2 + spread * t, y: topY - Math.sin(t * Math.PI) * 42 });
  }
  return arr;
}

function coinRow(xStart, y, count, gap) {
  const arr = [];
  for (let i = 0; i < count; i++) arr.push({ x: xStart + i * gap, y });
  return arr;
}

function buildGroundRects(width, gaps) {
  const rects = [];
  let cursor = 0;
  const sorted = [...gaps].sort((a, b) => a[0] - b[0]);
  for (const [gx0, gx1] of sorted) {
    if (gx0 > cursor) rects.push({ x: cursor, y: GROUND_Y, w: gx0 - cursor, h: 4000 });
    cursor = Math.max(cursor, gx1);
  }
  if (cursor < width) rects.push({ x: cursor, y: GROUND_Y, w: width - cursor, h: 4000 });
  return rects;
}

/* ───────────────────────── level data (hand-authored, difficulty ramps) ───────────────────────── */

const LEVEL_DEFS = [
  {
    width: 3000,
    gaps: [[560, 650]],
    platforms: [{ x: 850, y: GROUND_Y - 95, w: 130 }],
    moving: [],
    spikes: [],
    coins: [...coinRow(140, GROUND_Y - 70, 6, 42), ...coinArc(605, GROUND_Y - 70, 5, 120), ...coinRow(880, GROUND_Y - 140, 3, 40)],
    enemies: [{ type: 'grump', x: 1250, minX: 1150, maxX: 1450 }, { type: 'grump', x: 2100, minX: 2000, maxX: 2300 }],
    powerups: [{ type: 'star', x: 1700, y: GROUND_Y - 40 }],
    flagX: 2850,
  },
  {
    width: 3400,
    gaps: [[700, 800], [1650, 1760]],
    platforms: [{ x: 950, y: GROUND_Y - 100, w: 140 }, { x: 1900, y: GROUND_Y - 110, w: 100 }],
    moving: [],
    spikes: [{ x: 2450, w: 110 }],
    coins: [...coinArc(750, GROUND_Y - 70, 5, 110), ...coinArc(1705, GROUND_Y - 70, 5, 120), ...coinRow(980, GROUND_Y - 140, 3, 40)],
    enemies: [{ type: 'grump', x: 1200, minX: 1120, maxX: 1400 }, { type: 'grump', x: 2200, minX: 2100, maxX: 2380 }, { type: 'grump', x: 3000, minX: 2900, maxX: 3150 }],
    powerups: [{ type: 'life', x: 1300, y: GROUND_Y - 40 }],
    flagX: 3250,
  },
  {
    width: 3600,
    gaps: [[600, 700], [1450, 1550], [2350, 2480]],
    platforms: [{ x: 2560, y: GROUND_Y - 110, w: 120 }],
    moving: [{ baseX: 1600, y: GROUND_Y - 120, w: 110, h: 16, axis: 'x', range: 140, speed: 1.0, phase: 0 }],
    spikes: [{ x: 830, w: 100 }, { x: 2200, w: 120 }],
    coins: [...coinArc(650, GROUND_Y - 70, 5, 100), ...coinArc(1500, GROUND_Y - 70, 5, 100), ...coinArc(2415, GROUND_Y - 70, 5, 130), ...coinRow(2570, GROUND_Y - 150, 3, 40)],
    enemies: [{ type: 'grump', x: 1100, minX: 1000, maxX: 1300 }, { type: 'hopper', x: 1900, minX: 1820, maxX: 2200 }, { type: 'grump', x: 2900, minX: 2800, maxX: 3050 }],
    powerups: [{ type: 'star', x: 1750, y: GROUND_Y - 40 }],
    flagX: 3450,
  },
  {
    width: 3800,
    gaps: [[560, 660], [1200, 1310], [1900, 2010], [2600, 2720]],
    platforms: [{ x: 1350, y: GROUND_Y - 100, w: 100 }, { x: 2050, y: GROUND_Y - 110, w: 90 }],
    moving: [{ baseX: 2760, y: GROUND_Y - 110, w: 100, h: 16, axis: 'x', range: 120, speed: 1.3, phase: 1 }],
    spikes: [{ x: 750, w: 100 }, { x: 2200, w: 100 }, { x: 3050, w: 140 }],
    coins: [...coinArc(610, GROUND_Y - 70, 5, 100), ...coinArc(1255, GROUND_Y - 70, 5, 110), ...coinArc(1955, GROUND_Y - 70, 5, 110), ...coinArc(2660, GROUND_Y - 70, 5, 120)],
    enemies: [{ type: 'hopper', x: 1000, minX: 900, maxX: 1150 }, { type: 'grump', x: 1750, minX: 1650, maxX: 1880 }, { type: 'hopper', x: 2450, minX: 2380, maxX: 2580 }, { type: 'grump', x: 3300, minX: 3200, maxX: 3450 }],
    powerups: [{ type: 'life', x: 2080, y: GROUND_Y - 180 }],
    flagX: 3650,
  },
  {
    width: 4000,
    gaps: [[400, 520], [900, 1010], [1450, 1560], [2050, 2160], [2650, 2760], [3250, 3360]],
    platforms: [
      { x: 560, y: GROUND_Y - 70, w: 110 }, { x: 1030, y: GROUND_Y - 110, w: 100 },
      { x: 1580, y: GROUND_Y - 110, w: 100 }, { x: 2180, y: GROUND_Y - 110, w: 110 },
      { x: 2790, y: GROUND_Y - 120, w: 100 },
    ],
    moving: [{ baseX: 3400, y: GROUND_Y - 100, w: 110, h: 16, axis: 'x', range: 110, speed: 1.2, phase: 0 }],
    spikes: [],
    coins: [
      ...coinRow(575, GROUND_Y - 100, 3, 34), ...coinRow(1045, GROUND_Y - 140, 3, 34),
      ...coinRow(1595, GROUND_Y - 140, 3, 34), ...coinRow(2195, GROUND_Y - 140, 3, 34),
      ...coinRow(2805, GROUND_Y - 150, 3, 34),
    ],
    enemies: [],
    powerups: [{ type: 'star', x: 1610, y: GROUND_Y - 190 }],
    flagX: 3850,
  },
  {
    width: 1700,
    gaps: [[500, 580]],
    platforms: [{ x: 1000, y: GROUND_Y - 100, w: 110 }],
    moving: [],
    spikes: [{ x: 640, w: 90 }],
    coins: coinRow(150, GROUND_Y - 60, 4, 40),
    enemies: [{ type: 'grump', x: 350, minX: 280, maxX: 460 }],
    powerups: [{ type: 'life', x: 820, y: GROUND_Y - 40 }],
    isBoss: true,
    boss: { x: 1450, minX: 900, maxX: 1600 },
    flagX: null,
  },
];

function loadLevelData(index) {
  const def = LEVEL_DEFS[index];
  const ground = buildGroundRects(def.width, def.gaps);
  return {
    index,
    width: def.width,
    kingdom: KINGDOMS[index],
    isBoss: !!def.isBoss,
    ground,
    platforms: def.platforms.map((p) => ({ ...p })),
    moving: def.moving.map((m) => ({ ...m, x: m.baseX })),
    spikes: def.spikes.map((s) => ({ ...s })),
    coins: def.coins.map((c) => ({ ...c, taken: false, phase: Math.random() * Math.PI * 2 })),
    enemies: def.enemies.map((e) => ({
      ...e,
      w: e.type === 'hopper' ? HOPPER_W : GRUMP_W,
      h: e.type === 'hopper' ? HOPPER_H : GRUMP_H,
      dir: 1, alive: true, vy: 0, hopTimer: rand(300, 900), squishT: 0,
      speed: (e.type === 'hopper' ? 40 : 55) + index * 9,
    })),
    powerups: def.powerups.map((p) => ({ ...p, taken: false })),
    flagX: def.flagX,
    boss: def.boss ? {
      x: def.boss.x, y: GROUND_Y - BOSS_H, minX: def.boss.minX, maxX: def.boss.maxX,
      w: BOSS_W, h: BOSS_H, dir: -1, hp: 3, maxHp: 3, phase: 0,
      speed: 65, hitTimer: 0, throwTimer: rand(1400, 2000), windup: 0, alive: true, defeated: false,
    } : null,
    projectiles: [],
    decos: buildDecos(def.width),
  };
}

function buildDecos(width) {
  const decos = [];
  const count = Math.ceil(width / 260);
  for (let i = 0; i < count; i++) {
    decos.push({ x: i * 260 + rand(-40, 40), scale: rand(0.7, 1.3), seed: Math.random() });
  }
  return decos;
}

/* ───────────────────────── math helpers ───────────────────────── */

function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function moveToward(v, target, maxDelta) {
  if (v < target) return Math.min(v + maxDelta, target);
  if (v > target) return Math.max(v - maxDelta, target);
  return v;
}

/* ───────────────────────── custom boss/fanfare cues ───────────────────────── */

function playBossHit() {
  tone({ type: 'square', from: 220, to: 90, dur: 0.14, vol: 0.18 });
  noise({ dur: 0.12, vol: 0.15, freq: 900, freqEnd: 200 });
}
function playBossThrow() {
  tone({ type: 'sawtooth', from: 500, to: 200, dur: 0.16, vol: 0.14 });
}
function playBossRoar() {
  noise({ dur: 0.45, vol: 0.22, freq: 260, freqEnd: 60 });
  tone({ type: 'sawtooth', from: 130, to: 40, dur: 0.45, vol: 0.16 });
}
function playVictory() {
  [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => {
    tone({ type: 'triangle', from: f, to: f, dur: 0.18, vol: 0.17, delay: i * 0.1 });
  });
}
function playStomp() {
  tone({ type: 'triangle', from: 300, to: 120, dur: 0.09, vol: 0.15 });
}

/* ───────────────────────── game bootstrap ───────────────────────── */

export function initGame(container) {
  destroyGame();

  shell = createGameShell(container, {
    id: 'mario-king',
    title: 'Mario King',
    accent: 'gold',
    accent2: 'green',
    tagline: 'Six kingdoms · One crown',
    howTo: [
      { key: '← → / A D', label: 'Run left / right' },
      { key: 'Space / ↑ / W', label: 'Jump — hold for a higher jump' },
      { key: '↓ / S', label: 'Duck — dodge low attacks' },
      { key: 'Stomp', label: 'Land on enemies to defeat them' },
    ],
    stats: [
      { key: 'score', label: 'Score' },
      { key: 'coins', label: 'Coins' },
      { key: 'lives', label: 'Lives', initial: 3 },
      { key: 'best', label: 'Best' },
    ],
    onStart: startRun,
    onRestart: startRun,
    onPause: () => { paused = true; },
    onResume: () => { paused = false; last = performance.now(); },
    onDestroy: cleanup,
  });

  const gs = shell;
  let overTimer = null;

  const canvas = document.createElement('canvas');
  canvas.style.background = '#0B1026';
  canvas.style.imageRendering = 'pixelated';
  shell.stage.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  shell.setControls(`
    <div class="mk-controls">
      <div class="mk-move">
        <button class="mk-btn" data-left aria-label="Move left">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 5 8 12 15 19"/></svg>
        </button>
        <button class="mk-btn" data-right aria-label="Move right">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 5 16 12 9 19"/></svg>
        </button>
      </div>
      <button class="mk-jump" data-jump aria-label="Jump">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 11 12 4 19 11"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
        <span>JUMP</span>
      </button>
    </div>
  `);

  /* ── canvas + camera state ── */
  let W = 0, H = 0, scale = 1, viewW = 0, dpr = 1;
  let camX = 0;

  function resize() {
    const d = fitCanvas(canvas, shell.stage);
    W = d.w; H = d.h; dpr = d.dpr;
    scale = H / VH;
    viewW = W / scale;
  }
  resize();
  const ro = new ResizeObserver(() => resize());
  ro.observe(shell.stage);

  /* ── run state ── */
  let lives = 3;
  let levelIndex = 0;
  let level = null;
  let player = null;
  let paused = false;
  let running = false;
  let over = false;
  let last = 0;
  let rafId = null;
  let time = 0;
  let flash = 0;
  let comboCount = 0;
  let comboTimer = 0;
  let banner = null; // { text, sub, timer, total, blocksInput }
  let enemiesDefeated = 0;
  let bossDefeatedFlag = false;

  const particles = new Particles(500);
  const floats = new FloatingTexts();
  const shake = new Shake();

  const keys = { left: false, right: false, jumpHeld: false, duck: false };
  let touchLeft = false, touchRight = false, touchJump = false;
  let jumpBufferTimer = 0;
  let coyoteTimer = 0;

  function showBanner(text, sub, ms, blocksInput) {
    banner = { text, sub: sub || '', timer: ms, total: ms, blocksInput: !!blocksInput };
  }

  /* ── level lifecycle ── */
  function loadLevel(index) {
    levelIndex = index;
    level = loadLevelData(index);
    player = {
      x: 80, y: GROUND_Y - PLAYER_H, w: PLAYER_W, h: PLAYER_H,
      vx: 0, vy: 0, onGround: false, facing: 1, ducking: false,
      invuln: 900, standingOn: null, anim: 0,
    };
    camX = 0;
    comboCount = 0; comboTimer = 0;
    shell.setCombo(0);
    const label = level.isBoss ? 'BOSS BATTLE' : `Level ${index + 1}`;
    const sub = level.isBoss ? level.kingdom.name + ' — defeat the King!' : level.kingdom.name;
    showBanner(label, sub, level.isBoss ? 1500 : 1100, true);
    if (level.isBoss) playBossRoar();
    else sfx.ui();
  }

  function startRun() {
    resize();
    lives = 3;
    enemiesDefeated = 0;
    bossDefeatedFlag = false;
    over = false;
    running = true;
    paused = false;
    time = 0;
    flash = 0;
    particles.clear();
    floats.clear();
    shell.setStat('lives', 3);
    loadLevel(0);
    last = performance.now();
    if (!rafId) rafId = requestAnimationFrame(frame);
  }

  /* ── damage / death / progression ── */
  function loseLife(cause) {
    if (over) return;
    lives = Math.max(0, lives - 1);
    shell.setStat('lives', lives, { pop: true });
    sfx.hit();
    haptic([20, 40]);
    shake.add(10);
    if (lives <= 0) {
      finalGameOver(cause, false);
    } else {
      shell.toast(cause === 'fell' ? 'You fell — level restarts' : 'Ouch! Level restarts', 'warn');
      running = false;
      overTimer = setTimeout(() => {
        if (over) return;
        loadLevel(levelIndex);
        running = true;
      }, 550);
    }
  }

  function finalGameOver(cause, victory) {
    if (over) return;
    over = true;
    running = false;
    const stats = [
      { label: 'Kingdoms cleared', value: victory ? 6 : levelIndex },
      { label: 'Enemies defeated', value: enemiesDefeated },
      { label: 'Coins found', value: shell.coins },
    ];
    overTimer = setTimeout(() => {
      gs.gameOver({
        eyebrow: victory ? '👑 The Kingdom is saved!' : 'Game over',
        stats,
      });
    }, victory ? 300 : 500);
  }

  function completeLevel() {
    if (banner && banner.blocksInput) return;
    running = false;
    const bonus = 300 + Math.max(0, 60 - Math.floor(time)) * 4;
    shell.addScore(bonus, { pop: true });
    shell.toast(`Level clear! +${bonus}`, 'good');
    sfx.levelUp();
    showBanner('LEVEL CLEAR!', `+${bonus} bonus`, 1300, true);
    overTimer = setTimeout(() => {
      running = true;
      if (levelIndex + 1 < LEVEL_DEFS.length) loadLevel(levelIndex + 1);
    }, 1300);
  }

  function defeatBoss() {
    if (bossDefeatedFlag) return;
    bossDefeatedFlag = true;
    running = false;
    playVictory();
    shell.addScore(2000, { pop: true });
    shell.addCoins(50);
    shake.add(20);
    showBanner('KINGDOM SAVED!', 'The King has been dethroned', 1800, true);
    overTimer = setTimeout(() => finalGameOver('victory', true), 1800);
  }

  /* ── input ── */
  function onKeyDown(e) {
    if (!shell.isPlaying) return;
    const code = e.code;
    if (['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD', 'ArrowUp', 'KeyW', 'Space', 'ArrowDown', 'KeyS'].includes(code)) e.preventDefault();
    if (code === 'ArrowLeft' || code === 'KeyA') keys.left = true;
    if (code === 'ArrowRight' || code === 'KeyD') keys.right = true;
    if (code === 'ArrowDown' || code === 'KeyS') keys.duck = true;
    if (code === 'ArrowUp' || code === 'KeyW' || code === 'Space') {
      if (!keys.jumpHeld) jumpBufferTimer = JUMP_BUFFER_MS;
      keys.jumpHeld = true;
    }
  }
  function onKeyUp(e) {
    const code = e.code;
    if (code === 'ArrowLeft' || code === 'KeyA') keys.left = false;
    if (code === 'ArrowRight' || code === 'KeyD') keys.right = false;
    if (code === 'ArrowDown' || code === 'KeyS') keys.duck = false;
    if (code === 'ArrowUp' || code === 'KeyW' || code === 'Space') {
      keys.jumpHeld = false;
      if (player && player.vy < JUMP_CUT_FLOOR) player.vy = JUMP_CUT_FLOOR;
    }
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  const leftBtn = container.querySelector('[data-left]');
  const rightBtn = container.querySelector('[data-right]');
  const jumpBtn = container.querySelector('[data-jump]');
  const pressLeft = (v) => (e) => { e.preventDefault(); touchLeft = v; };
  const pressRight = (v) => (e) => { e.preventDefault(); touchRight = v; };
  const pressJump = (v) => (e) => {
    e.preventDefault();
    if (v && !touchJump) jumpBufferTimer = JUMP_BUFFER_MS;
    touchJump = v;
    if (!v && player && player.vy < JUMP_CUT_FLOOR) player.vy = JUMP_CUT_FLOOR;
  };
  const lDown = pressLeft(true), lUp = pressLeft(false);
  const rDown = pressRight(true), rUp = pressRight(false);
  const jDown = pressJump(true), jUp = pressJump(false);
  leftBtn?.addEventListener('pointerdown', lDown);
  leftBtn?.addEventListener('pointerup', lUp);
  leftBtn?.addEventListener('pointerleave', lUp);
  leftBtn?.addEventListener('pointercancel', lUp);
  rightBtn?.addEventListener('pointerdown', rDown);
  rightBtn?.addEventListener('pointerup', rUp);
  rightBtn?.addEventListener('pointerleave', rUp);
  rightBtn?.addEventListener('pointercancel', rUp);
  jumpBtn?.addEventListener('pointerdown', jDown);
  jumpBtn?.addEventListener('pointerup', jUp);
  jumpBtn?.addEventListener('pointerleave', jUp);
  jumpBtn?.addEventListener('pointercancel', jUp);

  /* ── physics: player vs static + moving solids ── */
  function currentSolids() {
    return [...level.ground, ...level.platforms, ...level.moving];
  }

  function updatePlayerPhysics(dt) {
    const moveLeft = keys.left || touchLeft;
    const moveRight = keys.right || touchRight;
    const wantsDuck = keys.duck && player.onGround;

    if (wantsDuck !== player.ducking) {
      const newH = wantsDuck ? DUCK_H : PLAYER_H;
      player.y += player.h - newH;
      player.h = newH;
      player.ducking = wantsDuck;
    }

    let targetVx = 0;
    if (player.ducking) {
      targetVx = 0;
    } else if (moveLeft && !moveRight) { targetVx = -MOVE_MAX; player.facing = -1; }
    else if (moveRight && !moveLeft) { targetVx = MOVE_MAX; player.facing = 1; }

    const accel = player.onGround ? ACCEL_GROUND : ACCEL_AIR;
    if (targetVx !== 0) player.vx = moveToward(player.vx, targetVx, accel * dt);
    else player.vx = moveToward(player.vx, 0, FRICTION * dt);

    coyoteTimer = player.onGround ? COYOTE_MS : Math.max(0, coyoteTimer - dt * 1000);
    jumpBufferTimer = Math.max(0, jumpBufferTimer - dt * 1000);
    if (jumpBufferTimer > 0 && (player.onGround || coyoteTimer > 0) && !player.ducking) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      coyoteTimer = 0;
      jumpBufferTimer = 0;
      sfx.jump();
      haptic(10);
      particles.burst({ x: player.x + player.w / 2, y: player.y + player.h, count: 6, color: '#ffffff', speed: 1.6, size: 2.6, life: 16, gravity: 0.05 });
    }

    player.vy = Math.min(MAX_FALL, player.vy + GRAVITY * dt);

    // horizontal
    player.x += player.vx * dt;
    const solids = currentSolids();
    for (const s of solids) {
      if (aabb(player, s)) {
        if (player.vx > 0) player.x = s.x - player.w;
        else if (player.vx < 0) player.x = s.x + s.w;
        player.vx = 0;
      }
    }
    player.x = Math.max(0, Math.min(player.x, level.width - player.w));

    // vertical
    player.y += player.vy * dt;
    player.onGround = false;
    player.standingOn = null;
    for (const s of solids) {
      if (aabb(player, s)) {
        if (player.vy > 0) {
          player.y = s.y - player.h;
          player.vy = 0;
          player.onGround = true;
          player.standingOn = s;
        } else if (player.vy < 0) {
          player.y = s.y + s.h;
          player.vy = 0;
        }
      }
    }
    if (player.standingOn && player.standingOn.axis === 'x' && player.standingOn.deltaX) {
      player.x += player.standingOn.deltaX;
    }

    if (player.invuln > 0) player.invuln = Math.max(0, player.invuln - dt * 1000);
    player.anim += dt;
  }

  function updateMovingPlatforms(dt) {
    level.moving.forEach((m) => {
      const oldX = m.x;
      m.phase += dt * m.speed;
      m.x = m.baseX + Math.sin(m.phase) * m.range;
      m.deltaX = m.x - oldX;
    });
  }

  /* ── enemies ── */
  function updateEnemies(dt) {
    level.enemies.forEach((en) => {
      if (!en.alive) {
        en.squishT -= dt;
        return;
      }
      if (en.type === 'grump') {
        en.x += en.dir * en.speed * dt;
        if (en.x < en.minX) { en.x = en.minX; en.dir = 1; }
        if (en.x + en.w > en.maxX) { en.x = en.maxX - en.w; en.dir = -1; }
        en.y = GROUND_Y - en.h;
      } else if (en.type === 'hopper') {
        en.hopTimer -= dt * 1000;
        if (en.hopTimer <= 0 && en.y >= GROUND_Y - en.h - 1) {
          en.vy = -420;
          en.hopTimer = rand(900, 1600);
        }
        en.vy += GRAVITY * 0.85 * dt;
        en.y += en.vy * dt;
        en.x += en.dir * en.speed * dt;
        if (en.y >= GROUND_Y - en.h) { en.y = GROUND_Y - en.h; en.vy = 0; }
        if (en.x < en.minX) { en.x = en.minX; en.dir = 1; }
        if (en.x + en.w > en.maxX) { en.x = en.maxX - en.w; en.dir = -1; }
      }

      if (player.invuln <= 0 && aabb(player, en)) {
        const prevBottom = player.y + player.h - player.vy * dt;
        const stomp = player.vy > 0 && prevBottom <= en.y + en.h * 0.5;
        if (stomp || shell.hasPowerup('star')) {
          killEnemy(en, stomp);
          if (stomp) player.vy = STOMP_BOUNCE;
        } else {
          damagePlayer(en.x + en.w / 2 > player.x + player.w / 2 ? -1 : 1);
        }
      }
    });
  }

  function killEnemy(en, stomp) {
    en.alive = false;
    en.squishT = 0.25;
    enemiesDefeated++;
    particles.burst({ x: en.x + en.w / 2, y: en.y + en.h / 2, count: 14, color: ['#8B4A2B', '#B5723F', '#FFC93C'], speed: 3.4, size: 3, life: 24, gravity: 0.2 });
    if (stomp) {
      comboTimer = COMBO_WINDOW_MS;
      comboCount++;
      const gain = 100 * comboCount;
      shell.addScore(gain, { pop: true });
      shell.setCombo(comboCount, 1);
      floats.add(en.x + en.w / 2, en.y - 10, `+${gain}`, { color: '#FFC93C', size: 16, stroke: 'rgba(0,0,0,0.5)' });
      playStomp();
    } else {
      shell.addScore(60, { pop: true });
      sfx.powerup();
    }
    haptic(14);
  }

  function damagePlayer(dir) {
    if (player.invuln > 0) return;
    player.invuln = INVULN_MS;
    player.vx = dir * KNOCKBACK;
    player.vy = -280;
    comboCount = 0; comboTimer = 0; shell.setCombo(0);
    loseLife('hit');
  }

  /* ── boss ── */
  function updateBoss(dt) {
    const boss = level.boss;
    if (!boss || !boss.alive) return;

    if (boss.hitTimer > 0) {
      boss.hitTimer -= dt * 1000;
    } else {
      boss.x += boss.dir * boss.speed * dt;
      if (boss.x < boss.minX) { boss.x = boss.minX; boss.dir = 1; }
      if (boss.x + boss.w > boss.maxX) { boss.x = boss.maxX - boss.w; boss.dir = -1; }

      boss.throwTimer -= dt * 1000;
      if (boss.windup > 0) {
        boss.windup -= dt * 1000;
        if (boss.windup <= 0) {
          const dir = (player.x + player.w / 2) < (boss.x + boss.w / 2) ? -1 : 1;
          level.projectiles.push({
            x: boss.x + boss.w / 2, y: GROUND_Y - PROJ_Y_OFFSET, w: PROJ_W, h: PROJ_H,
            vx: dir * 260, phase: Math.random() * 10,
          });
          playBossThrow();
        }
      } else if (boss.throwTimer <= 0) {
        boss.windup = 300;
        boss.throwTimer = Math.max(1100, 2400 - boss.phase * 400);
      }
    }

    if (player.invuln <= 0 && boss.hitTimer <= 0 && aabb(player, boss)) {
      const prevBottom = player.y + player.h - player.vy * dt;
      const stomp = player.vy > 0 && prevBottom <= boss.y + boss.h * 0.45;
      if (stomp) {
        boss.hp--;
        boss.phase++;
        boss.speed = 65 + boss.phase * 38;
        boss.hitTimer = 800;
        boss.throwTimer = 900;
        boss.windup = 0;
        player.vy = STOMP_BOUNCE;
        shake.add(14);
        flash = 1;
        playBossHit();
        shell.addScore(400, { pop: true });
        particles.burst({ x: boss.x + boss.w / 2, y: boss.y + 20, count: 26, color: ['#FFD700', '#FF3355', '#ffffff'], speed: 5, size: 4, life: 30, gravity: 0.15 });
        floats.add(boss.x + boss.w / 2, boss.y - 10, boss.hp > 0 ? 'HIT!' : 'DEFEATED!', { color: '#FFD700', size: 20, stroke: 'rgba(0,0,0,0.6)' });
        if (boss.hp <= 0) {
          boss.alive = false;
          defeatBoss();
        } else {
          shell.toast(`King hit! ${boss.hp} to go`, 'warn');
        }
      } else if (!shell.hasPowerup('star')) {
        damagePlayer(boss.x + boss.w / 2 > player.x + player.w / 2 ? -1 : 1);
      }
    }
  }

  function updateProjectiles(dt) {
    for (let i = level.projectiles.length - 1; i >= 0; i--) {
      const p = level.projectiles[i];
      p.x += p.vx * dt;
      p.phase += dt * 10;
      if (p.x < -80 || p.x > level.width + 80) { level.projectiles.splice(i, 1); continue; }
      if (player.invuln <= 0 && aabb(player, p)) {
        if (shell.hasPowerup('star')) {
          particles.burst({ x: p.x, y: p.y, count: 10, color: '#FFD700', speed: 3, size: 3, life: 18, gravity: 0.1 });
          level.projectiles.splice(i, 1);
        } else {
          damagePlayer(p.vx > 0 ? 1 : -1);
          level.projectiles.splice(i, 1);
        }
      }
    }
  }

  /* ── pickups + hazards + flag ── */
  function updateCoinsAndPickups() {
    level.coins.forEach((c) => {
      if (c.taken) return;
      const box = { x: c.x - 9, y: c.y - 9, w: 18, h: 18 };
      if (aabb(player, box)) {
        c.taken = true;
        shell.addCoins(1);
        shell.addScore(40);
        sfx.coin();
        floats.add(c.x, c.y - 16, '+40', { color: '#FFC93C', size: 13, life: 30 });
      }
    });

    level.powerups.forEach((p) => {
      if (p.taken) return;
      const box = { x: p.x - 12, y: p.y - 14, w: 24, h: 28 };
      if (aabb(player, box)) {
        p.taken = true;
        if (p.type === 'star') {
          shell.addPowerup('star', { label: 'Star Power', icon: '★', color: '#FFC93C', duration: 7000 });
          shell.countPowerup();
          sfx.powerup();
          shell.toast('Star power! Enemies beware', 'good');
        } else if (p.type === 'life') {
          lives = Math.min(5, lives + 1);
          shell.setStat('lives', lives, { pop: true });
          sfx.reward();
          shell.toast('Extra life!', 'good');
          particles.burst({ x: p.x, y: p.y, count: 16, color: '#FF5F8E', speed: 3, size: 3, life: 26, gravity: 0.15 });
        }
      }
    });

    level.spikes.forEach((s) => {
      const box = { x: s.x, y: GROUND_Y - 20, w: s.w, h: 20 };
      if (player.invuln <= 0 && !shell.hasPowerup('star') && aabb(player, box)) {
        damagePlayer(player.x + player.w / 2 > s.x + s.w / 2 ? 1 : -1);
      }
    });

    if (level.flagX != null && player.x + player.w > level.flagX) {
      completeLevel();
    }
  }

  /* ── main update ── */
  function update(dt) {
    time += dt;

    if (comboTimer > 0) {
      comboTimer -= dt * 1000;
      if (comboTimer <= 0) { comboCount = 0; shell.setCombo(0); }
    }

    if (banner) {
      banner.timer -= dt * 1000;
      if (banner.timer <= 0) banner = null;
    }

    const inputLocked = banner && banner.blocksInput;

    if (!inputLocked) {
      updateMovingPlatforms(dt);
      updatePlayerPhysics(dt);
      updateEnemies(dt);
      if (level.isBoss) { updateBoss(dt); updateProjectiles(dt); }
      updateCoinsAndPickups();

      if (player.y > VH + 120) {
        loseLife('fell');
      }
    }

    if (flash > 0) flash = Math.max(0, flash - dt * 3.2);

    // camera follows with a soft deadzone
    const targetCam = clamp(player.x - viewW * 0.42, 0, Math.max(0, level.width - viewW));
    camX = lerp(camX, targetCam, 1 - Math.pow(0.0025, dt));

    particles.update();
    floats.update();
    shake.update();
  }

  /* ── rendering ── */
  function drawSky() {
    const k = level.kingdom;
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, k.sky[0]);
    g.addColorStop(1, k.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(camX, 0, viewW, VH);

    ctx.save();
    ctx.globalAlpha = 0.55;
    level.decos.forEach((d) => {
      const px = d.x - camX * 0.35;
      if (px < camX - 200 || px > camX + viewW + 200) return;
      const by = GROUND_Y - 10;
      ctx.fillStyle = k.accent;
      if (k.deco === 'hills') {
        ctx.beginPath(); ctx.arc(px, by, 60 * d.scale, Math.PI, 0); ctx.fill();
      } else if (k.deco === 'dunes') {
        ctx.beginPath(); ctx.moveTo(px - 70 * d.scale, by); ctx.quadraticCurveTo(px, by - 70 * d.scale, px + 70 * d.scale, by); ctx.fill();
      } else if (k.deco === 'crystals') {
        ctx.beginPath(); ctx.moveTo(px, by - 90 * d.scale); ctx.lineTo(px + 16 * d.scale, by); ctx.lineTo(px - 16 * d.scale, by); ctx.closePath(); ctx.fill();
      } else if (k.deco === 'ice') {
        ctx.beginPath(); ctx.moveTo(px, by - 60 * d.scale); ctx.lineTo(px + 22 * d.scale, by); ctx.lineTo(px - 22 * d.scale, by); ctx.closePath(); ctx.fill();
      } else if (k.deco === 'clouds') {
        ctx.beginPath();
        ctx.arc(px, 90 + (d.seed * 220), 22 * d.scale, 0, Math.PI * 2);
        ctx.arc(px + 24 * d.scale, 90 + (d.seed * 220), 16 * d.scale, 0, Math.PI * 2);
        ctx.arc(px - 24 * d.scale, 90 + (d.seed * 220), 16 * d.scale, 0, Math.PI * 2);
        ctx.fill();
      } else if (k.deco === 'castle') {
        ctx.fillRect(px - 30 * d.scale, by - 100 * d.scale, 60 * d.scale, 100 * d.scale);
        ctx.fillRect(px - 34 * d.scale, by - 110 * d.scale, 10, 12);
        ctx.fillRect(px + 24 * d.scale, by - 110 * d.scale, 10, 12);
      }
    });
    ctx.restore();

    if (flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${flash * 0.35})`;
      ctx.fillRect(camX, 0, viewW, VH);
    }
  }

  function drawGround() {
    const k = level.kingdom;
    level.ground.forEach((r) => {
      if (r.x + r.w < camX - 20 || r.x > camX + viewW + 20) return;
      ctx.fillStyle = k.dirt;
      ctx.fillRect(r.x, r.y, r.w, Math.min(r.h, VH - r.y + 20));
      ctx.fillStyle = k.ground;
      ctx.fillRect(r.x, r.y, r.w, 10);
    });
    level.platforms.forEach((p) => {
      if (p.x + p.w < camX - 20 || p.x > camX + viewW + 20) return;
      ctx.fillStyle = k.dirt;
      ctx.fillRect(p.x, p.y, p.w, 16);
      ctx.fillStyle = k.platform;
      ctx.fillRect(p.x, p.y, p.w, 6);
    });
    level.moving.forEach((m) => {
      ctx.fillStyle = k.dirt;
      ctx.fillRect(m.x, m.y, m.w, 16);
      ctx.fillStyle = k.accent;
      ctx.fillRect(m.x, m.y, m.w, 5);
    });
    level.spikes.forEach((s) => {
      ctx.fillStyle = k.accent;
      const teeth = Math.max(2, Math.floor(s.w / 18));
      const tw = s.w / teeth;
      for (let i = 0; i < teeth; i++) {
        ctx.beginPath();
        ctx.moveTo(s.x + i * tw, GROUND_Y);
        ctx.lineTo(s.x + i * tw + tw / 2, GROUND_Y - 20);
        ctx.lineTo(s.x + (i + 1) * tw, GROUND_Y);
        ctx.closePath();
        ctx.fill();
      }
    });
  }

  function drawCoinsAndPickups() {
    level.coins.forEach((c) => {
      if (c.taken) return;
      const spin = Math.abs(Math.sin(time * 5 + c.phase));
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.scale(Math.max(0.18, spin), 1);
      ctx.fillStyle = '#FFC93C';
      ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#A8790A'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    });
    level.powerups.forEach((p) => {
      if (p.taken) return;
      const bob = Math.sin(time * 3 + p.x) * 4;
      if (p.type === 'star') drawStar(ctx, p.x, p.y + bob, 12, 5.4, '#FFC93C');
      else drawHeart(ctx, p.x, p.y + bob, 11, '#FF5F8E');
    });
  }

  function drawEnemies() {
    level.enemies.forEach((en) => {
      const palette = en.type === 'hopper' ? HOPPER_PALETTE : GRUMP_PALETTE;
      const scaleP = en.w / 10;
      if (!en.alive) {
        if (en.squishT <= 0) return;
        const deadFrame = en.type === 'hopper' ? HOPPER_DOWN : GRUMP_A;
        ctx.save();
        ctx.translate(en.x, GROUND_Y);
        ctx.scale(1, 0.3);
        ctx.translate(0, -en.h);
        drawPixels(ctx, deadFrame, palette, 0, 0, scaleP, false);
        ctx.restore();
        return;
      }
      let frame;
      if (en.type === 'hopper') frame = en.vy < 0 ? HOPPER_UP : HOPPER_DOWN;
      else frame = Math.floor(time * 6) % 2 === 0 ? GRUMP_A : GRUMP_B;
      drawPixels(ctx, frame, palette, en.x, en.y, scaleP, en.dir < 0);
    });
  }

  function drawBoss() {
    const boss = level.boss;
    if (!boss || !boss.alive) return;
    const flashing = boss.hitTimer > 0 && Math.floor(boss.hitTimer / 80) % 2 === 0;
    const wobble = boss.windup > 0 ? Math.sin(time * 40) * 3 : 0;
    drawPixels(ctx, BOSS_FRAME, BOSS_PALETTE, boss.x + wobble, boss.y, boss.w / 16, boss.dir < 0);
    if (flashing) {
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(boss.x, boss.y, boss.w, boss.h);
      ctx.restore();
    }
  }

  function drawProjectiles() {
    level.projectiles.forEach((p) => {
      ctx.save();
      ctx.translate(p.x, p.y + p.h / 2);
      ctx.rotate(p.phase);
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.fillStyle = '#FF3355';
      ctx.fillRect(-3, -3, 6, 6);
      ctx.restore();
    });
  }

  function drawFlag() {
    if (level.flagX == null) return;
    const x = level.flagX;
    ctx.fillStyle = '#C9CDD9';
    ctx.fillRect(x, GROUND_Y - 170, 5, 170);
    ctx.fillStyle = '#1FC98B';
    ctx.beginPath();
    ctx.moveTo(x + 5, GROUND_Y - 165);
    ctx.lineTo(x + 42, GROUND_Y - 150);
    ctx.lineTo(x + 5, GROUND_Y - 135);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFC93C';
    ctx.beginPath();
    ctx.arc(x + 2.5, GROUND_Y - 172, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPlayer() {
    const blinking = player.invuln > 0 && Math.floor(player.invuln / 80) % 2 === 0;
    if (blinking) return;
    const star = shell.hasPowerup('star');
    let frame;
    if (player.ducking) frame = HERO_DUCK;
    else if (!player.onGround) frame = HERO_JUMP;
    else if (Math.abs(player.vx) > 15) frame = Math.floor(player.anim * 10) % 2 === 0 ? HERO_RUN_A : HERO_RUN_B;
    else frame = HERO_STAND;

    let palette = HERO_PALETTE;
    if (star) {
      const hue = Math.floor(time * 300) % 360;
      palette = { ...HERO_PALETTE, H: `hsl(${hue},85%,55%)`, S: `hsl(${(hue + 60) % 360},85%,55%)`, B: `hsl(${(hue + 200) % 360},75%,50%)` };
    }
    const scaleP = player.w / 10;
    drawPixels(ctx, frame, palette, player.x, player.y, scaleP, player.facing < 0);
  }

  function drawBossBar() {
    const boss = level.boss;
    if (!boss) return;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = '800 13px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(8,10,18,0.6)';
    ctx.fillRect(W / 2 - 90, 12, 180, 26);
    ctx.fillStyle = '#FFD700';
    ctx.fillText('KING GRUMP', W / 2, 30);
    for (let i = 0; i < boss.maxHp; i++) {
      ctx.fillStyle = i < boss.hp ? '#FF3355' : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(W / 2 - 30 + i * 30, 44, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawLevelLabel() {
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = '700 12px Outfit, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.textAlign = 'left';
    ctx.fillText(`${level.isBoss ? 'Boss' : 'Level ' + (levelIndex + 1)} · ${level.kingdom.name}`, 14, H - 10);
    ctx.restore();
  }

  function drawBanner() {
    if (!banner) return;
    const p = clamp(banner.timer / banner.total, 0, 1);
    const alpha = p > 0.85 ? (1 - p) / 0.15 : (p < 0.15 ? p / 0.15 : 1);
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = clamp(alpha, 0, 1);
    ctx.fillStyle = 'rgba(6,7,14,0.55)';
    ctx.fillRect(0, H / 2 - 46, W, 92);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFC93C';
    ctx.font = '900 26px Outfit, sans-serif';
    ctx.fillText(banner.text, W / 2, H / 2 - 4);
    if (banner.sub) {
      ctx.fillStyle = '#E7EAF4';
      ctx.font = '600 14px Outfit, sans-serif';
      ctx.fillText(banner.sub, W / 2, H / 2 + 22);
    }
    ctx.restore();
  }

  function render() {
    if (!level) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#0B1026';
      ctx.fillRect(0, 0, W, H);
      return;
    }

    ctx.save();
    shake.apply(ctx);
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(-camX, 0);

    drawSky();
    drawGround();
    drawFlag();
    drawCoinsAndPickups();
    drawEnemies();
    drawBoss();
    drawProjectiles();
    if (player) drawPlayer();
    particles.draw(ctx);
    floats.draw(ctx);

    ctx.restore();
    if (level.isBoss) drawBossBar();
    drawLevelLabel();
    drawBanner();
    ctx.restore();
  }

  function frame(now) {
    rafId = requestAnimationFrame(frame);
    let dt = (now - last) / 1000;
    last = now;
    dt = Math.min(dt, 0.032);
    if (running && !paused && !over && level) update(dt);
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
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    leftBtn?.removeEventListener('pointerdown', lDown);
    leftBtn?.removeEventListener('pointerup', lUp);
    leftBtn?.removeEventListener('pointerleave', lUp);
    leftBtn?.removeEventListener('pointercancel', lUp);
    rightBtn?.removeEventListener('pointerdown', rDown);
    rightBtn?.removeEventListener('pointerup', rUp);
    rightBtn?.removeEventListener('pointerleave', rUp);
    rightBtn?.removeEventListener('pointercancel', rUp);
    jumpBtn?.removeEventListener('pointerdown', jDown);
    jumpBtn?.removeEventListener('pointerup', jUp);
    jumpBtn?.removeEventListener('pointerleave', jUp);
    jumpBtn?.removeEventListener('pointercancel', jUp);
  }

  teardown = cleanup;
}

export function destroyGame() {
  if (teardown) { teardown(); teardown = null; }
  if (shell) { shell.destroy(); shell = null; }
}
