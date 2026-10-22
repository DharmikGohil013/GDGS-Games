// ─── Stats Bar ───
// Catalogue numbers for new visitors; once someone has played, the last tile
// switches to their own progress so the homepage reflects them back.

import { getTotals, getLevelInfo, getCoins } from '../core/progress.js';
import { games } from '../data/games.js';

export function createStatsBar() {
  const outer = document.createElement('div');
  outer.className = 'stats-outer';
  outer.id = 'stats-section';

  const totals = getTotals();
  const hasPlayed = (totals.runs || 0) > 0;
  const lvl = getLevelInfo();

  const personalTile = hasPlayed
    ? `<div class="stat">
         <b>${getCoins().toLocaleString()}</b>
         <span>Your coins · level ${lvl.level}</span>
       </div>`
    : `<div class="stat">
         <b>Free</b>
         <span>Play in your browser</span>
       </div>`;

  outer.innerHTML = `
    <div class="stats">
      <div class="stat"><b>${games.filter((game) => game.isPlayable).length}</b><span>Games you can play</span></div>
      <div class="stat"><b>No</b><span>Download required</span></div>
      <div class="stat"><b>Free</b><span>To play</span></div>
      ${personalTile}
    </div>
  `;

  let animated = false;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !animated) {
        animated = true;
        animateCounters(outer);
        observer.disconnect();
      }
    });
  }, { threshold: 0.3 });

  requestAnimationFrame(() => observer.observe(outer));

  return outer;
}

function animateCounters(container) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  container.querySelectorAll('.counter').forEach((counter) => {
    const target = parseInt(counter.dataset.target, 10);
    const suffix = counter.dataset.suffix || '+';
    const format = (n) => (target >= 1000 ? n.toLocaleString() : String(n)) + suffix;

    if (prefersReduced) {
      counter.textContent = format(target);
      return;
    }

    const duration = 1600;
    const start = performance.now();

    function update(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      counter.textContent = format(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  });
}
