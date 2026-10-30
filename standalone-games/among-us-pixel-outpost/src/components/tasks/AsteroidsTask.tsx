import React, { useEffect, useRef, useState } from 'react';
import { audio } from '../../game/audio.ts';

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

interface Asteroid {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

export const AsteroidsTask: React.FC<Props> = ({ onComplete, onClose }) => {
  const [destroyedCount, setDestroyedCount] = useState(0);
  const targetCount = 8;
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const nextId = useRef(1);

  // Spawn and update asteroids
  useEffect(() => {
    const interval = setInterval(() => {
      setAsteroids((prev) => {
        if (prev.length >= 5) return prev;
        const newAst: Asteroid = {
          id: nextId.current++,
          x: 280,
          y: 20 + Math.random() * 160,
          vx: -(1.5 + Math.random() * 2),
          vy: (Math.random() - 0.5) * 1.5,
          size: 24 + Math.random() * 16,
        };
        return [...prev, newAst];
      });
    }, 600);

    const moveInterval = setInterval(() => {
      setAsteroids((prev) =>
        prev
          .map((a) => ({ ...a, x: a.x + a.vx, y: a.y + a.vy }))
          .filter((a) => a.x > -50)
      );
    }, 30);

    return () => {
      clearInterval(interval);
      clearInterval(moveInterval);
    };
  }, []);

  const shootAsteroid = (id: number) => {
    audio.playKill(); // crunchy impact laser sound
    setAsteroids((prev) => prev.filter((a) => a.id !== id));
    const nextCount = destroyedCount + 1;
    setDestroyedCount(nextCount);

    if (nextCount >= targetCount) {
      audio.playTaskComplete();
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-md border-4 border-slate-700 bg-slate-900 p-6 text-white shadow-2xl select-none">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-sm font-pixel text-slate-400 hover:text-red-400"
        >
          [X]
        </button>

        <div className="mb-4 text-center">
          <h2 className="font-pixel text-sm text-rose-400">WEAPONS: CLEAR ASTEROIDS</h2>
          <p className="mt-1 font-retro text-xs text-slate-400">
            CLICK FLYING ASTEROIDS TO DESTROY WITH TURRET LASERS
          </p>
        </div>

        {/* Space Cockpit Viewport */}
        <div className="relative h-56 w-full overflow-hidden border-2 border-slate-700 bg-[#070b14] cursor-crosshair">
          {/* Cockpit crosshairs */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 border border-emerald-500/40 rounded-full" />
            <div className="absolute h-full w-[1px] bg-emerald-500/20" />
            <div className="absolute w-full h-[1px] bg-emerald-500/20" />
          </div>

          {/* Asteroids */}
          {asteroids.map((ast) => (
            <button
              key={ast.id}
              onClick={() => shootAsteroid(ast.id)}
              style={{
                left: `${ast.x}px`,
                top: `${ast.y}px`,
                width: `${ast.size}px`,
                height: `${ast.size}px`,
              }}
              className="absolute cursor-pointer border border-amber-800 bg-[#574438] hover:border-red-400 hover:bg-rose-800 transition-transform active:scale-90"
            >
              {/* Rock surface detail */}
              <div className="h-2 w-2 bg-[#36271e] m-1" />
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between font-pixel text-[9px] text-slate-400">
          <span>WEAPONS LOCK: ACTIVE</span>
          <span className="text-emerald-400">
            DESTROYED: {destroyedCount} / {targetCount}
          </span>
        </div>
      </div>
    </div>
  );
};
