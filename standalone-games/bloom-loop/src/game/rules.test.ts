import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialGameState,
  getBeeLoopCoords,
  findTargetTileForBee,
  dispatchBeeFromDock,
  stepSimulation,
  boosterPollenBurst,
  boosterShuffle,
  boosterExtraDock,
  getExposedTiles,
  calculateStars,
  canRescueWithBurst,
  type GameState,
} from './rules.ts';
import { LEVELS } from './levels.ts';
import type { LevelData } from './types.ts';

const STEP = 1 / 30;

function run(state: GameState, seconds: number): GameState {
  for (let t = 0; t < seconds && state.status === 'playing'; t += STEP) {
    state = stepSimulation(state, STEP);
  }
  return state;
}

/**
 * A simple player: launch the dock bee whose colour has the most reachable flowers
 * that no flying bee of that colour is already covering. Never uses boosters.
 */
function playLevel(level: LevelData): GameState {
  let state = createInitialGameState(level);
  let cooldown = 0;
  for (let t = 0; t < 900 && state.status === 'playing'; t += STEP) {
    cooldown -= STEP;
    if (cooldown <= 0 && state.loopBees.length < state.maxLoopCapacity && state.dockBees.length > 0) {
      const claimed = new Set(state.activeProjectiles.map(p => p.targetTileId));
      const exposed = getExposedTiles(state.tiles, state.gridRows, state.gridCols).filter(t => !claimed.has(t.id));
      let bestIndex = -1;
      let bestValue = 0;
      state.dockBees.forEach((bee, index) => {
        const reachable = exposed.filter(t => t.color === bee.color).length;
        const flying = state.loopBees.filter(b => b.color === bee.color).length;
        const value = reachable - 2 * flying;
        if (value > bestValue) {
          bestValue = value;
          bestIndex = index;
        }
      });
      if (bestIndex === -1 && state.loopBees.length === 0) bestIndex = 0;
      if (bestIndex >= 0) {
        state = dispatchBeeFromDock(state, bestIndex);
        cooldown = 0.4;
      }
    }
    state = stepSimulation(state, STEP);
  }
  return state;
}

