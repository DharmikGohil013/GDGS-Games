import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, createInitialGameState, dispatchBeeFromDock, stepSimulation, boosterShuffle, boosterPollenBurst, boosterExtraDock } from './game/rules.ts';
import { LEVELS } from './game/levels.ts';
import { GameSettings } from './game/types.ts';
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
} from './components/Modals.tsx';

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
      return parseInt(localStorage.getItem('bloom_loop_unlocked') || '1', 10);
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

  const [boosters, setBoosters] = useState<{ shuffle: number; pollenBurst: number; extraDock: number }>(() => {
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

  // App screen state
  const [screen, setScreen] = useState<'title' | 'gameplay'>('title');
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState(LEVELS[0]));

  // Modal dialog states
  const [showPauseSettings, setShowPauseSettings] = useState<boolean>(false);
  const [showCollection, setShowCollection] = useState<boolean>(false);
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
    } catch {
      // ignore
    }
  }, [coins, unlockedLevel, starsEarned, highScores, boosters, settings]);

  const currentLevel = LEVELS.find(l => l.id === currentLevelId) || LEVELS[0];

  // Start level
  const startLevel = useCallback((lvlId: number) => {
    audio.playTap();
    const lvl = LEVELS.find(l => l.id === lvlId) || LEVELS[0];
    setCurrentLevelId(lvlId);
    setGameState(createInitialGameState(lvl));
    setScreen('gameplay');
    setShowPauseSettings(false);
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
    if (settings.hapticsEnabled && window.navigator?.vibrate) {
      window.navigator.vibrate(15);
    }
    setGameState(prev => dispatchBeeFromDock(prev, dockIndex));
  }, [gameState.status, gameState.loopBees.length, gameState.maxLoopCapacity, settings.hapticsEnabled]);

  // Booster handlers
  const handleBoosterShuffle = useCallback(() => {
    if (boosters.shuffle <= 0) return;
    audio.playBooster();
    setBoosters(prev => ({ ...prev, shuffle: prev.shuffle - 1 }));
    setGameState(prev => boosterShuffle(prev));
  }, [boosters.shuffle]);

  const handleBoosterPollenBurst = useCallback(() => {
    if (boosters.pollenBurst <= 0) return;
    audio.playBooster();
    audio.playBloomHit(3);
    setBoosters(prev => ({ ...prev, pollenBurst: prev.pollenBurst - 1 }));
    setGameState(prev => boosterPollenBurst(prev));
  }, [boosters.pollenBurst]);

  const handleBoosterExtraDock = useCallback(() => {
    if (boosters.extraDock <= 0 || gameState.maxDocks >= 6) return;
    audio.playBooster();
    setBoosters(prev => ({ ...prev, extraDock: prev.extraDock - 1 }));
    setGameState(prev => boosterExtraDock(prev));
  }, [boosters.extraDock, gameState.maxDocks]);

  const toggleColorAssist = useCallback(() => {
    audio.playTap();
    setSettings(prev => ({ ...prev, colorAssist: !prev.colorAssist }));
  }, []);

  // Update Settings
  const handleUpdateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    audio.playTap();
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Simulation Game Loop
  const lastTimeRef = useRef<number>(performance.now());
  const prevHitCountRef = useRef<number>(0);
  const prevProjCountRef = useRef<number>(0);

  useEffect(() => {
    if (screen !== 'gameplay' || gameState.status !== 'playing') return;

    let animFrame: number;
    lastTimeRef.current = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTimeRef.current) / 1000, 0.08);
      lastTimeRef.current = currentTime;

      setGameState(prevState => {
        if (prevState.status !== 'playing') return prevState;
        const nextState = stepSimulation(prevState, dt);

        // Check for audio cues
        if (nextState.recentHits.length > prevHitCountRef.current) {
          audio.playBloomHit(nextState.combo);
          if (settings.hapticsEnabled && window.navigator?.vibrate) {
            window.navigator.vibrate(25);
          }
        }
        prevHitCountRef.current = nextState.recentHits.length;

        if (nextState.activeProjectiles.length > prevProjCountRef.current) {
          audio.playShoot();
        }
        prevProjCountRef.current = nextState.activeProjectiles.length;

        // Status change audio
        if (prevState.status === 'playing' && nextState.status === 'won') {
          audio.playVictory();
        } else if (prevState.status === 'playing' && nextState.status === 'lost') {
          audio.playGameOver();
        }

        return nextState;
      });

      animFrame = requestAnimationFrame(loop);
    };

    animFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrame);
  }, [screen, gameState.status, settings.hapticsEnabled]);

  // Handle Level Victory rewards
  useEffect(() => {
    if (gameState.status === 'won') {
      const rewardCoins = 60;
      setCoins(prev => prev + rewardCoins);

      // Calculate stars earned based on target thresholds
      let stars = 1;
      const targets = currentLevel.targetStars;
      if (gameState.score >= targets[2]) stars = 3;
      else if (gameState.score >= targets[1]) stars = 2;

      setStarsEarned(prev => ({
        ...prev,
        [currentLevelId]: Math.max(prev[currentLevelId] || 0, stars),
      }));

      setHighScores(prev => ({
        ...prev,
        [currentLevelId]: Math.max(prev[currentLevelId] || 0, gameState.score),
      }));

      // Unlock next level if available
      if (currentLevelId >= unlockedLevel && currentLevelId < LEVELS.length) {
        setUnlockedLevel(currentLevelId + 1);
      }
    }
  }, [gameState.status, currentLevelId, currentLevel.targetStars, gameState.score, unlockedLevel]);

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
            onSelectLevel={startLevel}
            onOpenSettings={() => {
              audio.playTap();
              setShowPauseSettings(true);
            }}
            onOpenCollection={() => {
              audio.playTap();
              setShowCollection(true);
            }}
          />
        ) : (
          <div className="relative w-full min-h-screen flex flex-col justify-between p-1 sm:p-2">
            {/* Gameplay Garden Background */}
            <img
              src="/embedded/bloom-loop/assets/aistudio/gameplay_garden_background_317c185d.png"
              alt="Garden Background"
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
                onHome={() => {
                  audio.playTap();
                  setScreen('title');
                }}
              />
            </div>

            {/* Central Planter Board & Vine Loop Canvas */}
            <div className="relative z-10 my-auto w-full flex items-center justify-center">
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
        {gameState.status === 'won' && (
          <VictoryModal
            levelId={currentLevelId}
            score={gameState.score}
            stars={starsEarned[currentLevelId] || 3}
            coinsEarned={60}
            hasNextLevel={currentLevelId < LEVELS.length}
            onNextLevel={() => startLevel(currentLevelId + 1)}
            onRestart={() => startLevel(currentLevelId)}
            onHome={() => {
              audio.playTap();
              setScreen('title');
            }}
          />
        )}

        {/* Game Over Modal */}
        {gameState.status === 'lost' && (
          <GameOverModal
            levelId={currentLevelId}
            onRestart={() => startLevel(currentLevelId)}
            onHome={() => {
              audio.playTap();
              setScreen('title');
            }}
          />
        )}

        {/* Pause & Settings Modal */}
        {showPauseSettings && (
          <PauseSettingsModal
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onResume={() => {
              audio.playTap();
              setShowPauseSettings(false);
            }}
            onRestart={() => startLevel(currentLevelId)}
            onHome={() => {
              audio.playTap();
              setShowPauseSettings(false);
              setScreen('title');
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
        {screen === 'gameplay' && currentLevelId === 1 && showTutorial && (
          <TutorialOverlay onDismiss={handleDismissTutorial} />
        )}
      </div>
    </div>
  );
}
