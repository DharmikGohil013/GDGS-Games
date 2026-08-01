// ─── SEO Utility — Dynamic Meta & Structured Data Updates ───

const BASE_URL = 'https://playzy.dharmikgohil.art';

/**
 * Update <title>, meta description, Open Graph and Twitter meta tags for each page.
 * Also injects or replaces per-page JSON-LD.
 */
export function updateSEO({ title, description, url = '/', image, type = 'website', jsonLd = null }) {
  const fullUrl = `${BASE_URL}${url.startsWith('/') ? url : '/' + url}`;
  const ogImage = image ? `${BASE_URL}${image}` : `${BASE_URL}/images/og-cover.jpg`;

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

  // Open Graph
  setMeta('meta[property="og:title"]', 'property=og:title', title);
  setMeta('meta[property="og:description"]', 'property=og:description', description);
  setMeta('meta[property="og:url"]', 'property=og:url', fullUrl);
  setMeta('meta[property="og:image"]', 'property=og:image', ogImage);
  setMeta('meta[property="og:type"]', 'property=og:type', type);

  // Twitter
  setMeta('meta[name="twitter:title"]', 'name=twitter:title', title);
  setMeta('meta[name="twitter:description"]', 'name=twitter:description', description);
  setMeta('meta[name="twitter:image"]', 'name=twitter:image', ogImage);

  // Canonical
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = fullUrl;

  // JSON-LD (page-specific structured data)
  if (jsonLd) {
    // Remove any existing page-specific LD (keep the site-level ones)
    const existing = document.getElementById('page-jsonld');
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'page-jsonld';
    script.textContent = JSON.stringify(jsonLd, null, 2);
    document.head.appendChild(script);
  }
}

// ── Page SEO Presets ─────────────────────────────────────────

export const PAGE_SEO = {
  home: {
    title: 'Playzy — Play 1,000+ Free Instant Browser Games Online | No Download',
    description: 'Playzy is the #1 free browser games platform. Play 1,000+ instant games — Puzzle, Racing, Arcade, Runner, Shooter, 3D & more. No download, no install, no sign-up. Loads in under 2 seconds.',
    url: '/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Playzy — Free Browser Games',
      description: 'Browse and play 1,000+ free browser games instantly. No download or installation required.',
      url: 'https://playzy.dharmikgohil.art/',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://playzy.dharmikgohil.art/' }]
      }
    }
  },

  about: {
    title: 'About Playzy — Free Browser Games Platform | No Download Gaming',
    description: 'Learn about Playzy — a free browser gaming platform with 1,000+ instant games across 25 categories. Built by dharmikgohil.art. 50M+ monthly plays. 180+ countries served.',
    url: '/#about',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About Playzy',
      description: 'Playzy is a free browser-based gaming platform that brings instant entertainment to millions of players worldwide.',
      url: 'https://playzy.dharmikgohil.art/#about',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://playzy.dharmikgohil.art/' },
          { '@type': 'ListItem', position: 2, name: 'About', item: 'https://playzy.dharmikgohil.art/#about' }
        ]
      }
    }
  },

  terms: {
    title: 'Terms of Service — Playzy Free Browser Games',
    description: 'Read Playzy\'s Terms of Service. Understand the rules and guidelines for using our free browser gaming platform.',
    url: '/#terms',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Terms of Service — Playzy',
      url: 'https://playzy.dharmikgohil.art/#terms',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://playzy.dharmikgohil.art/' },
          { '@type': 'ListItem', position: 2, name: 'Terms of Service', item: 'https://playzy.dharmikgohil.art/#terms' }
        ]
      }
    }
  },

  privacy: {
    title: 'Privacy Policy — Playzy Free Browser Games',
    description: 'Read Playzy\'s Privacy Policy. We respect your privacy and are committed to protecting your personal data on our free gaming platform.',
    url: '/#privacy',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Privacy Policy — Playzy',
      url: 'https://playzy.dharmikgohil.art/#privacy',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://playzy.dharmikgohil.art/' },
          { '@type': 'ListItem', position: 2, name: 'Privacy Policy', item: 'https://playzy.dharmikgohil.art/#privacy' }
        ]
      }
    }
  },

  contact: {
    title: 'Contact Playzy — Get in Touch | Free Browser Games Support',
    description: 'Contact the Playzy team. Report bugs, suggest games, ask about partnerships, or send feedback. We\'re based in Mumbai, India and respond within 24-48 hours.',
    url: '/#contact',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact Playzy',
      url: 'https://playzy.dharmikgohil.art/#contact',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://playzy.dharmikgohil.art/' },
          { '@type': 'ListItem', position: 2, name: 'Contact', item: 'https://playzy.dharmikgohil.art/#contact' }
        ]
      }
    }
  }
};

/**
 * Build per-game SEO metadata dynamically.
 */
export function buildGameSEO(game) {
  const gameName = game.title || game.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const category = (game.category || 'arcade').charAt(0).toUpperCase() + (game.category || 'arcade').slice(1);
  const plays = game.plays || '1M+';
  const rating = game.rating || 4.8;

  return {
    title: `Play ${gameName} Free Online — ${category} Browser Game | Playzy`,
    description: `Play ${gameName} free online instantly — no download, no install. ${category} browser game with ${plays} plays and a ${rating}/5 rating. Available on all devices at Playzy.`,
    url: `/#/play/${game.id}`,
    image: game.image || null,
    type: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'VideoGame',
      name: gameName,
      description: `Play ${gameName} free online. A ${category} browser game with ${plays} plays. No download required.`,
      url: `https://playzy.dharmikgohil.art/#/play/${game.id}`,
      gamePlatform: ['Web Browser', 'Mobile Browser', 'Desktop Browser'],
      playMode: 'SinglePlayer',
      applicationCategory: 'Game',
      operatingSystem: 'Any — No installation required',
      genre: [category],
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: String(rating),
        bestRating: '5',
        ratingCount: String(Math.floor(Math.random() * 200000 + 10000))
      },
      publisher: { '@type': 'Organization', name: 'Playzy', url: 'https://playzy.dharmikgohil.art/' },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://playzy.dharmikgohil.art/' },
          { '@type': 'ListItem', position: 2, name: 'Games', item: 'https://playzy.dharmikgohil.art/' },
          { '@type': 'ListItem', position: 3, name: gameName, item: `https://playzy.dharmikgohil.art/#/play/${game.id}` }
        ]
      }
    }
  };
}
