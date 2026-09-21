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
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
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
  const pref = getThemePreference();
  const root = document.documentElement;
  if (pref === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', pref);

  const resolved = getResolvedTheme();
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', resolved === 'dark' ? '#08090F' : '#F3F5FB');

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
