import React from 'react';
import { WeatherType, CameraViewMode } from '../types/game';
import {
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Camera,
  Sun,
  CloudRain,
  Moon,
  Sparkles,
  Wrench,
  Trophy,
  Flag,
} from 'lucide-react';

interface BottomControlDockProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  weather: WeatherType;
  onChangeWeather: (w: WeatherType) => void;
  timeOfDay: number; // 0 to 24
  onChangeTimeOfDay: (t: number) => void;
  cameraView: CameraViewMode;
  onChangeCameraView: (cam: CameraViewMode) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenCurvesStudio: () => void;
  onOpenGarage: () => void;
  onOpenLeaderboard: () => void;
  onResetCarPosition: () => void;
}

export const BottomControlDock: React.FC<BottomControlDockProps> = ({
  isCollapsed,
  onToggleCollapse,
  weather,
  onChangeWeather,
  timeOfDay,
  onChangeTimeOfDay,
  cameraView,
  onChangeCameraView,
  isMuted,
  onToggleMute,
  onOpenCurvesStudio,
  onOpenGarage,
  onOpenLeaderboard,
  onResetCarPosition,
}) => {
  const formatTimeStr = (t: number) => {
    const hours = Math.floor(t);
    const mins = Math.floor((t % 1) * 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="fixed z-30 pointer-events-auto transition-transform duration-300 ease-in-out select-none"
      style={{
        bottom: '16px',
        left: '50%',
        transform: `translateX(-50%) ${isCollapsed ? 'translateY(calc(100% - 28px))' : 'translateY(0)'}`,
        maxWidth: 'min(980px, 96vw)',
        width: '100%',
      }}
    >
      {/* Collapse / Expand Tab attached to top edge */}
      <div className="flex justify-center -mb-px">
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-1.5 px-4 py-1 bg-slate-900 border border-b-0 border-slate-700/80 rounded-t-md text-xs font-mono text-slate-300 hover:text-white transition shadow-lg"
          title="Toggle Dock (H)"
        >
          {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{isCollapsed ? '▴ SHOW DOCK (H)' : '▾ HIDE DOCK (H)'}</span>
        </button>
      </div>

      {/* Main Unified Dock Bar */}
      <div className="bg-slate-950/95 border border-slate-800 rounded-lg p-3 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Navigation & Mode Triggers */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={onOpenCurvesStudio}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-800/60 rounded transition font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Curves Studio
          </button>
          <button
            onClick={onOpenGarage}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-800/60 rounded transition font-semibold"
          >
            <Wrench className="w-3.5 h-3.5" />
            Garage Upgrades
          </button>
          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-purple-400 border border-purple-800/60 rounded transition font-semibold"
          >
            <Trophy className="w-3.5 h-3.5" />
            Leaderboard
          </button>
          <button
            onClick={onResetCarPosition}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded transition"
            title="Reset car to start grid (R)"
          >
            <Flag className="w-3.5 h-3.5" />
            Reset [R]
          </button>
        </div>

        {/* Weather Selector */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded border border-slate-800">
          <button
            onClick={() => onChangeWeather('clear_day')}
            className={`p-1.5 rounded transition ${
              weather === 'clear_day' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' : 'text-slate-400 hover:text-white'
            }`}
            title="Sunny Day"
          >
            <Sun className="w-4 h-4" />
          </button>
          <button
            onClick={() => onChangeWeather('sunset')}
            className={`p-1.5 rounded transition ${
              weather === 'sunset' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50' : 'text-slate-400 hover:text-white'
            }`}
            title="Golden Sunset"
          >
            <Sun className="w-4 h-4 text-orange-400" />
          </button>
          <button
            onClick={() => onChangeWeather('rain')}
            className={`p-1.5 rounded transition ${
              weather === 'rain' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'text-slate-400 hover:text-white'
            }`}
            title="Heavy Rain"
          >
            <CloudRain className="w-4 h-4" />
          </button>
          <button
            onClick={() => onChangeWeather('night_storm')}
            className={`p-1.5 rounded transition ${
              weather === 'night_storm' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50' : 'text-slate-400 hover:text-white'
            }`}
            title="Night Lightning Storm"
          >
            <Moon className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Day-Night Slider */}
        <div className="flex items-center gap-2 bg-slate-900/80 px-2.5 py-1.5 rounded border border-slate-800 min-w-[170px]">
          <span className="text-slate-400 text-[10px] uppercase">TIME</span>
          <input
            type="range"
            min="0"
            max="24"
            step="0.25"
            value={timeOfDay}
            onChange={(e) => onChangeTimeOfDay(parseFloat(e.target.value))}
            className="w-20 accent-amber-500 cursor-pointer"
          />
          <span className="text-white font-bold tabular-nums text-xs">{formatTimeStr(timeOfDay)}</span>
        </div>

        {/* Camera Views & Audio Mute */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-slate-900/80 p-0.5 rounded border border-slate-800">
            {(['chase', 'cockpit', 'hood', 'cinematic'] as CameraViewMode[]).map((view) => (
              <button
                key={view}
                onClick={() => onChangeCameraView(view)}
                className={`px-2 py-1 rounded text-[10px] uppercase font-bold transition ${
                  cameraView === view
                    ? 'bg-red-950/80 text-red-400 border border-red-800/80'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {view}
              </button>
            ))}
          </div>

          <button
            onClick={onToggleMute}
            className={`p-1.5 rounded border transition ${
              isMuted
                ? 'bg-red-950/50 border-red-800 text-red-400'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
            title={isMuted ? 'Unmute Audio (M)' : 'Mute Audio (M)'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
