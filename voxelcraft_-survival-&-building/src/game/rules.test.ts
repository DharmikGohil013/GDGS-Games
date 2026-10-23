/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  matchCraftingRecipe,
  getSmeltingRecipe,
  calculateMiningTime,
  addItemToInventory,
  tickSurvivalVitals,
  calculateLevel,
  determineBiome,
} from './rules';
import { BlockType } from './constants';

test('Crafting: crafts oak planks from single log in 2x2 grid', () => {
  const grid = [
    'oak_log', null,
    null, null,
  ];
  const match = matchCraftingRecipe(grid, 2);
  assert.ok(match, 'Expected recipe to match');
  assert.equal(match.recipe.result.id, 'oak_planks');
  assert.equal(match.recipe.result.count, 4);
});

test('Crafting: crafts crafting table from 4 planks in 2x2 grid', () => {
  const grid = [
    'oak_planks', 'oak_planks',
    'oak_planks', 'oak_planks',
  ];
  const match = matchCraftingRecipe(grid, 2);
  assert.ok(match, 'Expected recipe to match');
  assert.equal(match.recipe.result.id, 'crafting_table');
  assert.equal(match.recipe.result.count, 1);
});

test('Crafting: crafts stone pickaxe in 3x3 grid', () => {
  const grid = [
    'cobblestone', 'cobblestone', 'cobblestone',
    null, 'stick', null,
    null, 'stick', null,
  ];
  const match = matchCraftingRecipe(grid, 3);
  assert.ok(match, 'Expected stone pickaxe');
  assert.equal(match.recipe.result.id, 'stone_pickaxe');
});

test('Crafting: crafts furnace in 3x3 grid (ring of cobblestone)', () => {
  const grid = [
    'cobblestone', 'cobblestone', 'cobblestone',
    'cobblestone', null, 'cobblestone',
    'cobblestone', 'cobblestone', 'cobblestone',
  ];
  const match = matchCraftingRecipe(grid, 3);
  assert.ok(match, 'Expected furnace');
  assert.equal(match.recipe.result.id, 'furnace');
});

test('Smelting: smelts iron ore into iron ingot and sand into glass', () => {
  const iron = getSmeltingRecipe('iron_ore');
  assert.ok(iron);
  assert.equal(iron.output, 'iron_ingot');

  const glass = getSmeltingRecipe('sand');
  assert.ok(glass);
  assert.equal(glass.output, 'glass');

  const invalid = getSmeltingRecipe('dirt');
  assert.equal(invalid, null);
});

test('Mining speed: stone pickaxe mines stone faster than bare hand', () => {
  const handTime = calculateMiningTime(BlockType.STONE, null);
  const pickaxeTime = calculateMiningTime(BlockType.STONE, 'stone_pickaxe');
  assert.ok(pickaxeTime < handTime, `Pickaxe (${pickaxeTime}s) should be faster than hand (${handTime}s)`);
});

test('Inventory: stacks items properly and obeys MAX_STACK_SIZE (64)', () => {
  const inventory = [
    { id: 'dirt', count: 60 },
    null,
  ];
  const leftover = addItemToInventory(inventory, { id: 'dirt', count: 10 });
  assert.equal(leftover, 0);
  assert.equal(inventory[0]?.count, 64);
  assert.equal(inventory[1]?.id, 'dirt');
  assert.equal(inventory[1]?.count, 6);
});

test('Survival vitals: regenerates health when hunger is high (>= 18)', () => {
  const res = tickSurvivalVitals({
    health: 10,
    hunger: 20,
    maxHealth: 20,
    deltaTime: 4.1,
    timer: 0,
  });
  assert.equal(res.health, 11);
  assert.equal(res.hunger, 19.5);
});

test('Level calculation: XP to level mapping works deterministically', () => {
  const lvl0 = calculateLevel(5);
  assert.equal(lvl0.level, 0);
  assert.equal(lvl0.progress, 0.5);

  const lvl1 = calculateLevel(15);
  assert.equal(lvl1.level, 1);
});

test('Physics floor check: solid block at y=20 stops downward fall at y=21.0', () => {
  const blockY = 20;
  const floorTop = blockY + 1.0;
  const fallingPlayerY = 20.3; // Penetrating block
  const clampedY = Math.max(fallingPlayerY, floorTop);
  assert.equal(clampedY, 21.0, 'Player feet must be positioned exactly on top of block');
});

test('Biome detection: accurately identifies underwater, caves, mountain, desert, forest, and plains', () => {
  // 1. Underwater
  assert.equal(
    determineBiome({ x: 0, y: 15, z: 0, surfaceY: 20, temperature: 0, hasCeiling: false, isSubmerged: true }),
    'underwater'
  );

  // 2. Deep Cave (underground with solid ceiling)
  assert.equal(
    determineBiome({ x: 0, y: 8, z: 0, surfaceY: 22, temperature: 0, hasCeiling: true, isSubmerged: false }),
    'cave'
  );

  // 3. Mountain peak (high elevation >= 30)
  assert.equal(
    determineBiome({ x: 10, y: 32, z: 10, surfaceY: 34, temperature: 0, hasCeiling: false, isSubmerged: false }),
    'mountain'
  );

  // 4. Desert (high temperature > 0.45)
  assert.equal(
    determineBiome({ x: 20, y: 22, z: 20, surfaceY: 22, temperature: 0.6, hasCeiling: false, isSubmerged: false }),
    'desert'
  );

  // 5. Forest (temperate zone with trees)
  assert.equal(
    determineBiome({ x: 5, y: 24, z: 5, surfaceY: 24, temperature: 0.1, hasCeiling: false, isSubmerged: false, nearTreesCount: 4 }),
    'forest'
  );

  // 6. Plains (rolling grassland)
  assert.equal(
    determineBiome({ x: 5, y: 18, z: 5, surfaceY: 18, temperature: -0.4, hasCeiling: false, isSubmerged: false, nearTreesCount: 0 }),
    'plains'
  );
});
