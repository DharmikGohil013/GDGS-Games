import React, { useEffect, useRef, useState } from 'react';
import { audio } from '../game/audio.ts';
import { GameSettings, Player, PlayerColor, PLAYER_COLORS } from '../game/types.ts';

interface Props {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onStartMatch: () => void;
  onReturnTitle: () => void;
}

interface LobbyBot {
  id: string;
  name: string;
  color: PlayerColor;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 'left' | 'right';
  chatBubble?: string;
  chatTimer: number;
  walkTimer: number;
}

const LOBBY_BOT_NAMES = [
  'RedBot',
  'BlueBot',
  'Greeny',
  'Pinky',
  'OrangeBot',
  'YellowSub',
  'Blackout',
  'Whiteout',
  'PurplePro',
];

const BOT_LOBBY_CHATS = [
  'Ready to launch!',
  'Please do tasks!',
  'Who wants to do wires?',
  'Start pls!',
  'Green is already sus lol',
  'I love electrical haha',
  'Ready!',
  'Stick together team!',
  'Let us go!',
];

const ALL_COLORS: PlayerColor[] = [
  'red',
  'blue',
  'green',
  'pink',
  'orange',
  'yellow',
  'black',
  'white',
  'purple',
  'cyan',
  'lime',
  'brown',
];

