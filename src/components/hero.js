// ─── Hero Section Component with Auto-Swapping Carousel ───
import { setState } from '../store.js';

const featuredGames = [
  {
    id: 'tower-stacker',
    title: 'Tower Stacker',
    headline: 'Insert coin.<br>Skip the download.',
    sub: '1,000+ browser games that load in under 2 seconds. No app store, no install, no storage eaten up.',
    eyebrow: 'Featured today',
    bg: 'linear-gradient(155deg, var(--coral), var(--coral-dark))',
    tag: 'Tower Stacker',
    category: 'arcade',
    isPlayable: true,
    engine: 'phaser',
    artSvg: `<svg viewBox="0 0 80 80" width="76" height="76" aria-hidden="true"><circle cx="40" cy="40" r="38" fill="rgba(255,255,255,0.16)"/><path d="M32 24 L58 40 L32 56 Z" fill="white"/></svg>`
  },
  {
    id: 'turbo-drift',
    title: 'Turbo Drift',
    headline: 'Burn rubber.<br>Master every turn.',
    sub: 'Experience high-speed 3D car drifting directly in your web browser with zero loading lag.',
    eyebrow: '3D Racing Hot Pick',
    bg: 'linear-gradient(155deg, var(--blue), var(--blue-dark))',
    tag: 'Turbo Drift',
    category: 'racing',
    isPlayable: true,
    engine: 'three',
    artSvg: `<svg viewBox="0 0 80 80" width="76" height="76" aria-hidden="true"><circle cx="40" cy="40" r="38" fill="rgba(255,255,255,0.16)"/><path d="M20 56 L40 24 L60 56" stroke="white" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`
  },
  {
    id: 'neon-snake',
    title: 'Neon Snake',
    headline: 'Glow & grow.<br>Retro reinvented.',
    sub: 'The legendary classic snake game enhanced with glowing neon visuals and high score action!',
    eyebrow: 'Arcade Classic',
    bg: 'linear-gradient(155deg, var(--green), var(--green-dark))',
    tag: 'Neon Snake',
    category: 'arcade',
    isPlayable: true,
    engine: 'pixi',
    artSvg: `<svg viewBox="0 0 80 80" width="76" height="76" aria-hidden="true"><circle cx="40" cy="40" r="38" fill="rgba(255,255,255,0.16)"/><path d="M16 56 H34 V38 H52 V20 H66" stroke="white" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="66" cy="20" r="5" fill="white"/></svg>`
  },
  {
    id: 'city-sprint',
    title: 'City Sprint',
    headline: 'Run the skyline.<br>Dodge obstacles.',
    sub: 'An intense endless runner experience. Leap across rooftops and collect coins in real-time!',
    eyebrow: 'Popular Runner',
    bg: 'linear-gradient(155deg, var(--purple), var(--purple-dark))',
    tag: 'City Sprint',
    category: 'runner',
    isPlayable: true,
    engine: 'pixi',
    artSvg: `<svg viewBox="0 0 80 80" width="76" height="76" aria-hidden="true"><circle cx="40" cy="40" r="38" fill="rgba(255,255,255,0.16)"/><circle cx="44" cy="18" r="7" fill="white"/><path d="M44 28 L34 48 L20 56 M44 28 L54 44 L66 40 M34 48 L42 60 L36 72" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`
  }
];

