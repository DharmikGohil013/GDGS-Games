/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getRotatedDimensions,
  doBoxesOverlap,
  canPlaceFixture,
  calculatePricingElasticity,
  restockShelfFromWarehouse,
  calculateDailySummary,
  GridBounds
} from './logic';
import { PlacedFixture } from './types';

test('getRotatedDimensions swaps width and height correctly at 90 and 270 degrees', () => {
  assert.deepEqual(getRotatedDimensions(2, 1, 0), { w: 2, h: 1 });
  assert.deepEqual(getRotatedDimensions(2, 1, 90), { w: 1, h: 2 });
  assert.deepEqual(getRotatedDimensions(2, 1, 180), { w: 2, h: 1 });
  assert.deepEqual(getRotatedDimensions(2, 1, 270), { w: 1, h: 2 });
});

test('doBoxesOverlap accurately detects intersection and clearance', () => {
  // Overlapping boxes
  assert.equal(doBoxesOverlap(2, 2, 2, 1, 3, 2, 2, 1), true);
  // Touching borders (not overlapping in grid tile logic)
  assert.equal(doBoxesOverlap(0, 0, 2, 2, 2, 0, 2, 2), false);
  // Completely separated boxes
  assert.equal(doBoxesOverlap(1, 1, 1, 1, 5, 5, 2, 2), false);
});

test('canPlaceFixture validates boundaries, entrance area, and collisions', () => {
  const bounds: GridBounds = { width: 14, height: 12, minX: 1, minY: 1 };
  const existing: PlacedFixture[] = [
    {
      id: 'fix_1',
      type: 'shelf_produce',
      x: 3,
      y: 3,
      width: 2,
      height: 1,
      rotation: 0,
      currentStock: 10,
      maxStock: 30
    }
  ];

  // Legal placement on empty floor
  const legal = canPlaceFixture(bounds, existing, 6, 6, 2, 1);
  assert.equal(legal.allowed, true);

  // Illegal: overlapping existing fixture
  const overlap = canPlaceFixture(bounds, existing, 3, 3, 2, 1);
  assert.equal(overlap.allowed, false);

  // Illegal: out of bounds
  const outOfBounds = canPlaceFixture(bounds, existing, 13, 11, 2, 2);
  assert.equal(outOfBounds.allowed, false);

  // Illegal: blocking entrance door (x: 6-7, y: 11)
  const blockDoor = canPlaceFixture(bounds, existing, 6, 11, 2, 1);
  assert.equal(blockDoor.allowed, false);
});

test('calculatePricingElasticity reacts appropriately to price margins', () => {
  const suggested = 10;

  // Bargain (below 80% suggested)
  const bargain = calculatePricingElasticity(7, suggested);
  assert.equal(bargain.reaction, 'bargain');
  assert.ok(bargain.purchaseProbability >= 0.95);

  // Fair price
  const fair = calculatePricingElasticity(10, suggested);
  assert.equal(fair.reaction, 'fair');
  assert.ok(fair.purchaseProbability >= 0.85);

  // Pricey (120% suggested)
  const pricey = calculatePricingElasticity(12.5, suggested);
  assert.equal(pricey.reaction, 'pricey');
  assert.ok(pricey.purchaseProbability < fair.purchaseProbability);

  // Ripoff (180% suggested)
  const ripoff = calculatePricingElasticity(18, suggested);
  assert.equal(ripoff.reaction, 'ripoff');
  assert.ok(ripoff.purchaseProbability <= 0.1);
});

test('restockShelfFromWarehouse transfers inventory accurately', () => {
  const shelf = { currentStock: 10, maxStock: 30 };
  const warehouse = { prod_apples: 15 };

  // Shelf needs 20, warehouse has 15 -> should take all 15
  const result = restockShelfFromWarehouse(shelf, warehouse, 'prod_apples');
  assert.equal(result.restockedAmount, 15);
  assert.equal(result.updatedShelfStock, 25);
  assert.equal(result.updatedWarehouseCount, 0);

  // Shelf full -> should take 0
  const fullShelf = { currentStock: 30, maxStock: 30 };
  const result2 = restockShelfFromWarehouse(fullShelf, { prod_apples: 50 }, 'prod_apples');
  assert.equal(result2.restockedAmount, 0);
  assert.equal(result2.updatedShelfStock, 30);
  assert.equal(result2.updatedWarehouseCount, 50);
});

test('calculateDailySummary aggregates financials and customer ratings', () => {
  const summary = calculateDailySummary(
    1,
    500, // gross revenue
    150, // cogs
    80,  // wages
    50,  // expansions
    25,  // served
    5,   // lost
    120, // 25 served + 5 lost = 30 custs. 120/30 = 4.0
    'Red Gala Apples'
  );

  assert.equal(summary.day, 1);
  assert.equal(summary.grossRevenue, 500);
  assert.equal(summary.netProfit, 220); // 500 - (150 + 80 + 50) = 220
  assert.equal(summary.customersServed, 25);
  assert.equal(summary.customersLost, 5);
  assert.equal(summary.satisfactionScore, 4.0);
  assert.equal(summary.topSellingProduct, 'Red Gala Apples');
});

test('GameEngine initializes with default store, allows building and wholesale ordering', async () => {
  const { GameEngine } = await import('./engine');
  const engine = new GameEngine();
  
  assert.ok(engine.cash >= 2000);
  assert.equal(engine.day, 1);
  assert.ok(engine.fixtures.length >= 5);
  assert.ok(engine.products.length >= 10);

  // Test building a new shelf
  const initialCash = engine.cash;
  const buildRes = engine.buildFixture('shelf_produce', 1, 3, 0);
  assert.equal(buildRes.success, true);
  assert.ok(engine.cash < initialCash);

  // Test placing a wholesale order
  const orderRes = engine.placeWholesaleOrder('prod_apples', 2);
  assert.equal(orderRes.success, true);
  assert.equal(engine.wholesaleOrders.length, 1);

  // Fast forward delivery
  engine.wholesaleOrders[0].arrivesAtTime = 0;
  engine.update(0.05);
  assert.equal(engine.wholesaleOrders[0].isDelivered, true);
});

