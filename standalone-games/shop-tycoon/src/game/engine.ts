/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  Product,
  ProductCategory,
  PlacedFixture,
  WholesaleOrder,
  StaffMember,
  Customer,
  FloatingNotification,
  DailyLedger,
  DailyGoal,
  StoreUpgrade,
  Litter,
  GridPoint
} from './types.ts';
import { INITIAL_PRODUCTS } from './catalog.ts';
import { getFixtureDef } from './furnitureCatalog.ts';
import {
  canPlaceFixture,
  getRotatedDimensions,
  calculatePricingElasticity,
  restockShelfFromWarehouse,
  calculateDailySummary,
  findPath,
  smoothPath,
  isTileBlocked,
  DOOR_X,
  type GridBounds
} from './logic.ts';
import { sound } from './audio.ts';

export interface GameSnapshot {
  cash: number;
  level: number;
  xp: number;
  xpNeeded: number;
  reputation: number;
  day: number;
  timeOfDay: number;
  isStoreOpen: boolean;
  gameSpeed: number;
  gridWidth: number;
  gridHeight: number;
  fixtures: PlacedFixture[];
  warehouseStock: Record<string, number>;
  warehouseUsed: number;
  warehouseCapacity: number;
  wholesaleDiscount: number; // 0..1 fraction taken off wholesale prices
  products: Product[];
  staff: StaffMember[];
  wholesaleOrders: WholesaleOrder[];
  customersCount: number;
  litterCount: number;
  comfort: number;
  trendingCategory: ProductCategory;
  dailyGoal: DailyGoal;
  dailyStats: {
    revenue: number;
    cogs: number;
    served: number;
    lost: number;
    satisfactionSum: number;
  };
  dailyLedgers: DailyLedger[];
  upgrades: StoreUpgrade[];
  isDayFinished: boolean;
  latestLedger: DailyLedger | null;
}

type Walker = { x: number; y: number; targetX?: number; targetY?: number; path?: GridPoint[] };

const SAVE_KEY = 'shop_tycoon_save_v1';
const CUSTOMER_SPEED = 2.6;
const STAFF_SPEED = 2.4;
const MAX_LITTER = 12;
const VENDING_INTERVAL = 20; // game seconds between vending machine takings

export class GameEngine {
  public cash: number = 2400;
  public level: number = 1;
  public xp: number = 0;
  public xpNeeded: number = 400;
  public reputation: number = 4.6; // 1.0 to 5.0
  public day: number = 1;
  public timeOfDay: number = 8.0; // 8.0 = 8:00 AM, 20.0 = 8:00 PM
  public isStoreOpen: boolean = true;
  public gameSpeed: number = 1; // 0 = pause, 1 = normal, 2 = fast, 3 = hyper
  public gridWidth: number = 14;
  public gridHeight: number = 12;
  public readonly doorX: number = DOOR_X;

  public fixtures: PlacedFixture[] = [];
  public warehouseStock: Record<string, number> = {};
  public products: Product[] = [];
  public staff: StaffMember[] = [];
  public wholesaleOrders: WholesaleOrder[] = [];
  public customers: Customer[] = [];
  public litter: Litter[] = [];
  public notifications: FloatingNotification[] = [];
  public dailyLedgers: DailyLedger[] = [];

  // Each day one department is in fashion: shoppers want it more and accept higher prices
  public trendingCategory: ProductCategory = 'produce';
  public dailyGoal: DailyGoal = {
    description: '',
    metric: 'served',
    target: 0,
    rewardCash: 0,
    rewardXp: 0,
    completed: false
  };

  // Daily accumulator
  public dailyStats = {
    revenue: 0,
    cogs: 0,
    served: 0,
    lost: 0,
    satisfactionSum: 0,
    productSalesCount: {} as Record<string, number>
  };

  public isDayFinished: boolean = false;
  public latestLedger: DailyLedger | null = null;

  // Upgrades
  public upgrades: StoreUpgrade[] = [
    {
      id: 'upg_floor',
      name: 'Store Floor Expansion (+2 Tiles)',
      description: 'Expands the retail sales floor by 2 tiles width, providing more room for aisles and shelves.',
      cost: 800,
      level: 0,
      maxLevel: 3,
      unlocked: true,
      effectType: 'floor_expansion'
    },
    {
      id: 'upg_ads',
      name: 'Local Flyer Marketing Campaign',
      description: 'Increases customer foot traffic and peak hour shopper influx by 35%.',
      cost: 450,
      level: 0,
      maxLevel: 3,
      unlocked: true,
      effectType: 'ad_campaign'
    },
    {
      id: 'upg_supplier',
      name: 'Wholesale Supplier Volume Discount',
      description: 'Grants an automatic 15% discount on all wholesale carton restock orders.',
      cost: 650,
      level: 0,
      maxLevel: 2,
      unlocked: true,
      effectType: 'wholesale_discount'
    },
    {
      id: 'upg_training',
      name: 'Staff Training Program',
      description: 'Cashiers scan 20% faster, and stock clerks and custodians walk 20% faster, per tier.',
      cost: 550,
      level: 0,
      maxLevel: 3,
      unlocked: true,
      effectType: 'speed_boost'
    },
    {
      id: 'upg_design',
      name: 'Interior Design Makeover',
      description: 'Adds +15 store comfort per tier, so shoppers stay patient longer and visit more often.',
      cost: 700,
      level: 0,
      maxLevel: 3,
      unlocked: true,
      effectType: 'decor_boost'
    }
  ];

  // Internal timers
  private customerSpawnTimer: number = 0;
  private vendingTimer: number = 0;
  public gameTimeSeconds: number = 0;

  constructor() {
    this.initDefaultStore();
    this.planDay();
  }

