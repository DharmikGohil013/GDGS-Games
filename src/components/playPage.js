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
  'infinite-runner': () => import('../games/infinite-runner.js'),
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
  // Schema.org VideoGame on the whole page container
  container.setAttribute('itemscope', '');
  container.setAttribute('itemtype', 'https://schema.org/VideoGame');

  const gameName = game.title || game.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const categoryLabel = (game.category || 'arcade').charAt(0).toUpperCase() + (game.category || 'arcade').slice(1);

  container.innerHTML = `
    <!-- Top Game Navigation Bar -->
    <header class="play-page-header" role="banner">
      <div class="play-header-left">
        <a href="#/" class="play-back-btn" aria-label="Back to Playzy home — all free browser games">
          <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d="M10 3L3 10l7 7V13h7v-6h-7V3z"/>
          </svg>
          Back to Games
        </a>
        <div class="play-title-wrap">
          <h1 class="play-game-title" itemprop="name">${gameName}</h1>
          <span class="play-game-badge" itemprop="genre">${categoryLabel.toUpperCase()}</span>
        </div>
      </div>

      <div class="play-header-right">
        <button class="play-action-btn" id="play-fullscreen-btn" title="Toggle Fullscreen — play ${gameName} in fullscreen" aria-label="Toggle Fullscreen for ${gameName}">
          <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Fullscreen
        </button>
      </div>
    </header>

    <!-- Hidden SEO metadata for the game -->
    <meta itemprop="gamePlatform" content="Web Browser">
    <meta itemprop="applicationCategory" content="Game">
    <meta itemprop="operatingSystem" content="Any — No installation required">
    <meta itemprop="description" content="Play ${gameName} free online — ${categoryLabel} browser game. No download, no install. Available at Playzy.">
    <link itemprop="offers" href="https://schema.org/InStock">

    <!-- Dedicated Full Screen Viewport -->
    <main class="play-viewport" id="play-viewport" aria-label="${gameName} game viewport">
      <div class="play-loading-spinner" id="play-loading" role="status" aria-label="Loading ${gameName}...">
        <div class="game-loader"></div>
        <p>Loading ${gameName}...</p>
      </div>

      <div class="play-coming-soon" id="play-coming-soon" style="display:none" aria-live="polite">
        <svg viewBox="0 0 80 80" width="64" height="64" aria-hidden="true">
          <circle cx="40" cy="40" r="38" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
          <path d="M32 24 L58 40 L32 56 Z" fill="rgba(255,255,255,0.3)"/>
        </svg>
        <h2>Coming Soon!</h2>
        <p>This game is currently in development.<br>Check out our featured games in the homepage!</p>
        <a href="#/" class="btn-primary" style="margin-top:12px" aria-label="Back to all free browser games on Playzy">← Back to All Games</a>
      </div>
    </main>

    <!-- Game Info & Recommendations Below Viewport -->
    <section class="play-info-section wrap" aria-label="${gameName} game details and recommendations">
      <article class="play-info-card" itemscope itemtype="https://schema.org/VideoGame">
        <meta itemprop="name" content="${gameName}">
        <meta itemprop="gamePlatform" content="Web Browser">
        <div class="play-info-meta">
          <div>
            <h2 itemprop="name">${gameName}</h2>
            <p>Category: <strong itemprop="genre">${categoryLabel}</strong></p>
          </div>
          <div class="play-meta-stats">
            <span title="${game.plays || '10M+'} total plays on Playzy">🔥 ${game.plays || '10M+'} Plays</span>
            <span class="rating" itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating"
                  title="Rated ${game.rating || 4.8} out of 5 by players">
              ★ <span itemprop="ratingValue">${game.rating || 4.8}</span>
              <meta itemprop="bestRating" content="5">
              <meta itemprop="ratingCount" content="10000">
              / 5.0
            </span>
          </div>
        </div>
        <div class="play-controls-guide" itemscope itemtype="https://schema.org/HowTo">
          <h3 itemprop="name">🎮 How to Play ${gameName}</h3>
          <div itemprop="step" itemscope itemtype="https://schema.org/HowToStep">
            <p itemprop="text">Use your Mouse / Spacebar on desktop or Single Tap on mobile to control actions. Pass through obstacles matching your color and reach the highest score possible!</p>
          </div>
          <meta itemprop="tool" content="Web Browser">
          <meta itemprop="supply" content="No additional supplies — plays for free in any browser">
        </div>
        <div class="play-offers" hidden>
          <div itemprop="offers" itemscope itemtype="https://schema.org/Offer">
            <meta itemprop="price" content="0">
            <meta itemprop="priceCurrency" content="USD">
            <meta itemprop="availability" content="https://schema.org/InStock">
          </div>
        </div>
      </article>

      <!-- Related Games Grid -->
      <section class="play-related-section" aria-labelledby="related-games-heading">
        <h2 id="related-games-heading">More Games You Might Like</h2>
        <div class="card-grid" id="play-related-grid" role="list" aria-label="Related free browser games"></div>
      </section>
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
