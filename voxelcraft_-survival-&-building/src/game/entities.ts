/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { VoxelWorld } from './world';
import { sound } from './audio';
import { ITEM_DEFS } from './constants';

export interface Mob {
  id: string;
  type: 'zombie' | 'creeper' | 'pig' | 'cow';
  group: THREE.Group;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotationY: number;
  health: number;
  maxHealth: number;
  isHostile: boolean;
  attackCooldown: number;
  hitFlashTimer: number;
  // Creeper specific
  fuseTimer?: number;
  isFusing?: boolean;
  // Limbs for walking animation
  headMesh?: THREE.Mesh;
  leftArm?: THREE.Mesh;
  rightArm?: THREE.Mesh;
  leftLeg?: THREE.Mesh;
  rightLeg?: THREE.Mesh;
  walkCycle: number;
}

export interface ItemDrop {
  id: string;
  itemId: string;
  count: number;
  group: THREE.Group;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  lifeTime: number;
}

export interface XPOrb {
  id: string;
  amount: number;
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  lifeTime: number;
}

export class EntityManager {
  public mobs: Mob[] = [];
  public itemDrops: ItemDrop[] = [];
  public xpOrbs: XPOrb[] = [];
  public scene: THREE.Scene;
  private idCounter = 0;

  // Materials reused for mobs
  private materials: { [key: string]: THREE.MeshStandardMaterial } = {};

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initMaterials();
  }

  private initMaterials() {
    this.materials['zombie_skin'] = new THREE.MeshStandardMaterial({ color: 0x487a38, roughness: 0.8 });
    this.materials['zombie_shirt'] = new THREE.MeshStandardMaterial({ color: 0x22889e, roughness: 0.8 });
    this.materials['zombie_pants'] = new THREE.MeshStandardMaterial({ color: 0x2e3568, roughness: 0.8 });

    this.materials['creeper_green'] = new THREE.MeshStandardMaterial({ color: 0x28872b, roughness: 0.7 });
    this.materials['creeper_dark'] = new THREE.MeshStandardMaterial({ color: 0x1a451d, roughness: 0.7 });
    this.materials['creeper_face'] = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });

    this.materials['pig_skin'] = new THREE.MeshStandardMaterial({ color: 0xf0a19c, roughness: 0.8 });
    this.materials['pig_snout'] = new THREE.MeshStandardMaterial({ color: 0xe88a85, roughness: 0.8 });

    this.materials['cow_body'] = new THREE.MeshStandardMaterial({ color: 0x543b2a, roughness: 0.8 });
    this.materials['cow_spot'] = new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.8 });
    this.materials['cow_horn'] = new THREE.MeshStandardMaterial({ color: 0xc4b9a3, roughness: 0.8 });

    this.materials['hit_flash'] = new THREE.MeshStandardMaterial({ color: 0xff3333, roughness: 0.5 });
    this.materials['fuse_flash'] = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
  }

  public spawnZombie(x: number, y: number, z: number): Mob {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Head
    const headGeom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const head = new THREE.Mesh(headGeom, this.materials['zombie_skin']);
    head.position.y = 1.65;
    head.castShadow = true;
    group.add(head);

    // Torso
    const torsoGeom = new THREE.BoxGeometry(0.5, 0.75, 0.25);
    const torso = new THREE.Mesh(torsoGeom, this.materials['zombie_shirt']);
    torso.position.y = 1.05;
    torso.castShadow = true;
    group.add(torso);

    // Arms
    const armGeom = new THREE.BoxGeometry(0.2, 0.7, 0.2);
    const leftArm = new THREE.Mesh(armGeom, this.materials['zombie_shirt']);
    leftArm.position.set(-0.35, 1.05, 0.25);
    leftArm.rotation.x = -Math.PI / 2; // arms raised forward
    leftArm.castShadow = true;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeom, this.materials['zombie_shirt']);
    rightArm.position.set(0.35, 1.05, 0.25);
    rightArm.rotation.x = -Math.PI / 2;
    rightArm.castShadow = true;
    group.add(rightArm);

    // Legs
    const legGeom = new THREE.BoxGeometry(0.2, 0.7, 0.2);
    const leftLeg = new THREE.Mesh(legGeom, this.materials['zombie_pants']);
    leftLeg.position.set(-0.15, 0.35, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeom, this.materials['zombie_pants']);
    rightLeg.position.set(0.15, 0.35, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    this.scene.add(group);

    const mob: Mob = {
      id: `zombie_${++this.idCounter}`,
      type: 'zombie',
      group,
      position: new THREE.Vector3(x, y, z),
      velocity: new THREE.Vector3(0, 0, 0),
      rotationY: 0,
      health: 20,
      maxHealth: 20,
      isHostile: true,
      attackCooldown: 0,
      hitFlashTimer: 0,
      headMesh: head,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      walkCycle: 0,
    };

    this.mobs.push(mob);
    return mob;
  }

  public spawnCreeper(x: number, y: number, z: number): Mob {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Head
    const headGeom = new THREE.BoxGeometry(0.48, 0.48, 0.48);
    const head = new THREE.Mesh(headGeom, this.materials['creeper_green']);
    head.position.y = 1.45;
    head.castShadow = true;
    group.add(head);

    // Face eyes/mouth plaque
    const faceGeom = new THREE.BoxGeometry(0.32, 0.32, 0.02);
    const face = new THREE.Mesh(faceGeom, this.materials['creeper_face']);
    face.position.set(0, 1.45, 0.25);
    group.add(face);

    // Torso
    const torsoGeom = new THREE.BoxGeometry(0.45, 0.7, 0.25);
    const torso = new THREE.Mesh(torsoGeom, this.materials['creeper_dark']);
    torso.position.y = 0.85;
    torso.castShadow = true;
    group.add(torso);

    // 4 stubby legs
    const legGeom = new THREE.BoxGeometry(0.18, 0.5, 0.18);
    const legFL = new THREE.Mesh(legGeom, this.materials['creeper_green']);
    legFL.position.set(-0.16, 0.25, 0.16);
    legFL.castShadow = true;
    group.add(legFL);

    const legFR = new THREE.Mesh(legGeom, this.materials['creeper_green']);
    legFR.position.set(0.16, 0.25, 0.16);
    legFR.castShadow = true;
    group.add(legFR);

    const legBL = new THREE.Mesh(legGeom, this.materials['creeper_green']);
    legBL.position.set(-0.16, 0.25, -0.16);
    legBL.castShadow = true;
    group.add(legBL);

    const legBR = new THREE.Mesh(legGeom, this.materials['creeper_green']);
    legBR.position.set(0.16, 0.25, -0.16);
    legBR.castShadow = true;
    group.add(legBR);

    this.scene.add(group);

    const mob: Mob = {
      id: `creeper_${++this.idCounter}`,
      type: 'creeper',
      group,
      position: new THREE.Vector3(x, y, z),
      velocity: new THREE.Vector3(0, 0, 0),
      rotationY: 0,
      health: 16,
      maxHealth: 16,
      isHostile: true,
      attackCooldown: 0,
      hitFlashTimer: 0,
      fuseTimer: 0,
      isFusing: false,
      leftLeg: legFL,
      rightLeg: legFR,
      walkCycle: 0,
    };

    this.mobs.push(mob);
    return mob;
  }

  public spawnPig(x: number, y: number, z: number): Mob {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Body
    const bodyGeom = new THREE.BoxGeometry(0.55, 0.55, 0.85);
    const body = new THREE.Mesh(bodyGeom, this.materials['pig_skin']);
    body.position.y = 0.65;
    body.castShadow = true;
    group.add(body);

    // Head
    const headGeom = new THREE.BoxGeometry(0.45, 0.45, 0.45);
    const head = new THREE.Mesh(headGeom, this.materials['pig_skin']);
    head.position.set(0, 0.85, 0.5);
    head.castShadow = true;
    group.add(head);

    // Snout
    const snoutGeom = new THREE.BoxGeometry(0.25, 0.15, 0.1);
    const snout = new THREE.Mesh(snoutGeom, this.materials['pig_snout']);
    snout.position.set(0, 0.78, 0.75);
    group.add(snout);

    // 4 legs
    const legGeom = new THREE.BoxGeometry(0.18, 0.4, 0.18);
    const legFL = new THREE.Mesh(legGeom, this.materials['pig_skin']);
    legFL.position.set(-0.2, 0.2, 0.3);
    group.add(legFL);

    const legFR = new THREE.Mesh(legGeom, this.materials['pig_skin']);
    legFR.position.set(0.2, 0.2, 0.3);
    group.add(legFR);

    const legBL = new THREE.Mesh(legGeom, this.materials['pig_skin']);
    legBL.position.set(-0.2, 0.2, -0.3);
    group.add(legBL);

    const legBR = new THREE.Mesh(legGeom, this.materials['pig_skin']);
    legBR.position.set(0.2, 0.2, -0.3);
    group.add(legBR);

    this.scene.add(group);

    const mob: Mob = {
      id: `pig_${++this.idCounter}`,
      type: 'pig',
      group,
      position: new THREE.Vector3(x, y, z),
      velocity: new THREE.Vector3(0, 0, 0),
      rotationY: 0,
      health: 10,
      maxHealth: 10,
      isHostile: false,
      attackCooldown: 0,
      hitFlashTimer: 0,
      leftLeg: legFL,
      rightLeg: legFR,
      walkCycle: 0,
    };

    this.mobs.push(mob);
    return mob;
  }

  public spawnCow(x: number, y: number, z: number): Mob {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Body
    const bodyGeom = new THREE.BoxGeometry(0.65, 0.65, 1.0);
    const body = new THREE.Mesh(bodyGeom, this.materials['cow_body']);
    body.position.y = 0.85;
    body.castShadow = true;
    group.add(body);

    // Head
    const headGeom = new THREE.BoxGeometry(0.48, 0.48, 0.48);
    const head = new THREE.Mesh(headGeom, this.materials['cow_body']);
    head.position.set(0, 1.1, 0.65);
    head.castShadow = true;
    group.add(head);

    // Horns
    const hornGeom = new THREE.BoxGeometry(0.1, 0.2, 0.1);
    const leftHorn = new THREE.Mesh(hornGeom, this.materials['cow_horn']);
    leftHorn.position.set(-0.28, 1.35, 0.65);
    group.add(leftHorn);

    const rightHorn = new THREE.Mesh(hornGeom, this.materials['cow_horn']);
    rightHorn.position.set(0.28, 1.35, 0.65);
    group.add(rightHorn);

    // Legs
    const legGeom = new THREE.BoxGeometry(0.2, 0.55, 0.2);
    const legFL = new THREE.Mesh(legGeom, this.materials['cow_body']);
    legFL.position.set(-0.25, 0.28, 0.35);
    group.add(legFL);

    const legFR = new THREE.Mesh(legGeom, this.materials['cow_body']);
    legFR.position.set(0.25, 0.28, 0.35);
    group.add(legFR);

    this.scene.add(group);

    const mob: Mob = {
      id: `cow_${++this.idCounter}`,
      type: 'cow',
      group,
      position: new THREE.Vector3(x, y, z),
      velocity: new THREE.Vector3(0, 0, 0),
      rotationY: 0,
      health: 12,
      maxHealth: 12,
      isHostile: false,
      attackCooldown: 0,
      hitFlashTimer: 0,
      walkCycle: 0,
    };

    this.mobs.push(mob);
    return mob;
  }

  /**
   * Spawns a floating rotating item drop.
   */
  public spawnItemDrop(x: number, y: number, z: number, itemId: string, count: number = 1): ItemDrop {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Miniature 3D box representing the item
    const geom = new THREE.BoxGeometry(0.25, 0.25, 0.25);
    let color = 0x8b6540;
    if (itemId.includes('stone') || itemId.includes('ore')) color = 0x808080;
    if (itemId.includes('grass')) color = 0x4fa83d;
    if (itemId.includes('diamond')) color = 0x5ff0e8;
    if (itemId.includes('iron')) color = 0xd8af93;
    if (itemId.includes('coal')) color = 0x222222;
    if (itemId.includes('apple')) color = 0xcc2222;
    if (itemId.includes('pork') || itemId.includes('beef')) color = 0xbb4444;

    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = true;
    group.add(mesh);

    this.scene.add(group);

    const drop: ItemDrop = {
      id: `drop_${++this.idCounter}`,
      itemId,
      count,
      group,
      position: new THREE.Vector3(x, y, z),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        3.0 + Math.random() * 2,
        (Math.random() - 0.5) * 2
      ),
      lifeTime: 0,
    };

    this.itemDrops.push(drop);
    return drop;
  }

  /**
   * Spawns floating experience orbs.
   */
  public spawnXP(x: number, y: number, z: number, amount: number = 5): void {
    const geom = new THREE.DodecahedronGeometry(0.12, 0);
    const mat = new THREE.MeshBasicMaterial({ color: 0x88ff00 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);

    this.xpOrbs.push({
      id: `xp_${++this.idCounter}`,
      amount,
      mesh,
      position: new THREE.Vector3(x, y, z),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        2.5 + Math.random() * 1.5,
        (Math.random() - 0.5) * 2
      ),
      lifeTime: 0,
    });
  }

  /**
   * Updates all mobs, items, and experience orbs.
   */
  public update(
    dt: number,
    playerPos: THREE.Vector3,
    world: VoxelWorld,
    onPlayerDamage: (damage: number) => void,
    onCollectItem: (itemId: string, count: number) => void,
    onCollectXP: (amount: number) => void
  ): void {
    // 1. Update Mobs
    for (let i = this.mobs.length - 1; i >= 0; i--) {
      const mob = this.mobs[i];

      // Gravity and basic collision against terrain
      mob.velocity.y -= 20.0 * dt;
      mob.position.y += mob.velocity.y * dt;

      // Ground collision
      const groundY = Math.floor(mob.position.y);
      if (world.isSolidBlock(Math.floor(mob.position.x), groundY, Math.floor(mob.position.z))) {
        mob.position.y = groundY + 1.0;
        mob.velocity.y = 0;
      }

      // Distance to player
      const dx = playerPos.x - mob.position.x;
      const dz = playerPos.z - mob.position.z;
      const dist = Math.hypot(dx, dz);

      // AI Behavior
      if (mob.isHostile) {
        if (dist < 18.0) {
          // Aggro towards player
          mob.rotationY = Math.atan2(dx, dz);
          const speed = mob.type === 'creeper' ? 2.8 : 2.2;
          mob.velocity.x = Math.sin(mob.rotationY) * speed;
          mob.velocity.z = Math.cos(mob.rotationY) * speed;

          // Creeper fuse logic
          if (mob.type === 'creeper') {
            if (dist < 3.8) {
              if (!mob.isFusing) {
                mob.isFusing = true;
                mob.fuseTimer = 0;
                sound.playCreeperHiss();
              }
              mob.fuseTimer = (mob.fuseTimer || 0) + dt;
              // Flash white
              mob.group.scale.setScalar(1.0 + (mob.fuseTimer / 1.5) * 0.3);

              if (mob.fuseTimer >= 1.5) {
                // Detonate!
                sound.playExplosion();
                this.scene.remove(mob.group);
                this.mobs.splice(i, 1);
                // Damage player if in blast radius
                if (dist < 5.0) {
                  onPlayerDamage(Math.floor((5.0 - dist) * 4));
                }
                this.spawnXP(mob.position.x, mob.position.y, mob.position.z, 8);
                continue;
              }
            } else if (mob.isFusing) {
              // Stepped away
              mob.isFusing = false;
              mob.fuseTimer = 0;
              mob.group.scale.setScalar(1.0);
            }
          }

          // Zombie melee attack
          if (mob.type === 'zombie' && dist < 1.4 && mob.attackCooldown <= 0) {
            mob.attackCooldown = 1.0;
            onPlayerDamage(3);
            sound.playHurt();
          }
        } else {
          // Idle slow wander
          mob.velocity.x *= 0.9;
          mob.velocity.z *= 0.9;
        }
      } else {
        // Peaceful wander
        mob.velocity.x *= 0.85;
        mob.velocity.z *= 0.85;
      }

      if (mob.attackCooldown > 0) mob.attackCooldown -= dt;

      // Move horizontally with obstacle jumping
      const nextX = mob.position.x + mob.velocity.x * dt;
      const nextZ = mob.position.z + mob.velocity.z * dt;
      const blockAhead = world.isSolidBlock(Math.floor(nextX), Math.floor(mob.position.y), Math.floor(nextZ));
      if (blockAhead) {
        // Jump if 1 block step
        if (!world.isSolidBlock(Math.floor(nextX), Math.floor(mob.position.y + 1), Math.floor(nextZ))) {
          mob.velocity.y = 5.0;
        } else {
          mob.velocity.x = 0;
          mob.velocity.z = 0;
        }
      }

      mob.position.x += mob.velocity.x * dt;
      mob.position.z += mob.velocity.z * dt;
      mob.group.position.copy(mob.position);
      mob.group.rotation.y = mob.rotationY;

      // Limb walking animation
      if (Math.hypot(mob.velocity.x, mob.velocity.z) > 0.1) {
        mob.walkCycle += dt * 8;
        if (mob.leftLeg) mob.leftLeg.rotation.x = Math.sin(mob.walkCycle) * 0.6;
        if (mob.rightLeg) mob.rightLeg.rotation.x = -Math.sin(mob.walkCycle) * 0.6;
      }

      // Hit flash reset
      if (mob.hitFlashTimer > 0) {
        mob.hitFlashTimer -= dt;
      }
    }

    // 2. Update Item Drops
    for (let i = this.itemDrops.length - 1; i >= 0; i--) {
      const drop = this.itemDrops[i];
      drop.lifeTime += dt;

      // Gravity and ground collision
      drop.velocity.y -= 15.0 * dt;
      drop.position.y += drop.velocity.y * dt;

      const gy = Math.floor(drop.position.y);
      if (world.isSolidBlock(Math.floor(drop.position.x), gy, Math.floor(drop.position.z))) {
        drop.position.y = gy + 1.1;
        drop.velocity.y = 0;
        drop.velocity.x *= 0.5;
        drop.velocity.z *= 0.5;
      }

      drop.position.x += drop.velocity.x * dt;
      drop.position.z += drop.velocity.z * dt;

      // Bobbing & Rotation
      drop.group.rotation.y += dt * 2.5;
      drop.group.position.set(
        drop.position.x,
        drop.position.y + Math.sin(drop.lifeTime * 4) * 0.08,
        drop.position.z
      );

      // Magnetize to player
      const dx = playerPos.x - drop.position.x;
      const dy = playerPos.y + 0.8 - drop.position.y;
      const dz = playerPos.z - drop.position.z;
      const dist = Math.hypot(dx, dy, dz);

      if (dist < 2.2) {
        // Fly towards player
        drop.position.x += (dx / dist) * 8.0 * dt;
        drop.position.y += (dy / dist) * 8.0 * dt;
        drop.position.z += (dz / dist) * 8.0 * dt;

        if (dist < 0.6) {
          // Collected!
          sound.playPickup();
          onCollectItem(drop.itemId, drop.count);
          this.scene.remove(drop.group);
          this.itemDrops.splice(i, 1);
        }
      }
    }

    // 3. Update XP Orbs
    for (let i = this.xpOrbs.length - 1; i >= 0; i--) {
      const xp = this.xpOrbs[i];
      xp.lifeTime += dt;

      xp.mesh.rotation.x += dt * 3;
      xp.mesh.rotation.y += dt * 4;

      const dx = playerPos.x - xp.position.x;
      const dy = playerPos.y + 0.8 - xp.position.y;
      const dz = playerPos.z - xp.position.z;
      const dist = Math.hypot(dx, dy, dz);

      if (dist < 5.0) {
        xp.position.x += (dx / dist) * 9.0 * dt;
        xp.position.y += (dy / dist) * 9.0 * dt;
        xp.position.z += (dz / dist) * 9.0 * dt;

        if (dist < 0.6) {
          sound.playPickup();
          onCollectXP(xp.amount);
          this.scene.remove(xp.mesh);
          this.xpOrbs.splice(i, 1);
        }
      } else {
        // Slow float
        xp.position.y += Math.sin(xp.lifeTime * 3) * 0.005;
      }

      xp.mesh.position.copy(xp.position);
    }
  }

  /**
   * Hits a mob with a weapon or fist.
   */
  public damageMob(mobId: string, damage: number, knockbackDir: THREE.Vector3): void {
    const mob = this.mobs.find((m) => m.id === mobId);
    if (!mob) return;

    mob.health -= damage;
    mob.hitFlashTimer = 0.15;
    sound.playHit();

    // Knockback
    mob.velocity.x += knockbackDir.x * 6;
    mob.velocity.y += 3.5;
    mob.velocity.z += knockbackDir.z * 6;

    if (mob.health <= 0) {
      // Mob defeated
      sound.playHurt();
      this.scene.remove(mob.group);
      this.mobs = this.mobs.filter((m) => m.id !== mobId);

      // Drops
      if (mob.type === 'zombie') {
        this.spawnItemDrop(mob.position.x, mob.position.y, mob.position.z, 'rotten_flesh', 1 + Math.floor(Math.random() * 2));
        this.spawnXP(mob.position.x, mob.position.y, mob.position.z, 5);
      } else if (mob.type === 'creeper') {
        this.spawnItemDrop(mob.position.x, mob.position.y, mob.position.z, 'coal', 1 + Math.floor(Math.random() * 2));
        this.spawnXP(mob.position.x, mob.position.y, mob.position.z, 5);
      } else if (mob.type === 'pig') {
        this.spawnItemDrop(mob.position.x, mob.position.y, mob.position.z, 'raw_porkchop', 1 + Math.floor(Math.random() * 2));
        this.spawnXP(mob.position.x, mob.position.y, mob.position.z, 2);
      } else if (mob.type === 'cow') {
        this.spawnItemDrop(mob.position.x, mob.position.y, mob.position.z, 'raw_beef', 1 + Math.floor(Math.random() * 3));
        this.spawnXP(mob.position.x, mob.position.y, mob.position.z, 2);
      }
    }
  }

  public clear(): void {
    for (const mob of this.mobs) this.scene.remove(mob.group);
    for (const drop of this.itemDrops) this.scene.remove(drop.group);
    for (const xp of this.xpOrbs) this.scene.remove(xp.mesh);
    this.mobs = [];
    this.itemDrops = [];
    this.xpOrbs = [];
  }
}
