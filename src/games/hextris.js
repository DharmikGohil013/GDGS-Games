// ─── Hextris HTML5 Canvas Game Module ───
// Fully responsive, high-performance hexagon puzzle game matching Hextris UI & logic

let containerElement = null;
let canvas = null;
let ctx = null;
let animFrameId = null;
let resizeObserver = null;
let audioCtx = null;

// Palette
const PALETTE = [
  '#e74c3c', // 0: Red
  '#f1c40f', // 1: Yellow
  '#3498db', // 2: Blue
  '#2ecc71', // 3: Green
  '#9b59b6', // 4: Purple
  '#e67e22'  // 5: Orange
];

const HEX_OUTLINE_COLOR = '#34495e';
const HEX_FILL_COLOR = '#2c3e50';
const BG_COLOR = '#0f172a';

// Game State
let gameState = 'START'; // 'START', 'PLAYING', 'PAUSED', 'GAMEOVER'
let score = 0;
let highScore = 0;
let combo = 1;
let comboTimer = 0; // 0 to 1
let maxComboTime = 180; // frames (~3 seconds)
let comboFrameCount = 0;

let currentAngle = 0;
let targetAngle = 0;

let hexRadius = 65;
let blockHeight = 18;
let maxStackLayers = 7;
let spawnRadius = 400;

let stack = [[], [], [], [], [], []]; // 6 sides
let fallingBlocks = [];
let particles = [];
let floatingTexts = [];

let spawnTimer = 0;
let spawnInterval = 90; // frames
let baseBlockSpeed = 3.5;
let isFastFalling = false;

// Audio Synth
function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playSound(type) {
  if (!audioCtx) return;
  try {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'rotate') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.04);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'land') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.06);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'match') {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now + i * 0.05);
        g.connect(audioCtx.destination);
        o.connect(g);
        g.gain.setValueAtTime(0.15, now + i * 0.05);
        g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.12);
        o.start(now + i * 0.05);
        o.stop(now + i * 0.05 + 0.12);
      });
    } else if (type === 'combo') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.15);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'gameover') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.5);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch (e) {
    // Audio context error fallback
  }
}

// ─── Initialization ───
export function initGame(container) {
  containerElement = container;
  container.innerHTML = '';
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.background = BG_COLOR;

  // Load High Score
  highScore = parseInt(localStorage.getItem('hextris_highscore') || '0', 10);

  // Canvas
  canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  container.appendChild(canvas);

  ctx = canvas.getContext('2d');

  resizeCanvas();

  // Resize Listener
  resizeObserver = new ResizeObserver(() => {
    resizeCanvas();
  });
  resizeObserver.observe(container);

  // Event Listeners
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  canvas.addEventListener('pointerdown', handlePointerDown);

  // Start Loop
  resetGame();
  gameState = 'START';
  lastTime = performance.now();
  animFrameId = requestAnimationFrame(gameLoop);
}

export function destroyGame() {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
  if (canvas) {
    canvas.removeEventListener('pointerdown', handlePointerDown);
  }
  if (containerElement) {
    containerElement.innerHTML = '';
  }
  stack = [[], [], [], [], [], []];
  fallingBlocks = [];
  particles = [];
  floatingTexts = [];
}

// ─── Canvas Sizing ───
function resizeCanvas() {
  if (!canvas || !containerElement) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = containerElement.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  const minDim = Math.min(rect.width, rect.height);
  hexRadius = Math.max(45, minDim * 0.11);
  blockHeight = Math.max(14, hexRadius * 0.28);
  spawnRadius = Math.max(rect.width, rect.height) * 0.65;
}

// ─── Reset Game ───
function resetGame() {
  score = 0;
  combo = 1;
  comboTimer = 0;
  comboFrameCount = 0;
  currentAngle = 0;
  targetAngle = 0;
  stack = [[], [], [], [], [], []];
  fallingBlocks = [];
  particles = [];
  floatingTexts = [];
  spawnTimer = 0;
  spawnInterval = 90;
  isFastFalling = false;
}

function startGame() {
  initAudio();
  resetGame();
  gameState = 'PLAYING';
  spawnBlock();
}

