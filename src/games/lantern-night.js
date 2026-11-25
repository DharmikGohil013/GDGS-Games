// ─── Lantern Night: An ASCII Folktale ───
// A short story adventure drawn entirely in text characters. The world is a
// real three.js scene, rendered into a small off-screen target (a 2x3 grid of
// light samples per character cell, each supersampled 2x2), plus its depth and a
// second pass of surface directions. A cell pass then picks one glyph per cell:
// outlines where one thing stands in front of another or two faces meet, a
// density ramp for flat light, and for light with a shape (an edge, a tip) the
// glyph whose ink best matches it. A final pass draws the glyphs. Story text and
// endings live in lantern-night-story.js so they can be edited without touching the engine.

import * as THREE from 'three';
import { reportRun } from '../core/runReport.js';
import { tone, noise, unlockAudio, haptic } from '../core/audio.js';
import { CHAPTERS, ENDINGS, SPEAKERS, TOTAL_FLAMES, MAX_MERCY, computeEnding } from './lantern-night-story.js';

const GAME_ID = 'lantern-night';
const SAVE_KEY = 'playzy:lantern-night:save';
// Every glyph the renderer may draw. Its ink is measured from the real font at
// start-up, so shape matching follows whatever monospace face the player has.
// Letters are left out on purpose: they match shapes well but read as stray words.
const GLYPHS = ' .\'`,:;-_~=+*^"!|/\\()[]{}<>ox#%@';
// The subset used to fill flat patches of light, re-sorted by measured ink. No
// - ~ = here: packed side by side they join into stripes that read as lines;
// " and ! fill the ink gap between ; and + without doing that.
const RAMP = ' .,:;"!+*%@#';
// Glyphs the cell pass picks by rule rather than by matching: outlines and stars.
const RULE_GLYPHS = { G_VBAR: '|', G_SLASH: '/', G_BSLASH: '\\', G_DASH: '-', G_UNDER: '_', G_STAR: '*', G_PLUS: '+', G_DOT: '.' };
// Each cell is sampled as 2 columns x 3 rows of light; each sample averages 2x2 scene texels.
const SUPERSAMPLE = 2;
// Cell height over width. Courier's glyphs are about 0.6em wide, so 1.4 lets
// the font fill both directions and keeps the gaps between characters small.
const CELL_ASPECT = 1.4;
const MAX_NUTS = 5;
const MAX_OIL = 100;
const PLAYER_RADIUS = 0.38;

const THEMES = {
  village: { ground: '#1d2a1b', speck: '#2f3d28', path: '#8a785a', pathSpeck: '#a8946e', half: 11, fogFar: 62, ambient: 2.6 },
  bamboo: { ground: '#162414', speck: '#2b4224', path: '#6c6a4c', pathSpeck: '#8a8762', half: 10, fogFar: 54, ambient: 2.3 },
  cairn: { ground: '#24272a', speck: '#3a3e43', path: '#7a766c', pathSpeck: '#9a958a', half: 10, fogFar: 58, ambient: 2.3 },
  hollow: { ground: '#191420', speck: '#2c2338', path: '#574a60', pathSpeck: '#75657f', half: 10, fogFar: 50, ambient: 1.9 },
};

const ASCII_VERT = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

// Pass 1, run once per character cell: read the cell's 2x3 light, depth and
// surface-direction samples and pick its glyph. Writes the cell colour to rgb, the glyph index to alpha.
const CELL_FRAG = /* glsl */`
uniform sampler2D tScene;
uniform sampler2D tDepth;
uniform sampler2D tNormal;
uniform vec2 uGrid;
uniform vec2 uClip;
uniform vec3 uInkL[NG];
uniform vec3 uInkR[NG];
uniform float uRamp[NR];
uniform float uDensity;
uniform float uSharp;

vec2 sampleUv(vec2 cell, float i, float j) {
  return (cell * vec2(2.0, 3.0) + vec2(i, j) + 0.5) / (uGrid * vec2(2.0, 3.0));
}
vec3 sampleAt(vec2 cell, float i, float j) {
  // Sample (i, j) sits on the corner of its 2x2 texel block, so linear filtering averages all four.
  return max(texture2D(tScene, sampleUv(cell, i, j)).rgb, 0.0);
}
float distAt(vec2 cell, float i, float j) {
  // Depth can't be filtered, so step a quarter-sample into one texel of the block.
  float d = texture2D(tDepth, sampleUv(cell, i, j) + 0.25 / (uGrid * vec2(2.0, 3.0))).r;
  return uClip.x * uClip.y / (uClip.y - d * (uClip.y - uClip.x));
}
vec3 normalAt(vec2 cell, float i, float j) {
  return texture2D(tNormal, sampleUv(cell, i, j)).rgb * 2.0 - 1.0;
}
float luma(vec3 c) {
  return dot(pow(c, vec3(0.4545)), vec3(0.299, 0.587, 0.114));
}

// The line glyph for an edge running between the marked (1) and unmarked (0)
// samples of a cell, left column ml and right column mr, bottom row first.
float edgeGlyph(vec3 ml, vec3 mr) {
  // Columns are half a cell width apart, rows ROW_STEP cell widths apart.
  float gx = (dot(mr, vec3(1.0)) - dot(ml, vec3(1.0))) / 3.0 / 0.5;
  float gy = ((ml.z + mr.z) - (ml.x + mr.x)) / 4.0 / ROW_STEP;
  // The edge runs across the gradient; quantise it to four directions.
  float a = mod(atan(gy, gx) + 0.3927, 3.14159265);
  float q = floor(a / 0.7854);
  float rowsMarked = (ml.x + mr.x + ml.y + mr.y + ml.z + mr.z) / 2.0;
  bool low = gy < 0.0 ? rowsMarked < 1.5 : rowsMarked > 1.5;
  return q < 0.5 ? float(G_VBAR) : (q < 1.5 ? float(G_BSLASH) : (q < 2.5 ? (low ? float(G_UNDER) : float(G_DASH)) : float(G_SLASH)));
}

void main() {
  vec2 cell = floor(gl_FragCoord.xy);
  vec3 a0 = sampleAt(cell, 0.0, 0.0), a1 = sampleAt(cell, 0.0, 1.0), a2 = sampleAt(cell, 0.0, 2.0);
  vec3 b0 = sampleAt(cell, 1.0, 0.0), b1 = sampleAt(cell, 1.0, 1.0), b2 = sampleAt(cell, 1.0, 2.0);
  vec3 col = pow((a0 + a1 + a2 + b0 + b1 + b2) / 6.0, vec3(0.4545));
  // Light in the left and right columns, bottom row first (the glyph atlas is flipped the same way).
  vec3 sl = vec3(luma(a0), luma(a1), luma(a2));
  vec3 sr = vec3(luma(b0), luma(b1), luma(b2));
  float hi = max(max(max(sl.x, sl.y), sl.z), max(max(sr.x, sr.y), sr.z));
  float lo = min(min(min(sl.x, sl.y), sl.z), min(min(sr.x, sr.y), sr.z));
  float L = (sl.x + sl.y + sl.z + sr.x + sr.y + sr.z) / 6.0;

  // Distance to the camera at each sample, same layout as the light.
  vec3 zl = vec3(distAt(cell, 0.0, 0.0), distAt(cell, 0.0, 1.0), distAt(cell, 0.0, 2.0));
  vec3 zr = vec3(distAt(cell, 1.0, 0.0), distAt(cell, 1.0, 1.0), distAt(cell, 1.0, 2.0));
  float zNear = min(min(min(zl.x, zl.y), zl.z), min(min(zr.x, zr.y), zr.z));
  float zFar = max(max(max(zl.x, zl.y), zl.z), max(max(zr.x, zr.y), zr.z));
  // Ground seen at a grazing angle also gets deeper fast, so far away it takes a
  // bigger jump to count; past the fog, outlines would only add clutter.
  bool silhouette = zNear < 40.0 && zFar > zNear * (1.08 + zNear * 0.006);

  // Surface direction at each sample. Two that differ a lot (over ~57 degrees)
  // mean a corner between faces: a wall meeting the ground, a roof ridge.
  vec3 n[6];
  n[0] = normalAt(cell, 0.0, 0.0); n[1] = normalAt(cell, 0.0, 1.0); n[2] = normalAt(cell, 0.0, 2.0);
  n[3] = normalAt(cell, 1.0, 0.0); n[4] = normalAt(cell, 1.0, 1.0); n[5] = normalAt(cell, 1.0, 2.0);
  float worst = 1.0;
  vec3 faceA = n[0];
  vec3 faceB = n[0];
  for (int i = 0; i < 6; i++) {
    for (int j = i + 1; j < 6; j++) {
      float d = dot(n[i], n[j]);
      if (d < worst) { worst = d; faceA = n[i]; faceB = n[j]; }
    }
  }
  bool crease = zNear < 40.0 && worst < 0.55;

  float idx = 0.0;
  if (silhouette) {
    // Something stands in front of something else here: outline it, so even a
    // dark shape on dark ground keeps its edge. Mask = the nearer samples.
    float split = sqrt(zNear * zFar);
    vec3 ml = step(zl, vec3(split));
    vec3 mr = step(zr, vec3(split));
    idx = edgeGlyph(ml, mr);
    vec3 nearLin = (a0 * ml.x + a1 * ml.y + a2 * ml.z + b0 * mr.x + b1 * mr.y + b2 * mr.z) / max(dot(ml + mr, vec3(1.0)), 1.0);
    col = pow(nearLin, vec3(0.4545));
  } else if (crease) {
    // A corner between two faces: draw the fold line, so boxes,
    // roofs and rocks read as solid 3D shapes. Mask = samples on face A's side.
    vec3 ml = vec3(step(dot(n[0], faceB), dot(n[0], faceA)), step(dot(n[1], faceB), dot(n[1], faceA)), step(dot(n[2], faceB), dot(n[2], faceA)));
    vec3 mr = vec3(step(dot(n[3], faceB), dot(n[3], faceA)), step(dot(n[4], faceB), dot(n[4], faceA)), step(dot(n[5], faceB), dot(n[5], faceA)));
    idx = edgeGlyph(ml, mr);
  } else if (hi > 0.15 && lo < 0.05 && hi - lo > 0.12
      && dot(step(vec3(hi * 0.5), sl), vec3(1.0)) + dot(step(vec3(hi * 0.5), sr), vec3(1.0)) < 1.5) {
    // A lone speck of light on black: a star, a spark. Draw it as one.
    idx = hi > 0.38 ? float(G_STAR) : (hi > 0.24 ? float(G_PLUS) : float(G_DOT));
    // The speck filled one texel of its sample's 2x2 block; undo that dilution.
    col = pow(min((a0 + a1 + a2 + b0 + b1 + b2) * 3.0, vec3(1.0)), vec3(0.4545));
  } else if (hi - lo < 0.08 || hi - lo < hi * 0.4) {
    // Flat light: step through the ink-sorted density ramp. Dim light is lifted a
    // little so unlit ground keeps a texture that shows its perspective.
    int r = int(floor(clamp(pow(L, 0.85) * uDensity, 0.0, 0.999) * float(NR)));
    for (int k = 0; k < NR; k++) if (k == r) idx = uRamp[k];
  } else {
    // Shaped light: push the dimmer samples down so the shape stands out, then
    // take the glyph whose ink lands in the same places.
    vec3 el = hi * pow(sl / max(hi, 1e-4), vec3(uSharp)) * uDensity;
    vec3 er = hi * pow(sr / max(hi, 1e-4), vec3(uSharp)) * uDensity;
    float best = 1e9;
    for (int k = 0; k < NG; k++) {
      vec3 dl = el - uInkL[k];
      vec3 dr = er - uInkR[k];
      float d = dot(dl, dl) + dot(dr, dr);
      if (d < best) { best = d; idx = float(k); }
    }
  }
  gl_FragColor = vec4(col, idx / 255.0);
}`;

// Pass 2, run per screen pixel: look up the cell's glyph and colour and draw it.
const ASCII_FRAG = /* glsl */`
uniform sampler2D tCells;
uniform sampler2D tGlyphs;
uniform vec2 uCell;
uniform vec2 uGrid;
uniform vec2 uOffset;
uniform float uGlyphCount;
uniform float uHurt;
uniform float uTint;

void main() {
  vec3 bg = vec3(0.010, 0.013, 0.026);
  vec2 p = gl_FragCoord.xy - uOffset;
  vec2 cell = floor(p / uCell);
  if (cell.x < 0.0 || cell.y < 0.0 || cell.x >= uGrid.x || cell.y >= uGrid.y) {
    gl_FragColor = vec4(bg, 1.0);
    return;
  }
  vec2 local = (p - cell * uCell) / uCell;
  vec4 data = texture2D(tCells, (cell + 0.5) / uGrid);
  float idx = floor(data.a * 255.0 + 0.5);
  vec3 col = data.rgb;
  float L = dot(col, vec3(0.299, 0.587, 0.114));

  float ink = texture2D(tGlyphs, vec2((idx + local.x) / uGlyphCount, local.y)).r;
  float peak = max(max(col.r, col.g), col.b);
  vec3 hue = peak > 0.001 ? col / peak : vec3(0.0);
  vec3 fg = mix(vec3(1.0), hue, 0.82) * (0.42 + 0.85 * sqrt(L));
  fg = mix(fg, vec3(1.0, 0.22, 0.16), uHurt * 0.75);
  // A faint wash of the cell's own colour behind the glyph fills the gaps between
  // characters, so shapes read as solid at a glance without losing the text look.
  vec3 back = bg + col * uTint;
  gl_FragColor = vec4(back + fg * ink, 1.0);
}`;

