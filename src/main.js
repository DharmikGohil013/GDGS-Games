// ─── Playzy — Main Entry Point ───
// Import styles
import './styles/variables.css';
import './styles/base.css';
import './styles/components.css';
import './styles/animations.css';
import './styles/pages.css';

// Import GSAP
import gsap from 'gsap';

// Import components
import { createNavbar } from './components/navbar.js';
import { createCategories } from './components/categories.js';
import { createHero } from './components/hero.js';
import { createGameGrid } from './components/gameGrid.js';
import { createGameModal } from './components/gameModal.js';
import { createStatsBar } from './components/statsBar.js';
import { createFooter } from './components/footer.js';

// Import pages
import { createAboutPage } from './components/aboutPage.js';
import { createTermsPage } from './components/termsPage.js';
import { createPrivacyPage } from './components/privacyPage.js';
import { createContactPage } from './components/contactPage.js';

// Make GSAP available globally for components
window.gsap = gsap;

let app = null;
let currentPage = null;

function initApp() {
  app = document.getElementById('app');
  if (!app) return;

  // Game Modal (appended to body for proper z-index)
  document.body.appendChild(createGameModal());

  // Listen for hash changes
  window.addEventListener('hashchange', renderPage);
  renderPage();
}

function renderPage() {
  const hash = (window.location.hash || '#/').replace('#', '');

  // Clear app content
  app.innerHTML = '';

  // Always add navbar
  app.appendChild(createNavbar());

  // Route to the correct page
  if (hash === 'about') {
    renderSubPage(createAboutPage(), 'About — Playzy');
  } else if (hash === 'terms') {
    renderSubPage(createTermsPage(), 'Terms of Service — Playzy');
  } else if (hash === 'privacy') {
    renderSubPage(createPrivacyPage(), 'Privacy Policy — Playzy');
  } else if (hash === 'contact') {
    renderSubPage(createContactPage(), 'Contact Us — Playzy');
  } else {
    renderHomePage();
  }

  // Always add footer
  app.appendChild(createFooter());

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'instant' });

  // Animate page entrance
  animatePageEntrance();
}

function renderHomePage() {
  document.title = 'Playzy — 1,000+ Instant Browser Games | Play Free Online';
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
  document.title = title;
  currentPage = 'sub';

  // Add back-to-home link
  const backWrap = document.createElement('div');
  backWrap.className = 'wrap';
  backWrap.style.paddingTop = '16px';
  backWrap.innerHTML = `
    <a href="#/" class="back-home">
      <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
        <path d="M10 3L3 10l7 7V13h7v-6h-7V3z"/>
      </svg>
      Back to Games
    </a>
  `;
  app.appendChild(backWrap);
  app.appendChild(pageContent);
}

function animatePageEntrance() {
  if (currentPage === 'home') {
    // Hero entrance
    gsap.from('.hero-copy', {
      x: -40, opacity: 0, duration: 0.8, delay: 0.2, ease: 'power3.out', clearProps: 'all',
    });
    gsap.from('.hero-art', {
      x: 40, opacity: 0, duration: 0.8, delay: 0.3, ease: 'power3.out', clearProps: 'all',
    });
    // Category pills stagger
    gsap.from('.cat-btn', {
      y: 10, opacity: 0, duration: 0.4, stagger: 0.03, delay: 0.1, ease: 'power2.out', clearProps: 'all',
    });
    // Game cards stagger
    gsap.from('.game-card', {
      y: 30, opacity: 0, duration: 0.5, stagger: 0.05, delay: 0.4, ease: 'power2.out', clearProps: 'transform,opacity',
      onComplete: () => {
        document.querySelectorAll('.game-card').forEach((c) => c.classList.add('animated'));
      },
    });
    // Stats animation
    const statsOuter = document.querySelector('.stats-outer');
    if (statsOuter) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              gsap.from('.stat', { y: 20, opacity: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' });
              observer.disconnect();
            }
          });
        },
        { threshold: 0.3 }
      );
      observer.observe(statsOuter);
    }
  } else {
    // Sub-page entrance
    gsap.from('.page-hero', {
      y: 30, opacity: 0, duration: 0.6, delay: 0.1, ease: 'power3.out',
    });
    gsap.from('.page-section', {
      y: 20, opacity: 0, duration: 0.5, stagger: 0.1, delay: 0.3, ease: 'power2.out',
    });
  }
}

// ── Initialize ──
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
