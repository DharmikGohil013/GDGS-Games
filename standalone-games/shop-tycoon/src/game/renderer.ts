/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PlacedFixture, Customer, StaffMember, FloatingNotification, Product, Litter } from './types.ts';
import { getFixtureDef } from './furnitureCatalog.ts';
import { getRotatedDimensions } from './logic.ts';

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export interface RenderState {
  gridWidth: number;
  gridHeight: number;
  doorX: number;
  fixtures: PlacedFixture[];
  customers: Customer[];
  staff: StaffMember[];
  products: Product[];
  litter: Litter[];
  notifications: FloatingNotification[];
  warehouseFill: number; // 0..1 share of storage space in use
  hoverTile: { x: number; y: number } | null;
  selectedFixtureId: string | null;
  buildGhost: {
    type: string;
    rotation: number;
    isValid: boolean;
  } | null;
  isStoreOpen: boolean;
  timeOfDay: number; // 8.0 to 20.0
}

// Thought bubbles show for a few seconds after a shopper's mood changes, then fade away
const THOUGHT_SECONDS = 3;
// Back-room floor markings stay where the store started, even after expansions
const WAREHOUSE_ZONE = { minX: 9, maxX: 13, maxY: 2 };

export class IsoRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public tileWidth = 64;
  public tileHeight = 32;
  // Backing-store pixels per CSS pixel; drawing and hit-testing happen in CSS pixels
  public pixelRatio = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  private get viewWidth() {
    return this.canvas.width / this.pixelRatio;
  }

  private get viewHeight() {
    return this.canvas.height / this.pixelRatio;
  }

  public toScreen(gx: number, gy: number, camera: CameraState): { x: number; y: number } {
    const isoX = (gx - gy) * (this.tileWidth / 2);
    const isoY = (gx + gy) * (this.tileHeight / 2);
    const x = this.viewWidth / 2 + (isoX - camera.x) * camera.zoom;
    const y = this.viewHeight / 2 + (isoY - camera.y) * camera.zoom;
    return { x, y };
  }

  public toGrid(sx: number, sy: number, camera: CameraState): { x: number; y: number } {
    const isoX = (sx - this.viewWidth / 2) / camera.zoom + camera.x;
    const isoY = (sy - this.viewHeight / 2) / camera.zoom + camera.y;

    const gx = (isoX / (this.tileWidth / 2) + isoY / (this.tileHeight / 2)) / 2;
    const gy = (isoY / (this.tileHeight / 2) - isoX / (this.tileWidth / 2)) / 2;

    return { x: Math.floor(gx), y: Math.floor(gy) };
  }

  /** Camera that frames the whole store floor in the current viewport. */
  public fitCamera(gridWidth: number, gridHeight: number): CameraState {
    const halfW = this.tileWidth / 2;
    const halfH = this.tileHeight / 2;
    const storeWidth = (gridWidth + gridHeight) * halfW;
    const storeHeight = (gridWidth + gridHeight) * halfH + 60;
    // Leave room for the HUD bars above and below the floor
    const zoom = Math.max(0.55, Math.min(1.6, (this.viewWidth * 0.94) / storeWidth, (this.viewHeight * 0.68) / storeHeight));
    return {
      x: ((gridWidth - gridHeight) / 2) * halfW,
      y: ((gridWidth + gridHeight) / 2) * halfH - 20,
      zoom
    };
  }

  public render(state: RenderState, camera: CameraState) {
    const ctx = this.ctx;
    const width = this.viewWidth;
    const height = this.viewHeight;

    ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Ambient background gradient matching game world (deep modern slate navy)
    const bgGradient = ctx.createRadialGradient(
      width / 2, height / 2, 80,
      width / 2, height / 2, Math.max(width, height)
    );
    bgGradient.addColorStop(0, '#0f172a');
    bgGradient.addColorStop(1, '#020617');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();

    // 1. Draw floor tiles and anything lying on them
    this.drawFloor(state, camera);
    this.drawLitter(state.litter, camera);

    // 2. Collect all renderable entities for depth sorting (Y-sort)
    type DepthItem = 
      | { type: 'fixture'; item: PlacedFixture; depth: number }
      | { type: 'customer'; item: Customer; depth: number }
      | { type: 'staff'; item: StaffMember; depth: number };

    const items: DepthItem[] = [];

    state.fixtures.forEach(f => {
      // Depth based on bottom-right corner of fixture
      items.push({
        type: 'fixture',
        item: f,
        depth: (f.x + f.width - 0.5) + (f.y + f.height - 0.5)
      });
    });

    // People are drawn at their tile centre (x + 0.5, y + 0.5), so sort them by that point too;
    // otherwise a shopper standing in front of a shelf is painted behind it
    state.customers.forEach(c => {
      items.push({
        type: 'customer',
        item: c,
        depth: c.x + c.y + 1
      });
    });

    state.staff.forEach(s => {
      items.push({
        type: 'staff',
        item: s,
        depth: s.x + s.y + 1
      });
    });

    // Sort by isometric depth
    items.sort((a, b) => a.depth - b.depth);

    // Render sorted items
    for (const dItem of items) {
      if (dItem.type === 'fixture') {
        this.drawFixture(dItem.item, state, camera);
      } else if (dItem.type === 'customer') {
        this.drawCustomer(dItem.item, camera);
      } else if (dItem.type === 'staff') {
        this.drawStaff(dItem.item, state, camera);
      }
    }

    // 3. Draw Build Mode ghost blueprint if active
    if (state.buildGhost && state.hoverTile) {
      this.drawBuildGhost(state.buildGhost, state.hoverTile, camera);
    }

    // 4. Draw Floating Notifications (coins, XP, popups)
    this.drawNotifications(state.notifications, camera);

    // 5. Late-afternoon light: warm from 4 PM, dusky violet as closing time nears
    this.drawEveningTint(state.timeOfDay, width, height);

    ctx.restore();
  }

  private drawEveningTint(timeOfDay: number, width: number, height: number) {
    if (timeOfDay < 16) return;
    const ctx = this.ctx;
    const t = Math.min(1, (timeOfDay - 16) / 4);
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = t < 0.5 ? `rgba(251, 146, 60, ${0.1 * t})` : `rgba(91, 33, 182, ${0.06 + 0.12 * (t - 0.5)})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  private drawLitter(litter: Litter[], camera: CameraState) {
    const ctx = this.ctx;
    const z = camera.zoom;
    for (const spot of litter) {
      const { x, y } = this.toScreen(spot.x + 0.5, spot.y + 0.5, camera);
      ctx.save();
      if (spot.kind === 'spill') {
        ctx.beginPath();
        ctx.ellipse(x, y, 13 * z, 6 * z, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.7)';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.translate(x, y - 2 * z);
        ctx.rotate(0.4);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-6 * z, -3 * z, 12 * z, 6 * z);
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(-2 * z, -3 * z, 4 * z, 6 * z);
      }
      ctx.restore();
    }
  }

  private drawFloor(state: RenderState, camera: CameraState) {
    const ctx = this.ctx;
    const { gridWidth, gridHeight } = state;

    // Floor base
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const p1 = this.toScreen(x, y, camera);
        const p2 = this.toScreen(x + 1, y, camera);
        const p3 = this.toScreen(x + 1, y + 1, camera);
        const p4 = this.toScreen(x, y + 1, camera);

        // Entrance zone styling
        const isDoorZone = (y === gridHeight - 1 && (x === state.doorX - 1 || x === state.doorX));
        // Backroom warehouse zone
        const isWarehouseZone = (y <= WAREHOUSE_ZONE.maxY && x >= WAREHOUSE_ZONE.minX && x <= WAREHOUSE_ZONE.maxX);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();

        if (isDoorZone) {
          // Welcome mat at entry
          ctx.fillStyle = '#1e3a5f';
        } else if (isWarehouseZone) {
          // Warehouse hazard striped yellow/slate zone
          ctx.fillStyle = (x + y) % 2 === 0 ? '#334155' : '#1e293b';
        } else {
          // Elegant checkerboard shop floor
          ctx.fillStyle = (x + y) % 2 === 0 ? '#1e293b' : '#0f172a';
        }
        ctx.fill();

        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Hover highlight
        if (state.hoverTile && state.hoverTile.x === x && state.hoverTile.y === y) {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
          ctx.fill();
        }
      }
    }

    // Outer wall accents
    this.drawWalls(state, camera);
  }

  private drawWalls(state: RenderState, camera: CameraState) {
    const ctx = this.ctx;
    const { gridWidth, gridHeight } = state;
    const wallHeight = 40 * camera.zoom;

    // Back-left wall (y = 0, along x from 0 to gridWidth)
    for (let x = 0; x < gridWidth; x++) {
      const p1 = this.toScreen(x, 0, camera);
      const p2 = this.toScreen(x + 1, 0, camera);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p2.x, p2.y - wallHeight);
      ctx.lineTo(p1.x, p1.y - wallHeight);
      ctx.closePath();

      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Back-right wall (x = 0, along y from 0 to gridHeight)
    for (let y = 0; y < gridHeight; y++) {
      const p1 = this.toScreen(0, y, camera);
      const p2 = this.toScreen(0, y + 1, camera);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p2.x, p2.y - wallHeight);
      ctx.lineTo(p1.x, p1.y - wallHeight);
      ctx.closePath();

      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Entrance Glass Door Sign at bottom
    const dp = this.toScreen(state.doorX, gridHeight, camera);

    ctx.save();
    ctx.translate(dp.x, dp.y);
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.font = `bold ${Math.max(10, Math.floor(12 * camera.zoom))}px 'Plus Jakarta Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('▼ ENTRANCE / EXIT ▼', 0, 16 * camera.zoom);
    ctx.restore();
  }

  private drawFixture(fixture: PlacedFixture, state: RenderState, camera: CameraState) {
    const ctx = this.ctx;
    const def = getFixtureDef(fixture.type);
    if (!def) return;

    const { x, y, width: w, height: h } = fixture;
    const pTop = this.toScreen(x, y, camera);
    const pRight = this.toScreen(x + w, y, camera);
    const pBottom = this.toScreen(x + w, y + h, camera);
    const pLeft = this.toScreen(x, y + h, camera);

    const fixtureHeight = (def.category === 'storage' ? 44 : def.category === 'shelf' ? 32 : 26) * camera.zoom;
    const isSelected = state.selectedFixtureId === fixture.id;

    // Fixture Drop Shadow
    ctx.beginPath();
    ctx.moveTo(pTop.x, pTop.y + 4);
    ctx.lineTo(pRight.x + 4, pRight.y + 4);
    ctx.lineTo(pBottom.x + 4, pBottom.y + 4);
    ctx.lineTo(pLeft.x, pLeft.y + 4);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fill();

    // 3D Isometric Block
    // Left Face (bottom to left)
    ctx.beginPath();
    ctx.moveTo(pLeft.x, pLeft.y);
    ctx.lineTo(pBottom.x, pBottom.y);
    ctx.lineTo(pBottom.x, pBottom.y - fixtureHeight);
    ctx.lineTo(pLeft.x, pLeft.y - fixtureHeight);
    ctx.closePath();
    ctx.fillStyle = this.shadeColor(def.color, -35);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();

    // Right Face (bottom to right)
    ctx.beginPath();
    ctx.moveTo(pRight.x, pRight.y);
    ctx.lineTo(pBottom.x, pBottom.y);
    ctx.lineTo(pBottom.x, pBottom.y - fixtureHeight);
    ctx.lineTo(pRight.x, pRight.y - fixtureHeight);
    ctx.closePath();
    ctx.fillStyle = this.shadeColor(def.color, -20);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();

    // Top Face
    ctx.beginPath();
    ctx.moveTo(pTop.x, pTop.y - fixtureHeight);
    ctx.lineTo(pRight.x, pRight.y - fixtureHeight);
    ctx.lineTo(pBottom.x, pBottom.y - fixtureHeight);
    ctx.lineTo(pLeft.x, pLeft.y - fixtureHeight);
    ctx.closePath();
    ctx.fillStyle = def.color;
    ctx.fill();
    ctx.strokeStyle = isSelected ? '#38bdf8' : '#0f172a';
    ctx.lineWidth = isSelected ? 2.5 : 1;
    ctx.stroke();

    // Specific detailing based on category
    const centerTopX = (pTop.x + pBottom.x) / 2;
    const centerTopY = (pTop.y + pBottom.y) / 2 - fixtureHeight;

    if (def.category === 'shelf') {
      const assignedProduct = state.products.find(p => p.id === fixture.assignedProductId);
      
      // Stock gauge bar on top face
      const fillRatio = fixture.maxStock > 0 ? fixture.currentStock / fixture.maxStock : 0;
      const barW = 34 * camera.zoom;
      const barH = 5 * camera.zoom;
      
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(centerTopX - barW / 2, centerTopY - barH / 2 + 10 * camera.zoom, barW, barH);
      
      ctx.fillStyle = fillRatio > 0.4 ? '#22c55e' : fillRatio > 0.1 ? '#f59e0b' : '#ef4444';
      ctx.fillRect(centerTopX - barW / 2, centerTopY - barH / 2 + 10 * camera.zoom, barW * fillRatio, barH);

      // Icon of assigned product
      ctx.save();
      ctx.font = `${Math.max(12, Math.floor(18 * camera.zoom))}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (assignedProduct && fixture.currentStock > 0) {
        ctx.fillText(assignedProduct.icon, centerTopX, centerTopY - 2 * camera.zoom);
      } else if (assignedProduct && fixture.currentStock === 0) {
        ctx.fillText('⚠️', centerTopX, centerTopY - 2 * camera.zoom);
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = `bold ${Math.max(9, Math.floor(11 * camera.zoom))}px 'Plus Jakarta Sans'`;
        ctx.fillText('Empty', centerTopX, centerTopY - 2 * camera.zoom);
      }
      ctx.restore();
    } else if (def.category === 'checkout') {
      // Monitor & register screen
      ctx.save();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(centerTopX - 6 * camera.zoom, centerTopY - 14 * camera.zoom, 12 * camera.zoom, 10 * camera.zoom);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(centerTopX - 5 * camera.zoom, centerTopY - 13 * camera.zoom, 10 * camera.zoom, 8 * camera.zoom);
      
      // Queue indicator
      const qLen = fixture.queue?.length || 0;
      if (qLen > 0) {
        ctx.fillStyle = '#f59e0b';
        ctx.font = `bold ${Math.max(10, Math.floor(11 * camera.zoom))}px 'JetBrains Mono'`;
        ctx.textAlign = 'center';
        ctx.fillText(`👥 ${qLen}`, centerTopX, centerTopY - 18 * camera.zoom);
      }
      ctx.restore();
    } else if (def.category === 'storage') {
      // Cardboard box stacks, plus how full the back room is overall
      ctx.save();
      ctx.font = `${Math.max(14, Math.floor(20 * camera.zoom))}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('📦', centerTopX, centerTopY - 2 * camera.zoom);

      const barW = 34 * camera.zoom;
      const barH = 5 * camera.zoom;
      const fill = Math.max(0, Math.min(1, state.warehouseFill));
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(centerTopX - barW / 2, centerTopY + 10 * camera.zoom, barW, barH);
      ctx.fillStyle = fill > 0.9 ? '#ef4444' : fill > 0.7 ? '#f59e0b' : '#38bdf8';
      ctx.fillRect(centerTopX - barW / 2, centerTopY + 10 * camera.zoom, barW * fill, barH);
      ctx.restore();
    } else if (def.type === 'decor_plant') {
      // Plant foliage
      ctx.save();
      ctx.font = `${Math.max(14, Math.floor(22 * camera.zoom))}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🪴', centerTopX, centerTopY - 4 * camera.zoom);
      ctx.restore();
    } else if (def.type === 'decor_vending') {
      ctx.save();
      ctx.font = `${Math.max(14, Math.floor(20 * camera.zoom))}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🕹️', centerTopX, centerTopY - 4 * camera.zoom);
      ctx.restore();
    }

    // Selection ring
    if (isSelected) {
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.ellipse(centerTopX, centerTopY + 14 * camera.zoom, 26 * camera.zoom, 13 * camera.zoom, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  /** A small standing figure: legs, torso, head. Returns the y of the top of the head. */
  private drawPerson(x: number, y: number, z: number, body: string, skin: string, outline: string, bob: number, stride: number): number {
    const ctx = this.ctx;

    // Soft drop shadow
    ctx.beginPath();
    ctx.ellipse(x, y + 2 * z, 10 * z, 5 * z, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fill();

    // Legs, swinging while walking
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3 * z;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 2.5 * z, y - 10 * z - bob);
    ctx.lineTo(x - 2.5 * z + stride * z, y - 1 * z);
    ctx.moveTo(x + 2.5 * z, y - 10 * z - bob);
    ctx.lineTo(x + 2.5 * z - stride * z, y - 1 * z);
    ctx.stroke();

    // Torso
    ctx.beginPath();
    ctx.roundRect(x - 6.5 * z, y - 22 * z - bob, 13 * z, 13 * z, 4 * z);
    ctx.fillStyle = body;
    ctx.fill();
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Head
    ctx.beginPath();
    ctx.arc(x, y - 27 * z - bob, 5.5 * z, 0, Math.PI * 2);
    ctx.fillStyle = skin;
    ctx.fill();
    ctx.stroke();

    return y - 33 * z - bob;
  }

  private drawCustomer(customer: Customer, camera: CameraState) {
    const ctx = this.ctx;
    const { x, y } = this.toScreen(customer.x + 0.5, customer.y + 0.5, camera);
    const z = camera.zoom;

    const walking = customer.path !== undefined && customer.path.length > 0;
    const bob = walking ? Math.abs(Math.sin(customer.walkTimer * 10)) * 1.5 * z : 0;
    const stride = walking ? Math.sin(customer.walkTimer * 10) * 2.5 : 0;
    const headTop = this.drawPerson(x, y, z, customer.shirtColor, customer.skinTone, '#0f172a', bob, stride);

    // Shopping basket if has cart items
    if (customer.cart.length > 0) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x + 5 * z, y - 15 * z - bob, 7 * z, 5 * z);
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 5 * z, y - 15 * z - bob, 7 * z, 5 * z);
    }

    // Running out of patience
    const leaving = customer.state === 'leaving_happy' || customer.state === 'leaving_unhappy';
    if (!leaving && customer.patience < 30) {
      ctx.save();
      ctx.font = `bold ${Math.max(11, Math.floor(13 * z))}px system-ui`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f87171';
      ctx.fillText('!', x - 9 * z, headTop + 4 * z);
      ctx.restore();
    }

    // Emote / Thought Bubble, only while the thought is fresh
    if (customer.currentThought && customer.thoughtTimer < THOUGHT_SECONDS) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, (THOUGHT_SECONDS - customer.thoughtTimer) * 2);
      this.drawThoughtBubble(x, headTop - 9 * z, customer.currentThought, z);
      ctx.restore();
    }
  }

  private drawStaff(staff: StaffMember, state: RenderState, camera: CameraState) {
    const ctx = this.ctx;
    const { x, y } = this.toScreen(staff.x + 0.5, staff.y + 0.5, camera);
    const z = camera.zoom;

    // Staff Vest / Apron color (Cashier: Royal Blue, Restocker: Emerald Green, Cleaner: Amber)
    const vestColor = staff.role === 'cashier' ? '#2563eb' : staff.role === 'restocker' ? '#059669' : '#d97706';
    const walking = staff.path !== undefined && staff.path.length > 0;
    const stride = walking ? Math.sin(performance.now() / 70) * 2.5 : 0;
    const headTop = this.drawPerson(x, y, z, vestColor, '#fed7aa', '#ffffff', 0, stride);

    // Carried carton box if restocking
    if (staff.state === 'carrying_box') {
      ctx.save();
      ctx.fillStyle = '#b45309';
      ctx.fillRect(x - 6 * z, y - 24 * z, 12 * z, 9 * z);
      ctx.strokeStyle = '#78350f';
      ctx.strokeRect(x - 6 * z, y - 24 * z, 12 * z, 9 * z);
      ctx.restore();
    }

    // Role badge above head
    ctx.save();
    ctx.font = `bold ${Math.max(11, Math.floor(13 * z))}px 'Plus Jakarta Sans'`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    const roleIcon = staff.role === 'cashier' ? '💳' : staff.role === 'restocker' ? '📦' : '🧹';
    ctx.fillText(staff.state === 'working' && staff.role === 'cleaner' ? '✨' : roleIcon, x, headTop - 2 * z);
    ctx.restore();
  }

  private drawThoughtBubble(x: number, y: number, text: string, z: number) {
    const ctx = this.ctx;
    ctx.save();
    
    // Bubble dimensions
    const pad = 4 * z;
    const fontSz = Math.max(11, Math.floor(13 * z));
    ctx.font = `${fontSz}px system-ui`;
    const textMetrics = ctx.measureText(text);
    const bubbleW = textMetrics.width + pad * 2 + 6 * z;
    const bubbleH = fontSz + pad * 2;

    // Bubble backdrop with subtle border
    ctx.beginPath();
    ctx.roundRect(x - bubbleW / 2, y - bubbleH / 2, bubbleW, bubbleH, 6 * z);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Little tail pointing down
    ctx.beginPath();
    ctx.moveTo(x - 3 * z, y + bubbleH / 2);
    ctx.lineTo(x, y + bubbleH / 2 + 4 * z);
    ctx.lineTo(x + 3 * z, y + bubbleH / 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fill();

    // Text / Emoji
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);

    ctx.restore();
  }

  private drawBuildGhost(
    ghost: { type: string; rotation: number; isValid: boolean },
    tile: { x: number; y: number },
    camera: CameraState
  ) {
    const ctx = this.ctx;
    const def = getFixtureDef(ghost.type);
    if (!def) return;

    const { w, h } = getRotatedDimensions(def.width, def.height, ghost.rotation);
    const pTop = this.toScreen(tile.x, tile.y, camera);
    const pRight = this.toScreen(tile.x + w, tile.y, camera);
    const pBottom = this.toScreen(tile.x + w, tile.y + h, camera);
    const pLeft = this.toScreen(tile.x, tile.y + h, camera);

    const fixtureHeight = 30 * camera.zoom;

    ctx.save();
    const ghostColor = ghost.isValid ? 'rgba(34, 197, 94, 0.45)' : 'rgba(239, 68, 68, 0.55)';
    const strokeColor = ghost.isValid ? '#22c55e' : '#ef4444';

    // Base outline
    ctx.beginPath();
    ctx.moveTo(pTop.x, pTop.y);
    ctx.lineTo(pRight.x, pRight.y);
    ctx.lineTo(pBottom.x, pBottom.y);
    ctx.lineTo(pLeft.x, pLeft.y);
    ctx.closePath();
    ctx.fillStyle = ghostColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Top elevated face
    ctx.beginPath();
    ctx.moveTo(pTop.x, pTop.y - fixtureHeight);
    ctx.lineTo(pRight.x, pRight.y - fixtureHeight);
    ctx.lineTo(pBottom.x, pBottom.y - fixtureHeight);
    ctx.lineTo(pLeft.x, pLeft.y - fixtureHeight);
    ctx.closePath();
    ctx.fillStyle = ghostColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.stroke();

    // Name label
    const centerX = (pTop.x + pBottom.x) / 2;
    const centerY = (pTop.y + pBottom.y) / 2 - fixtureHeight / 2;
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(10, Math.floor(12 * camera.zoom))}px 'Plus Jakarta Sans'`;
    ctx.textAlign = 'center';
    ctx.fillText(`${def.name} ($${def.cost})`, centerX, centerY);
    if (!ghost.isValid) {
      ctx.fillStyle = '#fca5a5';
      ctx.fillText('Blocked!', centerX, centerY + 14 * camera.zoom);
    }
    ctx.restore();
  }

  private drawNotifications(notifications: FloatingNotification[], camera: CameraState) {
    const ctx = this.ctx;
    for (const note of notifications) {
      const { x, y } = this.toScreen(note.x, note.y, camera);
      const offsetY = (1 - note.lifetime) * 35; // floats up

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, note.lifetime * 1.5));
      ctx.font = `bold 14px 'JetBrains Mono', monospace`;
      ctx.fillStyle = note.color;
      ctx.shadowColor = note.color;
      ctx.shadowBlur = 8;
      ctx.textAlign = 'center';
      ctx.fillText(note.text, x, y - offsetY);
      ctx.restore();
    }
  }

  private shadeColor(color: string, percent: number): string {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = Math.min(255, Math.max(0, Math.floor((R * (100 + percent)) / 100)));
    G = Math.min(255, Math.max(0, Math.floor((G * (100 + percent)) / 100)));
    B = Math.min(255, Math.max(0, Math.floor((B * (100 + percent)) / 100)));

    const RR = R.toString(16).padStart(2, '0');
    const GG = G.toString(16).padStart(2, '0');
    const BB = B.toString(16).padStart(2, '0');

    return `#${RR}${GG}${BB}`;
  }
}
