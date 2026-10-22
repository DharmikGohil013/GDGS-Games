// ─── Category Bar Component ───
import { getState, setState, subscribe } from '../store.js';
import { categories } from '../data/categories.js';
import { games } from '../data/games.js';

export function createCategories() {
  const row = document.createElement('div');
  row.className = 'cat-row';
  row.setAttribute('role', 'group');
  row.setAttribute('aria-label', 'Game categories');

  const primaryCategories = ['trending', 'puzzle', 'racing', 'runner', 'arcade', 'sports'];

  function render() {
    const { activeCategory } = getState();

    const available = new Set(games.map((game) => game.category));
    const primary = categories.filter((cat) => (cat.id === 'trending' || available.has(cat.id)) && primaryCategories.includes(cat.id));
    const more = categories.filter((cat) => available.has(cat.id) && !primaryCategories.includes(cat.id));
    const isMoreActive = more.some((cat) => cat.id === activeCategory);

    row.innerHTML = primary
      .map(
        (cat) => `
        <button
          class="cat-btn${cat.id === activeCategory ? ' active' : ''}"
          data-category="${cat.id}"
          role="tab"
          aria-selected="${cat.id === activeCategory}"
          id="cat-${cat.id}"
        >${cat.name}</button>
      `
      )
      .join('') + `
      <label class="cat-more-label">
        <span class="sr-only">More game categories</span>
        <select class="cat-more${isMoreActive ? ' active' : ''}" aria-label="More game categories">
          <option value="" ${isMoreActive ? '' : 'selected'}>More</option>
          ${more.map((cat) => `<option value="${cat.id}" ${cat.id === activeCategory ? 'selected' : ''}>${cat.name}</option>`).join('')}
        </select>
      </label>`;
  }

  row.addEventListener('click', (e) => {
    const btn = e.target.closest('.cat-btn');
    if (!btn) return;

    const category = btn.dataset.category;
    setState({ activeCategory: category, visibleGames: 40, searchQuery: '' });

    // Clear search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';

    // Smooth scroll to content
    const section = document.querySelector('.section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  row.addEventListener('change', (e) => {
    if (!e.target.matches('.cat-more')) return;
    if (!e.target.value) return;
    setState({ activeCategory: e.target.value, visibleGames: 40, searchQuery: '' });
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    document.querySelector('.section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  subscribe(() => render());
  render();

  return row;
}
