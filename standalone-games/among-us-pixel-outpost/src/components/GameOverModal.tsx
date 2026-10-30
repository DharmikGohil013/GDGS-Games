import React, { useEffect } from 'react';
import { audio } from '../game/audio.ts';

interface Props {
  winner: 'crewmates' | 'impostors';
  winReason: string;
  playerRole: 'crewmate' | 'impostor';
  onPlayAgain: () => void;
  onReturnTitle: () => void;
}

export const GameOverModal: React.FC<Props> = ({
  winner,
  winReason,
  playerRole,
  onPlayAgain,
  onReturnTitle,
}) => {
  const isVictory =
    (winner === 'crewmates' && playerRole === 'crewmate') ||
    (winner === 'impostors' && playerRole === 'impostor');

  useEffect(() => {
    if (isVictory) {
      audio.playVictoryFanfare();
    } else {
      audio.playDefeatSound();
    }
  }, [isVictory]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 select-none">
      <div
        className={`relative w-full max-w-md border-4 p-8 text-center text-white shadow-2xl ${
          isVictory
            ? 'border-emerald-500 bg-slate-950 shadow-[0_0_24px_rgba(16,185,129,0.3)]'
            : 'border-red-600 bg-slate-950 shadow-[0_0_24px_rgba(239,68,68,0.3)]'
        }`}
      >
        <h1
          className={`font-pixel text-2xl md:text-3xl tracking-widest ${
            isVictory ? 'text-emerald-400' : 'text-red-500'
          }`}
        >
          {isVictory ? 'VICTORY' : 'DEFEAT'}
        </h1>

        <div className="mt-2 font-pixel text-xs text-slate-300 uppercase">
          {winner.toUpperCase()} WIN!
        </div>

        <p className="mt-4 font-retro text-sm text-slate-400">
          {winReason}
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3">
          <button
            data-start="true"
            onClick={onPlayAgain}
            className="cursor-pointer border-3 border-emerald-500 bg-emerald-600 py-3 font-pixel text-xs text-white hover:bg-emerald-500 active:scale-95 shadow-md"
          >
            PLAY AGAIN
          </button>
          <button
            onClick={onReturnTitle}
            className="cursor-pointer border border-slate-700 bg-slate-900 py-2 font-pixel text-[10px] text-slate-400 hover:text-slate-200 active:scale-95"
          >
            RETURN TO TITLE
          </button>
        </div>
      </div>
    </div>
  );
};
