import { getRoomAt, ROOMS } from '../game/mapData.ts';
import { Player } from '../game/types.ts';

interface Props {
  players: Player[];
  onClose: () => void;
}

export const AdminTableModal: React.FC<Props> = ({ players, onClose }) => {
  // Compute counts per room
  const alivePlayers = players.filter((p) => !p.isDead && !p.inVentId);
  const roomCounts: Record<string, number> = {};

  for (const p of alivePlayers) {
    const room = getRoomAt(p.x, p.y);
    roomCounts[room] = (roomCounts[room] || 0) + 1;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 select-none">
      <div className="relative w-full max-w-2xl border-4 border-sky-700 bg-slate-950 p-6 text-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-sm font-pixel text-slate-400 hover:text-red-400"
        >
          [X]
        </button>

        <div className="mb-4 text-center">
          <h2 className="font-pixel text-sm text-sky-400">ADMIN: OCCUPANCY TERMINAL</h2>
          <p className="mt-1 font-retro text-xs text-slate-400">
            REAL-TIME LIFE-SIGN SENSORS ACROSS THE SKELD
          </p>
        </div>

        {/* Room Occupancy Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-black/50 p-4 border-2 border-slate-800">
          {ROOMS.map((room) => {
            const count = roomCounts[room.name] || 0;

            return (
              <div
                key={room.id}
                className="flex flex-col items-center justify-between border border-slate-700 bg-slate-900 p-3"
              >
                <div className="font-pixel text-[9px] text-slate-300 text-center">
                  {room.name.toUpperCase()}
                </div>

                <div className="my-2 flex items-center gap-1">
                  {count > 0 ? (
                    Array.from({ length: Math.min(5, count) }).map((_, i) => (
                      <div
                        key={i}
                        className="h-4 w-3 rounded-t-md bg-amber-400 border border-black shadow"
                      />
                    ))
                  ) : (
                    <span className="font-pixel text-[8px] text-slate-600">EMPTY</span>
                  )}
                </div>

                <div className="font-pixel text-[8px] text-sky-400">
                  {count} {count === 1 ? 'PERSON' : 'PEOPLE'}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 text-right font-pixel text-[8px] text-slate-500">
          TOTAL SENSED: {alivePlayers.length} LIFE-SIGNS
        </div>
      </div>
    </div>
  );
};
