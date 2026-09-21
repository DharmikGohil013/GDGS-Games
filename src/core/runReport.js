// ─── Meta bridge for games that own their HUD ───
// The five hand-built games (gravity-switch, hextris, city-sprint, color-switch,
// infinite-runner) keep their in-canvas presentation and call reportRun() once
// per finished run. They get coins, XP, missions and achievements without their
// game loops being rewritten around the shared shell.

import { submitRun } from './progress.js';
import { sfx } from './audio.js';

let activeCard = null;
let hideTimer = null;

/**
 * Bank a finished run and slide a reward summary over the game.
 * @param {HTMLElement} container element to mount the card into (the viewport)
 * @param {string} gameId
 * @param {object} run { score, coins, combo, duration, powerups, perfects, distance }
 * @returns {object} the submitRun result
 */
export function reportRun(container, gameId, run = {}) {
  const result = submitRun(gameId, run);
  try {
    showCard(container, result);
  } catch (e) { /* the reward card is cosmetic — never break the game over it */ }
  document.dispatchEvent(new CustomEvent('playzy:progress'));
  return result;
}

function showCard(container, result) {
  if (!container) return;
  dismissCard();

  const rows = [];
  rows.push(`<div class="rr-row"><span>Coins earned</span><b>+${result.coinsEarned.toLocaleString()}</b></div>`);
  rows.push(`<div class="rr-row"><span>XP gained</span><b>+${result.xpGained.toLocaleString()}</b></div>`);
  if (result.isHighScore) {
    rows.push(`<div class="rr-row rr-row-hot"><span>New personal best</span><b>${result.best.toLocaleString()}</b></div>`);
  }
  if (result.levels > 0) {
    rows.push(`<div class="rr-row rr-row-hot"><span>Level up</span><b>Lv ${result.level}</b></div>`);
  }
  result.missionsCompleted.forEach((m) => {
    rows.push(`<div class="rr-row rr-row-good"><span>✅ ${m.label}</span><b>+${m.coins}</b></div>`);
  });
  result.achievementsUnlocked.forEach((a) => {
    rows.push(`<div class="rr-row rr-row-good"><span>${a.icon} ${a.name}</span><b>+${a.coins}</b></div>`);
  });

  const card = document.createElement('div');
  card.className = 'rr-card';
  card.setAttribute('role', 'status');
  card.innerHTML = `
    <div class="rr-head">
      <span>Run banked</span>
      <button class="rr-close" aria-label="Dismiss rewards">×</button>
    </div>
    <div class="rr-rows">${rows.join('')}</div>
    <a class="rr-cta" href="#/">See all games</a>
  `;

  container.appendChild(card);
  activeCard = card;

  card.querySelector('.rr-close').addEventListener('click', dismissCard);
  requestAnimationFrame(() => card.classList.add('is-in'));

  if (result.levels > 0) sfx.levelUp();
  else if (result.missionsCompleted.length || result.achievementsUnlocked.length) sfx.reward();

  // Keep it up longer when there is more to read.
  const dwell = 4200 + rows.length * 700;
  hideTimer = setTimeout(dismissCard, dwell);
}

export function dismissCard() {
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  if (!activeCard) return;
  const card = activeCard;
  activeCard = null;
  card.classList.remove('is-in');
  setTimeout(() => card.remove(), 320);
}