const CSS = `
.ln-root { position: relative; width: 100%; height: 100%; overflow: hidden; background: #03040a; color: #e8e2cf; font-family: "Courier New", ui-monospace, Menlo, Consolas, monospace; user-select: none; -webkit-user-select: none; touch-action: none; outline: none; }
.ln-root [hidden] { display: none !important; }
.ln-stage, .ln-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.ln-hud { position: absolute; inset: 0 0 auto 0; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding: 14px 16px; pointer-events: none; font-size: 13px; font-weight: 700; letter-spacing: .04em; text-shadow: 0 0 6px #000, 0 0 2px #000; }
.ln-root[data-state="title"] .ln-hud, .ln-root[data-state="ending"] .ln-hud { display: none; }
.ln-chapter { color: #ffd27a; text-transform: uppercase; letter-spacing: .14em; }
.ln-objective { color: #d6cfba; margin-top: 5px; font-weight: 400; }
.ln-compass { color: #9fc3ff; margin-top: 4px; font-weight: 400; }
.ln-hud-right { text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.ln-oil { color: #ffcf6b; white-space: pre; }
.ln-oil.is-low { color: #ff6b57; animation: ln-blink .7s steps(2) infinite; }
.ln-nuts { color: #e3c79a; white-space: pre; }
.ln-moon { color: #c9d4ff; }
.ln-pause-btn { pointer-events: auto; margin-top: 4px; font: inherit; color: #ffd27a; background: rgba(4, 6, 12, .6); border: 1px solid rgba(255, 210, 122, .4); padding: 3px 8px; cursor: pointer; }
.ln-pause-btn:hover, .ln-pause-btn:focus-visible { background: rgba(255, 210, 122, .15); outline: none; }
.ln-toast { position: absolute; left: 50%; top: 21%; transform: translate(-50%, 6px); max-width: min(560px, calc(100% - 32px)); text-align: center; padding: 6px 14px; background: rgba(3, 4, 10, .78); border: 1px solid rgba(255, 210, 122, .3); color: #f3e7c6; font-size: 14px; opacity: 0; transition: opacity .3s, transform .3s; pointer-events: none; }
.ln-toast.is-in { opacity: 1; transform: translate(-50%, 0); }
.ln-card { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; pointer-events: none; opacity: 0; transition: opacity .7s; padding: 16px; text-shadow: 0 0 14px #000; }
.ln-card.is-in { opacity: 1; }
.ln-card small { letter-spacing: .5em; color: #9fb4d8; font-size: 13px; }
.ln-card h2 { margin: 10px 0 0; font-size: clamp(24px, 5vw, 46px); letter-spacing: .16em; color: #ffd27a; }
.ln-card h2::before, .ln-card h2::after { content: " ~ "; color: #6d7fa6; }
.ln-dialog { position: absolute; left: 50%; bottom: 16px; transform: translateX(-50%); width: min(740px, calc(100% - 24px)); background: rgba(3, 5, 11, .9); border: 3px double rgba(255, 210, 122, .45); padding: 12px 18px 22px; cursor: pointer; }
.ln-speaker { font-weight: 700; text-transform: uppercase; letter-spacing: .16em; font-size: 12px; margin-bottom: 6px; color: #ffd27a; }
.ln-dialog[data-tone="grandma"] .ln-speaker { color: #f4efe2; }
.ln-dialog[data-tone="goblin"] .ln-speaker { color: #6fd3ff; }
.ln-dialog[data-tone="chief"] .ln-speaker { color: #ffc84a; }
.ln-dialog[data-tone="narrator"] .ln-text { color: #aab3c6; font-style: italic; }
.ln-text { font-size: 16px; line-height: 1.55; min-height: 3.1em; white-space: pre-wrap; }
.ln-choices { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
.ln-choice { text-align: left; font: inherit; font-size: 15px; color: #f0e8d2; background: rgba(255, 210, 122, .06); border: 1px solid rgba(255, 210, 122, .35); padding: 8px 12px; cursor: pointer; }
.ln-choice:hover, .ln-choice:focus-visible { background: rgba(255, 210, 122, .2); color: #fff; outline: none; }
.ln-next { position: absolute; right: 14px; bottom: 6px; font-size: 12px; color: #ffd27a; animation: ln-blink 1s steps(2) infinite; }
.ln-overlay { position: absolute; inset: 0; display: none; align-items: center; justify-content: center; padding: 16px; background: rgba(2, 3, 8, .55); }
.ln-overlay.is-open { display: flex; }
.ln-panel { width: 100%; max-width: 520px; max-height: 100%; overflow: auto; background: rgba(3, 5, 11, .92); border: 3px double rgba(255, 210, 122, .45); padding: 20px 22px; }
.ln-title-screen { justify-content: flex-start; background: linear-gradient(90deg, rgba(2, 3, 8, .9), rgba(2, 3, 8, .35) 62%, rgba(2, 3, 8, 0)); }
.ln-title-screen .ln-panel { max-width: 430px; background: transparent; border: 0; padding: 8px 8px 8px clamp(8px, 4vw, 40px); }
.ln-art { margin: 0 0 6px; color: #ffb86b; font-size: 12px; line-height: 1.05; font-weight: 700; }
.ln-logo { margin: 0; font-size: clamp(32px, 6.4vw, 58px); line-height: .95; letter-spacing: .14em; color: #ffd27a; text-shadow: 0 0 18px rgba(255, 180, 80, .45); }
.ln-sub { margin: 10px 0 14px; color: #a9bde0; font-size: 14px; }
.ln-menu-btn { display: block; width: 100%; text-align: left; font: inherit; font-size: 15px; font-weight: 700; letter-spacing: .06em; color: #140e04; background: #ffd27a; border: 1px solid #ffd27a; padding: 10px 14px; margin-top: 9px; cursor: pointer; text-decoration: none; box-sizing: border-box; }
.ln-menu-btn:hover, .ln-menu-btn:focus-visible { background: #ffe3a6; outline: none; }
.ln-menu-btn.is-ghost { background: transparent; color: #ffd27a; border-color: rgba(255, 210, 122, .45); }
.ln-menu-btn.is-ghost:hover, .ln-menu-btn.is-ghost:focus-visible { background: rgba(255, 210, 122, .14); }
.ln-keys { margin-top: 16px; font-size: 12px; color: #aaa38f; line-height: 1.8; }
.ln-keys kbd { font-family: inherit; color: #efe6cf; border: 1px solid rgba(255, 255, 255, .25); padding: 0 5px; }
.ln-h { margin: 0 0 10px; color: #ffd27a; letter-spacing: .14em; font-size: 16px; text-align: center; }
.ln-pause-info { margin: 0 0 8px; text-align: center; color: #c9c2ad; font-size: 13px; }
.ln-ssireum { max-width: 560px; text-align: center; cursor: pointer; }
.ln-ssireum pre { margin: 6px 0; font-size: clamp(11px, 2.4vw, 16px); line-height: 1.35; color: #efe6cf; white-space: pre; font-weight: 700; overflow: hidden; }
.ln-ss-msg { min-height: 1.4em; color: #ffd27a; margin: 6px 0 0; }
.ln-ending { max-width: 600px; }
.ln-eyebrow { display: block; text-align: center; color: #9fb4d8; letter-spacing: .4em; font-size: 12px; text-transform: uppercase; }
.ln-end-title { margin: 8px 0 12px; text-align: center; color: #ffd27a; letter-spacing: .1em; font-size: clamp(22px, 4.5vw, 34px); }
.ln-end-text p { margin: 0 0 10px; line-height: 1.6; color: #ddd6c3; font-size: 14px; }
.ln-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 14px; margin: 14px 0 6px; padding-top: 12px; border-top: 1px dashed rgba(255, 210, 122, .3); font-size: 13px; }
.ln-stats div { display: flex; justify-content: space-between; gap: 8px; color: #b9b29e; }
.ln-stats b { color: #ffd27a; }
.ln-fade { position: absolute; inset: 0; background: #000; opacity: 0; pointer-events: none; transition: opacity .7s; }
.ln-fade.is-on { opacity: 1; }
.ln-joy { position: absolute; left: 0; top: 0; width: 110px; height: 110px; margin: -55px 0 0 -55px; border: 2px dashed rgba(255, 210, 122, .45); border-radius: 50%; pointer-events: none; display: none; }
.ln-joy.is-on { display: block; }
.ln-joy i { position: absolute; left: 50%; top: 50%; width: 44px; height: 44px; margin: -22px 0 0 -22px; border-radius: 50%; background: rgba(255, 210, 122, .35); }
.ln-nut-btn { position: absolute; right: 18px; bottom: 22px; width: 78px; height: 78px; border-radius: 50%; border: 2px solid rgba(255, 210, 122, .65); background: rgba(10, 8, 4, .65); color: #ffd27a; font: inherit; font-weight: 700; font-size: 12px; line-height: 1.2; display: none; align-items: center; justify-content: center; text-align: center; touch-action: none; }
.ln-root.is-touch[data-state="play"] .ln-nut-btn { display: flex; }
.ln-touch-only { display: none; }
.ln-root.is-touch .ln-touch-only { display: block; }
@keyframes ln-blink { 50% { opacity: .25; } }
@media (max-width: 600px) {
  .ln-hud { font-size: 11px; padding: 10px; }
  .ln-text { font-size: 14px; }
  .ln-choice { font-size: 13px; }
  .ln-art { display: none; }
}
`;

const MARKUP = `
<div class="ln-stage" data-ref="stage"></div>
<div class="ln-hud">
  <div class="ln-hud-left">
    <div class="ln-chapter" data-ref="chapter"></div>
    <div class="ln-objective" data-ref="objective"></div>
    <div class="ln-compass" data-ref="compass"></div>
  </div>
  <div class="ln-hud-right">
    <div class="ln-oil" data-ref="oil"></div>
    <div class="ln-nuts" data-ref="nuts"></div>
    <div class="ln-moon" data-ref="moon"></div>
    <button class="ln-pause-btn" type="button" data-ref="pauseBtn" aria-label="Pause">[ II ]</button>
  </div>
</div>
<div class="ln-toast" data-ref="toast" aria-live="polite"></div>
<div class="ln-card" data-ref="card"><small data-ref="cardNum"></small><h2 data-ref="cardTitle"></h2></div>
<div class="ln-dialog" data-ref="dialog" hidden>
  <div class="ln-speaker" data-ref="speaker"></div>
  <div class="ln-text" data-ref="text"></div>
  <div class="ln-choices" data-ref="choices"></div>
  <div class="ln-next" data-ref="next">[ next ]</div>
</div>
<div class="ln-joy" data-ref="joy"><i data-ref="knob"></i></div>
<button class="ln-nut-btn" type="button" data-ref="nutBtn" aria-label="Crack a walnut">CRACK<br>NUT</button>
<div class="ln-overlay ln-title-screen" data-ref="title">
  <div class="ln-panel">
<pre class="ln-art" aria-hidden="true">      _|_
   .-'===\`-.
  | ~~~~~~~ |
  |   (@)   |
  | ~~~~~~~ |
   '-.___.-'
      |||</pre>
    <h2 class="ln-logo">LANTERN<br>NIGHT</h2>
    <p class="ln-sub">An ASCII folktale of the first full moon</p>
    <button class="ln-menu-btn" type="button" data-ref="continueBtn" hidden></button>
    <button class="ln-menu-btn" type="button" data-ref="beginBtn">&gt; Begin the tale</button>
    <div class="ln-keys">
      <div><kbd>WASD</kbd> / <kbd>Arrows</kbd> walk with the lantern</div>
      <div><kbd>Space</kbd> crack a walnut to scare dokkaebi-fires</div>
      <div><kbd>Enter</kbd> talk &middot; <kbd>1</kbd> <kbd>2</kbd> choose &middot; <kbd>P</kbd> pause</div>
      <div class="ln-touch-only">Touch: drag anywhere to walk, tap CRACK NUT</div>
    </div>
  </div>
</div>
<div class="ln-overlay" data-ref="pause">
  <div class="ln-panel">
    <h3 class="ln-h">- PAUSED -</h3>
    <p class="ln-pause-info" data-ref="pauseInfo"></p>
    <button class="ln-menu-btn" type="button" data-ref="resumeBtn">&gt; Resume</button>
    <button class="ln-menu-btn is-ghost" type="button" data-ref="restartBtn">Restart this chapter</button>
    <button class="ln-menu-btn is-ghost" type="button" data-ref="titleBtn">Back to the title</button>
  </div>
</div>
<div class="ln-overlay" data-ref="ssireum">
  <div class="ln-panel ln-ssireum">
    <h3 class="ln-h">SSIREUM: THROW BAWI TWICE</h3>
    <pre data-ref="ssBoard"></pre>
    <p class="ln-ss-msg" data-ref="ssMsg"></p>
  </div>
</div>
<div class="ln-overlay" data-ref="ending">
  <div class="ln-panel ln-ending">
    <span class="ln-eyebrow">The tale ends</span>
    <h2 class="ln-end-title" data-ref="endTitle"></h2>
    <div class="ln-end-text" data-ref="endText"></div>
    <div class="ln-stats" data-ref="endStats"></div>
    <button class="ln-menu-btn" type="button" data-ref="againBtn">&gt; Tell it again</button>
    <a class="ln-menu-btn is-ghost" href="/">Browse all games</a>
  </div>
</div>
<div class="ln-fade" data-ref="fade"></div>
`;

/* ─────────────────────────── small helpers ─────────────────────────── */

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));

function angleDamp(a, b, k, dt) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * (1 - Math.exp(-k * dt));
}

function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function newStory() {
  return {
    chapter: 0, flames: 0, mercy: 0, nuts: 3, lost: 0, choices: {},
    playTime: 0, distance: 0, nutsCracked: 0, ssireumWins: 0,
  };
}

function readSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || !Number.isInteger(s.chapter) || s.chapter < 0 || s.chapter >= CHAPTERS.length) return null;
    return { ...newStory(), ...s, choices: { ...(s.choices || {}) } };
  } catch (e) {
    return null;
  }
}

function writeSave(story) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(story)); } catch (e) { /* private mode */ }
}

function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* private mode */ }
}

/* ─────────────────────────── glyphs ─────────────────────────── */

const GLYPH_FONT = '"Courier New", Courier, monospace';

// Draws every glyph centred in its own cw x ch cell. The on-screen atlas and the
// ink measurement both use this, so the measured shapes match the drawn ones.
function drawGlyphStrip(cw, ch) {
  const c = document.createElement('canvas');
  c.width = cw * GLYPHS.length;
  c.height = ch;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#000';
  g.fillRect(0, 0, c.width, c.height);
  // Fit the font to the cell rather than the cell to the font: each glyph almost
  // as wide as its cell, so neighbours nearly touch, and a full-height glyph plus
  // the underscore just filling its height. Tall strokes like | may lose a pixel.
  g.font = `bold 100px ${GLYPH_FONT}`;
  const advance = g.measureText('M').width / 100;
  const box = g.measureText('#@_');
  const top = (box.actualBoundingBoxAscent ?? 64) / 100;
  const bottom = (box.actualBoundingBoxDescent ?? 22) / 100;
  const size = Math.max(6, Math.floor(Math.min((cw * 0.98) / advance, ch / (top + bottom))));
  const baseline = Math.round((ch - (top + bottom) * size) / 2 + top * size);
  g.font = `bold ${size}px ${GLYPH_FONT}`;
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  for (let i = 0; i < GLYPHS.length; i++) {
    // Clip to the glyph's own slot so a wide glyph can't bleed into its neighbour.
    g.save();
    g.beginPath();
    g.rect(cw * i, 0, cw, ch);
    g.clip();
    g.fillText(GLYPHS[i], cw * i + cw / 2, baseline);
    g.restore();
  }
  return c;
}

