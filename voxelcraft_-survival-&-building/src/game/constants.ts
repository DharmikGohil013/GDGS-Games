/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const CHUNK_SIZE_X = 16;
export const CHUNK_SIZE_Z = 16;
export const CHUNK_HEIGHT = 48;
export const SEA_LEVEL = 18;

export enum BlockType {
  AIR = 0,
  GRASS = 1,
  DIRT = 2,
  STONE = 3,
  COBBLESTONE = 4,
  OAK_LOG = 5,
  OAK_LEAVES = 6,
  OAK_PLANKS = 7,
  SAND = 8,
  SANDSTONE = 9,
  CRAFTING_TABLE = 10,
  FURNACE = 11,
  FURNACE_LIT = 12,
  COAL_ORE = 13,
  IRON_ORE = 14,
  DIAMOND_ORE = 15,
  TORCH = 16,
  GLASS = 17,
  BEDROCK = 18,
  WATER = 19,
  CACTUS = 20,
  BRICK = 21,
  BOOKSHELF = 22,
  SNOW = 23,
  CHEST = 24,
}

export interface BlockDef {
  id: BlockType;
  name: string;
  transparent?: boolean;
  solid: boolean;
  liquid?: boolean;
  hardness: number; // mining time base
  preferredTool?: 'pickaxe' | 'axe' | 'shovel' | 'none';
  dropItem: string;
  dropCount?: number;
  lightEmission?: number; // 0 to 15
}

export const BLOCK_DEFS: Record<BlockType, BlockDef> = {
  [BlockType.AIR]: { id: BlockType.AIR, name: 'Air', transparent: true, solid: false, hardness: 0, dropItem: '' },
  [BlockType.GRASS]: { id: BlockType.GRASS, name: 'Grass Block', solid: true, hardness: 0.6, preferredTool: 'shovel', dropItem: 'dirt' },
  [BlockType.DIRT]: { id: BlockType.DIRT, name: 'Dirt', solid: true, hardness: 0.5, preferredTool: 'shovel', dropItem: 'dirt' },
  [BlockType.STONE]: { id: BlockType.STONE, name: 'Stone', solid: true, hardness: 1.5, preferredTool: 'pickaxe', dropItem: 'cobblestone' },
  [BlockType.COBBLESTONE]: { id: BlockType.COBBLESTONE, name: 'Cobblestone', solid: true, hardness: 1.8, preferredTool: 'pickaxe', dropItem: 'cobblestone' },
  [BlockType.OAK_LOG]: { id: BlockType.OAK_LOG, name: 'Oak Log', solid: true, hardness: 1.2, preferredTool: 'axe', dropItem: 'oak_log' },
  [BlockType.OAK_LEAVES]: { id: BlockType.OAK_LEAVES, name: 'Oak Leaves', transparent: true, solid: true, hardness: 0.2, preferredTool: 'none', dropItem: 'apple', dropCount: 0.2 },
  [BlockType.OAK_PLANKS]: { id: BlockType.OAK_PLANKS, name: 'Oak Planks', solid: true, hardness: 1.0, preferredTool: 'axe', dropItem: 'oak_planks' },
  [BlockType.SAND]: { id: BlockType.SAND, name: 'Sand', solid: true, hardness: 0.5, preferredTool: 'shovel', dropItem: 'sand' },
  [BlockType.SANDSTONE]: { id: BlockType.SANDSTONE, name: 'Sandstone', solid: true, hardness: 1.0, preferredTool: 'pickaxe', dropItem: 'sandstone' },
  [BlockType.CRAFTING_TABLE]: { id: BlockType.CRAFTING_TABLE, name: 'Crafting Table', solid: true, hardness: 1.2, preferredTool: 'axe', dropItem: 'crafting_table' },
  [BlockType.FURNACE]: { id: BlockType.FURNACE, name: 'Furnace', solid: true, hardness: 1.8, preferredTool: 'pickaxe', dropItem: 'furnace' },
  [BlockType.FURNACE_LIT]: { id: BlockType.FURNACE_LIT, name: 'Lit Furnace', solid: true, hardness: 1.8, preferredTool: 'pickaxe', dropItem: 'furnace', lightEmission: 13 },
  [BlockType.COAL_ORE]: { id: BlockType.COAL_ORE, name: 'Coal Ore', solid: true, hardness: 2.0, preferredTool: 'pickaxe', dropItem: 'coal' },
  [BlockType.IRON_ORE]: { id: BlockType.IRON_ORE, name: 'Iron Ore', solid: true, hardness: 2.5, preferredTool: 'pickaxe', dropItem: 'iron_ore' },
  [BlockType.DIAMOND_ORE]: { id: BlockType.DIAMOND_ORE, name: 'Diamond Ore', solid: true, hardness: 3.0, preferredTool: 'pickaxe', dropItem: 'diamond' },
  [BlockType.TORCH]: { id: BlockType.TORCH, name: 'Torch', transparent: true, solid: false, hardness: 0.05, dropItem: 'torch', lightEmission: 14 },
  [BlockType.GLASS]: { id: BlockType.GLASS, name: 'Glass', transparent: true, solid: true, hardness: 0.3, dropItem: '' },
  [BlockType.BEDROCK]: { id: BlockType.BEDROCK, name: 'Bedrock', solid: true, hardness: 9999, dropItem: '' },
  [BlockType.WATER]: { id: BlockType.WATER, name: 'Water', transparent: true, solid: false, liquid: true, hardness: 9999, dropItem: '' },
  [BlockType.CACTUS]: { id: BlockType.CACTUS, name: 'Cactus', solid: true, hardness: 0.4, preferredTool: 'none', dropItem: 'cactus' },
  [BlockType.BRICK]: { id: BlockType.BRICK, name: 'Bricks', solid: true, hardness: 1.8, preferredTool: 'pickaxe', dropItem: 'brick' },
  [BlockType.BOOKSHELF]: { id: BlockType.BOOKSHELF, name: 'Bookshelf', solid: true, hardness: 1.2, preferredTool: 'axe', dropItem: 'bookshelf' },
  [BlockType.SNOW]: { id: BlockType.SNOW, name: 'Snow', solid: true, hardness: 0.3, preferredTool: 'shovel', dropItem: 'snowball' },
  [BlockType.CHEST]: { id: BlockType.CHEST, name: 'Chest', solid: true, hardness: 1.5, preferredTool: 'axe', dropItem: 'chest' },
};

