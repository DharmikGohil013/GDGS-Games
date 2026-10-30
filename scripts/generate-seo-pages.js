import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { games } from '../src/data/games.js';
import { getGuide } from '../src/data/gameGuides.js';
import { PAGE_SEO, buildGameSEO, normalizeGoogleStructuredData } from '../src/utils/seo.js';
import { IW_PAGE_SEO } from '../src/components/infiniteWorldPages.js';

const outputRoot = join(process.cwd(), 'dist');
const sourceHtml = await readFile(join(outputRoot, 'index.html'), 'utf8');
const baseUrl = 'https://playzy.dharmikgohil.art';

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}

function escapeXml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

function replaceMeta(html, selector, replacement) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`<meta\\s+${escapedSelector}\\s+content="[^"]*"\\s*\\/?\\s*>`, 'i');
  return html.replace(pattern, replacement);
}

function ensureHeadTag(html, pattern, tag) {
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace('</head>', `  ${tag}\n</head>`);
}

function renderPage(html, seo) {
  const url = new URL(seo.url, `${baseUrl}/`).href;
  const image = new URL(seo.image || '/images/city-bg.png', `${baseUrl}/`).href;
  let result = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`);
  result = replaceMeta(result, 'name="description"', `<meta name="description" content="${escapeHtml(seo.description)}">`);
  result = replaceMeta(result, 'name="robots"', `<meta name="robots" content="${escapeHtml(seo.robots || 'max-image-preview:large')}">`);
  result = replaceMeta(result, 'property="og:title"', `<meta property="og:title" content="${escapeHtml(seo.title)}">`);
  result = replaceMeta(result, 'property="og:description"', `<meta property="og:description" content="${escapeHtml(seo.description)}">`);
  result = replaceMeta(result, 'property="og:url"', `<meta property="og:url" content="${url}">`);
  result = replaceMeta(result, 'property="og:image"', `<meta property="og:image" content="${image}">`);
  result = replaceMeta(result, 'property="og:image:secure_url"', `<meta property="og:image:secure_url" content="${image}">`);
  result = replaceMeta(result, 'property="og:image:alt"', `<meta property="og:image:alt" content="${escapeHtml(`${seo.title} — Playzy`)}">`);
  result = replaceMeta(result, 'property="og:type"', `<meta property="og:type" content="${escapeHtml(seo.type || 'website')}">`);
  result = replaceMeta(result, 'name="twitter:title"', `<meta name="twitter:title" content="${escapeHtml(seo.title)}">`);
  result = replaceMeta(result, 'name="twitter:description"', `<meta name="twitter:description" content="${escapeHtml(seo.description)}">`);
  result = replaceMeta(result, 'name="twitter:image"', `<meta name="twitter:image" content="${image}">`);
  result = replaceMeta(result, 'name="twitter:image:alt"', `<meta name="twitter:image:alt" content="${escapeHtml(`${seo.title} — Playzy`)}">`);
  result = result.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?\s*>/i, `<link rel="canonical" href="${url}">`);
  result = result.replace(/(<link\s+rel="alternate"\s+hreflang="(?:en|x-default)"\s+href=")[^"]*("\s*\/?\s*>)/gi, `$1${url}$2`);

  if (seo.jsonLd) {
    const json = JSON.stringify(normalizeGoogleStructuredData(seo.jsonLd)).replaceAll('<', '\\u003c');
    result = result.replace('</head>', `  <script id="page-jsonld" type="application/ld+json">${json}</script>\n</head>`);
  }
  result = result.replace(/<noscript>[\s\S]*?<\/noscript>/i, `<noscript>${renderStaticContent(seo)}</noscript>`);
  return result;
}

function renderStaticContent(seo) {
  const game = games.find((item) => item.isPlayable && seo.url === `/games/${item.id}/`);
  if (game) {
    const guide = getGuide(game);
    const controls = guide.controls.map((control) => `<li><strong>${escapeHtml(control.key)}:</strong> ${escapeHtml(control.label)}</li>`).join('');
    const tips = guide.tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join('');
    return `<section aria-label="${escapeHtml(game.title)} game details"><h1>${escapeHtml(game.title)}</h1><p>${escapeHtml(guide.description)}</p><h2>How to play ${escapeHtml(game.title)}</h2><ul>${controls}</ul>${tips ? `<h2>Tips</h2><ul>${tips}</ul>` : ''}<p><a href="/">Browse all free browser games</a></p></section>`;
  }

  if (seo.url === '/') {
    const links = games.filter((item) => item.isPlayable).map((item) => `<li><a href="${escapeHtml(item.url || `/games/${encodeURIComponent(item.id)}/`)}">${escapeHtml(item.title)}</a> — ${escapeHtml(getGuide(item).description)}</li>`).join('');
    return `<section aria-label="Playable browser games"><h1>Play free browser games online</h1><p>Playzy is a free browser games site. Explore arcade, puzzle, racing, runner, platformer and multiplayer games. No app download is required.</p><h2>Games you can play</h2><ul>${links}</ul></section>`;
  }

  return `<section aria-label="${escapeHtml(seo.title)}"><h1>${escapeHtml(seo.title.split(' | ')[0].split(' — ')[0])}</h1><p>${escapeHtml(seo.description)}</p><p><a href="/">Browse free browser games</a></p></section>`;
}

const pages = [
  PAGE_SEO.home,
  ...['about', 'terms', 'privacy', 'contact'].map((key) => PAGE_SEO[key]),
  ...games.filter((game) => game.isPlayable && !game.url).map(buildGameSEO),
  ...Object.values(IW_PAGE_SEO),
];

for (const seo of pages) {
  const route = seo.url.replace(/^\/+|\/+$/g, '');
  const outputFile = join(outputRoot, route, 'index.html');
  await mkdir(dirname(outputFile), { recursive: true });
  await writeFile(outputFile, renderPage(sourceHtml, seo));
}

// The embedded game is also reachable as a standalone document. Canonicalize
// it to the searchable game landing page while preserving its iframe URL.
for (const embeddedSlug of ['monsoon-rickshaw-rush', 'voxelcraft', 'apex-velocity']) {
  const embeddedGamePath = join(outputRoot, embeddedSlug, 'index.html');
  try {
    let embeddedGameHtml = await readFile(embeddedGamePath, 'utf8');
    embeddedGameHtml = ensureHeadTag(embeddedGameHtml, /<link\s+rel="canonical"[^>]*>/i, `<link rel="canonical" href="https://playzy.dharmikgohil.art/games/${embeddedSlug}/">`);
    embeddedGameHtml = ensureHeadTag(embeddedGameHtml, /<meta\s+name="robots"[^>]*>/i, '<meta name="robots" content="max-image-preview:large">');
    embeddedGameHtml = ensureHeadTag(embeddedGameHtml, /<meta\s+property="og:url"[^>]*>/i, `<meta property="og:url" content="https://playzy.dharmikgohil.art/games/${embeddedSlug}/">`);
    await writeFile(embeddedGamePath, embeddedGameHtml);
  } catch {}
}

for (const embeddedSlug of ['among-us-pixel-outpost', 'bloom-loop', 'cash-tycoon', 'flappy-bird-3d', 'pixels-farm-craft', 'shop-tycoon']) {
  const embeddedGamePath = join(outputRoot, 'embedded', embeddedSlug, 'index.html');
  let embeddedGameHtml = await readFile(embeddedGamePath, 'utf8');
  embeddedGameHtml = ensureHeadTag(embeddedGameHtml, /<link\s+rel="canonical"[^>]*>/i, `<link rel="canonical" href="${baseUrl}/games/${embeddedSlug}/">`);
  embeddedGameHtml = ensureHeadTag(embeddedGameHtml, /<meta\s+name="robots"[^>]*>/i, '<meta name="robots" content="max-image-preview:large">');
  await writeFile(embeddedGamePath, embeddedGameHtml);
}

const sitemapPages = pages.filter((seo) => !String(seo.robots || '').includes('noindex'));
const sitemapEntries = sitemapPages.map((seo) => {
  const location = new URL(seo.url, `${baseUrl}/`).href;
  const image = seo.image
    ? `\n    <image:image><image:loc>${escapeXml(new URL(seo.image, `${baseUrl}/`).href)}</image:loc><image:title>${escapeXml(seo.title)}</image:title></image:image>`
    : '';
  return `  <url>\n    <loc>${escapeXml(location)}</loc>${image}\n  </url>`;
});
sitemapEntries.push(`  <url>\n    <loc>${baseUrl}/gravity-shift.html</loc>\n  </url>`);
await writeFile(join(outputRoot, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${sitemapEntries.join('\n')}\n</urlset>\n`);

console.log(`Generated SEO entry pages for ${pages.length} routes and a sitemap with ${sitemapEntries.length} URLs.`);
