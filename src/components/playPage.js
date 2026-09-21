// ─── Play page ───
// Full-bleed viewport plus a details rail: how to play, your stats, today's
// missions and related games. Schema.org VideoGame markup is preserved.

import { games } from '../data/games.js';
import { getGuide } from '../data/gameGuides.js';
import { createGameCard } from './gameCard.js';
import { getGameStats, getMissions, getCoins, getLevelInfo } from '../core/progress.js';
import { isSoundOn, toggleSound, sfx } from '../core/audio.js';
import { openProfileDrawer } from './profileDrawer.js';
import { onUnmount } from '../core/lifecycle.js';

// Lazy-load game modules so the homepage never pays for Phaser or Three.
const gameModules = {
  'gravity-switch': () => import('../games/gravity-switch.js'),
  'hextris': () => import('../games/hextris.js'),
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

const ICON = {
  back: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
  fullscreen: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M20 15v5h-5M4 15v5h5"/></svg>',
  soundOn: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>',
  soundOff: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><line x1="16" y1="9" x2="22" y2="15"/><line x1="22" y1="9" x2="16" y2="15"/></svg>',
  share: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="10.6" x2="15.4" y2="6.4"/><line x1="8.6" y1="13.4" x2="15.4" y2="17.6"/></svg>',
  coin: '<svg viewBox="0 0 24 24" width="15" height="15"><circle cx="12" cy="12" r="9" fill="#FFC93C"/><circle cx="12" cy="12" r="5.6" fill="none" stroke="#A8790A" stroke-width="1.6"/></svg>',
};

/** Space scrolls the page by default, which fights every jump-button game. */
function preventSpaceScroll(e) {
  if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
    const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (tag !== 'input' && tag !== 'textarea') e.preventDefault();
  }
}

