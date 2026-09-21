// ─── Profile drawer ───
// Level, lifetime stats, daily missions, achievements and per-game bests.
// Mounted once on <body> and reused, so route changes never lose it.

import {
  getProfile, getLevelInfo, getCoins, getStreak, getMissions,
  claimMission, getAchievements, getTotals, resetProfile,
} from '../core/progress.js';
import { games } from '../data/games.js';
import { sfx } from '../core/audio.js';

let scrim = null;
let drawer = null;
let activeTab = 'missions';

function ensureMounted() {
  if (drawer) return;

  scrim = document.createElement('div');
  scrim.className = 'drawer-scrim';
  scrim.addEventListener('click', closeProfileDrawer);

  drawer = document.createElement('aside');
  drawer.className = 'drawer';
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-label', 'Your Playzy profile');
  drawer.innerHTML = `
    <div class="drawer-head">
      <h2>Your progress</h2>
      <button class="icon-btn" id="drawer-close" aria-label="Close profile">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
          <line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>
        </svg>
      </button>
    </div>
    <div class="drawer-body" id="drawer-body"></div>
  `;

  drawer.querySelector('#drawer-close').addEventListener('click', closeProfileDrawer);

  document.body.appendChild(scrim);
  document.body.appendChild(drawer);

  // Any in-app link inside the drawer should also dismiss it.
  drawer.addEventListener('click', (e) => {
    if (e.target.closest('a[href^="#/"]')) closeProfileDrawer();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeProfileDrawer();
  });
  document.addEventListener('playzy:progress', () => {
    if (drawer.classList.contains('is-open')) render();
  });
}

export function openProfileDrawer(tab) {
  ensureMounted();
  if (tab) activeTab = tab;
  render();
  scrim.classList.add('is-open');
  drawer.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  sfx.ui();
}

export function closeProfileDrawer() {
  if (!drawer) return;
  scrim.classList.remove('is-open');
  drawer.classList.remove('is-open');
  document.body.style.overflow = '';
  sfx.uiBack();
}

/* ───────────────────────── rendering ───────────────────────── */

function render() {
  const body = drawer.querySelector('#drawer-body');
  const lvl = getLevelInfo();
  const streak = getStreak();
  const totals = getTotals();
  const profile = getProfile();
  const gamesPlayed = Object.keys(profile.games).length;

  body.innerHTML = `
    <div class="profile-hero">
      <div class="profile-level">${lvl.level}</div>
      <div class="profile-title">${lvl.title}</div>
      <div class="profile-xp-track"><i style="width:${(lvl.pct * 100).toFixed(1)}%"></i></div>
      <div class="profile-xp-label">${lvl.xp.toLocaleString()} / ${lvl.need.toLocaleString()} XP to level ${lvl.level + 1}</div>
    </div>

    <div class="profile-stats">
      <div class="profile-stat"><b>${getCoins().toLocaleString()}</b><span>Coins</span></div>
      <div class="profile-stat"><b>${(totals.runs || 0).toLocaleString()}</b><span>Runs</span></div>
      <div class="profile-stat"><b>${streak.count}</b><span>Day streak</span></div>
      <div class="profile-stat"><b>${(totals.score || 0).toLocaleString()}</b><span>Points</span></div>
      <div class="profile-stat"><b>${totals.combo || 0}x</b><span>Best combo</span></div>
      <div class="profile-stat"><b>${gamesPlayed}</b><span>Games tried</span></div>
    </div>

    <div class="drawer-tabs" role="tablist">
      <button class="drawer-tab ${activeTab === 'missions' ? 'is-active' : ''}" data-tab="missions" role="tab">Missions</button>
      <button class="drawer-tab ${activeTab === 'awards' ? 'is-active' : ''}" data-tab="awards" role="tab">Awards</button>
      <button class="drawer-tab ${activeTab === 'scores' ? 'is-active' : ''}" data-tab="scores" role="tab">Scores</button>
    </div>

    <div id="drawer-tab-panel">${renderTab()}</div>
  `;

  body.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      sfx.ui();
      render();
    });
  });

  body.querySelectorAll('[data-claim]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const res = claimMission(btn.dataset.claim);
      if (res) {
        sfx.reward();
        render();
        document.dispatchEvent(new CustomEvent('playzy:progress'));
      }
    });
  });

  const resetBtn = body.querySelector('#drawer-reset');
  resetBtn?.addEventListener('click', () => {
    if (confirm('Reset all Playzy progress? Coins, levels, high scores and awards will be erased. This cannot be undone.')) {
      resetProfile();
      render();
      document.dispatchEvent(new CustomEvent('playzy:progress'));
    }
  });
}

