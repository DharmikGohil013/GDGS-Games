// ─── Game Card ───
// Keeps the schema.org VideoGame microdata and adds the personal-best ribbon
// that appears once the visitor has actually played the game.

import { getGameIcon } from '../utils/icons.js';
import { getGameStats } from '../core/progress.js';

const colorMap = {
  coral: 'linear-gradient(140deg, #FF7A62, #D6432F)',
  blue: 'linear-gradient(140deg, #5B84FF, #2245C7)',
  green: 'linear-gradient(140deg, #35DCA0, #0E8F62)',
  purple: 'linear-gradient(140deg, #A78BFA, #6A34E0)',
  gold: 'linear-gradient(140deg, #FFD968, #C9930F)',
};

const tagColorMap = {
  coral: { bg: 'color-mix(in srgb, var(--coral) 16%, transparent)', text: 'var(--coral)' },
  blue: { bg: 'color-mix(in srgb, var(--blue) 16%, transparent)', text: 'var(--blue)' },
  green: { bg: 'color-mix(in srgb, var(--green) 16%, transparent)', text: 'var(--green)' },
  purple: { bg: 'color-mix(in srgb, var(--purple) 16%, transparent)', text: 'var(--purple)' },
  gold: { bg: 'color-mix(in srgb, var(--gold) 18%, transparent)', text: 'var(--gold-dark)' },
};

const PLAY_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';

export function createGameCard(game, opts = {}) {
  const card = document.createElement('a');
  card.className = 'game-card';
  card.href = `#/play/${game.id}`;
  card.setAttribute('data-game-id', game.id);
  card.setAttribute('data-accent', game.color || 'purple');
  card.setAttribute('title', `Play ${game.title} free online — ${game.category} browser game`);
  card.setAttribute('aria-label', `Play ${game.title} — ${game.category} game, rated ${game.rating} out of 5 stars, ${game.plays} plays`);

  card.setAttribute('itemscope', '');
  card.setAttribute('itemtype', 'https://schema.org/VideoGame');
  card.setAttribute('itemprop', 'url');

  const bg = colorMap[game.color] || colorMap.purple;
  const tag = tagColorMap[game.color] || tagColorMap.purple;
  const icon = getGameIcon(game.iconType, game.category);
  const categoryLabel = game.category.charAt(0).toUpperCase() + game.category.slice(1);

  const artContent = game.image
    ? `<img src="${game.image}" alt="${game.title} — free ${categoryLabel} browser game thumbnail" class="card-thumb-img" itemprop="image" loading="lazy" decoding="async" />`
    : `<span class="card-icon-float">${icon}</span>`;

  const badges = [];
  if (game.isHot) badges.push('<span class="card-badge card-badge-hot">🔥 Hot</span>');
  if (opts.isNew) badges.push('<span class="card-badge card-badge-new">New</span>');
  else if (game.isPlayable && !game.isHot) badges.push('<span class="card-badge card-badge-play">▶ Playable</span>');

  // Only playable games have real stats worth surfacing.
  const stats = game.isPlayable ? getGameStats(game.id) : null;
  const bestRibbon = stats && stats.best > 0
    ? `<span class="card-best">🏆 ${stats.best.toLocaleString()}</span>`
    : '';

  card.innerHTML = `
    <div class="card-art" style="background:${bg}" role="img" aria-hidden="true">
      ${badges.join('')}
      ${artContent}
      ${bestRibbon}
      <span class="card-play"><span>${PLAY_ICON}</span></span>
    </div>
    <div class="card-body">
      <span class="card-tag" style="background:${tag.bg};color:${tag.text}" itemprop="genre">${categoryLabel}</span>
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
      <meta itemprop="gamePlatform" content="Web Browser">
      <meta itemprop="applicationCategory" content="Game">
      <meta itemprop="operatingSystem" content="Any">
      <link itemprop="offers" href="https://schema.org/InStock">
    </div>
  `;

  card.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.hash = `#/play/${game.id}`;
  });

  return card;
}
