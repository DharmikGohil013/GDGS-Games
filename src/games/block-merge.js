// ─── Block Merge — Deluxe 2048 ───
// Animated slides and merges, chain multipliers across consecutive merging
// moves, golden tiles, and three earned power-ups: undo, hammer and shuffle.

import { createGameShell } from '../core/gameShell.js';
import { sfx, haptic } from '../core/audio.js';
import {
  Particles, FloatingTexts, Shake, fitCanvas, roundRect,
  clamp, lerp, ease, randInt, TAU,
} from '../core/juice.js';

let shell = null;
let teardown = null;

const SIZE = 4;
const SLIDE_MS = 105;
const CHAIN_WINDOW = 3;   // moves without a merge before the chain drops

const TILE_STYLE = {
  2:    { bg: '#2D3350', fg: '#E7EAF4' },
  4:    { bg: '#3A3F63', fg: '#E7EAF4' },
  8:    { bg: '#3E6BFF', fg: '#FFFFFF' },
  16:   { bg: '#22D3EE', fg: '#06222B' },
  32:   { bg: '#1FC98B', fg: '#04231A' },
  64:   { bg: '#A3E635', fg: '#1A2205' },
  128:  { bg: '#FFC93C', fg: '#2A1D00' },
  256:  { bg: '#FF9F2E', fg: '#2A1400' },
  512:  { bg: '#FF5F4D', fg: '#2A0A06' },
  1024: { bg: '#F43F8E', fg: '#FFFFFF' },
  2048: { bg: '#8B5CF6', fg: '#FFFFFF' },
  4096: { bg: '#A78BFA', fg: '#1B0B3A' },
  8192: { bg: '#E0E7FF', fg: '#1B0B3A' },
};
const styleFor = (v) => TILE_STYLE[v] || TILE_STYLE[8192];

let tileSeq = 1;

