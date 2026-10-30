import React, { useRef, useState } from 'react';
import { audio } from '../../game/audio.ts';

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

export const SwipeCardTask: React.FC<Props> = ({ onComplete, onClose }) => {
  const [cardInReader, setCardInReader] = useState(false);
  const [status, setStatus] = useState<'prompt' | 'swiping' | 'too_fast' | 'too_slow' | 'bad_read' | 'accepted'>('prompt');
  const [cardOffset, setCardOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const swipeStartTime = useRef<number>(0);
  const readerRef = useRef<HTMLDivElement>(null);

  const handleCardDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (status === 'accepted') return;
    setIsDragging(true);
    setCardInReader(true);
    setStatus('swiping');
    swipeStartTime.current = Date.now();
    audio.playTaskStep();
  };

  const handleCardDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !readerRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const rect = readerRef.current.getBoundingClientRect();
    const relX = clientX - rect.left;
    const clamped = Math.max(0, Math.min(rect.width - 120, relX));
    setCardOffset(clamped);

    // If dragged all the way across
    if (clamped >= rect.width - 130 && status === 'swiping') {
      setIsDragging(false);
      const elapsed = (Date.now() - swipeStartTime.current) / 1000;

      if (elapsed < 0.22) {
        setStatus('too_fast');
        audio.playTaskStep();
        resetCard();
      } else if (elapsed > 0.85) {
        setStatus('too_slow');
        audio.playTaskStep();
        resetCard();
      } else {
        setStatus('accepted');
        audio.playTaskComplete();
        setTimeout(() => {
          onComplete();
        }, 800);
      }
    }
  };

  const handleDragEnd = () => {
    if (isDragging && status === 'swiping') {
      setIsDragging(false);
      setStatus('bad_read');
      resetCard();
    }
  };

  const resetCard = () => {
    setTimeout(() => {
      setCardOffset(0);
      setCardInReader(false);
    }, 700);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onMouseMove={handleCardDrag}
      onMouseUp={handleDragEnd}
      onTouchMove={handleCardDrag}
      onTouchEnd={handleDragEnd}
    >
      <div className="relative w-full max-w-md border-4 border-slate-700 bg-slate-900 p-6 text-white shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-sm font-pixel text-slate-400 hover:text-red-400"
        >
          [X]
        </button>

        <div className="mb-4 text-center">
          <h2 className="font-pixel text-sm text-sky-400">ADMIN: SWIPE CARD</h2>
          <p className="mt-1 font-retro text-xs text-slate-400">
            {status === 'prompt' && 'CLICK & DRAG CARD FROM WALLET ACROSS SCANNER'}
            {status === 'swiping' && 'SWIPING...'}
            {status === 'too_fast' && 'TOO FAST. TRY AGAIN.'}
            {status === 'too_slow' && 'TOO SLOW. TRY AGAIN.'}
            {status === 'bad_read' && 'BAD READ. SWIPE ALL THE WAY.'}
            {status === 'accepted' && 'ACCEPTED. THANK YOU.'}
          </p>
        </div>

        {/* Status Indicator Screen */}
        <div className="mb-6 flex items-center justify-between border-2 border-slate-800 bg-black px-4 py-3 font-pixel text-xs">
          <span className="text-slate-500">CARD SCANNER v2.1</span>
          <div className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${
                status === 'accepted'
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  : status === 'too_fast' || status === 'too_slow' || status === 'bad_read'
                  ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                  : 'bg-amber-400'
              }`}
            />
            <span
              className={
                status === 'accepted'
                  ? 'text-emerald-400'
                  : status === 'prompt' || status === 'swiping'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }
            >
              {status === 'accepted' ? 'ACCEPTED' : status === 'prompt' ? 'READY' : 'RETRY'}
            </span>
          </div>
        </div>

        {/* Card Reader Slot Track */}
        <div
          ref={readerRef}
          className="relative mb-8 h-20 border-2 border-slate-700 bg-slate-950 overflow-hidden"
        >
          {/* Swiping groove line */}
          <div className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 bg-black border-y border-slate-800" />
          <div className="absolute top-2 left-3 font-pixel text-[9px] text-slate-600">
            SLOT &gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;
          </div>

          {/* Active Card in Slot */}
          {cardInReader && (
            <div
              style={{ transform: `translateX(${cardOffset}px)` }}
              className="absolute top-1 left-2 h-16 w-32 cursor-grab active:cursor-grabbing border-2 border-amber-600 bg-amber-400 p-2 text-slate-950 select-none shadow-lg"
              onMouseDown={handleCardDragStart}
              onTouchStart={handleCardDragStart}
            >
              <div className="h-2 w-full bg-slate-900 mb-1" />
              <div className="font-pixel text-[7px]">CREW ID: #772</div>
              <div className="mt-1 font-retro text-[9px] font-bold">THE SKELD PASS</div>
            </div>
          )}
        </div>

        {/* Wallet containing Keycard */}
        <div className="border-t-2 border-slate-800 pt-4">
          <div className="mb-2 text-center font-retro text-xs text-slate-400">WALLET POUCH</div>
          <div className="flex justify-center">
            {!cardInReader && status !== 'accepted' ? (
              <button
                onMouseDown={handleCardDragStart}
                onTouchStart={handleCardDragStart}
                className="group relative h-20 w-36 cursor-pointer border-2 border-amber-500 bg-amber-400 p-2 text-slate-950 transition hover:-translate-y-2 hover:shadow-[0_0_12px_#fbbf24]"
              >
                <div className="h-3 w-full bg-slate-900 mb-2" />
                <div className="font-pixel text-[8px]">ID: CREWMATE</div>
                <div className="font-retro text-[10px] font-bold">DRAG ME</div>
              </button>
            ) : (
              <div className="flex h-20 w-36 items-center justify-center border-2 border-dashed border-slate-700 font-pixel text-[8px] text-slate-600">
                [EMPTY]
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
