import React from 'react';
import { BusinessDefinition, BusinessState } from '../types/game';
import { formatMoney } from '../game/finance';
import { sound } from '../game/sound';
import { X, Check, Users } from 'lucide-react';

interface ManagersModalProps {
  isOpen: boolean;
  onClose: () => void;
  businesses: BusinessDefinition[];
  businessStates: Record<string, BusinessState>;
  managers: Record<string, boolean>;
  cash: number;
  onHireManager: (businessId: string, cost: number) => void;
}

export const ManagersModal: React.FC<ManagersModalProps> = ({
  isOpen,
  onClose,
  businesses,
  businessStates,
  managers,
  cash,
  onHireManager,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[85vh] bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden select-none"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">VIP Executives & Managers</h2>
              <p className="text-[11px] text-slate-400">Automate your business floors for 24/7 passive income</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close managers modal"
            className="p-1.5 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Managers List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {businesses.map((biz) => {
            const bState = businessStates[biz.id];
            const isUnlocked = bState && bState.unlocked;
            const isHired = managers[biz.id];
            const cost = biz.manager.cost;
            const canAfford = cash >= cost;

            return (
              <div
                key={biz.id}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  isHired
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : isUnlocked
                    ? 'bg-slate-950/80 border-slate-800'
                    : 'bg-slate-950/40 border-slate-900 opacity-60'
                }`}
              >
                {/* Manager Avatar & Details */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">
                    {biz.manager.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold text-white truncate">{biz.manager.name}</h3>
                      <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1 rounded">
                        FL {biz.floor}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block font-medium">{biz.manager.role}</span>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{biz.manager.description}</p>
                  </div>
                </div>

                {/* Action button */}
                <div className="flex-shrink-0">
                  {isHired ? (
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>HIRED</span>
                    </div>
                  ) : !isUnlocked ? (
                    <div className="text-[10px] font-bold text-slate-400 uppercase bg-slate-800 px-2.5 py-1.5 rounded-xl">
                      Floor Locked
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (canAfford) {
                          sound.playManagerHire();
                          onHireManager(biz.id, cost);
                        }
                      }}
                      disabled={!canAfford}
                      aria-label={`Hire ${biz.manager.name}`}
                      className={`px-3 py-2 rounded-xl font-bold flex flex-col items-center justify-center text-xs transition-all cursor-pointer ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-yellow-500/20 hover:scale-105 active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-wider">HIRE</span>
                      <span className="font-mono font-black">{formatMoney(cost)}</span>
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
