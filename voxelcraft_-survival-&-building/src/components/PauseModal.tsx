/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Volume2, VolumeX, Play, RotateCcw, Home, Sun, Moon } from 'lucide-react';
import { sound } from '../game/audio';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onTitle: () => void;
  gameMode: 'survival' | 'creative';
  onToggleGameMode: () => void;
  onSetTimeOfDay: (time: number) => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onTitle,
  gameMode,
  onToggleGameMode,
  onSetTimeOfDay,
}) => {
  const [isMuted, setIsMuted] = useState(sound.isMuted);

  const toggleSound = () => {
    setIsMuted(sound.toggleMute());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 select-none">
      <div className="w-full max-w-md bg-stone-900 border-4 border-stone-700 p-6 text-stone-200 shadow-2xl flex flex-col items-center text-center pointer-events-auto">
        {/* Title */}
        <h2 className="text-xl font-mono font-bold tracking-widest text-amber-400 mb-6 uppercase border-b-2 border-stone-800 pb-2 w-full">
          Game Paused
        </h2>

        {/* Buttons List */}
        <div className="flex flex-col gap-3 w-full mb-6">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-sm uppercase tracking-wider border-2 border-emerald-400 shadow-[0_4px_0_#065f46] active:translate-y-0.5 cursor-pointer transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            Resume Game
          </button>

          <button
            onClick={onToggleGameMode}
            className="flex items-center justify-center gap-2 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-mono text-xs uppercase tracking-wider border border-stone-600 cursor-pointer transition-all"
          >
            <span>Game Mode:</span>
            <span className="text-amber-400 font-bold">{gameMode.toUpperCase()}</span>
          </button>

          <button
            onClick={toggleSound}
            className="flex items-center justify-center gap-2 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-mono text-xs uppercase tracking-wider border border-stone-600 cursor-pointer transition-all"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>Audio: {isMuted ? 'Muted' : 'Enabled'}</span>
          </button>

          {/* Time of Day Presets */}
          <div className="flex gap-2">
            <button
              onClick={() => onSetTimeOfDay(0.25)}
              className="flex-1 flex items-center justify-center gap-1 py-2 bg-stone-800 hover:bg-stone-700 text-amber-300 font-mono text-[11px] uppercase border border-stone-600"
            >
              <Sun className="w-3.5 h-3.5" />
              Day
            </button>
            <button
              onClick={() => onSetTimeOfDay(0.75)}
              className="flex-1 flex items-center justify-center gap-1 py-2 bg-stone-800 hover:bg-stone-700 text-indigo-300 font-mono text-[11px] uppercase border border-stone-600"
            >
              <Moon className="w-3.5 h-3.5" />
              Night
            </button>
          </div>

          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-mono text-xs uppercase tracking-wider border border-stone-600 cursor-pointer transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Respawn / Reset Realm
          </button>

          <button
            onClick={onTitle}
            className="flex items-center justify-center gap-2 py-2.5 bg-stone-950 hover:bg-stone-800 text-stone-400 hover:text-white font-mono text-xs uppercase tracking-wider border border-stone-800 cursor-pointer transition-all"
          >
            <Home className="w-3.5 h-3.5" />
            Return to Title
          </button>
        </div>

        <span className="text-[11px] font-mono text-stone-500">
          Press [Esc] or [P] to Resume
        </span>
      </div>
    </div>
  );
};
