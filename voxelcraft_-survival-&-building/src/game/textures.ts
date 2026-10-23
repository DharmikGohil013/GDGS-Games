/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { BlockType } from './constants';

// Texture atlas configuration
// Atlas is 16x16 tiles of 16x16 pixels each -> 256x256 pixels
export const ATLAS_COLS = 16;
export const ATLAS_ROWS = 16;
export const TILE_SIZE = 16;

export enum AtlasTile {
  GRASS_TOP = 0,
  GRASS_SIDE = 1,
  DIRT = 2,
  STONE = 3,
  COBBLESTONE = 4,
  OAK_LOG_SIDE = 5,
  OAK_LOG_TOP = 6,
  OAK_PLANKS = 7,
  OAK_LEAVES = 8,
  SAND = 9,
  SANDSTONE_SIDE = 10,
  SANDSTONE_TOP = 11,
  CRAFTING_TABLE_TOP = 12,
  CRAFTING_TABLE_SIDE = 13,
  CRAFTING_TABLE_FRONT = 14,
  FURNACE_SIDE = 15,
  FURNACE_FRONT = 16,
  FURNACE_FRONT_LIT = 17,
  FURNACE_TOP = 18,
  COAL_ORE = 19,
  IRON_ORE = 20,
  DIAMOND_ORE = 21,
  TORCH = 22,
  GLASS = 23,
  BEDROCK = 24,
  WATER = 25,
  CACTUS_SIDE = 26,
  CACTUS_TOP = 27,
  BRICK = 28,
  BOOKSHELF = 29,
  SNOW = 30,
  CHEST_TOP = 31,
  CHEST_SIDE = 32,
  CHEST_FRONT = 33,

  // Mining cracks 0..9
  CRACK_0 = 40,
  CRACK_1 = 41,
  CRACK_2 = 42,
  CRACK_3 = 43,
  CRACK_4 = 44,
  CRACK_5 = 45,
  CRACK_6 = 46,
  CRACK_7 = 47,
  CRACK_8 = 48,
  CRACK_9 = 49,
}

// Map each BlockType and face to an AtlasTile
// Face order convention: +X (right), -X (left), +Y (top), -Y (bottom), +Z (front), -Z (back)
export interface BlockFaceTiles {
  right: AtlasTile;
  left: AtlasTile;
  top: AtlasTile;
  bottom: AtlasTile;
  front: AtlasTile;
  back: AtlasTile;
}

