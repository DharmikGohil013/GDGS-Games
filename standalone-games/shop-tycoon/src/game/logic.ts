/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlacedFixture, WholesaleOrder, DailyLedger } from './types';

export interface GridBounds {
  width: number;
  height: number;
  minX: number;
  minY: number;
}

/**
 * Calculates effective width and height after rotation (0, 90, 180, 270 degrees).
 */
export function getRotatedDimensions(w: number, h: number, rotation: number): { w: number; h: number } {
  const normRot = ((rotation % 360) + 360) % 360;
  if (normRot === 90 || normRot === 270) {
    return { w: h, h: w };
  }
  return { w, h };
}

/**
 * Checks if a bounding box overlaps with another bounding box.
 */
export function doBoxesOverlap(
  x1: number, y1: number, w1: number, h1: number,
  x2: number, y2: number, w2: number, h2: number
): boolean {
  return !(
    x1 + w1 <= x2 ||
    x2 + w2 <= x1 ||
    y1 + h1 <= y2 ||
    y2 + h2 <= y1
  );
}

/**
 * Validates whether a new fixture can be placed at the target grid position.
 * Prevents overlapping existing fixtures and blocking the entrance/exit walkway.
 */
export function canPlaceFixture(
  gridBounds: GridBounds,
  existingFixtures: PlacedFixture[],
  x: number,
  y: number,
  w: number,
  h: number,
  ignoreFixtureId?: string | null
): { allowed: boolean; reason?: string } {
  // Check bounds within shop playable floor (leaving 1 tile border for outer walls)
  if (x < gridBounds.minX || y < gridBounds.minY) {
    return { allowed: false, reason: 'Out of shop bounds' };
  }
  if (x + w > gridBounds.width || y + h > gridBounds.height) {
    return { allowed: false, reason: 'Exceeds shop boundary' };
  }

  // Entrance door zone protection: entrance is at bottom-center (e.g., x: 7-8, y: gridBounds.height - 1)
  const doorZoneX = Math.floor(gridBounds.width / 2) - 1;
  const doorZoneY = gridBounds.height - 1;
  if (doBoxesOverlap(x, y, w, h, doorZoneX, doorZoneY, 2, 1)) {
    return { allowed: false, reason: 'Cannot block main entrance door' };
  }

  // Check collision with any existing fixtures
  for (const fixture of existingFixtures) {
    if (ignoreFixtureId && fixture.id === ignoreFixtureId) {
      continue;
    }
    if (doBoxesOverlap(x, y, w, h, fixture.x, fixture.y, fixture.width, fixture.height)) {
      return { allowed: false, reason: 'Overlaps with existing fixture' };
    }
  }

  return { allowed: true };
}

export type PricingReaction = 'bargain' | 'fair' | 'pricey' | 'ripoff';

export interface PricingResult {
  purchaseProbability: number; // 0.0 to 1.0
  reaction: PricingReaction;
  tipChance: number;
  satisfactionDelta: number; // -2 to +2
}

/**
 * Pure pricing elasticity model: calculates customer purchase willingness
 * based on retail markup over suggested fair price.
 */
export function calculatePricingElasticity(
  retailPrice: number,
  suggestedPrice: number,
  customerBudget: number = 999
): PricingResult {
  if (retailPrice <= 0) {
    return { purchaseProbability: 1.0, reaction: 'bargain', tipChance: 0.4, satisfactionDelta: 2 };
  }

  const ratio = retailPrice / Math.max(suggestedPrice, 0.01);

  if (retailPrice > customerBudget) {
    return { purchaseProbability: 0.05, reaction: 'ripoff', tipChance: 0, satisfactionDelta: -2 };
  }

  if (ratio <= 0.8) {
    // Underpriced bargain! Customers love this, leaves 5-star tips
    return {
      purchaseProbability: 0.98,
      reaction: 'bargain',
      tipChance: 0.35,
      satisfactionDelta: 2
    };
  } else if (ratio <= 1.05) {
    // Fair regular market price
    return {
      purchaseProbability: 0.88,
      reaction: 'fair',
      tipChance: 0.15,
      satisfactionDelta: 1
    };
  } else if (ratio <= 1.35) {
    // Moderate markup, high profit but some shoppers hesitate
    const prob = Math.max(0.2, 0.88 - (ratio - 1.05) * 1.8);
    return {
      purchaseProbability: prob,
      reaction: 'pricey',
      tipChance: 0.05,
      satisfactionDelta: -1
    };
  } else {
    // Severe price gouging - customers refuse to buy and leave complaints
    return {
      purchaseProbability: 0.08,
      reaction: 'ripoff',
      tipChance: 0,
      satisfactionDelta: -2
    };
  }
}

/**
 * Restocks a display shelf from backroom warehouse storage.
 */
export function restockShelfFromWarehouse(
  shelf: { currentStock: number; maxStock: number },
  warehouseStockMap: Record<string, number>,
  productId: string,
  amountRequested?: number
): { restockedAmount: number; updatedShelfStock: number; updatedWarehouseCount: number } {
  const currentInWarehouse = warehouseStockMap[productId] || 0;
  if (currentInWarehouse <= 0) {
    return {
      restockedAmount: 0,
      updatedShelfStock: shelf.currentStock,
      updatedWarehouseCount: 0
    };
  }

  const spaceOnShelf = Math.max(0, shelf.maxStock - shelf.currentStock);
  const maxCanTake = amountRequested ? Math.min(amountRequested, spaceOnShelf) : spaceOnShelf;
  const actualToTransfer = Math.min(maxCanTake, currentInWarehouse);

  const updatedShelfStock = shelf.currentStock + actualToTransfer;
  const updatedWarehouseCount = currentInWarehouse - actualToTransfer;

  return {
    restockedAmount: actualToTransfer,
    updatedShelfStock,
    updatedWarehouseCount
  };
}

/**
 * Computes end-of-day financial ledger summary.
 */
export function calculateDailySummary(
  day: number,
  grossRevenue: number,
  cogs: number,
  staffWages: number,
  storeExpansions: number,
  customersServed: number,
  customersLost: number,
  satisfactionPoints: number, // Sum of customer ratings
  topSellingProduct?: string
): DailyLedger {
  const netProfit = grossRevenue - (cogs + staffWages + storeExpansions);
  const totalCustomers = customersServed + customersLost;
  
  let satisfactionScore = 4.2; // default neutral
  if (totalCustomers > 0) {
    const rawRating = satisfactionPoints / totalCustomers;
    satisfactionScore = Math.min(5, Math.max(1, Number(rawRating.toFixed(1))));
  }

  return {
    day,
    grossRevenue: Number(grossRevenue.toFixed(2)),
    cogs: Number(cogs.toFixed(2)),
    staffWages: Number(staffWages.toFixed(2)),
    storeExpansions: Number(storeExpansions.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    customersServed,
    customersLost,
    satisfactionScore,
    topSellingProduct: topSellingProduct || 'None'
  };
}
