import { audio } from '../game/audio.ts';

interface Props {
  onResume: () => void;
  onRestart: () => void;
  onQuitToTitle: () => void;
}

export const PauseModal: React.FC<Props> = ({ onResume, onRestart, onQuitToTitle }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 select-none">
      <div className="relative w-full max-w-sm border-4 border-slate-700 bg-slate-950 p-6 text-center text-white shadow-2xl">
        <h2 className="font-pixel text-lg text-slate-100">PAUSED</h2>
        <p className="mt-1 font-retro text-xs text-slate-400">
          MISSION TEMPORARILY SUSPENDED
        </p>

        {/* Controls Cheatsheet */}
        <div className="my-6 border border-slate-800 bg-slate-900/60 p-3 text-left font-retro text-xs text-slate-300 space-y-1">
          <div><strong className="text-sky-400 font-pixel text-[8px]">WASD / ARROWS:</strong> Walk</div>
          <div><strong className="text-amber-400 font-pixel text-[8px]">SPACE / E:</strong> Use Task / Button</div>
          <div><strong className="text-red-400 font-pixel text-[8px]">R:</strong> Report Dead Body</div>
          <div><strong className="text-red-500 font-pixel text-[8px]">Q:</strong> Kill (Impostor)</div>
          <div><strong className="text-purple-400 font-pixel text-[8px]">V:</strong> Vent (Impostor)</div>
          <div><strong className="text-slate-400 font-pixel text-[8px]">TAB / M:</strong> Toggle Map</div>
          <div><strong className="text-slate-400 font-pixel text-[8px]">ESC / P:</strong> Pause / Resume</div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              audio.playTaskStep();
              onResume();
            }}
            className="cursor-pointer border-2 border-sky-500 bg-sky-700 py-2.5 font-pixel text-xs text-white hover:bg-sky-600 active:scale-95"
          >
            RESUME
          </button>
          <button
            onClick={() => {
              audio.playTaskStep();
              onRestart();
            }}
            className="cursor-pointer border border-slate-700 bg-slate-900 py-2 font-pixel text-[9px] text-slate-300 hover:bg-slate-800 active:scale-95"
          >
            RESTART MISSION
          </button>
          <button
            onClick={() => {
              audio.playTaskStep();
              onQuitToTitle();
            }}
            className="cursor-pointer border border-slate-800 bg-black/60 py-2 font-pixel text-[9px] text-slate-500 hover:text-slate-300 active:scale-95"
          >
            EXIT TO TITLE
          </button>
        </div>
      </div>
    </div>
  );
};
