import type { FlowerColor, FlowerTile, BeeDrone, LevelData, GameStatus, LossReason } from './types.ts';

export interface ProjectileEvent {
  id: string;
  beeId: string;
  fromX: number; // Normalized 0..1 in board space or coords
  fromY: number;
  toX: number;
  toY: number;
  color: FlowerColor;
  targetTileId: string;
  progress: number; // 0..1
}

export interface HitEffectEvent {
  id: string;
  x: number;
  y: number;
  color: FlowerColor;
  scoreGained: number;
  age: number; // seconds since the hit; removed after HIT_EFFECT_TTL
}

export interface GameState {
  levelId: number;
  gridRows: number;
  gridCols: number;
  tiles: FlowerTile[];
  dockBees: BeeDrone[]; // Bees waiting in docks (max 5 or 6)
  loopBees: BeeDrone[]; // Bees currently flying clockwise on the vine loop
  clearedBees: BeeDrone[];
  unspawnedQueue: { color: FlowerColor; ammo: number }[];
  maxDocks: number; // default 5, can be upgraded to 6 with booster
  maxLoopCapacity: number; // 4 unless the level says otherwise
  status: GameStatus;
  lossReason?: LossReason;
  shortColor?: FlowerColor; // the colour that ran out of pollen
  score: number;
  combo: number;
  bestCombo: number;
  comboTimer: number; // seconds since the last bloom
  movesUsed: number;
  boostersUsed: number;
  activeProjectiles: ProjectileEvent[];
  recentHits: HitEffectEvent[];
  // What happened in the most recent step, so the UI can play sounds once per event
  tick: number;
  lastStepHits: number;
  lastStepShots: number;
  lastStepBored: FlowerColor[]; // colours of bees that gave up and flew home
}

export const BEE_SPEED = 0.16; // Completes a full loop around the board in ~6.25 seconds
export const PATIENCE_LAPS = 1; // Laps a bee will fly without a reachable flower before leaving
export const COMBO_WINDOW = 1.5; // Seconds without a bloom before the combo resets
export const HIT_EFFECT_TTL = 0.9;
const SHOT_COOLDOWN = 0.28;
const PROJECTILE_SPEED = 4.0; // Projectile flies to target in ~0.25s
const BURST_SIZE = 4;
const DEFAULT_DOCKS = 5;
const DEFAULT_LOOP_CAPACITY = 4;

let beeSerial = 0;

function makeDockBee(color: FlowerColor, ammo: number): BeeDrone {
  beeSerial += 1;
  return {
    id: `bee_${beeSerial}_${Math.random().toString(36).substring(2, 6)}`,
    color,
    totalAmmo: ammo,
    currentAmmo: ammo,
    loopProgress: 0,
    status: 'dock',
    speed: BEE_SPEED,
    cooldownUntilNextShot: 0,
    idleProgress: 0,
  };
}

/**
 * Points for a single flower bloom. `combo` is 1 for the first bloom of a chain and
 * grows by one for every bloom that lands within COMBO_WINDOW seconds of the last.
 */
export function scoreForHit(combo: number): number {
  // TODO(human): reward chains. Until then every bloom is worth the same, so every
  // booster-free win is a "perfect chain" and earns 3 stars.
  return 50;
}

/** Score for blooming every flower in one unbroken combo chain. */
export function perfectScore(tileCount: number): number {
  let total = 0;
  for (let combo = 1; combo <= tileCount; combo++) total += scoreForHit(combo);
  return total;
}

/** 1-3 stars for a won level: chain blooms together, and earn the third star without boosters. */
export function calculateStars(state: GameState): number {
  if (state.status !== 'won') return 0;
  const ratio = state.score / perfectScore(state.tiles.length);
  if (ratio >= 0.8 && state.boostersUsed === 0) return 3;
  if (ratio >= 0.55) return 2;
  return 1;
}

