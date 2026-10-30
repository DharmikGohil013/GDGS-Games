import React from 'react';
import { X, CookingPot, Zap, Check, Sparkles } from 'lucide-react';
import { InventorySlot, CraftingRecipe } from '../game/types';
import { RECIPES, ITEMS } from '../game/constants';
import { canCraftRecipe } from '../game/rules';
import { sounds } from '../game/audio';

interface CraftingModalProps {
  energy: number;
  inventory: InventorySlot[];
  onClose: () => void;
  onCraft: (recipe: CraftingRecipe) => void;
}

export const CraftingModal: React.FC<CraftingModalProps> = ({
  energy,
  inventory,
  onClose,
  onCraft,
}) => {
  const handleCraft = (recipe: CraftingRecipe) => {
    const check = canCraftRecipe(recipe, inventory, energy);
    if (!check.canCraft) return;

    sounds.playEat();
    onCraft(recipe);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
      <div className="pixels-box w-full max-w-lg rounded-lg p-5 flex flex-col gap-4 text-amber-50">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#5a3921] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍳</span>
            <div>
              <h2 className="text-sm font-bold text-amber-300">Terra Villa Bakery & Windmill</h2>
              <p className="text-[8px] text-stone-300">Cook energy food and craft farm supplements</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-white rounded hover:bg-[#3a251e] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recipe Cards List */}
        <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
          {RECIPES.map((recipe) => {
            const resultItem = ITEMS[recipe.resultItemId];
            const check = canCraftRecipe(recipe, inventory, energy);

            return (
              <div
                key={recipe.id}
                className="bg-[#1a1210] border border-[#5a3921] rounded p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-[#2b1f1d] border border-[#5a3921] rounded flex items-center justify-center text-2xl shrink-0">
                    {resultItem.icon === 'popberry_tart' && '🥧'}
                    {resultItem.icon === 'energy_smoothie' && '🧃'}
                    {resultItem.icon === 'carrot_cake' && '🍰'}
                    {resultItem.icon === 'fertilizer' && '✨'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-200">{recipe.name}</span>
                      <span className="text-[8px] text-emerald-400 font-bold">
                        +{resultItem.energyRestore ? `${resultItem.energyRestore} ⚡` : ''}
                      </span>
                    </div>
                    <p className="text-[8px] text-stone-300 mt-0.5">{recipe.description}</p>

                    {/* Required ingredients list */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[7px] text-stone-400 uppercase">Needs:</span>
                      {recipe.requiredItems.map((req) => {
                        const itm = ITEMS[req.itemId];
                        const countInInv = inventory.find((s) => s.itemId === req.itemId)?.count || 0;
                        const hasEnough = countInInv >= req.count;

                        return (
                          <span
                            key={req.itemId}
                            className={`text-[8px] px-1.5 py-0.5 rounded border font-mono ${
                              hasEnough
                                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                                : 'bg-red-950/60 border-red-700 text-red-300'
                            }`}
                          >
                            {itm.name}: {countInInv}/{req.count}
                          </span>
                        );
                      })}
                      <span
                        className={`text-[8px] px-1.5 py-0.5 rounded border font-mono flex items-center gap-0.5 ${
                          energy >= recipe.energyCost
                            ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                            : 'bg-red-950/60 border-red-700 text-red-300'
                        }`}
                      >
                        <Zap className="w-2.5 h-2.5" />
                        {recipe.energyCost} ⚡
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleCraft(recipe)}
                  disabled={!check.canCraft}
                  className={`pixels-btn py-2 px-4 rounded text-[9px] font-bold shrink-0 cursor-pointer ${
                    !check.canCraft ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                >
                  Cook / Craft
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
