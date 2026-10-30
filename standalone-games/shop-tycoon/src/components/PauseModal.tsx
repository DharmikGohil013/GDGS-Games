/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import { sound } from '../game/audio';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onTitle: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  day: number;
  cash: number;
  reputation: number;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onTitle,
  isMuted,
  onToggleMute,
  day,
  cash,
  reputation
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 pointer-events-auto">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 text-white shadow-2xl flex flex-col items-center text-center">
        {/* Status Emblem */}
        <div className="w-12 h-12 rounded-2xl bg-sky-950/80 border border-sky-500/50 flex items-center justify-center text-sky-400 mb-4 shadow-lg shadow-sky-950/50">
          <Play className="w-6 h-6 fill-sky-400" />
        </div>

        <h2 className="text-xl font-extrabold text-white mb-1 tracking-tight">GAME PAUSED</h2>
        <p className="text-xs text-slate-400 mb-5">
          Store simulation paused. Take your time to plan your layout and pricing strategy.
        </p>

        {/* 2-3 Tabular-nums Stat Tiles as required by guidelines */}
        <div className="grid grid-cols-3 gap-2 w-full mb-6 font-mono-numbers">
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase font-sans">Day</div>
            <div className="text-sm font-bold text-white">{day}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase font-sans">Capital</div>
            <div className="text-sm font-bold text-emerald-400">${Math.round(cash)}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase font-sans">Rating</div>
            <div className="text-sm font-bold text-amber-400">{reputation.toFixed(1)}★</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5">
          <button
            onClick={() => {
              sound.playClick();
              onResume();
            }}
            className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition shadow-lg shadow-sky-900/30 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Resume Simulation</span>
          </button>

          <button
            onClick={onToggleMute}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>{isMuted ? 'Unmute Audio' : 'Mute Audio'}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onRestart();
            }}
            className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700/60 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart New Store</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onTitle();
            }}
            className="w-full py-2 rounded-xl text-slate-400 hover:text-white font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