export function createInitialGameState(level: LevelData): GameState {
  const tiles: FlowerTile[] = [];
  level.layout.forEach((rowItems, r) => {
    rowItems.forEach((color, c) => {
      if (color) {
        tiles.push({
          id: `tile_${r}_${c}`,
          row: r,
          col: c,
          color,
          cleared: false,
        });
      }
    });
  });

  // Take the first up to 5 bees from queue and place in docks
  const initialDockCount = Math.min(DEFAULT_DOCKS, level.beeQueue.length);
  const dockBees = level.beeQueue.slice(0, initialDockCount).map(item => makeDockBee(item.color, item.ammo));

  return {
    levelId: level.id,
    gridRows: level.gridRows,
    gridCols: level.gridCols,
    tiles,
    dockBees,
    loopBees: [],
    clearedBees: [],
    unspawnedQueue: level.beeQueue.slice(initialDockCount),
    maxDocks: DEFAULT_DOCKS,
    maxLoopCapacity: level.loopCapacity ?? DEFAULT_LOOP_CAPACITY,
    status: 'playing',
    score: 0,
    combo: 0,
    bestCombo: 0,
    comboTimer: 0,
    movesUsed: 0,
    boostersUsed: 0,
    activeProjectiles: [],
    recentHits: [],
    tick: 0,
    lastStepHits: 0,
    lastStepShots: 0,
    lastStepBored: [],
  };
}

/**
 * The first colour whose remaining pollen (bees anywhere plus shots in the air)
 * can no longer cover its unbloomed flowers, or null when every colour is covered.
 */
export function pollenShortfall(state: GameState): { color: FlowerColor; missing: number } | null {
  const balance: Partial<Record<FlowerColor, number>> = {};
  for (const tile of state.tiles) {
    if (!tile.cleared) balance[tile.color] = (balance[tile.color] ?? 0) + 1;
  }
  for (const bee of [...state.loopBees, ...state.dockBees]) {
    balance[bee.color] = (balance[bee.color] ?? 0) - bee.currentAmmo;
  }
  for (const item of state.unspawnedQueue) {
    balance[item.color] = (balance[item.color] ?? 0) - item.ammo;
  }
  for (const proj of state.activeProjectiles) {
    balance[proj.color] = (balance[proj.color] ?? 0) - 1;
  }
  for (const [color, missing] of Object.entries(balance) as [FlowerColor, number][]) {
    if (missing > 0) return { color, missing };
  }
  return null;
}

/**
 * Calculates current coordinates (normalized 0..1 in perimeter boundary)
 * for a bee at given loopProgress [0..1).
 * Loop goes clockwise:
 * 0.00 -> 0.25: Top edge (X: 0 -> 1, Y: 0)
 * 0.25 -> 0.50: Right edge (X: 1, Y: 0 -> 1)
 * 0.50 -> 0.75: Bottom edge (X: 1 -> 0, Y: 1)
 * 0.75 -> 1.00: Left edge (X: 0, Y: 1 -> 0)
 */
export function getBeeLoopCoords(progress: number): { x: number; y: number; edge: 'top' | 'right' | 'bottom' | 'left'; indexAlongEdge: number } {
  const p = ((progress % 1) + 1) % 1;
  if (p < 0.25) {
    const fraction = p / 0.25;
    return { x: fraction, y: 0, edge: 'top', indexAlongEdge: fraction };
  } else if (p < 0.5) {
    const fraction = (p - 0.25) / 0.25;
    return { x: 1, y: fraction, edge: 'right', indexAlongEdge: fraction };
  } else if (p < 0.75) {
    const fraction = (p - 0.5) / 0.25;
    return { x: 1 - fraction, y: 1, edge: 'bottom', indexAlongEdge: 1 - fraction };
  } else {
    const fraction = (p - 0.75) / 0.25;
    return { x: 0, y: 1 - fraction, edge: 'left', indexAlongEdge: 1 - fraction };
  }
}

/**
 * Given a bee at its current progress along the perimeter,
 * raycasts perpendicularly into the grid to find the outer-most uncleared flower.
 * If that flower matches the bee's color, returns the target tile.
 */
