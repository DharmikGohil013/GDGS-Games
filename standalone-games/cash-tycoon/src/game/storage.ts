import { GameState } from '../types/game';
import { DEFAULT_BUSINESSES } from './businessData';

const STORAGE_KEY = 'cash_inc_tycoon_save_v1';

export function createInitialState(): GameState {
  const businesses: GameState['businesses'] = {};
  DEFAULT_BUSINESSES.forEach((b, idx) => {
    businesses[b.id] = {
      id: b.id,
      // Floor 1 starts unlocked with 1 level so the player immediately has business activity
      level: idx === 0 ? 1 : 0,
      unlocked: idx === 0,
      progress: 0,
      isRunning: false,
      cycleStartTime: 0,
    };
  });

  return {
    cash: 0,
    lifetimeCash: 0,
    famePoints: 0,
    businesses,
    managers: {},
    upgrades: {},
    lastSaveTime: Date.now(),
    frenzyActiveUntil: 0,
    lastSpinTime: 0,
    bulkBuyCount: 1,
    soundEnabled: true,
    stats: {
      totalTaps: 0,
      totalPrestiges: 0,
      floorsUnlocked: 1,
      gameStartTime: Date.now(),
    },
  };
}

export function loadGame(): GameState {
  if (typeof window === 'undefined') return createInitialState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    const initial = createInitialState();

    // Merge safely with initial in case new businesses/fields were added
    return {
      ...initial,
      ...parsed,
      businesses: {
        ...initial.businesses,
        ...(parsed.businesses || {}),
      },
      managers: {
        ...initial.managers,
        ...(parsed.managers || {}),
      },
      upgrades: {
        ...initial.upgrades,
        ...(parsed.upgrades || {}),
      },
      stats: {
        ...initial.stats,
        ...(parsed.stats || {}),
      },
    };
  } catch (err) {
    console.error('Failed to load save file:', err);
    return createInitialState();
  }
}

export function saveGame(state: GameState): void {
  if (typeof window === 'undefined') return;
  try {
    const toSave: GameState = {
      ...state,
      lastSaveTime: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (err) {
    console.error('Failed to save game:', err);
  }
}

export function exportSaveCode(state: GameState): string {
  try {
    const json = JSON.stringify(state);
    return btoa(unescape(encodeURIComponent(json)));
  } catch (err) {
    console.error('Export failed:', err);
    return '';
  }
}

export function importSaveCode(code: string): GameState | null {
  try {
    const json = decodeURIComponent(escape(atob(code.trim())));
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed.cash === 'number' && parsed.businesses) {
      return parsed as GameState;
    }
  } catch (err) {
    console.error('Import parse error:', err);
  }
  return null;
}
