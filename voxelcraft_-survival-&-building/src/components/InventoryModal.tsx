/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Flame, Hammer, BookOpen, Layers } from 'lucide-react';
import { PlayerStats } from '../game/engine';
import { CRAFTING_RECIPES, ITEM_DEFS, ItemStack } from '../game/constants';
import { matchCraftingRecipe, getSmeltingRecipe, addItemToInventory } from '../game/rules';
import { sound } from '../game/audio';

interface InventoryModalProps {
  type: 'inventory' | 'crafting' | 'furnace';
  stats: PlayerStats;
  onUpdateStats: (newStats: PlayerStats) => void;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  type: initialType,
  stats,
  onUpdateStats,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'crafting' | 'furnace'>(initialType);

  // Crafting state (2x2 or 3x3 depending on activeTab)
  const is3x3 = activeTab === 'crafting';
  const gridSize = is3x3 ? 3 : 2;
  const [craftGrid, setCraftGrid] = useState<(string | null)[]>(new Array(gridSize * gridSize).fill(null));
  const [craftOutput, setCraftOutput] = useState<ItemStack | null>(null);

  // Furnace state
  const [furnaceInput, setFurnaceInput] = useState<ItemStack | null>({ id: 'iron_ore', count: 4 });
  const [furnaceFuel, setFurnaceFuel] = useState<ItemStack | null>({ id: 'coal', count: 8 });
  const [furnaceOutput, setFurnaceOutput] = useState<ItemStack | null>(null);
  const [smeltProgress, setSmeltProgress] = useState(0);

  // Selected item on cursor
  const [heldCursorItem, setHeldCursorItem] = useState<ItemStack | null>(null);

  // Reset craft grid on tab change
  useEffect(() => {
    const size = activeTab === 'crafting' ? 3 : 2;
    setCraftGrid(new Array(size * size).fill(null));
    setCraftOutput(null);
  }, [activeTab]);

  // Recalculate craft output whenever craftGrid changes
  useEffect(() => {
    const match = matchCraftingRecipe(craftGrid, gridSize);
    if (match) {
      setCraftOutput(match.recipe.result);
    } else {
      setCraftOutput(null);
    }
  }, [craftGrid, gridSize]);

