// ─── About Page ───

export function createAboutPage() {
  const page = document.createElement('div');
  page.className = 'page-content';

  page.innerHTML = `
    <div class="page-hero">
      <span class="page-badge">About Us</span>
      <h1 class="page-title">We build games people love.</h1>
      <p class="page-subtitle">Playzy is a free browser-based gaming platform that brings instant entertainment to millions of players worldwide — no downloads, no installs, no hassle.</p>
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
          <h3>Global Reach</h3>
          <p>With over 50 million plays every month, Playzy serves gamers across 180+ countries. Our platform is optimized for speed, loading games in under 2 seconds on any device.</p>
        </div>
        <div class="about-card">
          <div class="about-icon" style="background:rgba(31,201,139,0.12);color:var(--green)">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <h3>Quality Games</h3>
          <p>We curate and develop over 1,000 games across 25 categories — from brain-teasing puzzles to high-speed racing, classic arcade to immersive 3D experiences.</p>
        </div>
      </div>
    </div>

    <div class="page-section">
      <h2 class="section-title">What We Do</h2>
      <div class="about-text-block">
        <p>Playzy is a next-generation gaming platform designed for the modern web. We develop, curate, and host browser-based games that run entirely in your browser using cutting-edge web technologies including <strong>HTML5 Canvas</strong>, <strong>WebGL</strong>, <strong>Phaser 3</strong>, <strong>PixiJS</strong>, and <strong>Three.js</strong>.</p>
        <p>Our platform eliminates the traditional friction of gaming — there are no app store downloads, no storage requirements, no sign-ups needed. Simply open a game and start playing in seconds. Whether you're on a laptop, tablet, or phone, Playzy delivers a seamless gaming experience.</p>
        <p>We continuously add new games every week, ensuring there's always something fresh and exciting to discover. Our library spans 25 diverse categories including Puzzle, Racing, Arcade, Runner, Sports, Strategy, Shooter, Simulation, and many more.</p>
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
          <p>Playzy is designed and developed by <strong>dharmikgohil.art</strong> — a creative studio specializing in interactive web experiences, browser-based game development, and modern web applications. With a passion for blending art and technology, dharmikgohil.art crafts immersive digital products that delight users worldwide.</p>
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
          <b>1,000+</b>
          <span>Games Available</span>
        </div>
        <div class="highlight-item">
          <b>25</b>
          <span>Game Categories</span>
        </div>
        <div class="highlight-item">
          <b>50M+</b>
          <span>Monthly Plays</span>
        </div>
        <div class="highlight-item">
          <b>180+</b>
          <span>Countries Served</span>
        </div>
        <div class="highlight-item">
          <b>&lt;2s</b>
          <span>Average Load Time</span>
        </div>
        <div class="highlight-item">
          <b>Weekly</b>
          <span>New Game Drops</span>
        </div>
      </div>
    </div>
  `;

  return page;
}
