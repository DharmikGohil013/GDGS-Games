// ─── About Page ───

export function createAboutPage() {
  const page = document.createElement('div');
  page.className = 'page-content';
  // Schema.org AboutPage microdata
  page.setAttribute('itemscope', '');
  page.setAttribute('itemtype', 'https://schema.org/AboutPage');

  page.innerHTML = `
    <div class="page-hero" role="banner">
      <span class="page-badge" aria-label="Section: About Us">About Us</span>
      <h1 class="page-title" itemprop="headline">We build games people love.</h1>
      <p class="page-subtitle" itemprop="description">Playzy is a browser games platform built by Dharmik Gohil. Play selected arcade, puzzle, racing and other games online without downloading an app.</p>
    </div>

    <div class="page-section">
      <div class="about-grid">
        <div class="about-card">
          <div class="about-icon" style="background:rgba(255,95,77,0.12);color:var(--coral)">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 12h4a2 2 0 0 1 2 2v6H4v-6a2 2 0 0 1 2-2z"/>
              <path d="M14 8h4a2 2 0 0 1 2 2v10h-8v-10a2 2 0 0 1 2-2z"/>
              <path d="M10 2h4a2 2 0 0 1 2 2v16h-8V4a2 2 0 0 1 2-2z"/>
            </svg>
          </div>
          <h3>Our Mission</h3>
          <p>To make gaming accessible to everyone, everywhere. We believe that great games should load instantly in your browser — free, fast, and fun. No barriers, no waiting.</p>
        </div>
        <div class="about-card">
          <div class="about-icon" style="background:rgba(62,107,255,0.12);color:var(--blue)">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <h3>Play in Your Browser</h3>
          <p>Open a game on desktop or mobile and play in your browser. Most games do not require an account; Infinite World uses an account to save and share multiplayer worlds.</p>
        </div>
        <div class="about-card">
          <div class="about-icon" style="background:rgba(31,201,139,0.12);color:var(--green)">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <h3>Quality Games</h3>
          <p>Playzy includes a growing set of playable games across categories such as puzzles, racing, arcade, runners, and multiplayer. Cards marked “Coming soon” are catalogue previews and are not playable yet.</p>
        </div>
      </div>
    </div>

    <div class="page-section">
      <h2 class="section-title">What We Do</h2>
      <div class="about-text-block">
        <p>Playzy is a next-generation gaming platform designed for the modern web. We develop, curate, and host browser-based games that run entirely in your browser using cutting-edge web technologies including <strong>HTML5 Canvas</strong>, <strong>WebGL</strong>, <strong>Phaser 3</strong>, <strong>PixiJS</strong>, and <strong>Three.js</strong>.</p>
        <p>Most games run directly in the browser without an app download or sign-up. Infinite World is the exception: it requires an account to save worlds and play with others. The site works on desktop and mobile browsers.</p>
        <p>Browse games by category, read each game's controls and tips, and open a game to play. The catalogue also includes preview cards for games that are still in development.</p>
      </div>
    </div>

    <div class="page-section">
      <h2 class="section-title">Built by dharmikgohil.art</h2>
      <div class="about-creator">
        <div class="creator-avatar">
          <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
            <circle cx="24" cy="24" r="23" fill="var(--coral)" opacity="0.15" stroke="var(--coral)" stroke-width="2"/>
            <text x="24" y="30" text-anchor="middle" fill="var(--coral)" font-size="18" font-weight="700" font-family="Bungee, sans-serif">D</text>
          </svg>
        </div>
        <div class="creator-info">
          <h3><a href="https://dharmikgohil.art" target="_blank" rel="noopener noreferrer">dharmikgohil.art</a></h3>
          <p>Playzy is designed and developed by <strong>dharmikgohil.art</strong>, which creates interactive web experiences, browser games, and web applications.</p>
          <p>From concept to deployment, every aspect of Playzy — the game engine integration, visual design, user interface, animations, and the gaming experience itself — is built with meticulous attention to detail and a commitment to quality.</p>
        </div>
      </div>
    </div>

    <div class="page-section">
      <h2 class="section-title">Our Technology</h2>
      <div class="tech-grid">
        <div class="tech-item">
          <span class="tech-label">Game Engines</span>
          <span class="tech-value">Phaser 3, PixiJS, Three.js, Babylon.js, PlayCanvas</span>
        </div>
        <div class="tech-item">
          <span class="tech-label">Animations</span>
          <span class="tech-value">GSAP, Framer Motion, Lottie</span>
        </div>
        <div class="tech-item">
          <span class="tech-label">Audio</span>
          <span class="tech-value">Howler.js</span>
        </div>
        <div class="tech-item">
          <span class="tech-label">Build System</span>
          <span class="tech-value">Vite, Git, GitHub</span>
        </div>
        <div class="tech-item">
          <span class="tech-label">Networking</span>
          <span class="tech-value">Socket.IO, WebSockets</span>
        </div>
        <div class="tech-item">
          <span class="tech-label">Deployment</span>
          <span class="tech-value">Vercel, Cloudflare Pages</span>
        </div>
      </div>
    </div>

    <div class="page-section">
      <h2 class="section-title">Platform Highlights</h2>
      <div class="highlights-grid">
        <div class="highlight-item">
          <b>14</b>
          <span>Games currently playable</span>
        </div>
        <div class="highlight-item">
          <b>6</b>
          <span>Game categories</span>
        </div>
        <div class="highlight-item">
          <b>Free</b>
          <span>To play in your browser</span>
        </div>
        <div class="highlight-item">
          <b>No</b>
          <span>App download needed</span>
        </div>
      </div>
    </div>
  `;

  return page;
}
