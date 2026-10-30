import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { ShopModal } from './components/ShopModal';
import { CraftingModal } from './components/CraftingModal';
import { BackpackModal } from './components/BackpackModal';
import { QuestModal } from './components/QuestModal';
import { HelpModal } from './components/HelpModal';
import { drawPixelWorld, Camera, PlayerRenderState, invalidateBgCaches } from './game/renderer2d';
import { sounds } from './game/audio';
import {
  FarmPlot,
  TreeEntity,
  ChickenEntity,
  RemotePlayer,
  FloatingText,
  InventorySlot,
  Quest,
  ChatMessage,
  CraftingRecipe,
  HoverTarget,
} from './game/types';
import {
  TILE_SIZE,
  WORLD_WIDTH_TILES,
  WORLD_HEIGHT_TILES,
  MAX_ENERGY,
  INITIAL_ENERGY,
  ENERGY_REGEN_PER_SECOND,
  ITEMS,
  INITIAL_QUESTS,
} from './game/constants';
import { TutorialOverlay, TUTORIAL_STEPS } from './components/TutorialOverlay';
import {
  calculateGrowthStage,
  consumeEnergy,
  replenishEnergy,
  addToInventory,
  removeFromInventory,
  advanceQuest,
  getNextTutorialStep,
  getPrevTutorialStep,
  calculateDistance,
  isWithinInteractionRange,
} from './game/rules';

const SAVE_STORAGE_KEY = 'pixels_save_game_v2';