export function findTargetTileForBee(
  bee: BeeDrone,
  tiles: FlowerTile[],
  gridRows: number,
  gridCols: number
): FlowerTile | null {
  if (bee.currentAmmo <= 0 || bee.status !== 'loop') return null;

  const { edge, indexAlongEdge } = getBeeLoopCoords(bee.loopProgress);

  // Map normalized edge position to nearest grid column or row
  if (edge === 'top') {
    // Facing DOWN (+row). Column determined by X position
    const col = Math.min(gridCols - 1, Math.max(0, Math.floor(indexAlongEdge * gridCols)));
    // Find the first uncleared tile in this column from top (row 0 to gridRows-1)
    for (let r = 0; r < gridRows; r++) {
      const tile = tiles.find(t => t.row === r && t.col === col && !t.cleared);
      if (tile) {
        return tile.color === bee.color ? tile : null; // Blocked if different color
      }
    }
  } else if (edge === 'right') {
    // Facing LEFT (-col). Row determined by Y position
    const row = Math.min(gridRows - 1, Math.max(0, Math.floor(indexAlongEdge * gridRows)));
    // Find the first uncleared tile in this row from right (col gridCols-1 down to 0)
    for (let c = gridCols - 1; c >= 0; c--) {
      const tile = tiles.find(t => t.row === row && t.col === c && !t.cleared);
      if (tile) {
        return tile.color === bee.color ? tile : null;
      }
    }
  } else if (edge === 'bottom') {
    // Facing UP (-row). Column determined by X position
    const col = Math.min(gridCols - 1, Math.max(0, Math.floor(indexAlongEdge * gridCols)));
    // Find the first uncleared tile in this column from bottom (row gridRows-1 down to 0)
    for (let r = gridRows - 1; r >= 0; r--) {
      const tile = tiles.find(t => t.row === r && t.col === col && !t.cleared);
      if (tile) {
        return tile.color === bee.color ? tile : null;
      }
    }
  } else if (edge === 'left') {
    // Facing RIGHT (+col). Row determined by Y position
    const row = Math.min(gridRows - 1, Math.max(0, Math.floor(indexAlongEdge * gridRows)));
    // Find the first uncleared tile in this row from left (col 0 to gridCols-1)
    for (let c = 0; c < gridCols; c++) {
      const tile = tiles.find(t => t.row === row && t.col === c && !t.cleared);
      if (tile) {
        return tile.color === bee.color ? tile : null;
      }
    }
  }

  return null;
}

/** Every uncleared flower a bee could currently reach from some point on the vine. */
export function getExposedTiles(tiles: FlowerTile[], gridRows: number, gridCols: number): FlowerTile[] {
  const open = new Map(tiles.filter(t => !t.cleared).map(t => [`${t.row},${t.col}`, t]));
  const exposed = new Map<string, FlowerTile>();
  const firstAlong = (cells: [number, number][]) => {
    for (const [r, c] of cells) {
      const tile = open.get(`${r},${c}`);
      if (tile) {
        exposed.set(tile.id, tile);
        return;
      }
    }
  };
  const rows = Array.from({ length: gridRows }, (_, i) => i);
  const cols = Array.from({ length: gridCols }, (_, i) => i);
  for (const c of cols) {
    firstAlong(rows.map(r => [r, c]));
    firstAlong([...rows].reverse().map(r => [r, c]));
  }
  for (const r of rows) {
    firstAlong(cols.map(c => [r, c]));
    firstAlong([...cols].reverse().map(c => [r, c]));
  }
  return [...exposed.values()];
}

/** Bees in the dock or queue whose colour is fully bloomed head home, and the queue refills the dock. */
function retireFinishedBench(state: GameState): GameState {
  const remainingColors = new Set(state.tiles.filter(t => !t.cleared).map(t => t.color));
  const dockBees = state.dockBees.filter(b => remainingColors.has(b.color));
  const queue = state.unspawnedQueue.filter(item => remainingColors.has(item.color));
  if (dockBees.length === state.dockBees.length && queue.length === state.unspawnedQueue.length) {
    return state;
  }
  while (dockBees.length < state.maxDocks && queue.length > 0) {
    const next = queue.shift()!;
    dockBees.push(makeDockBee(next.color, next.ammo));
  }
  return { ...state, dockBees, unspawnedQueue: queue };
}

