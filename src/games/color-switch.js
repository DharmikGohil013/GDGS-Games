// ─── Color Switch — Deluxe Arcade Engine ───
import Phaser from 'phaser';

let gameInstance = null;

// Game Color Palette (4 Vibrant Neon Arcade Colors)
const COLORS = [
  { name: 'Blue', hex: 0x3E6BFF, str: '#3E6BFF' },   // Index 0 (Right, ~0 rad)
  { name: 'Yellow', hex: 0xFFC93C, str: '#FFC93C' }, // Index 1 (Bottom, ~PI/2 rad)
  { name: 'Pink', hex: 0xFF3366, str: '#FF3366' },   // Index 2 (Left, ~PI rad)
  { name: 'Purple', hex: 0x8B5CF6, str: '#8B5CF6' }  // Index 3 (Top, ~3PI/2 rad)
];

// Distance from point (px, py) to line segment (x1, y1)->(x2, y2)
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

// Helper to get segment color index at world angle (in radians)
function getSegmentIndexAtAngle(rotation, targetAngleRad) {
  let rel = (targetAngleRad - rotation + Math.PI / 4) % (Math.PI * 2);
  if (rel < 0) rel += Math.PI * 2;
  return Math.floor(rel / (Math.PI / 2)) % 4;
}

// Advanced Web Audio Synthesizer
class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playJump() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(620, this.ctx.currentTime + 0.11);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.11);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.11);
    } catch (e) {}
  }

  playStar() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime + i * 0.06);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + i * 0.06 + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.06);
        osc.stop(this.ctx.currentTime + i * 0.06 + 0.15);
      });
    } catch (e) {}
  }

  playSwitch() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const freqs = [400, 600, 800, 1050];
      freqs.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime + i * 0.035);
        gain.gain.setValueAtTime(0.16, this.ctx.currentTime + i * 0.035);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + i * 0.035 + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.035);
        osc.stop(this.ctx.currentTime + i * 0.035 + 0.08);
      });
    } catch (e) {}
  }

  playPowerup() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const freqs = [350, 450, 600, 750, 900];
      freqs.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime + i * 0.04);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + i * 0.04 + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.04);
        osc.stop(this.ctx.currentTime + i * 0.04 + 0.12);
      });
    } catch (e) {}
  }

  playShieldBreak() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {}
  }

  playGameOver() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);
    } catch (e) {}
  }
}

const sfx = new SoundFX();

