import React from 'react';
import { type GameState, PATIENCE_LAPS } from '../game/rules.ts';
import { COLOR_CONFIGS } from '../game/types.ts';

interface TopBarProps {
  gameState: GameState;
  levelName: string;
  coins: number;
  colorAssist: boolean;
  onToggleColorAssist: () => void;
  onPause: () => void;
  onHome: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  gameState,
  levelName,
  coins,
  colorAssist,
  onToggleColorAssist,
  onPause,
  onHome,
}) => {
  return (
    <header className="w-full flex items-center justify-between py-2 px-3 select-none">
      {/* Home Button */}
      <button
        onClick={onHome}
        className="w-10 h-10 rounded-2xl bg-emerald-800/80 hover:bg-emerald-700/80 active:scale-95 border-2 border-emerald-600/60 shadow flex items-center justify-center transition-all cursor-pointer"
        title="Return to Level Selection"
      >
        <img src="/embedded/bloom-loop/assets/aistudio/icon_home_0a3b95fa.webp" alt="Home" className="w-5 h-5 object-contain" />
      </button>

      {/* Level Name / Indicator Lockup */}
      <div className="flex items-center gap-2 bg-emerald-950/85 border border-emerald-600/40 px-3.5 py-1.5 rounded-full shadow-inner">
        <img
          src="/embedded/bloom-loop/assets/aistudio/Forest-green_current_level_icon-6_d2e8aac7.webp"
          alt="Current Level"
          className="w-5 h-5 object-contain"
        />
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
            Level {gameState.levelId}
          </span>
          <span className="text-sm font-bold text-amber-100 leading-tight">
            {levelName}
          </span>
        </div>
      </div>

      {/* Coins & Score */}
      <div className="flex items-center gap-1.5 bg-amber-950/75 border border-amber-600/40 px-2.5 py-1 rounded-full shadow">
        <img
          src="/embedded/bloom-loop/assets/aistudio/Green_and_honey-gold_garden_coin-8_e82d5f60.webp"
          alt="Coins"
          className="w-5 h-5 object-contain"
        />
        <span className="text-xs font-bold text-amber-200">{coins}</span>
        <span className="text-[10px] text-amber-400/80 font-medium ml-1">
          pts: {gameState.score}
        </span>
        {gameState.combo >= 3 && (
          <span className="text-[10px] font-black text-amber-950 bg-amber-300 rounded-full px-1.5 ml-0.5">
            x{gameState.combo}
          </span>
        )}
      </div>

      {/* Color Assist Quick Toggle */}
      <button
        onClick={onToggleColorAssist}
        className={`w-10 h-10 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-center shadow ${
          colorAssist
            ? 'bg-amber-500/90 border-amber-300 shadow-amber-500/30'
            : 'bg-emerald-900/60 border-emerald-600/40'
        }`}
        title="Toggle Color-Assist Symbols"
      >
        <img
          src="/embedded/bloom-loop/assets/aistudio/icon_colour_assist_2696d1b7.webp"
          alt="Color Assist"
          className="w-5 h-5 object-contain"
        />
      </button>

      {/* Pause Button */}
      <button
        onClick={onPause}
        className="w-10 h-10 rounded-2xl bg-emerald-800/80 hover:bg-emerald-700/80 active:scale-95 border-2 border-emerald-600/60 shadow flex items-center justify-center transition-all cursor-pointer"
        title="Pause Game"
      >
        <img src="/embedded/bloom-loop/assets/aistudio/icon_pause_d2da116d.webp" alt="Pause" className="w-5 h-5 object-contain" />
      </button>
    </header>
  );
};

interface BottomControlsProps {
  gameState: GameState;
  boosters: {
    shuffle: number;
    pollenBurst: number;
    extraDock: number;
  };
  colorAssist: boolean;
  onDispatchBee: (dockIndex: number) => void;
  onBoosterShuffle: () => void;
  onBoosterPollenBurst: () => void;
  onBoosterExtraDock: () => void;
}

