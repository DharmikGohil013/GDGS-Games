import React, { useState } from 'react';
import { UpgradeDefinition } from '../types/game';
import { formatMoney } from '../game/finance';
import { sound } from '../game/sound';
import { X, Check, TrendingUp, Zap, Award } from 'lucide-react';

interface UpgradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  upgrades: UpgradeDefinition[];
  purchasedUpgrades: Record<string, boolean>;
  cash: number;
  onBuyUpgrade: (upgradeId: string, cost: number) => void;
}

export const UpgradesModal: React.FC<UpgradesModalProps> = ({
  isOpen,
  onClose,
  upgrades,
  purchasedUpgrades,
  cash,
  onBuyUpgrade,
}) => {
  const [filter, setFilter] = useState<'all' | 'floor' | 'global'>('all');

  if (!isOpen) return null;

  const filteredUpgrades = upgrades.filter((u) => {
    if (filter === 'floor') return !!u.businessId;
    if (filter === 'global') return !u.businessId;
    return true;
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[85vh] bg-slate-900 border border-blue-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden select-none"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Business Research & Upgrades</h2>
              <p className="text-[11px] text-slate-400">Unlock massive revenue multipliers and speed boosts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close upgrades modal"
            className="p-1.5 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2 border-b border-slate-800 flex gap-2 bg-slate-950/30">
          {[
            { id: 'all', label: 'All Upgrades' },
            { id: 'floor', label: 'Floor Boosts' },
            { id: 'global', label: 'Global Multipliers' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                sound.playTap();
                setFilter(tab.id as typeof filter);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filter === tab.id
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Upgrade Cards List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filteredUpgrades.map((up) => {
            const isPurchased = purchasedUpgrades[up.id];
            const canAfford = cash >= up.cost;

            return (
              <div
                key={up.id}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  isPurchased
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                {/* Upgrade Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
                    {up.type === 'speed' ? <Zap className="w-5 h-5" /> : <Award className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold text-white truncate">{up.name}</h3>
                      <span className="text-[9px] font-mono font-black text-amber-400 bg-amber-500/10 px-1 rounded">
                        +{up.multiplier}x {up.type === 'speed' ? 'SPEED' : 'PROFIT'}
                      </span>
                    </div>
                    {up.floorName && (
                      <span className="text-[10px] text-slate-400 font-mono block">{up.floorName}</span>
                    )}
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{up.description}</p>
                  </div>
                </div>

                {/* Purchase Button */}
                <div className="flex-shrink-0">
                  {isPurchased ? (
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>OWNED</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (canAfford) {
                          sound.playLevelUp();
                          onBuyUpgrade(up.id, up.cost);
                        }
                      }}
                      disabled={!canAfford}
                      aria-label={`Buy ${up.name}`}
                      className={`px-3 py-2 rounded-xl font-bold flex flex-col items-center justify-center text-xs transition-all cursor-pointer ${
                        canAfford
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/20 hover:scale-105 active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-wider">UPGRADE</span>
                      <span className="font-mono font-black">{formatMoney(up.cost)}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