export interface ItemStack {
  id: string; // item or block id
  count: number;
}

export interface ItemDef {
  id: string;
  name: string;
  placeableBlock?: BlockType;
  toolType?: 'pickaxe' | 'axe' | 'shovel' | 'sword';
  tier?: 'wood' | 'stone' | 'iron' | 'diamond';
  miningMultiplier?: number;
  attackDamage?: number;
  durability?: number;
  isFood?: boolean;
  foodRestore?: number; // hunger restored
  saturation?: number;
  isFuel?: boolean;
  fuelBurnTime?: number; // seconds
}

export const ITEM_DEFS: Record<string, ItemDef> = {
  // Blocks placeable as items
  dirt: { id: 'dirt', name: 'Dirt', placeableBlock: BlockType.DIRT },
  grass: { id: 'grass', name: 'Grass Block', placeableBlock: BlockType.GRASS },
  cobblestone: { id: 'cobblestone', name: 'Cobblestone', placeableBlock: BlockType.COBBLESTONE },
  stone: { id: 'stone', name: 'Stone', placeableBlock: BlockType.STONE },
  oak_log: { id: 'oak_log', name: 'Oak Log', placeableBlock: BlockType.OAK_LOG, isFuel: true, fuelBurnTime: 15 },
  oak_planks: { id: 'oak_planks', name: 'Oak Planks', placeableBlock: BlockType.OAK_PLANKS, isFuel: true, fuelBurnTime: 10 },
  sand: { id: 'sand', name: 'Sand', placeableBlock: BlockType.SAND },
  sandstone: { id: 'sandstone', name: 'Sandstone', placeableBlock: BlockType.SANDSTONE },
  crafting_table: { id: 'crafting_table', name: 'Crafting Table', placeableBlock: BlockType.CRAFTING_TABLE, isFuel: true, fuelBurnTime: 15 },
  furnace: { id: 'furnace', name: 'Furnace', placeableBlock: BlockType.FURNACE },
  glass: { id: 'glass', name: 'Glass', placeableBlock: BlockType.GLASS },
  torch: { id: 'torch', name: 'Torch', placeableBlock: BlockType.TORCH },
  brick: { id: 'brick', name: 'Bricks', placeableBlock: BlockType.BRICK },
  bookshelf: { id: 'bookshelf', name: 'Bookshelf', placeableBlock: BlockType.BOOKSHELF, isFuel: true, fuelBurnTime: 15 },
  chest: { id: 'chest', name: 'Chest', placeableBlock: BlockType.CHEST, isFuel: true, fuelBurnTime: 15 },
  iron_ore: { id: 'iron_ore', name: 'Iron Ore', placeableBlock: BlockType.IRON_ORE },
  cactus: { id: 'cactus', name: 'Cactus', placeableBlock: BlockType.CACTUS },

  // Raw materials
  stick: { id: 'stick', name: 'Stick', isFuel: true, fuelBurnTime: 5 },
  coal: { id: 'coal', name: 'Coal', isFuel: true, fuelBurnTime: 60 },
  iron_ingot: { id: 'iron_ingot', name: 'Iron Ingot' },
  diamond: { id: 'diamond', name: 'Diamond' },
  raw_porkchop: { id: 'raw_porkchop', name: 'Raw Porkchop', isFood: true, foodRestore: 3, saturation: 1.8 },
  cooked_porkchop: { id: 'cooked_porkchop', name: 'Cooked Porkchop', isFood: true, foodRestore: 8, saturation: 12.8 },
  raw_beef: { id: 'raw_beef', name: 'Raw Beef', isFood: true, foodRestore: 3, saturation: 1.8 },
  cooked_beef: { id: 'cooked_beef', name: 'Steak', isFood: true, foodRestore: 8, saturation: 12.8 },
  apple: { id: 'apple', name: 'Apple', isFood: true, foodRestore: 4, saturation: 2.4 },
  bread: { id: 'bread', name: 'Bread', isFood: true, foodRestore: 5, saturation: 6.0 },
  snowball: { id: 'snowball', name: 'Snowball' },
  bone: { id: 'bone', name: 'Bone' },
  rotten_flesh: { id: 'rotten_flesh', name: 'Rotten Flesh', isFood: true, foodRestore: 4, saturation: 0.8 },

  // Tools & Weapons
  wooden_pickaxe: { id: 'wooden_pickaxe', name: 'Wooden Pickaxe', toolType: 'pickaxe', tier: 'wood', miningMultiplier: 2, attackDamage: 2, durability: 60, isFuel: true, fuelBurnTime: 10 },
  stone_pickaxe: { id: 'stone_pickaxe', name: 'Stone Pickaxe', toolType: 'pickaxe', tier: 'stone', miningMultiplier: 4, attackDamage: 3, durability: 132 },
  iron_pickaxe: { id: 'iron_pickaxe', name: 'Iron Pickaxe', toolType: 'pickaxe', tier: 'iron', miningMultiplier: 6, attackDamage: 4, durability: 251 },
  diamond_pickaxe: { id: 'diamond_pickaxe', name: 'Diamond Pickaxe', toolType: 'pickaxe', tier: 'diamond', miningMultiplier: 8, attackDamage: 5, durability: 1561 },

  wooden_axe: { id: 'wooden_axe', name: 'Wooden Axe', toolType: 'axe', tier: 'wood', miningMultiplier: 2, attackDamage: 3, durability: 60, isFuel: true, fuelBurnTime: 10 },
  stone_axe: { id: 'stone_axe', name: 'Stone Axe', toolType: 'axe', tier: 'stone', miningMultiplier: 4, attackDamage: 4, durability: 132 },
  iron_axe: { id: 'iron_axe', name: 'Iron Axe', toolType: 'axe', tier: 'iron', miningMultiplier: 6, attackDamage: 5, durability: 251 },

  wooden_shovel: { id: 'wooden_shovel', name: 'Wooden Shovel', toolType: 'shovel', tier: 'wood', miningMultiplier: 2, attackDamage: 1, durability: 60, isFuel: true, fuelBurnTime: 10 },
  stone_shovel: { id: 'stone_shovel', name: 'Stone Shovel', toolType: 'shovel', tier: 'stone', miningMultiplier: 4, attackDamage: 2, durability: 132 },
  iron_shovel: { id: 'iron_shovel', name: 'Iron Shovel', toolType: 'shovel', tier: 'iron', miningMultiplier: 6, attackDamage: 3, durability: 251 },

  wooden_sword: { id: 'wooden_sword', name: 'Wooden Sword', toolType: 'sword', tier: 'wood', miningMultiplier: 1.5, attackDamage: 4, durability: 60, isFuel: true, fuelBurnTime: 10 },
  stone_sword: { id: 'stone_sword', name: 'Stone Sword', toolType: 'sword', tier: 'stone', miningMultiplier: 1.5, attackDamage: 5, durability: 132 },
  iron_sword: { id: 'iron_sword', name: 'Iron Sword', toolType: 'sword', tier: 'iron', miningMultiplier: 1.5, attackDamage: 6, durability: 251 },
  diamond_sword: { id: 'diamond_sword', name: 'Diamond Sword', toolType: 'sword', tier: 'diamond', miningMultiplier: 1.5, attackDamage: 7, durability: 1561 },
};

