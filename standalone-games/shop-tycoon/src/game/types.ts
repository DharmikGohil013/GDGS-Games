/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProductCategory = 
  | 'produce'
  | 'bakery'
  | 'beverages'
  | 'groceries'
  | 'electronics'
  | 'luxury';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  icon: string; // Emoji or glyph
  color: string;
  unitCost: number; // Wholesale cost
  suggestedPrice: number; // Fair market price
  currentPrice: number; // Player configured retail price
  boxSize: number; // Quantity in one wholesale carton
  deliveryLeadTime: number; // Seconds to arrive
  unlockLevel: number;
  description: string;
}

export type FixtureCategory = 'shelf' | 'checkout' | 'storage' | 'decor';

export interface FixtureDef {
  type: string;
  name: string;
  category: FixtureCategory;
  width: number; // grid tiles (at 0 deg rotation)
  height: number;
  cost: number;
  maxStock?: number;
  compatibleCategories?: ProductCategory[];
  comfortBonus?: number;
  description: string;
  color: string;
}

export interface PlacedFixture {
  id: string;
  type: string;
  x: number; // grid coordinates (top-left)
  y: number;
  width: number;
  height: number;
  rotation: number; // 0, 90, 180, 270
  assignedProductId?: string | null;
  currentStock: number;
  maxStock: number;
  queue?: string[]; // Customer IDs for checkouts
  assignedStaffId?: string | null;
}

export interface WholesaleOrder {
  id: string;
  productId: string;
  quantityBoxes: number;
  unitsTotal: number;
  totalCost: number;
  orderedAtTime: number; // Game seconds
  arrivesAtTime: number;
  isDelivered: boolean;
}

export type StaffRole = 'cashier' | 'restocker' | 'cleaner';

export interface GridPoint {
  x: number;
  y: number;
}

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  salaryPerDay: number;
  speedLevel: number;
  assignedFixtureId?: string | null;
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  path?: GridPoint[]; // remaining tiles to walk through, around fixtures
  state: 'idle' | 'walking' | 'working' | 'carrying_box';
  carriedProductId?: string | null;
  carriedAmount?: number;
  targetLitterId?: string | null;
  workTimer?: number;
}

// Wrappers and spills dropped by shoppers. Each one on the floor costs reputation until cleaned.
export interface Litter {
  id: string;
  x: number;
  y: number;
  kind: 'wrapper' | 'spill';
}

export interface DailyGoal {
  description: string;
  metric: 'served' | 'revenue' | 'satisfaction';
  target: number;
  rewardCash: number;
  rewardXp: number;
  completed: boolean;
}

export type CustomerState = 
  | 'entering'
  | 'browsing'
  | 'picking'
  | 'heading_to_checkout'
  | 'queuing'
  | 'paying'
  | 'leaving_happy'
  | 'leaving_unhappy';

export interface CustomerCartItem {
  productId: string;
  quantity: number;
  pricePaid: number;
}

export interface Customer {
  id: string;
  name: string;
  skinTone: string;
  shirtColor: string;
  pantColor: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  state: CustomerState;
  wishlist: { productId: string; quantity: number }[];
  cart: CustomerCartItem[];
  patience: number; // 0 to 100
  budget: number;
  currentThought: string;
  thoughtTimer: number; // seconds since currentThought last changed
  walkTimer: number;
  serviceTimer: number; // seconds spent being served at the front of a checkout queue
  path?: GridPoint[];
  targetFixtureId?: string | null;
  assignedCheckoutId?: string | null;
  hasLittered?: boolean;
}

export interface FloatingNotification {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  lifetime: number; // 0 to 1
}

export interface DailyLedger {
  day: number;
  grossRevenue: number;
  cogs: number; // Cost of goods sold
  staffWages: number;
  storeExpansions: number;
  netProfit: number;
  customersServed: number;
  customersLost: number;
  satisfactionScore: number; // 1 to 5 stars
  topSellingProduct?: string;
  goal?: DailyGoal;
}

export interface StoreUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  level: number;
  maxLevel: number;
  unlocked: boolean;
  effectType: 'floor_expansion' | 'ad_campaign' | 'wholesale_discount' | 'decor_boost' | 'speed_boost';
}
