import React, { useEffect } from 'react';
import { audio } from '../game/audio.ts';
import { GameSettings } from '../game/types.ts';

interface Props {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onStartGame: () => void;
}

export const TitleScreen: React.FC<Props> = ({
  settings,
  onUpdateSettings,
  onStartGame,
}) => {
  // Listen for Enter or Space to start game immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        audio.playTaskComplete();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  const handleStart = () => {
    audio.playTaskComplete();
    onStartGame();
  };

  return (
    <div className="relative flex h-screen w-screen flex-col items-center justify-between overflow-hidden bg-[#060810] px-4 py-8 text-white select-none">
      {/* Drifting Space Stars Background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

      {/* Top Bar with Sound Toggle */}
      <header className="relative z-10 flex w-full max-w-4xl items-center justify-between">
        <div className="font-pixel text-[9px] text-slate-500">
          OFFLINE EDITION // PROFESSIONAL BOTS
        </div>
        <button
          onClick={() => {
            const next = audio.toggleSound();
            onUpdateSettings({ soundEnabled: next });
          }}
          className="cursor-pointer border border-slate-700 bg-slate-900 px-3 py-1 font-pixel text-[9px] text-slate-300 hover:border-slate-500"
        >
          SOUND: {settings.soundEnabled ? 'ON [M]' : 'OFF [M]'}
        </button>
      </header>

      {/* Hero Showcase Centerpiece: Bespoke SVG Title & Floating Bean */}
      <main className="relative z-10 flex flex-col items-center text-center my-auto">
        {/* Pixel Bean Hero */}
        <div className="mb-6 relative">
          <svg viewBox="0 0 80 90" className="h-28 w-28 filter drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]">
            {/* Backpack */}
            <rect x="8" y="24" width="16" height="36" fill="#7a0838" rx="4" />
            {/* Bean Body */}
            <rect x="20" y="12" width="46" height="54" fill="#c51111" rx="18" />
            {/* Shading */}
            <path d="M 24 50 Q 40 64 64 54 L 64 66 L 24 66 Z" fill="#7a0838" />
            {/* Visor */}
            <rect x="42" y="20" width="30" height="20" fill="#98cbe5" rx="8" stroke="#1e293b" strokeWidth="2" />
            <rect x="52" y="22" width="10" height="6" fill="#ffffff" rx="2" />
            {/* Legs */}
            <rect x="26" y="62" width="14" height="20" fill="#7a0838" rx="4" />
            <rect x="46" y="62" width="14" height="20" fill="#c51111" rx="4" />
          </svg>
        </div>

        {/* Bespoke Pixel Art Title Lockup */}
        <h1 className="font-pixel text-2xl md:text-4xl tracking-wider text-red-500 drop-shadow-[0_4px_0_#7a0838]">
          AMONG US
        </h1>
        <div className="mt-1 font-retro text-sm md:text-base tracking-widest text-sky-400">
          PIXEL OUTPOST
        </div>

        {/* Role Selector Settings */}
        <div className="mt-8 flex flex-col items-center gap-4 rounded-none border-2 border-slate-800 bg-slate-950/80 p-5 shadow-xl">
          <div className="flex flex-col gap-1 items-center">
            <span className="font-pixel text-[9px] text-slate-400">CHOOSE YOUR ROLE:</span>
            <div className="flex gap-2 mt-1">
              {[
                { id: 'random', label: 'RANDOM' },
                { id: 'crewmate', label: 'CREWMATE' },
                { id: 'impostor', label: 'IMPOSTOR' },
              ].map((role) => (
                <button
                  key={role.id}
                  onClick={() => {
                    audio.playTaskStep();
                    onUpdateSettings({ preferredRole: role.id as GameSettings['preferredRole'] });
                  }}
                  className={`cursor-pointer border-2 px-3 py-1.5 font-pixel text-[9px] transition ${
                    settings.preferredRole === role.id
                      ? role.id === 'impostor'
                        ? 'border-red-500 bg-red-950 text-red-300 shadow-[0_0_8px_#ef4444]'
                        : 'border-sky-500 bg-sky-950 text-sky-300 shadow-[0_0_8px_#38bdf8]'
                      : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 font-pixel text-[8px] text-slate-400 pt-2 border-t border-slate-800">
            <div>
              IMPOSTORS:{' '}
              <button
                onClick={() => {
                  audio.playTaskStep();
                  onUpdateSettings({ impostorCount: settings.impostorCount === 1 ? 2 : 1 });
                }}
                className="text-amber-400 underline hover:text-amber-300"
              >
                {settings.impostorCount} (CLICK TO CHANGE)
              </button>
            </div>
            <div>BOTS: 9 SMART AIS</div>
            <div className="text-emerald-400">
              TIMERS: {settings.sabotageTimerMax || 60}s SABO · {settings.meetingTimerMax || 45}s VOTE
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            data-start="true"
            onClick={handleStart}
            className="cursor-pointer border-4 border-red-500 bg-red-600 px-6 py-3 font-pixel text-xs md:text-sm text-white shadow-[0_6px_0_#991b1b] transition active:translate-y-1 active:shadow-none hover:bg-red-500"
          >
            ENTER DROPSHIP ROOM [SPACE]
          </button>
        </div>
      </main>

      {/* World-Matched Control Hint Line */}
      <footer className="relative z-10 font-retro text-xs text-slate-500 text-center">
        WASD Move · Space / E Use Task · R Report · Q Kill · V Vent · Mute M · Esc Pause
      </footer>
    </div>
  );
};
