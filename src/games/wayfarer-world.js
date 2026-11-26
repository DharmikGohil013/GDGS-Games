// ─── Wayfarer: the endless world ───
// Pure world generation, with no three.js in it. Given a seed it answers, for
// any point of an endless plane, which region it belongs to (a city, a village,
// a forest...), how high the ground is, what colour it is, and what stands on
// each 64 x 64 chunk. The renderer in wayfarer.js only turns those answers into
// meshes, so the same seed always grows the same world.
//
// Layout: the plane is cut into CELL x CELL cells. Each cell holds one region
// "site", jittered off the cell centre, and every point belongs to its nearest
// site (a Voronoi map, with warped borders so they wander). Highways run along
// every cell's centre lines, so a road always leads from one region to the next.

export const CELL = 320;
export const HALF_CELL = CELL / 2;
export const CHUNK = 64;
export const ROAD_HALF = 5;        // highways are 10 wide
export const BLOCK = 40;           // city street spacing; divides CELL so highways are streets too
export const STREET_HALF = 4;
export const WATER_Y = -0.7;
const BLEND = 46;                  // how far two regions blend into each other at a border

export const REGION_TYPES = ['city', 'village', 'forest', 'meadow', 'hills', 'lake'];

// How tall the land rolls in each region.
const AMP = { city: 0, village: 1.4, forest: 4.5, meadow: 3, hills: 22, lake: 1 };

/* ─────────────────────────── hashing & noise ─────────────────────────── */

export function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function hash3(a, b, c) {
  let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul((b | 0) + 0x632be5ab, 0xc2b2ae35) ^ Math.imul((c | 0) + 0x27d4eb2f, 0x165667b1);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39);
  h ^= h >>> 15;
  return h >>> 0;
}

const rand3 = (a, b, c) => hash3(a, b, c) / 4294967296;

export function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export function smoothstep(e0, e1, x) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

function valueNoise(seed, x, z) {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const xf = x - xi;
  const zf = z - zi;
  const u = xf * xf * (3 - 2 * xf);
  const v = zf * zf * (3 - 2 * zf);
  const a = rand3(seed, xi, zi);
  const b = rand3(seed, xi + 1, zi);
  const c = rand3(seed, xi, zi + 1);
  const d = rand3(seed, xi + 1, zi + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}

function fbm(seed, x, z, octaves) {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise(seed + o * 1013, x, z) * amp;
    norm += amp;
    amp *= 0.5;
    x *= 2.03;
    z *= 2.03;
  }
  return sum / norm;
}

/** Distance from v to the nearest line at offset + k * spacing. */
function lineDist(v, offset, spacing) {
  const m = (((v - offset) % spacing) + spacing) % spacing;
  return Math.min(m, spacing - m);
}

export const roadCoord = (v) => lineDist(v, HALF_CELL, CELL);
export const roadDist = (x, z) => Math.min(roadCoord(x), roadCoord(z));
export const streetCoord = (v) => lineDist(v, HALF_CELL, BLOCK);

/* ─────────────────────────── region kinds ─────────────────────────── */

/**
 * Which kind of region a cell becomes. `roll` is this cell's own random number
 * in [0, 1); (ci, cj) is the cell. Called once per cell and cached, so every
 * visit to the same seed grows the same map.
 */
export function regionTypeFor(roll, ci, cj) {
  if (roll < 0.17) return 'city';
  if (roll < 0.4) return 'village';
  if (roll < 0.66) return 'forest';
  if (roll < 0.82) return 'meadow';
  if (roll < 0.92) return 'hills';
  return 'lake';
}

/* ─────────────────────────── names ─────────────────────────── */

const SYL_A = ['Ash', 'Bel', 'Cor', 'Dun', 'El', 'Fair', 'Glen', 'Hal', 'Iron', 'Kings', 'Lin', 'Mar', 'North', 'Oak', 'Pine', 'Quill', 'Raven', 'Silver', 'Thorn', 'Umber', 'Vale', 'Wester', 'Yar', 'Brook', 'Cold', 'Elm', 'Gold', 'Hazel', 'Lark', 'Moss', 'Red', 'Stone', 'Willow', 'Amber', 'Briar', 'Crow'];
const SYL_B = ['ford', 'haven', 'ton', 'burgh', 'field', 'mere', 'wick', 'dale', 'gate', 'moor', 'stead', 'bridge', 'crest', 'fall', 'port', 'by', 'wood', 'holm', 'hurst', 'ley', 'well', 'cliff', 'combe', 'shire'];
const ADJ = ['Whispering', 'Silver', 'Elder', 'Hollow', 'Amber', 'Misty', 'Quiet', 'Golden', 'Shadow', 'Mossy', 'Crimson', 'Wild', 'Sleeping', 'Bright', 'Lonely', 'Windy'];
const FORMS = {
  city: [(n) => `${n} City`, (n) => `New ${n}`, (n) => `Port ${n}`, (n) => `${n} Metro`],
  village: [(n) => `${n} Village`, (n) => `Little ${n}`, (n) => `${n} Hamlet`],
  forest: [(n) => `${n} Woods`, (n) => `${n} Forest`, (n, a) => `The ${a} Wood`],
  meadow: [(n) => `${n} Fields`, (n, a) => `${a} Meadows`, (n) => `${n} Downs`],
  hills: [(n) => `${n} Heights`, (n, a) => `The ${a} Hills`, (n) => `${n} Ridge`],
  lake: [(n) => `Lake ${n}`, (n) => `${n} Mere`, (n, a) => `${a} Water`],
};
const LANDMARKS = {
  city: (n) => `${n} Spire`,
  village: (n) => `the old mill of ${n}`,
  forest: () => 'the Elder Tree',
  meadow: () => 'the Standing Stones',
  hills: (n) => `${n} Watchtower`,
  lake: (n) => `${n} Lighthouse`,
};

/* ─────────────────────────── palettes ─────────────────────────── */

const GROUND = {
  city: [0.25, 0.25, 0.27],
  village: [0.32, 0.42, 0.19],
  forest: [0.14, 0.27, 0.12],
  meadow: [0.38, 0.55, 0.2],
  hills: [0.33, 0.43, 0.22],
  lake: [0.3, 0.45, 0.22],
};
const AUTUMN_GROUND = [0.36, 0.25, 0.12];
const SAND = [0.66, 0.6, 0.42];
const LAKEBED = [0.18, 0.27, 0.27];
const ROCK = [0.44, 0.43, 0.4];
const SNOW = [0.9, 0.93, 0.97];
const DIRT = [0.4, 0.33, 0.23];

