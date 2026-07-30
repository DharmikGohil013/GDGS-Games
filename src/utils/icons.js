// ─── SVG Icon generator for game cards ───
// Returns SVG markup string based on icon type and color

const iconTemplates = {
  // Arcade / stacking
  stack: `<rect x="8" y="24" width="24" height="7" rx="2" fill="white"/><rect x="11" y="15" width="18" height="7" rx="2" fill="white" opacity="0.85"/><rect x="14" y="6" width="12" height="7" rx="2" fill="white" opacity="0.7"/>`,

  // Racing / car
  car: `<path d="M10 28 L20 12 L30 28" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><line x1="6" y1="32" x2="14" y2="32" stroke="white" stroke-width="3" stroke-linecap="round" opacity="0.6"/><line x1="26" y1="32" x2="34" y2="32" stroke="white" stroke-width="3" stroke-linecap="round" opacity="0.6"/>`,

  // Puzzle / blocks
  blocks: `<rect x="5" y="13" width="14" height="14" rx="3" fill="white" opacity="0.85"/><rect x="21" y="13" width="14" height="14" rx="3" fill="white"/><path d="M17 20 L23 20" stroke="white" stroke-width="3" stroke-linecap="round"/>`,

  // Runner / person
  runner: `<circle cx="22" cy="9" r="4" fill="white"/><path d="M22 14 L17 24 L10 28 M22 14 L27 22 L33 20 M17 24 L21 30 L18 36" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,

  // Snake
  snake: `<path d="M6 30 H16 V20 H26 V10 H34" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="34" cy="10" r="3" fill="white"/>`,

  // Ball / drop
  ball: `<line x1="6" y1="12" x2="16" y2="12" stroke="white" stroke-width="3" stroke-linecap="round"/><line x1="24" y1="20" x2="34" y2="20" stroke="white" stroke-width="3" stroke-linecap="round" opacity="0.85"/><circle cx="20" cy="30" r="5" fill="white"/>`,

  // Rope / chain
  rope: `<path d="M6 20 Q 12 9, 18 20 T 30 20" stroke="white" stroke-width="4" stroke-linecap="round" fill="none"/><circle cx="6" cy="20" r="3" fill="white"/>`,

  // Drift / curve
  drift: `<path d="M8 32 Q 20 32 20 20 Q 20 8 32 8" stroke="white" stroke-width="4" stroke-linecap="round" fill="none" stroke-dasharray="6 5"/><circle cx="32" cy="8" r="3" fill="white"/>`,

  // Sports / ball sport
  sport: `<circle cx="20" cy="20" r="10" stroke="white" stroke-width="3" fill="none"/><path d="M12 14 Q20 20 28 14" stroke="white" stroke-width="2" fill="none"/><path d="M12 26 Q20 20 28 26" stroke="white" stroke-width="2" fill="none"/>`,

  // Shooter / crosshair
  crosshair: `<circle cx="20" cy="20" r="8" stroke="white" stroke-width="2.5" fill="none"/><line x1="20" y1="8" x2="20" y2="14" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="20" y1="26" x2="20" y2="32" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="8" y1="20" x2="14" y2="20" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="26" y1="20" x2="32" y2="20" stroke="white" stroke-width="2.5" stroke-linecap="round"/>`,

  // Strategy / chess
  chess: `<path d="M16 8 L16 14 L12 18 L12 28 L28 28 L28 18 L24 14 L24 8 Z" fill="white" opacity="0.9"/><rect x="10" y="28" width="20" height="4" rx="1" fill="white"/>`,

  // Card game
  card: `<rect x="10" y="8" width="16" height="24" rx="3" fill="white" opacity="0.9"/><rect x="14" y="10" width="4" height="4" rx="1" fill="currentColor" opacity="0.3"/><text x="20" y="27" text-anchor="middle" fill="currentColor" font-size="8" opacity="0.4">A</text>`,

  // Board game / dice
  dice: `<rect x="8" y="8" width="24" height="24" rx="4" fill="white" opacity="0.9"/><circle cx="14" cy="14" r="2" fill="currentColor" opacity="0.4"/><circle cx="26" cy="14" r="2" fill="currentColor" opacity="0.4"/><circle cx="20" cy="20" r="2" fill="currentColor" opacity="0.4"/><circle cx="14" cy="26" r="2" fill="currentColor" opacity="0.4"/><circle cx="26" cy="26" r="2" fill="currentColor" opacity="0.4"/>`,

  // Word game
  word: `<rect x="6" y="12" width="11" height="11" rx="2" fill="white" opacity="0.9"/><rect x="19" y="12" width="11" height="11" rx="2" fill="white" opacity="0.7"/><rect x="12" y="24" width="11" height="11" rx="2" fill="white" opacity="0.8"/><text x="11.5" y="21" text-anchor="middle" fill="currentColor" font-size="7" font-weight="bold" opacity="0.4">W</text>`,

  // Trivia / question
  trivia: `<circle cx="20" cy="18" r="12" fill="white" opacity="0.9"/><text x="20" y="23" text-anchor="middle" fill="currentColor" font-size="16" font-weight="bold" opacity="0.4">?</text>`,

  // Platform
  platform: `<rect x="4" y="28" width="12" height="4" rx="1" fill="white"/><rect x="20" y="22" width="12" height="4" rx="1" fill="white" opacity="0.8"/><rect x="10" y="16" width="12" height="4" rx="1" fill="white" opacity="0.6"/><circle cx="16" cy="12" r="3" fill="white"/>`,

  // Fighting
  fighting: `<path d="M14 12 L10 20 L16 20 L14 30" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M26 12 L30 20 L24 20 L26 30" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,

  // Simulation
  sim: `<rect x="8" y="18" width="24" height="14" rx="2" fill="white" opacity="0.9"/><path d="M8 22 L16 12 L24 18 L32 10" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,

  // Cooking
  cooking: `<ellipse cx="20" cy="26" rx="14" ry="6" fill="white" opacity="0.8"/><path d="M10 26 Q10 16 20 14 Q30 16 30 26" fill="white" opacity="0.6"/><line x1="20" y1="8" x2="20" y2="14" stroke="white" stroke-width="2" stroke-linecap="round"/><path d="M16 8 Q20 4 24 8" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/>`,

  // Music
  music: `<circle cx="14" cy="26" r="5" fill="white" opacity="0.9"/><circle cx="28" cy="22" r="5" fill="white" opacity="0.7"/><line x1="19" y1="26" x2="19" y2="8" stroke="white" stroke-width="2.5"/><line x1="33" y1="22" x2="33" y2="6" stroke="white" stroke-width="2.5"/><path d="M19 8 L33 6" stroke="white" stroke-width="3" stroke-linecap="round"/>`,

  // Horror
  horror: `<path d="M12 30 Q12 14 20 10 Q28 14 28 30" fill="white" opacity="0.85"/><circle cx="16" cy="22" r="2" fill="currentColor" opacity="0.4"/><circle cx="24" cy="22" r="2" fill="currentColor" opacity="0.4"/><path d="M16 28 Q20 26 24 28" stroke="currentColor" stroke-width="1.5" fill="none" opacity="0.3"/>`,

  // Casual
  casual: `<path d="M20 8 L24 16 L33 17 L26 24 L28 33 L20 28 L12 33 L14 24 L7 17 L16 16 Z" fill="white" opacity="0.9"/>`,

  // Multiplayer
  multi: `<circle cx="14" cy="14" r="5" fill="white" opacity="0.9"/><circle cx="26" cy="14" r="5" fill="white" opacity="0.7"/><circle cx="20" cy="26" r="5" fill="white" opacity="0.8"/><line x1="14" y1="19" x2="20" y2="21" stroke="white" stroke-width="2" opacity="0.5"/><line x1="26" y1="19" x2="20" y2="21" stroke="white" stroke-width="2" opacity="0.5"/>`,

  // 3D
  cube: `<path d="M20 6 L34 14 L34 28 L20 36 L6 28 L6 14 Z" fill="none" stroke="white" stroke-width="2.5" stroke-linejoin="round"/><path d="M20 6 L20 20 L34 28 M20 20 L6 28" stroke="white" stroke-width="2" stroke-linejoin="round" opacity="0.6"/>`,

  // Retro
  retro: `<rect x="8" y="12" width="6" height="6" fill="white"/><rect x="17" y="12" width="6" height="6" fill="white" opacity="0.8"/><rect x="26" y="12" width="6" height="6" fill="white" opacity="0.6"/><rect x="8" y="22" width="6" height="6" fill="white" opacity="0.7"/><rect x="17" y="22" width="6" height="6" fill="white" opacity="0.9"/><rect x="26" y="22" width="6" height="6" fill="white" opacity="0.5"/>`,

  // Educational
  edu: `<path d="M6 18 L20 10 L34 18 L20 26 Z" fill="white" opacity="0.9"/><line x1="20" y1="26" x2="20" y2="34" stroke="white" stroke-width="2.5"/><path d="M12 22 L12 30 Q20 36 28 30 L28 22" stroke="white" stroke-width="2" fill="none" opacity="0.7"/>`,

  // IO games
  io: `<circle cx="20" cy="20" r="10" fill="white" opacity="0.85"/><circle cx="12" cy="14" r="4" fill="white" opacity="0.5"/><circle cx="30" cy="26" r="6" fill="white" opacity="0.6"/>`,

  // Physics
  physics: `<circle cx="14" cy="14" r="6" fill="white" opacity="0.9"/><circle cx="28" cy="28" r="4" fill="white" opacity="0.7"/><line x1="18" y1="18" x2="25" y2="25" stroke="white" stroke-width="2" stroke-dasharray="3 3"/>`,

  // Default / generic
  default: `<polygon points="20,6 25,16 36,17 28,25 30,36 20,30 10,36 12,25 4,17 15,16" fill="white" opacity="0.9"/>`,
};

// Map category to default icon type
const categoryIconMap = {
  trending: 'casual',
  puzzle: 'blocks',
  racing: 'car',
  runner: 'runner',
  arcade: 'stack',
  io: 'io',
  sports: 'sport',
  physics: 'physics',
  strategy: 'chess',
  shooter: 'crosshair',
  card: 'card',
  board: 'dice',
  word: 'word',
  trivia: 'trivia',
  platformer: 'platform',
  fighting: 'fighting',
  simulation: 'sim',
  cooking: 'cooking',
  music: 'music',
  horror: 'horror',
  casual: 'casual',
  multiplayer: 'multi',
  '3d': 'cube',
  retro: 'retro',
  educational: 'edu',
};

/**
 * Get SVG icon markup for a game
 * @param {string} iconType - Icon type identifier
 * @param {string} category - Game category (fallback)
 * @returns {string} SVG inner content
 */
export function getGameIcon(iconType, category) {
  const template =
    iconTemplates[iconType] ||
    iconTemplates[categoryIconMap[category]] ||
    iconTemplates.default;

  return `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">${template}</svg>`;
}

/**
 * Get the default icon type for a category
 */
export function getCategoryIcon(category) {
  return categoryIconMap[category] || 'default';
}
