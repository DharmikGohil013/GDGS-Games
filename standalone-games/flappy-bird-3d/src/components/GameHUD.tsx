import React from 'react';
import { CameraViewMode, WorldTheme } from '../game/FlappyScene';
import { DifficultyLevel, calculateMedal, MedalType } from '../game/rules';
import { Volume2, VolumeX, Pause, Camera, Award } from 'lucide-react';

interface GameHUDProps {
  score: number;
  bestScore: number;
  difficulty: DifficultyLevel;
  cameraMode: CameraViewMode;
  onToggleCamera: () => void;
  onPause: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

const medalColors: Record<MedalType, { fill: string; border: string; name: string }> = {
  none: { fill: '#64748b', border: '#475569', name: '' },
  bronze: { fill: '#b45309', border: '#78350f', name: 'BRONZE' },
  silver: { fill: '#94a3b8', border: '#475569', name: 'SILVER' },
  gold: { fill: '#eab308', border: '#a16207', name: 'GOLD' },
  platinum: { fill: '#38bdf8', border: '#0284c7', name: 'PLATINUM' },
};

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  bestScore,
  difficulty,
  cameraMode,
  onToggleCamera,
  onPause,
  isMuted,
  onToggleMute,
}) => {
  const currentMedal = calculateMedal(score);

  return (
    <div
      className="absolute inset-0 z-10 pointer-events-none select-none flex flex-col justify-between p-4 md:p-6"
      role="region"
      aria-label="In-Game HUD"
    >
      {/* Top Header Cluster */}
      <div className="flex items-start justify-between w-full">
        {/* Top-Left: Difficulty & Camera View Switcher */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-black/60 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-200 uppercase tracking-wider shadow-md">
            {difficulty}
          </div>

          <button
            onClick={onToggleCamera}
            aria-label="Toggle Camera View Angle"
            className="flex items-center gap-1.5 bg-black/60 hover:bg-black/80 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-semibold text-sky-300 transition-colors cursor-pointer shadow-md"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {cameraMode === 'classic_3d' ? '3D Side' : cameraMode === 'action_cam' ? '3D Chase' : '1st Person'}
            </span>
          </button>
        </div>

        {/* Top-Center: Large Display Score */}
        <div className="flex flex-col items-center">
          <div className="text-6xl md:text-7xl font-black font-mono tracking-tight text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.85)] tabular-nums">
            {score}
          </div>

          {currentMedal !== 'none' && (
            <div
              className="mt-1 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider shadow-md"
              style={{
                backgroundColor: medalColors[currentMedal].fill,
                color: '#fff',
                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
              }}
            >
              <Award className="w-3 h-3" />
              <span>{medalColors[currentMedal].name} MEDAL</span>
            </div>
          )}
        </div>

        {/* Top-Right: Sound & Pause Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="hidden sm:flex flex-col items-end mr-1">
            <span className="text-[10px] text-amber-300 uppercase font-bold tracking-wider">Best</span>
            <span className="text-sm font-bold text-white font-mono tabular-nums leading-none">{bestScore}</span>
          </div>

          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-2.5 bg-black/60 hover:bg-black/80 border border-white/10 rounded-xl text-amber-300 transition-colors cursor-pointer shadow-md"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-300" />}
          </button>

          <button
            onClick={onPause}
            aria-label="Pause Game"
            className="p-2.5 bg-black/60 hover:bg-black/80 border border-white/10 rounded-xl text-white transition-colors cursor-pointer shadow-md"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Subtle Bottom Playfield Clear Margin */}
      <div className="w-full flex justify-center pb-2">
        <span className="text-[11px] text-white/50 font-medium tracking-wide bg-black/30 px-3 py-1 rounded-full">
          Tap / Space to Flap
        </span>
      </div>
    </div>
  );
};
