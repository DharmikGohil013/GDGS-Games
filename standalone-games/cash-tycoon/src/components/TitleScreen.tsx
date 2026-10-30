import React, { useEffect } from 'react';
import { Volume2, VolumeX, Sparkles, Building2, TrendingUp } from 'lucide-react';
import { formatMoney } from '../game/finance';

interface TitleScreenProps {
  onStart: () => void;
  lifetimeCash: number;
  famePoints: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  lifetimeCash,
  famePoints,
  soundEnabled,
  onToggleSound,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-6 select-none overflow-hidden bg-slate-950 text-white">
      {/* Background Skyscraper Silhouette & Neon Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* City Skyline Silhouette SVG */}
        <svg
          className="absolute bottom-0 w-full h-72 opacity-35"
          viewBox="0 0 1000 300"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="skylineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
          </defs>
          {/* Background buildings */}
          <rect x="50" y="80" width="70" height="220" fill="url(#skylineGrad)" />
          <rect x="140" y="40" width="85" height="260" fill="url(#skylineGrad)" />
          <rect x="240" y="110" width="60" height="190" fill="url(#skylineGrad)" />
          <rect x="320" y="20" width="100" height="280" fill="url(#skylineGrad)" />
          <rect x="440" y="90" width="80" height="210" fill="url(#skylineGrad)" />
          <rect x="540" y="50" width="90" height="250" fill="url(#skylineGrad)" />
          <rect x="650" y="30" width="110" height="270" fill="url(#skylineGrad)" />
          <rect x="780" y="100" width="75" height="200" fill="url(#skylineGrad)" />
          <rect x="875" y="60" width="85" height="240" fill="url(#skylineGrad)" />
          {/* Glowing Windows */}
          <circle cx="170" cy="90" r="3" fill="#facc15" opacity="0.8" />
          <circle cx="190" cy="120" r="3" fill="#38bdf8" opacity="0.7" />
          <circle cx="360" cy="80" r="3.5" fill="#facc15" opacity="0.9" />
          <circle cx="380" cy="140" r="3" fill="#ec4899" opacity="0.8" />
          <circle cx="580" cy="110" r="3" fill="#facc15" opacity="0.85" />
          <circle cx="700" cy="90" r="4" fill="#34d399" opacity="0.9" />
          <circle cx="720" cy="160" r="3" fill="#facc15" opacity="0.8" />
        </svg>

        {/* Floating Gold Coin Particles */}
        <div className="absolute top-1/4 left-8 w-4 h-4 rounded-full bg-amber-400 opacity-50 blur-[1px] animate-bounce" />
        <div className="absolute top-1/3 right-10 w-6 h-6 rounded-full bg-yellow-300 opacity-40 blur-[1px] animate-pulse" />
        <div className="absolute bottom-1/3 left-16 w-3 h-3 rounded-full bg-emerald-400 opacity-40 animate-ping" />
        <div className="absolute top-20 right-1/4 w-5 h-5 rounded-full bg-amber-300 opacity-30" />
      </div>

      {/* Top Bar with Sound Toggle */}
      <div className="w-full flex justify-between items-center z-10 pt-2">
        <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800 text-xs text-slate-300">
          <Building2 className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-medium tracking-wide">EMPIRE SIMULATOR</span>
        </div>

        <button
          onClick={onToggleSound}
          className="p-2 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>
      </div>

      {/* Main Title Centerpiece Lockup with Bespoke SVG */}
      <div className="flex flex-col items-center text-center z-10 my-auto max-w-sm">
        {/* Golden Crown & Diamond Emblem */}
        <div className="relative mb-3 flex items-center justify-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 p-0.5 shadow-2xl shadow-yellow-500/20 transform rotate-3 hover:rotate-0 transition-transform">
            <div className="w-full h-full bg-slate-900 rounded-[22px] flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 to-transparent" />
              {/* Dollar & Crown SVG */}
              <svg className="w-14 h-14 text-yellow-400 drop-shadow-[0_2px_10px_rgba(250,204,21,0.5)]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3L12 16.1 7.2 18.6l.9-5.3-3.8-3.7 5.3-.8L12 2z" />
              </svg>
              <span className="text-xs font-bold text-yellow-300 tracking-wider mt-0.5 font-mono">$ CASH</span>
            </div>
          </div>
          <div className="absolute -top-1 -right-2">
            <Sparkles className="w-6 h-6 text-yellow-300 animate-spin" />
          </div>
        </div>

        {/* Title Text */}
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white uppercase drop-shadow-md">
          CASH, INC.
        </h1>
        <div className="flex items-center gap-2 mt-1 mb-2">
          <div className="h-[2px] w-8 bg-gradient-to-r from-transparent to-amber-400" />
          <span className="text-xs sm:text-sm font-bold tracking-[0.25em] text-amber-400 uppercase">
            Fame & Fortune Tycoon
          </span>
          <div className="h-[2px] w-8 bg-gradient-to-l from-transparent to-amber-400" />
        </div>

        <p className="text-slate-400 text-xs sm:text-sm px-4 leading-relaxed mb-6">
          Build floors, hire VIP managers, collect massive profits, and ascend to billionaire status!
        </p>

        {/* Existing Player Stats if resumed */}
        {lifetimeCash > 0 && (
          <div className="w-full mb-6 bg-slate-900/90 border border-amber-500/30 rounded-2xl p-3 flex justify-around items-center">
            <div className="text-center">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Career Earnings</span>
              <span className="text-sm font-bold text-emerald-400 font-mono tabular-nums">{formatMoney(lifetimeCash)}</span>
            </div>
            <div className="w-[1px] h-7 bg-slate-800" />
            <div className="text-center">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Fame Stars</span>
              <span className="text-sm font-bold text-yellow-400 font-mono tabular-nums">⭐ {famePoints}</span>
            </div>
          </div>
        )}

        {/* Primary Start CTA Button */}
        <button
          onClick={onStart}
          data-start="true"
          className="group relative w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-lg tracking-wide uppercase shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer overflow-hidden"
        >
          {/* Shimmer sweep */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform" />
          <div className="flex items-center justify-center gap-2">
            <TrendingUp className="w-5 h-5" />
            <span>{lifetimeCash > 0 ? 'Resume Empire' : 'Build Your Empire'}</span>
          </div>
        </button>
      </div>

      {/* Flat borderless control hint at bottom */}
      <div className="z-10 text-center pb-2">
        <p className="text-[11px] text-slate-400 font-medium tracking-wide">
          Tap to Collect · Space / Enter to Start · Autosaves Progress
        </p>
      </div>
    </div>
  );
};