  // Furnace tick simulation
  useEffect(() => {
    if (activeTab !== 'furnace') return;
    const interval = setInterval(() => {
      if (furnaceInput && furnaceFuel) {
        const recipe = getSmeltingRecipe(furnaceInput.id);
        if (recipe) {
          setSmeltProgress((prev) => {
            if (prev >= 100) {
              // Finish smelting one item
              sound.playHit();
              furnaceInput.count--;
              if (furnaceInput.count <= 0) setFurnaceInput(null);

              setFurnaceOutput((out) => {
                if (!out) return { id: recipe.output, count: 1 };
                if (out.id === recipe.output) return { id: out.id, count: out.count + 1 };
                return out;
              });

              return 0;
            }
            return prev + 15;
          });
        }
      } else {
        setSmeltProgress(0);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [activeTab, furnaceInput, furnaceFuel]);

  // Handle slot click in Hotbar or Inventory
  const handleInventorySlotClick = (isHotbar: boolean, index: number) => {
    sound.playHit();
    const currentList = isHotbar ? [...stats.hotbar] : [...stats.inventory];
    const currentItem = currentList[index];

    if (!heldCursorItem) {
      // Pick up item
      if (currentItem) {
        setHeldCursorItem(currentItem);
        currentList[index] = null;
      }
    } else {
      // Drop or stack item
      if (!currentItem) {
        currentList[index] = heldCursorItem;
        setHeldCursorItem(null);
      } else if (currentItem.id === heldCursorItem.id && currentItem.count < 64) {
        const space = 64 - currentItem.count;
        const add = Math.min(space, heldCursorItem.count);
        currentItem.count += add;
        heldCursorItem.count -= add;
        if (heldCursorItem.count <= 0) setHeldCursorItem(null);
      } else {
        // Swap items
        currentList[index] = heldCursorItem;
        setHeldCursorItem(currentItem);
      }
    }

    if (isHotbar) {
      onUpdateStats({ ...stats, hotbar: currentList });
    } else {
      onUpdateStats({ ...stats, inventory: currentList });
    }
  };

  // Handle click on crafting grid slot
  const handleCraftSlotClick = (slotIndex: number) => {
    sound.playHit();
    const newGrid = [...craftGrid];

    if (heldCursorItem) {
      // Place item type into slot
      newGrid[slotIndex] = heldCursorItem.id;
      heldCursorItem.count--;
      if (heldCursorItem.count <= 0) setHeldCursorItem(null);
    } else if (newGrid[slotIndex]) {
      // Return 1 item to inventory
      const itemId = newGrid[slotIndex]!;
      newGrid[slotIndex] = null;
      const inv = [...stats.inventory];
      addItemToInventory(inv, { id: itemId, count: 1 });
      onUpdateStats({ ...stats, inventory: inv });
    }

    setCraftGrid(newGrid);
  };

  // Close modal on KeyE or Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyE' || e.code === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Collect craft output
  const handleTakeCraftOutput = () => {
    if (!craftOutput) return;
    sound.playPickup();

    const inv = [...stats.inventory];
    const leftover = addItemToInventory(inv, { ...craftOutput });
    onUpdateStats({ ...stats, inventory: inv });

    // Consume 1 item from every non-empty cell in crafting grid
    const newGrid = craftGrid.map(() => null);
    setCraftGrid(newGrid);

    if (leftover > 0) {
      setHeldCursorItem({ id: craftOutput.id, count: leftover });
    }
  };

  // Quick Craft from Recipe Book
  const handleQuickCraft = (recipeId: string) => {
    const rec = CRAFTING_RECIPES.find((r) => r.id === recipeId);
    if (!rec) return;

    // Check if player has required items
    const inv = [...stats.inventory];
    const hotbar = [...stats.hotbar];
    const allSlots = [...inv, ...hotbar];

    // Count needed ingredients
    const needed: { [key: string]: number } = {};
    for (const pat of rec.pattern) {
      if (pat) needed[pat] = (needed[pat] || 0) + 1;
    }

    // Check availability
    let canCraft = true;
    for (const [id, count] of Object.entries(needed)) {
      let have = 0;
      for (const slot of allSlots) {
        if (slot && slot.id === id) have += slot.count;
      }
      if (have < count) {
        canCraft = false;
        break;
      }
    }

    if (!canCraft) return;

    // Deduct ingredients
    for (const [id, count] of Object.entries(needed)) {
      let remainingToDeduct = count;
      for (let i = 0; i < inv.length; i++) {
        if (inv[i] && inv[i]!.id === id) {
          const take = Math.min(inv[i]!.count, remainingToDeduct);
          inv[i]!.count -= take;
          remainingToDeduct -= take;
          if (inv[i]!.count <= 0) inv[i] = null;
          if (remainingToDeduct <= 0) break;
        }
      }
      if (remainingToDeduct > 0) {
        for (let i = 0; i < hotbar.length; i++) {
          if (hotbar[i] && hotbar[i]!.id === id) {
            const take = Math.min(hotbar[i]!.count, remainingToDeduct);
            hotbar[i]!.count -= take;
            remainingToDeduct -= take;
            if (hotbar[i]!.count <= 0) hotbar[i] = null;
            if (remainingToDeduct <= 0) break;
          }
        }
      }
    }

    // Add crafted result
    sound.playPickup();
    addItemToInventory(inv, { ...rec.result });
    onUpdateStats({ ...stats, inventory: inv, hotbar });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 select-none">
      <div className="relative w-full max-w-2xl bg-stone-900 border-4 border-stone-700 shadow-2xl p-6 text-stone-200 pointer-events-auto">
        {/* Header Tabs & Close */}
        <div className="flex justify-between items-center mb-6 pb-2 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase transition-colors ${
                activeTab === 'inventory' ? 'bg-stone-700 text-white' : 'bg-stone-950 text-stone-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Inventory & 2x2 Craft
            </button>

            <button
              onClick={() => setActiveTab('crafting')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase transition-colors ${
                activeTab === 'crafting' ? 'bg-amber-700 text-white' : 'bg-stone-950 text-stone-400 hover:text-white'
              }`}
            >
              <Hammer className="w-3.5 h-3.5" />
              Crafting Table 3x3
            </button>

            <button
              onClick={() => setActiveTab('furnace')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase transition-colors ${
                activeTab === 'furnace' ? 'bg-rose-700 text-white' : 'bg-stone-950 text-stone-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Furnace
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1 hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Left/Middle: Crafting or Furnace Workspace */}
          <div className="md:col-span-2 bg-stone-950 p-4 border border-stone-800">
            {activeTab === 'furnace' ? (
              /* Furnace View */
              <div className="flex flex-col items-center justify-center py-4">
                <span className="text-xs font-mono text-stone-400 uppercase mb-4 tracking-wider">Furnace Smelter</span>
                <div className="flex items-center gap-6">
                  {/* Input & Fuel Column */}
                  <div className="flex flex-col items-center gap-4">
                    {/* Input slot */}
                    <div
                      onClick={() => {
                        if (furnaceInput) {
                          addItemToInventory(stats.inventory, furnaceInput);
                          setFurnaceInput(null);
                        }
                      }}
                      className="w-12 h-12 bg-stone-900 border-2 border-stone-700 flex items-center justify-center cursor-pointer hover:border-amber-400"
                    >
                      {furnaceInput && (
                        <div className="text-center font-mono text-[10px] font-bold text-amber-200">
                          {furnaceInput.id.split('_')[0].toUpperCase()}
                          <span className="block text-white text-[9px]">{furnaceInput.count}</span>
                        </div>
                      )}
                    </div>

                    {/* Animated Flame */}
                    <Flame
                      className={`w-6 h-6 transition-colors ${
                        furnaceFuel ? 'text-amber-500 animate-pulse' : 'text-stone-700'
                      }`}
                    />

                    {/* Fuel slot */}
                    <div
                      onClick={() => {
                        if (furnaceFuel) {
                          addItemToInventory(stats.inventory, furnaceFuel);
                          setFurnaceFuel(null);
                        }
                      }}
                      className="w-12 h-12 bg-stone-900 border-2 border-stone-700 flex items-center justify-center cursor-pointer hover:border-amber-400"
                    >
                      {furnaceFuel && (
                        <div className="text-center font-mono text-[10px] font-bold text-amber-200">
                          {furnaceFuel.id.split('_')[0].toUpperCase()}
                          <span className="block text-white text-[9px]">{furnaceFuel.count}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cook Progress Arrow */}
                  <div className="w-16 h-4 bg-stone-800 border border-stone-700 relative overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-300"
                      style={{ width: `${smeltProgress}%` }}
                    />
                  </div>

                  {/* Smelt Output Slot */}
                  <div
                    onClick={() => {
                      if (furnaceOutput) {
                        addItemToInventory(stats.inventory, furnaceOutput);
                        setFurnaceOutput(null);
                        sound.playPickup();
                      }
                    }}
                    className="w-14 h-14 bg-stone-900 border-2 border-emerald-500 flex items-center justify-center cursor-pointer hover:scale-105"
                  >
                    {furnaceOutput && (
                      <div className="text-center font-mono text-[11px] font-bold text-emerald-300">
                        {furnaceOutput.id.toUpperCase()}
                        <span className="block text-white text-xs">{furnaceOutput.count}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Crafting Grid View (2x2 or 3x3) */
              <div className="flex flex-col items-center">
                <span className="text-xs font-mono text-stone-400 uppercase mb-3 tracking-wider">
                  {is3x3 ? '3x3 Crafting Grid' : '2x2 Crafting Grid'}
                </span>

                <div className="flex items-center gap-6">
                  {/* Grid */}
                  <div
                    className="grid gap-1.5 p-2 bg-stone-900 border border-stone-800"
                    style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
                  >
                    {craftGrid.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleCraftSlotClick(idx)}
                        className="w-11 h-11 bg-stone-950 border border-stone-700 hover:border-amber-400 flex items-center justify-center cursor-pointer text-xs font-mono font-bold text-amber-200"
                      >
                        {item ? item.split('_')[0].toUpperCase() : ''}
                      </div>
                    ))}
                  </div>

                  <span className="text-stone-500 text-lg font-bold font-mono">➔</span>

                  {/* Craft Output Slot */}
                  <div
                    onClick={handleTakeCraftOutput}
                    className={`w-14 h-14 bg-stone-950 border-2 flex items-center justify-center cursor-pointer transition-all ${
                      craftOutput
                        ? 'border-emerald-400 bg-stone-900 shadow-[0_0_12px_rgba(52,211,153,0.3)] hover:scale-105'
                        : 'border-stone-800 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    {craftOutput && (
                      <div className="text-center font-mono font-bold text-xs text-emerald-300">
                        {craftOutput.id.split('_')[0].toUpperCase()}
                        <span className="block text-white text-[10px]">x{craftOutput.count}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Quick Recipe Book Hints */}
          <div className="bg-stone-950 p-4 border border-stone-800 flex flex-col">
            <div className="flex items-center gap-1.5 mb-3 text-xs font-mono font-bold text-amber-400 uppercase">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Quick Recipe Book</span>
            </div>
            <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[160px] pr-1">
              {CRAFTING_RECIPES.map((rec) => (
                <button
                  key={rec.id}
                  onClick={() => handleQuickCraft(rec.id)}
                  className="flex items-center justify-between px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-left text-[11px] font-mono transition-colors"
                >
                  <span className="text-stone-200 truncate">{rec.result.id.replace(/_/g, ' ')}</span>
                  <span className="text-emerald-400 font-bold ml-1">x{rec.result.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom: Player 27 Inventory Slots */}
        <div className="mb-4">
          <span className="text-xs font-mono text-stone-400 uppercase mb-2 block tracking-wider">
            Main Inventory (27 Slots)
          </span>
          <div className="grid grid-cols-9 gap-1.5 p-2 bg-stone-950 border border-stone-800">
            {stats.inventory.map((slot, idx) => (
              <div
                key={idx}
                onClick={() => handleInventorySlotClick(false, idx)}
                className="relative w-11 h-11 bg-stone-900 border border-stone-700 hover:border-amber-400 flex items-center justify-center cursor-pointer transition-all"
              >
                {slot && (
                  <div className="text-center font-mono font-bold text-[10px] text-amber-200">
                    {slot.id.split('_')[0].toUpperCase()}
                    {slot.count > 1 && (
                      <span className="absolute bottom-0.5 right-1 text-[9px] text-white font-bold">
                        {slot.count}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Player 9 Hotbar Slots */}
        <div>
          <span className="text-xs font-mono text-stone-400 uppercase mb-2 block tracking-wider">
            Hotbar Slots (1 - 9)
          </span>
          <div className="grid grid-cols-9 gap-1.5 p-2 bg-stone-950 border-2 border-stone-600">
            {stats.hotbar.map((slot, idx) => (
              <div
                key={idx}
                onClick={() => handleInventorySlotClick(true, idx)}
                className={`relative w-11 h-11 bg-stone-900 border hover:border-amber-400 flex items-center justify-center cursor-pointer transition-all ${
                  idx === stats.activeSlot ? 'border-amber-400 bg-stone-800' : 'border-stone-700'
                }`}
              >
                <span className="absolute top-0.5 left-1 text-[8px] font-mono text-stone-500">
                  {idx + 1}
                </span>
                {slot && (
                  <div className="text-center font-mono font-bold text-[10px] text-amber-200">
                    {slot.id.split('_')[0].toUpperCase()}
                    {slot.count > 1 && (
                      <span className="absolute bottom-0.5 right-1 text-[9px] text-white font-bold">
                        {slot.count}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Cursor held item hint */}
        {heldCursorItem && (
          <div className="mt-3 text-xs font-mono text-emerald-400 text-center">
            Holding: {heldCursorItem.id} (x{heldCursorItem.count}) · Click any slot to place
          </div>
        )}
      </div>
    </div>
  );
};
