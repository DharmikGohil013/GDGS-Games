// ─── Playzy meta-progression: coins, XP, missions, achievements, unlocks ───
// Every game funnels its run results through submitRun(); everything the site
// shows (nav chip, profile drawer, mission panel) reads from this one store.

const KEY = 'playzy:profile:v1';
const listeners = new Set();

const DEFAULT_PROFILE = {
  v: 1,
  coins: 0,
  xp: 0,
  level: 1,
  createdAt: 0,
  streak: { count: 0, lastDate: '' },
  games: {},        // gameId -> { best, runs, totalScore, totalCoins, bestCombo, lastPlayed }
  totals: {},       // metric -> lifetime sum
  missions: { date: '', list: [] },
  achievements: {}, // id -> timestamp
  unlocks: {},      // itemId -> true
  equipped: {},     // gameId -> itemId
  settings: { sound: true, haptics: true, reducedFx: false },
};

let profile = null;

/* ───────────────────────── storage ───────────────────────── */

function todayKey(d = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + m + '-' + day;
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function load() {
  if (profile) return profile;
  let parsed = null;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) parsed = JSON.parse(raw);
  } catch (e) { /* corrupt or blocked storage — fall through to defaults */ }

  profile = Object.assign(clone(DEFAULT_PROFILE), parsed && typeof parsed === 'object' ? parsed : {});
  // Re-nest anything a partial or older payload may have dropped.
  profile.streak = Object.assign({}, DEFAULT_PROFILE.streak, profile.streak || {});
  profile.games = profile.games || {};
  profile.totals = profile.totals || {};
  profile.missions = profile.missions || { date: '', list: [] };
  profile.achievements = profile.achievements || {};
  profile.unlocks = profile.unlocks || {};
  profile.equipped = profile.equipped || {};
  profile.settings = Object.assign({}, DEFAULT_PROFILE.settings, profile.settings || {});
  if (!profile.createdAt) profile.createdAt = Date.now();

  refreshMissions();
  return profile;
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch (e) { /* quota or private mode — progress stays in memory for this session */ }
  listeners.forEach((fn) => fn(profile));
}

export function onProgressChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getProfile() {
  return load();
}

export function resetProfile() {
  profile = clone(DEFAULT_PROFILE);
  profile.createdAt = Date.now();
  refreshMissions();
  save();
  return profile;
}

/* ───────────────────────── levels ───────────────────────── */

/** XP required to advance *from* `level` to the next one. */
export function xpForLevel(level) {
  return 160 + (level - 1) * 90;
}

export function levelTitle(level) {
  if (level >= 40) return 'Legend';
  if (level >= 30) return 'Grandmaster';
  if (level >= 22) return 'Master';
  if (level >= 15) return 'Veteran';
  if (level >= 10) return 'Pro';
  if (level >= 6) return 'Challenger';
  if (level >= 3) return 'Rookie';
  return 'Newcomer';
}

export function getLevelInfo() {
  const p = load();
  const need = xpForLevel(p.level);
  return {
    level: p.level,
    xp: p.xp,
    need,
    pct: Math.max(0, Math.min(1, p.xp / need)),
    title: levelTitle(p.level),
  };
}

function grantXP(amount) {
  const p = load();
  p.xp += Math.max(0, Math.round(amount));
  let levels = 0;
  while (p.xp >= xpForLevel(p.level)) {
    p.xp -= xpForLevel(p.level);
    p.level += 1;
    levels += 1;
    p.coins += 50 * p.level; // level-up payout
  }
  return levels;
}

/* ───────────────────────── currency ───────────────────────── */

export function getCoins() {
  return load().coins;
}

export function addCoins(n) {
  const p = load();
  p.coins = Math.max(0, p.coins + Math.round(n));
  save();
  return p.coins;
}

export function spendCoins(n) {
  const p = load();
  if (p.coins < n) return false;
  p.coins -= n;
  save();
  return true;
}

/* ───────────────────────── per-game stats ───────────────────────── */

export function getGameStats(gameId) {
  const p = load();
  return p.games[gameId] || { best: 0, runs: 0, totalScore: 0, totalCoins: 0, bestCombo: 0, lastPlayed: 0 };
}

export function getHighScore(gameId) {
  return getGameStats(gameId).best;
}

