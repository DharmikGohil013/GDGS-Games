/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BLOCK_DEFS,
  BlockType,
  CRAFTING_RECIPES,
  CraftingRecipe,
  ITEM_DEFS,
  ItemStack,
  SMELTING_RECIPES,
  SmeltingRecipe,
} from './constants';

export const MAX_STACK_SIZE = 64;

/**
 * Checks if a crafting grid matches a recipe.
 * The grid is a 1D array representing an NxN grid (e.g. 2x2 with length 4, or 3x3 with length 9).
 */
export function matchCraftingRecipe(
  grid: (string | null)[],
  gridSize: number
): { recipe: CraftingRecipe; count: number } | null {
  // First, find the bounding box of non-null items in the grid
  let minR = gridSize, maxR = -1;
  let minC = gridSize, maxC = -1;

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const item = grid[r * gridSize + c];
      if (item !== null && item !== undefined && item !== '') {
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }
  }

  // If grid is completely empty
  if (maxR === -1) {
    return null;
  }

  const subWidth = maxC - minC + 1;
  const subHeight = maxR - minR + 1;

  // Extract the cropped sub-grid
  const cropped: (string | null)[] = [];
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      const it = grid[r * gridSize + c];
      cropped.push(it ? it : null);
    }
  }

  // Check against all known recipes
  for (const recipe of CRAFTING_RECIPES) {
    if (recipe.width === subWidth && recipe.height === subHeight) {
      let matched = true;
      for (let i = 0; i < cropped.length; i++) {
        const expected = recipe.pattern[i];
        const actual = cropped[i];
        if (expected !== actual) {
          matched = false;
          break;
        }
      }
      if (matched) {
        return { recipe, count: recipe.result.count };
      }
    }
  }

  return null;
}

/**
 * Finds a smelting recipe for a given input item.
 */
export function getSmeltingRecipe(inputId: string): SmeltingRecipe | null {
  return SMELTING_RECIPES.find((r) => r.input === inputId) || null;
}

/**
 * Calculates mining duration in seconds based on block hardness, equipped tool, and target block.
 */
export function calculateMiningTime(
  blockType: BlockType,
  heldItemId: string | null
): number {
  const blockDef = BLOCK_DEFS[blockType];
  if (!blockDef || blockDef.hardness === 0) return 0.05;
  if (blockDef.hardness >= 9000) return 9999; // unbreakable like bedrock

  let multiplier = 1.0;
  if (heldItemId && ITEM_DEFS[heldItemId]) {
    const item = ITEM_DEFS[heldItemId];
    if (item.toolType && item.toolType === blockDef.preferredTool) {
      multiplier = item.miningMultiplier || 1.0;
    }
  }

  // Time in seconds (Minecraft formula approx: hardness * 1.5 / multiplier)
  const baseTime = blockDef.hardness * 1.5;
  const time = baseTime / multiplier;
  return Math.max(0.1, time);
}

/**
 * Adds an item to an inventory array (mutating or returning modified copy), handling stacking.
 * Returns leftover count (0 if fully added).
 */
export function addItemToInventory(
  inventory: (ItemStack | null)[],
  item: ItemStack
): number {
  let remaining = item.count;

  // First pass: try to add to existing matching stacks
  for (let i = 0; i < inventory.length; i++) {
    const slot = inventory[i];
    if (slot && slot.id === item.id && slot.count < MAX_STACK_SIZE) {
      const space = MAX_STACK_SIZE - slot.count;
      const toAdd = Math.min(space, remaining);
      slot.count += toAdd;
      remaining -= toAdd;
      if (remaining <= 0) return 0;
    }
  }

  // Second pass: fill empty slots
  for (let i = 0; i < inventory.length; i++) {
    if (!inventory[i]) {
      const toAdd = Math.min(MAX_STACK_SIZE, remaining);
      inventory[i] = { id: item.id, count: toAdd };
      remaining -= toAdd;
      if (remaining <= 0) return 0;
    }
  }

  return remaining;
}

/**
 * Computes survival health regeneration or starvation damage.
 */
export function tickSurvivalVitals(params: {
  health: number;
  hunger: number;
  maxHealth: number;
  deltaTime: number;
  timer: number;
}): { health: number; hunger: number; nextTimer: number } {
  let { health, hunger, maxHealth, deltaTime, timer } = params;
  timer += deltaTime;

  // Tick every 4 seconds
  if (timer >= 4.0) {
    timer -= 4.0;
    // Regeneration when full or near full
    if (hunger >= 18 && health < maxHealth) {
      health = Math.min(maxHealth, health + 1);
      hunger = Math.max(0, hunger - 0.5);
    } else if (hunger === 0) {
      // Starvation damage
      health = Math.max(0, health - 1);
    }
  }

  return { health, hunger, nextTimer: timer };
}

/**
 * Calculates level from total experience points.
 */
export function calculateLevel(xp: number): { level: number; progress: number } {
  let level = 0;
  let remaining = xp;

  while (true) {
    const needed = 10 + level * 5;
    if (remaining < needed) {
      return { level, progress: remaining / needed };
    }
    remaining -= needed;
    level++;
  }
}

/**
 * Biome types and procedural biome detection logic
 */
export type BiomeType = 'plains' | 'forest' | 'desert' | 'mountain' | 'cave' | 'underwater';

export interface BiomeContext {
  x: number;
  y: number;
  z: number;
  surfaceY: number;
  temperature: number; // noise range e.g. -1 to 1
  hasCeiling: boolean; // solid block ceiling overhead
  isSubmerged: boolean;
  nearTreesCount?: number;
}

export function determineBiome(ctx: BiomeContext): BiomeType {
  if (ctx.isSubmerged) return 'underwater';
  // Cave: player is underground and has a solid ceiling overhead
  if (ctx.hasCeiling && ctx.y < ctx.surfaceY - 2) return 'cave';
  // Mountain peaks: high elevation
  if (ctx.surfaceY >= 30 || ctx.y >= 32) return 'mountain';
  // Desert: warm and dry climate
  if (ctx.temperature > 0.45) return 'desert';
  // Forest: tree foliage or temperate moisture
  if ((ctx.nearTreesCount !== undefined && ctx.nearTreesCount >= 2) || (ctx.temperature > -0.25 && ctx.temperature <= 0.45 && ctx.surfaceY > 19)) {
    return 'forest';
  }
  return 'plains';
}

