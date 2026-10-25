import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import {
  CarInputs,
  CarUpgrades,
  VehiclePhysicsState,
  TrackConfig,
  WeatherType,
  CameraViewMode,
  SectorTimings,
  LapRecord,
} from './types/game';
import { DEFAULT_TRACKS, DEFAULT_UPGRADES } from './game/defaultTracks';
import { updatePhysicsStep, TrackColliderContext } from './game/physics';
import {
  generateSplineTrack,
  findClosestTrackPoint,
  getSectorForProgress,
  EvaluatedTrackPoint,
} from './game/trackMath';
import { createSuperCar, CarModelInstance } from './game/carBuilder';
import { createTrackRenderer, TrackSceneObjects } from './game/trackRenderer';
import { createWorldEnvironment, WorldEnvironmentInstance } from './game/worldEnvironment';
import { soundManager } from './game/audio';
import { createSparkEmitter, SparkEmitterInstance } from './game/sparkEmitter';

import { TitleScreen } from './components/TitleScreen';
import { F1TelemetryHud } from './components/F1TelemetryHud';
import { TrackMakerOverlay } from './components/TrackMakerOverlay';
import { PerformanceGarage } from './components/PerformanceGarage';
import { LeaderboardModal } from './components/LeaderboardModal';
import { BottomControlDock } from './components/BottomControlDock';

