import { FarmPlot, TreeEntity, ChickenEntity, RemotePlayer, FloatingText, HoverTarget } from './types';
import { TILE_SIZE, WORLD_WIDTH_TILES, WORLD_HEIGHT_TILES } from './constants';

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface PlayerRenderState {
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  isMoving: boolean;
  name: string;
  hairColor: string;
  shirtColor: string;
  pantsColor: string;
  swingProgress: number; // 0 to 1 if swinging tool
  activeToolIcon?: string;
  speechText?: string;
  destinationMarker?: { x: number; y: number } | null;
  hoverTarget?: HoverTarget | null;
}

let cachedFarmBg: HTMLCanvasElement | null = null;
let cachedTerraVillaBg: HTMLCanvasElement | null = null;

export function invalidateBgCaches() {
  cachedFarmBg = null;
  cachedTerraVillaBg = null;
}

function getFarmBgCanvas(): HTMLCanvasElement {
  if (cachedFarmBg) return cachedFarmBg;
  const mapW = WORLD_WIDTH_TILES * TILE_SIZE; // 2240px
  const mapH = WORLD_HEIGHT_TILES * TILE_SIZE; // 1600px
  const c = document.createElement('canvas');
  c.width = mapW + 200;
  c.height = mapH + 200;
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // 1. Lush Green Grass Base with multi-tone checker
  ctx.fillStyle = '#448b30';
  ctx.fillRect(0, 0, c.width, c.height);

  ctx.fillStyle = '#3c7e29';
  for (let x = 0; x < mapW; x += 32) {
    for (let y = 0; y < mapH; y += 32) {
      if ((x / 32 + y / 32) % 2 === 0) {
        ctx.fillRect(x + 100, y + 100, 32, 32);
      }
    }
  }

  // Grass tufts and wildflowers
  for (let x = 0; x < mapW; x += 48) {
    for (let y = 0; y < mapH; y += 48) {
      const hash = (x * 17 + y * 31) % 100;
      if (hash < 30) {
        // Grass blade tufts
        ctx.fillStyle = '#316821';
        ctx.fillRect(x + 100 + (hash % 16), y + 100 + ((hash * 3) % 16), 3, 5);
        ctx.fillRect(x + 103 + 100 + (hash % 16), y + 101 + 100 + ((hash * 3) % 16), 2, 4);
      } else if (hash > 85) {
        // Tiny wildflowers
        ctx.fillStyle = hash % 2 === 0 ? '#fde047' : '#f472b6';
        ctx.fillRect(x + 100 + (hash % 20), y + 100 + (hash % 20), 3, 3);
      }
    }
  }

  // 2. Wide Main Dirt Roads & Pathways
  ctx.fillStyle = '#b6895b';

  // Central Vertical Avenue (connecting farmhouse/north to portal/south)
  const roadCenterX = 34 * TILE_SIZE + 100;
  ctx.fillRect(roadCenterX - 36, 100, 72, mapH);

  // Central Horizontal Crossroad
  const roadCenterY = 24 * TILE_SIZE + 100;
  ctx.fillRect(100, roadCenterY - 32, mapW, 64);

  // Road to West Plots Field
  ctx.fillRect(8 * TILE_SIZE + 100, 13 * TILE_SIZE + 100, 26 * TILE_SIZE, 36);

  // Road to East Plots Field & Chicken Pasture
  ctx.fillRect(roadCenterX, 13 * TILE_SIZE + 100, 28 * TILE_SIZE, 36);

  // Road border stones & edges
  ctx.fillStyle = '#8a5c32';
  ctx.fillRect(roadCenterX - 38, 100, 3, mapH);
  ctx.fillRect(roadCenterX + 36, 100, 3, mapH);
  ctx.fillRect(100, roadCenterY - 34, mapW, 3);
  ctx.fillRect(100, roadCenterY + 32, mapW, 3);

  // 3. Central Pond & Stream (South of crossroad)
  const pondX = 30 * TILE_SIZE + 100;
  const pondY = 28 * TILE_SIZE + 100;
  ctx.fillStyle = '#1e3a8a';
  ctx.beginPath();
  ctx.ellipse(pondX + 4 * TILE_SIZE, pondY + 3 * TILE_SIZE, 5 * TILE_SIZE, 3.5 * TILE_SIZE, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.ellipse(pondX + 4 * TILE_SIZE, pondY + 3 * TILE_SIZE, 4.2 * TILE_SIZE, 2.8 * TILE_SIZE, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wooden Fishing Pier on pond
  ctx.fillStyle = '#78350f';
  ctx.fillRect(pondX + 3 * TILE_SIZE, pondY, 28, 70);
  ctx.fillStyle = '#a16207';
  ctx.fillRect(pondX + 3 * TILE_SIZE + 2, pondY, 24, 68);

  cachedFarmBg = c;
  return c;
}

function getTerraVillaBgCanvas(): HTMLCanvasElement {
  if (cachedTerraVillaBg) return cachedTerraVillaBg;
  const mapW = WORLD_WIDTH_TILES * TILE_SIZE; // 2240px
  const mapH = WORLD_HEIGHT_TILES * TILE_SIZE; // 1600px
  const c = document.createElement('canvas');
  c.width = mapW + 200;
  c.height = mapH + 200;
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  // 1. Cobblestone base
  ctx.fillStyle = '#64748b';
  ctx.fillRect(0, 0, c.width, c.height);

  // Alternating paving stone pattern
  ctx.fillStyle = '#475569';
  for (let x = 0; x < mapW; x += 32) {
    for (let y = 0; y < mapH; y += 32) {
      if ((x / 32 + y / 32) % 2 === 0) {
        ctx.fillRect(x + 2 + 100, y + 2 + 100, 28, 28);
      }
    }
  }

  // 2. Central Grand Plaza Mosaic Ring (surrounding fountain)
  const centerX = 35 * TILE_SIZE + 100;
  const centerY = 25 * TILE_SIZE + 100;

  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 8 * TILE_SIZE, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 6 * TILE_SIZE, 0, Math.PI * 2);
  ctx.fill();

  // Mosaic Star in center
  ctx.fillStyle = '#d97706';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 4.5 * TILE_SIZE, 0, Math.PI * 2);
  ctx.fill();

  // 3. Wide Avenue Stone Borders
  ctx.fillStyle = '#334155';
  ctx.fillRect(centerX - 4 * TILE_SIZE, 100, 8 * TILE_SIZE, mapH);
  ctx.fillRect(100, centerY - 4 * TILE_SIZE, mapW, 8 * TILE_SIZE);

  ctx.fillStyle = '#64748b';
  ctx.fillRect(centerX - 3.8 * TILE_SIZE, 100, 7.6 * TILE_SIZE, mapH);
  ctx.fillRect(100, centerY - 3.8 * TILE_SIZE, mapW, 7.6 * TILE_SIZE);

  cachedTerraVillaBg = c;
  return c;
}

