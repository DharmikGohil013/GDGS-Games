/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, RefreshCw, Trash2, Check, Package, Sparkles } from 'lucide-react';
import { PlacedFixture, Product } from '../game/types';
import { getFixtureDef } from '../game/furnitureCatalog';
import { sound } from '../game/audio';

interface ShelfInspectorProps {
  fixture: PlacedFixture;
  products: Product[];
  warehouseStock: Record<string, number>;
  onAssignProduct: (fixtureId: string, productId: string | null) => void;
  onManualRestock: (fixtureId: string) => void;
  onDismantle: (fixtureId: string) => void;
  onClose: () => void;
}

export const ShelfInspector: React.FC<ShelfInspectorProps> = ({
  fixture,
  products,
  warehouseStock,
  onAssignProduct,
  onManualRestock,
  onDismantle,
  onClose
}) => {
  const def = getFixtureDef(fixture.type);
  if (!def) return null;

  const assignedProduct = products.find(p => p.id === fixture.assignedProductId);
  const warehouseUnits = assignedProduct ? (warehouseStock[assignedProduct.id] || 0) : 0;
  const isShelf = def.category === 'shelf';

  // Filter compatible products
  const compatibleProducts = products.filter(p => {
    if (!def.compatibleCategories || def.compatibleCategories.length === 0) return true;
    return def.compatibleCategories.includes(p.category);
  });

  return (
    <div className="absolute top-20 right-6 w-80 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl p-4 text-white z-40 pointer-events-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div
            className="w-3.5 h-3.5 rounded-md border border-slate-950"
            style={{ backgroundColor: def.color }}
          />
          <div>
            <h3 className="font-bold text-xs text-white truncate max-w-[190px]">{def.name}</h3>
            <span className="text-[10px] text-slate-400 capitalize">{def.category} fixture</span>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close inspector"
          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Stock Overview for Shelves */}
      {isShelf && (
        <div className="my-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <div className="flex justify-between items-center text-xs mb-1.5 font-mono-numbers">
            <span className="text-slate-400">Shelf Capacity:</span>
            <strong className="text-sky-400">
              {fixture.currentStock} / {fixture.maxStock} Units
            </strong>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 ${
                fixture.currentStock / fixture.maxStock > 0.4
                  ? 'bg-emerald-400'
                  : fixture.currentStock > 0
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${(fixture.currentStock / fixture.maxStock) * 100}%` }}
            />
          </div>
          {assignedProduct && (
            <div className="mt-2 text-[11px] text-slate-300 flex justify-between font-mono-numbers">
              <span>Warehouse Reserves:</span>
              <span className="font-bold text-amber-300">{warehouseUnits} in storage</span>
            </div>
          )}
        </div>
      )}

      {/* Product Assignment Dropdown for Shelves */}
      {isShelf && (
        <div className="mb-3">
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
            Assigned Merchandise:
          </label>
          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            {compatibleProducts.map(prod => {
              const isSelected = fixture.assignedProductId === prod.id;
              return (
                <button
                  key={prod.id}
                  onClick={() => {
                    sound.playClick();
                    onAssignProduct(fixture.id, prod.id);
                  }}
                  className={`w-full flex items-center justify-between p-1.5 rounded-lg border text-left text-xs transition cursor-pointer ${
                    isSelected
                      ? 'bg-sky-950/80 border-sky-400 text-sky-200 font-bold'
                      : 'bg-slate-800/40 border-slate-700/40 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{prod.icon}</span>
                    <span className="truncate">{prod.name}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        {isShelf && (
          <button
            onClick={() => onManualRestock(fixture.id)}
            disabled={!assignedProduct || warehouseUnits === 0 || fixture.currentStock >= fixture.maxStock}
            className={`w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              assignedProduct && warehouseUnits > 0 && fixture.currentStock < fixture.maxStock
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 active:scale-95 shadow-md shadow-emerald-950/40'
                : 'bg-slate-800 text-slate-500 border border-slate-700/40 cursor-not-allowed'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restock Immediately from Warehouse</span>
          </button>
        )}

        <button
          onClick={() => onDismantle(fixture.id)}
          className="w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-rose-950/80 text-rose-300 border border-rose-900/40 hover:border-rose-700 transition cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Dismantle & Refund 60%</span>
        </button>
      </div>
    </div>
  );
};
