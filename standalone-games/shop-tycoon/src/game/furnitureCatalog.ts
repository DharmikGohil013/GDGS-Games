/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FixtureDef } from './types.ts';

export const FIXTURE_CATALOG: FixtureDef[] = [
  // Shelves & Displays
  {
    type: 'shelf_produce',
    name: 'Rustic Produce Stand',
    category: 'shelf',
    width: 2,
    height: 1,
    cost: 150,
    maxStock: 30,
    compatibleCategories: ['produce'],
    comfortBonus: 5,
    description: 'Slanted wooden crates designed to showcase fresh farm apples, bananas, and avocados.',
    color: '#84cc16'
  },
  {
    type: 'shelf_grocery',
    name: 'Metal Grocery Gondola',
    category: 'shelf',
    width: 2,
    height: 1,
    cost: 220,
    maxStock: 40,
    compatibleCategories: ['groceries', 'produce'],
    comfortBonus: 2,
    description: 'Sturdy steel retail gondola shelving for cereal, pasta, and packaged goods.',
    color: '#64748b'
  },
  {
    type: 'shelf_cooler',
    name: 'Glass Beverage Refrigerator',
    category: 'shelf',
    width: 2,
    height: 1,
    cost: 380,
    maxStock: 35,
    compatibleCategories: ['beverages'],
    comfortBonus: 8,
    description: 'LED-illuminated chilled display with sliding glass doors for frosty drinks.',
    color: '#06b6d4'
  },
  {
    type: 'shelf_bakery',
    name: 'Warm Glass Bakery Case',
    category: 'shelf',
    width: 2,
    height: 1,
    cost: 290,
    maxStock: 30,
    compatibleCategories: ['bakery'],
    comfortBonus: 10,
    description: 'Curved glass pastry showcase that keeps baguettes and croissants warm and enticing.',
    color: '#f59e0b'
  },
  {
    type: 'shelf_tech',
    name: 'Electronics Showcase Table',
    category: 'shelf',
    width: 2,
    height: 1,
    cost: 450,
    maxStock: 20,
    compatibleCategories: ['electronics'],
    comfortBonus: 12,
    description: 'Modern minimalist pedestal table with security tether mounts for high-tech gadgets.',
    color: '#6366f1'
  },
  {
    type: 'shelf_luxury',
    name: 'Velvet Boutique Showcase',
    category: 'shelf',
    width: 2,
    height: 1,
    cost: 520,
    maxStock: 20,
    compatibleCategories: ['luxury'],
    comfortBonus: 15,
    description: 'Hardwood cabinet with gold accents and internal spotlights for luxury fragrances.',
    color: '#c084fc'
  },

  // Checkouts
  {
    type: 'checkout_basic',
    name: 'Standard Cashier Desk',
    category: 'checkout',
    width: 2,
    height: 1,
    cost: 200,
    description: 'Essential barcode scanner counter with receipt printer and conveyor belt.',
    color: '#38bdf8'
  },
  {
    type: 'checkout_express',
    name: 'Express Speed Register',
    category: 'checkout',
    width: 2,
    height: 1,
    cost: 480,
    comfortBonus: 8,
    description: 'High-speed dual laser scanner counter that speeds up customer checkout by 40%.',
    color: '#0284c7'
  },
  {
    type: 'checkout_self',
    name: 'Self-Checkout Kiosk',
    category: 'checkout',
    width: 1,
    height: 1,
    cost: 650,
    comfortBonus: 5,
    description: 'Compact touch-screen automated checkout terminal that requires no cashier staff.',
    color: '#10b981'
  },

  // Storage / Warehouse
  {
    type: 'storage_pallet',
    name: 'Loading Dock Pallet',
    category: 'storage',
    width: 2,
    height: 2,
    cost: 120,
    maxStock: 100,
    description: 'Heavy duty wooden pallet for staging newly arrived wholesale cartons.',
    color: '#a16207'
  },
  {
    type: 'storage_rack',
    name: 'Backroom High-Bay Rack',
    category: 'storage',
    width: 2,
    height: 1,
    cost: 260,
    maxStock: 150,
    description: 'Industrial tiered steel storage rack for storing bulk inventory boxes.',
    color: '#475569'
  },

  // Decor & Atmosphere
  {
    type: 'decor_plant',
    name: 'Potted Ficus Tree',
    category: 'decor',
    width: 1,
    height: 1,
    cost: 75,
    comfortBonus: 6,
    description: 'Lush green decorative tree that relaxes waiting customers and boosts patience.',
    color: '#22c55e'
  },
  {
    type: 'decor_vending',
    name: 'Cold Drink & Gumball Vending',
    category: 'decor',
    width: 1,
    height: 1,
    cost: 320,
    comfortBonus: 10,
    description: 'Retro arcade machine and drink dispenser that earns passive tips ($5-$15).',
    color: '#ec4899'
  },
  {
    type: 'decor_bench',
    name: 'Customer Waiting Bench',
    category: 'decor',
    width: 2,
    height: 1,
    cost: 95,
    comfortBonus: 8,
    description: 'Comfortable polished oak bench where tired shoppers can catch their breath.',
    color: '#b45309'
  },
  {
    type: 'decor_neon',
    name: 'Neon Store Glow Sign',
    category: 'decor',
    width: 1,
    height: 1,
    cost: 180,
    comfortBonus: 12,
    description: 'Vibrant luminescent sign that increases foot traffic and store attractiveness.',
    color: '#e879f9'
  }
];

export function getFixtureDef(type: string): FixtureDef | undefined {
  return FIXTURE_CATALOG.find(f => f.type === type);
}
