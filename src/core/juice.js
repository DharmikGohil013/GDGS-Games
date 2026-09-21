// ─── Canvas "juice" helpers: particles, floating text, screen shake, easing ───
// Shared by every canvas game so impact feedback looks consistent everywhere.

export const TAU = Math.PI * 2;

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (a, b) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const ease = {
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  inQuad: (t) => t * t,
  outBack: (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
  outElastic: (t) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  },
};

/** Hex string -> "r,g,b" so callers can build rgba() with a live alpha. */
export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

/* ───────────────────────── particles ───────────────────────── */

export class Particles {
  constructor(max = 420) {
    this.items = [];
    this.max = max;
  }

  clear() {
    this.items.length = 0;
  }

  /** @param {object} o { x, y, count, color, speed, size, life, gravity, spread, angle, shape } */
  burst(o = {}) {
    const count = o.count == null ? 14 : o.count;
    const color = o.color || '#ffffff';
    const speed = o.speed == null ? 5 : o.speed;
    const size = o.size == null ? 4 : o.size;
    const life = o.life == null ? 34 : o.life;
    const gravity = o.gravity == null ? 0.18 : o.gravity;
    const spread = o.spread == null ? TAU : o.spread;
    const baseAngle = o.angle == null ? 0 : o.angle;

    for (let i = 0; i < count; i++) {
      if (this.items.length >= this.max) this.items.shift();
      const a = spread === TAU
        ? Math.random() * TAU
        : baseAngle + rand(-spread / 2, spread / 2);
      const v = speed * rand(0.45, 1.25);
      this.items.push({
        x: o.x, y: o.y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        size: size * rand(0.6, 1.35),
        life: life * rand(0.7, 1.25),
        maxLife: life,
        color: Array.isArray(color) ? pick(color) : color,
        gravity,
        spin: rand(-0.24, 0.24),
        rot: Math.random() * TAU,
        shape: o.shape || 'circle',
      });
    }
  }

  /** A thin directional spray — exhaust, dust, speed lines. */
  trail(x, y, color, dir = Math.PI) {
    this.burst({ x, y, count: 2, color, speed: 1.9, size: 3, life: 20, gravity: 0.02, spread: 0.7, angle: dir });
  }

  update() {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const p = this.items[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.975;
      p.rot += p.spin;
      p.life -= 1;
      if (p.life <= 0) this.items.splice(i, 1);
    }
  }

  draw(ctx) {
    for (let i = 0; i < this.items.length; i++) {
      const p = this.items[i];
      const a = clamp(p.life / p.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      if (p.shape === 'square') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else if (p.shape === 'spark') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1, p.size * 0.5);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 2.4, p.y - p.vy * 2.4);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.4, p.size * a), 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}

/* ───────────────────────── floating score text ───────────────────────── */

export class FloatingTexts {
  constructor() {
    this.items = [];
  }

  clear() {
    this.items.length = 0;
  }

  add(x, y, text, o = {}) {
    this.items.push({
      x, y, text,
      vy: o.vy == null ? -1.25 : o.vy,
      life: o.life == null ? 58 : o.life,
      maxLife: o.life == null ? 58 : o.life,
      color: o.color || '#ffffff',
      size: o.size == null ? 20 : o.size,
      weight: o.weight || 800,
      stroke: o.stroke || null,
    });
  }

  update() {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const t = this.items[i];
      t.y += t.vy;
      t.vy *= 0.96;
      t.life -= 1;
      if (t.life <= 0) this.items.splice(i, 1);
    }
  }

  draw(ctx, fontFamily = 'Outfit, Space Grotesk, sans-serif') {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < this.items.length; i++) {
      const t = this.items[i];
      const p = t.life / t.maxLife;
      // Pop in over the first ~15% of life, then fade out.
      const scale = p > 0.85 ? ease.outBack(clamp((1 - p) / 0.15, 0, 1)) : 1;
      ctx.globalAlpha = clamp(p * 1.6, 0, 1);
      ctx.font = `${t.weight} ${t.size * scale}px ${fontFamily}`;
      if (t.stroke) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = t.stroke;
        ctx.strokeText(t.text, t.x, t.y);
      }
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.restore();
  }
}

/* ───────────────────────── screen shake ───────────────────────── */

export class Shake {
  constructor() {
    this.amount = 0;
    this.x = 0;
    this.y = 0;
  }

  add(n) {
    this.amount = Math.min(30, this.amount + n);
  }

  update() {
    if (this.amount <= 0.1) {
      this.amount = 0;
      this.x = 0;
      this.y = 0;
      return;
    }
    this.x = rand(-this.amount, this.amount);
    this.y = rand(-this.amount, this.amount);
    this.amount *= 0.86;
  }

  apply(ctx) {
    if (this.amount > 0) ctx.translate(this.x, this.y);
  }
}

/* ───────────────────────── misc canvas helpers ───────────────────────── */

export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Sizes a canvas to its container at device pixel ratio. Returns CSS-px dims. */
export function fitCanvas(canvas, container, maxDpr = 2) {
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const w = container.clientWidth || 800;
  const h = container.clientHeight || 600;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w, h, dpr };
}

/** Fixed-timestep loop so gameplay speed is identical at 60/120/144Hz. */
export function createLoop(step, render, hz = 60) {
  const fixed = 1000 / hz;
  let raf = null;
  let last = 0;
  let acc = 0;
  let running = false;

  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (!last) last = now;
    let delta = now - last;
    last = now;
    // Clamp so a backgrounded tab does not fast-forward the whole game.
    if (delta > 250) delta = fixed;
    acc += delta;
    let guard = 0;
    while (acc >= fixed && guard < 5) {
      step(fixed / 1000);
      acc -= fixed;
      guard++;
    }
    if (guard >= 5) acc = 0;
    render(acc / fixed);
  }

  return {
    start() {
      if (running) return;
      running = true;
      last = 0;
      acc = 0;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    },
    get running() { return running; },
  };
}
