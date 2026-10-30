import React, { useState, useEffect } from 'react';
import { sound } from '../game/sound';
import { formatMoney } from '../game/finance';

interface ElevatorShaftProps {
  unlockedFloorsCount: number;
  totalFloorsCount: number;
  onElevatorTip: (tipAmount: number) => void;
  cashRate: number;
}

export const ElevatorShaft: React.FC<ElevatorShaftProps> = ({
  unlockedFloorsCount,
  totalFloorsCount,
  onElevatorTip,
  cashRate,
}) => {
  const [currentFloor, setCurrentFloor] = useState<number>(1);
  const [isTipReady, setIsTipReady] = useState<boolean>(true);
  const [tipNotification, setTipNotification] = useState<string | null>(null);

  // Animate the elevator cabin moving between unlocked floors
  useEffect(() => {
    if (unlockedFloorsCount <= 1) return;
    const interval = setInterval(() => {
      setCurrentFloor((prev) => {
        // Move sequentially or bounce
        const next = prev >= unlockedFloorsCount ? 1 : prev + 1;
        return next;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [unlockedFloorsCount]);

  const handleElevatorClick = () => {
    if (!isTipReady) return;
    sound.playCash();

    // Tip is 15 seconds of income, or minimum $50
    const tip = Math.max(50, cashRate * 15);
    onElevatorTip(tip);

    setTipNotification(`+${formatMoney(tip)}`);
    setIsTipReady(false);

    setTimeout(() => {
      setTipNotification(null);
    }, 1500);

    // Tip recharges every 20s
    setTimeout(() => {
      setIsTipReady(true);
    }, 20000);
  };

  return (
    <aside 
      aria-label="Tower Elevator Shaft" 
      className="w-14 sm:w-16 flex-shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col justify-between relative select-none py-2"
    >
      {/* Top Elevator Cable Pulley Motor */}
      <div className="flex flex-col items-center">
        <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-amber-500/50 flex items-center justify-center animate-spin [animation-duration:8s]">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        </div>
        <span className="text-[8px] font-bold text-amber-400/80 uppercase tracking-tighter mt-0.5">
          VIP LIFT
        </span>
      </div>

      {/* Vertical Cables */}
      <div className="absolute top-12 bottom-12 left-1/2 -translate-x-1/2 w-[2px] bg-slate-700 flex justify-between">
        <div className="w-[1px] h-full bg-slate-600" />
      </div>

      {/* Interactive Elevator Cabin */}
      <div className="my-auto relative flex flex-col items-center z-10">
        <button
          onClick={handleElevatorClick}
          aria-label="Collect Elevator Tip"
          className="relative group w-11 h-14 rounded-xl bg-gradient-to-b from-amber-400 to-amber-600 p-0.5 shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
        >
          <div className="w-full h-full bg-slate-900 rounded-[10px] flex flex-col items-center justify-between p-1 overflow-hidden relative">
            {/* Floor Indicator Display */}
            <div className="w-full bg-slate-950 rounded px-1 py-0.5 flex justify-between items-center text-[7px] font-mono font-bold text-amber-300">
              <span>FL</span>
              <span>{currentFloor}</span>
            </div>

            {/* Bellhop Character inside cabin */}
            <div className="relative flex flex-col items-center">
              {/* Bellhop Cap */}
              <div className="w-3.5 h-1 bg-red-600 rounded-t-sm" />
              {/* Head */}
              <div className="w-3 h-3 rounded-full bg-amber-200 border border-amber-300 flex items-center justify-center text-[7px]">
                😊
              </div>
              {/* Red Bellhop Uniform with gold buttons */}
              <div className="w-4 h-3 bg-red-700 rounded-b-sm flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-yellow-300" />
              </div>
            </div>

            {/* Tip ready shine indicator */}
            {isTipReady && (
              <div className="w-full bg-emerald-500/20 text-emerald-300 text-[6px] font-black uppercase text-center rounded animate-pulse">
                TIP!
              </div>
            )}
          </div>

          {/* Floating Tip Pop */}
          {tipNotification && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-emerald-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-md animate-bounce">
              {tipNotification}
            </div>
          )}
        </button>
      </div>

      {/* Bottom Counterweight & Floor summary */}
      <div className="flex flex-col items-center">
        <span className="text-[7px] font-mono text-slate-500">
          {unlockedFloorsCount}/{totalFloorsCount}
        </span>
        <div className="w-6 h-3 bg-slate-800 rounded-b-md border border-slate-700 mt-1" />
      </div>
    </aside>
  );
};
