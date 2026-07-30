// ─── Category Bar Component ───
import { getState, setState, subscribe } from '../store.js';
import { categories } from '../data/categories.js';

export function createCategories() {
  const row = document.createElement('div');
  row.className = 'cat-row';
  row.setAttribute('role', 'tablist');
  row.setAttribute('aria-label', 'Game categories');

  function render() {
    const { activeCategory } = getState();

    row.innerHTML = categories
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
      .join('');
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

  subscribe(() => render());
  render();

  return row;
}
