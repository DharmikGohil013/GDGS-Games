import React from 'react';
import { Volume2, VolumeX, Settings, Sparkles, Flame, Wifi, BatteryCharging } from 'lucide-react';
import { formatMoney } from '../game/finance';

interface TopHUDProps {
  cash: number;
  revenuePerSecond: number;
  famePoints: number;
  frenzyRemainingSeconds: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSettings: () => void;
}

export const TopHUD: React.FC<TopHUDProps> = ({
  cash,
  revenuePerSecond,
  famePoints,
  frenzyRemainingSeconds,
  soundEnabled,
  onToggleSound,
  onOpenSettings,
}) => {
  return (
    <header className="w-full bg-slate-900 border-b border-amber-500/20 shadow-md select-none sticky top-0 z-30">
      {/* Mobile Top Bar (Time, Signals) */}
      <div className="flex items-center justify-between px-3 pt-1 text-[10px] text-slate-400 font-mono">
        <span>9:41 AM</span>
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3 h-3 text-slate-400" />
          <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
          <span>100%</span>
        </div>
      </div>

      {/* Main Cash & Net Worth Display */}
      <div className="px-3 py-2 flex items-center justify-between gap-2">
        {/* Left: Net Worth & Cash */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex-shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 p-[1.5px] shadow-md shadow-yellow-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <span className="text-xl font-black text-yellow-400 font-mono">$</span>
            </div>
            {frenzyRemainingSeconds > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 items-center justify-center text-[8px] font-bold text-white">🔥</span>
              </span>
            )}
          </div>

          <div className="min-w-0">
            <span className="text-[10px] font-bold text-amber-400/90 tracking-wider uppercase block">
              Empire Cash
            </span>
            <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight tabular-nums truncate drop-shadow-sm">
              {formatMoney(cash)}
            </div>
          </div>
        </div>

        {/* Right: Quick Utility Buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
            className="w-8 h-8 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            onClick={onOpenSettings}
            aria-label="Settings and Save"
            className="w-8 h-8 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-bar: Revenue Rate & Fame Boost */}
      <div className="px-3 pb-2 flex items-center justify-between text-xs font-mono">
        {/* Income per second */}
        <div className="flex items-center gap-1 text-emerald-400 font-semibold tabular-nums">
          <span className="text-[10px] text-slate-400 uppercase font-sans">Rate:</span>
          <span>+{formatMoney(revenuePerSecond)}/s</span>
        </div>

        {/* Status Badges: Fame & Frenzy */}
        <div className="flex items-center gap-2">
          {frenzyRemainingSeconds > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-[10px] font-bold animate-pulse">
              <Flame className="w-3 h-3" />
              <span>3x FRENZY ({frenzyRemainingSeconds}s)</span>
            </div>
          )}

          {famePoints > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
              <Sparkles className="w-2.5 h-2.5 text-yellow-400" />
              <span>⭐ {famePoints} (+{famePoints * 2}%)</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
