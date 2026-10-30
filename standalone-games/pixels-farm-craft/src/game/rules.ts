import { InventorySlot, CraftingRecipe, Quest } from './types';

/**
 * Calculates current growth stage of a crop (0 = none, 1 = sprout, 2 = growing, 3 = harvestable)
 */
export function calculateGrowthStage(
  plantedAt: number,
  currentTime: number,
  growTimeSeconds: number,
  isWatered: boolean
): number {
  if (plantedAt <= 0 || growTimeSeconds <= 0) return 0;
  
  // If not watered, it stays as a young sprout (stage 1) and will not mature
  if (!isWatered) return 1;

  const elapsedSeconds = Math.max(0, (currentTime - plantedAt) / 1000);
  const ratio = elapsedSeconds / growTimeSeconds;

  if (ratio >= 1.0) {
    return 3; // Ready to harvest
  } else if (ratio >= 0.4) {
    return 2; // Growing, leafy
  } else {
    return 1; // Sprout
  }
}

/**
 * Consumes energy if sufficient energy is available
 */
export function consumeEnergy(current: number, cost: number): { success: boolean; newEnergy: number } {
  if (cost <= 0) {
    return { success: true, newEnergy: current };
  }
  if (current < cost) {
    return { success: false, newEnergy: current };
  }
  return {
    success: true,
    newEnergy: Math.max(0, Math.round(current - cost)),
  };
}

/**
 * Replenishes energy up to maxEnergy
 */
export function replenishEnergy(current: number, amount: number, maxEnergy: number): number {
  if (amount <= 0) return current;
  return Math.min(maxEnergy, Math.round(current + amount));
}

/**
 * Checks if the inventory has at least `requiredCount` of `itemId`
 */
export function hasItemCount(inventory: InventorySlot[], itemId: string, requiredCount: number): boolean {
  if (requiredCount <= 0) return true;
  let total = 0;
  for (const slot of inventory) {
    if (slot && slot.itemId === itemId) {
      total += slot.count;
      if (total >= requiredCount) return true;
    }
  }
  return false;
}

/**
 * Adds an item to the player's inventory, respecting stack limits and total slot capacity
 */
export function addToInventory(
  inventory: InventorySlot[],
  itemId: string,
  countToAdd: number,
  maxSlots: number = 24,
  maxStack: number = 99
): { success: boolean; newInventory: InventorySlot[]; remainder: number } {
  if (countToAdd <= 0) {
    return { success: true, newInventory: [...inventory], remainder: 0 };
  }

  // Clone inventory deeply
  const newInventory = inventory.map(slot => ({ ...slot }));
  let remaining = countToAdd;

  // 1. Try to add to existing non-full stacks of the same item
  for (let i = 0; i < newInventory.length; i++) {
    if (newInventory[i].itemId === itemId && newInventory[i].count < maxStack) {
      const space = maxStack - newInventory[i].count;
      const toAdd = Math.min(space, remaining);
      newInventory[i].count += toAdd;
      remaining -= toAdd;
      if (remaining === 0) break;
    }
  }

  // 2. If remaining, put into new slots if under maxSlots
  while (remaining > 0 && newInventory.length < maxSlots) {
    const toAdd = Math.min(maxStack, remaining);
    newInventory.push({ itemId, count: toAdd });
    remaining -= toAdd;
  }

  const success = remaining < countToAdd;
  return { success, newInventory, remainder: remaining };
}

/**
 * Removes a count of items from the inventory
 */
export function removeFromInventory(
  inventory: InventorySlot[],
  itemId: string,
  countToRemove: number
): { success: boolean; newInventory: InventorySlot[] } {
  if (countToRemove <= 0) {
    return { success: true, newInventory: [...inventory] };
  }

  if (!hasItemCount(inventory, itemId, countToRemove)) {
    return { success: false, newInventory: [...inventory] };
  }

  const newInventory: InventorySlot[] = [];
  let needed = countToRemove;

  for (const slot of inventory) {
    if (slot.itemId === itemId && needed > 0) {
      if (slot.count <= needed) {
        needed -= slot.count;
        // entire slot consumed, don't push
      } else {
        newInventory.push({ itemId: slot.itemId, count: slot.count - needed });
        needed = 0;
      }
    } else {
      newInventory.push({ ...slot });
    }
  }

  return { success: true, newInventory };
}

