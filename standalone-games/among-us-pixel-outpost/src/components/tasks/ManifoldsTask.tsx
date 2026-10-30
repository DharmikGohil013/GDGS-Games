import React, { useEffect, useState } from 'react';
import { audio } from '../../game/audio.ts';

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

export const ManifoldsTask: React.FC<Props> = ({ onComplete, onClose }) => {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [pressed, setPressed] = useState<number[]>([]);

  useEffect(() => {
    // 1 to 10 shuffled
    const nums = Array.from({ length: 10 }, (_, i) => i + 1);
    setNumbers(nums.sort(() => Math.random() - 0.5));
  }, []);

  const handleClick = (num: number) => {
    if (pressed.includes(num)) return;

    if (num === currentStep) {
      audio.playTaskStep();
      const nextPressed = [...pressed, num];
      setPressed(nextPressed);

      if (currentStep === 10) {
        audio.playTaskComplete();
        setTimeout(() => {
          onComplete();
        }, 500);
      } else {
        setCurrentStep(currentStep + 1);
      }
    } else {
      // Wrong number! Reset sequence!
      audio.playTaskStep();
      setPressed([]);
      setCurrentStep(1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-sm border-4 border-slate-700 bg-slate-900 p-6 text-white shadow-2xl select-none">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-sm font-pixel text-slate-400 hover:text-red-400"
        >
          [X]
        </button>

        <div className="mb-4 text-center">
          <h2 className="font-pixel text-sm text-cyan-400">REACTOR: UNLOCK MANIFOLDS</h2>
          <p className="mt-1 font-retro text-xs text-slate-400">
            PRESS BUTTONS IN ASCENDING NUMERICAL ORDER (1 - 10)
          </p>
        </div>

        {/* Numeric Buttons Grid */}
        <div className="grid grid-cols-5 gap-3 bg-black/40 p-4 border-2 border-slate-800">
          {numbers.map((num) => {
            const isPressed = pressed.includes(num);

            return (
              <button
                key={num}
                onClick={() => handleClick(num)}
                disabled={isPressed}
                className={`flex h-14 w-full items-center justify-center border-2 font-pixel text-sm transition ${
                  isPressed
                    ? 'border-emerald-600 bg-emerald-900/60 text-emerald-400 cursor-default'
                    : 'border-slate-600 bg-slate-800 text-slate-100 hover:border-cyan-400 hover:bg-slate-700 active:scale-95'
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between font-pixel text-[9px] text-slate-500">
          <span>NEXT: #{currentStep <= 10 ? currentStep : 'DONE'}</span>
          <span>PROGRESS: {pressed.length}/10</span>
        </div>
      </div>
    </div>
  );
};
