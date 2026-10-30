import React from 'react';
import { GameSettings, COLOR_CONFIGS } from '../game/types.ts';

// 1. Victory Modal
interface VictoryModalProps {
  levelId: number;
  score: number;
  stars: number;
  coinsEarned: number;
  hasNextLevel: boolean;
  onNextLevel: () => void;
  onRestart: () => void;
  onHome: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  levelId,
  score,
  stars,
  coinsEarned,
  hasNextLevel,
  onNextLevel,
  onRestart,
  onHome,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-[420px] bg-gradient-to-b from-emerald-900 via-emerald-950 to-emerald-950 border-4 border-amber-400 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Background Reward Rays */}
        <div className="absolute top-6 w-60 h-60 pointer-events-none opacity-40">
          <img
            src="/embedded/bloom-loop/assets/aistudio/reward_rays_f7195233.png"
            alt="Rays"
            className="w-full h-full object-contain animate-spin-slow"
          />
        </div>

        {/* Golden Garden Trophy */}
        <div className="relative z-10 w-28 h-28 my-2 drop-shadow-xl animate-bounce">
          <img
            src="/embedded/bloom-loop/assets/aistudio/Green_and_gold_garden_trophy-12_75812819.png"
            alt="Trophy"
            className="w-full h-full object-contain"
          />
        </div>

        <h2 className="relative z-10 text-2xl font-black text-amber-200 tracking-wider">
          GARDEN BLOOMED!
        </h2>
        <p className="text-emerald-300 text-xs font-semibold mb-3">Level {levelId} Cleared</p>

        {/* 3 Stars display */}
        <div className="relative z-10 flex items-center gap-3 my-2">
          {[1, 2, 3].map((starIdx) => (
            <div
              key={starIdx}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl font-black shadow-md border-2 transition-transform ${
                starIdx <= stars
                  ? 'bg-amber-400 border-amber-200 text-amber-950 scale-110'
                  : 'bg-emerald-900/60 border-emerald-700/50 text-emerald-800'
              }`}
            >
              ★
            </div>
          ))}
        </div>

        {/* Score & Coins Earned */}
        <div className="relative z-10 w-full bg-emerald-900/60 border border-emerald-600/40 rounded-2xl p-3 my-3 flex items-center justify-around">
          <div className="flex flex-col">
            <span className="text-[10px] text-emerald-300 uppercase font-semibold">Score</span>
            <span className="text-lg font-black text-amber-100">{score}</span>
          </div>
          <div className="h-8 w-px bg-emerald-700/40" />
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-emerald-300 uppercase font-semibold">Coins</span>
            <div className="flex items-center gap-1">
              <img
                src="/embedded/bloom-loop/assets/aistudio/Green_and_honey-gold_garden_coin-8_e82d5f60.png"
                alt="Coin"
                className="w-5 h-5 object-contain"
              />
              <span className="text-lg font-black text-amber-300">+{coinsEarned}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 w-full flex items-center gap-3 mt-2">
          <button
            onClick={onHome}
            className="flex-1 py-3 px-3 rounded-2xl bg-emerald-800 hover:bg-emerald-700 border-2 border-emerald-600 shadow-md flex items-center justify-center cursor-pointer active:scale-95 transition-all"
            title="Level Select"
          >
            <img src="/embedded/bloom-loop/assets/aistudio/icon_home_0a3b95fa.png" alt="Home" className="w-6 h-6 object-contain" />
          </button>
          <button
            onClick={onRestart}
            className="flex-1 py-3 px-3 rounded-2xl bg-emerald-800 hover:bg-emerald-700 border-2 border-emerald-600 shadow-md flex items-center justify-center cursor-pointer active:scale-95 transition-all"
            title="Replay Level"
          >
            <img src="/embedded/bloom-loop/assets/aistudio/icon_restart_3949cd50.png" alt="Replay" className="w-6 h-6 object-contain" />
          </button>
          {hasNextLevel && (
            <button
              onClick={onNextLevel}
              className="flex-[2] py-3.5 px-4 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-600 border-2 border-amber-200 text-amber-950 font-black text-base shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all clay-button"
            >
              <span>NEXT</span>
              <img src="/embedded/bloom-loop/assets/aistudio/icon_next_40fd9586.png" alt="Next" className="w-5 h-5 object-contain" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// 2. Game Over Modal
interface GameOverModalProps {
  levelId: number;
  onRestart: () => void;
  onHome: () => void;
  onBoosterHelp?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  levelId,
  onRestart,
  onHome,
  onBoosterHelp,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
      <div className="relative w-full max-w-[400px] bg-gradient-to-b from-emerald-950 via-slate-900 to-emerald-950 border-4 border-rose-500/80 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Mascot Mildly Disappointed Bee */}
        <div className="w-28 h-28 my-2 drop-shadow-lg">
          <img
            src="/embedded/bloom-loop/assets/aistudio/Mildly_disappointed_clay_garden_bee-18_7e759976.png"
            alt="Disappointed Bee"
            className="w-full h-full object-contain"
          />
        </div>

        <h2 className="text-2xl font-black text-rose-300 tracking-wider">OUT OF MOVES</h2>
        <p className="text-emerald-300 text-xs mt-1 mb-3">
          The docks filled before all flower tiles bloomed.
        </p>

        {/* Tip Box */}
        <div className="w-full bg-emerald-900/40 border border-emerald-700/40 rounded-2xl p-3 my-2 text-left text-xs text-emerald-200">
          <p className="font-bold text-amber-300 mb-1">Gardener's Hint:</p>
          <p>
            Launch bees only when matching outer petals are reachable, or use the <strong>Shuffle</strong> and <strong>+1 Dock</strong> boosters to create room!
          </p>
        </div>

        {/* Buttons */}
        <div className="w-full flex items-center gap-3 mt-3">
          <button
            onClick={onHome}
            className="flex-1 py-3 px-3 rounded-2xl bg-emerald-800 hover:bg-emerald-700 border-2 border-emerald-600 shadow-md flex items-center justify-center cursor-pointer active:scale-95 transition-all"
            title="Level Select"
          >
            <img src="/embedded/bloom-loop/assets/aistudio/icon_home_0a3b95fa.png" alt="Home" className="w-6 h-6 object-contain" />
          </button>
          <button
            onClick={onRestart}
            className="flex-[2] py-3.5 px-4 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-600 border-2 border-amber-200 text-amber-950 font-black text-base shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all clay-button"
          >
            <img src="/embedded/bloom-loop/assets/aistudio/icon_restart_3949cd50.png" alt="Retry" className="w-5 h-5 object-contain" />
            <span>TRY AGAIN</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// 3. Pause & Settings Modal
interface PauseSettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
}

export const PauseSettingsModal: React.FC<PauseSettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onResume,
  onRestart,
  onHome,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="relative w-full max-w-[420px] bg-gradient-to-b from-emerald-900 via-emerald-950 to-emerald-950 border-4 border-amber-400/80 rounded-3xl p-6 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-700/50">
          <h2 className="text-xl font-black text-amber-200 tracking-wider">GAME SETTINGS</h2>
          <button
            onClick={onResume}
            className="w-9 h-9 rounded-xl bg-emerald-800 border border-emerald-600 flex items-center justify-center hover:bg-emerald-700 active:scale-95 cursor-pointer shadow"
          >
            <img src="/embedded/bloom-loop/assets/aistudio/icon_close_abb4d17d.png" alt="Close" className="w-4 h-4 object-contain" />
          </button>
        </div>

        {/* Toggles List */}
        <div className="flex flex-col gap-3 py-4">
          {/* Sound FX */}
          <div className="flex items-center justify-between bg-emerald-900/50 p-3 rounded-2xl border border-emerald-700/30">
            <div className="flex items-center gap-3">
              <img src="/embedded/bloom-loop/assets/aistudio/icon_sound_336d9462.png" alt="Sound" className="w-6 h-6 object-contain" />
              <span className="text-sm font-bold text-emerald-100">Sound Effects</span>
            </div>
            <button
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${
                settings.soundEnabled ? 'bg-amber-400' : 'bg-emerald-950 border border-emerald-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Garden Music */}
          <div className="flex items-center justify-between bg-emerald-900/50 p-3 rounded-2xl border border-emerald-700/30">
            <div className="flex items-center gap-3">
              <img src="/embedded/bloom-loop/assets/aistudio/icon_music_fb46e5ab.png" alt="Music" className="w-6 h-6 object-contain" />
              <span className="text-sm font-bold text-emerald-100">Garden Music</span>
            </div>
            <button
              onClick={() => onUpdateSettings({ musicEnabled: !settings.musicEnabled })}
              className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${
                settings.musicEnabled ? 'bg-amber-400' : 'bg-emerald-950 border border-emerald-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.musicEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Color-Assist Accessibility */}
          <div className="flex items-center justify-between bg-emerald-900/50 p-3 rounded-2xl border border-emerald-700/30">
            <div className="flex items-center gap-3">
              <img
                src="/embedded/bloom-loop/assets/aistudio/icon_colour_assist_2696d1b7.png"
                alt="Color Assist"
                className="w-6 h-6 object-contain"
              />
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold text-emerald-100">Color Assist</span>
                <span className="text-[10px] text-emerald-300">Show geometric symbol badges</span>
              </div>
            </div>
            <button
              onClick={() => onUpdateSettings({ colorAssist: !settings.colorAssist })}
              className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${
                settings.colorAssist ? 'bg-amber-400' : 'bg-emerald-950 border border-emerald-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.colorAssist ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between bg-emerald-900/50 p-3 rounded-2xl border border-emerald-700/30">
            <div className="flex items-center gap-3">
              <img
                src="/embedded/bloom-loop/assets/aistudio/icon_reduced_motion_08eafc7c.png"
                alt="Reduced Motion"
                className="w-6 h-6 object-contain"
              />
              <span className="text-sm font-bold text-emerald-100">Reduced Motion</span>
            </div>
            <button
              onClick={() => onUpdateSettings({ reducedMotion: !settings.reducedMotion })}
              className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${
                settings.reducedMotion ? 'bg-amber-400' : 'bg-emerald-950 border border-emerald-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.reducedMotion ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onRestart}
            className="flex-1 py-3 px-3 rounded-2xl bg-emerald-800 hover:bg-emerald-700 border-2 border-emerald-600 text-xs font-bold text-emerald-100 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow"
          >
            <img src="/embedded/bloom-loop/assets/aistudio/icon_restart_3949cd50.png" alt="Restart" className="w-4 h-4 object-contain" />
            <span>Restart</span>
          </button>
          <button
            onClick={onHome}
            className="flex-1 py-3 px-3 rounded-2xl bg-emerald-800 hover:bg-emerald-700 border-2 border-emerald-600 text-xs font-bold text-emerald-100 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow"
          >
            <img src="/embedded/bloom-loop/assets/aistudio/icon_home_0a3b95fa.png" alt="Map" className="w-4 h-4 object-contain" />
            <span>Map</span>
          </button>
          <button
            onClick={onResume}
            className="flex-[1.5] py-3 px-4 rounded-2xl bg-amber-400 hover:bg-amber-500 border-2 border-amber-200 text-amber-950 font-black text-sm flex items-center justify-center cursor-pointer active:scale-95 shadow-md"
          >
            RESUME
          </button>
        </div>
      </div>
    </div>
  );
};

// 4. Botanical Collection Modal
interface BotanicalCollectionModalProps {
  onClose: () => void;
}

export const BotanicalCollectionModal: React.FC<BotanicalCollectionModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
      <div className="relative w-full max-w-[460px] bg-gradient-to-b from-emerald-900 via-emerald-950 to-emerald-950 border-4 border-amber-400/80 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-700/50">
          <div className="flex items-center gap-2">
            <img
              src="/embedded/bloom-loop/assets/aistudio/Green_and_gold_garden_collection-13_230c3510.png"
              alt="Botanical Collection"
              className="w-7 h-7 object-contain"
            />
            <h2 className="text-xl font-black text-amber-200">Botanical Album</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-emerald-800 border border-emerald-600 flex items-center justify-center hover:bg-emerald-700 active:scale-95 cursor-pointer shadow"
          >
            <img src="/embedded/bloom-loop/assets/aistudio/icon_close_abb4d17d.png" alt="Close" className="w-4 h-4 object-contain" />
          </button>
        </div>

        {/* 6 Garden Varieties */}
        <div className="overflow-y-auto py-3 grid grid-cols-2 gap-3 pr-1">
          {Object.values(COLOR_CONFIGS).map((color) => (
            <div
              key={color.id}
              className="p-3 rounded-2xl bg-emerald-900/40 border border-emerald-600/40 flex flex-col items-center text-center shadow"
            >
              <div className="relative w-14 h-14 flex items-center justify-center my-1">
                <img
                  src={color.flowerAsset}
                  alt={color.name}
                  className="w-full h-full object-contain drop-shadow"
                />
              </div>
              <span className="text-xs font-black text-amber-200 mt-1">{color.name}</span>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-300">
                <img src={color.symbolAsset} alt={color.symbolName} className="w-3.5 h-3.5 object-contain" />
                <span>{color.symbolName}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 5. Interactive Tutorial Overlay
interface TutorialOverlayProps {
  onDismiss: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onDismiss }) => {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-xs p-4 pointer-events-auto select-none">
      <div className="relative w-full max-w-[420px] bg-gradient-to-b from-emerald-900 to-emerald-950 border-3 border-amber-300 rounded-3xl p-5 shadow-2xl mb-24 flex flex-col items-center text-center">
        {/* Tutorial Hand pointing icon */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-16 animate-bounce">
          <img
            src="/embedded/bloom-loop/assets/aistudio/tutorial_hand_df5105ae.png"
            alt="Hand"
            className="w-full h-full object-contain drop-shadow-xl"
          />
        </div>

        <h3 className="text-lg font-black text-amber-200 mt-2 mb-1">HOW TO PLAY</h3>
        <p className="text-xs text-emerald-100 leading-relaxed mb-3">
          1. Tap a bee on the bottom dock to send it onto the vine loop.<br />
          2. As the bee cruises around, it fires pollen at outer matching flowers!<br />
          3. Clear all flowers before running out of dock space!
        </p>

        <button
          onClick={onDismiss}
          className="w-full py-2.5 px-4 rounded-2xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-sm shadow-md cursor-pointer active:scale-95"
        >
          GOT IT! LET'S BLOOM
        </button>
      </div>
    </div>
  );
};
