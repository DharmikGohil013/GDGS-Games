import React, { useEffect, useRef, useState } from 'react';
import { audio } from '../../game/audio.ts';

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

type WireColor = 'red' | 'blue' | 'yellow' | 'magenta';

const WIRE_COLORS: Record<WireColor, { bg: string; border: string; hex: string }> = {
  red: { bg: 'bg-red-600', border: 'border-red-400', hex: '#dc2626' },
  blue: { bg: 'bg-blue-600', border: 'border-blue-400', hex: '#2563eb' },
  yellow: { bg: 'bg-yellow-400', border: 'border-yellow-200', hex: '#facc15' },
  magenta: { bg: 'bg-fuchsia-600', border: 'border-fuchsia-300', hex: '#c026d3' },
};

export const WiresTask: React.FC<Props> = ({ onComplete, onClose }) => {
  const [leftWires] = useState<WireColor[]>(['red', 'blue', 'yellow', 'magenta']);
  const [rightWires, setRightWires] = useState<WireColor[]>([]);
  const [connections, setConnections] = useState<Record<WireColor, WireColor | null>>({
    red: null,
    blue: null,
    yellow: null,
    magenta: null,
  });

  const [activeDragging, setActiveDragging] = useState<WireColor | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPinRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const rightPinRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    // Shuffle right wires
    const shuffled = [...leftWires].sort(() => Math.random() - 0.5);
    setRightWires(shuffled);
  }, [leftWires]);

  const handleMouseDown = (color: WireColor, e: React.MouseEvent | React.TouchEvent) => {
    if (connections[color]) return; // already connected
    setActiveDragging(color);
    updateMousePos(e);
    audio.playTaskStep();
  };

  const updateMousePos = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: clientX - rect.left,
      y: clientY - rect.top,
    });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!activeDragging) return;
    updateMousePos(e);
  };

  const handleMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
    if (!activeDragging) return;

    // Check which right pin the mouse is over
    let connectedRight: WireColor | null = null;
    for (const color of rightWires) {
      const pin = rightPinRefs.current[color];
      if (pin) {
        const pinRect = pin.getBoundingClientRect();
        const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : (e as React.MouseEvent).clientY;

        if (
          clientX >= pinRect.left - 20 &&
          clientX <= pinRect.right + 20 &&
          clientY >= pinRect.top - 20 &&
          clientY <= pinRect.bottom + 20
        ) {
          if (color === activeDragging) {
            connectedRight = color;
          }
        }
      }
    }

    if (connectedRight) {
      // Valid connection!
      audio.playTaskStep();
      const next = { ...connections, [activeDragging]: connectedRight };
      setConnections(next);

      // Check all done
      const allDone = Object.values(next).every((v) => v !== null);
      if (allDone) {
        audio.playTaskComplete();
        setTimeout(() => {
          onComplete();
        }, 600);
      }
    }

    setActiveDragging(null);
  };

  const getPinCoords = (pin: HTMLDivElement | null) => {
    if (!pin || !containerRef.current) return { x: 0, y: 0 };
    const pRect = pin.getBoundingClientRect();
    const cRect = containerRef.current.getBoundingClientRect();
    return {
      x: pRect.left + pRect.width / 2 - cRect.left,
      y: pRect.top + pRect.height / 2 - cRect.top,
    };
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
    >
      <div
        ref={containerRef}
        className="relative w-full max-w-lg border-4 border-slate-700 bg-slate-900 p-6 text-white shadow-2xl select-none"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-sm font-pixel text-slate-400 hover:text-red-400"
        >
          [X]
        </button>

        <div className="mb-6 text-center">
          <h2 className="font-pixel text-sm text-amber-400">ELECTRICAL: FIX WIRING</h2>
          <p className="mt-1 font-retro text-xs text-slate-400">
            CONNECT MATCHING COLORED WIRES ACROSS TERMINALS
          </p>
        </div>

        {/* SVG Canvas for drawing wires */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          {/* Completed wires */}
          {leftWires.map((c) => {
            const target = connections[c];
            if (!target) return null;
            const start = getPinCoords(leftPinRefs.current[c]);
            const end = getPinCoords(rightPinRefs.current[target]);
            const col = WIRE_COLORS[c];

            return (
              <line
                key={`wire-${c}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={col.hex}
                strokeWidth={10}
                strokeLinecap="round"
              />
            );
          })}

          {/* Active dragging wire */}
          {activeDragging && (
            <line
              x1={getPinCoords(leftPinRefs.current[activeDragging]).x}
              y1={getPinCoords(leftPinRefs.current[activeDragging]).y}
              x2={mousePos.x}
              y2={mousePos.y}
              stroke={WIRE_COLORS[activeDragging].hex}
              strokeWidth={10}
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* Terminal Grid */}
        <div className="flex justify-between px-6 py-4">
          {/* Left Pins */}
          <div className="flex flex-col gap-6">
            {leftWires.map((color) => {
              const col = WIRE_COLORS[color];
              const isConnected = !!connections[color];

              return (
                <div key={`left-${color}`} className="flex items-center gap-3">
                  <div
                    ref={(el) => {
                      leftPinRefs.current[color] = el;
                    }}
                    onMouseDown={(e) => handleMouseDown(color, e)}
                    onTouchStart={(e) => handleMouseDown(color, e)}
                    className={`h-9 w-12 cursor-pointer border-2 ${col.border} ${col.bg} flex items-center justify-center shadow-md active:scale-95`}
                  >
                    <div className="h-3 w-3 rounded-full bg-slate-900 border border-white" />
                  </div>
                  <div className="font-pixel text-[8px] text-slate-400 uppercase">{color}</div>
                </div>
              );
            })}
          </div>

          {/* Right Pins */}
          <div className="flex flex-col gap-6">
            {rightWires.map((color) => {
              const col = WIRE_COLORS[color];

              return (
                <div key={`right-${color}`} className="flex items-center gap-3">
                  <div className="font-pixel text-[8px] text-slate-400 uppercase">{color}</div>
                  <div
                    ref={(el) => {
                      rightPinRefs.current[color] = el;
                    }}
                    className={`h-9 w-12 border-2 ${col.border} ${col.bg} flex items-center justify-center shadow-md`}
                  >
                    <div className="h-3 w-3 rounded-full bg-slate-900 border border-white" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