function renderTab() {
  if (activeTab === 'missions') return renderMissions();
  if (activeTab === 'awards') return renderAwards();
  return renderScores();
}

function renderMissions() {
  const missions = getMissions();
  const streak = getStreak();

  const cards = missions.map((m) => `
    <div class="mission-card ${m.done ? 'is-done' : ''}">
      <div class="mission-card-top">
        <span>${m.label}</span>
        <b>${Math.min(m.progress, m.target).toLocaleString()}/${m.target.toLocaleString()}</b>
      </div>
      <div class="mission-track"><i style="width:${(m.pct * 100).toFixed(1)}%"></i></div>
      ${m.done && !m.claimed
        ? `<button class="mission-claim" data-claim="${m.id}">Claim +${m.coins} coins · +${m.xp} XP</button>`
        : `<div class="mission-foot">${m.claimed ? '✅ Claimed' : `Reward: +${m.coins} coins · +${m.xp} XP`}</div>`}
    </div>
  `).join('');

  return `
    <div class="drawer-section-title">Today's missions — resets at midnight</div>
    ${cards}
    <div class="mission-card" style="margin-top:14px">
      <div class="mission-card-top"><span>🔥 Daily streak</span><b>${streak.count} day${streak.count === 1 ? '' : 's'}</b></div>
      <div class="mission-foot">${streak.playedToday
        ? 'Played today — come back tomorrow to keep it going.'
        : 'Play any game today to extend your streak.'}</div>
    </div>
  `;
}

function renderAwards() {
  const list = getAchievements();
  const unlocked = list.filter((a) => a.unlocked).length;

  return `
    <div class="drawer-section-title">Achievements — ${unlocked} of ${list.length} unlocked</div>
    <div class="ach-grid">
      ${list.map((a) => `
        <div class="ach ${a.unlocked ? 'is-unlocked' : ''}" title="${a.desc}">
          <div class="ach-icon">${a.icon}</div>
          <div class="ach-name">${a.name}</div>
          <div class="ach-desc">${a.desc}</div>
          ${a.unlocked ? '' : `<div class="ach-track"><i style="width:${(a.pct * 100).toFixed(0)}%"></i></div>`}
        </div>`).join('')}
    </div>
  `;
}

function renderScores() {
  const profile = getProfile();
  const entries = Object.entries(profile.games)
    .map(([id, s]) => {
      const game = games.find((g) => g.id === id);
      return { id, title: game ? game.title : id.replace(/-/g, ' '), ...s };
    })
    .sort((a, b) => b.best - a.best);

  if (!entries.length) {
    return `<div class="drawer-empty">No scores yet.<br>Play a game and your bests will show up here.</div>`;
  }

  return `
    <div class="drawer-section-title">Personal bests</div>
    ${entries.map((e) => `
      <a class="mission-card" href="#/play/${e.id}" style="display:block">
        <div class="mission-card-top">
          <span>${e.title}</span>
          <b>${e.best.toLocaleString()}</b>
        </div>
        <div class="mission-foot">${e.runs} run${e.runs === 1 ? '' : 's'} · best combo ${e.bestCombo || 0}x</div>
      </a>`).join('')}
    <button class="drawer-danger" id="drawer-reset">Reset all progress</button>
  `;
}
