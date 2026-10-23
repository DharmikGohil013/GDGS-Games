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
  SEA_LEVEL,
} from './constants';
import { getTileUV, BLOCK_FACE_MAP, BlockFaceTiles } from './textures';
import { SimplexNoise } from './noise';

export interface ChunkKey {
  cx: number;
  cz: number;
}

export class Chunk {
  public cx: number;
  public cz: number;
  public blocks: Uint8Array;
  public mesh: THREE.Mesh | null = null;
  public waterMesh: THREE.Mesh | null = null;
  public isDirty: boolean = true;

  constructor(cx: number, cz: number) {
    this.cx = cx;
    this.cz = cz;
    this.blocks = new Uint8Array(CHUNK_SIZE_X * CHUNK_HEIGHT * CHUNK_SIZE_Z);
  }

  public getBlockIndex(x: number, y: number, z: number): number {
    return x + z * CHUNK_SIZE_X + y * (CHUNK_SIZE_X * CHUNK_SIZE_Z);
  }

  public getBlock(x: number, y: number, z: number): BlockType {
    if (x < 0 || x >= CHUNK_SIZE_X || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE_Z) {
      return BlockType.AIR;
    }
    return this.blocks[this.getBlockIndex(x, y, z)];
  }

  public setBlock(x: number, y: number, z: number, type: BlockType): void {
    if (x < 0 || x >= CHUNK_SIZE_X || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE_Z) {
      return;
    }
    this.blocks[this.getBlockIndex(x, y, z)] = type;
    this.isDirty = true;
  }
}

export class VoxelWorld {
  public chunks: Map<string, Chunk> = new Map();
  public noise: SimplexNoise;
  public treePositions: { x: number; y: number; z: number }[] = [];
  public worldSeed: number;

  constructor(seed: number = 42) {
    this.worldSeed = seed;
    this.noise = new SimplexNoise(seed);
  }

  public getChunkKey(cx: number, cz: number): string {
    return `${cx},${cz}`;
  }

  public getChunk(cx: number, cz: number): Chunk | undefined {
    return this.chunks.get(this.getChunkKey(cx, cz));
  }

