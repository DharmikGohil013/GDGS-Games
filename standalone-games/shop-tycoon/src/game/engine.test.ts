/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from './engine.ts';
import { isTileBlocked } from './logic.ts';
import type { Customer, PlacedFixture } from './types.ts';

const STEP = 0.05;

// Repeatable shoppers: a tiny LCG in place of Math.random for each test
function withSeed<T>(seed: number, run: () => T): T {
  const original = Math.random;
  let state = seed;
  Math.random = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  try {
    return run();
  } finally {
    Math.random = original;
  }
}

function runFor(engine: GameEngine, seconds: number, check?: () => void) {
  for (let t = 0; t < seconds && !engine.isDayFinished; t += STEP) {
    engine.update(STEP);
    check?.();
  }
}

function assertQueuesHealthy(engine: GameEngine) {
  const waiting = new Map(engine.customers.map(c => [c.id, c]));
  for (const f of engine.fixtures) {
    for (const id of f.queue ?? []) {
      const cust = waiting.get(id);
      assert.ok(cust, `register ${f.id} queue holds a shopper who already left`);
      assert.ok(
        cust!.state === 'heading_to_checkout' || cust!.state === 'queuing',
        `register ${f.id} queue holds a shopper who is ${cust!.state}`
      );
    }
  }
}

test('a full day of trade never leaves a departed shopper stuck in a checkout line', () => {
  withSeed(7, () => {
    const engine = new GameEngine();
    // No cashier means slow scanning, long lines and shoppers running out of patience
    engine.fireStaff('staff_alice');
    engine.gameSpeed = 3;
    runFor(engine, 400, () => assertQueuesHealthy(engine));
    assert.equal(engine.isDayFinished, true);
    assert.ok(engine.latestLedger!.customersServed > 5, 'the unstaffed register still serves people');
  });
});

test('shoppers and staff walk around fixtures instead of through them', () => {
  withSeed(11, () => {
    const engine = new GameEngine();
    runFor(engine, 120, () => {
      for (const walker of [...engine.customers, ...engine.staff.filter(s => s.role !== 'cashier')]) {
        const x = Math.round(walker.x);
        const y = Math.round(walker.y);
        assert.equal(isTileBlocked(engine.fixtures, x, y), false, `walker inside a fixture at ${x},${y}`);
      }
    });
    assert.ok(engine.dailyStats.served > 0);
  });
});

test('checkout takes time: express registers are quicker and unstaffed desks are slow', () => {
  const engine = new GameEngine();
  const shopper = { cart: [{ productId: 'prod_apples', quantity: 3, pricePaid: 2.5 }] } as unknown as Customer;
  const desk = (type: string, staffed: boolean) =>
    ({ id: type, type, x: 1, y: 1, width: 2, height: 1, rotation: 0, currentStock: 0, maxStock: 0,
       assignedStaffId: staffed ? 'someone' : null }) as PlacedFixture;
  const duration = (reg: PlacedFixture) =>
    (engine as unknown as { checkoutDuration(r: PlacedFixture, c: Customer): number }).checkoutDuration(reg, shopper);

  const basic = duration(desk('checkout_basic', true));
  const express = duration(desk('checkout_express', true));
  const unstaffed = duration(desk('checkout_basic', false));
  assert.ok(basic >= 1.5, `basic register is not instant (${basic}s)`);
  assert.ok(express <= basic * 0.65, `express is ~40% faster (${express}s vs ${basic}s)`);
  assert.ok(unstaffed > basic * 2, 'a register without a cashier is much slower');
});

test('decor raises comfort, and litter lowers it until a custodian sweeps it up', () => {
  const engine = new GameEngine();
  const before = engine.getComfort();
  assert.equal(engine.buildFixture('decor_plant', 12, 9, 0).success, true);
  assert.equal(engine.getComfort(), before + 6);

  engine.isStoreOpen = false;
  engine.litter.push({ id: 'l1', x: 8, y: 6, kind: 'wrapper' }, { id: 'l2', x: 2, y: 5, kind: 'spill' });
  assert.equal(engine.getComfort(), before + 6 - 8);

  assert.equal(engine.hireStaff('cleaner').success, true);
  runFor(engine, 20);
  assert.equal(engine.litter.length, 0, 'the custodian cleaned every spot');
  assert.equal(engine.getComfort(), before + 6);
});

test('tapping a dirty tile cleans it by hand', () => {
  const engine = new GameEngine();
  engine.litter.push({ id: 'l1', x: 8, y: 6, kind: 'wrapper' });
  assert.equal(engine.cleanLitterAt(8, 5), false);
  assert.equal(engine.cleanLitterAt(8, 6), true);
  assert.equal(engine.litter.length, 0);
});

