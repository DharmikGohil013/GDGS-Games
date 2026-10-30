/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, RotateCw, Trash2, Layers, ShoppingBag, CreditCard, Box, Sparkles } from 'lucide-react';
import { FIXTURE_CATALOG } from '../game/furnitureCatalog';
import { FixtureDef, FixtureCategory } from '../game/types';
import { sound } from '../game/audio';

interface BuildPanelProps {
  cash: number;
  selectedTool: string | null;
  rotation: number;
  isDemolishMode: boolean;
  onSelectTool: (type: string | null) => void;
  onRotate: () => void;
  onToggleDemolish: () => void;
  onClose: () => void;
}

export const BuildPanel: React.FC<BuildPanelProps> = ({
  cash,
  selectedTool,
  rotation,
  isDemolishMode,
  onSelectTool,
  onRotate,
  onToggleDemolish,
  onClose
}) => {
  const [activeCategory, setActiveCategory] = useState<FixtureCategory>('shelf');

  const categories: { id: FixtureCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'shelf', label: 'Shelves & Displays', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'checkout', label: 'Cashier Counters', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'storage', label: 'Warehouse Racks', icon: <Box className="w-4 h-4" /> },
    { id: 'decor', label: 'Ambiance & Decor', icon: <Sparkles className="w-4 h-4" /> }
  ];

  const filteredFixtures = FIXTURE_CATALOG.filter(f => f.category === activeCategory);

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[95%] max-w-2xl bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl p-4 text-white z-40 pointer-events-auto backdrop-blur-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-sky-400" />
          <h2 className="font-bold text-base text-slate-100">Store Construction & Fixtures</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Rotate tool button */}
          <button
            onClick={() => {
              sound.playClick();
              onRotate();
            }}
            aria-label="Rotate fixture"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 cursor-pointer transition active:scale-95"
          >
            <RotateCw className="w-3.5 h-3.5 text-sky-400" />
            <span>Rotate [R] ({rotation}°)</span>
          </button>

          {/* Demolish / Sell tool button */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleDemolish();
            }}
            aria-label="Toggle demolish mode"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition active:scale-95 ${
              isDemolishMode
                ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-900/40'
                : 'bg-slate-800 text-rose-300 border-slate-700 hover:bg-rose-950/40'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDemolishMode ? 'Demolish: ACTIVE' : 'Sell Mode'}</span>
          </button>

          <button
            onClick={onClose}
            aria-label="Close build panel"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 my-3 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              sound.playClick();
              setActiveCategory(cat.id);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
              activeCategory === cat.id
                ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Fixtures Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
        {filteredFixtures.map(fixture => {
          const isSelected = selectedTool === fixture.type && !isDemolishMode;
          const canAfford = cash >= fixture.cost;

          return (
            <button
              key={fixture.type}
              disabled={!canAfford}
              onClick={() => {
                sound.playClick();
                onSelectTool(isSelected ? null : fixture.type);
              }}
              className={`flex flex-col text-left p-2.5 rounded-xl border transition cursor-pointer relative ${
                isSelected
                  ? 'bg-sky-950/60 border-sky-400 shadow-lg shadow-sky-900/30 ring-1 ring-sky-400'
                  : canAfford
                  ? 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                  : 'bg-slate-900/40 border-slate-800/60 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className="w-4 h-4 rounded-md border border-slate-900"
                  style={{ backgroundColor: fixture.color }}
                />
                <span className="font-mono-numbers text-xs font-bold text-emerald-400">
                  ${fixture.cost}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-100 truncate">{fixture.name}</div>
              <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                {fixture.description}
              </div>
              <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-700/50 text-[10px] text-slate-400">
                <span>{fixture.width}x{fixture.height} tiles</span>
                {fixture.maxStock ? (
                  <span className="text-sky-300 font-semibold">{fixture.maxStock} capacity</span>
                ) : fixture.comfortBonus ? (
                  <span className="text-amber-300 font-semibold">+{fixture.comfortBonus} mood</span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {/* Guide Banner */}
      {selectedTool && !isDemolishMode && (
        <div className="mt-3 p-2 rounded-lg bg-sky-950/50 border border-sky-800/60 flex items-center justify-between text-xs text-sky-200">
          <span>Click on any open floor tile to construct. Press <strong>[R]</strong> to rotate.</span>
          <button
            onClick={() => onSelectTool(null)}
            className="text-xs text-sky-400 underline hover:text-sky-200 ml-2"
          >
            Cancel Tool
          </button>
        </div>
      )}
      {isDemolishMode && (
        <div className="mt-3 p-2 rounded-lg bg-rose-950/50 border border-rose-800/60 flex items-center justify-between text-xs text-rose-200">
          <span>Click on any placed fixture to dismantle it and receive a 60% cash refund.</span>
          <button
            onClick={onToggleDemolish}
            className="text-xs text-rose-400 underline hover:text-rose-200 ml-2"
          >
            Exit Sell Mode
          </button>
        </div>
      )}
    </div>
  );
};
