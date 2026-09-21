// ─── Shared game shell ───
// Every game mounts inside this: one HUD, one start screen, one pause overlay,
// one results screen, one power-up strip, one set of mobile controls.
// Games stay focused on their own logic and call a handful of setters.

import { sfx, unlockAudio, isSoundOn, toggleSound, haptic } from './audio.js';
import {
  submitRun, getHighScore, getMissions, claimMission,
  getLevelInfo, getCoins, getStreak,
} from './progress.js';

const ACCENTS = {
  coral: '#FF5F4D', blue: '#3E6BFF', green: '#1FC98B',
  purple: '#8B5CF6', gold: '#FFC93C', cyan: '#22D3EE', pink: '#F43F8E',
};

const ICON = {
  play: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>',
  resume: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  soundOn: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
  soundOff: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><line x1="16" y1="9" x2="22" y2="15"/><line x1="22" y1="9" x2="16" y2="15"/></svg>',
  restart: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 4 3 10 9 10"/></svg>',
  coin: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none"><circle cx="12" cy="12" r="9" fill="#FFC93C"/><circle cx="12" cy="12" r="5.6" fill="none" stroke="#A8790A" stroke-width="1.6"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M7 4h10v2h3v3a4 4 0 0 1-4 4h-.6A5 5 0 0 1 13 15.9V18h3v2H8v-2h3v-2.1A5 5 0 0 1 8.6 13H8a4 4 0 0 1-4-4V6h3V4zm0 4H6v1a2 2 0 0 0 1 1.7V8zm10 0v2.7A2 2 0 0 0 18 9V8h-1z"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2z"/></svg>',
};

/**
 * @param {HTMLElement} container the .play-viewport element
 * @param {object} opts
 *   id, title, accent, tagline, howTo:[{key,label}], tips:[string],
 *   stats:[{key,label,icon}], onStart, onRestart, onPause, onResume, onDestroy
 */
