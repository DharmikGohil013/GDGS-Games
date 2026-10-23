/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import {
  BLOCK_DEFS,
  BlockType,
  CHUNK_HEIGHT,
  CHUNK_SIZE_X,
  CHUNK_SIZE_Z,
  ITEM_DEFS,
  ItemStack,
} from './constants';
import { createVoxelTextureAtlas, getTileUV, AtlasTile } from './textures';
import { VoxelWorld, Chunk } from './world';
import { PhysicsEngine, RaycastResult } from './physics';
import { EntityManager } from './entities';
import { sound } from './audio';
import { ambientAudio } from './ambient';
import { calculateMiningTime, tickSurvivalVitals, determineBiome, BiomeType } from './rules';

export interface PlayerStats {
  health: number;
  maxHealth: number;
  hunger: number;
  maxHunger: number;
  oxygen: number;
  maxOxygen: number;
  xp: number;
  hotbar: (ItemStack | null)[];
  inventory: (ItemStack | null)[];
  activeSlot: number;
  gameMode: 'survival' | 'creative';
  isFlying: boolean;
  currentBiome: BiomeType;
}

export interface EngineCallbacks {
  onStatsUpdate: (stats: PlayerStats) => void;
  onOpenInventory: (type: 'inventory' | 'crafting' | 'furnace') => void;
  onPause: () => void;
  onGameOver: () => void;
}

export class VoxelEngine {
  public container: HTMLElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public world: VoxelWorld;
  public entityManager: EntityManager;
  public callbacks: EngineCallbacks;

  // Software GL detection
  public isSoftwareGl: boolean = false;

  // Lighting & Sky
  public sunLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public ambientLight: THREE.AmbientLight;
  public sunMesh: THREE.Mesh;
  public moonMesh: THREE.Mesh;
  public skyColor: THREE.Color = new THREE.Color(0x78a7ff);
  public horizonColor: THREE.Color = new THREE.Color(0xc0d8ff);

  // Textures and Materials
  public atlasTexture: THREE.CanvasTexture;
  public solidMaterial: THREE.MeshLambertMaterial;
  public waterMaterial: THREE.MeshLambertMaterial;

  // Player position, velocity, and rotation
  public playerPos: THREE.Vector3 = new THREE.Vector3(8, 25, 8);
  public playerVel: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public pitch: number = 0; // Look up/down (-89 to 89 deg)
  public yaw: number = 0;   // Look left/right

  // Survival Stats
  public stats: PlayerStats = {
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
  };

  // Input states
  public keys: { [key: string]: boolean } = {};
  public isPointerLocked: boolean = false;
  public isMining: boolean = false;
  public miningProgress: number = 0; // 0 to 1
  public miningBlock: { x: number; y: number; z: number; type: BlockType } | null = null;
  public isEating: boolean = false;
  public eatProgress: number = 0;

  // Targeting and UI Helpers
  public currentTarget: RaycastResult | null = null;
  public highlightBox: THREE.LineSegments;
  public crackMesh: THREE.Mesh;

  // First person hand and tool
  public firstPersonGroup: THREE.Group;
  public handArmMesh: THREE.Mesh;
  public heldItemMesh: THREE.Mesh;
  public armBobTime: number = 0;
  public swingProgress: number = 0;

  // Day/Night cycle
  public timeOfDay: number = 0.25; // 0 = dawn, 0.25 = noon, 0.5 = dusk, 0.75 = midnight
  public dayLengthSeconds: number = 300; // 5 min full day/night

  // Chunk render distance
  public renderRadius: number = 2; // 5x5 chunks around player

  // Animation frame
  private animationFrameId: number = 0;
  private isDestroyed: boolean = false;
  private lastTime: number = performance.now();
  private vitalTimer: number = 0;
  private biomeCheckTimer: number = 0;
  private miningAudioTimer: number = 0;
  private statsThrottleTimer: number = 0;

  constructor(container: HTMLElement, callbacks: EngineCallbacks, seed: number = 1337) {
    this.container = container;
    this.callbacks = callbacks;

    // Detect software gl
    const probe = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();
    this.isSoftwareGl = probe;

    // Init renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Init Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      500
    );

    // Fog
    this.scene.fog = new THREE.Fog(this.horizonColor, 25, 75);

    // Textures & Materials
    const { texture } = createVoxelTextureAtlas();
    this.atlasTexture = texture;

