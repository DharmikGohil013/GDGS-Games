// ─── Neon Snake — Deluxe ───
// Grid logic, smooth interpolated rendering, combo chains, five power-ups,
// escalating hazards and wall portals. Pure canvas, no engine dependency.

import { createGameShell } from '../core/gameShell.js';
import { sfx, haptic } from '../core/audio.js';
import {
  Particles, FloatingTexts, Shake, fitCanvas, roundRect,
  clamp, lerp, rand, randInt, TAU,
} from '../core/juice.js';

let shell = null;
let teardown = null;

const CELL = 26;               // logical cell size in CSS px
const BASE_INTERVAL = 132;     // ms per step at the start
const MIN_INTERVAL = 62;       // fastest the snake ever moves
const COMBO_WINDOW = 2600;     // ms to keep a combo alive

const FOOD = {
  apple:  { color: '#FF3B5C', glow: '#FF7A90', points: 10, coins: 1, weight: 68 },
  gold:   { color: '#FFC93C', glow: '#FFE08A', points: 45, coins: 5, weight: 16 },
  plasma: { color: '#22D3EE', glow: '#8BF0FF', points: 25, coins: 2, weight: 16 },
};

const POWERUPS = {
  ghost:  { label: 'Ghost',      icon: '👻', color: '#A78BFA', duration: 7000,  tint: '#A78BFA' },
  magnet: { label: 'Magnet',     icon: '🧲', color: '#22D3EE', duration: 8000,  tint: '#22D3EE' },
  slow:   { label: 'Slow-mo',    icon: '🐌', color: '#1FC98B', duration: 6500,  tint: '#1FC98B' },
  double: { label: 'Double pts', icon: '✖️', color: '#FFC93C', duration: 9000,  tint: '#FFC93C' },
  shield: { label: 'Shield',     icon: '🛡️', color: '#FF5F4D', duration: 10000, tint: '#FF5F4D' },
};
const POWER_KEYS = Object.keys(POWERUPS);

