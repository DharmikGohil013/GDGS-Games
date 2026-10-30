import React, { useState } from 'react';
import {
  BusinessDefinition,
  BusinessState,
  UpgradeDefinition,
} from '../types/game';
import {
  formatMoney,
  formatTime,
  calculateCost,
  calculateMaxAffordable,
  calculateMilestones,
  calculateRevenuePerCycle,
  calculateCycleDuration,
} from '../game/finance';
import { sound } from '../game/sound';
import { BulkBuyOption } from './BulkBuyToggle';
import { Sparkles, Zap, Lock, UserCheck } from 'lucide-react';

interface FloorCardProps {
  business: BusinessDefinition;
  state: BusinessState;
  isAutomated: boolean;
  bulkBuy: BulkBuyOption;
  cash: number;
  upgrades: Record<string, boolean>;
  allUpgrades: UpgradeDefinition[];
  famePoints: number;
  isFrenzy: boolean;
  onBuyLevels: (businessId: string, count: number, cost: number) => void;
  onManualWork: (businessId: string) => void;
  onUnlockFloor: (businessId: string, cost: number) => void;
}

export const FloorCard: React.FC<FloorCardProps> = ({
  business,
  state,
  isAutomated,
  bulkBuy,
  cash,
  upgrades,
  allUpgrades,
  famePoints,
  isFrenzy,
  onBuyLevels,
  onManualWork,
  onUnlockFloor,
}) => {
  const [tapJuice, setTapJuice] = useState(false);
  const [floatingCoin, setFloatingCoin] = useState<{ id: number; text: string } | null>(null);

  const isUnlocked = state.unlocked;
  const currentLevel = state.level;

  // Finance calculations
  const cycleDuration = calculateCycleDuration(business, currentLevel, upgrades, allUpgrades);
  const revenuePerCycle = calculateRevenuePerCycle(
    business,
    Math.max(1, currentLevel),
    upgrades,
    allUpgrades,
    famePoints,
    isFrenzy
  );
  const { nextMilestone, progressToNext, prevMilestoneLevel } = calculateMilestones(
    currentLevel,
    business.milestones
  );

  // Bulk buy calculations
  let buyCount = 1;
  let totalCost = 0;
  let canAfford = false;

  if (bulkBuy === 'MAX') {
    const maxInfo = calculateMaxAffordable(business.baseCost, business.costRate, currentLevel, cash);
    buyCount = Math.max(1, maxInfo.count);
    totalCost = maxInfo.count > 0 ? maxInfo.cost : calculateCost(business.baseCost, business.costRate, currentLevel, 1);
    canAfford = maxInfo.count > 0 && cash >= totalCost;
  } else {
    buyCount = bulkBuy;
    totalCost = calculateCost(business.baseCost, business.costRate, currentLevel, buyCount);
    canAfford = cash >= totalCost;
  }

  // Handle Level Upgrade Purchase
  const handleUpgradeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canAfford) return;

    sound.playLevelUp();
    onBuyLevels(business.id, buyCount, totalCost);

    // Check if crossing milestone
    const newLevel = currentLevel + buyCount;
    if (nextMilestone && newLevel >= nextMilestone.level) {
      sound.playMilestone();
    }
  };

  // Handle Manual Tap Work
  const handleTapWork = () => {
    if (!isUnlocked) return;
    sound.playTap();
    setTapJuice(true);
    setTimeout(() => setTapJuice(false), 150);

    // Floating text pop
    const coinId = Date.now();
    setFloatingCoin({ id: coinId, text: `+${formatMoney(revenuePerCycle)}` });
    setTimeout(() => {
      setFloatingCoin((prev) => (prev?.id === coinId ? null : prev));
    }, 900);

    onManualWork(business.id);
  };

  // RENDER: Locked Floor
  if (!isUnlocked) {
    const unlockCost = business.baseCost;
    const canUnlock = cash >= unlockCost;

    return (
      <div className="mx-2 my-2 rounded-2xl bg-slate-900/90 border border-slate-800 p-3 shadow-md flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-amber-500/80 bg-amber-500/10 px-1.5 py-0.5 rounded uppercase">
                Floor {business.floor}
              </span>
              <span className="text-xs text-slate-500 font-medium">{business.category}</span>
            </div>
            <h3 className="text-sm font-bold text-slate-300">{business.name}</h3>
          </div>
        </div>

        <button
          onClick={() => {
            if (canUnlock) {
              sound.playCash();
              onUnlockFloor(business.id, unlockCost);
            }
          }}
          disabled={!canUnlock}
          aria-label={`Unlock ${business.name}`}
          className={`px-3 py-2 rounded-xl font-bold text-xs flex flex-col items-center justify-center transition-all cursor-pointer ${
            canUnlock
              ? 'bg-gradient-to-r from-emerald-500 to-green-400 text-slate-950 shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
          }`}
        >
          <span className="text-[9px] uppercase tracking-wider">Unlock Floor</span>
          <span className="font-mono font-black">{formatMoney(unlockCost)}</span>
        </button>
      </div>
    );
  }

  // RENDER: Unlocked Floor Card with 2D animated scenes
  return (
    <div
      onClick={handleTapWork}
      className={`mx-2 my-2 rounded-2xl bg-slate-900 border transition-all duration-150 select-none shadow-md overflow-hidden relative cursor-pointer ${
        tapJuice ? 'scale-[0.985] border-amber-400/80' : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top Floor Header */}
      <div className="px-3 pt-2.5 pb-1 flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Floor number pip */}
          <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-lg font-mono flex-shrink-0">
            FL {business.floor}
          </span>
          <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
            {business.name}
          </h3>
        </div>

        {/* Level & Automation Status */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {isAutomated ? (
            <span
              title="Manager is running automated production"
              className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20"
            >
              <UserCheck className="w-3 h-3" />
              <span>AUTO</span>
            </span>
          ) : (
            <span className="text-[9px] font-bold text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded animate-pulse">
              TAP TO WORK
            </span>
          )}

          <span className="text-[11px] font-mono font-bold text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded-lg border border-slate-700">
            Lv. {currentLevel}
          </span>
        </div>
      </div>

      {/* 2D Animated Floor Stage & Worker */}
      <div className="px-3 py-1.5 flex items-center justify-between gap-2">
        {/* Left: Themed Character Booth & Props */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Animated Booth Avatar */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl relative shadow-inner overflow-hidden flex-shrink-0"
            style={{ backgroundColor: `${business.themeColor}25`, borderColor: business.themeColor }}
          >
            {/* Custom 2D character prop animations */}
            {business.id === 'comic_stand' && (
              <div className="flex flex-col items-center">
                <span className="text-xl animate-bounce [animation-duration:1.8s]">📚</span>
              </div>
            )}
            {business.id === 'coffee_cart' && (
              <div className="relative flex flex-col items-center">
                <span className="text-xl">☕</span>
                <span className="absolute -top-1 text-[10px] text-amber-200 animate-ping">♨️</span>
              </div>
            )}
            {business.id === 'laundromat' && (
              <div className="flex items-center justify-center">
                <span className="text-xl animate-spin [animation-duration:3s]">🌀</span>
              </div>
            )}
            {business.id === 'sushi_bar' && (
              <div className="flex items-center justify-center">
                <span className="text-xl animate-pulse">🍣</span>
              </div>
            )}
            {business.id === 'arcade_vr' && (
              <div className="flex items-center justify-center">
                <span className="text-xl animate-bounce [animation-duration:1.2s]">🕹️</span>
              </div>
            )}
            {business.id === 'boutique_fashion' && (
              <div className="flex items-center justify-center">
                <span className="text-xl animate-pulse">👗</span>
              </div>
            )}
            {business.id === 'crypto_mining' && (
              <div className="flex items-center justify-center">
                <span className="text-xl animate-spin [animation-duration:4s]">💻</span>
              </div>
            )}
            {business.id === 'casino_penthouse' && (
              <div className="flex items-center justify-center">
                <span className="text-xl animate-bounce [animation-duration:1.5s]">🎲</span>
              </div>
            )}
            {business.id === 'space_tourism' && (
              <div className="flex items-center justify-center">
                <span className="text-xl animate-pulse">🚀</span>
              </div>
            )}
            {business.id === 'multiverse_portal' && (
              <div className="flex items-center justify-center">
                <span className="text-xl animate-spin [animation-duration:6s]">🌌</span>
              </div>
            )}
          </div>

          {/* Revenue & Cycle Stats */}
          <div className="min-w-0">
            <div className="text-sm font-black text-emerald-400 font-mono tabular-nums leading-none mb-1">
              +{formatMoney(revenuePerCycle)}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
              <span>{formatTime(cycleDuration)}/cycle</span>
              <span>•</span>
              <span className="text-slate-500">{business.category}</span>
            </div>
          </div>
        </div>

        {/* Right: Buy Level Upgrade Button */}
        <button
          onClick={handleUpgradeClick}
          disabled={!canAfford}
          aria-label={`Buy ${buyCount} levels for ${business.name}`}
          className={`px-3 py-2 rounded-xl font-bold flex flex-col items-center justify-center transition-all cursor-pointer flex-shrink-0 min-w-[90px] ${
            canAfford
              ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-md shadow-yellow-500/20 hover:scale-105 active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
          }`}
        >
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-black tracking-wider uppercase">BUY +{buyCount}</span>
          </div>
          <span className="text-xs font-mono font-black tabular-nums">{formatMoney(totalCost)}</span>
        </button>
      </div>

      {/* Cycle Progress Bar */}
      <div className="px-3 pt-1 pb-1">
        <div className="relative w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full rounded-full transition-all duration-75"
            style={{
              width: `${Math.min(100, Math.max(0, state.progress * 100))}%`,
              background: `linear-gradient(90deg, ${business.themeColor}, #fbbf24)`,
            }}
          />
          {/* Shine gloss line */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Milestone Progress Bar & Bonus Preview */}
      <div className="px-3 pb-2 pt-0.5 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-amber-400" />
          <span>
            Milestone: {currentLevel}/{nextMilestone ? nextMilestone.level : 'MAX'}
          </span>
        </div>

        {nextMilestone && (
          <span className="font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.2 rounded flex items-center gap-0.5">
            <Zap className="w-2.5 h-2.5" />
            {nextMilestone.label}
          </span>
        )}
      </div>

      {/* Floating Cash Pop on Tap */}
      {floatingCoin && (
        <div className="absolute top-2 right-1/3 pointer-events-none text-emerald-400 font-mono font-black text-sm drop-shadow-md animate-bounce z-20">
          {floatingCoin.text}
        </div>
      )}
    </div>
  );
};