export function createPlayPage(gameId) {
  const game = games.find((g) => g.id === gameId) || {
    id: gameId,
    title: gameId.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    category: 'arcade',
    isPlayable: false,
    plays: '1.2M',
    rating: 4.8,
    color: 'purple',
  };

  const guide = getGuide(game);
  const stats = getGameStats(game.id);
  const gameName = game.title;
  const categoryLabel = (game.category || 'arcade').charAt(0).toUpperCase() + (game.category || 'arcade').slice(1);

  const container = document.createElement('div');
  container.className = `play-page-container${game.isLightTheme ? ' light-theme' : ''}`;
  container.setAttribute('data-accent', game.color || 'purple');
  container.setAttribute('itemscope', '');
  container.setAttribute('itemtype', 'https://schema.org/VideoGame');

  container.innerHTML = `
    <header class="play-page-header" role="banner">
      <div class="play-header-left">
        <a href="#/" class="play-back-btn" aria-label="Back to Playzy home — all free browser games">
          ${ICON.back}<span>All games</span>
        </a>
        <div class="play-title-wrap">
          <h1 class="play-game-title" itemprop="name">${gameName}</h1>
          <span class="play-game-badge" itemprop="genre">${categoryLabel}</span>
        </div>
      </div>

      <div class="play-header-right">
        <button class="play-chip" id="play-profile-chip" title="Your coins and level" aria-label="Open your profile">
          ${ICON.coin}<b id="play-coin-value">${getCoins().toLocaleString()}</b>
          <span class="play-chip-sep"></span>
          <span>Lv <b id="play-level-value">${getLevelInfo().level}</b></span>
        </button>
        <button class="play-action-btn" id="play-sound-btn" title="Toggle sound" aria-label="Toggle sound"></button>
        <button class="play-action-btn" id="play-share-btn" title="Share ${gameName}" aria-label="Share ${gameName}">${ICON.share}</button>
        <button class="play-action-btn is-primary" id="play-fullscreen-btn" title="Fullscreen" aria-label="Toggle fullscreen for ${gameName}">
          ${ICON.fullscreen}<span>Fullscreen</span>
        </button>
      </div>
    </header>

    <meta itemprop="gamePlatform" content="Web Browser">
    <meta itemprop="applicationCategory" content="Game">
    <meta itemprop="operatingSystem" content="Any — No installation required">
    <meta itemprop="description" content="${guide.description}">
    <link itemprop="offers" href="https://schema.org/InStock">

    <main class="play-viewport" id="play-viewport" aria-label="${gameName} game viewport">
      <div class="play-loading-spinner" id="play-loading" role="status" aria-label="Loading ${gameName}">
        <div class="game-loader"></div>
        <p>Loading ${gameName}…</p>
      </div>

      <div class="play-coming-soon" id="play-coming-soon" style="display:none" aria-live="polite">
        <svg viewBox="0 0 80 80" width="64" height="64" aria-hidden="true">
          <circle cx="40" cy="40" r="38" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
          <path d="M32 24 L58 40 L32 56 Z" fill="rgba(255,255,255,0.3)"/>
        </svg>
        <h2>Coming soon</h2>
        <p>This one is still in the workshop.<br>Here are ten you can play right now.</p>
        <a href="#/" class="btn-primary" style="margin-top:12px">← Browse playable games</a>
      </div>
    </main>

    <section class="play-info-section wrap" aria-label="${gameName} details">
      <div class="play-info-grid">
        <article class="play-card play-card-wide" itemscope itemtype="https://schema.org/HowTo">
          <h2 itemprop="name">How to play ${gameName}</h2>
          <p class="play-lead" itemprop="description">${guide.description}</p>

          <div class="play-controls-list">
            ${guide.controls.map((c, i) => `
              <div class="play-control" itemprop="step" itemscope itemtype="https://schema.org/HowToStep">
                <kbd>${c.key}</kbd>
                <span itemprop="text">${c.label}</span>
                <meta itemprop="position" content="${i + 1}">
              </div>`).join('')}
          </div>

          ${guide.tips.length ? `
            <h3 class="play-subhead">Tips to score higher</h3>
            <ul class="play-tips">
              ${guide.tips.map((t) => `<li>${t}</li>`).join('')}
            </ul>` : ''}

          <meta itemprop="tool" content="Web Browser">
          <meta itemprop="supply" content="Free to play — no download required">
        </article>

        <aside class="play-card">
          <h2>Your record</h2>
          <div class="play-record" id="play-record">
            <div><b>${stats.best.toLocaleString()}</b><span>Best score</span></div>
            <div><b>${stats.runs.toLocaleString()}</b><span>Runs played</span></div>
            <div><b>${(stats.bestCombo || 0)}x</b><span>Best combo</span></div>
          </div>

          <h3 class="play-subhead">Today's missions</h3>
          <div class="play-missions" id="play-missions"></div>

          <div class="play-meta-stats">
            <span title="${game.plays || '10M+'} total plays">🔥 ${game.plays || '10M+'} plays</span>
            <span class="rating" itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating">
              ★ <span itemprop="ratingValue">${game.rating || 4.8}</span>
              <meta itemprop="bestRating" content="5">
              <meta itemprop="ratingCount" content="10000">
              / 5
            </span>
          </div>

          <div class="play-offers" hidden>
            <div itemprop="offers" itemscope itemtype="https://schema.org/Offer">
              <meta itemprop="price" content="0">
              <meta itemprop="priceCurrency" content="USD">
              <meta itemprop="availability" content="https://schema.org/InStock">
            </div>
          </div>
        </aside>
      </div>

      <section class="play-related-section" aria-labelledby="related-games-heading">
        <div class="section-head">
          <h2 id="related-games-heading">More games you might like</h2>
          <a href="#/" class="see-all-link">All games →</a>
        </div>
        <div class="card-grid" id="play-related-grid" aria-label="Related free browser games"></div>
      </section>
    </section>
  `;

  /* ── space-scroll guard ── */
  if (keydownListener) window.removeEventListener('keydown', keydownListener);
  keydownListener = preventSpaceScroll;
  window.addEventListener('keydown', keydownListener);

  /* ── missions panel ── */
  function paintMissions() {
    const host = container.querySelector('#play-missions');
    if (!host) return;
    host.innerHTML = getMissions().map((m) => `
      <div class="play-mission ${m.done ? 'is-done' : ''}">
        <div class="play-mission-top">
          <span>${m.label}</span>
          <b>${Math.min(m.progress, m.target).toLocaleString()}/${m.target.toLocaleString()}</b>
        </div>
        <div class="mission-track"><i style="width:${(m.pct * 100).toFixed(1)}%"></i></div>
      </div>`).join('');
  }
  paintMissions();

  function paintChips() {
    const coinEl = container.querySelector('#play-coin-value');
    const lvlEl = container.querySelector('#play-level-value');
    if (coinEl) coinEl.textContent = getCoins().toLocaleString();
    if (lvlEl) lvlEl.textContent = getLevelInfo().level;

    const s = getGameStats(game.id);
    const rec = container.querySelector('#play-record');
    if (rec) {
      rec.innerHTML = `
        <div><b>${s.best.toLocaleString()}</b><span>Best score</span></div>
        <div><b>${s.runs.toLocaleString()}</b><span>Runs played</span></div>
        <div><b>${s.bestCombo || 0}x</b><span>Best combo</span></div>`;
    }
    paintMissions();
  }
  document.addEventListener('playzy:progress', paintChips);

  /* ── related games ── */
  const relatedGrid = container.querySelector('#play-related-grid');
  // Prefer other playable games in the same category, then anything playable.
  const sameCat = games.filter((g) => g.id !== gameId && g.isPlayable && g.category === game.category);
  const otherPlayable = games.filter((g) => g.id !== gameId && g.isPlayable && g.category !== game.category);
  [...sameCat, ...otherPlayable].slice(0, 8).forEach((g) => relatedGrid.appendChild(createGameCard(g)));

  /* ── header actions ── */
  const viewport = container.querySelector('#play-viewport');

  container.querySelector('#play-fullscreen-btn').addEventListener('click', () => {
    if (!document.fullscreenElement) {
      (viewport.requestFullscreen || viewport.webkitRequestFullscreen)?.call(viewport);
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
    }
  });

  const soundBtn = container.querySelector('#play-sound-btn');
  function paintSound() {
    soundBtn.innerHTML = isSoundOn() ? ICON.soundOn : ICON.soundOff;
    soundBtn.classList.toggle('is-off', !isSoundOn());
  }
  paintSound();
  soundBtn.addEventListener('click', () => {
    toggleSound();
    paintSound();
    if (isSoundOn()) sfx.ui();
  });

  container.querySelector('#play-share-btn').addEventListener('click', async () => {
    const url = window.location.href;
    const shareData = { title: `${gameName} — Playzy`, text: `Play ${gameName} free on Playzy`, url };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(url);
        siteToast('Link copied to clipboard');
      }
    } catch (e) { /* the visitor dismissed the share sheet */ }
  });

  container.querySelector('#play-profile-chip').addEventListener('click', () => openProfileDrawer('missions'));

  /* ── boot the game ── */
  requestAnimationFrame(async () => {
    destroyActiveGame();

    const loadingEl = container.querySelector('#play-loading');
    const csEl = container.querySelector('#play-coming-soon');

    if (!game.isPlayable || !gameModules[game.id]) {
      if (loadingEl) loadingEl.style.display = 'none';
      if (csEl) csEl.style.display = 'flex';
      return;
    }

    try {
      const module = await gameModules[game.id]();
      if (loadingEl) loadingEl.style.display = 'none';
      activeGameModule = module;
      module.initGame(viewport);
    } catch (err) {
      console.error('Failed to load game module:', err);
      if (loadingEl) loadingEl.style.display = 'none';
      if (csEl) csEl.style.display = 'flex';
    }
  });

  onUnmount(() => {
    document.removeEventListener('playzy:progress', paintChips);
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

/* ── tiny site-level toast ── */
export function siteToast(message) {
  let host = document.querySelector('.site-toasts');
  if (!host) {
    host = document.createElement('div');
    host.className = 'site-toasts';
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = 'site-toast';
  el.textContent = message;
  host.appendChild(el);
  setTimeout(() => {
    el.classList.add('is-out');
    setTimeout(() => el.remove(), 320);
  }, 2200);
}