export function initGame(container) {
  destroyGame();

  shell = createGameShell(container, {
    id: 'neon-snake',
    title: 'Neon Snake',
    accent: 'green',
    accent2: 'cyan',
    tagline: 'Glow · Grow · Chain combos',
    howTo: [
      { key: '↑ ↓ ← →', label: 'Steer the snake (WASD works too)' },
      { key: 'Swipe', label: 'Steer on touch devices' },
      { key: 'Shift', label: 'Hold to dash — burns one body segment' },
      { key: 'P / Esc', label: 'Pause' },
    ],
    stats: [
      { key: 'score', label: 'Score' },
      { key: 'best', label: 'Best' },
      { key: 'length', label: 'Length' },
      { key: 'coins', label: 'Coins' },
    ],
    onStart: startRun,
    onRestart: startRun,
    onPause: () => { paused = true; },
    onResume: () => { paused = false; lastFrame = performance.now(); },
    onDestroy: cleanup,
  });

  // Local handle: destroyGame() nulls the module-level `shell`, and the
  // results screen is shown from a timeout that can outlive that.
  const gs = shell;
  let overTimer = null;

  /* ── canvas ── */
  const canvas = document.createElement('canvas');
  canvas.style.background = '#05070F';
  shell.stage.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  shell.setControls(`
    <div class="ns-dpad" aria-label="Direction pad">
      <button class="ns-key ns-up" data-dir="up" aria-label="Up">▲</button>
      <button class="ns-key ns-left" data-dir="left" aria-label="Left">◀</button>
      <button class="ns-key ns-right" data-dir="right" aria-label="Right">▶</button>
      <button class="ns-key ns-down" data-dir="down" aria-label="Down">▼</button>
    </div>
  `);

  /* ── world state ── */
  let W = 0, H = 0, cols = 0, rows = 0, cell = CELL, offX = 0, offY = 0;
  let snake = [];
  let prevSnake = [];
  let dir = { x: 1, y: 0 };
  let queuedDirs = [];
  let foods = [];
  let walls = [];
  let portals = [];
  let pickups = [];      // floating power-up orbs
  let paused = false;
  let running = false;
  let over = false;

  let stepAcc = 0;
  let interval = BASE_INTERVAL;
  let lastFrame = 0;
  let rafId = null;
  let tick = 0;

  let comboCount = 0;
  let comboExpiry = 0;
  let bestCombo = 0;
  let eaten = 0;
  let dashing = false;
  let hueShift = 0;

  const particles = new Particles(520);
  const floats = new FloatingTexts();
  const shake = new Shake();

  /* ── layout ── */
  function resize() {
    const dims = fitCanvas(canvas, shell.stage);
    W = dims.w;
    H = dims.h;
    // Keep the play field on a whole number of cells and centre it.
    cell = clamp(Math.floor(Math.min(W, H) / 22), 16, 34);
    cols = Math.max(12, Math.floor((W - 24) / cell));
    rows = Math.max(12, Math.floor((H - 24) / cell));
    offX = Math.floor((W - cols * cell) / 2);
    offY = Math.floor((H - rows * cell) / 2);
  }
  resize();

  const ro = new ResizeObserver(() => resize());
  ro.observe(shell.stage);

  /* ── helpers ── */
  const cx = (gx) => offX + gx * cell + cell / 2;
  const cy = (gy) => offY + gy * cell + cell / 2;
  const keyOf = (x, y) => x + ',' + y;

  function occupied() {
    const set = new Set();
    snake.forEach((s) => set.add(keyOf(s.x, s.y)));
    walls.forEach((w) => set.add(keyOf(w.x, w.y)));
    foods.forEach((f) => set.add(keyOf(f.x, f.y)));
    pickups.forEach((p) => set.add(keyOf(p.x, p.y)));
    portals.forEach((p) => set.add(keyOf(p.x, p.y)));
    return set;
  }

  function freeCell() {
    const taken = occupied();
    for (let attempt = 0; attempt < 400; attempt++) {
      const x = randInt(0, cols - 1);
      const y = randInt(0, rows - 1);
      if (!taken.has(keyOf(x, y))) return { x, y };
    }
    return null;
  }

  function rollFoodType() {
    const total = Object.values(FOOD).reduce((s, f) => s + f.weight, 0);
    let r = Math.random() * total;
    for (const [name, def] of Object.entries(FOOD)) {
      r -= def.weight;
      if (r <= 0) return name;
    }
    return 'apple';
  }

  function spawnFood(type) {
    const spot = freeCell();
    if (!spot) return;
    foods.push({
      x: spot.x, y: spot.y,
      type: type || rollFoodType(),
      born: performance.now(),
      // Plasma berries rot — eat them fast or they vanish.
      ttl: type === 'plasma' ? 9000 : 0,
    });
  }

  function spawnPickup() {
    const spot = freeCell();
    if (!spot) return;
    pickups.push({
      x: spot.x, y: spot.y,
      kind: POWER_KEYS[randInt(0, POWER_KEYS.length - 1)],
      born: performance.now(),
      ttl: 11000,
    });
  }

  function spawnWallCluster() {
    const spot = freeCell();
    if (!spot) return;
    const len = randInt(2, 4);
    const horizontal = Math.random() < 0.5;
    for (let i = 0; i < len; i++) {
      const x = spot.x + (horizontal ? i : 0);
      const y = spot.y + (horizontal ? 0 : i);
      if (x >= cols || y >= rows) break;
      // Never wall in the snake's immediate path.
      const head = snake[0];
      if (Math.abs(x - head.x) < 3 && Math.abs(y - head.y) < 3) continue;
      walls.push({ x, y, born: performance.now() });
    }
  }

  function openPortals() {
    portals = [];
    const a = freeCell();
    const b = freeCell();
    if (!a || !b) return;
    portals.push({ x: a.x, y: a.y, link: 1 }, { x: b.x, y: b.y, link: 0 });
  }

  /* ── run lifecycle ── */
  function startRun() {
    resize();
    const midX = Math.floor(cols / 2);
    const midY = Math.floor(rows / 2);
    snake = [
      { x: midX, y: midY },
      { x: midX - 1, y: midY },
      { x: midX - 2, y: midY },
    ];
    prevSnake = snake.map((s) => ({ ...s }));
    dir = { x: 1, y: 0 };
    queuedDirs = [];
    foods = [];
    walls = [];
    portals = [];
    pickups = [];
    particles.clear();
    floats.clear();

    interval = BASE_INTERVAL;
    stepAcc = 0;
    tick = 0;
    comboCount = 0;
    comboExpiry = 0;
    bestCombo = 0;
    eaten = 0;
    dashing = false;
    paused = false;
    over = false;
    running = true;

    spawnFood('apple');
    spawnFood();
    shell.setStat('length', snake.length);
    shell.setCombo(0);

    lastFrame = performance.now();
    if (!rafId) rafId = requestAnimationFrame(frame);
  }

  /* ── input ── */
  const DIRS = {
    up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
    left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
  };

  function queueDir(name) {
    const nd = DIRS[name];
    if (!nd || !running || over) return;
    // Compare against the last queued direction so fast double-taps register.
    const ref = queuedDirs.length ? queuedDirs[queuedDirs.length - 1] : dir;
    if (nd.x === -ref.x && nd.y === -ref.y) return; // no instant 180s
    if (nd.x === ref.x && nd.y === ref.y) return;
    if (queuedDirs.length < 3) queuedDirs.push(nd);
  }

  function onKeyDown(e) {
    const k = e.key.toLowerCase();
    if (k === 'arrowup' || k === 'w') { queueDir('up'); e.preventDefault(); }
    else if (k === 'arrowdown' || k === 's') { queueDir('down'); e.preventDefault(); }
    else if (k === 'arrowleft' || k === 'a') { queueDir('left'); e.preventDefault(); }
    else if (k === 'arrowright' || k === 'd') { queueDir('right'); e.preventDefault(); }
    if (e.key === 'Shift') dashing = true;
  }
  function onKeyUp(e) {
    if (e.key === 'Shift') dashing = false;
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // Swipe
  let touchStart = null;
  function onTouchStart(e) {
    const t = e.changedTouches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  }
  function onTouchEnd(e) {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    if (Math.abs(dx) < 22 && Math.abs(dy) < 22) { touchStart = null; return; }
    if (Math.abs(dx) > Math.abs(dy)) queueDir(dx > 0 ? 'right' : 'left');
    else queueDir(dy > 0 ? 'down' : 'up');
    touchStart = null;
  }
  canvas.addEventListener('touchstart', onTouchStart, { passive: true });
  canvas.addEventListener('touchend', onTouchEnd, { passive: true });

  function onPadDown(e) {
    const btn = e.target.closest('[data-dir]');
    if (!btn) return;
    e.preventDefault();
    queueDir(btn.dataset.dir);
  }
  const pad = container.querySelector('.ns-dpad');
  pad?.addEventListener('pointerdown', onPadDown);

  /* ── combo ── */
  function bumpCombo() {
    const now = performance.now();
    comboCount = now < comboExpiry ? comboCount + 1 : 1;
    comboExpiry = now + COMBO_WINDOW;
    bestCombo = Math.max(bestCombo, comboCount);
    shell.setCombo(comboCount, 1);
    if (comboCount >= 2) sfx.combo(comboCount);
  }

  function comboMultiplier() {
    if (comboCount < 2) return 1;
    return 1 + Math.min(comboCount - 1, 9) * 0.5; // caps at 5.5x
  }

  /* ── simulation ── */
  function step() {
    tick++;

    if (queuedDirs.length) dir = queuedDirs.shift();

    const head = snake[0];
    let nx = head.x + dir.x;
    let ny = head.y + dir.y;

    const ghost = shell.hasPowerup('ghost');

    // Walls of the arena: ghost wraps, otherwise it is fatal.
    if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) {
      if (ghost) {
        nx = (nx + cols) % cols;
        ny = (ny + rows) % rows;
      } else {
        return die('wall');
      }
    }

    // Portal hop
    const portal = portals.find((p) => p.x === nx && p.y === ny);
    if (portal) {
      const exit = portals[portal.link];
      if (exit) {
        particles.burst({ x: cx(nx), y: cy(ny), count: 18, color: '#A78BFA', speed: 4, size: 4, life: 30, gravity: 0 });
        nx = exit.x + dir.x;
        ny = exit.y + dir.y;
        nx = (nx + cols) % cols;
        ny = (ny + rows) % rows;
        sfx.pickup();
      }
    }

    // Obstacle
    if (walls.some((w) => w.x === nx && w.y === ny)) {
      if (shell.hasPowerup('shield')) {
        walls = walls.filter((w) => !(w.x === nx && w.y === ny));
        shell.clearPowerup('shield');
        breakFeedback(nx, ny, '#FF5F4D', 'Shield used!');
      } else if (!ghost) {
        return die('wall');
      }
    }

    // Self
    const selfHit = snake.some((s, i) => i > 0 && s.x === nx && s.y === ny);
    if (selfHit && !ghost) {
      if (shell.hasPowerup('shield')) {
        shell.clearPowerup('shield');
        // Snap back to a safe length instead of ending the run.
        snake = snake.slice(0, Math.max(3, Math.floor(snake.length / 2)));
        breakFeedback(nx, ny, '#FF5F4D', 'Shield saved you!');
      } else {
        return die('self');
      }
    }

    prevSnake = snake.map((s) => ({ ...s }));
    snake.unshift({ x: nx, y: ny });

    // Magnet drags nearby food one cell closer each step.
    if (shell.hasPowerup('magnet')) {
      foods.forEach((f) => {
        const dx = nx - f.x;
        const dy = ny - f.y;
        if (Math.abs(dx) + Math.abs(dy) <= 6) {
          if (Math.abs(dx) > Math.abs(dy)) f.x += Math.sign(dx);
          else if (dy !== 0) f.y += Math.sign(dy);
        }
      });
    }

    // Eat?
    const foodIdx = foods.findIndex((f) => f.x === nx && f.y === ny);
    if (foodIdx >= 0) {
      const food = foods.splice(foodIdx, 1)[0];
      eat(food, nx, ny);
    } else {
      snake.pop();
    }

    // Power-up orb?
    const puIdx = pickups.findIndex((p) => p.x === nx && p.y === ny);
    if (puIdx >= 0) {
      const orb = pickups.splice(puIdx, 1)[0];
      grabPowerup(orb, nx, ny);
    }

    // Dash trims a segment for a burst of speed — a real risk/reward choice.
    if (dashing && snake.length > 4 && tick % 3 === 0) {
      snake.pop();
      particles.burst({ x: cx(snake[snake.length - 1].x), y: cy(snake[snake.length - 1].y), count: 4, color: '#22D3EE', speed: 2.4, size: 3, life: 18, gravity: 0 });
    }

    // Timed spawns & escalation
    if (foods.length === 0) spawnFood();
    if (foods.length < 2 && tick % 40 === 0) spawnFood();
    if (tick % 95 === 0 && pickups.length < 2) spawnPickup();
    if (eaten >= 8 && tick % 130 === 0 && walls.length < 34) spawnWallCluster();
    if (eaten >= 14 && portals.length === 0) openPortals();
    if (eaten >= 14 && tick % 420 === 0) openPortals();

    // Expire timed objects
    const now = performance.now();
    foods = foods.filter((f) => !f.ttl || now - f.born < f.ttl);
    pickups = pickups.filter((p) => now - p.born < p.ttl);

    if (comboCount > 0 && now > comboExpiry) {
      comboCount = 0;
      shell.setCombo(0);
    }

    shell.setStat('length', snake.length);
  }

  function eat(food, gx, gy) {
    const def = FOOD[food.type];
    bumpCombo();
    eaten++;

    const mult = comboMultiplier() * (shell.hasPowerup('double') ? 2 : 1);
    const gained = Math.round(def.points * mult);
    shell.addScore(gained, { pop: true });
    shell.addCoins(def.coins);

    // Gold berries grow you more; plasma grows you less but scores fast.
    const growth = food.type === 'gold' ? 3 : food.type === 'plasma' ? 0 : 1;
    for (let i = 0; i < growth; i++) snake.push({ ...snake[snake.length - 1] });

    particles.burst({ x: cx(gx), y: cy(gy), count: food.type === 'gold' ? 26 : 15, color: [def.color, def.glow, '#ffffff'], speed: food.type === 'gold' ? 6 : 4.4, size: 4, life: 32, gravity: 0.05 });
    floats.add(cx(gx), cy(gy) - cell * 0.5, `+${gained}`, { color: def.glow, size: comboCount > 3 ? 24 : 19, stroke: 'rgba(0,0,0,0.55)' });
    if (comboCount >= 3) {
      floats.add(cx(gx), cy(gy) - cell * 1.3, `${comboCount}x CHAIN`, { color: '#FFC93C', size: 15, life: 46, stroke: 'rgba(0,0,0,0.5)' });
    }
    shake.add(food.type === 'gold' ? 5 : 2.5);
    food.type === 'gold' ? sfx.coin() : sfx.pickup();
    haptic(8);

    // Speed ramps with every bite but never past the floor.
    interval = Math.max(MIN_INTERVAL, BASE_INTERVAL - eaten * 2.1);

    // Milestone rewards keep long runs interesting.
    if (eaten % 10 === 0) {
      shell.toast(`${eaten} berries — speed up!`, 'warn');
      spawnPickup();
    }
  }

  function grabPowerup(orb, gx, gy) {
    const def = POWERUPS[orb.kind];
    shell.addPowerup(orb.kind, def);
    shell.countPowerup();
    particles.burst({ x: cx(gx), y: cy(gy), count: 30, color: [def.color, '#ffffff'], speed: 6, size: 4.5, life: 36, gravity: 0 });
    floats.add(cx(gx), cy(gy) - cell * 0.6, def.label.toUpperCase(), { color: def.color, size: 18, life: 52, stroke: 'rgba(0,0,0,0.5)' });
    shake.add(6);
    sfx.powerup();
    haptic([10, 30, 10]);

    if (orb.kind === 'slow') interval = Math.min(BASE_INTERVAL, interval * 1.55);
  }

  function breakFeedback(gx, gy, color, message) {
    particles.burst({ x: cx(gx), y: cy(gy), count: 30, color: [color, '#ffffff'], speed: 7, size: 5, life: 34, gravity: 0.1 });
    shake.add(11);
    shell.toast(message, 'warn');
    sfx.hit();
    haptic(40);
  }

  function die(cause) {
    if (over) return;
    over = true;
    running = false;
    const head = snake[0];
    particles.burst({ x: cx(head.x), y: cy(head.y), count: 46, color: ['#FF3B5C', '#FFC93C', '#ffffff'], speed: 8.5, size: 5.5, life: 46, gravity: 0.16 });
    shake.add(20);
    sfx.crash();
    haptic([30, 50, 60]);

    overTimer = setTimeout(() => {
      gs.gameOver({
        bestCombo,
        eyebrow: cause === 'self' ? 'Tangled in your own tail' : 'Crashed',
        stats: [
          { label: 'Berries eaten', value: eaten },
          { label: 'Final length', value: snake.length },
        ],
      });
    }, 520);
  }

  /* ── rendering ── */
  function drawBackground(time) {
    ctx.fillStyle = '#05070F';
    ctx.fillRect(0, 0, W, H);

    // Field
    ctx.save();
    const fx = offX, fy = offY, fw = cols * cell, fh = rows * cell;
    const grad = ctx.createLinearGradient(fx, fy, fx + fw, fy + fh);
    grad.addColorStop(0, 'rgba(31, 201, 139, 0.055)');
    grad.addColorStop(0.5, 'rgba(34, 211, 238, 0.035)');
    grad.addColorStop(1, 'rgba(139, 92, 246, 0.055)');
    ctx.fillStyle = grad;
    roundRect(ctx, fx, fy, fw, fh, 14);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.035)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < cols; i++) {
      ctx.moveTo(fx + i * cell, fy);
      ctx.lineTo(fx + i * cell, fy + fh);
    }
    for (let j = 1; j < rows; j++) {
      ctx.moveTo(fx, fy + j * cell);
      ctx.lineTo(fx + fw, fy + j * cell);
    }
    ctx.stroke();

    // Border glows with the active combo.
    const heat = clamp(comboCount / 8, 0, 1);
    ctx.strokeStyle = `rgba(${Math.round(lerp(34, 255, heat))}, ${Math.round(lerp(211, 201, heat))}, ${Math.round(lerp(238, 60, heat))}, ${0.3 + heat * 0.45})`;
    ctx.lineWidth = 2 + heat * 2;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 14 + heat * 22;
    roundRect(ctx, fx, fy, fw, fh, 14);
    ctx.stroke();
    ctx.restore();
  }

  function drawWalls(time) {
    walls.forEach((w) => {
      const age = clamp((time - w.born) / 380, 0, 1);
      const s = cell * (0.82 * age);
      ctx.save();
      ctx.translate(cx(w.x), cy(w.y));
      ctx.fillStyle = 'rgba(255, 95, 77, 0.22)';
      ctx.strokeStyle = 'rgba(255, 95, 77, 0.85)';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(255,95,77,0.6)';
      ctx.shadowBlur = 12;
      roundRect(ctx, -s / 2, -s / 2, s, s, 5);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawPortals(time) {
    portals.forEach((p, i) => {
      const pulse = 0.5 + Math.sin(time / 240 + i * 1.7) * 0.5;
      ctx.save();
      ctx.translate(cx(p.x), cy(p.y));
      ctx.rotate(time / 700 + i);
      ctx.strokeStyle = `rgba(167, 139, 250, ${0.55 + pulse * 0.4})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#A78BFA';
      ctx.shadowBlur = 18;
      for (let r = 0; r < 2; r++) {
        ctx.beginPath();
        ctx.arc(0, 0, cell * (0.24 + r * 0.14) * (0.85 + pulse * 0.25), 0, TAU * 0.72);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  function drawFood(time) {
    foods.forEach((f) => {
      const def = FOOD[f.type];
      const age = time - f.born;
      const pop = clamp(age / 260, 0, 1);
      const pulse = 1 + Math.sin(time / 190 + f.x * 0.7) * 0.1;
      // Plasma berries blink as their timer runs out.
      const expiring = f.ttl && age > f.ttl - 2400;
      if (expiring && Math.floor(time / 130) % 2 === 0) return;

      const r = cell * 0.31 * pop * pulse;
      ctx.save();
      ctx.translate(cx(f.x), cy(f.y));
      ctx.shadowColor = def.glow;
      ctx.shadowBlur = 20;
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath();
      ctx.arc(-r * 0.28, -r * 0.3, r * 0.26, 0, TAU);
      ctx.fill();

      if (f.type === 'gold') {
        ctx.strokeStyle = 'rgba(255,224,138,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.7 + Math.sin(time / 160) * 2, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  function drawPickups(time) {
    pickups.forEach((p) => {
      const def = POWERUPS[p.kind];
      const age = time - p.born;
      const pop = clamp(age / 300, 0, 1);
      const expiring = age > p.ttl - 2600;
      if (expiring && Math.floor(time / 140) % 2 === 0) return;

      const r = cell * 0.36 * pop;
      const bob = Math.sin(time / 300 + p.x) * cell * 0.08;
      ctx.save();
      ctx.translate(cx(p.x), cy(p.y) + bob);
      ctx.rotate(Math.sin(time / 520 + p.y) * 0.22);
      ctx.shadowColor = def.color;
      ctx.shadowBlur = 22;
      ctx.fillStyle = 'rgba(8,10,18,0.9)';
      ctx.strokeStyle = def.color;
      ctx.lineWidth = 2.4;
      roundRect(ctx, -r, -r, r * 2, r * 2, r * 0.42);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.font = `${Math.round(r * 1.15)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(def.icon, 0, r * 0.06);
      ctx.restore();
    });
  }

  function drawSnake(alpha, time) {
    const ghost = shell.hasPowerup('ghost');
    const shielded = shell.hasPowerup('shield');
    const len = snake.length;

    ctx.save();
    ctx.globalAlpha = ghost ? 0.62 : 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Body as one glowing polyline — interpolated for smooth motion.
    const pts = [];
    for (let i = 0; i < len; i++) {
      const cur = snake[i];
      const prev = prevSnake[i] || prevSnake[prevSnake.length - 1] || cur;
      // Wrapping segments would smear across the board, so snap those.
      const wrapped = Math.abs(cur.x - prev.x) > 1 || Math.abs(cur.y - prev.y) > 1;
      const px = wrapped ? cur.x : lerp(prev.x, cur.x, alpha);
      const py = wrapped ? cur.y : lerp(prev.y, cur.y, alpha);
      pts.push({ x: cx(px) - cell / 2 + cell / 2, y: cy(py) - cell / 2 + cell / 2 });
    }

    const heat = clamp(comboCount / 8, 0, 1);
    const hueA = 160 + hueShift;
    for (let pass = 0; pass < 2; pass++) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      if (pass === 0) {
        ctx.strokeStyle = `hsla(${hueA}, 90%, 60%, 0.28)`;
        ctx.lineWidth = cell * 0.94;
        ctx.shadowColor = `hsla(${hueA + heat * 60}, 95%, 60%, 0.9)`;
        ctx.shadowBlur = 26 + heat * 26;
      } else {
        const g = ctx.createLinearGradient(pts[0].x, pts[0].y, pts[pts.length - 1].x, pts[pts.length - 1].y);
        g.addColorStop(0, `hsl(${hueA + 30 + heat * 40}, 95%, 64%)`);
        g.addColorStop(1, `hsl(${hueA - 20}, 80%, 44%)`);
        ctx.strokeStyle = g;
        ctx.lineWidth = cell * 0.66;
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
    }

    // Head
    const head = pts[0];
    ctx.shadowColor = '#7CF2C4';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#D9FFF1';
    ctx.beginPath();
    ctx.arc(head.x, head.y, cell * 0.38, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Eyes look where the snake is going.
    const ex = dir.x * cell * 0.13;
    const ey = dir.y * cell * 0.13;
    const px = -dir.y * cell * 0.14;
    const py = dir.x * cell * 0.14;
    ctx.fillStyle = '#05231A';
    [1, -1].forEach((s) => {
      ctx.beginPath();
      ctx.arc(head.x + ex + px * s, head.y + ey + py * s, cell * 0.075, 0, TAU);
      ctx.fill();
    });

    if (shielded) {
      ctx.strokeStyle = `rgba(255, 95, 77, ${0.5 + Math.sin(time / 150) * 0.28})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#FF5F4D';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(head.x, head.y, cell * 0.72, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function render(alpha, time) {
    ctx.save();
    shake.apply(ctx);
    drawBackground(time);
    drawPortals(time);
    drawWalls(time);
    drawFood(time);
    drawPickups(time);
    if (snake.length) drawSnake(alpha, time);
    particles.draw(ctx);
    floats.draw(ctx);
    ctx.restore();
  }

  /* ── main loop ── */
  function frame(now) {
    rafId = requestAnimationFrame(frame);
    const dt = Math.min(80, now - lastFrame);
    lastFrame = now;

    if (running && !paused && !over) {
      const speedScale = dashing && snake.length > 4 ? 0.6 : 1;
      stepAcc += dt / speedScale;
      let guard = 0;
      while (stepAcc >= interval && guard < 3 && !over) {
        stepAcc -= interval;
        step();
        guard++;
      }
      hueShift = (hueShift + 0.25) % 360;

      if (comboCount > 0) {
        const left = clamp((comboExpiry - now) / COMBO_WINDOW, 0, 1);
        shell.setCombo(comboCount, left);
      }
    }

    particles.update();
    floats.update();
    shake.update();

    const alpha = running && !paused && !over ? clamp(stepAcc / interval, 0, 1) : 1;
    render(alpha, now);
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
    canvas.removeEventListener('touchstart', onTouchStart);
    canvas.removeEventListener('touchend', onTouchEnd);
    pad?.removeEventListener('pointerdown', onPadDown);
  }

  teardown = cleanup;
}

export function destroyGame() {
  if (teardown) { teardown(); teardown = null; }
  if (shell) { shell.destroy(); shell = null; }
}
