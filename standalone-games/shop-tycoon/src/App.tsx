/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine, GameSnapshot } from './game/engine';
import { IsoRenderer, CameraState } from './game/renderer';
import { sound } from './game/audio';
import { TitleScreen } from './components/TitleScreen';
import { HUD, ActivePanel } from './components/HUD';
import { BuildPanel } from './components/BuildPanel';
import { InventoryPanel } from './components/InventoryPanel';
import { PricingPanel } from './components/PricingPanel';
import { StaffPanel } from './components/StaffPanel';
import { LedgerPanel } from './components/LedgerPanel';
import { ShelfInspector } from './components/ShelfInspector';
import { PauseModal } from './components/PauseModal';
import { EndOfDayModal } from './components/EndOfDayModal';

type GameState = 'title' | 'playing' | 'paused' | 'gameover';

const AUTOSAVE_SECONDS = 10;

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<IsoRenderer | null>(null);

  // Camera State
  const cameraRef = useRef<CameraState>({ x: 0, y: 160, zoom: 1.15 });

  // Game UI State
  const [gameState, setGameState] = useState<GameState>('title');
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);

  // Build Mode State
  const [selectedBuildTool, setSelectedBuildTool] = useState<string | null>(null);
  const [buildRotation, setBuildRotation] = useState<number>(0);
  const [isDemolishMode, setIsDemolishMode] = useState<boolean>(false);

  // Inspector & Hover State
  const [inspectedFixtureId, setInspectedFixtureId] = useState<string | null>(null);
  const hoverTileRef = useRef<{ x: number; y: number } | null>(null);

  // Mouse Pan State
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Keyboard held inputs
  const keysHeld = useRef<Set<string>>(new Set());

  // A saved store from an earlier visit can be continued from the title screen
  const [savedDay, setSavedDay] = useState<number | null>(() => GameEngine.savedDay());

  // Initialize Engine
  if (!engineRef.current) {
    engineRef.current = new GameEngine();
  }

  // Sync state to body dataset
  const updateGameState = useCallback((state: GameState) => {
    setGameState(state);
    document.body.dataset.state = state;
  }, []);

  const fitCamera = useCallback(() => {
    if (rendererRef.current && engineRef.current) {
      cameraRef.current = rendererRef.current.fitCamera(engineRef.current.gridWidth, engineRef.current.gridHeight);
    }
  }, []);

  // Swap in a different store (new game, continue, restart) and reset every bit of UI state
  const switchEngine = useCallback((engine: GameEngine) => {
    engineRef.current = engine;
    setSnapshot(engine.getSnapshot());
    setActivePanel(null);
    setInspectedFixtureId(null);
    setSelectedBuildTool(null);
    setIsDemolishMode(false);
    fitCamera();
    updateGameState(engine.isDayFinished ? 'gameover' : 'playing');
  }, [fitCamera, updateGameState]);

  // Check ?autostart=1
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        updateGameState('playing');
      }
    }
  }, [updateGameState]);

  // Autosave while the shop is open, and whenever the page is hidden or closed
  useEffect(() => {
    const saveNow = () => {
      if (document.body.dataset.state !== 'title') engineRef.current?.save();
    };
    const timer = window.setInterval(() => {
      if (document.body.dataset.state === 'playing') saveNow();
    }, AUTOSAVE_SECONDS * 1000);
    const onHide = () => {
      if (document.visibilityState === 'hidden') saveNow();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', saveNow);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', saveNow);
    };
  }, []);

  // Main Canvas Setup & 60 FPS Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new IsoRenderer(canvas);
    const firstSetup = rendererRef.current === null;
    rendererRef.current = renderer;

    // Render at the screen's real pixel density so the store stays crisp on phones and retina displays
    const handleResize = () => {
      if (!canvas) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * ratio);
      canvas.height = Math.round(window.innerHeight * ratio);
      renderer.pixelRatio = ratio;
    };
    handleResize();
    if (firstSetup) fitCamera();
    const handleWindowResize = () => {
      handleResize();
      fitCamera();
    };
    window.addEventListener('resize', handleWindowResize);

    let lastTime = performance.now();
    let lastRenderTime = performance.now();
    let animId: number;
    let throttleTimer = 0;
    let lastGridWidth = engineRef.current!.gridWidth;
    const targetFrameInterval = 1000 / 60; // 60 FPS cap

    const gameLoop = (currentTime: number) => {
      // Always drive the current engine: Restart and Continue replace it
      const engine = engineRef.current!;
      animId = requestAnimationFrame(gameLoop);

      const elapsed = currentTime - lastRenderTime;
      if (elapsed < targetFrameInterval - 1) {
        return;
      }
      lastRenderTime = currentTime - (elapsed % targetFrameInterval);

      const rawDt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Handle WASD / Arrow camera panning
      const panSpeed = 380 * (1 / cameraRef.current.zoom) * Math.min(rawDt, 0.05);
      if (keysHeld.current.has('KeyA') || keysHeld.current.has('ArrowLeft')) {
        cameraRef.current.x -= panSpeed;
      }
      if (keysHeld.current.has('KeyD') || keysHeld.current.has('ArrowRight')) {
        cameraRef.current.x += panSpeed;
      }
      if (keysHeld.current.has('KeyW') || keysHeld.current.has('ArrowUp')) {
        cameraRef.current.y -= panSpeed;
      }
      if (keysHeld.current.has('KeyS') || keysHeld.current.has('ArrowDown')) {
        cameraRef.current.y += panSpeed;
      }

      // Update simulation if in playing state
      if (document.body.dataset.state === 'playing') {
        engine.update(rawDt);
      }

      // Re-frame the store after a floor expansion
      if (engine.gridWidth !== lastGridWidth) {
        lastGridWidth = engine.gridWidth;
        fitCamera();
      }

      // Check for build ghost validity (same rules as actually building)
      let buildGhost = null;
      if (selectedBuildTool && hoverTileRef.current) {
        const check = engine.canPlace(selectedBuildTool, hoverTileRef.current.x, hoverTileRef.current.y, buildRotation);
        buildGhost = {
          type: selectedBuildTool,
          rotation: buildRotation,
          isValid: check.allowed
        };
      }

      // Render isometric view
      const capacity = engine.getWarehouseCapacity();
      renderer.render(
        {
          gridWidth: engine.gridWidth,
          gridHeight: engine.gridHeight,
          doorX: engine.doorX,
          fixtures: engine.fixtures,
          customers: engine.customers,
          staff: engine.staff,
          products: engine.products,
          litter: engine.litter,
          notifications: engine.notifications,
          warehouseFill: capacity > 0 ? engine.getWarehouseUsed() / capacity : 1,
          hoverTile: hoverTileRef.current,
          selectedFixtureId: inspectedFixtureId,
          buildGhost,
          isStoreOpen: engine.isStoreOpen,
          timeOfDay: engine.timeOfDay
        },
        cameraRef.current
      );

      // Throttle React state snapshots (~10Hz) to keep 60 FPS smooth without React overhead
      throttleTimer += rawDt;
      if (throttleTimer >= 0.1) {
        throttleTimer = 0;
        setSnapshot(engine.getSnapshot());

        // Check if Day concluded
        if (engine.isDayFinished && document.body.dataset.state === 'playing') {
          updateGameState('gameover');
        }
      }
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [selectedBuildTool, buildRotation, inspectedFixtureId, updateGameState, fitCamera]);

  // Global Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      keysHeld.current.add(e.code);

      // Title screen Enter / Space to start (continuing a saved store when there is one)
      if (gameState === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        sound.playClick();
        if (GameEngine.savedDay() !== null) handleContinue();
        else handleRestart();
        return;
      }

      // Rotate build fixture with [R]
      if (e.code === 'KeyR') {
        setBuildRotation(prev => (prev + 90) % 360);
        sound.playClick();
      }

      // Toggle Sound Mute with [M]
      if (e.code === 'KeyM') {
        const nextMute = sound.toggleMute();
        setIsMuted(nextMute);
      }

      // Pause with Escape or Space or P
      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        if (activePanel) {
          setActivePanel(null);
        } else if (inspectedFixtureId) {
          setInspectedFixtureId(null);
        } else if (selectedBuildTool || isDemolishMode) {
          setSelectedBuildTool(null);
          setIsDemolishMode(false);
        } else if (gameState === 'playing') {
          updateGameState('paused');
        } else if (gameState === 'paused') {
          updateGameState('playing');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysHeld.current.delete(e.code);
    };

    const handleBlur = () => {
      // Clear held keys on blur so keys never stick
      keysHeld.current.clear();
      isDraggingRef.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameState, activePanel, inspectedFixtureId, selectedBuildTool, isDemolishMode, updateGameState]);

  // Pointer & Click Handlers for Isometric Canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Left click or middle click
    if (e.button === 0 || e.button === 1) {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      cameraStartRef.current = { x: cameraRef.current.x, y: cameraRef.current.y };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      const dx = (e.clientX - dragStartRef.current.x) / cameraRef.current.zoom;
      const dy = (e.clientY - dragStartRef.current.y) / cameraRef.current.zoom;
      cameraRef.current.x = cameraStartRef.current.x - dx;
      cameraRef.current.y = cameraStartRef.current.y - dy;
    }

    if (rendererRef.current) {
      const gridPos = rendererRef.current.toGrid(e.clientX, e.clientY, cameraRef.current);
      hoverTileRef.current = gridPos;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const isDrag = Math.hypot(e.clientX - dragStartRef.current.x, e.clientY - dragStartRef.current.y) > 6;
    isDraggingRef.current = false;

    // If it was a deliberate click rather than a pan drag
    if (!isDrag && e.button === 0 && rendererRef.current && engineRef.current) {
      const tile = rendererRef.current.toGrid(e.clientX, e.clientY, cameraRef.current);
      const engine = engineRef.current;

      // 1. If in Demolish / Sell Mode
      if (isDemolishMode) {
        const clickedFixture = engine.fixtures.find(f =>
          tile.x >= f.x && tile.x < f.x + f.width && tile.y >= f.y && tile.y < f.y + f.height
        );
        if (clickedFixture) {
          engine.dismantleFixture(clickedFixture.id);
          setSnapshot(engine.getSnapshot());
        }
        return;
      }

      // 2. If in Build Mode
      if (selectedBuildTool) {
        const res = engine.buildFixture(selectedBuildTool, tile.x, tile.y, buildRotation);
        if (res.success) {
          setSnapshot(engine.getSnapshot());
        }
        return;
      }

      // 3. Tapping litter sweeps it up by hand
      if (engine.cleanLitterAt(tile.x, tile.y)) {
        setSnapshot(engine.getSnapshot());
        return;
      }

      // 4. Normal Click: Inspect Fixture (checks both ground tile and elevated top face)
      const tileElevated = rendererRef.current.toGrid(e.clientX, e.clientY + 28 * cameraRef.current.zoom, cameraRef.current);
      const clickedFixture = engine.fixtures.find(f =>
        (tile.x >= f.x && tile.x < f.x + f.width && tile.y >= f.y && tile.y < f.y + f.height) ||
        (tileElevated.x >= f.x && tileElevated.x < f.x + f.width && tileElevated.y >= f.y && tileElevated.y < f.y + f.height)
      );

      if (clickedFixture) {
        sound.playClick();
        setInspectedFixtureId(clickedFixture.id);
      } else {
        setInspectedFixtureId(null);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    cameraRef.current.zoom = Math.max(0.65, Math.min(2.4, cameraRef.current.zoom * zoomFactor));
  };

  // Actions
  const handleToggleStoreOpen = () => {
    if (engineRef.current) {
      engineRef.current.isStoreOpen = !engineRef.current.isStoreOpen;
      setSnapshot(engineRef.current.getSnapshot());
    }
  };

  const handleSetGameSpeed = (speed: number) => {
    if (engineRef.current) {
      engineRef.current.gameSpeed = speed;
      setSnapshot(engineRef.current.getSnapshot());
    }
  };

  const handleToggleMute = () => {
    const nextMute = sound.toggleMute();
    setIsMuted(nextMute);
  };

  const handleNextDay = () => {
    if (engineRef.current) {
      engineRef.current.startNextDay();
      setSnapshot(engineRef.current.getSnapshot());
      updateGameState('playing');
    }
  };

  const handleRestart = () => {
    GameEngine.clearSave();
    setSavedDay(null);
    switchEngine(new GameEngine());
  };

  const handleContinue = () => {
    const saved = GameEngine.load();
    switchEngine(saved ?? new GameEngine());
  };

  const handleBackToTitle = () => {
    engineRef.current?.save();
    setSavedDay(GameEngine.savedDay());
    updateGameState('title');
  };

  const inspectedFixture = engineRef.current?.fixtures.find(f => f.id === inspectedFixtureId);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* 60 FPS Canvas Viewport */}
      <canvas
        ref={canvasRef}
        data-testid="game-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        className="block w-full h-full cursor-crosshair touch-none select-none"
      />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          savedDay={savedDay}
          onNewGame={handleRestart}
          onContinue={handleContinue}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* In-Game World-Matched HUD (visible in playing and paused) */}
      {(gameState === 'playing' || gameState === 'paused') && snapshot && (
        <>
          <HUD
            cash={snapshot.cash}
            level={snapshot.level}
            xp={snapshot.xp}
            xpNeeded={snapshot.xpNeeded}
            reputation={snapshot.reputation}
            day={snapshot.day}
            timeOfDay={snapshot.timeOfDay}
            isStoreOpen={snapshot.isStoreOpen}
            gameSpeed={snapshot.gameSpeed}
            isMuted={isMuted}
            activePanel={activePanel}
            customersCount={snapshot.customersCount}
            litterCount={snapshot.litterCount}
            dailyGoal={snapshot.dailyGoal}
            goalProgress={
              snapshot.dailyGoal.metric === 'served' ? snapshot.dailyStats.served :
              snapshot.dailyGoal.metric === 'revenue' ? snapshot.dailyStats.revenue : null
            }
            trendingCategory={snapshot.trendingCategory}
            onToggleStoreOpen={handleToggleStoreOpen}
            onSetGameSpeed={handleSetGameSpeed}
            onToggleMute={handleToggleMute}
            onPause={() => updateGameState('paused')}
            onSetActivePanel={setActivePanel}
          />

          {/* Build Panel */}
          {activePanel === 'build' && (
            <BuildPanel
              cash={snapshot.cash}
              selectedTool={selectedBuildTool}
              rotation={buildRotation}
              isDemolishMode={isDemolishMode}
              onSelectTool={tool => {
                setSelectedBuildTool(tool);
                if (tool) setIsDemolishMode(false);
              }}
              onRotate={() => setBuildRotation(prev => (prev + 90) % 360)}
              onToggleDemolish={() => {
                setIsDemolishMode(prev => !prev);
                setSelectedBuildTool(null);
              }}
              onClose={() => {
                setActivePanel(null);
                setSelectedBuildTool(null);
                setIsDemolishMode(false);
              }}
            />
          )}

          {/* Wholesale Inventory Orders Panel */}
          {activePanel === 'inventory' && (
            <InventoryPanel
              cash={snapshot.cash}
              level={snapshot.level}
              products={snapshot.products}
              warehouseStock={snapshot.warehouseStock}
              warehouseUsed={snapshot.warehouseUsed}
              warehouseCapacity={snapshot.warehouseCapacity}
              wholesaleDiscount={snapshot.wholesaleDiscount}
              activeOrders={snapshot.wholesaleOrders}
              onPlaceOrder={(prodId, qty) => {
                const res = engineRef.current!.placeWholesaleOrder(prodId, qty);
                setSnapshot(engineRef.current!.getSnapshot());
                return res;
              }}
              onClose={() => setActivePanel(null)}
            />
          )}

          {/* Retail Pricing Panel */}
          {activePanel === 'pricing' && (
            <PricingPanel
              products={snapshot.products}
              onUpdatePrice={(prodId, newPrice) => {
                const prod = engineRef.current!.products.find(p => p.id === prodId);
                if (prod) {
                  prod.currentPrice = Number(newPrice.toFixed(2));
                  setSnapshot(engineRef.current!.getSnapshot());
                }
              }}
              onClose={() => setActivePanel(null)}
            />
          )}

          {/* Staff Panel */}
          {activePanel === 'staff' && (
            <StaffPanel
              cash={snapshot.cash}
              staff={snapshot.staff}
              onHireStaff={role => {
                const res = engineRef.current!.hireStaff(role);
                setSnapshot(engineRef.current!.getSnapshot());
                return res;
              }}
              onFireStaff={staffId => {
                engineRef.current!.fireStaff(staffId);
                setSnapshot(engineRef.current!.getSnapshot());
              }}
              onClose={() => setActivePanel(null)}
            />
          )}

          {/* Financial Ledger & Upgrades Panel */}
          {activePanel === 'ledger' && (
            <LedgerPanel
              cash={snapshot.cash}
              day={snapshot.day}
              dailyLedgers={snapshot.dailyLedgers}
              upgrades={snapshot.upgrades}
              onPurchaseUpgrade={upgId => {
                const res = engineRef.current!.purchaseUpgrade(upgId);
                setSnapshot(engineRef.current!.getSnapshot());
                return res;
              }}
              onClose={() => setActivePanel(null)}
            />
          )}

          {/* In-World Shelf / Fixture Inspector */}
          {inspectedFixture && (
            <ShelfInspector
              fixture={inspectedFixture}
              products={snapshot.products.filter(p => p.unlockLevel <= snapshot.level)}
              warehouseStock={snapshot.warehouseStock}
              onAssignProduct={(fId, pId) => {
                engineRef.current!.assignProductToShelf(fId, pId);
                setSnapshot(engineRef.current!.getSnapshot());
              }}
              onManualRestock={fId => {
                engineRef.current!.manualRestockShelf(fId);
                setSnapshot(engineRef.current!.getSnapshot());
              }}
              onDismantle={fId => {
                engineRef.current!.dismantleFixture(fId);
                setInspectedFixtureId(null);
                setSnapshot(engineRef.current!.getSnapshot());
              }}
              onClose={() => setInspectedFixtureId(null)}
            />
          )}
        </>
      )}

      {/* Paused Modal */}
      {gameState === 'paused' && snapshot && (
        <PauseModal
          onResume={() => updateGameState('playing')}
          onRestart={handleRestart}
          onTitle={handleBackToTitle}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          day={snapshot.day}
          cash={snapshot.cash}
          reputation={snapshot.reputation}
        />
      )}

      {/* End Of Day Summary Modal */}
      {gameState === 'gameover' && snapshot && snapshot.latestLedger && (
        <EndOfDayModal
          ledger={snapshot.latestLedger}
          currentCash={snapshot.cash}
          reputation={snapshot.reputation}
          onNextDay={handleNextDay}
        />
      )}
    </div>
  );
}
