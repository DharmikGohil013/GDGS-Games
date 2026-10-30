import React from 'react';
import { MAP_HEIGHT, MAP_WIDTH, ROOMS, TASKS } from '../game/mapData.ts';
import { Player, PLAYER_COLORS } from '../game/types.ts';

interface Props {
  player: Player;
  onClose: () => void;
}

export const SkeldMinimapModal: React.FC<Props> = ({ player, onClose }) => {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 select-none cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl border-4 border-slate-700 bg-slate-950 p-6 text-white shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-sm font-pixel text-slate-400 hover:text-red-400"
        >
          [X]
        </button>

        <div className="mb-4 text-center">
          <h2 className="font-pixel text-sm text-sky-400">THE SKELD: STATION MAP</h2>
          <p className="mt-1 font-retro text-xs text-slate-400">
            LOCATION &amp; TASK DISTRIBUTION SCHEMATIC (CLICK ANYWHERE TO CLOSE)
          </p>
        </div>

        {/* Scaled Station Schematic */}
        <div className="relative mx-auto h-[380px] w-full max-w-2xl border-2 border-slate-800 bg-[#080d1a] overflow-hidden">
          {/* Rooms */}
          {ROOMS.map((r) => {
            const leftPct = (r.x / MAP_WIDTH) * 100;
            const topPct = (r.y / MAP_HEIGHT) * 100;
            const widthPct = (r.w / MAP_WIDTH) * 100;
            const heightPct = (r.h / MAP_HEIGHT) * 100;

            return (
              <div
                key={r.id}
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  width: `${widthPct}%`,
                  height: `${heightPct}%`,
                }}
                className="absolute border border-slate-700 bg-slate-900/60 flex items-center justify-center p-1 text-center"
              >
                <span className="font-pixel text-[6px] text-slate-400 uppercase">
                  {r.name}
                </span>
              </div>
            );
          })}

          {/* Assigned Tasks Markers (Yellow Exclamations) */}
          {player.assignedTasks
            .filter((t) => !player.completedTasks.includes(t.id))
            .map((t) => {
              const def = TASKS.find((td) => td.id === t.definitionId);
              if (!def) return null;
              const leftPct = (def.x / MAP_WIDTH) * 100;
              const topPct = (def.y / MAP_HEIGHT) * 100;

              return (
                <div
                  key={t.id}
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 border border-black font-pixel text-[8px] font-bold text-black shadow"
                  title={`${t.room}: ${t.name}`}
                >
                  !
                </div>
              );
            })}

          {/* Player Location Marker (Cyan Dot) */}
          <div
            style={{
              left: `${(player.x / MAP_WIDTH) * 100}%`,
              top: `${(player.y / MAP_HEIGHT) * 100}%`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
          >
            <div
              style={{ backgroundColor: PLAYER_COLORS[player.color].hex }}
              className="h-4 w-4 rounded-full border-2 border-white shadow-[0_0_8px_#38bdf8]"
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between font-pixel text-[8px] text-slate-500">
          <span>● YOU ARE HERE</span>
          <span className="text-amber-400">! PENDING TASK</span>
        </div>
      </div>
    </div>
  );
};
