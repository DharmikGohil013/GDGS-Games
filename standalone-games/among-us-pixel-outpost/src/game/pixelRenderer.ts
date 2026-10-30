import {
  ADMIN_TABLE_POS,
  EMERGENCY_BUTTON_POS,
  MAP_HEIGHT,
  MAP_WIDTH,
  ROOMS,
  SECURITY_CAMS_POS,
  TASKS,
  VENTS,
  WALL_COLLIDERS,
} from './mapData.ts';
import { canInteractWithVent, getDistance } from './rules.ts';
import {
  DeadBody,
  Player,
  PLAYER_COLORS,
  SabotageState,
} from './types.ts';

export interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  camera: { x: number; y: number };
  player: Player;
  players: Player[];
  deadBodies: DeadBody[];
  sabotage: SabotageState;
  screenShake: number;
}

export class PixelRenderer {
  private starfield: { x: number; y: number; s: number; b: number }[] = [];

  constructor() {
    // Generate space stars for space windows
    for (let i = 0; i < 200; i++) {
      this.starfield.push({
        x: Math.random() * MAP_WIDTH,
        y: Math.random() * MAP_HEIGHT,
        s: Math.random() > 0.8 ? 2 : 1,
        b: 0.3 + Math.random() * 0.7,
      });
    }
  }

  public render(rc: RenderContext) {
    const { ctx, canvas, camera, player, players, deadBodies, sabotage, screenShake } = rc;
    const w = canvas.width;
    const h = canvas.height;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // Clear background (Deep space black)
    ctx.fillStyle = '#060810';
    ctx.fillRect(0, 0, w, h);

    // Apply Camera translation with screen shake
    const shakeX = screenShake > 0 ? (Math.random() - 0.5) * screenShake * 8 : 0;
    const shakeY = screenShake > 0 ? (Math.random() - 0.5) * screenShake * 8 : 0;

    const camX = Math.round(w / 2 - camera.x + shakeX);
    const camY = Math.round(h / 2 - camera.y + shakeY);

    ctx.translate(camX, camY);

    // 1. Draw Space Windows (Exterior stars visible behind cutouts)
    this.drawSpaceStarfield(ctx);

    // 2. Draw Rooms & Floors
    this.drawRoomsAndFloors(ctx);

    // 3. Draw Room Furniture & Task Terminals
    this.drawStationProps(ctx, player);

    // 4. Draw Vents
    this.drawVents(ctx, player);

    // 5. Draw Dead Bodies
    for (const body of deadBodies) {
      this.drawDeadBody(ctx, body);
    }

    // 6. Draw Players (Sorted by Y for correct isometric depth overlap)
    const sortedPlayers = [...players].sort((a, b) => a.y - b.y);
    for (const p of sortedPlayers) {
      if (!p.inVentId) {
        this.drawPlayer(ctx, p, player);
      }
    }

    // 7. Draw Visual Tasks in progress (e.g. MedBay Scan)
    this.drawVisualTaskEffects(ctx, players);

    // 8. Draw Walls and Structural Dividers
    this.drawWalls(ctx);

    // 9. Fog of War / Lighting (Sabotage: Lights or general vision)
    this.drawLightingAndVignette(ctx, player, sabotage, w, h, camX, camY);

    ctx.restore();
  }

  private drawSpaceStarfield(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#ffffff';
    for (const star of this.starfield) {
      ctx.globalAlpha = star.b * 0.7;
      ctx.fillRect(star.x, star.y, star.s, star.s);
    }
    ctx.globalAlpha = 1.0;
  }

