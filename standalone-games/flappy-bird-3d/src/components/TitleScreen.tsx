import React from 'react';
import { DifficultyLevel, DifficultyConfig, DIFFICULTY_PRESETS } from '../game/rules';
import { CameraViewMode, WorldTheme } from '../game/FlappyScene';
import { Volume2, VolumeX, Play, Camera, Sun, Moon, Sunset } from 'lucide-react';
import { sound } from '../game/audio';

interface TitleScreenProps {
  onStart: () => void;
  difficulty: DifficultyLevel;
  onSelectDifficulty: (d: DifficultyLevel) => void;
  cameraMode: CameraViewMode;
  onSelectCameraMode: (c: CameraViewMode) => void;
  theme: WorldTheme;
  onSelectTheme: (t: WorldTheme) => void;
  bestScore: number;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  difficulty,
  onSelectDifficulty,
  cameraMode,
  onSelectCameraMode,
  theme,
  onSelectTheme,
  bestScore,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col justify-between p-6 md:p-10 pointer-events-none select-none"
      role="region"
      aria-label="Title Screen"
    >
      {/* Top Header Cluster with Best Record & Mute */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        <div className="flex items-center gap-2 bg-amber-950/80 border border-amber-500/30 text-amber-200 px-4 py-1.5 rounded-full shadow-lg">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-amber-400">BEST RECORD</span>
          <span className="font-bold text-lg font-mono tabular-nums text-white">{bestScore}</span>
        </div>

        <button
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute game audio' : 'Mute game audio'}
          className="p-2.5 bg-black/60 hover:bg-black/80 text-amber-300 border border-amber-500/30 rounded-xl transition-colors shadow-lg cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-amber-400" />}
        </button>
      </div>

      {/* Title Lockup in Upper Section (Over calm sky negative space) */}
      <div className="flex flex-col items-center justify-start text-center pointer-events-auto pt-2">
        <div className="relative">
          <svg className="w-72 sm:w-88 md:w-[420px] h-auto drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)]" viewBox="0 0 460 110" fill="none">
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fff3bf" />
                <stop offset="30%" stopColor="#fcc419" />
                <stop offset="70%" stopColor="#f59f00" />
                <stop offset="100%" stopColor="#d9480f" />
              </linearGradient>
              <linearGradient id="subGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38d9a9" />
                <stop offset="100%" stopColor="#69db7c" />
              </linearGradient>
            </defs>

            {/* FLAPPY BIRD 3D Main Title */}
            <text
              x="230"
              y="60"
              textAnchor="middle"
              fill="url(#goldGrad)"
              stroke="#431c00"
              strokeWidth="7"
              strokeLinejoin="round"
              paintOrder="stroke fill"
              className="font-black text-5xl tracking-widest uppercase"
              style={{ fontFamily: 'Impact, ui-sans-serif, system-ui, sans-serif' }}
            >
              FLAPPY BIRD 3D
            </text>

            {/* Subtitle Banner */}
            <rect x="130" y="74" width="200" height="24" rx="6" fill="#142412" stroke="#2b8a3e" strokeWidth="2" />
            <text
              x="230"
              y="90"
              textAnchor="middle"
              fill="url(#subGrad)"
              className="font-bold text-xs tracking-widest uppercase"
              style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
            >
              REALISTIC ARCADE REALM
            </text>
          </svg>
        </div>
      </div>

      {/* Open Middle Playfield - Hero 3D Bird Showcase Area (100% Unobstructed) */}
      <div className="flex-1 pointer-events-none" />

      {/* Bottom Control Dock & Primary Start CTA */}
      <div className="flex flex-col items-center justify-end text-center pointer-events-auto pb-2">
        <button
          data-start="true"
          onClick={onStart}
          aria-label="Start Game"
          className="group relative px-9 py-3.5 mb-5 bg-gradient-to-b from-amber-400 via-orange-500 to-amber-600 hover:from-amber-300 hover:to-orange-500 text-amber-950 font-black text-xl md:text-2xl tracking-wider uppercase rounded-2xl shadow-[0_7px_0_#9a3412,0_12px_24px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-[0_3px_0_#9a3412] transition-all flex items-center gap-3 cursor-pointer"
        >
          <Play className="w-6 h-6 fill-amber-950 group-hover:scale-110 transition-transform" />
          <span>START FLIGHT</span>
        </button>

        {/* Customization Options Bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 bg-black/70 border border-white/10 rounded-2xl p-2.5 shadow-2xl mb-4">
          {/* Difficulty */}
          <div className="flex items-center gap-1 px-1">
            <span className="text-[10px] md:text-[11px] font-bold text-amber-300 uppercase tracking-wider mr-1">Diff:</span>
            {(['easy', 'normal', 'hard'] as DifficultyLevel[]).map((lvl) => {
              const active = difficulty === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => onSelectDifficulty(lvl)}
                  aria-pressed={active}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer capitalize ${
                    active
                      ? 'bg-amber-500 text-amber-950 shadow-md'
                      : 'bg-white/5 hover:bg-white/10 text-gray-300'
                  }`}
                >
                  {DIFFICULTY_PRESETS[lvl].name}
                </button>
              );
            })}
          </div>

          <div className="hidden sm:block w-px h-5 bg-white/20" />

          {/* Theme */}
          <div className="flex items-center gap-1 px-1">
            <span className="text-[10px] md:text-[11px] font-bold text-emerald-300 uppercase tracking-wider mr-1">World:</span>
            <button
              onClick={() => onSelectTheme('day')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                theme === 'day' ? 'bg-sky-500 text-sky-950 font-bold' : 'bg-white/5 hover:bg-white/10 text-gray-300'
              }`}
              title="Sunny Day"
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Day</span>
            </button>
            <button
              onClick={() => onSelectTheme('sunset')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                theme === 'sunset' ? 'bg-orange-500 text-orange-950 font-bold' : 'bg-white/5 hover:bg-white/10 text-gray-300'
              }`}
              title="Amber Sunset"
            >
              <Sunset className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sunset</span>
            </button>
            <button
              onClick={() => onSelectTheme('night')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                theme === 'night' ? 'bg-indigo-500 text-white font-bold' : 'bg-white/5 hover:bg-white/10 text-gray-300'
              }`}
              title="Starry Night"
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Night</span>
            </button>
          </div>

          <div className="hidden sm:block w-px h-5 bg-white/20" />

          {/* Camera View Mode */}
          <div className="flex items-center gap-1 px-1">
            <span className="text-[10px] md:text-[11px] font-bold text-sky-300 uppercase tracking-wider mr-1">Cam:</span>
            <button
              onClick={() => {
                const modes: CameraViewMode[] = ['classic_3d', 'action_cam', 'first_person'];
                const next = modes[(modes.indexOf(cameraMode) + 1) % modes.length];
                onSelectCameraMode(next);
              }}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-sky-400" />
              <span>
                {cameraMode === 'classic_3d' ? '3D Side' : cameraMode === 'action_cam' ? '3D Chase' : '1st Person'}
              </span>
            </button>
          </div>
        </div>

        {/* Flat borderless control hint line */}
        <p className="inline-block text-xs font-medium text-amber-200/80 bg-black/40 border border-white/5 px-5 py-1.5 rounded-full tracking-wide">
          Space / Click Flap &nbsp;·&nbsp; P Pause &nbsp;·&nbsp; C Switch Camera &nbsp;·&nbsp; M Mute &nbsp;·&nbsp; Enter Start
        </p>
      </div>
    </div>
  );
};
