// ─── Game Modal Component ───
import { getState, setState, subscribe } from '../store.js';

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

let currentGameModule = null;

export function createGameModal() {
  const overlay = document.createElement('div');
  overlay.className = 'game-modal-overlay';
  overlay.id = 'game-modal-overlay';

  overlay.innerHTML = `
    <div class="game-modal" id="game-modal" role="dialog" aria-modal="true" aria-label="Game player">
      <div class="game-modal-header">
        <div class="game-modal-title-wrap">
          <h3 class="game-modal-title" id="game-modal-title">Game</h3>
          <span class="game-modal-badge" id="game-modal-badge">Playable</span>
        </div>
        <div class="game-modal-actions">
          <button class="game-modal-btn" id="game-fullscreen-btn" title="Toggle fullscreen" aria-label="Toggle fullscreen">
            <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="game-modal-btn game-modal-close" id="game-close-btn" title="Close game" aria-label="Close game">
            <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M5 5l10 10M15 5L5 15" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="game-modal-canvas" id="game-modal-canvas">
        <div class="game-modal-loading" id="game-loading">
          <div class="game-loader"></div>
          <p>Loading game...</p>
        </div>
        <div class="game-modal-not-playable" id="game-not-playable" style="display:none;">
          <svg viewBox="0 0 80 80" width="64" height="64" aria-hidden="true">
            <circle cx="40" cy="40" r="38" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
            <path d="M32 24 L58 40 L32 56 Z" fill="rgba(255,255,255,0.3)"/>
          </svg>
          <h3>Coming Soon!</h3>
          <p>This game is being prepared for you.<br>Check back soon for an amazing experience!</p>
          <button class="btn-primary game-modal-back-btn" id="game-back-btn">← Browse more games</button>
        </div>
      </div>
    </div>
  `;

  // Close handlers
  const closeBtn = overlay.querySelector('#game-close-btn');
  const backBtn = overlay.querySelector('#game-back-btn');

  function closeModal() {
    destroyCurrentGame();
    setState({ gameModal: { open: false, game: null } });
  }

  closeBtn.addEventListener('click', closeModal);
  backBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && getState().gameModal.open) {
      closeModal();
    }
  });

  // Fullscreen
  const fsBtn = overlay.querySelector('#game-fullscreen-btn');
  fsBtn.addEventListener('click', () => {
    const modal = overlay.querySelector('#game-modal');
    if (!document.fullscreenElement) {
      modal.requestFullscreen?.() || modal.webkitRequestFullscreen?.();
    } else {
      document.exitFullscreen?.() || document.webkitExitFullscreen?.();
    }
  });

  // React to state changes
  subscribe(async (state) => {
    const { open, game } = state.gameModal;

    if (open) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';

      if (game) {
        overlay.querySelector('#game-modal-title').textContent = game.title;

        if (game.isPlayable && gameModules[game.id]) {
          overlay.querySelector('#game-loading').style.display = 'flex';
          overlay.querySelector('#game-not-playable').style.display = 'none';
          overlay.querySelector('#game-modal-badge').textContent = 'Playable';
          overlay.querySelector('#game-modal-badge').className = 'game-modal-badge playable';

          try {
            const module = await gameModules[game.id]();
            const canvas = overlay.querySelector('#game-modal-canvas');

            overlay.querySelector('#game-loading').style.display = 'none';
            currentGameModule = module;
            module.initGame(canvas);
          } catch (err) {
            console.error('Failed to load game:', err);
            overlay.querySelector('#game-loading').style.display = 'none';
            overlay.querySelector('#game-not-playable').style.display = 'flex';
            overlay.querySelector('#game-not-playable').querySelector('h3').textContent = 'Failed to load';
            overlay.querySelector('#game-not-playable').querySelector('p').textContent = 'There was an error loading this game. Please try again.';
          }
        } else {
          overlay.querySelector('#game-loading').style.display = 'none';
          overlay.querySelector('#game-not-playable').style.display = 'flex';
          overlay.querySelector('#game-modal-badge').textContent = 'Coming Soon';
          overlay.querySelector('#game-modal-badge').className = 'game-modal-badge coming-soon';
        }
      }
    } else {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  return overlay;
}

function destroyCurrentGame() {
  if (currentGameModule && typeof currentGameModule.destroyGame === 'function') {
    try {
      currentGameModule.destroyGame();
    } catch (e) {
      console.warn('Error destroying game:', e);
    }
    currentGameModule = null;
  }

  // Also clean up any remaining canvases in the modal
  const canvas = document.querySelector('#game-modal-canvas');
  if (canvas) {
    const gameElements = canvas.querySelectorAll('canvas, .game-container');
    gameElements.forEach((el) => el.remove());
  }
}
