import React from 'react';
import { getDistance } from '../game/rules.ts';
import { Player, PLAYER_COLORS } from '../game/types.ts';

interface Props {
  players: Player[];
  onClose: () => void;
}

const CAMERAS = [
  { id: 'cam1', name: 'CAM 01: MEDBAY HALL', x: 740, y: 340 },
  { id: 'cam2', name: 'CAM 02: ADMIN HALL', x: 1360, y: 420 },
  { id: 'cam3', name: 'CAM 03: SECURITY', x: 600, y: 630 },
  { id: 'cam4', name: 'CAM 04: NAVIGATION', x: 1720, y: 720 },
];

export const SecurityCamsModal: React.FC<Props> = ({ players, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 select-none">
      <div className="relative w-full max-w-3xl border-4 border-emerald-700 bg-slate-950 p-6 text-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-sm font-pixel text-slate-400 hover:text-red-400"
        >
          [X]
        </button>

        <div className="mb-4 text-center">
          <h2 className="font-pixel text-sm text-emerald-400">SECURITY SURVEILLANCE</h2>
          <p className="mt-1 font-retro text-xs text-slate-400">
            LIVE CCTV FEEDS ACROSS HIGH-TRAFFIC CORRIDORS
          </p>
        </div>

        {/* 2x2 Grid of CRT Monitor Feeds */}
        <div className="grid grid-cols-2 gap-3 bg-black p-3 border-2 border-slate-800">
          {CAMERAS.map((cam) => {
            // Find players within camera range
            const visiblePlayers = players.filter(
              (p) => !p.inVentId && getDistance(p.x, p.y, cam.x, cam.y) < 220
            );

            return (
              <div
                key={cam.id}
                className="relative flex h-40 flex-col justify-between overflow-hidden border border-emerald-900 bg-[#05110c] p-2"
              >
                {/* Scanline overlay */}
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,255,100,0.1)_50%)] bg-[length:100%_4px]" />

                {/* Cam Header */}
                <div className="relative z-10 flex items-center justify-between font-pixel text-[8px] text-emerald-400">
                  <span>{cam.name}</span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_4px_#ef4444]" />
                    REC
                  </span>
                </div>

                {/* Camera Viewport Field */}
                <div className="relative z-10 flex-1 flex items-center justify-center">
                  {visiblePlayers.length > 0 ? (
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      {visiblePlayers.map((p) => (
                        <div
                          key={p.id}
                          className="flex flex-col items-center"
                        >
                          <div
                            style={{ backgroundColor: PLAYER_COLORS[p.color].hex }}
                            className="h-5 w-4 rounded-t-sm border border-black shadow"
                          />
                          <span className="mt-0.5 font-pixel text-[7px] text-emerald-300">
                            {p.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="font-pixel text-[8px] text-emerald-900">
                      NO ACTIVITY DETECTED
                    </div>
                  )}
                </div>

                {/* Cam Footer */}
                <div className="relative z-10 font-retro text-[8px] text-emerald-600">
                  SEC-FEED // 24FPS
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
