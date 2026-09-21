// ─── Playzy — main entry point ───

import './styles/variables.css';
import './styles/base.css';
import './styles/components.css';
import './styles/animations.css';
import './styles/pages.css';
import './styles/game-ui.css';

import gsap from 'gsap';

import { updateSEO, PAGE_SEO, buildGameSEO } from './utils/seo.js';
import { games } from './data/games.js';

import { initTheme } from './core/theme.js';
import { runUnmounts } from './core/lifecycle.js';
import { unlockAudio } from './core/audio.js';
import { getStreak, getMissions } from './core/progress.js';

import { createNavbar } from './components/navbar.js';
import { createCategories } from './components/categories.js';
import { createHero } from './components/hero.js';
import { createGameGrid } from './components/gameGrid.js';
import { createStatsBar } from './components/statsBar.js';
import { createFooter } from './components/footer.js';

import { createAboutPage } from './components/aboutPage.js';
import { createTermsPage } from './components/termsPage.js';
import { createPrivacyPage } from './components/privacyPage.js';
import { createContactPage } from './components/contactPage.js';
import { createPlayPage, destroyActiveGame, siteToast } from './components/playPage.js';

window.gsap = gsap;

let app = null;
let currentPage = null;

function initApp() {
  app = document.getElementById('app');
  if (!app) return;

  initTheme();

  // Browsers need a user gesture before any audio can play.
  const unlockOnce = () => {
    unlockAudio();
    window.removeEventListener('pointerdown', unlockOnce);
    window.removeEventListener('keydown', unlockOnce);
  };
  window.addEventListener('pointerdown', unlockOnce);
  window.addEventListener('keydown', unlockOnce);

  window.addEventListener('hashchange', renderPage);
  renderPage();
  greetReturningPlayer();
}

function renderPage() {
  destroyActiveGame();
  runUnmounts();
  app.innerHTML = '';

  const hash = (window.location.hash || '#/').replace('#', '');

  if (hash.startsWith('/play/') || hash.startsWith('play/')) {
    renderPlayPage(hash.replace(/^\/?play\//, ''));
    return;
  }

  app.appendChild(createNavbar());

  if (hash === 'about') {
    updateSEO(PAGE_SEO.about);
    renderSubPage(createAboutPage(), PAGE_SEO.about.title);
  } else if (hash === 'terms') {
    updateSEO(PAGE_SEO.terms);
    renderSubPage(createTermsPage(), PAGE_SEO.terms.title);
  } else if (hash === 'privacy') {
    updateSEO(PAGE_SEO.privacy);
    renderSubPage(createPrivacyPage(), PAGE_SEO.privacy.title);
  } else if (hash === 'contact') {
    updateSEO(PAGE_SEO.contact);
    renderSubPage(createContactPage(), PAGE_SEO.contact.title);
  } else {
    renderHomePage();
  }

  app.appendChild(createFooter());
  window.scrollTo({ top: 0, behavior: 'instant' });
  animatePageEntrance();
}

function renderPlayPage(gameId) {
  const game = games.find((g) => g.id === gameId) || {
    id: gameId,
    title: gameId.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    category: 'arcade',
    plays: '1M+',
    rating: 4.8,
  };
  updateSEO(PAGE_SEO[gameId] || buildGameSEO(game));
  currentPage = 'play';

  app.appendChild(createPlayPage(gameId));
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function renderHomePage() {
  updateSEO(PAGE_SEO.home);
  currentPage = 'home';

  const wrap = document.createElement('div');
  wrap.className = 'wrap';
  wrap.appendChild(createCategories());
  wrap.appendChild(createHero());
  wrap.appendChild(createGameGrid());

  app.appendChild(wrap);
  app.appendChild(createStatsBar());
}

function renderSubPage(pageContent, title) {
  if (document.title !== title) document.title = title;
  currentPage = 'sub';

  const backWrap = document.createElement('div');
  backWrap.className = 'wrap';
  backWrap.style.paddingTop = '20px';
  backWrap.innerHTML = `
    <a href="#/" class="back-home">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
      </svg>
      Back to games
    </a>
  `;
  app.appendChild(backWrap);
  app.appendChild(pageContent);
}

/** One-time nudge that makes the daily loop visible on arrival. */
function greetReturningPlayer() {
  const streak = getStreak();
  const missions = getMissions();
  const claimable = missions.filter((m) => m.done && !m.claimed).length;

  setTimeout(() => {
    if (claimable > 0) {
      siteToast(`${claimable} mission reward${claimable === 1 ? '' : 's'} ready to claim`);
    } else if (streak.count > 0 && !streak.playedToday) {
      siteToast(`🔥 ${streak.count}-day streak — play once today to keep it`);
    }
  }, 1400);
}

function animatePageEntrance() {
  if (currentPage === 'home') {
    gsap.from('.hero-copy', { x: -32, opacity: 0, duration: 0.7, delay: 0.15, ease: 'power3.out', clearProps: 'all' });
    gsap.from('.hero-art', { x: 32, opacity: 0, duration: 0.7, delay: 0.25, ease: 'power3.out', clearProps: 'all' });
    gsap.from('.cat-btn', { y: 10, opacity: 0, duration: 0.4, stagger: 0.025, delay: 0.08, ease: 'power2.out', clearProps: 'all' });
    gsap.from('.game-card', {
      y: 26, opacity: 0, duration: 0.45, stagger: 0.04, delay: 0.35, ease: 'power2.out',
      clearProps: 'transform,opacity',
      onComplete() {
        document.querySelectorAll('.game-card').forEach((c) => c.classList.add('animated'));
      },
    });

    const statsOuter = document.querySelector('.stats-outer');
    if (statsOuter) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.from('.stat', { y: 18, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' });
            observer.disconnect();
          }
        });
      }, { threshold: 0.3 });
      observer.observe(statsOuter);
    }
  } else if (currentPage === 'sub') {
    gsap.from('.page-hero', { y: 26, opacity: 0, duration: 0.6, delay: 0.1, ease: 'power3.out' });
    gsap.from('.page-section', { y: 18, opacity: 0, duration: 0.5, stagger: 0.09, delay: 0.25, ease: 'power2.out' });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