export function drawPixelWorld(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  camera: Camera,
  currentMap: 'farm' | 'terravilla',
  plots: FarmPlot[],
  trees: TreeEntity[],
  chickens: ChickenEntity[],
  player: PlayerRenderState,
  remotePlayers: RemotePlayer[],
  floatingTexts: FloatingText[],
  gameTime: number
) {
  // Clear canvas
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Apply camera transform
  ctx.translate(Math.floor(width / 2), Math.floor(height / 2));
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(Math.floor(-camera.x), Math.floor(-camera.y));

  // Enable crisp pixel art rendering
  ctx.imageSmoothingEnabled = false;

  const mapW = WORLD_WIDTH_TILES * TILE_SIZE;
  const mapH = WORLD_HEIGHT_TILES * TILE_SIZE;

  if (currentMap === 'farm') {
    drawFarmMap(ctx, plots, trees, chickens, gameTime, mapW, mapH);
  } else {
    drawTerraVillaMap(ctx, gameTime, mapW, mapH);
  }

  // Draw remote players
  for (const rp of remotePlayers) {
    drawCharacter(
      ctx,
      rp.x,
      rp.y,
      rp.direction,
      rp.isMoving,
      gameTime,
      rp.name,
      rp.colorHair,
      rp.colorShirt,
      rp.colorPants,
      0,
      undefined,
      rp.speechText
    );
  }

  // Draw local player destination target marker (pulsing rings when walking)
  if (player.destinationMarker) {
    drawDestinationMarker(ctx, player.destinationMarker.x, player.destinationMarker.y, gameTime);
  }

  // Draw local player
  drawCharacter(
    ctx,
    player.x,
    player.y,
    player.direction,
    player.isMoving,
    gameTime,
    player.name,
    player.hairColor,
    player.shirtColor,
    player.pantsColor,
    player.swingProgress,
    player.activeToolIcon,
    player.speechText
  );

  // Draw hover cursor reticle and action tooltip badge
  if (player.hoverTarget) {
    drawHoverReticle(ctx, player.hoverTarget, gameTime);
  }

  // Draw floating text particles (+1 Popberry, -2 Energy, etc.)
  drawFloatingTexts(ctx, floatingTexts, gameTime);

  ctx.restore();
}

function drawDestinationMarker(ctx: CanvasRenderingContext2D, x: number, y: number, gameTime: number) {
  const pulse = (Math.sin(gameTime * 0.008) + 1) * 0.5;
  const radius = 10 + pulse * 6;

  ctx.save();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
  ctx.stroke();

  // Center pip
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(x - 2, y - 2, 4, 4);
  ctx.restore();
}

