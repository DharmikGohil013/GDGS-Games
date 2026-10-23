/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RotateCcw, Home, Skull } from 'lucide-react';

interface GameOverModalProps {
  score: number;
  onRespawn: () => void;
  onTitle: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  onRespawn,
  onTitle,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-rose-950/80 p-4 select-none">
      <div className="w-full max-w-md bg-stone-900 border-4 border-rose-800 p-8 text-stone-200 shadow-2xl flex flex-col items-center text-center pointer-events-auto">
        {/* Skull Icon */}
        <div className="w-12 h-12 bg-rose-900/60 border-2 border-rose-600 rounded-none flex items-center justify-center mb-4">
          <Skull className="w-7 h-7 text-rose-300" />
        </div>

        {/* You Died title */}
        <h2 className="text-3xl font-mono font-black tracking-widest text-rose-500 mb-2 uppercase drop-shadow-[0_2px_4px_#000]">
          You Died!
        </h2>
        <p className="text-stone-400 text-xs font-mono mb-6">
          You succumbed to the wilderness. Your inventory was dropped.
        </p>

        {/* Stats card */}
        <div className="w-full bg-stone-950 p-4 border border-stone-800 mb-6 flex justify-around">
          <div>
            <span className="block text-[10px] font-mono text-stone-400 uppercase">Score (XP)</span>
            <span className="text-xl font-mono font-bold text-lime-400">{score}</span>
          </div>
          <div className="border-r border-stone-800" />
          <div>
            <span className="block text-[10px] font-mono text-stone-400 uppercase">World Mode</span>
            <span className="text-xl font-mono font-bold text-amber-400">SURVIVAL</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          <button
            data-start="true"
            onClick={onRespawn}
            className="flex items-center justify-center gap-2 py-3 bg-rose-700 hover:bg-rose-600 active:translate-y-0.5 text-white font-mono font-bold text-sm uppercase tracking-wider border-2 border-rose-500 shadow-[0_4px_0_#4c0519] cursor-pointer transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Respawn
          </button>

          <button
            onClick={onTitle}
            className="flex items-center justify-center gap-2 py-2.5 bg-stone-950 hover:bg-stone-800 text-stone-400 hover:text-white font-mono text-xs uppercase tracking-wider border border-stone-800 cursor-pointer transition-all"
          >
            <Home className="w-3.5 h-3.5" />
            Title Menu
          </button>
        </div>
      </div>
    </div>
  );
};