test('wholesale orders respect warehouse space and product unlock levels', () => {
  const engine = new GameEngine();
  assert.equal(engine.getWarehouseCapacity(), 200);

  const locked = engine.placeWholesaleOrder('prod_smartwatch', 1);
  assert.equal(locked.success, false);
  assert.match(locked.message, /level 4/);

  assert.equal(engine.placeWholesaleOrder('prod_soda', 2).success, true); // 48 more units: 168/200
  const full = engine.placeWholesaleOrder('prod_soda', 2);
  assert.equal(full.success, false);
  assert.match(full.message, /Warehouse full/);

  assert.equal(engine.buildFixture('storage_rack', 1, 1, 0).success, true);
  assert.equal(engine.getWarehouseCapacity(), 350);
  assert.equal(engine.placeWholesaleOrder('prod_soda', 2).success, true);
});

test('the supplier discount is applied to the order price', () => {
  const engine = new GameEngine();
  engine.purchaseUpgrade('upg_supplier');
  const cashBefore = engine.cash;
  engine.placeWholesaleOrder('prod_apples', 1); // 20 units at $1.20, minus 15%
  assert.equal(Number((cashBefore - engine.cash).toFixed(2)), 20.4);
});

test('a cashier hired before there is a free register starts work when one is built', () => {
  const engine = new GameEngine();
  engine.hireStaff('cashier');
  const newcomer = engine.staff[engine.staff.length - 1];
  assert.equal(newcomer.assignedFixtureId ?? null, null);

  assert.equal(engine.buildFixture('checkout_basic', 9, 8, 0).success, true);
  engine.update(STEP);
  const register = engine.fixtures.find(f => f.x === 9 && f.y === 8)!;
  assert.equal(newcomer.assignedFixtureId, register.id);
  assert.equal(register.assignedStaffId, newcomer.id);
});

test('selling a busy register sends its line to another one', () => {
  withSeed(3, () => {
    const engine = new GameEngine();
    engine.buildFixture('checkout_basic', 9, 8, 0);
    engine.gameSpeed = 3;
    runFor(engine, 60);
    engine.dismantleFixture('fix_reg_1');
    runFor(engine, 40, () => {
      assertQueuesHealthy(engine);
      for (const c of engine.customers) {
        if (c.state === 'queuing' || c.state === 'heading_to_checkout') {
          assert.ok(engine.fixtures.some(f => f.id === c.assignedCheckoutId), 'shopper waits at a register that exists');
        }
      }
    });
  });
});

test('building is refused when it would wall off another fixture', () => {
  const engine = new GameEngine();
  // The produce stand at (3,3)-(4,3): fence in its front and both sides
  assert.equal(engine.buildFixture('shelf_grocery', 3, 4, 0).success, true);
  assert.equal(engine.buildFixture('decor_plant', 2, 3, 0).success, true);
  assert.equal(engine.buildFixture('decor_plant', 5, 3, 0).success, true);
  const sealBack = engine.buildFixture('shelf_grocery', 3, 2, 0);
  assert.equal(sealBack.success, false);
  assert.match(sealBack.message, /block the aisle/);
});

test('happy shoppers lift a damaged reputation over a day', () => {
  withSeed(5, () => {
    const engine = new GameEngine();
    engine.reputation = 3.2;
    engine.gameSpeed = 3;
    runFor(engine, 400);
    assert.equal(engine.isDayFinished, true);
    assert.ok(engine.reputation > 3.2, `reputation went from 3.2 to ${engine.reputation.toFixed(2)}`);
  });
});

test('a reached daily goal pays its reward once', () => {
  withSeed(9, () => {
    const engine = new GameEngine();
    engine.dailyGoal = { description: 'Serve 3', metric: 'served', target: 3, rewardCash: 500, rewardXp: 10, completed: false };
    engine.gameSpeed = 3;
    runFor(engine, 120);
    assert.equal(engine.dailyGoal.completed, true);
    const cash = engine.cash;
    runFor(engine, 5);
    assert.ok(engine.cash < cash + 500, 'the reward is not paid again');
  });
});

test('save data restores the store and picks up new catalogue items', () => {
  const engine = new GameEngine();
  engine.buildFixture('decor_plant', 12, 9, 0);
  engine.purchaseUpgrade('upg_floor');
  engine.products.find(p => p.id === 'prod_apples')!.currentPrice = 2.95;
  engine.startNextDay();

  const data = JSON.parse(JSON.stringify(engine.toSaveData()));
  const restored = GameEngine.fromSaveData(data);
  assert.equal(restored.day, 2);
  assert.equal(restored.cash, engine.cash);
  assert.equal(restored.gridWidth, 16);
  assert.equal(restored.upgrades.find(u => u.id === 'upg_floor')!.level, 1);
  assert.equal(restored.fixtures.length, engine.fixtures.length);
  assert.equal(restored.products.find(p => p.id === 'prod_apples')!.currentPrice, 2.95);
  assert.ok(restored.products.some(p => p.id === 'prod_scarf'));
  assert.equal(restored.dailyGoal.description, engine.dailyGoal.description);
});
