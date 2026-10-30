import React, { useState } from 'react';
import { X, Coins, ArrowRightLeft, Check, AlertCircle } from 'lucide-react';
import { InventorySlot } from '../game/types';
import { ITEMS } from '../game/constants';
import { calculateShopTransaction, hasItemCount } from '../game/rules';
import { sounds } from '../game/audio';

interface ShopModalProps {
  coins: number;
  inventory: InventorySlot[];
  onClose: () => void;
  onBuy: (itemId: string, quantity: number, totalCost: number) => void;
  onSell: (itemId: string, quantity: number, totalRevenue: number) => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  coins,
  inventory,
  onClose,
  onBuy,
  onSell,
}) => {
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [selectedItemId, setSelectedItemId] = useState<string>('popberry_seed');
  const [quantity, setQuantity] = useState<number>(5);

  // Buyable items: Seeds & Tools & Fertilizer
  const buyableItems = Object.values(ITEMS).filter(
    (i) => i.category === 'seed' || i.id === 'fertilizer' || i.id === 'shears'
  );

  // Sellable items: Items player currently owns that have a sell price
  const sellableItems = inventory
    .filter((slot) => slot && ITEMS[slot.itemId] && ITEMS[slot.itemId].sellPrice > 0)
    .map((slot) => ({
      item: ITEMS[slot.itemId],
      count: slot.count,
    }));

  const activeItem = ITEMS[selectedItemId] || buyableItems[0];
  const unitPrice = tab === 'buy' ? activeItem.buyPrice : activeItem.sellPrice;
  const tx = calculateShopTransaction(unitPrice, quantity, coins, tab === 'buy');

  const maxAvailableToSell = sellableItems.find((s) => s.item.id === selectedItemId)?.count || 0;

  const handleExecute = () => {
    if (tab === 'buy') {
      if (!tx.canProceed) return;
      onBuy(activeItem.id, quantity, tx.totalCost);
      sounds.playCoin();
    } else {
      if (maxAvailableToSell < quantity) return;
      onSell(activeItem.id, quantity, tx.totalCost);
      sounds.playCoin();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
      <div className="pixels-box w-full max-w-lg rounded-lg p-5 flex flex-col gap-4 text-amber-50">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#5a3921] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏪</span>
            <div>
              <h2 className="text-sm font-bold text-amber-300">Hazel’s General Store</h2>
              <p className="text-[8px] text-stone-300">Buy high-grade seeds or sell your farm harvest</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-white rounded hover:bg-[#3a251e] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Coins & Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setTab('buy');
                setSelectedItemId('popberry_seed');
                setQuantity(5);
              }}
              className={`px-4 py-2 rounded text-[10px] font-bold cursor-pointer ${
                tab === 'buy' ? 'pixels-btn' : 'bg-[#3c2922] text-stone-300 hover:text-white'
              }`}
            >
              Buy Seeds & Supplies
            </button>
            <button
              onClick={() => {
                setTab('sell');
                if (sellableItems.length > 0) {
                  setSelectedItemId(sellableItems[0].item.id);
                  setQuantity(Math.min(5, sellableItems[0].count));
                }
              }}
              className={`px-4 py-2 rounded text-[10px] font-bold cursor-pointer ${
                tab === 'sell' ? 'pixels-btn' : 'bg-[#3c2922] text-stone-300 hover:text-white'
              }`}
            >
              Sell Crops & Wood
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-mono font-bold bg-[#1a1210] px-3 py-1.5 rounded border border-[#5a3921]">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{coins} Coins</span>
          </div>
        </div>

        {/* Items Grid & Detail Pane */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* List of items */}
          <div className="bg-[#1a1210] border border-[#5a3921] rounded p-2 max-h-56 overflow-y-auto space-y-1.5">
            {tab === 'buy' ? (
              buyableItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedItemId(item.id);
                    setQuantity(1);
                  }}
                  className={`w-full p-2 rounded flex items-center justify-between text-left cursor-pointer transition-colors ${
                    selectedItemId === item.id
                      ? 'bg-[#5a3921] border border-amber-400'
                      : 'hover:bg-[#2b1f1d]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">
                      {item.icon === 'popberry_seed' && '🌱'}
                      {item.icon === 'butterberry_seed' && '🟡'}
                      {item.icon === 'clover_seed' && '☘️'}
                      {item.icon === 'carrot_seed' && '🥕'}
                      {item.icon === 'sunpetal_seed' && '🌻'}
                      {item.icon === 'pumpkin_seed' && '🎃'}
                      {item.icon === 'fertilizer' && '✨'}
                      {item.icon === 'shears' && '✂️'}
                    </span>
                    <div>
                      <span className="text-[9px] font-bold text-amber-200 block">{item.name}</span>
                      <span className="text-[7px] text-stone-400">Takes {item.growTimeSeconds || 0}s to grow</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-amber-400">{item.buyPrice}c</span>
                </button>
              ))
            ) : sellableItems.length > 0 ? (
              sellableItems.map(({ item, count }) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedItemId(item.id);
                    setQuantity(Math.min(5, count));
                  }}
                  className={`w-full p-2 rounded flex items-center justify-between text-left cursor-pointer transition-colors ${
                    selectedItemId === item.id
                      ? 'bg-[#5a3921] border border-amber-400'
                      : 'hover:bg-[#2b1f1d]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">
                      {item.icon === 'popberry' && '🍓'}
                      {item.icon === 'butterberry' && '🧈'}
                      {item.icon === 'clover' && '🍀'}
                      {item.icon === 'carrot' && '🥕'}
                      {item.icon === 'sunpetal' && '🌻'}
                      {item.icon === 'pumpkin' && '🎃'}
                      {item.icon === 'wood' && '🪵'}
                      {item.icon === 'egg' && '🥚'}
                      {item.icon === 'popberry_tart' && '🥧'}
                      {item.icon === 'energy_smoothie' && '🧃'}
                      {item.icon === 'carrot_cake' && '🍰'}
                    </span>
                    <div>
                      <span className="text-[9px] font-bold text-amber-200 block">{item.name}</span>
                      <span className="text-[7px] text-stone-400">Owned: {count}</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-400">+{item.sellPrice}c</span>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-[9px] text-stone-400">
                You don’t have any crops or sellable goods in your inventory yet!
              </div>
            )}
          </div>

          {/* Selected Item Transaction Detail */}
          {activeItem && (
            <div className="pixels-box p-3 rounded flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-amber-300 block mb-1">{activeItem.name}</span>
                <p className="text-[8px] text-stone-300 mb-3">{activeItem.description}</p>

                {/* Quantity adjuster */}
                <div className="bg-[#1a1210] p-2 rounded border border-[#5a3921] mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] text-stone-400">Quantity</span>
                    <span className="text-xs font-mono font-bold text-amber-200">{quantity}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 5))}
                      className="pixels-btn px-2 py-1 text-[8px] font-bold"
                    >
                      -5
                    </button>
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="pixels-btn px-2 py-1 text-[8px] font-bold"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => {
                        const limit = tab === 'sell' ? maxAvailableToSell : 99;
                        setQuantity(Math.min(limit, quantity + 1));
                      }}
                      className="pixels-btn px-2 py-1 text-[8px] font-bold"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => {
                        const limit = tab === 'sell' ? maxAvailableToSell : 99;
                        setQuantity(Math.min(limit, quantity + 5));
                      }}
                      className="pixels-btn px-2 py-1 text-[8px] font-bold"
                    >
                      +5
                    </button>
                    {tab === 'sell' && (
                      <button
                        onClick={() => setQuantity(maxAvailableToSell)}
                        className="pixels-btn px-2 py-1 text-[8px] font-bold"
                      >
                        Max
                      </button>
                    )}
                  </div>
                </div>

                {/* Summary calculation */}
                <div className="flex items-center justify-between text-[9px] font-mono border-t border-[#5a3921] pt-2">
                  <span className="text-stone-300">Total {tab === 'buy' ? 'Cost' : 'Payout'}:</span>
                  <span
                    className={`font-bold text-xs ${
                      tab === 'buy' ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {tx.totalCost} Coins
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleExecute}
                disabled={tab === 'buy' ? !tx.canProceed : maxAvailableToSell < quantity || quantity <= 0}
                className={`pixels-btn w-full py-2.5 rounded text-[10px] font-bold mt-3 flex items-center justify-center gap-2 cursor-pointer ${
                  (tab === 'buy' && !tx.canProceed) || (tab === 'sell' && maxAvailableToSell < quantity)
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                {tab === 'buy' ? 'Buy Now' : 'Sell to Hazel'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
