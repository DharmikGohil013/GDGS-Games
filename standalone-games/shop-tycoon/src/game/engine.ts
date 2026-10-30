/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Product,
  PlacedFixture,
  WholesaleOrder,
  StaffMember,
  Customer,
  FloatingNotification,
  DailyLedger,
  StoreUpgrade
} from './types';
import { INITIAL_PRODUCTS } from './catalog';
import { getFixtureDef } from './furnitureCatalog';
import {
  canPlaceFixture,
  getRotatedDimensions,
  calculatePricingElasticity,
  restockShelfFromWarehouse,
  calculateDailySummary,
  GridBounds
} from './logic';
import { sound } from './audio';

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
  products: Product[];
  staff: StaffMember[];
  wholesaleOrders: WholesaleOrder[];
  customersCount: number;
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

  public fixtures: PlacedFixture[] = [];
  public warehouseStock: Record<string, number> = {};
  public products: Product[] = [];
  public staff: StaffMember[] = [];
  public wholesaleOrders: WholesaleOrder[] = [];
  public customers: Customer[] = [];
  public notifications: FloatingNotification[] = [];
  public dailyLedgers: DailyLedger[] = [];

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
    }
  ];

  // Internal timers
  private customerSpawnTimer: number = 0;
  private autoRestockCheckTimer: number = 0;
  private gameTimeSeconds: number = 0;

  constructor() {
    this.initDefaultStore();
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
        currentStock: 120,
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
        x: 4,
        y: 7.5,
        state: 'working'
      },
      {
        id: 'staff_bob',
        name: 'Bob Miller',
        role: 'restocker',
        salaryPerDay: 65,
        speedLevel: 1,
        x: 10.5,
        y: 2,
        state: 'idle'
      }
    ];
  }

  public update(rawDt: number) {
    if (this.gameSpeed === 0 || this.isDayFinished) return;

    // Clamp dt to maximum 0.05s as per Game Craft Guidelines
    const dt = Math.min(rawDt, 0.05) * this.gameSpeed;
    this.gameTimeSeconds += dt;

    // Advance Day/Night Clock
    // 1 game second advances approx 0.04 game hours (a full 12-hour workday takes ~300 real seconds at 1x)
    const hourRate = (12 / 180); // 12 store hours in 180 seconds at 1x
    this.timeOfDay += dt * hourRate;

    if (this.timeOfDay >= 20.0) {
      this.finishDay();
      return;
    }

    // Process wholesale delivery orders
    this.updateWholesaleOrders();

    // Customer spawning
    if (this.isStoreOpen) {
      this.updateCustomerSpawning(dt);
    }

    // Update Customers
    this.updateCustomers(dt);

    // Update Staff
    this.updateStaff(dt);

    // Update Floating notifications
    this.updateNotifications(dt);
  }

  // --- Wholesale Orders & Inventory ---
  public placeWholesaleOrder(productId: string, quantityBoxes: number): { success: boolean; message: string } {
    const product = this.products.find(p => p.id === productId);
    if (!product) return { success: false, message: 'Invalid product' };

    // Check discount from upgrades
    const discUpgrade = this.upgrades.find(u => u.id === 'upg_supplier');
    const discountFactor = discUpgrade && discUpgrade.level > 0 ? (1 - discUpgrade.level * 0.15) : 1;

    const unitsTotal = quantityBoxes * product.boxSize;
    const totalCost = Number((quantityBoxes * product.boxSize * product.unitCost * discountFactor).toFixed(2));

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

  // --- Customer AI Simulation ---
  private updateCustomerSpawning(dt: number) {
    this.customerSpawnTimer += dt;
    
    // Spawn rate influenced by store reputation, marketing ads upgrade, and time of day (lunch 12-14 and evening 17-19)
    const adsLevel = this.upgrades.find(u => u.id === 'upg_ads')?.level || 0;
    const adsBonus = 1 + adsLevel * 0.35;
    const isPeakHour = (this.timeOfDay >= 12 && this.timeOfDay <= 14) || (this.timeOfDay >= 17 && this.timeOfDay <= 19);
    const peakMultiplier = isPeakHour ? 1.6 : 1.0;

    const spawnInterval = Math.max(2.2, (6.5 / (this.reputation / 4.0)) / (adsBonus * peakMultiplier));

    if (this.customerSpawnTimer >= spawnInterval && this.customers.length < 18) {
      this.customerSpawnTimer = 0;
      this.spawnCustomer();
    }
  }

  private spawnCustomer() {
    // Generate customer shopping list from available products
    const inStockShelves = this.fixtures.filter(f => f.assignedProductId && f.currentStock > 0);
    const assignedProducts = this.fixtures.map(f => f.assignedProductId).filter(Boolean) as string[];

    const wishlist: { productId: string; quantity: number }[] = [];
    if (assignedProducts.length > 0) {
      // Pick 1 to 3 items
      const pickCount = Math.min(assignedProducts.length, Math.floor(Math.random() * 2) + 1);
      const shuffled = [...assignedProducts].sort(() => 0.5 - Math.random());
      for (let i = 0; i < pickCount; i++) {
        wishlist.push({ productId: shuffled[i], quantity: Math.floor(Math.random() * 2) + 1 });
      }
    } else {
      // General window shopper
      wishlist.push({ productId: 'prod_apples', quantity: 1 });
    }

    const skinTones = ['#fed7aa', '#fcd34d', '#fbcfe8', '#d6d3d1', '#78350f', '#a16207'];
    const shirtColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    const names = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Charlie', 'Quinn'];

    const doorX = Math.floor(this.gridWidth / 2);
    const doorY = this.gridHeight - 1;

    const customer: Customer = {
      id: `cust_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: names[Math.floor(Math.random() * names.length)],
      skinTone: skinTones[Math.floor(Math.random() * skinTones.length)],
      shirtColor: shirtColors[Math.floor(Math.random() * shirtColors.length)],
      pantColor: '#1e293b',
      x: doorX,
      y: doorY,
      targetX: doorX,
      targetY: doorY - 1,
      state: 'entering',
      wishlist,
      cart: [],
      patience: 100,
      budget: Math.floor(Math.random() * 60) + 30,
      currentThought: 'Shopping...',
      thoughtTimer: 0,
      walkTimer: 0
    };

    this.customers.push(customer);
    sound.playDoorBell();
  }

  private updateCustomers(dt: number) {
    const doorX = Math.floor(this.gridWidth / 2);
    const doorY = this.gridHeight - 1;

    for (let i = this.customers.length - 1; i >= 0; i--) {
      const cust = this.customers[i];
      cust.walkTimer += dt;
      cust.thoughtTimer += dt;

      // Patience decay
      cust.patience -= dt * 1.5;
      if (cust.patience <= 0 && cust.state !== 'leaving_happy' && cust.state !== 'leaving_unhappy') {
        cust.state = 'leaving_unhappy';
        cust.currentThought = '❌ Too slow!';
        cust.targetX = doorX;
        cust.targetY = doorY;
        this.dailyStats.lost++;
        this.reputation = Math.max(1.0, Number((this.reputation - 0.05).toFixed(2)));
      }

      // Smooth movement towards target
      const dx = cust.targetX - cust.x;
      const dy = cust.targetY - cust.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const walkSpeed = 2.6;

      if (dist > 0.05) {
        cust.x += (dx / dist) * Math.min(dist, walkSpeed * dt);
        cust.y += (dy / dist) * Math.min(dist, walkSpeed * dt);
      } else {
        cust.x = cust.targetX;
        cust.y = cust.targetY;
        this.processCustomerStateTransition(cust, doorX, doorY);
      }

      // If reached exit door while leaving, remove from simulation
      if (
        (cust.state === 'leaving_happy' || cust.state === 'leaving_unhappy') &&
        Math.abs(cust.x - doorX) < 0.2 &&
        Math.abs(cust.y - doorY) < 0.2
      ) {
        this.customers.splice(i, 1);
      }
    }
  }

  private processCustomerStateTransition(cust: Customer, doorX: number, doorY: number) {
    if (cust.state === 'entering') {
      cust.state = 'browsing';
      this.routeCustomerToNextWishlistItem(cust, doorX, doorY);
    } else if (cust.state === 'browsing') {
      // Arrived at shelf
      if (cust.targetFixtureId) {
        const shelf = this.fixtures.find(f => f.id === cust.targetFixtureId);
        const nextWish = cust.wishlist[0];

        if (shelf && shelf.assignedProductId && nextWish) {
          const product = this.products.find(p => p.id === shelf.assignedProductId);

          if (shelf.currentStock > 0 && product) {
            // Price Elasticity Check!
            const elasticity = calculatePricingElasticity(product.currentPrice, product.suggestedPrice, cust.budget);
            const willBuy = Math.random() <= elasticity.purchaseProbability;

            if (willBuy) {
              const takeQty = Math.min(nextWish.quantity, shelf.currentStock);
              shelf.currentStock -= takeQty;
              cust.cart.push({
                productId: product.id,
                quantity: takeQty,
                pricePaid: product.currentPrice
              });
              cust.wishlist.shift();
              cust.currentThought = `🛒 Got ${product.icon}`;
              cust.patience = Math.min(100, cust.patience + 20); // restored patience on finding item
            } else {
              // Too expensive!
              cust.currentThought = '❌ Overpriced!';
              cust.wishlist.shift();
              cust.patience -= 15;
            }
          } else {
            // Out of stock
            cust.currentThought = '⚠️ Empty shelf!';
            cust.wishlist.shift();
            cust.patience -= 20;
          }
        }
      }

      // Check next wish or head to checkout
      if (cust.wishlist.length > 0) {
        this.routeCustomerToNextWishlistItem(cust, doorX, doorY);
      } else {
        if (cust.cart.length > 0) {
          cust.state = 'heading_to_checkout';
          this.routeCustomerToCheckout(cust);
        } else {
          cust.state = 'leaving_unhappy';
          cust.currentThought = '❌ Found nothing!';
          cust.targetX = doorX;
          cust.targetY = doorY;
          this.dailyStats.lost++;
        }
      }
    } else if (cust.state === 'heading_to_checkout') {
      cust.state = 'queuing';
      cust.currentThought = '⌛ In line';
      // Join queue of target register
      if (cust.assignedCheckoutId) {
        const reg = this.fixtures.find(f => f.id === cust.assignedCheckoutId);
        if (reg) {
          reg.queue = reg.queue || [];
          if (!reg.queue.includes(cust.id)) {
            reg.queue.push(cust.id);
          }
        }
      }
    } else if (cust.state === 'queuing') {
      // Process cashier checkout at register front
      this.processCheckoutStep(cust, doorX, doorY);
    }
  }

  private routeCustomerToNextWishlistItem(cust: Customer, doorX: number, doorY: number) {
    const nextItem = cust.wishlist[0];
    if (!nextItem) return;

    // Find a shelf containing this product
    const matchingShelf = this.fixtures.find(
      f => f.assignedProductId === nextItem.productId
    );

    if (matchingShelf) {
      cust.targetFixtureId = matchingShelf.id;
      // Walk to the front facing tile of the shelf
      cust.targetX = matchingShelf.x + 0.5;
      cust.targetY = matchingShelf.y + matchingShelf.height + 0.2;
      const prod = this.products.find(p => p.id === nextItem.productId);
      cust.currentThought = `Looking for ${prod?.icon || 'item'}`;
    } else {
      // Shelf doesn't exist
      cust.currentThought = '❓ Not sold here';
      cust.wishlist.shift();
      if (cust.wishlist.length > 0) {
        this.routeCustomerToNextWishlistItem(cust, doorX, doorY);
      } else if (cust.cart.length > 0) {
        cust.state = 'heading_to_checkout';
        this.routeCustomerToCheckout(cust);
      } else {
        cust.state = 'leaving_unhappy';
        cust.targetX = doorX;
        cust.targetY = doorY;
      }
    }
  }

  private routeCustomerToCheckout(cust: Customer) {
    const checkouts = this.fixtures.filter(f => f.type.startsWith('checkout_'));
    if (checkouts.length === 0) {
      cust.state = 'leaving_unhappy';
      cust.currentThought = '❌ No registers!';
      cust.targetX = Math.floor(this.gridWidth / 2);
      cust.targetY = this.gridHeight - 1;
      return;
    }

    // Pick register with shortest queue
    let bestCheckout = checkouts[0];
    let shortest = (bestCheckout.queue || []).length;

    for (const c of checkouts) {
      const qLen = (c.queue || []).length;
      if (qLen < shortest) {
        shortest = qLen;
        bestCheckout = c;
      }
    }

    cust.assignedCheckoutId = bestCheckout.id;
    // Walk to register queue spot
    const queueIndex = (bestCheckout.queue || []).length;
    cust.targetX = bestCheckout.x + 0.5;
    cust.targetY = bestCheckout.y + 1.2 + queueIndex * 0.7;
    cust.currentThought = 'Heading to checkout';
  }

  private processCheckoutStep(cust: Customer, doorX: number, doorY: number) {
    const reg = this.fixtures.find(f => f.id === cust.assignedCheckoutId);
    if (!reg) return;

    reg.queue = reg.queue || [];
    const isAtFront = reg.queue[0] === cust.id;

    if (isAtFront) {
      // Cashier speed bonus check
      const isStaffed = Boolean(reg.assignedStaffId);
      const isSelfCheckout = reg.type === 'checkout_self';
      const checkoutSpeedTime = isStaffed ? 0.7 : isSelfCheckout ? 1.4 : 2.2;

      if (cust.thoughtTimer >= checkoutSpeedTime) {
        // Complete checkout transaction!
        let totalBill = 0;
        cust.cart.forEach(item => {
          const itemTotal = item.pricePaid * item.quantity;
          totalBill += itemTotal;
          this.dailyStats.productSalesCount[item.productId] =
            (this.dailyStats.productSalesCount[item.productId] || 0) + item.quantity;
        });

        // Add Tip if thrilled
        const tip = cust.patience > 80 ? Math.floor(totalBill * 0.15) : 0;
        const grandTotal = totalBill + tip;

        this.cash += grandTotal;
        this.dailyStats.revenue += grandTotal;
        this.dailyStats.served++;
        this.dailyStats.satisfactionSum += cust.patience > 70 ? 5 : cust.patience > 40 ? 4 : 3;

        // Add XP
        this.addXP(Math.max(10, Math.floor(grandTotal * 0.2)));

        // Remove from queue
        reg.queue.shift();

        // Audio & Visual juice
        sound.playChaChing();
        this.addNotification(reg.x, reg.y - 0.5, `+$${grandTotal.toFixed(2)}${tip > 0 ? ' (Tip!)' : ''}`, '#22c55e');

        cust.state = 'leaving_happy';
        cust.currentThought = tip > 0 ? '⭐ Amazing shop!' : '💸 Thank you!';
        cust.targetX = doorX;
        cust.targetY = doorY;
      }
    }
  }

  // --- Staff AI Automation ---
  private updateStaff(dt: number) {
    for (const member of this.staff) {
      if (member.role === 'cashier') {
        // Cashier stays anchored to assigned checkout
        if (member.assignedFixtureId) {
          const reg = this.fixtures.find(f => f.id === member.assignedFixtureId);
          if (reg) {
            member.x = reg.x;
            member.y = reg.y - 0.5;
            member.state = (reg.queue && reg.queue.length > 0) ? 'working' : 'idle';
          }
        }
      } else if (member.role === 'restocker') {
        this.updateRestockerAI(member, dt);
      }
    }
  }

  private updateRestockerAI(member: StaffMember, dt: number) {
    const walkSpeed = 2.4 * member.speedLevel;

    if (member.state === 'idle') {
      // Find a shelf needing restock
      const lowShelf = this.fixtures.find(f => 
        f.assignedProductId &&
        f.currentStock <= f.maxStock * 0.4 &&
        (this.warehouseStock[f.assignedProductId] || 0) > 0
      );

      if (lowShelf && lowShelf.assignedProductId) {
        // Find warehouse pallet or rack
        const warehouse = this.fixtures.find(f => f.type.startsWith('storage_'));
        if (warehouse) {
          member.targetX = warehouse.x + 0.5;
          member.targetY = warehouse.y + warehouse.height;
          member.state = 'walking';
          member.assignedFixtureId = lowShelf.id;
          member.carriedProductId = lowShelf.assignedProductId;
        }
      }
    } else if ((member.state === 'walking' || member.state === 'carrying_box') && member.targetX !== undefined && member.targetY !== undefined) {
      const dx = member.targetX - member.x;
      const dy = member.targetY - member.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0.05) {
        member.x += (dx / dist) * Math.min(dist, walkSpeed * dt);
        member.y += (dy / dist) * Math.min(dist, walkSpeed * dt);
      } else {
        // Arrived at destination
        if (member.state === 'walking' && member.carriedProductId && !member.carriedAmount) {
          // Arrived at warehouse to pick up box
          const needed = 20;
          const available = this.warehouseStock[member.carriedProductId] || 0;
          const pickup = Math.min(needed, available);

          if (pickup > 0) {
            this.warehouseStock[member.carriedProductId] -= pickup;
            member.carriedAmount = pickup;
            member.state = 'carrying_box';

            // Walk to the target shelf
            const targetShelf = this.fixtures.find(f => f.id === member.assignedFixtureId);
            if (targetShelf) {
              member.targetX = targetShelf.x + 0.5;
              member.targetY = targetShelf.y + targetShelf.height;
            } else {
              member.state = 'idle';
            }
          } else {
            member.state = 'idle';
          }
        } else if (member.state === 'carrying_box') {
          // Arrived at shelf to restock
          const targetShelf = this.fixtures.find(f => f.id === member.assignedFixtureId);
          if (targetShelf && member.carriedProductId && member.carriedAmount) {
            const added = Math.min(member.carriedAmount, targetShelf.maxStock - targetShelf.currentStock);
            targetShelf.currentStock += added;
            const leftover = member.carriedAmount - added;
            if (leftover > 0) {
              this.warehouseStock[member.carriedProductId] = (this.warehouseStock[member.carriedProductId] || 0) + leftover;
            }

            sound.playPlaceThud();
            this.addNotification(targetShelf.x, targetShelf.y, `+${added} Stock Restocked!`, '#4ade80');
          }

          member.carriedAmount = 0;
          member.carriedProductId = null;
          member.assignedFixtureId = null;
          member.state = 'idle';
        }
      }
    }
  }

  // --- XP & Progression ---
  public addXP(amount: number) {
    this.xp += amount;
    if (this.xp >= this.xpNeeded) {
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

    this.latestLedger = ledger;
    this.dailyLedgers.push(ledger);
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

    // Reset daily accumulator
    this.dailyStats = {
      revenue: 0,
      cogs: 0,
      served: 0,
      lost: 0,
      satisfactionSum: 0,
      productSalesCount: {}
    };
  }

  // --- Building & Editing Mechanics ---
  public buildFixture(type: string, x: number, y: number, rotation: number): { success: boolean; message: string } {
    const def = getFixtureDef(type);
    if (!def) return { success: false, message: 'Invalid fixture definition' };

    if (this.cash < def.cost) {
      sound.playErrorBuzz();
      return { success: false, message: `Need $${def.cost}! You have $${this.cash.toFixed(2)}` };
    }

    const { w, h } = getRotatedDimensions(def.width, def.height, rotation);
    const bounds: GridBounds = { width: this.gridWidth, height: this.gridHeight, minX: 1, minY: 1 };
    const check = canPlaceFixture(bounds, this.fixtures, x, y, w, h);

    if (!check.allowed) {
      sound.playErrorBuzz();
      return { success: false, message: check.reason || 'Placement blocked' };
    }

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

    // If shelf, pre-assign compatible product if obvious
    if (def.compatibleCategories && def.compatibleCategories.length > 0) {
      const match = this.products.find(p => def.compatibleCategories?.includes(p.category));
      if (match) newFixture.assignedProductId = match.id;
    }

    this.fixtures.push(newFixture);
    sound.playPlaceThud();
    this.addNotification(x, y, `+${def.name} Built!`, '#38bdf8');
    this.addXP(25);

    return { success: true, message: `${def.name} successfully built!` };
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
    const newStaff: StaffMember = {
      id: `staff_${Date.now()}`,
      name: names[Math.floor(Math.random() * names.length)],
      role,
      salaryPerDay: salary,
      speedLevel: 1,
      x: Math.floor(this.gridWidth / 2),
      y: 5,
      state: 'idle'
    };

    // Auto assign cashier to open register
    if (role === 'cashier') {
      const openReg = this.fixtures.find(f => f.type.startsWith('checkout_') && !f.assignedStaffId);
      if (openReg) {
        newStaff.assignedFixtureId = openReg.id;
        openReg.assignedStaffId = newStaff.id;
      }
    }

    this.staff.push(newStaff);
    sound.playChaChing();
    this.addNotification(newStaff.x, newStaff.y, `Hired ${newStaff.name} (${role})!`, '#38bdf8');

    return { success: true, message: `Hired ${newStaff.name} successfully!` };
  }

  public fireStaff(staffId: string) {
    const idx = this.staff.findIndex(s => s.id === staffId);
    if (idx === -1) return;

    const s = this.staff[idx];
    if (s.assignedFixtureId) {
      const fix = this.fixtures.find(f => f.id === s.assignedFixtureId);
      if (fix) fix.assignedStaffId = null;
    }

    this.staff.splice(idx, 1);
    sound.playClick();
  }

  // --- Store Upgrades ---
  public purchaseUpgrade(upgradeId: string): { success: boolean; message: string } {
    const upg = this.upgrades.find(u => u.id === upgradeId);
    if (!upg || upg.level >= upg.maxLevel) return { success: false, message: 'Cannot upgrade' };

    const cost = Math.floor(upg.cost * Math.pow(1.5, upg.level));
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
      products: this.products,
      staff: this.staff,
      wholesaleOrders: this.wholesaleOrders,
      customersCount: this.customers.length,
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
