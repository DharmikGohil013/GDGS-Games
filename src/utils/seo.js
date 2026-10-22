// ─── SEO Utility — Dynamic Meta & Structured Data Updates ───

import { getGuide } from '../data/gameGuides.js';

const BASE_URL = 'https://playzy.dharmikgohil.art';

function canonicalPath(url = '/') {
  // Canonicals should identify the page, not a tracking query or legacy hash.
  const pathOnly = url.split(/[?#]/, 1)[0] || '/';
  // Accept old hash URLs while keeping canonicals on crawlable path URLs.
  const legacy = url.match(/^\/#\/?(.*)$/);
  if (legacy) {
    const route = legacy[1];
    if (route.startsWith('play/')) return `/games/${route.slice(5).replace(/\/?$/, '/')}`;
    if (route === 'about' || route === 'terms' || route === 'privacy' || route === 'contact') return `/${route}/`;
    if (route.startsWith('infinite-world/')) return `/games/${route.replace(/\/?$/, '/')}`;
  }
  return pathOnly.endsWith('/') ? pathOnly : `${pathOnly}/`;
}

/**
 * Update <title>, meta description, Open Graph and Twitter meta tags for each page.
 * Also injects or replaces per-page JSON-LD.
 */
export function updateSEO({ title, description, url = '/', image, type = 'website', jsonLd = null, robots = 'index, follow, max-image-preview:large' }) {
  const path = canonicalPath(url);
  const fullUrl = `${BASE_URL}${path}`;
  const ogImage = image ? `${BASE_URL}${image}` : `${BASE_URL}/images/city-bg.png`;

  // Title
  document.title = title;

  // Helper — get or create a <meta> tag
  function setMeta(selector, attr, value) {
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      const [attrName, attrVal] = attr.split('=');
      el.setAttribute(attrName.trim(), attrVal.trim().replace(/"/g, ''));
      document.head.appendChild(el);
    }
    el.setAttribute('content', value);
  }

  // Primary
  setMeta('meta[name="description"]', 'name=description', description);
  setMeta('meta[name="robots"]', 'name=robots', robots);

  // Open Graph
  setMeta('meta[property="og:title"]', 'property=og:title', title);
  setMeta('meta[property="og:description"]', 'property=og:description', description);
  setMeta('meta[property="og:url"]', 'property=og:url', fullUrl);
  setMeta('meta[property="og:image"]', 'property=og:image', ogImage);
  setMeta('meta[property="og:image:secure_url"]', 'property=og:image:secure_url', ogImage);
  setMeta('meta[property="og:image:alt"]', 'property=og:image:alt', `${title} — Playzy`);
  setMeta('meta[property="og:type"]', 'property=og:type', type);
  setMeta('meta[property="og:site_name"]', 'property=og:site_name', 'Playzy');

  // Twitter
  setMeta('meta[name="twitter:title"]', 'name=twitter:title', title);
  setMeta('meta[name="twitter:description"]', 'name=twitter:description', description);
  setMeta('meta[name="twitter:image"]', 'name=twitter:image', ogImage);
  setMeta('meta[name="twitter:image:alt"]', 'name=twitter:image:alt', `${title} — Playzy`);
  setMeta('meta[name="twitter:card"]', 'name=twitter:card', 'summary_large_image');

  // Canonical
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = fullUrl;

  // JSON-LD (page-specific structured data)
  const existing = document.getElementById('page-jsonld');
  if (existing) existing.remove();
  if (jsonLd) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'page-jsonld';
    script.textContent = JSON.stringify(jsonLd, null, 2);
    document.head.appendChild(script);
  }

  // Google Analytics SPA Pageview Tracking
  if (typeof window.gtag === 'function') {
    window.gtag('config', 'G-TEKBBJ6WTP', {
      page_path: path,
      page_title: title
    });
  }
}

// ── Page SEO Presets ─────────────────────────────────────────

export const PAGE_SEO = {
  home: {
    title: 'Play Free Browser Games Online — Playzy',
    description: 'Play free browser games on Playzy. Choose from arcade, puzzle, racing, runner and multiplayer games, with no download or installation required.',
    url: '/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Playzy — Free Browser Games',
      description: 'Browse and play free browser games instantly. No download or installation required.',
      url: 'https://playzy.dharmikgohil.art/',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://playzy.dharmikgohil.art/' }]
      }
    }
  },

  about: {
    title: 'About Playzy — Free Browser Games Platform | No Download Gaming',
    description: 'Learn about Playzy, a browser gaming platform built by Dharmik Gohil. Browse free arcade, puzzle, racing and other browser games.',
    url: '/about/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About Playzy',
      description: 'Playzy is a platform for playing free browser games online.',
      url: 'https://playzy.dharmikgohil.art/about/',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://playzy.dharmikgohil.art/' },
          { '@type': 'ListItem', position: 2, name: 'About', item: 'https://playzy.dharmikgohil.art/about/' }
        ]
      }
    }
  },

  terms: {
    title: 'Terms of Service — Playzy Free Browser Games',
    description: 'Read Playzy\'s Terms of Service. Understand the rules and guidelines for using our free browser gaming platform.',
    url: '/terms/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Terms of Service — Playzy',
      url: 'https://playzy.dharmikgohil.art/terms/',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://playzy.dharmikgohil.art/' },
          { '@type': 'ListItem', position: 2, name: 'Terms of Service', item: 'https://playzy.dharmikgohil.art/terms/' }
        ]
      }
    }
  },

  privacy: {
    title: 'Privacy Policy — Playzy Free Browser Games',
    description: 'Read Playzy\'s Privacy Policy. We respect your privacy and are committed to protecting your personal data on our free gaming platform.',
    url: '/privacy/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Privacy Policy — Playzy',
      url: 'https://playzy.dharmikgohil.art/privacy/',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://playzy.dharmikgohil.art/' },
          { '@type': 'ListItem', position: 2, name: 'Privacy Policy', item: 'https://playzy.dharmikgohil.art/privacy/' }
        ]
      }
    }
  },

  contact: {
    title: 'Contact Playzy — Get in Touch | Free Browser Games Support',
    description: 'Contact the Playzy team. Report bugs, suggest games, ask about partnerships, or send feedback. We\'re based in Mumbai, India and respond within 24-48 hours.',
    url: '/contact/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact Playzy',
      url: 'https://playzy.dharmikgohil.art/contact/',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://playzy.dharmikgohil.art/' },
          { '@type': 'ListItem', position: 2, name: 'Contact', item: 'https://playzy.dharmikgohil.art/contact/' }
        ]
      }
    }
  }
};

