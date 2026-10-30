import { BusinessDefinition, BusinessState, GameState, Milestone, UpgradeDefinition } from '../types/game';

// Suffixes for idle games (standard short scale)
export const MONEY_SUFFIXES = [
  '',
  'K',   // 10^3 Thousand
  'M',   // 10^6 Million
  'B',   // 10^9 Billion
  'T',   // 10^12 Trillion
  'Qa',  // 10^15 Quadrillion
  'Qi',  // 10^18 Quintillion
  'Sx',  // 10^21 Sextillion
  'Sp',  // 10^24 Septillion
  'Oc',  // 10^27 Octillion
  'No',  // 10^30 Nonillion
  'Dc',  // 10^33 Decillion
  'Ud',  // 10^36 Undecillion
  'Dd',  // 10^39 Duodecillion
  'Td',  // 10^42 Tredecillion
  'Qad', // 10^45 Quattuordecillion
  'Qid', // 10^48 Quindecillion
  'Sxd', // 10^51 Sexdecillion
  'Spd', // 10^54 Septendecillion
  'Ocd', // 10^57 Octodecillion
  'Nod', // 10^60 Novemdecillion
  'Vg',  // 10^63 Vigintillion
  'Uvg', // 10^66 Unvigintillion
];

/**
 * Format numbers with high accuracy and standard idle game suffixes (K, M, B, T, Qa, etc.)
 */
export function formatMoney(amount: number, prefix: string = '$'): string {
  if (amount == null || isNaN(amount) || amount < 0) {
    return `${prefix}0.00`;
  }
  if (amount === 0) {
    return `${prefix}0.00`;
  }
  if (amount < 1000) {
    return `${prefix}${amount.toFixed(2)}`;
  }

  const exp = Math.floor(Math.log10(amount));
  const tier = Math.floor(exp / 3);

  if (tier < MONEY_SUFFIXES.length) {
    const unit = MONEY_SUFFIXES[tier];
    const scaled = amount / Math.pow(10, tier * 3);
    // Use 2 decimal places if under 100, 1 decimal place if >= 100
    const decimals = scaled >= 100 ? 1 : 2;
    return `${prefix}${scaled.toFixed(decimals)} ${unit}`;
  }

  // Fallback to scientific notation for astronomical numbers
  return `${prefix}${amount.toExponential(2)}`;
}

/**
 * Format time remaining into readable string (e.g., 0.8s, 12.4s, 3m 45s)
 */
export function formatTime(seconds: number): string {
  if (seconds <= 0) return '0.0s';
  if (seconds < 10) return `${seconds.toFixed(1)}s`;
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  return `${h}h ${remM}m`;
}

/**
 * Calculate the cost to purchase `count` levels of a business starting at `currentLevel`.
 * Uses geometric series sum: Cost = Base * Rate^currentLevel * (Rate^count - 1) / (Rate - 1)
 */
export function calculateCost(baseCost: number, costRate: number, currentLevel: number, count: number): number {
  if (count <= 0) return 0;
  if (costRate <= 1) return baseCost * count;

  // Single level purchase: Base * (Rate ^ currentLevel)
  if (count === 1) {
    return baseCost * Math.pow(costRate, currentLevel);
  }

  // Geometric series: a * (r^k - 1) / (r - 1)
  const a = baseCost * Math.pow(costRate, currentLevel);
  const total = a * (Math.pow(costRate, count) - 1) / (costRate - 1);
  return total;
}

/**
 * Calculate how many levels can be purchased with the player's current cash, and total cost.
 */
