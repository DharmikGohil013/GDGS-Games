// ─── Monsoon Rickshaw Rush ───
// The game is built from Auto-rickshaw-Exp--Game and hosted on this site's origin.

import { reportRun } from '../core/runReport.js';

const GAME_URL = '/monsoon-rickshaw-rush/';
const GAME_ID = 'monsoon-rickshaw-rush';

let frame = null;
let messageHandler = null;

export function initGame(container) {
  frame = document.createElement('iframe');
  frame.src = GAME_URL;
  frame.title = 'Monsoon Rickshaw Rush — 3D Mumbai auto-rickshaw driving game';
  frame.allow = 'fullscreen; autoplay; gamepad';
  frame.setAttribute('allowfullscreen', '');
  frame.style.cssText = 'display:block;width:100%;height:100%;border:0;background:#0c0a09';

  messageHandler = (event) => {
    if (!frame || event.source !== frame.contentWindow || event.origin !== window.location.origin) return;
    const data = event.data;
    if (data?.type !== 'playzy:run-ended' || data.gameId !== GAME_ID) return;

    reportRun(container, GAME_ID, {
      score: Number(data.score) || 0,
      coins: Number(data.deliveries) || 0,
      duration: Number(data.duration) || 0,
    });
  };

  window.addEventListener('message', messageHandler);
  frame.addEventListener('load', () => frame && frame.focus());
  container.appendChild(frame);
}

export function destroyGame() {
  if (messageHandler) {
    window.removeEventListener('message', messageHandler);
    messageHandler = null;
  }
  if (frame) {
    frame.remove();
    frame = null;
  }
}
