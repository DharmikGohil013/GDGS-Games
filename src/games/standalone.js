// Run bundled React games in their own document so their styles and input stay isolated.
let frame = null;

export function initGame(container, game) {
  destroyGame();
  frame = document.createElement('iframe');
  // Name the file: the Vite dev server answers a bare folder URL with the site's own index page
  frame.src = `/embedded/${game.id}/index.html`;
  frame.title = game.title;
  frame.allow = 'fullscreen; autoplay; gamepad';
  frame.setAttribute('allowfullscreen', '');
  frame.style.cssText = 'display:block;width:100%;height:100%;border:0;background:#101624';
  frame.addEventListener('load', () => frame?.focus(), { once: true });
  container.appendChild(frame);
}

export function destroyGame() {
  frame?.remove();
  frame = null;
}