// Width of one character cell in device pixels, for a stage cssWidth CSS pixels
// wide on a screen with this device pixel ratio. Smaller cells mean more
// characters across the screen and finer detail; too small and the glyphs
// themselves blur into dots. The cell is CELL_ASPECT times as tall as it is wide.
function cellWidth(cssWidth, dpr) {
  // About 270 columns across a laptop; a phone bottoms out at 4 CSS px a cell
  // (~95 columns). Under 5 device pixels a glyph is no longer readable.
  const cssCell = clamp(cssWidth / 270, 4, 7);
  return Math.max(5, Math.round(cssCell * dpr));
}

// How much ink each glyph puts in each of a cell's six sample regions (2 columns
// x 3 rows, bottom row first), measured on a large cell so thin strokes count.
function measureGlyphInk() {
  const cw = 30;
  const ch = Math.round(30 * CELL_ASPECT / 3) * 3;
  const c = drawGlyphStrip(cw, ch);
  const px = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  const area = (cw / 2) * (ch / 3);
  const regions = [...GLYPHS].map((_, i) => {
    const sums = [0, 0, 0, 0, 0, 0];
    for (let y = 0; y < ch; y++) {
      const row = 2 - Math.floor((y * 3) / ch);
      for (let x = 0; x < cw; x++) sums[(x < cw / 2 ? 0 : 3) + row] += px[(y * c.width + i * cw + x) * 4] / 255;
    }
    return sums.map((s) => s / area);
  });
  const peak = Math.max(...regions.flat());
  const total = (i) => regions[i].reduce((a, b) => a + b, 0);
  return {
    left: regions.map((r) => new THREE.Vector3(r[0], r[1], r[2]).divideScalar(peak)),
    right: regions.map((r) => new THREE.Vector3(r[3], r[4], r[5]).divideScalar(peak)),
    ramp: [...RAMP].map((chr) => GLYPHS.indexOf(chr)).sort((a, b) => total(a) - total(b)),
  };
}

/* ─────────────────────────── module API ─────────────────────────── */

let instance = null;

export function initGame(container) {
  destroyGame();
  instance = createLanternNight(container);
}

export function destroyGame() {
  if (!instance) return;
  const running = instance;
  instance = null;
  running.destroy();
}

/** The shared synth reads the site-wide sound setting on every cue. */
export function setSoundEnabled() {}

/* ─────────────────────────── the game ─────────────────────────── */

