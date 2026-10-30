import React from 'react';
import { formatMoney, formatTime } from '../game/finance';
import { sound } from '../game/sound';
import { Sparkles, Coins } from 'lucide-react';

interface OfflineEarningsModalProps {
  isOpen: boolean;
  onClose: () => void;
  offlineCash: number;
  offlineSeconds: number;
  onClaim: (doubled: boolean) => void;
}

export const OfflineEarningsModal: React.FC<OfflineEarningsModalProps> = ({
  isOpen,
  onClose,
  offlineCash,
  offlineSeconds,
  onClaim,
}) => {
  if (!isOpen || offlineCash <= 0) return null;

  const handleClaim = (doubled: boolean) => {
    sound.playCash();
    onClaim(doubled);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80">
      <div className="w-full max-w-sm bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden select-none animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Badge */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-500 py-3 px-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-slate-950 font-black text-sm uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Welcome Back, Tycoon!</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Coins className="w-9 h-9" />
          </div>

          <div>
            <span className="text-xs text-slate-400 block">While you were away for</span>
            <span className="text-sm font-mono font-bold text-slate-200">{formatTime(offlineSeconds)}</span>
          </div>

          <div className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Managers Collected</span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1 drop-shadow-sm">
              +{formatMoney(offlineCash)}
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Your automated managers worked diligently to keep the cash registers ringing!
          </p>

          {/* Action Claim Buttons */}
          <div className="w-full space-y-2 pt-2">
            <button
              onClick={() => handleClaim(true)}
              aria-label="Claim double cash"
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wide shadow-lg shadow-yellow-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>CLAIM 2X BONUS (+{formatMoney(offlineCash * 2)})</span>
            </button>

            <button
              onClick={() => handleClaim(false)}
              aria-label="Claim normal cash"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Claim Standard (+{formatMoney(offlineCash)})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
