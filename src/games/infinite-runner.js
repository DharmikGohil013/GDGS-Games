// ─── Infinite Runner — Flawless Engine & Smooth Parallax ───
import Phaser from 'phaser';

let gameInstance = null;

// Biome definitions with rich color themes
const BIOMES = [
  {
    name: 'Grasslands',
    skyTop: 0x1B2A47, skyBottom: 0x3B6998,
    ground: 0x4A7C42, dirt: 0x5C3A21, platform: 0x5C9E4A, accent: 0x2D5A1E,
    particle: 0x8BC34A, bgDistant: 0x183354, bgMid: 0x29527D
  },
  {
    name: 'Desert',
    skyTop: 0x3D1820, skyBottom: 0xA34A32,
    ground: 0xC2B280, dirt: 0x7A5C3E, platform: 0xDAA520, accent: 0xD2691E,
    particle: 0xF4A460, bgDistant: 0x5A2417, bgMid: 0x823824
  },
  {
    name: 'Snow Peaks',
    skyTop: 0x0F1B29, skyBottom: 0x254159,
    ground: 0xDFE6E9, dirt: 0x636E72, platform: 0x74B9FF, accent: 0x0984E3,
    particle: 0xFFFFFF, bgDistant: 0x162636, bgMid: 0x2B455E
  },
  {
    name: 'Volcano',
    skyTop: 0x1F0505, skyBottom: 0x4D0C0C,
    ground: 0x5C1010, dirt: 0x2B0505, platform: 0x8B0000, accent: 0xFF4500,
    particle: 0xFF6347, bgDistant: 0x2E0808, bgMid: 0x471010
  },
  {
    name: 'Cyber City',
    skyTop: 0x050515, skyBottom: 0x180436,
    ground: 0x1A1A2E, dirt: 0x0F1020, platform: 0x0F3460, accent: 0x00E5FF,
    particle: 0xE040FB, bgDistant: 0x12002B, bgMid: 0x2B0054
  }
];

// Helper for smooth continuous modulo without negative wrapping glitches
function getParallaxOffset(camX, factor, tileWidth) {
  let offset = (camX * factor) % tileWidth;
  if (offset < 0) offset += tileWidth;
  return offset;
}

// Audio Synthesizer
class SoundFX {
  constructor() { this.ctx = null; this.enabled = true; }
  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }
  _play(type, freq, freqEnd, dur, vol = 0.2) {
    if (!this.enabled) return; this.init(); if (!this.ctx) return;
    try {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, this.ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(freqEnd, this.ctx.currentTime + dur);
      g.gain.setValueAtTime(vol, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(); o.stop(this.ctx.currentTime + dur);
    } catch (e) {}
  }
  playJump() { this._play('sine', 280, 580, 0.12, 0.16); }
  playDoubleJump() { this._play('sine', 420, 780, 0.1, 0.16); }
  playLand() { this._play('triangle', 110, 50, 0.08, 0.1); }
  playCoin() {
    if (!this.enabled) return; this.init(); if (!this.ctx) return;
    try {
      [880, 1175].forEach((f, i) => {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = 'square'; o.frequency.setValueAtTime(f, this.ctx.currentTime + i * 0.05);
        g.gain.setValueAtTime(0.12, this.ctx.currentTime + i * 0.05);
        g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + i * 0.05 + 0.09);
        o.connect(g); g.connect(this.ctx.destination);
        o.start(this.ctx.currentTime + i * 0.05);
        o.stop(this.ctx.currentTime + i * 0.05 + 0.09);
      });
    } catch (e) {}
  }
  playPowerup() {
    if (!this.enabled) return; this.init(); if (!this.ctx) return;
    try {
      [523, 659, 784, 1047].forEach((f, i) => {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(f, this.ctx.currentTime + i * 0.04);
        g.gain.setValueAtTime(0.18, this.ctx.currentTime + i * 0.04);
        g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + i * 0.04 + 0.11);
        o.connect(g); g.connect(this.ctx.destination);
        o.start(this.ctx.currentTime + i * 0.04);
        o.stop(this.ctx.currentTime + i * 0.04 + 0.11);
      });
    } catch (e) {}
  }
  playShieldHit() { this._play('sawtooth', 550, 180, 0.2, 0.2); }
  playDeath() { this._play('sawtooth', 320, 40, 0.45, 0.28); }
  playSlide() { this._play('triangle', 180, 70, 0.1, 0.09); }
  playMilestone() {
    if (!this.enabled) return; this.init(); if (!this.ctx) return;
    try {
      [523, 659, 784, 1047, 1319].forEach((f, i) => {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = 'triangle'; o.frequency.setValueAtTime(f, this.ctx.currentTime + i * 0.06);
        g.gain.setValueAtTime(0.15, this.ctx.currentTime + i * 0.06);
        g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + i * 0.06 + 0.13);
        o.connect(g); g.connect(this.ctx.destination);
        o.start(this.ctx.currentTime + i * 0.06);
        o.stop(this.ctx.currentTime + i * 0.06 + 0.13);
      });
    } catch (e) {}
  }
}
const sfx = new SoundFX();