export function getTotals() {
  return Object.assign({}, load().totals);
}

function bumpTotal(metric, value) {
  const p = load();
  p.totals[metric] = (p.totals[metric] || 0) + value;
}

/* ───────────────────────── daily streak ───────────────────────── */

function touchStreak() {
  const p = load();
  const today = todayKey();
  if (p.streak.lastDate === today) return false;

  const yesterday = todayKey(new Date(Date.now() - 86400000));
  p.streak.count = p.streak.lastDate === yesterday ? p.streak.count + 1 : 1;
  p.streak.lastDate = today;
  return true;
}

export function getStreak() {
  const p = load();
  const today = todayKey();
  const yesterday = todayKey(new Date(Date.now() - 86400000));
  // A streak survives until the end of the day after the last play.
  const alive = p.streak.lastDate === today || p.streak.lastDate === yesterday;
  return { count: alive ? p.streak.count : 0, playedToday: p.streak.lastDate === today };
}

/* ───────────────────────── daily missions ───────────────────────── */

// Deterministic per-day shuffle, so reloading never re-rolls today's missions.
function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const MISSION_POOL = [
  { id: 'runs3',     label: 'Play 3 rounds of anything',      metric: 'runs',        mode: 'sum', target: 3,      coins: 60,  xp: 40 },
  { id: 'runs6',     label: 'Play 6 rounds of anything',      metric: 'runs',        mode: 'sum', target: 6,      coins: 120, xp: 80 },
  { id: 'score2k',   label: 'Score 2,000 in a single run',    metric: 'score',       mode: 'max', target: 2000,   coins: 100, xp: 70 },
  { id: 'score6k',   label: 'Score 6,000 in a single run',    metric: 'score',       mode: 'max', target: 6000,   coins: 180, xp: 120 },
  { id: 'combo8',    label: 'Reach an 8x combo',              metric: 'combo',       mode: 'max', target: 8,      coins: 130, xp: 90 },
  { id: 'combo15',   label: 'Reach a 15x combo',              metric: 'combo',       mode: 'max', target: 15,     coins: 220, xp: 150 },
  { id: 'coins250',  label: 'Collect 250 coins in-game',      metric: 'coins',       mode: 'sum', target: 250,    coins: 90,  xp: 60 },
  { id: 'coins600',  label: 'Collect 600 coins in-game',      metric: 'coins',       mode: 'sum', target: 600,    coins: 200, xp: 130 },
  { id: 'power5',    label: 'Grab 5 power-ups',               metric: 'powerups',    mode: 'sum', target: 5,      coins: 110, xp: 75 },
  { id: 'power12',   label: 'Grab 12 power-ups',              metric: 'powerups',    mode: 'sum', target: 12,     coins: 210, xp: 140 },
  { id: 'games3',    label: 'Play 3 different games',         metric: 'uniqueGames', mode: 'max', target: 3,      coins: 160, xp: 110 },
  { id: 'perfect10', label: 'Land 10 perfect actions',        metric: 'perfects',    mode: 'sum', target: 10,     coins: 150, xp: 100 },
  { id: 'survive90', label: 'Survive 90s in a single run',    metric: 'duration',    mode: 'max', target: 90,     coins: 170, xp: 115 },
  { id: 'best1',     label: 'Beat one of your high scores',   metric: 'records',     mode: 'sum', target: 1,      coins: 200, xp: 140 },
];

function refreshMissions() {
  const p = profile;
  const today = todayKey();
  if (p.missions.date === today && Array.isArray(p.missions.list) && p.missions.list.length) return;

  const rnd = seededRandom(Number(today.replace(/-/g, '')));
  const pool = MISSION_POOL.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }

  p.missions = {
    date: today,
    uniqueGames: [],
    list: pool.slice(0, 3).map((m) => Object.assign({}, m, { progress: 0, done: false, claimed: false })),
  };
}

export function getMissions() {
  const p = load();
  refreshMissions();
  return p.missions.list.map((m) => Object.assign({}, m, { pct: Math.min(1, m.progress / m.target) }));
}

