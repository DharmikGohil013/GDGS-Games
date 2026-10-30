/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Tag, TrendingUp, AlertTriangle } from 'lucide-react';
import { Product } from '../game/types';
import { calculatePricingElasticity } from '../game/logic';
import { sound } from '../game/audio';

interface PricingPanelProps {
  products: Product[];
  onUpdatePrice: (productId: string, newPrice: number) => void;
  onClose: () => void;
}

export const PricingPanel: React.FC<PricingPanelProps> = ({
  products,
  onUpdatePrice,
  onClose
}) => {
  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[95%] max-w-3xl bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl p-5 text-white z-40 pointer-events-auto max-h-[85vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="font-bold text-base text-slate-100">Retail Pricing & Profit Margins</h2>
            <p className="text-[11px] text-slate-400">
              Balance profit margins with customer price sensitivity to maximize daily revenue.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close pricing panel"
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Product Pricing Table */}
      <div className="mt-4 overflow-y-auto space-y-2.5 max-h-96 pr-1">
        {products.map(prod => {
          const elasticity = calculatePricingElasticity(prod.currentPrice, prod.suggestedPrice);
          const profitPerUnit = Number((prod.currentPrice - prod.unitCost).toFixed(2));
          const marginPercent = Math.round((profitPerUnit / Math.max(prod.currentPrice, 0.01)) * 100);

          let badgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-700';
          let badgeText = 'Fair Price (High Demand)';
          if (elasticity.reaction === 'bargain') {
            badgeColor = 'bg-sky-950 text-sky-300 border-sky-700';
            badgeText = 'Bargain (Rush Hour Frenzy)';
          } else if (elasticity.reaction === 'pricey') {
            badgeColor = 'bg-amber-950 text-amber-300 border-amber-700';
            badgeText = 'Premium Markup (Slower Sales)';
          } else if (elasticity.reaction === 'ripoff') {
            badgeColor = 'bg-rose-950 text-rose-300 border-rose-700';
            badgeText = 'Ripoff! (Customers Storm Out)';
          }

          return (
            <div
              key={prod.id}
              className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-[200px]">
                <span className="text-2xl">{prod.icon}</span>
                <div>
                  <div className="text-xs font-bold text-white">{prod.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono-numbers">
                    Wholesale Cost: <strong className="text-slate-200">${prod.unitCost.toFixed(2)}</strong> · Fair: ${prod.suggestedPrice.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Demand & Profit Indicators */}
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${badgeColor}`}>
                  {badgeText}
                </span>
                <span className="text-[11px] font-mono-numbers text-emerald-400 font-bold bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-700">
                  +${profitPerUnit.toFixed(2)} ({marginPercent}%)
                </span>
              </div>

              {/* Price Adjusters */}
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                <button
                  onClick={() => {
                    sound.playClick();
                    onUpdatePrice(prod.id, Math.max(prod.unitCost, prod.currentPrice - 0.50));
                  }}
                  className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 font-bold text-xs font-mono-numbers text-slate-200 cursor-pointer"
                >
                  -$0.50
                </button>
                <div className="px-3 py-1 bg-slate-950 border border-slate-700 rounded-lg font-mono-numbers text-sm font-bold text-sky-400 min-w-[68px] text-center">
                  ${prod.currentPrice.toFixed(2)}
                </div>
                <button
                  onClick={() => {
                    sound.playClick();
                    onUpdatePrice(prod.id, prod.currentPrice + 0.50);
                  }}
                  className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 font-bold text-xs font-mono-numbers text-slate-200 cursor-pointer"
                >
                  +$0.50
                </button>
                <button
                  onClick={() => {
                    sound.playClick();
                    onUpdatePrice(prod.id, prod.suggestedPrice);
                  }}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-400 hover:text-white border border-slate-700 cursor-pointer"
                  title="Reset to fair suggested market price"
                >
                  Reset
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
