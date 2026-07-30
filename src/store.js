// ─── Playzy Zustand-like Store (vanilla, no framework) ───
const listeners = new Set();
let state = {
  activeCategory: 'trending',
  searchQuery: '',
  searchOpen: false,
  gameModal: { open: false, game: null },
  visibleGames: 40,
  filteredGames: [],
};

export function getState() {
  return state;
}

export function setState(partial) {
  state = { ...state, ...partial };
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
