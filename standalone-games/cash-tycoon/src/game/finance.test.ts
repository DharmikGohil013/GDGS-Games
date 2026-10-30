import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatMoney,
  calculateCost,
  calculateMaxAffordable,
  calculateMilestones,
  calculateCycleDuration,
  calculateRevenuePerCycle,
  calculateOfflineEarnings,
} from './finance';
import { BusinessDefinition, BusinessState } from '../types/game';

test('formatMoney handles small numbers, suffixes and precision correctly', () => {
  assert.equal(formatMoney(0), '$0.00');
  assert.equal(formatMoney(42.5), '$42.50');
  assert.equal(formatMoney(999.99), '$999.99');
  assert.equal(formatMoney(1000), '$1.00 K');
  assert.equal(formatMoney(1250000), '$1.25 M');
  assert.equal(formatMoney(4500000000), '$4.50 B');
  assert.equal(formatMoney(3200000000000), '$3.20 T');
  assert.equal(formatMoney(1e15), '$1.00 Qa');
  assert.equal(formatMoney(1e18), '$1.00 Qi');
  assert.equal(formatMoney(1e21), '$1.00 Sx');
  assert.equal(formatMoney(1e33), '$1.00 Dc');
});

test('calculateCost computes exact geometric series for bulk purchases', () => {
  const baseCost = 10;
  const rate = 1.15;

  // 1 level at level 0: 10 * 1.15^0 = 10
  assert.equal(calculateCost(baseCost, rate, 0, 1), 10);

  // 1 level at level 1: 10 * 1.15^1 = 11.5
  assert.equal(calculateCost(baseCost, rate, 1, 1), 11.5);

  // 10 levels from level 0: sum of 10 * 1.15^i for i=0..9
  let directSum = 0;
  for (let i = 0; i < 10; i++) {
    directSum += baseCost * Math.pow(rate, i);
  }
  const formulaCost = calculateCost(baseCost, rate, 0, 10);
  assert.ok(Math.abs(formulaCost - directSum) < 0.001);
});

test('calculateMaxAffordable computes maximum levels without overspending', () => {
  const baseCost = 4;
  const rate = 1.07;
  const currentLevel = 0;

  // With $100 cash, test max affordable
  const { count, cost } = calculateMaxAffordable(baseCost, rate, currentLevel, 100);
  assert.ok(count > 0);
  assert.ok(cost <= 100);

  // Buying one more level would exceed 100
  const costOneMore = calculateCost(baseCost, rate, currentLevel, count + 1);
  assert.ok(costOneMore > 100);
});

test('calculateMilestones applies 25, 50, 100 speed and revenue boosts', () => {
  const milestones = [
    { level: 25, type: 'speed' as const, multiplier: 2, label: 'Speed x2' },
    { level: 50, type: 'revenue' as const, multiplier: 3, label: 'Revenue x3' },
    { level: 100, type: 'speed' as const, multiplier: 2, label: 'Speed x2' },
  ];

  // At level 10: 0 milestones
  const m10 = calculateMilestones(10, milestones);
  assert.equal(m10.speedMultiplier, 1);
  assert.equal(m10.revenueMultiplier, 1);
  assert.equal(m10.nextMilestone?.level, 25);
  assert.equal(m10.progressToNext, 10 / 25);

  // At level 25: speed x2
  const m25 = calculateMilestones(25, milestones);
  assert.equal(m25.speedMultiplier, 2);
  assert.equal(m25.revenueMultiplier, 1);
  assert.equal(m25.nextMilestone?.level, 50);

  // At level 50: speed x2, revenue x3
  const m50 = calculateMilestones(50, milestones);
  assert.equal(m50.speedMultiplier, 2);
  assert.equal(m50.revenueMultiplier, 3);
  assert.equal(m50.nextMilestone?.level, 100);
});

test('calculateRevenuePerCycle respects level, milestones, fame and frenzy', () => {
  const mockBiz: BusinessDefinition = {
    id: 'comic',
    floor: 1,
    name: 'Comic Stand',
    category: 'Retail',
    icon: 'book',
    themeColor: '#3b82f6',
    accentColor: '#60a5fa',
    baseCost: 4,
    costRate: 1.07,
    baseRevenue: 1,
    baseCycleSeconds: 0.8,
    milestones: [
      { level: 25, type: 'revenue', multiplier: 2, label: 'x2' }
    ],
    manager: {
      name: 'Bob',
      role: 'Cashier',
      avatar: '',
      cost: 100,
      description: 'Automates'
    }
  };

  // Level 10, no fame, no frenzy: 1 * 10 * 1 * 1 * 1 * 1 = 10
  const rev1 = calculateRevenuePerCycle(mockBiz, 10, {}, [], 0, false);
  assert.equal(rev1, 10);

  // Level 25: 1 * 25 * 2 = 50
  const rev2 = calculateRevenuePerCycle(mockBiz, 25, {}, [], 0, false);
  assert.equal(rev2, 50);

  // With 50 Fame points (+100% boost -> 2x) and Frenzy (3x): 50 * 2 * 3 = 300
  const rev3 = calculateRevenuePerCycle(mockBiz, 25, {}, [], 50, true);
  assert.equal(rev3, 300);
});

test('calculateOfflineEarnings accurately aggregates automated income', () => {
  const mockBiz: BusinessDefinition = {
    id: 'comic',
    floor: 1,
    name: 'Comic Stand',
    category: 'Retail',
    icon: 'book',
    themeColor: '#3b82f6',
    accentColor: '#60a5fa',
    baseCost: 4,
    costRate: 1.07,
    baseRevenue: 2,
    baseCycleSeconds: 1.0,
    milestones: [],
    manager: { name: 'Bob', role: '', avatar: '', cost: 10, description: '' }
  };

  const states: Record<string, BusinessState> = {
    comic: { id: 'comic', level: 10, unlocked: true, progress: 0, isRunning: false, cycleStartTime: 0 }
  };

  // If automated with manager: 10 level * $2 base = $20 per 1.0s cycle
  // Over 100 seconds: 100 * $20 = $2000
  const managers = { comic: true };
  const offline = calculateOfflineEarnings([mockBiz], states, managers, {}, [], 0, 100);
  assert.equal(offline.totalOfflineCash, 2000);

  // If not automated: $0 offline
  const offlineNoManager = calculateOfflineEarnings([mockBiz], states, {}, {}, [], 0, 100);
  assert.equal(offlineNoManager.totalOfflineCash, 0);
});
