import React, { useState, useEffect } from 'react';
import { sound } from '../game/sound';
import { Sparkles } from 'lucide-react';

interface CashFrenzyBlimpProps {
  onTriggerFrenzy: (durationSeconds: number) => void;
}

export const CashFrenzyBlimp: React.FC<CashFrenzyBlimpProps> = ({ onTriggerFrenzy }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [positionX, setPositionX] = useState(-100); // percentage -100 to 120

  useEffect(() => {
    // Spawn blimp every 45-60 seconds
    const scheduleNext = () => {
      const delay = Math.random() * 15000 + 40000;
      return setTimeout(() => {
        setIsVisible(true);
        setPositionX(-20);
      }, delay);
    };

    let timer = scheduleNext();
    return () => clearTimeout(timer);
  }, []);

  // Animate across screen when visible
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setPositionX((prev) => {
        if (prev >= 120) {
          setIsVisible(false);
          return -100;
        }
        return prev + 1.2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playFrenzy();
    onTriggerFrenzy(30);
    setIsVisible(false);
  };

  return (
    <div
      onClick={handleClick}
      style={{ left: `${positionX}%`, top: '16%' }}
      className="absolute z-40 cursor-pointer pointer-events-auto transform -translate-y-1/2 transition-all duration-100 ease-linear hover:scale-110 active:scale-95 select-none"
    >
      <div className="relative flex items-center bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 border-2 border-yellow-200 px-3 py-1.5 rounded-full shadow-xl shadow-yellow-500/40 animate-pulse">
        <Sparkles className="w-4 h-4 text-slate-950 mr-1 animate-spin" />
        <span className="text-[10px] font-black uppercase text-slate-950 font-mono tracking-tight">
          VIP BLIMP: TAP FOR 3X FRENZY!
        </span>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-base">
          💼
        </div>
      </div>
    </div>
  );
};
