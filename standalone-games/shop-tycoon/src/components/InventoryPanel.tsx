/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Package, Truck, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Product, WholesaleOrder } from '../game/types';
import { sound } from '../game/audio';

interface InventoryPanelProps {
  cash: number;
  level: number;
  products: Product[];
  warehouseStock: Record<string, number>;
  warehouseUsed: number; // stored plus in transit
  warehouseCapacity: number;
  wholesaleDiscount: number;
  activeOrders: WholesaleOrder[];
  onPlaceOrder: (productId: string, quantityBoxes: number) => { success: boolean; message: string };
  onClose: () => void;
}

export const InventoryPanel: React.FC<InventoryPanelProps> = ({
  cash,
  level,
  products,
  warehouseStock,
  warehouseUsed,
  warehouseCapacity,
  wholesaleDiscount,
  activeOrders,
  onPlaceOrder,
  onClose
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product>(products[0]);
  const [quantityBoxes, setQuantityBoxes] = useState<number>(2);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const unitsTotal = quantityBoxes * selectedProduct.boxSize;
  const totalCost = Number((unitsTotal * selectedProduct.unitCost * (1 - wholesaleDiscount)).toFixed(2));
  const potentialRevenue = Number((unitsTotal * selectedProduct.currentPrice).toFixed(2));
  const estimatedProfit = Number((potentialRevenue - totalCost).toFixed(2));
  const isLocked = selectedProduct.unlockLevel > level;
  const fits = warehouseUsed + unitsTotal <= warehouseCapacity;
  const canOrder = !isLocked && fits && cash >= totalCost;

  const handleOrder = () => {
    const res = onPlaceOrder(selectedProduct.id, quantityBoxes);
    setStatusMsg({ text: res.message, isError: !res.success });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[95%] max-w-3xl bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl p-5 text-white z-40 pointer-events-auto max-h-[85vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-amber-400" />
          <h2 className="font-bold text-base text-slate-100">Wholesale Supply Logistics & Warehouse</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs">
            <span className="text-slate-400">Warehouse Space:</span>
            <span className={`font-mono-numbers font-bold ${warehouseUsed >= warehouseCapacity * 0.9 ? 'text-rose-400' : 'text-sky-400'}`}>
              {warehouseUsed}/{warehouseCapacity} Units
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close inventory panel"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Deliveries Banner if any */}
      {activeOrders.filter(o => !o.isDelivered).length > 0 && (
        <div className="my-3 p-2.5 rounded-xl bg-sky-950/40 border border-sky-800/60">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-300 mb-2">
            <Truck className="w-4 h-4 text-sky-400 animate-pulse" />
            <span>Active Supplier Shipments In Transit:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activeOrders.filter(o => !o.isDelivered).map(order => {
              const prod = products.find(p => p.id === order.productId);
              return (
                <div key={order.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span>{prod?.icon || '📦'}</span>
                    <span className="font-medium text-slate-200">{order.unitsTotal}x {prod?.name}</span>
                  </div>
                  <span className="text-amber-400 font-mono-numbers text-[11px] font-semibold">
                    In Freight Transit
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Grid: Left Products Catalog, Right Order Checkout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-2 overflow-hidden flex-1">
        {/* Left Products List */}
        <div className="md:col-span-7 flex flex-col overflow-hidden">
          <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
            Wholesale Supplier Catalog
          </div>
          <div className="space-y-1.5 overflow-y-auto max-h-72 pr-1">
            {products.map(prod => {
              const inStock = warehouseStock[prod.id] || 0;
              const isSelected = selectedProduct.id === prod.id;
              const locked = prod.unlockLevel > level;

              return (
                <button
                  key={prod.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedProduct(prod);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-400/80 shadow-md ring-1 ring-amber-400/50'
                      : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                  } ${locked ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{locked ? '🔒' : prod.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-slate-100">{prod.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {locked ? `Unlocks at store level ${prod.unlockLevel}` : `${prod.category} · ${prod.boxSize} units/carton`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono-numbers text-xs font-bold text-emerald-400">
                      ${(prod.unitCost * (1 - wholesaleDiscount)).toFixed(2)}/unit
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono-numbers">
                      Warehouse: <strong className="text-sky-300">{inStock}</strong>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Order Customizer */}
        <div className="md:col-span-5 p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{selectedProduct.icon}</span>
              <div>
                <h3 className="text-sm font-bold text-white">{selectedProduct.name}</h3>
                <span className="text-[10px] text-slate-400">{selectedProduct.description}</span>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Carton Order Quantity:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 5, 10].map(qty => (
                  <button
                    key={qty}
                    onClick={() => {
                      sound.playClick();
                      setQuantityBoxes(qty);
                    }}
                    className={`py-1.5 rounded-lg border text-xs font-bold font-mono-numbers transition cursor-pointer ${
                      quantityBoxes === qty
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {qty}x ({qty * selectedProduct.boxSize})
                  </button>
                ))}
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-1.5 p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono-numbers">
              <div className="flex justify-between text-slate-400">
                <span>Wholesale Units:</span>
                <span className="text-white font-bold">{unitsTotal} Units</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Delivery Lead Time:</span>
                <span className="text-amber-400 font-bold">{selectedProduct.deliveryLeadTime}s Express</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Wholesale Cost:</span>
                <span className="text-rose-400 font-bold font-mono-numbers">${totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                <span>Projected Profit:</span>
                <span className="text-emerald-400 font-bold">+${estimatedProfit.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            {statusMsg && (
              <div className={`flex items-center gap-1.5 mb-2 text-xs p-2 rounded-lg ${
                statusMsg.isError ? 'bg-rose-950/80 text-rose-300 border border-rose-800' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
              }`}>
                {statusMsg.isError ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <button
              disabled={!canOrder}
              onClick={handleOrder}
              className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                canOrder
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:from-amber-400 hover:to-orange-400 active:scale-95 shadow-md shadow-amber-900/30'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
              }`}
            >
              <span>
                {isLocked
                  ? `Unlocks at Level ${selectedProduct.unlockLevel}`
                  : !fits
                    ? 'Not enough warehouse space'
                    : `Place Wholesale Order ($${totalCost.toFixed(2)})`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