  public initDefaultStore() {
    this.products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));

    // Warehouse initial stock
    this.warehouseStock = {
      prod_apples: 40,
      prod_baguette: 32,
      prod_soda: 48
    };

    // Starting fixtures
    this.fixtures = [
      // 1. Checkout Register
      {
        id: 'fix_reg_1',
        type: 'checkout_basic',
        x: 4,
        y: 8,
        width: 2,
        height: 1,
        rotation: 0,
        currentStock: 0,
        maxStock: 0,
        queue: [],
        assignedStaffId: 'staff_alice'
      },
      // 2. Produce shelf with apples
      {
        id: 'fix_shelf_1',
        type: 'shelf_produce',
        x: 3,
        y: 3,
        width: 2,
        height: 1,
        rotation: 0,
        assignedProductId: 'prod_apples',
        currentStock: 20,
        maxStock: 30
      },
      // 3. Bakery shelf with baguettes
      {
        id: 'fix_shelf_2',
        type: 'shelf_bakery',
        x: 6,
        y: 3,
        width: 2,
        height: 1,
        rotation: 0,
        assignedProductId: 'prod_baguette',
        currentStock: 16,
        maxStock: 30
      },
      // 4. Beverage cooler with soda
      {
        id: 'fix_shelf_3',
        type: 'shelf_cooler',
        x: 9,
        y: 3,
        width: 2,
        height: 1,
        rotation: 0,
        assignedProductId: 'prod_soda',
        currentStock: 24,
        maxStock: 35
      },
      // 5. Backroom Warehouse Pallet
      {
        id: 'fix_pallet_1',
        type: 'storage_pallet',
        x: 10,
        y: 1,
        width: 2,
        height: 2,
        rotation: 0,
        currentStock: 0,
        maxStock: 200
      },
      // 6. Decor plant
      {
        id: 'fix_decor_1',
        type: 'decor_plant',
        x: 2,
        y: 8,
        width: 1,
        height: 1,
        rotation: 0,
        currentStock: 0,
        maxStock: 0
      }
    ];

    // Starting Staff
    this.staff = [
      {
        id: 'staff_alice',
        name: 'Alice Cooper',
        role: 'cashier',
        salaryPerDay: 75,
        speedLevel: 1,
        assignedFixtureId: 'fix_reg_1',
        x: 6,
        y: 8,
        state: 'working'
      },
      {
        id: 'staff_bob',
        name: 'Bob Miller',
        role: 'restocker',
        salaryPerDay: 65,
        speedLevel: 1,
        x: 12,
        y: 3,
        state: 'idle'
      }
    ];
  }

  public update(rawDt: number) {
    if (this.gameSpeed === 0 || this.isDayFinished) return;

    // Clamp dt to maximum 0.05s as per Game Craft Guidelines
    const dt = Math.min(rawDt, 0.05) * this.gameSpeed;
    this.gameTimeSeconds += dt;

    // Advance Day/Night Clock: 12 store hours in 180 seconds at 1x
    const hourRate = (12 / 180);
    this.timeOfDay += dt * hourRate;

    if (this.timeOfDay >= 20.0) {
      this.finishDay();
      return;
    }

    // Process wholesale delivery orders
    this.updateWholesaleOrders();

    // Customer spawning and passive vending income
    if (this.isStoreOpen) {
      this.updateCustomerSpawning(dt);
      this.updateVending(dt);
    }

    // Update Customers
    this.updateCustomers(dt);

    // Update Staff
    this.updateStaff(dt);

    // Litter left on the floor slowly drags the store's reputation down
    if (this.litter.length > 0) {
      this.adjustReputation(-0.0005 * this.litter.length * dt);
    }

    // Update Floating notifications
    this.updateNotifications(dt);
  }

  // --- Store Atmosphere ---
  /** Decor, design upgrades and cleanliness combined. Higher comfort = more patient, more frequent shoppers. */
  public getComfort(): number {
    const decor = this.fixtures.reduce((sum, f) => sum + (getFixtureDef(f.type)?.comfortBonus ?? 0), 0);
    const design = this.upgradeLevel('upg_design') * 15;
    return decor + design - this.litter.length * 4;
  }

  private upgradeLevel(id: string): number {
    return this.upgrades.find(u => u.id === id)?.level ?? 0;
  }

  private adjustReputation(delta: number) {
    this.reputation = Math.min(5, Math.max(1, this.reputation + delta));
  }

  public getWholesaleDiscount(): number {
    return this.upgradeLevel('upg_supplier') * 0.15;
  }

  public getWarehouseCapacity(): number {
    return this.fixtures
      .filter(f => getFixtureDef(f.type)?.category === 'storage')
      .reduce((sum, f) => sum + f.maxStock, 0);
  }

  /** Units sitting in storage plus units already on their way. */
  public getWarehouseUsed(): number {
    const stored = Object.values(this.warehouseStock).reduce((sum, count) => sum + count, 0);
    const inbound = this.wholesaleOrders.filter(o => !o.isDelivered).reduce((sum, o) => sum + o.unitsTotal, 0);
    return stored + inbound;
  }

  // --- Day Planning: trend & goal ---
  private planDay() {
    const unlockedCategories = [
      ...new Set(this.products.filter(p => p.unlockLevel <= this.level).map(p => p.category))
    ];
    this.trendingCategory = unlockedCategories[(this.day - 1) % unlockedCategories.length];

    const pick = (this.day - 1) % 3;
    if (pick === 0) {
      const target = 12 + this.day * 3;
      this.dailyGoal = {
        description: `Serve ${target} happy shoppers`,
        metric: 'served',
        target,
        rewardCash: 80 + this.day * 20,
        rewardXp: 60 + this.day * 10,
        completed: false
      };
    } else if (pick === 1) {
      const target = 150 + this.day * 60;
      this.dailyGoal = {
        description: `Ring up $${target} in sales`,
        metric: 'revenue',
        target,
        rewardCash: 100 + this.day * 25,
        rewardXp: 60 + this.day * 10,
        completed: false
      };
    } else {
      this.dailyGoal = {
        description: 'Close the day with 4.5★ satisfaction',
        metric: 'satisfaction',
        target: 4.5,
        rewardCash: 120 + this.day * 25,
        rewardXp: 80 + this.day * 10,
        completed: false
      };
    }
  }

  private checkGoal(satisfaction?: number) {
    const goal = this.dailyGoal;
    if (goal.completed) return;
    const value =
      goal.metric === 'served' ? this.dailyStats.served :
      goal.metric === 'revenue' ? this.dailyStats.revenue :
      this.dailyStats.served >= 5 ? satisfaction ?? 0 : 0;
    if (value < goal.target) return;

    goal.completed = true;
    this.cash += goal.rewardCash;
    this.addXP(goal.rewardXp);
    sound.playLevelUp();
    this.addNotification(Math.floor(this.gridWidth / 2), 4, `🎯 Goal complete! +$${goal.rewardCash}`, '#f59e0b');
  }

  // --- Wholesale Orders & Inventory ---
  public placeWholesaleOrder(productId: string, quantityBoxes: number): { success: boolean; message: string } {
    const product = this.products.find(p => p.id === productId);
    if (!product) return { success: false, message: 'Invalid product' };
    if (product.unlockLevel > this.level) {
      sound.playErrorBuzz();
      return { success: false, message: `${product.name} unlocks at store level ${product.unlockLevel}` };
    }

    const unitsTotal = quantityBoxes * product.boxSize;
    const totalCost = Number((unitsTotal * product.unitCost * (1 - this.getWholesaleDiscount())).toFixed(2));

    const capacity = this.getWarehouseCapacity();
    const used = this.getWarehouseUsed();
    if (used + unitsTotal > capacity) {
      sound.playErrorBuzz();
      return {
        success: false,
        message: `Warehouse full (${used}/${capacity} units). Build more storage or restock shelves first.`
      };
    }

    if (this.cash < totalCost) {
      sound.playErrorBuzz();
      return { success: false, message: `Insufficient funds! Need $${totalCost.toFixed(2)}` };
    }

    this.cash -= totalCost;
    this.dailyStats.cogs += totalCost;

    const newOrder: WholesaleOrder = {
      id: `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      productId,
      quantityBoxes,
      unitsTotal,
      totalCost,
      orderedAtTime: this.gameTimeSeconds,
      arrivesAtTime: this.gameTimeSeconds + product.deliveryLeadTime,
      isDelivered: false
    };

    this.wholesaleOrders.push(newOrder);
    sound.playClick();
    this.addNotification(this.gridWidth - 3, 2, `Ordered ${unitsTotal}x ${product.name}!`, '#38bdf8');

    return { success: true, message: `Order placed! Arriving in ${product.deliveryLeadTime}s` };
  }

  private updateWholesaleOrders() {
    for (const order of this.wholesaleOrders) {
      if (!order.isDelivered && this.gameTimeSeconds >= order.arrivesAtTime) {
        order.isDelivered = true;
        // Add to warehouse inventory
        this.warehouseStock[order.productId] = (this.warehouseStock[order.productId] || 0) + order.unitsTotal;

        const prod = this.products.find(p => p.id === order.productId);
        sound.playPlaceThud();
        this.addNotification(
          this.gridWidth - 3,
          1,
          `📦 Delivered: ${order.unitsTotal}x ${prod?.name || 'Stock'}!`,
          '#4ade80'
        );
      }
    }
    // Keep only the most recent delivered orders around for the UI
    if (this.wholesaleOrders.length > 40) {
      this.wholesaleOrders = this.wholesaleOrders.filter(o => !o.isDelivered).concat(
        this.wholesaleOrders.filter(o => o.isDelivered).slice(-20)
      );
    }
  }

  // Restock shelf directly (player click or manual action)
  public manualRestockShelf(fixtureId: string): { success: boolean; amount: number } {
    const fixture = this.fixtures.find(f => f.id === fixtureId);
    if (!fixture || !fixture.assignedProductId) return { success: false, amount: 0 };

    const result = restockShelfFromWarehouse(fixture, this.warehouseStock, fixture.assignedProductId);
    if (result.restockedAmount > 0) {
      fixture.currentStock = result.updatedShelfStock;
      this.warehouseStock[fixture.assignedProductId] = result.updatedWarehouseCount;
      sound.playPlaceThud();
      this.addNotification(fixture.x, fixture.y, `+${result.restockedAmount} Stocked!`, '#22c55e');
      return { success: true, amount: result.restockedAmount };
    } else {
      sound.playErrorBuzz();
      return { success: false, amount: 0 };
    }
  }

  // --- Walking ---
  private isBlocked = (x: number, y: number) => isTileBlocked(this.fixtures, x, y);

  /** Plans a route around fixtures; falls back to walking straight if the target can't be reached. */
  private walkTo(walker: Walker, target: GridPoint) {
    walker.targetX = target.x;
    walker.targetY = target.y;
    const start = { x: Math.round(walker.x), y: Math.round(walker.y) };
    const route = findPath(start, target, this.gridWidth, this.gridHeight, this.isBlocked);
    walker.path = route ? smoothPath(start, route, this.isBlocked) : [target];
  }

  /** Moves along the planned route. Returns true once the final target is reached. */
  private stepAlong(walker: Walker, dt: number, speed: number): boolean {
    let budget = speed * dt;
    while (budget > 0) {
      const next = walker.path && walker.path.length > 0
        ? walker.path[0]
        : walker.targetX !== undefined && walker.targetY !== undefined
          ? { x: walker.targetX, y: walker.targetY }
          : null;
      if (!next) return true;

      const dx = next.x - walker.x;
      const dy = next.y - walker.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= budget) {
        walker.x = next.x;
        walker.y = next.y;
        budget -= dist;
        if (walker.path && walker.path.length > 0) {
          walker.path.shift();
          if (walker.path.length > 0) continue;
        }
        return true;
      }
      walker.x += (dx / dist) * budget;
      walker.y += (dy / dist) * budget;
      return false;
    }
    return false;
  }

  /** A free floor tile next to a fixture, preferring its front row. */
  private accessTile(fixture: PlacedFixture): GridPoint | null {
    const free = (p: GridPoint) =>
      p.x >= 0 && p.y >= 0 && p.x < this.gridWidth && p.y < this.gridHeight && !this.isBlocked(p.x, p.y);
    const front: GridPoint[] = [];
    for (let x = fixture.x; x < fixture.x + fixture.width; x++) front.push({ x, y: fixture.y + fixture.height });
    const openFront = front.filter(free);
    if (openFront.length > 0) return openFront[Math.floor(Math.random() * openFront.length)];

    const sides: GridPoint[] = [];
    for (let y = fixture.y; y < fixture.y + fixture.height; y++) {
      sides.push({ x: fixture.x + fixture.width, y }, { x: fixture.x - 1, y });
    }
    for (let x = fixture.x; x < fixture.x + fixture.width; x++) sides.push({ x, y: fixture.y - 1 });
    return sides.find(free) ?? null;
  }

  private doorTile(): GridPoint {
    return { x: this.doorX, y: this.gridHeight - 1 };
  }

  // --- Customer AI Simulation ---
  private think(cust: Customer, thought: string) {
    if (cust.currentThought !== thought) {
      cust.currentThought = thought;
      cust.thoughtTimer = 0;
    }
  }

  private updateCustomerSpawning(dt: number) {
    this.customerSpawnTimer += dt;

    // Spawn rate influenced by store reputation, comfort, marketing ads upgrade, and time of day (lunch 12-14 and evening 17-19)
    const adsBonus = 1 + this.upgradeLevel('upg_ads') * 0.35;
    const isPeakHour = (this.timeOfDay >= 12 && this.timeOfDay <= 14) || (this.timeOfDay >= 17 && this.timeOfDay <= 19);
    const peakMultiplier = isPeakHour ? 1.6 : 1.0;
    const comfortBonus = 1 + Math.max(0, this.getComfort()) / 200;

    const spawnInterval = Math.max(2.2, (6.5 / (this.reputation / 4.0)) / (adsBonus * peakMultiplier * comfortBonus));

    if (this.customerSpawnTimer >= spawnInterval && this.customers.length < 18) {
      this.customerSpawnTimer = 0;
      this.spawnCustomer();
    }
  }

  private spawnCustomer() {
    // Shoppers want what the shelves advertise, with trending products twice as popular
    const assignedProducts = [...new Set(this.fixtures.map(f => f.assignedProductId).filter(Boolean) as string[])];
    const weighted = assignedProducts.flatMap(id => {
      const product = this.products.find(p => p.id === id);
      return product?.category === this.trendingCategory ? [id, id] : [id];
    });

    const wishlist: { productId: string; quantity: number }[] = [];
    const pickCount = Math.min(assignedProducts.length, Math.floor(Math.random() * 3) + 1);
    while (wishlist.length < pickCount) {
      const productId = weighted[Math.floor(Math.random() * weighted.length)];
      if (!wishlist.some(w => w.productId === productId)) {
        wishlist.push({ productId, quantity: Math.floor(Math.random() * 2) + 1 });
      }
    }
    if (wishlist.length === 0) {
      // General window shopper
      wishlist.push({ productId: 'prod_apples', quantity: 1 });
    }

    // Shoppers bring enough for their list at fair prices, plus some slack for markups
    const fairTotal = wishlist.reduce((sum, w) => {
      const product = this.products.find(p => p.id === w.productId);
      return sum + (product ? product.suggestedPrice * w.quantity : 5);
    }, 0);

    const skinTones = ['#fed7aa', '#fcd34d', '#fbcfe8', '#d6d3d1', '#78350f', '#a16207'];
    const shirtColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    const names = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Charlie', 'Quinn'];

    const door = this.doorTile();

    const customer: Customer = {
      id: `cust_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      name: names[Math.floor(Math.random() * names.length)],
      skinTone: skinTones[Math.floor(Math.random() * skinTones.length)],
      shirtColor: shirtColors[Math.floor(Math.random() * shirtColors.length)],
      pantColor: '#1e293b',
      x: door.x,
      y: door.y,
      targetX: door.x,
      targetY: door.y - 1,
      state: 'entering',
      wishlist,
      cart: [],
      patience: 100,
      budget: Number((fairTotal * (1.05 + Math.random() * 0.65)).toFixed(2)),
      currentThought: 'Shopping...',
      thoughtTimer: 0,
      walkTimer: 0,
      serviceTimer: 0
    };

    this.customers.push(customer);
    sound.playDoorBell();
  }

  private updateCustomers(dt: number) {
    const patienceDecay = 1.5 / (1 + Math.max(0, this.getComfort()) / 80);

    for (let i = this.customers.length - 1; i >= 0; i--) {
      const cust = this.customers[i];
      cust.walkTimer += dt;
      cust.thoughtTimer += dt;
      const leaving = cust.state === 'leaving_happy' || cust.state === 'leaving_unhappy';

      // Patience decay
      if (!leaving) {
        cust.patience -= dt * patienceDecay;
        if (cust.patience <= 0) {
          this.sendAway(cust, '❌ Too slow!', false);
        }
      }

      if (cust.state === 'heading_to_checkout' || cust.state === 'queuing') {
        this.updateCheckoutLine(cust, dt);
      }

      const arrived = this.stepAlong(cust, dt, CUSTOMER_SPEED);
      if (arrived) {
        if (cust.state === 'leaving_happy' || cust.state === 'leaving_unhappy') {
          // Reached the exit door
          this.customers.splice(i, 1);
          continue;
        }
        this.processCustomerArrival(cust);
      }

      // Now and then a browsing shopper drops a wrapper or spills a drink
      if (!cust.hasLittered && cust.state === 'browsing' && this.litter.length < MAX_LITTER && Math.random() < dt * 0.015) {
        cust.hasLittered = true;
        this.dropLitter(Math.round(cust.x), Math.round(cust.y));
      }
    }
  }

  private processCustomerArrival(cust: Customer) {
    if (cust.state === 'entering') {
      cust.state = 'browsing';
      this.routeCustomerToNextWishlistItem(cust);
    } else if (cust.state === 'browsing') {
      // Arrived at shelf
      const shelf = this.fixtures.find(f => f.id === cust.targetFixtureId);
      const nextWish = cust.wishlist[0];

      if (shelf && shelf.assignedProductId && nextWish) {
        const product = this.products.find(p => p.id === shelf.assignedProductId);

        if (shelf.currentStock > 0 && product) {
          // Price Elasticity Check! Trending products can carry a 20% premium
          const fairPrice = product.suggestedPrice * (product.category === this.trendingCategory ? 1.2 : 1);
          const elasticity = calculatePricingElasticity(product.currentPrice, fairPrice, cust.budget);
          const willBuy = Math.random() <= elasticity.purchaseProbability;

          if (willBuy) {
            const affordable = Math.max(1, Math.floor(cust.budget / Math.max(product.currentPrice, 0.01)));
            const takeQty = Math.min(nextWish.quantity, shelf.currentStock, affordable);
            shelf.currentStock -= takeQty;
            cust.budget -= takeQty * product.currentPrice;
            cust.cart.push({
              productId: product.id,
              quantity: takeQty,
              pricePaid: product.currentPrice
            });
            this.think(cust, `🛒 Got ${product.icon}`);
            cust.patience = Math.min(100, cust.patience + 15); // restored patience on finding item
          } else {
            // Too expensive!
            this.think(cust, elasticity.reaction === 'ripoff' ? '😠 Rip-off!' : '❌ Overpriced!');
            cust.patience -= 15;
            this.adjustReputation(-0.01);
          }
        } else {
          // Out of stock
          this.think(cust, '⚠️ Empty shelf!');
          cust.patience -= 20;
        }
        cust.wishlist.shift();
      } else if (nextWish && !shelf) {
        // The shelf was removed while they walked over
        cust.wishlist.shift();
      }

      this.continueShopping(cust);
    } else if (cust.state === 'heading_to_checkout') {
      cust.state = 'queuing';
      this.think(cust, '⌛ In line');
    }
  }

  private continueShopping(cust: Customer) {
    if (cust.state !== 'browsing') return;
    if (cust.wishlist.length > 0) {
      this.routeCustomerToNextWishlistItem(cust);
    } else if (cust.cart.length > 0) {
      this.routeCustomerToCheckout(cust);
    } else {
      this.sendAway(cust, '❌ Found nothing!', false);
    }
  }

  private routeCustomerToNextWishlistItem(cust: Customer) {
    while (cust.wishlist.length > 0) {
      const nextItem = cust.wishlist[0];
      // Prefer a stocked shelf, then the nearest one
      const shelves = this.fixtures
        .filter(f => f.assignedProductId === nextItem.productId)
        .sort((a, b) =>
          Number(b.currentStock > 0) - Number(a.currentStock > 0) ||
          Math.hypot(a.x - cust.x, a.y - cust.y) - Math.hypot(b.x - cust.x, b.y - cust.y)
        );
      const shelf = shelves[0];
      const spot = shelf ? this.accessTile(shelf) : null;

      if (shelf && spot) {
        cust.targetFixtureId = shelf.id;
        this.walkTo(cust, spot);
        const prod = this.products.find(p => p.id === nextItem.productId);
        this.think(cust, `Looking for ${prod?.icon || 'item'}`);
        return;
      }
      // Not sold here (or the shelf is boxed in)
      this.think(cust, '❓ Not sold here');
      cust.wishlist.shift();
    }
    this.continueShopping(cust);
  }

  private routeCustomerToCheckout(cust: Customer) {
    const checkouts = this.fixtures.filter(f => f.type.startsWith('checkout_'));
    if (checkouts.length === 0) {
      this.sendAway(cust, '❌ No registers!', false);
      return;
    }

    // Pick the line that will be served soonest
    const waitScore = (c: PlacedFixture) => ((c.queue || []).length + 1) * this.checkoutSecondsPerItem(c);
    const bestCheckout = checkouts.reduce((best, c) => (waitScore(c) < waitScore(best) ? c : best));

    this.leaveQueue(cust);
    cust.state = 'heading_to_checkout';
    cust.assignedCheckoutId = bestCheckout.id;
    cust.serviceTimer = 0;
    bestCheckout.queue = bestCheckout.queue || [];
    bestCheckout.queue.push(cust.id);
    this.walkTo(cust, this.queueSpot(bestCheckout, bestCheckout.queue.length - 1));
    this.think(cust, 'Heading to checkout');
  }

  /** Where the n-th person in line stands: free tiles in front of the register, towards the door. */
  private queueSpot(register: PlacedFixture, index: number): GridPoint {
    const spots: GridPoint[] = [];
    for (let y = register.y + register.height; y < this.gridHeight && spots.length <= index; y++) {
      const x = [register.x, register.x + 1].find(cx => cx < this.gridWidth && !this.isBlocked(cx, y));
      if (x === undefined) break;
      spots.push({ x, y });
    }
    if (spots.length === 0) return { x: register.x, y: register.y + register.height };
    return spots[Math.min(index, spots.length - 1)];
  }

  private leaveQueue(cust: Customer) {
    for (const f of this.fixtures) {
      if (f.queue && f.queue.includes(cust.id)) {
        f.queue = f.queue.filter(id => id !== cust.id);
      }
    }
  }

  /** Keeps a shopper's place in line up to date and serves whoever is at the front. */
  private updateCheckoutLine(cust: Customer, dt: number) {
    const reg = this.fixtures.find(f => f.id === cust.assignedCheckoutId);
    if (!reg || !reg.queue || !reg.queue.includes(cust.id)) {
      // Register dismantled or line lost: find another one
      this.routeCustomerToCheckout(cust);
      return;
    }

    const index = reg.queue.indexOf(cust.id);
    const spot = this.queueSpot(reg, index);
    if (cust.targetX !== spot.x || cust.targetY !== spot.y) {
      // The line moved up
      this.walkTo(cust, spot);
    }

    const atSpot = Math.abs(cust.x - spot.x) < 0.05 && Math.abs(cust.y - spot.y) < 0.05;
    if (index === 0 && atSpot && cust.state === 'queuing') {
      cust.serviceTimer += dt;
      if (cust.serviceTimer >= this.checkoutDuration(reg, cust)) {
        this.completeCheckout(cust, reg);
      }
    }
  }

  private checkoutSecondsPerItem(reg: PlacedFixture): number {
    if (reg.type === 'checkout_self') return 0.35;
    const perItem = reg.type === 'checkout_express' ? 0.18 : 0.3;
    return reg.assignedStaffId ? perItem / (1 + 0.2 * this.upgradeLevel('upg_training')) : perItem * 2.5;
  }

  /** Seconds to scan a cart: express registers are 40% quicker, and an unstaffed desk is slow. */
  private checkoutDuration(reg: PlacedFixture, cust: Customer): number {
    const items = cust.cart.reduce((n, item) => n + item.quantity, 0);
    const base = reg.type === 'checkout_self' ? 1.2 : reg.type === 'checkout_express' ? 0.6 : 1.0;
    const staffFactor = reg.type === 'checkout_self' ? 1 : reg.assignedStaffId ? 1 : 2.5;
    return base * staffFactor + this.checkoutSecondsPerItem(reg) * items;
  }

  private completeCheckout(cust: Customer, reg: PlacedFixture) {
    let totalBill = 0;
    cust.cart.forEach(item => {
      totalBill += item.pricePaid * item.quantity;
      this.dailyStats.productSalesCount[item.productId] =
        (this.dailyStats.productSalesCount[item.productId] || 0) + item.quantity;
    });

    // Add Tip if thrilled
    const tip = cust.patience > 70 ? Math.floor(totalBill * 0.15) : 0;
    const grandTotal = totalBill + tip;

    this.cash += grandTotal;
    this.dailyStats.revenue += grandTotal;
    this.dailyStats.served++;
    this.dailyStats.satisfactionSum += cust.patience > 70 ? 5 : cust.patience > 40 ? 4 : 3;
    this.adjustReputation(tip > 0 ? 0.02 : 0.01);

    // Add XP
    this.addXP(Math.max(10, Math.floor(grandTotal * 0.2)));

    // Audio & Visual juice
    sound.playChaChing();
    this.addNotification(reg.x, reg.y - 0.5, `+$${grandTotal.toFixed(2)}${tip > 0 ? ' (Tip!)' : ''}`, '#22c55e');

    this.sendAway(cust, tip > 0 ? '⭐ Amazing shop!' : '💸 Thank you!', true);
    this.checkGoal();
  }

  /** Every shopper leaves through here: frees their place in line and logs unhappy exits. */
  private sendAway(cust: Customer, thought: string, happy: boolean) {
    this.leaveQueue(cust);
    cust.assignedCheckoutId = null;
    cust.state = happy ? 'leaving_happy' : 'leaving_unhappy';
    this.think(cust, thought);
    this.walkTo(cust, this.doorTile());
    if (!happy) {
      this.dailyStats.lost++;
      this.dailyStats.satisfactionSum += 1;
      this.adjustReputation(-0.04);
    }
  }

  // --- Litter & Cleaning ---
  private dropLitter(x: number, y: number) {
    if (this.isBlocked(x, y) || this.litter.some(l => l.x === x && l.y === y)) return;
    this.litter.push({
      id: `litter_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      x,
      y,
      kind: Math.random() < 0.5 ? 'wrapper' : 'spill'
    });
  }

  /** Player tap on a dirty tile: sweep it up by hand. */
  public cleanLitterAt(x: number, y: number): boolean {
    const index = this.litter.findIndex(l => l.x === x && l.y === y);
    if (index === -1) return false;
    this.litter.splice(index, 1);
    sound.playClick();
    this.addNotification(x, y, '✨ Clean!', '#a5f3fc');
    return true;
  }

  private updateVending(dt: number) {
    const machines = this.fixtures.filter(f => f.type === 'decor_vending');
    if (machines.length === 0) return;
    this.vendingTimer += dt;
    if (this.vendingTimer < VENDING_INTERVAL) return;
    this.vendingTimer = 0;
    for (const machine of machines) {
      const takings = 5 + Math.floor(Math.random() * 11);
      this.cash += takings;
      this.dailyStats.revenue += takings;
      this.addNotification(machine.x, machine.y, `🕹️ +$${takings}`, '#f472b6');
    }
    this.checkGoal();
  }

  // --- Staff AI Automation ---
  private updateStaff(dt: number) {
    this.syncCashiers();
    const speedBonus = 1 + 0.2 * this.upgradeLevel('upg_training');

    for (const member of this.staff) {
      if (member.role === 'cashier') {
        const reg = this.fixtures.find(f => f.id === member.assignedFixtureId);
        if (reg) {
          // Stand beside the register, on the side facing the camera when possible
          const beside = [
            { x: reg.x + reg.width, y: reg.y },
            { x: reg.x - 1, y: reg.y },
            { x: reg.x, y: reg.y - 1 }
          ].find(p => p.x >= 0 && p.y >= 0 && p.x < this.gridWidth && !this.isBlocked(p.x, p.y));
          const post = beside ?? { x: reg.x, y: reg.y - 1 };
          member.x = post.x;
          member.y = post.y;
          member.state = (reg.queue && reg.queue.length > 0) ? 'working' : 'idle';
        } else {
          member.state = 'idle';
        }
      } else if (member.role === 'restocker') {
        this.updateRestockerAI(member, dt, speedBonus);
      } else {
        this.updateCleanerAI(member, dt, speedBonus);
      }
    }
  }

  /** Keeps every cashier on a register that needs one, and forgets registers that were sold. */
  private syncCashiers() {
    for (const f of this.fixtures) {
      if (f.assignedStaffId && !this.staff.some(s => s.id === f.assignedStaffId && s.assignedFixtureId === f.id)) {
        f.assignedStaffId = null;
      }
    }
    for (const member of this.staff) {
      if (member.role !== 'cashier') continue;
      const reg = this.fixtures.find(f => f.id === member.assignedFixtureId);
      if (reg && reg.assignedStaffId === member.id) continue;
      member.assignedFixtureId = null;
      const openReg = this.fixtures.find(
        f => f.type.startsWith('checkout_') && f.type !== 'checkout_self' && !f.assignedStaffId
      );
      if (openReg) {
        member.assignedFixtureId = openReg.id;
        openReg.assignedStaffId = member.id;
      }
    }
  }

  private nearestStorage(from: GridPoint): PlacedFixture | undefined {
    return this.fixtures
      .filter(f => f.type.startsWith('storage_'))
      .sort((a, b) => Math.hypot(a.x - from.x, a.y - from.y) - Math.hypot(b.x - from.x, b.y - from.y))[0];
  }

  private updateRestockerAI(member: StaffMember, dt: number, speedBonus: number) {
    const walkSpeed = STAFF_SPEED * member.speedLevel * speedBonus;
    const targetShelf = this.fixtures.find(f => f.id === member.assignedFixtureId);

    if (member.state === 'idle') {
      // Emptiest shelf first, skipping ones another clerk is already handling
      const claimed = new Set(this.staff.filter(s => s !== member).map(s => s.assignedFixtureId));
      const lowShelf = this.fixtures
        .filter(f =>
          f.assignedProductId &&
          f.currentStock <= f.maxStock * 0.5 &&
          (this.warehouseStock[f.assignedProductId] || 0) > 0 &&
          !claimed.has(f.id)
        )
        .sort((a, b) => a.currentStock / a.maxStock - b.currentStock / b.maxStock)[0];

      const warehouse = lowShelf ? this.nearestStorage(member) : undefined;
      const pickup = warehouse ? this.accessTile(warehouse) : null;
      if (lowShelf && pickup) {
        member.assignedFixtureId = lowShelf.id;
        member.carriedProductId = lowShelf.assignedProductId;
        member.carriedAmount = 0;
        member.state = 'walking';
        this.walkTo(member, pickup);
      }
      return;
    }

    if (member.state === 'carrying_box' && !targetShelf) {
      // Shelf sold while carrying: put the stock back
      this.returnCarriedStock(member);
      return;
    }

    if (!this.stepAlong(member, dt, walkSpeed)) return;

    if (member.state === 'walking' && member.carriedProductId && !member.carriedAmount) {
      // Arrived at warehouse to pick up box
      const space = targetShelf ? targetShelf.maxStock - targetShelf.currentStock : 0;
      const available = this.warehouseStock[member.carriedProductId] || 0;
      const pickup = Math.min(24, space, available);
      const dropOff = targetShelf ? this.accessTile(targetShelf) : null;

      if (pickup > 0 && dropOff) {
        this.warehouseStock[member.carriedProductId] -= pickup;
        member.carriedAmount = pickup;
        member.state = 'carrying_box';
        this.walkTo(member, dropOff);
      } else {
        this.returnCarriedStock(member);
      }
    } else if (member.state === 'carrying_box' && targetShelf && member.carriedProductId && member.carriedAmount) {
      // Arrived at shelf to restock
      const added = Math.min(member.carriedAmount, targetShelf.maxStock - targetShelf.currentStock);
      targetShelf.currentStock += added;
      member.carriedAmount -= added;
      sound.playPlaceThud();
      this.addNotification(targetShelf.x, targetShelf.y, `+${added} Stock Restocked!`, '#4ade80');
      this.returnCarriedStock(member);
    } else {
      this.returnCarriedStock(member);
    }
  }

  private returnCarriedStock(member: StaffMember) {
    if (member.carriedProductId && member.carriedAmount) {
      this.warehouseStock[member.carriedProductId] =
        (this.warehouseStock[member.carriedProductId] || 0) + member.carriedAmount;
    }
    member.carriedAmount = 0;
    member.carriedProductId = null;
    member.assignedFixtureId = null;
    member.path = [];
    member.state = 'idle';
  }

  private updateCleanerAI(member: StaffMember, dt: number, speedBonus: number) {
    const target = this.litter.find(l => l.id === member.targetLitterId);

    if (member.state === 'idle') {
      const claimed = new Set(this.staff.filter(s => s !== member).map(s => s.targetLitterId));
      const nearest = this.litter
        .filter(l => !claimed.has(l.id))
        .sort((a, b) => Math.hypot(a.x - member.x, a.y - member.y) - Math.hypot(b.x - member.x, b.y - member.y))[0];
      if (nearest) {
        member.targetLitterId = nearest.id;
        member.state = 'walking';
        this.walkTo(member, nearest);
      }
      return;
    }

    if (!target) {
      // Someone else already cleaned it up
      member.targetLitterId = null;
      member.state = 'idle';
      return;
    }

    if (member.state === 'walking') {
      if (this.stepAlong(member, dt, STAFF_SPEED * member.speedLevel * speedBonus)) {
        member.state = 'working';
        member.workTimer = 0;
      }
    } else if (member.state === 'working') {
      member.workTimer = (member.workTimer ?? 0) + dt * speedBonus;
      if (member.workTimer >= 1.2) {
        this.litter = this.litter.filter(l => l.id !== target.id);
        this.addNotification(target.x, target.y, '✨ Clean!', '#a5f3fc');
        member.targetLitterId = null;
        member.state = 'idle';
      }
    }
  }

  // --- XP & Progression ---
  public addXP(amount: number) {
    this.xp += amount;
    while (this.xp >= this.xpNeeded) {
      this.level++;
      this.xp -= this.xpNeeded;
      this.xpNeeded = Math.floor(this.xpNeeded * 1.5);
      sound.playLevelUp();
      this.addNotification(
        Math.floor(this.gridWidth / 2),
        Math.floor(this.gridHeight / 2),
        `🎉 LEVEL UP: LEVEL ${this.level}!`,
        '#f59e0b'
      );
      const unlocked = this.products.filter(p => p.unlockLevel === this.level);
      if (unlocked.length > 0) {
        this.addNotification(
          Math.floor(this.gridWidth / 2),
          Math.floor(this.gridHeight / 2) + 1,
          `New stock: ${unlocked.map(p => p.icon).join(' ')}`,
          '#38bdf8'
        );
      }
    }
  }

  // --- Day Finish & Financial Ledger ---
  public finishDay() {
    this.isDayFinished = true;
    this.isStoreOpen = false;

    // Calculate staff wages
    let totalWages = 0;
    this.staff.forEach(s => {
      totalWages += s.salaryPerDay;
    });

    this.cash -= totalWages;

    // Determine top selling product
    let topProd = 'None';
    let maxSold = 0;
    Object.entries(this.dailyStats.productSalesCount).forEach(([pId, qty]) => {
      if (qty > maxSold) {
        maxSold = qty;
        const p = this.products.find(prod => prod.id === pId);
        topProd = p ? `${p.name} (${qty} sold)` : pId;
      }
    });

    const ledger = calculateDailySummary(
      this.day,
      this.dailyStats.revenue,
      this.dailyStats.cogs,
      totalWages,
      0,
      this.dailyStats.served,
      this.dailyStats.lost,
      this.dailyStats.satisfactionSum,
      topProd
    );

    this.checkGoal(ledger.satisfactionScore);
    ledger.goal = { ...this.dailyGoal };

    // Word of mouth: the day's satisfaction pulls the store's reputation towards it
    this.reputation = Math.min(5, Math.max(1, this.reputation * 0.8 + ledger.satisfactionScore * 0.2));

    this.latestLedger = ledger;
    this.dailyLedgers.push(ledger);
    this.save();
  }

  public startNextDay() {
    this.day++;
    this.timeOfDay = 8.0;
    this.isStoreOpen = true;
    this.isDayFinished = false;
    this.latestLedger = null;

    // Clear active customer queue
    this.customers = [];
    this.fixtures.forEach(f => {
      if (f.queue) f.queue = [];
    });
    this.staff.forEach(s => {
      if (s.role !== 'cashier') this.returnCarriedStock(s);
      s.targetLitterId = null;
    });

    // Reset daily accumulator
    this.dailyStats = {
      revenue: 0,
      cogs: 0,
      served: 0,
      lost: 0,
      satisfactionSum: 0,
      productSalesCount: {}
    };

    this.planDay();
    this.save();
  }

  // --- Building & Editing Mechanics ---
  private gridBounds(): GridBounds {
    return { width: this.gridWidth, height: this.gridHeight, minX: 1, minY: 1, doorX: this.doorX };
  }

  public canPlace(type: string, x: number, y: number, rotation: number) {
    const def = getFixtureDef(type);
    if (!def) return { allowed: false, reason: 'Invalid fixture definition' };
    const { w, h } = getRotatedDimensions(def.width, def.height, rotation);
    const check = canPlaceFixture(this.gridBounds(), this.fixtures, x, y, w, h);
    if (!check.allowed) return check;
    // Nobody may be boxed in: flood the floor from the door and make sure every fixture,
    // including the new one, still touches a reachable tile
    const occupied = [...this.fixtures, { x, y, width: w, height: h } as PlacedFixture];
    const reached = new Set<number>();
    const door = this.doorTile();
    const frontier: GridPoint[] = [door];
    reached.add(door.y * this.gridWidth + door.x);
    while (frontier.length > 0) {
      const { x: cx, y: cy } = frontier.pop()!;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx;
        const ny = cy + dy;
        const key = ny * this.gridWidth + nx;
        if (nx < 0 || ny < 0 || nx >= this.gridWidth || ny >= this.gridHeight) continue;
        if (reached.has(key) || isTileBlocked(occupied, nx, ny)) continue;
        reached.add(key);
        frontier.push({ x: nx, y: ny });
      }
    }
    const touchesAisle = (f: PlacedFixture) => {
      for (let tx = f.x - 1; tx <= f.x + f.width; tx++) {
        for (let ty = f.y - 1; ty <= f.y + f.height; ty++) {
          const onEdge = tx === f.x - 1 || tx === f.x + f.width || ty === f.y - 1 || ty === f.y + f.height;
          const corner = (tx === f.x - 1 || tx === f.x + f.width) && (ty === f.y - 1 || ty === f.y + f.height);
          if (onEdge && !corner && reached.has(ty * this.gridWidth + tx)) return true;
        }
      }
      return false;
    };
    if (!occupied.every(touchesAisle)) {
      return { allowed: false, reason: 'Would block the aisle to a fixture' };
    }
    return { allowed: true };
  }

  public buildFixture(type: string, x: number, y: number, rotation: number): { success: boolean; message: string } {
    const def = getFixtureDef(type);
    if (!def) return { success: false, message: 'Invalid fixture definition' };

    if (this.cash < def.cost) {
      sound.playErrorBuzz();
      return { success: false, message: `Need $${def.cost}! You have $${this.cash.toFixed(2)}` };
    }

    const check = this.canPlace(type, x, y, rotation);
    if (!check.allowed) {
      sound.playErrorBuzz();
      return { success: false, message: check.reason || 'Placement blocked' };
    }

    const { w, h } = getRotatedDimensions(def.width, def.height, rotation);
    this.cash -= def.cost;

    const newFixture: PlacedFixture = {
      id: `fix_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type,
      x,
      y,
      width: w,
      height: h,
      rotation,
      currentStock: 0,
      maxStock: def.maxStock || 0,
      queue: def.category === 'checkout' ? [] : undefined
    };

    // If shelf, pre-assign a compatible product the store can already sell
    if (def.compatibleCategories && def.compatibleCategories.length > 0) {
      const match = this.products.find(p => def.compatibleCategories?.includes(p.category) && p.unlockLevel <= this.level);
      if (match) newFixture.assignedProductId = match.id;
    }

    this.fixtures.push(newFixture);
    // Litter under new furniture is swept away, and walkers re-plan around it
    this.litter = this.litter.filter(l => !isTileBlocked([newFixture], l.x, l.y));
    this.replanWalkers();
    sound.playPlaceThud();
    this.addNotification(x, y, `+${def.name} Built!`, '#38bdf8');
    this.addXP(25);

    return { success: true, message: `${def.name} successfully built!` };
  }

  private replanWalkers() {
    for (const walker of [...this.customers, ...this.staff]) {
      if (walker.targetX !== undefined && walker.targetY !== undefined && walker.path && walker.path.length > 0) {
        this.walkTo(walker, { x: walker.targetX, y: walker.targetY });
      }
    }
  }

  public dismantleFixture(fixtureId: string): { success: boolean; refund: number } {
    const idx = this.fixtures.findIndex(f => f.id === fixtureId);
    if (idx === -1) return { success: false, refund: 0 };

    const fixture = this.fixtures[idx];
    const def = getFixtureDef(fixture.type);
    const refund = def ? Math.floor(def.cost * 0.6) : 50;

    // Return current shelf stock to warehouse
    if (fixture.assignedProductId && fixture.currentStock > 0) {
      this.warehouseStock[fixture.assignedProductId] =
        (this.warehouseStock[fixture.assignedProductId] || 0) + fixture.currentStock;
    }

    this.cash += refund;
    this.fixtures.splice(idx, 1);
    this.replanWalkers();
    sound.playPlaceThud();
    this.addNotification(fixture.x, fixture.y, `Dismantled (+$${refund})`, '#eab308');

    return { success: true, refund };
  }

  public assignProductToShelf(fixtureId: string, productId: string | null) {
    const fixture = this.fixtures.find(f => f.id === fixtureId);
    if (!fixture) return;

    // Return previous stock to warehouse if changing
    if (fixture.assignedProductId && fixture.assignedProductId !== productId && fixture.currentStock > 0) {
      this.warehouseStock[fixture.assignedProductId] =
        (this.warehouseStock[fixture.assignedProductId] || 0) + fixture.currentStock;
      fixture.currentStock = 0;
    }

    fixture.assignedProductId = productId;
    sound.playClick();
  }

  // --- Staff Management ---
  public hireStaff(role: 'cashier' | 'restocker' | 'cleaner'): { success: boolean; message: string } {
    const hiringCost = role === 'cashier' ? 150 : role === 'restocker' ? 120 : 100;
    const salary = role === 'cashier' ? 75 : role === 'restocker' ? 65 : 50;

    if (this.cash < hiringCost) {
      sound.playErrorBuzz();
      return { success: false, message: `Need $${hiringCost} hiring fee!` };
    }

    this.cash -= hiringCost;
    const names = ['Emma', 'Liam', 'Noah', 'Olivia', 'James', 'Ava', 'Lucas', 'Mia'];
    const door = this.doorTile();
    const newStaff: StaffMember = {
      id: `staff_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: names[Math.floor(Math.random() * names.length)],
      role,
      salaryPerDay: salary,
      speedLevel: 1,
      x: door.x,
      y: door.y - 1,
      state: 'idle'
    };

    this.staff.push(newStaff);
    // Cashiers take the first free register now, or as soon as one is built
    this.syncCashiers();
    sound.playChaChing();
    this.addNotification(newStaff.x, newStaff.y, `Hired ${newStaff.name} (${role})!`, '#38bdf8');

    const waiting = role === 'cashier' && !newStaff.assignedFixtureId ? ' Build a register for them to work at.' : '';
    return { success: true, message: `Hired ${newStaff.name} successfully!${waiting}` };
  }

  public fireStaff(staffId: string) {
    const idx = this.staff.findIndex(s => s.id === staffId);
    if (idx === -1) return;

    const s = this.staff[idx];
    if (s.role === 'restocker') this.returnCarriedStock(s);
    if (s.assignedFixtureId) {
      const fix = this.fixtures.find(f => f.id === s.assignedFixtureId);
      if (fix && fix.assignedStaffId === s.id) fix.assignedStaffId = null;
    }

    this.staff.splice(idx, 1);
    sound.playClick();
  }

  // --- Store Upgrades ---
  public getUpgradeCost(upg: StoreUpgrade): number {
    return Math.floor(upg.cost * Math.pow(1.5, upg.level));
  }

  public purchaseUpgrade(upgradeId: string): { success: boolean; message: string } {
    const upg = this.upgrades.find(u => u.id === upgradeId);
    if (!upg || upg.level >= upg.maxLevel) return { success: false, message: 'Cannot upgrade' };

    const cost = this.getUpgradeCost(upg);
    if (this.cash < cost) {
      sound.playErrorBuzz();
      return { success: false, message: `Need $${cost}!` };
    }

    this.cash -= cost;
    upg.level++;

    if (upg.effectType === 'floor_expansion') {
      this.gridWidth += 2;
    }

    sound.playLevelUp();
    this.addNotification(Math.floor(this.gridWidth / 2), 3, `Upgrade: ${upg.name}!`, '#f59e0b');
    return { success: true, message: `${upg.name} purchased!` };
  }

  // --- Notifications ---
  public addNotification(x: number, y: number, text: string, color: string = '#38bdf8') {
    this.notifications.push({
      id: `notif_${Date.now()}_${Math.random()}`,
      x,
      y,
      text,
      color,
      lifetime: 1.0
    });
  }

  private updateNotifications(dt: number) {
    for (let i = this.notifications.length - 1; i >= 0; i--) {
      const n = this.notifications[i];
      n.lifetime -= dt * 0.9;
      if (n.lifetime <= 0) {
        this.notifications.splice(i, 1);
      }
    }
  }

  // --- Save & Load ---
  /** Everything needed to resume the store later. Shoppers in the aisles are not kept. */
  public toSaveData() {
    const staff = this.staff.map(s => ({
      ...s,
      path: [],
      targetX: undefined,
      targetY: undefined,
      state: s.role === 'cashier' ? s.state : ('idle' as const),
      carriedAmount: 0,
      carriedProductId: null,
      targetLitterId: null,
      assignedFixtureId: s.role === 'cashier' ? s.assignedFixtureId : null
    }));
    const warehouseStock = { ...this.warehouseStock };
    for (const s of this.staff) {
      if (s.carriedProductId && s.carriedAmount) {
        warehouseStock[s.carriedProductId] = (warehouseStock[s.carriedProductId] || 0) + s.carriedAmount;
      }
    }
    return {
      version: 1,
      cash: this.cash,
      level: this.level,
      xp: this.xp,
      xpNeeded: this.xpNeeded,
      reputation: this.reputation,
      day: this.day,
      timeOfDay: this.timeOfDay,
      isStoreOpen: this.isStoreOpen,
      gridWidth: this.gridWidth,
      gridHeight: this.gridHeight,
      gameTimeSeconds: this.gameTimeSeconds,
      fixtures: this.fixtures.map(f => ({ ...f, queue: f.queue ? [] : undefined })),
      warehouseStock,
      prices: Object.fromEntries(this.products.map(p => [p.id, p.currentPrice])),
      staff,
      wholesaleOrders: this.wholesaleOrders,
      litter: this.litter,
      dailyLedgers: this.dailyLedgers,
      upgradeLevels: Object.fromEntries(this.upgrades.map(u => [u.id, u.level])),
      dailyStats: this.dailyStats,
      dailyGoal: this.dailyGoal,
      trendingCategory: this.trendingCategory,
      isDayFinished: this.isDayFinished,
      latestLedger: this.latestLedger
    };
  }

  public static fromSaveData(data: ReturnType<GameEngine['toSaveData']>): GameEngine {
    const engine = new GameEngine();
    const { prices, upgradeLevels, version, ...state } = data;
    Object.assign(engine, state);
    // Catalogue and upgrade definitions come from the code, so new ones appear in old saves
    engine.products.forEach(p => {
      if (typeof prices[p.id] === 'number') p.currentPrice = prices[p.id];
    });
    engine.upgrades.forEach(u => {
      u.level = Math.min(u.maxLevel, upgradeLevels[u.id] ?? 0);
    });
    engine.customers = [];
    return engine;
  }

  public save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.toSaveData()));
    } catch {
      // Storage unavailable (private mode or tests): the game still runs
    }
  }

  public static load(): GameEngine | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? GameEngine.fromSaveData(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  }

  public static savedDay(): number | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? (JSON.parse(raw).day as number) : null;
    } catch {
      return null;
    }
  }

  public static clearSave() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      // ignore
    }
  }

  // Snapshot for React UI updates
  public getSnapshot(): GameSnapshot {
    return {
      cash: this.cash,
      level: this.level,
      xp: this.xp,
      xpNeeded: this.xpNeeded,
      reputation: this.reputation,
      day: this.day,
      timeOfDay: this.timeOfDay,
      isStoreOpen: this.isStoreOpen,
      gameSpeed: this.gameSpeed,
      gridWidth: this.gridWidth,
      gridHeight: this.gridHeight,
      fixtures: this.fixtures,
      warehouseStock: { ...this.warehouseStock },
      warehouseUsed: this.getWarehouseUsed(),
      warehouseCapacity: this.getWarehouseCapacity(),
      wholesaleDiscount: this.getWholesaleDiscount(),
      products: this.products,
      staff: this.staff,
      wholesaleOrders: this.wholesaleOrders,
      customersCount: this.customers.length,
      litterCount: this.litter.length,
      comfort: this.getComfort(),
      trendingCategory: this.trendingCategory,
      dailyGoal: { ...this.dailyGoal },
      dailyStats: {
        revenue: this.dailyStats.revenue,
        cogs: this.dailyStats.cogs,
        served: this.dailyStats.served,
        lost: this.dailyStats.lost,
        satisfactionSum: this.dailyStats.satisfactionSum
      },
      dailyLedgers: this.dailyLedgers,
      upgrades: this.upgrades,
      isDayFinished: this.isDayFinished,
      latestLedger: this.latestLedger
    };
  }
}
