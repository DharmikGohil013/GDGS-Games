// ─── Component to render any of the 6 game subpages ───
// 1. What is this game | 2. About this game | 3. Tutorial | 4. Support | 5. Terms | 6. Privacy

import { SUBPAGE_TYPES, getSubpageData, getGameScreenshots } from '../data/gameSubpagesData.js';

const SUPPORT_EMAIL = 'dharmikgohil.work@gmail.com';
const UPDATED_DATE = 'October 2026';

export function createGameSubpage(game, pageType) {
  const data = getSubpageData(game, pageType);
  const screenshots = getGameScreenshots(game);
  const playUrl = game.url || `/games/${game.id}/`;

  const container = document.createElement('main');
  container.className = 'game-subpage';
  container.id = 'main-content';
  container.setAttribute('data-accent', game.color || 'blue');

  // Render Subnav
  const navHtml = `
    <nav class="game-subnav" aria-label="${game.title} pages navigation">
      ${SUBPAGE_TYPES.map((type) => {
        const isActive = type.id === pageType;
        const href = `/games/${game.id}/${type.id}/`;
        return `
          <a href="${href}" class="game-subnav-link ${isActive ? 'is-active' : ''}" ${isActive ? 'aria-current="page"' : ''}>
            ${type.shortLabel}
          </a>
        `;
      }).join('')}
      <a href="${playUrl}" class="game-subnav-link game-subnav-play">
        ▶ Play Now
      </a>
    </nav>
  `;

  // Render Screenshots Gallery
  const screenshotsHtml = screenshots.length ? `
    <div class="game-visual-showcase">
      <div class="game-showcase-heading">
        <span>📸</span>
        <span>${game.title} Gameplay Previews</span>
      </div>
      <div class="game-screenshots-grid">
        ${screenshots.map((src, i) => {
          const caption = (data.screenshotCaptions && data.screenshotCaptions[i]) || `In-Game Capture — Frame ${i + 1}`;
          return `
            <div class="game-screenshot-card">
              <img src="${src}" alt="${game.title} screenshot ${i + 1}" loading="lazy" width="640" height="360" />
              <div class="game-screenshot-caption">${caption}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  ` : '';

  // Render Page-Specific Content Body
  let bodyContent = '';

  if (pageType === 'what-is') {
    bodyContent = `
      <section class="game-features-section">
        <h2>Key Highlights & Core Features</h2>
        <div class="game-features-grid">
          ${(data.coreFeatures || []).map((feat) => `
            <article class="game-feature-card">
              <h3><span>✦</span> ${feat.title}</h3>
              <p>${feat.desc}</p>
            </article>
          `).join('')}
        </div>
      </section>

      ${screenshotsHtml}

      <section class="game-specs-section">
        <h2>Technical & Platform Specifications</h2>
        <table class="game-specs-table">
          <tbody>
            ${data.specs ? Object.entries(data.specs).map(([key, val]) => `
              <tr>
                <th>${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</th>
                <td>${val}</td>
              </tr>
            `).join('') : ''}
          </tbody>
        </table>
      </section>

      ${data.whyPlay ? `
        <section class="game-why-section">
          <h2>Why You Should Play ${game.title}</h2>
          <div class="game-callout tip">
            <ul>
              ${data.whyPlay.map((item) => `<li>${item}</li>`).join('')}
            </ul>
          </div>
        </section>
      ` : ''}
    `;
  } else if (pageType === 'about') {
    bodyContent = `
      <section class="game-legal-block">
        <h2>Game Setting & Lore</h2>
        <p>${data.lore || ''}</p>
      </section>

      ${screenshotsHtml}

      <section class="game-legal-block">
        <h2>Deep Mechanics & Gameplay Systems</h2>
        <p>${data.mechanics || ''}</p>
      </section>

      <section class="game-legal-block">
        <h2>Technology & Rendering Engine</h2>
        <p>${data.tech || ''}</p>
      </section>

      ${data.audio ? `
        <section class="game-legal-block">
          <h2>Audio Architecture & Sound Design</h2>
          <p>${data.audio}</p>
        </section>
      ` : ''}

      <section class="game-legal-block">
        <h2>Creator & Development Notes</h2>
        <p>${data.developmentNotes || ''}</p>
      </section>
    `;
  } else if (pageType === 'tutorial') {
    bodyContent = `
      <section class="game-tutorial-section">
        <h2>Quick-Start Walkthrough</h2>
        <div class="game-steps-list">
          ${(data.quickStart || []).map((step) => `
            <div class="game-step-item">
              <span class="game-step-num">${step.step}</span>
              <div class="game-step-body">
                <h4>${step.title}</h4>
                <p>${step.desc}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      ${screenshotsHtml}

      <section class="game-controls-section">
        <h2>Full Control Scheme</h2>
        <table class="game-controls-table">
          <thead>
            <tr>
              <th>Key / Input</th>
              <th>Action</th>
              <th>Device</th>
              <th>Pro Tip</th>
            </tr>
          </thead>
          <tbody>
            ${(data.controls || []).map((c) => `
              <tr>
                <td><kbd>${c.key}</kbd></td>
                <td><strong>${c.action}</strong></td>
                <td>${c.device || 'Keyboard'}</td>
                <td>${c.tip || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>

      ${data.kingdomGuide && data.kingdomGuide.length ? `
        <section class="game-kingdoms-section" style="margin:30px 0">
          <h2>Kingdom-by-Kingdom Tactical Guide</h2>
          <div class="game-features-grid">
            ${data.kingdomGuide.map((k) => `
              <article class="game-feature-card">
                <h3><span>👑</span> ${k.name}</h3>
                <p><strong>Terrain:</strong> ${k.terrain}</p>
                <p><strong>Hazards & Enemies:</strong> ${k.hazards}</p>
                <p><strong>Strategy:</strong> ${k.strategy}</p>
              </article>
            `).join('')}
          </div>
        </section>
      ` : ''}

      ${data.bossTactics ? `
        <section class="game-boss-section" style="margin:30px 0">
          <h2>Boss Battle Masterclass: Defeating The King</h2>
          <div class="game-callout tip">
            <h4>${data.bossTactics.title || 'Boss Battle Guide'}</h4>
            <p>${data.bossTactics.overview || ''}</p>
            <ul style="margin-top:12px">
              ${(data.bossTactics.phases || []).map((p) => `
                <li><strong>${p.phase}:</strong> ${p.desc}</li>
              `).join('')}
            </ul>
          </div>
        </section>
      ` : ''}

      ${data.scoring ? `
        <section class="game-legal-block">
          <h2>Scoring & Multiplier Rules</h2>
          <p>${data.scoring}</p>
        </section>
      ` : ''}

      ${data.proTips && data.proTips.length ? `
        <div class="game-callout tip">
          <h4>💡 Expert Strategies & High-Score Secrets</h4>
          <ul>
            ${data.proTips.map((tip) => `<li>${tip}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${data.mistakes && data.mistakes.length ? `
        <section class="game-mistakes-section">
          <h2>Common Mistakes & How to Fix Them</h2>
          <div class="game-mistakes-grid">
            ${data.mistakes.map((item) => `
              <div class="game-mistake-card">
                <div class="game-mistake-bad">⚠️ ${item.mistake}</div>
                <p class="game-mistake-fix"><strong>Fix:</strong> ${item.fix}</p>
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}
    `;
  } else if (pageType === 'support') {
    const mail = (subject) => `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`${game.title} — ${subject}`)}`;

    bodyContent = `
      <section class="game-support-quick">
        <h2>Quick Support Actions</h2>
        <div class="game-support-actions">
          <a class="support-action-btn is-primary" href="${mail('Help Request')}">✉ Email Support</a>
          <a class="support-action-btn" href="${mail('Bug Report')}">🐞 Report a Bug</a>
          <a class="support-action-btn" href="${mail('Feature Request')}">💡 Suggest a Feature</a>
          <a class="support-action-btn" href="${mail('Clear Save Data')}">🗑 Request Data Reset</a>
        </div>
        <p style="font-size:14px;color:var(--text-dim)">Direct Developer Inquiries: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> · Average response time: 24–48 hours.</p>
      </section>

      ${screenshotsHtml}

      <section class="game-faq-section">
        <h2>Frequently Asked Questions</h2>
        ${(data.faqs || []).map((faq) => `
          <details class="game-faq-item">
            <summary>${faq.q}</summary>
            <p>${faq.a}</p>
          </details>
        `).join('')}
      </section>

      ${data.troubleshooting && data.troubleshooting.length ? `
        <section class="game-troubleshooting-section">
          <h2>Troubleshooting & Diagnostics</h2>
          <table class="game-controls-table">
            <thead>
              <tr>
                <th>Issue / Symptom</th>
                <th>Recommended Solution</th>
              </tr>
            </thead>
            <tbody>
              ${data.troubleshooting.map((t) => `
                <tr>
                  <td><strong>${t.issue}</strong></td>
                  <td>${t.fix}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </section>
      ` : ''}
    `;
  } else if (pageType === 'terms') {
    bodyContent = `
      <div class="game-legal-block">
        <p>These terms govern your use and gameplay of <strong>${game.title}</strong> on Playzy. By accessing or playing the game, you accept these provisions alongside the overarching <a href="/terms/">Playzy Terms of Service</a>.</p>
      </div>

      ${(data.sections || []).map((sec) => `
        <div class="game-legal-block">
          <h2>${sec.title}</h2>
          <p>${sec.content}</p>
        </div>
      `).join('')}

      <div class="game-legal-block">
        <h2>Governing Law & Inquiries</h2>
        <p>These game-specific terms are governed by the laws of India. For any inquiries regarding licensing, distribution, or school/educational access, please contact <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
      </div>
    `;
  } else if (pageType === 'privacy') {
    bodyContent = `
      <div class="game-legal-block">
        <p>This privacy policy applies specifically to your gameplay of <strong>${game.title}</strong> on Playzy. For broader site-wide browsing, please refer to the main <a href="/privacy/">Playzy Privacy Policy</a>.</p>
      </div>

      ${(data.sections || []).map((sec) => `
        <div class="game-legal-block">
          <h2>${sec.title}</h2>
          <p>${sec.content}</p>
        </div>
      `).join('')}

      <div class="game-legal-block">
        <h2>Children’s Privacy (COPPA & GDPR-K Compliance)</h2>
        <p><strong>${game.title}</strong> is designed to be safe for all ages. We do not intentionally collect personal information from children under 13 or the age of digital consent in your jurisdiction. Parents or guardians may contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> to request verification or data removal.</p>
      </div>
    `;
  }

  container.innerHTML = `
    ${navHtml}

    <header class="game-subpage-hero">
      <div class="game-hero-badges">
        <span class="game-badge-chip">${game.category || 'Arcade'}</span>
        <span class="game-badge-chip">${SUBPAGE_TYPES.find((t) => t.id === pageType)?.label || pageType}</span>
        <span class="game-badge-chip" style="opacity:0.85">Updated ${UPDATED_DATE}</span>
      </div>
      <h1 class="game-subpage-title">${data.headline || `${game.title} — ${pageType}`}</h1>
      <p class="game-subpage-subtitle">${data.summary || `Comprehensive guide and documentation for ${game.title} on Playzy.`}</p>
    </header>

    <div class="game-subpage-content">
      ${bodyContent}
    </div>

    <footer class="game-subpage-cta">
      <h3>Ready to play ${game.title}?</h3>
      <p>Jump right in! No downloads, no installs — completely free in your browser.</p>
      <a href="${playUrl}" class="btn-primary" style="display:inline-flex;align-items:center;gap:8px">
        ▶ Play ${game.title} Now
      </a>
    </footer>
  `;

  return container;
}