/** Enter the vine in the middle of the widest gap between bees already flying. */
function pickEntryProgress(loopBees: BeeDrone[]): number {
  if (loopBees.length === 0) return 0;
  const positions = loopBees.map(b => b.loopProgress).sort((a, b) => a - b);
  let gapStart = positions[positions.length - 1];
  let widestGap = positions[0] + 1 - gapStart;
  for (let i = 1; i < positions.length; i++) {
    const gap = positions[i] - positions[i - 1];
    if (gap > widestGap) {
      widestGap = gap;
      gapStart = positions[i - 1];
    }
  }
  return (gapStart + widestGap / 2) % 1;
}

/**
 * Dispatches a bee from the docks into the active vine loop.
 */
export function dispatchBeeFromDock(state: GameState, dockIndex: number): GameState {
  if (state.status !== 'playing') return state;
  if (dockIndex < 0 || dockIndex >= state.dockBees.length) return state;
  if (state.loopBees.length >= state.maxLoopCapacity) return state;

  const beeToDispatch = state.dockBees[dockIndex];
  const newDockBees = state.dockBees.filter((_, idx) => idx !== dockIndex);

  // If there are unspawned bees in queue, bring the next one into the open dock
  const newUnspawnedQueue = [...state.unspawnedQueue];
  if (newUnspawnedQueue.length > 0 && newDockBees.length < state.maxDocks) {
    const nextItem = newUnspawnedQueue.shift()!;
    newDockBees.push(makeDockBee(nextItem.color, nextItem.ammo));
  }

  const dispatchedBee: BeeDrone = {
    ...beeToDispatch,
    status: 'loop',
    loopProgress: pickEntryProgress(state.loopBees),
    cooldownUntilNextShot: 0.1,
    idleProgress: 0,
  };

  return {
    ...state,
    dockBees: newDockBees,
    loopBees: [...state.loopBees, dispatchedBee],
    unspawnedQueue: newUnspawnedQueue,
    movesUsed: state.movesUsed + 1,
  };
}

/**
 * Step simulation physics & firing logic forward by deltaTime seconds.
 */