export function claimMission(id) {
  const p = load();
  const m = p.missions.list.find((x) => x.id === id);
  if (!m || !m.done || m.claimed) return null;
  m.claimed = true;
  p.coins += m.coins;
  const levels = grantXP(m.xp);
  save();
  return { coins: m.coins, xp: m.xp, levels };
}

/** Advance today's missions with the metrics from a finished run. */
function applyMissions(metrics, gameId) {
  const p = load();
  refreshMissions();

  if (!p.missions.uniqueGames) p.missions.uniqueGames = [];
  if (gameId && p.missions.uniqueGames.indexOf(gameId) === -1) p.missions.uniqueGames.push(gameId);
  metrics.uniqueGames = p.missions.uniqueGames.length;

  const completed = [];
  p.missions.list.forEach((m) => {
    if (m.done) return;
    const raw = metrics[m.metric] || 0;
    if (m.mode === 'max') m.progress = Math.max(m.progress, raw);
    else m.progress += raw;

    if (m.progress >= m.target) {
      m.done = true;
      completed.push(Object.assign({}, m));
    }
  });
  return completed;
}

/* ───────────────────────── achievements ───────────────────────── */

export const ACHIEVEMENTS = [
  { id: 'first-run',     name: 'First Blood',      desc: 'Finish your first run',             metric: 'runs',        target: 1,       coins: 50,   icon: '🎮' },
  { id: 'runs-25',       name: 'Warmed Up',        desc: 'Finish 25 runs',                    metric: 'runs',        target: 25,      coins: 200,  icon: '🔥' },
  { id: 'runs-100',      name: 'Certified Addict', desc: 'Finish 100 runs',                   metric: 'runs',        target: 100,     coins: 600,  icon: '💎' },
  { id: 'score-10k',     name: 'Score Hunter',     desc: 'Bank 10,000 lifetime points',       metric: 'score',       target: 10000,   coins: 150,  icon: '🎯' },
  { id: 'score-100k',    name: 'Point Machine',    desc: 'Bank 100,000 lifetime points',      metric: 'score',       target: 100000,  coins: 500,  icon: '🏆' },
  { id: 'score-1m',      name: 'Millionaire',      desc: 'Bank 1,000,000 lifetime points',    metric: 'score',       target: 1000000, coins: 2000, icon: '👑' },
  { id: 'coins-1k',      name: 'Coin Collector',   desc: 'Collect 1,000 in-game coins',       metric: 'coins',       target: 1000,    coins: 200,  icon: '🪙' },
  { id: 'combo-20',      name: 'Combo Breaker',    desc: 'Hit a 20x combo',                   metric: 'combo',       target: 20,      coins: 350,  icon: '⚡' },
  { id: 'power-50',      name: 'Juiced Up',        desc: 'Grab 50 power-ups',                 metric: 'powerups',    target: 50,      coins: 300,  icon: '🧪' },
  { id: 'records-10',    name: 'Record Setter',    desc: 'Beat your own high score 10 times', metric: 'records',     target: 10,      coins: 400,  icon: '📈' },
  { id: 'streak-3',      name: 'Coming Back',      desc: 'Play 3 days in a row',              metric: 'streakDays',  target: 3,       coins: 250,  icon: '🗓️' },
  { id: 'streak-7',      name: 'Week Warrior',     desc: 'Play 7 days in a row',              metric: 'streakDays',  target: 7,       coins: 700,  icon: '🌟' },
  { id: 'explorer',      name: 'Explorer',         desc: 'Play 5 different games',            metric: 'gamesPlayed', target: 5,       coins: 300,  icon: '🧭' },
  { id: 'completionist', name: 'Completionist',    desc: 'Play all 10 playable games',        metric: 'gamesPlayed', target: 10,      coins: 1200, icon: '🥇' },
];

function achievementTotals() {
  const p = load();
  return Object.assign({}, p.totals, {
    streakDays: p.streak.count,
    gamesPlayed: Object.keys(p.games).length,
  });
}

export function getAchievements() {
  const p = load();
  const totals = achievementTotals();
  return ACHIEVEMENTS.map((a) => Object.assign({}, a, {
    unlocked: Boolean(p.achievements[a.id]),
    progress: Math.min(totals[a.metric] || 0, a.target),
    pct: Math.min(1, (totals[a.metric] || 0) / a.target),
  }));
}

