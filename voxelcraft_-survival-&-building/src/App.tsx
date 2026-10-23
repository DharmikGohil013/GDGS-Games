/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { VoxelEngine, PlayerStats } from './game/engine';
import { ambientAudio } from './game/ambient';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { InventoryModal } from './components/InventoryModal';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';

type GameState = 'title' | 'playing' | 'paused' | 'gameover';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<VoxelEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('title');
  const [activeModal, setActiveModal] = useState<'inventory' | 'crafting' | 'furnace' | null>(null);

  // Player survival stats reflected to HUD
  const [stats, setStats] = useState<PlayerStats>({
    health: 20,
    maxHealth: 20,
    hunger: 20,
    maxHunger: 20,
    oxygen: 20,
    maxOxygen: 20,
    xp: 0,
    hotbar: [
      { id: 'wooden_pickaxe', count: 1 },
      { id: 'wooden_sword', count: 1 },
      { id: 'torch', count: 16 },
      { id: 'oak_planks', count: 32 },
      { id: 'apple', count: 8 },
      null,
      null,
      null,
      null,
    ],
    inventory: new Array(27).fill(null),
    activeSlot: 0,
    gameMode: 'survival',
    isFlying: false,
    currentBiome: 'plains',
  });

  // Keep body dataset in sync with game state machine
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Handle engine callbacks with fresh array copies so slots re-render
  const handleStatsUpdate = useCallback((newStats: PlayerStats) => {
    setStats({
      ...newStats,
      hotbar: [...newStats.hotbar],
      inventory: [...newStats.inventory],
    });
  }, []);

  const handleOpenInventory = useCallback((type: 'inventory' | 'crafting' | 'furnace') => {
    setActiveModal(type);
  }, []);

  const handlePause = useCallback(() => {
    if (activeModal) {
      setActiveModal(null);
      engineRef.current?.requestPointerLock();
      return;
    }
    setGameState((current) => {
      const next = current === 'paused' ? 'playing' : 'paused';
      if (next === 'paused') {
        ambientAudio.pause();
      } else {
        ambientAudio.resume();
      }
      return next;
    });
  }, [activeModal]);

  const handleGameOver = useCallback(() => {
    setGameState('gameover');
    ambientAudio.pause();
    setActiveModal(null);
    engineRef.current?.exitPointerLock();
  }, []);

  // Initialize 3D Voxel Engine once on mount
  useEffect(() => {
    if (!canvasMountRef.current) return;

    // Check for autostart
    const urlParams = new URLSearchParams(window.location.search);
    const autostart = urlParams.get('autostart') === '1';

    const engine = new VoxelEngine(
      canvasMountRef.current,
      {
        onStatsUpdate: handleStatsUpdate,
        onOpenInventory: handleOpenInventory,
        onPause: handlePause,
        onGameOver: handleGameOver,
      },
      1337
    );
    engineRef.current = engine;

    if (autostart) {
      setGameState('playing');
      document.body.dataset.state = 'playing';
      engine.requestPointerLock();
    }

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [handleStatsUpdate, handleOpenInventory, handlePause, handleGameOver]);

  // Start game from Title Screen
  const handleStartGame = (mode: 'survival' | 'creative', seed: number) => {
    if (engineRef.current) {
      engineRef.current.stats.gameMode = mode;
      engineRef.current.world.worldSeed = seed;
      engineRef.current.world.noise.init(seed);
      // Properly clear old meshes and regenerate nearby chunks
      engineRef.current.clearWorld();
      engineRef.current.spawnPlayerAtSafeHeight(8, 8);
      engineRef.current.spawnInitialMobs();
      engineRef.current.updateChunks();
      engineRef.current.requestPointerLock();
    }
    ambientAudio.resume();
    setGameState('playing');
  };

  // Resume from Pause
  const handleResume = () => {
    ambientAudio.resume();
    setGameState('playing');
    engineRef.current?.requestPointerLock();
  };

  // Restart / Reset
  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.stats.health = 20;
      engineRef.current.stats.hunger = 20;
      engineRef.current.stats.oxygen = 20;
      engineRef.current.stats.isFlying = false;
      // Replenish starting survival tools if empty
      if (!engineRef.current.stats.hotbar[0]) {
        engineRef.current.stats.hotbar[0] = { id: 'wooden_pickaxe', count: 1 };
      }
      if (!engineRef.current.stats.hotbar[1]) {
        engineRef.current.stats.hotbar[1] = { id: 'wooden_sword', count: 1 };
      }
      if (!engineRef.current.stats.hotbar[2]) {
        engineRef.current.stats.hotbar[2] = { id: 'torch', count: 16 };
      }
      engineRef.current.spawnPlayerAtSafeHeight(8, 8);
      engineRef.current.requestPointerLock();
    }
    ambientAudio.resume();
    setGameState('playing');
    setActiveModal(null);
  };

  // Return to Title Menu
  const handleReturnToTitle = () => {
    ambientAudio.pause();
    setGameState('title');
    setActiveModal(null);
    engineRef.current?.exitPointerLock();
  };

  // Toggle Creative / Survival in pause
  const handleToggleGameMode = () => {
    if (engineRef.current) {
      const next = engineRef.current.stats.gameMode === 'survival' ? 'creative' : 'survival';
      engineRef.current.stats.gameMode = next;
      setStats({ ...engineRef.current.stats });
    }
  };

  // Set time of day in pause
  const handleSetTimeOfDay = (time: number) => {
    if (engineRef.current) {
      engineRef.current.timeOfDay = time;
    }
  };

  // Close inventory modal
  const handleCloseInventory = () => {
    setActiveModal(null);
    engineRef.current?.requestPointerLock();
  };

  // Update stats from inventory actions
  const handleUpdateStats = (newStats: PlayerStats) => {
    if (engineRef.current) {
      engineRef.current.stats = newStats;
      setStats({ ...newStats });
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans">
      {/* Isolated Three.js WebGL Canvas Mount Container */}
      <div
        ref={canvasMountRef}
        className="fixed inset-0 w-full h-full cursor-crosshair"
      />

      {/* Title Screen Overlay */}
      {gameState === 'title' && <TitleScreen onStart={handleStartGame} />}

      {/* Playing HUD */}
      {gameState === 'playing' && !activeModal && (
        <GameHUD
          stats={stats}
          onOpenInventory={() => setActiveModal('inventory')}
          onPause={handlePause}
        />
      )}

      {/* Inventory & Crafting & Furnace Modal */}
      {activeModal && (
        <InventoryModal
          type={activeModal}
          stats={stats}
          onUpdateStats={handleUpdateStats}
          onClose={handleCloseInventory}
        />
      )}

      {/* Pause Menu Modal */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onTitle={handleReturnToTitle}
          gameMode={stats.gameMode}
          onToggleGameMode={handleToggleGameMode}
          onSetTimeOfDay={handleSetTimeOfDay}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'gameover' && (
        <GameOverModal
          score={stats.xp}
          onRespawn={handleRestart}
          onTitle={handleReturnToTitle}
        />
      )}
    </div>
  );
}