describe('Bloom Loop Core Game Rules', () => {
  it('creates initial game state correctly from level', () => {
    const level1 = LEVELS[0];
    const state = createInitialGameState(level1);

    assert.equal(state.levelId, 1);
    assert.equal(state.status, 'playing');
    assert.equal(state.tiles.length, 16);
    assert.equal(state.dockBees.length, 4); // level 1 has 4 bees
    assert.equal(state.loopBees.length, 0);
    assert.equal(state.score, 0);
    assert.equal(state.maxDocks, 5);
    assert.equal(state.maxLoopCapacity, 4);
  });

  it('calculates loop perimeter coordinates across all 4 edges', () => {
    const top = getBeeLoopCoords(0.125);
    assert.equal(top.edge, 'top');
    assert.equal(top.y, 0);
    assert.equal(top.x, 0.5);

    const right = getBeeLoopCoords(0.375);
    assert.equal(right.edge, 'right');
    assert.equal(right.x, 1);
    assert.equal(right.y, 0.5);

    const bottom = getBeeLoopCoords(0.625);
    assert.equal(bottom.edge, 'bottom');
    assert.equal(bottom.y, 1);
    assert.equal(bottom.x, 0.5);

    const left = getBeeLoopCoords(0.875);
    assert.equal(left.edge, 'left');
    assert.equal(left.x, 0);
    assert.equal(left.y, 0.5);
  });

  it('correctly targets matching flower tiles via raycasting', () => {
    const level1 = LEVELS[0];
    // Level 1 top-left is lilac, top-right is sky
    const state = createInitialGameState(level1);

    // Bee at top-left (loopProgress ~ 0.05, top edge col 0)
    const lilacBee = {
      ...state.dockBees[0],
      color: 'lilac' as const,
      status: 'loop' as const,
      loopProgress: 0.05,
    };

    const target = findTargetTileForBee(lilacBee, state.tiles, state.gridRows, state.gridCols);
    assert.ok(target, 'Should find matching lilac tile');
    assert.equal(target?.color, 'lilac');
    assert.equal(target?.row, 0);
    assert.equal(target?.col, 0);
  });

  it('dispatches bee from dock to loop smoothly', () => {
    const level1 = LEVELS[0];
    const state = createInitialGameState(level1);

    assert.equal(state.dockBees.length, 4);
    assert.equal(state.loopBees.length, 0);

    const nextState = dispatchBeeFromDock(state, 0);
    assert.equal(nextState.dockBees.length, 3);
    assert.equal(nextState.loopBees.length, 1);
    assert.equal(nextState.loopBees[0].status, 'loop');
    assert.equal(nextState.movesUsed, 1);
  });

  it('spreads newly launched bees out instead of stacking them', () => {
    let state = createInitialGameState(LEVELS[0]);
    for (let i = 0; i < 4; i++) state = dispatchBeeFromDock(state, 0);
    const positions = state.loopBees.map(b => b.loopProgress).sort((a, b) => a - b);
    for (let i = 1; i < positions.length; i++) {
      assert.ok(positions[i] - positions[i - 1] >= 0.2, `bees too close: ${positions.join(', ')}`);
    }
  });

  it('advances simulation, fires projectiles, and clears tiles', () => {
    let state = dispatchBeeFromDock(createInitialGameState(LEVELS[0]), 0);
    state = run(state, 1.5);
    assert.ok(state.tiles.some(t => t.cleared), 'lilac bee should bloom lilac flowers');
    assert.ok(state.score > 0);
  });

  it('wins when the final pollen shot is still in the air as the last bee leaves', () => {
    // Level 1 has exactly enough pollen, so the last bee always leaves before its last shot lands
    let state = createInitialGameState(LEVELS[0]);
    for (let i = 0; i < 4; i++) state = dispatchBeeFromDock(state, 0);
    state = run(state, 30);
    assert.equal(state.status, 'won');
  });

  it('expires hit effects instead of keeping them on screen forever', () => {
    let state = dispatchBeeFromDock(createInitialGameState(LEVELS[0]), 0);
    state = run(state, 1.2);
    assert.ok(state.recentHits.length > 0);
    // Park the bee so nothing new blooms, then let the effects fade
    state = { ...state, loopBees: [], dockBees: [], unspawnedQueue: [], activeProjectiles: [] };
    for (let i = 0; i < 40; i++) state = stepSimulation({ ...state, status: 'playing' }, STEP);
    assert.equal(state.recentHits.length, 0);
  });

  it('resets the combo after a pause between blooms', () => {
    let state = dispatchBeeFromDock(createInitialGameState(LEVELS[0]), 0);
    state = run(state, 1.2);
    assert.ok(state.combo >= 2, 'consecutive blooms should build a combo');
    state = { ...state, loopBees: [], activeProjectiles: [] };
    state = stepSimulation(state, 2.0);
    assert.equal(state.combo, 0);
  });

  it('sends a bee home once its colour is fully bloomed, even with pollen left', () => {
    // Level 4 has 9 mint pollen for 7 mint flowers
    const level = LEVELS[3];
    let state = createInitialGameState(level);
    state = { ...state, tiles: state.tiles.map(t => ({ ...t, cleared: t.color === 'mint' })) };
    const mintIndex = state.dockBees.findIndex(b => b.color === 'mint');
    state = dispatchBeeFromDock(state, mintIndex);
    state = stepSimulation(state, STEP);
    assert.equal(state.loopBees.length, 0);
  });

  it('loses when a bored bee flies home with pollen the garden still needed', () => {
    // Lilac sits in the centre of level 3, behind orange and gold, and only one lilac shot exists
    let state = createInitialGameState(LEVELS[2]);
    state = dispatchBeeFromDock(state, state.dockBees.findIndex(b => b.color === 'lilac'));
    state = run(state, 5);
    assert.equal(state.status, 'playing', 'still patient after under a lap');
    state = run(state, 20);
    assert.equal(state.status, 'lost');
    assert.equal(state.lossReason, 'out_of_pollen');
    assert.equal(state.shortColor, 'lilac');
  });

  it('can be rescued with a Pollen Burst when the burst covers the shortfall', () => {
    let state = createInitialGameState(LEVELS[0]);
    // One gold shot short: three of the four gold flowers are on the outside, so a burst covers it
    state = { ...state, dockBees: state.dockBees.map(b => (b.color === 'gold' ? { ...b, currentAmmo: 3 } : b)) };
    state = stepSimulation(state, STEP);
    assert.equal(state.status, 'lost');
    assert.equal(canRescueWithBurst(state), true);
  });

  it('handles boosters properly', () => {
    const level = LEVELS[1];
    let state = createInitialGameState(level);

    // Pollen Burst blooms up to four outer flowers
    state = boosterPollenBurst(state);
    assert.equal(state.tiles.filter(t => t.cleared).length, 4);
    assert.ok(state.score > 0);
    assert.equal(state.recentHits.length, 4);

    // Shuffle keeps the same bees
    const before = state.dockBees.map(b => `${b.color}${b.totalAmmo}`).sort();
    state = boosterShuffle(state);
    assert.deepEqual(state.dockBees.map(b => `${b.color}${b.totalAmmo}`).sort(), before);
    assert.equal(state.boostersUsed, 2);

    // Extra Dock needs a queued bee to bring in
    const queued = createInitialGameState(LEVELS[7]);
    const expanded = boosterExtraDock(queued);
    assert.equal(expanded.maxDocks, 6);
    assert.equal(expanded.dockBees.length, 6);
    assert.equal(boosterExtraDock(state), state, 'nothing queued, so no extra dock');
  });
});

describe('Bloom Loop levels', () => {
  for (const level of LEVELS) {
    it(`level ${level.id} "${level.name}" is well formed and has enough pollen`, () => {
      assert.ok(level.layout.every(row => row.length === level.gridCols), 'ragged layout');
      const need: Record<string, number> = {};
      for (const cell of level.layout.flat()) if (cell) need[cell] = (need[cell] ?? 0) + 1;
      const have: Record<string, number> = {};
      for (const bee of level.beeQueue) have[bee.color] = (have[bee.color] ?? 0) + bee.ammo;
      for (const color of Object.keys(need)) {
        assert.ok((have[color] ?? 0) >= need[color], `${color}: ${have[color] ?? 0} pollen for ${need[color]} flowers`);
      }
    });

    it(`level ${level.id} "${level.name}" can be won without boosters`, () => {
      const result = playLevel(level);
      assert.equal(result.status, 'won', `ended ${result.status} (${result.lossReason ?? ''})`);
      assert.ok(calculateStars(result) >= 1);
    });
  }
});
