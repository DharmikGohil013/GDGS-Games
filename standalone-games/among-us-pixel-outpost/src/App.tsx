import React, { useEffect, useRef, useState } from 'react';
import { AdminTableModal } from './components/AdminTableModal.tsx';
import { EjectionScene } from './components/EjectionScene.tsx';
import { EmergencyMeetingModal } from './components/EmergencyMeetingModal.tsx';
import { GameHUD } from './components/GameHUD.tsx';
import { GameOverModal } from './components/GameOverModal.tsx';
import { PauseModal } from './components/PauseModal.tsx';
import { SabotageMapModal } from './components/SabotageMapModal.tsx';
import { SecurityCamsModal } from './components/SecurityCamsModal.tsx';
import { SkeldMinimapModal } from './components/SkeldMinimapModal.tsx';
import { AsteroidsTask } from './components/tasks/AsteroidsTask.tsx';
import { DivertPowerTask } from './components/tasks/DivertPowerTask.tsx';
import { ManifoldsTask } from './components/tasks/ManifoldsTask.tsx';
import { MedbayScanTask } from './components/tasks/MedbayScanTask.tsx';
import { ShieldsTask } from './components/tasks/ShieldsTask.tsx';
import { SwipeCardTask } from './components/tasks/SwipeCardTask.tsx';
import { WiresTask } from './components/tasks/WiresTask.tsx';
import { LobbyRoom } from './components/LobbyRoom.tsx';
import { RoleRevealIntro } from './components/RoleRevealIntro.tsx';
import { TitleScreen } from './components/TitleScreen.tsx';
import { audio } from './game/audio.ts';
import { updateBotAI } from './game/botAI.ts';
import {
  ADMIN_TABLE_POS,
  EMERGENCY_BUTTON_POS,
  getRoomAt,
  MAP_HEIGHT,
  MAP_WIDTH,
  SECURITY_CAMS_POS,
  TASKS,
  VENTS,
  WALL_COLLIDERS,
} from './game/mapData.ts';
import { PixelRenderer } from './game/pixelRenderer.ts';
import {
  calculateTaskProgress,
  canInteractWithVent,
  checkGameOutcome,
  findNearbyBody,
  findNearbyTask,
  findNearbyVent,
  getConnectedVents,
  getDistance,
} from './game/rules.ts';
import {
  DeadBody,
  GamePhase,
  GameSettings,
  Player,
  PlayerColor,
  PLAYER_COLORS,
  SabotageState,
  SabotageType,
  TaskDefinition,
  TaskInstance,
  VentNode,
} from './game/types.ts';

const BOT_NAMES = [
  'RedBot',
  'BlueBot',
  'Greeny',
  'Pinky',
  'OrangeBot',
  'YellowSub',
  'Blackout',
  'Whiteout',
  'PurplePro',
  'Cyanide',
  'Limey',
  'Brownie',
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
];