export function calculateMaxAffordable(
  baseCost: number,
  costRate: number,
  currentLevel: number,
  availableCash: number
): { count: number; cost: number } {
  if (availableCash <= 0 || baseCost <= 0) {
    return { count: 0, cost: 0 };
  }

  const nextCost = calculateCost(baseCost, costRate, currentLevel, 1);
  if (availableCash < nextCost) {
    return { count: 0, cost: 0 };
  }

  // Solve for k:
  // availableCash >= a * (r^k - 1) / (r - 1)
  // (availableCash * (r - 1) / a) + 1 >= r^k
  // k <= log_r( 1 + availableCash * (r - 1) / a )
  const a = baseCost * Math.pow(costRate, currentLevel);
  const inner = 1 + (availableCash * (costRate - 1)) / a;
  
  if (inner <= 1) {
    return { count: 1, cost: nextCost };
  }

  const maxK = Math.floor(Math.log(inner) / Math.log(costRate));
  const safeK = Math.max(1, maxK);
  const totalCost = calculateCost(baseCost, costRate, currentLevel, safeK);

  // If floating point rounding made totalCost slightly exceed availableCash, step down by 1
  if (totalCost > availableCash && safeK > 1) {
    const adjustedK = safeK - 1;
    return { count: adjustedK, cost: calculateCost(baseCost, costRate, currentLevel, adjustedK) };
  }

  return { count: safeK, cost: totalCost };
}

/**
 * Calculates milestone multiplier for speed and revenue based on current level.
 * Also returns next milestone target and progress.
 */
export function calculateMilestones(level: number, milestones: Milestone[]): {
  speedMultiplier: number;
  revenueMultiplier: number;
  nextMilestone: Milestone | null;
  prevMilestoneLevel: number;
  progressToNext: number; // 0 to 1
} {
  let speedMultiplier = 1;
  let revenueMultiplier = 1;
  let prevMilestoneLevel = 0;
  let nextMilestone: Milestone | null = null;

  // Milestones should be sorted by level ascending
  for (const ms of milestones) {
    if (level >= ms.level) {
      if (ms.type === 'speed') {
        speedMultiplier *= ms.multiplier;
      } else {
        revenueMultiplier *= ms.multiplier;
      }
      prevMilestoneLevel = ms.level;
    } else {
      if (!nextMilestone) {
        nextMilestone = ms;
      }
    }
  }

  let progressToNext = 1;
  if (nextMilestone) {
    const range = nextMilestone.level - prevMilestoneLevel;
    const current = Math.max(0, level - prevMilestoneLevel);
    progressToNext = Math.min(1, Math.max(0, current / range));
  }

  return {
    speedMultiplier,
    revenueMultiplier,
    nextMilestone,
    prevMilestoneLevel,
    progressToNext,
  };
}

/**
 * Calculate the cycle duration in seconds, taking base speed and all speed multipliers into account.
 * Clamped to minimum 0.05s (so animation and audio remain manageable).
 */
export function calculateCycleDuration(
  business: BusinessDefinition,
  level: number,
  upgrades: Record<string, boolean>,
  allUpgrades: UpgradeDefinition[]
): number {
  if (level <= 0) return business.baseCycleSeconds;

  const { speedMultiplier } = calculateMilestones(level, business.milestones);

  // Check purchased upgrades affecting speed
  let upgradeSpeedMult = 1;
  for (const up of allUpgrades) {
    if (upgrades[up.id] && (up.type === 'speed' || up.type === 'all')) {
      if (!up.businessId || up.businessId === business.id) {
        upgradeSpeedMult *= up.multiplier;
      }
    }
  }

  const effectiveDuration = business.baseCycleSeconds / (speedMultiplier * upgradeSpeedMult);
  return Math.max(0.08, effectiveDuration);
}

/**
 * Calculate the revenue generated in one cycle.
 */
export function calculateRevenuePerCycle(
  business: BusinessDefinition,
  level: number,
  upgrades: Record<string, boolean>,
  allUpgrades: UpgradeDefinition[],
  famePoints: number,
  isFrenzy: boolean
): number {
  if (level <= 0) return 0;

  const { revenueMultiplier: milestoneRevMult } = calculateMilestones(level, business.milestones);

  // Upgrades affecting revenue
  let upgradeRevMult = 1;
  for (const up of allUpgrades) {
    if (upgrades[up.id] && (up.type === 'revenue' || up.type === 'all')) {
      if (!up.businessId || up.businessId === business.id) {
        upgradeRevMult *= up.multiplier;
      }
    }
  }

  // Prestige / Fame boost: Each Fame Star gives +2% permanent revenue boost
  const fameBoost = 1 + famePoints * 0.02;

  // Tap Frenzy boost: 3x multiplier
  const frenzyMult = isFrenzy ? 3 : 1;

  // Formula: BaseRevenue * Level * MilestoneRev * UpgradeRev * FameBoost * Frenzy
  return business.baseRevenue * level * milestoneRevMult * upgradeRevMult * fameBoost * frenzyMult;
}

