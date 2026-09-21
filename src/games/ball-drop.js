// ─── Ball Drop — Deluxe Plinko ───
// Aimed drops, hand-rolled peg physics, risk modes you switch mid-run,
// charged golden pegs, multiplier buckets, bonus balls and landing combos.

import { createGameShell } from '../core/gameShell.js';
import { sfx, haptic } from '../core/audio.js';
import {
  Particles, FloatingTexts, Shake, fitCanvas, roundRect,
  clamp, lerp, rand, randInt, TAU,
} from '../core/juice.js';

let shell = null;
let teardown = null;

const START_BALLS = 15;
const GRAVITY = 0.34;
const RESTITUTION = 0.62;
const MAX_BALLS_IN_PLAY = 14;

// Bucket payouts are symmetrical: safe rewards the middle, wild rewards the edges.
const RISK = {
  safe: {
    name: 'Safe',
    color: '#1FC98B',
    mult: [3, 2, 1.5, 1.2, 1, 1.2, 1.5, 2, 3],
    desc: 'Steady payouts, no traps',
  },
  wild: {
    name: 'Wild',
    color: '#FF5F4D',
    mult: [18, 6, 2, 0.5, 0, 0.5, 2, 6, 18],
    desc: 'Huge edges, dead centre',
  },
};

