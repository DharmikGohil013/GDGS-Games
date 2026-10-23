/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Sparkles, Shield, Compass } from 'lucide-react';
import { sound } from '../game/audio';

interface TitleScreenProps {
  onStart: (mode: 'survival' | 'creative', seed: number) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart }) => {
  const [mode, setMode] = useState<'survival' | 'creative'>('survival');
  const [seed, setSeed] = useState<number>(42);
  const [isMuted, setIsMuted] = useState<boolean>(sound.isMuted);

  useEffect(() => {
    // Listen for Enter or Space to start immediately
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        // Prevent default space scroll
        e.preventDefault();
        onStart(mode, seed);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, seed, onStart]);

  const toggleSound = () => {
    const next = sound.toggleMute();
    setIsMuted(next);
  };

  const generateRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 900000) + 10000);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between p-8 bg-gradient-to-b from-sky-900/60 via-slate-900/80 to-stone-950 text-white select-none">
      {/* Top Bar with sound toggle and version badge */}
      <div className="flex justify-between items-center w-full max-w-5xl mx-auto">
        <div className="flex items-center gap-2 px-3 py-1 bg-stone-900/80 border border-stone-700/80 text-xs font-mono text-emerald-400">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>VOXEL ENGINE v1.0 · PROCEDURAL REALM</span>
        </div>

        <button
          onClick={toggleSound}
          className="flex items-center gap-2 px-3 py-1.5 bg-stone-900/80 hover:bg-stone-800 border border-stone-700 text-xs font-mono transition-colors"
          title="Toggle Audio (M)"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          <span>{isMuted ? 'MUTED' : 'AUDIO ON'}</span>
        </button>
      </div>

      {/* Center Hero Lockup with bespoke SVG title and clean negative space */}
      <div className="flex flex-col items-center justify-center my-auto text-center max-w-2xl mx-auto">
        {/* Bespoke Pixel-Art Block Title SVG */}
        <div className="mb-6 drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)]">
          <svg viewBox="0 0 460 90" className="w-[340px] sm:w-[460px] h-auto">
            <defs>
              <linearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7fff55" />
                <stop offset="40%" stopColor="#44cc22" />
                <stop offset="41%" stopColor="#d99b50" />
                <stop offset="100%" stopColor="#8d5b2d" />
              </linearGradient>
              <filter id="shadow">
                <feDropShadow dx="3" dy="4" stdDeviation="0" floodColor="#000000" />
              </filter>
            </defs>

            {/* Voxel 3D Isometric Logo Block Left */}
            <g transform="translate(18, 12) scale(0.9)">
              <polygon points="30,0 60,15 30,30 0,15" fill="#5ce843" stroke="#226615" strokeWidth="2" />
              <polygon points="0,15 30,30 30,65 0,50" fill="#9c683b" stroke="#4a301a" strokeWidth="2" />
              <polygon points="60,15 30,30 30,65 60,50" fill="#754b26" stroke="#36210f" strokeWidth="2" />
            </g>

            {/* Title Lettering */}
            <text
              x="250"
              y="60"
              textAnchor="middle"
              fontFamily="monospace, system-ui, sans-serif"
              fontSize="46"
              fontWeight="900"
              letterSpacing="6"
              fill="#52e838"
              stroke="#0a1a06"
              strokeWidth="6"
              paintOrder="stroke fill"
            >
              VOXELCRAFT
            </text>
          </svg>
        </div>

        <p className="text-stone-300 text-sm font-medium tracking-wide mb-8 max-w-lg">
          Procedurally generated infinite voxel wilderness. Mine resources, craft survival tools, construct shelters, and survive the night.
        </p>

        {/* World Mode Selector */}
        <div className="flex items-center gap-3 mb-6 bg-stone-900/90 p-1.5 border border-stone-700">
          <button
            onClick={() => setMode('survival')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all ${
              mode === 'survival'
                ? 'bg-amber-600 text-white font-bold shadow'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Survival Mode
          </button>
          <button
            onClick={() => setMode('creative')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all ${
              mode === 'creative'
                ? 'bg-emerald-600 text-white font-bold shadow'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Creative Mode (Fly)
          </button>
        </div>

        {/* Seed Input */}
        <div className="flex items-center gap-2 mb-8 bg-stone-900/80 px-3 py-1.5 border border-stone-800 text-xs font-mono">
          <span className="text-stone-400">WORLD SEED:</span>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(parseInt(e.target.value, 10) || 0)}
            className="w-24 bg-stone-800 border border-stone-700 px-2 py-0.5 text-emerald-400 font-mono text-center focus:outline-none"
          />
          <button
            onClick={generateRandomSeed}
            className="text-stone-400 hover:text-amber-400 ml-1 text-[11px] underline"
          >
            Randomize
          </button>
        </div>

        {/* Primary Start CTA */}
        <button
          data-start="true"
          onClick={(e) => {
            e.currentTarget.blur();
            onStart(mode, seed);
          }}
          className="group relative px-10 py-3.5 bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 active:translate-y-0.5 text-white font-mono font-bold text-base tracking-wider border-2 border-emerald-400 shadow-[0_6px_0_#134e4a] cursor-pointer transition-all"
        >
          <div className="flex items-center gap-2">
            <span>ENTER WORLD</span>
            <span className="text-emerald-200 text-xs font-normal">([Enter] or [Space])</span>
          </div>
        </button>
      </div>

      {/* Bottom Flat Control Hint Line */}
      <div className="w-full text-center py-2 border-t border-stone-800 text-xs font-mono text-stone-400 tracking-wider">
        WASD Move · Space Jump · Left-Click Mine/Attack · Right-Click Place/Interact · E Inventory · 1-9 Hotbar · Esc Pause
      </div>
    </div>
  );
};