export const BLOCK_FACE_MAP: Record<BlockType, BlockFaceTiles> = {
  [BlockType.AIR]: {
    right: 0, left: 0, top: 0, bottom: 0, front: 0, back: 0,
  },
  [BlockType.GRASS]: {
    right: AtlasTile.GRASS_SIDE,
    left: AtlasTile.GRASS_SIDE,
    top: AtlasTile.GRASS_TOP,
    bottom: AtlasTile.DIRT,
    front: AtlasTile.GRASS_SIDE,
    back: AtlasTile.GRASS_SIDE,
  },
  [BlockType.DIRT]: {
    right: AtlasTile.DIRT, left: AtlasTile.DIRT, top: AtlasTile.DIRT,
    bottom: AtlasTile.DIRT, front: AtlasTile.DIRT, back: AtlasTile.DIRT,
  },
  [BlockType.STONE]: {
    right: AtlasTile.STONE, left: AtlasTile.STONE, top: AtlasTile.STONE,
    bottom: AtlasTile.STONE, front: AtlasTile.STONE, back: AtlasTile.STONE,
  },
  [BlockType.COBBLESTONE]: {
    right: AtlasTile.COBBLESTONE, left: AtlasTile.COBBLESTONE, top: AtlasTile.COBBLESTONE,
    bottom: AtlasTile.COBBLESTONE, front: AtlasTile.COBBLESTONE, back: AtlasTile.COBBLESTONE,
  },
  [BlockType.OAK_LOG]: {
    right: AtlasTile.OAK_LOG_SIDE, left: AtlasTile.OAK_LOG_SIDE,
    top: AtlasTile.OAK_LOG_TOP, bottom: AtlasTile.OAK_LOG_TOP,
    front: AtlasTile.OAK_LOG_SIDE, back: AtlasTile.OAK_LOG_SIDE,
  },
  [BlockType.OAK_LEAVES]: {
    right: AtlasTile.OAK_LEAVES, left: AtlasTile.OAK_LEAVES, top: AtlasTile.OAK_LEAVES,
    bottom: AtlasTile.OAK_LEAVES, front: AtlasTile.OAK_LEAVES, back: AtlasTile.OAK_LEAVES,
  },
  [BlockType.OAK_PLANKS]: {
    right: AtlasTile.OAK_PLANKS, left: AtlasTile.OAK_PLANKS, top: AtlasTile.OAK_PLANKS,
    bottom: AtlasTile.OAK_PLANKS, front: AtlasTile.OAK_PLANKS, back: AtlasTile.OAK_PLANKS,
  },
  [BlockType.SAND]: {
    right: AtlasTile.SAND, left: AtlasTile.SAND, top: AtlasTile.SAND,
    bottom: AtlasTile.SAND, front: AtlasTile.SAND, back: AtlasTile.SAND,
  },
  [BlockType.SANDSTONE]: {
    right: AtlasTile.SANDSTONE_SIDE, left: AtlasTile.SANDSTONE_SIDE,
    top: AtlasTile.SANDSTONE_TOP, bottom: AtlasTile.SANDSTONE_TOP,
    front: AtlasTile.SANDSTONE_SIDE, back: AtlasTile.SANDSTONE_SIDE,
  },
  [BlockType.CRAFTING_TABLE]: {
    right: AtlasTile.CRAFTING_TABLE_SIDE,
    left: AtlasTile.CRAFTING_TABLE_SIDE,
    top: AtlasTile.CRAFTING_TABLE_TOP,
    bottom: AtlasTile.OAK_PLANKS,
    front: AtlasTile.CRAFTING_TABLE_FRONT,
    back: AtlasTile.CRAFTING_TABLE_SIDE,
  },
  [BlockType.FURNACE]: {
    right: AtlasTile.FURNACE_SIDE,
    left: AtlasTile.FURNACE_SIDE,
    top: AtlasTile.FURNACE_TOP,
    bottom: AtlasTile.FURNACE_TOP,
    front: AtlasTile.FURNACE_FRONT,
    back: AtlasTile.FURNACE_SIDE,
  },
  [BlockType.FURNACE_LIT]: {
    right: AtlasTile.FURNACE_SIDE,
    left: AtlasTile.FURNACE_SIDE,
    top: AtlasTile.FURNACE_TOP,
    bottom: AtlasTile.FURNACE_TOP,
    front: AtlasTile.FURNACE_FRONT_LIT,
    back: AtlasTile.FURNACE_SIDE,
  },
  [BlockType.COAL_ORE]: {
    right: AtlasTile.COAL_ORE, left: AtlasTile.COAL_ORE, top: AtlasTile.COAL_ORE,
    bottom: AtlasTile.COAL_ORE, front: AtlasTile.COAL_ORE, back: AtlasTile.COAL_ORE,
  },
  [BlockType.IRON_ORE]: {
    right: AtlasTile.IRON_ORE, left: AtlasTile.IRON_ORE, top: AtlasTile.IRON_ORE,
    bottom: AtlasTile.IRON_ORE, front: AtlasTile.IRON_ORE, back: AtlasTile.IRON_ORE,
  },
  [BlockType.DIAMOND_ORE]: {
    right: AtlasTile.DIAMOND_ORE, left: AtlasTile.DIAMOND_ORE, top: AtlasTile.DIAMOND_ORE,
    bottom: AtlasTile.DIAMOND_ORE, front: AtlasTile.DIAMOND_ORE, back: AtlasTile.DIAMOND_ORE,
  },
  [BlockType.TORCH]: {
    right: AtlasTile.TORCH, left: AtlasTile.TORCH, top: AtlasTile.TORCH,
    bottom: AtlasTile.TORCH, front: AtlasTile.TORCH, back: AtlasTile.TORCH,
  },
  [BlockType.GLASS]: {
    right: AtlasTile.GLASS, left: AtlasTile.GLASS, top: AtlasTile.GLASS,
    bottom: AtlasTile.GLASS, front: AtlasTile.GLASS, back: AtlasTile.GLASS,
  },
  [BlockType.BEDROCK]: {
    right: AtlasTile.BEDROCK, left: AtlasTile.BEDROCK, top: AtlasTile.BEDROCK,
    bottom: AtlasTile.BEDROCK, front: AtlasTile.BEDROCK, back: AtlasTile.BEDROCK,
  },
  [BlockType.WATER]: {
    right: AtlasTile.WATER, left: AtlasTile.WATER, top: AtlasTile.WATER,
    bottom: AtlasTile.WATER, front: AtlasTile.WATER, back: AtlasTile.WATER,
  },
  [BlockType.CACTUS]: {
    right: AtlasTile.CACTUS_SIDE, left: AtlasTile.CACTUS_SIDE,
    top: AtlasTile.CACTUS_TOP, bottom: AtlasTile.CACTUS_TOP,
    front: AtlasTile.CACTUS_SIDE, back: AtlasTile.CACTUS_SIDE,
  },
  [BlockType.BRICK]: {
    right: AtlasTile.BRICK, left: AtlasTile.BRICK, top: AtlasTile.BRICK,
    bottom: AtlasTile.BRICK, front: AtlasTile.BRICK, back: AtlasTile.BRICK,
  },
  [BlockType.BOOKSHELF]: {
    right: AtlasTile.BOOKSHELF, left: AtlasTile.BOOKSHELF,
    top: AtlasTile.OAK_PLANKS, bottom: AtlasTile.OAK_PLANKS,
    front: AtlasTile.BOOKSHELF, back: AtlasTile.BOOKSHELF,
  },
  [BlockType.SNOW]: {
    right: AtlasTile.SNOW, left: AtlasTile.SNOW, top: AtlasTile.SNOW,
    bottom: AtlasTile.SNOW, front: AtlasTile.SNOW, back: AtlasTile.SNOW,
  },
  [BlockType.CHEST]: {
    right: AtlasTile.CHEST_SIDE, left: AtlasTile.CHEST_SIDE,
    top: AtlasTile.CHEST_TOP, bottom: AtlasTile.CHEST_TOP,
    front: AtlasTile.CHEST_FRONT, back: AtlasTile.CHEST_SIDE,
  },
};

