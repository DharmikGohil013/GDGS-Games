import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, ActiveTab } from './types/game';
import { DEFAULT_BUSINESSES, DEFAULT_UPGRADES } from './game/businessData';
import {
  calculateTotalRevenuePerSecond,
  calculateCycleDuration,
  calculateRevenuePerCycle,
  calculateClaimableFame,
  calculateOfflineEarnings,
} from './game/finance';
import { loadGame, saveGame, createInitialState } from './game/storage';
import { sound } from './game/sound';

import { TitleScreen } from './components/TitleScreen';
import { TopHUD } from './components/TopHUD';
import { BulkBuyToggle, BulkBuyOption } from './components/BulkBuyToggle';
import { ElevatorShaft } from './components/ElevatorShaft';
import { FloorCard } from './components/FloorCard';
import { BottomNav } from './components/BottomNav';
import { ManagersModal } from './components/ManagersModal';
import { UpgradesModal } from './components/UpgradesModal';
import { FamePrestigeModal } from './components/FamePrestigeModal';
import { LuckyWheelModal } from './components/LuckyWheelModal';
import { OfflineEarningsModal } from './components/OfflineEarningsModal';
import { SettingsModal } from './components/SettingsModal';
import { CashFrenzyBlimp } from './components/CashFrenzyBlimp';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(loadGame);
  const [inTitleScreen, setInTitleScreen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('autostart') !== '1';
    }
    return true;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('tower');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [offlineEarningsData, setOfflineEarningsData] = useState<{
    cash: number;
    seconds: number;
  } | null>(null);

  // Sync body dataset state for accessibility and Ultra Mode compliance
  useEffect(() => {
    document.body.dataset.state = inTitleScreen ? 'title' : 'playing';
  }, [inTitleScreen]);

  // Keep ref for 60fps loop so simulation always reads fresh state without React teardowns
  const stateRef = useRef<GameState>(gameState);
  stateRef.current = gameState;

  // Sound sync
  useEffect(() => {
    sound.setEnabled(gameState.soundEnabled);
  }, [gameState.soundEnabled]);

  // Check offline earnings on initial mount
  useEffect(() => {
    const loaded = loadGame();
    const now = Date.now();
    const elapsedSeconds = (now - (loaded.lastSaveTime || now)) / 1000;

    if (elapsedSeconds > 10) {
      const offline = calculateOfflineEarnings(
        DEFAULT_BUSINESSES,
        loaded.businesses,
        loaded.managers,
        loaded.upgrades,
        DEFAULT_UPGRADES,
        loaded.famePoints,
        elapsedSeconds
      );

      if (offline.totalOfflineCash > 0) {
        setOfflineEarningsData({
          cash: offline.totalOfflineCash,
          seconds: offline.cappedSeconds,
        });
      }
    }
  }, []);

  // Save game periodically (every 3s) and on unload
  useEffect(() => {
    const interval = setInterval(() => {
      saveGame(stateRef.current);
    }, 3000);

    const handleBeforeUnload = () => {
      saveGame(stateRef.current);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Start game handler
  const handleStartGame = useCallback(() => {
    sound.playCash();
    setInTitleScreen(false);
  }, []);

  // 60 FPS Game Simulation Loop
  useEffect(() => {
    if (inTitleScreen) return;

    let lastFrameTime = performance.now();
    let animId: number;

    const gameLoop = (currentTime: number) => {
      const rawDt = (currentTime - lastFrameTime) / 1000;
      lastFrameTime = currentTime;
      const dt = Math.min(rawDt, 0.05); // clamp delta time

      const current = stateRef.current;
      const now = Date.now();
      const isFrenzy = current.frenzyActiveUntil > now;

      let cashDelta = 0;
      let hasStateChanges = false;
      const newBusinesses = { ...current.businesses };

      DEFAULT_BUSINESSES.forEach((biz) => {
        const bState = newBusinesses[biz.id];
        if (!bState || !bState.unlocked || bState.level <= 0) return;

        const isAutomated = !!current.managers[biz.id];
        const cycleSec = calculateCycleDuration(biz, bState.level, current.upgrades, DEFAULT_UPGRADES);

        // If running, advance progress
        if (bState.isRunning || isAutomated) {
          const progressInc = dt / cycleSec;
          const nextProgress = bState.progress + progressInc;

          if (nextProgress >= 1) {
            // Cycle completed!
            const cyclesDone = Math.floor(nextProgress);
            const cycleRev = calculateRevenuePerCycle(
              biz,
              bState.level,
              current.upgrades,
              DEFAULT_UPGRADES,
              current.famePoints,
              isFrenzy
            );

            cashDelta += cycleRev * cyclesDone;
            hasStateChanges = true;

            newBusinesses[biz.id] = {
              ...bState,
              progress: isAutomated ? nextProgress % 1 : 0,
              isRunning: isAutomated,
            };
          } else {
            // Advancing through current cycle
            newBusinesses[biz.id] = {
              ...bState,
              progress: nextProgress,
              isRunning: true,
            };
            hasStateChanges = true;
          }
        }
      });

      if (cashDelta > 0 || hasStateChanges) {
        setGameState((prev) => ({
          ...prev,
          cash: prev.cash + cashDelta,
          lifetimeCash: prev.lifetimeCash + cashDelta,
          businesses: newBusinesses,
        }));
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [inTitleScreen]);

  // HANDLER: Manual Work on Floor
  const handleManualWork = useCallback((businessId: string) => {
    setGameState((prev) => {
      const bState = prev.businesses[businessId];
      if (!bState || !bState.unlocked) return prev;

      // Start cycle or bump progress
      return {
        ...prev,
        stats: {
          ...prev.stats,
          totalTaps: prev.stats.totalTaps + 1,
        },
        businesses: {
          ...prev.businesses,
          [businessId]: {
            ...bState,
            isRunning: true,
            // If already near complete, nudge by 0.35 for fast feel
            progress: Math.min(0.99, bState.progress + 0.35),
          },
        },
      };
    });
  }, []);

  // HANDLER: Buy Business Levels
  const handleBuyLevels = useCallback((businessId: string, count: number, cost: number) => {
    setGameState((prev) => {
      if (prev.cash < cost) return prev;
      const bState = prev.businesses[businessId];
      if (!bState) return prev;

      return {
        ...prev,
        cash: prev.cash - cost,
        businesses: {
          ...prev.businesses,
          [businessId]: {
            ...bState,
            level: bState.level + count,
          },
        },
      };
    });
  }, []);

  // HANDLER: Unlock Floor
  const handleUnlockFloor = useCallback((businessId: string, cost: number) => {
    setGameState((prev) => {
      if (prev.cash < cost) return prev;
      const bState = prev.businesses[businessId];
      if (!bState) return prev;

      return {
        ...prev,
        cash: prev.cash - cost,
        businesses: {
          ...prev.businesses,
          [businessId]: {
            ...bState,
            unlocked: true,
            level: 1,
          },
        },
        stats: {
          ...prev.stats,
          floorsUnlocked: prev.stats.floorsUnlocked + 1,
        },
      };
    });
  }, []);

  // HANDLER: Hire Manager
  const handleHireManager = useCallback((businessId: string, cost: number) => {
    setGameState((prev) => {
      if (prev.cash < cost || prev.managers[businessId]) return prev;
      return {
        ...prev,
        cash: prev.cash - cost,
        managers: {
          ...prev.managers,
          [businessId]: true,
        },
        businesses: {
          ...prev.businesses,
          [businessId]: {
            ...prev.businesses[businessId],
            isRunning: true,
          },
        },
      };
    });
  }, []);

  // HANDLER: Buy Upgrade
  const handleBuyUpgrade = useCallback((upgradeId: string, cost: number) => {
    setGameState((prev) => {
      if (prev.cash < cost || prev.upgrades[upgradeId]) return prev;
      return {
        ...prev,
        cash: prev.cash - cost,
        upgrades: {
          ...prev.upgrades,
          [upgradeId]: true,
        },
      };
    });
  }, []);

  // HANDLER: Prestige / Sell Empire
  const handlePrestige = useCallback(() => {
    setGameState((prev) => {
      const claimable = calculateClaimableFame(prev.lifetimeCash, prev.famePoints);
      if (claimable <= 0) return prev;

      const resetInitial = createInitialState();
      return {
        ...resetInitial,
        lifetimeCash: prev.lifetimeCash,
        famePoints: prev.famePoints + claimable,
        soundEnabled: prev.soundEnabled,
        stats: {
          ...prev.stats,
          totalPrestiges: prev.stats.totalPrestiges + 1,
        },
      };
    });
  }, []);

  // HANDLER: Award Spin Prize
  const handleAwardPrize = useCallback(
    (prize: { type: string; value: number }, awardedCash: number) => {
      setGameState((prev) => {
        if (prize.type === 'cash_mult') {
          return {
            ...prev,
            cash: prev.cash + awardedCash,
            lifetimeCash: prev.lifetimeCash + awardedCash,
            lastSpinTime: Date.now(),
          };
        } else if (prize.type === 'fame') {
          return {
            ...prev,
            famePoints: prev.famePoints + prize.value,
            lastSpinTime: Date.now(),
          };
        } else if (prize.type === 'frenzy') {
          return {
            ...prev,
            frenzyActiveUntil: Date.now() + prize.value * 1000,
            lastSpinTime: Date.now(),
          };
        }
        return prev;
      });
    },
    []
  );

  // HANDLER: Elevator Tip
  const handleElevatorTip = useCallback((tipAmount: number) => {
    setGameState((prev) => ({
      ...prev,
      cash: prev.cash + tipAmount,
      lifetimeCash: prev.lifetimeCash + tipAmount,
    }));
  }, []);

  // HANDLER: Trigger Frenzy from Blimp
  const handleTriggerFrenzy = useCallback((seconds: number) => {
    setGameState((prev) => ({
      ...prev,
      frenzyActiveUntil: Date.now() + seconds * 1000,
    }));
  }, []);

  // HANDLER: Claim Offline Earnings
  const handleClaimOffline = useCallback((doubled: boolean) => {
    if (!offlineEarningsData) return;
    const amount = doubled ? offlineEarningsData.cash * 2 : offlineEarningsData.cash;
    setGameState((prev) => ({
      ...prev,
      cash: prev.cash + amount,
      lifetimeCash: prev.lifetimeCash + amount,
    }));
    setOfflineEarningsData(null);
  }, [offlineEarningsData]);

  // Derived calculations
  const now = Date.now();
  const isFrenzy = gameState.frenzyActiveUntil > now;
  const frenzyRemainingSeconds = Math.max(0, Math.ceil((gameState.frenzyActiveUntil - now) / 1000));
  const totalRevenuePerSecond = calculateTotalRevenuePerSecond(
    DEFAULT_BUSINESSES,
    gameState.businesses,
    gameState.managers,
    gameState.upgrades,
    DEFAULT_UPGRADES,
    gameState.famePoints,
    isFrenzy
  );
  const claimableFame = calculateClaimableFame(gameState.lifetimeCash, gameState.famePoints);

  // Unlocked floors count
  const unlockedCount = Object.values(gameState.businesses).filter((b) => b.unlocked).length;

  // Available managers count that player can afford
  const availableManagersCount = DEFAULT_BUSINESSES.filter((biz) => {
    const isUnlocked = gameState.businesses[biz.id]?.unlocked;
    const notHired = !gameState.managers[biz.id];
    return isUnlocked && notHired && gameState.cash >= biz.manager.cost;
  }).length;

  // Available upgrades count that player can afford
  const availableUpgradesCount = DEFAULT_UPGRADES.filter(
    (u) => !gameState.upgrades[u.id] && gameState.cash >= u.cost
  ).length;

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center font-sans antialiased sm:p-4">
      {/* Mobile Device Frame for Authentic Cash Inc Tycoon Feel */}
      <div className="relative w-full h-[100dvh] sm:h-[844px] sm:max-w-[430px] sm:rounded-[40px] bg-slate-950 border-0 sm:border-4 sm:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {inTitleScreen ? (
          <TitleScreen
            onStart={handleStartGame}
            lifetimeCash={gameState.lifetimeCash}
            famePoints={gameState.famePoints}
            soundEnabled={gameState.soundEnabled}
            onToggleSound={() =>
              setGameState((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
            }
          />
        ) : (
          <main className="relative flex-1 flex flex-col overflow-hidden bg-slate-950">
            {/* Top HUD with Net Worth & Revenue */}
            <TopHUD
              cash={gameState.cash}
              revenuePerSecond={totalRevenuePerSecond}
              famePoints={gameState.famePoints}
              frenzyRemainingSeconds={frenzyRemainingSeconds}
              soundEnabled={gameState.soundEnabled}
              onToggleSound={() =>
                setGameState((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
              }
              onOpenSettings={() => setIsSettingsOpen(true)}
            />

            {/* Bulk Buy Upgrade Controller (1x, 10x, 25x, 100x, MAX) */}
            <BulkBuyToggle
              current={gameState.bulkBuyCount}
              onChange={(opt: BulkBuyOption) =>
                setGameState((prev) => ({ ...prev, bulkBuyCount: opt }))
              }
            />

            {/* Random VIP Blimp Crossing the Sky */}
            <CashFrenzyBlimp onTriggerFrenzy={handleTriggerFrenzy} />

            {/* Main Tower View: Elevator Shaft on the left, Floor Cards on the right */}
            <div className="flex-1 flex overflow-hidden relative">
              {/* Animated 2D Elevator Shaft */}
              <ElevatorShaft
                unlockedFloorsCount={unlockedCount}
                totalFloorsCount={DEFAULT_BUSINESSES.length}
                onElevatorTip={handleElevatorTip}
                cashRate={totalRevenuePerSecond}
              />

              {/* Business Floors List (Skyscraper Stack) */}
              <div className="flex-1 overflow-y-auto pb-6 scroll-smooth">
                {DEFAULT_BUSINESSES.map((biz) => {
                  const bState = gameState.businesses[biz.id];
                  if (!bState) return null;

                  return (
                    <FloorCard
                      key={biz.id}
                      business={biz}
                      state={bState}
                      isAutomated={!!gameState.managers[biz.id]}
                      bulkBuy={gameState.bulkBuyCount}
                      cash={gameState.cash}
                      upgrades={gameState.upgrades}
                      allUpgrades={DEFAULT_UPGRADES}
                      famePoints={gameState.famePoints}
                      isFrenzy={isFrenzy}
                      onBuyLevels={handleBuyLevels}
                      onManualWork={handleManualWork}
                      onUnlockFloor={handleUnlockFloor}
                    />
                  );
                })}
              </div>
            </div>

            {/* Bottom Dock Navigation */}
            <BottomNav
              activeTab={activeTab}
              onTabChange={(tab: ActiveTab) => setActiveTab(tab)}
              claimableFame={claimableFame}
              availableManagersCount={availableManagersCount}
              availableUpgradesCount={availableUpgradesCount}
              isWheelReady={true}
            />

            {/* MODALS */}
            <ManagersModal
              isOpen={activeTab === 'managers'}
              onClose={() => setActiveTab('tower')}
              businesses={DEFAULT_BUSINESSES}
              businessStates={gameState.businesses}
              managers={gameState.managers}
              cash={gameState.cash}
              onHireManager={handleHireManager}
            />

            <UpgradesModal
              isOpen={activeTab === 'upgrades'}
              onClose={() => setActiveTab('tower')}
              upgrades={DEFAULT_UPGRADES}
              purchasedUpgrades={gameState.upgrades}
              cash={gameState.cash}
              onBuyUpgrade={handleBuyUpgrade}
            />

            <FamePrestigeModal
              isOpen={activeTab === 'fame'}
              onClose={() => setActiveTab('tower')}
              lifetimeCash={gameState.lifetimeCash}
              currentFame={gameState.famePoints}
              claimableFame={claimableFame}
              onPrestige={handlePrestige}
            />

            <LuckyWheelModal
              isOpen={activeTab === 'wheel'}
              onClose={() => setActiveTab('tower')}
              cashRate={totalRevenuePerSecond}
              onAwardPrize={handleAwardPrize}
            />

            <OfflineEarningsModal
              isOpen={!!offlineEarningsData}
              onClose={() => setOfflineEarningsData(null)}
              offlineCash={offlineEarningsData?.cash || 0}
              offlineSeconds={offlineEarningsData?.seconds || 0}
              onClaim={handleClaimOffline}
            />

            <SettingsModal
              isOpen={isSettingsOpen}
              onClose={() => setIsSettingsOpen(false)}
              gameState={gameState}
              onManualSave={() => saveGame(gameState)}
              onImportState={(newState: GameState) => setGameState(newState)}
              onResetGame={() => setGameState(createInitialState())}
              soundEnabled={gameState.soundEnabled}
              onToggleSound={() =>
                setGameState((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
              }
            />
          </main>
        )}
      </div>
    </div>
  );
}
