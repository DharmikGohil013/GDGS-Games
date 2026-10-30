import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Volume2, VolumeX, Shield, Users } from 'lucide-react';
import { sounds } from '../game/audio';

interface TitleScreenProps {
  onStart: (customization: {
    name: string;
    hairColor: string;
    shirtColor: string;
    pantsColor: string;
    enableTutorial: boolean;
  }) => void;
}

const HAIR_COLORS = ['#ffcc80', '#5c381c', '#dc2626', '#2563eb', '#16a34a', '#a855f7'];
const SHIRT_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
const PANTS_COLORS = ['#1e3a8a', '#374151', '#78350f', '#065f46', '#831843'];

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart }) => {
  const [name, setName] = useState('PixelFarmer');
  const [hairColor, setHairColor] = useState('#ffcc80');
  const [shirtColor, setShirtColor] = useState('#3b82f6');
  const [pantsColor, setPantsColor] = useState('#1e3a8a');
  const [enableTutorial, setEnableTutorial] = useState(true);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());

  useEffect(() => {
    // Keyboard listener for Enter or Space to start
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.code === 'Space') {
        // Only trigger if not typing in input
        if (document.activeElement?.tagName !== 'INPUT') {
          e.preventDefault();
          handleStartGame(enableTutorial);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [name, hairColor, shirtColor, pantsColor, enableTutorial]);

  const handleStartGame = (withTutorial: boolean = true) => {
    sounds.playCoin();
    sounds.startBgm();
    onStart({
      name: name.trim() || 'PixelFarmer',
      hairColor,
      shirtColor,
      pantsColor,
      enableTutorial: withTutorial,
    });
  };

  const toggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-[#0e1620] overflow-y-auto">
      {/* Ambient decorative background grid */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Top Header / Audio toggle */}
      <div className="w-full max-w-4xl flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 text-xs text-amber-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Terra Villa Server 1 · 2,491 Online</span>
        </div>
        <button
          onClick={toggleSound}
          className="p-2.5 rounded bg-[#2b1f1d] border-2 border-[#5a3921] hover:border-amber-400 text-amber-200 transition-colors"
          title="Toggle Chiptune Music & FX"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
        </button>
      </div>

      {/* Center Stage Lockup */}
      <div className="flex flex-col items-center justify-center my-auto relative z-10 max-w-2xl text-center">
        {/* Custom Bespoke Inline SVG Logo for Pixels */}
        <div className="relative mb-6 drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]">
          <svg viewBox="0 0 460 90" className="w-[320px] sm:w-[440px] h-auto">
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fff3b0" />
                <stop offset="35%" stopColor="#ffd152" />
                <stop offset="70%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <filter id="shadow">
                <feDropShadow dx="3" dy="4" stdDeviation="0" floodColor="#3d1e08" />
              </filter>
            </defs>
            <text
              x="50%"
              y="68"
              textAnchor="middle"
              className="pixel-font font-black tracking-widest"
              fontSize="64"
              fill="url(#goldGrad)"
              stroke="#2e1405"
              strokeWidth="7"
              filter="url(#shadow)"
            >
              PIXELS
            </text>
          </svg>
          <div className="absolute -top-3 -right-2 text-xs px-2 py-0.5 rounded bg-emerald-500 text-black font-black uppercase tracking-wider animate-bounce">
            MMO Clone
          </div>
        </div>

        <p className="text-amber-200/90 text-xs sm:text-sm mb-6 tracking-wide pixel-sub font-mono">
          FARM CROPS · HARVEST · COOK · CHOP TREES · TRADE IN TERRA VILLA
        </p>

        {/* Character Preview & Customization Card */}
        <div className="pixels-box p-5 rounded-lg w-full max-w-md mb-6 text-left">
          <h2 className="text-xs text-amber-400 font-bold mb-3 uppercase tracking-wider flex items-center justify-between">
            <span>Avatar Customizer</span>
            <span className="text-[10px] text-stone-400">Step 1 of 1</span>
          </h2>

          <div className="flex items-center gap-5 mb-4">
            {/* Visual Pixel Preview */}
            <div className="w-20 h-24 bg-[#1a1210] border-2 border-[#5a3921] rounded flex flex-col items-center justify-center p-2 shadow-inner">
              <div className="w-10 h-10 rounded-full flex flex-col items-center justify-center relative">
                {/* Hair */}
                <div className="w-8 h-3 rounded-t" style={{ backgroundColor: hairColor }} />
                {/* Face */}
                <div className="w-7 h-5 bg-[#fcd34d] flex items-center justify-around px-1">
                  <div className="w-1 h-1 bg-black rounded-full" />
                  <div className="w-1 h-1 bg-black rounded-full" />
                </div>
                {/* Shirt */}
                <div className="w-9 h-6 mt-0.5 rounded-t" style={{ backgroundColor: shirtColor }} />
                {/* Pants */}
                <div className="w-8 h-4 mt-0.5 rounded-b" style={{ backgroundColor: pantsColor }} />
              </div>
            </div>

            {/* Username Input */}
            <div className="flex-1">
              <label className="block text-[10px] text-amber-300 uppercase mb-1">
                Farmer Tag
              </label>
              <input
                type="text"
                maxLength={14}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-[#1e1513] border-2 border-[#5a3921] focus:border-amber-400 text-amber-100 text-xs px-3 py-2 rounded font-mono outline-none"
              />
            </div>
          </div>

          {/* Color Palettes */}
          <div className="space-y-2.5 text-[10px]">
            <div>
              <span className="text-stone-300 block mb-1">Hair Tint</span>
              <div className="flex gap-2">
                {HAIR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setHairColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded border-2 ${hairColor === c ? 'border-white scale-110' : 'border-black/50'}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <span className="text-stone-300 block mb-1">Shirt Color</span>
              <div className="flex gap-2">
                {SHIRT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setShirtColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded border-2 ${shirtColor === c ? 'border-white scale-110' : 'border-black/50'}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <span className="text-stone-300 block mb-1">Pants Color</span>
              <div className="flex gap-2">
                {PANTS_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setPantsColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded border-2 ${pantsColor === c ? 'border-white scale-110' : 'border-black/50'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tutorial Option Toggle */}
        <div className="flex items-center justify-between w-full max-w-md px-1 mb-3 text-[10px]">
          <label className="flex items-center gap-2 cursor-pointer select-none text-amber-200 hover:text-white">
            <input
              type="checkbox"
              checked={enableTutorial}
              onChange={(e) => setEnableTutorial(e.target.checked)}
              className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
            />
            <span>Include Beginner Tutorial (with in-game skip)</span>
          </label>
        </div>

        {/* Primary Start & Quick Play Buttons */}
        <div className="w-full max-w-md flex flex-col sm:flex-row gap-2.5">
          <button
            data-start="true"
            onClick={() => handleStartGame(enableTutorial)}
            className="pixels-btn flex-1 py-3.5 px-6 text-xs sm:text-sm font-black flex items-center justify-center gap-2 cursor-pointer group shadow-2xl"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>PLAY NOW (ENTER)</span>
            <Sparkles className="w-4 h-4 group-hover:rotate-45 transition-transform" />
          </button>

          <button
            onClick={() => handleStartGame(false)}
            className="pixels-box py-3.5 px-4 text-xs font-bold text-amber-300 hover:text-white hover:border-amber-400 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            title="Jump directly to farming without any tutorial"
          >
            <span>Skip Tutorial ⏭️</span>
          </button>
        </div>
      </div>

      {/* Flat borderless control hint footer as required by craft guide */}
      <div className="w-full text-center relative z-10 pt-4 border-t border-stone-800/80">
        <p className="text-[10px] text-stone-400 font-mono tracking-wider">
          WASD / Arrows to Move · Click/Space to Till, Plant & Interact · 1-8 Hotbar · Esc Menu
        </p>
      </div>
    </div>
  );
};
