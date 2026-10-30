/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sun, ArrowRight, Award, DollarSign, Users, Star } from 'lucide-react';
import { DailyLedger } from '../game/types';
import { sound } from '../game/audio';

interface EndOfDayModalProps {
  ledger: DailyLedger;
  currentCash: number;
  reputation: number;
  onNextDay: () => void;
}

export const EndOfDayModal: React.FC<EndOfDayModalProps> = ({
  ledger,
  currentCash,
  reputation,
  onNextDay
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 pointer-events-auto">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 text-white shadow-2xl flex flex-col items-center text-center">
        {/* Sun Emblem */}
        <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400 mb-3 shadow-lg shadow-amber-950/40">
          <Sun className="w-7 h-7" />
        </div>

        <h2 className="text-2xl font-extrabold text-white mb-1 tracking-tight">
          DAY {ledger.day} REPORT
        </h2>
        <p className="text-xs text-slate-400 mb-5">
          Store closed for the night at 8:00 PM. Here is today's financial statement.
        </p>

        {/* Hero Net Profit Pip */}
        <div className={`w-full p-4 rounded-xl mb-4 border font-mono-numbers flex flex-col items-center justify-center ${
          ledger.netProfit >= 0
            ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-400'
            : 'bg-rose-950/50 border-rose-500/40 text-rose-400'
        }`}>
          <span className="text-[10px] text-slate-300 uppercase tracking-widest font-sans font-bold mb-1">
            Day {ledger.day} Net Profit
          </span>
          <span className="text-3xl font-extrabold">
            {ledger.netProfit >= 0 ? '+' : ''}${ledger.netProfit.toFixed(2)}
          </span>
        </div>

        {/* Tabular Financial Breakdown */}
        <div className="w-full space-y-2 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs font-mono-numbers mb-4">
          <div className="flex justify-between text-slate-300">
            <span className="font-sans text-slate-400">Gross Sales Revenue:</span>
            <span className="font-bold text-emerald-400">+${ledger.grossRevenue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="font-sans text-slate-400">Wholesale Goods Restocked:</span>
            <span className="font-bold text-rose-400">-${ledger.cogs.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="font-sans text-slate-400">Employee Payroll Wages:</span>
            <span className="font-bold text-rose-400">-${ledger.staffWages.toFixed(2)}</span>
          </div>
          <div className="pt-2 border-t border-slate-700/50 flex justify-between text-slate-200">
            <span className="font-sans text-slate-400">Closing Available Cash:</span>
            <span className="font-bold text-sky-400 font-mono-numbers text-sm">
              ${currentCash.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 w-full mb-6 font-mono-numbers">
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-left">
            <div className="text-[10px] text-slate-400 font-sans flex items-center gap-1">
              <Users className="w-3 h-3 text-sky-400" />
              <span>Customers</span>
            </div>
            <div className="text-sm font-bold text-white mt-1">
              {ledger.customersServed} <span className="text-[10px] text-slate-400 font-normal">served ({ledger.customersLost} left)</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-left">
            <div className="text-[10px] text-slate-400 font-sans flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400" />
              <span>Satisfaction</span>
            </div>
            <div className="text-sm font-bold text-amber-400 mt-1">
              {ledger.satisfactionScore.toFixed(1)} / 5.0 ★
            </div>
          </div>
        </div>

        {/* Daily goal outcome */}
        {ledger.goal && (
          <div className={`w-full text-xs p-2.5 rounded-lg mb-2 border flex items-center justify-between gap-2 ${
            ledger.goal.completed
              ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-800/40 border-slate-700/40 text-slate-400'
          }`}>
            <span className="text-left">🎯 {ledger.goal.description}</span>
            <span className="font-bold font-mono-numbers shrink-0">
              {ledger.goal.completed ? `+$${ledger.goal.rewardCash}` : 'Missed'}
            </span>
          </div>
        )}

        {/* Top Seller Banner */}
        <div className="w-full text-xs text-slate-300 p-2 rounded-lg bg-slate-800/40 border border-slate-700/40 mb-2 flex items-center justify-between">
          <span className="text-slate-400 font-sans">Top Item Today:</span>
          <span className="font-bold text-amber-300">{ledger.topSellingProduct}</span>
        </div>
        <div className="w-full text-xs text-slate-300 p-2 rounded-lg bg-slate-800/40 border border-slate-700/40 mb-6 flex items-center justify-between">
          <span className="text-slate-400 font-sans">Store Reputation:</span>
          <span className="font-bold text-amber-300 font-mono-numbers">{reputation.toFixed(2)} ★</span>
        </div>

        {currentCash < 0 && (
          <div className="w-full text-xs text-rose-200 p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/50 -mt-4 mb-5 text-left">
            You are in debt. Sell unused fixtures, trim staff, or raise margins before stock runs out.
          </div>
        )}

        {/* Next Day Primary CTA with data-start="true" */}
        <button
          data-start="true"
          onClick={() => {
            sound.playClick();
            onNextDay();
          }}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition shadow-lg shadow-emerald-950/40 cursor-pointer"
        >
          <span>OPEN DOORS FOR DAY {ledger.day + 1}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
