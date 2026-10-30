export type ToolType = 'hoe' | 'water_can' | 'axe' | 'shears' | 'fertilizer';

export type ItemCategory = 'tool' | 'seed' | 'crop' | 'material' | 'food';

export interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  icon: string; // identifier for pixel sprite rendering
  maxStack: number;
  energyCost?: number;
  energyRestore?: number;
  buyPrice: number;
  sellPrice: number;
  growTimeSeconds?: number;
  harvestItemId?: string;
  xpGain?: number;
}

export interface InventorySlot {
  itemId: string;
  count: number;
}

export interface FarmPlot {
  id: string;
  x: number;
  y: number;
  isTilled: boolean;
  cropId: string | null;
  plantedAt: number;
  isWatered: boolean;
  wateredAt: number;
  stage: number; // 0: empty, 1: sprout, 2: growing, 3: mature / ready
  harvestCount?: number;
}

export interface TreeEntity {
  id: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  type: 'oak' | 'fruit' | 'pine' | 'golden';
  hasFruit: boolean;
  lastChoppedAt?: number;
}

export interface ChickenEntity {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  hunger: number;
  hasEgg: boolean;
  direction: 'left' | 'right';
  lastMoved: number;
  name?: string;
}

export interface RemotePlayer {
  id: string;
  name: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  direction: 'up' | 'down' | 'left' | 'right';
  isMoving: boolean;
  colorHair: string;
  colorShirt: string;
  colorPants: string;
  speechText?: string;
  speechExpiresAt?: number;
  actionTimer?: number;
}

export interface Quest {
  id: string;
  title: string;
  npcName: string;
  npcDialogue: string[];
  objectiveDescription: string;
  targetType: 'till' | 'plant' | 'water' | 'harvest' | 'chop' | 'sell' | 'talk';
  targetCount: number;
  currentCount: number;
  completed: boolean;
  rewardCoins: number;
  rewardXp: number;
  rewardItems?: { itemId: string; count: number }[];
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  isPlayer: boolean;
  timestamp: number;
  color?: string;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  createdAt: number;
  duration: number;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  resultItemId: string;
  resultCount: number;
  requiredItems: { itemId: string; count: number }[];
  energyCost: number;
  description: string;
}

export interface HoverTarget {
  worldX: number;
  worldY: number;
  tileX: number;
  tileY: number;
  type: 'plot' | 'tree' | 'chicken' | 'npc' | 'building' | 'portal' | 'ground' | 'sauna';
  label: string;
  subLabel?: string;
  isValidAction: boolean;
  actionCost?: string;
  targetId?: string;
}
