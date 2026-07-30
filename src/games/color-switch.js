// ─── Color Switch — Premium Phaser 3 Game ───
import Phaser from 'phaser';

let gameInstance = null;

// Game Color Palette
const COLORS = [
  { name: 'Blue', hex: 0x3E6BFF, str: '#3E6BFF' },
  { name: 'Yellow', hex: 0xFFC93C, str: '#FFC93C' },
  { name: 'Pink', hex: 0xFF3366, str: '#FF3366' },
  { name: 'Purple', hex: 0x8B5CF6, str: '#8B5CF6' }
];

// Audio Synthesizer (Web Audio API - no external assets required)
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
      osc.frequency.setValueAtTime(250, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {}
  }

  playSwitch() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const freqs = [400, 600, 800, 1000];
      freqs.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime + i * 0.04);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + i * 0.04 + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.04);
        osc.stop(this.ctx.currentTime + i * 0.04 + 0.1);
      });
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
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
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

      this.gameState = 'START'; // 'START', 'PLAYING', 'GAMEOVER'
      this.score = 0;
      this.highScore = parseInt(localStorage.getItem('color_switch_highscore') || '0', 10);

      // Camera setup
      this.cameras.main.setBackgroundColor('#0b0c10');
      this.minCameraY = 0;

      // Particle emitter container
      this.particles = [];

      // Create Stars Background
      this.createStarfield();

      // World Group for obstacles & collectibles
      this.obstacles = [];
      this.colorChangers = [];

      // Spawn Initial Player Ball
      this.ballRadius = 14;
      this.ballColorIndex = 0;
      this.ballY = this.height - 180;
      this.ballVy = 0;
      this.gravity = 950;
      this.jumpImpulse = -380;

      this.ballGraphics = this.add.graphics();
      this.drawBall();

      // Ball Trail
      this.trailHistory = [];

      // Spawn initial level obstacles
      this.nextObstacleY = this.height - 450;
      this.spawnInitialObstacles();

      // UI Containers
      this.createUI();

      // Controls
      this.input.on('pointerdown', () => this.handleJump());
      this.input.keyboard.on('keydown-SPACE', () => this.handleJump());
    }

    createStarfield() {
      this.bgParticles = [];
      for (let i = 0; i < 40; i++) {
        const x = Phaser.Math.Between(0, this.width);
        const y = Phaser.Math.Between(-2000, this.height);
        const radius = Phaser.Math.FloatBetween(1, 2.5);
        const alpha = Phaser.Math.FloatBetween(0.2, 0.7);
        const star = this.add.circle(x, y, radius, 0xffffff, alpha);
        star.setScrollFactor(0.2); // parallax effect
        this.bgParticles.push(star);
      }
    }

    drawBall() {
      this.ballGraphics.clear();
      const color = COLORS[this.ballColorIndex].hex;

      // Outer Glow
      this.ballGraphics.fillStyle(color, 0.3);
      this.ballGraphics.fillCircle(this.width / 2, this.ballY, this.ballRadius + 6);

      // Core Ball
      this.ballGraphics.fillStyle(color, 1);
      this.ballGraphics.fillCircle(this.width / 2, this.ballY, this.ballRadius);

      // Center Highlight
      this.ballGraphics.fillStyle(0xffffff, 0.6);
      this.ballGraphics.fillCircle(this.width / 2 - 3, this.ballY - 3, 4);
    }

    spawnInitialObstacles() {
      for (let i = 0; i < 5; i++) {
        this.spawnObstacle();
      }
    }

    spawnObstacle() {
      const types = ['circle', 'cross', 'square', 'doubleCircle', 'diamond'];
      const type = types[Math.floor(Math.random() * types.length)];
      const y = this.nextObstacleY;
      const rotationSpeed = (0.015 + Math.min(this.score * 0.001, 0.025)) * (Math.random() > 0.5 ? 1 : -1);

      const obstacle = {
        type,
        y,
        rotation: 0,
        rotationSpeed,
        radius: 95,
        graphics: this.add.graphics(),
        cleared: false
      };

      this.obstacles.push(obstacle);

      // Spawn Color Changer above obstacle
      const changerY = y - 180;
      this.colorChangers.push({
        y: changerY,
        rotation: 0,
        collected: false,
        graphics: this.add.graphics()
      });

      this.nextObstacleY -= 360;
    }

    createUI() {
      // In-Game Score HUD
      this.scoreText = this.add.text(24, 24, '0', {
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '36px',
        fontStyle: 'bold',
        color: '#FFFFFF'
      }).setScrollFactor(0).setDepth(100);

      this.highScoreText = this.add.text(this.width - 24, 24, `BEST: ${this.highScore}`, {
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '16px',
        color: 'rgba(255,255,255,0.6)'
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);

      // Start Screen Overlay
      this.startContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(200);

      const titleBg = this.add.rectangle(this.width / 2, this.height / 2, this.width, this.height, 0x000000, 0.5);

      const logoText = this.add.text(this.width / 2, this.height / 2 - 80, 'COLOR SWITCH', {
        fontFamily: "'Bungee', sans-serif",
        fontSize: '36px',
        color: '#FF5F4D'
      }).setOrigin(0.5);

      const tapText = this.add.text(this.width / 2, this.height / 2 + 20, 'TAP OR PRESS SPACE TO JUMP', {
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#FFFFFF'
      }).setOrigin(0.5);

      // Pulsing tap text animation
      this.tweens.add({
        targets: tapText,
        alpha: 0.3,
        duration: 800,
        yoyo: true,
        repeat: -1
      });

      this.startContainer.add([titleBg, logoText, tapText]);

      // Game Over Overlay (Hidden initially)
      this.gameOverContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(300).setVisible(false);

      const goBg = this.add.rectangle(this.width / 2, this.height / 2, this.width, this.height, 0x0b0c10, 0.85);

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

      const replayBtn = this.add.rectangle(this.width / 2, this.height / 2 + 75, 200, 48, 0xff5f4d, 1);
      replayBtn.setInteractive({ useHandCursor: true });

      const replayText = this.add.text(this.width / 2, this.height / 2 + 75, 'PLAY AGAIN', {
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#FFFFFF'
      }).setOrigin(0.5);

      replayBtn.on('pointerdown', () => this.restartGame());

      this.gameOverContainer.add([goBg, goCard, goTitle, this.finalScoreText, this.bestScoreText, replayBtn, replayText]);
    }

    handleJump() {
      if (this.gameState === 'GAMEOVER') return;

      if (this.gameState === 'START') {
        this.gameState = 'PLAYING';
        this.startContainer.setVisible(false);
      }

      this.ballVy = this.jumpImpulse;
      sfx.playJump();

      // Particle jump burst
      this.spawnJumpParticles();
    }

    spawnJumpParticles() {
      const color = COLORS[this.ballColorIndex].hex;
      for (let i = 0; i < 6; i++) {
        this.particles.push({
          x: this.width / 2 + Phaser.Math.Between(-8, 8),
          y: this.ballY + 10,
          vx: Phaser.Math.FloatBetween(-30, 30),
          vy: Phaser.Math.FloatBetween(40, 100),
          radius: Phaser.Math.FloatBetween(2, 4),
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
          radius: Phaser.Math.FloatBetween(3, 6),
          alpha: 1,
          color: colorHex || COLORS[Math.floor(Math.random() * 4)].hex
        });
      }
    }

    update(time, delta) {
      const dt = delta / 1000;

      // Update Particles
      this.updateParticles(dt);

      if (this.gameState !== 'PLAYING') return;

      // Ball Physics
      this.ballVy += this.gravity * dt;
      this.ballY += this.ballVy * dt;

      // Camera Follows Ball Upward
      const targetCamY = this.ballY - this.height * 0.65;
      if (targetCamY < this.cameras.main.scrollY) {
        this.cameras.main.scrollY += (targetCamY - this.cameras.main.scrollY) * 0.1;
      }

      // Check Bottom Screen Death
      if (this.ballY > this.cameras.main.scrollY + this.height + 50) {
        this.triggerGameOver();
        return;
      }

      // Draw Ball
      this.drawBall();

      // Render & Check Obstacles
      this.obstacles.forEach((obs) => {
        obs.rotation += obs.rotationSpeed;
        this.drawObstacle(obs);
        this.checkObstacleCollision(obs);
      });

      // Render & Check Color Changers
      this.colorChangers.forEach((changer) => {
        changer.rotation += 0.02;
        this.drawColorChanger(changer);
        this.checkColorChangerCollision(changer);
      });

      // Spawn more obstacles if needed
      if (this.nextObstacleY > this.cameras.main.scrollY - 600) {
        this.spawnObstacle();
      }
    }

    updateParticles(dt) {
      const g = this.add.graphics();
      g.setDepth(50);
      g.clear();

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha -= 1.5 * dt;

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
          const startAngle = obs.rotation + (i * Math.PI) / 2;
          const endAngle = startAngle + Math.PI / 2;

          g.lineStyle(thickness, COLORS[i].hex, 1);
          g.beginPath();
          g.arc(cx, cy, r, startAngle, endAngle);
          g.strokePath();
        }
      } else if (obs.type === 'square') {
        const half = r * 0.85;
        const corners = [
          { x: -half, y: -half },
          { x: half, y: -half },
          { x: half, y: half },
          { x: -half, y: half }
        ];

        for (let i = 0; i < 4; i++) {
          const p1 = corners[i];
          const p2 = corners[(i + 1) % 4];

          // Rotate corner points
          const rx1 = cx + p1.x * Math.cos(obs.rotation) - p1.y * Math.sin(obs.rotation);
          const ry1 = cy + p1.x * Math.sin(obs.rotation) + p1.y * Math.cos(obs.rotation);

          const rx2 = cx + p2.x * Math.cos(obs.rotation) - p2.y * Math.sin(obs.rotation);
          const ry2 = cy + p2.x * Math.sin(obs.rotation) + p2.y * Math.cos(obs.rotation);

          g.lineStyle(thickness, COLORS[i].hex, 1);
          g.lineBetween(rx1, ry1, rx2, ry2);
        }
      } else if (obs.type === 'cross') {
        const armLength = r * 0.9;
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
          const startAngle = obs.rotation + (i * Math.PI) / 2;
          const endAngle = startAngle + Math.PI / 2;
          g.lineStyle(12, COLORS[i].hex, 1);
          g.beginPath();
          g.arc(cx, cy, r, startAngle, endAngle);
          g.strokePath();
        }
        // Inner Ring (rotates opposite)
        for (let i = 0; i < 4; i++) {
          const startAngle = -obs.rotation * 1.2 + (i * Math.PI) / 2;
          const endAngle = startAngle + Math.PI / 2;
          g.lineStyle(10, COLORS[(i + 2) % 4].hex, 1);
          g.beginPath();
          g.arc(cx, cy, r * 0.65, startAngle, endAngle);
          g.strokePath();
        }
      } else if (obs.type === 'diamond') {
        const size = r * 0.9;
        const corners = [
          { x: 0, y: -size },
          { x: size * 0.8, y: 0 },
          { x: 0, y: size },
          { x: -size * 0.8, y: 0 }
        ];

        for (let i = 0; i < 4; i++) {
          const p1 = corners[i];
          const p2 = corners[(i + 1) % 4];

          const rx1 = cx + p1.x * Math.cos(obs.rotation) - p1.y * Math.sin(obs.rotation);
          const ry1 = cy + p1.x * Math.sin(obs.rotation) + p1.y * Math.cos(obs.rotation);

          const rx2 = cx + p2.x * Math.cos(obs.rotation) - p2.y * Math.sin(obs.rotation);
          const ry2 = cy + p2.x * Math.sin(obs.rotation) + p2.y * Math.cos(obs.rotation);

          g.lineStyle(thickness, COLORS[i].hex, 1);
          g.lineBetween(rx1, ry1, rx2, ry2);
        }
      }
    }

    drawColorChanger(changer) {
      if (changer.collected) return;

      const g = changer.graphics;
      g.clear();
      g.setDepth(15);

      const cx = this.width / 2;
      const cy = changer.y;
      const radius = 16;

      // Draw 4 colored quarters star
      for (let i = 0; i < 4; i++) {
        const startAngle = changer.rotation + (i * Math.PI) / 2;
        const endAngle = startAngle + Math.PI / 2;

        g.fillStyle(COLORS[i].hex, 1);
        g.beginPath();
        g.moveTo(cx, cy);
        g.arc(cx, cy, radius, startAngle, endAngle);
        g.closePath();
        g.fillPath();
      }

      g.lineStyle(2, 0xffffff, 0.8);
      g.strokeCircle(cx, cy, radius);
    }

    checkObstacleCollision(obs) {
      const cx = this.width / 2;
      const cy = obs.y;
      const ballY = this.ballY;
      const r = obs.radius;
      const thickness = 14;

      // Distance from ball to obstacle center
      const dist = Math.abs(ballY - cy);

      if (dist < r + thickness / 2 && dist > r - thickness / 2) {
        // Calculate angle of ball relative to obstacle center
        let angle = Math.atan2(ballY - cy, 0); // vertical collision
        if (angle < 0) angle += Math.PI * 2;

        // Determine segment color at this collision angle
        let relativeAngle = (angle - obs.rotation) % (Math.PI * 2);
        if (relativeAngle < 0) relativeAngle += Math.PI * 2;

        const segmentIndex = Math.floor(relativeAngle / (Math.PI / 2)) % 4;

        if (segmentIndex !== this.ballColorIndex) {
          this.triggerGameOver();
        }
      }
    }

    checkColorChangerCollision(changer) {
      if (changer.collected) return;

      const dist = Math.abs(this.ballY - changer.y);
      if (dist < 24) {
        changer.collected = true;
        changer.graphics.clear();

        // Increment Score
        this.score++;
        this.scoreText.setText(`${this.score}`);

        if (this.score > this.highScore) {
          this.highScore = this.score;
          this.highScoreText.setText(`BEST: ${this.highScore}`);
          localStorage.setItem('color_switch_highscore', this.highScore.toString());
        }

        // Change Ball Color to a new random color
        let newColorIdx = (this.ballColorIndex + Phaser.Math.Between(1, 3)) % 4;
        this.ballColorIndex = newColorIdx;

        // Effects
        sfx.playSwitch();
        this.cameras.main.shake(120, 0.01);
        this.spawnBurst(this.width / 2, changer.y, COLORS[newColorIdx].hex, 25);
      }
    }

    triggerGameOver() {
      if (this.gameState === 'GAMEOVER') return;

      this.gameState = 'GAMEOVER';
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
