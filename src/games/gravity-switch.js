// ─── Gravity Switch Game Engine (HTML5 Canvas - White Theme) ───
import { reportRun } from '../core/runReport.js';

let animId = null;
let containerRef = null;
let canvasRef = null;
let cleanupFn = null;

export function initGame(container) {
  containerRef = container;
  container.innerHTML = '';

  const canvas = document.createElement('canvas');
  canvasRef = canvas;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  canvas.style.background = '#ffffff';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  // Game Constants & State
  const TOP_MARGIN = 70;
  const BOTTOM_MARGIN = 70;

  let gameState = 'START'; // START, PLAYING, GAMEOVER
  let score = 0;
  let highscore = parseInt(localStorage.getItem('gravity_switch_highscore') || '0', 10);
  let frame = 0;
  let speed = 6;
  let combo = 0;

  // Player
  const player = {
    x: 180,
    y: 0,
    size: 28,
    gravity: 1, // 1 = down (floor), -1 = up (ceiling)
    vy: 0,
    targetY: 0,
    isFlipping: false,
    color: '#4F46E5', // Vibrant indigo player
    trail: []
  };

  function resize() {
    canvas.width = container.clientWidth || 800;
    canvas.height = container.clientHeight || 600;
    if (player) {
      player.x = Math.floor(Math.min(260, canvas.width * 0.32));
    }
  }
  resize();

  window.addEventListener('resize', resize);

  function getFloorY() {
    return canvas.height - BOTTOM_MARGIN - player.size;
  }

  function getCeilingY() {
    return TOP_MARGIN;
  }

  player.y = getFloorY();

  let obstacles = [];
  let coins = [];
  let particles = [];
  let floatingTexts = [];

  // Input Listeners
  function handleInput(e) {
    if (e && e.type === 'keydown' && e.code !== 'Space' && e.code !== 'ArrowUp' && e.code !== 'KeyW') {
      return;
    }
    if (e) {
      e.preventDefault();
    }

    if (gameState === 'START') {
      gameState = 'PLAYING';
      resetGame();
    } else if (gameState === 'PLAYING') {
      flipGravity();
    } else if (gameState === 'GAMEOVER') {
      gameState = 'PLAYING';
      resetGame();
    }
  }

  function flipGravity() {
    player.gravity *= -1;
    player.isFlipping = true;
    
    // Add flip impulse particles
    for (let i = 0; i < 8; i++) {
      particles.push({
        x: player.x + player.size / 2,
        y: player.y + player.size / 2,
        vx: (Math.random() - 0.5) * 6,
        vy: -player.gravity * (Math.random() * 4 + 2),
        size: Math.random() * 4 + 2,
        color: '#EC4899',
        life: 20
      });
    }
  }


  // ── Meta-progression bridge ──
  let runStart = performance.now();
  let runCoins = 0;
  let runBestCombo = 0;
  let runBanked = false;

  function bankRun() {
    if (runBanked) return;
    runBanked = true;
    reportRun(containerRef, 'gravity-switch', {
      score,
      coins: runCoins,
      combo: runBestCombo,
      duration: (performance.now() - runStart) / 1000,
    });
  }

  function resetGame() {
    runStart = performance.now();
    runCoins = 0;
    runBestCombo = 0;
    runBanked = false;
    score = 0;
    frame = 0;
    speed = 6.5;
    combo = 0;
    player.gravity = 1;
    player.y = getFloorY();
    player.vy = 0;
    player.trail = [];
    obstacles = [];
    coins = [];
    particles = [];
    floatingTexts = [];
  }

  window.addEventListener('keydown', handleInput);
  canvas.addEventListener('pointerdown', handleInput);

  cleanupFn = () => {
    window.removeEventListener('resize', resize);
    window.removeEventListener('keydown', handleInput);
    if (canvas) canvas.removeEventListener('pointerdown', handleInput);
  };

  // Helper particle spawn
  function spawnExplosion(x, y, color, count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const spd = Math.random() * 5 + 2;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: Math.random() * 5 + 3,
        color,
        life: 30
      });
    }
  }

  function addFloatingText(text, x, y, color = '#D97706') {
    floatingTexts.push({
      text,
      x,
      y,
      vy: -1.5,
      alpha: 1,
      color
    });
  }

  // ── Main Game Loop ──
  function loop() {
    animId = requestAnimationFrame(loop);

    // Clear background — Crisp White Light Theme
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#ffffff');
    bgGrad.addColorStop(0.5, '#f8fafc');
    bgGrad.addColorStop(1, '#f1f5f9');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background subtle grid lines
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.12)';
    ctx.lineWidth = 1;
    const gridOffset = (frame * (speed * 0.5)) % 40;
    for (let x = -gridOffset; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, TOP_MARGIN);
      ctx.lineTo(x, canvas.height - BOTTOM_MARGIN);
      ctx.stroke();
    }

    // Draw track ceiling and floor boundaries
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(79, 70, 229, 0.3)';
    ctx.strokeStyle = '#4F46E5';
    ctx.lineWidth = 4;

    // Ceiling
    ctx.beginPath();
    ctx.moveTo(0, TOP_MARGIN);
    ctx.lineTo(canvas.width, TOP_MARGIN);
    ctx.stroke();

    // Floor
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - BOTTOM_MARGIN);
    ctx.lineTo(canvas.width, canvas.height - BOTTOM_MARGIN);
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Track accents (margin areas)
    ctx.fillStyle = 'rgba(99, 102, 241, 0.06)';
    ctx.fillRect(0, 0, canvas.width, TOP_MARGIN);
    ctx.fillRect(0, canvas.height - BOTTOM_MARGIN, canvas.width, BOTTOM_MARGIN);

    if (gameState === 'PLAYING') {
      frame++;
      score += 1;
      speed = 6.5 + Math.floor(score / 500) * 0.5;

      // Update Player Physics
      const floorY = getFloorY();
      const ceilY = getCeilingY();

      const gravAcc = player.gravity * 1.8;
      player.vy += gravAcc;
      player.y += player.vy;

      if (player.y >= floorY) {
        player.y = floorY;
        player.vy = 0;
        player.isFlipping = false;
      } else if (player.y <= ceilY) {
        player.y = ceilY;
        player.vy = 0;
        player.isFlipping = false;
      }

      // Add Trail
      if (frame % 2 === 0) {
        player.trail.push({
          x: player.x,
          y: player.y,
          alpha: 0.6
        });
      }
      player.trail.forEach((t) => (t.alpha -= 0.04));
      player.trail = player.trail.filter((t) => t.alpha > 0);

      // Spawn Obstacles
      if (frame % Math.max(45, 90 - Math.floor(score / 300) * 5) === 0) {
        const type = Math.random() > 0.5 ? 'floor_spike' : 'ceiling_spike';
        if (type === 'floor_spike') {
          obstacles.push({
            x: canvas.width + 40,
            y: canvas.height - BOTTOM_MARGIN,
            width: 32,
            height: 38,
            type: 'floor_spike'
          });
        } else {
          obstacles.push({
            x: canvas.width + 40,
            y: TOP_MARGIN,
            width: 32,
            height: 38,
            type: 'ceiling_spike'
          });
        }
      }

      // Spawn Coins
      if (frame % 70 === 0 && Math.random() > 0.3) {
        const coinY = Math.random() > 0.5 ? TOP_MARGIN + 30 : canvas.height - BOTTOM_MARGIN - 40;
        coins.push({
          x: canvas.width + 30,
          y: coinY,
          radius: 12,
          collected: false
        });
      }

      // Update Obstacles & Collision Check
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= speed;

        // Collision logic with player AABB
        let obsY1, obsY2;
        if (obs.type === 'floor_spike') {
          obsY1 = obs.y - obs.height;
          obsY2 = obs.y;
        } else {
          obsY1 = obs.y;
          obsY2 = obs.y + obs.height;
        }

        const px1 = player.x + 4;
        const px2 = player.x + player.size - 4;
        const py1 = player.y + 4;
        const py2 = player.y + player.size - 4;

        const ox1 = obs.x;
        const ox2 = obs.x + obs.width;

        if (px2 > ox1 && px1 < ox2 && py2 > obsY1 && py1 < obsY2) {
          // Player hit obstacle -> Game Over!
          gameState = 'GAMEOVER';
          spawnExplosion(player.x + player.size / 2, player.y + player.size / 2, '#EF4444', 30);
          if (score > highscore) {
            highscore = score;
            localStorage.setItem('gravity_switch_highscore', highscore.toString());
          }
          bankRun();
        }

        if (obs.x < -60) {
          obstacles.splice(i, 1);
        }
      }

      // Update Coins
      for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        coin.x -= speed;

        // Collect check
        const dist = Math.hypot(player.x + player.size / 2 - coin.x, player.y + player.size / 2 - coin.y);
        if (dist < coin.radius + player.size / 2) {
          combo++;
          runCoins++;
          runBestCombo = Math.max(runBestCombo, combo);
          const bonus = 50 * combo;
          score += bonus;
          spawnExplosion(coin.x, coin.y, '#F59E0B', 12);
          addFloatingText(`+${bonus}`, coin.x, coin.y, '#D97706');
          coins.splice(i, 1);
          continue;
        }

        if (coin.x < -40) {
          coins.splice(i, 1);
        }
      }
    }

    // ── Render Game Objects ──

    // Draw Trail
    player.trail.forEach((t) => {
      ctx.fillStyle = `rgba(79, 70, 229, ${t.alpha * 0.35})`;
      ctx.fillRect(t.x, t.y, player.size, player.size);
    });

    // Draw Obstacles
    obstacles.forEach((obs) => {
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(239, 68, 68, 0.4)';
      ctx.fillStyle = '#EF4444';

      ctx.beginPath();
      if (obs.type === 'floor_spike') {
        ctx.moveTo(obs.x, obs.y);
        ctx.lineTo(obs.x + obs.width / 2, obs.y - obs.height);
        ctx.lineTo(obs.x + obs.width, obs.y);
      } else {
        ctx.moveTo(obs.x, obs.y);
        ctx.lineTo(obs.x + obs.width / 2, obs.y + obs.height);
        ctx.lineTo(obs.x + obs.width, obs.y);
      }
      ctx.closePath();
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Draw Coins
    coins.forEach((coin) => {
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, coin.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Draw Player
    if (gameState !== 'GAMEOVER' || Math.floor(frame / 6) % 2 === 0) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(79, 70, 229, 0.5)';
      ctx.fillStyle = player.color;
      ctx.fillRect(player.x, player.y, player.size, player.size);

      // Player inner core
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(player.x + 6, player.y + 6, player.size - 12, player.size - 12);
      ctx.shadowBlur = 0;
    }

    // Render & Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, p.size * (p.life / 30)), 0, Math.PI * 2);
      ctx.fill();

      if (p.life <= 0) particles.splice(i, 1);
    }

    // Render & Update Floating Texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.02;

      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();

      if (ft.alpha <= 0) floatingTexts.splice(i, 1);
    }

    // HUD Header
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillStyle = '#0F172A';
    ctx.fillText(`SCORE: ${score}`, 20, 42);

    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText(`HIGH: ${highscore}`, canvas.width - 150, 42);

    // ── Overlays ──
    if (gameState === 'START') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.textAlign = 'center';
      ctx.shadowBlur = 12;
      ctx.shadowColor = 'rgba(79, 70, 229, 0.3)';
      ctx.font = '900 42px Inter, sans-serif';
      ctx.fillStyle = '#4F46E5';
      ctx.fillText('GRAVITY SWITCH', canvas.width / 2, canvas.height / 2 - 40);

      ctx.shadowBlur = 0;
      ctx.font = '600 18px Inter, sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText('Click, Tap, or Press SPACE to Invert Gravity', canvas.width / 2, canvas.height / 2 + 10);

      ctx.fillStyle = '#D97706';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.fillText('⚡ TAP OR PRESS SPACE TO START ⚡', canvas.width / 2, canvas.height / 2 + 60);

      ctx.textAlign = 'left';
    } else if (gameState === 'GAMEOVER') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.textAlign = 'center';
      ctx.shadowBlur = 12;
      ctx.shadowColor = 'rgba(239, 68, 68, 0.3)';
      ctx.font = '900 44px Inter, sans-serif';
      ctx.fillStyle = '#EF4444';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);

      ctx.shadowBlur = 0;
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.fillStyle = '#0F172A';
      ctx.fillText(`FINAL SCORE: ${score}`, canvas.width / 2, canvas.height / 2);

      ctx.font = '500 18px Inter, sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText(`BEST SCORE: ${highscore}`, canvas.width / 2, canvas.height / 2 + 35);

      ctx.fillStyle = '#4F46E5';
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.fillText('🔄 TAP OR PRESS SPACE TO PLAY AGAIN', canvas.width / 2, canvas.height / 2 + 85);

      ctx.textAlign = 'left';
    }
  }

  loop();
}

export function destroyGame() {
  if (animId) {
    cancelAnimationFrame(animId);
    animId = null;
  }
  if (cleanupFn) {
    cleanupFn();
    cleanupFn = null;
  }
  if (containerRef) {
    containerRef.innerHTML = '';
    containerRef = null;
  }
  canvasRef = null;
}
