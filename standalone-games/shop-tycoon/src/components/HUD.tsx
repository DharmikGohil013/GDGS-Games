/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Clock,
  DollarSign,
  Star,
  Hammer,
  Package,
  Tag,
  Users,
  BarChart3,
  Pause,
  Play,
  Volume2,
  VolumeX,
  FastForward,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { sound } from '../game/audio';

export type ActivePanel = 'build' | 'inventory' | 'pricing' | 'staff' | 'ledger' | null;

interface HUDProps {
  cash: number;
  level: number;
  xp: number;
  xpNeeded: number;
  reputation: number;
  day: number;
  timeOfDay: number;
  isStoreOpen: boolean;
  gameSpeed: number;
  isMuted: boolean;
  activePanel: ActivePanel;
  customersCount: number;
  onToggleStoreOpen: () => void;
  onSetGameSpeed: (speed: number) => void;
  onToggleMute: () => void;
  onPause: () => void;
  onSetActivePanel: (panel: ActivePanel) => void;
}

export const HUD: React.FC<HUDProps> = ({
  cash,
  level,
  xp,
  xpNeeded,
  reputation,
  day,
  timeOfDay,
  isStoreOpen,
  gameSpeed,
  isMuted,
  activePanel,
  customersCount,
  onToggleStoreOpen,
  onSetGameSpeed,
  onToggleMute,
  onPause,
  onSetActivePanel
}) => {
  // Format clock time (e.g. 8.5 -> "08:30 AM", 14.25 -> "02:15 PM")
  const hourInt = Math.floor(timeOfDay);
  const minInt = Math.floor((timeOfDay - hourInt) * 60);
  const period = hourInt >= 12 ? 'PM' : 'AM';
  const displayHour = hourInt > 12 ? hourInt - 12 : hourInt === 0 ? 12 : hourInt;
  const timeFormatted = `${displayHour.toString().padStart(2, '0')}:${minInt.toString().padStart(2, '0')} ${period}`;

  const xpPercent = Math.min(100, Math.floor((xp / Math.max(1, xpNeeded)) * 100));

  const togglePanel = (panel: ActivePanel) => {
    sound.playClick();
    onSetActivePanel(activePanel === panel ? null : panel);
  };

  return (
    <div className="fixed inset-0 pointer-events-none select-none z-30 flex flex-col justify-between p-3 sm:p-5">
      {/* Perimeter Top Status Bar */}
      <div className="w-full flex items-center justify-between gap-3 flex-wrap">
        {/* Left Status Cluster: Day, Time, Store Open Toggle */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Day & Time Clock Card */}
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-xl">
            <Clock className="w-4 h-4 text-sky-400" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 leading-none">
                DAY {day}
              </span>
              <span className="font-mono-numbers text-xs font-bold text-white tracking-wide">
                {timeFormatted}
              </span>
            </div>
            {/* Open / Closed Toggle Badge */}
            <button
              onClick={() => {
                sound.playClick();
                onToggleStoreOpen();
              }}
              aria-label={isStoreOpen ? "Close store doors" : "Open store doors"}
              className={`ml-1 px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition cursor-pointer active:scale-95 ${
                isStoreOpen
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/50'
              }`}
            >
              {isStoreOpen ? '● OPEN' : '○ CLOSED'}
            </button>
          </div>

          {/* Active Customers Counter */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg text-xs font-mono-numbers">
            <span className="text-slate-400">Shoppers:</span>
            <strong className="text-amber-400">{customersCount}</strong>
          </div>
        </div>

        {/* Center Status Cluster: Cash Capital & Rating */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Cash Balance Display */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/95 border border-emerald-500/40 shadow-xl">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-slate-400 leading-none">
                STORE CAPITAL
              </span>
              <span className="font-mono-numbers text-base sm:text-lg font-extrabold text-emerald-400">
                ${cash.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Store Level & XP Pip Bar */}
          <div className="hidden md:flex flex-col justify-center px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl min-w-[140px]">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-300 mb-1">
              <span className="text-sky-400">LEVEL {level}</span>
              <span className="font-mono-numbers text-slate-400">{xp}/{xpNeeded} XP</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-sky-500 to-emerald-400 h-full transition-all duration-300"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>

          {/* Store Reputation Stars */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl text-xs">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="font-mono-numbers font-bold text-amber-300 text-xs">
              {reputation.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Right Status Cluster: Speed Controls, Mute, Pause */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Speed toggles */}
          <div className="flex bg-slate-900/95 p-1 rounded-2xl border border-slate-800 shadow-xl">
            {[1, 2, 3].map(speed => (
              <button
                key={speed}
                onClick={() => {
                  sound.playClick();
                  onSetGameSpeed(speed);
                }}
                className={`px-2 py-1 rounded-xl text-xs font-bold font-mono-numbers transition cursor-pointer ${
                  gameSpeed === speed
                    ? 'bg-sky-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Audio Mute button */}
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
            className="p-2 rounded-2xl bg-slate-900/95 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer shadow-xl"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Pause button */}
          <button
            onClick={() => {
              sound.playClick();
              onPause();
            }}
            aria-label="Pause simulation"
            className="p-2 rounded-2xl bg-slate-900/95 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer shadow-xl"
          >
            <Pause className="w-4 h-4 text-sky-400" />
          </button>
        </div>
      </div>

      {/* Perimeter Bottom Command Dock */}
      <div className="w-full flex justify-center pointer-events-auto">
        <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl overflow-x-auto max-w-full">
          {/* 1. Build & Furnish */}
          <button
            onClick={() => togglePanel('build')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activePanel === 'build'
                ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/25'
                : 'bg-slate-800/80 text-slate-200 hover:bg-slate-800 hover:text-white border border-slate-700/50'
            }`}
          >
            <Hammer className="w-4 h-4" />
            <span>Build & Furnish</span>
          </button>

          {/* 2. Inventory & Wholesale */}
          <button
            onClick={() => togglePanel('inventory')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activePanel === 'inventory'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                : 'bg-slate-800/80 text-slate-200 hover:bg-slate-800 hover:text-white border border-slate-700/50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Wholesale Orders</span>
          </button>

          {/* 3. Pricing & Margins */}
          <button
            onClick={() => togglePanel('pricing')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activePanel === 'pricing'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                : 'bg-slate-800/80 text-slate-200 hover:bg-slate-800 hover:text-white border border-slate-700/50'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Pricing & Margins</span>
          </button>

          {/* 4. Staff Automation */}
          <button
            onClick={() => togglePanel('staff')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activePanel === 'staff'
                ? 'bg-blue-500 text-slate-950 shadow-lg shadow-blue-500/25'
                : 'bg-slate-800/80 text-slate-200 hover:bg-slate-800 hover:text-white border border-slate-700/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff Roster</span>
          </button>

          {/* 5. Ledger & Upgrades */}
          <button
            onClick={() => togglePanel('ledger')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activePanel === 'ledger'
                ? 'bg-purple-500 text-slate-950 shadow-lg shadow-purple-500/25'
                : 'bg-slate-800/80 text-slate-200 hover:bg-slate-800 hover:text-white border border-slate-700/50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Finances & Upgrades</span>
          </button>
        </div>
      </div>
    </div>
  );
};