export default function App() {
  // Game Shell state ('title' | 'playing' | 'paused')
  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused'>('title');

  // Player custom appearance
  const [playerName, setPlayerName] = useState('PixelFarmer');
  const [hairColor, setHairColor] = useState('#ffcc80');
  const [shirtColor, setShirtColor] = useState('#3b82f6');
  const [pantsColor, setPantsColor] = useState('#1e3a8a');

  // Economy & Progression
  const [energy, setEnergy] = useState<number>(INITIAL_ENERGY);
  const energyRef = useRef<number>(INITIAL_ENERGY);
  const lastEnergySyncRef = useRef<number>(0);
  const [coins, setCoins] = useState<number>(120);
  const [pixelsCurrency, setPixelsCurrency] = useState<number>(30);
  const [xp, setXp] = useState<number>(0);

  // Map state ('farm' | 'terravilla')
  const [currentMap, setCurrentMap] = useState<'farm' | 'terravilla'>('farm');
  const currentMapRef = useRef<'farm' | 'terravilla'>('farm');
  currentMapRef.current = currentMap;

  // Inventory (first 8 are hotbar)
  const [inventory, setInventory] = useState<InventorySlot[]>([
    { itemId: 'hoe', count: 1 },
    { itemId: 'water_can', count: 1 },
    { itemId: 'axe', count: 1 },
    { itemId: 'shears', count: 1 },
    { itemId: 'popberry_seed', count: 12 },
    { itemId: 'carrot_seed', count: 6 },
    { itemId: 'fertilizer', count: 4 },
    { itemId: 'popberry_tart', count: 2 },
  ]);
  const inventoryRef = useRef<InventorySlot[]>(inventory);
  inventoryRef.current = inventory;

  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);
  const activeSlotIndexRef = useRef<number>(0);
  activeSlotIndexRef.current = activeSlotIndex;

  const playerNameRef = useRef(playerName);
  playerNameRef.current = playerName;
  const hairColorRef = useRef(hairColor);
  hairColorRef.current = hairColor;
  const shirtColorRef = useRef(shirtColor);
  shirtColorRef.current = shirtColor;
  const pantsColorRef = useRef(pantsColor);
  pantsColorRef.current = pantsColor;

  // Quests
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [activeQuestIndex, setActiveQuestIndex] = useState<number>(0);

  // Modals & Tutorial
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isCraftingOpen, setIsCraftOpen] = useState(false);
  const [isBackpackOpen, setIsBackpackOpen] = useState(false);
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [isTutorialActive, setIsTutorialActive] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(0);

  // MMO Chat messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'Satoshi_Farmer', text: 'Selling 50 fresh Popberries at Hazel’s store! 🍓', isPlayer: false, timestamp: Date.now() - 40000 },
    { id: '2', sender: 'Farmer Barney', text: 'Till the rich fields and water your crops daily, friends!', isPlayer: false, timestamp: Date.now() - 20000 },
    { id: '3', sender: 'CryptoQueen', text: 'The hot springs sauna in Terra Villa regenerates full energy ♨️', isPlayer: false, timestamp: Date.now() - 8000 },
    { id: '4', sender: 'WoodcutterTom', text: 'Pine and Golden trees in the south grove give tons of wood! 🪵', isPlayer: false, timestamp: Date.now() - 2000 },
  ]);

  // Canvas DOM ref & Simulation Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game Engine Mutable State Refs
  // Initial spawn near farmhouse on 70x50 map
  const playerPosRef = useRef({ x: 34 * TILE_SIZE, y: 22 * TILE_SIZE });
  const [playerPosState, setPlayerPosState] = useState({ x: 34 * TILE_SIZE, y: 22 * TILE_SIZE });
  const playerDirRef = useRef<'up' | 'down' | 'left' | 'right'>('down');
  const playerMovingRef = useRef(false);
  const playerSwingRef = useRef(0);
  const playerSpeechRef = useRef<{ text: string; expiresAt: number } | null>(null);

  // Auto-walk path destination & queued interaction
  const targetDestinationRef = useRef<{
    x: number;
    y: number;
    queuedAction?: () => void;
    range?: number;
  } | null>(null);

  // Mouse hover targeting
  const hoverTargetRef = useRef<HoverTarget | null>(null);

  const keysPressed = useRef<Set<string>>(new Set());
  const cameraRef = useRef<Camera>({ x: 34 * TILE_SIZE, y: 22 * TILE_SIZE, zoom: 1.4 });

  // Floating text particles
  const floatingTextsRef = useRef<FloatingText[]>([]);

  // 48 Farm Plots (2 distinct fields on the 70x50 big ground)
  const plotsRef = useRef<FarmPlot[]>([]);
  if (plotsRef.current.length === 0) {
    const initPlots: FarmPlot[] = [];
    // West Plots Field (4 rows x 6 cols)
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 6; c++) {
        initPlots.push({
          id: `w_plot_${r}_${c}`,
          x: 12 + c * 2,
          y: 14 + r * 2,
          isTilled: false,
          cropId: null,
          plantedAt: 0,
          isWatered: false,
          wateredAt: 0,
          stage: 0,
        });
      }
    }
    // East Plots Field (4 rows x 6 cols)
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 6; c++) {
        initPlots.push({
          id: `e_plot_${r}_${c}`,
          x: 44 + c * 2,
          y: 14 + r * 2,
          isTilled: false,
          cropId: null,
          plantedAt: 0,
          isWatered: false,
          wateredAt: 0,
          stage: 0,
        });
      }
    }
    plotsRef.current = initPlots;
  }

  // 10 Trees in the Orchard
  const treesRef = useRef<TreeEntity[]>([
    { id: 't1', x: 12 * TILE_SIZE, y: 32 * TILE_SIZE, hp: 3, maxHp: 3, type: 'fruit', hasFruit: true },
    { id: 't2', x: 16 * TILE_SIZE, y: 32 * TILE_SIZE, hp: 3, maxHp: 3, type: 'oak', hasFruit: false },
    { id: 't3', x: 20 * TILE_SIZE, y: 32 * TILE_SIZE, hp: 4, maxHp: 4, type: 'pine', hasFruit: false },
    { id: 't4', x: 24 * TILE_SIZE, y: 32 * TILE_SIZE, hp: 5, maxHp: 5, type: 'golden', hasFruit: true },
    { id: 't5', x: 12 * TILE_SIZE, y: 38 * TILE_SIZE, hp: 3, maxHp: 3, type: 'oak', hasFruit: false },
    { id: 't6', x: 16 * TILE_SIZE, y: 38 * TILE_SIZE, hp: 3, maxHp: 3, type: 'fruit', hasFruit: true },
    { id: 't7', x: 20 * TILE_SIZE, y: 38 * TILE_SIZE, hp: 4, maxHp: 4, type: 'pine', hasFruit: false },
    { id: 't8', x: 24 * TILE_SIZE, y: 38 * TILE_SIZE, hp: 3, maxHp: 3, type: 'fruit', hasFruit: true },
    { id: 't9', x: 14 * TILE_SIZE, y: 44 * TILE_SIZE, hp: 4, maxHp: 4, type: 'pine', hasFruit: false },
    { id: 't10', x: 22 * TILE_SIZE, y: 44 * TILE_SIZE, hp: 5, maxHp: 5, type: 'golden', hasFruit: true },
  ]);

  // 6 Chickens in East Pasture
  const chickensRef = useRef<ChickenEntity[]>([
    { id: 'c1', name: 'Henrietta', x: 50 * TILE_SIZE, y: 32 * TILE_SIZE, targetX: 50 * TILE_SIZE, targetY: 32 * TILE_SIZE, hunger: 100, hasEgg: true, direction: 'left', lastMoved: 0 },
    { id: 'c2', name: 'Penny', x: 54 * TILE_SIZE, y: 34 * TILE_SIZE, targetX: 54 * TILE_SIZE, targetY: 34 * TILE_SIZE, hunger: 100, hasEgg: false, direction: 'right', lastMoved: 0 },
    { id: 'c3', name: 'Clucky', x: 58 * TILE_SIZE, y: 32 * TILE_SIZE, targetX: 58 * TILE_SIZE, targetY: 32 * TILE_SIZE, hunger: 100, hasEgg: true, direction: 'left', lastMoved: 0 },
    { id: 'c4', name: 'Daisy', x: 51 * TILE_SIZE, y: 37 * TILE_SIZE, targetX: 51 * TILE_SIZE, targetY: 37 * TILE_SIZE, hunger: 100, hasEgg: false, direction: 'right', lastMoved: 0 },
    { id: 'c5', name: 'Goldie', x: 56 * TILE_SIZE, y: 38 * TILE_SIZE, targetX: 56 * TILE_SIZE, targetY: 38 * TILE_SIZE, hunger: 100, hasEgg: true, direction: 'left', lastMoved: 0 },
    { id: 'c6', name: 'Peep', x: 60 * TILE_SIZE, y: 36 * TILE_SIZE, targetX: 60 * TILE_SIZE, targetY: 36 * TILE_SIZE, hunger: 100, hasEgg: false, direction: 'right', lastMoved: 0 },
  ]);

  // Simulated MMO Remote Players
  const remotePlayersRef = useRef<RemotePlayer[]>([
    {
      id: 'rp1',
      name: 'BerryMaster',
      x: 38 * TILE_SIZE,
      y: 20 * TILE_SIZE,
      targetX: 42 * TILE_SIZE,
      targetY: 22 * TILE_SIZE,
      direction: 'right',
      isMoving: false,
      colorHair: '#dc2626',
      colorShirt: '#10b981',
      colorPants: '#374151',
      speechText: 'Nice 48-plot farm!',
      speechExpiresAt: Date.now() + 60000,
    },
    {
      id: 'rp2',
      name: 'PixelWanderer',
      x: 32 * TILE_SIZE,
      y: 26 * TILE_SIZE,
      targetX: 36 * TILE_SIZE,
      targetY: 26 * TILE_SIZE,
      direction: 'left',
      isMoving: true,
      colorHair: '#5c381c',
      colorShirt: '#f59e0b',
      colorPants: '#1e3a8a',
    },
    {
      id: 'rp3',
      name: 'LunaGamer',
      x: 28 * TILE_SIZE,
      y: 22 * TILE_SIZE,
      targetX: 28 * TILE_SIZE,
      targetY: 25 * TILE_SIZE,
      direction: 'down',
      isMoving: false,
      colorHair: '#a855f7',
      colorShirt: '#ec4899',
      colorPants: '#065f46',
    },
    {
      id: 'rp4',
      name: 'TerraKnight',
      x: 44 * TILE_SIZE,
      y: 26 * TILE_SIZE,
      targetX: 46 * TILE_SIZE,
      targetY: 28 * TILE_SIZE,
      direction: 'right',
      isMoving: false,
      colorHair: '#60a5fa',
      colorShirt: '#475569',
      colorPants: '#1e293b',
      speechText: 'Heading to Hazel’s store 🛍️',
      speechExpiresAt: Date.now() + 75000,
    },
    {
      id: 'rp5',
      name: 'CozyBaker',
      x: 34 * TILE_SIZE,
      y: 16 * TILE_SIZE,
      targetX: 36 * TILE_SIZE,
      targetY: 14 * TILE_SIZE,
      direction: 'up',
      isMoving: true,
      colorHair: '#f59e0b',
      colorShirt: '#e11d48',
      colorPants: '#78350f',
    },
  ]);

  // Load Saved Game from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVE_STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.energy) {
          setEnergy(data.energy);
          energyRef.current = data.energy;
        }
        if (data.coins) setCoins(data.coins);
        if (data.pixelsCurrency) setPixelsCurrency(data.pixelsCurrency);
        if (data.xp) setXp(data.xp);
        if (data.inventory) {
          setInventory(data.inventory);
          inventoryRef.current = data.inventory;
        }
        if (data.plots && Array.isArray(data.plots) && data.plots.length > 0) {
          plotsRef.current = data.plots;
        }
      }
    } catch (e) {
      console.warn('Could not parse saved game', e);
    }
  }, []);

  // Periodic Save Game to localStorage (every 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const savePayload = {
          energy: Math.round(energyRef.current),
          coins,
          pixelsCurrency,
          xp,
          inventory: inventoryRef.current,
          plots: plotsRef.current,
        };
        localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(savePayload));
      } catch (e) {
        // quota ignore
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [coins, pixelsCurrency, xp]);

  // Sync document.body.dataset.state with game state
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Check for ?autostart=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      const skipTutorial = params.get('skiptutorial') === '1';
      handleStartGame({
        name: 'PixelFarmer',
        hairColor: '#ffcc80',
        shirtColor: '#3b82f6',
        pantsColor: '#1e3a8a',
        enableTutorial: !skipTutorial,
      });
    }
  }, []);

  const addFloatingText = (x: number, y: number, text: string, color: string = '#fef08a') => {
    floatingTextsRef.current.push({
      id: Math.random().toString(),
      x,
      y,
      text,
      color,
      createdAt: Date.now(),
      duration: 1300,
    });
  };

  const handleStartGame = (custom: {
    name: string;
    hairColor: string;
    shirtColor: string;
    pantsColor: string;
    enableTutorial: boolean;
  }) => {
    setPlayerName(custom.name);
    setHairColor(custom.hairColor);
    setShirtColor(custom.shirtColor);
    setPantsColor(custom.pantsColor);
    setIsTutorialActive(custom.enableTutorial);
    setTutorialStep(0);
    setGameState('playing');
  };

  const handleTutorialNext = () => {
    const res = getNextTutorialStep(tutorialStep, TUTORIAL_STEPS.length);
    if (res.isCompleted) {
      setIsTutorialActive(false);
      sounds.playFanfare();
      addFloatingText(playerPosRef.current.x, playerPosRef.current.y - 25, 'Tutorial Completed! 🎉', '#4ade80');
    } else {
      setTutorialStep(res.nextStep);
    }
  };

  const handleTutorialPrev = () => {
    setTutorialStep(getPrevTutorialStep(tutorialStep));
  };

  const handleTutorialSkip = () => {
    setIsTutorialActive(false);
    sounds.playCoin();
    addFloatingText(playerPosRef.current.x, playerPosRef.current.y - 25, 'Tutorial Skipped 🌾', '#fbbf24');
  };

  const handleOpenTutorial = () => {
    setIsTutorialActive(true);
    setTutorialStep(0);
    sounds.playCoin();
  };

  const activeQuest = quests[activeQuestIndex] || null;

  const triggerQuestAction = (type: Quest['targetType'], count: number = 1) => {
    if (!activeQuest || activeQuest.completed) return;
    const res = advanceQuest(activeQuest, type, count);
    if (res.justCompleted) {
      sounds.playFanfare();
      addFloatingText(playerPosRef.current.x, playerPosRef.current.y - 20, 'QUEST COMPLETE! 📜', '#4ade80');
    }
    setQuests((prev) =>
      prev.map((q, idx) => (idx === activeQuestIndex ? res.quest : q))
    );
  };

  const handleClaimReward = (questId: string) => {
    const targetQ = quests.find((q) => q.id === questId);
    if (!targetQ || !targetQ.completed) return;

    setCoins((c) => c + targetQ.rewardCoins);
    setXp((x) => x + targetQ.rewardXp);

    if (targetQ.rewardItems) {
      let cur = [...inventory];
      for (const rew of targetQ.rewardItems) {
        const addRes = addToInventory(cur, rew.itemId, rew.count);
        cur = addRes.newInventory;
      }
      setInventory(cur);
    }

    addFloatingText(
      playerPosRef.current.x,
      playerPosRef.current.y - 30,
      `+${targetQ.rewardCoins}c +${targetQ.rewardXp}XP`,
      '#ffd700'
    );

    if (activeQuestIndex + 1 < quests.length) {
      setActiveQuestIndex((i) => i + 1);
    }
    setIsQuestModalOpen(false);
  };

  // Keyboard navigation & Shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;

      const code = e.code;
      const key = e.key;

      if (code === 'KeyW' || code === 'ArrowUp') {
        keysPressed.current.add('up');
        targetDestinationRef.current = null; // Keyboard cancels auto-walk
      }
      if (code === 'KeyS' || code === 'ArrowDown') {
        keysPressed.current.add('down');
        targetDestinationRef.current = null;
      }
      if (code === 'KeyA' || code === 'ArrowLeft') {
        keysPressed.current.add('left');
        targetDestinationRef.current = null;
      }
      if (code === 'KeyD' || code === 'ArrowRight') {
        keysPressed.current.add('right');
        targetDestinationRef.current = null;
      }

      // Hotbar selection 1-8
      if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(key)) {
        const slotIdx = parseInt(key, 10) - 1;
        setActiveSlotIndex(slotIdx);
      }

      // Quick Key shortcuts
      if (code === 'KeyE' || code === 'KeyB') {
        setIsBackpackOpen((o) => !o);
      }
      if (code === 'KeyC') {
        setIsCraftOpen((o) => !o);
      }
      if (code === 'KeyM') {
        const muted = sounds.toggleMute();
        setIsMuted(muted);
      }
      if (code === 'KeyH') {
        setIsHelpOpen((o) => !o);
      }
      if (code === 'KeyT') {
        setIsTutorialActive((a) => !a);
      }
      if (code === 'KeyQ') {
        setIsQuestModalOpen((o) => !o);
      }
      if (code === 'Escape') {
        if (isTutorialActive) {
          setIsTutorialActive(false);
          sounds.playCoin();
          addFloatingText(playerPosRef.current.x, playerPosRef.current.y - 25, 'Tutorial Skipped 🌾', '#fbbf24');
          return;
        }
        setIsStoreOpen(false);
        setIsCraftOpen(false);
        setIsBackpackOpen(false);
        setIsQuestModalOpen(false);
        setIsHelpOpen(false);
      }

      // Action / Spacebar
      if (code === 'Space') {
        e.preventDefault();
        performInteraction();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') keysPressed.current.delete('up');
      if (code === 'KeyS' || code === 'ArrowDown') keysPressed.current.delete('down');
      if (code === 'KeyA' || code === 'ArrowLeft') keysPressed.current.delete('left');
      if (code === 'KeyD' || code === 'ArrowRight') keysPressed.current.delete('right');
    };

    const onBlur = () => {
      keysPressed.current.clear();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [inventory, activeSlotIndex, currentMap, energy, isTutorialActive]);

  // Main Action interaction (tilling, planting, watering, harvesting, chopping, collecting eggs, NPCs)
  const performInteraction = (clickX?: number, clickY?: number) => {
    const px = playerPosRef.current.x;
    const py = playerPosRef.current.y;
    const dir = playerDirRef.current;

    let targetX = clickX !== undefined ? clickX : px;
    let targetY = clickY !== undefined ? clickY : py;

    if (clickX === undefined || clickY === undefined) {
      if (dir === 'up') targetY -= TILE_SIZE;
      if (dir === 'down') targetY += TILE_SIZE;
      if (dir === 'left') targetX -= TILE_SIZE;
      if (dir === 'right') targetX += TILE_SIZE;
    } else {
      const dx = targetX - px;
      const dy = targetY - py;
      if (Math.abs(dx) > Math.abs(dy)) {
        playerDirRef.current = dx > 0 ? 'right' : 'left';
      } else {
        playerDirRef.current = dy > 0 ? 'down' : 'up';
      }
    }

    playerSwingRef.current = 1.0;

    const activeSlot = inventory[activeSlotIndex];
    const activeItem = activeSlot ? ITEMS[activeSlot.itemId] : null;

    if (currentMap === 'farm') {
      // 1. Check Chickens in range
      for (const chick of chickensRef.current) {
        const dist = Math.hypot(chick.x - targetX, chick.y - targetY);
        if (dist < 36 && chick.hasEgg) {
          chick.hasEgg = false;
          sounds.playHarvest();
          const addRes = addToInventory(inventory, 'egg', 1);
          setInventory(addRes.newInventory);
          setXp((x) => x + 15);
          addFloatingText(chick.x, chick.y - 12, '+1 Fresh Egg 🥚', '#fef08a');
          triggerQuestAction('harvest', 1);
          return;
        }
      }

      // 2. Check Trees in orchard
      for (const tree of treesRef.current) {
        const dist = Math.hypot(tree.x - targetX, tree.y - targetY);
        if (dist < 46) {
          if (activeItem?.id === 'axe') {
            const eRes = consumeEnergy(energyRef.current, 3);
            if (!eRes.success) {
              addFloatingText(px, py - 20, 'Not enough Energy! ⚡', '#f87171');
              return;
            }
            energyRef.current = eRes.newEnergy;
            setEnergy(eRes.newEnergy);
            sounds.playChop();
            tree.hp -= 1;
            addFloatingText(tree.x, tree.y - 20, '-3 ⚡', '#fbbf24');

            if (tree.hp <= 0) {
              sounds.playHarvest();
              tree.hp = tree.maxHp;
              const woodCount = tree.type === 'golden' ? 4 : 2;
              const addRes = addToInventory(inventory, 'wood', woodCount);
              setInventory(addRes.newInventory);
              setXp((x) => x + 30);
              addFloatingText(tree.x, tree.y - 30, `+${woodCount} Wood Logs 🪵`, '#4ade80');
              triggerQuestAction('chop', 1);
            }
            return;
          } else {
            addFloatingText(px, py - 20, 'Equip Woodcutter Axe [3]! 🪓', '#fcd34d');
            return;
          }
        }
      }

      // 3. Check Farm Plots
      for (const plot of plotsRef.current) {
        const plotPx = plot.x * TILE_SIZE;
        const plotPy = plot.y * TILE_SIZE;
        const dist = Math.hypot(plotPx + TILE_SIZE / 2 - targetX, plotPy + TILE_SIZE / 2 - targetY);

        if (dist < TILE_SIZE * 1.4) {
          // A. If mature harvestable crop
          if (plot.cropId && plot.stage === 3) {
            const cropItem = ITEMS[plot.cropId];
            const harvestItemId = cropItem.harvestItemId || 'popberry';
            sounds.playHarvest();

            const addRes = addToInventory(inventory, harvestItemId, 1);
            setInventory(addRes.newInventory);
            setXp((x) => x + (cropItem.xpGain || 15));

            addFloatingText(plotPx + 16, plotPy - 10, `+1 ${ITEMS[harvestItemId].name}! 🍓`, '#4ade80');
            addFloatingText(plotPx + 16, plotPy + 6, `+${cropItem.xpGain || 15} XP`, '#a78bfa');

            // Reset plot
            plot.cropId = null;
            plot.stage = 0;
            plot.isWatered = false;
            plot.plantedAt = 0;

            triggerQuestAction('harvest', 1);
            return;
          }

          // B. Till soil with Hoe
          if (!plot.isTilled && activeItem?.id === 'hoe') {
            const eRes = consumeEnergy(energyRef.current, 2);
            if (!eRes.success) {
              addFloatingText(px, py - 20, 'Not enough Energy! ⚡', '#f87171');
              return;
            }
            energyRef.current = eRes.newEnergy;
            setEnergy(eRes.newEnergy);
            plot.isTilled = true;
            sounds.playTill();
            addFloatingText(plotPx + 16, plotPy - 10, 'Tilled! -2 ⚡', '#fbbf24');
            triggerQuestAction('till', 1);
            return;
          }

          // C. Plant seed
          if (plot.isTilled && !plot.cropId && activeItem?.category === 'seed') {
            const remRes = removeFromInventory(inventory, activeItem.id, 1);
            if (!remRes.success) return;

            setInventory(remRes.newInventory);
            plot.cropId = activeItem.id;
            plot.plantedAt = Date.now();
            plot.stage = 1;
            sounds.playPlant();
            addFloatingText(plotPx + 16, plotPy - 10, `Planted ${activeItem.name}! 🌱`, '#86efac');
            triggerQuestAction('plant', 1);
            return;
          }

          // D. Water with Watering Can
          if (plot.isTilled && plot.cropId && !plot.isWatered && activeItem?.id === 'water_can') {
            const eRes = consumeEnergy(energyRef.current, 1);
            if (!eRes.success) {
              addFloatingText(px, py - 20, 'Not enough Energy! ⚡', '#f87171');
              return;
            }
            energyRef.current = eRes.newEnergy;
            setEnergy(eRes.newEnergy);
            plot.isWatered = true;
            plot.wateredAt = Date.now();
            sounds.playWater();
            addFloatingText(plotPx + 16, plotPy - 10, 'Watered! -1 ⚡', '#38bdf8');
            triggerQuestAction('water', 1);
            return;
          }

          // E. Use Super Compost / Fertilizer
          if (plot.cropId && plot.stage < 3 && activeItem?.id === 'fertilizer') {
            const remRes = removeFromInventory(inventory, 'fertilizer', 1);
            if (remRes.success) {
              setInventory(remRes.newInventory);
              plot.stage = 3;
              sounds.playHarvest();
              addFloatingText(plotPx + 16, plotPy - 10, 'Instantly Matured! ✨', '#fef08a');
              return;
            }
          }
        }
      }

      // 4. Check NPC Farmer Barney
      const barneyX = 32 * TILE_SIZE;
      const barneyY = 22 * TILE_SIZE;
      if (Math.hypot(barneyX - targetX, barneyY - targetY) < 48) {
        sounds.playCoin();
        setIsQuestModalOpen(true);
        return;
      }

      // 5. Check Windmill (Crafting Bench)
      const windmillX = 52 * TILE_SIZE;
      const windmillY = 6 * TILE_SIZE;
      if (Math.hypot(windmillX - targetX, windmillY - targetY) < 64) {
        setIsCraftOpen(true);
        return;
      }

      // 6. Check Warp Portal to Terra Villa (South Entrance)
      const portalX = 33 * TILE_SIZE;
      const portalY = 45 * TILE_SIZE;
      if (Math.hypot(portalX - px, portalY - py) < 60) {
        setCurrentMap('terravilla');
        playerPosRef.current = { x: 33 * TILE_SIZE, y: 43 * TILE_SIZE };
        sounds.playFanfare();
        addFloatingText(33 * TILE_SIZE, 43 * TILE_SIZE, 'Welcome to Terra Villa!', '#e0e7ff');
        return;
      }
    } else {
      // In Terra Villa:
      // 1. Check Hazel's Store
      const hazelX = 52 * TILE_SIZE;
      const hazelY = 14 * TILE_SIZE;
      if (Math.hypot(hazelX - targetX, hazelY - targetY) < 56) {
        sounds.playCoin();
        setIsStoreOpen(true);
        return;
      }

      // 2. Check Bakery Karen (Crafting)
      const karenX = 18 * TILE_SIZE;
      const karenY = 14 * TILE_SIZE;
      if (Math.hypot(karenX - targetX, karenY - targetY) < 56) {
        setIsCraftOpen(true);
        return;
      }

      // 3. Check Ranger Dale (Quests)
      const daleX = 50 * TILE_SIZE;
      const daleY = 30 * TILE_SIZE;
      if (Math.hypot(daleX - targetX, daleY - targetY) < 56) {
        setIsQuestModalOpen(true);
        return;
      }

      // 4. Check Warp Portal back to Farm
      const portalX = 33 * TILE_SIZE;
      const portalY = 45 * TILE_SIZE;
      if (Math.hypot(portalX - px, portalY - py) < 60) {
        setCurrentMap('farm');
        playerPosRef.current = { x: 33 * TILE_SIZE, y: 43 * TILE_SIZE };
        sounds.playFanfare();
        addFloatingText(33 * TILE_SIZE, 43 * TILE_SIZE, 'Back to Farmstead!', '#86efac');
        return;
      }
    }
  };

  // Screen to World coordinates converter
  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { worldX: 0, worldY: 0 };
    const rect = canvas.getBoundingClientRect();
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;
    const worldX = (canvasX - canvas.width / 2) / cameraRef.current.zoom + cameraRef.current.x;
    const worldY = (canvasY - canvas.height / 2) / cameraRef.current.zoom + cameraRef.current.y;
    return { worldX, worldY };
  }, []);

  // Mouse Move: Track hover target for crisp cursor reticle & action badge
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { worldX, worldY } = screenToWorld(e.clientX, e.clientY);
    const tileX = Math.floor(worldX / TILE_SIZE);
    const tileY = Math.floor(worldY / TILE_SIZE);

    const activeSlot = inventoryRef.current[activeSlotIndexRef.current];
    const activeItem = activeSlot ? ITEMS[activeSlot.itemId] : null;

    let target: HoverTarget | null = null;

    if (currentMapRef.current === 'farm') {
      // Check Plots
      for (const plot of plotsRef.current) {
        const plotPx = plot.x * TILE_SIZE;
        const plotPy = plot.y * TILE_SIZE;
        if (
          worldX >= plotPx &&
          worldX < plotPx + TILE_SIZE &&
          worldY >= plotPy &&
          worldY < plotPy + TILE_SIZE
        ) {
          if (plot.cropId && plot.stage === 3) {
            target = {
              worldX,
              worldY,
              tileX: plot.x,
              tileY: plot.y,
              type: 'plot',
              label: `Harvest ${ITEMS[plot.cropId].name}! (+XP)`,
              isValidAction: true,
            };
          } else if (!plot.isTilled) {
            target = {
              worldX,
              worldY,
              tileX: plot.x,
              tileY: plot.y,
              type: 'plot',
              label: activeItem?.id === 'hoe' ? 'Till Soil (-2⚡)' : 'Equip Hoe to Till',
              isValidAction: activeItem?.id === 'hoe',
            };
          } else if (plot.isTilled && !plot.cropId) {
            target = {
              worldX,
              worldY,
              tileX: plot.x,
              tileY: plot.y,
              type: 'plot',
              label: activeItem?.category === 'seed' ? `Plant ${activeItem.name}` : 'Select Seeds to Plant',
              isValidAction: activeItem?.category === 'seed',
            };
          } else if (plot.isTilled && plot.cropId && !plot.isWatered) {
            target = {
              worldX,
              worldY,
              tileX: plot.x,
              tileY: plot.y,
              type: 'plot',
              label: activeItem?.id === 'water_can' ? 'Water Crop (-1⚡)' : 'Equip Can to Water',
              isValidAction: activeItem?.id === 'water_can',
            };
          } else if (plot.cropId && plot.stage < 3) {
            target = {
              worldX,
              worldY,
              tileX: plot.x,
              tileY: plot.y,
              type: 'plot',
              label: 'Growing... 🌱',
              isValidAction: false,
            };
          }
          break;
        }
      }

      // Check Trees
      if (!target) {
        for (const tree of treesRef.current) {
          if (Math.hypot(tree.x - worldX, tree.y - worldY) < 32) {
            target = {
              worldX,
              worldY,
              tileX: Math.floor(tree.x / TILE_SIZE),
              tileY: Math.floor(tree.y / TILE_SIZE),
              type: 'tree',
              label: activeItem?.id === 'axe' ? 'Chop Tree (-3⚡)' : 'Equip Axe [3] to Chop',
              isValidAction: activeItem?.id === 'axe',
            };
            break;
          }
        }
      }

      // Check Chickens
      if (!target) {
        for (const chick of chickensRef.current) {
          if (Math.hypot(chick.x - worldX, chick.y - worldY) < 24) {
            target = {
              worldX,
              worldY,
              tileX: Math.floor(chick.x / TILE_SIZE),
              tileY: Math.floor(chick.y / TILE_SIZE),
              type: 'chicken',
              label: chick.hasEgg ? 'Collect Egg 🥚' : `${chick.name || 'Chicken'} (Cluck!)`,
              isValidAction: chick.hasEgg,
            };
            break;
          }
        }
      }

      // Check Barney
      if (!target && Math.hypot(32 * TILE_SIZE - worldX, 22 * TILE_SIZE - worldY) < 36) {
        target = {
          worldX,
          worldY,
          tileX: 32,
          tileY: 22,
          type: 'npc',
          label: 'Farmer Barney (Quests)',
          isValidAction: true,
        };
      }
    } else {
      // In Terra Villa
      // Check Sauna Hot Springs
      const saunaX = 8 * TILE_SIZE;
      const saunaY = 28 * TILE_SIZE;
      if (
        worldX >= saunaX &&
        worldX <= saunaX + 8 * TILE_SIZE &&
        worldY >= saunaY &&
        worldY <= saunaY + 6 * TILE_SIZE
      ) {
        target = {
          worldX,
          worldY,
          tileX: Math.floor(saunaX / TILE_SIZE),
          tileY: Math.floor(saunaY / TILE_SIZE),
          type: 'sauna',
          label: '♨️ Relax in Hot Springs (+40⚡/s)',
          isValidAction: true,
        };
      }

      // Check Hazel
      if (!target && Math.hypot(52 * TILE_SIZE - worldX, 14 * TILE_SIZE - worldY) < 40) {
        target = {
          worldX,
          worldY,
          tileX: 52,
          tileY: 14,
          type: 'npc',
          label: 'Hazel (General Store)',
          isValidAction: true,
        };
      }

      // Check Karen
      if (!target && Math.hypot(18 * TILE_SIZE - worldX, 14 * TILE_SIZE - worldY) < 40) {
        target = {
          worldX,
          worldY,
          tileX: 18,
          tileY: 14,
          type: 'npc',
          label: 'Baker Karen (Bakery Crafting)',
          isValidAction: true,
        };
      }
    }

    // Default tile
    if (!target) {
      target = {
        worldX,
        worldY,
        tileX,
        tileY,
        type: 'ground',
        label: '',
        isValidAction: false,
      };
    }

    hoverTargetRef.current = target;
  };

  // Canvas Click: Smart Auto-Walk & Perform Action
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { worldX, worldY } = screenToWorld(e.clientX, e.clientY);
    const px = playerPosRef.current.x;
    const py = playerPosRef.current.y;

    sounds.playStep();

    // If already within reach (under 60px): execute immediately!
    if (Math.hypot(worldX - px, worldY - py) < 60) {
      targetDestinationRef.current = null;
      performInteraction(worldX, worldY);
      return;
    }

    // Otherwise, auto-walk towards target and queue interaction upon arrival!
    targetDestinationRef.current = {
      x: worldX,
      y: worldY,
      range: 52,
      queuedAction: () => {
        performInteraction(worldX, worldY);
      },
    };
  };

  // Minimap Click: Auto-walk to that world coordinate
  const handleMinimapClick = (destX: number, destY: number) => {
    sounds.playStep();
    targetDestinationRef.current = {
      x: destX,
      y: destY,
      range: 16,
    };
    addFloatingText(destX, destY - 15, 'Walking here... 🚶', '#fcd34d');
  };

  // 60 FPS Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const frameInterval = 28; // ~35 FPS
      if (currentTime - lastTime < frameInterval) {
        animId = requestAnimationFrame(loop);
        return;
      }
      const rawDt = (currentTime - lastTime) / 1000;
      const dt = Math.min(rawDt, 0.05);
      lastTime = currentTime;

      // 1. Movement Physics (Keyboard OR Smart Auto-Walk)
      let vx = 0;
      let vy = 0;

      if (keysPressed.current.has('up')) vy -= 1;
      if (keysPressed.current.has('down')) vy += 1;
      if (keysPressed.current.has('left')) vx -= 1;
      if (keysPressed.current.has('right')) vx -= 1;

      const hasManualInput = vx !== 0 || vy !== 0;

      if (hasManualInput) {
        targetDestinationRef.current = null;
      } else if (targetDestinationRef.current) {
        // Auto-walk towards target destination
        const dest = targetDestinationRef.current;
        const dx = dest.x - playerPosRef.current.x;
        const dy = dest.y - playerPosRef.current.y;
        const dist = Math.hypot(dx, dy);
        const reachRange = dest.range || 20;

        if (dist <= reachRange) {
          // Arrived!
          if (dest.queuedAction) {
            dest.queuedAction();
          }
          targetDestinationRef.current = null;
        } else {
          vx = dx / dist;
          vy = dy / dist;
        }
      }

      const isMoving = vx !== 0 || vy !== 0;
      playerMovingRef.current = isMoving;

      if (isMoving) {
        const len = Math.hypot(vx, vy);
        const speed = 150 * dt; // 150 px/s
        playerPosRef.current.x += (vx / len) * speed;
        playerPosRef.current.y += (vy / len) * speed;

        if (Math.abs(vx) > Math.abs(vy)) {
          playerDirRef.current = vx > 0 ? 'right' : 'left';
        } else {
          playerDirRef.current = vy > 0 ? 'down' : 'up';
        }
      }

      // Clamp player inside 70x50 world bounds
      const maxW = (WORLD_WIDTH_TILES - 2) * TILE_SIZE;
      const maxH = (WORLD_HEIGHT_TILES - 2) * TILE_SIZE;
      playerPosRef.current.x = Math.max(48, Math.min(maxW, playerPosRef.current.x));
      playerPosRef.current.y = Math.max(48, Math.min(maxH, playerPosRef.current.y));

      // Tool swing decay
      if (playerSwingRef.current > 0) {
        playerSwingRef.current = Math.max(0, playerSwingRef.current - dt * 4);
      }

      // Rapid Energy Regeneration in Terra Villa Sauna Hot Springs
      if (currentMapRef.current === 'terravilla') {
        const saunaX = 8 * TILE_SIZE;
        const saunaY = 28 * TILE_SIZE;
        const inSauna =
          playerPosRef.current.x >= saunaX &&
          playerPosRef.current.x <= saunaX + 8 * TILE_SIZE &&
          playerPosRef.current.y >= saunaY &&
          playerPosRef.current.y <= saunaY + 6 * TILE_SIZE;

        if (inSauna) {
          energyRef.current = replenishEnergy(energyRef.current, dt * 45, MAX_ENERGY);
        }
      }

      // Passive energy regen
      energyRef.current = replenishEnergy(energyRef.current, dt * ENERGY_REGEN_PER_SECOND, MAX_ENERGY);

      // Throttled React state sync for energy & player position
      if (currentTime - lastEnergySyncRef.current > 600) {
        lastEnergySyncRef.current = currentTime;
        setEnergy(Math.round(energyRef.current));
        setPlayerPosState({ x: playerPosRef.current.x, y: playerPosRef.current.y });
      }

      // 2. Crop Growth Simulation
      for (const plot of plotsRef.current) {
        if (plot.cropId && plot.stage > 0 && plot.stage < 3) {
          const item = ITEMS[plot.cropId];
          const growTime = item.growTimeSeconds || 10;
          const stage = calculateGrowthStage(plot.plantedAt, currentTime, growTime, plot.isWatered);
          plot.stage = stage;
        }
      }

      // 3. Smooth Camera Tracking
      const cam = cameraRef.current;
      cam.x += (playerPosRef.current.x - cam.x) * 0.1;
      cam.y += (playerPosRef.current.y - cam.y) * 0.1;

      // 4. Update Remote MMO players simulated wandering
      for (const rp of remotePlayersRef.current) {
        const rDist = Math.hypot(rp.targetX - rp.x, rp.targetY - rp.y);
        if (rDist > 4) {
          rp.isMoving = true;
          rp.x += ((rp.targetX - rp.x) / rDist) * 45 * dt;
          rp.y += ((rp.targetY - rp.y) / rDist) * 45 * dt;
        } else {
          rp.isMoving = false;
          if (Math.random() < 0.01) {
            rp.targetX = rp.x + (Math.random() - 0.5) * 160;
            rp.targetY = rp.y + (Math.random() - 0.5) * 160;
          }
        }
      }

      // 5. Render World to Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const activeSlot = inventoryRef.current[activeSlotIndexRef.current];
          const activeItem = activeSlot ? ITEMS[activeSlot.itemId] : null;

          const playerRenderState: PlayerRenderState = {
            x: playerPosRef.current.x,
            y: playerPosRef.current.y,
            direction: playerDirRef.current,
            isMoving: playerMovingRef.current,
            name: playerNameRef.current,
            hairColor: hairColorRef.current,
            shirtColor: shirtColorRef.current,
            pantsColor: pantsColorRef.current,
            swingProgress: playerSwingRef.current,
            activeToolIcon: activeItem?.icon,
            destinationMarker: targetDestinationRef.current
              ? { x: targetDestinationRef.current.x, y: targetDestinationRef.current.y }
              : null,
            hoverTarget: hoverTargetRef.current,
            speechText:
              playerSpeechRef.current && Date.now() < playerSpeechRef.current.expiresAt
                ? playerSpeechRef.current.text
                : undefined,
          };

          drawPixelWorld(
            ctx,
            canvas.width,
            canvas.height,
            cam,
            currentMapRef.current,
            plotsRef.current,
            treesRef.current,
            chickensRef.current,
            playerRenderState,
            remotePlayersRef.current,
            floatingTextsRef.current,
            currentTime
          );
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Shop Handlers
  const handleBuy = (itemId: string, quantity: number, totalCost: number) => {
    if (coins < totalCost) return;
    setCoins((c) => c - totalCost);
    const addRes = addToInventory(inventory, itemId, quantity);
    setInventory(addRes.newInventory);
    addFloatingText(playerPosRef.current.x, playerPosRef.current.y - 20, `-${totalCost} Coins`, '#ef4444');
  };

  const handleSell = (itemId: string, quantity: number, totalRevenue: number) => {
    const remRes = removeFromInventory(inventory, itemId, quantity);
    if (!remRes.success) return;
    setInventory(remRes.newInventory);
    setCoins((c) => c + totalRevenue);
    addFloatingText(playerPosRef.current.x, playerPosRef.current.y - 20, `+${totalRevenue} Coins! 🪙`, '#4ade80');
    triggerQuestAction('sell', quantity);
  };

  // Crafting Handler
  const handleCraft = (recipe: CraftingRecipe) => {
    let curInv = [...inventory];
    for (const req of recipe.requiredItems) {
      const remRes = removeFromInventory(curInv, req.itemId, req.count);
      curInv = remRes.newInventory;
    }
    const addRes = addToInventory(curInv, recipe.resultItemId, recipe.resultCount);
    setInventory(addRes.newInventory);
    setEnergy((e) => Math.max(0, e - recipe.energyCost));
    setXp((x) => x + 35);
    addFloatingText(playerPosRef.current.x, playerPosRef.current.y - 25, `Crafted ${recipe.name}!`, '#fef08a');
  };

  // Direct Food & Energy consumption
  const handleUseItem = (itemId: string) => {
    const itm = ITEMS[itemId];
    if (itm?.energyRestore) {
      const remRes = removeFromInventory(inventory, itemId, 1);
      if (remRes.success) {
        sounds.playEat();
        setInventory(remRes.newInventory);
        energyRef.current = replenishEnergy(energyRef.current, itm.energyRestore, MAX_ENERGY);
        setEnergy(Math.round(energyRef.current));
        addFloatingText(playerPosRef.current.x, playerPosRef.current.y - 20, `+${itm.energyRestore} Energy ⚡`, '#4ade80');
      }
    }
  };

  // Chat sender
  const handleSendMessage = (text: string) => {
    const newMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: playerName,
      text,
      isPlayer: true,
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, newMsg]);
    playerSpeechRef.current = { text, expiresAt: Date.now() + 5000 };
  };

  // Fast Travel between maps
  const handleSwitchMap = () => {
    const nextMap = currentMap === 'farm' ? 'terravilla' : 'farm';
    setCurrentMap(nextMap);
    playerPosRef.current = { x: 34 * TILE_SIZE, y: 25 * TILE_SIZE };
    targetDestinationRef.current = null;
    sounds.playFanfare();
    addFloatingText(34 * TILE_SIZE, 25 * TILE_SIZE, nextMap === 'farm' ? 'Warped to Farmstead!' : 'Warped to Terra Villa!', '#86efac');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0d131a] select-none">
      {/* Title Screen Overlay */}
      {gameState === 'title' && <TitleScreen onStart={handleStartGame} />}

      {/* 2D Pixel Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        className="w-full h-full block cursor-crosshair"
      />

      {/* World-Matched Game HUD */}
      {gameState === 'playing' && (
        <HUD
          playerName={playerName}
          hairColor={hairColor}
          shirtColor={shirtColor}
          energy={energy}
          coins={coins}
          pixelsCurrency={pixelsCurrency}
          xp={xp}
          currentMap={currentMap}
          inventory={inventory}
          activeSlotIndex={activeSlotIndex}
          activeQuest={activeQuest}
          chatMessages={chatMessages}
          isMuted={isMuted}
          playerPos={playerPosState}
          plots={plotsRef.current}
          onSelectSlot={(idx) => setActiveSlotIndex(idx)}
          onUseItem={handleUseItem}
          onToggleSound={() => {
            const muted = sounds.toggleMute();
            setIsMuted(muted);
          }}
          onSwitchMap={handleSwitchMap}
          onOpenStore={() => setIsStoreOpen(true)}
          onOpenCrafting={() => setIsCraftOpen(true)}
          onOpenBackpack={() => setIsBackpackOpen(true)}
          onOpenQuestLog={() => setIsQuestModalOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
          onOpenTutorial={handleOpenTutorial}
          onSendMessage={handleSendMessage}
          onMinimapClick={handleMinimapClick}
        />
      )}

      {/* Modals */}
      {isStoreOpen && (
        <ShopModal
          coins={coins}
          inventory={inventory}
          onClose={() => setIsStoreOpen(false)}
          onBuy={handleBuy}
          onSell={handleSell}
        />
      )}

      {isCraftingOpen && (
        <CraftingModal
          energy={energy}
          inventory={inventory}
          onClose={() => setIsCraftOpen(false)}
          onCraft={handleCraft}
        />
      )}

      {isBackpackOpen && (
        <BackpackModal
          inventory={inventory}
          onClose={() => setIsBackpackOpen(false)}
          onUseItem={handleUseItem}
        />
      )}

      {isQuestModalOpen && activeQuest && (
        <QuestModal
          quest={activeQuest}
          onClose={() => setIsQuestModalOpen(false)}
          onClaimReward={handleClaimReward}
        />
      )}

      {isHelpOpen && (
        <HelpModal
          onClose={() => setIsHelpOpen(false)}
          onStartTutorial={handleOpenTutorial}
        />
      )}

      {/* Interactive Tutorial with Skip Option */}
      {gameState === 'playing' && isTutorialActive && (
        <TutorialOverlay
          currentStep={tutorialStep}
          onNext={handleTutorialNext}
          onPrev={handleTutorialPrev}
          onSkip={handleTutorialSkip}
        />
      )}
    </div>
  );
}