export function buildGameSEO(game) {
  const gameName = game.title || game.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const category = (game.category || 'arcade').charAt(0).toUpperCase() + (game.category || 'arcade').slice(1);
  const gameUrl = game.isPlayable ? `${BASE_URL}/games/${game.id}/` : `${BASE_URL}/`;
  const guide = getGuide(game); // real per-game description/controls/tips — keeps every game's SEO copy unique
  const controls = guide.controls && guide.controls.length ? guide.controls : [{ key: 'Mouse / Tap', label: 'Primary action' }];

  return {
    title: `Play ${gameName} Online | Playzy`,
    description: guide.description || `Play ${gameName}, a ${category.toLowerCase()} browser game, free on Playzy.`,
    url: game.isPlayable ? `/games/${game.id}/` : '/',
    robots: game.isPlayable ? 'index, follow, max-image-preview:large' : 'noindex, follow',
    image: game.image || null,
    type: 'website',
    jsonLd: game.isPlayable ? {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'VideoGame',
          '@id': `${gameUrl}#game`,
          name: gameName,
          alternateName: [`${gameName} Game`, `Play ${gameName} Online`],
          description: guide.description || `Play ${gameName} free online. A ${category.toLowerCase()} browser game with no installation required.`,
          url: gameUrl,
          gamePlatform: ['Web Browser', 'Mobile Browser', 'Desktop Browser', 'iOS Browser', 'Android Browser'],
          playMode: game.category === 'multiplayer' ? ['MultiPlayer', 'CoOp', 'SinglePlayer'] : 'SinglePlayer',
          applicationCategory: 'Game',
          operatingSystem: 'Any — Web Browser',
          genre: [category, 'Browser Games'],
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock'
          },
          publisher: {
            '@type': 'Organization',
            name: 'Playzy',
            url: 'https://playzy.dharmikgohil.art/'
          }
        },
        {
          '@type': 'HowTo',
          '@id': `${gameUrl}#howto`,
          name: `How to Play ${gameName} Online`,
          description: `Step-by-step instructions to play ${gameName} on desktop and mobile.`,
          step: [
            {
              '@type': 'HowToStep',
              position: 1,
              name: 'Open the game',
              text: `Visit ${gameUrl} on any phone, tablet, or desktop browser — it loads instantly with no download or install.`
            },
            ...controls.slice(0, 4).map((c, i) => ({
              '@type': 'HowToStep',
              position: i + 2,
              name: c.label,
              text: `${c.key} — ${c.label}.`
            })),
            {
              '@type': 'HowToStep',
              position: controls.slice(0, 4).length + 2,
              name: 'Beat your high score',
              text: guide.tips && guide.tips[0] ? guide.tips[0] : 'Keep playing to climb the leaderboard and beat your personal best.'
            }
          ]
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${gameUrl}#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://playzy.dharmikgohil.art/' },
            { '@type': 'ListItem', position: 2, name: 'Games', item: `${BASE_URL}/` },
            { '@type': 'ListItem', position: 3, name: gameName, item: gameUrl }
          ]
        }
      ]
    } : null
  };
}
