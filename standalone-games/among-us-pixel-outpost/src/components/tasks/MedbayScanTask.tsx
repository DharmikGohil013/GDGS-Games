import React, { useEffect, useState } from 'react';
import { audio } from '../../game/audio.ts';

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

export const MedbayScanTask: React.FC<Props> = ({ onComplete, onClose }) => {
  const [secondsLeft, setSecondsLeft] = useState(8);

  useEffect(() => {
    audio.playTaskStep();
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          audio.playTaskComplete();
          setTimeout(() => {
            onComplete();
          }, 600);
          return 0;
        }
        audio.playStep();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete]);

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
          <h2 className="font-pixel text-sm text-teal-400">MEDBAY: SUBMIT SCAN</h2>
          <p className="mt-1 font-retro text-xs text-slate-400">
            BIOMETRIC ANALYSIS IN PROGRESS. STAND STILL.
          </p>
        </div>

        {/* Holographic Scanner Graphic */}
        <div className="relative mx-auto my-4 flex h-48 w-48 flex-col items-center justify-center border-2 border-teal-500/40 bg-[#071b1d] p-4">
          <div className="relative flex h-28 w-20 flex-col items-center justify-center border border-teal-400/60 bg-teal-900/20">
            {/* Bean outline */}
            <div className="h-14 w-12 rounded-t-xl bg-teal-400/40 border border-teal-300" />
            <div className="flex gap-2 mt-1">
              <div className="h-6 w-4 bg-teal-400/40 border border-teal-300" />
              <div className="h-6 w-4 bg-teal-400/40 border border-teal-300" />
            </div>

            {/* Scanning beam line */}
            <div className="absolute inset-x-0 h-1 bg-teal-300 shadow-[0_0_8px_#5eead4]" />
          </div>

          <div className="mt-3 font-pixel text-[8px] text-teal-300">
            CREW ID: 902-SKELD
          </div>
        </div>

        <div className="space-y-1 bg-black/50 p-3 font-pixel text-[8px] text-slate-300 border border-slate-800">
          <div>BLOOD TYPE: O-POSITIVE</div>
          <div>WEIGHT: 92 LBS (WITH PACK)</div>
          <div>TIME REMAINING: {secondsLeft}s</div>
        </div>

        <div className="mt-3 text-center font-pixel text-[9px] text-emerald-400">
          {secondsLeft === 0 ? 'SCAN COMPLETE' : 'SCANNING...'}
        </div>
      </div>
    </div>
  );
};
