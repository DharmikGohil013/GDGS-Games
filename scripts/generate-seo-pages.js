import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { games } from '../src/data/games.js';
import { PAGE_SEO, buildGameSEO } from '../src/utils/seo.js';
import { IW_PAGE_SEO } from '../src/components/infiniteWorldPages.js';

const outputRoot = join(process.cwd(), 'dist');
const sourceHtml = await readFile(join(outputRoot, 'index.html'), 'utf8');
const baseUrl = 'https://playzy.dharmikgohil.art';

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}

function replaceMeta(html, selector, replacement) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`<meta\\s+${escapedSelector}\\s+content="[^"]*"\\s*\\/?\\s*>`, 'i');
  return html.replace(pattern, replacement);
}

function renderPage(html, seo) {
  const url = new URL(seo.url, `${baseUrl}/`).href;
  const image = new URL(seo.image || '/images/city-bg.png', `${baseUrl}/`).href;
  let result = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`);
  result = replaceMeta(result, 'name="description"', `<meta name="description" content="${escapeHtml(seo.description)}">`);
  result = replaceMeta(result, 'name="robots"', `<meta name="robots" content="${escapeHtml(seo.robots || 'index, follow, max-image-preview:large')}">`);
  result = replaceMeta(result, 'property="og:title"', `<meta property="og:title" content="${escapeHtml(seo.title)}">`);
  result = replaceMeta(result, 'property="og:description"', `<meta property="og:description" content="${escapeHtml(seo.description)}">`);
  result = replaceMeta(result, 'property="og:url"', `<meta property="og:url" content="${url}">`);
  result = replaceMeta(result, 'property="og:image"', `<meta property="og:image" content="${image}">`);
  result = replaceMeta(result, 'property="og:image:secure_url"', `<meta property="og:image:secure_url" content="${image}">`);
  result = replaceMeta(result, 'property="og:image:alt"', `<meta property="og:image:alt" content="${escapeHtml(`${seo.title} — Playzy`)}">`);
  result = replaceMeta(result, 'name="twitter:title"', `<meta name="twitter:title" content="${escapeHtml(seo.title)}">`);
  result = replaceMeta(result, 'name="twitter:description"', `<meta name="twitter:description" content="${escapeHtml(seo.description)}">`);
  result = replaceMeta(result, 'name="twitter:image"', `<meta name="twitter:image" content="${image}">`);
  result = replaceMeta(result, 'name="twitter:image:alt"', `<meta name="twitter:image:alt" content="${escapeHtml(`${seo.title} — Playzy`)}">`);
  result = result.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?\s*>/i, `<link rel="canonical" href="${url}">`);
  result = result.replace(/(<link\s+rel="alternate"\s+hreflang="(?:en|x-default)"\s+href=")[^"]*("\s*\/?\s*>)/gi, `$1${url}$2`);

  if (seo.jsonLd) {
    const json = JSON.stringify(seo.jsonLd).replaceAll('<', '\\u003c');
    result = result.replace('</head>', `  <script id="page-jsonld" type="application/ld+json">${json}</script>\n</head>`);
  }
  return result;
}

const pages = [
  PAGE_SEO.home,
  ...['about', 'terms', 'privacy', 'contact'].map((key) => PAGE_SEO[key]),
  ...games.filter((game) => game.isPlayable).map((game) => PAGE_SEO[game.id] || buildGameSEO(game)),
  ...Object.values(IW_PAGE_SEO),
];

for (const seo of pages) {
  const route = seo.url.replace(/^\/+|\/+$/g, '');
  const outputFile = join(outputRoot, route, 'index.html');
  await mkdir(dirname(outputFile), { recursive: true });
  await writeFile(outputFile, renderPage(sourceHtml, seo));
}

console.log(`Generated SEO entry pages for ${pages.length} routes.`);
