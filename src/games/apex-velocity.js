// Keep the React / Three.js game isolated from the website's styles and input.
import { reportRun } from '../core/runReport.js';
import { isSoundOn } from '../core/audio.js';

let frame = null;
let messageHandler = null;
let soundEnabled = true;

export function setSoundEnabled(enabled) {
  soundEnabled = Boolean(enabled);
  frame?.contentWindow?.postMessage({ type: 'playzy:set-sound', enabled: soundEnabled }, window.location.origin);
}

export function initGame(container) {
  destroyGame();
  soundEnabled = isSoundOn();
  frame = document.createElement('iframe');
  frame.src = `/apex-velocity/?muted=${soundEnabled ? '0' : '1'}`;
  frame.title = 'Apex Velocity: F1 Supercar Studio & Circuit Builder';
  frame.allow = 'fullscreen; autoplay; gamepad';
  frame.setAttribute('allowfullscreen', '');
  frame.style.cssText = 'display:block;width:100%;height:100%;border:0;background:#020617';

  messageHandler = (event) => {
    if (!frame || event.source !== frame.contentWindow || event.origin !== window.location.origin) return;
    const data = event.data;
    if (data?.type !== 'playzy:run-ended' || data.gameId !== 'apex-velocity') return;
    reportRun(container, 'apex-velocity', {
      score: Math.max(0, Number(data.score) || 0),
      duration: Math.max(0, Number(data.duration) || 0),
    });
  };
  window.addEventListener('message', messageHandler);
  frame.addEventListener('load', () => {
    setSoundEnabled(soundEnabled);
    frame?.focus();
  });
  container.appendChild(frame);
}

export function destroyGame() {
  if (messageHandler) window.removeEventListener('message', messageHandler);
  messageHandler = null;
  frame?.remove();
  frame = null;
}
