// ─── Game Grid ───
// Filtered catalogue plus curated rails. The "Jump back in" rail is driven by
// the player's own history, so the homepage changes as they play.

import { getState, setState, subscribe } from '../store.js';
import { games } from '../data/games.js';
import { searchGames, filterByCategory, sortGames } from '../utils/search.js';
import { createGameCard } from './gameCard.js';
import { getProfile } from '../core/progress.js';
import { onUnmount } from '../core/lifecycle.js';

export function createGameGrid() {
  const container = document.createElement('div');
  container.id = 'game-grid-container';

  /** Build one titled rail of cards. */
  function rail({ id, title, items, link, cardOpts }) {
    if (!items.length) return null;

    const section = document.createElement('section');
    section.className = 'section';
    section.setAttribute('aria-labelledby', id);

    const head = document.createElement('div');
    head.className = 'section-head';
    head.innerHTML = `
      <h2 id="${id}">${title}</h2>
      ${link ? `<a href="${link.href}" class="see-all-link">${link.label} →</a>` : ''}
    `;
    section.appendChild(head);

    const grid = document.createElement('div');
    grid.className = 'card-grid';
    items.forEach((g) => grid.appendChild(createGameCard(g, cardOpts)));
    section.appendChild(grid);

    return section;
  }

  function render() {
    const { activeCategory, searchQuery, visibleGames } = getState();

    let filtered = filterByCategory(games, activeCategory);
    if (searchQuery) filtered = searchGames(filtered, searchQuery);
    filtered = sortGames(filtered, 'popular');

    const totalCount = filtered.length;
    const visible = filtered.slice(0, visibleGames);

    let sectionTitle = 'Trending now';
    if (searchQuery) sectionTitle = `Search results for "${searchQuery}"`;
    else if (activeCategory !== 'trending') {
      sectionTitle = `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Games`;
    }

    container.innerHTML = '';

    // ── Jump back in (personalised) ──
    const isHome = !searchQuery && activeCategory === 'trending';
    if (isHome) {
      const profile = getProfile();
      const recent = Object.entries(profile.games)
        .sort((a, b) => (b[1].lastPlayed || 0) - (a[1].lastPlayed || 0))
        .slice(0, 4)
        .map(([gid]) => games.find((g) => g.id === gid))
        .filter(Boolean);

      const jumpBack = rail({
        id: 'jump-back-heading',
        title: '▶ Jump back in',
        items: recent,
      });
      if (jumpBack) container.appendChild(jumpBack);
    }

    // ── Main results ──
    const section = document.createElement('section');
    section.className = 'section';
    section.setAttribute('aria-labelledby', 'game-grid-heading');

    const head = document.createElement('div');
    head.className = 'section-head';
    head.innerHTML = `
      <h2 id="game-grid-heading">${sectionTitle}</h2>
      <span class="game-count" aria-label="${totalCount.toLocaleString()} games available">${totalCount.toLocaleString()} games</span>
    `;
    section.appendChild(head);

    if (!visible.length) {
      const empty = document.createElement('div');
      empty.className = 'drawer-empty';
      empty.innerHTML = `No games match "<strong>${searchQuery}</strong>".<br>Try a different search or pick a category.`;
      section.appendChild(empty);
    } else {
      const grid = document.createElement('div');
      grid.className = 'card-grid';
      grid.id = 'main-game-grid';
      visible.forEach((game) => grid.appendChild(createGameCard(game)));
      section.appendChild(grid);
    }

    if (visibleGames < totalCount) {
      const loadMore = document.createElement('div');
      loadMore.className = 'load-more-wrap';
      loadMore.innerHTML = `
        <button class="load-more-btn" id="load-more-btn">
          Show more games (${(totalCount - visibleGames).toLocaleString()} remaining)
          <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M10 14L4 8h12L10 14z"/></svg>
        </button>
      `;
      section.appendChild(loadMore);
      loadMore.querySelector('#load-more-btn').addEventListener('click', () => {
        setState({ visibleGames: visibleGames + 40 });
      });
    }

    container.appendChild(section);

    // ── Curated rails (home only) ──
    if (isHome) {
      const playable = games.filter((g) => g.isPlayable);

      [
        rail({
          id: 'hot-games-heading',
          title: '🔥 Play instantly',
          items: playable.slice(0, 8),
          link: { href: '#/', label: 'See all' },
        }),
        rail({
          id: 'new-this-week-heading',
          title: 'New this week',
          items: games.slice(100, 108),
          cardOpts: { isNew: true },
        }),
        rail({
          id: 'top-rated-heading',
          title: 'Top rated',
          items: sortGames([...games], 'rating').slice(0, 8),
        }),
        rail({
          id: 'popular-puzzle-heading',
          title: 'Popular in Puzzle',
          items: filterByCategory(games, 'puzzle').slice(0, 4),
        }),
        rail({
          id: 'racing-favorites-heading',
          title: 'Racing favourites',
          items: filterByCategory(games, 'racing').slice(0, 4),
        }),
      ].forEach((s) => { if (s) container.appendChild(s); });
    }

    requestAnimationFrame(animateCards);
  }

  const unsubscribe = subscribe(() => render());
  render();

  // Cards show personal bests, so repaint when a run is banked.
  const onProgress = () => render();
  document.addEventListener('playzy:progress', onProgress);

  onUnmount(() => {
    unsubscribe();
    document.removeEventListener('playzy:progress', onProgress);
  });

  return container;
}

function animateCards() {
  if (typeof window.gsap === 'undefined') return;
  window.gsap.from('.game-card:not(.animated)', {
    y: 24,
    opacity: 0,
    duration: 0.4,
    stagger: 0.04,
    ease: 'power2.out',
    onComplete() {
      document.querySelectorAll('.game-card:not(.animated)').forEach((c) => c.classList.add('animated'));
    },
  });
}