// ─── User Input Handlers ───
function handleKeyDown(e) {
  initAudio();

  if (e.code === 'KeyP' || e.code === 'Escape') {
    if (gameState === 'PLAYING') {
      gameState = 'PAUSED';
    } else if (gameState === 'PAUSED') {
      gameState = 'PLAYING';
    }
    return;
  }

  if (gameState === 'START' || gameState === 'GAMEOVER') {
    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyW' || e.code === 'ArrowUp') {
      startGame();
    }
    return;
  }

  if (gameState !== 'PLAYING') return;

  if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
    rotateHexagon(-1);
    e.preventDefault();
  } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
    rotateHexagon(1);
    e.preventDefault();
  } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
    isFastFalling = true;
    e.preventDefault();
  }
}

function handleKeyUp(e) {
  if (e.code === 'ArrowDown' || e.code === 'KeyS') {
    isFastFalling = false;
  }
}

function handlePointerDown(e) {
  initAudio();
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (gameState === 'START' || gameState === 'GAMEOVER') {
    startGame();
    return;
  }

  if (gameState === 'PAUSED') {
    gameState = 'PLAYING';
    return;
  }

  if (gameState === 'PLAYING') {
    // Tap left side or right side of screen
    if (x < rect.width / 2) {
      rotateHexagon(-1);
    } else {
      rotateHexagon(1);
    }
  }
}

function rotateHexagon(dir) {
  // dir: -1 for left (CCW), 1 for right (CW)
  targetAngle += (dir * Math.PI) / 3;
  playSound('rotate');
}

// ─── Game Loop ───
let lastTime = 0;
function gameLoop(now) {
  animFrameId = requestAnimationFrame(gameLoop);

  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  const cx = w / 2;
  const cy = h / 2;

  ctx.save();
  ctx.scale(dpr, dpr);

  // Clear Background
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, w, h);

  // Draw Background Subtle Glow Grid
  drawBackgroundEffects(ctx, w, h, cx, cy);

  if (gameState === 'PLAYING') {
    updateGame(cx, cy);
  }

  // Smooth Angle Interpolation
  currentAngle += (targetAngle - currentAngle) * 0.28;

  // Render Game Scene
  drawGameScene(ctx, cx, cy);

  // Render UI Overlays
  drawUI(ctx, w, h, cx, cy);

  ctx.restore();
}

// ─── Update Logic ───
function updateGame(cx, cy) {
  // Speed scaling with score
  const speedMultiplier = 1 + Math.min(score / 5000, 2.5);
  const currentSpeed = (baseBlockSpeed * speedMultiplier) * (isFastFalling ? 3.5 : 1);

  // Spawn timer
  spawnInterval = Math.max(35, 90 - Math.floor(score / 300));
  spawnTimer++;
  if (spawnTimer >= spawnInterval) {
    spawnTimer = 0;
    spawnBlock();
  }

  // Combo timer
  if (combo > 1) {
    comboFrameCount++;
    comboTimer = 1 - comboFrameCount / maxComboTime;
    if (comboTimer <= 0) {
      combo = 1;
      comboTimer = 0;
      comboFrameCount = 0;
    }
  }

  // Update falling blocks
  for (let i = fallingBlocks.length - 1; i >= 0; i--) {
    const block = fallingBlocks[i];
    block.dist -= currentSpeed;

    // Target side in world space
    const side = block.side;
    const currentStackHeight = stack[side].length;
    const targetDist = hexRadius + currentStackHeight * blockHeight;

    if (block.dist <= targetDist) {
      // Snap to stack
      stack[side].push(block.color);
      fallingBlocks.splice(i, 1);
      playSound('land');

      // Check Game Over condition
      if (stack[side].length > maxStackLayers) {
        triggerGameOver();
        return;
      }

      // Check for Matches
      checkAndClearMatches(cx, cy);
    }
  }

  // Update Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= p.decay;
    p.size *= 0.96;
    if (p.alpha <= 0 || p.size <= 0.2) {
      particles.splice(i, 1);
    }
  }

  // Update Floating Text
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.y -= 1.2;
    ft.alpha -= 0.02;
    if (ft.alpha <= 0) {
      floatingTexts.splice(i, 1);
    }
  }
}

// ─── Block Spawning ───
function spawnBlock() {
  const side = Math.floor(Math.random() * 6);
  // Color selection: choose from colors currently present or active palette
  const colorIndex = Math.floor(Math.random() * PALETTE.length);

  fallingBlocks.push({
    side: side,
    color: colorIndex,
    dist: spawnRadius
  });
}