export function initGame(container) {
  destroyGame();

  class ColorSwitchScene extends Phaser.Scene {
    constructor() {
      super('ColorSwitchScene');
    }

    create() {
      this.width = this.sys.game.config.width;
      this.height = this.sys.game.config.height;

      this.gameState = 'START'; // 'START', 'PLAYING', 'PAUSED', 'GAMEOVER'
      this.mode = localStorage.getItem('color_switch_mode') || 'CASUAL'; // 'CASUAL', 'NORMAL', 'PRO'
      this.score = 0;
      this.highScore = parseInt(localStorage.getItem(`color_switch_highscore_${this.mode}`) || '0', 10);
      this.comboCount = 0;

      // Mode configuration settings
      this.modeConfigs = {
        CASUAL: {
          rotSpeedBase: 0.007,
          rotSpeedMax: 0.016,
          spacing: 420,
          gravity: 820,
          jump: -355,
          tolerance: 0.32,
          initialShield: true,
          multiplier: 1
        },
        NORMAL: {
          rotSpeedBase: 0.012,
          rotSpeedMax: 0.024,
          spacing: 380,
          gravity: 880,
          jump: -365,
          tolerance: 0.26,
          initialShield: false,
          multiplier: 1
        },
        PRO: {
          rotSpeedBase: 0.018,
          rotSpeedMax: 0.035,
          spacing: 350,
          gravity: 920,
          jump: -375,
          tolerance: 0.20,
          initialShield: false,
          multiplier: 2
        }
      };

      const cfg = this.modeConfigs[this.mode];

      // Camera setup
      this.cameras.main.setBackgroundColor('#0b0c10');

      // Particles array
      this.particles = [];
      this.floatingTexts = [];

      // Starfield background
      this.createStarfield();

      // Power-up States
      this.shieldActive = cfg.initialShield;
      this.slowMoActive = false;
      this.slowMoTimer = 0;
      this.rainbowActive = false;
      this.rainbowTimer = 0;

      // World Groups
      this.obstacles = [];
      this.items = []; // stars, changers, shields, slow-mos, rainbows

      // Player Ball
      this.ballRadius = 9.5;
      this.ballColorIndex = 0; // Starts Blue
      this.startFloorY = this.height - 160;
      this.ballY = this.startFloorY;
      this.ballVy = 0;
      this.hasClimbed = false;

      this.ballGraphics = this.add.graphics();
      this.drawBall();

      // Spawn Initial Level Obstacles
      this.nextObstacleY = this.height - 400;
      this.spawnInitialObstacles();

      // UI Containers
      this.createUI();

      // Controls & Listeners
      this.input.on('pointerdown', (pointer) => {
        // Prevent pointer click on UI buttons from triggering jump
        if (pointer.y < 90 && this.gameState === 'START') return;
        this.handleJump();
      });

      this.input.keyboard.on('keydown-SPACE', (event) => {
        if (event) event.preventDefault();
        this.handleJump();
      });

      this.input.keyboard.on('keydown-UP', (event) => {
        if (event) event.preventDefault();
        this.handleJump();
      });

      this.input.keyboard.on('keydown-R', () => {
        this.restartGame();
      });
    }

    createStarfield() {
      for (let i = 0; i < 55; i++) {
        const x = Phaser.Math.Between(0, this.width);
        const y = Phaser.Math.Between(-4000, this.height);
        const radius = Phaser.Math.FloatBetween(1, 2.5);
        const alpha = Phaser.Math.FloatBetween(0.25, 0.75);
        const star = this.add.circle(x, y, radius, 0xffffff, alpha);
        star.setScrollFactor(0.2);
      }
    }

    drawBall() {
      this.ballGraphics.clear();
      this.ballGraphics.setDepth(40);

      const cx = this.width / 2;
      const cy = this.ballY;

      // Rainbow Wild Mode
      if (this.rainbowActive) {
        const rainbowHex = COLORS[Math.floor(Date.now() / 80) % 4].hex;
        this.ballGraphics.fillStyle(rainbowHex, 0.5);
        this.ballGraphics.fillCircle(cx, cy, this.ballRadius + 7);
        this.ballGraphics.fillStyle(0xffffff, 1);
        this.ballGraphics.fillCircle(cx, cy, this.ballRadius);
        return;
      }

      const color = COLORS[this.ballColorIndex].hex;

      // Shield Aura
      if (this.shieldActive) {
        this.ballGraphics.lineStyle(3, 0x00E5FF, 0.9);
        this.ballGraphics.strokeCircle(cx, cy, this.ballRadius + 7);
        this.ballGraphics.fillStyle(0x00E5FF, 0.2);
        this.ballGraphics.fillCircle(cx, cy, this.ballRadius + 7);
      }

      // Outer Glow
      this.ballGraphics.fillStyle(color, 0.35);
      this.ballGraphics.fillCircle(cx, cy, this.ballRadius + 5);

      // Core Ball
      this.ballGraphics.fillStyle(color, 1);
      this.ballGraphics.fillCircle(cx, cy, this.ballRadius);

      // Center Highlight
      this.ballGraphics.fillStyle(0xffffff, 0.85);
      this.ballGraphics.fillCircle(cx - 2.5, cy - 2.5, 2.5);
    }

    spawnInitialObstacles() {
      for (let i = 0; i < 5; i++) {
        this.spawnObstacle();
      }
    }

    spawnObstacle() {
      const cfg = this.modeConfigs[this.mode];
      const types = ['circle', 'square', 'cross', 'doubleCircle', 'diamond'];
      const type = types[Math.floor(Math.random() * types.length)];
      const y = this.nextObstacleY;

      const progress = Math.min(this.score / 25, 1);
      const curSpeed = cfg.rotSpeedBase + (cfg.rotSpeedMax - cfg.rotSpeedBase) * progress;
      const rotationSpeed = curSpeed * (Math.random() > 0.5 ? 1 : -1);

      const obstacle = {
        type,
        y,
        rotation: 0,
        rotationSpeed,
        radius: 95,
        graphics: this.add.graphics(),
        passedSegments: {},
        passedBottom: false,
        passedTop: false,
        passedInnerBottom: false,
        passedInnerTop: false
      };

      this.obstacles.push(obstacle);

      // 1. Star inside center of obstacle
      this.items.push({
        type: 'STAR',
        y,
        rotation: 0,
        collected: false,
        graphics: this.add.graphics()
      });

      // 2. Item between obstacles (Changer OR Power-up)
      const itemY = y - (cfg.spacing / 2);
      const randVal = Math.random();

      let itemType = 'CHANGER';
      if (randVal < 0.18) itemType = 'SHIELD';
      else if (randVal < 0.32) itemType = 'SLOWMO';
      else if (randVal < 0.44) itemType = 'RAINBOW';

      this.items.push({
        type: itemType,
        y: itemY,
        rotation: 0,
        collected: false,
        graphics: this.add.graphics()
      });

      this.nextObstacleY -= cfg.spacing;
    }

    createUI() {
      // Live Score HUD
      this.scoreText = this.add.text(24, 24, '0', {
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '44px',
        fontStyle: 'bold',
        color: '#FFFFFF'
      }).setScrollFactor(0).setDepth(100);

      this.highScoreText = this.add.text(this.width - 24, 24, `BEST: ${this.highScore}`, {
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '16px',
        color: 'rgba(255,255,255,0.7)'
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);

      // Active Power-up Status Bar
      this.statusText = this.add.text(this.width / 2, 32, '', {
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#00E5FF'
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);

      // Start Screen Overlay
      this.startContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(200);

      const titleBg = this.add.rectangle(this.width / 2, this.height / 2, this.width, this.height, 0x000000, 0.45);

      const logoText = this.add.text(this.width / 2, this.height / 2 - 120, 'COLOR SWITCH', {
        fontFamily: "'Bungee', sans-serif",
        fontSize: '36px',
        color: '#FF5F4D'
      }).setOrigin(0.5);

      // Mode Selector Pills
      const modeLabel = this.add.text(this.width / 2, this.height / 2 - 40, 'SELECT DIFFICULTY', {
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '13px',
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.6)'
      }).setOrigin(0.5);

      const modes = ['CASUAL', 'NORMAL', 'PRO'];
      const modeBtns = [];

      modes.forEach((m, idx) => {
        const x = this.width / 2 + (idx - 1) * 105;
        const y = this.height / 2;

        const isSelected = this.mode === m;
        const btnBg = this.add.rectangle(x, y, 95, 36, isSelected ? 0xFF5F4D : 0x16171D, 1);
        btnBg.setStrokeStyle(1.5, isSelected ? 0xFF5F4D : 0x444444);
        btnBg.setInteractive({ useHandCursor: true });

        const btnTxt = this.add.text(x, y, m, {
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '13px',
          fontWeight: 'bold',
          color: isSelected ? '#FFFFFF' : '#888888'
        }).setOrigin(0.5);

        btnBg.on('pointerdown', (pointer, localX, localY, event) => {
          if (event) event.stopPropagation();
          this.mode = m;
          localStorage.setItem('color_switch_mode', m);
          this.highScore = parseInt(localStorage.getItem(`color_switch_highscore_${this.mode}`) || '0', 10);
          this.highScoreText.setText(`BEST: ${this.highScore}`);

          // Update Button UI
          modeBtns.forEach(({ bg, txt, modeKey }) => {
            const sel = modeKey === m;
            bg.setFillStyle(sel ? 0xFF5F4D : 0x16171D);
            bg.setStrokeStyle(1.5, sel ? 0xFF5F4D : 0x444444);
            txt.setColor(sel ? '#FFFFFF' : '#888888');
          });

          // Update initial shield state
          this.shieldActive = this.modeConfigs[this.mode].initialShield;
          this.drawBall();
        });

        modeBtns.push({ bg: btnBg, txt: btnTxt, modeKey: m });
      });

      const tapText = this.add.text(this.width / 2, this.height / 2 + 75, 'TAP OR PRESS SPACE TO START', {
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#FFFFFF'
      }).setOrigin(0.5);

      this.tweens.add({
        targets: tapText,
        alpha: 0.3,
        duration: 800,
        yoyo: true,
        repeat: -1
      });

      this.startContainer.add([titleBg, logoText, modeLabel, ...modeBtns.flatMap(b => [b.bg, b.txt]), tapText]);

      // Game Over Overlay
      this.gameOverContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(300).setVisible(false);

      const goBg = this.add.rectangle(this.width / 2, this.height / 2, this.width, this.height, 0x0b0c10, 0.85);
      goBg.setInteractive({ useHandCursor: true });
      goBg.on('pointerdown', () => this.restartGame());

      const goCard = this.add.rectangle(this.width / 2, this.height / 2, Math.min(this.width - 40, 360), 320, 0x16171D, 1);
      goCard.setStrokeStyle(2, 0xff5f4d);

      const goTitle = this.add.text(this.width / 2, this.height / 2 - 110, 'GAME OVER', {
        fontFamily: "'Bungee', sans-serif",
        fontSize: '30px',
        color: '#FF5F4D'
      }).setOrigin(0.5);

      this.finalScoreText = this.add.text(this.width / 2, this.height / 2 - 40, 'SCORE: 0', {
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#FFFFFF'
      }).setOrigin(0.5);

      this.bestScoreText = this.add.text(this.width / 2, this.height / 2 + 5, 'BEST: 0', {
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '18px',
        color: '#FFC93C'
      }).setOrigin(0.5);

      const replayBtn = this.add.rectangle(this.width / 2, this.height / 2 + 75, 220, 52, 0xff5f4d, 1);
      replayBtn.setInteractive({ useHandCursor: true });

      const replayText = this.add.text(this.width / 2, this.height / 2 + 75, 'PLAY AGAIN (R)', {
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#FFFFFF'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      const doRestart = (pointer, localX, localY, event) => {
        if (event) event.stopPropagation();
        this.restartGame();
      };

      replayBtn.on('pointerdown', doRestart);
      replayText.on('pointerdown', doRestart);

      this.gameOverContainer.add([goBg, goCard, goTitle, this.finalScoreText, this.bestScoreText, replayBtn, replayText]);
    }

    handleJump() {
      if (this.gameState === 'GAMEOVER') {
        this.restartGame();
        return;
      }

      if (this.gameState === 'START') {
        this.gameState = 'PLAYING';
        this.startContainer.setVisible(false);
      }

      const cfg = this.modeConfigs[this.mode];
      this.ballVy = cfg.jump;
      sfx.playJump();
      this.spawnJumpParticles();
    }

    spawnJumpParticles() {
      const color = COLORS[this.ballColorIndex].hex;
      for (let i = 0; i < 5; i++) {
        this.particles.push({
          x: this.width / 2 + Phaser.Math.Between(-6, 6),
          y: this.ballY + 8,
          vx: Phaser.Math.FloatBetween(-25, 25),
          vy: Phaser.Math.FloatBetween(40, 90),
          radius: Phaser.Math.FloatBetween(2, 3.5),
          alpha: 1,
          color
        });
      }
    }

    spawnBurst(x, y, colorHex, count = 25) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Phaser.Math.FloatBetween(60, 240);
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Phaser.Math.FloatBetween(3, 5),
          alpha: 1,
          color: colorHex || COLORS[Math.floor(Math.random() * 4)].hex
        });
      }
    }

    spawnFloatingText(x, y, text, color = '#FFC93C') {
      const textEl = this.add.text(x, y, text, {
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '22px',
        fontStyle: 'bold',
        color: color
      }).setOrigin(0.5).setDepth(150);

      this.tweens.add({
        targets: textEl,
        y: y - 50,
        alpha: 0,
        duration: 900,
        onComplete: () => textEl.destroy()
      });
    }

    update(time, delta) {
      const dt = Math.min(delta / 1000, 0.05);

      // Update Timers & Powerup Status
      this.updatePowerupTimers(dt);

      // Update Particles
      this.updateParticles(dt);

      // Rotate & Render Obstacles
      const rotSpeedFactor = this.slowMoActive ? 0.35 : 1.0;
      this.obstacles.forEach((obs) => {
        obs.rotation += obs.rotationSpeed * rotSpeedFactor;
        this.drawObstacle(obs);
      });

      // Render Items
      this.items.forEach((item) => {
        item.rotation += 0.03;
        this.drawItem(item);
      });

      // Render Ball
      this.drawBall();

      // Idle Bounce Animation at Start Screen
      if (this.gameState === 'START') {
        this.startBounceTime = (this.startBounceTime || 0) + dt * 4.5;
        this.ballY = this.startFloorY + Math.sin(this.startBounceTime) * 12;
        return;
      }

      if (this.gameState !== 'PLAYING') return;

      const cfg = this.modeConfigs[this.mode];

      // Ball Physics
      this.ballVy += cfg.gravity * dt;
      this.ballY += this.ballVy * dt;

      // Starting Floor Safety: Floor is 100% active until player climbs into level
      if (!this.hasClimbed) {
        if (this.ballY >= this.startFloorY) {
          this.ballY = this.startFloorY;
          this.ballVy = 0;
        }

        if (this.ballY < this.height - 320) {
          this.hasClimbed = true;
        }
      }

      // Smooth Camera Tracking (only active after climbing)
      if (this.hasClimbed) {
        const targetCamY = this.ballY - this.height * 0.6;
        if (targetCamY < this.cameras.main.scrollY) {
          this.cameras.main.scrollY += (targetCamY - this.cameras.main.scrollY) * 0.15;
        }

        // Check Bottom Screen Fall Death
        if (this.ballY > this.cameras.main.scrollY + this.height + 60) {
          this.triggerGameOver();
          return;
        }
      }

      // Check Obstacle Collisions
      this.obstacles.forEach((obs) => {
        this.checkObstacleCollision(obs);
      });

      // Check Item Collisions
      this.items.forEach((item) => {
        this.checkItemCollision(item);
      });

      // Infinite Obstacle Spawner
      if (this.nextObstacleY > this.cameras.main.scrollY - 650) {
        this.spawnObstacle();
      }
    }

    updatePowerupTimers(dt) {
      let statusStr = '';

      if (this.slowMoActive) {
        this.slowMoTimer -= dt;
        if (this.slowMoTimer <= 0) {
          this.slowMoActive = false;
        } else {
          statusStr += `⏱️ SLOW-MO: ${Math.ceil(this.slowMoTimer)}s  `;
        }
      }

      if (this.rainbowActive) {
        this.rainbowTimer -= dt;
        if (this.rainbowTimer <= 0) {
          this.rainbowActive = false;
        } else {
          statusStr += `🌈 RAINBOW: ${Math.ceil(this.rainbowTimer)}s  `;
        }
      }

      if (this.shieldActive && !statusStr) {
        statusStr = '🛡️ SHIELD ACTIVE';
      }

      this.statusText.setText(statusStr);
    }

    updateParticles(dt) {
      const g = this.add.graphics();
      g.setDepth(50);
      g.clear();

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha -= 1.6 * dt;

        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
        } else {
          g.fillStyle(p.color, p.alpha);
          g.fillCircle(p.x, p.y, p.radius);
        }
      }
    }

    drawObstacle(obs) {
      const g = obs.graphics;
      g.clear();
      g.setDepth(10);

      const cx = this.width / 2;
      const cy = obs.y;
      const r = obs.radius;
      const thickness = 14;

      if (obs.type === 'circle') {
        for (let i = 0; i < 4; i++) {
          const startAngle = obs.rotation + (i * Math.PI) / 2 - Math.PI / 4;
          const endAngle = startAngle + Math.PI / 2;

          g.lineStyle(thickness, COLORS[i].hex, 1);
          g.beginPath();
          g.arc(cx, cy, r, startAngle, endAngle);
          g.strokePath();
        }
      } else if (obs.type === 'square') {
        const half = r * 0.85;
        const unrotatedCorners = [
          { x: half, y: -half }, // Corner 0
          { x: half, y: half },  // Corner 1
          { x: -half, y: half }, // Corner 2
          { x: -half, y: -half } // Corner 3
        ];

        const corners = unrotatedCorners.map(p => ({
          x: cx + p.x * Math.cos(obs.rotation) - p.y * Math.sin(obs.rotation),
          y: cy + p.x * Math.sin(obs.rotation) + p.y * Math.cos(obs.rotation)
        }));

        for (let i = 0; i < 4; i++) {
          const p1 = corners[i];
          const p2 = corners[(i + 1) % 4];

          g.lineStyle(thickness, COLORS[i].hex, 1);
          g.lineBetween(p1.x, p1.y, p2.x, p2.y);
        }
      } else if (obs.type === 'cross') {
        const armLength = r * 0.95;
        for (let i = 0; i < 4; i++) {
          const angle = obs.rotation + (i * Math.PI) / 2;
          const ex = cx + Math.cos(angle) * armLength;
          const ey = cy + Math.sin(angle) * armLength;

          g.lineStyle(thickness, COLORS[i].hex, 1);
          g.lineBetween(cx, cy, ex, ey);
        }
      } else if (obs.type === 'doubleCircle') {
        // Outer Ring
        for (let i = 0; i < 4; i++) {
          const startAngle = obs.rotation + (i * Math.PI) / 2 - Math.PI / 4;
          const endAngle = startAngle + Math.PI / 2;
          g.lineStyle(12, COLORS[i].hex, 1);
          g.beginPath();
          g.arc(cx, cy, r, startAngle, endAngle);
          g.strokePath();
        }
        // Inner Ring
        const innerRot = -obs.rotation * 1.1;
        for (let i = 0; i < 4; i++) {
          const startAngle = innerRot + (i * Math.PI) / 2 - Math.PI / 4;
          const endAngle = startAngle + Math.PI / 2;
          g.lineStyle(10, COLORS[i].hex, 1);
          g.beginPath();
          g.arc(cx, cy, r * 0.65, startAngle, endAngle);
          g.strokePath();
        }
      } else if (obs.type === 'diamond') {
        const size = r * 0.85;
        const unrotatedVertices = [
          { x: size, y: 0 },
          { x: 0, y: size },
          { x: -size, y: 0 },
          { x: 0, y: -size }
        ];

        const vertices = unrotatedVertices.map(p => ({
          x: cx + p.x * Math.cos(obs.rotation) - p.y * Math.sin(obs.rotation),
          y: cy + p.x * Math.sin(obs.rotation) + p.y * Math.cos(obs.rotation)
        }));

        for (let i = 0; i < 4; i++) {
          const p1 = vertices[i];
          const p2 = vertices[(i + 1) % 4];

          g.lineStyle(thickness, COLORS[i].hex, 1);
          g.lineBetween(p1.x, p1.y, p2.x, p2.y);
        }
      }
    }

    drawItem(item) {
      if (item.collected) return;

      const g = item.graphics;
      g.clear();
      g.setDepth(15);

      const cx = this.width / 2;
      const cy = item.y;

      if (item.type === 'STAR') {
        const points = 5;
        const outerR = 14;
        const innerR = 6;

        g.fillStyle(0xFFC93C, 1);
        g.lineStyle(1.5, 0xffffff, 0.9);
        g.beginPath();

        for (let i = 0; i < points * 2; i++) {
          const r = i % 2 === 0 ? outerR : innerR;
          const angle = item.rotation + (i * Math.PI) / points - Math.PI / 2;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          if (i === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
        g.closePath();
        g.fillPath();
        g.strokePath();
      } else if (item.type === 'CHANGER') {
        const radius = 16;
        for (let i = 0; i < 4; i++) {
          const startAngle = item.rotation + (i * Math.PI) / 2;
          const endAngle = startAngle + Math.PI / 2;

          g.fillStyle(COLORS[i].hex, 1);
          g.beginPath();
          g.moveTo(cx, cy);
          g.arc(cx, cy, radius, startAngle, endAngle);
          g.closePath();
          g.fillPath();
        }
        g.lineStyle(2, 0xffffff, 0.9);
        g.strokeCircle(cx, cy, radius);
      } else if (item.type === 'SHIELD') {
        g.fillStyle(0x00E5FF, 0.85);
        g.fillCircle(cx, cy, 14);
        g.lineStyle(2, 0xffffff, 1);
        g.strokeCircle(cx, cy, 14);

        // Inner Shield Cross Icon
        g.lineStyle(2.5, 0xffffff, 1);
        g.lineBetween(cx - 5, cy, cx + 5, cy);
        g.lineBetween(cx, cy - 5, cx, cy + 5);
      } else if (item.type === 'SLOWMO') {
        g.fillStyle(0x8B5CF6, 0.85);
        g.fillCircle(cx, cy, 14);
        g.lineStyle(2, 0xffffff, 1);
        g.strokeCircle(cx, cy, 14);

        // Clock Hands
        g.lineStyle(2, 0xffffff, 1);
        g.lineBetween(cx, cy, cx, cy - 6);
        g.lineBetween(cx, cy, cx + 5, cy);
      } else if (item.type === 'RAINBOW') {
        const radius = 14;
        const color = COLORS[Math.floor(Date.now() / 120) % 4].hex;
        g.fillStyle(color, 0.9);
        g.fillCircle(cx, cy, radius);
        g.lineStyle(2.5, 0xffffff, 1);
        g.strokeCircle(cx, cy, radius);
      }
    }

    checkObstacleCollision(obs) {
      if (this.rainbowActive) return; // Rainbow Wild Mode passes all obstacles!

      const cx = this.width / 2;
      const cy = obs.y;
      const ballY = this.ballY;
      const ballR = this.ballRadius;
      const r = obs.radius;
      const thickness = 14;
      const hitRadius = thickness / 2 + ballR - 2.5; // ~12px

      const cfg = this.modeConfigs[this.mode];
      const tol = cfg.tolerance; // Mode angular tolerance

      // Helper to check angular match with safety margin
      const checkMatchAngle = (rot, targetAngle) => {
        const segCenter = getSegmentIndexAtAngle(rot, targetAngle);
        if (segCenter === this.ballColorIndex) return true;
        const segPlus = getSegmentIndexAtAngle(rot, targetAngle + tol);
        if (segPlus === this.ballColorIndex) return true;
        const segMinus = getSegmentIndexAtAngle(rot, targetAngle - tol);
        if (segMinus === this.ballColorIndex) return true;
        return false;
      };

      const handleHitMismatch = () => {
        if (this.shieldActive) {
          // Shield saves the player!
          this.shieldActive = false;
          sfx.playShieldBreak();
          this.cameras.main.shake(140, 0.015);
          this.spawnBurst(cx, ballY, 0x00E5FF, 30);
          this.spawnFloatingText(cx, ballY - 20, 'SHIELD POPPED!', '#00E5FF');
          return true; // Saved
        } else {
          this.triggerGameOver();
          return false;
        }
      };

      if (obs.type === 'circle' || obs.type === 'doubleCircle') {
        // Bottom Arc Collision (6 o'clock = Math.PI / 2)
        const distBottom = Math.abs(ballY - (cy + r));
        if (distBottom < hitRadius) {
          if (!obs.passedBottom) {
            if (checkMatchAngle(obs.rotation, Math.PI / 2)) {
              obs.passedBottom = true;
            } else {
              if (handleHitMismatch()) obs.passedBottom = true;
              return;
            }
          }
        }

        // Top Arc Collision (12 o'clock = 3 * Math.PI / 2)
        const distTop = Math.abs(ballY - (cy - r));
        if (distTop < hitRadius) {
          if (!obs.passedTop) {
            if (checkMatchAngle(obs.rotation, (3 * Math.PI) / 2)) {
              obs.passedTop = true;
            } else {
              if (handleHitMismatch()) obs.passedTop = true;
              return;
            }
          }
        }

        // Inner Ring Collision for Double Circle
        if (obs.type === 'doubleCircle') {
          const innerR = r * 0.65;
          const innerRot = -obs.rotation * 1.1;

          const innerDistBottom = Math.abs(ballY - (cy + innerR));
          if (innerDistBottom < hitRadius) {
            if (!obs.passedInnerBottom) {
              if (checkMatchAngle(innerRot, Math.PI / 2)) {
                obs.passedInnerBottom = true;
              } else {
                if (handleHitMismatch()) obs.passedInnerBottom = true;
                return;
              }
            }
          }

          const innerDistTop = Math.abs(ballY - (cy - innerR));
          if (innerDistTop < hitRadius) {
            if (!obs.passedInnerTop) {
              if (checkMatchAngle(innerRot, (3 * Math.PI) / 2)) {
                obs.passedInnerTop = true;
              } else {
                if (handleHitMismatch()) obs.passedInnerTop = true;
                return;
              }
            }
          }
        }
      } else if (obs.type === 'square') {
        const half = r * 0.85;
        const unrotatedCorners = [
          { x: half, y: -half },
          { x: half, y: half },
          { x: -half, y: half },
          { x: -half, y: -half }
        ];

        const corners = unrotatedCorners.map(p => ({
          x: cx + p.x * Math.cos(obs.rotation) - p.y * Math.sin(obs.rotation),
          y: cy + p.x * Math.sin(obs.rotation) + p.y * Math.cos(obs.rotation)
        }));

        for (let i = 0; i < 4; i++) {
          const p1 = corners[i];
          const p2 = corners[(i + 1) % 4];
          const d = distToSegment(cx, ballY, p1.x, p1.y, p2.x, p2.y);

          if (d < hitRadius) {
            if (i === this.ballColorIndex) {
              obs.passedSegments[i] = true;
            } else if (!obs.passedSegments[i]) {
              if (handleHitMismatch()) obs.passedSegments[i] = true;
              return;
            }
          }
        }
      } else if (obs.type === 'diamond') {
        const size = r * 0.85;
        const unrotatedVertices = [
          { x: size, y: 0 },
          { x: 0, y: size },
          { x: -size, y: 0 },
          { x: 0, y: -size }
        ];

        const vertices = unrotatedVertices.map(p => ({
          x: cx + p.x * Math.cos(obs.rotation) - p.y * Math.sin(obs.rotation),
          y: cy + p.x * Math.sin(obs.rotation) + p.y * Math.cos(obs.rotation)
        }));

        for (let i = 0; i < 4; i++) {
          const p1 = vertices[i];
          const p2 = vertices[(i + 1) % 4];
          const d = distToSegment(cx, ballY, p1.x, p1.y, p2.x, p2.y);

          if (d < hitRadius) {
            if (i === this.ballColorIndex) {
              obs.passedSegments[i] = true;
            } else if (!obs.passedSegments[i]) {
              if (handleHitMismatch()) obs.passedSegments[i] = true;
              return;
            }
          }
        }
      } else if (obs.type === 'cross') {
        const armLength = r * 0.95;
        for (let i = 0; i < 4; i++) {
          const angle = obs.rotation + (i * Math.PI) / 2;
          const ex = cx + Math.cos(angle) * armLength;
          const ey = cy + Math.sin(angle) * armLength;
          const d = distToSegment(cx, ballY, cx, cy, ex, ey);

          if (d < hitRadius) {
            if (i === this.ballColorIndex) {
              obs.passedSegments[i] = true;
            } else if (!obs.passedSegments[i]) {
              if (handleHitMismatch()) obs.passedSegments[i] = true;
              return;
            }
          }
        }
      }
    }

    checkItemCollision(item) {
      if (item.collected) return;

      const dist = Math.abs(this.ballY - item.y);
      if (dist < 28) {
        item.collected = true;
        item.graphics.clear();

        const cfg = this.modeConfigs[this.mode];

        if (item.type === 'STAR') {
          this.comboCount++;
          const mult = cfg.multiplier;
          const addedScore = 1 * mult;
          this.score += addedScore;
          this.scoreText.setText(`${this.score}`);

          if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreText.setText(`BEST: ${this.highScore}`);
            localStorage.setItem(`color_switch_highscore_${this.mode}`, this.highScore.toString());
          }

          sfx.playStar();
          this.spawnBurst(this.width / 2, item.y, 0xFFC93C, 20);

          if (this.comboCount >= 3) {
            this.spawnFloatingText(this.width / 2, item.y - 15, `${this.comboCount}X COMBO! 🔥`, '#FF5F4D');
          } else {
            this.spawnFloatingText(this.width / 2, item.y - 15, `+${addedScore}`, '#FFC93C');
          }
        } else if (item.type === 'CHANGER') {
          let newColorIdx = (this.ballColorIndex + Phaser.Math.Between(1, 3)) % 4;
          this.ballColorIndex = newColorIdx;

          sfx.playSwitch();
          this.cameras.main.shake(100, 0.01);
          this.spawnBurst(this.width / 2, item.y, COLORS[newColorIdx].hex, 25);
        } else if (item.type === 'SHIELD') {
          this.shieldActive = true;
          sfx.playPowerup();
          this.spawnBurst(this.width / 2, item.y, 0x00E5FF, 25);
          this.spawnFloatingText(this.width / 2, item.y - 15, 'SHIELD UP! 🛡️', '#00E5FF');
        } else if (item.type === 'SLOWMO') {
          this.slowMoActive = true;
          this.slowMoTimer = 6.0;
          sfx.playPowerup();
          this.spawnBurst(this.width / 2, item.y, 0x8B5CF6, 25);
          this.spawnFloatingText(this.width / 2, item.y - 15, 'SLOW-MO! ⏱️', '#8B5CF6');
        } else if (item.type === 'RAINBOW') {
          this.rainbowActive = true;
          this.rainbowTimer = 5.0;
          sfx.playPowerup();
          this.spawnBurst(this.width / 2, item.y, 0xFF3366, 30);
          this.spawnFloatingText(this.width / 2, item.y - 15, 'RAINBOW WILD! 🌈', '#FF3366');
        }
      }
    }

    triggerGameOver() {
      if (this.gameState === 'GAMEOVER') return;

      this.gameState = 'GAMEOVER';
      this.comboCount = 0;
      sfx.playGameOver();

      this.cameras.main.shake(250, 0.025);
      this.spawnBurst(this.width / 2, this.ballY, COLORS[this.ballColorIndex].hex, 35);

      this.ballGraphics.clear();

      this.finalScoreText.setText(`SCORE: ${this.score}`);
      this.bestScoreText.setText(`BEST: ${this.highScore}`);
      this.gameOverContainer.setVisible(true);
    }

    restartGame() {
      this.scene.restart();
    }
  }

  const config = {
    type: Phaser.AUTO,
    parent: container,
    width: container.clientWidth || 480,
    height: container.clientHeight || 720,
    backgroundColor: '#0b0c10',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: ColorSwitchScene
  };

  gameInstance = new Phaser.Game(config);
}

export function destroyGame() {
  if (gameInstance) {
    try {
      gameInstance.destroy(true);
    } catch (e) {}
    gameInstance = null;
  }
}
