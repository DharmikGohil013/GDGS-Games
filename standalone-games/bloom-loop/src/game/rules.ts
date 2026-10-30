import { FlowerColor, FlowerTile, BeeDrone, LevelData, GameStatus } from './types.ts';

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
}

export interface GameState {
  levelId: number;
  gridRows: number;
  gridCols: number;
  tiles: FlowerTile[];
  dockBees: BeeDrone[]; // Bees waiting in docks (max 5 or 6)
  loopBees: BeeDrone[]; // Bees currently flying clockwise on the vine loop (max 4)
  clearedBees: BeeDrone[];
  unspawnedQueue: { color: FlowerColor; ammo: number }[];
  maxDocks: number; // default 5, can be upgraded to 6 with booster
  maxLoopCapacity: number; // 4
  status: GameStatus;
  score: number;
  combo: number;
  movesUsed: number;
  activeProjectiles: ProjectileEvent[];
  recentHits: HitEffectEvent[];
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
  const maxDocks = 5;
  const initialDockCount = Math.min(maxDocks, level.beeQueue.length);
  const dockItems = level.beeQueue.slice(0, initialDockCount);
  const remainingQueue = level.beeQueue.slice(initialDockCount);

  const dockBees: BeeDrone[] = dockItems.map((item, idx) => ({
    id: `bee_initial_${idx}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    color: item.color,
    totalAmmo: item.ammo,
    currentAmmo: item.ammo,
    loopProgress: 0,
    status: 'dock',
    speed: 0.16, // Completes a full loop around the board in ~6.25 seconds
    cooldownUntilNextShot: 0,
  }));

  return {
    levelId: level.id,
    gridRows: level.gridRows,
    gridCols: level.gridCols,
    tiles,
    dockBees,
    loopBees: [],
    clearedBees: [],
    unspawnedQueue: [...remainingQueue],
    maxDocks,
    maxLoopCapacity: 4,
    status: 'playing',
    score: 0,
    combo: 0,
    movesUsed: 0,
    activeProjectiles: [],
    recentHits: [],
  };
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

/**
 * Dispatches a bee from the docks into the active vine loop.
 * Staggers entry position evenly if other bees are already circling.
 */
export function dispatchBeeFromDock(state: GameState, dockIndex: number): GameState {
  if (state.status !== 'playing') return state;
  if (dockIndex < 0 || dockIndex >= state.dockBees.length) return state;
  if (state.loopBees.length >= state.maxLoopCapacity) return state;

  const beeToDispatch = state.dockBees[dockIndex];
  const newDockBees = state.dockBees.filter((_, idx) => idx !== dockIndex);

  // If there are unspawned bees in queue, bring the next one into the open dock
  let newUnspawnedQueue = [...state.unspawnedQueue];
  if (newUnspawnedQueue.length > 0 && newDockBees.length < state.maxDocks) {
    const nextItem = newUnspawnedQueue.shift()!;
    newDockBees.push({
      id: `bee_queue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      color: nextItem.color,
      totalAmmo: nextItem.ammo,
      currentAmmo: nextItem.ammo,
      loopProgress: 0,
      status: 'dock',
      speed: 0.16,
      cooldownUntilNextShot: 0,
    });
  }

  // Calculate entry progress so it doesn't overlap on top of an existing bee
  let entryProgress = 0;
  if (state.loopBees.length > 0) {
    // Space it at least 0.25 or furthest from other bees
    const otherPositions = state.loopBees.map(b => b.loopProgress);
    // Find a nice empty quadrant
    entryProgress = (Math.max(...otherPositions) + 0.25) % 1.0;
  }

