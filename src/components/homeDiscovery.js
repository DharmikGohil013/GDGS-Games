// Short, useful homepage copy for the searches this catalog actually serves.
export function createHomeDiscovery() {
  const section = document.createElement('section');
  section.className = 'section home-discovery';
  section.setAttribute('aria-labelledby', 'home-discovery-heading');
  section.innerHTML = `
    <div class="section-head">
      <h2 id="home-discovery-heading">Free games online, ready to play</h2>
    </div>
    <p>Looking for free games to play without downloading anything? Choose a game above and play in your browser. Playzy has quick arcade challenges, puzzle games, racing games, runners and longer adventures for PC, laptop and phone browsers.</p>
    <p>Try <a href="/games/hextris/">Hextris Stack</a> or <a href="/games/block-merge/">Block Merge</a> for free puzzle games, <a href="/games/turbo-drift/">Turbo Drift</a> for car racing, <a href="/games/neon-snake/">Neon Snake</a> for a classic arcade game, and <a href="/games/infinite-runner/">Infinite Runner</a> for a running challenge. For a game to play with friends, explore <a href="/games/infinite-world/">Infinite World</a>.</p>
  `;
  return section;
}
