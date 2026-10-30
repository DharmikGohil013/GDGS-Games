/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { sound } from '../game/audio';

interface TitleScreenProps {
  onStart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, isMuted, onToggleMute }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between pointer-events-auto bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950/90 text-white p-6 sm:p-10 select-none">
      {/* Top Bar with sound toggle */}
      <div className="w-full max-w-6xl flex justify-between items-center">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-sky-400 font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>ISOMETRIC RETAIL SIMULATOR</span>
        </div>
        <button
          onClick={onToggleMute}
          aria-label={isMuted ? "Unmute sound" : "Mute sound"}
          className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 transition cursor-pointer text-slate-300 hover:text-white"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
        </button>
      </div>

      {/* Hero Centerpiece & Bespoke Inline SVG Title Lockup */}
      <div className="flex flex-col items-center text-center max-w-2xl px-4 py-8">
        {/* Bespoke SVG Logo Badge */}
        <div className="mb-6 relative">
          <svg className="w-24 h-24 sm:w-28 sm:h-28 drop-shadow-2xl" viewBox="0 0 96 96" fill="none">
            {/* Hexagonal Isometric Plaque */}
            <path
              d="M48 6L86 28V68L48 90L10 68V28L48 6Z"
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth="3"
            />
            {/* Inner isometric shop cube */}
            <path d="M48 24L72 38L48 52L24 38L48 24Z" fill="#0284c7" />
            <path d="M24 38L48 52V76L24 62V38Z" fill="#0369a1" />
            <path d="M48 52L72 38V62L48 76V52Z" fill="#075985" />
            {/* Gold Shopping Cart Emblem */}
            <path
              d="M38 42H56L53 54H41L38 42Z"
              fill="#f59e0b"
              stroke="#d97706"
              strokeWidth="1.5"
            />
            <circle cx="42" cy="57" r="2" fill="#fbbf24" />
            <circle cx="52" cy="57" r="2" fill="#fbbf24" />
          </svg>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-500 text-[10px] font-extrabold text-slate-950 uppercase tracking-widest shadow-lg">
            TYCOON
          </div>
        </div>

        {/* Title Lockup */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-3">
          SHOP <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400">TYCOON</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-300 font-medium max-w-lg mb-8 leading-relaxed">
          Design your custom supermarket layout, curate wholesale inventory, set smart profit margins, and manage bustling customer checkouts.
        </p>

        {/* Primary Start CTA */}
        <button
          data-start="true"
          onClick={() => {
            sound.playClick();
            onStart();
          }}
          className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 text-slate-950 font-bold text-lg hover:from-sky-400 hover:to-emerald-400 active:scale-95 transition-all shadow-xl shadow-sky-500/20 cursor-pointer border border-sky-300/40"
        >
          <Play className="w-5 h-5 fill-slate-950 transition-transform group-hover:scale-110" />
          <span>OPEN YOUR STORE</span>
        </button>

        {/* Feature Highlights Pills */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-10 w-full text-center">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-xl mb-1">🏗️</div>
            <div className="text-xs font-bold text-slate-200">Modular Building</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Shelves, Coolers, Displays</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-xl mb-1">📦</div>
            <div className="text-xs font-bold text-slate-200">Custom Inventory</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Wholesale Logistics & Margins</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="text-xl mb-1">👥</div>
            <div className="text-xs font-bold text-slate-200">Staff Automation</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Cashiers & Stock Clerks</div>
          </div>
        </div>
      </div>

      {/* Single Flat Control-Hint Line */}
      <div className="w-full text-center pb-2">
        <p className="text-xs text-slate-400 font-mono-numbers tracking-wider">
          WASD / Drag Pan · Scroll Zoom · R Rotate · Space Pause · Click Shelves to Restock
        </p>
      </div>
    </div>
  );
};
