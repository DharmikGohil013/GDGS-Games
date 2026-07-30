// ─── Footer Component ───

export function createFooter() {
  const footer = document.createElement('footer');
  footer.setAttribute('role', 'contentinfo');

  footer.innerHTML = `
    <span>© 2026 Playzy. All rights reserved. Made by <a href="https://dharmikgohil.art" target="_blank" rel="noopener noreferrer" class="footer-credit">dharmikgohil.art</a></span>
    <div class="foot-links">
      <a href="#about">About</a>
      <a href="#terms">Terms</a>
      <a href="#privacy">Privacy</a>
      <a href="#contact">Contact</a>
    </div>
  `;

  return footer;
}