// ─── Match 3+ & Collapse Engine ───
function checkAndClearMatches(cx, cy) {
  let matchedGroups = [];
  let visited = Array.from({ length: 6 }, () => []);

  // Connected Component Search
  for (let s = 0; s < 6; s++) {
    for (let l = 0; l < stack[s].length; l++) {
      if (stack[s][l] !== undefined && !visited[s][l]) {
        const color = stack[s][l];
        const group = [];
        const queue = [{ s, l }];
        visited[s][l] = true;

        while (queue.length > 0) {
          const curr = queue.shift();
          group.push(curr);

          // Check 4 directions:
          // 1. Same side down (l - 1)
          // 2. Same side up (l + 1)
          // 3. Left side same layer ((s + 5) % 6, l)
          // 4. Right side same layer ((s + 1) % 6, l)
          const neighbors = [
            { s: curr.s, l: curr.l - 1 },
            { s: curr.s, l: curr.l + 1 },
            { s: (curr.s + 5) % 6, l: curr.l },
            { s: (curr.s + 1) % 6, l: curr.l }
          ];

          for (const n of neighbors) {
            if (
              n.s >= 0 && n.s < 6 &&
              n.l >= 0 && n.l < stack[n.s].length &&
              stack[n.s][n.l] === color &&
              !visited[n.s][n.l]
            ) {
              visited[n.s][n.l] = true;
              queue.push(n);
            }
          }
        }

        if (group.length >= 3) {
          matchedGroups.push({ group, color });
        }
      }
    }
  }

  if (matchedGroups.length === 0) return;

  // Process Clears
  let totalCleared = 0;
  matchedGroups.forEach(({ group, color }) => {
    totalCleared += group.length;

    group.forEach(({ s, l }) => {
      // Spawn particles at block center
      const worldAngle = currentAngle + (s * Math.PI) / 3 + Math.PI / 6;
      const dist = hexRadius + (l + 0.5) * blockHeight;
      const px = cx + Math.cos(worldAngle) * dist;
      const py = cy + Math.sin(worldAngle) * dist;

      spawnParticles(px, py, PALETTE[color]);

      // Mark for deletion
      stack[s][l] = null;
    });
  });

  // Gravity Collapse stacks
  for (let s = 0; s < 6; s++) {
    stack[s] = stack[s].filter(c => c !== null);
  }

  // Update Score & Combos
  const basePoints = totalCleared * 100;
  const pointsEarned = basePoints * combo;
  score += pointsEarned;

  if (score > highScore) {
    highScore = score;
    localStorage.setItem('hextris_highscore', highScore.toString());
  }

  // Audio & SFX
  if (combo > 1) {
    playSound('combo');
  } else {
    playSound('match');
  }

  // Floating text
  spawnFloatingText(cx, cy - hexRadius - 40, `+${pointsEarned} ${combo > 1 ? `(${combo}x COMBO!)` : ''}`);

  // Increment combo
  combo++;
  comboTimer = 1;
  comboFrameCount = 0;

  // Cascading check for newly formed matches after collapse!
  setTimeout(() => {
    if (gameState === 'PLAYING') {
      checkAndClearMatches(cx, cy);
    }
  }, 120);
}

// ─── Particle Effects ───
function spawnParticles(x, y, colorHex) {
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 4 + 1.5;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 6 + 3,
      color: colorHex,
      alpha: 1.0,
      decay: Math.random() * 0.03 + 0.02
    });
  }
}

function spawnFloatingText(x, y, text) {
  floatingTexts.push({
    x, y, text, alpha: 1.0
  });
}

function triggerGameOver() {
  gameState = 'GAMEOVER';
  playSound('gameover');
}

// ─── Drawing Functions ───
function drawBackgroundEffects(ctx, w, h, cx, cy) {
  // Radial subtle gradient background pulse
  const grad = ctx.createRadialGradient(cx, cy, hexRadius, cx, cy, Math.max(w, h));
  grad.addColorStop(0, '#1e293b');
  grad.addColorStop(1, BG_COLOR);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Outer danger hexagon boundary
  const maxDist = hexRadius + maxStackLayers * blockHeight;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(currentAngle);
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 8]);
  drawHexagonPath(ctx, maxDist);
  ctx.stroke();
  ctx.restore();
}

