import { games } from '../data/games.js';
import '../styles/about.css';

export function createAboutPage() {
  const playable = games.filter((game) => game.isPlayable);
  const featured = ['apex-velocity', 'hextris', 'voxelcraft'].map((id) => playable.find((game) => game.id === id)).filter(Boolean);
  const page = document.createElement('main');
  page.className = 'page-content about-page';
  page.setAttribute('itemscope', '');
  page.setAttribute('itemtype', 'https://schema.org/AboutPage');
  page.innerHTML = `
    <section class="page-hero about-intro" aria-labelledby="about-title">
      <div class="about-intro-copy">
        <span class="about-eyebrow"><span aria-hidden="true">✦</span> A little about Playzy</span>
        <h1 id="about-title" itemprop="headline">Good games.<br>Great little<br><em>escapes.</em></h1>
        <p itemprop="description">A quick break. A new high score. One more try. Playzy is a home for free browser games and the simple joy of playing.</p>
        <div class="about-actions"><a class="about-button" href="/">Find your next game <span aria-hidden="true">↗</span></a><a class="about-text-link" href="#our-story">Meet Playzy <span aria-hidden="true">↓</span></a></div>
        <span class="about-small-note">Free to play · No app download needed</span>
      </div>
      <div class="about-showcase" aria-label="A few games from the Playzy collection">
        <div class="about-showcase-label"><span class="about-status-dot" aria-hidden="true"></span> SMALL BREAK. BIG ADVENTURE.</div>
        ${featured.map((game, index) => `<a class="about-game about-game-${index}" href="${game.url || `/games/${game.id}/`}"><img src="${game.image}" alt="" width="560" height="340"><div><span>${game.category === '3d' ? 'Build your own world' : game.category === 'racing' ? 'Find your next gear' : 'Get into the flow'}</span><strong>${game.title}</strong><b aria-hidden="true">↗</b></div></a>`).join('')}
        <span class="about-play-sticker" aria-hidden="true">JUST<br>PLAY.</span>
      </div>
    </section>

    <dl class="about-numbers page-section" aria-label="Playzy at a glance">
      <div><dt>Playable games</dt><dd>${playable.length}<span> and counting</span></dd></div>
      <div><dt>Ways to play</dt><dd>${new Set(playable.map((game) => game.category)).size}<span> categories</span></dd></div>
      <div><dt>App downloads</dt><dd>Zero<span> just your browser</span></dd></div>
      <div><dt>Made for</dt><dd>You<span> and your next break</span></dd></div>
    </dl>

    <section class="page-section about-story" id="our-story" aria-labelledby="story-title">
      <div><span class="about-eyebrow">01 / The idea</span><h2 id="story-title">Less setup.<br>More <em>“one more go.”</em></h2></div>
      <div class="about-story-copy"><p>Playing a game should be the easy part. Playzy brings arcade challenges, puzzles, racing games, and worlds to build together into one place, right in your browser.</p><p>Pick something that catches your eye, learn the controls, and jump in. Whether you have five minutes or a whole afternoon, there’s a different kind of escape waiting for you.</p></div>
    </section>

    <section class="page-section" aria-labelledby="values-title">
      <div class="about-section-heading"><span class="about-eyebrow">02 / What matters</span><h2 id="values-title">Built around the fun.</h2></div>
      <div class="about-values">
        <article><span class="about-value-icon" aria-hidden="true">↗</span><h3>Open. Pick. Play.</h3><p>No app installation to get in the way. Open a game in your browser and make a little time for yourself.</p></article>
        <article><span class="about-value-icon" aria-hidden="true">✳</span><h3>Follow your mood.</h3><p>Chase a fast lap, solve a puzzle, or build something new. Explore different games at your own pace.</p></article>
        <article><span class="about-value-icon" aria-hidden="true">♡</span><h3>Made with care.</h3><p>An independent project where the games, the details, and your feedback all help shape what comes next.</p></article>
      </div>
    </section>

    <section class="page-section about-maker" aria-labelledby="maker-title">
      <div class="about-maker-mark" aria-hidden="true">dg<span>DESIGN × PLAY</span></div>
      <div><span class="about-eyebrow">03 / Behind the screen</span><h2 id="maker-title">Hi, I’m Dharmik.</h2><p>I’m the designer and developer behind Playzy. This is where I bring together interactive web experiences and browser games, with room to experiment and keep building.</p><a class="about-text-link" href="https://dharmikgohil.art" target="_blank" rel="noopener noreferrer">Explore my work <span aria-hidden="true">↗</span><span class="about-sr-only"> (opens in a new tab)</span></a></div>
    </section>

    <section class="page-section about-faq" aria-labelledby="faq-title">
      <div><span class="about-eyebrow">04 / Good to know</span><h2 id="faq-title">Before you<br>press play.</h2></div>
      <div class="about-questions">
        <details><summary>Are the games free to play?</summary><p>Yes. The games in the Playzy catalogue are free to play in your browser.</p></details>
        <details><summary>Do I need an account?</summary><p>Most games can be played without signing up. Infinite World requires an account to save worlds and play with others.</p></details>
        <details><summary>Can I play on my phone?</summary><p>Playzy works in desktop and mobile browsers. Controls and device support vary by game, so check the controls on each game’s page before playing.</p></details>
        <details><summary>Have an idea or found a problem?</summary><p>Visit the <a href="/contact/">contact page</a> to find ways to get in touch. Include the game name and what happened if you’re reporting an issue.</p></details>
      </div>
    </section>

    <section class="page-section about-outro" aria-labelledby="outro-title"><span class="about-eyebrow">Your next little escape</span><h2 id="outro-title">Enough about us.<br>Let’s play.</h2><a class="about-button" href="/">Explore the games <span aria-hidden="true">↗</span></a></section>
  `;
  // Keep this section jump local; the app uses hashchange to render routes.
  page.querySelector('a[href="#our-story"]').addEventListener('click', (event) => {
    event.preventDefault();
    const story = page.querySelector('#our-story');
    story.setAttribute('tabindex', '-1');
    story.focus({ preventScroll: true });
    story.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  });
  return page;
}
