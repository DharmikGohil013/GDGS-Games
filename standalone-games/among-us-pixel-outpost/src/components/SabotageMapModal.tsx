import { audio } from '../game/audio.ts';
import { SabotageType } from '../game/types.ts';

interface Props {
  onTriggerSabotage: (type: SabotageType) => void;
  onClose: () => void;
  isSabotageActive: boolean;
}

export const SabotageMapModal: React.FC<Props> = ({
  onTriggerSabotage,
  onClose,
  isSabotageActive,
}) => {
  const handleTrigger = (type: SabotageType) => {
    if (isSabotageActive) return;
    audio.playSabotageAlarm();
    onTriggerSabotage(type);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 select-none">
      <div className="relative w-full max-w-xl border-4 border-red-700 bg-slate-950 p-6 text-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-sm font-pixel text-slate-400 hover:text-red-400"
        >
          [X]
        </button>

        <div className="mb-4 text-center">
          <h2 className="font-pixel text-sm text-red-500">SABOTAGE STATION SYSTEMS</h2>
          <p className="mt-1 font-retro text-xs text-slate-400">
            TRIGGER CRITICAL FAILURES TO DISRUPT CREWMATES OR WIN THE RUN
          </p>
        </div>

        {isSabotageActive && (
          <div className="mb-4 border border-red-600 bg-red-950/60 p-2 text-center font-pixel text-[9px] text-red-400">
            WARNING: A SABOTAGE IS ALREADY IN PROGRESS!
          </div>
        )}

        {/* Schematic Grid of Sabotages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
          {/* 1. Sabotage Lights */}
          <div className="flex flex-col items-center justify-between border-2 border-slate-700 bg-slate-900 p-4">
            <div className="text-center">
              <div className="text-2xl mb-1">💡</div>
              <h3 className="font-pixel text-xs text-amber-400">LIGHTS</h3>
              <p className="mt-1 font-retro text-[10px] text-slate-400">
                Dims crewmate vision radius to near zero. Impostors keep night vision!
              </p>
            </div>
            <button
              disabled={isSabotageActive}
              onClick={() => handleTrigger('lights')}
              className="mt-4 w-full border border-amber-600 bg-amber-800/80 py-2 font-pixel text-[9px] text-amber-100 hover:bg-amber-700 active:scale-95 disabled:opacity-40"
            >
              CUT POWER
            </button>
          </div>

          {/* 2. Sabotage Reactor */}
          <div className="flex flex-col items-center justify-between border-2 border-slate-700 bg-slate-900 p-4">
            <div className="text-center">
              <div className="text-2xl mb-1">☢️</div>
              <h3 className="font-pixel text-xs text-red-400">REACTOR</h3>
              <p className="mt-1 font-retro text-[10px] text-slate-400">
                Critical meltdown countdown! If not resolved in 35s, Impostors win!
              </p>
            </div>
            <button
              disabled={isSabotageActive}
              onClick={() => handleTrigger('reactor')}
              className="mt-4 w-full border border-red-600 bg-red-800/80 py-2 font-pixel text-[9px] text-red-100 hover:bg-red-700 active:scale-95 disabled:opacity-40"
            >
              MELTDOWN
            </button>
          </div>

          {/* 3. Sabotage O2 */}
          <div className="flex flex-col items-center justify-between border-2 border-slate-700 bg-slate-900 p-4">
            <div className="text-center">
              <div className="text-2xl mb-1">🫧</div>
              <h3 className="font-pixel text-xs text-cyan-400">OXYGEN (O2)</h3>
              <p className="mt-1 font-retro text-[10px] text-slate-400">
                Depletes station oxygen! If crewmates fail to enter codes, Impostors win!
              </p>
            </div>
            <button
              disabled={isSabotageActive}
              onClick={() => handleTrigger('o2')}
              className="mt-4 w-full border border-cyan-600 bg-cyan-800/80 py-2 font-pixel text-[9px] text-cyan-100 hover:bg-cyan-700 active:scale-95 disabled:opacity-40"
            >
              DEPLETE O2
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
