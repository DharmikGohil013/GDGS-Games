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
  boosterExtraDock
} from './rules.ts';
import { LEVELS } from './levels.ts';

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

  it('advances simulation, fires projectiles, and clears tiles', () => {
    const level1 = LEVELS[0];
    let state = createInitialGameState(level1);
    // Dispatch lilac bee
    state = dispatchBeeFromDock(state, 0);

    // Step simulation forward
    for (let i = 0; i < 20; i++) {
      state = stepSimulation(state, 0.05);
    }

    // Check that at least some score gained or projectiles spawned or tiles hit
    assert.ok(state.activeProjectiles.length > 0 || state.score > 0 || state.recentHits.length > 0);
  });

  it('handles boosters properly', () => {
    const level = LEVELS[1];
    let state = createInitialGameState(level);

    // Test Pollen Burst
    const beforeClearedCount = state.tiles.filter(t => t.cleared).length;
    state = boosterPollenBurst(state);
    const afterClearedCount = state.tiles.filter(t => t.cleared).length;
    assert.ok(afterClearedCount > beforeClearedCount, 'Pollen burst should clear tiles');
    assert.ok(state.score >= 250);

    // Test Extra Dock
    state = boosterExtraDock(state);
    assert.equal(state.maxDocks, 6);

    // Test Shuffle
    state = boosterShuffle(state);
    assert.ok(state.dockBees.length > 0);
  });
});
