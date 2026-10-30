/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, TrendingUp, BarChart3, ArrowUpRight, Award, Sparkles, Building2 } from 'lucide-react';
import { DailyLedger, StoreUpgrade } from '../game/types';
import { sound } from '../game/audio';

interface LedgerPanelProps {
  cash: number;
  day: number;
  dailyLedgers: DailyLedger[];
  upgrades: StoreUpgrade[];
  onPurchaseUpgrade: (upgradeId: string) => { success: boolean; message: string };
  onClose: () => void;
}

export const LedgerPanel: React.FC<LedgerPanelProps> = ({
  cash,
  day,
  dailyLedgers,
  upgrades,
  onPurchaseUpgrade,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'upgrades'>('history');
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const totalRevenueAllTime = dailyLedgers.reduce((sum, l) => sum + l.grossRevenue, 0);
  const totalProfitAllTime = dailyLedgers.reduce((sum, l) => sum + l.netProfit, 0);
  const totalCustomersServed = dailyLedgers.reduce((sum, l) => sum + l.customersServed, 0);

  const handleUpgrade = (upgId: string) => {
    const res = onPurchaseUpgrade(upgId);
    setStatusMsg({ text: res.message, isError: !res.success });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[95%] max-w-3xl bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl p-5 text-white z-40 pointer-events-auto max-h-[85vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          <h2 className="font-bold text-base text-slate-100">Financial Ledger & Business Upgrades</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('history');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Daily Balance Sheets
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('upgrades');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'upgrades'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Store Expansions
            </button>
          </div>
          <button
            onClick={onClose}
            aria-label="Close ledger panel"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`mt-3 p-2 rounded-lg text-xs font-semibold ${
          statusMsg.isError ? 'bg-rose-950/80 text-rose-300 border border-rose-800' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
        }`}>
          {statusMsg.text}
        </div>
      )}

      {/* Lifetime KPI Summary */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 my-3">
        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Lifetime Revenue</div>
          <div className="text-base font-bold font-mono-numbers text-emerald-400">
            ${totalRevenueAllTime.toFixed(2)}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Net Cumulative Profit</div>
          <div className={`text-base font-bold font-mono-numbers ${totalProfitAllTime >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
            ${totalProfitAllTime.toFixed(2)}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Happy Shoppers</div>
          <div className="text-base font-bold font-mono-numbers text-amber-400">
            {totalCustomersServed}
          </div>
        </div>
      </div>

      {/* Content based on Active Tab */}
      {activeTab === 'history' ? (
        <div className="flex-1 overflow-y-auto max-h-72">
          {dailyLedgers.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs italic bg-slate-800/30 rounded-xl border border-slate-800">
              No daily reports filed yet. The financial statement for Day {day} will close at 8:00 PM tonight!
            </div>
          ) : (
            <div className="space-y-2">
              {[...dailyLedgers].reverse().map(ledger => (
                <div
                  key={ledger.day}
                  className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 text-xs font-mono-numbers"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-700/50 mb-2">
                    <span className="font-bold text-sky-400 text-sm">DAY {ledger.day} STATEMENT</span>
                    <span className="text-amber-300 font-sans font-bold">
                      ⭐ {ledger.satisfactionScore.toFixed(1)} / 5.0 Rating
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Gross Revenue:</span>
                      <strong className="text-emerald-400">${ledger.grossRevenue.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">COGS & Orders:</span>
                      <strong className="text-rose-400">-${ledger.cogs.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Staff Wages:</span>
                      <strong className="text-rose-400">-${ledger.staffWages.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Net Profit:</span>
                      <strong className={ledger.netProfit >= 0 ? 'text-emerald-400 text-sm' : 'text-rose-400 text-sm'}>
                        {ledger.netProfit >= 0 ? '+' : ''}${ledger.netProfit.toFixed(2)}
                      </strong>
                    </div>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-slate-700/30 text-[10px] text-slate-400 font-sans flex justify-between">
                    <span>Shoppers Served: <strong>{ledger.customersServed}</strong> (Lost: {ledger.customersLost})</span>
                    <span>Top Seller: <strong className="text-amber-300">{ledger.topSellingProduct}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Upgrades Tab */
        <div className="flex-1 overflow-y-auto max-h-72 space-y-3">
          {upgrades.map(upg => {
            const currentCost = Math.floor(upg.cost * Math.pow(1.5, upg.level));
            const isMax = upg.level >= upg.maxLevel;
            const canAfford = cash >= currentCost && !isMax;

            return (
              <div
                key={upg.id}
                className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">
                      {upg.effectType === 'floor_expansion' ? '🏗️' : upg.effectType === 'ad_campaign' ? '📢' : '🏷️'}
                    </span>
                    <h3 className="text-xs font-bold text-white">{upg.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-amber-300 font-mono-numbers">
                      Tier {upg.level} / {upg.maxLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-md">
                    {upg.description}
                  </p>
                </div>

                <button
                  disabled={!canAfford}
                  onClick={() => handleUpgrade(upg.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer font-mono-numbers ${
                    isMax
                      ? 'bg-slate-800 text-slate-500 border border-slate-700/40 cursor-default'
                      : canAfford
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95 shadow-md shadow-amber-950/40'
                      : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                  }`}
                >
                  {isMax ? 'MAX TIER' : `Upgrade ($${currentCost})`}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