export const BottomControls: React.FC<BottomControlsProps> = ({
  gameState,
  boosters,
  colorAssist,
  onDispatchBee,
  onBoosterShuffle,
  onBoosterPollenBurst,
  onBoosterExtraDock,
}) => {
  const { dockBees, maxDocks, unspawnedQueue, loopBees, maxLoopCapacity } = gameState;
  const isLoopFull = loopBees.length >= maxLoopCapacity;
  const beeGettingBored = loopBees.some(b => b.idleProgress >= PATIENCE_LAPS * 0.5);
  const canAddDock = boosters.extraDock > 0 && maxDocks < 6 && unspawnedQueue.length > 0;

  return (
    <footer className="w-full flex flex-col justify-end px-3 pb-3 select-none">
      {/* Loop Capacity Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-emerald-950/70 rounded-xl border border-emerald-700/30 text-xs text-emerald-200 mb-1.5 backdrop-blur-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-emerald-400 font-semibold">Vine Loop:</span>
          <span>{loopBees.length}/{maxLoopCapacity} Bees</span>
        </div>
        {beeGettingBored ? (
          <span className="text-rose-300 font-semibold text-[11px] animate-pulse">
            A bee can't reach its flowers!
          </span>
        ) : isLoopFull ? (
          <span className="text-amber-400 font-medium text-[11px] animate-pulse">
            Loop full! Wait for bee to finish
          </span>
        ) : (
          <span className="text-emerald-300 text-[11px]">
            Tap bee in dock to launch!
          </span>
        )}
      </div>

      {/* Dock Honeycomb / Leaf Pads Area */}
      <div className="relative p-2 rounded-2xl bg-emerald-950/85 border-2 border-emerald-700/50 shadow-xl backdrop-blur-xs">
        {/* Warning banner if all docks occupied and loop full */}
        {dockBees.length >= maxDocks && isLoopFull && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-600/90 text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow flex items-center gap-1 border border-rose-300 animate-bounce z-20">
            <img src="/embedded/bloom-loop/assets/aistudio/Rounded_forest-green_warning_icon-4_366e2baa.webp" alt="!" className="w-3.5 h-3.5 object-contain invert" />
            <span>DOCKS FULL</span>
          </div>
        )}

        {/* Docks Container */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          {Array.from({ length: maxDocks }).map((_, idx) => {
            const bee = dockBees[idx];
            if (!bee) {
              return (
                <div
                  key={`dock_slot_${idx}`}
                  className="w-13 h-15 sm:w-15 sm:h-17 rounded-xl border-2 border-dashed border-emerald-600/30 bg-emerald-900/30 flex items-center justify-center relative opacity-60"
                >
                  <img
                    src="/embedded/bloom-loop/assets/aistudio/honeycomb_dock_empty_8bc3b152.webp"
                    alt="Empty Dock"
                    className="w-7 h-7 object-contain opacity-40"
                  />
                </div>
              );
            }

            const config = COLOR_CONFIGS[bee.color];
            const canLaunch = !isLoopFull;

            return (
              <button
                key={bee.id}
                onClick={() => onDispatchBee(idx)}
                disabled={!canLaunch}
                aria-label={`Launch ${config.name} bee with ${bee.currentAmmo} pollen`}
                className={`group relative w-13 h-15 sm:w-15 sm:h-17 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                  canLaunch
                    ? 'active:scale-90 hover:-translate-y-1'
                    : 'opacity-50 cursor-not-allowed'
                }`}
                style={{
                  backgroundImage: `url('/embedded/bloom-loop/assets/aistudio/queue_leaf_pad_b11d9743.webp')`,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                }}
              >
                {/* Contact shadow */}
                <img
                  src="/embedded/bloom-loop/assets/aistudio/soft_contact_shadow_5cab107b.webp"
                  alt="Shadow"
                  className="absolute -bottom-1 w-10 h-2 opacity-50"
                />

                {/* Bee Drone Model */}
                <div className="relative w-9 h-9 flex items-center justify-center">
                  {/* Flapping Wings */}
                  <img
                    src="/embedded/bloom-loop/assets/aistudio/bee_wing_f6363491.webp"
                    alt="Wing"
                    className="absolute -left-1.5 -top-1 w-4 h-4 object-contain animate-wing-left"
                  />
                  <img
                    src="/embedded/bloom-loop/assets/aistudio/bee_wing_f6363491.webp"
                    alt="Wing"
                    className="absolute -right-1.5 -top-1 w-4 h-4 object-contain animate-wing-right scale-x-[-1]"
                  />

                  {/* Body */}
                  <img
                    src={config.beeAsset}
                    alt={config.name}
                    className="relative z-10 w-9 h-9 object-contain drop-shadow"
                  />

                  {/* Ammo Count Badge */}
                  <div
                    className="absolute z-20 -bottom-1.5 -right-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-amber-950 rounded-full shadow"
                    style={{
                      backgroundImage: `url('/embedded/bloom-loop/assets/aistudio/ammo_badge_blank_76bd93ca.webp')`,
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                    }}
                  >
                    {bee.currentAmmo}
                  </div>
                </div>

                {/* Color Assist Symbol Badge */}
                {colorAssist && (
                  <div className="absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white/90 rounded-full p-0.5 shadow-sm">
                    <img
                      src={config.symbolAsset}
                      alt={config.symbolName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Upcoming Bees Queue Preview */}
        {unspawnedQueue.length > 0 && (
          <div className="mt-2 pt-1.5 border-t border-emerald-800/40 flex items-center justify-between text-[11px] text-emerald-300/80 px-2">
            <span>Upcoming Bees ({unspawnedQueue.length}):</span>
            <div className="flex items-center gap-1.5">
              {unspawnedQueue.slice(0, 4).map((item, i) => {
                const conf = COLOR_CONFIGS[item.color];
                return (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full flex items-center justify-center border border-white/20 shadow-sm relative"
                    style={{ backgroundColor: conf.hex }}
                    title={`${conf.name} (ammo: ${item.ammo})`}
                  >
                    <span className="text-[9px] font-bold text-black/80">{item.ammo}</span>
                  </div>
                );
              })}
              {unspawnedQueue.length > 4 && <span>+{unspawnedQueue.length - 4}</span>}
            </div>
          </div>
        )}
      </div>

      {/* Boosters Action Bar */}
      <div className="flex items-center justify-around pt-2 px-1 gap-2">
        {/* Shuffle Booster */}
        <button
          onClick={onBoosterShuffle}
          disabled={boosters.shuffle <= 0}
          className={`flex-1 py-1.5 px-2 rounded-2xl border-2 flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer clay-button ${
            boosters.shuffle > 0
              ? 'bg-gradient-to-b from-emerald-700 to-emerald-900 border-emerald-500 text-emerald-100 hover:brightness-110 active:scale-95'
              : 'bg-emerald-950/40 border-emerald-800/30 text-emerald-600/50 cursor-not-allowed'
          }`}
          title="Shuffle upcoming bee docks"
        >
          <img
            src="/embedded/bloom-loop/assets/aistudio/Forest-green_and_cream_shuffle_icon-1_32aa8394.webp"
            alt="Shuffle"
            className="w-6 h-6 object-contain"
          />
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-bold leading-tight">Shuffle</span>
            <span className="text-[9px] text-emerald-300">x{boosters.shuffle}</span>
          </div>
        </button>

        {/* Pollen Burst Booster */}
        <button
          onClick={onBoosterPollenBurst}
          disabled={boosters.pollenBurst <= 0}
          className={`flex-1 py-1.5 px-2 rounded-2xl border-2 flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer clay-button ${
            boosters.pollenBurst > 0
              ? 'bg-gradient-to-b from-amber-600 to-amber-800 border-amber-400 text-amber-100 hover:brightness-110 active:scale-95'
              : 'bg-emerald-950/40 border-emerald-800/30 text-emerald-600/50 cursor-not-allowed'
          }`}
          title="Instant 4-flower Pollen Burst"
        >
          <img
            src="/embedded/bloom-loop/assets/aistudio/Forest-green_pollen_burst_icon-2_9756d908.webp"
            alt="Pollen Burst"
            className="w-6 h-6 object-contain"
          />
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-bold leading-tight">Burst</span>
            <span className="text-[9px] text-amber-200">x{boosters.pollenBurst}</span>
          </div>
        </button>

        {/* Extra Dock Booster */}
        <button
          onClick={onBoosterExtraDock}
          disabled={!canAddDock}
          className={`flex-1 py-1.5 px-2 rounded-2xl border-2 flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer clay-button ${
            canAddDock
              ? 'bg-gradient-to-b from-teal-700 to-teal-900 border-teal-400 text-teal-100 hover:brightness-110 active:scale-95'
              : 'bg-emerald-950/40 border-emerald-800/30 text-emerald-600/50 cursor-not-allowed'
          }`}
          title="Unlock +1 Extra Dock (brings the next queued bee in now)"
        >
          <img
            src="/embedded/bloom-loop/assets/aistudio/Forest-green_cream_extra_dock_icon-3_ebd9cf50.webp"
            alt="Extra Dock"
            className="w-6 h-6 object-contain"
          />
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-bold leading-tight">+1 Dock</span>
            <span className="text-[9px] text-teal-200">
              {maxDocks >= 6 ? 'MAX' : `x${boosters.extraDock}`}
            </span>
          </div>
        </button>
      </div>
    </footer>
  );
};

