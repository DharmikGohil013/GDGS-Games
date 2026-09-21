// ─── Navbar ───
// Search + theme switch + live progression chips that open the profile drawer.

import { setState } from '../store.js';
import { getResolvedTheme, toggleTheme, onThemeChange } from '../core/theme.js';
import { getCoins, getLevelInfo, getStreak, onProgressChange } from '../core/progress.js';
import { openProfileDrawer } from './profileDrawer.js';
import { onUnmount } from '../core/lifecycle.js';

const SUN = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const MOON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20.5 14.3A8.5 8.5 0 1 1 9.7 3.5a7 7 0 0 0 10.8 10.8z"/></svg>';
const COIN = '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="9" fill="#FFC93C"/><circle cx="12" cy="12" r="5.6" fill="none" stroke="#A8790A" stroke-width="1.6"/></svg>';

export function createNavbar() {
  const nav = document.createElement('div');
  nav.className = 'nav-outer';
  nav.innerHTML = `
    <nav class="nav" role="navigation" aria-label="Main navigation">
      <a href="#/" class="logo" id="playzy-logo">
        <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
          <rect x="2" y="8" width="20" height="10" rx="5" fill="#FF5F4D"/>
          <circle cx="8" cy="13" r="1.6" fill="#16171D"/>
          <circle cx="16" cy="11.4" r="1.3" fill="#16171D"/>
          <circle cx="18" cy="14.6" r="1.3" fill="#16171D"/>
        </svg>
        Playzy
      </a>

      <div class="search-bar" id="search-bar">
        <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="2"/>
          <line x1="13.5" y1="13.5" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <input type="text" id="search-input" placeholder="Search 1,000+ games..." autocomplete="off" aria-label="Search games" />
        <kbd class="search-kbd">Ctrl+K</kbd>
      </div>

      <div class="nav-spacer"></div>

      <div class="nav-actions">
        <button class="nav-chip" id="nav-coins" title="Your coins — earned from every run" aria-label="Your coins">
          ${COIN}<span id="nav-coin-value">0</span>
        </button>

        <button class="nav-chip nav-level" id="nav-level" title="Your level and daily missions" aria-label="Open your profile, missions and achievements">
          <span class="nav-level-ring" id="nav-level-ring"><b id="nav-level-value">1</b></span>
          <span class="nav-chip-label" id="nav-level-title">Newcomer</span>
        </button>

        <button class="icon-btn theme-toggle" id="theme-toggle" title="Switch theme" aria-label="Switch between dark and light theme"></button>
      </div>
    </nav>
  `;

  /* ── search ── */
  const input = nav.querySelector('#search-input');
  const searchBar = nav.querySelector('#search-bar');

  input.addEventListener('input', (e) => {
    setState({ searchQuery: e.target.value, visibleGames: 40 });
  });
  input.addEventListener('focus', () => {
    searchBar.classList.add('focused');
    setState({ searchOpen: true });
  });
  input.addEventListener('blur', () => {
    searchBar.classList.remove('focused');
    setTimeout(() => setState({ searchOpen: false }), 200);
  });

  function onShortcut(e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      input.focus();
      input.select();
    }
    if (e.key === 'Escape' && document.activeElement === input) {
      input.value = '';
      setState({ searchQuery: '', visibleGames: 40 });
      input.blur();
    }
  }
  document.addEventListener('keydown', onShortcut);

  /* ── theme ── */
  const themeBtn = nav.querySelector('#theme-toggle');
  function paintTheme() {
    const resolved = getResolvedTheme();
    themeBtn.innerHTML = resolved === 'dark' ? SUN : MOON;
    themeBtn.setAttribute('title', resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
  paintTheme();
  themeBtn.addEventListener('click', () => toggleTheme());
  const offTheme = onThemeChange(paintTheme);

  /* ── progression chips ── */
  const coinValue = nav.querySelector('#nav-coin-value');
  const coinChip = nav.querySelector('#nav-coins');
  const levelValue = nav.querySelector('#nav-level-value');
  const levelTitle = nav.querySelector('#nav-level-title');
  const levelRing = nav.querySelector('#nav-level-ring');

  let lastCoins = null;
  function paintProgress() {
    const coins = getCoins();
    const lvl = getLevelInfo();
    const streak = getStreak();

    coinValue.textContent = coins.toLocaleString();
    levelValue.textContent = lvl.level;
    levelTitle.textContent = streak.count > 1 ? `${streak.count}-day streak` : lvl.title;
    levelRing.style.setProperty('--lvl-pct', lvl.pct.toFixed(3));

    // Pulse the coin chip when the balance actually grows.
    if (lastCoins !== null && coins > lastCoins) {
      coinChip.classList.remove('is-bump');
      void coinChip.offsetWidth;
      coinChip.classList.add('is-bump');
    }
    lastCoins = coins;
  }
  paintProgress();
  const offProgress = onProgressChange(paintProgress);
  document.addEventListener('playzy:progress', paintProgress);

  coinChip.addEventListener('click', () => openProfileDrawer('missions'));
  nav.querySelector('#nav-level').addEventListener('click', () => openProfileDrawer('missions'));

  // main.js clears #app on every route change, so unhook the global listeners.
  onUnmount(() => {
    document.removeEventListener('keydown', onShortcut);
    document.removeEventListener('playzy:progress', paintProgress);
    offTheme();
    offProgress();
  });

  return nav;
}