export function stepSimulation(state: GameState, dt: number): GameState {
  if (state.status !== 'playing') return state;

  // 1. Advance projectiles; the ones that arrive bloom their flower
  const flyingProjectiles: ProjectileEvent[] = [];
  const landed: ProjectileEvent[] = [];
  for (const proj of state.activeProjectiles) {
    const nextProgress = proj.progress + dt * PROJECTILE_SPEED;
    if (nextProgress >= 1.0) {
      landed.push(proj);
    } else {
      flyingProjectiles.push({ ...proj, progress: nextProgress });
    }
  }

  let comboTimer = state.comboTimer + dt;
  let combo = comboTimer > COMBO_WINDOW ? 0 : state.combo;
  let bestCombo = state.bestCombo;
  let gainedScore = 0;
  const bloomedIds = new Set<string>();
  const newHits: HitEffectEvent[] = [];

  for (const proj of landed) {
    const tile = state.tiles.find(t => t.id === proj.targetTileId);
    // A booster may already have bloomed this flower while the pollen was in the air
    if (!tile || tile.cleared || bloomedIds.has(tile.id)) continue;
    bloomedIds.add(tile.id);
    combo += 1;
    comboTimer = 0;
    bestCombo = Math.max(bestCombo, combo);
    const hitScore = scoreForHit(combo);
    gainedScore += hitScore;
    newHits.push({
      id: `hit_${tile.id}_${Math.random().toString(36).substring(2, 6)}`,
      x: proj.toX,
      y: proj.toY,
      color: proj.color,
      scoreGained: hitScore,
      age: 0,
    });
  }

  const recentHits = [
    ...state.recentHits.map(hit => ({ ...hit, age: hit.age + dt })).filter(hit => hit.age < HIT_EFFECT_TTL),
    ...newHits,
  ];

  // 2. Mark tiles hit
  const boardChanged = bloomedIds.size > 0;
  const tiles = boardChanged
    ? state.tiles.map(tile => (bloomedIds.has(tile.id) ? { ...tile, cleared: true, clearingAnim: 1 } : tile))
    : state.tiles;

  // 3. Fly bees around the vine and fire at reachable matching flowers
  const claimed = new Set(flyingProjectiles.map(p => p.targetTileId));
  const loopBees: BeeDrone[] = [];
  const clearedBees: BeeDrone[] = [...state.clearedBees];
  const newProjectiles: ProjectileEvent[] = [];
  const boredColors: FlowerColor[] = [];

  for (const bee of state.loopBees) {
    // Out of pollen, or every flower of its colour is bloomed or already targeted: head home
    const hasWork =
      bee.currentAmmo > 0 && tiles.some(t => !t.cleared && t.color === bee.color && !claimed.has(t.id));
    if (!hasWork) {
      clearedBees.push({ ...bee, status: 'cleared' });
      continue;
    }
    // Circled too long without a reachable flower: it gives up, taking its pollen along
    if (bee.idleProgress >= PATIENCE_LAPS) {
      clearedBees.push({ ...bee, status: 'flying_away' });
      boredColors.push(bee.color);
      continue;
    }

    const loopProgress = (bee.loopProgress + bee.speed * dt) % 1.0;
    let idleProgress = bee.idleProgress + bee.speed * dt;
    let cooldown = Math.max(0, bee.cooldownUntilNextShot - dt);
    let currentAmmo = bee.currentAmmo;

    if (cooldown <= 0) {
      const targetTile = findTargetTileForBee({ ...bee, loopProgress }, tiles, state.gridRows, state.gridCols);

      if (targetTile && !claimed.has(targetTile.id)) {
        claimed.add(targetTile.id);
        currentAmmo -= 1;
        cooldown = SHOT_COOLDOWN;
        idleProgress = 0;

        const beeCoords = getBeeLoopCoords(loopProgress);
        newProjectiles.push({
          id: `proj_${bee.id}_${currentAmmo}`,
          beeId: bee.id,
          fromX: beeCoords.x,
          fromY: beeCoords.y,
          // Normalize target tile center coords (0..1)
          toX: (targetTile.col + 0.5) / state.gridCols,
          toY: (targetTile.row + 0.5) / state.gridRows,
          color: bee.color,
          targetTileId: targetTile.id,
          progress: 0,
        });
      }
    }

    loopBees.push({
      ...bee,
      loopProgress,
      idleProgress,
      currentAmmo,
      cooldownUntilNextShot: cooldown,
    });
  }

  const activeProjectiles = [...flyingProjectiles, ...newProjectiles];
  let nextState: GameState = {
    ...state,
    tiles,
    loopBees,
    clearedBees,
    activeProjectiles,
    recentHits,
    score: state.score + gainedScore,
    combo,
    bestCombo,
    comboTimer,
    tick: state.tick + 1,
    lastStepHits: bloomedIds.size,
    lastStepShots: newProjectiles.length,
    lastStepBored: boredColors,
  };
  if (boardChanged) nextState = retireFinishedBench(nextState);

  // 4. Win / loss. Shots still in the air count as pollen, so the last flower can bloom
  // after the last bee has gone home.
  if (tiles.every(t => t.cleared)) {
    nextState.status = 'won';
  } else {
    const shortfall = pollenShortfall(nextState);
    if (shortfall) {
      nextState.status = 'lost';
      nextState.lossReason = 'out_of_pollen';
      nextState.shortColor = shortfall.color;
    }
  }

  return nextState;
}

/** Puts a lost game back into play, e.g. after a rescue booster. */
export function resumeAfterLoss(state: GameState): GameState {
  if (state.status !== 'lost') return state;
  return { ...state, status: 'playing', lossReason: undefined, shortColor: undefined };
}