function checkAchievements() {
  const p = load();
  const totals = achievementTotals();
  const unlocked = [];
  ACHIEVEMENTS.forEach((a) => {
    if (p.achievements[a.id]) return;
    if ((totals[a.metric] || 0) >= a.target) {
      p.achievements[a.id] = Date.now();
      p.coins += a.coins;
      unlocked.push(a);
    }
  });
  return unlocked;
}

/* ───────────────────────── unlocks / cosmetics ───────────────────────── */

export function isUnlocked(itemId) {
  return Boolean(load().unlocks[itemId]);
}

export function buyUnlock(item) {
  const p = load();
  if (p.unlocks[item.id]) return { ok: true, already: true };
  if (item.reqLevel && p.level < item.reqLevel) return { ok: false, reason: 'level' };
  if (p.coins < item.price) return { ok: false, reason: 'coins' };
  p.coins -= item.price;
  p.unlocks[item.id] = true;
  save();
  return { ok: true };
}

export function equip(gameId, itemId) {
  const p = load();
  p.equipped[gameId] = itemId;
  save();
}

export function getEquipped(gameId, fallback = 'default') {
  return load().equipped[gameId] || fallback;
}

/* ───────────────────────── settings ───────────────────────── */

export function getSettings() {
  return Object.assign({}, load().settings);
}

export function setSetting(key, value) {
  const p = load();
  p.settings[key] = value;
  save();
  return p.settings;
}

/* ───────────────────────── the one entry point games call ───────────────────────── */

/**
 * Record a finished run and return everything the game-over screen needs.
 * @param {string} gameId
 * @param {object} run { score, coins, combo, duration, powerups, perfects, distance }
 */
export function submitRun(gameId, run = {}) {
  const p = load();

  const score = Math.max(0, Math.round(run.score || 0));
  const coins = Math.max(0, Math.round(run.coins || 0));
  const combo = Math.max(0, Math.round(run.combo || 0));
  const duration = Math.max(0, Math.round(run.duration || 0));
  const powerups = Math.max(0, Math.round(run.powerups || 0));
  const perfects = Math.max(0, Math.round(run.perfects || 0));
  const distance = Math.max(0, Math.round(run.distance || 0));

  const stats = p.games[gameId] || { best: 0, runs: 0, totalScore: 0, totalCoins: 0, bestCombo: 0, lastPlayed: 0 };
  const previousBest = stats.best;
  const isHighScore = score > previousBest;

  stats.best = Math.max(stats.best, score);
  stats.bestCombo = Math.max(stats.bestCombo, combo);
  stats.runs += 1;
  stats.totalScore += score;
  stats.totalCoins += coins;
  stats.lastPlayed = Date.now();
  p.games[gameId] = stats;

  // Coins earned = in-game pickups + a slice of the score, boosted on a record.
  const scoreCoins = Math.floor(score / 120);
  let coinsEarned = coins + scoreCoins;
  if (isHighScore) coinsEarned = Math.round(coinsEarned * 1.5) + 25;
  p.coins += coinsEarned;

  // XP rewards skill and time survived, not just raw score inflation.
  const xpGained = Math.round(20 + score / 60 + combo * 3 + duration / 4 + (isHighScore ? 60 : 0));
  const levels = grantXP(xpGained);

  const streakAdvanced = touchStreak();

  bumpTotal('runs', 1);
  bumpTotal('score', score);
  bumpTotal('coins', coins);
  bumpTotal('powerups', powerups);
  bumpTotal('perfects', perfects);
  bumpTotal('distance', distance);
  bumpTotal('duration', duration);
  if (isHighScore) bumpTotal('records', 1);
  p.totals.combo = Math.max(p.totals.combo || 0, combo);

  const missionsCompleted = applyMissions({
    runs: 1, score, coins, combo, powerups, perfects, distance, duration,
    records: isHighScore ? 1 : 0,
  }, gameId);

  const achievementsUnlocked = checkAchievements();

  save();

  return {
    score,
    previousBest,
    best: stats.best,
    isHighScore,
    coinsEarned,
    xpGained,
    levels,
    level: p.level,
    missionsCompleted,
    achievementsUnlocked,
    streak: streakAdvanced ? p.streak.count : getStreak().count,
    runs: stats.runs,
  };
}
