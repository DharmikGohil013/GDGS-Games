import React, { useEffect } from 'react';
import { Play, Sparkles, Wrench, Trophy } from 'lucide-react';
import { TrackConfig } from '../types/game';

interface TitleScreenProps {
  tracks: TrackConfig[];
  selectedTrack: TrackConfig;
  onSelectTrack: (track: TrackConfig) => void;
  onStartDrive: () => void;
  onOpenGarage: () => void;
  onOpenEditor: () => void;
  onOpenLeaderboard: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  tracks,
  selectedTrack,
  onSelectTrack,
  onStartDrive,
  onOpenGarage,
  onOpenEditor,
  onOpenLeaderboard,
}) => {
  // Listen for Enter or Space to start as mandated by game craft guidelines
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStartDrive();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartDrive]);

  return (
    <div className="fixed inset-0 z-40 pointer-events-auto flex flex-col justify-between p-6 md:p-12 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/70 select-none">
      {/* Top Bar: Title & Spec lockup */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 max-w-6xl">
        <div>
          {/* Custom inline SVG Title Lockup */}
          <div className="flex items-center gap-3">
            <svg className="w-10 h-10 text-red-500 fill-current" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M4 38 L22 8 L28 8 L44 38 L36 38 L30 26 L18 26 L12 38 Z M21 20 L27 20 L24 13 Z" />
              <circle cx="24" cy="24" r="2" fill="#fff" />
            </svg>
            <div>
              <h1 className="text-3xl md:text-5xl font-black italic tracking-wider text-white uppercase font-sans drop-shadow-md">
                APEX <span className="text-red-500">VELOCITY</span>
              </h1>
              <p className="text-xs md:text-sm tracking-widest text-slate-300 uppercase font-mono mt-0.5">
                F1 Supercar Simulator · Curves Studio & Track Maker
              </p>
            </div>
          </div>
        </div>

        {/* Quick Mode Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onOpenEditor}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900/90 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 rounded text-sm font-semibold tracking-wider uppercase transition shadow-lg"
          >
            <Sparkles className="w-4 h-4" />
            Curves Studio
          </button>
          <button
            onClick={onOpenGarage}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900/90 hover:bg-slate-800 text-amber-400 border border-amber-500/30 rounded text-sm font-semibold tracking-wider uppercase transition shadow-lg"
          >
            <Wrench className="w-4 h-4" />
            Garage Tuning
          </button>
          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900/90 hover:bg-slate-800 text-purple-400 border border-purple-500/30 rounded text-sm font-semibold tracking-wider uppercase transition shadow-lg"
          >
            <Trophy className="w-4 h-4" />
            Leaderboard
          </button>
        </div>
      </div>

      {/* Middle Center: Track Selector Card */}
      <div className="max-w-2xl bg-slate-900/95 border border-slate-800 rounded-lg p-5 shadow-2xl">
        <span className="text-xs uppercase font-mono tracking-wider text-red-400">Select Grand Prix Circuit</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
          {tracks.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectTrack(t)}
              className={`p-2.5 text-left rounded border transition ${
                selectedTrack.id === t.id
                  ? 'bg-red-950/60 border-red-500 text-white shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="font-bold text-sm truncate">{t.name}</div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">{t.points.length} Curves</div>
            </button>
          ))}
        </div>
        <div className="mt-3 text-xs text-slate-300 leading-relaxed font-mono">
          {selectedTrack.description}
        </div>
      </div>

      {/* Bottom Start CTA & Flat Control Hint */}
      <div className="flex flex-col items-center gap-4">
        <button
          data-start="true"
          onClick={onStartDrive}
          className="group relative flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-black text-lg md:text-xl uppercase tracking-widest rounded shadow-xl transition transform hover:scale-105 active:scale-95"
        >
          <Play className="w-6 h-6 fill-current transition-transform group-hover:translate-x-1" />
          <span>START RACING</span>
          <span className="text-xs opacity-80 font-mono font-normal ml-2">PRESS ENTER</span>
        </button>

        {/* Flat control-hint line as required by game craft guidelines */}
        <div className="text-xs md:text-sm text-slate-300 font-mono tracking-wider text-center">
          WASD / Arrows Drive · Space Handbrake · E / Shift DRS Toggle · C Camera Angle · Esc Pause
        </div>
      </div>
    </div>
  );
};
