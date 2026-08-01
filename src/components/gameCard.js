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
 * Create a single game card element with schema.org VideoGame microdata
 */
export function createGameCard(game) {
  const card = document.createElement('a');
  card.className = 'game-card';
  card.href = `#/play/${game.id}`;
  card.setAttribute('data-game-id', game.id);
  card.setAttribute('title', `Play ${game.title} free online — ${game.category} browser game`);
  card.setAttribute('aria-label', `Play ${game.title} — ${game.category} game, rated ${game.rating} out of 5 stars, ${game.plays} plays`);

  // Schema.org VideoGame microdata
  card.setAttribute('itemscope', '');
  card.setAttribute('itemtype', 'https://schema.org/VideoGame');
  card.setAttribute('itemprop', 'url');

  const bgColor = colorMap[game.color] || 'var(--coral)';
  const tag = tagColorMap[game.color] || tagColorMap.coral;
  const icon = getGameIcon(game.iconType, game.category);

  // Capitalize category
  const categoryLabel = game.category.charAt(0).toUpperCase() + game.category.slice(1);

  const artContent = game.image
    ? `<img src="${game.image}" alt="${game.title} — free ${categoryLabel} browser game thumbnail" class="card-thumb-img" itemprop="image" loading="lazy" decoding="async" />`
    : icon;

  card.innerHTML = `
    <div class="card-art" style="background:${bgColor}" role="img" aria-hidden="true">
      ${artContent}
    </div>
    <div class="card-body">
      <span class="card-tag" style="background:${tag.bg};color:${tag.text}"
            itemprop="genre">${categoryLabel}</span>
      <div class="card-title" itemprop="name">${game.title}</div>
      <div class="card-meta">
        <span itemprop="interactionStatistic" itemscope itemtype="https://schema.org/InteractionCounter">
          <meta itemprop="interactionType" content="https://schema.org/PlayAction">
          <span itemprop="userInteractionCount" content="${game.plays}">${game.plays} plays</span>
        </span>
        <span class="rating" itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating">
          ★ <span itemprop="ratingValue">${game.rating}</span>
          <meta itemprop="bestRating" content="5">
          <meta itemprop="ratingCount" content="1000">
        </span>
      </div>
      <!-- Hidden SEO metadata -->
      <meta itemprop="gamePlatform" content="Web Browser">
      <meta itemprop="applicationCategory" content="Game">
      <meta itemprop="operatingSystem" content="Any">
      <link itemprop="offers" href="https://schema.org/InStock">
    </div>
  `;

  // Click to open game page
  card.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.hash = `#/play/${game.id}`;
  });

  return card;
}

