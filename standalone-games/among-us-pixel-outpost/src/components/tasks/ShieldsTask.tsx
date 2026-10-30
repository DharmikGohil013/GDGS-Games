import React, { useState } from 'react';
import { audio } from '../../game/audio.ts';

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

export const ShieldsTask: React.FC<Props> = ({ onComplete, onClose }) => {
  // 7 shield nodes: 0 is center, 1-6 are outer
  const [shields, setShields] = useState<boolean[]>([
    false,
    true,
    false,
    false,
    true,
    false,
    false,
  ]);

  const toggleShield = (index: number) => {
    if (shields[index]) return; // already primed

    audio.playTaskStep();
    const next = [...shields];
    next[index] = true;
    setShields(next);

    if (next.every(Boolean)) {
      audio.playTaskComplete();
      setTimeout(() => {
        onComplete();
      }, 500);
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
          <h2 className="font-pixel text-sm text-sky-400">SHIELDS: PRIME SHIELDS</h2>
          <p className="mt-1 font-retro text-xs text-slate-400">
            TAP ALL RED NODES TO PRIME THE STATION DEFLECTOR
          </p>
        </div>

        {/* Shield Layout */}
        <div className="relative mx-auto my-6 flex h-48 w-48 items-center justify-center rounded-full border-4 border-slate-800 bg-slate-950 p-4">
          {/* Center node */}
          <button
            onClick={() => toggleShield(0)}
            className={`h-14 w-14 rounded border-2 font-pixel text-xs transition active:scale-95 ${
              shields[0]
                ? 'border-cyan-400 bg-cyan-600 shadow-[0_0_12px_#22d3ee]'
                : 'border-red-500 bg-red-700 shadow-[0_0_8px_#ef4444]'
            }`}
          >
            {shields[0] ? 'ON' : 'FIX'}
          </button>

          {/* Surrounding nodes */}
          {[1, 2, 3, 4, 5, 6].map((idx) => {
            const angle = (idx - 1) * (Math.PI / 3) - Math.PI / 2;
            const radius = 68;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
              <button
                key={idx}
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                }}
                onClick={() => toggleShield(idx)}
                className={`absolute h-10 w-10 rounded border-2 font-pixel text-[9px] transition active:scale-95 ${
                  shields[idx]
                    ? 'border-cyan-400 bg-cyan-600 shadow-[0_0_8px_#22d3ee]'
                    : 'border-red-500 bg-red-700 shadow-[0_0_6px_#ef4444]'
                }`}
              >
                {shields[idx] ? 'OK' : 'ACT'}
              </button>
            );
          })}
        </div>

        <div className="flex justify-between font-pixel text-[9px] text-slate-400">
          <span>STATUS: {shields.every(Boolean) ? 'PRIMED' : 'UNSTABLE'}</span>
          <span>PRIMED: {shields.filter(Boolean).length}/7</span>
        </div>
      </div>
    </div>
  );
};