export function initGame(container) {
  destroyGame();

  shell = createGameShell(container, {
    id: 'block-merge',
    title: 'Block Merge',
    accent: 'purple',
    accent2: 'cyan',
    tagline: 'Merge · Chain · Break 2048',
    howTo: [
      { key: '↑ ↓ ← →', label: 'Slide every tile (WASD works too)' },
      { key: 'Swipe', label: 'Slide on touch devices' },
      { key: 'Z', label: 'Undo the last move' },
      { key: 'Chain', label: 'Merge on back-to-back moves for a multiplier' },
    ],
    stats: [
      { key: 'score', label: 'Score' },
      { key: 'best', label: 'Best' },
      { key: 'top', label: 'Top tile', initial: 0 },
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
  canvas.style.background = '#080A14';
  shell.stage.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  shell.setControls(`
    <div class="bm-tools">
      <button class="bm-tool" data-tool="undo" aria-label="Undo last move">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 1 3 6.7"/><polyline points="3 5 3 11 9 11"/></svg>
        <span>Undo</span><b data-count="undo">3</b>
      </button>
      <button class="bm-tool" data-tool="hammer" aria-label="Hammer a tile">
        <span class="bm-tool-emoji">🔨</span><span>Hammer</span><b data-count="hammer">1</b>
      </button>
      <button class="bm-tool" data-tool="shuffle" aria-label="Shuffle the board">
        <span class="bm-tool-emoji">🔀</span><span>Shuffle</span><b data-count="shuffle">1</b>
      </button>
    </div>
  `);

  /* ── state ── */
  let W = 0, H = 0, boardX = 0, boardY = 0, boardSize = 0, cellSize = 0, gap = 0;
  let tiles = [];
  let history = [];
  let anim = 1;            // 0..1 slide progress; 1 = settled
  let pendingSpawn = null;
  let chain = 0;
  let bestChain = 0;
  let movesSinceMerge = 0;
  let moves = 0;
  let merges = 0;
  let topTile = 0;
  let reached2048 = false;
  let hammerArmed = false;
  const tools = { undo: 3, hammer: 1, shuffle: 1 };
  let paused = false;
  let running = false;
  let over = false;
  let last = 0;
  let rafId = null;
  let time = 0;

  const particles = new Particles(460);
  const floats = new FloatingTexts();
  const shake = new Shake();

  function resize() {
    const d = fitCanvas(canvas, shell.stage);
    W = d.w;
    H = d.h;
    boardSize = Math.min(W - 40, H - 150, 460);
    boardSize = Math.max(200, boardSize);
    gap = boardSize * 0.026;
    cellSize = (boardSize - gap * (SIZE + 1)) / SIZE;
    boardX = (W - boardSize) / 2;
    boardY = (H - boardSize) / 2 + 14;
  }
  resize();
  const ro = new ResizeObserver(() => resize());
  ro.observe(shell.stage);

  const cellX = (c) => boardX + gap + c * (cellSize + gap);
  const cellY = (r) => boardY + gap + r * (cellSize + gap);

  /* ── board helpers ── */
  function grid() {
    const g = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
    tiles.forEach((t) => { if (!t.dead) g[t.r][t.c] = t; });
    return g;
  }

  function emptyCells() {
    const g = grid();
    const out = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) if (!g[r][c]) out.push({ r, c });
    }
    return out;
  }

  function addTile(r, c, value, golden = false) {
    const t = {
      id: tileSeq++, r, c, fr: r, fc: c,
      value, golden,
      isNew: true, dead: false, pop: 0, spawn: 0,
    };
    tiles.push(t);
    return t;
  }

  function spawnRandom() {
    const cells = emptyCells();
    if (!cells.length) return null;
    const spot = cells[randInt(0, cells.length - 1)];
    const value = Math.random() < 0.88 ? 2 : 4;
    // Golden tiles double their merge payout — worth steering toward.
    const golden = Math.random() < 0.07 && moves > 4;
    return addTile(spot.r, spot.c, value, golden);
  }

  function snapshot() {
    return {
      tiles: tiles.filter((t) => !t.dead).map((t) => ({ r: t.r, c: t.c, value: t.value, golden: t.golden })),
      score: shell.score,
      coins: shell.coins,
      chain, movesSinceMerge, topTile, moves, merges,
    };
  }

  function restore(snap) {
    tiles = snap.tiles.map((t) => ({
      id: tileSeq++, r: t.r, c: t.c, fr: t.r, fc: t.c,
      value: t.value, golden: t.golden,
      isNew: false, dead: false, pop: 0, spawn: 1,
    }));
    shell.setScore(snap.score);
    shell.setCoins(snap.coins);
    chain = snap.chain;
    movesSinceMerge = snap.movesSinceMerge;
    topTile = snap.topTile;
    moves = snap.moves;
    merges = snap.merges;
    anim = 1;
    pendingSpawn = null;
    over = false;
    shell.setStat('top', topTile);
    shell.setCombo(chain >= 2 ? chain : 0, 1);
  }

  /* ── run ── */
  function startRun() {
    resize();
    tiles = [];
    history = [];
    anim = 1;
    pendingSpawn = null;
    chain = 0;
    bestChain = 0;
    movesSinceMerge = 0;
    moves = 0;
    merges = 0;
    topTile = 0;
    reached2048 = false;
    hammerArmed = false;
    tools.undo = 3;
    tools.hammer = 1;
    tools.shuffle = 1;
    paintTools();
    particles.clear();
    floats.clear();
    paused = false;
    over = false;
    running = true;

    spawnRandom();
    spawnRandom();
    tiles.forEach((t) => { t.spawn = 0; });
    shell.setStat('top', 0);
    shell.setCombo(0);

    last = performance.now();
    if (!rafId) rafId = requestAnimationFrame(frame);
  }

  function paintTools() {
    Object.keys(tools).forEach((k) => {
      const el = container.querySelector(`[data-count="${k}"]`);
      if (el) el.textContent = tools[k];
      const btn = container.querySelector(`[data-tool="${k}"]`);
      if (btn) {
        btn.classList.toggle('is-empty', tools[k] <= 0);
        btn.classList.toggle('is-armed', k === 'hammer' && hammerArmed);
      }
    });
  }

  /* ── movement ── */
  const VECTORS = {
    up: { dr: -1, dc: 0 }, down: { dr: 1, dc: 0 },
    left: { dr: 0, dc: -1 }, right: { dr: 0, dc: 1 },
  };

  function traversals(dir) {
    const rowsOrder = [];
    const colsOrder = [];
    for (let i = 0; i < SIZE; i++) { rowsOrder.push(i); colsOrder.push(i); }
    // Walk from the far edge so the leading tiles resolve first.
    if (dir === 'down') rowsOrder.reverse();
    if (dir === 'right') colsOrder.reverse();
    return { rowsOrder, colsOrder };
  }

  function move(dir) {
    if (!running || over || paused || anim < 1 || hammerArmed) return;

    const vec = VECTORS[dir];
    const { rowsOrder, colsOrder } = traversals(dir);
    const g = grid();
    const before = snapshot();

    let moved = false;
    let mergeCount = 0;
    let movePoints = 0;
    const mergeEvents = [];
    const mergedThisMove = new Set();

    rowsOrder.forEach((r) => {
      colsOrder.forEach((c) => {
        const tile = g[r][c];
        if (!tile) return;

        let nr = r;
        let nc = c;
        // Slide until blocked.
        while (true) {
          const tr = nr + vec.dr;
          const tc = nc + vec.dc;
          if (tr < 0 || tr >= SIZE || tc < 0 || tc >= SIZE) break;
          if (g[tr][tc]) break;
          nr = tr;
          nc = tc;
        }

        const tr = nr + vec.dr;
        const tc = nc + vec.dc;
        const target = (tr >= 0 && tr < SIZE && tc >= 0 && tc < SIZE) ? g[tr][tc] : null;

        if (target && target.value === tile.value && !mergedThisMove.has(target.id) && !mergedThisMove.has(tile.id)) {
          // Merge into the target cell.
          g[r][c] = null;
          tile.r = tr;
          tile.c = tc;
          tile.dead = true;
          tile.merging = true;
          target.dead = true;
          target.merging = true;
          mergedThisMove.add(target.id);
          mergedThisMove.add(tile.id);

          const golden = tile.golden || target.golden;
          const value = tile.value * 2;
          mergeEvents.push({ r: tr, c: tc, value, golden });
          mergeCount++;
          movePoints += value * (golden ? 2 : 1);
          moved = true;
        } else if (nr !== r || nc !== c) {
          g[r][c] = null;
          g[nr][nc] = tile;
          tile.fr = r;
          tile.fc = c;
          tile.r = nr;
          tile.c = nc;
          moved = true;
        }
      });
    });

    if (!moved) {
      sfx.error();
      shake.add(2.5);
      return;
    }

    moves++;
    history.push(before);
    if (history.length > 12) history.shift();

    // ── chain multiplier ──
    if (mergeCount > 0) {
      merges += mergeCount;
      movesSinceMerge = 0;
      chain += mergeCount;
      bestChain = Math.max(bestChain, chain);
      shell.setCombo(chain, 1);
      if (chain >= 3) sfx.combo(chain);
    } else {
      movesSinceMerge++;
      if (movesSinceMerge >= CHAIN_WINDOW && chain > 0) {
        if (chain >= 5) shell.toast(`${chain}x chain lost`, 'warn');
        chain = 0;
        shell.setCombo(0);
      }
    }

    const chainMult = 1 + Math.min(chain, 12) * 0.2;
    const gained = Math.round(movePoints * chainMult);
    if (gained > 0) {
      shell.addScore(gained, { pop: true });
      shell.addCoins(Math.max(1, Math.floor(movePoints / 32)));
    }

    anim = 0;
    pendingSpawn = { mergeEvents, gained, chainMult };
    sfx.hop();
    haptic(5);
  }

  /** Runs once the slide animation finishes. */
  function commitMove() {
    const { mergeEvents, chainMult } = pendingSpawn;
    pendingSpawn = null;

    tiles = tiles.filter((t) => !t.dead);

    mergeEvents.forEach((ev) => {
      const t = addTile(ev.r, ev.c, ev.value, false);
      t.isNew = false;
      t.pop = 1;
      t.spawn = 1;

      topTile = Math.max(topTile, ev.value);
      const style = styleFor(ev.value);
      const px = cellX(ev.c) + cellSize / 2;
      const py = cellY(ev.r) + cellSize / 2;

      particles.burst({
        x: px, y: py,
        count: ev.golden ? 26 : clamp(8 + Math.log2(ev.value) * 2, 8, 26),
        color: ev.golden ? ['#FFC93C', '#ffffff'] : [style.bg, '#ffffff'],
        speed: 4.2, size: 3.6, life: 30, gravity: 0.1, shape: 'square',
      });

      if (ev.golden) {
        floats.add(px, py - cellSize * 0.4, 'GOLDEN 2x', { color: '#FFC93C', size: 15, life: 52, stroke: 'rgba(0,0,0,0.5)' });
        shell.addCoins(8);
      }
      sfx.merge(Math.log2(ev.value));

      if (ev.value >= 128) shake.add(clamp(Math.log2(ev.value), 3, 12));

      // Milestone tiles hand out power-ups instead of just points.
      if (ev.value === 128 && tools.hammer < 3) { tools.hammer++; shell.toast('128 tile — hammer earned!', 'good'); sfx.reward(); }
      if (ev.value === 256 && tools.undo < 6) { tools.undo += 2; shell.toast('256 tile — 2 undos earned!', 'good'); sfx.reward(); }
      if (ev.value === 512 && tools.shuffle < 3) { tools.shuffle++; shell.toast('512 tile — shuffle earned!', 'good'); sfx.reward(); }
      if (ev.value === 1024) { shell.addCoins(100); shell.toast('1024! +100 coins', 'good'); sfx.reward(); }
      if (ev.value >= 2048 && !reached2048) {
        reached2048 = true;
        shell.addCoins(500);
        shell.toast('2048 reached! Keep going for the record', 'good');
        sfx.levelUp();
      }
    });

    if (mergeEvents.length >= 2) {
      floats.add(W / 2, boardY - 18, `${mergeEvents.length} MERGES · ${chainMult.toFixed(1)}x`, {
        color: '#22D3EE', size: 17, life: 54, stroke: 'rgba(0,0,0,0.5)',
      });
    }

    shell.setStat('top', topTile);
    paintTools();

    const spawned = spawnRandom();
    if (spawned && spawned.golden) {
      floats.add(cellX(spawned.c) + cellSize / 2, cellY(spawned.r) + cellSize / 2 - 6, 'GOLD', {
        color: '#FFC93C', size: 13, life: 44, stroke: 'rgba(0,0,0,0.5)',
      });
    }

    tiles.forEach((t) => { t.fr = t.r; t.fc = t.c; });
    anim = 1;

    if (!hasMoves()) endRun();
  }

  function hasMoves() {
    if (emptyCells().length) return true;
    const g = grid();
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const v = g[r][c]?.value;
        if (c + 1 < SIZE && g[r][c + 1]?.value === v) return true;
        if (r + 1 < SIZE && g[r + 1][c]?.value === v) return true;
      }
    }
    return false;
  }

  function endRun() {
    if (over) return;
    // A stuck board is survivable while a tool can still open it up, so the
    // run only really ends once there is nothing left to play.
    const canRescue = tools.shuffle > 0 || tools.hammer > 0 || (tools.undo > 0 && history.length > 0);
    if (canRescue) {
      shell.toast('Board is stuck — use a tool to survive!', 'warn');
      sfx.error();
      shake.add(9);
      return;
    }
    finish();
  }

  function finish() {
    over = true;
    running = false;
    shake.add(14);
    overTimer = setTimeout(() => {
      gs.gameOver({
        bestCombo: bestChain,
        eyebrow: reached2048 ? 'You cracked 2048' : 'No moves left',
        stats: [
          { label: 'Top tile', value: topTile },
          { label: 'Merges', value: merges },
          { label: 'Moves', value: moves },
        ],
      });
    }, 560);
  }

  /* ── tools ── */
  function useUndo() {
    if (tools.undo <= 0 || !history.length || over || anim < 1) { sfx.error(); return; }
    tools.undo--;
    restore(history.pop());
    paintTools();
    sfx.uiBack();
    shell.toast(`Undo used — ${tools.undo} left`, 'info');
  }

  function armHammer() {
    if (tools.hammer <= 0 || over) { sfx.error(); return; }
    hammerArmed = !hammerArmed;
    paintTools();
    sfx.ui();
    if (hammerArmed) shell.toast('Tap a tile to smash it', 'warn');
  }

  function useShuffle() {
    if (tools.shuffle <= 0 || over || anim < 1) { sfx.error(); return; }
    tools.shuffle--;
    const alive = tiles.filter((t) => !t.dead);
    const cells = [];
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) cells.push({ r, c });
    for (let i = cells.length - 1; i > 0; i--) {
      const j = randInt(0, i);
      const tmp = cells[i];
      cells[i] = cells[j];
      cells[j] = tmp;
    }
    alive.forEach((t, i) => {
      t.r = cells[i].r;
      t.c = cells[i].c;
      t.fr = t.r;
      t.fc = t.c;
      t.pop = 1;
    });
    paintTools();
    sfx.powerup();
    shake.add(7);
    shell.toast('Board shuffled', 'good');
    if (!hasMoves()) endRun();
  }

  function smashAt(px, py) {
    const g = grid();
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const t = g[r][c];
        if (!t) continue;
        const x = cellX(c);
        const y = cellY(r);
        if (px >= x && px <= x + cellSize && py >= y && py <= y + cellSize) {
          tiles = tiles.filter((tt) => tt.id !== t.id);
          tools.hammer--;
          hammerArmed = false;
          paintTools();
          particles.burst({
            x: x + cellSize / 2, y: y + cellSize / 2, count: 24,
            color: [styleFor(t.value).bg, '#ffffff'], speed: 5.4, size: 4, life: 32, gravity: 0.24, shape: 'square',
          });
          shake.add(9);
          sfx.hit();
          haptic(24);
          return;
        }
      }
    }
  }

  /* ── input ── */
  function onKey(e) {
    if (!shell.isPlaying) return;
    const k = e.key.toLowerCase();
    if (k === 'arrowup' || k === 'w') { e.preventDefault(); move('up'); }
    else if (k === 'arrowdown' || k === 's') { e.preventDefault(); move('down'); }
    else if (k === 'arrowleft' || k === 'a') { e.preventDefault(); move('left'); }
    else if (k === 'arrowright' || k === 'd') { e.preventDefault(); move('right'); }
    else if (k === 'z') { e.preventDefault(); useUndo(); }
    else if (k === 'h') { e.preventDefault(); armHammer(); }
    else if (k === 'f') { e.preventDefault(); useShuffle(); }
  }
  window.addEventListener('keydown', onKey);

  let swipeStart = null;
  function onDown(e) {
    if (e.target.closest('.gs-overlay, .gs-hud, button, a')) return;
    if (hammerArmed) {
      const rect = canvas.getBoundingClientRect();
      smashAt(e.clientX - rect.left, e.clientY - rect.top);
      return;
    }
    swipeStart = { x: e.clientX, y: e.clientY };
  }
  function onUp(e) {
    if (!swipeStart) return;
    const dx = e.clientX - swipeStart.x;
    const dy = e.clientY - swipeStart.y;
    swipeStart = null;
    if (Math.abs(dx) < 26 && Math.abs(dy) < 26) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
    else move(dy > 0 ? 'down' : 'up');
  }
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', onUp);

  const toolBar = container.querySelector('.bm-tools');
  function onTool(e) {
    const btn = e.target.closest('[data-tool]');
    if (!btn) return;
    e.preventDefault();
    const kind = btn.dataset.tool;
    if (kind === 'undo') useUndo();
    else if (kind === 'hammer') armHammer();
    else if (kind === 'shuffle') useShuffle();
  }
  toolBar?.addEventListener('pointerdown', onTool);

  /* ── render ── */
  function drawTile(t, t01) {
    const fromX = cellX(t.fc);
    const fromY = cellY(t.fr);
    const toX = cellX(t.c);
    const toY = cellY(t.r);
    const e = ease.outCubic(t01);
    let x = lerp(fromX, toX, e);
    let y = lerp(fromY, toY, e);

    let scale = 1;
    if (t.spawn < 1) scale = ease.outBack(clamp(t.spawn, 0, 1));
    if (t.pop > 0) scale *= 1 + Math.sin(t.pop * Math.PI) * 0.16;

    const style = styleFor(t.value);
    const s = cellSize * scale;
    const ox = x + (cellSize - s) / 2;
    const oy = y + (cellSize - s) / 2;

    ctx.save();
    if (t.value >= 128) {
      ctx.shadowColor = style.bg;
      ctx.shadowBlur = clamp(Math.log2(t.value) * 2.2, 8, 26);
    }
    ctx.fillStyle = style.bg;
    roundRect(ctx, ox, oy, s, s, cellSize * 0.16);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (t.golden) {
      ctx.strokeStyle = '#FFC93C';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#FFC93C';
      ctx.shadowBlur = 16;
      roundRect(ctx, ox + 1.5, oy + 1.5, s - 3, s - 3, cellSize * 0.15);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Gloss
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    roundRect(ctx, ox + s * 0.08, oy + s * 0.08, s * 0.84, s * 0.3, cellSize * 0.1);
    ctx.fill();

    ctx.fillStyle = style.fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const digits = String(t.value).length;
    const fontSize = s * (digits >= 4 ? 0.3 : digits === 3 ? 0.36 : 0.44);
    ctx.font = `900 ${fontSize}px Outfit, sans-serif`;
    ctx.fillText(t.value, ox + s / 2, oy + s / 2 + fontSize * 0.04);
    ctx.restore();
  }

  function render() {
    ctx.save();
    shake.apply(ctx);

    const g0 = ctx.createLinearGradient(0, 0, 0, H);
    g0.addColorStop(0, '#0C0F1E');
    g0.addColorStop(1, '#06080F');
    ctx.fillStyle = g0;
    ctx.fillRect(0, 0, W, H);

    // Board
    ctx.fillStyle = 'rgba(255,255,255,0.045)';
    roundRect(ctx, boardX, boardY, boardSize, boardSize, boardSize * 0.045);
    ctx.fill();
    ctx.strokeStyle = hammerArmed ? 'rgba(255,95,77,0.7)' : 'rgba(255,255,255,0.09)';
    ctx.lineWidth = hammerArmed ? 2.5 : 1;
    ctx.stroke();

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        ctx.fillStyle = 'rgba(255,255,255,0.035)';
        roundRect(ctx, cellX(c), cellY(r), cellSize, cellSize, cellSize * 0.16);
        ctx.fill();
      }
    }

    tiles.forEach((t) => drawTile(t, anim));

    particles.draw(ctx);
    floats.draw(ctx);

    if (hammerArmed) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '800 13px Outfit, sans-serif';
      ctx.fillStyle = '#FF9E92';
      ctx.fillText('HAMMER ARMED — tap a tile', W / 2, boardY - 16);
      ctx.restore();
    } else if (chain >= 3 && running) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '900 14px Outfit, sans-serif';
      ctx.fillStyle = '#22D3EE';
      ctx.shadowColor = '#22D3EE';
      ctx.shadowBlur = 12;
      ctx.fillText(`${chain}x MERGE CHAIN`, W / 2, boardY - 16);
      ctx.restore();
    }

    ctx.restore();
  }

  function update(dt) {
    time += dt;
    if (anim < 1) {
      anim = Math.min(1, anim + dt / SLIDE_MS);
      if (anim >= 1 && pendingSpawn) commitMove();
    }
    tiles.forEach((t) => {
      if (t.spawn < 1) t.spawn = Math.min(1, t.spawn + dt / 150);
      if (t.pop > 0) t.pop = Math.max(0, t.pop - dt / 220);
    });
    particles.update();
    floats.update();
    shake.update();
  }

  function frame(now) {
    rafId = requestAnimationFrame(frame);
    const dt = Math.min(50, now - last);
    last = now;
    if (running && !paused) update(dt);
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
    window.removeEventListener('keydown', onKey);
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointerup', onUp);
    toolBar?.removeEventListener('pointerdown', onTool);
  }

  teardown = cleanup;
}

export function destroyGame() {
  if (teardown) { teardown(); teardown = null; }
  if (shell) { shell.destroy(); shell = null; }
}