    this.solidMaterial = new THREE.MeshLambertMaterial({
      map: this.atlasTexture,
      vertexColors: true,
      alphaTest: 0.1,
    });

    this.waterMaterial = new THREE.MeshLambertMaterial({
      map: this.atlasTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });

    // World & Entities
    this.world = new VoxelWorld(seed);
    this.entityManager = new EntityManager(this.scene);

    // Setup Lighting
    this.hemiLight = new THREE.HemisphereLight(0xddeeff, 0x334422, 0.7);
    this.scene.add(this.hemiLight);

    this.ambientLight = new THREE.AmbientLight(0x556677, 0.4);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    this.sunLight.castShadow = !this.isSoftwareGl;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 150;
    const d = 35;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.scene.add(this.sunLight);

    // Sun & Moon visual billboard meshes
    const sunGeom = new THREE.PlaneGeometry(16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffee, side: THREE.DoubleSide });
    this.sunMesh = new THREE.Mesh(sunGeom, sunMat);
    this.scene.add(this.sunMesh);

    const moonGeom = new THREE.PlaneGeometry(12, 12);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xe0e8f0, side: THREE.DoubleSide });
    this.moonMesh = new THREE.Mesh(moonGeom, moonMat);
    this.scene.add(this.moonMesh);

    // Target Highlight Box Wireframe
    const boxGeom = new THREE.BoxGeometry(1.002, 1.002, 1.002);
    const edges = new THREE.EdgesGeometry(boxGeom);
    this.highlightBox = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 })
    );
    this.highlightBox.visible = false;
    this.scene.add(this.highlightBox);

    // Mining Crack Overlay Mesh
    const crackGeom = new THREE.BoxGeometry(1.003, 1.003, 1.003);
    const crackMat = new THREE.MeshBasicMaterial({
      map: this.atlasTexture,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    this.crackMesh = new THREE.Mesh(crackGeom, crackMat);
    this.crackMesh.visible = false;
    this.scene.add(this.crackMesh);

    // First Person Hand / Held Item
    this.firstPersonGroup = new THREE.Group();
    const armGeom = new THREE.BoxGeometry(0.2, 0.6, 0.2);
    const armMat = new THREE.MeshLambertMaterial({ color: 0xd2a679 });
    this.handArmMesh = new THREE.Mesh(armGeom, armMat);
    this.handArmMesh.position.set(0.35, -0.4, -0.6);
    this.handArmMesh.rotation.set(0.4, -0.2, 0.3);
    this.firstPersonGroup.add(this.handArmMesh);

    // Held item preview
    const heldGeom = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    const heldMat = new THREE.MeshLambertMaterial({ map: this.atlasTexture });
    this.heldItemMesh = new THREE.Mesh(heldGeom, heldMat);
    this.heldItemMesh.position.set(0.3, -0.3, -0.7);
    this.heldItemMesh.rotation.set(0.3, -0.4, 0.2);
    this.firstPersonGroup.add(this.heldItemMesh);

    this.camera.add(this.firstPersonGroup);
    this.scene.add(this.camera);

    // Initial Chunks around spawn
    this.updateChunks();

    // Spawn player safely atop terrain at center
    this.spawnPlayerAtSafeHeight(8, 8);

    // Spawn initial peaceful & hostile mobs
    this.spawnInitialMobs();

    // Bind event listeners
    this.bindEvents();

    // Start render loop
    this.lastTime = performance.now();
    this.loop();
  }

  public spawnPlayerAtSafeHeight(targetX: number, targetZ: number) {
    this.playerPos.x = targetX;
    this.playerPos.z = targetZ;

    // Ensure chunks around target are created
    const { cx, cz } = this.world.worldToChunk(targetX, targetZ);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        this.world.getOrCreateChunk(cx + dx, cz + dz);
      }
    }

    // Find highest solid block
    let surfaceY = 22;
    for (let y = CHUNK_HEIGHT - 2; y >= 1; y--) {
      if (this.world.isSolidBlock(Math.floor(targetX), y, Math.floor(targetZ))) {
        surfaceY = y + 1.0;
        break;
      }
    }
    this.playerPos.y = surfaceY;
    this.playerVel.set(0, 0, 0);
  }

  public spawnInitialMobs() {
    // Spawn 2 cows and 2 pigs nearby on grass
    for (let i = 0; i < 4; i++) {
      const mx = (Math.random() - 0.5) * 30;
      const mz = (Math.random() - 0.5) * 30;
      let my = 20;
      for (let y = 40; y >= 5; y--) {
        if (this.world.isSolidBlock(Math.floor(mx), y, Math.floor(mz))) {
          my = y + 1;
          break;
        }
      }
      if (i % 2 === 0) {
        this.entityManager.spawnCow(mx, my, mz);
      } else {
        this.entityManager.spawnPig(mx, my, mz);
      }
    }
  }

  public clearWorld() {
    for (const chunk of this.world.chunks.values()) {
      if (chunk.mesh) {
        this.scene.remove(chunk.mesh);
        chunk.mesh.geometry.dispose();
        chunk.mesh = null;
      }
      if (chunk.waterMesh) {
        this.scene.remove(chunk.waterMesh);
        chunk.waterMesh.geometry.dispose();
        chunk.waterMesh = null;
      }
    }
    this.world.chunks.clear();
    this.entityManager.clear();
  }

  private bindEvents() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('wheel', this.onWheel);
    window.addEventListener('resize', this.onResize);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
  }

  public unbindEvents() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
  }

  public requestPointerLock() {
    try {
      ambientAudio.resume();
      const p = this.renderer.domElement.requestPointerLock?.() as unknown as Promise<void> | undefined;
      if (p && typeof p.catch === 'function') {
        p.catch(() => {});
      }
    } catch {
      // Ignored in environments where user gesture is required
    }
  }

  public exitPointerLock() {
    document.exitPointerLock?.();
  }

  private onPointerLockChange = () => {
    this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
  };

  private onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;

    // Number keys 1-9 for hotbar slot
    if (e.code.startsWith('Digit')) {
      const num = parseInt(e.code.replace('Digit', ''), 10);
      if (num >= 1 && num <= 9) {
        this.stats.activeSlot = num - 1;
        this.callbacks.onStatsUpdate({ ...this.stats });
      }
    }

    // Toggle Inventory with E
    if (e.code === 'KeyE') {
      this.exitPointerLock();
      this.callbacks.onOpenInventory('inventory');
    }

    // Toggle Pause with Escape or P
    if (e.code === 'Escape' || e.code === 'KeyP') {
      this.exitPointerLock();
      this.callbacks.onPause();
    }

    // Toggle Creative Flying with KeyF
    if (e.code === 'KeyF' && this.stats.gameMode === 'creative') {
      this.stats.isFlying = !this.stats.isFlying;
      this.callbacks.onStatsUpdate({ ...this.stats });
    }

    // Toggle Audio with M
    if (e.code === 'KeyM') {
      const muted = sound.toggleMute();
      ambientAudio.setMuted(muted);
      this.callbacks.onStatsUpdate({ ...this.stats });
    }

    // Drop held item with Q
    if (e.code === 'KeyQ') {
      const held = this.stats.hotbar[this.stats.activeSlot];
      if (held && held.count > 0) {
        held.count--;
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        const drop = this.entityManager.spawnItemDrop(
          this.playerPos.x + forward.x * 0.8,
          this.playerPos.y + 1.2,
          this.playerPos.z + forward.z * 0.8,
          held.id,
          1
        );
        drop.velocity.set(forward.x * 5, 2.5, forward.z * 5);
        sound.playSwing();

        if (held.count <= 0) {
          this.stats.hotbar[this.stats.activeSlot] = null;
        }
        this.callbacks.onStatsUpdate({ ...this.stats });
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isPointerLocked) return;

    const sensitivity = 0.0022;
    this.yaw -= e.movementX * sensitivity;
    this.pitch -= e.movementY * sensitivity;

    // Clamp pitch between -89 and +89 degrees
    const maxPitch = (Math.PI / 2) - 0.02;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
  };

  private onWheel = (e: WheelEvent) => {
    if (e.deltaY > 0) {
      this.stats.activeSlot = (this.stats.activeSlot + 1) % 9;
    } else {
      this.stats.activeSlot = (this.stats.activeSlot + 8) % 9;
    }
    this.callbacks.onStatsUpdate({ ...this.stats });
  };

  private onMouseDown = (e: MouseEvent) => {
    if (!this.isPointerLocked) {
      this.requestPointerLock();
      return;
    }

    // Left click: Mining or Attacking
    if (e.button === 0) {
      this.swingArm();

      // Check if hitting a mob in front
      const hitMob = this.getMobUnderCrosshair();
      if (hitMob) {
        const heldItem = this.stats.hotbar[this.stats.activeSlot];
        const itemDef = heldItem ? ITEM_DEFS[heldItem.id] : null;
        const damage = itemDef?.attackDamage || 1;

        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        this.entityManager.damageMob(hitMob.id, damage, forward);
        return;
      }

      // Start mining block
      if (this.currentTarget && this.currentTarget.hit) {
        this.isMining = true;
        this.miningProgress = 0;
        this.miningBlock = {
          x: this.currentTarget.blockX,
          y: this.currentTarget.blockY,
          z: this.currentTarget.blockZ,
          type: this.currentTarget.blockType,
        };
        sound.playHit();
      }
    }

    // Right click: Place block, interact, or eat food
    if (e.button === 2) {
      e.preventDefault();
      const heldItem = this.stats.hotbar[this.stats.activeSlot];

      // Check if eating food
      if (heldItem && ITEM_DEFS[heldItem.id]?.isFood) {
        const food = ITEM_DEFS[heldItem.id];
        if (this.stats.hunger < this.stats.maxHunger || heldItem.id === 'apple') {
          sound.playEat();
          this.stats.hunger = Math.min(this.stats.maxHunger, this.stats.hunger + (food.foodRestore || 4));
          heldItem.count--;
          if (heldItem.count <= 0) {
            this.stats.hotbar[this.stats.activeSlot] = null;
          }
          this.callbacks.onStatsUpdate({ ...this.stats });
          return;
        }
      }

      // Check block interaction (Crafting Table / Furnace)
      if (this.currentTarget && this.currentTarget.hit) {
        const targetType = this.currentTarget.blockType;
        if (targetType === BlockType.CRAFTING_TABLE) {
          this.exitPointerLock();
          this.callbacks.onOpenInventory('crafting');
          return;
        }
        if (targetType === BlockType.FURNACE || targetType === BlockType.FURNACE_LIT) {
          this.exitPointerLock();
          this.callbacks.onOpenInventory('furnace');
          return;
        }

        // Place block from hand
        if (heldItem) {
          const itemDef = ITEM_DEFS[heldItem.id];
          if (itemDef && itemDef.placeableBlock) {
            const placeX = this.currentTarget.blockX + this.currentTarget.normalX;
            const placeY = this.currentTarget.blockY + this.currentTarget.normalY;
            const placeZ = this.currentTarget.blockZ + this.currentTarget.normalZ;

            // Don't place inside player bounding box
            const halfW = PhysicsEngine.PLAYER_WIDTH / 2;
            const insidePlayer =
              placeX >= Math.floor(this.playerPos.x - halfW) &&
              placeX <= Math.floor(this.playerPos.x + halfW) &&
              placeZ >= Math.floor(this.playerPos.z - halfW) &&
              placeZ <= Math.floor(this.playerPos.z + halfW) &&
              placeY >= Math.floor(this.playerPos.y) &&
              placeY <= Math.floor(this.playerPos.y + PhysicsEngine.PLAYER_HEIGHT);

            if (!insidePlayer) {
              this.world.setBlock(placeX, placeY, placeZ, itemDef.placeableBlock);
              sound.playPlace();
              this.markChunksNearDirty(placeX, placeZ);

              // Decrement held item in survival
              if (this.stats.gameMode === 'survival') {
                heldItem.count--;
                if (heldItem.count <= 0) {
                  this.stats.hotbar[this.stats.activeSlot] = null;
                }
              }
              this.callbacks.onStatsUpdate({ ...this.stats });
            }
          }
        }
      }
    }
  };

  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.isMining = false;
      this.miningProgress = 0;
      this.crackMesh.visible = false;
    }
  };

  private getMobUnderCrosshair() {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    raycaster.far = 4.0;

    for (const mob of this.entityManager.mobs) {
      const hits = raycaster.intersectObject(mob.group, true);
      if (hits.length > 0) {
        return mob;
      }
    }
    return null;
  }

  public swingArm() {
    this.swingProgress = 1.0;
    sound.playSwing();
  }

  public markChunksNearDirty(wx: number, wz: number) {
    const { cx, cz, lx, lz } = this.world.worldToChunk(wx, wz);
    const chunk = this.world.getChunk(cx, cz);
    if (chunk) chunk.isDirty = true;

    // Check neighbors if on border
    if (lx === 0) this.world.getChunk(cx - 1, cz)!.isDirty = true;
    if (lx === CHUNK_SIZE_X - 1) this.world.getChunk(cx + 1, cz)!.isDirty = true;
    if (lz === 0) this.world.getChunk(cx, cz - 1)!.isDirty = true;
    if (lz === CHUNK_SIZE_Z - 1) this.world.getChunk(cx, cz + 1)!.isDirty = true;
  }

  /**
   * Main 60fps simulation update.
   */
  public update(dt: number) {
    // 1. Day / Night cycle
    this.timeOfDay = (this.timeOfDay + dt / this.dayLengthSeconds) % 1.0;
    const sunAngle = this.timeOfDay * Math.PI * 2;

    // Sun & Moon positions
    const sunDist = 120;
    const sunX = Math.cos(sunAngle) * sunDist + this.playerPos.x;
    const sunY = Math.sin(sunAngle) * sunDist;
    const sunZ = this.playerPos.z;

    this.sunMesh.position.set(sunX, sunY, sunZ);
    this.sunMesh.lookAt(this.playerPos);

    this.moonMesh.position.set(-sunX + 2 * this.playerPos.x, -sunY, sunZ);
    this.moonMesh.lookAt(this.playerPos);

    this.sunLight.position.set(sunX, Math.max(10, sunY), sunZ);
    this.sunLight.target.position.copy(this.playerPos);
    this.sunLight.target.updateMatrixWorld();

    // Sky and lighting color based on sun height
    const isDay = sunY > 0;
    const sunRatio = Math.max(0, Math.min(1, (sunY + 20) / 100));

    // Interpolate sky colors
    const daySky = new THREE.Color(0x6eb1ff);
    const nightSky = new THREE.Color(0x060914);
    const sunsetSky = new THREE.Color(0xd27d42);

    let curSky: THREE.Color;
    if (sunRatio > 0.3) {
      curSky = daySky.clone().lerp(sunsetSky, (1 - sunRatio) * 0.5);
    } else {
      curSky = sunsetSky.clone().lerp(nightSky, 1 - sunRatio / 0.3);
    }

    this.scene.background = curSky;
    if (this.scene.fog) {
      this.scene.fog.color = curSky;
    }

    // Directional light intensity
    this.sunLight.intensity = Math.max(0.15, sunRatio * 1.3);
    this.hemiLight.intensity = Math.max(0.2, sunRatio * 0.6);

    // Spawn hostile mobs at night
    if (!isDay && Math.random() < 0.005 && this.entityManager.mobs.length < 8) {
      const angle = Math.random() * Math.PI * 2;
      const spawnDist = 16 + Math.random() * 8;
      const sx = this.playerPos.x + Math.cos(angle) * spawnDist;
      const sz = this.playerPos.z + Math.sin(angle) * spawnDist;
      let sy = 25;
      for (let y = 45; y >= 5; y--) {
        if (this.world.isSolidBlock(Math.floor(sx), y, Math.floor(sz))) {
          sy = y + 1;
          break;
        }
      }
      if (Math.random() > 0.4) {
        this.entityManager.spawnZombie(sx, sy, sz);
        sound.playZombieGroan();
      } else {
        this.entityManager.spawnCreeper(sx, sy, sz);
      }
    }

    // Biome evaluation and procedural ambient soundscape updates (~2.5 Hz)
    this.biomeCheckTimer += dt;
    if (this.biomeCheckTimer >= 0.4) {
      this.biomeCheckTimer = 0;
      const px = Math.floor(this.playerPos.x);
      const py = Math.floor(this.playerPos.y);
      const pz = Math.floor(this.playerPos.z);
      const surfaceY = this.world.getSurfaceHeight(px, pz);
      const hasCeiling = this.world.hasCeilingAbove(px, py, pz);
      const temperature = this.world.noise.noise2D(px * 0.004 + 100, pz * 0.004 + 100);
      const blockAtEyes = this.world.getBlock(
        px,
        Math.floor(this.playerPos.y + PhysicsEngine.EYE_HEIGHT),
        pz
      );
      const isSubmerged = blockAtEyes === BlockType.WATER;

      const nearTreesCount = this.world.treePositions.filter(
        (t) => Math.hypot(t.x - px, t.z - pz) < 16
      ).length;

      const newBiome = determineBiome({
        x: px,
        y: py,
        z: pz,
        surfaceY,
        temperature,
        hasCeiling,
        isSubmerged,
        nearTreesCount,
      });

      if (newBiome !== this.stats.currentBiome) {
        this.stats.currentBiome = newBiome;
        ambientAudio.setBiome(newBiome, isDay);
      }
    }

    // 2. Player Movement Input
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();

    // Horizontal look vectors
    forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();

    const isSprinting = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    const isSneaking = this.keys['ControlLeft'] || this.keys['KeyC'];

    let moveSpeed = 4.3; // m/s walking speed
    if (isSprinting && this.stats.hunger >= 6) moveSpeed = 6.8;
    if (isSneaking) moveSpeed = 1.8;
    if (this.stats.isFlying) moveSpeed = 10.0;

    const moveDir = new THREE.Vector3(0, 0, 0);
    if (this.keys['KeyW']) moveDir.add(forward);
    if (this.keys['KeyS']) moveDir.sub(forward);
    if (this.keys['KeyD']) moveDir.add(right);
    if (this.keys['KeyA']) moveDir.sub(right);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      this.playerVel.x += moveDir.x * moveSpeed * 8.0 * dt;
      this.playerVel.z += moveDir.z * moveSpeed * 8.0 * dt;

      // Deplete hunger when sprinting
      if (isSprinting && this.stats.gameMode === 'survival') {
        this.stats.hunger = Math.max(0, this.stats.hunger - 0.3 * dt);
      }
    }

    // Jumping / Flying
    if (this.keys['Space']) {
      if (this.stats.isFlying) {
        this.playerVel.y = 8.0;
      }
    }

    // 3. Physics update
    const { onGround, inWater, fallDamage } = PhysicsEngine.updatePlayerPhysics(
      this.world,
      this.playerPos,
      this.playerVel,
      dt,
      isSneaking,
      this.stats.isFlying
    );

    // Apply fall damage
    if (fallDamage > 0 && this.stats.gameMode === 'survival') {
      this.takeDamage(fallDamage);
    }

    // Void fall-through guard: rescue player if they ever fall below world bed
    if (this.playerPos.y < 0) {
      this.spawnPlayerAtSafeHeight(this.playerPos.x, this.playerPos.z);
      if (this.stats.gameMode === 'survival') {
        this.takeDamage(4);
      }
    }

    // Jump on Space when on ground or swimming
    if (this.keys['Space']) {
      if (onGround && !this.stats.isFlying) {
        this.playerVel.y = 8.8; // jump impulse
        sound.playStep('grass');
      } else if (inWater) {
        this.playerVel.y = 3.5; // swim up
      }
    }

    // Oxygen depletion when submerged in water
    const blockAtEyes = this.world.getBlock(
      Math.floor(this.playerPos.x),
      Math.floor(this.playerPos.y + PhysicsEngine.EYE_HEIGHT),
      Math.floor(this.playerPos.z)
    );
    if (blockAtEyes === BlockType.WATER && this.stats.gameMode === 'survival') {
      this.stats.oxygen = Math.max(0, this.stats.oxygen - 3.5 * dt);
      if (this.stats.oxygen === 0) {
        this.takeDamage(2);
      }
    } else {
      this.stats.oxygen = Math.min(this.stats.maxOxygen, this.stats.oxygen + 10 * dt);
    }

    // Survival vitals regeneration
    if (this.stats.gameMode === 'survival') {
      const vitals = tickSurvivalVitals({
        health: this.stats.health,
        hunger: this.stats.hunger,
        maxHealth: this.stats.maxHealth,
        deltaTime: dt,
        timer: this.vitalTimer,
      });
      this.stats.health = vitals.health;
      this.stats.hunger = vitals.hunger;
      this.vitalTimer = vitals.nextTimer;

      if (this.stats.health <= 0) {
        this.callbacks.onGameOver();
      }
    }

    // Footstep audio timing
    if (onGround && moveDir.lengthSq() > 0) {
      this.armBobTime += dt * (isSprinting ? 14 : 9);
      if (Math.sin(this.armBobTime) > 0.95) {
        sound.playStep('grass');
      }
    }

    // 4. Update Camera Position and Rotation
    this.camera.position.set(
      this.playerPos.x,
      this.playerPos.y + PhysicsEngine.EYE_HEIGHT,
      this.playerPos.z
    );

    // Camera rotation using Euler angles: Pitch (X) and Yaw (Y)
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.x = this.pitch;
    euler.y = this.yaw;
    this.camera.quaternion.setFromEuler(euler);

    // 5. Update First Person Hand & Tool Bobbing
    const bobX = Math.sin(this.armBobTime) * 0.03;
    const bobY = Math.abs(Math.cos(this.armBobTime)) * 0.03;

    if (this.swingProgress > 0) {
      this.swingProgress -= dt * 5.0;
      if (this.swingProgress < 0) this.swingProgress = 0;
    }
    const swingAngle = Math.sin(this.swingProgress * Math.PI) * 0.8;

    this.firstPersonGroup.position.set(bobX, -bobY, 0);
    this.handArmMesh.rotation.x = 0.4 + swingAngle;
    this.heldItemMesh.rotation.x = 0.3 + swingAngle * 1.2;

    // Update held item visual
    const held = this.stats.hotbar[this.stats.activeSlot];
    if (held) {
      this.heldItemMesh.visible = true;
    } else {
      this.heldItemMesh.visible = false;
    }

    // 6. Raycast Voxel Targeting
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);
    this.currentTarget = PhysicsEngine.raycastVoxel(
      this.world,
      this.camera.position,
      camDir,
      5.0
    );

    if (this.currentTarget.hit) {
      this.highlightBox.visible = true;
      this.highlightBox.position.set(
        this.currentTarget.blockX + 0.5,
        this.currentTarget.blockY + 0.5,
        this.currentTarget.blockZ + 0.5
      );
    } else {
      this.highlightBox.visible = false;
      this.isMining = false;
    }

    // 7. Mining logic
    if (this.isMining && this.currentTarget && this.currentTarget.hit) {
      this.miningAudioTimer = (this.miningAudioTimer || 0) + dt;
      if (this.miningAudioTimer >= 0.22) {
        this.miningAudioTimer = 0;
        sound.playHit();
      }

      const sameBlock =
        this.miningBlock &&
        this.miningBlock.x === this.currentTarget.blockX &&
        this.miningBlock.y === this.currentTarget.blockY &&
        this.miningBlock.z === this.currentTarget.blockZ;

      if (sameBlock && this.miningBlock) {
        const held = this.stats.hotbar[this.stats.activeSlot];
        const mineTime = calculateMiningTime(this.miningBlock.type, held ? held.id : null);
        this.miningProgress += dt / mineTime;

        // Show crack overlay
        const stage = Math.min(9, Math.floor(this.miningProgress * 10));
        this.crackMesh.visible = true;
        this.crackMesh.position.copy(this.highlightBox.position);

        // Map UV for crack stage
        const [u0, v0, u1, v1] = getTileUV(AtlasTile.CRACK_0 + stage);
        const crackUvs = [
          u0, v0, u1, v0, u1, v1, u0, v1,
          u0, v0, u1, v0, u1, v1, u0, v1,
          u0, v0, u1, v0, u1, v1, u0, v1,
          u0, v0, u1, v0, u1, v1, u0, v1,
          u0, v0, u1, v0, u1, v1, u0, v1,
          u0, v0, u1, v0, u1, v1, u0, v1,
        ];
        this.crackMesh.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(crackUvs, 2));

        if (this.miningProgress >= 1.0) {
          // Block broken!
          const bDef = BLOCK_DEFS[this.miningBlock.type];
          this.world.setBlock(this.miningBlock.x, this.miningBlock.y, this.miningBlock.z, BlockType.AIR);
          sound.playBreak();

          if (bDef && bDef.dropItem) {
            this.entityManager.spawnItemDrop(
              this.miningBlock.x + 0.5,
              this.miningBlock.y + 0.5,
              this.miningBlock.z + 0.5,
              bDef.dropItem,
              1
            );
          }

          this.markChunksNearDirty(this.miningBlock.x, this.miningBlock.z);
          this.isMining = false;
          this.miningProgress = 0;
          this.crackMesh.visible = false;
        }
      } else {
        this.isMining = false;
        this.miningProgress = 0;
        this.crackMesh.visible = false;
      }
    } else {
      this.crackMesh.visible = false;
    }

    // 8. Update Entities (Mobs, Drops, XP)
    this.entityManager.update(
      dt,
      this.playerPos,
      this.world,
      (damage) => this.takeDamage(damage),
      (itemId, count) => this.collectItem(itemId, count),
      (xp) => this.collectXP(xp)
    );

    // 9. Update Chunks
    this.updateChunks();

    // 10. Sync stats with React HUD (throttled to 5Hz to decouple 60Hz loop)
    this.statsThrottleTimer += dt;
    if (this.statsThrottleTimer >= 0.2) {
      this.statsThrottleTimer = 0;
      this.callbacks.onStatsUpdate({ ...this.stats });
    }
  }

  public takeDamage(amount: number) {
    if (this.stats.gameMode === 'creative') return;
    this.stats.health = Math.max(0, this.stats.health - amount);
    sound.playHurt();

    // Damage knockback / tilt
    this.pitch += 0.08;

    this.callbacks.onStatsUpdate({ ...this.stats });
    if (this.stats.health <= 0) {
      this.callbacks.onGameOver();
    }
  }

  public collectItem(itemId: string, count: number) {
    // Add to hotbar first
    let remaining = count;
    for (let i = 0; i < 9; i++) {
      const slot = this.stats.hotbar[i];
      if (slot && slot.id === itemId && slot.count < 64) {
        const space = 64 - slot.count;
        const add = Math.min(space, remaining);
        slot.count += add;
        remaining -= add;
        if (remaining <= 0) break;
      }
    }
    // Fill empty hotbar slots
    if (remaining > 0) {
      for (let i = 0; i < 9; i++) {
        if (!this.stats.hotbar[i]) {
          this.stats.hotbar[i] = { id: itemId, count: remaining };
          remaining = 0;
          break;
        }
      }
    }
    // Add to inventory slots
    if (remaining > 0) {
      for (let i = 0; i < 27; i++) {
        const slot = this.stats.inventory[i];
        if (slot && slot.id === itemId && slot.count < 64) {
          const space = 64 - slot.count;
          const add = Math.min(space, remaining);
          slot.count += add;
          remaining -= add;
          if (remaining <= 0) break;
        }
      }
    }
    if (remaining > 0) {
      for (let i = 0; i < 27; i++) {
        if (!this.stats.inventory[i]) {
          this.stats.inventory[i] = { id: itemId, count: remaining };
          remaining = 0;
          break;
        }
      }
    }

    this.callbacks.onStatsUpdate({ ...this.stats });
  }

  public collectXP(amount: number) {
    this.stats.xp += amount;
    this.callbacks.onStatsUpdate({ ...this.stats });
  }

  /**
   * Rebuilds chunks that are dirty or new within render radius.
   */
  public updateChunks() {
    const { cx: playerCx, cz: playerCz } = this.world.worldToChunk(this.playerPos.x, this.playerPos.z);

    for (let dx = -this.renderRadius; dx <= this.renderRadius; dx++) {
      for (let dz = -this.renderRadius; dz <= this.renderRadius; dz++) {
        const cx = playerCx + dx;
        const cz = playerCz + dz;
        const chunk = this.world.getOrCreateChunk(cx, cz);

        if (chunk.isDirty) {
          // Build mesh
          const { solidGeometry, waterGeometry } = this.world.buildChunkMesh(chunk);

          // Solid mesh
          if (chunk.mesh) {
            this.scene.remove(chunk.mesh);
            chunk.mesh.geometry.dispose();
            chunk.mesh = null;
          }
          if (solidGeometry) {
            chunk.mesh = new THREE.Mesh(solidGeometry, this.solidMaterial);
            chunk.mesh.castShadow = !this.isSoftwareGl;
            chunk.mesh.receiveShadow = !this.isSoftwareGl;
            this.scene.add(chunk.mesh);
          }

          // Water mesh
          if (chunk.waterMesh) {
            this.scene.remove(chunk.waterMesh);
            chunk.waterMesh.geometry.dispose();
            chunk.waterMesh = null;
          }
          if (waterGeometry) {
            chunk.waterMesh = new THREE.Mesh(waterGeometry, this.waterMaterial);
            this.scene.add(chunk.waterMesh);
          }
        }
      }
    }
  }

  public loop = () => {
    if (this.isDestroyed) return;

    const now = performance.now();
    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(rawDt, 0.05);

    this.update(dt);
    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.animationFrameId = window.setTimeout(this.loop, 100);
    } else {
      this.animationFrameId = requestAnimationFrame(this.loop);
    }
  };

  public destroy() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.animationFrameId);
    this.unbindEvents();
    this.entityManager.clear();
    ambientAudio.destroy();

    for (const chunk of this.world.chunks.values()) {
      if (chunk.mesh) {
        this.scene.remove(chunk.mesh);
        chunk.mesh.geometry.dispose();
      }
      if (chunk.waterMesh) {
        this.scene.remove(chunk.waterMesh);
        chunk.waterMesh.geometry.dispose();
      }
    }

    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
