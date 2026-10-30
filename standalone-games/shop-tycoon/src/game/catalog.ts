/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  // Produce
  {
    id: 'prod_apples',
    name: 'Red Gala Apples',
    category: 'produce',
    icon: '🍎',
    color: '#ef4444',
    unitCost: 1.20,
    suggestedPrice: 2.50,
    currentPrice: 2.50,
    boxSize: 20,
    deliveryLeadTime: 6,
    unlockLevel: 1,
    description: 'Crisp, sweet, and freshly picked from local orchard farms.'
  },
  {
    id: 'prod_bananas',
    name: 'Golden Bananas',
    category: 'produce',
    icon: '🍌',
    color: '#eab308',
    unitCost: 0.90,
    suggestedPrice: 2.00,
    currentPrice: 2.00,
    boxSize: 25,
    deliveryLeadTime: 6,
    unlockLevel: 1,
    description: 'High in potassium and customer staple for everyday snacking.'
  },
  {
    id: 'prod_avocado',
    name: 'Hass Avocados',
    category: 'produce',
    icon: '🥑',
    color: '#4ade80',
    unitCost: 2.20,
    suggestedPrice: 4.80,
    currentPrice: 4.80,
    boxSize: 15,
    deliveryLeadTime: 8,
    unlockLevel: 2,
    description: 'Creamy high-demand superfood favored by health-conscious shoppers.'
  },

  // Bakery
  {
    id: 'prod_baguette',
    name: 'French Baguette',
    category: 'bakery',
    icon: '🥖',
    color: '#d97706',
    unitCost: 1.50,
    suggestedPrice: 3.50,
    currentPrice: 3.50,
    boxSize: 16,
    deliveryLeadTime: 5,
    unlockLevel: 1,
    description: 'Crusty golden artisanal bread baked with French sourdough starter.'
  },
  {
    id: 'prod_croissant',
    name: 'Butter Croissant',
    category: 'bakery',
    icon: '🥐',
    color: '#f59e0b',
    unitCost: 1.80,
    suggestedPrice: 4.00,
    currentPrice: 4.00,
    boxSize: 18,
    deliveryLeadTime: 6,
    unlockLevel: 2,
    description: 'Flaky 64-layer butter pastry with irresistible morning aroma.'
  },

  // Beverages
  {
    id: 'prod_soda',
    name: 'Sparkling Soda',
    category: 'beverages',
    icon: '🥤',
    color: '#06b6d4',
    unitCost: 1.10,
    suggestedPrice: 2.80,
    currentPrice: 2.80,
    boxSize: 24,
    deliveryLeadTime: 7,
    unlockLevel: 1,
    description: 'Chilled bubbly soda cans that fly off refrigerator shelves.'
  },
  {
    id: 'prod_iced_coffee',
    name: 'Cold Brew Coffee',
    category: 'beverages',
    icon: '🧋',
    color: '#78350f',
    unitCost: 2.40,
    suggestedPrice: 5.50,
    currentPrice: 5.50,
    boxSize: 20,
    deliveryLeadTime: 8,
    unlockLevel: 2,
    description: 'Slow-steeped organic nitro cold brew with high caffeine punch.'
  },

  // Groceries
  {
    id: 'prod_cereal',
    name: 'Honey Oat Crunch',
    category: 'groceries',
    icon: '🥣',
    color: '#fbbf24',
    unitCost: 2.60,
    suggestedPrice: 5.20,
    currentPrice: 5.20,
    boxSize: 16,
    deliveryLeadTime: 8,
    unlockLevel: 2,
    description: 'Classic family breakfast cereal packed with toasted whole oats.'
  },
  {
    id: 'prod_pasta',
    name: 'Artisan Rigatoni',
    category: 'groceries',
    icon: '🍝',
    color: '#f97316',
    unitCost: 1.90,
    suggestedPrice: 4.50,
    currentPrice: 4.50,
    boxSize: 20,
    deliveryLeadTime: 9,
    unlockLevel: 2,
    description: 'Bronze-cut durum semolina pasta imported directly from Napoli.'
  },

  // Electronics
  {
    id: 'prod_earbuds',
    name: 'Wireless Earbuds',
    category: 'electronics',
    icon: '🎧',
    color: '#818cf8',
    unitCost: 18.00,
    suggestedPrice: 49.00,
    currentPrice: 49.00,
    boxSize: 10,
    deliveryLeadTime: 12,
    unlockLevel: 3,
    description: 'Active noise-canceling pocket buds with crystal-clear spatial audio.'
  },
  {
    id: 'prod_smartwatch',
    name: 'Pulse Smartwatch',
    category: 'electronics',
    icon: '⌚',
    color: '#3b82f6',
    unitCost: 45.00,
    suggestedPrice: 119.00,
    currentPrice: 119.00,
    boxSize: 8,
    deliveryLeadTime: 14,
    unlockLevel: 4,
    description: 'Sleek OLED fitness tracking watch with high-margin revenue.'
  },

  // Luxury & Apothecary
  {
    id: 'prod_perfume',
    name: 'Velvet Rose Mist',
    category: 'luxury',
    icon: '✨',
    color: '#ec4899',
    unitCost: 28.00,
    suggestedPrice: 75.00,
    currentPrice: 75.00,
    boxSize: 10,
    deliveryLeadTime: 14,
    unlockLevel: 4,
    description: 'Bespoke botanical perfume with magnetic prestige appeal.'
  },
  {
    id: 'prod_elixir',
    name: 'Aroma Diffuser Set',
    category: 'luxury',
    icon: '🔮',
    color: '#a855f7',
    unitCost: 35.00,
    suggestedPrice: 95.00,
    currentPrice: 95.00,
    boxSize: 6,
    deliveryLeadTime: 16,
    unlockLevel: 5,
    description: 'Ultrasonic ceramic aromatherapy system with essential oil blends.'
  }
];
