// ─── Game Grid Component ───
import { getState, setState, subscribe } from '../store.js';
import { games } from '../data/games.js';
import { searchGames, filterByCategory, sortGames } from '../utils/search.js';
import { createGameCard } from './gameCard.js';

export function createGameGrid() {
  const container = document.createElement('div');
  container.id = 'game-grid-container';

  function render() {
    const { activeCategory, searchQuery, visibleGames } = getState();

    // Filter and search
    let filtered = filterByCategory(games, activeCategory);
    if (searchQuery) {
      filtered = searchGames(filtered, searchQuery);
    }
    filtered = sortGames(filtered, 'popular');

    // Store filtered count
    const totalCount = filtered.length;
    const visible = filtered.slice(0, visibleGames);

    // Determine section title
    let sectionTitle = 'Trending now';
    if (searchQuery) {
      sectionTitle = `Search results for "${searchQuery}"`;
    } else if (activeCategory !== 'trending') {
      const catName = activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1);
      sectionTitle = `${catName} Games`;
    }

    container.innerHTML = '';

    // ── Main section ──
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

    const grid = document.createElement('div');
    grid.className = 'card-grid';
    grid.id = 'main-game-grid';

    visible.forEach((game) => {
      grid.appendChild(createGameCard(game));
    });

    section.appendChild(grid);

    // Load more button
    if (visibleGames < totalCount) {
      const loadMore = document.createElement('div');
      loadMore.className = 'load-more-wrap';
      loadMore.innerHTML = `
        <button class="load-more-btn" id="load-more-btn">
          Show more games (${(totalCount - visibleGames).toLocaleString()} remaining)
          <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M10 14L4 8h12L10 14z"/>
          </svg>
        </button>
      `;
      section.appendChild(loadMore);

      loadMore.querySelector('#load-more-btn').addEventListener('click', () => {
        setState({ visibleGames: visibleGames + 40 });
      });
    }

    container.appendChild(section);

    // ── "New this week" section (only on trending/home) ──
    if (!searchQuery && activeCategory === 'trending') {
      const newSection = document.createElement('section');
      newSection.className = 'section';
      newSection.setAttribute('aria-labelledby', 'new-this-week-heading');

      const newHead = document.createElement('div');
      newHead.className = 'section-head';
      newHead.innerHTML = `
        <h2 id="new-this-week-heading">New this week</h2>
        <a href="#" class="see-all-link" aria-label="See all new browser games this week">See all →</a>
      `;
      newSection.appendChild(newHead);

      const newGrid = document.createElement('div');
      newGrid.className = 'card-grid';

      // Show a different slice of games for "new this week"
      const newGames = games.slice(100, 108);
      newGames.forEach((game) => {
        newGrid.appendChild(createGameCard(game));
      });

      newSection.appendChild(newGrid);
      container.appendChild(newSection);

      // ── "Top Rated" section ──
      const topSection = document.createElement('section');
      topSection.className = 'section';
      topSection.setAttribute('aria-labelledby', 'top-rated-heading');

      const topHead = document.createElement('div');
      topHead.className = 'section-head';
      topHead.innerHTML = `
        <h2 id="top-rated-heading">Top Rated</h2>
        <a href="#" class="see-all-link" aria-label="See all top rated free browser games">See all →</a>
      `;
      topSection.appendChild(topHead);

      const topGrid = document.createElement('div');
      topGrid.className = 'card-grid';

      const topGames = sortGames([...games], 'rating').slice(0, 8);
      topGames.forEach((game) => {
        topGrid.appendChild(createGameCard(game));
      });

      topSection.appendChild(topGrid);
      container.appendChild(topSection);

      // ── "Popular in Puzzle" section ──
      const puzzleSection = document.createElement('section');
      puzzleSection.className = 'section';
      puzzleSection.setAttribute('aria-labelledby', 'popular-puzzle-heading');

      const puzzleHead = document.createElement('div');
      puzzleHead.className = 'section-head';
      puzzleHead.innerHTML = `
        <h2 id="popular-puzzle-heading">Popular in Puzzle</h2>
        <a href="#" class="see-all-link" aria-label="See all popular puzzle browser games">See all →</a>
      `;
      puzzleSection.appendChild(puzzleHead);

      const puzzleGrid = document.createElement('div');
      puzzleGrid.className = 'card-grid';

      const puzzleGames = filterByCategory(games, 'puzzle').slice(0, 4);
      puzzleGames.forEach((game) => {
        puzzleGrid.appendChild(createGameCard(game));
      });

      puzzleSection.appendChild(puzzleGrid);
      container.appendChild(puzzleSection);

      // ── "Racing Favorites" section ──
      const racingSection = document.createElement('section');
      racingSection.className = 'section';
      racingSection.setAttribute('aria-labelledby', 'racing-favorites-heading');

      const racingHead = document.createElement('div');
      racingHead.className = 'section-head';
      racingHead.innerHTML = `
        <h2 id="racing-favorites-heading">Racing Favorites</h2>
        <a href="#" class="see-all-link" aria-label="See all racing browser games">See all →</a>
      `;
      racingSection.appendChild(racingHead);

      const racingGrid = document.createElement('div');
      racingGrid.className = 'card-grid';

      const racingGames = filterByCategory(games, 'racing').slice(0, 4);
      racingGames.forEach((game) => {
        racingGrid.appendChild(createGameCard(game));
      });

      racingSection.appendChild(racingGrid);
      container.appendChild(racingSection);
    }

    // Trigger GSAP animations on new cards
    requestAnimationFrame(() => {
      animateCards();
    });
  }

  subscribe(() => render());
  render();

  return container;
}

function animateCards() {
  // Animate cards that haven't been animated yet
  if (typeof window.gsap !== 'undefined') {
    window.gsap.from('.game-card:not(.animated)', {
      y: 30,
      opacity: 0,
      duration: 0.4,
      stagger: 0.05,
      ease: 'power2.out',
      onComplete: function () {
        document.querySelectorAll('.game-card:not(.animated)').forEach((c) => c.classList.add('animated'));
      },
    });
  }
}
