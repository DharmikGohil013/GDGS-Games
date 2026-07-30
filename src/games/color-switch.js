// ─── Color Switch — Premium Phaser 3 Game ───
import Phaser from 'phaser';

let gameInstance = null;

// Game Color Palette (4 Neon Arcade Colors)
const COLORS = [
  { name: 'Blue', hex: 0x3E6BFF, str: '#3E6BFF' },
  { name: 'Yellow', hex: 0xFFC93C, str: '#FFC93C' },
  { name: 'Pink', hex: 0xFF3366, str: '#FF3366' },
  { name: 'Purple', hex: 0x8B5CF6, str: '#8B5CF6' }
];

// Helper to get segment index at target angle (in radians)
function getSegmentIndexAtAngle(rotation, targetAngleRad) {
  let rel = (targetAngleRad - rotation + Math.PI / 4) % (Math.PI * 2);
  if (rel < 0) rel += Math.PI * 2;
  return Math.floor(rel / (Math.PI / 2)) % 4;
}

// Audio Synthesizer (Web Audio API)
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
      osc.frequency.exponentialRampToValueAtTime(620, this.ctx.currentTime + 0.12);
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
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
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

      // Particles array
      this.particles = [];

      // Starfield background
      this.createStarfield();

      // World Group for obstacles & color changers
      this.obstacles = [];
      this.colorChangers = [];

      // Spawn Initial Player Ball
      this.ballRadius = 9;
      this.ballColorIndex = 0; // Starts Blue
      this.startFloorY = this.height - 160;
      this.ballY = this.startFloorY;
      this.ballVy = 0;
      this.gravity = 900;
      this.jumpImpulse = -370;
      this.hasClimbed = false;

      this.ballGraphics = this.add.graphics();
      this.drawBall();

      // Spawn initial level obstacles
      this.nextObstacleY = this.height - 440;
      this.spawnInitialObstacles();

      // UI Containers
      this.createUI();

      // Controls
      this.input.on('pointerdown', () => this.handleJump());
      this.input.keyboard.on('keydown-SPACE', (event) => {
        if (event && typeof event.preventDefault === 'function') event.preventDefault();
        if (event && event.originalEvent && typeof event.originalEvent.preventDefault === 'function') {
          event.originalEvent.preventDefault();
        }
        this.handleJump();
      });
    }

    createStarfield() {
      for (let i = 0; i < 45; i++) {
        const x = Phaser.Math.Between(0, this.width);
        const y = Phaser.Math.Between(-3000, this.height);
        const radius = Phaser.Math.FloatBetween(1, 2.5);
        const alpha = Phaser.Math.FloatBetween(0.25, 0.75);
        const star = this.add.circle(x, y, radius, 0xffffff, alpha);
        star.setScrollFactor(0.2);
      }
    }

    drawBall() {
      this.ballGraphics.clear();
      this.ballGraphics.setDepth(40);
      const color = COLORS[this.ballColorIndex].hex;

      // Outer Glow
      this.ballGraphics.fillStyle(color, 0.35);
      this.ballGraphics.fillCircle(this.width / 2, this.ballY, this.ballRadius + 4);

      // Core Ball
      this.ballGraphics.fillStyle(color, 1);
      this.ballGraphics.fillCircle(this.width / 2, this.ballY, this.ballRadius);

      // Center Highlight
      this.ballGraphics.fillStyle(0xffffff, 0.75);
      this.ballGraphics.fillCircle(this.width / 2 - 2, this.ballY - 2, 2.5);
    }

    spawnInitialObstacles() {
      for (let i = 0; i < 5; i++) {
        this.spawnObstacle();
      }
    }

    spawnObstacle() {
      const types = ['circle', 'square', 'cross', 'doubleCircle', 'diamond'];
      const type = types[Math.floor(Math.random() * types.length)];
      const y = this.nextObstacleY;
      const speedMult = 1 + Math.min(this.score * 0.03, 0.8);
      const rotationSpeed = (0.018 * speedMult) * (Math.random() > 0.5 ? 1 : -1);

      const obstacle = {
        type,
        y,
        rotation: 0,
        rotationSpeed,
        radius: 95,
        graphics: this.add.graphics(),
        hitBottom: false,
        hitTop: false
      };

      this.obstacles.push(obstacle);

      // Spawn Color Changer item between obstacles
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
      // Live Score HUD
      this.scoreText = this.add.text(24, 24, '0', {
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '38px',
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

      const titleBg = this.add.rectangle(this.width / 2, this.height / 2, this.width, this.height, 0x000000, 0.45);

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

      this.tweens.add({
        targets: tapText,
        alpha: 0.3,
        duration: 800,
        yoyo: true,
        repeat: -1
      });

      this.startContainer.add([titleBg, logoText, tapText]);

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

      const replayText = this.add.text(this.width / 2, this.height / 2 + 75, 'PLAY AGAIN', {
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

      replayBtn.on('pointerover', () => replayBtn.setFillStyle(0xd6432f));
      replayBtn.on('pointerout', () => replayBtn.setFillStyle(0xff5f4d));
      replayText.on('pointerover', () => replayBtn.setFillStyle(0xd6432f));
      replayText.on('pointerout', () => replayBtn.setFillStyle(0xff5f4d));

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

      this.ballVy = this.jumpImpulse;
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

    update(time, delta) {
      const dt = delta / 1000;

      // Update Particles
      this.updateParticles(dt);

      // Rotate & Render Obstacles
      this.obstacles.forEach((obs) => {
        obs.rotation += obs.rotationSpeed;
        this.drawObstacle(obs);
      });

      // Render Color Changers
      this.colorChangers.forEach((changer) => {
        changer.rotation += 0.025;
        this.drawColorChanger(changer);
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

      // Ball Physics
      this.ballVy += this.gravity * dt;
      this.ballY += this.ballVy * dt;

      // Starting Floor Safety: Floor is 100% active until player climbs into the level
      if (!this.hasClimbed) {
        if (this.ballY >= this.startFloorY) {
          this.ballY = this.startFloorY;
          this.ballVy = 0;
        }

        // Unlock camera tracking only after climbing into first obstacle
        if (this.ballY < this.height - 340) {
          this.hasClimbed = true;
        }
      }

      // Smooth Camera Tracking (only active after climbing)
      if (this.hasClimbed) {
        const targetCamY = this.ballY - this.height * 0.6;
        if (targetCamY < this.cameras.main.scrollY) {
          this.cameras.main.scrollY += (targetCamY - this.cameras.main.scrollY) * 0.14;
        }

        // Check Bottom Screen Fall Death (only active after climbing)
        if (this.ballY > this.cameras.main.scrollY + this.height + 60) {
          this.triggerGameOver();
          return;
        }
      }

      // Check Obstacle Collisions
      this.obstacles.forEach((obs) => {
        this.checkObstacleCollision(obs);
      });

      // Check Color Changer Collisions
      this.colorChangers.forEach((changer) => {
        this.checkColorChangerCollision(changer);
      });

      // Infinite Obstacle Spawner
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
        const corners = [
          { x: -half, y: -half },
          { x: half, y: -half },
          { x: half, y: half },
          { x: -half, y: half }
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
      } else if (obs.type === 'cross') {
        const armLength = r * 0.95;
        for (let i = 0; i < 4; i++) {
          const angle = obs.rotation + (i * Math.PI) / 2 - Math.PI / 4;
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
        // Inner Ring (rotates opposite direction)
        for (let i = 0; i < 4; i++) {
          const startAngle = -obs.rotation * 1.25 + (i * Math.PI) / 2 - Math.PI / 4;
          const endAngle = startAngle + Math.PI / 2;
          g.lineStyle(10, COLORS[(i + 2) % 4].hex, 1);
          g.beginPath();
          g.arc(cx, cy, r * 0.65, startAngle, endAngle);
          g.strokePath();
        }
      } else if (obs.type === 'diamond') {
        const size = r * 0.95;
        const corners = [
          { x: 0, y: -size },
          { x: size * 0.85, y: 0 },
          { x: 0, y: size },
          { x: -size * 0.85, y: 0 }
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

      g.lineStyle(2, 0xffffff, 0.9);
      g.strokeCircle(cx, cy, radius);
    }

    checkObstacleCollision(obs) {
      const cy = obs.y;
      const ballY = this.ballY;
      const r = obs.radius;
      const thickness = 14;
      const tolerance = thickness / 2 + this.ballRadius - 5;

      // Check if color matches at angle with small safety margin
      const checkMatch = (rot, targetAngle) => {
        const segMain = getSegmentIndexAtAngle(rot, targetAngle);
        if (segMain === this.ballColorIndex) return true;
        const segPlus = getSegmentIndexAtAngle(rot, targetAngle + 0.18);
        if (segPlus === this.ballColorIndex) return true;
        const segMinus = getSegmentIndexAtAngle(rot, targetAngle - 0.18);
        if (segMinus === this.ballColorIndex) return true;
        return false;
      };

      // Bottom Arc Collision (6 o'clock = Math.PI / 2)
      const distBottom = Math.abs(ballY - (cy + r));
      if (distBottom < tolerance) {
        if (!checkMatch(obs.rotation, Math.PI / 2)) {
          this.triggerGameOver();
          return;
        }
      }

      // Top Arc Collision (12 o'clock = 3 * Math.PI / 2)
      const distTop = Math.abs(ballY - (cy - r));
      if (distTop < tolerance) {
        if (!checkMatch(obs.rotation, (3 * Math.PI) / 2)) {
          this.triggerGameOver();
          return;
        }
      }

      // Inner Ring Collision for Double Circle
      if (obs.type === 'doubleCircle') {
        const innerR = r * 0.65;
        const innerRot = -obs.rotation * 1.25;

        const innerDistBottom = Math.abs(ballY - (cy + innerR));
        if (innerDistBottom < tolerance) {
          const segIdx = (getSegmentIndexAtAngle(innerRot, Math.PI / 2) + 2) % 4;
          if (segIdx !== this.ballColorIndex) {
            this.triggerGameOver();
            return;
          }
        }

        const innerDistTop = Math.abs(ballY - (cy - innerR));
        if (innerDistTop < tolerance) {
          const segIdx = (getSegmentIndexAtAngle(innerRot, (3 * Math.PI) / 2) + 2) % 4;
          if (segIdx !== this.ballColorIndex) {
            this.triggerGameOver();
            return;
          }
        }
      }
    }

    checkColorChangerCollision(changer) {
      if (changer.collected) return;

      const dist = Math.abs(this.ballY - changer.y);
      if (dist < 26) {
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

        // Sound + Particle + Shake Effects
        sfx.playSwitch();
        this.cameras.main.shake(120, 0.012);
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