  const dispatchedBee: BeeDrone = {
    ...beeToDispatch,
    status: 'loop',
    loopProgress: entryProgress,
    cooldownUntilNextShot: 0.1,
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

  // 1. Advance projectiles
  const updatedProjectiles: ProjectileEvent[] = [];
  const newlyHitTiles: string[] = [];
  const newRecentHits: HitEffectEvent[] = [...state.recentHits];
  let gainedScore = 0;
  let newCombo = state.combo;

  for (const proj of state.activeProjectiles) {
    const nextProgress = proj.progress + dt * 4.0; // Projectile flies to target in ~0.25s
    if (nextProgress >= 1.0) {
      newlyHitTiles.push(proj.targetTileId);
      newCombo += 1;
      const hitScore = 50 * newCombo;
      gainedScore += hitScore;
      newRecentHits.push({
        id: `hit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        x: proj.toX,
        y: proj.toY,
        color: proj.color,
        scoreGained: hitScore,
      });
    } else {
      updatedProjectiles.push({
        ...proj,
        progress: nextProgress,
      });
    }
  }

  // Clean old hit effects after 0.8s
  const validRecentHits = newRecentHits.slice(-8);

  // 2. Mark tiles hit
  let updatedTiles = state.tiles.map(tile => {
    if (newlyHitTiles.includes(tile.id)) {
      return { ...tile, cleared: true, clearingAnim: 1 };
    }
    return tile;
  });

  // 3. Update loop bees
  const remainingLoopBees: BeeDrone[] = [];
  const newClearedBees: BeeDrone[] = [...state.clearedBees];
  const newProjectilesToSpawn: ProjectileEvent[] = [];

  for (const bee of state.loopBees) {
    if (bee.currentAmmo <= 0) {
      // Completed its flight, leaves loop
      newClearedBees.push({ ...bee, status: 'cleared' });
      continue;
    }

    // Advance loop progress
    const nextProgress = (bee.loopProgress + bee.speed * dt) % 1.0;
    const nextCooldown = Math.max(0, bee.cooldownUntilNextShot - dt);

    let currentAmmo = bee.currentAmmo;
    let cooldown = nextCooldown;

    // Check if can fire
    if (nextCooldown <= 0 && currentAmmo > 0) {
      // Find candidate tile
      const targetTile = findTargetTileForBee(
        { ...bee, loopProgress: nextProgress },
        updatedTiles,
        state.gridRows,
        state.gridCols
      );

      // Check if targetTile is not already targeted by an active projectile
      const alreadyTargeted = updatedProjectiles.some(p => p.targetTileId === targetTile?.id) ||
                              newProjectilesToSpawn.some(p => p.targetTileId === targetTile?.id);

      if (targetTile && !alreadyTargeted) {
        currentAmmo -= 1;
        cooldown = 0.28; // Cooldown between rapid shots

        const beeCoords = getBeeLoopCoords(nextProgress);
        // Normalize target tile center coords (0..1)
        const targetX = (targetTile.col + 0.5) / state.gridCols;
        const targetY = (targetTile.row + 0.5) / state.gridRows;

        newProjectilesToSpawn.push({
          id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          beeId: bee.id,
          fromX: beeCoords.x,
          fromY: beeCoords.y,
          toX: targetX,
          toY: targetY,
          color: bee.color,
          targetTileId: targetTile.id,
          progress: 0,
        });
      }
    }

    remainingLoopBees.push({
      ...bee,
      loopProgress: nextProgress,
      currentAmmo,
      cooldownUntilNextShot: cooldown,
    });
  }

  // 4. Check Win / Loss condition
  const allTilesCleared = updatedTiles.every(t => t.cleared);
  let nextStatus: GameStatus = state.status;

  if (allTilesCleared) {
    nextStatus = 'won';
  } else {
    // Loss condition: No more bees available anywhere, or docks full + loop empty + cannot clear
    const totalRemainingBees = remainingLoopBees.length + state.dockBees.length + state.unspawnedQueue.length;
    if (totalRemainingBees === 0 && !allTilesCleared) {
      nextStatus = 'lost';
    }
  }

  return {
    ...state,
    tiles: updatedTiles,
    loopBees: remainingLoopBees,
    clearedBees: newClearedBees,
    activeProjectiles: [...updatedProjectiles, ...newProjectilesToSpawn],
    recentHits: validRecentHits,
    score: state.score + gainedScore,
    combo: newCombo,
    status: nextStatus,
  };
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

  const newDockItems = combined.slice(0, state.dockBees.length);
  const newQueue = combined.slice(state.dockBees.length);

  const newDockBees: BeeDrone[] = newDockItems.map((item, idx) => ({
    id: `bee_shuffled_${idx}_${Date.now()}`,
    color: item.color,
    totalAmmo: item.ammo,
    currentAmmo: item.ammo,
    loopProgress: 0,
    status: 'dock',
    speed: 0.16,
    cooldownUntilNextShot: 0,
  }));

  return {
    ...state,
    dockBees: newDockBees,
    unspawnedQueue: newQueue,
  };
}

/**
 * Booster: Pollen Burst - Clears up to 4 uncleared tiles of any matching outer flowers immediately!
 */
export function boosterPollenBurst(state: GameState): GameState {
  if (state.status !== 'playing') return state;

  const uncleared = state.tiles.filter(t => !t.cleared);
  if (uncleared.length === 0) return state;

  // Take up to 4 random uncleared tiles
  const toClear = uncleared.slice(0, Math.min(4, uncleared.length));
  const clearedIds = toClear.map(t => t.id);

  const updatedTiles = state.tiles.map(t => {
    if (clearedIds.includes(t.id)) {
      return { ...t, cleared: true, clearingAnim: 1 };
    }
    return t;
  });

  const allCleared = updatedTiles.every(t => t.cleared);

  return {
    ...state,
    tiles: updatedTiles,
    score: state.score + 250,
    status: allCleared ? 'won' : state.status,
  };
}

/**
 * Booster: Extra Dock - Expands dock capacity from 5 to 6 and adds an extra helper bee!
 */
export function boosterExtraDock(state: GameState): GameState {
  if (state.status !== 'playing' || state.maxDocks >= 6) return state;

  const newMaxDocks = 6;
  const newDockBees = [...state.dockBees];
  let newQueue = [...state.unspawnedQueue];

  // If there's an unspawned bee, immediately promote it to the new 6th dock slot!
  if (newQueue.length > 0) {
    const nextItem = newQueue.shift()!;
    newDockBees.push({
      id: `bee_extra_dock_${Date.now()}`,
      color: nextItem.color,
      totalAmmo: nextItem.ammo,
      currentAmmo: nextItem.ammo,
      loopProgress: 0,
      status: 'dock',
      speed: 0.16,
      cooldownUntilNextShot: 0,
    });
  }

  return {
    ...state,
    maxDocks: newMaxDocks,
    dockBees: newDockBees,
    unspawnedQueue: newQueue,
  };
}
