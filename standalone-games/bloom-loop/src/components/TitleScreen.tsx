import React, { useState } from 'react';
import { LEVELS } from '../game/levels.ts';

interface TitleScreenProps {
  highScores: Record<number, number>;
  starsEarned: Record<number, number>;
  coins: number;
  unlockedLevel: number;
  onSelectLevel: (levelId: number) => void;
  onOpenSettings: () => void;
  onOpenCollection: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  highScores,
  starsEarned,
  coins,
  unlockedLevel,
  onSelectLevel,
  onOpenSettings,
  onOpenCollection,
}) => {
  const [showLevelSelect, setShowLevelSelect] = useState(false);

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 overflow-hidden select-none">
      {/* Garden Background Artwork */}
      <img
        src="/embedded/bloom-loop/assets/aistudio/home_garden_background_fbb32a87.webp"
        alt="Garden Background"
        className="absolute inset-0 w-full h-full object-cover filter brightness-95"
      />

      {/* Atmospheric Soft Light Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none" />

      {/* Floating Sparkles & Soft Petals */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src="/embedded/bloom-loop/assets/aistudio/petal_particle_99a497f6.webp"
          alt="Petal"
          className="absolute top-1/4 left-8 w-6 h-6 object-contain opacity-70 animate-bounce"
          style={{ animationDuration: '4s' }}
        />
        <img
          src="/embedded/bloom-loop/assets/aistudio/petal_particle_99a497f6.webp"
          alt="Petal"
          className="absolute top-1/3 right-10 w-7 h-7 object-contain opacity-60 animate-bounce"
          style={{ animationDuration: '5.5s' }}
        />
        <img
          src="/embedded/bloom-loop/assets/aistudio/sparkle_particle_e3f5d547.webp"
          alt="Sparkle"
          className="absolute bottom-1/3 left-14 w-8 h-8 object-contain opacity-75 animate-pulse"
        />
      </div>

      {/* Top Header Status */}
      <div className="relative z-10 w-full max-w-[480px] flex items-center justify-between">
        {/* Coins Badge */}
        <div className="flex items-center gap-2 bg-emerald-950/80 border-2 border-emerald-600/50 px-3 py-1.5 rounded-full shadow-lg">
          <img
            src="/embedded/bloom-loop/assets/aistudio/Green_and_honey-gold_garden_coin-8_e82d5f60.webp"
            alt="Coins"
            className="w-6 h-6 object-contain"
          />
          <span className="text-sm font-bold text-amber-200">{coins}</span>
        </div>

        {/* Action Buttons: Collection & Settings */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenCollection}
            className="w-11 h-11 rounded-2xl bg-emerald-800/80 hover:bg-emerald-700/80 active:scale-95 border-2 border-emerald-500/60 shadow-lg flex items-center justify-center transition-all cursor-pointer"
            title="Garden Botanical Collection"
          >
            <img
              src="/embedded/bloom-loop/assets/aistudio/Green_and_gold_garden_collection-13_230c3510.webp"
              alt="Collection"
              className="w-6 h-6 object-contain"
            />
          </button>
          <button
            onClick={onOpenSettings}
            className="w-11 h-11 rounded-2xl bg-emerald-800/80 hover:bg-emerald-700/80 active:scale-95 border-2 border-emerald-500/60 shadow-lg flex items-center justify-center transition-all cursor-pointer"
            title="Settings"
          >
            <img
              src="/embedded/bloom-loop/assets/aistudio/icon_settings_094b12ff.webp"
              alt="Settings"
              className="w-6 h-6 object-contain"
            />
          </button>
        </div>
      </div>

      {/* Main Center Stage: Emblem & Mascot */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto max-w-[480px] text-center">
        {/* Game Title Emblem */}
        <div className="relative w-64 sm:w-72 drop-shadow-2xl mb-2">
          <img
            src="/embedded/bloom-loop/assets/aistudio/bloom_loop_emblem_acc76c33.webp"
            alt="Bloom Loop Logo"
            className="w-full object-contain filter drop-shadow-lg"
          />
        </div>

        <p className="text-xs sm:text-sm font-semibold text-emerald-100/90 tracking-wide bg-emerald-950/70 border border-emerald-600/40 px-4 py-1 rounded-full shadow-md mb-4 backdrop-blur-sm">
          Garden Colour-Flow Puzzle
        </p>

        {/* Mascot Joyful Bee with flower crown */}
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center animate-gentle-bob">
          {/* Subtle spinning glow rays behind bee */}
          <img
            src="/embedded/bloom-loop/assets/aistudio/reward_rays_f7195233.webp"
            alt="Glow Rays"
            className="absolute inset-0 w-full h-full object-contain opacity-40 animate-spin-slow pointer-events-none"
          />
          <img
            src="/embedded/bloom-loop/assets/aistudio/soft_contact_shadow_5cab107b.webp"
            alt="Shadow"
            className="absolute -bottom-2 w-36 h-8 opacity-60"
          />
          <img
            src="/embedded/bloom-loop/assets/aistudio/Joyful_Bee_with_Flower_Crown-19_96543628.webp"
            alt="Joyful Bee Mascot"
            className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
          />
        </div>
      </div>

      {/* Bottom CTA & Level Select trigger */}
      <div className="relative z-10 w-full max-w-[380px] flex flex-col gap-3 pb-2">
        {/* Big Juicy PLAY Button */}
        <button
          onClick={() => onSelectLevel(unlockedLevel)}
          className="w-full py-4 px-6 rounded-3xl bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 border-4 border-amber-200 text-amber-950 font-black text-2xl tracking-wider shadow-2xl flex items-center justify-center gap-3 clay-button active:scale-95 transition-all cursor-pointer"
        >
          <img
            src="/embedded/bloom-loop/assets/aistudio/icon_play_9d8d0cb4.webp"
            alt="Play"
            className="w-8 h-8 object-contain filter drop-shadow"
          />
          <span>PLAY LEVEL {unlockedLevel}</span>
        </button>

        {/* Level Map Button */}
        <button
          onClick={() => setShowLevelSelect(true)}
          className="w-full py-2.5 px-4 rounded-2xl bg-emerald-900/90 hover:bg-emerald-800/90 border-2 border-emerald-500/50 text-emerald-100 font-bold text-sm tracking-wide shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <img
            src="/embedded/bloom-loop/assets/aistudio/Cream_leaf-corner_level_card-22_9835a234.webp"
            alt="Levels"
            className="w-5 h-5 object-contain"
          />
          <span>SELECT LEVEL ({LEVELS.length} Gardens)</span>
        </button>
      </div>

      {/* Level Select Modal / Overlay */}
      {showLevelSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-[480px] bg-gradient-to-b from-emerald-900 via-emerald-950 to-emerald-950 border-4 border-amber-400/80 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-emerald-700/50">
              <div className="flex items-center gap-2">
                <img
                  src="/embedded/bloom-loop/assets/aistudio/Forest-green_level_complete_pictogram-7_5824824f.webp"
                  alt="Trophy"
                  className="w-7 h-7 object-contain"
                />
                <h2 className="text-xl font-black text-amber-100">Garden Levels</h2>
              </div>
              <button
                onClick={() => setShowLevelSelect(false)}
                className="w-9 h-9 rounded-xl bg-emerald-800 border border-emerald-600 flex items-center justify-center hover:bg-emerald-700 active:scale-95 cursor-pointer shadow"
              >
                <img src="/embedded/bloom-loop/assets/aistudio/icon_close_abb4d17d.webp" alt="Close" className="w-4 h-4 object-contain" />
              </button>
            </div>

            {/* Level Cards Grid */}
            <div className="overflow-y-auto py-4 grid grid-cols-2 sm:grid-cols-4 gap-3 pr-1">
              {LEVELS.map((lvl) => {
                const isUnlocked = lvl.id <= unlockedLevel;
                const stars = starsEarned[lvl.id] || 0;
                const bestScore = highScores[lvl.id] || 0;

                return (
                  <button
                    key={lvl.id}
                    disabled={!isUnlocked}
                    onClick={() => {
                      setShowLevelSelect(false);
                      onSelectLevel(lvl.id);
                    }}
                    className={`relative p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                      isUnlocked
                        ? 'bg-gradient-to-b from-emerald-800 to-emerald-950 border-amber-400/60 hover:scale-105 active:scale-95 cursor-pointer shadow-lg'
                        : 'bg-emerald-950/40 border-emerald-900/60 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {isUnlocked ? (
                      <>
                        <span className="text-xs font-black text-amber-300">Level {lvl.id}</span>
                        <span className="text-[11px] font-semibold text-emerald-100 line-clamp-1">
                          {lvl.name}
                        </span>
                        {/* Stars Earned */}
                        <div className="flex items-center gap-0.5 mt-1">
                          {[1, 2, 3].map((starIdx) => (
                            <span
                              key={starIdx}
                              className={`text-xs ${
                                starIdx <= stars ? 'text-amber-400' : 'text-emerald-900'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        {bestScore > 0 && (
                          <span className="text-[9px] text-emerald-400 font-medium">
                            {bestScore} pts
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <img
                          src="/embedded/bloom-loop/assets/aistudio/icon_lock_811ba167.webp"
                          alt="Locked"
                          className="w-6 h-6 object-contain opacity-50"
                        />
                        <span className="text-xs font-bold text-emerald-500/60">Level {lvl.id}</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