  private drawRoomsAndFloors(ctx: CanvasRenderingContext2D) {
    // Rooms
    for (const r of ROOMS) {
      // Room floor
      ctx.fillStyle = r.floorColor || '#2c3340';
      ctx.fillRect(r.x, r.y, r.w, r.h);

      // Floor grid tiles (pixel lines)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const tileSize = 40;
      for (let x = r.x; x < r.x + r.w; x += tileSize) {
        ctx.beginPath();
        ctx.moveTo(x, r.y);
        ctx.lineTo(x, r.y + r.h);
        ctx.stroke();
      }
      for (let y = r.y; y < r.y + r.h; y += tileSize) {
        ctx.beginPath();
        ctx.moveTo(r.x, y);
        ctx.lineTo(r.x + r.w, y);
        ctx.stroke();
      }

      // Room boundary outline
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.strokeRect(r.x, r.y, r.w, r.h);

      // Room name stamped on floor
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(r.name.toUpperCase(), r.x + r.w / 2, r.y + r.h / 2);
    }

    // Corridors & Hallways connecting rooms
    this.drawCorridor(ctx, 1000, 480, 100, 260); // Cafe to Storage
    this.drawCorridor(ctx, 1200, 240, 260, 80); // Cafe to Weapons
    this.drawCorridor(ctx, 740, 320, 160, 70); // Cafe to Medbay
    this.drawCorridor(ctx, 1260, 880, 60, 60); // Storage to Admin
    this.drawCorridor(ctx, 780, 920, 80, 80); // Storage to Electrical
    this.drawCorridor(ctx, 1260, 1180, 60, 60); // Storage to Comms
    this.drawCorridor(ctx, 400, 700, 90, 80); // Security to Reactor
    this.drawCorridor(ctx, 380, 360, 150, 70); // Medbay to Upper Engine
    this.drawCorridor(ctx, 380, 1140, 90, 70); // Electrical to Lower Engine
  }

  private drawCorridor(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.fillStyle = '#1e2430';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
  }