export const LobbyRoom: React.FC<Props> = ({
  settings,
  onUpdateSettings,
  onStartMatch,
  onReturnTitle,
}) => {
  const [activeTab, setActiveTab] = useState<'color' | 'game' | 'timing'>('color');
  const [showLaptop, setShowLaptop] = useState(false);

  // Local player position inside dropship
  const [playerPos, setPlayerPos] = useState({ x: 400, y: 320 });
  const [playerFacing, setPlayerFacing] = useState<'left' | 'right'>('right');
  const [isNearLaptop, setIsNearLaptop] = useState(false);

  // 9 Bot participants inside dropship
  const botsRef = useRef<LobbyBot[]>([]);
  const [, setFrameTick] = useState(0);

  // Initialize bot positions in dropship
  useEffect(() => {
    const availableColors = ALL_COLORS.filter((c) => c !== (settings.playerColor || 'red'));
    botsRef.current = LOBBY_BOT_NAMES.map((name, i) => {
      const angle = (i / 9) * Math.PI * 2;
      return {
        id: `bot_${i}`,
        name,
        color: availableColors[i % availableColors.length],
        x: 400 + Math.cos(angle) * (120 + (i % 3) * 30),
        y: 280 + Math.sin(angle) * (70 + (i % 2) * 20),
        vx: 0,
        vy: 0,
        facing: Math.random() > 0.5 ? 'left' : 'right',
        chatBubble: BOT_LOBBY_CHATS[i],
        chatTimer: 2.0 + Math.random() * 4.0,
        walkTimer: 1.0 + Math.random() * 2.0,
      };
    });
  }, []);

  // Keyboard navigation inside dropship
  useEffect(() => {
    const keys = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      keys.add(e.code);
      if (e.code === 'Space') {
        if (!showLaptop) {
          e.preventDefault();
          audio.playEmergencyHorn();
          onStartMatch();
        }
      }
      if (e.code === 'KeyE') {
        if (isNearLaptop) {
          setShowLaptop((prev) => !prev);
          audio.playTaskStep();
        }
      }
      if (e.code === 'Escape') {
        if (showLaptop) {
          setShowLaptop(false);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.code);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Movement animation loop in dropship
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // Player move
      let dx = 0;
      let dy = 0;
      if (keys.has('KeyW') || keys.has('ArrowUp')) dy -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) dy += 1;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1;

      if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy) || 1;
        const speed = 190;
        setPlayerPos((prev) => {
          // Clamp inside dropship boundaries (w: 800, h: 500)
          const nextX = Math.max(120, Math.min(680, prev.x + (dx / len) * speed * dt));
          const nextY = Math.max(160, Math.min(420, prev.y + (dy / len) * speed * dt));
          return { x: nextX, y: nextY };
        });
        if (dx < 0) setPlayerFacing('left');
        if (dx > 0) setPlayerFacing('right');
      }

      // Check proximity to laptop crate at (400, 240)
      setPlayerPos((p) => {
        const dist = Math.hypot(p.x - 400, p.y - 240);
        setIsNearLaptop(dist < 90);
        return p;
      });

      // Update bot wandering & chatter
      botsRef.current.forEach((bot) => {
        bot.walkTimer -= dt;
        if (bot.walkTimer <= 0) {
          bot.walkTimer = 1.5 + Math.random() * 3.0;
          if (Math.random() < 0.6) {
            const wanderAngle = Math.random() * Math.PI * 2;
            bot.vx = Math.cos(wanderAngle) * 60;
            bot.vy = Math.sin(wanderAngle) * 40;
            bot.facing = bot.vx < 0 ? 'left' : 'right';
          } else {
            bot.vx = 0;
            bot.vy = 0;
          }
        }

        bot.x = Math.max(120, Math.min(680, bot.x + bot.vx * dt));
        bot.y = Math.max(160, Math.min(420, bot.y + bot.vy * dt));

        // Periodic bot chat
        bot.chatTimer -= dt;
        if (bot.chatTimer <= 0) {
          bot.chatTimer = 4.0 + Math.random() * 6.0;
          bot.chatBubble = BOT_LOBBY_CHATS[Math.floor(Math.random() * BOT_LOBBY_CHATS.length)];
          setTimeout(() => {
            bot.chatBubble = undefined;
          }, 2400);
        }
      });

      setFrameTick((t) => t + 1);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      cancelAnimationFrame(animId);
    };
  }, [onStartMatch, showLaptop, isNearLaptop]);

  const currentColor = settings.playerColor || 'red';

  return (
    <div className="relative flex h-screen w-screen flex-col items-center justify-between overflow-hidden bg-[#070b14] text-white font-pixel select-none">
      {/* Top Header Bar */}
      <header className="relative z-20 flex w-full max-w-5xl items-center justify-between px-6 pt-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onReturnTitle}
            className="cursor-pointer border border-slate-700 bg-slate-900 px-3 py-1 text-[9px] text-slate-300 hover:border-slate-500"
          >
            ← TITLE
          </button>
          <div className="text-[10px] text-sky-400">
            DROPSHIP WAITING ROOM // <span className="text-emerald-400">10/10 READY</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const next = audio.toggleSound();
              onUpdateSettings({ soundEnabled: next });
            }}
            className="cursor-pointer border border-slate-700 bg-slate-900 px-3 py-1 text-[9px] text-slate-300 hover:border-slate-500"
          >
            SOUND: {settings.soundEnabled ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => setShowLaptop(true)}
            className="cursor-pointer border border-amber-600 bg-amber-950/80 px-3 py-1 text-[9px] text-amber-300 hover:bg-amber-900 flex items-center gap-1.5"
          >
            <span>💻</span>
            <span>CUSTOMIZE & TIMERS</span>
          </button>
        </div>
      </header>

      {/* Main Interactive Dropship Viewport */}
      <main className="relative z-10 flex flex-1 w-full max-w-5xl items-center justify-center p-4">
        {/* Dropship Cabin Interior */}
        <div className="relative w-full max-w-3xl h-[480px] rounded-2xl border-4 border-slate-700 bg-gradient-to-b from-slate-900 via-[#10192e] to-[#0c1322] shadow-[0_0_50px_rgba(15,23,42,0.8)] overflow-hidden">
          {/* Dropship Steel Floor Panels */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

          {/* Cabin Windows with Cosmic Stars */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-4">
            <div className="h-10 w-24 rounded border-2 border-slate-600 bg-sky-950/40 shadow-inner flex items-center justify-center overflow-hidden">
              <div className="text-[7px] text-sky-400 opacity-60">● ● ✦</div>
            </div>
            <div className="h-12 w-32 rounded border-2 border-slate-500 bg-sky-900/40 shadow-inner flex items-center justify-center overflow-hidden">
              <div className="text-[8px] text-sky-300 font-bold opacity-80">THE SKELD ORBIT</div>
            </div>
            <div className="h-10 w-24 rounded border-2 border-slate-600 bg-sky-950/40 shadow-inner flex items-center justify-center overflow-hidden">
              <div className="text-[7px] text-sky-400 opacity-60">✦ ● ●</div>
            </div>
          </div>

          {/* Central Customization Laptop Crate at (400, 240) */}
          <div
            onClick={() => setShowLaptop(true)}
            className="absolute top-[200px] left-1/2 -translate-x-1/2 flex flex-col items-center cursor-pointer group z-10"
          >
            <div className="relative flex flex-col items-center">
              {/* Glowing Laptop Screen */}
              <div className="h-7 w-11 rounded-t border-2 border-amber-400 bg-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.6)] flex items-center justify-center">
                <span className="text-[7px] text-slate-950 font-bold">OUTPOST</span>
              </div>
              {/* Laptop Keyboard */}
              <div className="h-2 w-13 rounded-b border border-slate-600 bg-slate-800" />
              {/* Metal Crate Support */}
              <div className="h-9 w-16 border-2 border-slate-600 bg-slate-800 shadow-lg flex items-center justify-center">
                <div className="h-6 w-12 border border-slate-700 bg-slate-900 flex items-center justify-center text-[7px] text-slate-400">
                  CRATE
                </div>
              </div>
            </div>

            {/* Prompt */}
            <span
              className={`mt-1 font-pixel text-[8px] px-2 py-0.5 rounded ${
                isNearLaptop
                  ? 'border border-amber-400 bg-amber-950 text-amber-300 shadow'
                  : 'text-slate-400 bg-slate-950/60'
              }`}
            >
              {isNearLaptop ? '💻 PRESS [E] TO CUSTOMIZE' : '💻 LAPTOP'}
            </span>
          </div>

          {/* Left & Right Dropship Benches */}
          <div className="absolute left-6 top-24 bottom-24 w-8 border-2 border-slate-700 bg-slate-800/80 rounded" />
          <div className="absolute right-6 top-24 bottom-24 w-8 border-2 border-slate-700 bg-slate-800/80 rounded" />

          {/* 9 Bot Characters Wandering Around */}
          {botsRef.current.map((bot) => {
            const col = PLAYER_COLORS[bot.color];
            return (
              <div
                key={bot.id}
                style={{
                  transform: `translate(${bot.x - 24}px, ${bot.y - 32}px)`,
                }}
                className="absolute transition-transform duration-75 flex flex-col items-center pointer-events-none"
              >
                {/* Bot Chat Bubble */}
                {bot.chatBubble && (
                  <div className="mb-1 border border-slate-500 bg-slate-950/95 px-2 py-0.5 text-[7px] text-slate-200 rounded shadow-md whitespace-nowrap animate-bounce">
                    {bot.chatBubble}
                  </div>
                )}
                {/* Bot Bean Avatar */}
                <svg
                  viewBox="0 0 80 90"
                  className={`h-12 w-12 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${
                    bot.facing === 'left' ? '-scale-x-100' : ''
                  }`}
                >
                  <rect x="8" y="24" width="16" height="36" fill={col.shadowHex} rx="4" />
                  <rect x="20" y="12" width="46" height="54" fill={col.hex} rx="18" />
                  <rect x="42" y="20" width="30" height="20" fill={col.visorHex} rx="8" stroke="#1e293b" strokeWidth="2" />
                  <rect x="52" y="22" width="10" height="6" fill="#ffffff" rx="2" />
                  <rect x="26" y="62" width="14" height="20" fill={col.shadowHex} rx="4" />
                  <rect x="46" y="62" width="14" height="20" fill={col.hex} rx="4" />
                </svg>
                <span className="font-pixel text-[7px] text-slate-400 mt-0.5">{bot.name}</span>
              </div>
            );
          })}

          {/* Local Player Bean Character */}
          <div
            style={{
              transform: `translate(${playerPos.x - 28}px, ${playerPos.y - 38}px)`,
            }}
            className="absolute z-20 flex flex-col items-center transition-transform duration-75"
          >
            {/* Player Indicator Tag */}
            <div className="mb-1 border border-sky-400 bg-sky-950/95 px-2 py-0.5 text-[8px] text-sky-300 font-bold rounded shadow-[0_0_8px_rgba(56,189,248,0.5)]">
              YOU
            </div>

            {/* Local Player Avatar */}
            {(() => {
              const col = PLAYER_COLORS[currentColor];
              return (
                <svg
                  viewBox="0 0 80 90"
                  className={`h-14 w-14 filter drop-shadow-[0_0_12px_rgba(56,189,248,0.5)] ${
                    playerFacing === 'left' ? '-scale-x-100' : ''
                  }`}
                >
                  <rect x="8" y="24" width="16" height="36" fill={col.shadowHex} rx="4" />
                  <rect x="20" y="12" width="46" height="54" fill={col.hex} rx="18" />
                  <path d="M 24 50 Q 40 64 64 54 L 64 66 L 24 66 Z" fill={col.shadowHex} />
                  <rect x="42" y="20" width="30" height="20" fill={col.visorHex} rx="8" stroke="#1e293b" strokeWidth="2.5" />
                  <rect x="52" y="22" width="10" height="6" fill="#ffffff" rx="2" />
                  <rect x="26" y="62" width="14" height="20" fill={col.shadowHex} rx="4" />
                  <rect x="46" y="62" width="14" height="20" fill={col.hex} rx="4" />
                </svg>
              );
            })()}
          </div>
        </div>
      </main>

      {/* Bottom Start Action Bar */}
      <footer className="relative z-20 flex w-full max-w-5xl items-center justify-between px-6 pb-6">
        <div className="flex flex-col text-left">
          <div className="text-[9px] text-slate-400">
            CONTROLS: <span className="text-white">WASD / Arrow Keys</span> to Walk
          </div>
          <div className="text-[8px] text-slate-500">
            Approach laptop or click customize to adjust timers & role
          </div>
        </div>

        {/* Primary Start CTA */}
        <button
          onClick={() => {
            audio.playEmergencyHorn();
            onStartMatch();
          }}
          className="cursor-pointer border-4 border-red-500 bg-red-600 px-8 py-3 text-sm md:text-base font-pixel text-white shadow-[0_6px_0_#991b1b] transition active:translate-y-1 active:shadow-none hover:bg-red-500"
        >
          START MATCH [SPACE]
        </button>
      </footer>

      {/* Customization & Timers Modal */}
      {showLaptop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg border-4 border-slate-700 bg-slate-950 p-6 shadow-2xl text-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">💻</span>
                <h3 className="text-sm font-pixel text-amber-400">DROPSHIP TERMINAL</h3>
              </div>
              <button
                onClick={() => setShowLaptop(false)}
                className="cursor-pointer border border-slate-700 bg-slate-900 px-2 py-0.5 text-[9px] hover:bg-slate-800"
              >
                [X] CLOSE
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 my-4 border-b border-slate-800 pb-2">
              <button
                onClick={() => setActiveTab('color')}
                className={`cursor-pointer border px-3 py-1 text-[9px] ${
                  activeTab === 'color'
                    ? 'border-sky-500 bg-sky-950 text-sky-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}
              >
                COLOR
              </button>
              <button
                onClick={() => setActiveTab('game')}
                className={`cursor-pointer border px-3 py-1 text-[9px] ${
                  activeTab === 'game'
                    ? 'border-sky-500 bg-sky-950 text-sky-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}
              >
                GAME & ROLES
              </button>
              <button
                onClick={() => setActiveTab('timing')}
                className={`cursor-pointer border px-3 py-1 text-[9px] ${
                  activeTab === 'timing'
                    ? 'border-sky-500 bg-sky-950 text-sky-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}
              >
                TIMING & PACING ⏱️
              </button>
            </div>

            {/* TAB 1: SUIT COLOR */}
            {activeTab === 'color' && (
              <div className="space-y-4">
                <span className="text-[9px] text-slate-400">CHOOSE SPACESUIT COLOR:</span>
                <div className="grid grid-cols-4 gap-3">
                  {ALL_COLORS.map((c) => {
                    const col = PLAYER_COLORS[c];
                    const isSelected = currentColor === c;
                    return (
                      <button
                        key={c}
                        onClick={() => {
                          audio.playTaskStep();
                          onUpdateSettings({ playerColor: c });
                        }}
                        className={`cursor-pointer border-2 p-2 flex flex-col items-center gap-1.5 transition ${
                          isSelected
                            ? 'border-sky-400 bg-sky-950 shadow-[0_0_12px_rgba(56,189,248,0.5)]'
                            : 'border-slate-800 bg-slate-900 hover:border-slate-600'
                        }`}
                      >
                        <div
                          style={{ backgroundColor: col.hex }}
                          className="h-7 w-7 rounded-full border border-black shadow"
                        />
                        <span className="text-[8px] uppercase">{col.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: GAME ROLES */}
            {activeTab === 'game' && (
              <div className="space-y-5">
                <div>
                  <span className="text-[9px] text-slate-400">PREFERRED ROLE:</span>
                  <div className="flex gap-2 mt-2">
                    {[
                      { id: 'random', label: '🎲 RANDOM' },
                      { id: 'crewmate', label: '🛡️ CREWMATE' },
                      { id: 'impostor', label: '🗡️ IMPOSTOR' },
                    ].map((role) => (
                      <button
                        key={role.id}
                        onClick={() => {
                          audio.playTaskStep();
                          onUpdateSettings({ preferredRole: role.id as GameSettings['preferredRole'] });
                        }}
                        className={`cursor-pointer border-2 px-3 py-2 flex-1 text-[9px] transition ${
                          settings.preferredRole === role.id
                            ? role.id === 'impostor'
                              ? 'border-red-500 bg-red-950 text-red-300'
                              : 'border-sky-500 bg-sky-950 text-sky-300'
                            : 'border-slate-800 bg-slate-900 text-slate-400'
                        }`}
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4">
                  <span className="text-[9px] text-slate-400">IMPOSTORS IN MATCH:</span>
                  <div className="flex gap-3 mt-2">
                    {[1, 2].map((num) => (
                      <button
                        key={num}
                        onClick={() => {
                          audio.playTaskStep();
                          onUpdateSettings({ impostorCount: num as 1 | 2 });
                        }}
                        className={`cursor-pointer border-2 px-4 py-2 flex-1 text-[9px] ${
                          settings.impostorCount === num
                            ? 'border-amber-500 bg-amber-950 text-amber-300'
                            : 'border-slate-800 bg-slate-900 text-slate-400'
                        }`}
                      >
                        {num} IMPOSTOR{num > 1 ? 'S' : ''} (9 CREW)
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TIMING & PACING (USER REQUEST: "make timing incress") */}
            {activeTab === 'timing' && (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-400">TIMING PRESETS:</span>
                    <span className="text-[8px] text-amber-400">CUSTOMIZABLE PACING</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      {
                        id: 'standard',
                        label: 'BALANCED',
                        sabotage: 60,
                        meeting: 45,
                        killCd: 25,
                        desc: '60s Sabo · 45s Vote',
                      },
                      {
                        id: 'extended',
                        label: 'EXTENDED (RELAXED)',
                        sabotage: 75,
                        meeting: 60,
                        killCd: 35,
                        desc: '75s Sabo · 60s Vote',
                      },
                      {
                        id: 'blitz',
                        label: 'FAST / BLITZ',
                        sabotage: 35,
                        meeting: 30,
                        killCd: 15,
                        desc: '35s Sabo · 30s Vote',
                      },
                    ].map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          audio.playTaskStep();
                          onUpdateSettings({
                            timingPreset: preset.id as GameSettings['timingPreset'],
                            sabotageTimerMax: preset.sabotage,
                            meetingTimerMax: preset.meeting,
                            killCooldownMax: preset.killCd,
                          });
                        }}
                        className={`cursor-pointer border-2 p-2 text-left transition ${
                          settings.timingPreset === preset.id
                            ? 'border-emerald-500 bg-emerald-950/80 text-emerald-200'
                            : 'border-slate-800 bg-slate-900 text-slate-400'
                        }`}
                      >
                        <div className="text-[8px] font-bold">{preset.label}</div>
                        <div className="text-[7px] text-slate-400 mt-1">{preset.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Granular Timing Adjusters */}
                <div className="border-t border-slate-800 pt-3 space-y-3">
                  {/* Sabotage Timer */}
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] text-slate-300">
                      CRITICAL SABOTAGE TIMER (REACTOR/O2):
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          audio.playTaskStep();
                          onUpdateSettings({
                            sabotageTimerMax: Math.max(30, settings.sabotageTimerMax - 10),
                          });
                        }}
                        className="border border-slate-700 bg-slate-900 px-2 text-[9px] hover:bg-slate-800"
                      >
                        -
                      </button>
                      <span className="text-[9px] text-amber-400 font-bold w-12 text-center">
                        {settings.sabotageTimerMax}s
                      </span>
                      <button
                        onClick={() => {
                          audio.playTaskStep();
                          onUpdateSettings({
                            sabotageTimerMax: Math.min(90, settings.sabotageTimerMax + 10),
                          });
                        }}
                        className="border border-slate-700 bg-slate-900 px-2 text-[9px] hover:bg-slate-800"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Meeting Discussion Timer */}
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] text-slate-300">
                      EMERGENCY MEETING DISCUSSION & VOTE:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          audio.playTaskStep();
                          onUpdateSettings({
                            meetingTimerMax: Math.max(25, settings.meetingTimerMax - 10),
                          });
                        }}
                        className="border border-slate-700 bg-slate-900 px-2 text-[9px] hover:bg-slate-800"
                      >
                        -
                      </button>
                      <span className="text-[9px] text-sky-400 font-bold w-12 text-center">
                        {settings.meetingTimerMax}s
                      </span>
                      <button
                        onClick={() => {
                          audio.playTaskStep();
                          onUpdateSettings({
                            meetingTimerMax: Math.min(90, settings.meetingTimerMax + 10),
                          });
                        }}
                        className="border border-slate-700 bg-slate-900 px-2 text-[9px] hover:bg-slate-800"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Kill Cooldown */}
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] text-slate-300">IMPOSTOR KILL COOLDOWN:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          audio.playTaskStep();
                          onUpdateSettings({
                            killCooldownMax: Math.max(10, settings.killCooldownMax - 5),
                          });
                        }}
                        className="border border-slate-700 bg-slate-900 px-2 text-[9px] hover:bg-slate-800"
                      >
                        -
                      </button>
                      <span className="text-[9px] text-red-400 font-bold w-12 text-center">
                        {settings.killCooldownMax}s
                      </span>
                      <button
                        onClick={() => {
                          audio.playTaskStep();
                          onUpdateSettings({
                            killCooldownMax: Math.min(60, settings.killCooldownMax + 5),
                          });
                        }}
                        className="border border-slate-700 bg-slate-900 px-2 text-[9px] hover:bg-slate-800"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Bottom CTA */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowLaptop(false)}
                className="cursor-pointer border border-emerald-500 bg-emerald-700 px-4 py-1.5 text-[9px] font-pixel text-white hover:bg-emerald-600 shadow"
              >
                CONFIRM SETTINGS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