  public getOrCreateChunk(cx: number, cz: number): Chunk {
    const key = this.getChunkKey(cx, cz);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = new Chunk(cx, cz);
      this.chunks.set(key, chunk);
      this.generateChunkTerrain(chunk);
    }
    return chunk;
  }

  public worldToChunk(x: number, z: number): { cx: number; cz: number; lx: number; lz: number } {
    const cx = Math.floor(x / CHUNK_SIZE_X);
    const cz = Math.floor(z / CHUNK_SIZE_Z);
    const lx = ((x % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
    const lz = ((z % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;
    return { cx, cz, lx, lz };
  }

  public getBlock(x: number, y: number, z: number): BlockType {
    if (y < 0 || y >= CHUNK_HEIGHT) return BlockType.AIR;
    const { cx, cz, lx, lz } = this.worldToChunk(x, z);
    const chunk = this.getOrCreateChunk(cx, cz);
    return chunk.getBlock(lx, y, lz);
  }

  public setBlock(x: number, y: number, z: number, type: BlockType): boolean {
    if (y < 0 || y >= CHUNK_HEIGHT) return false;
    const { cx, cz, lx, lz } = this.worldToChunk(x, z);
    const chunk = this.getOrCreateChunk(cx, cz);
    chunk.setBlock(lx, y, lz, type);

    // If on chunk border, mark neighbor chunk dirty so boundary faces are re-meshed
    if (lx === 0) {
      const neighbor = this.getChunk(cx - 1, cz);
      if (neighbor) neighbor.isDirty = true;
    }
    if (lx === CHUNK_SIZE_X - 1) {
      const neighbor = this.getChunk(cx + 1, cz);
      if (neighbor) neighbor.isDirty = true;
    }
    if (lz === 0) {
      const neighbor = this.getChunk(cx, cz - 1);
      if (neighbor) neighbor.isDirty = true;
    }
    if (lz === CHUNK_SIZE_Z - 1) {
      const neighbor = this.getChunk(cx, cz + 1);
      if (neighbor) neighbor.isDirty = true;
    }

    return true;
  }

  public isSolidBlock(x: number, y: number, z: number): boolean {
    const block = this.getBlock(x, y, z);
    return BLOCK_DEFS[block]?.solid || false;
  }

  public isTransparent(x: number, y: number, z: number): boolean {
    const block = this.getBlock(x, y, z);
    if (block === BlockType.AIR) return true;
    return BLOCK_DEFS[block]?.transparent || false;
  }

  public getSurfaceHeight(x: number, z: number): number {
    for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
      if (this.isSolidBlock(x, y, z)) {
        return y;
      }
    }
    return SEA_LEVEL;
  }

  public hasCeilingAbove(x: number, startY: number, z: number): boolean {
    const maxY = Math.min(CHUNK_HEIGHT - 1, Math.floor(startY) + 25);
    for (let y = Math.floor(startY) + 2; y <= maxY; y++) {
      if (this.isSolidBlock(x, y, z)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Procedural terrain generator for a chunk.
   */
  public generateChunkTerrain(chunk: Chunk): void {
    const worldX0 = chunk.cx * CHUNK_SIZE_X;
    const worldZ0 = chunk.cz * CHUNK_SIZE_Z;

    for (let lx = 0; lx < CHUNK_SIZE_X; lx++) {
      const wx = worldX0 + lx;
      for (let lz = 0; lz < CHUNK_SIZE_Z; lz++) {
        const wz = worldZ0 + lz;

        // Continental base height (rolling plains)
        const continent = this.noise.fbm2D(wx * 0.008, wz * 0.008, 3, 0.5, 2.0);
        // Mountain peak noise
        const mountain = Math.max(0, this.noise.noise2D(wx * 0.015, wz * 0.015));
        // Surface detail
        const detail = this.noise.noise2D(wx * 0.05, wz * 0.05) * 2;

        // Biome factors (moisture, temperature)
        const temperature = this.noise.noise2D(wx * 0.004 + 100, wz * 0.004 + 100);
        const isDesert = temperature > 0.45;

        // Final surface height
        let height = Math.floor(SEA_LEVEL + continent * 7 + Math.pow(mountain, 2.2) * 18 + detail);
        height = Math.max(4, Math.min(CHUNK_HEIGHT - 6, height));

        // Fill column
        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          if (y === 0) {
            // Bedrock at base
            chunk.setBlock(lx, y, lz, BlockType.BEDROCK);
          } else if (y < height - 3) {
            // Deep stone with 3D cave carving & ores
            const cave = this.noise.noise3D(wx * 0.06, y * 0.08, wz * 0.06);
            if (cave > 0.45 && y > 2) {
              // Carve cave
              chunk.setBlock(lx, y, lz, BlockType.AIR);
            } else {
              // Ore generation
              const oreNoise = this.noise.noise3D(wx * 0.2 + 50, y * 0.2 + 50, wz * 0.2 + 50);
              if (y < 12 && oreNoise > 0.65) {
                chunk.setBlock(lx, y, lz, BlockType.DIAMOND_ORE);
              } else if (y < 24 && oreNoise > 0.52) {
                chunk.setBlock(lx, y, lz, BlockType.IRON_ORE);
              } else if (oreNoise > 0.45) {
                chunk.setBlock(lx, y, lz, BlockType.COAL_ORE);
              } else {
                chunk.setBlock(lx, y, lz, BlockType.STONE);
              }
            }
          } else if (y < height) {
            // Sub-surface layer
            if (isDesert) {
              chunk.setBlock(lx, y, lz, BlockType.SANDSTONE);
            } else if (height <= SEA_LEVEL + 1) {
              chunk.setBlock(lx, y, lz, BlockType.SAND);
            } else {
              chunk.setBlock(lx, y, lz, BlockType.DIRT);
            }
          } else if (y === height) {
            // Surface top block
            if (isDesert) {
              chunk.setBlock(lx, y, lz, BlockType.SAND);
            } else if (height <= SEA_LEVEL + 1) {
              chunk.setBlock(lx, y, lz, BlockType.SAND);
            } else if (height > 34) {
              chunk.setBlock(lx, y, lz, BlockType.SNOW);
            } else {
              chunk.setBlock(lx, y, lz, BlockType.GRASS);
            }
          } else if (y <= SEA_LEVEL) {
            // Water up to sea level
            chunk.setBlock(lx, y, lz, BlockType.WATER);
          } else {
            // Air above
            chunk.setBlock(lx, y, lz, BlockType.AIR);
          }
        }

        // Feature generation on surface (Trees or Cacti)
        if (height > SEA_LEVEL + 1 && height < 34) {
          const featureRand = Math.sin(wx * 133.7 + wz * 71.9) * 10000;
          const r = featureRand - Math.floor(featureRand);

          if (isDesert && r < 0.02) {
            // Cactus
            const cactusHeight = 2 + Math.floor(r * 100) % 3;
            for (let cy = 1; cy <= cactusHeight; cy++) {
              chunk.setBlock(lx, height + cy, lz, BlockType.CACTUS);
            }
          } else if (!isDesert && r < 0.025 && lx >= 2 && lx <= CHUNK_SIZE_X - 3 && lz >= 2 && lz <= CHUNK_SIZE_Z - 3) {
            // Oak Tree
            this.generateTree(chunk, lx, height + 1, lz);
          }
        }
      }
    }
  }

  /**
   * Generates a 3D oak tree (log trunk + canopy of leaves).
   */
  private generateTree(chunk: Chunk, lx: number, baseHeight: number, lz: number): void {
    const trunkHeight = 4 + (Math.abs(lx * 7 + lz * 13) % 2);

    // Wood trunk
    for (let dy = 0; dy < trunkHeight; dy++) {
      if (baseHeight + dy < CHUNK_HEIGHT) {
        chunk.setBlock(lx, baseHeight + dy, lz, BlockType.OAK_LOG);
      }
    }

    // Leaf canopy
    const leafStart = baseHeight + trunkHeight - 2;
    for (let dy = 0; dy <= 3; dy++) {
      const ly = leafStart + dy;
      if (ly >= CHUNK_HEIGHT) break;
      const radius = dy >= 2 ? 1 : 2;

      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (dx === 0 && dz === 0 && dy < 2) continue; // trunk inside
          if (Math.abs(dx) === radius && Math.abs(dz) === radius && dy === 3) continue; // round corners

          const tx = lx + dx;
          const tz = lz + dz;
          if (tx >= 0 && tx < CHUNK_SIZE_X && tz >= 0 && tz < CHUNK_SIZE_Z) {
            if (chunk.getBlock(tx, ly, tz) === BlockType.AIR) {
              chunk.setBlock(tx, ly, tz, BlockType.OAK_LEAVES);
            }
          }
        }
      }
    }
  }

  /**
   * Generates mesh geometry for a chunk with optimized face-culling and Ambient Occlusion!
   */
  public buildChunkMesh(chunk: Chunk): {
    solidGeometry: THREE.BufferGeometry | null;
    waterGeometry: THREE.BufferGeometry | null;
  } {
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const colors: number[] = [];

    const waterPositions: number[] = [];
    const waterNormals: number[] = [];
    const waterUvs: number[] = [];
    const waterColors: number[] = [];

    // Ambient occlusion factor helper: 0 to 3 -> brightness
    const aoBrightness = [0.5, 0.65, 0.82, 1.0];

    // Face directional base lighting
    const faceLight = {
      top: 1.0,
      bottom: 0.5,
      right: 0.72,
      left: 0.72,
      front: 0.85,
      back: 0.85,
    };

    // Calculate AO for a vertex on a face
    const computeAO = (side1: boolean, side2: boolean, corner: boolean) => {
      if (side1 && side2) return 0;
      let count = 0;
      if (side1) count++;
      if (side2) count++;
      if (corner) count++;
      return 3 - count;
    };

    const isOpaque = (wx: number, wy: number, wz: number) => {
      const b = this.getBlock(wx, wy, wz);
      return b !== BlockType.AIR && !BLOCK_DEFS[b]?.transparent;
    };

    const worldX0 = chunk.cx * CHUNK_SIZE_X;
    const worldZ0 = chunk.cz * CHUNK_SIZE_Z;

    for (let lx = 0; lx < CHUNK_SIZE_X; lx++) {
      const wx = worldX0 + lx;
      for (let y = 0; y < CHUNK_HEIGHT; y++) {
        for (let lz = 0; lz < CHUNK_SIZE_Z; lz++) {
          const wz = worldZ0 + lz;
          const block = chunk.getBlock(lx, y, lz);
          if (block === BlockType.AIR) continue;

          const isWater = block === BlockType.WATER;
          const targetPos = isWater ? waterPositions : positions;
          const targetNorm = isWater ? waterNormals : normals;
          const targetUv = isWater ? waterUvs : uvs;
          const targetCol = isWater ? waterColors : colors;

          const faceTiles: BlockFaceTiles = BLOCK_FACE_MAP[block];

          // Face checks: only render if adjacent block is air or transparent (and not same liquid)
          const checkFace = (nx: number, ny: number, nz: number) => {
            const adj = this.getBlock(wx + nx, y + ny, wz + nz);
            if (adj === BlockType.AIR) return true;
            if (isWater) {
              return adj !== BlockType.WATER && (BLOCK_DEFS[adj]?.transparent || false);
            }
            if (block === BlockType.OAK_LEAVES && adj === BlockType.OAK_LEAVES) {
              return false;
            }
            return BLOCK_DEFS[adj]?.transparent || false;
          };

          // 1. TOP FACE (+Y)
          if (checkFace(0, 1, 0)) {
            const [u0, v0, u1, v1] = getTileUV(faceTiles.top);
            const baseL = faceLight.top;

            // Vertex AO
            const ao0 = isWater ? 3 : computeAO(isOpaque(wx - 1, y + 1, wz), isOpaque(wx, y + 1, wz - 1), isOpaque(wx - 1, y + 1, wz - 1));
            const ao1 = isWater ? 3 : computeAO(isOpaque(wx - 1, y + 1, wz), isOpaque(wx, y + 1, wz + 1), isOpaque(wx - 1, y + 1, wz + 1));
            const ao2 = isWater ? 3 : computeAO(isOpaque(wx + 1, y + 1, wz), isOpaque(wx, y + 1, wz + 1), isOpaque(wx + 1, y + 1, wz + 1));
            const ao3 = isWater ? 3 : computeAO(isOpaque(wx + 1, y + 1, wz), isOpaque(wx, y + 1, wz - 1), isOpaque(wx + 1, y + 1, wz - 1));

            const yTop = isWater ? y + 0.85 : y + 1.0;

            // Tri 1
            targetPos.push(wx, yTop, wz, wx, yTop, wz + 1, wx + 1, yTop, wz + 1);
            targetNorm.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
            targetUv.push(u0, v0, u0, v1, u1, v1);
            const c0 = baseL * aoBrightness[ao0];
            const c1 = baseL * aoBrightness[ao1];
            const c2 = baseL * aoBrightness[ao2];
            targetCol.push(c0, c0, c0, c1, c1, c1, c2, c2, c2);

            // Tri 2
            targetPos.push(wx, yTop, wz, wx + 1, yTop, wz + 1, wx + 1, yTop, wz);
            targetNorm.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
            targetUv.push(u0, v0, u1, v1, u1, v0);
            const c3 = baseL * aoBrightness[ao3];
            targetCol.push(c0, c0, c0, c2, c2, c2, c3, c3, c3);
          }

          // 2. BOTTOM FACE (-Y)
          if (y > 0 && checkFace(0, -1, 0)) {
            const [u0, v0, u1, v1] = getTileUV(faceTiles.bottom);
            const baseL = faceLight.bottom;

            targetPos.push(wx, y, wz, wx + 1, y, wz, wx + 1, y, wz + 1);
            targetNorm.push(0, -1, 0, 0, -1, 0, 0, -1, 0);
            targetUv.push(u0, v0, u1, v0, u1, v1);
            targetCol.push(baseL, baseL, baseL, baseL, baseL, baseL, baseL, baseL, baseL);

            targetPos.push(wx, y, wz, wx + 1, y, wz + 1, wx, y, wz + 1);
            targetNorm.push(0, -1, 0, 0, -1, 0, 0, -1, 0);
            targetUv.push(u0, v0, u1, v1, u0, v1);
            targetCol.push(baseL, baseL, baseL, baseL, baseL, baseL, baseL, baseL, baseL);
          }

          // 3. RIGHT FACE (+X)
          if (checkFace(1, 0, 0)) {
            const [u0, v0, u1, v1] = getTileUV(faceTiles.right);
            const baseL = faceLight.right;

            targetPos.push(wx + 1, y, wz, wx + 1, y + 1, wz, wx + 1, y + 1, wz + 1);
            targetNorm.push(1, 0, 0, 1, 0, 0, 1, 0, 0);
            targetUv.push(u0, v0, u0, v1, u1, v1);
            targetCol.push(baseL, baseL, baseL, baseL, baseL, baseL, baseL, baseL, baseL);

            targetPos.push(wx + 1, y, wz, wx + 1, y + 1, wz + 1, wx + 1, y, wz + 1);
            targetNorm.push(1, 0, 0, 1, 0, 0, 1, 0, 0);
            targetUv.push(u0, v0, u1, v1, u1, v0);
            targetCol.push(baseL, baseL, baseL, baseL, baseL, baseL, baseL, baseL, baseL);
          }

          // 4. LEFT FACE (-X)
          if (checkFace(-1, 0, 0)) {
            const [u0, v0, u1, v1] = getTileUV(faceTiles.left);
            const baseL = faceLight.left;

            targetPos.push(wx, y, wz + 1, wx, y + 1, wz + 1, wx, y + 1, wz);
            targetNorm.push(-1, 0, 0, -1, 0, 0, -1, 0, 0);
            targetUv.push(u0, v0, u0, v1, u1, v1);
            targetCol.push(baseL, baseL, baseL, baseL, baseL, baseL, baseL, baseL, baseL);

            targetPos.push(wx, y, wz + 1, wx, y + 1, wz, wx, y, wz);
            targetNorm.push(-1, 0, 0, -1, 0, 0, -1, 0, 0);
            targetUv.push(u0, v0, u1, v1, u1, v0);
            targetCol.push(baseL, baseL, baseL, baseL, baseL, baseL, baseL, baseL, baseL);
          }

          // 5. FRONT FACE (+Z)
          if (checkFace(0, 0, 1)) {
            const [u0, v0, u1, v1] = getTileUV(faceTiles.front);
            const baseL = faceLight.front;

            targetPos.push(wx, y, wz + 1, wx + 1, y, wz + 1, wx + 1, y + 1, wz + 1);
            targetNorm.push(0, 0, 1, 0, 0, 1, 0, 0, 1);
            targetUv.push(u0, v0, u1, v0, u1, v1);
            targetCol.push(baseL, baseL, baseL, baseL, baseL, baseL, baseL, baseL, baseL);

            targetPos.push(wx, y, wz + 1, wx + 1, y + 1, wz + 1, wx, y + 1, wz + 1);
            targetNorm.push(0, 0, 1, 0, 0, 1, 0, 0, 1);
            targetUv.push(u0, v0, u1, v1, u0, v1);
            targetCol.push(baseL, baseL, baseL, baseL, baseL, baseL, baseL, baseL, baseL);
          }

          // 6. BACK FACE (-Z)
          if (checkFace(0, 0, -1)) {
            const [u0, v0, u1, v1] = getTileUV(faceTiles.back);
            const baseL = faceLight.back;

            targetPos.push(wx + 1, y, wz, wx, y, wz, wx, y + 1, wz);
            targetNorm.push(0, 0, -1, 0, 0, -1, 0, 0, -1);
            targetUv.push(u0, v0, u1, v0, u1, v1);
            targetCol.push(baseL, baseL, baseL, baseL, baseL, baseL, baseL, baseL, baseL);

            targetPos.push(wx + 1, y, wz, wx, y + 1, wz, wx + 1, y + 1, wz);
            targetNorm.push(0, 0, -1, 0, 0, -1, 0, 0, -1);
            targetUv.push(u0, v0, u1, v1, u0, v1);
            targetCol.push(baseL, baseL, baseL, baseL, baseL, baseL, baseL, baseL, baseL);
          }
        }
      }
    }

    let solidGeometry: THREE.BufferGeometry | null = null;
    if (positions.length > 0) {
      solidGeometry = new THREE.BufferGeometry();
      solidGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      solidGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      solidGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      solidGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }

    let waterGeometry: THREE.BufferGeometry | null = null;
    if (waterPositions.length > 0) {
      waterGeometry = new THREE.BufferGeometry();
      waterGeometry.setAttribute('position', new THREE.Float32BufferAttribute(waterPositions, 3));
      waterGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(waterNormals, 3));
      waterGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(waterUvs, 2));
      waterGeometry.setAttribute('color', new THREE.Float32BufferAttribute(waterColors, 3));
    }

    chunk.isDirty = false;
    return { solidGeometry, waterGeometry };
  }
}