  private drawStationProps(ctx: CanvasRenderingContext2D, localPlayer: Player) {
    // 1. Cafeteria Emergency Meeting Table
    const eb = EMERGENCY_BUTTON_POS;
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(eb.x, eb.y, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Red Emergency Button in center
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(eb.x, eb.y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Glass dome reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(eb.x - 5, eb.y - 5, 8, 0, Math.PI * 2);
    ctx.fill();

    // 2. Admin Table
    const at = ADMIN_TABLE_POS;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(at.x - 45, at.y - 25, 90, 50);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(at.x - 45, at.y - 25, 90, 50);
    // Hologram map projection glow
    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.fillRect(at.x - 35, at.y - 18, 70, 36);

    // 3. Security Monitors
    const sc = SECURITY_CAMS_POS;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(sc.x - 40, sc.y - 20, 80, 40);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(sc.x - 32, sc.y - 14, 28, 18);
    ctx.fillRect(sc.x + 4, sc.y - 14, 28, 18);

    // 4. MedBay Scanner Pad
    const scanTask = TASKS.find((t) => t.type === 'medbay_scan');
    if (scanTask) {
      ctx.fillStyle = '#0f292d';
      ctx.beginPath();
      ctx.arc(scanTask.x, scanTask.y, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#14b8a6';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Scanner crosshair grid
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.5)';
      ctx.beginPath();
      ctx.moveTo(scanTask.x - 20, scanTask.y);
      ctx.lineTo(scanTask.x + 20, scanTask.y);
      ctx.moveTo(scanTask.x, scanTask.y - 20);
      ctx.lineTo(scanTask.x, scanTask.y + 20);
      ctx.stroke();
    }

    // 5. Draw Tasks Consoles
    for (const t of TASKS) {
      const dist = getDistance(localPlayer.x, localPlayer.y, t.x, t.y);
      const isNearby = dist <= 60 && !localPlayer.isDead;

      // Terminal Box
      ctx.fillStyle = isNearby ? '#ca8a04' : '#334155';
      ctx.fillRect(t.x - 14, t.y - 14, 28, 28);
      ctx.strokeStyle = isNearby ? '#facc15' : '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(t.x - 14, t.y - 14, 28, 28);

      // Screen inside terminal
      ctx.fillStyle = isNearby ? '#fef08a' : '#1e293b';
      ctx.fillRect(t.x - 9, t.y - 9, 18, 14);

      // Blinking task indicator light
      const blink = Math.sin(Date.now() / 250) > 0;
      ctx.fillStyle = blink ? '#ef4444' : '#22c55e';
      ctx.fillRect(t.x - 4, t.y + 7, 8, 4);

      // Highlight outline if interactable
      if (isNearby) {
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 24, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  private drawVents(ctx: CanvasRenderingContext2D, localPlayer: Player) {
    for (const v of VENTS) {
      const isImpostor = localPlayer.role === 'impostor' && !localPlayer.isDead;
      const isNearby = isImpostor && canInteractWithVent(localPlayer, v, 55);

      // Metal floor grate
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(v.x - 18, v.y - 12, 36, 24);
      ctx.strokeStyle = isNearby ? '#ef4444' : '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(v.x - 18, v.y - 12, 36, 24);

      // Grate slits
      ctx.fillStyle = isNearby ? '#f87171' : '#1e293b';
      for (let i = -12; i <= 12; i += 6) {
        ctx.fillRect(v.x + i, v.y - 8, 3, 16);
      }

      // Impostor glowing arrow on active vent
      if (isNearby) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(v.x, v.y - 18);
        ctx.lineTo(v.x - 6, v.y - 24);
        ctx.lineTo(v.x + 6, v.y - 24);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  private drawDeadBody(ctx: CanvasRenderingContext2D, body: DeadBody) {
    const color = PLAYER_COLORS[body.color];

    ctx.save();
    ctx.translate(body.x, body.y);

    // Blood splat puddle underneath
    ctx.fillStyle = '#7a0838';
    ctx.beginPath();
    ctx.ellipse(0, 8, 20, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lower half of bean body (cut in half)
    ctx.fillStyle = color.hex;
    ctx.fillRect(-14, 0, 28, 14);

    // Shadow on bottom
    ctx.fillStyle = color.shadowHex;
    ctx.fillRect(-14, 8, 28, 6);

    // Legs on floor
    ctx.fillStyle = color.hex;
    ctx.fillRect(-12, 14, 10, 8);
    ctx.fillRect(2, 14, 10, 8);

    // White cut bone sticking up
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-3, -12, 6, 12);
    // Bone knob
    ctx.fillRect(-6, -14, 12, 4);

    ctx.restore();
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, p: Player, localPlayer: Player) {
    const color = PLAYER_COLORS[p.color];
    const isLocal = p.id === localPlayer.id;

    ctx.save();
    ctx.translate(p.x, p.y);

    if (p.isDead) {
      // Ghost appearance (translucent floating with ghost tail)
      ctx.globalAlpha = 0.45;
      const hoverOffset = Math.sin(Date.now() / 200 + p.x) * 4;
      ctx.translate(0, hoverOffset);
    } else {
      // Shadow under feet
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(0, 18, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const dir = p.facing === 'left' ? -1 : 1;

    // Backpack
    ctx.fillStyle = color.shadowHex;
    ctx.fillRect(dir === 1 ? -16 : 8, -6, 8, 16);

    // Main Bean Body
    ctx.fillStyle = color.hex;
    ctx.fillRect(-12, -18, 24, 28);
    // Head rounded cap
    ctx.fillRect(-9, -22, 18, 4);

    // Shadow on body bottom & side
    ctx.fillStyle = color.shadowHex;
    ctx.fillRect(-12, 2, 24, 8);
    ctx.fillRect(dir === 1 ? -12 : 8, -18, 4, 28);

    // Animated Walking Legs
    const walkStep = Math.floor(p.walkFrame) % 4;
    const legLeftOffset = p.isMoving ? (walkStep === 0 || walkStep === 1 ? 3 : -2) : 0;
    const legRightOffset = p.isMoving ? (walkStep === 2 || walkStep === 3 ? 3 : -2) : 0;

    if (!p.isDead) {
      // Left leg
      ctx.fillStyle = color.shadowHex;
      ctx.fillRect(-10, 10, 8, 8 + legLeftOffset);
      // Right leg
      ctx.fillStyle = color.hex;
      ctx.fillRect(2, 10, 8, 8 + legRightOffset);
    } else {
      // Ghost wavy tail
      ctx.fillStyle = color.hex;
      ctx.beginPath();
      ctx.moveTo(-12, 10);
      ctx.lineTo(0, 18);
      ctx.lineTo(12, 10);
      ctx.lineTo(0, 14);
      ctx.closePath();
      ctx.fill();
    }

    // Visor
    const visorX = dir === 1 ? 0 : -14;
    ctx.fillStyle = color.visorHex;
    ctx.fillRect(visorX, -14, 14, 10);
    // Visor border
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.strokeRect(visorX, -14, 14, 10);
    // Visor white reflection gleam
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(visorX + (dir === 1 ? 6 : 2), -12, 4, 3);

    // Name Tag above head
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';

    // Impostor sees fellow impostors in red
    const shouldShowRedName =
      (localPlayer.role === 'impostor' && p.role === 'impostor') ||
      (localPlayer.isDead && p.role === 'impostor');

    ctx.fillStyle = shouldShowRedName ? '#ef4444' : isLocal ? '#38bdf8' : '#ffffff';
    ctx.fillText(p.name, 0, -28);

    ctx.restore();
  }

  private drawVisualTaskEffects(ctx: CanvasRenderingContext2D, players: Player[]) {
    // Scan animation if someone is doing medbay scan
    for (const p of players) {
      if (p.state === 'doing_task') {
        const currentTask = p.assignedTasks[p.currentTaskIndex];
        if (currentTask && currentTask.type === 'medbay_scan') {
          ctx.save();
          const sweepY = Math.sin(Date.now() / 250) * 16;
          ctx.strokeStyle = '#2dd4bf';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y + sweepY, 24, 8, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Green aura
          ctx.fillStyle = 'rgba(45, 212, 191, 0.15)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 32, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }
  }

  private drawWalls(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;

    for (const col of WALL_COLLIDERS) {
      ctx.fillRect(col.x, col.y, col.w, col.h);
      ctx.strokeRect(col.x, col.y, col.w, col.h);

      // Metal beam top bevel
      ctx.fillStyle = '#334155';
      ctx.fillRect(col.x, col.y, col.w, 4);
      ctx.fillStyle = '#0f172a';
    }
  }

  private drawLightingAndVignette(
    ctx: CanvasRenderingContext2D,
    player: Player,
    sabotage: SabotageState,
    w: number,
    h: number,
    camX: number,
    camY: number
  ) {
    const isLightsSabotaged = sabotage.active && sabotage.type === 'lights';
    const isImpostor = player.role === 'impostor';

    // Impostors retain night vision
    if (!isLightsSabotaged && !isImpostor) {
      // Normal soft station lighting
      return;
    }

    ctx.save();
    // Shift context back to screen coordinates
    ctx.translate(-camX, -camY);

    const screenX = w / 2;
    const screenY = h / 2;

    // Vision radius: Crewmate has 110px during lights sabotage, Impostor has 320px
    const visionRadius = isLightsSabotaged && !isImpostor ? 110 : 360;

    const grad = ctx.createRadialGradient(
      screenX,
      screenY,
      visionRadius * 0.4,
      screenX,
      screenY,
      visionRadius
    );

    if (isLightsSabotaged && !isImpostor) {
      grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.85)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.98)');
    } else {
      // Subtle edge vignette
      grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.1)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // If lights are sabotaged, draw red blinking alarm bar at top
    if (isLightsSabotaged) {
      const flash = Math.sin(Date.now() / 200) > 0;
      if (flash) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
        ctx.fillRect(0, 0, w, h);
      }
    }

    ctx.restore();
  }
}
