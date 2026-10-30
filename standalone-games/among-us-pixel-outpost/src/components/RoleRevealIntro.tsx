import React, { useEffect, useState } from 'react';
import { audio } from '../game/audio.ts';
import { Player, PLAYER_COLORS } from '../game/types.ts';

interface Props {
  localPlayer: Player;
  allPlayers: Player[];
  impostorCount: number;
  onComplete: () => void;
}

export const RoleRevealIntro: React.FC<Props> = ({
  localPlayer,
  allPlayers,
  impostorCount,
  onComplete,
}) => {
  const [stage, setStage] = useState<'shhh' | 'reveal'>('shhh');
  const [countdown, setCountdown] = useState(4);

  const isImpostor = localPlayer.role === 'impostor';
  const impostors = allPlayers.filter((p) => p.role === 'impostor');
  const crewmates = allPlayers.filter((p) => p.role === 'crewmate');

  // Stage 1: "SHHHHH!"
  useEffect(() => {
    audio.playShhh();

    const t = setTimeout(() => {
      setStage('reveal');
      if (isImpostor) {
        audio.playRoleRevealImpostor();
      } else {
        audio.playRoleRevealCrewmate();
      }
    }, 1400);

    return () => clearTimeout(t);
  }, [isImpostor]);

  // Stage 2: Countdown to auto-start
  useEffect(() => {
    if (stage !== 'reveal') return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, onComplete]);

  // Listen for Space / Enter to proceed immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onComplete]);

  // Render bean avatar helper
  const renderBean = (player: Player, size = 64, isHighlighted = false) => {
    const col = PLAYER_COLORS[player.color];
    const visorColor = isImpostor ? '#ef4444' : col.visorHex;

    return (
      <div key={player.id} className="flex flex-col items-center gap-1.5 transition-transform">
        <svg
          viewBox="0 0 80 90"
          style={{ width: size, height: (size * 9) / 8 }}
          className={`filter ${
            isHighlighted
              ? isImpostor
                ? 'drop-shadow-[0_0_16px_rgba(239,68,68,0.8)] scale-110'
                : 'drop-shadow-[0_0_16px_rgba(56,189,248,0.8)] scale-110'
              : 'drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]'
          }`}
        >
          {/* Backpack */}
          <rect x="8" y="24" width="16" height="36" fill={col.shadowHex} rx="4" />
          {/* Body */}
          <rect x="20" y="12" width="46" height="54" fill={col.hex} rx="18" />
          {/* Lower shadow */}
          <path d="M 24 50 Q 40 64 64 54 L 64 66 L 24 66 Z" fill={col.shadowHex} />
          {/* Visor */}
          <rect
            x="42"
            y="20"
            width="30"
            height="20"
            fill={visorColor}
            rx="8"
            stroke="#0f172a"
            strokeWidth="2.5"
          />
          <rect x="52" y="22" width="10" height="6" fill="#ffffff" rx="2" />
          {/* Legs */}
          <rect x="26" y="62" width="14" height="20" fill={col.shadowHex} rx="4" />
          <rect x="46" y="62" width="14" height="20" fill={col.hex} rx="4" />
        </svg>
        <span
          className={`font-pixel text-[9px] px-1.5 py-0.5 rounded ${
            player.id === localPlayer.id
              ? isImpostor
                ? 'text-red-300 font-bold bg-red-950/80 border border-red-500'
                : 'text-sky-300 font-bold bg-sky-950/80 border border-sky-500'
              : isImpostor && player.role === 'impostor'
              ? 'text-red-400 bg-red-950/40'
              : 'text-slate-300'
          }`}
        >
          {player.name} {player.id === localPlayer.id ? '(YOU)' : ''}
        </span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black select-none font-pixel overflow-hidden">
      {/* 1. SHHHHH! Dramatic Opening Screen */}
      {stage === 'shhh' && (
        <div className="flex flex-col items-center justify-center gap-6 animate-fadeIn">
          {/* Detailed Pixel Astronaut holding finger to mouth */}
          <div className="relative">
            <svg viewBox="0 0 100 120" className="h-44 w-44 filter drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]">
              {/* Backpack */}
              <rect x="12" y="32" width="18" height="46" fill="#7a0838" rx="6" />
              {/* Body */}
              <rect x="26" y="16" width="56" height="68" fill="#c51111" rx="22" />
              {/* Visor */}
              <rect x="50" y="26" width="36" height="24" fill="#98cbe5" rx="10" stroke="#0f172a" strokeWidth="3" />
              <rect x="62" y="28" width="12" height="7" fill="#ffffff" rx="2" />
              {/* Legs */}
              <rect x="34" y="80" width="16" height="26" fill="#7a0838" rx="5" />
              <rect x="58" y="80" width="16" height="26" fill="#c51111" rx="5" />
              {/* Shushing Hand & Finger to Visor */}
              <circle cx="68" cy="48" r="7" fill="#ef4444" stroke="#7a0838" strokeWidth="2" />
              <rect x="65" y="30" width="6" height="19" fill="#ef4444" rx="3" stroke="#7a0838" strokeWidth="1.5" />
            </svg>
          </div>

          <h2 className="text-3xl md:text-5xl tracking-widest text-red-500 font-pixel drop-shadow-[0_4px_0_#7a0838]">
            SHHHHH!
          </h2>
          <p className="text-[10px] text-slate-400 tracking-wider">
            PREPARING SHIP TELEMETRY...
          </p>
        </div>
      )}

      {/* 2. Full Role Reveal Showcase */}
      {stage === 'reveal' && (
        <div
          className={`relative flex h-full w-full flex-col items-center justify-between p-8 text-center transition-colors duration-700 ${
            isImpostor
              ? 'bg-[radial-gradient(ellipse_at_center,_#2b0707_0%,_#06080d_80%)]'
              : 'bg-[radial-gradient(ellipse_at_center,_#081e36_0%,_#050811_80%)]'
          }`}
        >
          {/* Starfield Particles */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:28px_28px] opacity-30" />

          {/* Top Banner Tag */}
          <div className="relative z-10 pt-4">
            <span
              className={`border px-4 py-1 text-[9px] tracking-widest ${
                isImpostor
                  ? 'border-red-500 bg-red-950/80 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                  : 'border-sky-500 bg-sky-950/80 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.4)]'
              }`}
            >
              {isImpostor ? '⚠️ THREAT IDENTIFIED' : '🛡️ SHIP CREW ASSIGNED'}
            </span>
          </div>

          {/* Main Title Section */}
          <div className="relative z-10 flex flex-col items-center gap-2">
            <h1
              className={`text-4xl md:text-6xl tracking-widest ${
                isImpostor
                  ? 'text-red-500 drop-shadow-[0_0_24px_rgba(239,68,68,0.7)]'
                  : 'text-sky-400 drop-shadow-[0_0_24px_rgba(56,189,248,0.7)]'
              }`}
            >
              {isImpostor ? 'IMPOSTOR' : 'CREWMATE'}
            </h1>

            <p
              className={`text-xs md:text-sm tracking-wider ${
                isImpostor ? 'text-red-300' : 'text-slate-300'
              }`}
            >
              {isImpostor
                ? impostorCount === 1
                  ? 'YOU ARE THE ONLY IMPOSTOR ON BOARD'
                  : `THERE ARE ${impostorCount} IMPOSTORS AMONG US`
                : impostorCount === 1
                ? 'THERE IS 1 IMPOSTOR AMONG US'
                : `THERE ARE ${impostorCount} IMPOSTORS AMONG US`}
            </p>
          </div>

          {/* Player Lineup Showcase */}
          <div className="relative z-10 flex flex-wrap items-end justify-center gap-6 max-w-4xl py-4">
            {isImpostor ? (
              // If Impostor: Show only Impostors
              impostors.map((p) => renderBean(p, p.id === localPlayer.id ? 84 : 70, true))
            ) : (
              // If Crewmate: Show local player highlighted and teammates
              [
                localPlayer,
                ...crewmates.filter((p) => p.id !== localPlayer.id).slice(0, 4),
              ].map((p) => renderBean(p, p.id === localPlayer.id ? 84 : 64, p.id === localPlayer.id))
            )}
          </div>

          {/* Strategic Objectives Card */}
          <div
            className={`relative z-10 w-full max-w-lg border-2 p-4 text-left shadow-2xl ${
              isImpostor
                ? 'border-red-900 bg-red-950/70 text-red-200'
                : 'border-slate-800 bg-slate-900/80 text-slate-300'
            }`}
          >
            <div className="font-pixel text-[9px] uppercase tracking-wider mb-2 text-amber-400">
              MISSION PROTOCOLS:
            </div>
            {isImpostor ? (
              <ul className="space-y-1.5 text-[8px] leading-relaxed">
                <li className="flex items-center gap-2">
                  <span className="text-red-500">🗡️</span>
                  <span>Eliminate crewmates while avoiding witnesses.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">☢️</span>
                  <span>Trigger critical reactor, lights, or O2 sabotages.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">🕳️</span>
                  <span>Use ventilation shafts to quickly travel or hide.</span>
                </li>
              </ul>
            ) : (
              <ul className="space-y-1.5 text-[8px] leading-relaxed">
                <li className="flex items-center gap-2">
                  <span className="text-sky-400">⚡</span>
                  <span>Complete all assigned tasks across The Skeld.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-sky-400">📢</span>
                  <span>Report dead bodies and call emergency meetings.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-sky-400">🗳️</span>
                  <span>Discuss suspicions in chat and vote out the impostors!</span>
                </li>
              </ul>
            )}
          </div>

          {/* Bottom Controls / Proceed Button */}
          <div className="relative z-10 flex flex-col items-center gap-2 pb-2">
            <button
              onClick={onComplete}
              className={`cursor-pointer border-3 px-8 py-3 text-xs md:text-sm font-pixel transition active:scale-95 shadow-lg ${
                isImpostor
                  ? 'border-red-500 bg-red-600 text-white hover:bg-red-500 shadow-[0_0_16px_rgba(239,68,68,0.5)]'
                  : 'border-sky-400 bg-sky-600 text-white hover:bg-sky-500 shadow-[0_0_16px_rgba(56,189,248,0.5)]'
              }`}
            >
              START PLAYING [SPACE] ({countdown}s)
            </button>
            <span className="text-[8px] text-slate-500">
              PRESS SPACE OR CLICK TO ENTER THE SHIP IMMEDIATELY
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