function drawGameScene(ctx, cx, cy) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(currentAngle);

  // 1. Draw Central Hexagon
  ctx.fillStyle = HEX_FILL_COLOR;
  ctx.strokeStyle = HEX_OUTLINE_COLOR;
  ctx.lineWidth = 4;
  drawHexagonPath(ctx, hexRadius);
  ctx.fill();
  ctx.stroke();

  // 2. Draw Stacked Blocks
  for (let side = 0; side < 6; side++) {
    const sideAngle = (side * Math.PI) / 3;
    for (let layer = 0; layer < stack[side].length; layer++) {
      const colorIndex = stack[side][layer];
      if (colorIndex !== null && colorIndex !== undefined) {
        const innerR = hexRadius + layer * blockHeight;
        const outerR = innerR + blockHeight - 1;
        drawTrapezoidBlock(ctx, sideAngle, innerR, outerR, PALETTE[colorIndex]);
      }
    }
  }

  // 3. Draw Falling Blocks
  fallingBlocks.forEach((block) => {
    const sideAngle = (block.side * Math.PI) / 3;
    const innerR = block.dist;
    const outerR = innerR + blockHeight;
    drawTrapezoidBlock(ctx, sideAngle, innerR, outerR, PALETTE[block.color]);
  });

  // 4. Draw Combo Timer Ring (if combo active)
  if (combo > 1 && comboTimer > 0) {
    const ringRadius = hexRadius + (maxStackLayers + 0.8) * blockHeight;
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * comboTimer);
    ctx.stroke();
  }

  ctx.restore();

  // 5. Draw Particles
  particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // 6. Draw Floating Score Texts
  floatingTexts.forEach((ft) => {
    ctx.save();
    ctx.globalAlpha = ft.alpha;
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 6;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  });
}

// Draw Hexagon Helper
function drawHexagonPath(ctx, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// Draw Block Slice / Trapezoid Helper
function drawTrapezoidBlock(ctx, sideAngle, r1, r2, colorHex) {
  const a1 = sideAngle;
  const a2 = sideAngle + Math.PI / 3;

  const p1x = Math.cos(a1) * r1;
  const p1y = Math.sin(a1) * r1;
  const p2x = Math.cos(a2) * r1;
  const p2y = Math.sin(a2) * r1;

  const p3x = Math.cos(a2) * r2;
  const p3y = Math.sin(a2) * r2;
  const p4x = Math.cos(a1) * r2;
  const p4y = Math.sin(a1) * r2;

  ctx.save();
  ctx.fillStyle = colorHex;
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(p1x, p1y);
  ctx.lineTo(p2x, p2y);
  ctx.lineTo(p3x, p3y);
  ctx.lineTo(p4x, p4y);
  ctx.closePath();

  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// ─── HUD & Overlay Rendering ───
function drawUI(ctx, w, h, cx, cy) {
  // Score In Center Hexagon
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 4;
  ctx.fillText(score.toString(), cx, cy);
  ctx.restore();

  // Top Left: High Score & Combo Pill
  ctx.save();
  ctx.font = '600 15px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(`🏆 HIGH SCORE: ${highScore}`, 20, 30);

  if (combo > 1) {
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText(`🔥 MULTIPLIER: ${combo}x`, 20, 55);
  }
  ctx.restore();

  // OVERLAY STATES
  if (gameState === 'START') {
    drawOverlay(ctx, w, h, 'HEXTRIS', 'Press SPACE or Tap Screen to Play', 'Rotate: ← / → or A / D | Fast Fall: ↓');
  } else if (gameState === 'PAUSED') {
    drawOverlay(ctx, w, h, 'GAME PAUSED', 'Press P, ESC, or Tap Screen to Resume', `Current Score: ${score}`);
  } else if (gameState === 'GAMEOVER') {
    drawOverlay(ctx, w, h, 'GAME OVER', `Final Score: ${score}`, 'Press SPACE or Tap Screen to Try Again!');
  }
}

function drawOverlay(ctx, w, h, title, subtitle, footer) {
  ctx.save();
  // Semi-transparent backdrop
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(0, 0, w, h);

  ctx.textAlign = 'center';

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 48px system-ui, -apple-system, sans-serif';
  ctx.shadowColor = '#3b82f6';
  ctx.shadowBlur = 20;
  ctx.fillText(title, w / 2, h / 2 - 40);

  // Subtitle
  ctx.font = '600 20px system-ui, sans-serif';
  ctx.fillStyle = '#f1c40f';
  ctx.shadowColor = 'transparent';
  ctx.fillText(subtitle, w / 2, h / 2 + 15);

  // Footer / Instructions
  if (footer) {
    ctx.font = '400 15px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(footer, w / 2, h / 2 + 65);
  }

  // Play Button Pulse Graphic
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.arc(w / 2, h / 2 + 120, 28, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(w / 2 - 8, h / 2 + 106);
  ctx.lineTo(w / 2 + 14, h / 2 + 120);
  ctx.lineTo(w / 2 - 8, h / 2 + 134);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
