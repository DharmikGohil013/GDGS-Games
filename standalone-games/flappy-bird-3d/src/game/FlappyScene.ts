import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  createRealisticBird,
  createPipePairMesh,
  createGroundMesh,
  createCloudCluster,
  ParticleSystem,
  RealisticBirdParts,
} from './graphics3d';
import {
  applyFlap,
  updateBirdPhysics,
  calculateBirdPitch,
  checkCollision,
  checkPipePasses,
  DIFFICULTY_PRESETS,
  DifficultyLevel,
  PipePairData,
  createPipe,
  WORLD_BOUNDS,
} from './rules';
import { sound } from './audio';

export type CameraViewMode = 'classic_3d' | 'action_cam' | 'first_person';
export type WorldTheme = 'day' | 'sunset' | 'night';

export interface GameStats {
  score: number;
  bestScore: number;
  combo: number;
  state: 'title' | 'playing' | 'paused' | 'gameover';
  difficulty: DifficultyLevel;
  cameraMode: CameraViewMode;
  theme: WorldTheme;
}

export class FlappyScene {
  private container: HTMLElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean = false;

  // Game actors
  private birdParts!: RealisticBirdParts;
  private ground!: { mesh: THREE.Mesh; updateScroll: (s: number, dt: number) => void };
  private pipeMeshes: { data: PipePairData; mesh: ReturnType<typeof createPipePairMesh> }[] = [];
  private clouds: THREE.Group[] = [];
  private particles!: ParticleSystem;

  // Lights
  private dirLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;

  // State
  private gameState: 'title' | 'playing' | 'paused' | 'gameover' = 'title';
  private difficulty: DifficultyLevel = 'normal';
  private cameraMode: CameraViewMode = 'classic_3d';
  private theme: WorldTheme = 'day';

  private birdY: number = 0;
  private birdVelocity: number = 0;
  private birdPitch: number = 0;
  private wingFlapPhase: number = 0;
  private birdSquash: number = 1.0;
  private birdStretch: number = 1.0;

  private score: number = 0;
  private bestScore: number = 0;
  private nextPipeId: number = 1;
  private pipeSpawnDistance: number = 8.0;
  private lastPipeX: number = 0;

  // Juice & Hitstop
  private hitstopTimer: number = 0;
  private cameraTrauma: number = 0;
  private inputBufferTimer: number = 0;

  // Frame loop
  private frameId: number = 0;
  private lastTime: number = 0;
  private isDestroyed: boolean = false;

  // Callbacks to React
  private onStatsChange: (stats: GameStats) => void;

  constructor(container: HTMLElement, onStatsChange: (stats: GameStats) => void) {
    this.container = container;
    this.onStatsChange = onStatsChange;

    try {
      const savedBest = localStorage.getItem('flappy_best_score');
      if (savedBest) {
        this.bestScore = parseInt(savedBest, 10) || 0;
      }
    } catch {
      // ignore
    }

    this.initThree();
    this.setupWorld();
    this.setTheme(this.theme);
    this.bindEvents();
    this.startLoop();
    this.notifyState();
  }

  private initThree() {
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 150);