const CITY_STYLES = [
  { body: [0x6f7f92, 0x8c9aab, 0x4f5d70, 0xa3b1c2, 0x5a6b7d, 0x7d8a8f], glass: 0x9fc4e8 },   // glass and steel
  { body: [0x8a4a35, 0x9c6b4a, 0x7a3f30, 0xb08b6a, 0x6d5a4e, 0xa25a3c], glass: 0xe9c27a },   // old brick town
  { body: [0xc9c1b0, 0xe0d8c4, 0xa9a49a, 0xd8c7a0, 0x9fa6a8, 0xbfb3a0], glass: 0xbfe3ff },   // white stone
];
const WINDOW_LIT = [0xffd27a, 0xffc86a, 0xfff0b8, 0x9fd8ff, 0xffb36a];
const CAR_COLORS = [0xd23b3b, 0x2d6cdf, 0xe8e8e8, 0x2b2b2b, 0xf2c230, 0x2fa36b, 0x8a8f99, 0xe07a2e];
const HOUSE_WALLS = [0xe8dfc8, 0xd9c7a3, 0xb98a5e, 0xf2ead8, 0xc7b79a, 0xa8714a];
const HOUSE_ROOFS = [0x8e3b2e, 0x6b3d2a, 0x4f5a6b, 0x9a6b3a, 0x7a2f2a, 0x5c4a3a];
const FLOWERS = [0xffe35a, 0xffffff, 0xc36bff, 0xff6b8a, 0xff9a3c, 0x7ab8ff];

/* ─────────────────────────── the world ─────────────────────────── */

