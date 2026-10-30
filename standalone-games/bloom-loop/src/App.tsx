import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GameState,
  createInitialGameState,
  dispatchBeeFromDock,
  stepSimulation,
  boosterShuffle,
  boosterPollenBurst,
  boosterExtraDock,
  calculateStars,
  canRescueWithBurst,
  resumeAfterLoss,
} from './game/rules.ts';
import { LEVELS, chapterForLevel } from './game/levels.ts';
import { COLOR_CONFIGS, type Boosters, type GameSettings } from './game/types.ts';
import { audio } from './game/audio.ts';
import { GameCanvas } from './components/GameCanvas.tsx';
import { TopBar, BottomControls } from './components/HUD.tsx';
import { TitleScreen } from './components/TitleScreen.tsx';
import {
  VictoryModal,
  GameOverModal,
  PauseSettingsModal,
  BotanicalCollectionModal,
  TutorialOverlay,
  ShopModal,
} from './components/Modals.tsx';

const BOOSTER_PRICES: Boosters = { shuffle: 40, pollenBurst: 60, extraDock: 50 };
const DAILY_GIFT_COINS = 50;

const localDay = () => new Date().toLocaleDateString('en-CA');

export default function App() {
  // Persistence state
  const [coins, setCoins] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('bloom_loop_coins') || '150', 10);
    } catch {
      return 150;
    }
  });

  const [unlockedLevel, setUnlockedLevel] = useState<number>(() => {
    try {
      const saved = parseInt(localStorage.getItem('bloom_loop_unlocked') || '1', 10);
      return Math.min(Math.max(saved, 1), LEVELS.length);
    } catch {
      return 1;
    }
  });

  const [starsEarned, setStarsEarned] = useState<Record<number, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem('bloom_loop_stars') || '{}');
    } catch {
      return {};
    }
  });

  const [highScores, setHighScores] = useState<Record<number, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem('bloom_loop_scores') || '{}');
    } catch {
      return {};
    }
  });

  const [boosters, setBoosters] = useState<Boosters>(() => {
    try {
      return JSON.parse(
        localStorage.getItem('bloom_loop_boosters') || '{"shuffle": 3, "pollenBurst": 2, "extraDock": 2}'
      );
    } catch {
      return { shuffle: 3, pollenBurst: 2, extraDock: 2 };
    }
  });

  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      return JSON.parse(
        localStorage.getItem('bloom_loop_settings') ||
          '{"soundEnabled":true,"musicEnabled":true,"hapticsEnabled":true,"colorAssist":false,"reducedMotion":false}'
      );
    } catch {
      return {
        soundEnabled: true,
        musicEnabled: true,
        hapticsEnabled: true,
        colorAssist: false,
        reducedMotion: false,
      };
    }
  });

  const [lastGiftDay, setLastGiftDay] = useState<string>(() => {
    try {
      return localStorage.getItem('bloom_loop_gift_day') || '';
    } catch {
      return '';
    }
  });

  // App screen state
  const [screen, setScreen] = useState<'title' | 'gameplay'>('title');
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState(LEVELS[0]));
  const [runResult, setRunResult] = useState<{ stars: number; coins: number; newBest: boolean } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const runIdRef = useRef(0);
  const rewardedRunRef = useRef(-1);

  // Modal dialog states
  const [showPauseSettings, setShowPauseSettings] = useState<boolean>(false);
  const [showCollection, setShowCollection] = useState<boolean>(false);
  const [showShop, setShowShop] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('bloom_loop_seen_tutorial') !== 'true';
    } catch {
      return true;
    }
  });

  // Keep audio settings in sync
  useEffect(() => {
    audio.soundEnabled = settings.soundEnabled;
    audio.musicEnabled = settings.musicEnabled;
    if (settings.musicEnabled) {
      audio.startGardenMusic();
    } else {
      audio.stopGardenMusic();
    }
  }, [settings.soundEnabled, settings.musicEnabled]);

  // Persist storage helpers
  useEffect(() => {
    try {
      localStorage.setItem('bloom_loop_coins', coins.toString());
      localStorage.setItem('bloom_loop_unlocked', unlockedLevel.toString());
      localStorage.setItem('bloom_loop_stars', JSON.stringify(starsEarned));
      localStorage.setItem('bloom_loop_scores', JSON.stringify(highScores));
      localStorage.setItem('bloom_loop_boosters', JSON.stringify(boosters));
      localStorage.setItem('bloom_loop_settings', JSON.stringify(settings));
      localStorage.setItem('bloom_loop_gift_day', lastGiftDay);
    } catch {
      // ignore
    }
  }, [coins, unlockedLevel, starsEarned, highScores, boosters, settings, lastGiftDay]);

  const currentLevel = LEVELS.find(l => l.id === currentLevelId) || LEVELS[0];
  const chapter = chapterForLevel(currentLevelId);
  const vibrate = useCallback((ms: number) => {
    if (settings.hapticsEnabled && window.navigator?.vibrate) window.navigator.vibrate(ms);
  }, [settings.hapticsEnabled]);

  // Start level
  const startLevel = useCallback((lvlId: number) => {
    audio.playTap();
    const lvl = LEVELS.find(l => l.id === lvlId) || LEVELS[0];
    runIdRef.current += 1;
    setCurrentLevelId(lvl.id);
    setGameState(createInitialGameState(lvl));
    setRunResult(null);
    setToast(null);
    setScreen('gameplay');
    setShowPauseSettings(false);
  }, []);

  // Leaving a level ends it, so its result modals never follow the player to the title screen
  const goHome = useCallback(() => {
    audio.playTap();
    setShowPauseSettings(false);
    setGameState(prev => ({ ...prev, status: 'idle' }));
    setScreen('title');
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      if (params.get('skiptutorial') === '1') setShowTutorial(false);
      startLevel(1);
    }
  }, [startLevel]);

  // Dispatch bee from dock
  const handleDispatchBee = useCallback((dockIndex: number) => {
    if (gameState.status !== 'playing') return;
    if (gameState.loopBees.length >= gameState.maxLoopCapacity) return;

    audio.playBeeLaunch();
    vibrate(15);
    setGameState(prev => dispatchBeeFromDock(prev, dockIndex));
  }, [gameState.status, gameState.loopBees.length, gameState.maxLoopCapacity, vibrate]);

  // Booster handlers
  const handleBoosterShuffle = useCallback(() => {
    if (boosters.shuffle <= 0 || gameState.status !== 'playing') return;
    audio.playBooster();
    setBoosters(prev => ({ ...prev, shuffle: prev.shuffle - 1 }));
    setGameState(prev => boosterShuffle(prev));
  }, [boosters.shuffle, gameState.status]);

  const handleBoosterPollenBurst = useCallback(() => {
    if (boosters.pollenBurst <= 0 || gameState.status !== 'playing') return;
    audio.playBooster();
    audio.playBloomHit(3);
    setBoosters(prev => ({ ...prev, pollenBurst: prev.pollenBurst - 1 }));
    setGameState(prev => boosterPollenBurst(prev));
  }, [boosters.pollenBurst, gameState.status]);

  const handleBoosterExtraDock = useCallback(() => {
    if (boosters.extraDock <= 0 || gameState.maxDocks >= 6 || gameState.unspawnedQueue.length === 0) return;
    audio.playBooster();
    setBoosters(prev => ({ ...prev, extraDock: prev.extraDock - 1 }));
    setGameState(prev => boosterExtraDock(prev));
  }, [boosters.extraDock, gameState.maxDocks, gameState.unspawnedQueue.length]);

  // A Pollen Burst can save a lost garden when it blooms the flowers the missing pollen was for
  const rescueAvailable = boosters.pollenBurst > 0 && canRescueWithBurst(gameState);
  const handleRescue = useCallback(() => {
    if (!rescueAvailable) return;
    audio.playBooster();
    setBoosters(prev => ({ ...prev, pollenBurst: prev.pollenBurst - 1 }));
    setGameState(prev => boosterPollenBurst(resumeAfterLoss(prev)));
  }, [rescueAvailable]);

  const handleBuyBooster = useCallback((kind: keyof Boosters) => {
    const price = BOOSTER_PRICES[kind];
    if (coins < price) return;
    audio.playCoin();
    setCoins(prev => prev - price);
    setBoosters(prev => ({ ...prev, [kind]: prev[kind] + 1 }));
  }, [coins]);

  const giftReady = lastGiftDay !== localDay();
  const handleClaimGift = useCallback(() => {
    if (!giftReady) return;
    audio.playCoin();
    setCoins(prev => prev + DAILY_GIFT_COINS);
    setLastGiftDay(localDay());
  }, [giftReady]);

  const toggleColorAssist = useCallback(() => {
    audio.playTap();
    setSettings(prev => ({ ...prev, colorAssist: !prev.colorAssist }));
  }, []);

  // Update Settings
  const handleUpdateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    audio.playTap();
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const tutorialVisible = screen === 'gameplay' && currentLevelId === 1 && showTutorial;
  const isPaused = showPauseSettings || showShop || tutorialVisible;

  // Simulation Game Loop: only runs while a level is actively being played
  useEffect(() => {
    if (screen !== 'gameplay' || gameState.status !== 'playing' || isPaused) return;

    let animFrame: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.08);
      lastTime = currentTime;
      setGameState(prevState => stepSimulation(prevState, dt));
      animFrame = requestAnimationFrame(loop);
    };

    animFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrame);
  }, [screen, gameState.status, isPaused]);

  // Sound and haptic cues, once per simulation step
  useEffect(() => {
    if (gameState.tick === 0) return;
    if (gameState.lastStepShots > 0) audio.playShoot();
    if (gameState.lastStepHits > 0) {
      audio.playBloomHit(Math.max(1, gameState.combo));
      vibrate(25);
    }
    if (gameState.lastStepBored.length > 0) {
      audio.playBored();
      const name = COLOR_CONFIGS[gameState.lastStepBored[0]].name;
      setToast(`A ${name} bee got bored and flew home!`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.tick]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (gameState.status === 'won') audio.playVictory();
    else if (gameState.status === 'lost') audio.playGameOver();
  }, [gameState.status]);

  // Level victory rewards, granted exactly once per run
  useEffect(() => {
    if (gameState.status !== 'won' || rewardedRunRef.current === runIdRef.current) return;
    rewardedRunRef.current = runIdRef.current;

    const stars = calculateStars(gameState);
    const rewardCoins = 20 + stars * 20;
    setRunResult({ stars, coins: rewardCoins, newBest: gameState.score > (highScores[currentLevelId] || 0) });
    setCoins(prev => prev + rewardCoins);
    setStarsEarned(prev => ({ ...prev, [currentLevelId]: Math.max(prev[currentLevelId] || 0, stars) }));
    setHighScores(prev => ({ ...prev, [currentLevelId]: Math.max(prev[currentLevelId] || 0, gameState.score) }));
    setUnlockedLevel(prev => Math.max(prev, Math.min(LEVELS.length, currentLevelId + 1)));
  }, [gameState, currentLevelId, highScores]);

  // Dismiss tutorial
  const handleDismissTutorial = useCallback(() => {
    audio.playTap();
    setShowTutorial(false);
    try {
      localStorage.setItem('bloom_loop_seen_tutorial', 'true');
    } catch {
      // ignore
    }
  }, []);

  return (
    <div
      onClick={() => {
        // Unlock browser audio context on first user click
        if (settings.musicEnabled) {
          audio.startGardenMusic();
        }
      }}
      className="relative min-h-screen w-full bg-[#1c381d] flex flex-col items-center justify-center font-sans overflow-x-hidden text-emerald-50"
    >
      {/* Desktop Atmospheric Outer Canvas Frame */}
      <div className="relative w-full max-w-[500px] min-h-screen flex flex-col justify-between shadow-2xl bg-[#224424] overflow-hidden">
        {screen === 'title' ? (
          <TitleScreen
            highScores={highScores}
            starsEarned={starsEarned}
            coins={coins}
            unlockedLevel={unlockedLevel}
            giftReady={giftReady}
            onSelectLevel={startLevel}
            onOpenSettings={() => {
              audio.playTap();
              setShowPauseSettings(true);
            }}
            onOpenCollection={() => {
              audio.playTap();
              setShowCollection(true);
            }}
            onOpenShop={() => {
              audio.playTap();
              setShowShop(true);
            }}
          />
        ) : (
          <div className="relative w-full min-h-screen flex flex-col justify-between p-1 sm:p-2">
            {/* Chapter Garden Background */}
            <img
              src={chapter.background}
              alt=""
              className="absolute inset-0 w-full h-full object-cover filter brightness-90 pointer-events-none"
            />
            <div className="absolute inset-0 bg-black/35 pointer-events-none" />

            {/* Top Bar */}
            <div className="relative z-10 w-full">
              <TopBar
                gameState={gameState}
                levelName={currentLevel.name}
                coins={coins}
                colorAssist={settings.colorAssist}
                onToggleColorAssist={toggleColorAssist}
                onPause={() => {
                  audio.playTap();
                  setShowPauseSettings(true);
                }}
                onHome={goHome}
              />
            </div>

            {/* Central Planter Board & Vine Loop Canvas */}
            <div className="relative z-10 my-auto w-full flex items-center justify-center px-1">
              {toast && (
                <div
                  role="status"
                  className="absolute z-50 top-0 left-1/2 px-3 py-1 rounded-full bg-rose-600/95 text-white text-xs font-bold shadow-lg border border-rose-300 whitespace-nowrap animate-toast-in"
                >
                  {toast}
                </div>
              )}
              <GameCanvas
                gameState={gameState}
                colorAssist={settings.colorAssist}
                reducedMotion={settings.reducedMotion}
              />
            </div>

            {/* Bottom Controls (Docks & Boosters) */}
            <div className="relative z-10 w-full">
              <BottomControls
                gameState={gameState}
                boosters={boosters}
                colorAssist={settings.colorAssist}
                onDispatchBee={handleDispatchBee}
                onBoosterShuffle={handleBoosterShuffle}
                onBoosterPollenBurst={handleBoosterPollenBurst}
                onBoosterExtraDock={handleBoosterExtraDock}
              />
            </div>
          </div>
        )}

        {/* Victory Modal */}
        {screen === 'gameplay' && gameState.status === 'won' && runResult && (
          <VictoryModal
            levelId={currentLevelId}
            score={gameState.score}
            bestCombo={gameState.bestCombo}
            stars={runResult.stars}
            coinsEarned={runResult.coins}
            newBest={runResult.newBest}
            hasNextLevel={currentLevelId < LEVELS.length}
            onNextLevel={() => startLevel(currentLevelId + 1)}
            onRestart={() => startLevel(currentLevelId)}
            onHome={goHome}
          />
        )}

        {/* Game Over Modal */}
        {screen === 'gameplay' && gameState.status === 'lost' && (
          <GameOverModal
            levelId={currentLevelId}
            shortColor={gameState.shortColor}
            rescueAvailable={rescueAvailable}
            burstsLeft={boosters.pollenBurst}
            onRescue={handleRescue}
            onRestart={() => startLevel(currentLevelId)}
            onHome={goHome}
          />
        )}

        {/* Pause & Settings Modal */}
        {showPauseSettings && (
          <PauseSettingsModal
            settings={settings}
            inGame={screen === 'gameplay'}
            onUpdateSettings={handleUpdateSettings}
            onResume={() => {
              audio.playTap();
              setShowPauseSettings(false);
            }}
            onRestart={() => startLevel(currentLevelId)}
            onHome={goHome}
          />
        )}

        {/* Seed Shop */}
        {showShop && (
          <ShopModal
            coins={coins}
            boosters={boosters}
            prices={BOOSTER_PRICES}
            giftReady={giftReady}
            giftCoins={DAILY_GIFT_COINS}
            onBuy={handleBuyBooster}
            onClaimGift={handleClaimGift}
            onClose={() => {
              audio.playTap();
              setShowShop(false);
            }}
          />
        )}

        {/* Botanical Collection Modal */}
        {showCollection && (
          <BotanicalCollectionModal
            onClose={() => {
              audio.playTap();
              setShowCollection(false);
            }}
          />
        )}

        {/* Tutorial Overlay for Level 1 */}
        {tutorialVisible && <TutorialOverlay onDismiss={handleDismissTutorial} />}
      </div>
    </div>
  );
}