export function createHero() {
  const section = document.createElement('section');
  section.className = 'hero';
  section.setAttribute('aria-label', 'Featured games slider');

  let currentIndex = 0;
  let autoTimer = null;

  section.innerHTML = `
    <div class="hero-copy hero-animate">
      <span class="hero-eyebrow" id="hero-eyebrow">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" style="vertical-align:-2px;margin-right:4px"><path d="M8 1C5.5 4 4 6.5 4 9a4 4 0 0 0 8 0c0-2.5-1.5-5-4-8Zm0 10.5A2.5 2.5 0 0 1 5.5 9c0-1.3.7-2.8 2.5-5 1.8 2.2 2.5 3.7 2.5 5A2.5 2.5 0 0 1 8 11.5Z"/></svg>
        <span id="hero-eyebrow-text">Featured today</span>
      </span>
      <h1 class="hero-title" id="hero-title">Insert coin.<br>Skip the download.</h1>
      <p class="hero-sub" id="hero-sub">1,000+ browser games that load in under 2 seconds. No app store, no install, no storage eaten up.</p>
      
      <div style="display:flex; align-items:center; gap:20px; flex-wrap:wrap;">
        <button class="btn-primary" id="hero-play-btn">
          <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d="M6.5 3.5L17 10L6.5 16.5V3.5Z"/>
          </svg>
          Play now
        </button>

        <div class="hero-controls-row">
          <div class="hero-nav-btns">
            <button class="hero-nav-btn" id="hero-prev" aria-label="Previous featured game">
              <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor"><path d="M12.7 15.3a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4l4.6-4.6a1 1 0 0 1 1.4 1.4L8.8 10l3.9 3.9a1 1 0 0 1 0 1.4z"/></svg>
            </button>
            <button class="hero-nav-btn" id="hero-next" aria-label="Next featured game">
              <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor"><path d="M7.3 4.7a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4l-4.6 4.6a1 1 0 0 1-1.4-1.4L11.2 10 7.3 6.1a1 1 0 0 1 0-1.4z"/></svg>
            </button>
          </div>
          <div class="hero-dots" id="hero-dots">
            ${featuredGames.map((_, i) => `<span class="hero-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`).join('')}
          </div>
        </div>
      </div>
    </div>

    <div class="hero-art" id="hero-art" style="cursor:pointer">
      <span class="tag" id="hero-art-tag">Tower Stacker</span>
      <div id="hero-art-svg">${featuredGames[0].artSvg}</div>
    </div>
  `;

  const copyEl = section.querySelector('.hero-copy');
  const artEl = section.querySelector('#hero-art');
  const playBtn = section.querySelector('#hero-play-btn');
  const prevBtn = section.querySelector('#hero-prev');
  const nextBtn = section.querySelector('#hero-next');
  const dotsContainer = section.querySelector('#hero-dots');

  const eyebrowText = section.querySelector('#hero-eyebrow-text');
  const titleEl = section.querySelector('#hero-title');
  const subEl = section.querySelector('#hero-sub');
  const tagEl = section.querySelector('#hero-art-tag');
  const svgEl = section.querySelector('#hero-art-svg');

  function updateSlide(index) {
    currentIndex = index;
    const currentGame = featuredGames[currentIndex];

    // Trigger transition out
    copyEl.classList.add('hero-sliding-out');
    artEl.classList.add('hero-sliding-out');

    setTimeout(() => {
      // Update Content
      eyebrowText.textContent = currentGame.eyebrow;
      titleEl.innerHTML = currentGame.headline;
      subEl.textContent = currentGame.sub;
      tagEl.textContent = currentGame.tag;
      svgEl.innerHTML = currentGame.artSvg;
      artEl.style.background = currentGame.bg;

      // Update active dot
      dotsContainer.querySelectorAll('.hero-dot').forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentIndex);
      });

      // Transition in
      copyEl.classList.remove('hero-sliding-out');
      artEl.classList.remove('hero-sliding-out');
    }, 200);
  }

  function nextSlide() {
    const nextIdx = (currentIndex + 1) % featuredGames.length;
    updateSlide(nextIdx);
  }

  function prevSlide() {
    const prevIdx = (currentIndex - 1 + featuredGames.length) % featuredGames.length;
    updateSlide(prevIdx);
  }

  function startAutoPlay() {
    stopAutoPlay();
    autoTimer = setInterval(nextSlide, 4000);
  }

  function stopAutoPlay() {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  }

  const playGame = () => {
    const game = featuredGames[currentIndex];
    setState({
      gameModal: {
        open: true,
        game: {
          id: game.id,
          title: game.title,
          category: game.category,
          isPlayable: game.isPlayable,
          engine: game.engine,
        },
      },
    });
  };

  // Event Listeners
  playBtn.addEventListener('click', playGame);
  artEl.addEventListener('click', playGame);

  prevBtn.addEventListener('click', () => {
    prevSlide();
    startAutoPlay();
  });

  nextBtn.addEventListener('click', () => {
    nextSlide();
    startAutoPlay();
  });

  dotsContainer.addEventListener('click', (e) => {
    const dot = e.target.closest('.hero-dot');
    if (dot) {
      const idx = parseInt(dot.dataset.index, 10);
      updateSlide(idx);
      startAutoPlay();
    }
  });

  // Pause autoplay on mouse enter, resume on leave
  section.addEventListener('mouseenter', stopAutoPlay);
  section.addEventListener('mouseleave', startAutoPlay);

  // Start initial timer
  startAutoPlay();

  return section;
}
