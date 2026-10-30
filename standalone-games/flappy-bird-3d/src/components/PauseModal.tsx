import React from 'react';
import { Play, RotateCcw, Home } from 'lucide-react';

interface PauseModalProps {
  score: number;
  bestScore: number;
  onResume: () => void;
  onRestart: () => void;
  onTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  score,
  bestScore,
  onResume,
  onRestart,
  onTitle,
}) => {
  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/60 select-none"
      role="dialog"
      aria-label="Pause Menu"
    >
      <div className="w-full max-w-sm bg-[#1c2331] border-2 border-[#3b4b66] rounded-2xl p-6 shadow-2xl text-center">
        <h2 className="text-2xl font-black text-amber-400 tracking-wider uppercase mb-4">
          GAME PAUSED
        </h2>

        {/* Current Run Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-6 bg-black/40 border border-white/5 p-3 rounded-xl">
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Score</div>
            <div className="text-2xl font-black font-mono text-white tabular-nums">{score}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Best Record</div>
            <div className="text-2xl font-black font-mono text-amber-300 tabular-nums">{bestScore}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-emerald-950 font-black text-base uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Play className="w-5 h-5 fill-emerald-950" />
            <span>Resume</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart</span>
          </button>

          <button
            onClick={onTitle}
            className="w-full py-2.5 text-gray-400 hover:text-white font-semibold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
