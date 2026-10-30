import React from 'react';
import { sound } from '../game/sound';

export type BulkBuyOption = 1 | 10 | 25 | 100 | 'MAX';

interface BulkBuyToggleProps {
  current: BulkBuyOption;
  onChange: (opt: BulkBuyOption) => void;
}

const OPTIONS: BulkBuyOption[] = [1, 10, 25, 100, 'MAX'];

export const BulkBuyToggle: React.FC<BulkBuyToggleProps> = ({ current, onChange }) => {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/70 border-b border-slate-800 text-xs">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
        <span>BUY LEVEL:</span>
      </span>

      <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800">
        {OPTIONS.map((opt) => {
          const isSelected = current === opt;
          return (
            <button
              key={String(opt)}
              onClick={() => {
                sound.playTap();
                onChange(opt);
              }}
              className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] transition-all cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-sm shadow-yellow-500/30 scale-[1.03]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {opt === 'MAX' ? 'MAX' : `x${opt}`}
            </button>
          );
        })}
      </div>
    </div>
  );
};
