// ─── Navbar Component ───
import { getState, setState, subscribe } from '../store.js';

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
        <input
          type="text"
          id="search-input"
          placeholder="Search 1,000+ games..."
          autocomplete="off"
          aria-label="Search games"
        />
        <kbd class="search-kbd">Ctrl+K</kbd>
      </div>
      <div class="nav-spacer"></div>
    </nav>
  `;

  // Search functionality
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

  // Ctrl+K shortcut
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      input.focus();
    }
    if (e.key === 'Escape' && document.activeElement === input) {
      input.blur();
      setState({ searchQuery: '' });
      input.value = '';
    }
  });

  // Sync with store
  subscribe((state) => {
    if (input.value !== state.searchQuery) {
      input.value = state.searchQuery;
    }
  });

  return nav;
}
