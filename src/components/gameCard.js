// ─── Game Card Component ───
import { getGameIcon } from '../utils/icons.js';
import { setState } from '../store.js';

// Color map from variable names to CSS values
const colorMap = {
  coral: 'var(--coral)',
  blue: 'var(--blue)',
  green: 'var(--green)',
  purple: 'var(--purple)',
  gold: 'var(--gold)',
};

const tagColorMap = {
  coral: { bg: 'rgba(255,95,77,0.14)', text: 'var(--coral-dark)' },
  blue: { bg: 'rgba(62,107,255,0.12)', text: 'var(--blue-dark)' },
  green: { bg: 'rgba(31,201,139,0.14)', text: 'var(--green-dark)' },
  purple: { bg: 'rgba(139,92,246,0.14)', text: 'var(--purple-dark)' },
  gold: { bg: 'rgba(255,201,60,0.16)', text: 'var(--gold-dark)' },
};

/**
 * Create a single game card element
 */
export function createGameCard(game) {
  const card = document.createElement('a');
  card.className = 'game-card';
  card.href = `#/play/${game.id}`;
  card.setAttribute('data-game-id', game.id);
  card.setAttribute('aria-label', `Play ${game.title} - ${game.category} game, rated ${game.rating} stars`);

  const bgColor = colorMap[game.color] || 'var(--coral)';
  const tag = tagColorMap[game.color] || tagColorMap.coral;
  const icon = getGameIcon(game.iconType, game.category);

  // Capitalize category
  const categoryLabel = game.category.charAt(0).toUpperCase() + game.category.slice(1);

  const artContent = game.image
    ? `<img src="${game.image}" alt="${game.title}" class="card-thumb-img" />`
    : icon;

  card.innerHTML = `
    <div class="card-art" style="background:${bgColor}">
      ${artContent}
    </div>
    <div class="card-body">
      <span class="card-tag" style="background:${tag.bg};color:${tag.text}">${categoryLabel}</span>
      <div class="card-title">${game.title}</div>
      <div class="card-meta">
        <span>${game.plays} plays</span>
        <span class="rating">★ ${game.rating}</span>
      </div>
    </div>
  `;

  // Click to open game page
  card.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.hash = `#/play/${game.id}`;
  });

  return card;
}
