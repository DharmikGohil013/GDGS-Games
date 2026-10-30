import React, { useState } from 'react';
import { X, Package, Zap, Trash2 } from 'lucide-react';
import { InventorySlot } from '../game/types';
import { ITEMS } from '../game/constants';
import { sounds } from '../game/audio';

interface BackpackModalProps {
  inventory: InventorySlot[];
  onClose: () => void;
  onUseItem: (itemId: string) => void;
}

export const BackpackModal: React.FC<BackpackModalProps> = ({
  inventory,
  onClose,
  onUseItem,
}) => {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

  const selectedSlot = selectedSlotIndex !== null ? inventory[selectedSlotIndex] : null;
  const selectedItem = selectedSlot ? ITEMS[selectedSlot.itemId] : null;

  const handleUse = () => {
    if (!selectedItem) return;
    sounds.playEat();
    onUseItem(selectedItem.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
      <div className="pixels-box w-full max-w-md rounded-lg p-5 flex flex-col gap-4 text-amber-50">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#5a3921] pb-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-amber-300">Farmer Backpack</h2>
              <p className="text-[8px] text-stone-300">24 Capacity Item Storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-white rounded hover:bg-[#3a251e] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 24-slot Inventory Grid */}
        <div className="grid grid-cols-6 gap-2 bg-[#1a1210] p-3 rounded border border-[#5a3921]">
          {Array.from({ length: 24 }).map((_, idx) => {
            const slot = inventory[idx];
            const item = slot ? ITEMS[slot.itemId] : null;
            const isSelected = selectedSlotIndex === idx;

            return (
              <button
                key={idx}
                onClick={() => setSelectedSlotIndex(slot ? idx : null)}
                className={`pixels-slot w-12 h-12 rounded flex flex-col items-center justify-center relative cursor-pointer ${
                  isSelected ? 'active ring-2 ring-amber-400' : 'hover:border-stone-500'
                }`}
              >
                {item && (
                  <>
                    <span className="text-lg">
                      {item.icon === 'hoe' && '⛏️'}
                      {item.icon === 'water_can' && '💧'}
                      {item.icon === 'axe' && '🪓'}
                      {item.icon === 'shears' && '✂️'}
                      {item.icon === 'popberry_seed' && '🌱'}
                      {item.icon === 'butterberry_seed' && '🟡'}
                      {item.icon === 'clover_seed' && '☘️'}
                      {item.icon === 'carrot_seed' && '🥕'}
                      {item.icon === 'sunpetal_seed' && '🌻'}
                      {item.icon === 'pumpkin_seed' && '🎃'}
                      {item.icon === 'popberry' && '🍓'}
                      {item.icon === 'butterberry' && '🧈'}
                      {item.icon === 'clover' && '🍀'}
                      {item.icon === 'carrot' && '🥕'}
                      {item.icon === 'sunpetal' && '🌻'}
                      {item.icon === 'pumpkin' && '🎃'}
                      {item.icon === 'wood' && '🪵'}
                      {item.icon === 'egg' && '🥚'}
                      {item.icon === 'flour' && '🌾'}
                      {item.icon === 'fertilizer' && '✨'}
                      {item.icon === 'popberry_tart' && '🥧'}
                      {item.icon === 'energy_smoothie' && '🧃'}
                      {item.icon === 'carrot_cake' && '🍰'}
                    </span>
                    {slot.count > 1 && (
                      <span className="absolute bottom-0.5 right-1 text-[7px] font-mono font-bold text-amber-200">
                        {slot.count}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Item Panel */}
        {selectedItem ? (
          <div className="pixels-box p-3 rounded flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-300 block">{selectedItem.name}</span>
              <p className="text-[8px] text-stone-300">{selectedItem.description}</p>
              {selectedItem.energyRestore && (
                <span className="text-[8px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
                  <Zap className="w-3 h-3" />
                  Restores +{selectedItem.energyRestore} Energy
                </span>
              )}
            </div>

            {selectedItem.energyRestore ? (
              <button
                onClick={handleUse}
                className="pixels-btn px-4 py-2 text-[9px] font-bold cursor-pointer"
              >
                Eat / Drink
              </button>
            ) : null}
          </div>
        ) : (
          <p className="text-center text-[8px] text-stone-400">
            Select an item in your bag to view details or consume energy food.
          </p>
        )}
      </div>
    </div>
  );
};
