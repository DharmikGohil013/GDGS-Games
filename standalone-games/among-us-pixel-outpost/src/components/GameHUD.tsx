import React from 'react';
import { DeadBody, Player, SabotageState, TaskDefinition, VentNode } from '../game/types.ts';

interface Props {
  player: Player;
  players: Player[];
  taskProgress: number;
  sabotage: SabotageState;
  nearbyTask: TaskDefinition | null;
  nearbyBody: DeadBody | null;
  nearbyVent: VentNode | null;
  nearbyTable: boolean;
  nearbyAdmin: boolean;
  nearbyCams: boolean;
  nearbySabotageStation: boolean;
  emergencyCooldown: number;
  playerDeathNotice?: string | null;
  killTarget: Player | null;
  soundEnabled: boolean;
  elapsedMatchTime?: number;
  onToggleSound: () => void;
  onUseAction: () => void;
  onReportAction: () => void;
  onKillAction: () => void;
  onVentAction: () => void;
  onExitVentAction: () => void;
  onSabotageAction: () => void;
  onToggleMap: () => void;
  onPause: () => void;
}

export const GameHUD: React.FC<Props> = ({
  player,
  players,
  taskProgress,
  sabotage,
  nearbyTask,
  nearbyBody,
  nearbyVent,
  nearbyTable,
  nearbyAdmin,
  nearbyCams,
  nearbySabotageStation,
  emergencyCooldown,
  playerDeathNotice,
  killTarget,
  soundEnabled,
  elapsedMatchTime = 0,
  onToggleSound,
  onUseAction,
  onReportAction,
  onKillAction,
  onVentAction,
  onExitVentAction,
  onSabotageAction,
  onToggleMap,
  onPause,
}) => {
  const isImpostor = player.role === 'impostor';
  const otherImpostor = isImpostor
    ? players.find((p) => p.role === 'impostor' && p.id !== player.id)
    : null;

  const canUse =
    (!player.isDead &&
      (nearbyTask !== null ||
        (nearbyTable && emergencyCooldown <= 0) ||
        nearbyAdmin ||
        nearbyCams ||
        nearbySabotageStation)) ||
    (player.isDead && nearbyTask !== null);

  const canReport = !player.isDead && nearbyBody !== null;
  const canKill = isImpostor && !player.isDead && player.killCooldown <= 0 && killTarget !== null;
  const canVent = isImpostor && !player.isDead && (nearbyVent !== null || player.inVentId !== null);

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-4 select-none">
      {/* Top Header Row */}
      <header className="flex items-start justify-between">
        {/* Top-Left: Task Progress Bar & Objective List */}
        <div className="pointer-events-auto flex flex-col gap-2 max-w-xs md:max-w-sm">
          {/* Green Task Progress Bar */}
          <div className="border-2 border-slate-700 bg-slate-900/90 p-2 shadow-lg">
            <div className="flex items-center justify-between font-pixel text-[8px] text-slate-300 mb-1">
              <span>TOTAL TASKS COMPLETED</span>
              <span className="font-mono tabular-nums text-emerald-400 font-bold">
                {taskProgress}%
              </span>
            </div>
            <div className="h-3 w-full border border-slate-950 bg-slate-950 overflow-hidden">
              <div
                style={{ width: `${taskProgress}%` }}
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300 shadow-[0_0_8px_#34d399]"
              />
            </div>
          </div>

          {/* Assigned Tasks Checklist (Alive Crewmates & Ghost Crewmates) */}
          {!isImpostor && (
            <div className="hidden sm:block border-2 border-slate-800 bg-black/75 p-2 font-pixel text-[7px] text-slate-300">
              <div className="text-amber-400 mb-1">
                {player.isDead ? 'GHOST TASKS (COMPLETE TO WIN):' : 'YOUR TASKS:'}
              </div>
              <div className="space-y-1">
                {player.assignedTasks.map((t) => (
                  <div
                    key={t.id}
                    className={`flex items-center gap-1 ${
                      player.completedTasks.includes(t.id)
                        ? 'text-emerald-400 line-through'
                        : 'text-slate-300'
                    }`}
                  >
                    <span>{player.completedTasks.includes(t.id) ? '✓' : '•'}</span>
                    <span>
                      {t.room}: {t.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Impostor Fake Tasks Clue */}
          {isImpostor && !player.isDead && (
            <div className="border-2 border-red-900/80 bg-red-950/70 p-2 font-pixel text-[7px] text-red-300">
              <div className="text-red-400 font-bold">IMPOSTOR OBJECTIVE:</div>
              <div>• Eliminate crewmates &amp; avoid detection</div>
              {otherImpostor && (
                <div className="mt-0.5 text-amber-300">
                  • Partner: {otherImpostor.name} ({otherImpostor.color.toUpperCase()})
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center: Alerts (Sabotages or Player Death) */}
        <div className="pointer-events-auto flex flex-col items-center gap-2">
          {sabotage.active && (
            <div className="flex items-center gap-2 border-2 border-red-600 bg-red-950/90 px-4 py-2 font-pixel text-[9px] text-red-200 shadow-[0_0_15px_#dc2626]">
              <span>⚠️ CRITICAL {sabotage.type.toUpperCase()} FAILURE:</span>
              <span className="font-mono font-bold tabular-nums text-amber-300">
                {Math.max(0, Math.ceil(sabotage.timer))}s
              </span>
            </div>
          )}

          {playerDeathNotice && (
            <div className="border-2 border-red-500 bg-red-950/95 px-4 py-2 font-pixel text-[8px] text-red-200 text-center shadow-2xl">
              {playerDeathNotice}
            </div>
          )}

          {player.isDead && !playerDeathNotice && (
            <div className="border border-sky-500 bg-sky-950/90 px-3 py-1 font-pixel text-[8px] text-sky-300">
              👻 GHOST MODE: Do tasks to help Crewmates win!
            </div>
          )}
        </div>

        {/* Top-Right: Utility Control Buttons & Mission Clock */}
        <div className="pointer-events-auto flex items-center gap-2">
          <div
            title="Elapsed Mission Time"
            className="flex items-center gap-1.5 border-2 border-slate-700 bg-slate-900/95 px-2.5 py-1.5 font-pixel text-[8px] text-amber-300 shadow"
          >
            <span>⏱️</span>
            <span className="font-mono tabular-nums">
              {Math.floor(elapsedMatchTime / 60)
                .toString()
                .padStart(2, '0')}
              :
              {Math.floor(elapsedMatchTime % 60)
                .toString()
                .padStart(2, '0')}
            </span>
          </div>

          <button
            onClick={onToggleSound}
            title="Toggle Sound [M]"
            className="flex h-9 w-9 items-center justify-center border-2 border-slate-700 bg-slate-900 font-pixel text-[10px] text-slate-200 hover:border-slate-500 active:scale-95 shadow cursor-pointer"
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          <button
            onClick={onToggleMap}
            title="View Map [Tab]"
            className="flex h-9 w-9 items-center justify-center border-2 border-slate-700 bg-slate-900 font-pixel text-[10px] text-slate-200 hover:border-slate-500 active:scale-95 shadow cursor-pointer"
          >
            🗺️
          </button>
          <button
            onClick={onPause}
            title="Pause Game [Esc / P]"
            className="flex h-9 w-9 items-center justify-center border-2 border-slate-700 bg-slate-900 font-pixel text-[10px] text-slate-200 hover:border-slate-500 active:scale-95 shadow cursor-pointer"
          >
            ⏸️
          </button>
        </div>
      </header>

      {/* Bottom Row: Proximity Hints & Interactive Buttons */}
      <footer className="flex items-end justify-between">
        {/* Bottom-Left: In-Vent Indicator or Proximity Message */}
        <div className="font-pixel text-[8px] text-slate-400">
          {player.inVentId ? (
            <div className="border border-red-500 bg-red-950/90 p-2 text-red-300 flex items-center gap-2">
              <span>INSIDE VENT SYSTEM.</span>
              <button
                onClick={onExitVentAction}
                className="pointer-events-auto border border-red-400 bg-red-800 px-2 py-0.5 text-white hover:bg-red-700 active:scale-95 cursor-pointer"
              >
                HOP OUT
              </button>
            </div>
          ) : nearbySabotageStation ? (
            <div className="border border-amber-500 bg-amber-950/80 p-2 text-amber-300">
              ⚠️ FIX STATION TERMINAL IN RANGE [SPACE / E]
            </div>
          ) : nearbyTable ? (
            <div className="border border-red-500 bg-red-950/80 p-2 text-red-300">
              {emergencyCooldown > 0
                ? `EMERGENCY BUTTON (READY IN ${Math.ceil(emergencyCooldown)}s)`
                : 'EMERGENCY BUTTON IN RANGE [SPACE / E]'}
            </div>
          ) : nearbyTask ? (
            <div className="border border-amber-500 bg-amber-950/80 p-2 text-amber-300">
              TASK IN RANGE: {nearbyTask.name.toUpperCase()} [SPACE / E]
            </div>
          ) : nearbyAdmin ? (
            <div className="border border-sky-500 bg-sky-950/80 p-2 text-sky-300">
              ADMIN TERMINAL [SPACE / E]
            </div>
          ) : nearbyCams ? (
            <div className="border border-emerald-500 bg-emerald-950/80 p-2 text-emerald-300">
              SECURITY MONITORS [SPACE / E]
            </div>
          ) : null}
        </div>

        {/* Bottom-Right: Core Action Buttons Cluster */}
        <div className="pointer-events-auto flex items-center gap-3">
          {/* SABOTAGE BUTTON (Impostor only) */}
          {isImpostor && !player.isDead && (
            <button
              onClick={onSabotageAction}
              className="cursor-pointer flex h-14 w-14 flex-col items-center justify-center border-2 border-red-700 bg-red-950 font-pixel text-[8px] text-red-300 hover:bg-red-900 active:scale-95 shadow-lg"
            >
              <span>☢️</span>
              <span>SABO</span>
            </button>
          )}

          {/* VENT BUTTON (Impostor only) */}
          {isImpostor && !player.isDead && (
            <button
              disabled={!canVent}
              onClick={onVentAction}
              className={`flex h-14 w-14 flex-col items-center justify-center border-2 font-pixel text-[8px] transition active:scale-95 shadow-lg cursor-pointer ${
                canVent
                  ? 'border-purple-500 bg-purple-900 text-purple-200 hover:bg-purple-800'
                  : 'border-slate-800 bg-slate-950/60 text-slate-600 cursor-not-allowed opacity-50'
              }`}
            >
              <span>{player.inVentId ? '🔄' : '🕳️'}</span>
              <span>{player.inVentId ? 'TRAVEL' : 'VENT [V]'}</span>
            </button>
          )}

          {/* KILL BUTTON (Impostor only) */}
          {isImpostor && !player.isDead && (
            <button
              disabled={!canKill}
              onClick={onKillAction}
              className={`relative flex h-16 w-16 flex-col items-center justify-center border-3 font-pixel text-[8px] transition active:scale-95 shadow-lg cursor-pointer ${
                canKill
                  ? 'border-red-500 bg-red-600 text-white hover:bg-red-500'
                  : 'border-slate-800 bg-slate-950/70 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>🗡️</span>
              <span>KILL [Q]</span>
              {player.killCooldown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/75 font-mono font-bold text-sm text-red-400 tabular-nums">
                  {Math.ceil(player.killCooldown)}s
                </div>
              )}
            </button>
          )}

          {/* REPORT BUTTON */}
          <button
            disabled={!canReport}
            onClick={onReportAction}
            className={`flex h-16 w-16 flex-col items-center justify-center border-3 font-pixel text-[8px] transition active:scale-95 shadow-lg cursor-pointer ${
              canReport
                ? 'border-red-500 bg-red-600 text-white hover:bg-red-500 shadow-[0_0_12px_#ef4444]'
                : 'border-slate-800 bg-slate-950/60 text-slate-600 cursor-not-allowed opacity-40'
            }`}
          >
            <span>📢</span>
            <span>REPORT [R]</span>
          </button>

          {/* USE / TASK BUTTON */}
          <button
            disabled={!canUse}
            onClick={onUseAction}
            className={`flex h-16 w-16 flex-col items-center justify-center border-3 font-pixel text-[8px] transition active:scale-95 shadow-lg cursor-pointer ${
              canUse
                ? 'border-sky-400 bg-sky-600 text-white hover:bg-sky-500 shadow-[0_0_12px_#38bdf8]'
                : 'border-slate-800 bg-slate-950/60 text-slate-600 cursor-not-allowed opacity-40'
            }`}
          >
            <span>⚡</span>
            <span>USE [E]</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
