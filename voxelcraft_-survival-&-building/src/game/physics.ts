/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { BlockType } from './constants';
import { VoxelWorld } from './world';

export interface RaycastResult {
  hit: boolean;
  blockX: number;
  blockY: number;
  blockZ: number;
  normalX: number;
  normalY: number;
  normalZ: number;
  blockType: BlockType;
  distance: number;
}

export class PhysicsEngine {
  public static readonly PLAYER_WIDTH = 0.6;
  public static readonly PLAYER_HEIGHT = 1.8;
  public static readonly EYE_HEIGHT = 1.62;
  public static readonly GRAVITY = -26.0; // m/s^2
  public static readonly TERMINAL_VELOCITY = -45.0;

  /**
   * Fast 3D Voxel Traversal (Amanatides-Woo algorithm / DDA).
   * Steps through voxels along ray without missing any cube faces.
   */
  public static raycastVoxel(
    world: VoxelWorld,
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    maxDistance: number = 5.0
  ): RaycastResult {
    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);

    const stepX = Math.sign(direction.x);
    const stepY = Math.sign(direction.y);
    const stepZ = Math.sign(direction.z);

    const tDeltaX = stepX !== 0 ? Math.abs(1.0 / direction.x) : Infinity;
    const tDeltaY = stepY !== 0 ? Math.abs(1.0 / direction.y) : Infinity;
    const tDeltaZ = stepZ !== 0 ? Math.abs(1.0 / direction.z) : Infinity;

    const xDist = stepX > 0 ? (x + 1.0 - origin.x) : (origin.x - x);
    const yDist = stepY > 0 ? (y + 1.0 - origin.y) : (origin.y - y);
    const zDist = stepZ > 0 ? (z + 1.0 - origin.z) : (origin.z - z);

    let tMaxX = stepX !== 0 ? xDist * tDeltaX : Infinity;
    let tMaxY = stepY !== 0 ? yDist * tDeltaY : Infinity;
    let tMaxZ = stepZ !== 0 ? zDist * tDeltaZ : Infinity;

    let normalX = 0;
    let normalY = 0;
    let normalZ = 0;

    let distance = 0;

