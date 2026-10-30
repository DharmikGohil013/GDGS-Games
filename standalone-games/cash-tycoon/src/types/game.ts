export interface Milestone {
  level: number;
  type: 'speed' | 'revenue';
  multiplier: number;
  label: string;
}

export interface BusinessDefinition {
  id: string;
  floor: number;
  name: string;
  category: string;
  icon: string;
  themeColor: string;
  accentColor: string;
  baseCost: number;
  costRate: number; // usually 1.07 to 1.15
  baseRevenue: number;
  baseCycleSeconds: number;
  milestones: Milestone[];
  manager: {
    name: string;
    role: string;
    avatar: string;
    cost: number;
    description: string;
  };
}

export interface BusinessState {
  id: string;
  level: number;
  unlocked: boolean;
  progress: number; // 0 to 1
  isRunning: boolean;
  cycleStartTime: number; // timestamp
}

export interface UpgradeDefinition {
  id: string;
  name: string;
  businessId?: string; // if floor specific, or undefined if global
  floorName?: string;
  cost: number;
  multiplier: number; // e.g. 2x or 3x
  type: 'revenue' | 'speed' | 'all';
  icon: string;
  description: string;
}

export interface GameState {
  cash: number;
  lifetimeCash: number;
  famePoints: number; // Crystals / Stars
  businesses: Record<string, BusinessState>;
  managers: Record<string, boolean>; // businessId -> hired
  upgrades: Record<string, boolean>; // upgradeId -> purchased
  lastSaveTime: number;
  frenzyActiveUntil: number;
  lastSpinTime: number;
  bulkBuyCount: 1 | 10 | 25 | 100 | 'MAX';
  soundEnabled: boolean;
  stats: {
    totalTaps: number;
    totalPrestiges: number;
    floorsUnlocked: number;
    gameStartTime: number;
  };
}

export type ActiveTab = 'tower' | 'managers' | 'upgrades' | 'fame' | 'wheel';