function drawHoverReticle(ctx: CanvasRenderingContext2D, target: HoverTarget, gameTime: number) {
  const tx = target.tileX * TILE_SIZE;
  const ty = target.tileY * TILE_SIZE;

  ctx.save();

  // Animated corner brackets for hovered tile
  const pulse = Math.sin(gameTime * 0.01) * 1.5;
  ctx.strokeStyle = target.isValidAction ? '#4ade80' : '#f59e0b';
  ctx.lineWidth = 2;

  const bSize = 6;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(tx - pulse, ty + bSize - pulse);
  ctx.lineTo(tx - pulse, ty - pulse);
  ctx.lineTo(tx + bSize - pulse, ty - pulse);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(tx + TILE_SIZE - bSize + pulse, ty - pulse);
  ctx.lineTo(tx + TILE_SIZE + pulse, ty - pulse);
  ctx.lineTo(tx + TILE_SIZE + pulse, ty + bSize - pulse);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(tx - pulse, ty + TILE_SIZE - bSize + pulse);
  ctx.lineTo(tx - pulse, ty + TILE_SIZE + pulse);
  ctx.lineTo(tx + bSize - pulse, ty + TILE_SIZE + pulse);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(tx + TILE_SIZE - bSize + pulse, ty + TILE_SIZE + pulse);
  ctx.lineTo(tx + TILE_SIZE + pulse, ty + TILE_SIZE + pulse);
  ctx.lineTo(tx + TILE_SIZE + pulse, ty + TILE_SIZE - bSize + pulse);
  ctx.stroke();

  // Floating Action Tooltip Badge
  if (target.label) {
    ctx.font = '7px "Press Start 2P"';
    const textW = ctx.measureText(target.label).width;
    const badgeW = textW + 16;
    const badgeH = 16;
    const badgeX = tx + TILE_SIZE / 2;
    const badgeY = ty - 12;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = target.isValidAction ? '#4ade80' : '#f59e0b';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.roundRect(badgeX - badgeW / 2, badgeY - badgeH, badgeW, badgeH, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.fillText(target.label, badgeX, badgeY - 5);
  }

  ctx.restore();
}

function drawFarmMap(
  ctx: CanvasRenderingContext2D,
  plots: FarmPlot[],
  trees: TreeEntity[],
  chickens: ChickenEntity[],
  gameTime: number,
  mapW: number,
  mapH: number
) {
  // Blit pre-rendered background
  const bg = getFarmBgCanvas();
  ctx.drawImage(bg, -100, -100);

  // 1. Farm Plots
  for (const plot of plots) {
    drawPlot(ctx, plot, gameTime);
  }

  // 2. North-West: Big Farmhouse Cabin
  drawHouse(ctx, 8 * TILE_SIZE, 4 * TILE_SIZE, gameTime);

  // 3. North-East: Grand Windmill & Silo
  drawWindmill(ctx, 52 * TILE_SIZE, 4 * TILE_SIZE, gameTime);

  // 4. Central Stone Water Well
  drawWell(ctx, 33 * TILE_SIZE, 18 * TILE_SIZE, gameTime);

  // 5. East: Chicken Coop & Fenced Pasture
  drawChickenCoop(ctx, 54 * TILE_SIZE, 30 * TILE_SIZE);

  // 6. Chickens
  for (const chicken of chickens) {
    drawChicken(ctx, chicken, gameTime);
  }

  // 7. Trees & Fruit Orchard (South-West)
  for (const tree of trees) {
    drawTree(ctx, tree, gameTime);
  }

  // 8. NPC Farmer Barney
  drawNPC(ctx, 32 * TILE_SIZE, 22 * TILE_SIZE, 'Farmer Barney', '#ffcc80', '#2d68c4', '#663300');

  // 9. Warp Portal to Terra Villa (South Entrance)
  drawWarpPortal(ctx, 33 * TILE_SIZE, 45 * TILE_SIZE, 'To Terra Villa', gameTime);

  // 10. Boundary Wooden Fences
  drawWoodenFences(ctx, 0, 0, mapW, mapH);
}

function drawTerraVillaMap(
  ctx: CanvasRenderingContext2D,
  gameTime: number,
  mapW: number,
  mapH: number
) {
  // Blit pre-rendered cobblestone square & plaza
  const bg = getTerraVillaBgCanvas();
  ctx.drawImage(bg, -100, -100);

  const centerX = 35 * TILE_SIZE;
  const centerY = 25 * TILE_SIZE;

  // 1. Central Multi-Tiered Fountain
  drawFountain(ctx, centerX, centerY, gameTime);

  // 2. Hazel's General Superstore (North-East)
  drawStoreBuilding(ctx, 48 * TILE_SIZE, 8 * TILE_SIZE, "Hazel's Store");
  drawNPC(ctx, 52 * TILE_SIZE, 14 * TILE_SIZE, 'Hazel (Shopkeeper)', '#f8b4d9', '#9c27b0', '#ffeb3b');

  // 3. Villa Bakery & Kitchen Guildhall (North-West)
  drawTavernBuilding(ctx, 14 * TILE_SIZE, 8 * TILE_SIZE, 'Villa Bakery & Mill');
  drawNPC(ctx, 18 * TILE_SIZE, 14 * TILE_SIZE, 'Baker Karen', '#ffe0b2', '#e65100', '#fff');

  // 4. Expanded Luxury Sauna Resort & Hot Springs (West)
  drawSauna(ctx, 8 * TILE_SIZE, 28 * TILE_SIZE, gameTime);

  // 5. Town Hall & Notice Board (East)
  drawNoticeBoard(ctx, 52 * TILE_SIZE, 28 * TILE_SIZE);
  drawNPC(ctx, 50 * TILE_SIZE, 30 * TILE_SIZE, 'Ranger Dale', '#d7ccc8', '#33691e', '#4e342e');

  // 6. Warp Portal back to Farmstead (South)
  drawWarpPortal(ctx, 33 * TILE_SIZE, 45 * TILE_SIZE, 'Back to Farm', gameTime);

  // 7. Town Lampposts with warm illumination
  const lampPositions = [
    [26, 18],
    [44, 18],
    [26, 32],
    [44, 32],
    [35, 15],
    [35, 35],
    [16, 22],
    [54, 22],
  ];

  for (const [lx, ly] of lampPositions) {
    drawLamppost(ctx, lx * TILE_SIZE, ly * TILE_SIZE, gameTime);
  }

  // Fences / Town Walls
  drawWoodenFences(ctx, 0, 0, mapW, mapH);
}

function drawPlot(ctx: CanvasRenderingContext2D, plot: FarmPlot, gameTime: number) {
  const px = plot.x * TILE_SIZE;
  const py = plot.y * TILE_SIZE;
  const size = TILE_SIZE;

  // Background soil
  if (plot.isWatered) {
    ctx.fillStyle = '#4a2c16'; // Dark wet fertile soil
  } else if (plot.isTilled) {
    ctx.fillStyle = '#7a4b27'; // Dry tilled soil
  } else {
    ctx.fillStyle = '#5c3619'; // Raw untilled soil
  }
  ctx.fillRect(px + 1, py + 1, size - 2, size - 2);

  // Tilled furrow lines
  if (plot.isTilled) {
    ctx.fillStyle = plot.isWatered ? '#321c0d' : '#573318';
    ctx.fillRect(px + 4, py + 8, size - 8, 3);
    ctx.fillRect(px + 4, py + 16, size - 8, 3);
    ctx.fillRect(px + 4, py + 24, size - 8, 3);
  }

  // Draw crop if planted
  if (plot.cropId && plot.stage > 0) {
    drawCropPlant(ctx, px + size / 2, py + size / 2, plot.cropId, plot.stage, gameTime);
  }
}

function drawCropPlant(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cropId: string,
  stage: number,
  gameTime: number
) {
  const sway = Math.sin(gameTime * 0.005 + cx) * 1.5;

  if (stage === 1) {
    // Sprout
    ctx.fillStyle = '#8bc34a';
    ctx.fillRect(cx - 2, cy - 6, 4, 8);
    ctx.fillRect(cx - 5 + sway, cy - 8, 4, 3);
    ctx.fillRect(cx + 1 + sway, cy - 8, 4, 3);
  } else if (stage === 2) {
    // Mid growth
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(cx - 3, cy - 10, 6, 12);
    ctx.fillRect(cx - 8 + sway, cy - 9, 6, 5);
    ctx.fillRect(cx + 2 + sway, cy - 11, 6, 5);
    ctx.fillStyle = '#81c784';
    ctx.fillRect(cx - 2, cy - 14, 4, 5);
  } else {
    // Stage 3: Fully mature crop ready to harvest
    ctx.fillStyle = '#388e3c';
    ctx.fillRect(cx - 3, cy - 12, 6, 14);
    ctx.fillRect(cx - 9 + sway, cy - 8, 7, 5);
    ctx.fillRect(cx + 2 + sway, cy - 8, 7, 5);

    if (cropId === 'popberry_seed' || cropId === 'popberry') {
      // Red Popberries
      ctx.fillStyle = '#f44336';
      ctx.beginPath();
      ctx.arc(cx - 4 + sway, cy - 10, 4.5, 0, Math.PI * 2);
      ctx.arc(cx + 4 + sway, cy - 10, 4.5, 0, Math.PI * 2);
      ctx.arc(cx + sway, cy - 16, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffcdd2';
      ctx.fillRect(cx + sway - 1, cy - 18, 2, 2);
    } else if (cropId === 'butterberry_seed' || cropId === 'butterberry') {
      // Golden Butterberry
      ctx.fillStyle = '#ffb300';
      ctx.beginPath();
      ctx.arc(cx + sway, cy - 12, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff9c4';
      ctx.fillRect(cx + sway - 2, cy - 14, 3, 3);
    } else if (cropId === 'carrot_seed' || cropId === 'carrot') {
      // Orange Carrot top
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(cx + sway, cy - 10, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e'; // Green tuft
      ctx.fillRect(cx + sway - 2, cy - 18, 4, 7);
    } else if (cropId === 'sunpetal_seed' || cropId === 'sunpetal') {
      // Radiant Sunpetal flower
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(cx + sway, cy - 12, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#78350f'; // Center disk
      ctx.beginPath();
      ctx.arc(cx + sway, cy - 12, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (cropId === 'pumpkin_seed' || cropId === 'pumpkin') {
      // Golden Giant Pumpkin
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(cx + sway, cy - 10, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#15803d'; // Stem
      ctx.fillRect(cx + sway - 2, cy - 19, 4, 4);
    } else {
      // Clover
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.arc(cx - 4 + sway, cy - 12, 4, 0, Math.PI * 2);
      ctx.arc(cx + 4 + sway, cy - 12, 4, 0, Math.PI * 2);
      ctx.arc(cx + sway, cy - 16, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sparkle star
    const sparkle = (Math.sin(gameTime * 0.008 + cx) + 1) * 0.5;
    if (sparkle > 0.4) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx + 7, cy - 18, 2, 2);
      ctx.fillRect(cx + 6, cy - 19, 4, 1);
    }
  }
}

function drawHouse(ctx: CanvasRenderingContext2D, x: number, y: number, gameTime: number) {
  const w = 7 * TILE_SIZE;
  const h = 5.5 * TILE_SIZE;

  // Walls
  ctx.fillStyle = '#a67244';
  ctx.fillRect(x, y + 40, w, h - 40);
  ctx.fillStyle = '#7a4e28';
  for (let i = 0; i < w; i += 24) {
    ctx.fillRect(x + i, y + 40, 2, h - 40);
  }

  // Red Roof
  ctx.fillStyle = '#b73229';
  ctx.beginPath();
  ctx.moveTo(x - 12, y + 42);
  ctx.lineTo(x + w / 2, y);
  ctx.lineTo(x + w + 12, y + 42);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#8f231c';
  ctx.fillRect(x - 12, y + 40, w + 24, 4);

  // Chimney & Animated Smoke
  ctx.fillStyle = '#665d56';
  ctx.fillRect(x + w - 36, y + 6, 16, 24);
  const smokeY = (gameTime * 0.02) % 30;
  ctx.fillStyle = 'rgba(230, 230, 230, 0.6)';
  ctx.beginPath();
  ctx.arc(x + w - 28 + Math.sin(gameTime * 0.005) * 4, y - smokeY, 6, 0, Math.PI * 2);
  ctx.arc(x + w - 26 + Math.sin(gameTime * 0.005 + 1) * 6, y - smokeY - 14, 8, 0, Math.PI * 2);
  ctx.fill();

  // Wooden Door
  ctx.fillStyle = '#5c381c';
  ctx.fillRect(x + w / 2 - 16, y + h - 44, 32, 44);
  ctx.fillStyle = '#f1c40f'; // Brass knob
  ctx.fillRect(x + w / 2 + 6, y + h - 22, 4, 4);

  // Windows with warm light
  ctx.fillStyle = '#ffecb3';
  ctx.fillRect(x + 20, y + 60, 24, 24);
  ctx.fillRect(x + w - 44, y + 60, 24, 24);

  ctx.fillStyle = '#5c381c';
  ctx.fillRect(x + 31, y + 60, 2, 24);
  ctx.fillRect(x + 20, y + 71, 24, 2);
  ctx.fillRect(x + w - 33, y + 60, 2, 24);
  ctx.fillRect(x + w - 44, y + 71, 24, 2);

  // Farmhouse Nameplate
  ctx.fillStyle = '#ffe082';
  ctx.font = '8px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('Farmstead Cabin', x + w / 2, y + h + 14);
}

function drawWindmill(ctx: CanvasRenderingContext2D, x: number, y: number, gameTime: number) {
  const w = 5.5 * TILE_SIZE;
  const h = 7 * TILE_SIZE;

  // Stone tower
  ctx.fillStyle = '#8d99ae';
  ctx.beginPath();
  ctx.moveTo(x + 24, y + 44);
  ctx.lineTo(x + w - 24, y + 44);
  ctx.lineTo(x + w - 6, y + h);
  ctx.lineTo(x + 6, y + h);
  ctx.closePath();
  ctx.fill();

  // Conical roof
  ctx.fillStyle = '#2b2d42';
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + 10);
  ctx.lineTo(x + 18, y + 44);
  ctx.lineTo(x + w - 18, y + 44);
  ctx.closePath();
  ctx.fill();

  // Door
  ctx.fillStyle = '#4a3321';
  ctx.fillRect(x + w / 2 - 14, y + h - 32, 28, 32);

  // Rotating 4 sails
  const angle = gameTime * 0.0015;
  const hubX = x + w / 2;
  const hubY = y + 48;
  const sailLen = 48;

  ctx.save();
  ctx.translate(hubX, hubY);
  ctx.rotate(angle);

  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = '#4a3321'; // Spar
    ctx.fillRect(0, -3, sailLen, 6);
    ctx.fillStyle = 'rgba(248, 249, 250, 0.85)'; // Sail cloth
    ctx.fillRect(10, 3, sailLen - 12, 14);
  }
  ctx.restore();

  // Hub cap
  ctx.fillStyle = '#d90429';
  ctx.beginPath();
  ctx.arc(hubX, hubY, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffe082';
  ctx.font = '8px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('Old Windmill', x + w / 2, y + h + 14);
}

function drawWell(ctx: CanvasRenderingContext2D, x: number, y: number, gameTime: number) {
  const w = 44;
  const h = 48;

  // Stone well base
  ctx.fillStyle = '#64748b';
  ctx.fillRect(x, y + 20, w, h - 20);
  ctx.fillStyle = '#334155';
  ctx.fillRect(x + 4, y + 24, w - 8, 4);

  // Water inside
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(x + 6, y + 22, w - 12, 6);

  // Wooden support posts
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x + 2, y, 4, 24);
  ctx.fillRect(x + w - 6, y, 4, 24);

  // Roof
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.moveTo(x - 4, y + 4);
  ctx.lineTo(x + w / 2, y - 10);
  ctx.lineTo(x + w + 4, y + 4);
  ctx.closePath();
  ctx.fill();

  // Bucket crank
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(x + w / 2 - 1, y + 2, 2, 16);
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x + w / 2 - 4, y + 16, 8, 6);
}

function drawChickenCoop(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const w = 5 * TILE_SIZE;
  const h = 4 * TILE_SIZE;

  // Coop shed
  ctx.fillStyle = '#b45309';
  ctx.fillRect(x, y + 24, w, h - 24);

  // Slanted roof
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.moveTo(x - 6, y + 26);
  ctx.lineTo(x + w / 2, y + 4);
  ctx.lineTo(x + w + 6, y + 26);
  ctx.closePath();
  ctx.fill();

  // Nesting entry door
  ctx.fillStyle = '#451a03';
  ctx.fillRect(x + 14, y + h - 28, 22, 28);

  // Straw bedding
  ctx.fillStyle = '#fde047';
  ctx.fillRect(x + 16, y + h - 8, 18, 6);

  // Fence pen around coop
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 40, y + 10, w + 90, h + 50);

  ctx.fillStyle = '#fde047';
  ctx.font = '8px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('Chicken Pasture', x + w / 2, y + h + 16);
}

function drawChicken(ctx: CanvasRenderingContext2D, chicken: ChickenEntity, gameTime: number) {
  const x = Math.floor(chicken.x);
  const y = Math.floor(chicken.y);
  const pecking = Math.sin(gameTime * 0.008 + x) > 0.6;
  const peckY = pecking ? 2 : 0;

  // Body
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(x, y + peckY, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Red Comb on head
  ctx.fillStyle = '#ef4444';
  const headX = chicken.direction === 'left' ? x - 7 : x + 7;
  ctx.fillRect(headX - 2, y - 6 + peckY, 4, 3);

  // Head
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(headX, y - 2 + peckY, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Yellow Beak
  ctx.fillStyle = '#f59e0b';
  const beakX = chicken.direction === 'left' ? headX - 4 : headX + 4;
  ctx.fillRect(beakX, y - 2 + peckY, 3, 2);

  // Tiny Eye
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(headX + (chicken.direction === 'left' ? -1 : 1), y - 4 + peckY, 1.5, 1.5);

  // Yellow Feet
  ctx.fillStyle = '#d97706';
  ctx.fillRect(x - 3, y + 6, 2, 4);
  ctx.fillRect(x + 2, y + 6, 2, 4);

  // Golden Fresh Egg laid on ground
  if (chicken.hasEgg) {
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(x - 8, y + 4, 4, 3, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Sparkle
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 9, y + 2, 1.5, 1.5);
  }
}

function drawTree(ctx: CanvasRenderingContext2D, tree: TreeEntity, gameTime: number) {
  const x = Math.floor(tree.x);
  const y = Math.floor(tree.y);
  const sway = Math.sin(gameTime * 0.003 + x) * 2;

  // Tree Trunk
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x - 6, y - 10, 12, 28);
  ctx.fillStyle = '#451a03';
  ctx.fillRect(x - 2, y - 10, 4, 28);

  // Foliage
  if (tree.type === 'pine') {
    // Pine tree cones
    ctx.fillStyle = '#166534';
    ctx.beginPath();
    ctx.moveTo(x + sway, y - 48);
    ctx.lineTo(x - 18 + sway, y - 20);
    ctx.lineTo(x + 18 + sway, y - 20);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + sway, y - 32);
    ctx.lineTo(x - 22 + sway, y - 6);
    ctx.lineTo(x + 22 + sway, y - 6);
    ctx.closePath();
    ctx.fill();
  } else {
    // Round Lush Oak Foliage
    ctx.fillStyle = tree.type === 'golden' ? '#d97706' : '#15803d';
    ctx.beginPath();
    ctx.arc(x + sway, y - 24, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = tree.type === 'golden' ? '#f59e0b' : '#22c55e';
    ctx.beginPath();
    ctx.arc(x - 8 + sway, y - 28, 14, 0, Math.PI * 2);
    ctx.arc(x + 8 + sway, y - 28, 14, 0, Math.PI * 2);
    ctx.arc(x + sway, y - 36, 14, 0, Math.PI * 2);
    ctx.fill();

    // Fruit in foliage
    if (tree.hasFruit) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(x - 8 + sway, y - 22, 3.5, 0, Math.PI * 2);
      ctx.arc(x + 10 + sway, y - 24, 3.5, 0, Math.PI * 2);
      ctx.arc(x + sway, y - 34, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // HP bar if damaged
  if (tree.hp < tree.maxHp) {
    const barW = 24;
    const barH = 4;
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(x - barW / 2, y + 20, barW, barH);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(x - barW / 2, y + 20, (barW * tree.hp) / tree.maxHp, barH);
  }
}

function drawFountain(ctx: CanvasRenderingContext2D, cx: number, cy: number, gameTime: number) {
  // Outer Stone Basin
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.arc(cx, cy, 38, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.arc(cx, cy, 34, 0, Math.PI * 2);
  ctx.fill();

  // Water Basin with animated ripples
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.arc(cx, cy, 30, 0, Math.PI * 2);
  ctx.fill();

  const ripple = (gameTime * 0.003) % 1;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 10 + ripple * 18, 0, Math.PI * 2);
  ctx.stroke();

  // Middle Pedestal
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(cx - 10, cy - 14, 20, 24);

  // Top Spout with water splash droplets
  ctx.fillStyle = '#38bdf8';
  for (let i = 0; i < 6; i++) {
    const angle = (gameTime * 0.004 + (i * Math.PI) / 3) % (Math.PI * 2);
    const dropDist = 14 + Math.sin(gameTime * 0.01 + i) * 6;
    const dx = cx + Math.cos(angle) * dropDist;
    const dy = cy + Math.sin(angle) * dropDist * 0.6 - 12;
    ctx.fillRect(dx - 1.5, dy - 1.5, 3, 3);
  }
}

function drawStoreBuilding(ctx: CanvasRenderingContext2D, x: number, y: number, label: string) {
  const w = 7 * TILE_SIZE;
  const h = 5.5 * TILE_SIZE;

  // Store walls
  ctx.fillStyle = '#475569';
  ctx.fillRect(x, y + 36, w, h - 36);

  // Red & White Striped Canopy Awning
  const stripeW = w / 6;
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#ef4444' : '#ffffff';
    ctx.fillRect(x + i * stripeW, y + 36, stripeW, 16);
  }

  // Roof
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(x - 8, y + 36);
  ctx.lineTo(x + w / 2, y + 6);
  ctx.lineTo(x + w + 8, y + 36);
  ctx.closePath();
  ctx.fill();

  // Large Shopfront Windows & Glass
  ctx.fillStyle = '#bae6fd';
  ctx.fillRect(x + 16, y + 60, 44, 30);
  ctx.fillRect(x + w - 60, y + 60, 44, 30);

  // Wooden Double Door
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x + w / 2 - 16, y + h - 40, 32, 40);

  // Shop Label
  ctx.fillStyle = '#fef08a';
  ctx.font = '8px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + 26);
}

function drawTavernBuilding(ctx: CanvasRenderingContext2D, x: number, y: number, label: string) {
  const w = 7 * TILE_SIZE;
  const h = 5.5 * TILE_SIZE;

  ctx.fillStyle = '#78350f';
  ctx.fillRect(x, y + 36, w, h - 36);

  // Blue & Cream Awning
  const stripeW = w / 6;
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#3b82f6' : '#fef3c7';
    ctx.fillRect(x + i * stripeW, y + 36, stripeW, 16);
  }

  // Roof
  ctx.fillStyle = '#451a03';
  ctx.beginPath();
  ctx.moveTo(x - 8, y + 36);
  ctx.lineTo(x + w / 2, y + 6);
  ctx.lineTo(x + w + 8, y + 36);
  ctx.closePath();
  ctx.fill();

  // Door
  ctx.fillStyle = '#292524';
  ctx.fillRect(x + w / 2 - 16, y + h - 40, 32, 40);

  // Label
  ctx.fillStyle = '#fef08a';
  ctx.font = '8px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + 26);
}

function drawSauna(ctx: CanvasRenderingContext2D, x: number, y: number, gameTime: number) {
  const w = 8 * TILE_SIZE;
  const h = 6 * TILE_SIZE;

  // Wooden decking
  ctx.fillStyle = '#a16207';
  ctx.fillRect(x, y, w, h);

  // Wooden deck planks
  ctx.fillStyle = '#78350f';
  for (let i = 0; i < w; i += 16) {
    ctx.fillRect(x + i, y, 2, h);
  }

  // Hot Springs Thermal Water Pool
  const poolX = x + 18;
  const poolY = y + 18;
  const poolW = w - 36;
  const poolH = h - 36;

  ctx.fillStyle = '#0284c7';
  ctx.fillRect(poolX, poolY, poolW, poolH);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(poolX + 4, poolY + 4, poolW - 8, poolH - 8);

  // Rising Steam Vapor particles
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  for (let i = 0; i < 6; i++) {
    const steamX = poolX + 16 + (i * 24) % poolW;
    const steamY = poolY + poolH - ((gameTime * 0.04 + i * 20) % (poolH + 20));
    ctx.beginPath();
    ctx.arc(steamX + Math.sin(gameTime * 0.006 + i) * 6, steamY, 5 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }

  // Sauna Signpost
  ctx.fillStyle = '#fef08a';
  ctx.font = '8px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('♨️ Terra Villa Sauna (Rapid Energy ⚡)', x + w / 2, y - 8);
}

function drawNoticeBoard(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const w = 48;
  const h = 36;

  // Support posts
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x + 4, y + 10, 4, 34);
  ctx.fillRect(x + w - 8, y + 10, 4, 34);

  // Board
  ctx.fillStyle = '#b45309';
  ctx.fillRect(x, y, w, h);

  // Parchment notices
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(x + 6, y + 6, 14, 18);
  ctx.fillRect(x + 24, y + 8, 16, 16);

  ctx.fillStyle = '#451a03';
  ctx.font = '6px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('Notice', x + w / 2, y - 4);
}

function drawLamppost(ctx: CanvasRenderingContext2D, x: number, y: number, gameTime: number) {
  // Post
  ctx.fillStyle = '#334155';
  ctx.fillRect(x - 2, y - 26, 4, 28);

  // Lamp housing
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(x - 5, y - 32, 10, 8);

  // Warm glow radius
  const glow = 0.15 + Math.sin(gameTime * 0.005 + x) * 0.03;
  ctx.fillStyle = `rgba(253, 224, 71, ${glow})`;
  ctx.beginPath();
  ctx.arc(x, y - 28, 28, 0, Math.PI * 2);
  ctx.fill();
}

function drawWarpPortal(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, gameTime: number) {
  const radius = 24;
  const angle = gameTime * 0.003;

  // Outer stone pedestal
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.arc(x + 16, y + 16, radius + 4, 0, Math.PI * 2);
  ctx.fill();

  // Swirling Portal Core
  ctx.fillStyle = '#8b5cf6';
  ctx.beginPath();
  ctx.arc(x + 16, y + 16, radius, 0, Math.PI * 2);
  ctx.fill();

  // Pulsing stars & rings
  ctx.strokeStyle = '#c084fc';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + 16, y + 16, radius * 0.6, angle, angle + Math.PI * 1.5);
  ctx.stroke();

  ctx.fillStyle = '#fef08a';
  ctx.fillRect(x + 14, y + 14, 4, 4);

  // Label
  ctx.fillStyle = '#e0e7ff';
  ctx.font = '7px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + 16, y - 14);
}

function drawNPC(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  name: string,
  hairColor: string,
  shirtColor: string,
  pantsColor: string
) {
  drawCharacter(
    ctx,
    x,
    y,
    'down',
    false,
    0,
    name,
    hairColor,
    shirtColor,
    pantsColor,
    0,
    undefined,
    undefined,
    true
  );
}

function drawWoodenFences(
  ctx: CanvasRenderingContext2D,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
) {
  ctx.fillStyle = '#78350f';
  // North boundary
  for (let x = minX; x < maxX; x += 16) {
    ctx.fillRect(x, minY, 3, 16);
    ctx.fillRect(x, minY + 4, 16, 3);
  }
}

/**
 * Procedural Pixel Character Renderer (Local player, Remote MMO Players, NPCs)
 */
function drawCharacter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: 'up' | 'down' | 'left' | 'right',
  isMoving: boolean,
  gameTime: number,
  name: string,
  hairColor: string,
  shirtColor: string,
  pantsColor: string,
  swingProgress: number = 0,
  activeToolIcon?: string,
  speechText?: string,
  isNPC: boolean = false
) {
  ctx.save();
  ctx.translate(Math.floor(x), Math.floor(y));

  // Walk cycle bobbing
  const walkFrame = isMoving ? Math.sin(gameTime * 0.015) : 0;
  const legOffset = Math.sin(gameTime * 0.02) * 4;
  const bob = Math.abs(walkFrame) * 2;

  // Shadow under character
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 10, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // 1. Legs / Shoes
  ctx.fillStyle = '#1c1917'; // Shoes
  if (isMoving && (direction === 'up' || direction === 'down')) {
    ctx.fillRect(-7, 8 - bob + legOffset, 5, 4);
    ctx.fillRect(2, 8 - bob - legOffset, 5, 4);
  } else {
    ctx.fillRect(-6, 8 - bob, 4, 4);
    ctx.fillRect(2, 8 - bob, 4, 4);
  }

  // Pants
  ctx.fillStyle = pantsColor;
  ctx.fillRect(-6, 3 - bob, 12, 6);

  // 2. Torso / Shirt
  ctx.fillStyle = shirtColor;
  ctx.fillRect(-7, -8 - bob, 14, 11);

  // Belt
  ctx.fillStyle = '#451a03';
  ctx.fillRect(-7, 1 - bob, 14, 2);

  // 3. Head & Face
  ctx.fillStyle = '#fcd34d'; // Skin tone
  ctx.fillRect(-6, -18 - bob, 12, 10);

  // Eyes
  ctx.fillStyle = '#1c1917';
  if (direction === 'down') {
    ctx.fillRect(-4, -14 - bob, 2, 2);
    ctx.fillRect(2, -14 - bob, 2, 2);
    // Rosy cheeks
    ctx.fillStyle = '#f87171';
    ctx.fillRect(-5, -11 - bob, 2, 1);
    ctx.fillRect(3, -11 - bob, 2, 1);
  } else if (direction === 'left') {
    ctx.fillRect(-5, -14 - bob, 2, 2);
  } else if (direction === 'right') {
    ctx.fillRect(3, -14 - bob, 2, 2);
  }

  // 4. Hair / Cap
  ctx.fillStyle = hairColor;
  ctx.fillRect(-8, -21 - bob, 16, 5);
  ctx.fillRect(-8, -19 - bob, 3, 6);
  if (direction !== 'left') {
    ctx.fillRect(5, -19 - bob, 3, 6);
  }

  // 5. Tool in hand & Swing Animation
  if (activeToolIcon || swingProgress > 0) {
    const swingAngle = swingProgress > 0 ? (swingProgress - 0.5) * Math.PI : 0;
    ctx.save();
    ctx.translate(direction === 'left' ? -9 : 9, -4 - bob);
    ctx.rotate(direction === 'left' ? -swingAngle : swingAngle);

    // Miniature pixel tool
    ctx.fillStyle = '#78350f'; // Handle
    ctx.fillRect(-1, -8, 2, 14);

    if (activeToolIcon === 'hoe') {
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-4, -10, 8, 3);
    } else if (activeToolIcon === 'axe') {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, -11, 7, 6);
    } else if (activeToolIcon === 'water_can') {
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-3, -8, 6, 6);
    } else if (activeToolIcon === 'shears') {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-3, -10, 6, 5);
    }

    ctx.restore();
  }

  // 6. Nameplate
  ctx.font = '6px "Press Start 2P"';
  ctx.textAlign = 'center';

  const nameBgW = ctx.measureText(name).width + 8;
  ctx.fillStyle = isNPC ? 'rgba(234, 179, 8, 0.85)' : 'rgba(15, 23, 42, 0.75)';
  ctx.fillRect(-nameBgW / 2, -29 - bob, nameBgW, 9);

  ctx.fillStyle = isNPC ? '#422006' : '#f8fafc';
  ctx.fillText(name, 0, -22 - bob);

  // 7. Floating Chat Speech Bubble
  if (speechText) {
    drawSpeechBubble(ctx, 0, -34 - bob, speechText);
  }

  ctx.restore();
}

function drawSpeechBubble(ctx: CanvasRenderingContext2D, x: number, y: number, text: string) {
  ctx.font = '7px "Press Start 2P"';
  const textW = Math.min(180, ctx.measureText(text).width);
  const bubbleW = textW + 14;
  const bubbleH = 18;

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.roundRect(x - bubbleW / 2, y - bubbleH, bubbleW, bubbleH, 4);
  ctx.fill();
  ctx.stroke();

  // Pointer triangle
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(x - 4, y);
  ctx.lineTo(x + 4, y);
  ctx.lineTo(x, y + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Text
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.fillText(text.slice(0, 24), x, y - 6);
}

function drawFloatingTexts(
  ctx: CanvasRenderingContext2D,
  texts: FloatingText[],
  gameTime: number
) {
  for (const item of texts) {
    const elapsed = gameTime - item.createdAt;
    if (elapsed > item.duration) continue;

    const progress = elapsed / item.duration;
    const yOffset = progress * 24;
    const alpha = 1 - progress;

    ctx.save();
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillStyle = item.color;
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillText(item.text, item.x, item.y - yOffset);
    ctx.restore();
  }
}