/**
 * Calculates level and progress from experience points (XP)
 */
export function calculateLevel(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressRatio: number;
} {
  const safeXp = Math.max(0, Math.floor(xp));
  // Base 100 XP per level with gentle scaling: L1: 0-100, L2: 100-250, L3: 250-450, etc.
  let level = 1;
  let threshold = 100;
  let prevThreshold = 0;

  while (safeXp >= threshold) {
    level++;
    prevThreshold = threshold;
    threshold += level * 100;
  }

  const range = threshold - prevThreshold;
  const currentLevelXp = safeXp - prevThreshold;
  const nextLevelXp = range;
  const progressRatio = Math.min(1, Math.max(0, currentLevelXp / range));

  return { level, currentLevelXp, nextLevelXp, progressRatio };
}

/**
 * Evaluates shop purchase or sale
 */
export function calculateShopTransaction(
  unitPrice: number,
  quantity: number,
  currentCoins: number,
  isBuying: boolean
): { canProceed: boolean; totalCost: number; newCoins: number } {
  const safeQuantity = Math.max(1, Math.floor(quantity));
  const totalCost = unitPrice * safeQuantity;

  if (isBuying) {
    if (currentCoins < totalCost) {
      return { canProceed: false, totalCost, newCoins: currentCoins };
    }
    return { canProceed: true, totalCost, newCoins: currentCoins - totalCost };
  } else {
    // Selling
    return { canProceed: true, totalCost, newCoins: currentCoins + totalCost };
  }
}

/**
 * Checks if a crafting recipe can be executed given player inventory and energy
 */
export function canCraftRecipe(
  recipe: CraftingRecipe,
  inventory: InventorySlot[],
  energy: number
): { canCraft: boolean; missingItems: string[]; missingEnergy: boolean } {
  const missingItems: string[] = [];
  let missingEnergy = energy < recipe.energyCost;

  for (const req of recipe.requiredItems) {
    if (!hasItemCount(inventory, req.itemId, req.count)) {
      missingItems.push(req.itemId);
    }
  }

  const canCraft = missingItems.length === 0 && !missingEnergy;
  return { canCraft, missingItems, missingEnergy };
}

/**
 * Advances quest progress when player performs matching in-game action
 */
export function advanceQuest(
  quest: Quest,
  actionType: Quest['targetType'],
  count: number = 1
): { quest: Quest; justCompleted: boolean } {
  if (quest.completed || quest.targetType !== actionType) {
    return { quest: { ...quest }, justCompleted: false };
  }

  const newCount = Math.min(quest.targetCount, quest.currentCount + count);
  const justCompleted = newCount >= quest.targetCount && !quest.completed;

  return {
    quest: {
      ...quest,
      currentCount: newCount,
      completed: newCount >= quest.targetCount,
    },
    justCompleted,
  };
}

/**
 * Advances to the next tutorial step or signals completion
 */
export function getNextTutorialStep(
  currentStep: number,
  totalSteps: number
): { nextStep: number; isCompleted: boolean } {
  if (currentStep >= totalSteps - 1) {
    return { nextStep: totalSteps - 1, isCompleted: true };
  }
  return { nextStep: currentStep + 1, isCompleted: false };
}

/**
 * Returns the previous tutorial step clamped to 0
 */
export function getPrevTutorialStep(currentStep: number): number {
  return Math.max(0, currentStep - 1);
}

/**
 * Returns Euclidean distance between two points
 */
export function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * Checks if target coordinates are within interaction reach of player
 */
export function isWithinInteractionRange(
  playerX: number,
  playerY: number,
  targetX: number,
  targetY: number,
  maxReach: number = 70
): boolean {
  return calculateDistance(playerX, playerY, targetX, targetY) <= maxReach;
}