export interface CraftingRecipe {
  id: string;
  width: number;
  height: number;
  pattern: (string | null)[];
  result: ItemStack;
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  // 1x1 recipes (represented as width 1, height 1)
  {
    id: 'planks_from_log',
    width: 1,
    height: 1,
    pattern: ['oak_log'],
    result: { id: 'oak_planks', count: 4 },
  },
  // 1x2 recipes
  {
    id: 'sticks_from_planks',
    width: 1,
    height: 2,
    pattern: ['oak_planks', 'oak_planks'],
    result: { id: 'stick', count: 4 },
  },
  {
    id: 'torches_from_coal_and_stick',
    width: 1,
    height: 2,
    pattern: ['coal', 'stick'],
    result: { id: 'torch', count: 4 },
  },
  // 2x2 recipes
  {
    id: 'crafting_table_from_planks',
    width: 2,
    height: 2,
    pattern: ['oak_planks', 'oak_planks', 'oak_planks', 'oak_planks'],
    result: { id: 'crafting_table', count: 1 },
  },
  {
    id: 'sandstone_from_sand',
    width: 2,
    height: 2,
    pattern: ['sand', 'sand', 'sand', 'sand'],
    result: { id: 'sandstone', count: 1 },
  },
  // 3x3 Tool Recipes
  {
    id: 'wooden_pickaxe',
    width: 3,
    height: 3,
    pattern: [
      'oak_planks', 'oak_planks', 'oak_planks',
      null, 'stick', null,
      null, 'stick', null,
    ],
    result: { id: 'wooden_pickaxe', count: 1 },
  },
  {
    id: 'stone_pickaxe',
    width: 3,
    height: 3,
    pattern: [
      'cobblestone', 'cobblestone', 'cobblestone',
      null, 'stick', null,
      null, 'stick', null,
    ],
    result: { id: 'stone_pickaxe', count: 1 },
  },
  {
    id: 'iron_pickaxe',
    width: 3,
    height: 3,
    pattern: [
      'iron_ingot', 'iron_ingot', 'iron_ingot',
      null, 'stick', null,
      null, 'stick', null,
    ],
    result: { id: 'iron_pickaxe', count: 1 },
  },
  {
    id: 'diamond_pickaxe',
    width: 3,
    height: 3,
    pattern: [
      'diamond', 'diamond', 'diamond',
      null, 'stick', null,
      null, 'stick', null,
    ],
    result: { id: 'diamond_pickaxe', count: 1 },
  },
  // Axes
  {
    id: 'wooden_axe',
    width: 2,
    height: 3,
    pattern: [
      'oak_planks', 'oak_planks',
      'oak_planks', 'stick',
      null, 'stick',
    ],
    result: { id: 'wooden_axe', count: 1 },
  },
  {
    id: 'stone_axe',
    width: 2,
    height: 3,
    pattern: [
      'cobblestone', 'cobblestone',
      'cobblestone', 'stick',
      null, 'stick',
    ],
    result: { id: 'stone_axe', count: 1 },
  },
  {
    id: 'iron_axe',
    width: 2,
    height: 3,
    pattern: [
      'iron_ingot', 'iron_ingot',
      'iron_ingot', 'stick',
      null, 'stick',
    ],
    result: { id: 'iron_axe', count: 1 },
  },
  // Swords
  {
    id: 'wooden_sword',
    width: 1,
    height: 3,
    pattern: [
      'oak_planks',
      'oak_planks',
      'stick',
    ],
    result: { id: 'wooden_sword', count: 1 },
  },
  {
    id: 'stone_sword',
    width: 1,
    height: 3,
    pattern: [
      'cobblestone',
      'cobblestone',
      'stick',
    ],
    result: { id: 'stone_sword', count: 1 },
  },
  {
    id: 'iron_sword',
    width: 1,
    height: 3,
    pattern: [
      'iron_ingot',
      'iron_ingot',
      'stick',
    ],
    result: { id: 'iron_sword', count: 1 },
  },
  {
    id: 'diamond_sword',
    width: 1,
    height: 3,
    pattern: [
      'diamond',
      'diamond',
      'stick',
    ],
    result: { id: 'diamond_sword', count: 1 },
  },
  // Shovels
  {
    id: 'wooden_shovel',
    width: 1,
    height: 3,
    pattern: [
      'oak_planks',
      'stick',
      'stick',
    ],
    result: { id: 'wooden_shovel', count: 1 },
  },
  {
    id: 'stone_shovel',
    width: 1,
    height: 3,
    pattern: [
      'cobblestone',
      'stick',
      'stick',
    ],
    result: { id: 'stone_shovel', count: 1 },
  },
  {
    id: 'iron_shovel',
    width: 1,
    height: 3,
    pattern: [
      'iron_ingot',
      'stick',
      'stick',
    ],
    result: { id: 'iron_shovel', count: 1 },
  },
  // Furnace
  {
    id: 'furnace',
    width: 3,
    height: 3,
    pattern: [
      'cobblestone', 'cobblestone', 'cobblestone',
      'cobblestone', null, 'cobblestone',
      'cobblestone', 'cobblestone', 'cobblestone',
    ],
    result: { id: 'furnace', count: 1 },
  },
  // Chest
  {
    id: 'chest',
    width: 3,
    height: 3,
    pattern: [
      'oak_planks', 'oak_planks', 'oak_planks',
      'oak_planks', null, 'oak_planks',
      'oak_planks', 'oak_planks', 'oak_planks',
    ],
    result: { id: 'chest', count: 1 },
  },
];

export interface SmeltingRecipe {
  input: string;
  output: string;
  cookTime: number; // in seconds, default ~8s
}

export const SMELTING_RECIPES: SmeltingRecipe[] = [
  { input: 'iron_ore', output: 'iron_ingot', cookTime: 8 },
  { input: 'sand', output: 'glass', cookTime: 8 },
  { input: 'cobblestone', output: 'stone', cookTime: 8 },
  { input: 'raw_porkchop', output: 'cooked_porkchop', cookTime: 8 },
  { input: 'raw_beef', output: 'cooked_beef', cookTime: 8 },
];