export function initGame(container) {
  destroyGame();

  shell = createGameShell(container, {
    id: 'ball-drop',
    title: 'Ball Drop',
    accent: 'coral',
    accent2: 'gold',
    tagline: 'Aim · Bounce · Multiply',
    howTo: [
      { key: 'Move', label: 'Aim the dropper across the top' },
      { key: 'Click / Tap', label: 'Release a ball' },
      { key: 'R', label: 'Switch risk mode — Safe or Wild' },
      { key: 'Gold pegs', label: 'Charge your next ball for double value' },
    ],
    stats: [
      { key: 'score', label: 'Score' },
      { key: 'best', label: 'Best' },
      { key: 'balls', label: 'Balls', initial: START_BALLS },
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
  canvas.style.background = '#070A14';
  shell.stage.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  shell.setControls(`
    <div class="bd-controls">
      <button class="bd-risk" data-risk aria-label="Switch risk mode">
        <span class="bd-risk-dot"></span>
        <span data-risk-name>Safe</span>
      </button>
    </div>
  `);

  /* ── state ── */
  let W = 0, H = 0;
  let pegs = [];
  let buckets = [];
  let balls = [];
  let ballsLeft = START_BALLS;
  let risk = 'safe';
  let aimX = 0;
  let charged = false;      // golden-peg bonus banked for the next landing
  let combo = 0;
  let bestCombo = 0;
  let landed = 0;
  let paused = false;
  let running = false;
  let over = false;
  let last = 0;
  let rafId = null;
  let time = 0;
  let dropCooldown = 0;

  const particles = new Particles(560);
  const floats = new FloatingTexts();
  const shake = new Shake();

  let boardTop = 0, boardBottom = 0, pegGap = 0, ballR = 8;

  function resize() {
    const d = fitCanvas(canvas, shell.stage);
    W = d.w;
    H = d.h;
    buildBoard();
  }

  function buildBoard() {
    boardTop = Math.max(96, H * 0.18);
    boardBottom = H - Math.max(78, H * 0.13);

    const rows = clamp(Math.floor((boardBottom - boardTop) / 46), 7, 12);
    const cols = 9;
    pegGap = Math.min((W - 60) / cols, (boardBottom - boardTop) / rows);
    ballR = clamp(pegGap * 0.19, 5.5, 11);

    const pegR = clamp(pegGap * 0.1, 3.2, 6.5);
    const boardW = pegGap * cols;
    const originX = (W - boardW) / 2;

    pegs = [];
    for (let r = 0; r < rows; r++) {
      const count = r % 2 === 0 ? cols : cols - 1;
      const rowOffset = r % 2 === 0 ? 0 : pegGap / 2;
      const y = boardTop + r * pegGap + pegGap * 0.5;
      for (let c = 0; c < count; c++) {
        const x = originX + rowOffset + c * pegGap + pegGap * 0.5;
        pegs.push({
          x, y, r: pegR,
          hit: 0,
          // A sprinkling of gold pegs gives the board a reason to be studied.
          gold: Math.random() < 0.09,
        });
      }
    }

    const bw = boardW / cols;
    buckets = RISK[risk].mult.map((m, i) => ({
      x: originX + i * bw,
      w: bw,
      mult: m,
      index: i,
      flash: 0,
    }));

    aimX = clamp(aimX || W / 2, originX + bw / 2, originX + boardW - bw / 2);
  }

  resize();
  const ro = new ResizeObserver(() => resize());
  ro.observe(shell.stage);

  /* ── run ── */
  function startRun() {
    balls = [];
    particles.clear();
    floats.clear();
    ballsLeft = START_BALLS;
    combo = 0;
    bestCombo = 0;
    landed = 0;
    charged = false;
    risk = 'safe';
    paused = false;
    over = false;
    running = true;
    dropCooldown = 0;
    resize();
    paintRisk();
    shell.setStat('balls', ballsLeft);
    shell.setCombo(0);
    last = performance.now();
    if (!rafId) rafId = requestAnimationFrame(frame);
  }

  function paintRisk() {
    const btn = container.querySelector('[data-risk]');
    if (!btn) return;
    const def = RISK[risk];
    btn.style.setProperty('--risk-color', def.color);
    const nameEl = btn.querySelector('[data-risk-name]');
    if (nameEl) nameEl.textContent = def.name;
  }

  function toggleRisk() {
    if (!running || over) return;
    risk = risk === 'safe' ? 'wild' : 'safe';
    buildBoard();
    paintRisk();
    sfx.ui();
    shell.toast(`${RISK[risk].name} mode — ${RISK[risk].desc}`, risk === 'wild' ? 'warn' : 'good');
  }

  /* ── dropping ── */
  function dropBall() {
    if (!running || over || paused) return;
    if (ballsLeft <= 0) return;
    if (dropCooldown > 0) return;
    if (balls.length >= MAX_BALLS_IN_PLAY) return;

    ballsLeft--;
    dropCooldown = 130;
    shell.setStat('balls', ballsLeft);

    balls.push({
      x: aimX + rand(-1.5, 1.5),
      y: boardTop - 26,
      vx: rand(-0.35, 0.35),
      vy: 1.2,
      r: ballR,
      charged,
      goldHits: 0,
      trail: [],
    });
    charged = false;
    sfx.hop();
    haptic(6);
  }

  function settleBall(ball, bucket) {
    landed++;
    const def = RISK[risk];
    let mult = bucket.mult;
    if (ball.charged) mult *= 2;

    // Landing on 2x or better chains the combo; a dud breaks it.
    if (mult >= 2) {
      combo++;
      bestCombo = Math.max(bestCombo, combo);
      shell.setCombo(combo + 1, 1);
      if (combo >= 2) sfx.combo(combo);
    } else if (mult < 1) {
      if (combo >= 3) shell.toast(`${combo}-landing chain broken`, 'warn');
      combo = 0;
      shell.setCombo(0);
    }

    const comboMult = 1 + Math.min(combo, 8) * 0.25;
    const gained = Math.round(100 * mult * comboMult + ball.goldHits * 25);

    if (gained > 0) {
      shell.addScore(gained, { pop: true });
      shell.addCoins(Math.max(1, Math.round(mult)));
    }

    bucket.flash = 1;
    const bx = bucket.x + bucket.w / 2;
    const color = mult >= 6 ? '#FFC93C' : mult >= 2 ? '#22D3EE' : mult >= 1 ? '#8B5CF6' : '#FF5F4D';

    floats.add(bx, boardBottom - 16, gained > 0 ? `+${gained.toLocaleString()}` : 'BUST', {
      color, size: mult >= 6 ? 27 : 20, life: 62, stroke: 'rgba(0,0,0,0.55)',
    });
    if (ball.charged) {
      floats.add(bx, boardBottom - 44, 'CHARGED 2x', { color: '#FFC93C', size: 15, life: 54, stroke: 'rgba(0,0,0,0.5)' });
    }
    particles.burst({
      x: bx, y: boardBottom - 10,
      count: Math.min(46, 12 + Math.round(mult * 2.4)),
      color: [color, '#ffffff'], speed: 5.4, size: 4, life: 38, gravity: 0.22, spread: Math.PI, angle: -Math.PI / 2,
    });
    shake.add(clamp(mult * 1.1, 2, 14));

    if (mult >= 6) { sfx.reward(); haptic([10, 30, 10]); }
    else if (mult >= 1) sfx.coin();
    else { sfx.error(); haptic(30); }

    // The two outermost buckets hand a ball back — a reason to aim wide.
    if (bucket.index === 0 || bucket.index === buckets.length - 1) {
      ballsLeft++;
      shell.setStat('balls', ballsLeft, { pop: true });
      floats.add(bx, boardBottom - 70, '+1 BALL', { color: '#7CF2C4', size: 16, life: 58, stroke: 'rgba(0,0,0,0.5)' });
    }

    // Every 5 landings tops you up, so a run always has a rhythm.
    if (landed % 5 === 0) {
      ballsLeft += 2;
      shell.setStat('balls', ballsLeft, { pop: true });
      shell.toast(`${landed} landings — +2 balls`, 'good');
      sfx.reward();
    }
  }

  /* ── physics ── */
  function stepBall(ball, dt) {
    const s = dt * 0.06;
    ball.vy += GRAVITY * s;
    ball.vx *= 0.999;
    ball.x += ball.vx * s;
    ball.y += ball.vy * s;

    ball.trail.push({ x: ball.x, y: ball.y });
    if (ball.trail.length > 9) ball.trail.shift();

    // Side rails
    const leftRail = buckets[0].x;
    const rightRail = buckets[buckets.length - 1].x + buckets[buckets.length - 1].w;
    if (ball.x - ball.r < leftRail) {
      ball.x = leftRail + ball.r;
      ball.vx = Math.abs(ball.vx) * RESTITUTION;
    }
    if (ball.x + ball.r > rightRail) {
      ball.x = rightRail - ball.r;
      ball.vx = -Math.abs(ball.vx) * RESTITUTION;
    }

    // Pegs
    for (let i = 0; i < pegs.length; i++) {
      const p = pegs[i];
      const dx = ball.x - p.x;
      const dy = ball.y - p.y;
      const minDist = p.r + ball.r;
      if (Math.abs(dx) > minDist || Math.abs(dy) > minDist) continue;

      const dist = Math.hypot(dx, dy);
      if (dist >= minDist || dist === 0) continue;

      const nx = dx / dist;
      const ny = dy / dist;
      // Push out, then reflect the velocity about the contact normal.
      ball.x = p.x + nx * minDist;
      ball.y = p.y + ny * minDist;
      const dot = ball.vx * nx + ball.vy * ny;
      ball.vx = (ball.vx - 2 * dot * nx) * RESTITUTION;
      ball.vy = (ball.vy - 2 * dot * ny) * RESTITUTION;
      // A nudge of randomness keeps identical drops from being identical.
      ball.vx += rand(-0.24, 0.24);

      p.hit = 1;
      particles.burst({ x: p.x, y: p.y, count: p.gold ? 7 : 3, color: p.gold ? ['#FFC93C', '#ffffff'] : ['#8B5CF6', '#22D3EE'], speed: 2.3, size: 2.6, life: 18, gravity: 0.1 });

      if (p.gold) {
        p.gold = false;
        p.cooldown = time;
        ball.goldHits++;
        charged = true;
        shell.addCoins(3);
        sfx.pickup();
        floats.add(p.x, p.y - 14, 'CHARGED', { color: '#FFC93C', size: 13, life: 40, stroke: 'rgba(0,0,0,0.5)' });
      } else {
        sfx.ui();
      }
    }

    // Bucket floor
    if (ball.y + ball.r >= boardBottom) {
      const bucket = buckets.find((b) => ball.x >= b.x && ball.x < b.x + b.w) || buckets[buckets.length - 1];
      settleBall(ball, bucket);
      return false;
    }
    return true;
  }

  /* ── input ── */
  function pointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    return e.clientX - rect.left;
  }

  function onMove(e) {
    if (!buckets.length) return;
    const leftRail = buckets[0].x;
    const rightRail = buckets[buckets.length - 1].x + buckets[buckets.length - 1].w;
    aimX = clamp(pointerPos(e), leftRail + ballR + 2, rightRail - ballR - 2);
  }

  function onDown(e) {
    if (e.target.closest('.gs-overlay, .gs-hud, button, a')) return;
    onMove(e);
    dropBall();
  }

  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerdown', onDown);

  function onKey(e) {
    if (!shell.isPlaying) return;
    if (e.code === 'Space') { e.preventDefault(); dropBall(); }
    else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); toggleRisk(); }
    else if (e.code === 'ArrowLeft') { aimX = Math.max(buckets[0].x + ballR, aimX - pegGap / 2); }
    else if (e.code === 'ArrowRight') { aimX = Math.min(buckets[buckets.length - 1].x + buckets[buckets.length - 1].w - ballR, aimX + pegGap / 2); }
  }
  window.addEventListener('keydown', onKey);

  const riskBtn = container.querySelector('[data-risk]');
  function onRiskBtn(e) { e.preventDefault(); toggleRisk(); }
  riskBtn?.addEventListener('pointerdown', onRiskBtn);

  /* ── update ── */
  function update(dt) {
    time += dt;
    if (dropCooldown > 0) dropCooldown -= dt;

    for (let i = balls.length - 1; i >= 0; i--) {
      if (!stepBall(balls[i], dt)) balls.splice(i, 1);
    }

    pegs.forEach((p) => {
      if (p.hit > 0) p.hit = Math.max(0, p.hit - dt / 260);
      // Gold pegs slowly return so the board never runs dry.
      if (!p.gold && p.cooldown && time - p.cooldown > 9000 && Math.random() < 0.004) {
        p.gold = true;
        p.cooldown = 0;
      }
    });

    buckets.forEach((b) => { if (b.flash > 0) b.flash = Math.max(0, b.flash - dt / 420); });

    particles.update();
    floats.update();
    shake.update();

    if (ballsLeft <= 0 && balls.length === 0 && !over) finish();
  }

  function finish() {
    over = true;
    running = false;
    sfx.gameOver();
    overTimer = setTimeout(() => {
      gs.gameOver({
        bestCombo: bestCombo + 1,
        eyebrow: 'Out of balls',
        stats: [
          { label: 'Balls landed', value: landed },
          { label: 'Best chain', value: bestCombo },
        ],
      });
    }, 500);
  }

  /* ── render ── */
  function render() {
    ctx.save();
    shake.apply(ctx);

    // Backdrop
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0B0E1C');
    g.addColorStop(1, '#05070F');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    if (!buckets.length) { ctx.restore(); return; }
    const leftRail = buckets[0].x;
    const rightRail = buckets[buckets.length - 1].x + buckets[buckets.length - 1].w;
    const boardW = rightRail - leftRail;

    // Board panel
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    roundRect(ctx, leftRail - 10, boardTop - 42, boardW + 20, boardBottom - boardTop + 92, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Aim guide
    if (running && !over) {
      ctx.save();
      ctx.setLineDash([4, 8]);
      ctx.strokeStyle = ballsLeft > 0 ? 'rgba(255,255,255,0.28)' : 'rgba(255,95,77,0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(aimX, boardTop - 34);
      ctx.lineTo(aimX, boardBottom);
      ctx.stroke();
      ctx.restore();

      // Dropper head
      ctx.save();
      const bob = Math.sin(time / 300) * 2;
      ctx.shadowColor = charged ? '#FFC93C' : '#22D3EE';
      ctx.shadowBlur = charged ? 22 : 12;
      ctx.fillStyle = charged ? '#FFC93C' : '#E7EAF4';
      ctx.beginPath();
      ctx.arc(aimX, boardTop - 34 + bob, ballR * 1.05, 0, TAU);
      ctx.fill();
      ctx.restore();
      if (charged) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '800 11px Outfit, sans-serif';
        ctx.fillStyle = '#FFC93C';
        ctx.fillText('2x CHARGED', aimX, boardTop - 54);
        ctx.restore();
      }
    }

    // Pegs
    pegs.forEach((p) => {
      ctx.save();
      if (p.gold) {
        ctx.shadowColor = '#FFC93C';
        ctx.shadowBlur = 14 + Math.sin(time / 260 + p.x) * 5;
        ctx.fillStyle = '#FFC93C';
      } else {
        const lit = p.hit;
        ctx.shadowColor = '#8B5CF6';
        ctx.shadowBlur = 6 + lit * 18;
        ctx.fillStyle = lit > 0
          ? `rgb(${Math.round(lerp(150, 255, lit))},${Math.round(lerp(150, 255, lit))},255)`
          : 'rgba(190,196,220,0.82)';
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (1 + p.hit * 0.35), 0, TAU);
      ctx.fill();
      ctx.restore();
    });

    // Buckets
    const maxMult = Math.max(...buckets.map((b) => b.mult));
    buckets.forEach((b) => {
      const heat = maxMult > 0 ? b.mult / maxMult : 0;
      const color = b.mult >= 6 ? '#FFC93C' : b.mult >= 2 ? '#22D3EE' : b.mult >= 1 ? '#8B5CF6' : '#FF5F4D';
      const h = 42;
      ctx.save();
      ctx.globalAlpha = 0.22 + heat * 0.34 + b.flash * 0.44;
      ctx.fillStyle = color;
      roundRect(ctx, b.x + 2, boardBottom - h + 6, b.w - 4, h, 7);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = `rgba(255,255,255,${0.1 + b.flash * 0.5})`;
      ctx.lineWidth = 1 + b.flash * 2;
      roundRect(ctx, b.x + 2, boardBottom - h + 6, b.w - 4, h, 7);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `900 ${clamp(b.w * 0.3, 11, 17)}px Outfit, sans-serif`;
      ctx.fillStyle = b.mult === 0 ? '#FF9E92' : color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8 + b.flash * 16;
      ctx.fillText(b.mult === 0 ? 'X' : `${b.mult}x`, b.x + b.w / 2, boardBottom - h / 2 + 6);
      ctx.restore();
    });

    // Divider walls between buckets
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    buckets.forEach((b, i) => {
      if (i === 0) return;
      ctx.beginPath();
      ctx.moveTo(b.x, boardBottom - 38);
      ctx.lineTo(b.x, boardBottom + 6);
      ctx.stroke();
    });
    ctx.restore();

    // Balls (with a short motion trail)
    balls.forEach((ball) => {
      ball.trail.forEach((t, i) => {
        const a = (i / ball.trail.length) * 0.32;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = ball.charged ? '#FFC93C' : '#22D3EE';
        ctx.beginPath();
        ctx.arc(t.x, t.y, ball.r * (0.35 + a), 0, TAU);
        ctx.fill();
        ctx.restore();
      });

      ctx.save();
      ctx.shadowColor = ball.charged ? '#FFC93C' : '#7DD3FC';
      ctx.shadowBlur = 16;
      const bg = ctx.createRadialGradient(ball.x - ball.r * 0.3, ball.y - ball.r * 0.35, ball.r * 0.15, ball.x, ball.y, ball.r);
      bg.addColorStop(0, '#ffffff');
      bg.addColorStop(1, ball.charged ? '#FFA92C' : '#3E6BFF');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, TAU);
      ctx.fill();
      ctx.restore();
    });

    particles.draw(ctx);
    floats.draw(ctx);

    // Risk badge
    if (running) {
      const def = RISK[risk];
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '800 12px Outfit, sans-serif';
      ctx.fillStyle = def.color;
      ctx.globalAlpha = 0.9;
      ctx.fillText(`${def.name.toUpperCase()} MODE — press R to switch`, W / 2, boardBottom + 34);
      ctx.restore();
    }

    ctx.restore();
  }

  function frame(now) {
    rafId = requestAnimationFrame(frame);
    const dt = Math.min(50, now - last);
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
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerdown', onDown);
    window.removeEventListener('keydown', onKey);
    riskBtn?.removeEventListener('pointerdown', onRiskBtn);
  }

  teardown = cleanup;
}

export function destroyGame() {
  if (teardown) { teardown(); teardown = null; }
  if (shell) { shell.destroy(); shell = null; }
}
