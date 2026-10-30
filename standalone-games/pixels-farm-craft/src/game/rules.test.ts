import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateGrowthStage,
  consumeEnergy,
  replenishEnergy,
  addToInventory,
  removeFromInventory,
  hasItemCount,
  calculateLevel,
  calculateShopTransaction,
  canCraftRecipe,
  advanceQuest,
  getNextTutorialStep,
  getPrevTutorialStep,
  calculateDistance,
  isWithinInteractionRange,
} from './rules';
import { CraftingRecipe, Quest } from './types';

test('calculateGrowthStage handles dry, growing, and mature crops', () => {
  const plantedTime = 10000;
  const growSeconds = 10;

  // Unwatered crop stays at sprout stage (1) even after 20 seconds
  assert.equal(calculateGrowthStage(plantedTime, plantedTime + 20000, growSeconds, false), 1);

  // Watered crop at 2s (ratio 0.2) is stage 1
  assert.equal(calculateGrowthStage(plantedTime, plantedTime + 2000, growSeconds, true), 1);

  // Watered crop at 5s (ratio 0.5) is stage 2
  assert.equal(calculateGrowthStage(plantedTime, plantedTime + 5000, growSeconds, true), 2);

  // Watered crop at 10s (ratio 1.0) is stage 3 (ready to harvest)
  assert.equal(calculateGrowthStage(plantedTime, plantedTime + 10000, growSeconds, true), 3);

  // Watered crop at 30s is still stage 3
  assert.equal(calculateGrowthStage(plantedTime, plantedTime + 30000, growSeconds, true), 3);
});

test('consumeEnergy deducts energy when sufficient, refuses when insufficient', () => {
  const res1 = consumeEnergy(100, 20);
  assert.equal(res1.success, true);
  assert.equal(res1.newEnergy, 80);

  const res2 = consumeEnergy(15, 20);
  assert.equal(res2.success, false);
  assert.equal(res2.newEnergy, 15);

  const resZero = consumeEnergy(50, 0);
  assert.equal(resZero.success, true);
  assert.equal(resZero.newEnergy, 50);
});

test('replenishEnergy caps at maximum energy', () => {
  assert.equal(replenishEnergy(900, 50, 1000), 950);
  assert.equal(replenishEnergy(980, 50, 1000), 1000);
});

test('inventory management adds and stacks items properly', () => {
  const initial = [{ itemId: 'popberry', count: 10 }];

  // Add more to existing stack
  const res1 = addToInventory(initial, 'popberry', 5, 10, 99);
  assert.equal(res1.success, true);
  assert.equal(res1.newInventory[0].count, 15);

  // Add new item to empty slot
  const res2 = addToInventory(res1.newInventory, 'hoe', 1, 10, 1);
  assert.equal(res2.success, true);
  assert.equal(res2.newInventory.length, 2);
  assert.equal(res2.newInventory[1].itemId, 'hoe');

  // Verify inventory removal
  const remRes = removeFromInventory(res2.newInventory, 'popberry', 7);
  assert.equal(remRes.success, true);
  assert.equal(remRes.newInventory[0].count, 8);

  // Check inventory check
  assert.equal(hasItemCount(remRes.newInventory, 'popberry', 8), true);
  assert.equal(hasItemCount(remRes.newInventory, 'popberry', 9), false);
});

test('calculateLevel progression works predictably', () => {
  const l1 = calculateLevel(0);
  assert.equal(l1.level, 1);
  assert.equal(l1.currentLevelXp, 0);

  const l2 = calculateLevel(150);
  assert.equal(l2.level, 2);
  assert.equal(l2.currentLevelXp, 50);
});

test('calculateShopTransaction handles buy and sell logic', () => {
  // Buy 5 seeds at 2 coins each with 50 coins
  const buyRes = calculateShopTransaction(2, 5, 50, true);
  assert.equal(buyRes.canProceed, true);
  assert.equal(buyRes.totalCost, 10);
  assert.equal(buyRes.newCoins, 40);

  // Insufficient coins to buy
  const failBuy = calculateShopTransaction(20, 5, 50, true);
  assert.equal(failBuy.canProceed, false);
  assert.equal(failBuy.newCoins, 50);

  // Sell 3 crops at 5 coins each
  const sellRes = calculateShopTransaction(5, 3, 50, false);
  assert.equal(sellRes.canProceed, true);
  assert.equal(sellRes.totalCost, 15);
  assert.equal(sellRes.newCoins, 65);
});

test('canCraftRecipe checks materials and energy requirements', () => {
  const recipe: CraftingRecipe = {
    id: 'test_pie',
    name: 'Pie',
    resultItemId: 'pie',
    resultCount: 1,
    requiredItems: [
      { itemId: 'berry', count: 3 },
      { itemId: 'egg', count: 1 },
    ],
    energyCost: 10,
    description: 'Tasty pie',
  };

  const inventory = [
    { itemId: 'berry', count: 4 },
    { itemId: 'egg', count: 1 },
  ];

  // Sufficient
  const res1 = canCraftRecipe(recipe, inventory, 50);
  assert.equal(res1.canCraft, true);

  // Missing energy
  const res2 = canCraftRecipe(recipe, inventory, 5);
  assert.equal(res2.canCraft, false);
  assert.equal(res2.missingEnergy, true);

  // Missing ingredients
  const res3 = canCraftRecipe(recipe, [{ itemId: 'berry', count: 2 }], 50);
  assert.equal(res3.canCraft, false);
  assert.equal(res3.missingItems.length, 2);
});

test('advanceQuest handles progression and completion', () => {
  const quest: Quest = {
    id: 'q1',
    title: 'Till soil',
    npcName: 'Barney',
    npcDialogue: ['Till it!'],
    objectiveDescription: 'Till 3 plots',
    targetType: 'till',
    targetCount: 3,
    currentCount: 1,
    completed: false,
    rewardCoins: 50,
    rewardXp: 20,
  };

  const step1 = advanceQuest(quest, 'till', 1);
  assert.equal(step1.quest.currentCount, 2);
  assert.equal(step1.justCompleted, false);

  const step2 = advanceQuest(step1.quest, 'till', 1);
  assert.equal(step2.quest.currentCount, 3);
  assert.equal(step2.justCompleted, true);
  assert.equal(step2.quest.completed, true);
});

test('tutorial step progression clamps and signals completion', () => {
  const step0 = getNextTutorialStep(0, 5);
  assert.equal(step0.nextStep, 1);
  assert.equal(step0.isCompleted, false);

  const step4 = getNextTutorialStep(4, 5);
  assert.equal(step4.nextStep, 4);
  assert.equal(step4.isCompleted, true);

  assert.equal(getPrevTutorialStep(3), 2);
  assert.equal(getPrevTutorialStep(0), 0);
});

test('calculateDistance and isWithinInteractionRange work accurately', () => {
  assert.equal(calculateDistance(0, 0, 30, 40), 50);
  assert.equal(calculateDistance(100, 100, 100, 100), 0);

  // Within default reach of 70px
  assert.equal(isWithinInteractionRange(100, 100, 140, 100, 70), true); // 40px away
  assert.equal(isWithinInteractionRange(100, 100, 170, 100, 70), true); // exactly 70px
  assert.equal(isWithinInteractionRange(100, 100, 200, 100, 70), false); // 100px away
});