export default function App() {
  const [phase, setPhase] = useState<GamePhase>('title');
  const [settings, setSettings] = useState<GameSettings>({
    preferredRole: 'random',
    impostorCount: 1,
    playerSpeed: 175,
    killCooldownMax: 25,
    sabotageTimerMax: 60,
    meetingTimerMax: 45,
    timingPreset: 'standard',
    botDifficulty: 'pro',
    soundEnabled: true,
    playerColor: 'red',
  });

  // Core Game Entities stored in refs for 60fps simulation
  const playersRef = useRef<Player[]>([]);
  const deadBodiesRef = useRef<DeadBody[]>([]);
  const sabotageRef = useRef<SabotageState>({
    type: 'none',
    active: false,
    timer: 0,
    maxTimer: 60,
    fixedLeft: false,
    fixedRight: false,
  });
  const taskProgressRef = useRef<number>(0);
  const screenShakeRef = useRef<number>(0);
  const elapsedMatchTimeRef = useRef<number>(0);
  const [elapsedMatchTime, setElapsedMatchTime] = useState(0);

  // Active interaction states
  const [activeTaskDef, setActiveTaskDef] = useState<TaskDefinition | null>(null);
  const [showSabotageMap, setShowSabotageMap] = useState(false);
  const [showAdminTable, setShowAdminTable] = useState(false);
  const [showSecurityCams, setShowSecurityCams] = useState(false);
  const [showMinimap, setShowMinimap] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Meeting & Ejection state
  const [meetingReason, setMeetingReason] = useState<'emergency' | 'body'>('emergency');
  const [meetingReporterId, setMeetingReporterId] = useState<string | undefined>();
  const [meetingVictimBodyOf, setMeetingVictimBodyOf] = useState<string | undefined>();
  const [ejectedPlayer, setEjectedPlayer] = useState<Player | null>(null);
  const [ejectionWasTie, setEjectionWasTie] = useState(false);
  const [ejectionIsSkip, setEjectionIsSkip] = useState(false);

  // Game Outcome
  const [winner, setWinner] = useState<'crewmates' | 'impostors' | null>(null);
  const [winReason, setWinReason] = useState<string>('');

  // Emergency meeting cooldown
  const emergencyCooldownRef = useRef<number>(15);
  const [emergencyCooldown, setEmergencyCooldown] = useState<number>(15);
  const [playerDeathNotice, setPlayerDeathNotice] = useState<string | null>(null);

  // UI Mirror state (throttled updates for HUD)
  const [hudTick, setHudTick] = useState(0);

  // Handle window resizing to keep canvas pixel-sharp
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

  // Canvas & Input Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<PixelRenderer>(new PixelRenderer());
  const keysRef = useRef<Set<string>>(new Set());
  const cameraRef = useRef<{ x: number; y: number }>({ x: 1050, y: 340 });
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  // Set document.body.dataset.state for Ultra Mode verification
  useEffect(() => {
    let state = 'title';
    if (phase === 'playing' || phase === 'task_modal') {
      state = isPaused ? 'paused' : 'playing';
    } else if (phase === 'gameover') {
      state = 'gameover';
    }
    document.body.dataset.state = state;
  }, [phase, isPaused]);

  // Handle ?autostart=1 query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      initAndStartGame();
    }
  }, []);

  // Keyboard input listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);

      // Edge triggers
      if (e.code === 'KeyM') {
        audio.toggleSound();
        setSettings((prev) => ({ ...prev, soundEnabled: audio.enabled }));
      }
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (phase === 'playing') {
          setIsPaused((prev) => !prev);
        }
      }
      if (e.code === 'Tab') {
        if (phase === 'playing') {
          e.preventDefault();
          setShowMinimap((prev) => !prev);
        }
      }
      if (e.code === 'KeyE' || e.code === 'Space') {
        if (phase === 'playing' && !isPaused) {
          const local = playersRef.current.find((p) => !p.isBot);
          if (local && local.inVentId) {
            triggerExitVentAction();
          } else {
            triggerUseAction();
          }
        }
      }
      if (e.code === 'KeyR') {
        if (phase === 'playing' && !isPaused) {
          triggerReportAction();
        }
      }
      if (e.code === 'KeyQ') {
        if (phase === 'playing' && !isPaused) {
          triggerKillAction();
        }
      }
      if (e.code === 'KeyV') {
        if (phase === 'playing' && !isPaused) {
          triggerVentAction();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    const handleBlur = () => {
      keysRef.current.clear();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [phase, isPaused]);

  // Main Game Loop: 60fps simulation step and canvas rendering
  useEffect(() => {
    let active = true;

    const loop = (now: number) => {
      if (!active) return;

      const rawDt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      const dt = Math.min(rawDt, 0.05);

      const isAnyModalOpen =
        isPaused ||
        showSabotageMap ||
        showAdminTable ||
        showSecurityCams ||
        showMinimap ||
        !!activeTaskDef;

      if (phase === 'playing' && !isAnyModalOpen) {
        updateSimulation(dt);

        // Render Canvas
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          const localPlayer = playersRef.current.find((p) => !p.isBot);
          if (ctx && localPlayer) {
            rendererRef.current.render({
              canvas: canvasRef.current,
              ctx,
              camera: cameraRef.current,
              player: localPlayer,
              players: playersRef.current,
              deadBodies: deadBodiesRef.current,
              sabotage: sabotageRef.current,
              screenShake: screenShakeRef.current,
            });
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      active = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    phase,
    isPaused,
    showSabotageMap,
    showAdminTable,
    showSecurityCams,
    showMinimap,
    activeTaskDef,
  ]);

  // Periodic HUD throttled tick (every 350ms only during unpaused gameplay)
  useEffect(() => {
    if (phase !== 'playing' || isPaused || showSabotageMap || showAdminTable || showSecurityCams || showMinimap || activeTaskDef) {
      return;
    }
    const timer = setInterval(() => {
      setHudTick((t) => t + 1);
      setEmergencyCooldown(emergencyCooldownRef.current);
      setElapsedMatchTime(Math.floor(elapsedMatchTimeRef.current));
    }, 350);
    return () => clearInterval(timer);
  }, [phase, isPaused, showSabotageMap, showAdminTable, showSecurityCams, showMinimap, activeTaskDef]);

  /**
   * Initializes player and 9 smart bots on The Skeld
   */
  const initAndStartGame = () => {
    const assignedColors = [...ALL_COLORS].sort(() => Math.random() - 0.5);

    // Determine roles
    let playerIsImpostor = false;
    if (settings.preferredRole === 'impostor') {
      playerIsImpostor = true;
    } else if (settings.preferredRole === 'crewmate') {
      playerIsImpostor = false;
    } else {
      playerIsImpostor = Math.random() < 0.25;
    }

    const totalImpostors = settings.impostorCount;
    let botImpostorsNeeded = playerIsImpostor ? totalImpostors - 1 : totalImpostors;

    const initialPlayers: Player[] = [];

    // Local Player (spawns in Cafeteria south of table)
    const localColor = settings.playerColor || assignedColors[0];
    const botColorsPool = assignedColors.filter((c) => c !== localColor);

    initialPlayers.push({
      id: 'local_player',
      name: 'Player',
      color: localColor,
      role: playerIsImpostor ? 'impostor' : 'crewmate',
      x: 1050,
      y: 440,
      vx: 0,
      vy: 0,
      facing: 'right',
      isMoving: false,
      walkFrame: 0,
      isDead: false,
      inVentId: null,
      isBot: false,
      killCooldown: settings.killCooldownMax || 25,
      completedTasks: [],
      assignedTasks: getRandomTasks(localColor),
      state: 'idle',
      actionTimer: 0,
      currentTaskIndex: 0,
      witnessedEvents: [],
      suspicionMap: {},
      votedFor: null,
      hasVoted: false,
    });

    // 9 Professional AI Bots
    for (let i = 1; i <= 9; i++) {
      const isBotImp = botImpostorsNeeded > 0;
      if (isBotImp) botImpostorsNeeded--;

      const botColor = botColorsPool[i - 1] || 'brown';
      const angle = (i / 9) * Math.PI * 2;
      const spawnX = 1050 + Math.cos(angle) * 75;
      const spawnY = 340 + Math.sin(angle) * 75;

      initialPlayers.push({
        id: `bot_${i}`,
        name: BOT_NAMES[i - 1] || `Bot ${i}`,
        color: botColor,
        role: isBotImp ? 'impostor' : 'crewmate',
        x: spawnX,
        y: spawnY,
        vx: 0,
        vy: 0,
        facing: 'right',
        isMoving: false,
        walkFrame: 0,
        isDead: false,
        inVentId: null,
        isBot: true,
        killCooldown: (settings.killCooldownMax || 25) + Math.random() * 8,
        completedTasks: [],
        assignedTasks: getRandomTasks(botColor),
        state: 'idle',
        actionTimer: 1.0 + Math.random() * 2.0,
        currentTaskIndex: 0,
        witnessedEvents: [],
        suspicionMap: {},
        votedFor: null,
        hasVoted: false,
      });
    }

    playersRef.current = initialPlayers;
    deadBodiesRef.current = [];
    const maxSabo = settings.sabotageTimerMax || 60;
    sabotageRef.current = {
      type: 'none',
      active: false,
      timer: 0,
      maxTimer: maxSabo,
      fixedLeft: false,
      fixedRight: false,
    };
    taskProgressRef.current = 0;
    screenShakeRef.current = 0;
    emergencyCooldownRef.current = 15;
    setEmergencyCooldown(15);
    setPlayerDeathNotice(null);
    elapsedMatchTimeRef.current = 0;
    setElapsedMatchTime(0);

    // Launch into iconic Role Reveal Intro screen first!
    setPhase('intro');
    setIsPaused(false);
  };

  /**
   * Generates a realistic set of 4-5 assigned tasks across the ship
   */
  const getRandomTasks = (seed: string): TaskInstance[] => {
    const available = [...TASKS].sort(() => Math.random() - 0.5);
    return available.slice(0, 4).map((def, idx) => ({
      id: `task_${seed}_${idx}`,
      definitionId: def.id,
      type: def.type,
      name: def.name,
      room: def.room,
      completed: false,
    }));
  };

  /**
   * Main 60fps simulation updater
   */
  const updateSimulation = (dt: number) => {
    const localPlayer = playersRef.current.find((p) => !p.isBot);
    if (!localPlayer) return;

    // Track active mission elapsed time (increases as you play)
    elapsedMatchTimeRef.current += dt;

    // Decay screen shake
    if (screenShakeRef.current > 0) {
      screenShakeRef.current = Math.max(0, screenShakeRef.current - dt * 3);
    }

    // 1. Update Player Movement (unless inside vent)
    if (!localPlayer.inVentId) {
      let moveX = 0;
      let moveY = 0;
      const keys = keysRef.current;

      if (keys.has('KeyA') || keys.has('ArrowLeft')) moveX -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) moveX += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) moveY -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) moveY += 1;

      if (moveX !== 0 && moveY !== 0) {
        const inv = 1 / Math.SQRT2;
        moveX *= inv;
        moveY *= inv;
      }

      if (moveX !== 0 || moveY !== 0) {
        const speed = settings.playerSpeed;
        const targetX = localPlayer.x + moveX * speed * dt;
        const targetY = localPlayer.y + moveY * speed * dt;

        // Collision detection against walls
        if (!checkWallCollision(targetX, localPlayer.y)) {
          localPlayer.x = targetX;
        }
        if (!checkWallCollision(localPlayer.x, targetY)) {
          localPlayer.y = targetY;
        }

        localPlayer.isMoving = true;
        localPlayer.facing = moveX < 0 ? 'left' : moveX > 0 ? 'right' : localPlayer.facing;
        localPlayer.walkFrame = (localPlayer.walkFrame + dt * 10) % 4;

        // Play footstep sound periodically
        if (Math.floor(localPlayer.walkFrame) === 1 && Math.random() < 0.2) {
          audio.playStep();
        }
      } else {
        localPlayer.isMoving = false;
      }
    }

    // Impostor kill cooldown update
    if (localPlayer.role === 'impostor' && localPlayer.killCooldown > 0) {
      localPlayer.killCooldown = Math.max(0, localPlayer.killCooldown - dt);
    }

    // Emergency meeting cooldown update
    if (emergencyCooldownRef.current > 0) {
      emergencyCooldownRef.current = Math.max(0, emergencyCooldownRef.current - dt);
    }

    // Smooth camera tracking player
    cameraRef.current.x += (localPlayer.x - cameraRef.current.x) * 0.12;
    cameraRef.current.y += (localPlayer.y - cameraRef.current.y) * 0.12;

    // 2. Update Professional Bot AIs
    const botContext = {
      dt,
      players: playersRef.current,
      deadBodies: deadBodiesRef.current,
      sabotage: sabotageRef.current,
      tasks: TASKS,
      vents: VENTS,
      onReportBody: (reporter: Player, body: DeadBody) => {
        triggerMeeting('body', reporter.id, body.playerId);
      },
      onKill: (killer: Player, victim: Player) => {
        executeKill(killer, victim);
      },
      onSabotage: (type: SabotageType) => {
        triggerSabotage(type);
      },
      onFixSabotage: (side: 'left' | 'right') => {
        fixSabotage(side);
      },
    };

    for (const p of playersRef.current) {
      if (p.isBot) {
        updateBotAI(p, botContext);
      }
    }

    // 3. Update Critical Sabotage Countdown
    if (sabotageRef.current.active) {
      if (sabotageRef.current.type === 'reactor' || sabotageRef.current.type === 'o2') {
        sabotageRef.current.timer -= dt;

        // Alarm sound pulse every 1.5s
        if (Math.floor(sabotageRef.current.timer * 2) % 3 === 0 && Math.random() < 0.05) {
          audio.playSabotageAlarm();
        }

        if (sabotageRef.current.timer <= 0) {
          // Meltdown! Impostors win!
          concludeGame('impostors', `Critical ${sabotageRef.current.type.toUpperCase()} failure! Station destroyed.`);
        }
      }
    }

    // 4. Update Task Progress Percentage
    taskProgressRef.current = calculateTaskProgress(playersRef.current);

    // 5. Evaluate Game Win/Loss Outcomes
    const outcome = checkGameOutcome(
      playersRef.current,
      taskProgressRef.current,
      sabotageRef.current
    );

    if (outcome.gameOver && outcome.winner) {
      concludeGame(outcome.winner, outcome.reason);
    }
  };

  /**
   * Collision check against rectangular obstacle colliders
   */
  const checkWallCollision = (x: number, y: number): boolean => {
    const radius = 14;
    for (const col of WALL_COLLIDERS) {
      if (
        x + radius > col.x &&
        x - radius < col.x + col.w &&
        y + radius > col.y &&
        y - radius < col.y + col.h
      ) {
        return true;
      }
    }
    return false;
  };

  /**
   * Executes a kill with audio, animation, and screen shake
   */
  /**
   * Executes a kill with audio, animation, and screen shake
   */
  const executeKill = (killer: Player, victim: Player) => {
    victim.isDead = true;
    victim.deathTime = Date.now();
    victim.deathPos = { x: victim.x, y: victim.y };

    if (victim.id === 'local_player') {
      setPlayerDeathNotice(`YOU WERE ELIMINATED BY ${killer.name.toUpperCase()}!\nYOU ARE NOW A GHOST. COMPLETE YOUR REMAINING TASKS!`);
      setTimeout(() => setPlayerDeathNotice(null), 5000);
    }

    deadBodiesRef.current.push({
      id: `body_${Date.now()}_${Math.random()}`,
      playerId: victim.id,
      color: victim.color,
      x: victim.x,
      y: victim.y,
      timeOfDeath: Date.now(),
    });

    audio.playKill();
    screenShakeRef.current = 1.0;

    // Witness check: anyone who saw this logs killer as 100% sus!
    for (const p of playersRef.current) {
      if (p.id !== killer.id && !p.isDead) {
        const d = getDistance(p.x, p.y, victim.x, victim.y);
        if (d < 180) {
          p.witnessedEvents.push({
            time: Date.now(),
            type: 'saw_kill',
            targetId: killer.id,
            victimId: victim.id,
            room: getRoomAt(victim.x, victim.y),
          });
          p.suspicionMap[killer.id] = 100;
        }
      }
    }
  };

  /**
   * Player Kill Action
   */
  const triggerKillAction = () => {
    const local = playersRef.current.find((p) => !p.isBot);
    if (!local || local.role !== 'impostor' || local.isDead || local.killCooldown > 0) return;

    // Find nearest alive crewmate
    let target: Player | null = null;
    let minDist = 80;

    for (const p of playersRef.current) {
      if (p.id !== local.id && !p.isDead && p.role === 'crewmate') {
        const d = getDistance(local.x, local.y, p.x, p.y);
        if (d < minDist) {
          minDist = d;
          target = p;
        }
      }
    }

    if (target) {
      local.killCooldown = settings.killCooldownMax;
      local.x = target.x;
      local.y = target.y;
      executeKill(local, target);
    }
  };

  /**
   * Player Vent Action
   */
  const triggerVentAction = () => {
    const local = playersRef.current.find((p) => !p.isBot);
    if (!local || local.role !== 'impostor' || local.isDead) return;

    audio.playVent();

    if (local.inVentId) {
      // Move to next connected vent in network
      const connected = getConnectedVents(local.inVentId, VENTS);
      if (connected.length > 0) {
        const curIdx = connected.findIndex((v) => v.id === local.inVentId);
        const nextVent = connected[(curIdx + 1) % connected.length];
        local.inVentId = nextVent.id;
        local.x = nextVent.x;
        local.y = nextVent.y;
      }
    } else {
      // Find nearby vent to enter
      const vent = findNearbyVent(local.x, local.y, VENTS, 55);
      if (vent) {
        local.inVentId = vent.id;
        local.x = vent.x;
        local.y = vent.y;
      }
    }
  };

  const triggerExitVentAction = () => {
    const local = playersRef.current.find((p) => !p.isBot);
    if (!local || !local.inVentId) return;
    audio.playVent();
    local.inVentId = null;
  };

  /**
   * Player Report Action
   */
  const triggerReportAction = () => {
    const local = playersRef.current.find((p) => !p.isBot);
    if (!local || local.isDead) return;

    const nearbyBody = findNearbyBody(local.x, local.y, deadBodiesRef.current, 75);
    if (nearbyBody) {
      triggerMeeting('body', local.id, nearbyBody.playerId);
    }
  };

  /**
   * Player Use / Task Action
   */
  const triggerUseAction = () => {
    const local = playersRef.current.find((p) => !p.isBot);
    if (!local) return;

    // Ghosts can only interact with assigned tasks
    if (local.isDead) {
      const nearbyTask = findNearbyTask(local.x, local.y, TASKS, 65);
      if (nearbyTask) {
        setActiveTaskDef(nearbyTask);
      }
      return;
    }

    // 1. Emergency Table Button
    const distToTable = getDistance(local.x, local.y, EMERGENCY_BUTTON_POS.x, EMERGENCY_BUTTON_POS.y);
    if (distToTable <= EMERGENCY_BUTTON_POS.radius) {
      if (emergencyCooldownRef.current <= 0) {
        emergencyCooldownRef.current = 25;
        triggerMeeting('emergency', local.id);
      }
      return;
    }

    // 2. Admin Occupancy Table
    const distToAdmin = getDistance(local.x, local.y, ADMIN_TABLE_POS.x, ADMIN_TABLE_POS.y);
    if (distToAdmin <= ADMIN_TABLE_POS.radius) {
      setShowAdminTable(true);
      return;
    }

    // 3. Security CCTV Monitors
    const distToCams = getDistance(local.x, local.y, SECURITY_CAMS_POS.x, SECURITY_CAMS_POS.y);
    if (distToCams <= SECURITY_CAMS_POS.radius) {
      setShowSecurityCams(true);
      return;
    }

    // 4. Sabotage station fix (Lights, Reactor, or O2)
    if (sabotageRef.current.active) {
      if (sabotageRef.current.type === 'lights') {
        const d = getDistance(local.x, local.y, 600, 950);
        if (d < 80) {
          fixSabotage('left');
          return;
        }
      } else if (sabotageRef.current.type === 'reactor') {
        const d = getDistance(local.x, local.y, 180, 750);
        if (d < 80) {
          fixSabotage('left');
          return;
        }
      } else if (sabotageRef.current.type === 'o2') {
        const distO2 = getDistance(local.x, local.y, 1450, 550);
        const distAdmin = getDistance(local.x, local.y, 1460, 895);
        if (distO2 < 80 || distAdmin < 80) {
          fixSabotage('left');
          return;
        }
      }
    }

    // 5. Task Terminal minigame
    const nearbyTask = findNearbyTask(local.x, local.y, TASKS, 65);
    if (nearbyTask) {
      setActiveTaskDef(nearbyTask);
    }
  };

  /**
   * Trigger Sabotage event
   */
  const triggerSabotage = (type: SabotageType) => {
    const saboDuration = settings.sabotageTimerMax || 60;
    sabotageRef.current = {
      type,
      active: true,
      timer: type === 'lights' ? 999 : saboDuration,
      maxTimer: saboDuration,
      fixedLeft: false,
      fixedRight: false,
    };
  };

  const fixSabotage = (side: 'left' | 'right') => {
    if (side === 'left') sabotageRef.current.fixedLeft = true;
    if (side === 'right') sabotageRef.current.fixedRight = true;

    audio.playTaskComplete();
    sabotageRef.current.active = false;
    sabotageRef.current.type = 'none';
  };

  /**
   * Opens Emergency Meeting or Body Report
   */
  const triggerMeeting = (
    reason: 'emergency' | 'body',
    reporterId?: string,
    victimPlayerId?: string
  ) => {
    setMeetingReason(reason);
    setMeetingReporterId(reporterId);
    setMeetingVictimBodyOf(victimPlayerId);
    emergencyCooldownRef.current = 20;
    setEmergencyCooldown(20);

    // Save previous room and reset players around Cafeteria table
    playersRef.current.forEach((p, idx) => {
      p.lastActiveRoom = getRoomAt(p.x, p.y);
      p.inVentId = null;
      p.isMoving = false;
      const angle = (idx / 10) * Math.PI * 2;
      p.x = 1050 + Math.cos(angle) * 90;
      p.y = 340 + Math.sin(angle) * 90;
    });

    // Clear reported dead bodies from the ship floor
    deadBodiesRef.current = [];

    setPhase('meeting');
  };

  /**
   * Handles conclusion of meeting voting and launches Ejection scene
   */
  const handleConcludeMeeting = (
    ejectedId: string | null,
    wasTie: boolean,
    isSkip: boolean
  ) => {
    const ejected = playersRef.current.find((p) => p.id === ejectedId) || null;
    if (ejected) {
      ejected.isDead = true;
    }

    setEjectedPlayer(ejected);
    setEjectionWasTie(wasTie);
    setEjectionIsSkip(isSkip);
    setPhase('ejection');
  };

  const handleFinishEjection = () => {
    // Check if game won or lost
    const outcome = checkGameOutcome(
      playersRef.current,
      taskProgressRef.current,
      sabotageRef.current
    );

    if (outcome.gameOver && outcome.winner) {
      concludeGame(outcome.winner, outcome.reason);
    } else {
      setPhase('playing');
    }
  };

  const concludeGame = (winnerTeam: 'crewmates' | 'impostors', reason: string) => {
    setWinner(winnerTeam);
    setWinReason(reason);
    setPhase('gameover');
  };

  // Helper values for current frame
  const localPlayer = playersRef.current.find((p) => !p.isBot);
  const nearbyTask = localPlayer ? findNearbyTask(localPlayer.x, localPlayer.y, TASKS, 65) : null;
  const nearbyBody = localPlayer ? findNearbyBody(localPlayer.x, localPlayer.y, deadBodiesRef.current, 75) : null;
  const nearbyVent = localPlayer ? findNearbyVent(localPlayer.x, localPlayer.y, VENTS, 55) : null;
  const nearbyTable = localPlayer
    ? getDistance(localPlayer.x, localPlayer.y, EMERGENCY_BUTTON_POS.x, EMERGENCY_BUTTON_POS.y) <= EMERGENCY_BUTTON_POS.radius
    : false;
  const nearbyAdmin = localPlayer
    ? getDistance(localPlayer.x, localPlayer.y, ADMIN_TABLE_POS.x, ADMIN_TABLE_POS.y) <= ADMIN_TABLE_POS.radius
    : false;
  const nearbyCams = localPlayer
    ? getDistance(localPlayer.x, localPlayer.y, SECURITY_CAMS_POS.x, SECURITY_CAMS_POS.y) <= SECURITY_CAMS_POS.radius
    : false;
  const nearbySabotageStation = localPlayer
    ? sabotageRef.current.active &&
      ((sabotageRef.current.type === 'lights' && getDistance(localPlayer.x, localPlayer.y, 600, 950) < 80) ||
        (sabotageRef.current.type === 'reactor' && getDistance(localPlayer.x, localPlayer.y, 180, 750) < 80) ||
        (sabotageRef.current.type === 'o2' &&
          (getDistance(localPlayer.x, localPlayer.y, 1450, 550) < 80 || getDistance(localPlayer.x, localPlayer.y, 1460, 895) < 80)))
    : false;

  const killTarget =
    localPlayer && localPlayer.role === 'impostor'
      ? playersRef.current.find(
          (p) => p.id !== localPlayer.id && !p.isDead && p.role === 'crewmate' && getDistance(localPlayer.x, localPlayer.y, p.x, p.y) < 80
        ) || null
      : null;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black select-none font-pixel">
      {/* 1. Title Screen */}
      {phase === 'title' && (
        <TitleScreen
          settings={settings}
          onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
          onStartGame={() => setPhase('lobby')}
        />
      )}

      {/* 1b. Dropship Waiting Room (All 10 Players Gathered Together) */}
      {phase === 'lobby' && (
        <LobbyRoom
          settings={settings}
          onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
          onStartMatch={initAndStartGame}
          onReturnTitle={() => setPhase('title')}
        />
      )}

      {/* 1c. Iconic Role Reveal & Intro Showcase (SHHH + Crewmate/Impostor Reveal) */}
      {phase === 'intro' && localPlayer && (
        <RoleRevealIntro
          localPlayer={localPlayer}
          allPlayers={playersRef.current}
          impostorCount={settings.impostorCount}
          onComplete={() => setPhase('playing')}
        />
      )}

      {/* 2. Main Gameplay Canvas Surface */}
      <div
        className={`absolute inset-0 ${
          phase === 'title' || phase === 'lobby' || phase === 'intro'
            ? 'hidden pointer-events-none'
            : 'block'
        }`}
      >
        <canvas
          ref={canvasRef}
          width={window.innerWidth}
          height={window.innerHeight}
          className="h-full w-full block pixelated"
        />
      </div>

      {/* 3. Gameplay HUD */}
      {(phase === 'playing' || phase === 'task_modal') && localPlayer && (
        <GameHUD
          player={localPlayer}
          players={playersRef.current}
          taskProgress={taskProgressRef.current}
          sabotage={sabotageRef.current}
          nearbyTask={nearbyTask}
          nearbyBody={nearbyBody}
          nearbyVent={nearbyVent}
          nearbyTable={nearbyTable}
          nearbyAdmin={nearbyAdmin}
          nearbyCams={nearbyCams}
          nearbySabotageStation={nearbySabotageStation}
          emergencyCooldown={emergencyCooldown}
          playerDeathNotice={playerDeathNotice}
          killTarget={killTarget}
          soundEnabled={settings.soundEnabled}
          elapsedMatchTime={elapsedMatchTime}
          onToggleSound={() => {
            const next = audio.toggleSound();
            setSettings((prev) => ({ ...prev, soundEnabled: next }));
          }}
          onUseAction={triggerUseAction}
          onReportAction={triggerReportAction}
          onKillAction={triggerKillAction}
          onVentAction={triggerVentAction}
          onExitVentAction={triggerExitVentAction}
          onSabotageAction={() => setShowSabotageMap(true)}
          onToggleMap={() => setShowMinimap((prev) => !prev)}
          onPause={() => setIsPaused(true)}
        />
      )}

      {/* 4. Task Minigame Modals */}
      {activeTaskDef && localPlayer && (
        <>
          {activeTaskDef.type === 'card_swipe' && (
            <SwipeCardTask
              onClose={() => setActiveTaskDef(null)}
              onComplete={() => {
                const assigned = localPlayer.assignedTasks.find((t) => t.definitionId === activeTaskDef.id);
                if (assigned && !localPlayer.completedTasks.includes(assigned.id)) {
                  localPlayer.completedTasks.push(assigned.id);
                }
                setActiveTaskDef(null);
              }}
            />
          )}

          {activeTaskDef.type === 'wires' && (
            <WiresTask
              onClose={() => setActiveTaskDef(null)}
              onComplete={() => {
                const assigned = localPlayer.assignedTasks.find((t) => t.definitionId === activeTaskDef.id);
                if (assigned && !localPlayer.completedTasks.includes(assigned.id)) {
                  localPlayer.completedTasks.push(assigned.id);
                }
                setActiveTaskDef(null);
              }}
            />
          )}

          {activeTaskDef.type === 'manifolds' && (
            <ManifoldsTask
              onClose={() => setActiveTaskDef(null)}
              onComplete={() => {
                const assigned = localPlayer.assignedTasks.find((t) => t.definitionId === activeTaskDef.id);
                if (assigned && !localPlayer.completedTasks.includes(assigned.id)) {
                  localPlayer.completedTasks.push(assigned.id);
                }
                setActiveTaskDef(null);
              }}
            />
          )}

          {activeTaskDef.type === 'asteroids' && (
            <AsteroidsTask
              onClose={() => setActiveTaskDef(null)}
              onComplete={() => {
                const assigned = localPlayer.assignedTasks.find((t) => t.definitionId === activeTaskDef.id);
                if (assigned && !localPlayer.completedTasks.includes(assigned.id)) {
                  localPlayer.completedTasks.push(assigned.id);
                }
                setActiveTaskDef(null);
              }}
            />
          )}

          {activeTaskDef.type === 'shields' && (
            <ShieldsTask
              onClose={() => setActiveTaskDef(null)}
              onComplete={() => {
                const assigned = localPlayer.assignedTasks.find((t) => t.definitionId === activeTaskDef.id);
                if (assigned && !localPlayer.completedTasks.includes(assigned.id)) {
                  localPlayer.completedTasks.push(assigned.id);
                }
                setActiveTaskDef(null);
              }}
            />
          )}

          {activeTaskDef.type === 'medbay_scan' && (
            <MedbayScanTask
              onClose={() => setActiveTaskDef(null)}
              onComplete={() => {
                const assigned = localPlayer.assignedTasks.find((t) => t.definitionId === activeTaskDef.id);
                if (assigned && !localPlayer.completedTasks.includes(assigned.id)) {
                  localPlayer.completedTasks.push(assigned.id);
                }
                setActiveTaskDef(null);
              }}
            />
          )}

          {activeTaskDef.type === 'divert_power' && (
            <DivertPowerTask
              onClose={() => setActiveTaskDef(null)}
              onComplete={() => {
                const assigned = localPlayer.assignedTasks.find((t) => t.definitionId === activeTaskDef.id);
                if (assigned && !localPlayer.completedTasks.includes(assigned.id)) {
                  localPlayer.completedTasks.push(assigned.id);
                }
                setActiveTaskDef(null);
              }}
            />
          )}
        </>
      )}

      {/* 5. Sabotage Map Modal (Impostors) */}
      {showSabotageMap && (
        <SabotageMapModal
          isSabotageActive={sabotageRef.current.active}
          onTriggerSabotage={(type) => triggerSabotage(type)}
          onClose={() => setShowSabotageMap(false)}
        />
      )}

      {/* 6. Admin Table Modal */}
      {showAdminTable && (
        <AdminTableModal
          players={playersRef.current}
          onClose={() => setShowAdminTable(false)}
        />
      )}

      {/* 7. Security Cameras Modal */}
      {showSecurityCams && (
        <SecurityCamsModal
          players={playersRef.current}
          onClose={() => setShowSecurityCams(false)}
        />
      )}

      {/* 8. Full Station Minimap Modal */}
      {showMinimap && localPlayer && (
        <SkeldMinimapModal
          player={localPlayer}
          onClose={() => setShowMinimap(false)}
        />
      )}

      {/* 9. Emergency Meeting & Voting Screen */}
      {phase === 'meeting' && (
        <EmergencyMeetingModal
          players={playersRef.current}
          meetingReason={meetingReason}
          reporterId={meetingReporterId}
          victimBodyOf={meetingVictimBodyOf}
          meetingTimerMax={settings.meetingTimerMax || 45}
          onConcludeMeeting={handleConcludeMeeting}
        />
      )}

      {/* 10. Space Ejection Cinematic Scene */}
      {phase === 'ejection' && (
        <EjectionScene
          ejectedPlayer={ejectedPlayer}
          wasTie={ejectionWasTie}
          isSkip={ejectionIsSkip}
          impostorsLeft={playersRef.current.filter((p) => p.role === 'impostor' && !p.isDead).length}
          onFinish={handleFinishEjection}
        />
      )}

      {/* 11. Pause Modal */}
      {isPaused && (
        <PauseModal
          onResume={() => setIsPaused(false)}
          onRestart={initAndStartGame}
          onQuitToTitle={() => {
            setIsPaused(false);
            setPhase('title');
          }}
        />
      )}

      {/* 12. Victory / Defeat Modal */}
      {phase === 'gameover' && winner && localPlayer && (
        <GameOverModal
          winner={winner}
          winReason={winReason}
          playerRole={localPlayer.role}
          onPlayAgain={() => setPhase('lobby')}
          onReturnTitle={() => setPhase('title')}
        />
      )}
    </div>
  );
}