export function createWorld(seedText) {
  const seed = hashString(String(seedText));
  const sites = new Map();

  function site(ci, cj) {
    const key = (ci + 50000) * 100000 + (cj + 50000);
    let s = sites.get(key);
    if (s) return s;
    if (sites.size > 6000) sites.clear();
    const type = ci === 0 && cj === 0 ? 'city' : regionTypeFor(rand3(seed ^ 0xb2, ci, cj), ci, cj);
    const nr = mulberry32(hash3(seed ^ 0xd4, ci, cj));
    const base = SYL_A[Math.floor(nr() * SYL_A.length)] + SYL_B[Math.floor(nr() * SYL_B.length)];
    const forms = FORMS[type];
    const adj = ADJ[Math.floor(nr() * ADJ.length)];
    s = {
      key: `${ci},${cj}`,
      ci,
      cj,
      x: ci * CELL + HALF_CELL + (rand3(seed ^ 0xa1, ci, cj) - 0.5) * 110,
      z: cj * CELL + HALF_CELL + (rand3(seed ^ 0xa2, ci, cj) - 0.5) * 110,
      type,
      variant: rand3(seed ^ 0xc3, ci, cj),
      base,
      name: forms[Math.floor(nr() * forms.length)](base, adj),
      landmarkName: LANDMARKS[type](base),
    };
    // The spawn city keeps its centre on the crossroads so the first view is down a main street.
    if (ci === 0 && cj === 0) {
      s.x = HALF_CELL + 18;
      s.z = HALF_CELL + 22;
    }
    s.landmark = landmarkSpot(s);
    sites.set(key, s);
    return s;
  }

  function landmarkSpot(s) {
    if (s.type === 'city') {
      // The middle of the city block nearest the site.
      const snap = (v) => HALF_CELL + BLOCK / 2 + BLOCK * Math.round((v - HALF_CELL - BLOCK / 2) / BLOCK);
      return { x: snap(s.x), z: snap(s.z) };
    }
    if (s.type === 'lake') return { x: s.x, z: s.z };
    // Keep land landmarks clear of the highways.
    let { x, z } = s;
    const push = (v) => {
      const d = roadCoord(v);
      if (d >= 22) return v;
      const m = (((v - HALF_CELL) % CELL) + CELL) % CELL;
      return m < CELL / 2 ? v + (22 - d) : v - (22 - d);
    };
    x = push(x);
    z = push(z);
    return { x, z };
  }

  /** The two nearest region sites to a point, and how far it sits inside the nearer one. */
  function regionAt(x, z) {
    const wx = x + (fbm(seed ^ 0x51, x / 170, z / 170, 2) - 0.5) * 110;
    const wz = z + (fbm(seed ^ 0x52, x / 170, z / 170, 2) - 0.5) * 110;
    const ci = Math.floor(wx / CELL);
    const cj = Math.floor(wz / CELL);
    let d1 = Infinity;
    let d2 = Infinity;
    let s1 = null;
    let s2 = null;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const s = site(ci + i, cj + j);
        const dx = wx - s.x;
        const dz = wz - s.z;
        const d = dx * dx + dz * dz;
        if (d < d1) {
          d2 = d1; s2 = s1; d1 = d; s1 = s;
        } else if (d < d2) {
          d2 = d; s2 = s;
        }
      }
    }
    // Distance to the border line halfway between the two sites.
    const sx = s2.x - s1.x;
    const sz = s2.z - s1.z;
    const len = Math.hypot(sx, sz) || 1;
    const border = -((wx - (s1.x + s2.x) / 2) * sx + (wz - (s1.z + s2.z) / 2) * sz) / len;
    // own: 1 deep inside the nearest region, 0.5 on the border.
    const own = 0.5 + 0.5 * smoothstep(0, BLEND, border);
    return { site: s1, other: s2, border, own };
  }

  const weightOf = (r, type) => (r.site.type === type ? r.own : 0) + (r.other.type === type ? 1 - r.own : 0);
  const siteOfType = (r, type) => (r.site.type === type ? r.site : r.other.type === type ? r.other : null);

  function heightAt(x, z, r = regionAt(x, z)) {
    const A = AMP[r.site.type] * r.own + AMP[r.other.type] * (1 - r.own);
    const C = weightOf(r, 'city');
    const n = fbm(seed ^ 0x61, x / 95, z / 95, 4);
    let h = A * Math.max(0, n - 0.34) * 1.7;
    // Hills get a sharper, ridged second layer.
    const H = weightOf(r, 'hills');
    if (H > 0) h += H * Math.pow(1 - Math.abs(fbm(seed ^ 0x63, x / 60, z / 60, 3) * 2 - 1), 3) * 9;
    h += (fbm(seed ^ 0x62, x / 16, z / 16, 2) - 0.5) * 0.6 * (1 - C);
    const L = weightOf(r, 'lake');
    if (L > 0) {
      const lake = siteOfType(r, 'lake');
      const d = Math.hypot(x - lake.x, z - lake.z);
      // A small island holds the lighthouse in the middle of every lake.
      const bottom = lerp(1.5, -3.6 - fbm(seed ^ 0x64, x / 30, z / 30, 2) * 1.5, smoothstep(8, 17, d));
      h = lerp(h, bottom, smoothstep(0.08, 0.75, L));
    }
    // Highways cut flat through the land; over water they become bridges instead.
    if (h > -0.35) h *= smoothstep(ROAD_HALF + 1.5, ROAD_HALF + 16, roadDist(x, z));
    return h;
  }

  /** Where the player can stand: the ground, or a bridge deck over water. */
  function standAt(x, z) {
    const h = heightAt(x, z);
    return roadDist(x, z) < ROAD_HALF + 0.6 ? Math.max(h, 0.08) : h;
  }

  function groundColor(x, z, h, r) {
    const pick = (s) => (s.type === 'forest' && s.variant > 0.62 && s.variant < 0.82 ? AUTUMN_GROUND : GROUND[s.type]);
    const a = pick(r.site);
    const b = pick(r.other);
    const t = r.own;
    let c = [a[0] * t + b[0] * (1 - t), a[1] * t + b[1] * (1 - t), a[2] * t + b[2] * (1 - t)];
    const mix = (to, k) => { c = [lerp(c[0], to[0], k), lerp(c[1], to[1], k), lerp(c[2], to[2], k)]; };
    if (h > 6) mix(ROCK, smoothstep(6, 11, h));
    if (h > 14) mix(SNOW, smoothstep(14, 17, h));
    if (h < WATER_Y + 0.9) mix(SAND, smoothstep(WATER_Y + 0.9, WATER_Y + 0.2, h));
    if (h < WATER_Y - 0.5) mix(LAKEBED, smoothstep(WATER_Y - 0.5, WATER_Y - 2, h));
    const rd = roadDist(x, z);
    if (rd < ROAD_HALF + 4 && h > WATER_Y) mix(DIRT, 0.55 * smoothstep(ROAD_HALF + 4, ROAD_HALF, rd));
    const v = weightOf(r, 'village');
    if (v > 0) {
      const vs = siteOfType(r, 'village');
      const d = Math.hypot(x - vs.x, z - vs.z);
      if (d < 34) mix(DIRT, 0.5 * smoothstep(34, 18, d) * v);
    }
    // Speckle, so flat ground still shows its perspective as text.
    const k = 0.8 + rand3(seed ^ 0x71, Math.floor(x), Math.floor(z)) * 0.38;
    return [c[0] * k, c[1] * k, c[2] * k];
  }

  /* ───────────────────────── chunk contents ───────────────────────── */
  // `out` receives primitives: out.solid / out.glow (proto, colour, x, y, z,
  // sx, sy, sz, ry, rz), out.circle / out.box colliders, and out.special(kind, data)
  // for things that move (windmill blades, lighthouse beams, chimney smoke...).

  function generateChunk(cx, cz, out) {
    const x0 = cx * CHUNK;
    const z0 = cz * CHUNK;
    const rng = mulberry32(hash3(seed ^ 0x99, cx, cz));
    genHighways(x0, z0, out, rng);
    genCity(x0, z0, out);
    genScatter(x0, z0, out, rng);
    genVillages(x0, z0, out);
    genLandmarks(x0, z0, out);
  }

  // Lay a primitive along a road: `a` is across the road, `b` along it.
  function roadPut(out, glow, axis, proto, col, a, y, b, sa, sy, sb) {
    const fn = glow ? out.glow : out.solid;
    if (axis === 'x') fn(proto, col, a, y, b, sa, sy, sb);
    else fn(proto, col, b, y, a, sb, sy, sa);
  }

  function streetLamp(out, axis, a, b, side) {
    roadPut(out, false, axis, 'cyl', 0x3b3f45, a, 3, b, 0.22, 6, 0.22);
    roadPut(out, false, axis, 'box', 0x3b3f45, a - side * 0.9, 5.95, b, 1.9, 0.14, 0.18);
    roadPut(out, true, axis, 'box', 0xfff1c4, a - side * 1.7, 5.8, b, 0.7, 0.22, 0.45);
    if (axis === 'x') out.circle(a, b, 0.3);
    else out.circle(b, a, 0.3);
  }

  function genHighways(x0, z0, out) {
    for (const axis of ['x', 'z']) {
      const lo = axis === 'x' ? x0 : z0;     // across the road
      const blo = axis === 'x' ? z0 : x0;    // along it
      const first = Math.ceil((lo - HALF_CELL) / CELL) * CELL + HALF_CELL;
      for (let L = first; L < lo + CHUNK; L += CELL) {
        for (let b = blo + 4; b < blo + CHUNK; b += 8) {
          const wx = axis === 'x' ? L : b;
          const wz = axis === 'x' ? b : L;
          const r = regionAt(wx, wz);
          const ground = heightAt(wx, wz, r);
          const crossing = roadCoord(b) < ROAD_HALF + 1;
          roadPut(out, false, axis, 'box', 0x2c2d31, L, 0.04, b, ROAD_HALF * 2, 0.08, 8.02);
          if (!crossing) {
            if (Math.round((b - blo - 4) / 8) % 2 === 0) roadPut(out, false, axis, 'box', 0xe0c25a, L, 0.09, b, 0.26, 0.02, 3.6);
            roadPut(out, false, axis, 'box', 0xd6d6d6, L - ROAD_HALF + 0.5, 0.09, b, 0.2, 0.02, 8);
            roadPut(out, false, axis, 'box', 0xd6d6d6, L + ROAD_HALF - 0.5, 0.09, b, 0.2, 0.02, 8);
          }
          if (ground < -0.3) {
            // A bridge: rails, and a pier down to the lake bed every other segment.
            roadPut(out, false, axis, 'box', 0xa3a39c, L - ROAD_HALF - 0.15, 0.55, b, 0.3, 1.1, 8);
            roadPut(out, false, axis, 'box', 0xa3a39c, L + ROAD_HALF + 0.15, 0.55, b, 0.3, 1.1, 8);
            if (Math.round((b - blo - 4) / 8) % 2 === 0) roadPut(out, false, axis, 'box', 0x6e6c66, L, (ground - 0.1) / 2, b, 4, -ground + 0.2, 2);
            continue;
          }
          const town = weightOf(r, 'city') + weightOf(r, 'village');
          const step = (((b - HALF_CELL) % 32) + 32) % 32;
          if (crossing) continue;
          if (town > 0.45 && step === 4) {
            const side = Math.round(b / 32) % 2 === 0 ? 1 : -1;
            streetLamp(out, axis, L + side * (ROAD_HALF + 1.2), b, side);
          } else if (town <= 0.45 && (step === 4 || step === 20)) {
            // Reflector posts mark the verge of country roads, and glint at night.
            for (const side of [-1, 1]) {
              const a = L + side * (ROAD_HALF + 1.4);
              const gy = Math.max(0, heightAt(axis === 'x' ? a : b, axis === 'x' ? b : a));
              roadPut(out, false, axis, 'box', 0xe4e4e4, a, gy + 0.5, b, 0.18, 1, 0.18);
              roadPut(out, true, axis, 'box', side > 0 ? 0xff5a3a : 0xffffff, a, gy + 0.92, b, 0.2, 0.14, 0.2);
            }
          }
        }
      }
    }
  }

  /* ── cities ── */

  function genCity(x0, z0, out) {
    const firstX = Math.ceil((x0 - HALF_CELL - BLOCK / 2) / BLOCK) * BLOCK + HALF_CELL + BLOCK / 2;
    const firstZ = Math.ceil((z0 - HALF_CELL - BLOCK / 2) / BLOCK) * BLOCK + HALF_CELL + BLOCK / 2;
    // Streets: every BLOCK line that is not a highway, inside the city.
    for (const axis of ['x', 'z']) {
      const lo = axis === 'x' ? x0 : z0;
      const blo = axis === 'x' ? z0 : x0;
      const first = Math.ceil((lo - HALF_CELL) / BLOCK) * BLOCK + HALF_CELL;
      for (let L = first; L < lo + CHUNK; L += BLOCK) {
        if (roadCoord(L) < 1) continue;
        for (let b = blo + 4; b < blo + CHUNK; b += 8) {
          const wx = axis === 'x' ? L : b;
          const wz = axis === 'x' ? b : L;
          const r = regionAt(wx, wz);
          if (weightOf(r, 'city') < 0.5 || heightAt(wx, wz, r) < WATER_Y + 0.4) continue;
          roadPut(out, false, axis, 'box', 0x313236, L, 0.035, b, STREET_HALF * 2, 0.07, 8.02);
          const cross = streetCoord(b) < STREET_HALF + 1;
          if (!cross && Math.round((b - blo - 4) / 8) % 2 === 0) roadPut(out, false, axis, 'box', 0xdedede, L, 0.08, b, 0.2, 0.02, 3);
          const step = (((b - HALF_CELL) % BLOCK) + BLOCK) % BLOCK;
          if (step === 12 || step === 28) {
            const side = step === 12 ? 1 : -1;
            streetLamp(out, axis, L + side * (STREET_HALF + 1.1), b, side);
          }
          const h = hash3(seed ^ 0x3c, Math.floor(wx), Math.floor(wz));
          if (!cross && (h & 7) === 0) {
            const side = h & 8 ? 1 : -1;
            parkedCar(out, axis, L + side * (STREET_HALF - 1.3), b, h);
          }
        }
      }
    }
    for (let bx = firstX; bx < x0 + CHUNK; bx += BLOCK) {
      for (let bz = firstZ; bz < z0 + CHUNK; bz += BLOCK) {
        const r = regionAt(bx, bz);
        if (weightOf(r, 'city') < 0.55) continue;
        if (heightAt(bx, bz, r) < WATER_Y + 0.4) continue;
        genBlock(bx, bz, siteOfType(r, 'city'), out);
      }
    }
  }

  function parkedCar(out, axis, a, b, h) {
    const col = CAR_COLORS[(h >>> 4) % CAR_COLORS.length];
    roadPut(out, false, axis, 'box', col, a, 0.55, b, 1.8, 0.75, 4.2);
    roadPut(out, false, axis, 'box', col, a, 1.15, b - 0.2, 1.6, 0.55, 2.2);
    roadPut(out, false, axis, 'box', 0x1c2430, a, 1.15, b - 0.2, 1.64, 0.4, 2.0);
    if (axis === 'x') out.box(a - 0.9, b - 2.1, a + 0.9, b + 2.1, 1.4);
    else out.box(b - 2.1, a - 0.9, b + 2.1, a + 0.9, 1.4);
  }

  function windowBands(out, rb, style, x, z, w, d, y0, y1, lit) {
    for (let y = y0 + 2.2; y < y1 - 1; y += 3.2) {
      const faces = [[x, z + d / 2 + 0.04, w, 0], [x, z - d / 2 - 0.04, w, Math.PI], [x + w / 2 + 0.04, z, d, Math.PI / 2], [x - w / 2 - 0.04, z, d, -Math.PI / 2]];
      for (const [fx, fz, span, ry] of faces) {
        if (rb() < lit) out.glow('quad', WINDOW_LIT[Math.floor(rb() * WINDOW_LIT.length)], fx, y, fz, span * 0.86, 1.25, 1, ry);
        else out.solid('quad', 0x1d2633, fx, y, fz, span * 0.86, 1.25, 1, ry);
      }
    }
  }

  function genBlock(bx, bz, city, out) {
    const rb = mulberry32(hash3(seed ^ 0x77, bx, bz));
    const style = CITY_STYLES[Math.floor(city.variant * CITY_STYLES.length) % CITY_STYLES.length];
    const dc = Math.hypot(bx - city.x, bz - city.z);
    const tall = Math.exp(-((dc / 125) ** 2)) * (0.55 + city.variant * 0.7);
    const base = 0.16;
    // Sidewalk slab: the block minus its streets.
    out.solid('box', 0x8d8c88, bx, base / 2, bz, BLOCK - STREET_HALF * 2, base, BLOCK - STREET_HALF * 2);
    if (bx === city.landmark.x && bz === city.landmark.z) {
      spire(out, bx, bz, city, style);
      return;
    }
    if (rb() < 0.11 && dc > 30) {
      park(out, bx, bz, rb);
      return;
    }
    const inner = BLOCK - STREET_HALF * 2 - 4;    // lots fill the block inside a 2-unit sidewalk
    const split = rb();
    const lots = split < 0.3 ? [[0, 0, inner, inner]]
      : split < 0.6 ? [[-inner / 4, 0, inner / 2, inner], [inner / 4, 0, inner / 2, inner]]
        : [[-inner / 4, -inner / 4, inner / 2, inner / 2], [inner / 4, -inner / 4, inner / 2, inner / 2], [-inner / 4, inner / 4, inner / 2, inner / 2], [inner / 4, inner / 4, inner / 2, inner / 2]];
    for (const [ox, oz, lw, ld] of lots) {
      const w = lw - 1.5 - rb() * 2.5;
      const d = ld - 1.5 - rb() * 2.5;
      const x = bx + ox;
      const z = bz + oz;
      const h = 6 + rb() * (7 + 95 * tall * (lots.length === 1 ? 1 : 0.75));
      const col = style.body[Math.floor(rb() * style.body.length)];
      out.solid('box', col, x, base + h / 2, z, w, h, d);
      out.box(x - w / 2, z - d / 2, x + w / 2, z + d / 2, base + h);
      const lit = 0.28 + rb() * 0.4;
      windowBands(out, rb, style, x, z, w, d, base, base + h, lit);
      // Ground-floor shopfront and door.
      out.glow('quad', style.glass, x, base + 1.3, z + d / 2 + 0.05, w * 0.7, 1.7, 1, 0);
      let top = base + h;
      if (h > 48 && rb() < 0.6) {
        // Setback tower on top of tall buildings.
        const h2 = h * (0.25 + rb() * 0.25);
        const w2 = w * 0.62;
        const d2 = d * 0.62;
        out.solid('box', col, x, top + h2 / 2, z, w2, h2, d2);
        windowBands(out, rb, style, x, z, w2, d2, top, top + h2, lit);
        top += h2;
        if (rb() < 0.5) {
          out.solid('cyl', 0x9aa0a8, x, top + 5, z, 0.35, 10, 0.35);
          out.special('beacon', { x, y: top + 10.2, z });
        }
      } else if (rb() < 0.5) {
        out.solid('box', 0x6f6f6f, x + w * 0.2, top + 0.7, z - d * 0.15, w * 0.25, 1.4, d * 0.25);
      } else if (style === CITY_STYLES[1] && rb() < 0.7) {
        // Water tower on brick roofs.
        out.solid('cyl', 0x6b4a30, x - w * 0.2, top + 2.6, z, 2.4, 2.4, 2.4);
        out.solid('cone', 0x4a3a2a, x - w * 0.2, top + 4.3, z, 2.8, 1.1, 2.8);
        out.solid('box', 0x3a3a3a, x - w * 0.2, top + 0.7, z, 1.6, 1.4, 1.6);
      }
    }
  }

  function park(out, bx, bz, rb) {
    const size = BLOCK - STREET_HALF * 2 - 2;
    out.solid('box', 0x3f7a2c, bx, 0.2, bz, size, 0.1, size);
    out.solid('cyl', 0xb9b5aa, bx, 0.5, bz, 6, 0.6, 6);
    out.solid('cyl', 0x4a8fd0, bx, 0.75, bz, 5, 0.1, 5);
    out.solid('cyl', 0xb9b5aa, bx, 1.4, bz, 0.6, 1.8, 0.6);
    out.circle(bx, bz, 3);
    const n = 4 + Math.floor(rb() * 5);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rb() * 0.5;
      const rr = 8 + rb() * 5;
      broadTree(out, bx + Math.cos(a) * rr, 0.2, bz + Math.sin(a) * rr, 0.9 + rb() * 0.4, rb, 0);
    }
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      out.solid('box', 0x7a5232, bx + Math.cos(a) * 5.2, 0.6, bz + Math.sin(a) * 5.2, 2.2, 0.25, 0.7, -a);
    }
  }

  function spire(out, x, z, city, style) {
    const base = 0.16;
    out.solid('box', 0xb7b4ac, x, base + 0.3, z, 30, 0.6, 30);
    let y = base + 0.6;
    const tiers = [[20, 34], [15, 40], [10, 34], [6, 20]];
    for (const [w, h] of tiers) {
      out.solid('box', style.body[0], x, y + h / 2, z, w, h, w);
      for (let yy = y + 2; yy < y + h - 1; yy += 2.6) {
        for (const [fx, fz, ry] of [[x, z + w / 2 + 0.05, 0], [x, z - w / 2 - 0.05, Math.PI], [x + w / 2 + 0.05, z, Math.PI / 2], [x - w / 2 - 0.05, z, -Math.PI / 2]]) {
          out.glow('quad', 0xbfe8ff, fx, yy, fz, w * 0.88, 1.2, 1, ry);
        }
      }
      y += h;
    }
    out.solid('cone', 0xc9ccd2, x, y + 6, z, 5, 12, 5);
    out.solid('cyl', 0xd0d3d8, x, y + 20, z, 0.4, 20, 0.4);
    out.special('beacon', { x, y: y + 30.4, z, big: true });
    out.box(x - 10, z - 10, x + 10, z + 10, 200);
  }

  /* ── trees and scatter ── */

  function pine(out, x, y, z, s, rb, dark) {
    out.solid('cyl5', 0x5a3d24, x, y + 1.2 * s, z, 0.45 * s, 2.4 * s, 0.45 * s);
    const g = dark ? 0x1c4a25 : 0x24572c;
    out.solid('cone', g, x, y + 3.2 * s, z, 3.4 * s, 3.6 * s, 3.4 * s, rb() * 6);
    out.solid('cone', g, x, y + 5 * s, z, 2.6 * s, 3 * s, 2.6 * s, rb() * 6);
    out.solid('cone', g, x, y + 6.6 * s, z, 1.7 * s, 2.4 * s, 1.7 * s, rb() * 6);
    out.circle(x, z, 0.4 * s);
  }

  function broadTree(out, x, y, z, s, rb, autumn, birch) {
    out.solid('cyl5', birch ? 0xe6e2d6 : 0x5f4128, x, y + 1.6 * s, z, 0.5 * s, 3.2 * s, 0.5 * s);
    const greens = [0x2f6b2a, 0x3d7d30, 0x2a5e2a, 0x4a8a34];
    const fall = [0xc9662a, 0xd9a330, 0xa8432a, 0xe0b23c, 0x8c3a22];
    const pal = autumn ? fall : greens;
    const c = pal[Math.floor(rb() * pal.length)];
    out.solid('ico', c, x, y + 4 * s, z, 3.8 * s, 3.2 * s, 3.8 * s, rb() * 6);
    if (rb() < 0.6) out.solid('ico', pal[Math.floor(rb() * pal.length)], x + (rb() - 0.5) * 2 * s, y + 5.2 * s, z + (rb() - 0.5) * 2 * s, 2.6 * s, 2.4 * s, 2.6 * s, rb() * 6);
    out.circle(x, z, 0.45 * s);
  }

  function rock(out, x, y, z, s, rb) {
    const c = [0x77746e, 0x8a867e, 0x6a6862][Math.floor(rb() * 3)];
    out.solid('ico', c, x, y + 0.3 * s, z, 1.6 * s, 1.1 * s, 1.4 * s, rb() * 6);
    out.circle(x, z, 0.7 * s);
  }

  function tuft(out, x, y, z, rb, col) {
    out.solid('cone', col, x, y + 0.3, z, 0.5 + rb() * 0.3, 0.6 + rb() * 0.5, 0.5, rb() * 6);
  }

  function genScatter(x0, z0, out, rng) {
    const STEP = 5;
    for (let gx = x0; gx < x0 + CHUNK; gx += STEP) {
      for (let gz = z0; gz < z0 + CHUNK; gz += STEP) {
        const x = gx + rng() * STEP;
        const z = gz + rng() * STEP;
        const pick = rng();
        const roll = rng();
        const rd = roadDist(x, z);
        if (rd < ROAD_HALF + 2.5) continue;
        const r = regionAt(x, z);
        // Dither between the two regions near a border, so they interleave.
        const s = pick < r.own ? r.site : r.other;
        if (s.type === 'city' || weightOf(r, 'city') > 0.35) continue;
        const lm = s.landmark;
        if (Math.hypot(x - lm.x, z - lm.z) < (s.type === 'meadow' ? 14 : 9)) continue;
        if (weightOf(r, 'village') > 0.3 && roll > 0.2 && nearHouse(x, z)) continue;
        const y = heightAt(x, z, r);
        const under = y < WATER_Y;
        if (under) {
          if (y > WATER_Y - 0.7 && roll < 0.4) out.solid('cone', 0x6b8a3a, x, WATER_Y + 0.6, z, 0.25, 1.6 + rng(), 0.25);
          else if (y < WATER_Y - 1.2 && roll < 0.04) out.solid('cyl', 0x3f7a35, x, WATER_Y + 0.04, z, 1.4, 0.06, 1.4);
          continue;
        }
        if (y < WATER_Y + 0.5 && roll < 0.35) {
          out.solid('cone', 0x7a9a40, x, y + 0.9, z, 0.25, 1.8 + rng(), 0.25);
          continue;
        }
        const dense = fbm(seed ^ 0x81, x / 45, z / 45, 2);
        switch (s.type) {
          case 'forest': {
            const v = s.variant;
            const kind = v < 0.32 ? 'pine' : v < 0.62 ? 'mixed' : v < 0.82 ? 'autumn' : 'birch';
            const p = 0.3 + dense * 0.55;
            if (roll < p) {
              const sc = 0.8 + rng() * 0.7;
              if (kind === 'pine' || (kind === 'mixed' && rng() < 0.5)) pine(out, x, y, z, sc, rng, true);
              else broadTree(out, x, y, z, sc, rng, kind === 'autumn', kind === 'birch');
            } else if (roll < p + 0.06) rock(out, x, y, z, 0.6 + rng(), rng);
            else if (roll < p + 0.1) {
              const col = rng() < 0.4 ? 0x5fe0ff : 0xd8392b;
              const glow = col === 0x5fe0ff;
              out.solid('cyl5', 0xe8e0cc, x, y + 0.25, z, 0.18, 0.5, 0.18);
              (glow ? out.glow : out.solid)('sphere', col, x, y + 0.55, z, 0.7, 0.35, 0.7);
            } else if (roll < p + 0.12) {
              out.solid('cyl5', 0x5a3d24, x, y + 0.4, z, 0.8, 4 + rng() * 2, 0.8, rng() * 6, Math.PI / 2);
              out.circle(x, z, 1);
            } else if (roll < p + 0.25) out.solid('ico', 0x2c5a26, x, y + 0.5, z, 1.6, 1.1, 1.6, rng() * 6);
            else if (roll < p + 0.32) out.special('firefly', { x, y: y + 1.5, z });
            break;
          }
          case 'meadow': {
            if (roll < 0.28) tuft(out, x, y, z, rng, 0x6f9a30);
            else if (roll < 0.4) out.solid('box', FLOWERS[Math.floor(rng() * FLOWERS.length)], x, y + 0.35, z, 0.35, 0.35, 0.35, rng() * 6);
            else if (roll < 0.425) broadTree(out, x, y, z, 1 + rng() * 0.5, rng, false);
            else if (roll < 0.445) rock(out, x, y, z, 0.6 + rng() * 0.8, rng);
            else if (roll < 0.455) {
              out.solid('cyl', 0xd9b552, x, y + 0.75, z, 1.5, 1.6, 1.5, rng() * 6, Math.PI / 2);
              out.circle(x, z, 0.9);
            } else if (roll < 0.47) out.special('firefly', { x, y: y + 1.2, z });
            break;
          }
          case 'hills': {
            if (y > 15) {
              if (roll < 0.08) rock(out, x, y, z, 1 + rng() * 1.6, rng);
            } else if (roll < 0.14) tuft(out, x, y, z, rng, 0x6a8a3a);
            else if (roll < 0.21) rock(out, x, y, z, 1 + rng() * 2.2, rng);
            else if (roll < 0.27 && y < 11) pine(out, x, y, z, 0.8 + rng() * 0.5, rng, false);
            break;
          }
          case 'village': {
            if (roll < 0.14) tuft(out, x, y, z, rng, 0x6a9433);
            else if (roll < 0.2) out.solid('box', FLOWERS[Math.floor(rng() * FLOWERS.length)], x, y + 0.3, z, 0.3, 0.3, 0.3);
            else if (roll < 0.235) broadTree(out, x, y, z, 0.8 + rng() * 0.5, rng, false);
            else if (roll < 0.245) {
              out.solid('cyl', 0xd9b552, x, y + 0.75, z, 1.5, 1.6, 1.5, rng() * 6, Math.PI / 2);
              out.circle(x, z, 0.9);
            }
            break;
          }
          case 'lake': {
            if (roll < 0.2) tuft(out, x, y, z, rng, 0x5f8a34);
            else if (roll < 0.24) broadTree(out, x, y, z, 0.9 + rng() * 0.4, rng, false, rng() < 0.5);
            break;
          }
          default:
            break;
        }
      }
    }
  }

  /* ── villages ── */

  const HOUSE_STEP = 15;
  const houseCache = new Map();

  /** The house standing in one HOUSE_STEP grid cell, or null. */
  function houseSpot(gx, gz) {
    const key = (gx / HOUSE_STEP + 50000) * 100000 + (gz / HOUSE_STEP + 50000);
    if (houseCache.has(key)) return houseCache.get(key);
    if (houseCache.size > 30000) houseCache.clear();
    let spot = null;
    const hr = mulberry32(hash3(seed ^ 0x5e, gx, gz));
    const x = gx + 3 + hr() * (HOUSE_STEP - 6);
    const z = gz + 3 + hr() * (HOUSE_STEP - 6);
    const r = regionAt(x, z);
    const vw = weightOf(r, 'village');
    if (vw >= 0.5 && hr() <= vw) {
      const v = siteOfType(r, 'village');
      const d = Math.hypot(x - v.x, z - v.z);
      if (hr() <= 0.65 * Math.exp(-((d / 115) ** 2)) + 0.08
        && roadDist(x, z) >= ROAD_HALF + 7
        && Math.hypot(x - v.landmark.x, z - v.landmark.z) >= 16) {
        spot = { x, z, v, seed: hash3(seed ^ 0x5f, gx, gz) };
      }
    }
    houseCache.set(key, spot);
    return spot;
  }

  function nearHouse(x, z) {
    const gx = Math.floor(x / HOUSE_STEP) * HOUSE_STEP;
    const gz = Math.floor(z / HOUSE_STEP) * HOUSE_STEP;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const h = houseSpot(gx + i * HOUSE_STEP, gz + j * HOUSE_STEP);
        if (h && Math.hypot(x - h.x, z - h.z) < 10) return true;
      }
    }
    return false;
  }

  function genVillages(x0, z0, out) {
    const gx0 = Math.floor(x0 / HOUSE_STEP) * HOUSE_STEP;
    const gz0 = Math.floor(z0 / HOUSE_STEP) * HOUSE_STEP;
    for (let gx = gx0; gx < x0 + CHUNK; gx += HOUSE_STEP) {
      for (let gz = gz0; gz < z0 + CHUNK; gz += HOUSE_STEP) {
        const spot = houseSpot(gx, gz);
        if (!spot || spot.x < x0 || spot.x >= x0 + CHUNK || spot.z < z0 || spot.z >= z0 + CHUNK) continue;
        house(out, spot.x, spot.z, spot.v, mulberry32(spot.seed));
      }
    }
  }

  function house(out, x, z, v, hr) {
    const w = 5 + hr() * 3;
    const d = 4.2 + hr() * 2;
    const wallH = 2.8 + hr() * 1.1;
    // Face the nearer highway when one is close, otherwise any way.
    let ry = Math.floor(hr() * 4) * (Math.PI / 2);
    if (roadCoord(x) < 40) ry = roadCoord(x + 1) < roadCoord(x) ? Math.PI / 2 : -Math.PI / 2;
    else if (roadCoord(z) < 40) ry = roadCoord(z + 1) < roadCoord(z) ? 0 : Math.PI;
    const turned = Math.abs(Math.sin(ry)) > 0.5;
    const hw = turned ? d / 2 : w / 2;
    const hd = turned ? w / 2 : d / 2;
    let y = Infinity;
    for (const [cx, cz] of [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd], [0, 0]]) y = Math.min(y, heightAt(x + cx, z + cz));
    if (y < WATER_Y + 0.3) return;
    const wall = HOUSE_WALLS[Math.floor(hr() * HOUSE_WALLS.length)];
    const roofC = HOUSE_ROOFS[Math.floor(hr() * HOUSE_ROOFS.length)];
    const roofH = 1.6 + hr() * 1.2;
    // Local offsets (lx along the house front, lz out of it) turned by ry.
    const cs = Math.cos(ry);
    const sn = Math.sin(ry);
    const at = (lx, lz) => [x + lx * cs + lz * sn, z - lx * sn + lz * cs];
    out.solid('box', wall, x, y + wallH / 2 - 0.4, z, w, wallH + 0.8, d, ry);
    out.solid('prism', roofC, x, y + wallH, z, d + 0.8, roofH, w + 0.7, ry + Math.PI / 2);
    const [chx, chz] = at(w * 0.25, -d * 0.15);
    out.solid('box', 0x7a5a48, chx, y + wallH + roofH * 0.75, chz, 0.6, roofH + 0.8, 0.6, ry);
    if (hr() < 0.65) out.special('smoke', { x: chx, y: y + wallH + roofH * 0.75 + 0.9, z: chz });
    const [dx, dz] = at(0, d / 2 + 0.05);
    out.solid('quad', 0x4a3020, dx, y + 0.95, dz, 1, 1.9, 1, ry);
    const [lx, lz] = at(0.9, d / 2 + 0.2);
    out.glow('box', 0xffcf7a, lx, y + 2.05, lz, 0.25, 0.3, 0.25, ry);
    for (const side of [-1, 1]) {
      for (const face of [1, -1]) {
        const [wx, wz] = at(side * w * 0.3, face * (d / 2 + 0.05));
        const lit = hr() < 0.6;
        (lit ? out.glow : out.solid)('quad', lit ? 0xffc870 : 0x2a3440, wx, y + 1.7, wz, 0.9, 0.9, 1, ry + (face < 0 ? Math.PI : 0));
      }
    }
    out.box(x - hw, z - hd, x + hw, z + hd, y + wallH + roofH);
    // A fenced garden in front of some houses.
    if (hr() < 0.4) {
      const fw = w + 3;
      const fd = 5;
      const post = (lx, lz) => {
        const [px, pz] = at(lx, lz);
        out.solid('box', 0x8a6a48, px, heightAt(px, pz) + 0.5, pz, 0.18, 1, 0.18, ry);
      };
      for (let i = 0; i <= 6; i++) {
        const lx = -fw / 2 + (fw * i) / 6;
        if (Math.abs(lx) > 0.9) post(lx, d / 2 + fd);
      }
      for (let i = 1; i <= 3; i++) {
        post(-fw / 2, d / 2 + (fd * i) / 3);
        post(fw / 2, d / 2 + (fd * i) / 3);
      }
      const [rx, rz] = at(0, d / 2 + fd);
      out.solid('box', 0x9a7a52, rx, y + 0.75, rz, fw, 0.1, 0.1, ry);
      const rows = 4;
      for (let i = 0; i < rows; i++) {
        const [cx, cz] = at(-fw / 4, d / 2 + 1 + i * 1.1);
        out.solid('box', hr() < 0.5 ? 0x4f8f2c : 0xc9a63a, cx, y + 0.25, cz, fw * 0.4, 0.5, 0.45, ry);
      }
    }
  }

  /* ── landmarks ── */

  function genLandmarks(x0, z0, out) {
    const c0 = Math.floor((x0 - 200) / CELL);
    const c1 = Math.floor((x0 + CHUNK + 200) / CELL);
    const d0 = Math.floor((z0 - 200) / CELL);
    const d1 = Math.floor((z0 + CHUNK + 200) / CELL);
    for (let ci = c0; ci <= c1; ci++) {
      for (let cj = d0; cj <= d1; cj++) {
        const s = site(ci, cj);
        const { x, z } = s.landmark;
        if (x < x0 || x >= x0 + CHUNK || z < z0 || z >= z0 + CHUNK) continue;
        out.landmark({ key: s.key, name: s.landmarkName, x, z, type: s.type });
        if (s.type === 'city') continue;     // the spire is built with its block
        const y = heightAt(x, z);
        const rb = mulberry32(hash3(seed ^ 0x1a, ci, cj));
        if (s.type === 'village') windmill(out, x, y, z, rb);
        else if (s.type === 'forest') elderTree(out, x, y, z, rb, s);
        else if (s.type === 'meadow') stoneCircle(out, x, z, rb);
        else if (s.type === 'hills') watchtower(out, x, y, z);
        else if (s.type === 'lake') lighthouse(out, x, Math.max(y, 0.4), z);
      }
    }
  }

  function windmill(out, x, y, z, rb) {
    out.solid('taper', 0xe8dcc0, x, y + 6, z, 6.5, 13, 6.5);
    out.solid('cone', 0x7a3a2a, x, y + 14, z, 6, 3.4, 6);
    out.solid('quad', 0x4a3020, x, y + 1.1, z + 3.1, 1.3, 2.2, 1, 0);
    out.special('blades', { x, y: y + 12.2, z: z + 3.4, len: 9 });
    out.circle(x, z, 3.3);
    // A well and some hay at the village green.
    const wx = x + 9;
    const wz = z - 6;
    const wy = heightAt(wx, wz);
    out.solid('cyl', 0x8a8a84, wx, wy + 0.5, wz, 2.4, 1, 2.4);
    out.solid('cyl', 0x2a4a6a, wx, wy + 1.0, wz, 1.9, 0.05, 1.9);
    out.solid('box', 0x6a4a30, wx - 1, wy + 1.6, wz, 0.2, 2.2, 0.2);
    out.solid('box', 0x6a4a30, wx + 1, wy + 1.6, wz, 0.2, 2.2, 0.2);
    out.solid('prism', 0x7a3a2a, wx, wy + 2.7, wz, 2.8, 0.9, 2.2);
    out.circle(wx, wz, 1.3);
    for (let i = 0; i < 3; i++) {
      const hx = x - 8 + rb() * 3;
      const hz = z + 6 + i * 2.2;
      out.solid('cyl', 0xd9b552, hx, heightAt(hx, hz) + 0.8, hz, 1.6, 1.6, 1.6, 0, Math.PI / 2);
    }
  }

  function elderTree(out, x, y, z, rb, s) {
    const autumn = s.variant > 0.62 && s.variant < 0.82;
    out.solid('cyl', 0x4a3220, x, y + 9, z, 4.2, 18, 4.2);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      out.solid('box', 0x4a3220, x + Math.cos(a) * 2.6, y + 0.6, z + Math.sin(a) * 2.6, 3.4, 1.2, 1.1, -a);
    }
    const pal = autumn ? [0xc9662a, 0xd9a330, 0xa8432a] : [0x2a5e2a, 0x356f2e, 0x2f6b2a];
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + rb();
      const rr = i === 0 ? 0 : 5 + rb() * 3;
      out.solid('ico', pal[i % pal.length], x + Math.cos(a) * rr, y + 19 + rb() * 6, z + Math.sin(a) * rr, 11 + rb() * 4, 8 + rb() * 3, 11 + rb() * 4, rb() * 6);
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const mx = x + Math.cos(a) * 7;
      const mz = z + Math.sin(a) * 7;
      const my = heightAt(mx, mz);
      out.solid('cyl5', 0xe8e0cc, mx, my + 0.3, mz, 0.2, 0.6, 0.2);
      out.glow('sphere', 0x5fe0ff, mx, my + 0.65, mz, 0.8, 0.4, 0.8);
    }
    out.circle(x, z, 2.3);
    out.special('firefly', { x, y: y + 3, z, many: true });
  }

  function stoneCircle(out, x, z, rb) {
    const n = 11;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const sx = x + Math.cos(a) * 10;
      const sz = z + Math.sin(a) * 10;
      const sy = heightAt(sx, sz);
      const h = 3.4 + rb() * 1.6;
      if (rb() < 0.12) {
        out.solid('box', 0x8d8a82, sx, sy + 0.5, sz, 1.3, 1, h, -a);   // a fallen stone
      } else {
        out.solid('box', 0x8d8a82, sx, sy + h / 2 - 0.3, sz, 1.4, h, 0.9, -a + Math.PI / 2);
        out.circle(sx, sz, 0.8);
      }
    }
    const y = heightAt(x, z);
    out.solid('box', 0x77746c, x, y + 0.5, z, 3, 1, 1.8);
    out.circle(x, z, 1.6);
  }

  function watchtower(out, x, y, z) {
    for (const [ox, oz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) out.solid('box', 0x6a4a30, x + ox, y + 5, z + oz, 0.5, 10, 0.5);
    out.solid('box', 0x7a5a38, x, y + 10, z, 6, 0.4, 6);
    for (const [ox, oz, w, d] of [[0, -3, 6, 0.2], [0, 3, 6, 0.2], [-3, 0, 0.2, 6], [3, 0, 0.2, 6]]) out.solid('box', 0x7a5a38, x + ox, y + 10.7, z + oz, w, 1, d);
    out.solid('cone4', 0x5a3a2a, x, y + 12.6, z, 7.5, 3, 7.5);
    out.glow('cyl', 0xff9a3a, x, y + 11, z, 1.2, 1, 1.2);
    out.special('fire', { x, y: y + 11.6, z });
    out.box(x - 2.4, z - 2.4, x + 2.4, z + 2.4, y + 14);
  }

  function lighthouse(out, x, y, z) {
    out.solid('cyl', 0x8a8a84, x, y + 0.4, z, 7, 0.8, 7);
    out.solid('taper', 0xf2f0ea, x, y + 8, z, 3.6, 16, 3.6);
    for (const yy of [4, 9, 13.5]) out.solid('cyl', 0xc83a2e, x, y + yy, z, 3.3 - yy * 0.07, 1.4, 3.3 - yy * 0.07);
    out.solid('cyl', 0x2a2a2a, x, y + 16.2, z, 2.8, 0.4, 2.8);
    out.glow('cyl', 0xfff3c0, x, y + 17.2, z, 2, 1.8, 2);
    out.solid('cone', 0xc83a2e, x, y + 18.9, z, 2.8, 1.6, 2.8);
    out.special('beam', { x, y: y + 17.2, z });
    out.circle(x, z, 1.9);
  }

  /* ───────────────────────── queries for the HUD ───────────────────────── */

  /** One glyph of the ASCII map, and its class. */
  function mapGlyph(x, z) {
    const rx = roadCoord(x);
    const rz = roadCoord(z);
    const h = heightAt(x, z);
    if (rx < ROAD_HALF + 1 && rz < ROAD_HALF + 1) return ['+', 'rd'];
    if (rx < ROAD_HALF + 1) return [h < WATER_Y ? 'H' : '|', 'rd'];
    if (rz < ROAD_HALF + 1) return [h < WATER_Y ? 'H' : '=', 'rd'];
    if (h < WATER_Y) return ['~', 'wa'];
    const r = regionAt(x, z);
    const t = r.own >= 0.5 ? r.site.type : r.other.type;
    if (t === 'city') return [streetCoord(x) < 3 || streetCoord(z) < 3 ? ':' : '#', 'ci'];
    if (t === 'hills') return [h > 14 ? 'A' : '^', 'hi'];
    return [{ village: 'n', forest: '&', meadow: '"', lake: '.' }[t], t.slice(0, 2)];
  }

  /** The regions the two highways through a crossroads lead to next. */
  function signpost(x, z) {
    const ci = Math.floor(x / CELL);
    const cj = Math.floor(z / CELL);
    return {
      north: site(ci, cj - 1),
      south: site(ci, cj + 1),
      east: site(ci + 1, cj),
      west: site(ci - 1, cj),
    };
  }

  return {
    seed,
    seedText: String(seedText),
    site,
    regionAt,
    heightAt,
    standAt,
    groundColor,
    weightOf,
    generateChunk,
    mapGlyph,
    signpost,
  };
}
