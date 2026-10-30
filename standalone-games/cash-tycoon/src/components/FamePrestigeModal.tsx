import React, { useState } from 'react';
import { formatMoney } from '../game/finance';
import { sound } from '../game/sound';
import { X, Crown, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';

interface FamePrestigeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lifetimeCash: number;
  currentFame: number;
  claimableFame: number;
  onPrestige: () => void;
}

export const FamePrestigeModal: React.FC<FamePrestigeModalProps> = ({
  isOpen,
  onClose,
  lifetimeCash,
  currentFame,
  claimableFame,
  onPrestige,
}) => {
  const [confirming, setConfirming] = useState(false);

  if (!isOpen) return null;

  const currentBoostPercent = currentFame * 2;
  const newBoostPercent = (currentFame + claimableFame) * 2;

  const handlePrestigeClick = () => {
    if (claimableFame <= 0) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    sound.playPrestige();
    onPrestige();
    setConfirming(false);
    onClose();
  };

  return (
    <div
      onClick={() => {
        setConfirming(false);
        onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden select-none"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Fame & Fortune Prestige</h2>
              <p className="text-[11px] text-slate-400">Sell your empire to ascend to billionaire celebrity status</p>
            </div>
          </div>
          <button
            onClick={() => {
              setConfirming(false);
              onClose();
            }}
            aria-label="Close prestige modal"
            className="p-1.5 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col items-center text-center space-y-4">
          {/* Big Golden Crown Centerpiece */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-300 p-1 shadow-xl shadow-yellow-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
                <Crown className="w-10 h-10 text-yellow-400 drop-shadow-[0_2px_8px_rgba(250,204,21,0.6)]" />
              </div>
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-yellow-300 animate-spin" />
          </div>

          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Sell Empire & Ascend</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Reset your businesses & current cash in exchange for permanent Fame Stars. Each star grants{' '}
              <span className="text-amber-400 font-bold">+2% permanent profit</span> to all floors forever!
            </p>
          </div>

          {/* Stats Grid */}
          <div className="w-full grid grid-cols-2 gap-2 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
            <div className="p-2 bg-slate-900 rounded-xl">
              <span className="text-[10px] text-slate-400 block font-medium uppercase">Current Stars</span>
              <span className="text-base font-black text-amber-400 font-mono">⭐ {currentFame}</span>
              <span className="text-[10px] text-emerald-400 block">+{currentBoostPercent}% Profit</span>
            </div>

            <div className="p-2 bg-slate-900 rounded-xl border border-amber-500/30">
              <span className="text-[10px] text-amber-300 block font-bold uppercase">Claimable Stars</span>
              <span className="text-base font-black text-yellow-300 font-mono">+{claimableFame}</span>
              <span className="text-[10px] text-emerald-400 block">New: +{newBoostPercent}% Total</span>
            </div>
          </div>

          <div className="w-full text-left bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 font-mono">
            <div className="flex justify-between py-0.5">
              <span>Career Net Worth:</span>
              <span className="text-white font-bold">{formatMoney(lifetimeCash)}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>Prestige Requirement:</span>
              <span className={claimableFame > 0 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {claimableFame > 0 ? 'Ready to Ascend!' : '$10.00 M Career Earnings'}
              </span>
            </div>
          </div>

          {/* Confirmation Warning if active */}
          {confirming && (
            <div className="w-full p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center gap-2 text-left">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <p className="text-[11px] text-amber-200">
                Are you sure? Your cash & floor levels will reset, but you gain +{claimableFame} permanent Fame Stars!
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="w-full flex gap-2">
            {confirming && (
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}

            <button
              onClick={handlePrestigeClick}
              disabled={claimableFame <= 0}
              aria-label="Prestige and claim fame stars"
              className={`flex-1 py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                claimableFame > 0
                  ? confirming
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
                    : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-lg shadow-yellow-500/30 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>
                {claimableFame <= 0
                  ? 'Need $10M Career'
                  : confirming
                  ? 'Confirm & Ascend!'
                  : `Claim +${claimableFame} Stars`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