/**
 * Calculate total revenue per second for a business (when automated or on continuous loop).
 */
export function calculateRevenuePerSecond(
  business: BusinessDefinition,
  level: number,
  isAutomated: boolean,
  upgrades: Record<string, boolean>,
  allUpgrades: UpgradeDefinition[],
  famePoints: number,
  isFrenzy: boolean
): number {
  if (level <= 0 || !isAutomated) return 0;
  const cycleRev = calculateRevenuePerCycle(business, level, upgrades, allUpgrades, famePoints, isFrenzy);
  const cycleSec = calculateCycleDuration(business, level, upgrades, allUpgrades);
  return cycleRev / cycleSec;
}

/**
 * Calculate overall Empire Revenue Per Second across all businesses.
 */
export function calculateTotalRevenuePerSecond(
  businesses: BusinessDefinition[],
  states: Record<string, BusinessState>,
  managers: Record<string, boolean>,
  upgrades: Record<string, boolean>,
  allUpgrades: UpgradeDefinition[],
  famePoints: number,
  isFrenzy: boolean
): number {
  let total = 0;
  for (const b of businesses) {
    const s = states[b.id];
    if (s && s.unlocked && s.level > 0 && managers[b.id]) {
      total += calculateRevenuePerSecond(b, s.level, true, upgrades, allUpgrades, famePoints, isFrenzy);
    }
  }
  return total;
}

/**
 * Calculate Fame Stars earned upon selling empire / resetting.
 * Standard formula based on lifetime cash: Fame = floor(150 * sqrt(lifetimeCash / 1e9))
 */
export function calculateClaimableFame(lifetimeCash: number, currentFame: number): number {
  if (lifetimeCash < 10000000) return 0; // minimum 10M cash to gain first prestige
  const totalEarnedFame = Math.floor(150 * Math.sqrt(lifetimeCash / 1e11));
  const newFame = Math.max(0, totalEarnedFame - currentFame);
  return newFame;
}

/**
 * Calculate offline earnings accumulated since lastSaveTime (capped at 24 hours).
 */
export function calculateOfflineEarnings(
  businesses: BusinessDefinition[],
  states: Record<string, BusinessState>,
  managers: Record<string, boolean>,
  upgrades: Record<string, boolean>,
  allUpgrades: UpgradeDefinition[],
  famePoints: number,
  elapsedSeconds: number
): { totalOfflineCash: number; byBusiness: Record<string, number>; cappedSeconds: number } {
  // Cap offline time to 24 hours (86,400 seconds)
  const cappedSeconds = Math.min(86400, Math.max(0, elapsedSeconds));
  if (cappedSeconds < 5) {
    return { totalOfflineCash: 0, byBusiness: {}, cappedSeconds };
  }

  let totalOfflineCash = 0;
  const byBusiness: Record<string, number> = {};

  for (const b of businesses) {
    const s = states[b.id];
    // Only automated businesses generate passive offline cash
    if (s && s.unlocked && s.level > 0 && managers[b.id]) {
      const cycleDuration = calculateCycleDuration(b, s.level, upgrades, allUpgrades);
      const cycleRev = calculateRevenuePerCycle(b, s.level, upgrades, allUpgrades, famePoints, false);
      const cyclesCompleted = cappedSeconds / cycleDuration;
      const earnings = cyclesCompleted * cycleRev;
      byBusiness[b.id] = earnings;
      totalOfflineCash += earnings;
    }
  }

  return { totalOfflineCash, byBusiness, cappedSeconds };
}