// Pre-allocated reusable math scratch vectors (zero GC in render loop)
const _carForward = new THREE.Vector3();
const _camPosTarget = new THREE.Vector3();
const _camLookTarget = new THREE.Vector3();
const _tempVec = new THREE.Vector3();
const _sparkOrigin = new THREE.Vector3();
const _sparkDir = new THREE.Vector3();

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);

  // High-level Game Modes: 'title' | 'race' | 'editor' | 'garage' | 'leaderboard'
  const [gameState, setGameState] = useState<'title' | 'race' | 'editor' | 'garage' | 'leaderboard'>('title');
  const [prevMode, setPrevMode] = useState<'title' | 'race'>('title');
  const [isPaused, setIsPaused] = useState(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  // App Configuration & State
  const [tracks, setTracks] = useState<TrackConfig[]>(() => {
    try {
      const saved = localStorage.getItem('apex_custom_tracks');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_TRACKS;
  });

  const [selectedTrack, setSelectedTrack] = useState<TrackConfig>(tracks[0]);
  const [selectedPointId, setSelectedPointId] = useState<string>(tracks[0].points[0].id);
  const [upgrades, setUpgrades] = useState<CarUpgrades>(() => {
    try {
      const saved = localStorage.getItem('apex_car_upgrades');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_UPGRADES;
  });

  const [weather, setWeather] = useState<WeatherType>('clear_day');
  const [timeOfDay, setTimeOfDay] = useState<number>(14.5); // 2:30 PM
  const [cameraView, setCameraView] = useState<CameraViewMode>('chase');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Leaderboard persistence
  const [records, setRecords] = useState<LapRecord[]>(() => {
    try {
      const saved = localStorage.getItem('apex_lap_records');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: 'rec_1',
        trackId: 'monza',
        driverName: 'Charles L.',
        lapTimeSeconds: 81.046,
        sector1Seconds: 27.21,
        sector2Seconds: 26.54,
        sector3Seconds: 27.29,
        topSpeedKmh: 352,
        weather: 'clear_day',
        compound: 'soft',
        carBhp: 980,
        date: '2026-10-20',
      },
      {
        id: 'rec_2',
        trackId: 'silverstone',
        driverName: 'Lewis H.',
        lapTimeSeconds: 87.324,
        sector1Seconds: 28.12,
        sector2Seconds: 31.05,
        sector3Seconds: 28.15,
        topSpeedKmh: 334,
        weather: 'clear_day',
        compound: 'soft',
        carBhp: 950,
        date: '2026-10-21',
      },
    ];
  });

  // Telemetry & Sector Timing State
  const [physicsState, setPhysicsState] = useState<VehiclePhysicsState>({
    posX: 0,
    posY: 0.35,
    posZ: 0,
    velX: 0,
    velY: 0,
    velZ: 0,
    rotationY: 0,
    pitch: 0,
    roll: 0,
    speedMs: 0,
    steerAngle: 0,
    rpm: 1200,
    currentGear: 1,
    slipAngle: 0,
    gForceLat: 0,
    gForceLong: 0,
    drsActive: false,
    isOffTrack: false,
    isKerbRiding: false,
    isBrakingHard: false,
    isAirborne: false,
    hasCollided: false,
    collisionNormalX: 0,
    collisionNormalZ: 0,
    collisionIntensity: 0,
  });

  const [sectorTimings, setSectorTimings] = useState<SectorTimings>({
    currentSector: 1,
    lapStartTime: 0,
    currentLapTime: 0,
    sector1Time: null,
    sector2Time: null,
    sector3Time: null,
    lastLapTime: null,
    bestLapTime: null,
    bestSector1: null,
    bestSector2: null,
    bestSector3: null,
    deltaToBest: null,
    lapCount: 1,
    cleanLap: true,
  });

  const [evaluatedTrack, setEvaluatedTrack] = useState<EvaluatedTrackPoint[]>(() =>
    generateSplineTrack(selectedTrack.points, 20, true)
  );

  // References to keep 60fps loop free of React re-render churn
  const currentTrackRef = useRef(selectedTrack);
  currentTrackRef.current = selectedTrack;

  const currentUpgradesRef = useRef(upgrades);
  currentUpgradesRef.current = upgrades;

  const currentWeatherRef = useRef(weather);
  currentWeatherRef.current = weather;

  const currentTimeOfDayRef = useRef(timeOfDay);
  currentTimeOfDayRef.current = timeOfDay;

  const currentCamViewRef = useRef(cameraView);
  currentCamViewRef.current = cameraView;

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const evaluatedTrackRef = useRef(evaluatedTrack);
  evaluatedTrackRef.current = evaluatedTrack;

  // Input states
  const keysPressed = useRef<Set<string>>(new Set());
  const drsToggleRef = useRef<boolean>(false);
  const touchControlsRef = useRef<{
    steer: number;
    throttle: number;
    brake: number;
    handbrake: boolean;
  }>({
    steer: 0,
    throttle: 0,
    brake: 0,
    handbrake: false,
  });

  // Scene instances refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const carInstanceRef = useRef<CarModelInstance | null>(null);
  const trackRendererRef = useRef<TrackSceneObjects | null>(null);
  const worldEnvRef = useRef<WorldEnvironmentInstance | null>(null);
  const sparkEmitterRef = useRef<SparkEmitterInstance | null>(null);
  const cameraTraumaRef = useRef<number>(0);

  // Physics simulation state ref
  const livePhysicsRef = useRef<VehiclePhysicsState>({ ...physicsState });

  // Sector timing tracking ref
  const timingRef = useRef<{
    prevDistance: number;
    lapStartTime: number;
    sector1Time: number | null;
    sector2Time: number | null;
    sector3Time: number | null;
    bestLapTime: number | null;
    lapCount: number;
    cleanLap: boolean;
    topSpeedKmh: number;
  }>({
    prevDistance: 0,
    lapStartTime: 0,
    sector1Time: null,
    sector2Time: null,
    sector3Time: null,
    bestLapTime: null,
    lapCount: 1,
    cleanLap: true,
    topSpeedKmh: 0,
  });

  // Sync body dataset state
  useEffect(() => {
    document.body.dataset.state = gameState === 'title' ? 'title' : isPaused ? 'paused' : 'playing';
  }, [gameState, isPaused]);

  // Handle URL parameters & Playzy messages
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      soundManager.init();
      setGameState('race');
    }
    if (params.get('muted') === '1') {
      soundManager.setMuted(true);
      setIsMuted(true);
    }

    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'playzy:set-sound') {
        const muted = !e.data.enabled;
        soundManager.setMuted(muted);
        setIsMuted(muted);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Save tracks to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('apex_custom_tracks', JSON.stringify(tracks));
    } catch {
      // ignore
    }
  }, [tracks]);

  // Save upgrades to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('apex_car_upgrades', JSON.stringify(upgrades));
    } catch {
      // ignore
    }
    if (carInstanceRef.current) {
      carInstanceRef.current.updateMaterials(upgrades);
    }
  }, [upgrades]);

  // Save records to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('apex_lap_records', JSON.stringify(records));
    } catch {
      // ignore
    }
  }, [records]);

  // Reset car position to start grid
  const resetCarToGrid = useCallback(() => {
    const ev = evaluatedTrackRef.current;
    if (ev.length > 0) {
      const p0 = ev[0];
      const heading = Math.atan2(p0.tangentX, p0.tangentZ);

      livePhysicsRef.current = {
        posX: p0.x + p0.tangentX * 2.5,
        posY: p0.y + 0.35,
        posZ: p0.z + p0.tangentZ * 2.5,
        velX: 0,
        velY: 0,
        velZ: 0,
        rotationY: heading,
        pitch: 0,
        roll: 0,
        speedMs: 0,
        steerAngle: 0,
        rpm: 1200,
        currentGear: 1,
        slipAngle: 0,
        gForceLat: 0,
        gForceLong: 0,
        drsActive: false,
        isOffTrack: false,
        isKerbRiding: false,
        isBrakingHard: false,
        isAirborne: false,
        hasCollided: false,
        collisionNormalX: 0,
        collisionNormalZ: 0,
        collisionIntensity: 0,
      };

      timingRef.current.prevDistance = 0;
      timingRef.current.lapStartTime = performance.now() * 0.001;
      timingRef.current.topSpeedKmh = 0;
    }
  }, []);

  // Track rebuild whenever selectedTrack changes
  useEffect(() => {
    const newEvaluated = generateSplineTrack(selectedTrack.points, 20, true);
    setEvaluatedTrack(newEvaluated);
    evaluatedTrackRef.current = newEvaluated;

    if (trackRendererRef.current) {
      trackRendererRef.current.rebuildTrack(
        newEvaluated,
        selectedTrack.points,
        gameState === 'editor',
        selectedPointId
      );
    }

    if (worldEnvRef.current) {
      worldEnvRef.current.updateTrackTerrain(newEvaluated);
    }

    resetCarToGrid();
  }, [selectedTrack, resetCarToGrid, gameState, selectedPointId]);

  // Main Three.js Scene Setup (Mount once)
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL from GPU renderer string
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.2, 1200);
    camera.position.set(0, 4, -8);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // Studio Environment Reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // World Environment (Sky, Mountains, Foliage, Rain)
    const worldEnv = createWorldEnvironment(scene);
    worldEnv.updateTrackTerrain(evaluatedTrackRef.current);
    scene.add(worldEnv.group);
    worldEnvRef.current = worldEnv;

    // Track Renderer
    const trackRenderer = createTrackRenderer();
    scene.add(trackRenderer.group);
    trackRendererRef.current = trackRenderer;

    trackRenderer.rebuildTrack(
      evaluatedTrackRef.current,
      currentTrackRef.current.points,
      gameStateRef.current === 'editor',
      selectedPointId
    );

    // Supercar 3D Model
    const carModel = createSuperCar(currentUpgradesRef.current);
    scene.add(carModel.group);
    carInstanceRef.current = carModel;

    // 3D Titanium Sparks Emitter
    const sparkEmitter = createSparkEmitter();
    scene.add(sparkEmitter.points);
    sparkEmitterRef.current = sparkEmitter;

    resetCarToGrid();

    // Shader pre-warm
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Window Resize Observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Keyboard Input Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.code);

      // DRS toggle (E key or Shift)
      if (e.code === 'KeyE' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        drsToggleRef.current = !drsToggleRef.current;
      }
      // Camera view toggle (C key)
      if (e.code === 'KeyC') {
        const views: CameraViewMode[] = ['chase', 'cockpit', 'hood', 'cinematic'];
        const nextIdx = (views.indexOf(currentCamViewRef.current) + 1) % views.length;
        setCameraView(views[nextIdx]);
      }
      // Reset position (R key)
      if (e.code === 'KeyR') {
        resetCarToGrid();
      }
      // Audio mute (M key)
      if (e.code === 'KeyM') {
        const muted = soundManager.toggleMute();
        setIsMuted(muted);
      }
      // Dock collapse (H key)
      if (e.code === 'KeyH') {
        setIsDockCollapsed((prev) => !prev);
      }
      // Pause toggle (Escape)
      if (e.code === 'Escape') {
        if (gameStateRef.current === 'race') {
          setIsPaused((p) => !p);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code);
    };

    const handleBlur = () => {
      keysPressed.current.clear();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleBlur);

    // Animation & Physics Loop
    let lastTime = performance.now();
    let frameId = 0;
    let throttleHudCounter = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const now = performance.now();
      const rawDt = (now - lastTime) * 0.001;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      const mode = gameStateRef.current;
      const paused = isPausedRef.current;

      if (!paused && mode === 'race') {
        // Collect Inputs
        const keys = keysPressed.current;
        const keyThrottle = keys.has('KeyW') || keys.has('ArrowUp') ? 1.0 : 0;
        const keyBrake = keys.has('KeyS') || keys.has('ArrowDown') ? 1.0 : 0;
        const steerLeft = keys.has('KeyA') || keys.has('ArrowLeft') ? 1.0 : 0;
        const steerRight = keys.has('KeyD') || keys.has('ArrowRight') ? 1.0 : 0;
        // In Three.js with camera behind car looking along +Z, positive steer turns left on screen, negative steer turns right on screen
        const keySteer = steerLeft - steerRight;

        const throttle = touchControlsRef.current.throttle > 0 ? touchControlsRef.current.throttle : keyThrottle;
        const brake = touchControlsRef.current.brake > 0 ? touchControlsRef.current.brake : keyBrake;
        const steer = touchControlsRef.current.steer !== 0 ? touchControlsRef.current.steer : keySteer;
        const handbrake = keys.has('Space') || touchControlsRef.current.handbrake;
        const drs = drsToggleRef.current;

        const inputs: CarInputs = { throttle, brake, steer, handbrake, drs };

        // Evaluate track position and road limits
        const trackEval = evaluatedTrackRef.current;
        const closestInfo = findClosestTrackPoint(
          livePhysicsRef.current.posX,
          livePhysicsRef.current.posZ,
          trackEval
        );

        // Signed lateral distance from track centerline
        const toCarX = livePhysicsRef.current.posX - closestInfo.closestPoint.x;
        const toCarZ = livePhysicsRef.current.posZ - closestInfo.closestPoint.z;
        const signedLateralDistance = toCarX * closestInfo.closestPoint.normalX + toCarZ * closestInfo.closestPoint.normalZ;

        const colliderCtx: TrackColliderContext = {
          trackWidth: closestInfo.closestPoint.width,
          normalX: closestInfo.closestPoint.normalX,
          normalZ: closestInfo.closestPoint.normalZ,
          tangentX: closestInfo.closestPoint.tangentX,
          tangentY: closestInfo.closestPoint.tangentY,
          tangentZ: closestInfo.closestPoint.tangentZ,
          distanceFromCenterline: closestInfo.distanceFromCenterline,
          signedLateralDistance,
        };

        // Physics step: gravity, 3D suspension, rigid-body momentum and barrier colliders
        const nextPhysics = updatePhysicsStep(
          livePhysicsRef.current,
          inputs,
          currentUpgradesRef.current,
          currentWeatherRef.current,
          closestInfo.isOffTrack,
          closestInfo.isKerbRiding,
          closestInfo.closestPoint.y,
          dt,
          colliderCtx
        );
        livePhysicsRef.current = nextPhysics;

        // Barrier collision impact effects: audio, sparks burst and camera trauma
        if (nextPhysics.hasCollided) {
          soundManager.playCollisionSound(nextPhysics.collisionIntensity);
          _sparkOrigin.set(nextPhysics.posX, nextPhysics.posY - 0.1, nextPhysics.posZ);
          _sparkDir.set(nextPhysics.collisionNormalX, 0.4, nextPhysics.collisionNormalZ);
          sparkEmitterRef.current?.triggerBurst(_sparkOrigin, _sparkDir, nextPhysics.collisionIntensity);
          cameraTraumaRef.current = Math.min(1.0, cameraTraumaRef.current + nextPhysics.collisionIntensity * 0.75);
        }

        // Kerb titanium sparks when riding high kerbs at speed
        if (nextPhysics.isKerbRiding && nextPhysics.speedMs > 25 && Math.random() < 0.25) {
          _sparkOrigin.set(nextPhysics.posX, nextPhysics.posY - 0.22, nextPhysics.posZ);
          _sparkDir.set(-Math.sin(nextPhysics.rotationY), 0.3, -Math.cos(nextPhysics.rotationY));
          sparkEmitterRef.current?.triggerBurst(_sparkOrigin, _sparkDir, 0.35);
        }

        // Lap & Sector Timing calculation
        const currentDist = closestInfo.closestPoint.distanceAlongTrack;
        const totalTrackLen = trackEval.length > 0 ? trackEval[trackEval.length - 1].distanceAlongTrack : 1000;
        const sector = getSectorForProgress(closestInfo.closestPoint.progressPercent);

        if (timingRef.current.lapStartTime === 0) {
          timingRef.current.lapStartTime = now * 0.001;
        }

        const elapsedLap = Math.max(0, now * 0.001 - timingRef.current.lapStartTime);

        // Record top speed
        const speedKmh = nextPhysics.speedMs * 3.6;
        if (speedKmh > timingRef.current.topSpeedKmh) {
          timingRef.current.topSpeedKmh = speedKmh;
        }

        if (closestInfo.isOffTrack) {
          timingRef.current.cleanLap = false;
        }

        // Lap crossing detection (when distance wraps from near end to near start)
        const prevDist = timingRef.current.prevDistance;
        if (prevDist > totalTrackLen * 0.85 && currentDist < totalTrackLen * 0.15) {
          // Completed a full lap!
          const lapTime = elapsedLap;
          const isBest = !timingRef.current.bestLapTime || lapTime < timingRef.current.bestLapTime;

          soundManager.playLapChime(isBest);

          if (isBest) {
            timingRef.current.bestLapTime = lapTime;
          }

          // Add to leaderboard records
          const newRecord: LapRecord = {
            id: `rec_${Date.now()}`,
            trackId: currentTrackRef.current.id,
            driverName: 'Player Driver',
            lapTimeSeconds: lapTime,
            sector1Seconds: timingRef.current.sector1Time || lapTime * 0.32,
            sector2Seconds: timingRef.current.sector2Time || lapTime * 0.35,
            sector3Seconds: timingRef.current.sector3Time || lapTime * 0.33,
            topSpeedKmh: Math.round(timingRef.current.topSpeedKmh),
            weather: currentWeatherRef.current,
            compound: currentUpgradesRef.current.tireCompound,
            carBhp: currentUpgradesRef.current.horsepower,
            date: new Date().toISOString().split('T')[0],
          };

          setRecords((prev) => [newRecord, ...prev]);

          if (window.parent && window.parent !== window) {
            const lapScore = Math.max(100, Math.round((1000 / Math.max(1, lapTime)) * 100 + (newRecord.topSpeedKmh * 5)));
            window.parent.postMessage({
              type: 'playzy:run-ended',
              gameId: 'apex-velocity',
              score: lapScore,
              duration: Math.round(lapTime),
            }, '*');
          }

          // Reset for next lap
          timingRef.current.lapStartTime = now * 0.001;
          timingRef.current.sector1Time = null;
          timingRef.current.sector2Time = null;
          timingRef.current.sector3Time = null;
          timingRef.current.lapCount++;
          timingRef.current.cleanLap = true;
          timingRef.current.topSpeedKmh = 0;
        }

        // Sector split triggers
        if (sector === 2 && !timingRef.current.sector1Time) {
          timingRef.current.sector1Time = elapsedLap;
        } else if (sector === 3 && !timingRef.current.sector2Time) {
          timingRef.current.sector2Time = elapsedLap - (timingRef.current.sector1Time || 0);
        }

        timingRef.current.prevDistance = currentDist;

        // Sound Engine Update
        soundManager.updateEngine(
          nextPhysics.rpm,
          inputs.throttle,
          nextPhysics.speedMs,
          nextPhysics.slipAngle,
          closestInfo.isKerbRiding,
          currentWeatherRef.current === 'rain' || currentWeatherRef.current === 'night_storm'
        );

        if (keys.has('KeyS') && Math.random() < 0.04) {
          soundManager.playExhaustPop();
        }

        // Throttle React state update to ~10Hz to prevent reconciliation stalls
        throttleHudCounter++;
        if (throttleHudCounter % 6 === 0) {
          setPhysicsState({ ...nextPhysics });
          setSectorTimings({
            currentSector: sector,
            lapStartTime: timingRef.current.lapStartTime,
            currentLapTime: elapsedLap,
            sector1Time: timingRef.current.sector1Time,
            sector2Time: timingRef.current.sector2Time,
            sector3Time: timingRef.current.sector3Time,
            lastLapTime: null,
            bestLapTime: timingRef.current.bestLapTime,
            bestSector1: null,
            bestSector2: null,
            bestSector3: null,
            deltaToBest: timingRef.current.bestLapTime ? elapsedLap - timingRef.current.bestLapTime : null,
            lapCount: timingRef.current.lapCount,
            cleanLap: timingRef.current.cleanLap,
          });
        }
      }

      // Update 3D Car Model transforms
      if (carInstanceRef.current) {
        const car = carInstanceRef.current;
        const p = livePhysicsRef.current;

        car.group.position.set(p.posX, p.posY, p.posZ);
        car.group.rotation.set(p.pitch, p.rotationY, p.roll);

        car.updateWheelRotation(p.speedMs, p.steerAngle, dt);
        car.updateDrsState(p.drsActive);
        car.updateBrakeGlow(p.isBrakingHard);
        car.updateRainLight(
          currentWeatherRef.current === 'rain' || currentWeatherRef.current === 'night_storm',
          now * 0.001
        );
      }

      // Dynamic Camera Controller
      if (cameraRef.current) {
        const cam = cameraRef.current;
        const p = livePhysicsRef.current;
        const camMode = currentCamViewRef.current;

        _carForward.set(Math.sin(p.rotationY), 0, Math.cos(p.rotationY));

        if (gameStateRef.current === 'title') {
          // Live atmospheric flyover camera pan on Title Screen (mandated by game craft skill)
          const orbitTime = now * 0.0003;
          cam.position.set(
            p.posX + Math.sin(orbitTime) * 16,
            p.posY + 5 + Math.cos(orbitTime * 1.5) * 2,
            p.posZ + Math.cos(orbitTime) * 16
          );
          cam.lookAt(p.posX, p.posY + 0.8, p.posZ);
        } else if (gameStateRef.current === 'editor') {
          // Curves Studio birds-eye / orbit view over track
          _camPosTarget.set(p.posX + 30, p.posY + 45, p.posZ + 35);
          cam.position.lerp(_camPosTarget, 0.1);
          cam.lookAt(p.posX, p.posY, p.posZ);
        } else if (camMode === 'chase') {
          // Third-person aerodynamic chase camera with frame-rate independent damping
          const followDist = 6.4 + (p.speedMs / 90) * 1.6;
          const followHeight = 2.3 + (p.speedMs / 90) * 0.5;
          _camPosTarget.set(
            p.posX - _carForward.x * followDist,
            p.posY + followHeight,
            p.posZ - _carForward.z * followDist
          );
          _camLookTarget.set(
            p.posX + _carForward.x * 8,
            p.posY + 1.0,
            p.posZ + _carForward.z * 8
          );
          const camFollowFactor = 1 - Math.exp(-12.0 * dt);
          cam.position.lerp(_camPosTarget, camFollowFactor);
          cam.lookAt(_camLookTarget);
        } else if (camMode === 'cockpit') {
          // F1 Halo Cockpit POV
          cam.position.set(
            p.posX + _carForward.x * 0.35,
            p.posY + 0.78,
            p.posZ + _carForward.z * 0.35
          );
          _camLookTarget.set(
            p.posX + _carForward.x * 30,
            p.posY + 0.6,
            p.posZ + _carForward.z * 30
          );
          cam.lookAt(_camLookTarget);
        } else if (camMode === 'hood') {
          // Nosecone / Front Wing camera
          cam.position.set(
            p.posX + _carForward.x * 1.8,
            p.posY + 0.45,
            p.posZ + _carForward.z * 1.8
          );
          _camLookTarget.set(
            p.posX + _carForward.x * 40,
            p.posY + 0.45,
            p.posZ + _carForward.z * 40
          );
          cam.lookAt(_camLookTarget);
        } else {
          // Trackside TV broadcast camera
          const broadcastStation = Math.floor(now * 0.0001) % 4;
          const bOffsets = [
            [25, 6, 25],
            [-25, 8, 30],
            [15, 12, -20],
            [-30, 7, -15],
          ];
          const off = bOffsets[broadcastStation];
          _camPosTarget.set(p.posX + off[0], p.posY + off[1], p.posZ + off[2]);
          cam.position.lerp(_camPosTarget, 0.04);
          cam.lookAt(p.posX, p.posY + 0.5, p.posZ);
        }

        // Rigid-body impact camera trauma shake
        if (cameraTraumaRef.current > 0.005) {
          const traumaSq = cameraTraumaRef.current * cameraTraumaRef.current;
          cam.position.x += (Math.random() - 0.5) * traumaSq * 0.45;
          cam.position.y += (Math.random() - 0.5) * traumaSq * 0.35;
          cam.position.z += (Math.random() - 0.5) * traumaSq * 0.45;
          cameraTraumaRef.current = Math.max(0, cameraTraumaRef.current - 4.2 * dt);
        }
      }

      // Update 3D titanium sparks
      sparkEmitterRef.current?.update(dt);

      // World Environment & Lighting Update
      if (worldEnvRef.current) {
        _tempVec.set(livePhysicsRef.current.posX, livePhysicsRef.current.posY, livePhysicsRef.current.posZ);
        worldEnvRef.current.updateTimeAndWeather(
          currentTimeOfDayRef.current,
          currentWeatherRef.current,
          _tempVec,
          dt
        );
      }

      // Track floodlights
      if (trackRendererRef.current) {
        const isDark = currentTimeOfDayRef.current < 6 || currentTimeOfDayRef.current > 19.5 || currentWeatherRef.current === 'night_storm';
        trackRendererRef.current.updateLighting(isDark);
      }

      // Render frame
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    // Start loop
    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleBlur);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [resetCarToGrid, selectedPointId]);

  // Clone track handler (creates custom clone in Curves Studio)
  const handleCloneTrack = () => {
    const clone: TrackConfig = {
      ...selectedTrack,
      id: `clone_${Date.now()}`,
      name: `${selectedTrack.name} (Custom Clone)`,
      points: selectedTrack.points.map((p, i) => ({ ...p, id: `c_${Date.now()}_${i}` })),
    };
    setTracks((prev) => [clone, ...prev]);
    setSelectedTrack(clone);
    setSelectedPointId(clone.points[0].id);
  };

  const handleStartDrive = () => {
    soundManager.init();
    setGameState('race');
    setIsPaused(false);
  };

  const handleClearRecords = (trackId: string) => {
    setRecords((prev) => prev.filter((r) => r.trackId !== trackId));
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* Three.js Isolated Canvas Mount (outside React reconciliation) */}
      <div
        ref={mountRef}
        data-testid="webgl-canvas-container"
        className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing"
      />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          tracks={tracks}
          selectedTrack={selectedTrack}
          onSelectTrack={(t) => {
            setSelectedTrack(t);
            setSelectedPointId(t.points[0].id);
          }}
          onStartDrive={handleStartDrive}
          onOpenGarage={() => {
            setPrevMode('title');
            setGameState('garage');
          }}
          onOpenEditor={() => {
            setPrevMode('title');
            setGameState('editor');
          }}
          onOpenLeaderboard={() => {
            setPrevMode('title');
            setGameState('leaderboard');
          }}
        />
      )}

      {/* In-Game Low-Occlusion F1 Telemetry HUD */}
      {gameState === 'race' && !isPaused && (
        <F1TelemetryHud
          physics={physicsState}
          sectorTimings={sectorTimings}
          weather={weather}
          trackName={selectedTrack.name}
          evaluatedTrack={evaluatedTrack}
          cameraView={cameraView}
          onSetTouchControls={(ctrls) => {
            touchControlsRef.current = { ...touchControlsRef.current, ...ctrls };
          }}
          onToggleDrs={() => {
            drsToggleRef.current = !drsToggleRef.current;
          }}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'race' && isPaused && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 font-sans select-none">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg max-w-sm w-full text-center shadow-2xl space-y-4">
            <h2 className="text-2xl font-black italic tracking-wider text-white uppercase">
              RACE PAUSED
            </h2>
            <p className="text-xs font-mono text-slate-400">
              Press Escape to resume racing or choose an option below
            </p>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => setIsPaused(false)}
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-sm uppercase rounded transition"
              >
                Resume Race
              </button>
              <button
                onClick={resetCarToGrid}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono uppercase rounded transition"
              >
                Restart Lap (Grid)
              </button>
              <button
                onClick={() => {
                  setIsPaused(false);
                  setPrevMode('race');
                  setGameState('editor');
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-mono uppercase rounded transition"
              >
                Curves Studio Track Maker
              </button>
              <button
                onClick={() => {
                  setIsPaused(false);
                  setGameState('title');
                }}
                className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 text-xs font-mono uppercase rounded transition border border-slate-800"
              >
                Return to Title Screen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Curves Studio 3D Track Maker Overlay */}
      {gameState === 'editor' && (
        <TrackMakerOverlay
          track={selectedTrack}
          selectedPointId={selectedPointId}
          onSelectPoint={setSelectedPointId}
          onUpdateTrack={(updated) => {
            setSelectedTrack(updated);
            setTracks((all) => all.map((t) => (t.id === updated.id ? updated : t)));
          }}
          onCloneTrack={handleCloneTrack}
          onStartDrive={handleStartDrive}
          onClose={() => setGameState(prevMode)}
        />
      )}

      {/* Performance Garage Tuning Suite */}
      {gameState === 'garage' && (
        <PerformanceGarage
          upgrades={upgrades}
          onUpdateUpgrades={setUpgrades}
          onClose={() => setGameState(prevMode)}
          onStartDrive={handleStartDrive}
        />
      )}

      {/* Comprehensive Leaderboard Modal */}
      {gameState === 'leaderboard' && (
        <LeaderboardModal
          records={records}
          tracks={tracks}
          selectedTrackId={selectedTrack.id}
          onClearRecords={handleClearRecords}
          onClose={() => setGameState(prevMode)}
        />
      )}

      {/* Unified Bottom Control Dock (Collapsible, Pinned to Bottom Center) */}
      {gameState === 'race' && !isPaused && (
        <BottomControlDock
          isCollapsed={isDockCollapsed}
          onToggleCollapse={() => setIsDockCollapsed((c) => !c)}
          weather={weather}
          onChangeWeather={setWeather}
          timeOfDay={timeOfDay}
          onChangeTimeOfDay={setTimeOfDay}
          cameraView={cameraView}
          onChangeCameraView={setCameraView}
          isMuted={isMuted}
          onToggleMute={() => {
            const muted = soundManager.toggleMute();
            setIsMuted(muted);
          }}
          onOpenCurvesStudio={() => {
            setPrevMode('race');
            setGameState('editor');
          }}
          onOpenGarage={() => {
            setPrevMode('race');
            setGameState('garage');
          }}
          onOpenLeaderboard={() => {
            setPrevMode('race');
            setGameState('leaderboard');
          }}
          onResetCarPosition={resetCarToGrid}
        />
      )}
    </div>
  );
}
