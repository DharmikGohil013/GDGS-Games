import React from 'react';
import { calculateMedal, MedalType } from '../game/rules';
import { RotateCcw, Home, Award, Sparkles, Trophy } from 'lucide-react';

interface GameOverModalProps {
  score: number;
  bestScore: number;
  onRestart: () => void;
  onTitle: () => void;
}

const medalConfig: Record<MedalType, { name: string; fill: string; border: string; glow: string }> = {
  none: { name: 'No Medal', fill: '#475569', border: '#334155', glow: 'transparent' },
  bronze: { name: 'Bronze', fill: '#b45309', border: '#78350f', glow: 'rgba(180, 83, 9, 0.4)' },
  silver: { name: 'Silver', fill: '#94a3b8', border: '#64748b', glow: 'rgba(148, 163, 184, 0.4)' },
  gold: { name: 'Gold', fill: '#eab308', border: '#ca8a04', glow: 'rgba(234, 179, 8, 0.5)' },
  platinum: { name: 'Platinum', fill: '#38bdf8', border: '#0284c7', glow: 'rgba(56, 189, 248, 0.6)' },
};

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  bestScore,
  onRestart,
  onTitle,
}) => {
  const isNewBest = score > 0 && score >= bestScore;
  const medal = calculateMedal(score);
  const mInfo = medalConfig[medal];

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/65 select-none"
      role="dialog"
      aria-label="Game Over Summary"
    >
      <div className="w-full max-w-sm bg-gradient-to-b from-[#221c17] to-[#120f0c] border-2 border-[#6b4728] rounded-3xl p-6 shadow-2xl text-center animate-in fade-in zoom-in duration-200">
        {/* Banner Title */}
        <div className="mb-4">
          <h2 className="text-3xl font-black text-orange-500 tracking-wider uppercase drop-shadow-md">
            GAME OVER
          </h2>
          {isNewBest && (
            <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-400/40 rounded-full text-xs font-black text-amber-300 tracking-wider uppercase animate-bounce">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>NEW HIGH SCORE!</span>
            </div>
          )}
        </div>

        {/* Scorecard Plaque */}
        <div className="bg-[#2c2016] border border-[#784d26] rounded-2xl p-4 mb-6 shadow-inner">
          <div className="grid grid-cols-2 gap-4 items-center">
            {/* Medal Section */}
            <div className="flex flex-col items-center border-r border-[#4a321e] pr-2">
              <div className="text-[10px] uppercase font-bold text-amber-400/80 tracking-wider mb-1.5">
                MEDAL EARNED
              </div>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center border-2 shadow-lg mb-1"
                style={{
                  backgroundColor: mInfo.fill,
                  borderColor: mInfo.border,
                  boxShadow: `0 0 15px ${mInfo.glow}`,
                }}
              >
                {medal !== 'none' ? (
                  <Trophy className="w-8 h-8 text-white drop-shadow" />
                ) : (
                  <Award className="w-8 h-8 text-white/40" />
                )}
              </div>
              <span className="text-xs font-black uppercase text-amber-200 tracking-wide">
                {mInfo.name}
              </span>
            </div>

            {/* Score Numbers */}
            <div className="flex flex-col gap-2.5 text-right pl-2">
              <div>
                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  FLIGHT SCORE
                </div>
                <div className="text-3xl font-black font-mono text-white tabular-nums leading-none">
                  {score}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  BEST ALL TIME
                </div>
                <div className="text-2xl font-black font-mono text-amber-300 tabular-nums leading-none">
                  {bestScore}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            data-start="true"
            onClick={onRestart}
            aria-label="Play Again"
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-amber-950 font-black text-lg uppercase tracking-wider rounded-xl shadow-[0_6px_0_#9a3412] active:translate-y-1 active:shadow-[0_2px_0_#9a3412] flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            onClick={onTitle}
            className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
