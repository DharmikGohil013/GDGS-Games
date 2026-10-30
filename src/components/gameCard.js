// ─── Game Card ───
// Renders a catalogue card and the personal-best ribbon for played games.

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
  if (opts.discovery) card.classList.add(`game-card--${opts.layout || 'compact'}`);
  card.href = game.url || (game.isPlayable ? `/games/${game.id}/` : `#/play/${game.id}`);
  card.setAttribute('data-game-id', game.id);
  card.setAttribute('data-accent', game.color || 'purple');
  card.setAttribute('title', `Play ${game.title} free online — ${game.category} browser game`);
  card.setAttribute('aria-label', `Play ${game.title} — ${game.category} game, ${game.isPlayable ? 'playable now' : 'coming soon'}`);

  const bg = colorMap[game.color] || colorMap.purple;
  const tag = tagColorMap[game.color] || tagColorMap.purple;
  const icon = getGameIcon(game.iconType, game.category);
  const categoryLabel = game.category.charAt(0).toUpperCase() + game.category.slice(1);

  const artContent = game.image
      ? `<img src="${game.image}" alt="${game.title} — free ${categoryLabel} browser game thumbnail" class="card-thumb-img" loading="lazy" decoding="async" />`
    : `<span class="card-icon-float">${icon}</span>`;

  const badges = [];
  if (game.isHot) badges.push('<span class="card-badge card-badge-hot">Featured</span>');
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
      ${game.previewFrames?.length ? `<span class="card-preview-count" aria-hidden="true">+${game.previewFrames.length} gameplay views</span>` : ''}
      ${bestRibbon}
      <span class="card-play"><span>${PLAY_ICON}</span></span>
    </div>
    <div class="card-body">
      <span class="card-tag" style="background:${tag.bg};color:${tag.text}">${categoryLabel}</span>
      <div class="card-title">${game.title}</div>
      ${opts.description ? `<p class="card-description">${opts.description}</p>` : ''}
      <div class="card-meta">
        ${game.isNew ? `<span class="card-new">New</span><span>${game.metaNote || ''}</span>` :
          `<span>${game.isPlayable ? 'Playable now' : 'Coming soon'}</span>`}
      </div>
      ${opts.discovery ? `<span class="card-launch" aria-hidden="true">${PLAY_ICON}<span>Play now</span></span>` : ''}
    </div>
  `;

  card.addEventListener('click', (e) => {
    e.preventDefault();
    if (game.isPlayable) window.location.assign(game.url || `/games/${game.id}/`);
    else window.location.hash = `#/play/${game.id}`;
  });

  // Only capture-backed galleries opt in. Preload after intent and keep the
  // original thumbnail in place until the next frame has loaded successfully.
  if (game.image && game.previewFrames?.length) {
    const thumb = card.querySelector('.card-thumb-img');
    const frames = [game.image, ...game.previewFrames];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer = null;
    let frameIndex = 0;
    let active = false;

    const showFrame = (index) => {
      const next = new Image();
      next.onload = () => {
        if (active && frameIndex === index) thumb.src = frames[index];
      };
      next.src = frames[index];
    };
    const startPreview = () => {
      if (active || reducedMotion.matches) return;
      active = true;
      frameIndex = 1;
      showFrame(frameIndex);
      timer = window.setInterval(() => {
        if (!card.isConnected) { stopPreview(); return; }
        frameIndex = (frameIndex + 1) % frames.length;
        showFrame(frameIndex);
      }, 1500);
    };
    const stopPreview = () => {
      active = false;
      window.clearInterval(timer);
      timer = null;
      frameIndex = 0;
      thumb.src = game.image;
    };
    card.addEventListener('pointerenter', startPreview);
    card.addEventListener('pointerleave', stopPreview);
    card.addEventListener('focus', startPreview);
    card.addEventListener('blur', stopPreview);
  }

  return card;
}
