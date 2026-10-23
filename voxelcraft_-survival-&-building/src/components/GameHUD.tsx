/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Pause, Backpack, Compass } from 'lucide-react';
import { PlayerStats } from '../game/engine';
import { ITEM_DEFS } from '../game/constants';
import { calculateLevel } from '../game/rules';
import { sound } from '../game/audio';
import { ambientAudio } from '../game/ambient';

interface GameHUDProps {
  stats: PlayerStats;
  onOpenInventory: () => void;
  onPause: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  onOpenInventory,
  onPause,
}) => {
  const [isMuted, setIsMuted] = useState(sound.isMuted);
  const [activeItemName, setActiveItemName] = useState<string>('');
  const [showItemTitle, setShowItemTitle] = useState(false);

  // Active item name tooltip on slot switch
  useEffect(() => {
    const activeItem = stats.hotbar[stats.activeSlot];
    if (activeItem) {
      const def = ITEM_DEFS[activeItem.id];
      setActiveItemName(def ? def.name : activeItem.id);
      setShowItemTitle(true);
      const timer = setTimeout(() => setShowItemTitle(false), 2200);
      return () => clearTimeout(timer);
    } else {
      setShowItemTitle(false);
    }
  }, [stats.activeSlot, stats.hotbar]);

  const toggleSound = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    const next = sound.toggleMute();
    ambientAudio.setMuted(next);
    setIsMuted(next);
  };

  // Render 10 Hearts (each represents 2 HP)
  const renderHearts = () => {
    const hearts = [];
    const hp = stats.health;

    for (let i = 0; i < 10; i++) {
      const heartVal = hp - i * 2;
      let state: 'full' | 'half' | 'empty' = 'empty';
      if (heartVal >= 2) state = 'full';
      else if (heartVal === 1) state = 'half';

      hearts.push(
        <div key={i} className="w-4 h-4 relative inline-block">
          {/* Heart Socket Background */}
          <svg viewBox="0 0 16 16" className="w-4 h-4 fill-stone-900 stroke-black stroke-[1.5]">
            <path d="M8,14 C8,14 1,9.5 1,5 C1,2.8 2.8,1 5,1 C6.5,1 7.5,2 8,3 C8.5,2 9.5,1 11,1 C13.2,1 15,2.8 15,5 C15,9.5 8,14 8,14 Z" />
          </svg>
          {state === 'full' && (
            <svg viewBox="0 0 16 16" className="w-4 h-4 absolute inset-0 fill-rose-600">
              <path d="M8,13 C8,13 2,9 2,5 C2,3.3 3.3,2 5,2 C6.2,2 7.2,2.8 8,4 C8.8,2.8 9.8,2 11,2 C12.7,2 14,3.3 14,5 C14,9 8,13 8,13 Z" />
              {/* Highlight shine */}
              <circle cx="5" cy="4" r="1" fill="#ff9999" />
            </svg>
          )}
          {state === 'half' && (
            <svg viewBox="0 0 16 16" className="w-4 h-4 absolute inset-0 fill-rose-600">
              <path d="M8,13 C8,13 2,9 2,5 C2,3.3 3.3,2 5,2 C6.2,2 7.2,2.8 8,4 L8,13 Z" />
              <circle cx="5" cy="4" r="1" fill="#ff9999" />
            </svg>
          )}
        </div>
      );
    }
    return hearts;
  };

  // Render 10 Drumsticks (each represents 2 Hunger)
  const renderHunger = () => {
    const drumsticks = [];
    const hunger = stats.hunger;

    for (let i = 0; i < 10; i++) {
      const val = hunger - i * 2;
      let state: 'full' | 'half' | 'empty' = 'empty';
      if (val >= 2) state = 'full';
      else if (val === 1) state = 'half';

      drumsticks.push(
        <div key={i} className="w-4 h-4 relative inline-block">
          <svg viewBox="0 0 16 16" className="w-4 h-4 fill-stone-900 stroke-black stroke-[1.5]">
            <circle cx="10" cy="6" r="5" />
            <path d="M8,9 L3,14 L1,12 L6,7 Z" />
          </svg>
          {state === 'full' && (
            <svg viewBox="0 0 16 16" className="w-4 h-4 absolute inset-0 fill-amber-700">
              <circle cx="10" cy="6" r="4.2" />
              <path d="M7,8 L3,12 L2,11 L6,7 Z" fill="#e8dfd8" />
              <circle cx="11" cy="5" r="1.2" fill="#d97706" />
            </svg>
          )}
          {state === 'half' && (
            <svg viewBox="0 0 16 16" className="w-4 h-4 absolute inset-0 fill-amber-700">
              <path d="M10,2 A4.2,4.2 0 0,1 10,10.2 L10,2 Z" />
              <circle cx="11" cy="5" r="1" fill="#d97706" />
            </svg>
          )}
        </div>
      );
    }
    return drumsticks;
  };

  // Render 10 Oxygen bubbles when submerged
  const renderOxygen = () => {
    if (stats.oxygen >= stats.maxOxygen) return null;
    const bubbles = [];
    const count = Math.ceil(stats.oxygen / 2);

    for (let i = 0; i < 10; i++) {
      const active = i < count;
      bubbles.push(
        <div key={i} className="w-3.5 h-3.5 relative inline-block">
          <svg viewBox="0 0 14 14" className={`w-3.5 h-3.5 ${active ? 'fill-sky-400 stroke-sky-700' : 'fill-stone-900 stroke-stone-800'}`}>
            <circle cx="7" cy="7" r="5" strokeWidth="1" />
            {active && <circle cx="5" cy="5" r="1.2" fill="#ffffff" />}
          </svg>
        </div>
      );
    }
    return bubbles;
  };

  const { level, progress } = calculateLevel(stats.xp);

  return (
    <div className="fixed inset-0 pointer-events-none select-none z-30 flex flex-col justify-between p-4">
      {/* Low HP Red Vignette */}
      {stats.health <= 6 && (
        <div
          className="fixed inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            boxShadow: `inset 0 0 ${120 - stats.health * 15}px rgba(220, 20, 20, ${0.45 - stats.health * 0.05})`,
          }}
        />
      )}

      {/* Top Utility Dock */}
      <div className="flex justify-between items-start w-full">
        {/* Game Mode & Active Biome Indicator */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-stone-900/80 border border-stone-700 text-[11px] font-mono text-stone-300 tracking-wider">
            <span className="text-emerald-400 font-bold uppercase">{stats.gameMode} MODE</span>
            {stats.isFlying && <span className="text-amber-400 ml-2">(FLYING)</span>}
          </div>

          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 bg-stone-900/85 border text-[11px] font-mono tracking-wider backdrop-blur-xs ${
              stats.currentBiome === 'forest'
                ? 'border-emerald-600/60 bg-emerald-950/40 text-emerald-300'
                : stats.currentBiome === 'desert'
                ? 'border-amber-600/60 bg-amber-950/40 text-amber-300'
                : stats.currentBiome === 'mountain'
                ? 'border-sky-500/60 bg-sky-950/40 text-sky-200'
                : stats.currentBiome === 'cave'
                ? 'border-purple-600/60 bg-purple-950/40 text-purple-300'
                : stats.currentBiome === 'underwater'
                ? 'border-cyan-500/60 bg-cyan-950/40 text-cyan-200'
                : 'border-lime-600/60 bg-lime-950/40 text-lime-300'
            }`}
          >
            <Compass className="w-3.5 h-3.5 opacity-80" />
            <span className="font-bold">
              {stats.currentBiome === 'forest'
                ? 'OAK FOREST'
                : stats.currentBiome === 'desert'
                ? 'DESERT DUNES'
                : stats.currentBiome === 'mountain'
                ? 'ALPINE PEAKS'
                : stats.currentBiome === 'cave'
                ? 'DEEP CAVERNS'
                : stats.currentBiome === 'underwater'
                ? 'SUBMERGED'
                : 'PLAINS'}
            </span>
          </div>
        </div>

        {/* Top-Right Control Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onOpenInventory}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900/90 hover:bg-stone-800 border border-stone-700 text-xs font-mono text-stone-200 transition-colors cursor-pointer"
            title="Open Inventory (E)"
          >
            <Backpack className="w-3.5 h-3.5 text-amber-400" />
            <span>INV [E]</span>
          </button>

          <button
            onClick={toggleSound}
            className="p-1.5 bg-stone-900/90 hover:bg-stone-800 border border-stone-700 text-stone-200 transition-colors cursor-pointer"
            title="Toggle Audio (M)"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={onPause}
            className="p-1.5 bg-stone-900/90 hover:bg-stone-800 border border-stone-700 text-stone-200 transition-colors cursor-pointer"
            title="Pause Game (Esc)"
          >
            <Pause className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Center Screen Crosshair */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" strokeWidth="2.5" fill="none">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>

      {/* Bottom Center Survival Status & Hotbar */}
      <div className="flex flex-col items-center mx-auto mb-2 pointer-events-auto">
        {/* Held Item Title Popup */}
        <div
          className={`mb-2 px-3 py-1 bg-stone-950/80 border border-stone-700/60 text-xs font-mono text-emerald-300 tracking-wider transition-opacity duration-300 ${
            showItemTitle ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {activeItemName}
        </div>

        {/* Oxygen Bubbles (when in water) */}
        {stats.oxygen < stats.maxOxygen && (
          <div className="flex gap-1 mb-1 justify-end w-[360px]">{renderOxygen()}</div>
        )}

        {/* Health & Hunger Rows */}
        <div className="flex justify-between items-center w-[360px] sm:w-[420px] px-1 mb-1.5">
          {/* 10 Hearts Left */}
          <div className="flex gap-0.5">{renderHearts()}</div>
          {/* 10 Hunger Drumsticks Right */}
          <div className="flex gap-0.5 flex-row-reverse">{renderHunger()}</div>
        </div>

        {/* Experience Bar & Level */}
        <div className="relative w-[360px] sm:w-[420px] h-2 bg-stone-950 border border-black mb-2">
          {/* Green XP Progress fill */}
          <div
            className="h-full bg-gradient-to-r from-lime-500 to-emerald-400 transition-all duration-200"
            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
          />
          {/* Level Number Centered */}
          {level > 0 && (
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-mono font-bold text-lime-400 drop-shadow-[0_1px_2px_#000]">
              {level}
            </div>
          )}
        </div>

        {/* 9-Slot Hotbar */}
        <div className="flex items-center gap-1 p-1 bg-stone-900/95 border-2 border-stone-700 shadow-[0_8px_16px_rgba(0,0,0,0.8)]">
          {stats.hotbar.map((slot, index) => {
            const isActive = index === stats.activeSlot;
            const def = slot ? ITEM_DEFS[slot.id] : null;

            return (
              <div
                key={index}
                className={`relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center border-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-white bg-stone-700/80 scale-105 shadow-[0_0_8px_rgba(255,255,255,0.6)]'
                    : 'border-stone-800 bg-stone-950/90 hover:border-stone-600'
                }`}
                title={def?.name || `Slot ${index + 1}`}
              >
                {/* Slot Number Label */}
                <span className="absolute top-0.5 left-1 text-[9px] font-mono text-stone-400 opacity-60">
                  {index + 1}
                </span>

                {/* Item Display */}
                {slot && (
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[11px] font-mono font-bold text-amber-200 tracking-tighter truncate max-w-[34px]">
                      {slot.id.split('_')[0].toUpperCase()}
                    </span>
                    {slot.count > 1 && (
                      <span className="absolute bottom-0.5 right-1 text-[10px] font-mono font-bold text-white drop-shadow-[0_1px_2px_#000]">
                        {slot.count}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