function createLanternNight(container) {
  container.innerHTML = '';
  const root = document.createElement('div');
  root.className = 'ln-root';
  root.dataset.state = 'title';
  root.tabIndex = 0;
  root.innerHTML = MARKUP;
  const style = document.createElement('style');
  style.textContent = CSS;
  root.prepend(style);
  container.appendChild(root);

  const refs = {};
  root.querySelectorAll('[data-ref]').forEach((el) => { refs[el.dataset.ref] = el; });

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  } catch (err) {
    refs.title.classList.add('is-open');
    refs.title.querySelector('.ln-panel').innerHTML = '<h2 class="ln-logo">LANTERN<br>NIGHT</h2><p class="ln-sub">This game needs WebGL, which this browser has turned off or does not support.</p>';
    return { destroy() { root.remove(); } };
  }
  renderer.setClearColor(0x000000, 1);
  const canvas = renderer.domElement;
  canvas.className = 'ln-canvas';
  refs.stage.appendChild(canvas);

  /* ── scene, lights, ASCII pass ── */
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 12, 58);
  const camera = new THREE.PerspectiveCamera(52, 16 / 9, 0.1, 420);

  const ambient = new THREE.AmbientLight(0x7083b8, 1);
  const moonLight = new THREE.DirectionalLight(0xb4c2ff, 0.2);
  // A soft fill from behind the camera so the faces we look at are never pure black;
  // without it Dal, who walks away from the camera, reads as an empty outline.
  const fillLight = new THREE.DirectionalLight(0x9aa8d8, 1.6);
  scene.add(ambient, moonLight, moonLight.target, fillLight, fillLight.target);
  // Gentle decay keeps the lantern from blowing out everything within arm's reach.
  const lanternLight = new THREE.PointLight(0xffb469, 14, 18, 1.15);
  scene.add(lanternLight);
  const pool = Array.from({ length: 4 }, () => {
    const light = new THREE.PointLight(0xffd27a, 0, 8, 1.5);
    scene.add(light);
    return light;
  });

  // The scene, at 2x3 samples per character cell (times the supersample factor).
  // Its depth is kept as a texture so the cell pass can find where one object stands in front of another.
  const rt = new THREE.WebGLRenderTarget(4, 4, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthTexture: new THREE.DepthTexture(4, 4) });
  // The same view drawn as surface directions, one texel per light sample, so the
  // cell pass can find corners between faces. Flat shading keeps each face one direction.
  const rtNormal = new THREE.WebGLRenderTarget(4, 4, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  const normalMat = new THREE.MeshNormalMaterial({ flatShading: true });
  // One texel per character cell: its colour, and the glyph chosen for it.
  const rtCells = new THREE.WebGLRenderTarget(4, 4, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false });
  const ink = measureGlyphInk();
  const grid = new THREE.Vector2(100, 40);
  const ruleGlyphs = Object.fromEntries(Object.entries(RULE_GLYPHS).map(([k, chr]) => [k, GLYPHS.indexOf(chr)]));
  const cellMat = new THREE.ShaderMaterial({
    defines: { NG: GLYPHS.length, NR: RAMP.length, ROW_STEP: (CELL_ASPECT / 3).toFixed(4), ...ruleGlyphs },
    uniforms: {
      tScene: { value: rt.texture },
      tDepth: { value: rt.depthTexture },
      tNormal: { value: rtNormal.texture },
      uClip: { value: new THREE.Vector2(camera.near, camera.far) },
      uGrid: { value: grid },
      uInkL: { value: ink.left },
      uInkR: { value: ink.right },
      uRamp: { value: ink.ramp },
      // Light-to-ink gain: how dense a glyph a given brightness earns.
      uDensity: { value: 1.12 },
      // How hard dim samples are pushed down before shape matching; higher gives crisper outlines.
      uSharp: { value: 2.2 },
    },
    vertexShader: ASCII_VERT,
    fragmentShader: CELL_FRAG,
    depthTest: false,
    depthWrite: false,
  });
  const U = {
    tCells: { value: rtCells.texture },
    tGlyphs: { value: null },
    uCell: { value: new THREE.Vector2(8, 14) },
    uGrid: { value: grid },
    uOffset: { value: new THREE.Vector2() },
    uGlyphCount: { value: GLYPHS.length },
    uHurt: { value: 0 },
    uTint: { value: 0.2 },
  };
  const asciiMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: ASCII_VERT, fragmentShader: ASCII_FRAG, depthTest: false, depthWrite: false });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), asciiMat);
  quad.frustumCulled = false;
  const quadScene = new THREE.Scene();
  quadScene.add(quad);
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  /* ── shared geometry and materials ── */
  const GEO = {
    box: new THREE.BoxGeometry(1, 1, 1),
    cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
    taper: new THREE.CylinderGeometry(0.33, 0.5, 1, 9),
    stalk: new THREE.CylinderGeometry(0.075, 0.095, 1, 5),
    cone: new THREE.ConeGeometry(0.5, 1, 7),
    roof: new THREE.ConeGeometry(1, 1, 4).rotateY(Math.PI / 4),
    sphere: new THREE.SphereGeometry(0.5, 10, 8),
    ico: new THREE.IcosahedronGeometry(0.5, 0),
    dode: new THREE.DodecahedronGeometry(0.5, 0),
    ring: new THREE.TorusGeometry(1, 0.07, 4, 36),
  };
  const mats = new Map();
  function lam(color) {
    const key = `l${color}`;
    if (!mats.has(key)) mats.set(key, new THREE.MeshLambertMaterial({ color, flatShading: true }));
    return mats.get(key);
  }
  function glow(color) {
    const key = `b${color}`;
    if (!mats.has(key)) mats.set(key, new THREE.MeshBasicMaterial({ color }));
    return mats.get(key);
  }
  function mesh(geo, mat, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.rotation.set(rx, ry, rz);
    return m;
  }

  /* ── sky: the moon whose light you are gathering, and a band of stars ── */
  const sky = new THREE.Group();
  scene.add(sky);
  const moonMat = new THREE.MeshBasicMaterial({ color: 0x111116, fog: false });
  const moon = mesh(GEO.sphere, moonMat, -24, 36, -230, 27, 27, 27);
  sky.add(moon);
  const starPositions = [];
  const starRng = mulberry32(42);
  for (let i = 0; i < 170; i++) {
    const az = (starRng() - 0.5) * 2.1;
    const el = 0.02 + starRng() * 0.2;
    const R = 240;
    starPositions.push(Math.sin(az) * Math.cos(el) * R, 7 + Math.sin(el) * R, -Math.cos(az) * Math.cos(el) * R);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  // One texel wide, so each star lands inside a single character cell and stays a point.
  // Stars write no depth: they are specks of light, not shapes to outline.
  const starMat = new THREE.PointsMaterial({ color: 0xc9d4ff, size: 1, sizeAttenuation: false, fog: false, depthWrite: false });
  const stars = new THREE.Points(starGeo, starMat);
  sky.add(stars);

  /* ── Dal, the lantern-keeper's grandchild ── */
  const dal = buildDal();
  scene.add(dal.group);
  const player = { x: 0, z: 0, vx: 0, vz: 0, facing: 0, invuln: 0, walk: 0, swing: 0, swingV: 0, lastSp: 0 };

  /* ── effects ── */
  const particles = Array.from({ length: 48 }, () => {
    const m = mesh(GEO.box, glow(0xffd27a), 0, 0, 0, 0.14, 0.14, 0.14);
    m.visible = false;
    scene.add(m);
    return { m, vx: 0, vy: 0, vz: 0, life: 0 };
  });
  const shockRing = mesh(GEO.ring, glow(0xfff0cc), 0, 0.4, 0, 1, 1, 1, Math.PI / 2);
  shockRing.visible = false;
  scene.add(shockRing);
  let ringT = 0;

  /* ── per-chapter world ── */
  let world = null;
  let disposables = [];
  let W = 10;
  let L = 100;
  let seed = 0;
  let gateX = 0;
  let colliders = [];
  let blockers = [];
  let flames = [];
  let wisps = [];
  let posts = [];
  let decor = [];
  let npc = null;
  const px = (z) => Math.sin(z * 0.045 + seed) * 3.4 + Math.sin(z * 0.113 + seed * 2.1) * 1.3;

  /* ── run state ── */
  let story = newStory();
  let chapterStart = newStory();
  let state = 'title';
  let oil = MAX_OIL;
  let chFlames = 0;
  let checkpoint = { x: 0, z: 4 };
  let focus = null;
  let moonLevel = 0.04;
  let moonTarget = 0.04;
  let hurt = 0;
  let shake = 0;
  let nutCooldown = 0;
  let gateNag = 0;
  let hurtNag = 0;
  let toastT = 0;
  let flowToken = 0;
  let destroyed = false;
  let raf = 0;
  let last = performance.now();
  let time = 0;
  let glyphTex = null;
  const timers = new Set();
  const keys = new Set();
  const joy = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
  const hudCache = {};
  const camPos = new THREE.Vector3(0, 7, 18);
  const camLook = new THREE.Vector3(0, 1, 0);
  const tmpPos = new THREE.Vector3();
  const tmpLook = new THREE.Vector3();
  const tmpV = new THREE.Vector3();
  const bufSize = new THREE.Vector2();

  function setState(next) {
    state = next;
    root.dataset.state = next;
  }

  const alive = (token) => token === flowToken && !destroyed;

  function wait(ms) {
    return new Promise((resolve) => {
      const id = setTimeout(() => { timers.delete(id); resolve(); }, ms);
      timers.add(id);
    });
  }

  /* ─────────────────────────── sound ─────────────────────────── */

  const NOTES = [523, 587, 659, 784, 880, 1047, 1175, 1319];
  const snd = {
    crack() {
      noise({ dur: 0.07, vol: 0.3, freq: 2600, filter: 'highpass' });
      tone({ type: 'square', from: 220, to: 70, dur: 0.09, vol: 0.1 });
    },
    hurt() {
      noise({ dur: 0.3, vol: 0.18, freq: 900, freqEnd: 120 });
      tone({ type: 'sawtooth', from: 300, to: 90, dur: 0.3, vol: 0.09 });
    },
    flame(n) {
      const f = NOTES[n % NOTES.length];
      tone({ type: 'sine', from: f, to: f, dur: 0.2, vol: 0.16 });
      tone({ type: 'triangle', from: f * 2, to: f * 2, dur: 0.28, vol: 0.05, delay: 0.06 });
    },
    post() { [392, 523, 659].forEach((f, i) => tone({ type: 'triangle', from: f, to: f, dur: 0.32, vol: 0.1, delay: i * 0.08 })); },
    denied() { tone({ type: 'square', from: 150, to: 110, dur: 0.18, vol: 0.07 }); },
    lost() { tone({ type: 'sine', from: 330, to: 70, dur: 1.2, vol: 0.16 }); },
    blip(who) {
      const base = { dal: 640, grandma: 470, ttukttak: 760, bawi: 190, goldhorn: 150 }[who];
      if (base) tone({ type: 'square', from: base, to: base * 1.04, dur: 0.03, vol: 0.022 });
    },
    ui() { tone({ type: 'sine', from: 620, to: 820, dur: 0.06, vol: 0.07 }); },
    throwWin() { noise({ dur: 0.25, vol: 0.22, freq: 500, freqEnd: 80 }); tone({ type: 'triangle', from: 523, to: 1047, dur: 0.25, vol: 0.12, delay: 0.08 }); },
    throwLose() { noise({ dur: 0.3, vol: 0.2, freq: 400, freqEnd: 60 }); tone({ type: 'sawtooth', from: 220, to: 110, dur: 0.25, vol: 0.08 }); },
    ending() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone({ type: 'triangle', from: f, to: f, dur: 0.45, vol: 0.12, delay: i * 0.15 })); },
  };

  /* ─────────────────────────── resize & glyph atlas ─────────────────────────── */

  function makeGlyphAtlas(cw, ch) {
    const tex = new THREE.CanvasTexture(drawGlyphStrip(cw, ch));
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    return tex;
  }

  function resize() {
    if (destroyed) return;
    const w = Math.max(2, root.clientWidth);
    const h = Math.max(2, root.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    renderer.getDrawingBufferSize(bufSize);
    const cw = cellWidth(w, dpr);
    const ch = Math.round(cw * CELL_ASPECT);
    const cols = Math.max(20, Math.floor(bufSize.x / cw));
    const rows = Math.max(12, Math.floor(bufSize.y / ch));
    U.uCell.value.set(cw, ch);
    grid.set(cols, rows);
    U.uOffset.value.set(Math.floor((bufSize.x - cols * cw) / 2), Math.floor((bufSize.y - rows * ch) / 2));
    rt.setSize(cols * 2 * SUPERSAMPLE, rows * 3 * SUPERSAMPLE);
    rtNormal.setSize(cols * 2, rows * 3);
    rtCells.setSize(cols, rows);
    camera.aspect = (cols * cw) / (rows * ch);
    camera.updateProjectionMatrix();
    // three.js scales point size by the pixel ratio; undo that so a star is exactly one texel.
    starMat.size = 1 / dpr;
    glyphTex?.dispose();
    glyphTex = makeGlyphAtlas(cw, ch);
    U.tGlyphs.value = glyphTex;
  }

  /* ─────────────────────────── models ─────────────────────────── */

  function buildDal() {
    const group = new THREE.Group();
    const body = new THREE.Group();
    group.add(body);
    // A faint self-glow keeps the hero readable against the dark ground.
    const robe = new THREE.MeshLambertMaterial({ color: 0x5b74e0, emissive: 0x18245a, flatShading: true });
    const jacket = new THREE.MeshLambertMaterial({ color: 0xf4ecd6, emissive: 0x2c2820, flatShading: true });
    // Black hair seen from behind would draw as an empty hole; a dim sheen gives it texture.
    const hair = new THREE.MeshLambertMaterial({ color: 0x2a2420, emissive: 0x1e1c26, flatShading: true });
    mats.set('dal-robe', robe);
    mats.set('dal-jacket', jacket);
    mats.set('dal-hair', hair);
    body.add(mesh(GEO.taper, robe, 0, 0.6, 0, 0.95, 1.2, 0.95));
    body.add(mesh(GEO.cyl, jacket, 0, 1.3, 0, 0.66, 0.44, 0.6));
    body.add(mesh(GEO.box, lam(0xc8372e), 0.1, 1.22, -0.31, 0.09, 0.34, 0.04));
    body.add(mesh(GEO.sphere, lam(0xf0c9a2), 0, 1.74, 0, 0.46, 0.48, 0.46));
    body.add(mesh(GEO.sphere, hair, 0, 1.81, 0.05, 0.5, 0.42, 0.5));
    body.add(mesh(GEO.cyl, hair, 0, 1.42, 0.24, 0.12, 0.62, 0.12));
    body.add(mesh(GEO.box, lam(0xc8372e), 0, 1.1, 0.25, 0.16, 0.12, 0.05));
    body.add(mesh(GEO.cyl, jacket, 0.3, 1.25, -0.15, 0.14, 0.5, 0.14, -0.9));
    body.add(mesh(GEO.cyl, lam(0x5a3b22), 0.36, 1.55, -0.55, 0.05, 1.1, 0.05, -1.05));
    const pivot = new THREE.Group();
    pivot.position.set(0.36, 1.82, -1.02);
    body.add(pivot);
    pivot.add(mesh(GEO.cyl, lam(0x2a1d12), 0, -0.12, 0, 0.02, 0.24, 0.02));
    pivot.add(mesh(GEO.cyl, lam(0x2a1d12), 0, -0.23, 0, 0.42, 0.04, 0.42));
    pivot.add(mesh(GEO.cyl, glow(0x3f78ff), 0, -0.34, 0, 0.38, 0.2, 0.38));
    pivot.add(mesh(GEO.cyl, glow(0xff5a3c), 0, -0.53, 0, 0.38, 0.2, 0.38));
    pivot.add(mesh(GEO.cyl, lam(0x2a1d12), 0, -0.64, 0, 0.42, 0.04, 0.42));
    const lightAnchor = new THREE.Object3D();
    lightAnchor.position.set(0, -0.44, 0);
    pivot.add(lightAnchor);
    return { group, body, pivot, lightAnchor };
  }

  function makeGrandma() {
    const group = new THREE.Group();
    const body = new THREE.Group();
    group.add(body);
    body.add(mesh(GEO.taper, lam(0xe9e6dc), 0, 0.55, 0, 0.9, 1.1, 0.9));
    const upper = new THREE.Group();
    upper.position.set(0, 1.08, 0);
    upper.rotation.x = 0.38;
    body.add(upper);
    upper.add(mesh(GEO.cyl, lam(0xd6cfbd), 0, 0.15, 0, 0.62, 0.38, 0.56));
    upper.add(mesh(GEO.sphere, lam(0xe8c4a0), 0, 0.56, 0.04, 0.42, 0.44, 0.42));
    upper.add(mesh(GEO.sphere, lam(0xd8d8d8), 0, 0.67, -0.05, 0.44, 0.36, 0.44));
    upper.add(mesh(GEO.sphere, lam(0xd8d8d8), 0, 0.63, -0.27, 0.2, 0.2, 0.2));
    body.add(mesh(GEO.cyl, lam(0x5a3b22), 0.4, 0.62, 0.28, 0.06, 1.25, 0.06, 0.15));
    return { group, body, kind: 'grandma' };
  }

  function makeDokkaebi(o) {
    const group = new THREE.Group();
    const body = new THREE.Group();
    body.scale.setScalar(o.scale);
    group.add(body);
    const skin = lam(o.skin);
    body.add(mesh(GEO.cyl, skin, -0.22, 0.3, 0, 0.26, 0.6, 0.26));
    body.add(mesh(GEO.cyl, skin, 0.22, 0.3, 0, 0.26, 0.6, 0.26));
    body.add(mesh(GEO.box, lam(0xd98b2b), 0, 0.68, 0, 0.92, 0.36, 0.68));
    body.add(mesh(GEO.box, lam(0x1b1410), 0, 0.68, 0.35, 0.94, 0.07, 0.02));
    body.add(mesh(GEO.sphere, skin, 0, 1.16, 0, 1.0, 0.95, 0.8));
    body.add(mesh(GEO.sphere, skin, 0, 1.86, 0.05, 0.8, 0.76, 0.72));
    body.add(mesh(GEO.sphere, glow(0xffe14a), -0.17, 1.94, 0.37, 0.16, 0.16, 0.12));
    body.add(mesh(GEO.sphere, glow(0xffe14a), 0.17, 1.94, 0.37, 0.16, 0.16, 0.12));
    body.add(mesh(GEO.box, lam(0x2a0f0f), 0, 1.7, 0.37, 0.36, 0.08, 0.04));
    body.add(mesh(GEO.cone, lam(0xf3ead2), -0.11, 1.78, 0.38, 0.07, 0.14, 0.07));
    body.add(mesh(GEO.cone, lam(0xf3ead2), 0.11, 1.78, 0.38, 0.07, 0.14, 0.07));
    const hornMat = o.glowHorns ? glow(o.hornColor) : lam(o.hornColor);
    const hornXs = o.horns === 1 ? [0.06] : [-0.22, 0.22];
    hornXs.forEach((hx) => body.add(mesh(GEO.cone, hornMat, hx, 2.34, 0, 0.17, 0.46, 0.17, 0, 0, -hx * 0.9)));
    body.add(mesh(GEO.cyl, skin, -0.6, 1.1, 0.05, 0.2, 0.72, 0.2, 0, 0, -0.5));
    body.add(mesh(GEO.cyl, skin, 0.6, 1.1, 0.05, 0.2, 0.72, 0.2, 0, 0, 0.5));
    if (o.club) {
      const club = new THREE.Group();
      club.position.set(0.78, 0.86, 0.12);
      club.rotation.set(0.3, 0, -0.55);
      club.add(mesh(GEO.taper, lam(o.club), 0, 0.55, 0, 0.3, 1.2, 0.3, Math.PI));
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        club.add(mesh(GEO.sphere, o.glowHorns ? glow(o.hornColor) : lam(0xd8cfb8), Math.cos(a) * 0.16, 0.85 + (i % 2) * 0.18, Math.sin(a) * 0.16, 0.1, 0.1, 0.1));
      }
      body.add(club);
    }
    let held = null;
    if (o.holdsFlame) {
      held = makeFlame();
      held.group.position.set(0, 2.9 * o.scale, 0.5);
      held.group.scale.setScalar(0.7);
      group.add(held.group);
    }
    return { group, body, kind: 'dokkaebi', held };
  }

  function makeFlame() {
    const group = new THREE.Group();
    const core = mesh(GEO.ico, glow(0xfff2c2), 0, 0, 0, 0.55, 0.68, 0.55);
    group.add(core);
    const sparks = [];
    for (let i = 0; i < 3; i++) {
      const s = mesh(GEO.box, glow(0xffaf42), 0, 0, 0, 0.12, 0.12, 0.12);
      group.add(s);
      sparks.push(s);
    }
    return { group, core, sparks };
  }

  function makeWisp() {
    const group = new THREE.Group();
    const body = mesh(GEO.cone, glow(0x47b4ff), 0, 0.18, 0, 0.55, 1.05, 0.55);
    const core = mesh(GEO.sphere, glow(0xd8f6ff), 0, -0.05, 0, 0.32, 0.32, 0.32);
    group.add(body, core);
    return { group, body, core };
  }

  function makeGate() {
    const g = new THREE.Group();
    const red = lam(0xb8352b);
    g.add(mesh(GEO.cyl, red, -2.7, 2.6, 0, 0.42, 5.2, 0.42), mesh(GEO.cyl, red, 2.7, 2.6, 0, 0.42, 5.2, 0.42));
    g.add(mesh(GEO.box, red, 0, 4.7, 0, 6.4, 0.3, 0.3), mesh(GEO.box, red, 0, 3.9, 0, 5.4, 0.2, 0.2));
    for (let i = -4; i <= 4; i++) {
      g.add(mesh(GEO.box, red, i * 0.6, 4.75, 0, 0.07, 1.7, 0.07));
      g.add(mesh(GEO.cone, red, i * 0.6, 5.72, 0, 0.16, 0.3, 0.16));
    }
    // A glowing taegeuk mark so the gate reads as a beacon through the dark.
    g.add(mesh(GEO.sphere, glow(0xd8402f), 0, 4.32, 0.12, 0.72, 0.72, 0.14));
    g.add(mesh(GEO.sphere, glow(0x3366dd), 0, 4.16, 0.17, 0.46, 0.36, 0.1));
    return g;
  }

  /* ── instanced scenery: thousands of props in a handful of draw calls ── */

  function makeInstancer() {
    const buckets = new Map();
    const parent = new THREE.Matrix4();
    let hasParent = false;
    const e = new THREE.Euler();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    return {
      part(geo, color, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0, isGlow = false) {
        const key = `${geo}|${color}|${isGlow ? 1 : 0}`;
        let bucket = buckets.get(key);
        if (!bucket) {
          bucket = { geo: GEO[geo], mat: isGlow ? glow(color) : lam(color), list: [] };
          buckets.set(key, bucket);
        }
        e.set(rx, ry, rz);
        q.setFromEuler(e);
        p.set(x, y, z);
        s.set(sx, sy, sz);
        const m = new THREE.Matrix4().compose(p, q, s);
        if (hasParent) m.premultiply(parent);
        bucket.list.push(m);
      },
      at(x, y, z, ry, scale, fn) {
        e.set(0, ry, 0);
        q.setFromEuler(e);
        p.set(x, y, z);
        s.set(scale, scale, scale);
        parent.compose(p, q, s);
        hasParent = true;
        try { fn(); } finally { hasParent = false; }
      },
      build(group) {
        for (const bucket of buckets.values()) {
          const im = new THREE.InstancedMesh(bucket.geo, bucket.mat, bucket.list.length);
          bucket.list.forEach((m, i) => im.setMatrixAt(i, m));
          im.instanceMatrix.needsUpdate = true;
          im.computeBoundingSphere();
          group.add(im);
          disposables.push(im);
        }
      },
    };
  }

  function house(inst) {
    inst.part('box', 0x77746d, 0, 0.18, 0, 3.8, 0.36, 2.8);
    inst.part('box', 0xd8ccb0, 0, 1.06, 0, 3.4, 1.4, 2.4);
    inst.part('box', 0x4a3324, 0, 0.92, 1.22, 0.8, 1.1, 0.05);
    inst.part('box', 0xf0e2bf, -1.05, 1.15, 1.22, 0.7, 0.55, 0.05);
    inst.part('box', 0xf0e2bf, 1.05, 1.15, 1.22, 0.7, 0.55, 0.05);
    for (const sx of [-1.66, 1.66]) for (const sz of [-1.16, 1.16]) inst.part('cyl', 0x4b3526, sx, 1.06, sz, 0.18, 1.5, 0.18);
    inst.part('roof', 0x343944, 0, 2.3, 0, 3.0, 1.1, 2.3);
    inst.part('box', 0x252a33, 0, 2.82, 0, 2.4, 0.16, 0.24);
  }

  function persimmon(inst, rng) {
    inst.part('cyl', 0x4a372a, 0, 1.1, 0, 0.32, 2.2, 0.32);
    inst.part('ico', 0x27452a, 0, 2.9, 0, 3.0, 2.2, 3.0, rng(), rng(), 0);
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05 + rng();
      inst.part('sphere', 0xff8a2a, Math.cos(a) * 1.45, 2.4 + rng() * 0.9, Math.sin(a) * 1.45, 0.28, 0.28, 0.28);
    }
  }

  function jangseung(inst, isGeneral) {
    inst.part('cyl', 0x7a5a3c, 0, 1.45, 0, 0.62, 2.9, 0.62);
    inst.part('cyl', 0x1f1c1a, 0, 3.1, 0, 0.7, 0.45, 0.7);
    inst.part('cyl', 0x1f1c1a, 0, 2.9, 0, 1.0, 0.06, 1.0);
    inst.part('box', isGeneral ? 0xb8322a : 0x2f5bb8, 0, 2.56, 0.3, 0.46, 0.07, 0.05);
    inst.part('box', 0xf2e8d0, -0.13, 2.42, 0.3, 0.13, 0.11, 0.05);
    inst.part('box', 0xf2e8d0, 0.13, 2.42, 0.3, 0.13, 0.11, 0.05);
    inst.part('box', 0xf2e8d0, 0, 2.08, 0.3, 0.32, 0.09, 0.05);
    inst.part('box', 0x1d1a18, 0, 1.35, 0.3, 0.1, 1.2, 0.04);
  }

  function rock(inst, rng, x, z, s, color = 0x5f6266) {
    inst.part('dode', color, x, 0.3 * s, z, s, 0.7 * s, s * (0.8 + rng() * 0.4), rng() * 3, rng() * 3, rng() * 3);
  }

  function pine(inst, rng, x, z, s) {
    inst.part('cyl', 0x3a2a20, x, 1.1 * s, z, 0.34 * s, 2.2 * s, 0.34 * s);
    for (let i = 0; i < 3; i++) {
      const w = (2.8 - i * 0.75) * s;
      inst.part('cone', i % 2 ? 0x234a32 : 0x1c3d2a, x, (2.2 + i * 1.05) * s, z, w, 1.9 * s, w, 0, rng() * 6.28, 0);
    }
  }

  function cairn(inst, rng, x, z, s) {
    let y = 0;
    const n = 4 + Math.floor(rng() * 3);
    for (let i = 0; i < n; i++) {
      const size = (0.95 - i * 0.13) * s;
      const h = size * 0.55;
      inst.part('dode', [0x6c6f74, 0x84868a, 0x5c5f63][i % 3], x + (rng() - 0.5) * 0.1, y + h / 2, z + (rng() - 0.5) * 0.1, size, h, size, 0, rng() * 6, 0);
      y += h * 0.85;
    }
  }

  function deadTree(inst, rng, x, z, s) {
    const lean = (rng() - 0.5) * 0.25;
    inst.part('taper', 0x3b302b, x, 1.7 * s, z, 0.6 * s, 3.4 * s, 0.6 * s, lean, 0, lean);
    for (let i = 0; i < 3; i++) {
      const a = rng() * 6.28;
      inst.part('cyl', 0x3b302b, x + Math.cos(a) * 0.55 * s, (2.1 + i * 0.6) * s, z + Math.sin(a) * 0.55 * s, 0.14 * s, 1.7 * s, 0.14 * s, Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9);
    }
  }

  function mushroom(inst, rng, x, z) {
    const s = 0.7 + rng() * 0.7;
    inst.part('cyl', 0xcfc6d8, x, 0.18 * s, z, 0.1 * s, 0.36 * s, 0.1 * s);
    inst.part('sphere', 0x8f63f0, x, 0.38 * s, z, 0.5 * s, 0.24 * s, 0.5 * s, 0, 0, 0, true);
  }

  function isFree(x, z, r) {
    for (const c of colliders) {
      const dx = x - c.x;
      const dz = z - c.z;
      if (dx * dx + dz * dz < (c.r + r) ** 2) return false;
    }
    for (const b of blockers) {
      if (x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r) return false;
    }
    return true;
  }

  function makeGround(theme, rng) {
    const GW = W * 2 + 70;
    const z0 = 26;
    const z1 = -L - 64;
    const GL = z0 - z1;
    const cw = 256;
    const chh = 1024;
    const c = document.createElement('canvas');
    c.width = cw;
    c.height = chh;
    const g = c.getContext('2d');
    g.fillStyle = theme.ground;
    g.fillRect(0, 0, cw, chh);
    g.fillStyle = theme.speck;
    for (let i = 0; i < 2600; i++) g.fillRect(rng() * cw, rng() * chh, 1 + rng() * 2, 1 + rng() * 2);
    const toPx = (x) => ((x + GW / 2) / GW) * cw;
    // Canvas row 0 maps to the far end of the plane once the texture is flipped.
    g.fillStyle = theme.path;
    for (let y = 0; y < chh; y++) {
      const z = z1 + (y / chh) * GL;
      const hw = ((1.9 + Math.sin(z * 0.3) * 0.25) / GW) * cw;
      g.fillRect(toPx(px(z)) - hw, y, hw * 2, 1);
    }
    g.fillStyle = theme.pathSpeck;
    for (let i = 0; i < 900; i++) {
      const y = rng() * chh;
      const z = z1 + (y / chh) * GL;
      g.fillRect(toPx(px(z)) + (rng() - 0.5) * (3.4 / GW) * cw, y, 1 + rng() * 2, 1 + rng() * 1.5);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshLambertMaterial({ map: tex });
    const geo = new THREE.PlaneGeometry(GW, GL);
    geo.rotateX(-Math.PI / 2);
    const ground = new THREE.Mesh(geo, mat);
    ground.position.set(0, 0, (z0 + z1) / 2);
    disposables.push(tex, mat, geo);
    return ground;
  }

  /* ── chapter scenery ── */

  function sceneVillage(inst, rng, R) {
    for (let z = -5; z > -L + 12; z -= R(9, 12)) {
      for (const side of [-1, 1]) {
        if (rng() < 0.15) continue;
        const x = px(z) + side * R(6.2, 7.4);
        if (!isFree(x, z, 2.2)) continue;
        inst.at(x, 0, z, side < 0 ? Math.PI / 2 : -Math.PI / 2, R(0.92, 1.08), () => house(inst));
        colliders.push({ x, z, r: 2.1 });
      }
    }
    for (let z = 14; z > -L - 24; z -= R(5, 8)) {
      for (const side of [-1, 1]) {
        const x = px(z) + side * R(W + 2, W + 10);
        if (rng() < 0.5) inst.at(x, 0, z, R(0, 6.28), R(0.9, 1.2), () => house(inst));
        else inst.at(x, 0, z, R(0, 6.28), R(0.9, 1.4), () => persimmon(inst, rng));
      }
    }
    for (let z = 10; z > -L - 10; z -= 3.1) {
      for (const side of [-1, 1]) inst.part('box', 0x6f6c66, px(z) + side * (W - 0.2), 0.35, z, 0.5, 0.7, 3.0);
    }
    for (let i = 0; i < 10; i++) {
      const z = R(-8, -L + 12);
      const x = px(z) + (rng() < 0.5 ? -1 : 1) * R(3.4, W - 1.5);
      if (!isFree(x, z, 1)) continue;
      inst.at(x, 0, z, R(0, 6.28), R(0.8, 1.1), () => persimmon(inst, rng));
      colliders.push({ x, z, r: 0.6 });
    }
    // Festival lanterns strung across the lane, waiting for the moon.
    for (let z = -13; z > -L + 12; z -= R(15, 21)) {
      const cx = px(z);
      for (const side of [-1, 1]) {
        inst.part('cyl', 0x4a3424, cx + side * 4.3, 1.7, z, 0.14, 3.4, 0.14);
        colliders.push({ x: cx + side * 4.3, z, r: 0.3 });
      }
      inst.part('box', 0x2a2018, cx, 3.3, z, 8.6, 0.03, 0.03);
      for (let i = 0; i < 9; i++) inst.part('cyl', i % 2 ? 0x2c5fd0 : 0xc8372e, cx - 4.3 + (i + 0.5) * (8.6 / 9), 3.05, z, 0.32, 0.42, 0.32);
    }
    for (const [z, off] of [[1.5, 3.4], [-L + 5, 3.6]]) {
      for (const side of [-1, 1]) {
        const x = px(z) + side * off;
        inst.at(x, 0, z, 0, 1, () => jangseung(inst, side < 0));
        colliders.push({ x, z, r: 0.42 });
      }
    }
  }

  function sceneBamboo(inst, rng, R) {
    const stalk = (x, z, h) => {
      inst.part('stalk', rng() < 0.5 ? 0x7aa152 : 0x6a9446, x, h / 2, z, 1, h, 1, R(-0.06, 0.06), 0, R(-0.06, 0.06));
      if (rng() < 0.7) inst.part('ico', 0x355f29, x + R(-0.5, 0.5), h * R(0.6, 0.95), z + R(-0.5, 0.5), R(0.8, 1.6), R(0.25, 0.45), R(0.8, 1.6));
    };
    for (let z = 14; z > -L - 26; z -= 0.55) {
      for (const side of [-1, 1]) {
        for (let k = 0; k < 2; k++) stalk(px(z) + side * R(W - 0.1, W + 10), z + R(-0.3, 0.3), R(5, 10));
      }
    }
    for (let i = 0; i < Math.round(L / 6.5); i++) {
      const z = R(-7, -L + 9);
      const x = px(z) + (rng() < 0.5 ? -1 : 1) * R(3.2, W - 1.5);
      if (!isFree(x, z, 1.3)) continue;
      const n = 3 + Math.floor(rng() * 5);
      for (let j = 0; j < n; j++) stalk(x + R(-0.8, 0.8), z + R(-0.8, 0.8), R(4, 9));
      colliders.push({ x, z, r: 1.15 });
    }
    for (let i = 0; i < 12; i++) {
      const z = R(-7, -L + 9);
      const x = px(z) + (rng() < 0.5 ? -1 : 1) * R(3.2, W - 1);
      const s = R(0.7, 1.4);
      if (!isFree(x, z, s * 0.6)) continue;
      rock(inst, rng, x, z, s);
      colliders.push({ x, z, r: s * 0.5 });
    }
  }

  function sceneCairn(inst, rng, R) {
    // A gorge near the end, crossed by one rope bridge.
    const zc = -L + 14;
    const z0 = zc - 3;
    const z1 = zc + 3;
    const bx = px(zc);
    blockers.push({ x0: -999, x1: bx - 1.25, z0, z1 }, { x0: bx + 1.25, x1: 999, z0, z1 });
    inst.part('box', 0x000000, bx - 1.25 - 25, 0.03, zc, 50, 0.04, 6, 0, 0, 0, true);
    inst.part('box', 0x000000, bx + 1.25 + 25, 0.03, zc, 50, 0.04, 6, 0, 0, 0, true);
    for (let x = bx - W - 8; x < bx + W + 8; x += 1.1) {
      if (Math.abs(x - bx) < 1.7) continue;
      rock(inst, rng, x, z1 + 0.25, R(0.4, 0.8), 0x55585d);
      rock(inst, rng, x, z0 - 0.25, R(0.4, 0.8), 0x55585d);
    }
    for (let z = z0 - 0.5; z <= z1 + 0.5; z += 0.55) inst.part('box', 0x6e4c30, bx, 0.12, z, 2.4, 0.1, 0.42, 0, 0, R(-0.04, 0.04));
    for (const sx of [-1.25, 1.25]) {
      inst.part('box', 0x8b6a45, bx + sx, 0.85, zc, 0.05, 0.05, 7.2);
      for (const sz of [z0 - 0.6, z1 + 0.6]) inst.part('cyl', 0x4a3424, bx + sx, 0.5, sz, 0.14, 1.0, 0.14);
    }
    for (let z = 14; z > -L - 26; z -= 2.1) {
      for (const side of [-1, 1]) {
        pine(inst, rng, px(z) + side * R(W + 0.6, W + 4), z + R(-1, 1), R(1, 1.5));
        pine(inst, rng, px(z) + side * R(W + 4, W + 12), z + R(-1, 1), R(1.1, 1.7));
      }
    }
    // The seonangdang: a guardian tree hung with wish ribbons above a stone heap.
    const tz = -L * 0.47;
    const tx = px(tz) + 5.6;
    inst.part('cyl', 0x3a2c22, tx, 2, tz, 0.9, 4, 0.9);
    inst.part('ico', 0x1f3a26, tx, 5, tz, 5.5, 3.2, 5.5);
    inst.part('cyl', 0xe8dcc0, tx, 1.7, tz, 0.98, 0.08, 0.98);
    const ribbon = [0xd13b3b, 0x3567d6, 0xf0c63c, 0xf3f0e6, 0x3caa5a];
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * 6.28;
      const r = 1.6 + rng() * 1.2;
      inst.part('box', ribbon[i % 5], tx + Math.cos(a) * r, 3.0 - rng() * 0.5, tz + Math.sin(a) * r, 0.07, 1.1, 0.2, 0, a, 0);
    }
    for (let i = 0; i < 7; i++) rock(inst, rng, tx + R(-1.5, 1.5), tz + R(1, 2.2), R(0.4, 0.8));
    colliders.push({ x: tx, z: tz, r: 1.7 });
    for (let i = 0; i < Math.round(L / 4.5); i++) {
      const z = R(-7, -L + 8);
      if (Math.abs(z - zc) < 6) continue;
      const x = px(z) + (rng() < 0.5 ? -1 : 1) * R(3.3, W - 1.2);
      const kind = rng();
      if (kind < 0.42) {
        if (!isFree(x, z, 0.9)) continue;
        cairn(inst, rng, x, z, R(0.8, 1.25));
        colliders.push({ x, z, r: 0.7 });
      } else if (kind < 0.72) {
        const s = R(0.8, 1.6);
        if (!isFree(x, z, s * 0.6)) continue;
        rock(inst, rng, x, z, s);
        colliders.push({ x, z, r: s * 0.5 });
      } else {
        if (!isFree(x, z, 0.8)) continue;
        pine(inst, rng, x, z, R(0.8, 1.2));
        colliders.push({ x, z, r: 0.5 });
      }
    }
  }

  function sceneHollow(inst, rng, R) {
    for (let z = 14; z > -L - 26; z -= 1.7) {
      for (const side of [-1, 1]) {
        deadTree(inst, rng, px(z) + side * R(W + 0.5, W + 5), z + R(-0.8, 0.8), R(1, 1.6));
        if (rng() < 0.5) pine(inst, rng, px(z) + side * R(W + 5, W + 12), z, R(1.1, 1.6));
      }
    }
    // The hollow tree of Gold-Horn, behind the last gate.
    const gx = gateX;
    const gz = -L - 8;
    inst.part('taper', 0x2f2722, gx, 5, gz, 6.5, 10, 6.5);
    inst.part('box', 0x000000, gx, 1.7, gz + 3.05, 2.0, 3.2, 0.5, 0, 0, 0, true);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * 6.28 + 0.3;
      inst.part('cyl', 0x2f2722, gx + Math.cos(a) * 3.4, 0.5, gz + Math.sin(a) * 3.4, 0.7, 2.6, 0.7, Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1);
    }
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * 6.28;
      inst.part('ico', 0x1b2a1f, gx + Math.cos(a) * 3.5, 11 + rng() * 2, gz + Math.sin(a) * 3.5, 7, 4.5, 7, rng(), rng(), 0);
    }
    for (let i = 0; i < Math.round(L / 5); i++) {
      const z = R(-7, -L + 9);
      const x = px(z) + (rng() < 0.5 ? -1 : 1) * R(3.3, W - 1.2);
      if (rng() < 0.55) {
        if (!isFree(x, z, 0.8)) continue;
        deadTree(inst, rng, x, z, R(0.8, 1.3));
        colliders.push({ x, z, r: 0.5 });
      } else {
        const s = R(0.7, 1.5);
        if (!isFree(x, z, s * 0.6)) continue;
        rock(inst, rng, x, z, s, 0x4d4652);
        colliders.push({ x, z, r: s * 0.5 });
      }
    }
    for (let i = 0; i < 46; i++) {
      const z = R(4, -L + 4);
      mushroom(inst, rng, px(z) + (rng() < 0.5 ? -1 : 1) * R(2.6, W + 2), z);
    }
    for (let i = 0; i < 12; i++) {
      const w = makeWisp();
      world.add(w.group);
      decor.push({ ...w, cx: gx, cz: gz, r: R(6.5, 9.5), a: rng() * 6.28, sp: R(0.3, 0.6) * (rng() < 0.5 ? -1 : 1), y: R(2.5, 8) });
    }
  }

  /* ── interactive pieces ── */

  function placePosts(ch) {
    const fractions = ch.posts === 1 ? [0.5] : [0.34, 0.68];
    fractions.forEach((f, i) => {
      const z = -L * f;
      const side = i % 2 ? 1 : -1;
      const x = px(z) + side * 2.9;
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.add(mesh(GEO.cyl, lam(0x3d2c20), 0, 1.4, 0, 0.16, 2.8, 0.16));
      g.add(mesh(GEO.box, lam(0x3d2c20), -side * 0.35, 2.75, 0, 0.8, 0.1, 0.1));
      const paperMat = new THREE.MeshBasicMaterial({ color: 0x2a241c });
      disposables.push(paperMat);
      g.add(mesh(GEO.box, paperMat, -side * 0.68, 2.3, 0, 0.46, 0.6, 0.46));
      g.add(mesh(GEO.roof, lam(0x2b2320), -side * 0.68, 2.72, 0, 0.42, 0.22, 0.42));
      world.add(g);
      posts.push({ x, z, side, mat: paperMat, lit: false, lx: x - side * 0.68 });
      colliders.push({ x, z, r: 0.35 });
    });
  }

  function placeFlames(ch, rng) {
    for (let i = 0; i < ch.flames; i++) {
      let fx = null;
      let fz = null;
      for (let tries = 0; tries < 60 && fx === null; tries++) {
        const z = -L * 0.07 - (L * 0.84) * ((i + 0.15 + rng() * 0.7) / ch.flames);
        const x = px(z) + (tries < 40 ? (rng() * 2 - 1) * (W - 2.2) : (rng() * 2 - 1) * 1.5);
        if (isFree(x, z, 1.1)) { fx = x; fz = z; }
      }
      if (fx === null) { fz = -L * (0.1 + 0.8 * (i / ch.flames)); fx = px(fz); }
      const f = makeFlame();
      f.group.position.set(fx, 1.15, fz);
      world.add(f.group);
      flames.push({ ...f, x: fx, z: fz, taken: false, phase: rng() * 6.28 });
    }
  }

  function placeWisps(ch, rng) {
    for (let i = 0; i < ch.wisps; i++) {
      const z = -L * (ch.wisps === 1 ? 0.78 : 0.18 + rng() * 0.75);
      const x = px(z) + (rng() * 2 - 1) * (W - 2.5);
      const w = makeWisp();
      w.group.position.set(x, 1.2, z);
      world.add(w.group);
      wisps.push({ ...w, x, z, hx: x, hz: z, vx: 0, vz: 0, stun: 0, phase: rng() * 6.28, speed: ch.wispSpeed * (0.85 + rng() * 0.3) });
    }
  }

  function placeNpc(ch) {
    if (ch.npc === 'grandma') {
      npc = makeGrandma();
      npc.group.position.set(px(3) + 1.9, 0, 2.4);
    } else if (ch.npc === 'ttukttak') {
      npc = makeDokkaebi({ skin: 0xc8513b, scale: 0.8, horns: 1, hornColor: 0xe8dcc0, holdsFlame: true });
      npc.group.position.set(gateX, 0, -L - 0.6);
    } else if (ch.npc === 'bawi') {
      npc = makeDokkaebi({ skin: 0x5c7f9b, scale: 1.4, horns: 2, hornColor: 0xe8dcc0, club: 0x6b4a2e });
      npc.group.position.set(gateX, 0, -L - 0.9);
    } else {
      npc = makeDokkaebi({ skin: 0x3d6e4f, scale: 1.8, horns: 2, hornColor: 0xffcf4a, glowHorns: true, club: 0x8a6a3a });
      npc.group.position.set(gateX, 0, -L - 2.6);
    }
    world.add(npc.group);
    if (ch.npc === 'grandma') colliders.push({ x: npc.group.position.x, z: npc.group.position.z, r: 0.5 });
  }

  function clearWorld() {
    if (world) scene.remove(world);
    disposables.forEach((d) => d.dispose?.());
    disposables = [];
    world = null;
  }

  function buildWorld(index) {
    clearWorld();
    const ch = CHAPTERS[index];
    const theme = THEMES[ch.theme];
    const rng = mulberry32(9127 + index * 7919);
    const R = (a, b) => a + rng() * (b - a);
    seed = index * 1.37 + 0.5;
    W = theme.half;
    L = ch.length;
    gateX = px(-L);
    world = new THREE.Group();
    scene.add(world);
    scene.fog.far = theme.fogFar;
    ambient.intensity = theme.ambient;
    colliders = [];
    blockers = [];
    flames = [];
    wisps = [];
    posts = [];
    decor = [];
    npc = null;

    world.add(makeGround(theme, rng));
    const gate = makeGate();
    gate.position.set(gateX, 0, -L);
    world.add(gate);
    colliders.push({ x: gateX - 2.7, z: -L, r: 0.4 }, { x: gateX + 2.7, z: -L, r: 0.4 });
    placePosts(ch);

    const inst = makeInstancer();
    if (ch.theme === 'village') sceneVillage(inst, rng, R);
    else if (ch.theme === 'bamboo') sceneBamboo(inst, rng, R);
    else if (ch.theme === 'cairn') sceneCairn(inst, rng, R);
    else sceneHollow(inst, rng, R);
    inst.build(world);

    placeFlames(ch, rng);
    placeWisps(ch, rng);
    placeNpc(ch);
  }

  /* ─────────────────────────── player ─────────────────────────── */

  function resetPlayer(x, z) {
    Object.assign(player, { x, z, vx: 0, vz: 0, facing: 0, invuln: 0, swing: 0, swingV: 0, lastSp: 0 });
    dal.group.position.set(x, 0, z);
    dal.group.rotation.y = 0;
  }

  function updatePlayer(dt, controllable) {
    let ix = 0;
    let iz = 0;
    if (controllable) {
      if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) iz -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) iz += 1;
      ix += joy.x;
      iz += joy.y;
      const mag = Math.hypot(ix, iz);
      if (mag > 1) { ix /= mag; iz /= mag; }
    }
    const speed = 5.4;
    player.vx = damp(player.vx, ix * speed, 10, dt);
    player.vz = damp(player.vz, iz * speed, 10, dt);

    let nx = player.x + player.vx * dt;
    let nz = player.z + player.vz * dt;
    for (const c of colliders) {
      const dx = nx - c.x;
      const dz = nz - c.z;
      const min = c.r + PLAYER_RADIUS;
      const d2 = dx * dx + dz * dz;
      if (d2 < min * min && d2 > 1e-8) {
        const d = Math.sqrt(d2);
        nx = c.x + (dx / d) * min;
        nz = c.z + (dz / d) * min;
      }
    }
    for (const b of blockers) {
      const r = PLAYER_RADIUS;
      if (nx > b.x0 - r && nx < b.x1 + r && nz > b.z0 - r && nz < b.z1 + r) {
        const pen = [nx - (b.x0 - r), b.x1 + r - nx, nz - (b.z0 - r), b.z1 + r - nz];
        const m = Math.min(...pen);
        if (m === pen[0]) nx = b.x0 - r;
        else if (m === pen[1]) nx = b.x1 + r;
        else if (m === pen[2]) nz = b.z0 - r;
        else nz = b.z1 + r;
      }
    }
    nz = clamp(nz, -L - 1.5, 8);
    const cx = px(nz);
    nx = clamp(nx, cx - (W - 0.6), cx + (W - 0.6));
    story.distance += Math.hypot(nx - player.x, nz - player.z);
    player.x = nx;
    player.z = nz;

    const sp = Math.hypot(player.vx, player.vz);
    if (sp > 0.3) player.facing = angleDamp(player.facing, Math.atan2(-player.vx, -player.vz), 12, dt);
    else if (focus) {
      const p = focus.group.position;
      player.facing = angleDamp(player.facing, Math.atan2(-(p.x - player.x), -(p.z - player.z)), 6, dt);
    }
    player.walk += sp * dt * 2.2;
    const accel = (sp - player.lastSp) / Math.max(dt, 1e-3);
    player.lastSp = sp;
    player.swingV += (-player.swing * 40 - player.swingV * 5 - clamp(accel, -30, 30) * 0.3) * dt;
    player.swing += player.swingV * dt;

    const stride = Math.min(1, sp / 3);
    dal.group.position.set(player.x, 0, player.z);
    dal.group.rotation.y = player.facing;
    dal.body.position.y = Math.abs(Math.sin(player.walk)) * 0.08 * stride;
    dal.body.rotation.z = Math.sin(player.walk) * 0.05 * stride;
    dal.pivot.rotation.x = player.swing + Math.sin(player.walk * 2) * 0.06 * stride;
    dal.group.visible = player.invuln <= 0 || Math.floor(time * 16) % 2 === 0;
  }

  /* ─────────────────────────── gameplay ─────────────────────────── */

  function updatePlay(dt) {
    const ch = CHAPTERS[story.chapter];
    story.playTime += dt;
    updatePlayer(dt, true);
    oil -= ch.drain * dt;
    nutCooldown = Math.max(0, nutCooldown - dt);
    player.invuln = Math.max(0, player.invuln - dt);
    gateNag = Math.max(0, gateNag - dt);
    hurtNag = Math.max(0, hurtNag - dt);

    for (const f of flames) {
      if (f.taken) continue;
      const dx = f.x - player.x;
      const dz = f.z - player.z;
      if (dx * dx + dz * dz < 1.35 * 1.35) collectFlame(f);
    }
    for (const p of posts) {
      const d = Math.hypot(p.x - player.x, p.z - player.z);
      if (d > 2.5) continue;
      if (!p.lit) lightPost(p);
      else if (oil < MAX_OIL) oil = Math.min(MAX_OIL, oil + 30 * dt);
    }
    updateWisps(dt, true);

    if (player.z < -L + 2.6 && Math.abs(player.x - gateX) < 4.2) reachGate();
    if (oil <= 0 && state === 'play') {
      oil = 0;
      loseLantern();
    }
  }

  function updateWisps(dt, active) {
    const aggro = 11 + story.chapter;
    for (const w of wisps) {
      w.phase += dt;
      const dx = player.x - w.x;
      const dz = player.z - w.z;
      const d = Math.hypot(dx, dz) || 1;
      let tx = 0;
      let tz = 0;
      let spd = 0;
      if (active) {
        if (w.stun > 0) {
          w.stun -= dt;
          tx = -dx / d; tz = -dz / d; spd = 2.6;
        } else if (d < aggro) {
          tx = dx / d + Math.sin(w.phase * 1.7) * 0.45;
          tz = dz / d + Math.cos(w.phase * 1.3) * 0.45;
          spd = w.speed;
        } else {
          const hx = w.hx + Math.sin(w.phase * 0.5) * 3 - w.x;
          const hz = w.hz + Math.cos(w.phase * 0.4) * 3 - w.z;
          const hd = Math.hypot(hx, hz) || 1;
          tx = hx / hd; tz = hz / hd; spd = Math.min(1.2, hd);
        }
        const tl = Math.hypot(tx, tz) || 1;
        w.vx = damp(w.vx, (tx / tl) * spd, 3, dt);
        w.vz = damp(w.vz, (tz / tl) * spd, 3, dt);
        w.x += w.vx * dt;
        w.z = clamp(w.z + w.vz * dt, -L + 3, 6);
        const cx = px(w.z);
        w.x = clamp(w.x, cx - W - 1, cx + W + 1);
        if (w.stun <= 0 && d < 1.0 && player.invuln <= 0) hurtBy(w, dx / d, dz / d);
      }
      const flicker = 1 + Math.sin(w.phase * 17) * 0.08 + Math.sin(w.phase * 7.3) * 0.06;
      w.group.position.set(w.x, 1.2 + Math.sin(w.phase * 2.3) * 0.25, w.z);
      w.group.rotation.y += dt * 2;
      w.body.scale.set(0.55 * flicker, 1.05 * (2 - flicker), 0.55 * flicker);
      w.body.material = w.stun > 0 ? glow(0x7d8499) : glow(0x47b4ff);
    }
  }

  function hurtBy(w, nx, nz) {
    oil -= 16;
    player.invuln = 1.3;
    w.stun = 1.6;
    w.vx = -nx * 6;
    w.vz = -nz * 6;
    player.vx += nx * 6;
    player.vz += nz * 6;
    hurt = 1;
    shake = 0.35;
    snd.hurt();
    haptic(40);
    if (hurtNag <= 0) {
      toast('A dokkaebi-fire drank some of your oil!');
      hurtNag = 6;
    }
  }

  function crackNut() {
    if (state !== 'play' || nutCooldown > 0) return;
    if (story.nuts <= 0) {
      snd.denied();
      toast('No walnuts left. Light a lantern post for more.');
      nutCooldown = 0.6;
      return;
    }
    story.nuts -= 1;
    story.nutsCracked += 1;
    nutCooldown = 0.6;
    ringT = 0.45;
    shockRing.visible = true;
    shockRing.position.set(player.x, 0.5, player.z);
    snd.crack();
    haptic(25);
    shake = Math.max(shake, 0.15);
    for (const w of wisps) {
      const dx = w.x - player.x;
      const dz = w.z - player.z;
      const d = Math.hypot(dx, dz) || 1;
      if (d < 7.5) {
        w.stun = 3.5;
        w.vx = (dx / d) * 7;
        w.vz = (dz / d) * 7;
      }
    }
  }

  function collectFlame(f) {
    const ch = CHAPTERS[story.chapter];
    f.taken = true;
    f.group.visible = false;
    chFlames += 1;
    story.flames += 1;
    burst(f.x, 1.15, f.z, 18, 0xffd27a);
    snd.flame(story.flames - 1);
    haptic(15);
    moonTarget = moonFromFlames();
    if (chFlames === ch.flames) toast('Every flame here is gathered. Head for the red gate.', 3);
    else if (chFlames === ch.need) toast('The red gate will open now. Extra flames make the moon brighter.', 3.2);
    else toast(`Moon-flame ${chFlames} of ${ch.flames}`, 1.6);
  }

  function lightPost(p) {
    p.lit = true;
    p.mat.color.set(0xffd39a);
    oil = MAX_OIL;
    story.nuts = Math.min(MAX_NUTS, story.nuts + 2);
    checkpoint = { x: px(p.z + 1.6), z: p.z + 1.6 };
    burst(p.lx, 2.3, p.z, 12, 0xffe2b0);
    snd.post();
    toast('Lantern post lit: oil refilled, +2 walnuts. You will return here if the dark wins.', 3.2);
  }

  function reachGate() {
    const ch = CHAPTERS[story.chapter];
    if (chFlames >= ch.need) {
      finishChapter();
      return;
    }
    player.z = -L + 3.1;
    player.vz = Math.max(0, player.vz);
    if (gateNag <= 0) {
      const short = ch.need - chFlames;
      toast(`The red gate will not open. Find ${short} more moon-flame${short === 1 ? '' : 's'}.`, 2.6);
      snd.denied();
      gateNag = 2.6;
    }
  }

  async function loseLantern() {
    if (state !== 'play') return;
    const token = ++flowToken;
    setState('transition');
    story.lost += 1;
    snd.lost();
    toast('The dark swallowed your lantern...', 2.4);
    await fadeTo(1, 1000);
    if (!alive(token)) return;
    resetPlayer(checkpoint.x, checkpoint.z);
    oil = 70;
    story.nuts = Math.max(story.nuts, 2);
    for (const w of wisps) { w.x = w.hx; w.z = w.hz; w.vx = 0; w.vz = 0; w.stun = 2; }
    snapCamera();
    await wait(350);
    if (!alive(token)) return;
    await fadeTo(0, 700);
    if (!alive(token)) return;
    setState('play');
    toast('You relit the lantern and pressed on.', 2.2);
  }

  function moonFromFlames() {
    return 0.04 + 0.96 * clamp(story.flames / TOTAL_FLAMES, 0, 1);
  }

  /* ─────────────────────────── effects & animation ─────────────────────────── */

  function burst(x, y, z, n, color) {
    let k = 0;
    for (const p of particles) {
      if (p.life > 0) continue;
      p.m.material = glow(color);
      p.m.position.set(x, y, z);
      const a = Math.random() * Math.PI * 2;
      const s = 1.5 + Math.random() * 3;
      p.vx = Math.cos(a) * s;
      p.vz = Math.sin(a) * s;
      p.vy = 1 + Math.random() * 3.5;
      p.life = 0.6 + Math.random() * 0.5;
      p.m.visible = true;
      if (++k >= n) break;
    }
  }

  function animateWorld(dt) {
    for (const f of flames) {
      if (f.taken) continue;
      f.phase += dt;
      f.group.position.y = 1.15 + Math.sin(f.phase * 2) * 0.18;
      f.core.rotation.y += dt * 1.6;
      f.core.rotation.x += dt * 0.7;
      f.sparks.forEach((s, i) => {
        const a = f.phase * 2.4 + (i * Math.PI * 2) / 3;
        s.position.set(Math.cos(a) * 0.62, Math.sin(a * 1.3) * 0.25, Math.sin(a) * 0.62);
      });
    }
    for (const p of posts) {
      if (p.lit) p.mat.color.setRGB(1, 0.78 + Math.sin(time * 9 + p.z) * 0.05, 0.5);
    }
    if (npc) {
      const bounce = npc.kind === 'dokkaebi' ? Math.abs(Math.sin(time * 2.6)) * 0.08 : Math.sin(time * 1.4) * 0.02;
      npc.body.position.y = bounce;
      if (npc.held) {
        npc.held.group.position.x = Math.sin(time * 3.1) * 0.45;
        npc.held.group.position.y = 2.4 + Math.abs(Math.sin(time * 3.1)) * 0.6;
        npc.held.core.rotation.y += dt * 3;
      }
      if (npc.kind === 'dokkaebi' || state === 'dialog') {
        const p = npc.group.position;
        const target = Math.atan2(player.x - p.x, player.z - p.z);
        npc.group.rotation.y = angleDamp(npc.group.rotation.y, target, 3, dt);
      }
    }
    for (const d of decor) {
      d.a += d.sp * dt;
      d.group.position.set(d.cx + Math.cos(d.a) * d.r, d.y + Math.sin(time * 1.3 + d.r) * 0.6, d.cz + Math.sin(d.a) * d.r);
      d.group.rotation.y += dt * 2;
    }
    for (const p of particles) {
      if (p.life <= 0) continue;
      p.life -= dt;
      if (p.life <= 0) { p.m.visible = false; continue; }
      p.vy -= 6 * dt;
      p.m.position.x += p.vx * dt;
      p.m.position.y = Math.max(0.05, p.m.position.y + p.vy * dt);
      p.m.position.z += p.vz * dt;
      p.m.scale.setScalar(0.14 * Math.min(1, p.life * 2.5));
    }
    if (ringT > 0) {
      ringT -= dt;
      const k = 1 - ringT / 0.45;
      shockRing.scale.setScalar(0.5 + k * 7);
      shockRing.position.set(player.x, 0.5, player.z);
      if (ringT <= 0) shockRing.visible = false;
    }
    moonLevel = damp(moonLevel, moonTarget, 1.6, dt);
    const m = Math.pow(moonLevel, 1.15);
    moonMat.color.setRGB(lerp(0.03, 1, m), lerp(0.03, 0.95, m), lerp(0.045, 0.82, m));
    // The world grows easier to read as the moon recovers its light.
    moonLight.intensity = 0.3 + 2.4 * moonLevel;
  }

  function updateLights() {
    dal.lightAnchor.getWorldPosition(tmpV);
    lanternLight.position.copy(tmpV);
    const fuel = clamp(oil / 40, 0, 1);
    let flicker = 1 + Math.sin(time * 13) * 0.03 + Math.sin(time * 29.7) * 0.02;
    if (oil < 25 && state === 'play') flicker *= 0.75 + 0.25 * Math.abs(Math.sin(time * 23 + Math.sin(time * 7)));
    lanternLight.intensity = (state === 'title' || state === 'ending' ? 14 : 14 * (0.3 + 0.7 * fuel)) * flicker;
    lanternLight.distance = 11 + 7 * (state === 'play' ? fuel : 1);

    const candidates = [];
    for (const f of flames) if (!f.taken) candidates.push({ x: f.x, y: f.group.position.y, z: f.z, c: 0xffcf7a, i: 7, r: 7 });
    for (const p of posts) if (p.lit) candidates.push({ x: p.lx, y: 2.3, z: p.z, c: 0xffc58a, i: 9, r: 9 });
    for (const w of wisps) candidates.push({ x: w.x, y: w.group.position.y, z: w.z, c: 0x4aa8ff, i: w.stun > 0 ? 1 : 4, r: 5 });
    for (const c of candidates) c.d = (c.x - player.x) ** 2 + (c.z - player.z) ** 2;
    candidates.sort((a, b) => a.d - b.d);
    pool.forEach((light, i) => {
      const c = candidates[i];
      if (!c) { light.intensity = 0; return; }
      light.position.set(c.x, c.y, c.z);
      light.color.setHex(c.c);
      light.intensity = c.i;
      light.distance = c.r;
    });
  }

  /* ─────────────────────────── camera ─────────────────────────── */

  function cameraTargets(outPos, outLook) {
    if (state === 'title' || state === 'ending') {
      const a = Math.sin(time * 0.12) * 0.5;
      const cx = player.x;
      const cz = player.z - 3;
      outPos.set(cx + Math.sin(a) * 10, 4.4 + Math.sin(time * 0.21) * 0.5, cz + Math.cos(a) * 10);
      outLook.set(cx, 2.4, cz - 8);
      return;
    }
    let fx = player.x;
    let fz = player.z;
    let k = 1;
    if (focus && (state === 'dialog' || state === 'ssireum')) {
      const p = focus.group.position;
      fx = (fx + p.x) / 2;
      fz = (fz + p.z) / 2;
      k = 0.72;
    }
    // Close enough that Dal and the dokkaebi span a dozen character cells.
    outPos.set(fx, 5.4 * k + 0.6, fz + 9 * k);
    outLook.set(fx, 1.3, fz - 7 * k);
  }

  function updateCamera(dt) {
    cameraTargets(tmpPos, tmpLook);
    const t = 1 - Math.exp(-4 * dt);
    camPos.lerp(tmpPos, t);
    camLook.lerp(tmpLook, t);
    camera.position.copy(camPos);
    if (shake > 0) {
      camera.position.x += (Math.random() - 0.5) * shake;
      camera.position.y += (Math.random() - 0.5) * shake;
    }
    camera.lookAt(camLook);
    sky.position.set(camera.position.x, 0, camera.position.z);
    moonLight.position.set(camera.position.x - 30, 50, camera.position.z - 60);
    moonLight.target.position.set(camera.position.x, 0, camera.position.z - 10);
    fillLight.position.set(camera.position.x + 2, camera.position.y + 3, camera.position.z + 4);
    fillLight.target.position.copy(camLook);
  }

  function snapCamera() {
    cameraTargets(camPos, camLook);
  }

  /* ─────────────────────────── HUD & UI ─────────────────────────── */

  function setText(key, value) {
    if (hudCache[key] === value) return;
    hudCache[key] = value;
    refs[key].textContent = value;
  }

  function objectiveText() {
    const ch = CHAPTERS[story.chapter];
    if (chFlames >= ch.flames) return 'All moon-flames found. Walk to the red gate.';
    if (chFlames >= ch.need) return `Moon-flames ${chFlames}/${ch.flames} - the red gate is open`;
    return `Moon-flames ${chFlames}/${ch.flames} - need ${ch.need} to open the red gate`;
  }

  function compassText() {
    const ch = CHAPTERS[story.chapter];
    let target = null;
    let best = Infinity;
    for (const f of flames) {
      if (f.taken) continue;
      const d = Math.hypot(f.x - player.x, f.z - player.z);
      if (d < best) { best = d; target = f; }
    }
    let label = 'moon-flame';
    if (!target || (chFlames >= ch.need && best > 30)) {
      target = { x: gateX, z: -L };
      best = Math.hypot(gateX - player.x, -L - player.z);
      label = 'red gate';
    }
    const ang = Math.atan2(target.x - player.x, -(target.z - player.z));
    const arrows = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
    const i = ((Math.round(ang / (Math.PI / 4)) % 8) + 8) % 8;
    return `${arrows[i]} ${label} ${Math.round(best)}m`;
  }

  function updateHud() {
    if (state === 'title' || state === 'ending') return;
    const ch = CHAPTERS[story.chapter];
    setText('chapter', `${ch.numeral} - ${ch.title}`);
    setText('objective', objectiveText());
    setText('compass', compassText());
    const n = Math.round(clamp(oil / MAX_OIL, 0, 1) * 14);
    setText('oil', `OIL [${'#'.repeat(n)}${'-'.repeat(14 - n)}]`);
    refs.oil.classList.toggle('is-low', oil < 25);
    setText('nuts', `WALNUTS ${'o'.repeat(story.nuts)}${'.'.repeat(Math.max(0, MAX_NUTS - story.nuts))}`);
    setText('moon', `MOON ${Math.min(100, Math.round((story.flames / TOTAL_FLAMES) * 100))}%`);
  }

  function toast(message, secs = 2.4) {
    refs.toast.textContent = message;
    refs.toast.classList.add('is-in');
    toastT = secs;
  }

  function fadeTo(v, ms = 700) {
    refs.fade.style.transitionDuration = `${ms}ms`;
    refs.fade.classList.toggle('is-on', v > 0);
    return wait(ms);
  }

  function closeOverlays() {
    ['title', 'pause', 'ssireum', 'ending'].forEach((k) => refs[k].classList.remove('is-open'));
  }

  /* ── dialogue ── */

  let talk = null;

  function showLine(line) {
    return new Promise((resolve) => {
      const sp = SPEAKERS[line.who] || SPEAKERS.narrator;
      refs.dialog.hidden = false;
      refs.dialog.dataset.tone = sp.tone;
      refs.speaker.textContent = sp.name;
      refs.speaker.hidden = !sp.name;
      refs.text.textContent = '';
      refs.choices.innerHTML = '';
      refs.next.hidden = true;
      talk = { line, resolve, shown: 0, acc: 0, done: false };
    });
  }

  function updateTalk(dt) {
    if (!talk || talk.done) return;
    talk.acc += dt * 46;
    const n = Math.min(talk.line.text.length, Math.floor(talk.acc));
    if (n !== talk.shown) {
      if (Math.floor(n / 3) !== Math.floor(talk.shown / 3)) snd.blip(talk.line.who);
      talk.shown = n;
      refs.text.textContent = talk.line.text.slice(0, n);
    }
    if (n >= talk.line.text.length) finishTyping();
  }

  function finishTyping() {
    if (!talk || talk.done) return;
    talk.done = true;
    refs.text.textContent = talk.line.text;
    if (talk.line.choices) {
      talk.line.choices.forEach((c, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'ln-choice';
        b.textContent = `${i + 1}. ${c.label}`;
        b.addEventListener('click', (e) => { e.stopPropagation(); choose(i); });
        refs.choices.appendChild(b);
      });
    } else {
      refs.next.hidden = false;
    }
  }

  function advanceTalk() {
    if (!talk) return;
    if (!talk.done) { finishTyping(); return; }
    if (talk.line.choices) return;
    const { resolve } = talk;
    talk = null;
    resolve(null);
  }

  function choose(i) {
    if (!talk || !talk.done || !talk.line.choices?.[i]) return;
    const { resolve } = talk;
    talk = null;
    snd.ui();
    resolve(i);
  }

  function hideDialog() {
    refs.dialog.hidden = true;
    talk = null;
  }

  async function playScript(lines, token) {
    for (const line of lines) {
      if (!alive(token)) return;
      if (line.when && !line.when(story)) continue;
      if (line.do) { line.do(story); moonTarget = moonFromFlames(); continue; }
      if (line.action === 'ssireum') {
        refs.dialog.hidden = true;
        setState('ssireum');
        const won = await runSsireum();
        if (!alive(token)) return;
        setState('dialog');
        await playScript(won ? line.win : line.lose, token);
        continue;
      }
      const picked = await showLine(line);
      if (!alive(token)) return;
      if (line.choices && picked !== null) {
        const opt = line.choices[picked];
        opt.effect?.(story);
        moonTarget = moonFromFlames();
        if (opt.then) await playScript(opt.then, token);
      }
    }
  }

  /* ── ssireum: press when the marker is inside the grip zone, best of three ── */

  let ss = null;

  function runSsireum() {
    return new Promise((resolve) => {
      ss = { resolve, round: 1, you: 0, them: 0, phase: Math.random() * 6, speed: 2.3, zone: 0.26, center: 0.5, lock: 0, done: false, msg: 'Grip the satba belt and wait for your moment...' };
      refs.ssireum.classList.add('is-open');
      drawSsireum();
    });
  }

  function ssMarker() {
    return 0.5 + 0.5 * Math.sin(ss.phase);
  }

  function ssireumTry() {
    if (!ss || ss.lock > 0 || ss.done) return;
    const hit = Math.abs(ssMarker() - ss.center) <= ss.zone / 2;
    if (hit) {
      ss.you += 1;
      story.ssireumWins += 1;
      ss.msg = 'THROW! Bawi hits the sand with a thump.';
      snd.throwWin();
      shake = 0.3;
    } else {
      ss.them += 1;
      ss.msg = 'Bawi plants his feet and tosses you onto your back.';
      snd.throwLose();
    }
    ss.lock = 1.2;
    if (ss.you >= 2 || ss.them >= 2) ss.done = true;
    drawSsireum();
  }

  function updateSsireum(dt) {
    if (!ss) return;
    if (ss.lock > 0) {
      ss.lock -= dt;
      if (ss.lock <= 0) {
        if (ss.done) {
          const { resolve } = ss;
          const won = ss.you >= 2;
          ss = null;
          refs.ssireum.classList.remove('is-open');
          resolve(won);
          return;
        }
        ss.round += 1;
        ss.speed += 0.75;
        ss.zone *= 0.8;
        ss.center = 0.28 + Math.random() * 0.44;
        ss.msg = 'Again! Bawi shifts his weight...';
      }
    } else {
      ss.phase += dt * ss.speed;
    }
    drawSsireum();
  }

  function drawSsireum() {
    if (!ss) return;
    const N = 31;
    const m = Math.round(ssMarker() * (N - 1));
    let bar = '';
    for (let i = 0; i < N; i++) bar += Math.abs(i / (N - 1) - ss.center) <= ss.zone / 2 ? '#' : '-';
    const marker = `${' '.repeat(m + 1)}^${' '.repeat(N - m)}`;
    const board = `ROUND ${Math.min(ss.round, 3)} OF 3      DAL ${ss.you} : ${ss.them} BAWI\n\n[${bar}]\n${marker}\n\nSPACE or TAP when ^ is under the ###`;
    if (refs.ssBoard.textContent !== board) refs.ssBoard.textContent = board;
    if (refs.ssMsg.textContent !== ss.msg) refs.ssMsg.textContent = ss.msg;
  }

  /* ─────────────────────────── story flow ─────────────────────────── */

  function showCard(ch) {
    refs.cardNum.textContent = ch.numeral.toUpperCase();
    refs.cardTitle.textContent = ch.title.toUpperCase();
    refs.card.classList.add('is-in');
  }

  async function startChapter(index) {
    const token = ++flowToken;
    setState('transition');
    hideDialog();
    closeOverlays();
    await fadeTo(1, 600);
    if (!alive(token)) return;
    story.chapter = index;
    chapterStart = JSON.parse(JSON.stringify(story));
    writeSave(story);
    buildWorld(index);
    const sx = px(4);
    resetPlayer(sx, 4);
    checkpoint = { x: sx, z: 4 };
    oil = MAX_OIL;
    chFlames = 0;
    focus = null;
    moonTarget = moonFromFlames();
    snapCamera();
    updateHud();
    await fadeTo(0, 800);
    if (!alive(token)) return;
    showCard(CHAPTERS[index]);
    await wait(2300);
    refs.card.classList.remove('is-in');
    await wait(600);
    if (!alive(token)) return;
    focus = index === 0 ? npc : null;
    setState('dialog');
    await playScript(CHAPTERS[index].intro, token);
    if (!alive(token)) return;
    hideDialog();
    focus = null;
    setState('play');
    toast(objectiveText(), 3.2);
  }

  async function finishChapter() {
    const token = ++flowToken;
    const index = story.chapter;
    const ch = CHAPTERS[index];
    setState('dialog');
    player.vx = 0;
    player.vz = 0;
    if (ch.npc === 'grandma' && npc) npc.group.position.set(gateX + 1.5, 0, -L + 0.9);
    focus = npc;
    await playScript(ch.outro, token);
    if (!alive(token)) return;
    hideDialog();
    focus = null;
    if (index + 1 < CHAPTERS.length) startChapter(index + 1);
    else finishGame();
  }

  function finishGame() {
    let id = null;
    try {
      id = computeEnding(JSON.parse(JSON.stringify(story)));
    } catch (err) {
      console.warn('Lantern Night: computeEnding failed', err);
    }
    if (!ENDINGS[id]) id = 'lantern-keeper';
    const ending = ENDINGS[id];
    const score = Math.round(
      story.flames * 150 + story.mercy * 250 + story.nuts * 20 + Math.max(0, 400 - story.lost * 100) + ending.bonus,
    );
    moonTarget = id === 'moon-feast' || id === 'lantern-keeper' ? 1 : id === 'goblin-friend' ? 0.55 : 0.15;
    clearSave();
    setState('ending');
    refs.endTitle.textContent = ending.title;
    refs.endText.innerHTML = '';
    ending.text.forEach((para) => {
      const p = document.createElement('p');
      p.textContent = para;
      refs.endText.appendChild(p);
    });
    const mins = Math.floor(story.playTime / 60);
    const secs = Math.floor(story.playTime % 60);
    const rows = [
      ['Moon-flames', `${story.flames} / ${TOTAL_FLAMES}`],
      ['Kindness', `${story.mercy} / ${MAX_MERCY}`],
      ['Lost to the dark', String(story.lost)],
      ['Walnuts cracked', String(story.nutsCracked)],
      ['Time', `${mins}:${String(secs).padStart(2, '0')}`],
      ['Score', score.toLocaleString()],
    ];
    refs.endStats.innerHTML = '';
    rows.forEach(([k, v]) => {
      const row = document.createElement('div');
      const label = document.createElement('span');
      label.textContent = k;
      const value = document.createElement('b');
      value.textContent = v;
      row.append(label, value);
      refs.endStats.appendChild(row);
    });
    refs.ending.classList.add('is-open');
    snd.ending();
    reportRun(root, GAME_ID, {
      score,
      coins: story.flames,
      duration: story.playTime,
      distance: story.distance,
      powerups: story.nutsCracked,
      perfects: story.ssireumWins,
    });
  }

  function showTitle() {
    ++flowToken;
    hideDialog();
    closeOverlays();
    refs.card.classList.remove('is-in');
    refs.fade.classList.remove('is-on');
    story = newStory();
    buildWorld(0);
    resetPlayer(px(4), 4);
    oil = MAX_OIL;
    chFlames = 0;
    focus = null;
    moonTarget = 0.04;
    setState('title');
    const saved = readSave();
    refs.continueBtn.hidden = !saved;
    refs.beginBtn.classList.toggle('is-ghost', Boolean(saved));
    refs.beginBtn.textContent = saved ? '> Begin a new tale' : '> Begin the tale';
    if (saved) refs.continueBtn.textContent = `> Continue: ${CHAPTERS[saved.chapter].numeral}, ${CHAPTERS[saved.chapter].title}`;
    refs.title.classList.add('is-open');
    snapCamera();
  }

  function newGame() {
    unlockAudio();
    snd.ui();
    clearSave();
    story = newStory();
    startChapter(0);
  }

  function continueGame() {
    const saved = readSave();
    if (!saved) { newGame(); return; }
    unlockAudio();
    snd.ui();
    story = saved;
    startChapter(saved.chapter);
  }

  function pause() {
    if (state !== 'play') return;
    const ch = CHAPTERS[story.chapter];
    setState('paused');
    keys.clear();
    endJoystick();
    refs.pauseInfo.textContent = `${ch.numeral}: ${ch.title}. You carry ${story.flames} moon-flame${story.flames === 1 ? '' : 's'}.`;
    refs.pause.classList.add('is-open');
  }

  function resume() {
    if (state !== 'paused') return;
    refs.pause.classList.remove('is-open');
    setState('play');
    last = performance.now();
  }

  function restartChapter() {
    refs.pause.classList.remove('is-open');
    story = JSON.parse(JSON.stringify(chapterStart));
    startChapter(story.chapter);
  }

  /* ─────────────────────────── input ─────────────────────────── */

  function onKeyDown(e) {
    if (destroyed || !root.isConnected) return;
    const tag = e.target?.tagName || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;
    const code = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) e.preventDefault();
    keys.add(code);
    if (e.repeat) return;
    const confirm = code === 'Space' || code === 'Enter' || code === 'NumpadEnter';
    if (state === 'title') {
      if (code === 'Enter' || code === 'Space') {
        e.preventDefault();
        if (readSave()) continueGame(); else newGame();
      }
    } else if (state === 'dialog') {
      if (confirm) { e.preventDefault(); advanceTalk(); } else if (/^(Digit|Numpad)[1-9]$/.test(code)) choose(Number(code.slice(-1)) - 1);
    } else if (state === 'play') {
      if (code === 'Space' || code === 'KeyJ' || code === 'KeyE') crackNut();
      else if (code === 'KeyP' || code === 'Escape') pause();
    } else if (state === 'paused') {
      if (code === 'KeyP' || code === 'Escape') resume();
    } else if (state === 'ssireum') {
      if (confirm) { e.preventDefault(); ssireumTry(); }
    }
  }

  function onKeyUp(e) {
    keys.delete(e.code);
  }

  function onBlur() {
    keys.clear();
    endJoystick();
  }

  function onVisibility() {
    if (document.hidden) pause();
  }

  function onPointerDown(e) {
    unlockAudio();
    if (e.pointerType === 'touch') root.classList.add('is-touch');
    if (state === 'dialog') {
      if (!e.target.closest('.ln-choice')) advanceTalk();
      return;
    }
    if (state === 'ssireum') {
      ssireumTry();
      return;
    }
    if (state === 'play' && e.target === canvas && joy.id === null) {
      const r = root.getBoundingClientRect();
      joy.id = e.pointerId;
      joy.ox = e.clientX - r.left;
      joy.oy = e.clientY - r.top;
      joy.x = 0;
      joy.y = 0;
      refs.joy.style.transform = `translate(${joy.ox}px, ${joy.oy}px)`;
      refs.knob.style.transform = '';
      refs.joy.classList.add('is-on');
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
    }
  }

  function onPointerMove(e) {
    if (e.pointerId !== joy.id) return;
    const r = root.getBoundingClientRect();
    let dx = (e.clientX - r.left - joy.ox) / 45;
    let dy = (e.clientY - r.top - joy.oy) / 45;
    const len = Math.hypot(dx, dy);
    if (len > 1) { dx /= len; dy /= len; }
    joy.x = Math.abs(dx) < 0.12 ? 0 : dx;
    joy.y = Math.abs(dy) < 0.12 ? 0 : dy;
    refs.knob.style.transform = `translate(${dx * 33}px, ${dy * 33}px)`;
  }

  function endJoystick(e) {
    if (e && e.pointerId !== joy.id) return;
    joy.id = null;
    joy.x = 0;
    joy.y = 0;
    refs.joy.classList.remove('is-on');
  }

  function onNutButton(e) {
    e.preventDefault();
    e.stopPropagation();
    unlockAudio();
    crackNut();
  }

  // Hand focus back to the game so Space never re-presses a hidden menu button.
  const stopPress = (fn) => (e) => {
    e.stopPropagation();
    unlockAudio();
    e.currentTarget.blur?.();
    root.focus({ preventScroll: true });
    fn();
  };
  refs.beginBtn.addEventListener('click', stopPress(newGame));
  refs.continueBtn.addEventListener('click', stopPress(continueGame));
  refs.pauseBtn.addEventListener('click', stopPress(pause));
  refs.resumeBtn.addEventListener('click', stopPress(resume));
  refs.restartBtn.addEventListener('click', stopPress(restartChapter));
  refs.titleBtn.addEventListener('click', stopPress(showTitle));
  refs.againBtn.addEventListener('click', stopPress(() => { clearSave(); story = newStory(); startChapter(0); }));
  refs.nutBtn.addEventListener('pointerdown', onNutButton);
  ['title', 'pause', 'ending'].forEach((k) => refs[k].addEventListener('pointerdown', (e) => e.stopPropagation()));
  refs.pauseBtn.addEventListener('pointerdown', (e) => e.stopPropagation());

  root.addEventListener('pointerdown', onPointerDown);
  root.addEventListener('pointermove', onPointerMove);
  root.addEventListener('pointerup', endJoystick);
  root.addEventListener('pointercancel', endJoystick);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  document.addEventListener('visibilitychange', onVisibility);
  const ro = new ResizeObserver(() => resize());
  ro.observe(root);

  /* ─────────────────────────── main loop ─────────────────────────── */

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    if (state !== 'paused') {
      time += dt;
      if (state === 'play') updatePlay(dt);
      else updatePlayer(dt, false);
      if (state !== 'play') updateWisps(dt, false);
      animateWorld(dt);
      if (state === 'dialog') updateTalk(dt);
      if (state === 'ssireum') updateSsireum(dt);
      hurt = Math.max(0, hurt - dt * 2.2);
      shake = Math.max(0, shake - dt * 1.5);
      if (toastT > 0) {
        toastT -= dt;
        if (toastT <= 0) refs.toast.classList.remove('is-in');
      }
    }
    U.uHurt.value = hurt;
    updateLights();
    updateCamera(dt);
    updateHud();
    renderer.setRenderTarget(rt);
    renderer.render(scene, camera);
    // Stars are specks of light, not surfaces; leave them out of the directions pass.
    scene.overrideMaterial = normalMat;
    stars.visible = false;
    renderer.setRenderTarget(rtNormal);
    renderer.render(scene, camera);
    scene.overrideMaterial = null;
    stars.visible = true;
    quad.material = cellMat;
    renderer.setRenderTarget(rtCells);
    renderer.render(quadScene, quadCam);
    quad.material = asciiMat;
    renderer.setRenderTarget(null);
    renderer.render(quadScene, quadCam);
  }

  function destroy() {
    destroyed = true;
    ++flowToken;
    cancelAnimationFrame(raf);
    timers.forEach((id) => clearTimeout(id));
    timers.clear();
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
    document.removeEventListener('visibilitychange', onVisibility);
    ro.disconnect();
    clearWorld();
    Object.values(GEO).forEach((g) => g.dispose());
    mats.forEach((m) => m.dispose());
    moonMat.dispose();
    starGeo.dispose();
    starMat.dispose();
    asciiMat.dispose();
    cellMat.dispose();
    quad.geometry.dispose();
    glyphTex?.dispose();
    rt.depthTexture.dispose();
    rt.dispose();
    rtNormal.dispose();
    normalMat.dispose();
    rtCells.dispose();
    renderer.dispose();
    renderer.forceContextLoss?.();
    root.remove();
  }

  resize();
  showTitle();
  raf = requestAnimationFrame(frame);

  return { destroy };
}
