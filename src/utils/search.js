// ─── Fuzzy search utility for games ───

/**
 * Simple fuzzy match - checks if all characters of the query
 * appear in the target string in order
 */
function fuzzyMatch(query, target) {
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  // Exact substring match gets highest priority
  if (t.includes(q)) return 2;

  // Fuzzy character match
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length ? 1 : 0;
}

/**
 * Search games by query string
 * @param {Array} games - Array of game objects
 * @param {string} query - Search query
 * @returns {Array} Filtered and sorted games
 */
export function searchGames(games, query) {
  if (!query || query.trim().length === 0) return games;

  const q = query.trim().toLowerCase();

  return games
    .map((game) => {
      const titleScore = fuzzyMatch(q, game.title) * 3;
      const categoryScore = fuzzyMatch(q, game.category);
      const score = titleScore + categoryScore;
      return { game, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ game }) => game);
}

/**
 * Filter games by category
 * @param {Array} games - Array of game objects
 * @param {string} category - Category id (or 'trending' for all)
 * @returns {Array} Filtered games
 */
export function filterByCategory(games, category) {
  if (!category || category === 'trending') return games;
  return games.filter(
    (g) => g.category === category
  );
}

/**
 * Sort games by different criteria
 */
export function sortGames(games, sortBy = 'popular') {
  const sorted = [...games];
  switch (sortBy) {
    case 'popular':
      return sorted.sort((a, b) => parsePlayCount(b.plays) - parsePlayCount(a.plays));
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating);
    case 'name':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return sorted;
  }
}

function parsePlayCount(str) {
  if (!str) return 0;
  const num = parseFloat(str);
  if (str.includes('M')) return num * 1000000;
  if (str.includes('K')) return num * 1000;
  return num;
}
