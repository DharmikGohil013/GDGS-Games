// Original homepage copy: explains what Playzy is, how the catalogue is organised
// and answers the questions new visitors ask. Written for people first; it also
// gives crawlers (including AdSense review) real, readable content on the home page.
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
    <p>Playing on a computer? Browse our <a href="/pc-games/">free PC games you can play online</a>.</p>

    <h3>How Playzy works</h3>
    <p>Every game on Playzy runs directly in your web browser using HTML5, Canvas, WebGL and JavaScript. There is nothing to install and no account to create for most games. Open a game page, read the short control guide, and press play. Your best scores, settings and progress are saved on your own device in local storage, so you can return to the same browser and carry on where you stopped.</p>
    <p>Each game has its own page with a plain-language overview, a tutorial with controls and tips, a support and FAQ page, and details about how the game was built. If you are unsure whether a game suits you, those pages explain what to expect before you start.</p>

    <h3>What you can play</h3>
    <ul>
      <li><strong>Puzzle games</strong> such as <a href="/games/hextris/">Hextris Stack</a> and <a href="/games/block-merge/">Block Merge</a> reward planning and quick thinking in short rounds.</li>
      <li><strong>Racing games</strong> such as <a href="/games/turbo-drift/">Turbo Drift</a> and <a href="/games/apex-velocity/">Apex Velocity</a> focus on car handling, lap times and track building.</li>
      <li><strong>Arcade and runner games</strong> such as <a href="/games/neon-snake/">Neon Snake</a>, <a href="/games/city-sprint/">City Sprint</a> and <a href="/games/ball-drop/">Ball Drop</a> are easy to learn and hard to put down.</li>
      <li><strong>Building and simulation games</strong> such as <a href="/games/voxelcraft/">VoxelCraft</a> and <a href="/games/infinite-world/">Infinite World</a> give you space to create and explore at your own pace.</li>
    </ul>

    <h3>Playing on phone, tablet or PC</h3>
    <p>Most games support both keyboard and touch controls. On a PC, keyboard and mouse usually give the most precise control. On a phone or tablet, turn the device to landscape for racing and platform games. For the best performance, use a recent version of Chrome, Edge, Firefox or Safari, and close heavy tabs before starting 3D games.</p>

    <h3>Frequently asked questions</h3>
    <h4>Is Playzy free?</h4>
    <p>Yes. All games are free to play. The site is supported by advertising, which is described in our <a href="/privacy/">Privacy Policy</a>.</p>
    <h4>Do I need to download or sign up?</h4>
    <p>No download is needed. Almost every game works without an account. The multiplayer city builder <a href="/games/infinite-world/">Infinite World</a> offers optional accounts.</p>
    <h4>Where is my progress saved?</h4>
    <p>On your device, in your browser's local storage. Clearing site data or switching browser will reset it.</p>
    <h4>A game is not loading. What should I do?</h4>
    <p>Refresh the page, check that JavaScript and hardware acceleration are enabled, and try another modern browser. If the problem continues, send us the game name and your browser details from the <a href="/contact/">Contact page</a>.</p>
    <h4>Who makes Playzy?</h4>
    <p>Playzy is designed and developed by Dharmik Gohil. You can read more on the <a href="/about/">About page</a>.</p>
  `;
  return section;
}
