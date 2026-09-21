// ─── City Sprint Game Engine (HTML5 Canvas - Light Theme & Perfect Controls) ───
import { reportRun } from '../core/runReport.js';

let animId = null;
let containerRef = null;
let canvasRef = null;
let controllerBtnRef = null;
let cleanupFn = null;

export function initGame(container) {
  containerRef = container;
  container.innerHTML = '';
  container.style.position = 'relative';

  const canvas = document.createElement('canvas');
  canvasRef = canvas;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  canvas.style.background = '#f8fafc';
  container.appendChild(canvas);

  // Dedicated On-screen Controller Button for Mobile & Desktop
  const controllerBtn = document.createElement('button');
  controllerBtnRef = controllerBtn;
  controllerBtn.className = 'city-sprint-jump-btn';
  controllerBtn.innerHTML = `
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"></line>
      <polyline points="5 12 12 5 19 12"></polyline>
    </svg>
    <span>JUMP</span>
  `;
  controllerBtn.setAttribute('aria-label', 'Jump Controller Button');
  
  // Inline styles for high-visibility controller button
  Object.assign(controllerBtn.style, {
    position: 'absolute',
    bottom: '24px',
    right: '24px',
    width: '84px',
    height: '84px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    color: '#ffffff',
    border: '3px solid #ffffff',
    boxShadow: '0 8px 24px rgba(59, 130, 246, 0.45)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '800',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    userSelect: 'none',
    touchAction: 'manipulation',
    zIndex: '100',
    transition: 'transform 0.1s ease, background 0.1s ease'
  });

  container.appendChild(controllerBtn);

  const ctx = canvas.getContext('2d');

  // Game Constants & State
  const GROUND_HEIGHT = 70;

  let gameState = 'START'; // START, PLAYING, GAMEOVER
  let score = 0;
  let highscore = parseInt(localStorage.getItem('city_sprint_highscore') || '0', 10);
  let frame = 0;
  let speed = 6.5;
  let combo = 0;

  // Player Character
  const player = {
    x: 200,
    y: 0,
    width: 36,
    height: 48,
    vy: 0,
    gravity: 0.9,
    jumpForce: -16,
    jumpsLeft: 2,
    maxJumps: 2,
    color: '#3B82F6',
    trail: []
  };

  function resize() {
    canvas.width = container.clientWidth || 800;
    canvas.height = container.clientHeight || 600;
    if (player) {
      player.x = Math.floor(Math.min(280, canvas.width * 0.35));
    }
  }
  resize();

  window.addEventListener('resize', resize);

  function getGroundY() {
    return canvas.height - GROUND_HEIGHT - player.height;
  }

  player.y = getGroundY();

  let obstacles = [];
  let coins = [];
  let particles = [];
  let floatingTexts = [];

  // City Skyline Background Buildings
  const buildings = [];
  function initBuildings() {
    buildings.length = 0;
    let bx = 0;
    while (bx < canvas.width + 200) {
      const bw = Math.floor(Math.random() * 60 + 50);
      const bh = Math.floor(Math.random() * 150 + 100);
      buildings.push({ x: bx, width: bw, height: bh, color: Math.random() > 0.5 ? '#CBD5E1' : '#E2E8F0' });
      bx += bw + 10;
    }
  }
  initBuildings();

  // Jump / Action Trigger
  function triggerAction(e) {
    if (e && e.type === 'keydown' && e.code !== 'Space' && e.code !== 'ArrowUp' && e.code !== 'KeyW') {
      return;
    }
    if (e && e.cancelable) {
      e.preventDefault();
    }

    if (gameState === 'START') {
      gameState = 'PLAYING';
      resetGame();
    } else if (gameState === 'PLAYING') {
      jump();
    } else if (gameState === 'GAMEOVER') {
      gameState = 'PLAYING';
      resetGame();
    }
  }

  function jump() {
    if (player.jumpsLeft > 0) {
      player.vy = player.jumpForce;
      player.jumpsLeft--;

      // Spawn Jump Dust Particles
      for (let i = 0; i < 10; i++) {
        particles.push({
          x: player.x + player.width / 2,
          y: player.y + player.height,
          vx: (Math.random() - 0.5) * 4,
          vy: Math.random() * 2 + 1,
          size: Math.random() * 4 + 2,
          color: '#94A3B8',
          life: 20
        });
      }
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
    reportRun(containerRef, 'city-sprint', {
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
    player.y = getGroundY();
    player.vy = 0;
    player.jumpsLeft = player.maxJumps;
    player.trail = [];
    obstacles = [];
    coins = [];
    particles = [];
    floatingTexts = [];
  }

  // Event Listeners
  function handleKeyDown(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      triggerAction(e);
    }
  }

  function handleCanvasClick(e) {
    // If clicked on controller button, ignore canvas click to prevent double trigger
    if (e.target === controllerBtn || controllerBtn.contains(e.target)) return;
    triggerAction(e);
  }

  function handleBtnPointerDown(e) {
    e.stopPropagation();
    e.preventDefault();
    controllerBtn.style.transform = 'scale(0.92)';
    controllerBtn.style.background = '#1D4ED8';
    triggerAction(e);
  }

  function handleBtnPointerUp(e) {
    controllerBtn.style.transform = 'scale(1)';
    controllerBtn.style.background = 'linear-gradient(135deg, #3B82F6, #1D4ED8)';
  }

  window.addEventListener('keydown', handleKeyDown);
  canvas.addEventListener('pointerdown', handleCanvasClick);
  controllerBtn.addEventListener('pointerdown', handleBtnPointerDown);
  controllerBtn.addEventListener('pointerup', handleBtnPointerUp);
  controllerBtn.addEventListener('pointerleave', handleBtnPointerUp);

  cleanupFn = () => {
    window.removeEventListener('resize', resize);
    window.removeEventListener('keydown', handleKeyDown);
    if (canvas) canvas.removeEventListener('pointerdown', handleCanvasClick);
    if (controllerBtn) {
      controllerBtn.removeEventListener('pointerdown', handleBtnPointerDown);
      controllerBtn.removeEventListener('pointerup', handleBtnPointerUp);
      controllerBtn.removeEventListener('pointerleave', handleBtnPointerUp);
      controllerBtn.remove();
    }
  };

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
    floatingTexts.push({ text, x, y, vy: -1.5, alpha: 1, color });
  }

  // ── Main Game Loop ──
  function loop() {
    animId = requestAnimationFrame(loop);

    const groundY = getGroundY();

    // Clear background — Crisp Light Theme Sunset/Day Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#EFF6FF');
    bgGrad.addColorStop(0.6, '#DBEAFE');
    bgGrad.addColorStop(1, '#BFDBFE');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Parallax City Skyline
    buildings.forEach((b) => {
      if (gameState === 'PLAYING') {
        b.x -= speed * 0.25;
        if (b.x + b.width < 0) {
          b.x = canvas.width + Math.random() * 30;
          b.height = Math.floor(Math.random() * 150 + 100);
        }
      }
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, canvas.height - GROUND_HEIGHT - b.height, b.width, b.height);

      // Building Windows
      ctx.fillStyle = '#FEF08A';
      for (let wy = canvas.height - GROUND_HEIGHT - b.height + 15; wy < canvas.height - GROUND_HEIGHT - 20; wy += 25) {
        for (let wx = b.x + 8; wx < b.x + b.width - 12; wx += 16) {
          if ((Math.floor(wx + wy)) % 3 === 0) {
            ctx.fillRect(wx, wy, 8, 12);
          }
        }
      }
    });

    // Draw Ground / Highway Track
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);

    // Track Top Accent Line
    ctx.fillStyle = '#3B82F6';
    ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, 5);

    // Dashed Road Line
    ctx.fillStyle = '#94A3B8';
    const dashOffset = (frame * speed) % 40;
    for (let dx = -dashOffset; dx < canvas.width; dx += 40) {
      ctx.fillRect(dx, canvas.height - GROUND_HEIGHT + 32, 22, 4);
    }

    if (gameState === 'PLAYING') {
      frame++;
      score += 1;
      speed = 6.5 + Math.floor(score / 400) * 0.5;

      // Update Player Physics
      player.vy += player.gravity;
      player.y += player.vy;

      if (player.y >= groundY) {
        player.y = groundY;
        player.vy = 0;
        player.jumpsLeft = player.maxJumps;
      }

      // Player Speed Trail
      if (frame % 2 === 0) {
        player.trail.push({ x: player.x, y: player.y, alpha: 0.5 });
      }
      player.trail.forEach((t) => (t.alpha -= 0.05));
      player.trail = player.trail.filter((t) => t.alpha > 0);

      // Spawn Obstacles (Single & Double Barriers)
      if (frame % Math.max(50, 95 - Math.floor(score / 350) * 6) === 0) {
        const isDouble = Math.random() > 0.6;
        obstacles.push({
          x: canvas.width + 40,
          y: canvas.height - GROUND_HEIGHT,
          width: isDouble ? 48 : 30,
          height: isDouble ? 46 : 40,
          isDouble
        });
      }

      // Spawn Coins
      if (frame % 65 === 0 && Math.random() > 0.3) {
        const coinY = canvas.height - GROUND_HEIGHT - Math.random() * 110 - 40;
        coins.push({ x: canvas.width + 30, y: coinY, radius: 11, collected: false });
      }

      // Update & Render Obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= speed;

        const px1 = player.x + 6;
        const px2 = player.x + player.width - 6;
        const py1 = player.y + 6;
        const py2 = player.y + player.height;

        const ox1 = obs.x;
        const ox2 = obs.x + obs.width;
        const oy1 = obs.y - obs.height;
        const oy2 = obs.y;

        // Collision Check
        if (px2 > ox1 && px1 < ox2 && py2 > oy1 && py1 < oy2) {
          gameState = 'GAMEOVER';
          spawnExplosion(player.x + player.width / 2, player.y + player.height / 2, '#EF4444', 30);
          if (score > highscore) {
            highscore = score;
            localStorage.setItem('city_sprint_highscore', highscore.toString());
          }
          bankRun();
        }

        if (obs.x < -60) obstacles.splice(i, 1);
      }

      // Update & Render Coins
      for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        coin.x -= speed;

        const dist = Math.hypot(player.x + player.width / 2 - coin.x, player.y + player.height / 2 - coin.y);
        if (dist < coin.radius + player.width / 2) {
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

        if (coin.x < -40) coins.splice(i, 1);
      }
    }

    // ── Render Game Objects ──

    // Player Trail
    player.trail.forEach((t) => {
      ctx.fillStyle = `rgba(59, 130, 246, ${t.alpha * 0.35})`;
      ctx.fillRect(t.x, t.y, player.width, player.height);
    });

    // Draw Obstacles (Red Hazard Traffic Barriers)
    obstacles.forEach((obs) => {
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(239, 68, 68, 0.4)';
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(obs.x, obs.y - obs.height, obs.width, obs.height);

      // Warning Stripe
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(obs.x + 4, obs.y - obs.height + 6, obs.width - 8, 8);
      ctx.shadowBlur = 0;
    });

    // Draw Coins
    coins.forEach((coin) => {
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(245, 158, 11, 0.5)';
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
      ctx.shadowColor = 'rgba(59, 130, 246, 0.4)';
      ctx.fillStyle = '#3B82F6';
      ctx.fillRect(player.x, player.y, player.width, player.height);

      // Runner Visor & Head Details
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(player.x + 20, player.y + 8, 12, 6);

      // Runner Running Legs Motion Effect
      const legOffset = Math.sin(frame * 0.4) * 6;
      ctx.fillStyle = '#1D4ED8';
      ctx.fillRect(player.x + 4, player.y + player.height - 10, 10, 10 + legOffset);
      ctx.fillRect(player.x + 20, player.y + player.height - 10, 10, 10 - legOffset);
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

    // HUD Header — Crisp Dark Slate Text
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
      ctx.shadowColor = 'rgba(59, 130, 246, 0.3)';
      ctx.font = '900 42px Inter, sans-serif';
      ctx.fillStyle = '#3B82F6';
      ctx.fillText('CITY SPRINT', canvas.width / 2, canvas.height / 2 - 40);

      ctx.shadowBlur = 0;
      ctx.font = '600 18px Inter, sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText('Tap Screen, Click, or Press SPACE to Jump', canvas.width / 2, canvas.height / 2 + 10);

      ctx.fillStyle = '#D97706';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.fillText('⚡ TAP JUMP BUTTON OR PRESS SPACE TO START ⚡', canvas.width / 2, canvas.height / 2 + 60);

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

      ctx.fillStyle = '#3B82F6';
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.fillText('🔄 TAP JUMP BUTTON OR PRESS SPACE TO PLAY AGAIN', canvas.width / 2, canvas.height / 2 + 85);

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
  controllerBtnRef = null;
}
