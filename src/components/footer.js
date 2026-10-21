// ─── Footer Component ───

export function createFooter() {
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.setAttribute('role', 'contentinfo');
  footer.setAttribute('aria-label', 'Site footer');
  footer.setAttribute('itemscope', '');
  footer.setAttribute('itemtype', 'https://schema.org/WPFooter');

  const year = new Date().getFullYear();

  footer.innerHTML = `
    <div class="footer-inner">
      <div class="footer-main">
        <div class="footer-brand-block">
          <a href="/" class="footer-brand" aria-label="Playzy home">
            <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
              <rect x="2" y="8" width="20" height="10" rx="5" fill="#FF5F4D"/>
              <circle cx="8" cy="13" r="1.6" fill="#16171D"/>
              <circle cx="16" cy="11.4" r="1.3" fill="#16171D"/>
              <circle cx="18" cy="14.6" r="1.3" fill="#16171D"/>
            </svg>
            <span>Playzy</span>
          </a>
          <p>Pick a game. Jump right in.</p>
        </div>

        <nav class="footer-nav" aria-label="Footer navigation">
          <div class="footer-nav-group">
            <h2>Explore</h2>
            <a href="/">All games</a>
            <a href="/games/infinite-world/">Infinite World</a>
          </div>
          <div class="footer-nav-group">
            <h2>Playzy</h2>
            <a href="/about/">About</a>
            <a href="/contact/">Contact</a>
          </div>
          <div class="footer-nav-group">
            <h2>Legal</h2>
            <a href="/terms/">Terms</a>
            <a href="/privacy/">Privacy</a>
          </div>
        </nav>
      </div>

      <div class="footer-bottom">
        <span itemprop="copyrightNotice">© <time datetime="${year}">${year}</time> Playzy. All rights reserved.</span>
        <span class="footer-made-by">Made by
          <a href="https://dharmikgohil.art" target="_blank" rel="noopener noreferrer" class="footer-credit"
             aria-label="Visit dharmikgohil.art — creator of Playzy" itemprop="author">dharmikgohil.art</a>
        </span>
      </div>
    </div>
  `;

  return footer;
}