export function initGame(container) {
  destroyGame();

  class RunnerScene extends Phaser.Scene {
    constructor() { super('RunnerScene'); }

    preload() {
      this.load.image('cityBg', '/images/city-bg.png');
    }

    create() {
      this.W = this.sys.game.config.width;
      this.H = this.sys.game.config.height;

      // Game State & Difficulty
      this.state = 'START'; // 'START', 'PLAYING', 'DEAD'
      this.mode = localStorage.getItem('inf_runner_mode') || 'CASUAL';

      this.modeConfigs = {
        CASUAL: { baseSpeed: 75, maxSpeed: 190, gravity: 820, jump: -410, doubleJump: -340, initialShield: true, multiplier: 1 },
        NORMAL: { baseSpeed: 95, maxSpeed: 260, gravity: 880, jump: -430, doubleJump: -360, initialShield: false, multiplier: 1 },
        PRO:    { baseSpeed: 125, maxSpeed: 340, gravity: 940, jump: -450, doubleJump: -380, initialShield: false, multiplier: 2 }
      };

      const cfg = this.modeConfigs[this.mode];

      this.score = 0;
      this.coinsCollected = 0;
      this.distanceRun = 0;
      this.highScore = parseInt(localStorage.getItem(`inf_runner_highscore_${this.mode}`) || '0', 10);
      this.bestCoins = parseInt(localStorage.getItem(`inf_runner_bestcoins_${this.mode}`) || '0', 10);

      this.speed = cfg.baseSpeed;
      this.lastMilestone = 0;

      // Biome
      this.biomeIndex = 0;
      this.biomeTransitionDist = 2200;
      this.nextBiomeDist = this.biomeTransitionDist;
      this.biome = BIOMES[0];

      // World Layout
      this.GROUND_Y = this.H - 60;
      this.PLAYER_SCREEN_X = this.W * 0.22;

      // Player State
      this.player = {
        worldX: 60,
        worldY: this.GROUND_Y,
        vy: 0,
        width: 16,
        height: 26,
        onGround: true,
        canDoubleJump: true,
        isSliding: false,
        slideTimer: 0,
        isDead: false,
        animTimer: 0,
        animFrame: 0,
        squashY: 1,
        squashX: 1,
        coyoteTimer: 0,
        jumpBuffer: 0
      };

      this.COYOTE_TIME = 0.12;
      this.JUMP_BUFFER_TIME = 0.14;
      this.SLIDE_DURATION = 0.50;

      // Power-ups
      this.shield = cfg.initialShield;
      this.magnet = false;      this.magnetTimer = 0;
      this.doubleCoins = false;  this.doubleCoinTimer = 0;
      this.speedBoost = false;   this.speedBoostTimer = 0;

      // World Arrays
      this.grounds = [];
      this.platforms = [];
      this.obstacles = [];
      this.coins = [];
      this.powerups = [];
      this.decorations = [];
      this.particles = [];
      this.ambientParticles = [];
      this.lastGenX = 0;
      this.GEN_AHEAD = this.W * 2.5;
      this.CLEANUP_BEHIND = this.W * 0.8;

      // Graphics Layers
      this.skyGfx = this.add.graphics().setDepth(0);
      this.parallaxFarGfx = this.add.graphics().setDepth(1);

      // Infinite Looping City Background Layer
      try {
        if (this.textures.exists('cityBg')) {
          this.cityBg = this.add.tileSprite(0, this.GROUND_Y, this.W, 260, 'cityBg')
            .setOrigin(0, 1)
            .setScrollFactor(0)
            .setDepth(2);
        }
      } catch (e) {}

      this.parallaxMidGfx = this.add.graphics().setDepth(3);
      this.decoGfx = this.add.graphics().setDepth(4);
      this.groundGfx = this.add.graphics().setDepth(5);
      this.obstGfx = this.add.graphics().setDepth(8);
      this.coinGfx = this.add.graphics().setDepth(10);
      this.playerGfx = this.add.graphics().setDepth(20);
      this.particleGfx = this.add.graphics().setDepth(25);

      this.initAmbientParticles();
      this.generateInitialWorld();
      this.createUI();

      // Controls
      this.input.on('pointerdown', (ptr) => {
        if (ptr.y < 80 && this.state === 'START') return;
        if (this.state === 'DEAD') return;
        if (this.state === 'START') { this.startGame(); return; }
        if (ptr.y < this.H * 0.55) this.requestJump();
        else this.requestSlide();
      });

      this.input.keyboard.on('keydown-SPACE', (e) => {
        if (e) e.preventDefault();
        if (this.state === 'DEAD') { this.restartGame(); return; }
        if (this.state === 'START') { this.startGame(); return; }
        this.requestJump();
      });
      this.input.keyboard.on('keydown-UP', (e) => {
        if (e) e.preventDefault();
        if (this.state === 'START') { this.startGame(); return; }
        if (this.state === 'PLAYING') this.requestJump();
      });
      this.input.keyboard.on('keydown-DOWN', (e) => {
        if (e) e.preventDefault();
        if (this.state === 'PLAYING') this.requestSlide();
      });
      this.input.keyboard.on('keydown-S', () => {
        if (this.state === 'PLAYING') this.requestSlide();
      });
      this.input.keyboard.on('keydown-R', () => this.restartGame());
    }

    initAmbientParticles() {
      for (let i = 0; i < 20; i++) {
        this.ambientParticles.push({
          x: Phaser.Math.Between(0, this.W),
          y: Phaser.Math.Between(0, this.H),
          vx: Phaser.Math.FloatBetween(-15, -35),
          vy: Phaser.Math.FloatBetween(8, 24),
          radius: Phaser.Math.FloatBetween(1.5, 3),
          alpha: Phaser.Math.FloatBetween(0.3, 0.7)
        });
      }
    }

    createUI() {
      const ts = { fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'bold', color: '#FFFFFF' };

      this.distText = this.add.text(20, 16, '0m', { ...ts, fontSize: '36px' }).setScrollFactor(0).setDepth(100);
      this.coinText = this.add.text(20, 56, '🪙 0', { ...ts, fontSize: '18px', color: '#FFC93C' }).setScrollFactor(0).setDepth(100);
      this.bestText = this.add.text(this.W - 20, 16, `BEST: ${this.highScore}m`, {
        ...ts, fontSize: '15px', color: 'rgba(255,255,255,0.7)'
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);
      this.powerupText = this.add.text(this.W / 2, 16, '', {
        ...ts, fontSize: '15px', color: '#00E5FF'
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);
      this.biomeText = this.add.text(this.W / 2, this.H - 24, '', {
        ...ts, fontSize: '14px', color: 'rgba(255,255,255,0.6)'
      }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(100);

      // Start Screen Overlay
      this.startContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(200);
      const sBg = this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x000000, 0.45);
      const sTitle = this.add.text(this.W / 2, this.H / 2 - 120, 'INFINITE RUNNER', {
        fontFamily: "'Bungee', sans-serif", fontSize: '32px', color: '#00E5FF'
      }).setOrigin(0.5);

      const modeLabel = this.add.text(this.W / 2, this.H / 2 - 45, 'SELECT DIFFICULTY', {
        ...ts, fontSize: '13px', color: 'rgba(255,255,255,0.6)'
      }).setOrigin(0.5);

      const modes = ['CASUAL', 'NORMAL', 'PRO'];
      const modeBtns = [];

      modes.forEach((m, idx) => {
        const x = this.W / 2 + (idx - 1) * 105;
        const y = this.H / 2;

        const isSel = this.mode === m;
        const btnBg = this.add.rectangle(x, y, 95, 36, isSel ? 0x00E5FF : 0x16171D, 1);
        btnBg.setStrokeStyle(1.5, isSel ? 0x00E5FF : 0x444444);
        btnBg.setInteractive({ useHandCursor: true });

        const btnTxt = this.add.text(x, y, m, {
          ...ts, fontSize: '13px', color: isSel ? '#0b0c10' : '#888888'
        }).setOrigin(0.5);

        btnBg.on('pointerdown', (pointer, localX, localY, event) => {
          if (event) event.stopPropagation();
          this.mode = m;
          localStorage.setItem('inf_runner_mode', m);
          this.highScore = parseInt(localStorage.getItem(`inf_runner_highscore_${this.mode}`) || '0', 10);
          this.bestCoins = parseInt(localStorage.getItem(`inf_runner_bestcoins_${this.mode}`) || '0', 10);
          this.bestText.setText(`BEST: ${this.highScore}m`);

          modeBtns.forEach(({ bg, txt, modeKey }) => {
            const s = modeKey === m;
            bg.setFillStyle(s ? 0x00E5FF : 0x16171D);
            bg.setStrokeStyle(1.5, s ? 0x00E5FF : 0x444444);
            txt.setColor(s ? '#0b0c10' : '#888888');
          });

          const cfg = this.modeConfigs[this.mode];
          this.speed = cfg.baseSpeed;
          this.shield = cfg.initialShield;
        });

        modeBtns.push({ bg: btnBg, txt: btnTxt, modeKey: m });
      });

      const sTap = this.add.text(this.W / 2, this.H / 2 + 70, 'TAP OR PRESS SPACE TO START', {
        ...ts, fontSize: '16px'
      }).setOrigin(0.5);
      this.tweens.add({ targets: sTap, alpha: 0.3, duration: 800, yoyo: true, repeat: -1 });

      const sCtrl = this.add.text(this.W / 2, this.H / 2 + 115, '⬆️ JUMP  •  ⬇️ SLIDE  •  R RESTART', {
        ...ts, fontSize: '13px', color: 'rgba(255,255,255,0.5)'
      }).setOrigin(0.5);

      this.startContainer.add([sBg, sTitle, modeLabel, ...modeBtns.flatMap(b => [b.bg, b.txt]), sTap, sCtrl]);

      // Game Over Overlay
      this.deadContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(300).setVisible(false);
      const dBg = this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x0b0c10, 0.88);
      dBg.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.restartGame());
      const dCard = this.add.rectangle(this.W / 2, this.H / 2, Math.min(this.W - 30, 370), 340, 0x16171D, 1);
      dCard.setStrokeStyle(2, 0x00E5FF);
      const dTitle = this.add.text(this.W / 2, this.H / 2 - 130, 'GAME OVER', {
        fontFamily: "'Bungee', sans-serif", fontSize: '28px', color: '#FF5F4D'
      }).setOrigin(0.5);
      this.dDistText = this.add.text(this.W / 2, this.H / 2 - 70, '0m', { ...ts, fontSize: '38px' }).setOrigin(0.5);
      this.dCoinsText = this.add.text(this.W / 2, this.H / 2 - 25, '🪙 0 coins', { ...ts, fontSize: '18px', color: '#FFC93C' }).setOrigin(0.5);
      this.dBestText = this.add.text(this.W / 2, this.H / 2 + 10, 'BEST: 0m', { ...ts, fontSize: '16px', color: '#00E5FF' }).setOrigin(0.5);
      this.dNewBest = this.add.text(this.W / 2, this.H / 2 + 40, '', { ...ts, fontSize: '14px', color: '#FFC93C' }).setOrigin(0.5);
      const dBtn = this.add.rectangle(this.W / 2, this.H / 2 + 90, 220, 50, 0x00E5FF, 1);
      dBtn.setInteractive({ useHandCursor: true });
      const dBtnTxt = this.add.text(this.W / 2, this.H / 2 + 90, 'RUN AGAIN (R)', {
        ...ts, fontSize: '16px', color: '#0b0c10'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      const doRestart = (p, lx, ly, e) => { if (e) e.stopPropagation(); this.restartGame(); };
      dBtn.on('pointerdown', doRestart);
      dBtnTxt.on('pointerdown', doRestart);
      this.deadContainer.add([dBg, dCard, dTitle, this.dDistText, this.dCoinsText, this.dBestText, this.dNewBest, dBtn, dBtnTxt]);
    }

    startGame() {
      this.state = 'PLAYING';
      this.startContainer.setVisible(false);
      sfx.playJump();
    }

    requestJump() {
      if (this.player.isDead) return;
      const p = this.player;
      const cfg = this.modeConfigs[this.mode];

      if (p.onGround || p.coyoteTimer > 0) {
        p.vy = cfg.jump;
        p.onGround = false;
        p.coyoteTimer = 0;
        p.canDoubleJump = true;
        p.squashY = 1.25; p.squashX = 0.82;
        p.isSliding = false; p.slideTimer = 0;
        sfx.playJump();
        this.spawnDust(p.worldX, p.worldY, 6);
      } else if (p.canDoubleJump) {
        p.vy = cfg.doubleJump;
        p.canDoubleJump = false;
        p.squashY = 1.18; p.squashX = 0.88;
        sfx.playDoubleJump();
        this.spawnDust(p.worldX, p.worldY + 10, 4);
      } else {
        p.jumpBuffer = this.JUMP_BUFFER_TIME;
      }
    }

    requestSlide() {
      if (this.player.isDead) return;
      const p = this.player;
      if (p.onGround && !p.isSliding) {
        p.isSliding = true;
        p.slideTimer = this.SLIDE_DURATION;
        p.squashY = 0.45; p.squashX = 1.45;
        sfx.playSlide();
      }
    }

    generateInitialWorld() {
      this.grounds.push({ x: -100, width: this.W + 500, y: this.GROUND_Y });
      this.lastGenX = this.W + 400;

      for (let i = 0; i < 10; i++) {
        this.decorations.push({
          x: Phaser.Math.Between(50, this.W + 300),
          y: this.GROUND_Y,
          type: Math.random() > 0.5 ? 'tree' : 'bush',
          biome: 0
        });
      }
    }

    generateWorld() {
      const cameraRight = this.cameras.main.scrollX + this.W;
      while (this.lastGenX < cameraRight + this.GEN_AHEAD) {
        this.generateSegment();
      }
    }

    generateSegment() {
      const diff = Math.min(this.distanceRun / 10000, 1);
      const segWidth = Phaser.Math.Between(280, 540 - diff * 130);
      this.grounds.push({ x: this.lastGenX, width: segWidth, y: this.GROUND_Y });

      // Ground Obstacle
      if (this.distanceRun > 300 && Math.random() < 0.28 + diff * 0.3) {
        const obsX = this.lastGenX + Phaser.Math.Between(60, segWidth - 60);
        const obsType = this.pickObstacleType(diff);
        this.obstacles.push(this.createObstacle(obsX, this.GROUND_Y, obsType));
      }

      // Coins
      if (Math.random() < 0.6) {
        const pattern = Math.random();
        const startX = this.lastGenX + Phaser.Math.Between(30, segWidth - 80);
        if (pattern < 0.45) {
          const count = Phaser.Math.Between(3, 6);
          for (let i = 0; i < count; i++) {
            this.coins.push({ x: startX + i * 28, y: this.GROUND_Y - 42, collected: false });
          }
        } else if (pattern < 0.75) {
          const count = 5;
          for (let i = 0; i < count; i++) {
            const arcY = Math.sin((i / (count - 1)) * Math.PI) * 65;
            this.coins.push({ x: startX + i * 26, y: this.GROUND_Y - 32 - arcY, collected: false });
          }
        }
      }

      // Platform
      if (Math.random() < 0.3) {
        const platX = this.lastGenX + Phaser.Math.Between(40, segWidth - 100);
        const platY = this.GROUND_Y - Phaser.Math.Between(85, 150);
        const platW = Phaser.Math.Between(80, 140);
        this.platforms.push({ x: platX, width: platW, y: platY });

        if (Math.random() < 0.7) {
          for (let i = 0; i < 3; i++) {
            this.coins.push({ x: platX + 18 + i * 24, y: platY - 24, collected: false });
          }
        }
      }

      // Powerup
      if (Math.random() < 0.08) {
        const types = ['shield', 'magnet', 'doubleCoins', 'speedBoost'];
        this.powerups.push({
          x: this.lastGenX + segWidth / 2,
          y: this.GROUND_Y - Phaser.Math.Between(55, 130),
          type: types[Math.floor(Math.random() * types.length)],
          collected: false,
          bobPhase: Math.random() * Math.PI * 2
        });
      }

      // Decoration
      if (Math.random() < 0.45) {
        this.decorations.push({
          x: this.lastGenX + Phaser.Math.Between(15, segWidth - 15),
          y: this.GROUND_Y,
          type: Math.random() > 0.5 ? 'tree' : 'bush',
          biome: this.biomeIndex
        });
      }

      // Gap spacing
      const gapWidth = Phaser.Math.Between(40, 65 + diff * 45);
      this.lastGenX += segWidth + gapWidth;
    }

    pickObstacleType(diff) {
      const r = Math.random();
      if (diff < 0.15) return 'spike';
      if (r < 0.40) return 'spike';
      if (r < 0.60) return 'doubleSpike';
      if (r < 0.76) return 'barrier';
      if (r < 0.88) return 'saw';
      return 'fireball';
    }

    createObstacle(x, groundY, type) {
      const obs = { x, type, active: true };
      switch (type) {
        case 'spike':
          obs.y = groundY; obs.width = 18; obs.height = 18; break;
        case 'doubleSpike':
          obs.y = groundY; obs.width = 36; obs.height = 18; break;
        case 'barrier':
          obs.y = groundY; obs.width = 20; obs.height = 32; break;
        case 'tallBarrier':
          obs.y = groundY; obs.width = 18; obs.height = 54; break;
        case 'saw':
          obs.y = groundY - 20; obs.width = 28; obs.height = 28;
          obs.rotation = 0; break;
        case 'fireball':
          obs.y = groundY - 45; obs.width = 18; obs.height = 18;
          obs.movePhase = Math.random() * Math.PI * 2; break;
        default:
          obs.y = groundY; obs.width = 18; obs.height = 18;
      }
      return obs;
    }

    cleanupWorld() {
      const behind = this.cameras.main.scrollX - this.CLEANUP_BEHIND;
      this.grounds = this.grounds.filter(g => g.x + g.width > behind);
      this.platforms = this.platforms.filter(p => p.x + p.width > behind);
      this.obstacles = this.obstacles.filter(o => o.x + (o.width || 30) > behind);
      this.coins = this.coins.filter(c => c.x > behind);
      this.powerups = this.powerups.filter(p => p.x > behind);
      this.decorations = this.decorations.filter(d => d.x > behind);
    }

    update(time, delta) {
      const dt = Math.min(delta / 1000, 0.05);

      this.drawWorld(time);
      this.drawPlayer(time);
      this.updateParticles(dt);

      if (this.state === 'START') {
        this.player.animTimer += dt * 3;
        this.player.worldY = this.GROUND_Y + Math.sin(this.player.animTimer) * 4;
        return;
      }
      if (this.state !== 'PLAYING') return;

      const cfg = this.modeConfigs[this.mode];

      // Smooth Speed progression
      const diff = Math.min(this.distanceRun / 10000, 1);
      let targetSpeed = cfg.baseSpeed + diff * (cfg.maxSpeed - cfg.baseSpeed);
      if (this.speedBoost) targetSpeed *= 1.4;
      this.speed += (targetSpeed - this.speed) * 0.015;

      // Player Movement
      const p = this.player;
      p.worldX += this.speed * dt;
      this.distanceRun = Math.max(0, p.worldX - 60);

      const dist = Math.floor(this.distanceRun / 10);
      this.distText.setText(`${dist}m`);
      this.score = dist;

      if (dist > 0 && dist % 500 === 0 && dist !== this.lastMilestone) {
        this.lastMilestone = dist;
        sfx.playMilestone();
        this.spawnFloatingText(this.PLAYER_SCREEN_X, this.H / 2 - 40, `${dist}m! 🔥`, '#00E5FF', true);
      }

      // Physics & Coyote Time
      if (p.coyoteTimer > 0) p.coyoteTimer -= dt;
      if (p.jumpBuffer > 0) {
        p.jumpBuffer -= dt;
        if (p.onGround) {
          this.requestJump();
          p.jumpBuffer = 0;
        }
      }

      if (!p.onGround) {
        p.vy += cfg.gravity * dt;
      }
      p.worldY += p.vy * dt;

      if (p.isSliding) {
        p.slideTimer -= dt;
        if (p.slideTimer <= 0) {
          p.isSliding = false;
          p.squashY = 1; p.squashX = 1;
        }
      }

      // Ground Collision
      p.onGround = false;
      const pFeetY = p.worldY;
      const pLeft = p.worldX - p.width / 2;
      const pRight = p.worldX + p.width / 2;

      for (const g of this.grounds) {
        if (pRight > g.x && pLeft < g.x + g.width) {
          if (pFeetY >= g.y && pFeetY - p.vy * dt <= g.y + 6) {
            p.worldY = g.y;
            if (p.vy > 90) {
              p.squashY = 0.75; p.squashX = 1.22;
              sfx.playLand();
              this.spawnDust(p.worldX, p.worldY, 5);
            }
            p.vy = 0;
            p.onGround = true;
            p.canDoubleJump = true;
            break;
          }
        }
      }

      // Platform Collision
      if (!p.onGround) {
        for (const pl of this.platforms) {
          if (pRight > pl.x && pLeft < pl.x + pl.width &&
              pFeetY >= pl.y && pFeetY - p.vy * dt <= pl.y + 6 && p.vy >= 0) {
            p.worldY = pl.y;
            if (p.vy > 50) {
              p.squashY = 0.78; p.squashX = 1.18;
              sfx.playLand();
              this.spawnDust(p.worldX, p.worldY, 3);
            }
            p.vy = 0;
            p.onGround = true;
            p.canDoubleJump = true;
            break;
          }
        }
      }

      if (p.onGround) p.coyoteTimer = this.COYOTE_TIME;

      // Fall Death
      if (p.worldY > this.H + 80) {
        this.triggerDeath();
        return;
      }

      p.squashY += (1 - p.squashY) * 0.12;
      p.squashX += (1 - p.squashX) * 0.12;

      if (p.onGround && !p.isSliding) {
        p.animTimer += dt * (this.speed / 24);
        p.animFrame = Math.floor(p.animTimer) % 2;
        if (Math.random() < 0.12) this.spawnDust(p.worldX - 5, p.worldY, 1);
      }

      // Obstacle Anim
      this.obstacles.forEach(o => {
        if (o.type === 'saw') o.rotation = (o.rotation || 0) + 6 * dt;
        if (o.type === 'fireball') {
          o.movePhase = (o.movePhase || 0) + 3 * dt;
          o.y = this.GROUND_Y - 45 + Math.sin(o.movePhase) * 25;
        }
      });

      // ACCURATE OBSTACLE HITBOXES
      const pH = p.isSliding ? 12 : p.height;
      const pTop = p.worldY - pH;
      const pBox = { left: pLeft + 3, right: pRight - 3, top: pTop + 2, bottom: p.worldY - 1 };

      for (const o of this.obstacles) {
        if (!o.active) continue;

        let oBox = null;

        if (o.type === 'spike' || o.type === 'doubleSpike' || o.type === 'barrier' || o.type === 'tallBarrier') {
          oBox = {
            left: o.x - o.width / 2,
            right: o.x + o.width / 2,
            top: o.y - o.height,
            bottom: o.y
          };
        } else if (o.type === 'saw') {
          const r = 13;
          oBox = { left: o.x - r, right: o.x + r, top: o.y - r, bottom: o.y + r };
        } else if (o.type === 'fireball') {
          const r = 8;
          oBox = { left: o.x - r, right: o.x + r, top: o.y - r, bottom: o.y + r };
        }

        if (oBox && pBox.right > oBox.left && pBox.left < oBox.right &&
            pBox.bottom > oBox.top && pBox.top < oBox.bottom) {
          if (this.shield) {
            this.shield = false;
            o.active = false;
            sfx.playShieldHit();
            this.spawnBurst(o.x, o.y - 10, 0x00E5FF, 18);
            this.spawnFloatingText(this.PLAYER_SCREEN_X, p.worldY - 40, 'SHIELD POPPED!', '#00E5FF');
          } else {
            this.triggerDeath();
            return;
          }
        }
      }

      // Coin Collection
      const magnetRange = this.magnet ? 130 : 0;
      for (const c of this.coins) {
        if (c.collected) continue;
        const dx = p.worldX - c.x;
        const dy = (p.worldY - p.height / 2) - c.y;
        const dist2 = dx * dx + dy * dy;

        if (this.magnet && dist2 < magnetRange * magnetRange) {
          c.x += dx * 0.15;
          c.y += dy * 0.15;
        }

        if (dist2 < 22 * 22) {
          c.collected = true;
          const val = (this.doubleCoins ? 2 : 1) * cfg.multiplier;
          this.coinsCollected += val;
          this.coinText.setText(`🪙 ${this.coinsCollected}`);
          sfx.playCoin();
          this.spawnBurst(c.x, c.y, 0xFFC93C, 6);
          this.spawnFloatingText(this.PLAYER_SCREEN_X + Phaser.Math.Between(-15, 15), c.y - this.cameras.main.scrollY, `+${val}`, '#FFC93C');
        }
      }

      // Power-up Collection
      for (const pu of this.powerups) {
        if (pu.collected) continue;
        const dx = p.worldX - pu.x;
        const dy = (p.worldY - p.height / 2) - pu.y;
        if (dx * dx + dy * dy < 26 * 26) {
          pu.collected = true;
          sfx.playPowerup();
          this.spawnBurst(pu.x, pu.y, 0x00E5FF, 20);
          this.activatePowerup(pu.type);
        }
      }

      this.updatePowerups(dt);

      // Biome Transition
      if (this.distanceRun > this.nextBiomeDist) {
        this.biomeIndex = (this.biomeIndex + 1) % BIOMES.length;
        this.biome = BIOMES[this.biomeIndex];
        this.nextBiomeDist += this.biomeTransitionDist;
        this.biomeText.setText(`▸ ${this.biome.name}`);
        this.tweens.add({
          targets: this.biomeText, alpha: 1, duration: 300,
          onComplete: () => {
            this.time.delayedCall(2000, () => {
              this.tweens.add({ targets: this.biomeText, alpha: 0, duration: 500 });
            });
          }
        });
      }

      // Smooth Camera Tracking (prevents camera snapping and screen rush)
      const targetCamX = p.worldX - this.PLAYER_SCREEN_X;
      this.cameras.main.scrollX += (targetCamX - this.cameras.main.scrollX) * 0.12;

      // Update City Skyline Background Parallax Layer
      if (this.cityBg) {
        this.cityBg.tilePositionX = this.cameras.main.scrollX * 0.22;
      }

      this.generateWorld();
      this.cleanupWorld();
    }

    activatePowerup(type) {
      let label = '';
      if (type === 'shield') { this.shield = true; label = '🛡️ SHIELD UP'; }
      else if (type === 'magnet') { this.magnet = true; this.magnetTimer = 8; label = '🧲 MAGNET 8s'; }
      else if (type === 'doubleCoins') { this.doubleCoins = true; this.doubleCoinTimer = 10; label = '🪙 2X COINS 10s'; }
      else if (type === 'speedBoost') { this.speedBoost = true; this.speedBoostTimer = 5; label = '⚡ SPEED BOOST 5s'; }
      this.spawnFloatingText(this.PLAYER_SCREEN_X, this.H / 2, label, '#00E5FF', true);
    }

    updatePowerups(dt) {
      let status = '';
      if (this.shield) status += '🛡️ ';
      if (this.magnet) {
        this.magnetTimer -= dt;
        if (this.magnetTimer <= 0) this.magnet = false;
        else status += `🧲 ${Math.ceil(this.magnetTimer)}s `;
      }
      if (this.doubleCoins) {
        this.doubleCoinTimer -= dt;
        if (this.doubleCoinTimer <= 0) this.doubleCoins = false;
        else status += `2X ${Math.ceil(this.doubleCoinTimer)}s `;
      }
      if (this.speedBoost) {
        this.speedBoostTimer -= dt;
        if (this.speedBoostTimer <= 0) this.speedBoost = false;
        else status += `⚡ ${Math.ceil(this.speedBoostTimer)}s `;
      }
      this.powerupText.setText(status);
    }

    triggerDeath() {
      if (this.state === 'DEAD') return;
      this.state = 'DEAD';
      this.player.isDead = true;
      sfx.playDeath();
      this.cameras.main.shake(250, 0.025);
      this.spawnBurst(this.player.worldX, this.player.worldY - 12, 0xFF5F4D, 30);

      const dist = Math.floor(this.distanceRun / 10);
      let isNew = false;
      if (dist > this.highScore) {
        this.highScore = dist;
        localStorage.setItem(`inf_runner_highscore_${this.mode}`, this.highScore.toString());
        isNew = true;
      }
      if (this.coinsCollected > this.bestCoins) {
        this.bestCoins = this.coinsCollected;
        localStorage.setItem(`inf_runner_bestcoins_${this.mode}`, this.bestCoins.toString());
      }

      this.dDistText.setText(`${dist}m`);
      this.dCoinsText.setText(`🪙 ${this.coinsCollected} coins`);
      this.dBestText.setText(`BEST: ${this.highScore}m`);
      this.dNewBest.setText(isNew ? '🎉 NEW RECORD!' : '');
      this.deadContainer.setVisible(true);
    }

    restartGame() { this.scene.restart(); }

    spawnDust(worldX, worldY, count) {
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: worldX + Phaser.Math.Between(-6, 6),
          y: worldY - 2,
          vx: Phaser.Math.FloatBetween(-30, 30),
          vy: Phaser.Math.FloatBetween(-40, -10),
          radius: Phaser.Math.FloatBetween(2, 4),
          alpha: 0.8,
          color: this.biome.particle,
          isWorld: true
        });
      }
    }

    spawnBurst(worldX, worldY, color, count) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = Phaser.Math.FloatBetween(40, 180);
        this.particles.push({
          x: worldX, y: worldY,
          vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
          radius: Phaser.Math.FloatBetween(2.5, 4.5),
          alpha: 1, color, isWorld: true
        });
      }
    }

    spawnFloatingText(screenX, screenY, text, color, large = false) {
      const t = this.add.text(screenX, screenY, text, {
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: large ? '22px' : '16px',
        fontStyle: 'bold',
        color
      }).setOrigin(0.5).setScrollFactor(0).setDepth(150);

      this.tweens.add({
        targets: t, y: screenY - 40, alpha: 0, duration: 900,
        onComplete: () => t.destroy()
      });
    }

    updateParticles(dt) {
      const g = this.particleGfx;
      g.clear();
      const camX = this.cameras.main.scrollX;

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 120 * dt;
        p.alpha -= 1.8 * dt;

        if (p.alpha <= 0) { this.particles.splice(i, 1); continue; }
        const sx = p.isWorld ? p.x - camX : p.x;
        g.fillStyle(p.color, p.alpha);
        g.fillCircle(sx, p.y, p.radius);
      }

      for (const ap of this.ambientParticles) {
        ap.x += ap.vx * dt;
        ap.y += ap.vy * dt;

        if (ap.x < 0) ap.x = this.W + 10;
        if (ap.y > this.H) ap.y = -10;
        if (ap.y < -10) ap.y = this.H + 10;

        g.fillStyle(this.biome.particle, ap.alpha);
        g.fillCircle(ap.x, ap.y, ap.radius);
      }
    }

    // ─────────────────────────────────────────────
    // RENDER SEAMLESS PARALLAX WORLD
    // ─────────────────────────────────────────────
    drawWorld(time) {
      const camX = this.cameras.main.scrollX;
      const b = this.biome;

      // Layer 1: Sky Gradient & Horizon Glow
      this.skyGfx.clear();
      this.skyGfx.fillGradientStyle(b.skyTop, b.skyTop, b.skyBottom, b.skyBottom, 1);
      this.skyGfx.fillRect(0, 0, this.W, this.H);

      this.skyGfx.fillStyle(b.accent, 0.22);
      this.skyGfx.fillRect(0, this.GROUND_Y - 60, this.W, 60);

      // Layer 2: Far Background Parallax (Factor 0.04)
      const farOffset = getParallaxOffset(camX, 0.04, 240);
      this.parallaxFarGfx.clear();
      this.parallaxFarGfx.fillStyle(b.bgDistant, 0.85);

      for (let x = -farOffset - 240; x < this.W + 240; x += 120) {
        const worldPos = x + farOffset;
        const peakH = 110 + Math.sin(worldPos * 0.012) * 35;
        this.parallaxFarGfx.fillTriangle(x, this.GROUND_Y, x + 60, this.GROUND_Y - peakH, x + 120, this.GROUND_Y);
      }

      // Layer 3: Midground Parallax (Factor 0.12)
      const midOffset = getParallaxOffset(camX, 0.12, 180);
      this.parallaxMidGfx.clear();
      this.parallaxMidGfx.fillStyle(b.bgMid, 0.95);

      for (let x = -midOffset - 180; x < this.W + 180; x += 90) {
        const worldPos = x + midOffset;
        const hillH = 70 + Math.sin(worldPos * 0.02 + 1.2) * 25;
        this.parallaxMidGfx.fillRect(x, this.GROUND_Y - hillH, 92, hillH);
        this.parallaxMidGfx.fillStyle(b.accent, 0.3);
        this.parallaxMidGfx.fillRect(x + 10, this.GROUND_Y - hillH - 6, 72, 6);
        this.parallaxMidGfx.fillStyle(b.bgMid, 0.95);
      }

      // Layer 4: Ground Platforms
      this.groundGfx.clear();
      for (const g of this.grounds) {
        const sx = g.x - camX;
        if (sx > this.W + 40 || sx + g.width < -40) continue;

        this.groundGfx.fillStyle(b.ground, 1);
        this.groundGfx.fillRect(sx, g.y, g.width, 10);

        this.groundGfx.fillStyle(b.dirt, 1);
        this.groundGfx.fillRect(sx, g.y + 10, g.width, this.H - g.y);

        this.groundGfx.fillStyle(b.accent, 0.7);
        for (let gx = 0; gx < g.width; gx += 16) {
          this.groundGfx.fillRect(sx + gx, g.y - 2, 6, 3);
        }
      }

      // Platforms
      for (const pl of this.platforms) {
        const sx = pl.x - camX;
        if (sx > this.W + 40 || sx + pl.width < -40) continue;

        this.groundGfx.fillStyle(b.platform, 1);
        this.groundGfx.fillRect(sx, pl.y, pl.width, 12);
        this.groundGfx.fillStyle(b.accent, 0.6);
        this.groundGfx.fillRect(sx + 2, pl.y + 12, pl.width - 4, 4);
      }

      // Layer 5: Decorations
      this.decoGfx.clear();
      for (const d of this.decorations) {
        const sx = d.x - camX;
        if (sx < -40 || sx > this.W + 40) continue;
        const db = BIOMES[d.biome] || b;

        if (d.type === 'tree') {
          this.decoGfx.fillStyle(db.dirt, 0.9);
          this.decoGfx.fillRect(sx + 4, d.y - 36, 6, 26);
          this.decoGfx.fillStyle(db.accent, 0.75);
          this.decoGfx.fillCircle(sx + 7, d.y - 44, 15);
        } else {
          this.decoGfx.fillStyle(db.accent, 0.65);
          this.decoGfx.fillEllipse(sx + 7, d.y - 8, 18, 12);
        }
      }

      // Layer 6: Obstacles
      this.obstGfx.clear();
      for (const o of this.obstacles) {
        if (!o.active) continue;
        const sx = o.x - camX;
        if (sx < -50 || sx > this.W + 50) continue;

        if (o.type === 'spike' || o.type === 'doubleSpike') {
          this.obstGfx.fillStyle(0xFF4444, 1);
          const count = o.type === 'doubleSpike' ? 2 : 1;
          for (let i = 0; i < count; i++) {
            const tx = sx - o.width / 2 + i * 18;
            this.obstGfx.fillTriangle(tx, o.y, tx + 9, o.y - 18, tx + 18, o.y);
          }
          this.obstGfx.fillStyle(0xFF4444, 0.2);
          this.obstGfx.fillCircle(sx, o.y - 9, 16);
        } else if (o.type === 'barrier' || o.type === 'tallBarrier') {
          this.obstGfx.fillStyle(0xE74C3C, 1);
          this.obstGfx.fillRect(sx - o.width / 2, o.y - o.height, o.width, o.height);

          this.obstGfx.fillStyle(0xFFDD00, 1);
          for (let sy = 0; sy < o.height; sy += 10) {
            this.obstGfx.fillRect(sx - o.width / 2, o.y - o.height + sy, o.width, 3);
          }
        } else if (o.type === 'saw') {
          const cy = o.y;
          this.obstGfx.fillStyle(0xCCCCCC, 1);
          this.obstGfx.fillCircle(sx, cy, 14);

          const rot = o.rotation || 0;
          this.obstGfx.fillStyle(0xFF4444, 1);
          for (let a = 0; a < 8; a++) {
            const angle = rot + (a / 8) * Math.PI * 2;
            this.obstGfx.fillRect(
              sx + Math.cos(angle) * 12 - 3,
              cy + Math.sin(angle) * 12 - 3, 6, 6
            );
          }
          this.obstGfx.fillStyle(0x111111, 1);
          this.obstGfx.fillCircle(sx, cy, 4);
        } else if (o.type === 'fireball') {
          this.obstGfx.fillStyle(0xFF4500, 0.85);
          this.obstGfx.fillCircle(sx, o.y, 10);
          this.obstGfx.fillStyle(0xFFDD00, 0.95);
          this.obstGfx.fillCircle(sx, o.y, 6);
          this.obstGfx.fillStyle(0xFFFFFF, 0.8);
          this.obstGfx.fillCircle(sx - 1, o.y - 1, 3);
        }
      }

      // Layer 7: Coins
      this.coinGfx.clear();
      for (const c of this.coins) {
        if (c.collected) continue;
        const sx = c.x - camX;
        if (sx < -20 || sx > this.W + 20) continue;

        const bob = Math.sin(time * 0.004 + c.x * 0.01) * 3;
        this.coinGfx.fillStyle(0xFFC93C, 1);
        this.coinGfx.fillCircle(sx, c.y + bob, 7);
        this.coinGfx.fillStyle(0xFFE082, 1);
        this.coinGfx.fillCircle(sx - 1.5, c.y + bob - 1.5, 3.5);
      }

      // Layer 8: Power-ups
      for (const pu of this.powerups) {
        if (pu.collected) continue;
        const sx = pu.x - camX;
        if (sx < -30 || sx > this.W + 30) continue;
        const bob = Math.sin(time * 0.003 + pu.bobPhase) * 5;
        const py = pu.y + bob;

        let color = 0x00E5FF;
        if (pu.type === 'shield') color = 0x00E5FF;
        else if (pu.type === 'magnet') color = 0xE040FB;
        else if (pu.type === 'doubleCoins') color = 0xFFC93C;
        else if (pu.type === 'speedBoost') color = 0x4CAF50;

        this.coinGfx.fillStyle(color, 0.25);
        this.coinGfx.fillCircle(sx, py, 18);
        this.coinGfx.fillStyle(color, 0.9);
        this.coinGfx.fillCircle(sx, py, 12);
        this.coinGfx.fillStyle(0xffffff, 0.7);
        this.coinGfx.fillCircle(sx - 2, py - 2, 4);
      }
    }

    drawPlayer(time) {
      this.playerGfx.clear();
      const p = this.player;
      if (p.isDead) return;

      const camX = this.cameras.main.scrollX;
      const sx = p.worldX - camX;
      const sy = p.worldY;

      const scaleX = p.squashX;
      const scaleY = p.squashY;
      const drawH = p.isSliding ? 12 : p.height;

      const skinColor = 0xFFD5B8;
      const hairColor = 0x3A2518;
      const shirtColor = 0x3E6BFF;
      const pantsColor = 0x2D3748;
      const shoeColor = 0x1A1A2E;

      const w = p.width * scaleX;
      const h = drawH * scaleY;
      const baseX = sx - w / 2;
      const baseY = sy - h;

      if (p.isSliding) {
        this.playerGfx.fillStyle(shirtColor, 1);
        this.playerGfx.fillRect(baseX, baseY + h * 0.1, w * 1.6, h * 0.6);
        this.playerGfx.fillStyle(skinColor, 1);
        this.playerGfx.fillRect(baseX + w * 1.3, baseY, w * 0.45, h * 0.5);
        this.playerGfx.fillStyle(pantsColor, 1);
        this.playerGfx.fillRect(baseX - w * 0.1, baseY + h * 0.3, w * 0.5, h * 0.6);
      } else {
        this.playerGfx.fillStyle(skinColor, 1);
        this.playerGfx.fillRect(baseX + w * 0.1, baseY, w * 0.8, h * 0.3);

        this.playerGfx.fillStyle(hairColor, 1);
        this.playerGfx.fillRect(baseX + w * 0.05, baseY - h * 0.05, w * 0.9, h * 0.1);

        this.playerGfx.fillStyle(0xFFFFFF, 1);
        this.playerGfx.fillRect(baseX + w * 0.5, baseY + h * 0.1, w * 0.2, h * 0.08);
        this.playerGfx.fillStyle(0x111111, 1);
        this.playerGfx.fillRect(baseX + w * 0.58, baseY + h * 0.1, w * 0.1, h * 0.08);

        this.playerGfx.fillStyle(shirtColor, 1);
        this.playerGfx.fillRect(baseX + w * 0.1, baseY + h * 0.3, w * 0.8, h * 0.35);

        this.playerGfx.fillStyle(pantsColor, 1);
        this.playerGfx.fillRect(baseX + w * 0.1, baseY + h * 0.63, w * 0.8, h * 0.15);

        const frame = p.onGround ? p.animFrame : -1;
        if (frame === 0) {
          this.playerGfx.fillStyle(pantsColor, 1);
          this.playerGfx.fillRect(baseX + w * 0.5, baseY + h * 0.75, w * 0.35, h * 0.17);
          this.playerGfx.fillRect(baseX + w * 0.15, baseY + h * 0.75, w * 0.3, h * 0.12);
          this.playerGfx.fillStyle(shoeColor, 1);
          this.playerGfx.fillRect(baseX + w * 0.5, baseY + h * 0.9, w * 0.4, h * 0.1);
          this.playerGfx.fillRect(baseX + w * 0.1, baseY + h * 0.86, w * 0.35, h * 0.08);
        } else if (frame === 1) {
          this.playerGfx.fillStyle(pantsColor, 1);
          this.playerGfx.fillRect(baseX + w * 0.15, baseY + h * 0.75, w * 0.35, h * 0.17);
          this.playerGfx.fillRect(baseX + w * 0.55, baseY + h * 0.75, w * 0.3, h * 0.12);
          this.playerGfx.fillStyle(shoeColor, 1);
          this.playerGfx.fillRect(baseX + w * 0.15, baseY + h * 0.9, w * 0.4, h * 0.1);
          this.playerGfx.fillRect(baseX + w * 0.55, baseY + h * 0.86, w * 0.35, h * 0.08);
        } else {
          this.playerGfx.fillStyle(pantsColor, 1);
          this.playerGfx.fillRect(baseX + w * 0.2, baseY + h * 0.75, w * 0.6, h * 0.15);
          this.playerGfx.fillStyle(shoeColor, 1);
          this.playerGfx.fillRect(baseX + w * 0.2, baseY + h * 0.88, w * 0.6, h * 0.12);
        }
      }

      if (this.shield) {
        this.playerGfx.lineStyle(2.5, 0x00E5FF, 0.75 + Math.sin(time * 0.006) * 0.25);
        this.playerGfx.strokeCircle(sx, sy - drawH / 2, drawH * 0.8);
      }

      if (this.speedBoost) {
        for (let i = 1; i <= 3; i++) {
          this.playerGfx.fillStyle(0x4CAF50, 0.3 / i);
          this.playerGfx.fillRect(sx - w / 2 - i * 8, sy - drawH * 0.3, w * 0.5, drawH * 0.5);
        }
      }
    }
  }

  const config = {
    type: Phaser.AUTO,
    parent: container,
    width: container.clientWidth || 480,
    height: container.clientHeight || 720,
    backgroundColor: '#050515',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: RunnerScene
  };

  gameInstance = new Phaser.Game(config);
}

export function destroyGame() {
  if (gameInstance) {
    try { gameInstance.destroy(true); } catch (e) {}
    gameInstance = null;
  }
}
