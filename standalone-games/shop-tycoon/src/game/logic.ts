/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PlacedFixture, DailyLedger, GridPoint } from './types.ts';

export interface GridBounds {
  width: number;
  height: number;
  minX: number;
  minY: number;
  // Right-hand tile of the two-tile entrance on the bottom row. Defaults to the centre.
  doorX?: number;
}

/** The entrance never moves, even when the floor is expanded sideways. */
export const DOOR_X = 7;

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

  // Entrance door zone protection: the two tiles left of and at doorX on the bottom row,
  // plus the tile in front of them so shoppers can always walk in
  const doorZoneX = (gridBounds.doorX ?? Math.floor(gridBounds.width / 2)) - 1;
  const doorZoneY = gridBounds.height - 2;
  if (doBoxesOverlap(x, y, w, h, doorZoneX, doorZoneY, 2, 2)) {
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

/** True when a floor tile is covered by any fixture. */
export function isTileBlocked(fixtures: PlacedFixture[], x: number, y: number): boolean {
  return fixtures.some(f => x >= f.x && x < f.x + f.width && y >= f.y && y < f.y + f.height);
}

/**
 * Shortest 4-way walking route between two floor tiles that steps around blocked tiles.
 * Returns the tiles to visit after `from` (ending at `to`), or null when `to` is unreachable.
 * The start tile itself may be blocked, so people caught inside new furniture can walk out.
 */
export function findPath(
  from: GridPoint,
  to: GridPoint,
  gridWidth: number,
  gridHeight: number,
  isBlocked: (x: number, y: number) => boolean
): GridPoint[] | null {
  const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < gridWidth && y < gridHeight;
  if (!inBounds(to.x, to.y) || isBlocked(to.x, to.y)) return null;
  if (from.x === to.x && from.y === to.y) return [];

  const key = (x: number, y: number) => y * gridWidth + x;
  const cameFrom = new Map<number, number>([[key(from.x, from.y), -1]]);
  const queue: GridPoint[] = [from];
  const steps = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.x === to.x && current.y === to.y) {
      const route: GridPoint[] = [];
      let k = key(to.x, to.y);
      while (k !== key(from.x, from.y)) {
        route.unshift({ x: k % gridWidth, y: Math.floor(k / gridWidth) });
        k = cameFrom.get(k)!;
      }
      return route;
    }
    for (const [dx, dy] of steps) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      if (!inBounds(nx, ny) || isBlocked(nx, ny) || cameFrom.has(key(nx, ny))) continue;
      cameFrom.set(key(nx, ny), key(current.x, current.y));
      queue.push({ x: nx, y: ny });
    }
  }
  return null;
}

/**
 * Drops waypoints that can be skipped by walking straight, so routes look natural
 * instead of following the tile staircase. Keeps a body-width clearance from fixtures.
 */
export function smoothPath(
  start: GridPoint,
  route: GridPoint[],
  isBlocked: (x: number, y: number) => boolean
): GridPoint[] {
  const clear = (a: GridPoint, b: GridPoint) => {
    const distance = Math.hypot(b.x - a.x, b.y - a.y);
    const samples = Math.max(1, Math.ceil(distance / 0.2));
    for (let i = 0; i <= samples; i++) {
      const px = a.x + ((b.x - a.x) * i) / samples;
      const py = a.y + ((b.y - a.y) * i) / samples;
      for (const ox of [-0.3, 0.3]) {
        for (const oy of [-0.3, 0.3]) {
          if (isBlocked(Math.round(px + ox), Math.round(py + oy))) return false;
        }
      }
    }
    return true;
  };

  const smoothed: GridPoint[] = [];
  let anchor = start;
  let i = 0;
  while (i < route.length) {
    let furthest = i;
    for (let j = route.length - 1; j > i; j--) {
      if (clear(anchor, route[j])) {
        furthest = j;
        break;
      }
    }
    smoothed.push(route[furthest]);
    anchor = route[furthest];
    i = furthest + 1;
  }
  return smoothed;
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