export function createGameShell(container, opts = {}) {
  const id = opts.id || 'game';
  const title = opts.title || 'Play';
  const accent = ACCENTS[opts.accent] || ACCENTS.purple;
  const accent2 = ACCENTS[opts.accent2] || ACCENTS.cyan;

  container.innerHTML = '';
  container.classList.add('gs-root');
  container.style.setProperty('--gs-accent', accent);
  container.style.setProperty('--gs-accent-2', accent2);

  /* ── state ── */
  let state = 'start';            // start | playing | paused | over
  let score = 0;
  let best = getHighScore(id);
  let combo = 0;
  let comboPct = 0;
  let coins = 0;
  let runStart = 0;
  let runPaused = 0;
  let pauseStamp = 0;
  const runMeta = { powerups: 0, perfects: 0, distance: 0 };
  const activePowerups = new Map(); // key -> { label, icon, color, until, total }
  let powerupRaf = null;
  let destroyed = false;

  const statDefs = opts.stats && opts.stats.length ? opts.stats : [
    { key: 'score', label: 'Score' },
    { key: 'best', label: 'Best' },
    { key: 'coins', label: 'Coins' },
  ];

  /* ── markup ── */
  const shell = document.createElement('div');
  shell.className = 'gs-shell';
  shell.innerHTML = `
    <div class="gs-stage" id="gs-stage"></div>

    <div class="gs-hud" id="gs-hud" aria-live="off">
      <div class="gs-hud-stats" id="gs-stats">
        ${statDefs.map((s) => `
          <div class="gs-stat" data-stat="${s.key}">
            <span class="gs-stat-label">${s.label}</span>
            <span class="gs-stat-value" data-value="${s.key}">0</span>
          </div>`).join('')}
      </div>

      <div class="gs-combo" id="gs-combo" hidden>
        <div class="gs-combo-badge"><span id="gs-combo-x">2</span>x</div>
        <div class="gs-combo-track"><i id="gs-combo-fill"></i></div>
      </div>

      <div class="gs-hud-actions">
        <button class="gs-icon-btn" id="gs-sound" title="Toggle sound" aria-label="Toggle sound"></button>
        <button class="gs-icon-btn" id="gs-pause" title="Pause (P)" aria-label="Pause">${ICON.pause}</button>
      </div>
    </div>

    <div class="gs-powerups" id="gs-powerups" aria-live="polite"></div>
    <div class="gs-controls" id="gs-controls"></div>
    <div class="gs-toasts" id="gs-toasts" aria-live="polite"></div>

    <!-- ── Start screen ── -->
    <div class="gs-overlay gs-start is-open" id="gs-start-screen">
      <div class="gs-panel">
        <span class="gs-eyebrow">${opts.tagline || 'Ready when you are'}</span>
        <h2 class="gs-title">${title}</h2>
        ${opts.howTo && opts.howTo.length ? `
          <div class="gs-howto">
            ${opts.howTo.map((h) => `
              <div class="gs-howto-row"><kbd>${h.key}</kbd><span>${h.label}</span></div>`).join('')}
          </div>` : ''}
        <div class="gs-start-meta">
          <div class="gs-meta-chip">${ICON.trophy}<span>Best <b id="gs-start-best">${best.toLocaleString()}</b></span></div>
          <div class="gs-meta-chip">${ICON.coin}<span id="gs-start-coins">${getCoins().toLocaleString()}</span></div>
          <div class="gs-meta-chip">${ICON.bolt}<span>Lv <b id="gs-start-level">${getLevelInfo().level}</b></span></div>
        </div>
        <div class="gs-missions" id="gs-start-missions"></div>
        <button class="gs-btn gs-btn-primary gs-btn-lg" id="gs-start-btn">${ICON.play}<span>Play now</span></button>
        <p class="gs-hint">Press <kbd>Space</kbd> or tap to start</p>
      </div>
    </div>

    <!-- ── Pause ── -->
    <div class="gs-overlay gs-pause" id="gs-pause-screen">
      <div class="gs-panel gs-panel-sm">
        <h2 class="gs-title gs-title-sm">Paused</h2>
        <div class="gs-pause-stats" id="gs-pause-stats"></div>
        <div class="gs-btn-row">
          <button class="gs-btn gs-btn-primary" id="gs-resume-btn">${ICON.resume}<span>Resume</span></button>
          <button class="gs-btn gs-btn-ghost" id="gs-pause-restart">${ICON.restart}<span>Restart</span></button>
        </div>
        <a class="gs-link" href="#/">Quit to all games</a>
      </div>
    </div>

    <!-- ── Results ── -->
    <div class="gs-overlay gs-over" id="gs-over-screen">
      <div class="gs-panel">
        <span class="gs-eyebrow" id="gs-over-eyebrow">Run complete</span>
        <div class="gs-final">
          <span class="gs-final-label">Score</span>
          <span class="gs-final-score" id="gs-final-score">0</span>
          <span class="gs-final-best" id="gs-final-best"></span>
        </div>
        <div class="gs-rewards" id="gs-rewards"></div>
        <div class="gs-xpbar">
          <div class="gs-xpbar-head">
            <span>Level <b id="gs-xp-level">1</b> <em id="gs-xp-title">Newcomer</em></span>
            <span id="gs-xp-nums">0 / 160 XP</span>
          </div>
          <div class="gs-xpbar-track"><i id="gs-xp-fill"></i></div>
        </div>
        <div class="gs-over-extra" id="gs-over-extra"></div>
        <div class="gs-btn-row">
          <button class="gs-btn gs-btn-primary gs-btn-lg" id="gs-again-btn">${ICON.restart}<span>Play again</span></button>
          <a class="gs-btn gs-btn-ghost" href="#/">More games</a>
        </div>
      </div>
    </div>
  `;
  container.appendChild(shell);

  /* ── refs ── */
  const $ = (sel) => shell.querySelector(sel);
  const stage = $('#gs-stage');
  const hud = $('#gs-hud');
  const comboEl = $('#gs-combo');
  const comboX = $('#gs-combo-x');
  const comboFill = $('#gs-combo-fill');
  const powerupsEl = $('#gs-powerups');
  const controlsEl = $('#gs-controls');
  const toastsEl = $('#gs-toasts');
  const startScreen = $('#gs-start-screen');
  const pauseScreen = $('#gs-pause-screen');
  const overScreen = $('#gs-over-screen');
  const soundBtn = $('#gs-sound');

  function paintSoundBtn() {
    soundBtn.innerHTML = isSoundOn() ? ICON.soundOn : ICON.soundOff;
    soundBtn.classList.toggle('is-off', !isSoundOn());
  }
  paintSoundBtn();

  /* ── HUD setters ── */
  const valueEls = {};
  statDefs.forEach((s) => { valueEls[s.key] = shell.querySelector(`[data-value="${s.key}"]`); });

  function paintStat(key, value, { pop = false } = {}) {
    const el = valueEls[key];
    if (!el) return;
    el.textContent = typeof value === 'number' ? Math.round(value).toLocaleString() : value;
    if (pop) {
      el.classList.remove('is-pop');
      void el.offsetWidth; // restart the CSS animation
      el.classList.add('is-pop');
    }
  }

  paintStat('best', best);

  /* ── overlay plumbing ── */
  function openOverlay(el) {
    el.classList.add('is-open');
  }
  function closeOverlay(el) {
    el.classList.remove('is-open');
  }
  function closeAll() {
    [startScreen, pauseScreen, overScreen].forEach(closeOverlay);
  }

  /* ── missions on the start screen ── */
  function renderStartMissions() {
    const host = $('#gs-start-missions');
    const missions = getMissions();
    if (!missions.length) { host.innerHTML = ''; return; }
    host.innerHTML = `
      <div class="gs-missions-head">Daily missions</div>
      ${missions.map((m) => `
        <div class="gs-mission ${m.done ? 'is-done' : ''}">
          <div class="gs-mission-top">
            <span>${m.label}</span>
            <b>${Math.min(m.progress, m.target).toLocaleString()}/${m.target.toLocaleString()}</b>
          </div>
          <div class="gs-mission-track"><i style="width:${Math.round(m.pct * 100)}%"></i></div>
          ${m.done && !m.claimed
            ? `<button class="gs-claim" data-claim="${m.id}">Claim +${m.coins} coins</button>`
            : `<span class="gs-mission-reward">${m.claimed ? 'Claimed' : `+${m.coins} coins · +${m.xp} XP`}</span>`}
        </div>`).join('')}
    `;
    host.querySelectorAll('[data-claim]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const res = claimMission(btn.dataset.claim);
        if (res) {
          sfx.reward();
          toast(`+${res.coins} coins · +${res.xp} XP`, 'good');
          renderStartMissions();
          refreshStartMeta();
        }
      });
    });
  }

  function refreshStartMeta() {
    const lvl = getLevelInfo();
    const bestEl = $('#gs-start-best');
    const coinEl = $('#gs-start-coins');
    const lvlEl = $('#gs-start-level');
    if (bestEl) bestEl.textContent = getHighScore(id).toLocaleString();
    if (coinEl) coinEl.textContent = getCoins().toLocaleString();
    if (lvlEl) lvlEl.textContent = lvl.level;
  }

  renderStartMissions();

  /* ── toasts ── */
  function toast(message, kind = 'info') {
    const el = document.createElement('div');
    el.className = `gs-toast gs-toast-${kind}`;
    el.textContent = message;
    toastsEl.appendChild(el);
    setTimeout(() => {
      el.classList.add('is-out');
      setTimeout(() => el.remove(), 320);
    }, 1900);
  }

  /* ── power-up strip ── */
  function tickPowerups() {
    powerupRaf = null;
    const now = performance.now();
    let changed = false;
    activePowerups.forEach((p, key) => {
      if (now >= p.until) { activePowerups.delete(key); changed = true; }
    });

    if (changed || activePowerups.size) {
      powerupsEl.innerHTML = '';
      activePowerups.forEach((p, key) => {
        const left = Math.max(0, p.until - now);
        const pct = p.total > 0 ? left / p.total : 0;
        const chip = document.createElement('div');
        chip.className = 'gs-pu';
        chip.style.setProperty('--pu-color', p.color || accent);
        chip.innerHTML = `
          <span class="gs-pu-icon">${p.icon || '★'}</span>
          <span class="gs-pu-label">${p.label}</span>
          <span class="gs-pu-time">${(left / 1000).toFixed(1)}s</span>
          <i class="gs-pu-fill" style="transform:scaleX(${pct.toFixed(3)})"></i>`;
        powerupsEl.appendChild(chip);
      });
    }

    if (activePowerups.size && state === 'playing') {
      powerupRaf = requestAnimationFrame(tickPowerups);
    }
  }

  /* ── run timing ── */
  function runSeconds() {
    if (!runStart) return 0;
    const end = state === 'paused' && pauseStamp ? pauseStamp : performance.now();
    return Math.max(0, (end - runStart - runPaused) / 1000);
  }

  function resetRunState() {
    score = 0; combo = 0; comboPct = 0; coins = 0;
    runMeta.powerups = 0; runMeta.perfects = 0; runMeta.distance = 0;
    activePowerups.clear();
    powerupsEl.innerHTML = '';
    runStart = performance.now();
    runPaused = 0;
    pauseStamp = 0;
    statDefs.forEach((s) => {
      if (s.key === 'best') paintStat('best', getHighScore(id));
      else paintStat(s.key, s.initial != null ? s.initial : 0);
    });
    comboEl.hidden = true;
  }

  /* ── lifecycle ── */
  function start() {
    if (destroyed) return;
    unlockAudio();
    sfx.ui();
    closeAll();
    resetRunState();
    state = 'playing';
    hud.classList.add('is-live');
    opts.onStart?.();
  }

  function restart() {
    if (destroyed) return;
    unlockAudio();
    sfx.ui();
    closeAll();
    resetRunState();
    state = 'playing';
    hud.classList.add('is-live');
    (opts.onRestart || opts.onStart)?.();
  }

  function pause(silent) {
    if (state !== 'playing' || destroyed) return;
    state = 'paused';
    pauseStamp = performance.now();
    if (!silent) sfx.uiBack();
    $('#gs-pause-stats').innerHTML = `
      <div><b>${score.toLocaleString()}</b><span>Score</span></div>
      <div><b>${getHighScore(id).toLocaleString()}</b><span>Best</span></div>
      <div><b>${Math.floor(runSeconds())}s</b><span>Time</span></div>`;
    openOverlay(pauseScreen);
    opts.onPause?.();
  }

  function resume() {
    if (state !== 'paused' || destroyed) return;
    state = 'playing';
    if (pauseStamp) { runPaused += performance.now() - pauseStamp; pauseStamp = 0; }
    sfx.ui();
    closeOverlay(pauseScreen);
    opts.onResume?.();
    if (activePowerups.size && !powerupRaf) powerupRaf = requestAnimationFrame(tickPowerups);
  }

  function togglePause() {
    if (state === 'playing') pause();
    else if (state === 'paused') resume();
  }

  /** End the run, bank progress, and show the results screen. */
  function gameOver(extra = {}) {
    if (state === 'over' || destroyed) return null;
    state = 'over';
    hud.classList.remove('is-live');
    if (powerupRaf) { cancelAnimationFrame(powerupRaf); powerupRaf = null; }
    activePowerups.clear();
    powerupsEl.innerHTML = '';

    const duration = runSeconds();
    const result = submitRun(id, {
      score,
      coins,
      combo: extra.bestCombo != null ? extra.bestCombo : combo,
      duration,
      powerups: runMeta.powerups,
      perfects: runMeta.perfects,
      distance: extra.distance != null ? extra.distance : runMeta.distance,
    });
    best = result.best;

    $('#gs-over-eyebrow').textContent = result.isHighScore
      ? 'New personal best!'
      : (extra.eyebrow || 'Run complete');
    $('#gs-over-eyebrow').classList.toggle('is-record', result.isHighScore);
    $('#gs-final-score').textContent = score.toLocaleString();
    $('#gs-final-best').innerHTML = result.isHighScore
      ? `<span class="gs-record-pill">Beat ${result.previousBest.toLocaleString()}</span>`
      : `Best ${result.best.toLocaleString()}`;

    const rewardRows = [
      { icon: ICON.coin, label: 'Coins earned', value: `+${result.coinsEarned.toLocaleString()}` },
      { icon: ICON.bolt, label: 'XP gained', value: `+${result.xpGained.toLocaleString()}` },
    ];
    if (duration >= 1) rewardRows.push({ icon: '', label: 'Time survived', value: `${Math.floor(duration)}s` });
    const shownCombo = extra.bestCombo != null ? extra.bestCombo : combo;
    if (shownCombo > 1) rewardRows.push({ icon: '', label: 'Best combo', value: `${shownCombo}x` });
    (extra.stats || []).forEach((s) => rewardRows.push({ icon: '', label: s.label, value: s.value }));

    $('#gs-rewards').innerHTML = rewardRows.map((r) => `
      <div class="gs-reward-row">
        <span class="gs-reward-label">${r.icon}${r.label}</span>
        <span class="gs-reward-value">${r.value}</span>
      </div>`).join('');

    const lvl = getLevelInfo();
    $('#gs-xp-level').textContent = lvl.level;
    $('#gs-xp-title').textContent = lvl.title;
    $('#gs-xp-nums').textContent = `${lvl.xp.toLocaleString()} / ${lvl.need.toLocaleString()} XP`;
    requestAnimationFrame(() => { $('#gs-xp-fill').style.transform = `scaleX(${lvl.pct.toFixed(3)})`; });

    const extras = [];
    if (result.levels > 0) {
      extras.push(`<div class="gs-unlock gs-unlock-level">🎉 Level up! You reached <b>level ${result.level}</b></div>`);
    }
    result.missionsCompleted.forEach((m) => {
      extras.push(`<div class="gs-unlock">✅ Mission complete — <b>${m.label}</b> <span>+${m.coins} coins</span></div>`);
    });
    result.achievementsUnlocked.forEach((a) => {
      extras.push(`<div class="gs-unlock">${a.icon} Achievement — <b>${a.name}</b> <span>+${a.coins} coins</span></div>`);
    });
    const streak = getStreak();
    if (streak.count > 1) {
      extras.push(`<div class="gs-unlock gs-unlock-streak">🔥 <b>${streak.count}-day streak</b> — come back tomorrow to keep it alive</div>`);
    }
    $('#gs-over-extra').innerHTML = extras.join('');

    if (result.levels > 0) sfx.levelUp();
    else if (result.isHighScore) sfx.reward();
    else sfx.gameOver();
    haptic(result.isHighScore ? [18, 60, 18] : 30);

    openOverlay(overScreen);
    refreshStartMeta();
    renderStartMissions();
    document.dispatchEvent(new CustomEvent('playzy:progress'));
    return result;
  }

  /* ── events ── */
  $('#gs-start-btn').addEventListener('click', start);
  $('#gs-again-btn').addEventListener('click', restart);
  $('#gs-resume-btn').addEventListener('click', resume);
  $('#gs-pause-restart').addEventListener('click', restart);
  $('#gs-pause').addEventListener('click', togglePause);
  soundBtn.addEventListener('click', () => {
    toggleSound();
    paintSoundBtn();
    if (isSoundOn()) sfx.ui();
  });

  // Tapping the start screen anywhere begins the run.
  startScreen.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, a, .gs-mission')) return;
    start();
  });

  function onKey(e) {
    if (destroyed) return;
    const tag = document.activeElement?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;

    if (e.code === 'Escape' || e.key === 'p' || e.key === 'P') {
      if (state === 'playing' || state === 'paused') { e.preventDefault(); togglePause(); }
      return;
    }
    if (state === 'start' && (e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter')) {
      e.preventDefault();
      start();
      return;
    }
    if (state === 'over' && (e.code === 'Enter' || e.code === 'NumpadEnter' || e.key === 'r' || e.key === 'R')) {
      e.preventDefault();
      restart();
    }
  }
  window.addEventListener('keydown', onKey);

  function onVisibility() {
    if (document.hidden && state === 'playing') pause(true);
  }
  document.addEventListener('visibilitychange', onVisibility);

  /* ── public API ── */
  const api = {
    /** Append the game canvas here. */
    stage,
    get state() { return state; },
    get isPlaying() { return state === 'playing'; },
    get score() { return score; },
    get coins() { return coins; },
    get best() { return best; },
    get elapsed() { return runSeconds(); },

    setScore(v, opt) {
      score = Math.max(0, Math.round(v));
      paintStat('score', score, opt);
      if (score > best) {
        best = score;
        paintStat('best', best);
      }
      return score;
    },

    addScore(v, opt) {
      return api.setScore(score + v, opt);
    },

    setCoins(v) {
      coins = Math.max(0, Math.round(v));
      paintStat('coins', coins, { pop: true });
      return coins;
    },

    addCoins(v = 1) {
      return api.setCoins(coins + v);
    },

    /** @param {number} value multiplier, @param {number} pct 0..1 decay meter */
    setCombo(value, pct) {
      combo = Math.max(0, Math.round(value));
      comboPct = pct == null ? 1 : pct;
      const show = combo >= 2;
      comboEl.hidden = !show;
      if (show) {
        comboX.textContent = combo;
        comboFill.style.transform = `scaleX(${Math.max(0, Math.min(1, comboPct)).toFixed(3)})`;
        comboEl.classList.remove('is-pop');
        void comboEl.offsetWidth;
        comboEl.classList.add('is-pop');
      }
      return combo;
    },

    setStat(key, value, opt) {
      paintStat(key, value, opt);
    },

    countPerfect(n = 1) { runMeta.perfects += n; },
    countPowerup(n = 1) { runMeta.powerups += n; },
    setDistance(d) { runMeta.distance = d; },

    /** Show a timed power-up chip. @param {string} key @param {object} o {label, icon, color, duration(ms)} */
    addPowerup(key, o = {}) {
      const duration = o.duration || 6000;
      activePowerups.set(key, {
        label: o.label || key,
        icon: o.icon || '★',
        color: o.color || accent,
        until: performance.now() + duration,
        total: duration,
      });
      runMeta.powerups += 1;
      if (!powerupRaf) powerupRaf = requestAnimationFrame(tickPowerups);
    },

    clearPowerup(key) {
      activePowerups.delete(key);
      if (!activePowerups.size) powerupsEl.innerHTML = '';
    },

    hasPowerup(key) {
      const p = activePowerups.get(key);
      return Boolean(p && performance.now() < p.until);
    },

    /** Mount a mobile/touch control cluster below the stage. */
    setControls(html) {
      controlsEl.innerHTML = html;
      controlsEl.classList.toggle('has-controls', Boolean(html));
      return controlsEl;
    },

    toast,
    gameOver,
    pause,
    resume,
    start,
    restart,

    showStart() {
      state = 'start';
      hud.classList.remove('is-live');
      closeAll();
      refreshStartMeta();
      renderStartMissions();
      openOverlay(startScreen);
    },

    destroy() {
      destroyed = true;
      state = 'over';
      if (powerupRaf) cancelAnimationFrame(powerupRaf);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVisibility);
      opts.onDestroy?.();
      container.classList.remove('gs-root');
      container.innerHTML = '';
    },
  };

  return api;
}