    // Studio Environment Reflection
    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    } catch {
      // safe fallback
    }

    // Lights
    this.hemiLight = new THREE.HemisphereLight(0xb1e1ff, 0x3b5f2b, 0.85);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfff3d6, 1.4);
    this.dirLight.position.set(12, 18, 14);
    if (!this.isSoftwareGl) {
      this.dirLight.castShadow = true;
      this.dirLight.shadow.mapSize.width = 1024;
      this.dirLight.shadow.mapSize.height = 1024;
      this.dirLight.shadow.camera.near = 0.5;
      this.dirLight.shadow.camera.far = 45;
      this.dirLight.shadow.camera.left = -10;
      this.dirLight.shadow.camera.right = 10;
      this.dirLight.shadow.camera.top = 10;
      this.dirLight.shadow.camera.bottom = -10;
      this.dirLight.shadow.bias = -0.0005;
    }
    this.scene.add(this.dirLight);

    // Backlight / Rim
    const backLight = new THREE.DirectionalLight(0xa5d8ff, 0.5);
    backLight.position.set(-8, 10, -10);
    this.scene.add(backLight);
  }

  private setupWorld() {
    // 1. Bird
    this.birdParts = createRealisticBird();
    this.birdParts.root.position.set(WORLD_BOUNDS.birdX, 0, 0);
    this.scene.add(this.birdParts.root);

    // 2. Ground
    this.ground = createGroundMesh();
    this.scene.add(this.ground.mesh);

    // 3. Clouds at varied depths and heights
    for (let i = 0; i < 7; i++) {
      const cloud = createCloudCluster(0.9 + Math.random() * 0.5);
      cloud.position.set(
        -25 + i * 9 + (Math.random() - 0.5) * 4,
        4.5 + (Math.random() - 0.5) * 3,
        -7 - Math.random() * 8
      );
      this.clouds.push(cloud);
      this.scene.add(cloud);
    }

    // 4. Distant Mountain Silhouettes
    const mountainMat = new THREE.MeshStandardMaterial({
      color: 0x496b88,
      roughness: 0.95,
      metalness: 0.05,
      flatShading: true,
    });
    for (let i = -3; i <= 3; i++) {
      const coneGeo = new THREE.ConeGeometry(5 + Math.random() * 4, 11 + Math.random() * 5, 5);
      const mountain = new THREE.Mesh(coneGeo, mountainMat);
      mountain.position.set(i * 12 + (Math.random() - 0.5) * 4, -4.5, -24 - Math.random() * 6);
      this.scene.add(mountain);
    }

    // 5. Particles
    this.particles = new ParticleSystem();
    this.scene.add(this.particles.group);
  }

  public setTheme(theme: WorldTheme) {
    this.theme = theme;
    if (theme === 'day') {
      this.scene.background = new THREE.Color(0x70c5ce);
      this.scene.fog = new THREE.Fog(0x70c5ce, 22, 50);
      this.dirLight.color.setHex(0xfffaed);
      this.dirLight.intensity = 1.4;
      this.hemiLight.color.setHex(0xb1e1ff);
      this.hemiLight.groundColor.setHex(0x3b5f2b);
    } else if (theme === 'sunset') {
      this.scene.background = new THREE.Color(0xd97757);
      this.scene.fog = new THREE.Fog(0xd97757, 20, 48);
      this.dirLight.color.setHex(0xffaa5e);
      this.dirLight.intensity = 1.6;
      this.hemiLight.color.setHex(0xffc9c9);
      this.hemiLight.groundColor.setHex(0x4a2c11);
    } else {
      // night
      this.scene.background = new THREE.Color(0x101a30);
      this.scene.fog = new THREE.Fog(0x101a30, 20, 45);
      this.dirLight.color.setHex(0x74c0fc);
      this.dirLight.intensity = 0.8;
      this.hemiLight.color.setHex(0x364fc7);
      this.hemiLight.groundColor.setHex(0x0a101d);
    }
    this.notifyState();
  }

  public setDifficulty(level: DifficultyLevel) {
    this.difficulty = level;
    this.notifyState();
  }

  public setCameraMode(mode: CameraViewMode) {
    this.cameraMode = mode;
    this.notifyState();
  }

  public startGame() {
    this.gameState = 'playing';
    document.body.dataset.state = 'playing';

    // Clear active pipes
    for (const p of this.pipeMeshes) {
      this.scene.remove(p.mesh.group);
    }
    this.pipeMeshes = [];

    // Reset bird physics
    this.birdY = 0.5;
    this.birdVelocity = 3.5;
    this.birdPitch = 0.1;
    this.score = 0;
    this.hitstopTimer = 0;
    this.cameraTrauma = 0;

    // Seed initial pipes
    const config = DIFFICULTY_PRESETS[this.difficulty];
    this.pipeSpawnDistance = config.spawnDistance;
    this.nextPipeId = 1;
    this.lastPipeX = 7.0;

    for (let i = 0; i < 4; i++) {
      this.spawnPipe(this.lastPipeX);
      this.lastPipeX += this.pipeSpawnDistance;
    }

    sound.playFlap();
    this.notifyState();
  }

  public flap() {
    if (this.gameState === 'title') {
      this.startGame();
      return;
    }
    if (this.gameState !== 'playing') {
      return;
    }

    const config = DIFFICULTY_PRESETS[this.difficulty];
    this.birdVelocity = applyFlap(this.birdVelocity, config.flapStrength);
    this.wingFlapPhase = Math.PI * 1.8; // Trigger energetic wing cycle
    this.birdSquash = 0.88;
    this.birdStretch = 1.18;

    // Audio and tiny feather puff
    sound.playFlap();
    this.particles.burst(
      WORLD_BOUNDS.birdX - 0.4,
      this.birdY,
      0,
      4,
      'feather'
    );
  }

  public pauseGame() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
      document.body.dataset.state = 'paused';
      this.notifyState();
    }
  }

  public resumeGame() {
    if (this.gameState === 'paused') {
      this.gameState = 'playing';
      document.body.dataset.state = 'playing';
      this.notifyState();
    }
  }

  public restartGame() {
    this.startGame();
  }

  public returnToTitle() {
    this.gameState = 'title';
    document.body.dataset.state = 'title';

    // Remove pipes
    for (const p of this.pipeMeshes) {
      this.scene.remove(p.mesh.group);
    }
    this.pipeMeshes = [];

    this.birdY = 0;
    this.birdVelocity = 0;
    this.birdPitch = 0;
    this.notifyState();
  }

  private spawnPipe(x: number) {
    const config = DIFFICULTY_PRESETS[this.difficulty];
    const data = createPipe(this.nextPipeId++, x, config.gapSize);
    const mesh = createPipePairMesh();
    mesh.updatePosition(data.x, data.gapY, data.gapSize);
    this.scene.add(mesh.group);
    this.pipeMeshes.push({ data, mesh });
  }

  private handleCollision() {
    this.gameState = 'gameover';
    document.body.dataset.state = 'gameover';

    sound.playHit();
    this.cameraTrauma = 1.0;
    this.hitstopTimer = 0.06; // 60ms hitstop freeze

    // Feather burst
    this.particles.burst(WORLD_BOUNDS.birdX, this.birdY, 0, 20, 'feather');

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      try {
        localStorage.setItem('flappy_best_score', String(this.bestScore));
      } catch {
        // ignore
      }
      sound.playMedalFanfare();
    } else {
      setTimeout(() => sound.playFall(), 150);
    }

    this.notifyState();
  }

  private bindEvents() {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
        e.preventDefault();
        this.flap();
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        e.preventDefault();
        if (this.gameState === 'playing') this.pauseGame();
        else if (this.gameState === 'paused') this.resumeGame();
      } else if (e.code === 'KeyM') {
        sound.toggleMute();
        this.notifyState();
      } else if (e.code === 'KeyC') {
        const modes: CameraViewMode[] = ['classic_3d', 'action_cam', 'first_person'];
        const nextIdx = (modes.indexOf(this.cameraMode) + 1) % modes.length;
        this.setCameraMode(modes[nextIdx]);
      } else if (e.code === 'Enter') {
        if (this.gameState === 'title' || this.gameState === 'gameover') {
          this.startGame();
        }
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      // Only flap if click was directly on canvas or not interactive UI
      const target = e.target as HTMLElement;
      if (target.closest('button, [role="button"], a, input, select')) return;
      this.flap();
    };

    const onResize = () => {
      if (this.isDestroyed) return;
      const w = this.container.clientWidth || window.innerWidth;
      const h = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('resize', onResize);

    // Save cleaner
    this.disposeListeners = () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', onResize);
    };
  }

  private disposeListeners: () => void = () => {};

  private startLoop() {
    this.lastTime = performance.now();

    const afterDraw = (cb: () => void) => {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (this.isDestroyed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 60);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (this.isDestroyed) return;
      const now = performance.now();
      const rawDt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      this.update(dt);
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private update(dt: number) {
    const config = DIFFICULTY_PRESETS[this.difficulty];

    // Handle sim hitstop: physics frozen while rendering & camera shake continue
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    // Decay camera trauma
    if (this.cameraTrauma > 0) {
      this.cameraTrauma = Math.max(0, this.cameraTrauma - dt * 2.5);
    }

    if (this.gameState === 'playing') {
      // 1. Advance bird physics
      const physics = updateBirdPhysics(this.birdY, this.birdVelocity, dt, config.gravity);
      this.birdY = physics.y;
      this.birdVelocity = physics.velocity;
      this.birdPitch = calculateBirdPitch(this.birdVelocity, this.birdPitch, dt);

      // 2. Advance pipes
      const moveDistance = config.speed * dt;
      for (const p of this.pipeMeshes) {
        p.data.x -= moveDistance;
        p.mesh.updatePosition(p.data.x, p.data.gapY, p.data.gapSize);
      }

      // 3. Check pipe passes / scoring
      const passResult = checkPipePasses(
        WORLD_BOUNDS.birdX,
        this.pipeMeshes.map((p) => p.data)
      );
      if (passResult.scoreIncrement > 0) {
        this.score += passResult.scoreIncrement;
        sound.playScore(Math.min(5, 1 + Math.floor(this.score / 5)));
        // Star spark burst at pipe exit
        this.particles.burst(WORLD_BOUNDS.birdX + 0.8, this.birdY, 0, 10, 'spark');
        this.notifyState();
      }

      // 4. Remove offscreen pipes and spawn new ones
      while (this.pipeMeshes.length > 0 && this.pipeMeshes[0].data.x < -9) {
        const removed = this.pipeMeshes.shift()!;
        this.scene.remove(removed.mesh.group);
      }

      const lastPipe = this.pipeMeshes[this.pipeMeshes.length - 1];
      if (lastPipe && lastPipe.data.x < 18) {
        this.spawnPipe(lastPipe.data.x + this.pipeSpawnDistance);
      }

      // 5. Check collision
      const isHit = checkCollision(
        this.birdY,
        WORLD_BOUNDS.birdRadius,
        this.pipeMeshes.map((p) => p.data)
      );
      if (isHit) {
        this.handleCollision();
      }

      // 6. Scroll ground
      this.ground.updateScroll(config.speed, dt);
    } else if (this.gameState === 'title') {
      // Gentle floating bob in title screen
      const time = performance.now() * 0.003;
      this.birdY = Math.sin(time) * 0.28;
      this.birdPitch = Math.cos(time) * 0.08;
      this.ground.updateScroll(1.5, dt);
    } else if (this.gameState === 'gameover') {
      // Fall down to ground after death
      if (this.birdY > WORLD_BOUNDS.groundY + WORLD_BOUNDS.birdRadius) {
        this.birdVelocity = Math.max(this.birdVelocity - config.gravity * dt, -16);
        this.birdY += this.birdVelocity * dt;
        this.birdPitch = -Math.PI / 2.2; // Nose down
      }
    }

    // Dynamic Wing Flap Animation
    if (this.gameState === 'playing' || this.gameState === 'title') {
      const flapSpeed = this.birdVelocity > 0 ? 28 : 12;
      this.wingFlapPhase += dt * flapSpeed;
      const wingAngle = Math.sin(this.wingFlapPhase) * 0.65;
      this.birdParts.leftWingGroup.rotation.z = wingAngle;
      this.birdParts.rightWingGroup.rotation.z = -wingAngle;
    } else {
      // Limp wings on defeat
      this.birdParts.leftWingGroup.rotation.z = -0.5;
      this.birdParts.rightWingGroup.rotation.z = 0.5;
    }

    // Squash & Stretch recovery
    this.birdSquash += (1.0 - this.birdSquash) * (1 - Math.exp(-12 * dt));
    this.birdStretch += (1.0 - this.birdStretch) * (1 - Math.exp(-12 * dt));
    this.birdParts.root.scale.set(
      this.birdStretch,
      this.birdSquash,
      (this.birdSquash + this.birdStretch) / 2
    );

    // Apply bird position and rotation
    this.birdParts.root.position.set(WORLD_BOUNDS.birdX, this.birdY, 0);
    this.birdParts.root.rotation.z = this.birdPitch;

    // Drift clouds
    for (const cloud of this.clouds) {
      cloud.position.x -= 0.6 * dt;
      if (cloud.position.x < -30) {
        cloud.position.x = 35 + Math.random() * 8;
      }
    }

    // Update particles
    this.particles.update(dt);

    // Update Camera based on Camera Mode
    this.updateCamera(dt);
  }

  private updateCamera(dt: number) {
    const shake = this.cameraTrauma * this.cameraTrauma * 0.35;
    const shakeX = (Math.random() - 0.5) * shake;
    const shakeY = (Math.random() - 0.5) * shake;

    if (this.cameraMode === 'classic_3d') {
      // Classic Side-View 3D: clear lateral perspective with depth
      const targetX = WORLD_BOUNDS.birdX + 2.5 + shakeX;
      const targetY = (this.birdY * 0.35) + 0.2 + shakeY;
      const targetZ = 10.5;

      this.camera.position.x += (targetX - this.camera.position.x) * (1 - Math.exp(-8 * dt));
      this.camera.position.y += (targetY - this.camera.position.y) * (1 - Math.exp(-8 * dt));
      this.camera.position.z += (targetZ - this.camera.position.z) * (1 - Math.exp(-8 * dt));
      this.camera.lookAt(WORLD_BOUNDS.birdX + 1.2, this.birdY * 0.3, 0);
    } else if (this.cameraMode === 'action_cam') {
      // Dynamic Action 3/4 Chase Cam: cinematic behind and slightly offset
      const targetX = WORLD_BOUNDS.birdX - 3.2 + shakeX;
      const targetY = this.birdY + 1.2 + shakeY;
      const targetZ = 3.6;

      this.camera.position.x += (targetX - this.camera.position.x) * (1 - Math.exp(-10 * dt));
      this.camera.position.y += (targetY - this.camera.position.y) * (1 - Math.exp(-10 * dt));
      this.camera.position.z += (targetZ - this.camera.position.z) * (1 - Math.exp(-10 * dt));
      this.camera.lookAt(WORLD_BOUNDS.birdX + 3.5, this.birdY, 0);
    } else {
      // First-Person / Cockpit Cam: looking forward through the pipe gaps
      const targetX = WORLD_BOUNDS.birdX + 0.2 + shakeX;
      const targetY = this.birdY + 0.2 + shakeY;
      const targetZ = shake * 0.2;

      this.camera.position.set(targetX, targetY, targetZ);
      this.camera.lookAt(WORLD_BOUNDS.birdX + 10, this.birdY + this.birdPitch * 3, 0);
    }
  }

  private notifyState() {
    this.onStatsChange({
      score: this.score,
      bestScore: this.bestScore,
      combo: Math.min(5, 1 + Math.floor(this.score / 5)),
      state: this.gameState,
      difficulty: this.difficulty,
      cameraMode: this.cameraMode,
      theme: this.theme,
    });
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      clearTimeout(this.frameId);
    }
    this.disposeListeners();
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