/**
 * Procedurally generates the 256x256 texture atlas using an HTML5 Canvas.
 */
export function createVoxelTextureAtlas(): {
  texture: THREE.CanvasTexture;
  canvas: HTMLCanvasElement;
} {
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_COLS * TILE_SIZE;
  canvas.height = ATLAS_ROWS * TILE_SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get 2D context for texture atlas');

  ctx.imageSmoothingEnabled = false;

  // Helper to draw a 16x16 tile at a tile index
  const drawTile = (tileIndex: number, painter: (pctx: CanvasRenderingContext2D) => void) => {
    const tileX = (tileIndex % ATLAS_COLS) * TILE_SIZE;
    const tileY = Math.floor(tileIndex / ATLAS_COLS) * TILE_SIZE;

    ctx.save();
    ctx.translate(tileX, tileY);
    painter(ctx);
    ctx.restore();
  };

  // Pseudo-random noise generator helper
  const pseudoRandom = (seed: number) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  // 1. Dirt painter
  const paintDirt = (c: CanvasRenderingContext2D, seedOffset = 0) => {
    c.fillStyle = '#866043';
    c.fillRect(0, 0, 16, 16);
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const r = pseudoRandom(seedOffset + x * 16 + y);
        if (r < 0.25) {
          c.fillStyle = '#6f4e34';
          c.fillRect(x, y, 1, 1);
        } else if (r < 0.45) {
          c.fillStyle = '#9c724f';
          c.fillRect(x, y, 1, 1);
        } else if (r < 0.55) {
          c.fillStyle = '#573d27';
          c.fillRect(x, y, 1, 1);
        }
      }
    }
  };

  // 2. Grass Top
  drawTile(AtlasTile.GRASS_TOP, (c) => {
    c.fillStyle = '#4fa83d';
    c.fillRect(0, 0, 16, 16);
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const r = pseudoRandom(x * 19 + y * 7);
        if (r < 0.25) {
          c.fillStyle = '#429332';
          c.fillRect(x, y, 1, 1);
        } else if (r < 0.45) {
          c.fillStyle = '#5bc046';
          c.fillRect(x, y, 1, 1);
        } else if (r < 0.6) {
          c.fillStyle = '#377a28';
          c.fillRect(x, y, 1, 1);
        }
      }
    }
  });

  // 3. Grass Side
  drawTile(AtlasTile.GRASS_SIDE, (c) => {
    paintDirt(c, 100);
    // Green top fringe with varied heights
    c.fillStyle = '#4fa83d';
    c.fillRect(0, 0, 16, 2);
    for (let x = 0; x < 16; x++) {
      const drop = Math.floor(pseudoRandom(x * 11) * 3);
      c.fillStyle = '#4fa83d';
      c.fillRect(x, 2, 1, drop);
      // Highlights/shadows on fringes
      if (pseudoRandom(x * 37) > 0.5) {
        c.fillStyle = '#377a28';
        c.fillRect(x, 2 + drop, 1, 1);
      }
    }
  });

  // 4. Dirt
  drawTile(AtlasTile.DIRT, (c) => paintDirt(c, 200));

  // 5. Stone
  const paintStone = (c: CanvasRenderingContext2D, seedOffset = 0) => {
    c.fillStyle = '#7a7a7a';
    c.fillRect(0, 0, 16, 16);
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const r = pseudoRandom(seedOffset + x * 13 + y * 23);
        if (r < 0.2) {
          c.fillStyle = '#656565';
          c.fillRect(x, y, 1, 1);
        } else if (r < 0.35) {
          c.fillStyle = '#8c8c8c';
          c.fillRect(x, y, 1, 1);
        } else if (r < 0.45) {
          c.fillStyle = '#545454';
          c.fillRect(x, y, 1, 1);
        }
      }
    }
  };
  drawTile(AtlasTile.STONE, (c) => paintStone(c, 300));

  // 6. Cobblestone
  drawTile(AtlasTile.COBBLESTONE, (c) => {
    c.fillStyle = '#606060';
    c.fillRect(0, 0, 16, 16);
    // Dark mortar lines
    c.fillStyle = '#3e3e3e';
    for (let i = 0; i < 16; i += 4) {
      c.fillRect(0, i, 16, 1);
    }
    c.fillRect(4, 0, 1, 4);
    c.fillRect(12, 0, 1, 4);
    c.fillRect(8, 4, 1, 4);
    c.fillRect(4, 8, 1, 4);
    c.fillRect(12, 8, 1, 4);
    c.fillRect(8, 12, 1, 4);

    // Stone highlights inside cobblestone cells
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        if (pseudoRandom(x * 5 + y * 17) < 0.25) {
          c.fillStyle = '#828282';
          c.fillRect(x, y, 1, 1);
        }
      }
    }
  });

  // 7. Oak Log Side
  drawTile(AtlasTile.OAK_LOG_SIDE, (c) => {
    c.fillStyle = '#6d5332';
    c.fillRect(0, 0, 16, 16);
    // Vertical bark grooves
    for (let x = 0; x < 16; x += 3) {
      c.fillStyle = '#4b3820';
      c.fillRect(x, 0, 1, 16);
      c.fillStyle = '#85673e';
      c.fillRect((x + 1) % 16, 0, 1, 16);
    }
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        if (pseudoRandom(x * 29 + y * 7) < 0.2) {
          c.fillStyle = '#3d2e1a';
          c.fillRect(x, y, 1, 1);
        }
      }
    }
  });

  // 8. Oak Log Top
  drawTile(AtlasTile.OAK_LOG_TOP, (c) => {
    // Outer bark ring
    c.fillStyle = '#4b3820';
    c.fillRect(0, 0, 16, 16);
    // Inner wood rings
    c.fillStyle = '#b8945f';
    c.fillRect(2, 2, 12, 12);
    c.fillStyle = '#9b7a4b';
    c.fillRect(4, 4, 8, 8);
    c.fillStyle = '#b8945f';
    c.fillRect(6, 6, 4, 4);
    c.fillStyle = '#87693f';
    c.fillRect(7, 7, 2, 2);
  });

  // 9. Oak Planks
  drawTile(AtlasTile.OAK_PLANKS, (c) => {
    c.fillStyle = '#a27e4e';
    c.fillRect(0, 0, 16, 16);
    // 4 horizontal boards
    c.fillStyle = '#624827';
    c.fillRect(0, 3, 16, 1);
    c.fillRect(0, 7, 16, 1);
    c.fillRect(0, 11, 16, 1);
    c.fillRect(0, 15, 16, 1);

    // Vertical seam splits
    c.fillRect(7, 0, 1, 4);
    c.fillRect(11, 4, 1, 4);
    c.fillRect(3, 8, 1, 4);
    c.fillRect(13, 12, 1, 4);

    // Plank texture noise
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        if (pseudoRandom(x * 3 + y * 13) < 0.2) {
          c.fillStyle = '#bd9660';
          c.fillRect(x, y, 1, 1);
        }
      }
    }
  });

  // 10. Oak Leaves
  drawTile(AtlasTile.OAK_LEAVES, (c) => {
    c.fillStyle = '#327725';
    c.fillRect(0, 0, 16, 16);
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const r = pseudoRandom(x * 17 + y * 31);
        if (r < 0.2) {
          c.fillStyle = '#225518';
          c.fillRect(x, y, 1, 1);
        } else if (r < 0.45) {
          c.fillStyle = '#489f36';
          c.fillRect(x, y, 1, 1);
        } else if (r < 0.6) {
          c.fillStyle = '#1c4514';
          c.fillRect(x, y, 1, 1);
        }
      }
    }
  });

  // 11. Sand
  drawTile(AtlasTile.SAND, (c) => {
    c.fillStyle = '#dbce99';
    c.fillRect(0, 0, 16, 16);
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const r = pseudoRandom(x * 19 + y * 23);
        if (r < 0.2) {
          c.fillStyle = '#c7b87f';
          c.fillRect(x, y, 1, 1);
        } else if (r < 0.4) {
          c.fillStyle = '#ebdcb0';
          c.fillRect(x, y, 1, 1);
        }
      }
    }
  });

  // 12. Sandstone Side
  drawTile(AtlasTile.SANDSTONE_SIDE, (c) => {
    c.fillStyle = '#d5c78e';
    c.fillRect(0, 0, 16, 16);
    c.fillStyle = '#beaf73';
    c.fillRect(0, 4, 16, 1);
    c.fillRect(0, 10, 16, 1);
    c.fillRect(0, 14, 16, 2);
  });

  // 13. Sandstone Top
  drawTile(AtlasTile.SANDSTONE_TOP, (c) => {
    c.fillStyle = '#ebdcb0';
    c.fillRect(0, 0, 16, 16);
    c.fillStyle = '#beaf73';
    c.strokeRect(2, 2, 12, 12);
  });

  // 14. Crafting Table Top
  drawTile(AtlasTile.CRAFTING_TABLE_TOP, (c) => {
    c.fillStyle = '#996f3d';
    c.fillRect(0, 0, 16, 16);
    // Grid in center
    c.fillStyle = '#4d3319';
    c.strokeRect(2.5, 2.5, 11, 11);
    c.beginPath();
    c.moveTo(6.5, 3); c.lineTo(6.5, 13);
    c.moveTo(9.5, 3); c.lineTo(9.5, 13);
    c.moveTo(3, 6.5); c.lineTo(13, 6.5);
    c.moveTo(3, 9.5); c.lineTo(13, 9.5);
    c.stroke();
    // Corner nails
    c.fillStyle = '#ffffff';
    c.fillRect(1, 1, 1, 1);
    c.fillRect(14, 1, 1, 1);
    c.fillRect(1, 14, 1, 1);
    c.fillRect(14, 14, 1, 1);
  });

  // 15. Crafting Table Side & Front
  drawTile(AtlasTile.CRAFTING_TABLE_SIDE, (c) => {
    c.fillStyle = '#8f683a';
    c.fillRect(0, 0, 16, 16);
    c.fillStyle = '#593e1e';
    c.fillRect(0, 14, 16, 2);
    c.fillRect(0, 0, 16, 2);
    // Draw small saw / tool silhouette
    c.fillStyle = '#3a2711';
    c.fillRect(4, 5, 8, 2);
    c.fillRect(5, 7, 6, 2);
  });
  drawTile(AtlasTile.CRAFTING_TABLE_FRONT, (c) => {
    c.fillStyle = '#8f683a';
    c.fillRect(0, 0, 16, 16);
    c.fillStyle = '#593e1e';
    c.fillRect(0, 14, 16, 2);
    c.fillRect(0, 0, 16, 2);
    // Draw small hammer outline
    c.fillStyle = '#3a2711';
    c.fillRect(5, 4, 6, 3);
    c.fillRect(7, 7, 2, 6);
  });

  // 16. Furnace Side / Top
  drawTile(AtlasTile.FURNACE_SIDE, (c) => paintStone(c, 400));
  drawTile(AtlasTile.FURNACE_TOP, (c) => paintStone(c, 450));

  // 17. Furnace Front (unlit)
  drawTile(AtlasTile.FURNACE_FRONT, (c) => {
    paintStone(c, 500);
    c.fillStyle = '#222222';
    c.fillRect(3, 3, 10, 5); // top slot
    c.fillRect(4, 9, 8, 5);  // bottom furnace mouth
    c.fillStyle = '#111111';
    c.fillRect(5, 10, 6, 3);
  });

  // 18. Furnace Front Lit
  drawTile(AtlasTile.FURNACE_FRONT_LIT, (c) => {
    paintStone(c, 550);
    c.fillStyle = '#222222';
    c.fillRect(3, 3, 10, 5);
    // Glowing fire mouth
    c.fillStyle = '#ff4500';
    c.fillRect(4, 9, 8, 5);
    c.fillStyle = '#ffaa00';
    c.fillRect(5, 10, 6, 3);
    c.fillStyle = '#ffffff';
    c.fillRect(7, 11, 2, 2);
  });

  // 19. Coal Ore
  drawTile(AtlasTile.COAL_ORE, (c) => {
    paintStone(c, 600);
    c.fillStyle = '#1e1e1e';
    c.fillRect(3, 3, 3, 3);
    c.fillRect(10, 4, 3, 2);
    c.fillRect(5, 9, 3, 3);
    c.fillRect(11, 10, 2, 3);
  });

  // 20. Iron Ore
  drawTile(AtlasTile.IRON_ORE, (c) => {
    paintStone(c, 700);
    c.fillStyle = '#d8af93';
    c.fillRect(3, 3, 3, 2);
    c.fillRect(10, 4, 3, 3);
    c.fillRect(4, 9, 4, 3);
    c.fillRect(11, 11, 3, 2);
    c.fillStyle = '#b78c70';
    c.fillRect(4, 4, 1, 1);
    c.fillRect(11, 5, 1, 1);
  });

  // 21. Diamond Ore
  drawTile(AtlasTile.DIAMOND_ORE, (c) => {
    paintStone(c, 800);
    c.fillStyle = '#5ff0e8';
    c.fillRect(3, 3, 3, 2);
    c.fillRect(10, 4, 3, 3);
    c.fillRect(4, 9, 4, 3);
    c.fillRect(11, 11, 3, 2);
    c.fillStyle = '#bdfdf9';
    c.fillRect(4, 3, 1, 1);
    c.fillRect(11, 4, 1, 1);
  });

  // 22. Torch
  drawTile(AtlasTile.TORCH, (c) => {
    c.clearRect(0, 0, 16, 16);
    // Wooden stick in center
    c.fillStyle = '#6d5332';
    c.fillRect(7, 6, 2, 9);
    // Flame
    c.fillStyle = '#ff4400';
    c.fillRect(6, 3, 4, 4);
    c.fillStyle = '#ffdd00';
    c.fillRect(7, 2, 2, 4);
    c.fillStyle = '#ffffff';
    c.fillRect(7, 3, 1, 1);
  });

  // 23. Glass
  drawTile(AtlasTile.GLASS, (c) => {
    c.clearRect(0, 0, 16, 16);
    // Outer border
    c.fillStyle = 'rgba(230, 245, 255, 0.4)';
    c.strokeRect(0.5, 0.5, 15, 15);
    // Diagonal sheen glares
    c.fillStyle = 'rgba(255, 255, 255, 0.6)';
    c.fillRect(3, 3, 1, 1);
    c.fillRect(4, 4, 1, 1);
    c.fillRect(5, 5, 1, 1);
    c.fillRect(11, 11, 1, 1);
    c.fillRect(12, 12, 1, 1);
  });

  // 24. Bedrock
  drawTile(AtlasTile.BEDROCK, (c) => {
    c.fillStyle = '#111111';
    c.fillRect(0, 0, 16, 16);
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const r = pseudoRandom(x * 47 + y * 53);
        if (r < 0.35) {
          c.fillStyle = '#333333';
          c.fillRect(x, y, 1, 1);
        } else if (r < 0.5) {
          c.fillStyle = '#555555';
          c.fillRect(x, y, 1, 1);
        }
      }
    }
  });

  // 25. Water
  drawTile(AtlasTile.WATER, (c) => {
    c.fillStyle = 'rgba(32, 85, 200, 0.75)';
    c.fillRect(0, 0, 16, 16);
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        if (pseudoRandom(x * 13 + y * 29) < 0.25) {
          c.fillStyle = 'rgba(64, 120, 240, 0.85)';
          c.fillRect(x, y, 1, 1);
        }
      }
    }
  });

  // 26. Cactus
  drawTile(AtlasTile.CACTUS_SIDE, (c) => {
    c.fillStyle = '#1e6822';
    c.fillRect(0, 0, 16, 16);
    // Vertical ribs
    c.fillStyle = '#16501a';
    c.fillRect(3, 0, 2, 16);
    c.fillRect(8, 0, 2, 16);
    c.fillRect(13, 0, 2, 16);
    // Spines
    c.fillStyle = '#ffffff';
    c.fillRect(4, 4, 1, 1);
    c.fillRect(9, 8, 1, 1);
    c.fillRect(14, 12, 1, 1);
  });
  drawTile(AtlasTile.CACTUS_TOP, (c) => {
    c.fillStyle = '#26802c';
    c.fillRect(0, 0, 16, 16);
    c.fillStyle = '#16501a';
    c.fillRect(6, 6, 4, 4);
  });

  // 27. Brick
  drawTile(AtlasTile.BRICK, (c) => {
    c.fillStyle = '#9b3d2b';
    c.fillRect(0, 0, 16, 16);
    c.fillStyle = '#d3c5b4'; // Mortar
    c.fillRect(0, 3, 16, 1);
    c.fillRect(0, 7, 16, 1);
    c.fillRect(0, 11, 16, 1);
    c.fillRect(0, 15, 16, 1);
    c.fillRect(5, 0, 1, 4);
    c.fillRect(13, 0, 1, 4);
    c.fillRect(9, 4, 1, 4);
    c.fillRect(5, 8, 1, 4);
    c.fillRect(13, 8, 1, 4);
    c.fillRect(9, 12, 1, 4);
  });

  // 28. Bookshelf
  drawTile(AtlasTile.BOOKSHELF, (c) => {
    c.fillStyle = '#a27e4e'; // wood
    c.fillRect(0, 0, 16, 16);
    c.fillStyle = '#2a1a0c'; // recessed shelf
    c.fillRect(1, 2, 14, 5);
    c.fillRect(1, 9, 14, 5);
    // Books top shelf
    const bookColors = ['#9e2a2b', '#335c67', '#e09f3e', '#540b0e', '#3f88c5'];
    for (let x = 2; x < 14; x += 2) {
      c.fillStyle = bookColors[(x / 2) % bookColors.length];
      c.fillRect(x, 2, 2, 5);
    }
    // Books bottom shelf
    for (let x = 2; x < 14; x += 2) {
      c.fillStyle = bookColors[(x / 2 + 2) % bookColors.length];
      c.fillRect(x, 9, 2, 5);
    }
  });

  // 29. Snow
  drawTile(AtlasTile.SNOW, (c) => {
    c.fillStyle = '#f0f6ff';
    c.fillRect(0, 0, 16, 16);
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        if (pseudoRandom(x * 11 + y * 13) < 0.15) {
          c.fillStyle = '#dce7fa';
          c.fillRect(x, y, 1, 1);
        }
      }
    }
  });

  // 30. Chest
  drawTile(AtlasTile.CHEST_TOP, (c) => {
    c.fillStyle = '#8f683a';
    c.fillRect(0, 0, 16, 16);
    c.fillStyle = '#3a2711';
    c.strokeRect(1, 1, 14, 14);
  });
  drawTile(AtlasTile.CHEST_SIDE, (c) => {
    c.fillStyle = '#8f683a';
    c.fillRect(0, 0, 16, 16);
    c.fillStyle = '#3a2711';
    c.strokeRect(1, 1, 14, 14);
    c.fillRect(0, 6, 16, 1); // lid seam
  });
  drawTile(AtlasTile.CHEST_FRONT, (c) => {
    c.fillStyle = '#8f683a';
    c.fillRect(0, 0, 16, 16);
    c.fillStyle = '#3a2711';
    c.strokeRect(1, 1, 14, 14);
    c.fillRect(0, 6, 16, 1);
    // Iron clasp
    c.fillStyle = '#cccccc';
    c.fillRect(7, 5, 2, 4);
    c.fillStyle = '#222222';
    c.fillRect(7, 7, 2, 1);
  });

  // 31. Crack Stages 0..9 (Black fissures on transparent background)
  for (let stage = 0; stage < 10; stage++) {
    drawTile(AtlasTile.CRACK_0 + stage, (c) => {
      c.clearRect(0, 0, 16, 16);
      c.fillStyle = 'rgba(0, 0, 0, 0.7)';
      const crackCount = (stage + 1) * 3;
      for (let i = 0; i < crackCount; i++) {
        const x = Math.floor(pseudoRandom(stage * 100 + i * 3) * 16);
        const y = Math.floor(pseudoRandom(stage * 100 + i * 7) * 16);
        c.fillRect(x, y, 1, 1);
        if (i % 2 === 0) c.fillRect(x + 1, y, 1, 1);
      }
    });
  }

  // Create Three.js texture
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestMipmapNearestFilter;
  texture.generateMipmaps = true;
  texture.colorSpace = THREE.SRGBColorSpace;

  return { texture, canvas };
}

/**
 * Returns UV coordinates [u0, v0, u1, v1] in the atlas for a given AtlasTile.
 */
export function getTileUV(tileIndex: number): [number, number, number, number] {
  const col = tileIndex % ATLAS_COLS;
  const row = Math.floor(tileIndex / ATLAS_COLS);

  const u0 = col / ATLAS_COLS;
  const v1 = 1.0 - row / ATLAS_ROWS; // Canvas top is y=0, UV top is v=1
  const u1 = (col + 1) / ATLAS_COLS;
  const v0 = 1.0 - (row + 1) / ATLAS_ROWS;

  return [u0, v0, u1, v1];
}
