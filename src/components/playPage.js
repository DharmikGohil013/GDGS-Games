// ─── Full Page Game Player View ───
import { games } from '../data/games.js';
import { createGameCard } from './gameCard.js';

// Lazy-load game modules
const gameModules = {
  'color-switch': () => import('../games/color-switch.js'),
  'tower-stacker': () => import('../games/tower-stacker.js'),
  'neon-snake': () => import('../games/neon-snake.js'),
  'block-merge': () => import('../games/block-merge.js'),
  'turbo-drift': () => import('../games/turbo-drift.js'),
  'ball-drop': () => import('../games/ball-drop.js'),
  'city-sprint': () => import('../games/city-sprint.js'),
};

let activeGameModule = null;
let keydownListener = null;

// Prevent Space key from scrolling the web page during gameplay
function preventSpaceScroll(e) {
  if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
    const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (tag !== 'input' && tag !== 'textarea') {
      e.preventDefault();
    }
  }
}

export function createPlayPage(gameId) {
  // Find game details
  const game = games.find((g) => g.id === gameId) || {
    id: gameId,
    title: gameId.replace(/-/g, ' ').toUpperCase(),
    category: 'arcade',
    isPlayable: false,
    plays: '1.2M',
    rating: 4.8,
    color: 'coral'
  };

  const container = document.createElement('div');
  container.className = 'play-page-container';

  container.innerHTML = `
    <!-- Top Game Navigation Bar -->
    <header class="play-page-header">
      <div class="play-header-left">
        <a href="#/" class="play-back-btn" aria-label="Back to home">
          <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor">
            <path d="M10 3L3 10l7 7V13h7v-6h-7V3z"/>
          </svg>
          Back to Games
        </a>
        <div class="play-title-wrap">
          <h1 class="play-game-title">${game.title}</h1>
          <span class="play-game-badge">${game.category.toUpperCase()}</span>
        </div>
      </div>

      <div class="play-header-right">
        <button class="play-action-btn" id="play-fullscreen-btn" title="Toggle Fullscreen" aria-label="Toggle Fullscreen">
          <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Fullscreen
        </button>
      </div>
    </header>

    <!-- Dedicated Full Screen Viewport -->
    <main class="play-viewport" id="play-viewport">
      <div class="play-loading-spinner" id="play-loading">
        <div class="game-loader"></div>
        <p>Loading ${game.title}...</p>
      </div>

      <div class="play-coming-soon" id="play-coming-soon" style="display:none">
        <svg viewBox="0 0 80 80" width="64" height="64" aria-hidden="true">
          <circle cx="40" cy="40" r="38" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
          <path d="M32 24 L58 40 L32 56 Z" fill="rgba(255,255,255,0.3)"/>
        </svg>
        <h3>Coming Soon!</h3>
        <p>This game is currently in development.<br>Check out our featured games in the homepage!</p>
        <a href="#/" class="btn-primary" style="margin-top:12px">← Back to All Games</a>
      </div>
    </main>

    <!-- Game Info & Recommendations Below Viewport -->
    <section class="play-info-section wrap">
      <div class="play-info-card">
        <div class="play-info-meta">
          <div>
            <h3>${game.title}</h3>
            <p>Category: <strong>${game.category.charAt(0).toUpperCase() + game.category.slice(1)}</strong></p>
          </div>
          <div class="play-meta-stats">
            <span>🔥 ${game.plays || '10M+'} Plays</span>
            <span class="rating">★ ${game.rating || 4.8} / 5.0</span>
          </div>
        </div>
        <div class="play-controls-guide">
          <h4>🎮 How to Play</h4>
          <p>Use your Mouse / Spacebar on desktop or Single Tap on mobile to control actions. Pass through obstacles matching your color and reach the highest score possible!</p>
        </div>
      </div>

      <!-- Related Games Grid -->
      <div class="play-related-section">
        <h2>More Games You Might Like</h2>
        <div class="card-grid" id="play-related-grid"></div>
      </div>
    </section>
  `;

  // Prevent Space Key scrolling
  if (keydownListener) {
    window.removeEventListener('keydown', keydownListener);
  }
  keydownListener = preventSpaceScroll;
  window.addEventListener('keydown', keydownListener);

  // Render related games
  const relatedGrid = container.querySelector('#play-related-grid');
  const relatedGames = games.filter((g) => g.id !== gameId).slice(0, 4);
  relatedGames.forEach((relGame) => {
    relatedGrid.appendChild(createGameCard(relGame));
  });

  // Fullscreen Handler
  const fsBtn = container.querySelector('#play-fullscreen-btn');
  const viewport = container.querySelector('#play-viewport');
  fsBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      viewport.requestFullscreen?.() || viewport.webkitRequestFullscreen?.();
    } else {
      document.exitFullscreen?.() || document.webkitExitFullscreen?.();
    }
  });

  // Load Game Engine
  requestAnimationFrame(async () => {
    destroyActiveGame();

    if (game.isPlayable && gameModules[game.id]) {
      try {
        const module = await gameModules[game.id]();
        const loadingEl = container.querySelector('#play-loading');
        if (loadingEl) loadingEl.style.display = 'none';

        activeGameModule = module;
        module.initGame(viewport);
      } catch (err) {
        console.error('Failed to load game module:', err);
        const loadingEl = container.querySelector('#play-loading');
        const csEl = container.querySelector('#play-coming-soon');
        if (loadingEl) loadingEl.style.display = 'none';
        if (csEl) csEl.style.display = 'flex';
      }
    } else {
      const loadingEl = container.querySelector('#play-loading');
      const csEl = container.querySelector('#play-coming-soon');
      if (loadingEl) loadingEl.style.display = 'none';
      if (csEl) csEl.style.display = 'flex';
    }
  });

  return container;
}

export function destroyActiveGame() {
  if (keydownListener) {
    window.removeEventListener('keydown', keydownListener);
    keydownListener = null;
  }

  if (activeGameModule && typeof activeGameModule.destroyGame === 'function') {
    try {
      activeGameModule.destroyGame();
    } catch (e) {
      console.warn('Error destroying active game:', e);
    }
    activeGameModule = null;
  }
}
