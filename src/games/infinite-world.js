// ─── Infinite World ───
// A multiplayer 3D city builder with its own server (accounts, saved worlds,
// realtime co-op). It runs on its own subdomain and is embedded here.

const GAME_URL = import.meta.env.VITE_INFINITE_WORLD_URL || 'https://world.playzyy.me/';

let frame = null;

export function initGame(container) {
  frame = document.createElement('iframe');
  frame.src = GAME_URL;
  frame.title = 'Infinite World — multiplayer 3D city builder';
  frame.allow = 'fullscreen; clipboard-write; autoplay; gamepad';
  frame.setAttribute('allowfullscreen', '');
  frame.style.cssText = 'display:block;width:100%;height:100%;border:0;background:#0b101b';
  // Keyboard shortcuts (R, X, V…) go to the game once it has focus
  frame.addEventListener('load', () => frame && frame.focus());
  container.appendChild(frame);
}

export function destroyGame() {
  if (frame) {
    frame.remove();
    frame = null;
  }
}
