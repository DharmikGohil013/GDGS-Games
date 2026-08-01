// ─── Footer Component ───

export function createFooter() {
  const footer = document.createElement('footer');
  footer.setAttribute('role', 'contentinfo');
  footer.setAttribute('aria-label', 'Site footer');
  footer.setAttribute('itemscope', '');
  footer.setAttribute('itemtype', 'https://schema.org/WPFooter');

  footer.innerHTML = `
    <div class="footer-inner">
      <span class="footer-copy">
        <span itemprop="copyrightNotice">© <time datetime="2026">2026</time> Playzy.</span>
        All rights reserved. Made by
        <a href="https://dharmikgohil.art" target="_blank" rel="noopener noreferrer" class="footer-credit"
           aria-label="Visit dharmikgohil.art — creator of Playzy" itemprop="author">dharmikgohil.art</a>
      </span>
      <nav class="foot-links" aria-label="Footer navigation" role="navigation">
        <a href="#about" aria-label="About Playzy — our mission and team">About</a>
        <a href="#terms" aria-label="Terms of Service">Terms</a>
        <a href="#privacy" aria-label="Privacy Policy">Privacy</a>
        <a href="#contact" aria-label="Contact the Playzy team">Contact</a>
      </nav>
    </div>
  `;

  return footer;
}