/** True when a Pollen Burst would bloom enough flowers to make the level winnable again. */
export function canRescueWithBurst(state: GameState): boolean {
  if (state.status !== 'lost') return false;
  const rescued = boosterPollenBurst(resumeAfterLoss(state));
  return rescued.status === 'won' || (rescued.status === 'playing' && pollenShortfall(rescued) === null);
}

/**
 * Booster: Shuffle the unspawned queue and available docks
 */
export function boosterShuffle(state: GameState): GameState {
  if (state.status !== 'playing') return state;

  // Gather colors and ammo of dock bees and unspawned queue
  const combined = [
    ...state.dockBees.map(b => ({ color: b.color, ammo: b.totalAmmo })),
    ...state.unspawnedQueue
  ];

  // Fisher-Yates shuffle
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  return {
    ...state,
    dockBees: combined.slice(0, state.dockBees.length).map(item => makeDockBee(item.color, item.ammo)),
    unspawnedQueue: combined.slice(state.dockBees.length),
    boostersUsed: state.boostersUsed + 1,
  };
}

/**
 * Booster: Pollen Burst - Blooms up to 4 outer flowers instantly, favouring
 * colours the remaining bees are shortest on.
 */
export function boosterPollenBurst(state: GameState): GameState {
  if (state.status !== 'playing') return state;

  const claimed = new Set(state.activeProjectiles.map(p => p.targetTileId));
  const shortfall: Partial<Record<FlowerColor, number>> = {};
  for (const tile of state.tiles) {
    if (!tile.cleared) shortfall[tile.color] = (shortfall[tile.color] ?? 0) + 1;
  }
  for (const bee of [...state.loopBees, ...state.dockBees]) {
    shortfall[bee.color] = (shortfall[bee.color] ?? 0) - bee.currentAmmo;
  }
  for (const item of state.unspawnedQueue) {
    shortfall[item.color] = (shortfall[item.color] ?? 0) - item.ammo;
  }

  const targets = getExposedTiles(state.tiles, state.gridRows, state.gridCols)
    .filter(t => !claimed.has(t.id))
    .sort((a, b) => (shortfall[b.color] ?? 0) - (shortfall[a.color] ?? 0))
    .slice(0, BURST_SIZE);
  if (targets.length === 0) return state;

  const targetIds = new Set(targets.map(t => t.id));
  let combo = state.combo;
  let gainedScore = 0;
  const burstHits: HitEffectEvent[] = targets.map(tile => {
    combo += 1;
    const hitScore = scoreForHit(combo);
    gainedScore += hitScore;
    return {
      id: `burst_${tile.id}`,
      x: (tile.col + 0.5) / state.gridCols,
      y: (tile.row + 0.5) / state.gridRows,
      color: tile.color,
      scoreGained: hitScore,
      age: 0,
    };
  });

  const tiles = state.tiles.map(t => (targetIds.has(t.id) ? { ...t, cleared: true, clearingAnim: 1 } : t));
  const nextState = retireFinishedBench({
    ...state,
    tiles,
    recentHits: [...state.recentHits, ...burstHits],
    score: state.score + gainedScore,
    combo,
    bestCombo: Math.max(state.bestCombo, combo),
    comboTimer: 0,
    boostersUsed: state.boostersUsed + 1,
  });

  return {
    ...nextState,
    status: tiles.every(t => t.cleared) ? 'won' : nextState.status,
  };
}

/**
 * Booster: Extra Dock - Expands dock capacity from 5 to 6 and brings the next queued bee in.
 */
export function boosterExtraDock(state: GameState): GameState {
  if (state.status !== 'playing' || state.maxDocks >= 6 || state.unspawnedQueue.length === 0) return state;

  const [nextItem, ...rest] = state.unspawnedQueue;
  return {
    ...state,
    maxDocks: 6,
    dockBees: [...state.dockBees, makeDockBee(nextItem.color, nextItem.ammo)],
    unspawnedQueue: rest,
    boostersUsed: state.boostersUsed + 1,
  };
}
