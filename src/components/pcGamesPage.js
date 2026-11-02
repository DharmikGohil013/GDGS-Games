import { games } from '../data/games.js';
import { createGameCard } from './gameCard.js';

const featuredIds = [
  'apex-velocity', 'turbo-drift', 'voxelcraft', 'infinite-world',
  'hextris', 'block-merge', 'neon-snake', 'infinite-runner',
];

export function createPcGamesPage() {
  const page = document.createElement('main');
  page.className = 'wrap pc-games-page';
  page.id = 'main-content';
  page.innerHTML = `
    <header class="pc-games-intro">
      <p class="pc-games-eyebrow">PLAY IN YOUR BROWSER</p>
      <h1>Free PC games to play online</h1>
      <p>Explore free games for PC and laptop browsers on Playzy. Pick a racing game, puzzle, arcade challenge or building adventure and start playing online without downloading or installing a game.</p>
    </header>
    <section class="section" aria-labelledby="pc-games-list-heading">
      <div class="section-head"><h2 id="pc-games-list-heading">PC browser games</h2></div>
      <div class="card-grid" id="pc-games-list"></div>
    </section>
    <section class="pc-games-info" aria-labelledby="pc-games-info-heading">
      <h2 id="pc-games-info-heading">What can I play on PC?</h2>
      <p>Try <a href="/games/apex-velocity/">Apex Velocity</a> or <a href="/games/turbo-drift/">Turbo Drift</a> for car racing, <a href="/games/hextris/">Hextris Stack</a> for a quick puzzle, or <a href="/games/voxelcraft/">VoxelCraft</a> for survival and building. <a href="/games/infinite-world/">Infinite World</a> lets you build a city alone or with a friend.</p>
      <p>These are browser games, so you can open a game page on a PC without a Windows installer, APK, or game store account. Each game page explains its controls; some games work best with a keyboard and mouse.</p>
    </section>
  `;

  const list = page.querySelector('#pc-games-list');
  featuredIds.forEach((id) => {
    const game = games.find((item) => item.id === id && item.isPlayable);
    if (game) list.appendChild(createGameCard(game));
  });
  return page;
}
