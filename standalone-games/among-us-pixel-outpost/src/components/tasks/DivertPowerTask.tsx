import React, { useState } from 'react';
import { audio } from '../../game/audio.ts';

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

export const DivertPowerTask: React.FC<Props> = ({ onComplete, onClose }) => {
  const [sliderVal, setSliderVal] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSliderVal(val);
    audio.playStep();

    if (val >= 95) {
      audio.playTaskComplete();
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 select-none">
      <div className="relative w-full max-w-sm border-4 border-slate-700 bg-slate-900 p-6 text-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-sm font-pixel text-slate-400 hover:text-red-400"
        >
          [X]
        </button>

        <div className="mb-4 text-center">
          <h2 className="font-pixel text-sm text-yellow-400">ELECTRICAL: DIVERT POWER</h2>
          <p className="mt-1 font-retro text-xs text-slate-400">
            SLIDE THE MAIN POWER BREAKER UP TO ROUTE AUXILIARY CURRENT
          </p>
        </div>

        {/* Breaker Panel */}
        <div className="mx-auto my-6 flex h-48 w-32 flex-col items-center justify-between border-2 border-slate-700 bg-black p-4">
          <div className="font-pixel text-[9px] text-emerald-400">
            {sliderVal >= 95 ? 'ONLINE' : 'OFFLINE'}
          </div>

          {/* Vertical Slider */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderVal}
            onChange={handleChange}
            className="h-32 w-4 cursor-pointer accent-amber-500"
          />

          <div className="font-pixel text-[8px] text-slate-500">
            LOAD: {sliderVal}%
          </div>
        </div>

        <div className="text-center font-pixel text-[9px] text-slate-400">
          {sliderVal >= 95 ? (
            <span className="text-emerald-400">POWER ROUTED SUCCESSFULLY</span>
          ) : (
            'SLIDE TO 100%'
          )}
        </div>
      </div>
    </div>
  );
};
