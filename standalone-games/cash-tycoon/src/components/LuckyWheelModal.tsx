import React, { useState } from 'react';
import { formatMoney } from '../game/finance';
import { sound } from '../game/sound';
import { X, Sparkles, Trophy } from 'lucide-react';

interface Prize {
  label: string;
  type: 'cash_mult' | 'fame' | 'frenzy';
  value: number; // e.g. minutes of cash or stars or frenzy seconds
  color: string;
}

const PRIZES: Prize[] = [
  { label: '15m Cash', type: 'cash_mult', value: 900, color: '#f59e0b' },
  { label: '+5 Stars', type: 'fame', value: 5, color: '#8b5cf6' },
  { label: '3x Frenzy', type: 'frenzy', value: 30, color: '#ef4444' },
  { label: '1h Cash', type: 'cash_mult', value: 3600, color: '#10b981' },
  { label: '+10 Stars', type: 'fame', value: 10, color: '#ec4899' },
  { label: '30m Cash', type: 'cash_mult', value: 1800, color: '#06b6d4' },
  { label: '3x Frenzy', type: 'frenzy', value: 30, color: '#f97316' },
  { label: '2h Jackpot', type: 'cash_mult', value: 7200, color: '#eab308' },
];

interface LuckyWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashRate: number;
  onAwardPrize: (prize: Prize, awardedCash: number) => void;
}

export const LuckyWheelModal: React.FC<LuckyWheelModalProps> = ({
  isOpen,
  onClose,
  cashRate,
  onAwardPrize,
}) => {
  const [rotation, setRotation] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wonPrize, setWonPrize] = useState<{ prize: Prize; cashAward: number } | null>(null);

  if (!isOpen) return null;

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWonPrize(null);
    sound.playTap();

    // Select random prize (0 to 7)
    const prizeIndex = Math.floor(Math.random() * PRIZES.length);
    const sliceAngle = 360 / PRIZES.length;
    // 5 full rotations + landing slice
    const totalExtraSpins = 360 * 5;
    // Arrow is at the top (270 deg or 0 deg depending on orientation)
    const targetAngle = totalExtraSpins + (360 - prizeIndex * sliceAngle - sliceAngle / 2);

    setRotation((prev) => prev + targetAngle);

    // Play tick sounds periodically
    const tickInterval = setInterval(() => {
      sound.playWheelTick();
    }, 180);

    setTimeout(() => {
      clearInterval(tickInterval);
      setIsSpinning(false);
      sound.playWheelWin();

      const prize = PRIZES[prizeIndex];
      let awardedCash = 0;
      if (prize.type === 'cash_mult') {
        awardedCash = Math.max(500, cashRate * prize.value);
      }
      setWonPrize({ prize, cashAward: awardedCash });
      onAwardPrize(prize, awardedCash);
    }, 3500);
  };

  return (
    <div
      onClick={() => {
        if (!isSpinning) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-slate-900 border border-yellow-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden select-none"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <h2 className="text-base font-bold text-white tracking-wide">Daily Fortune Wheel</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close fortune wheel modal"
            className="p-1.5 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wheel Body */}
        <div className="p-5 flex flex-col items-center">
          {/* Top Indicator Arrow */}
          <div className="z-10 -mb-3 flex justify-center">
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-yellow-400 drop-shadow-md" />
          </div>

          {/* Rotating Wheel Container */}
          <div className="relative w-64 h-64 rounded-full border-4 border-yellow-500/80 shadow-2xl overflow-hidden bg-slate-950">
            <div
              className="w-full h-full rounded-full transition-transform duration-[3500ms] ease-out"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              {PRIZES.map((prize, idx) => {
                const angle = (360 / PRIZES.length) * idx;
                return (
                  <div
                    key={idx}
                    className="absolute w-1/2 h-full top-0 right-0 origin-left flex items-center"
                    style={{
                      transform: `rotate(${angle}deg)`,
                    }}
                  >
                    <div
                      className="w-full h-full opacity-90 flex items-center justify-end pr-3"
                      style={{
                        background: `linear-gradient(90deg, transparent 40%, ${prize.color} 100%)`,
                      }}
                    >
                      <span className="text-[10px] font-black text-slate-950 drop-shadow-sm uppercase font-mono tracking-tighter">
                        {prize.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Center Golden Knob */}
            <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-300 p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-xs font-black text-yellow-400 font-mono">
                SPIN
              </div>
            </div>
          </div>

          {/* Won Prize Banner */}
          {wonPrize && (
            <div className="mt-4 w-full p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-center animate-bounce">
              <span className="text-[10px] text-amber-300 block font-bold uppercase">WINNER!</span>
              <span className="text-base font-black text-yellow-400 font-mono">
                {wonPrize.prize.type === 'cash_mult'
                  ? `+${formatMoney(wonPrize.cashAward)} Cash!`
                  : wonPrize.prize.type === 'fame'
                  ? `+${wonPrize.prize.value} Fame Stars!`
                  : `🔥 30s Tap Frenzy Activated!`}
              </span>
            </div>
          )}

          {/* Action Spin CTA */}
          <button
            onClick={handleSpin}
            disabled={isSpinning}
            aria-label="Spin lucky wheel"
            className={`mt-5 w-full py-3.5 px-6 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              !isSpinning
                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-lg shadow-yellow-500/30 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Trophy className="w-5 h-5" />
            <span>{isSpinning ? 'Spinning...' : 'SPIN FOR FREE!'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