    while (distance <= maxDistance) {
      const block = world.getBlock(x, y, z);
      // Torches and non-solid transparent blocks can be targeted for mining, but air/water are skipped
      if (block !== BlockType.AIR && block !== BlockType.WATER) {
        return {
          hit: true,
          blockX: x,
          blockY: y,
          blockZ: z,
          normalX,
          normalY,
          normalZ,
          blockType: block,
          distance,
        };
      }

      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) {
          x += stepX;
          distance = tMaxX;
          tMaxX += tDeltaX;
          normalX = -stepX;
          normalY = 0;
          normalZ = 0;
        } else {
          z += stepZ;
          distance = tMaxZ;
          tMaxZ += tDeltaZ;
          normalX = 0;
          normalY = 0;
          normalZ = -stepZ;
        }
      } else {
        if (tMaxY < tMaxZ) {
          y += stepY;
          distance = tMaxY;
          tMaxY += tDeltaY;
          normalX = 0;
          normalY = -stepY;
          normalZ = 0;
        } else {
          z += stepZ;
          distance = tMaxZ;
          tMaxZ += tDeltaZ;
          normalX = 0;
          normalY = 0;
          normalZ = -stepZ;
        }
      }
    }

    return {
      hit: false,
      blockX: 0,
      blockY: 0,
      blockZ: 0,
      normalX: 0,
      normalY: 0,
      normalZ: 0,
      blockType: BlockType.AIR,
      distance: maxDistance,
    };
  }

  /**
   * Resolves player movement against solid blocks using AABB collision detection.
   */
  public static updatePlayerPhysics(
    world: VoxelWorld,
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    dt: number,
    isSneaking: boolean,
    isFlying: boolean
  ): { onGround: boolean; inWater: boolean; fallDamage: number } {
    const halfWidth = this.PLAYER_WIDTH / 2;
    let onGround = false;
    let fallDamage = 0;

    // Check if player is submerged in water
    const blockAtFeet = world.getBlock(
      Math.floor(position.x),
      Math.floor(position.y),
      Math.floor(position.z)
    );
    const blockAtEyes = world.getBlock(
      Math.floor(position.x),
      Math.floor(position.y + this.EYE_HEIGHT),
      Math.floor(position.z)
    );
    const inWater = blockAtFeet === BlockType.WATER || blockAtEyes === BlockType.WATER;

    // Apply gravity
    if (isFlying) {
      velocity.y *= 0.85;
    } else if (inWater) {
      velocity.y += this.GRAVITY * 0.15 * dt;
      velocity.y = Math.max(velocity.y, -3.0);
      velocity.x *= 0.8;
      velocity.z *= 0.8;
    } else {
      velocity.y += this.GRAVITY * dt;
      if (velocity.y < this.TERMINAL_VELOCITY) {
        velocity.y = this.TERMINAL_VELOCITY;
      }
    }

    // Helper to check collision with solid blocks
    const collidesAt = (px: number, py: number, pz: number): boolean => {
      const minBx = Math.floor(px - halfWidth + 0.02);
      const maxBx = Math.floor(px + halfWidth - 0.02);
      const minBy = Math.floor(py + 0.02);
      const maxBy = Math.floor(py + this.PLAYER_HEIGHT - 0.02);
      const minBz = Math.floor(pz - halfWidth + 0.02);
      const maxBz = Math.floor(pz + halfWidth - 0.02);

      for (let x = minBx; x <= maxBx; x++) {
        for (let y = minBy; y <= maxBy; y++) {
          for (let z = minBz; z <= maxBz; z++) {
            if (world.isSolidBlock(x, y, z)) {
              return true;
            }
          }
        }
      }
      return false;
    };

    // Sneaking ledge check
    if (isSneaking && onGround && !isFlying) {
      const testX = position.x + velocity.x * dt;
      const testZ = position.z + velocity.z * dt;
      let hasGround = false;
      const checkY = Math.floor(position.y - 0.5);
      for (let bx = Math.floor(testX - halfWidth); bx <= Math.floor(testX + halfWidth); bx++) {
        for (let bz = Math.floor(testZ - halfWidth); bz <= Math.floor(testZ + halfWidth); bz++) {
          if (world.isSolidBlock(bx, checkY, bz)) {
            hasGround = true;
            break;
          }
        }
        if (hasGround) break;
      }
      if (!hasGround) {
        velocity.x = 0;
        velocity.z = 0;
      }
    }

    // Move in X with step-assist
    const nextX = position.x + velocity.x * dt;
    if (!isFlying && collidesAt(nextX, position.y, position.z)) {
      if (onGround && !collidesAt(nextX, position.y + 1.05, position.z)) {
        position.y += 1.0;
        position.x = nextX;
      } else {
        velocity.x = 0;
      }
    } else {
      position.x = nextX;
    }

    // Move in Z with step-assist
    const nextZ = position.z + velocity.z * dt;
    if (!isFlying && collidesAt(position.x, position.y, nextZ)) {
      if (onGround && !collidesAt(position.x, position.y + 1.05, nextZ)) {
        position.y += 1.0;
        position.z = nextZ;
      } else {
        velocity.z = 0;
      }
    } else {
      position.z = nextZ;
    }

    // Vertical Movement Y with Swept Floor Clamping
    const oldY = position.y;
    let targetY = oldY + velocity.y * dt;
    const preLandingVy = velocity.y;

    const footprintMinX = Math.floor(position.x - halfWidth + 0.02);
    const footprintMaxX = Math.floor(position.x + halfWidth - 0.02);
    const footprintMinZ = Math.floor(position.z - halfWidth + 0.02);
    const footprintMaxZ = Math.floor(position.z + halfWidth - 0.02);

    if (velocity.y <= 0 && !isFlying) {
      // Swept downwards collision check
      const startBY = Math.floor(oldY + 0.05);
      const endBY = Math.floor(targetY);

      for (let by = startBY; by >= endBY; by--) {
        let hasSolidUnder = false;
        for (let bx = footprintMinX; bx <= footprintMaxX; bx++) {
          for (let bz = footprintMinZ; bz <= footprintMaxZ; bz++) {
            if (world.isSolidBlock(bx, by, bz)) {
              hasSolidUnder = true;
              break;
            }
          }
          if (hasSolidUnder) break;
        }

        if (hasSolidUnder) {
          const floorY = by + 1.0;
          if (targetY <= floorY) {
            targetY = floorY;
            velocity.y = 0;
            onGround = true;

            if (preLandingVy < -15.0 && !inWater) {
              fallDamage = Math.max(1, Math.floor((Math.abs(preLandingVy) - 13.0) * 0.8));
            }
            break;
          }
        }
      }
      position.y = targetY;
    } else if (velocity.y > 0 && !isFlying) {
      // Ceiling check
      const startBY = Math.floor(oldY + this.PLAYER_HEIGHT);
      const endBY = Math.floor(targetY + this.PLAYER_HEIGHT);

      for (let by = startBY; by <= endBY; by++) {
        let hasSolidAbove = false;
        for (let bx = footprintMinX; bx <= footprintMaxX; bx++) {
          for (let bz = footprintMinZ; bz <= footprintMaxZ; bz++) {
            if (world.isSolidBlock(bx, by, bz)) {
              hasSolidAbove = true;
              break;
            }
          }
          if (hasSolidAbove) break;
        }

        if (hasSolidAbove) {
          const ceilY = by - this.PLAYER_HEIGHT;
          if (targetY >= ceilY) {
            targetY = ceilY;
            velocity.y = 0;
            break;
          }
        }
      }
      position.y = targetY;
    } else {
      position.y = targetY;
    }

    // Secondary ground check for stationary standing
    if (!onGround && !isFlying && velocity.y <= 0) {
      const checkBY = Math.floor(position.y - 0.05);
      for (let bx = footprintMinX; bx <= footprintMaxX; bx++) {
        for (let bz = footprintMinZ; bz <= footprintMaxZ; bz++) {
          if (world.isSolidBlock(bx, checkBY, bz)) {
            const expectedFloor = checkBY + 1.0;
            if (Math.abs(position.y - expectedFloor) < 0.15) {
              position.y = expectedFloor;
              velocity.y = 0;
              onGround = true;
              break;
            }
          }
        }
        if (onGround) break;
      }
    }

    // Ground friction
    if (onGround && !isFlying) {
      velocity.x *= 0.65;
      velocity.z *= 0.65;
    } else if (!isFlying) {
      velocity.x *= 0.92;
      velocity.z *= 0.92;
    }

    return { onGround, inWater, fallDamage };
  }
}
