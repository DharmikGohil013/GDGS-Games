// ─── Theme controller: dark (default) / light, persisted + OS aware ───

const KEY = 'playzy:theme';
const listeners = new Set();

/** @returns {'dark'|'light'|'system'} */
export function getThemePreference() {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch { /* private mode */ }
  return 'system';
}

/** The theme actually on screen right now. @returns {'dark'|'light'} */
export function getResolvedTheme() {
  const pref = getThemePreference();
  if (pref !== 'system') return pref;
  // Comic pop: the newsprint "paper" look is the default; night is opt-in.
  return 'light';
}

export function setTheme(pref) {
  try {
    if (pref === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, pref);
  } catch { /* ignore */ }
  applyTheme();
}

export function toggleTheme() {
  setTheme(getResolvedTheme() === 'dark' ? 'light' : 'dark');
  return getResolvedTheme();
}

export function applyTheme() {
  // Always set the attribute so the comic skin never falls back to the
  // OS media-query block in variables.css.
  const resolved = getResolvedTheme();
  document.documentElement.setAttribute('data-theme', resolved);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', resolved === 'dark' ? '#1C2045' : '#FFFBEF');

  listeners.forEach((fn) => fn(resolved));
  return resolved;
}

export function onThemeChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function initTheme() {
  applyTheme();
  // Track the OS switching themes while the visitor is on "system".
  window.matchMedia?.('(prefers-color-scheme: light)').addEventListener?.('change', () => {
    if (getThemePreference() === 'system') applyTheme();
  });
}
