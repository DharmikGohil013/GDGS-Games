// ─── Wayfarer: Endless ASCII World ───
// An open world with no edge, drawn entirely in text characters. A seed grows
// an endless map of cities, highways, villages, forests, meadows, hills and
// lakes (wayfarer-world.js); this file streams it in around the player in
// 64 x 64 chunks, lights it with a day/night cycle and weather, fills it with
// traffic, people, birds, smoke and fireflies, and turns every frame into ASCII.
//
// The ASCII pass is the same one Lantern Night uses: the 3D scene is drawn into
// a small off-screen target (2x3 light samples per character cell), plus its
// depth and its surface directions. A cell shader then picks one glyph per
// cell: outlines where one thing stands in front of another or two faces meet,
// a density ramp for flat light, and shape-matched glyphs for light with a shape.

import * as THREE from 'three';
import { reportRun } from '../core/runReport.js';
import { tone, noise, unlockAudio } from '../core/audio.js';
import {
  createWorld, CHUNK, HALF_CELL, ROAD_HALF, WATER_Y, BLOCK,
  roadCoord, mulberry32, clamp, lerp, smoothstep,
} from './wayfarer-world.js';

const GAME_ID = 'wayfarer';
const SAVE_KEY = 'playzy:wayfarer:save';
const GLYPHS = ' .\'`,:;-_~=+*^"!|/\\()[]{}<>ox#%@';
const RAMP = ' .,:;"!+*%@#';
const RULE_GLYPHS = { G_VBAR: '|', G_SLASH: '/', G_BSLASH: '\\', G_DASH: '-', G_UNDER: '_', G_STAR: '*', G_PLUS: '+', G_DOT: '.' };
const SUPERSAMPLE = 2;
const CELL_ASPECT = 1.4;

const VIEW_CHUNKS = 4;           // chunks are streamed in this many chunks around the player
const DAY_LENGTH = 720;          // seconds for a full day
const EYE = 1.65;
const PLAYER_R = 0.4;
const WALK = 6.5;
const RUN = 14;
const FLY = 34;
const FLY_FAST = 85;

const ASCII_VERT = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

// Pass 1, one fragment per character cell: pick the cell's glyph and colour.
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
uniform float uEdgeFar;

vec2 sampleUv(vec2 cell, float i, float j) {
  return (cell * vec2(2.0, 3.0) + vec2(i, j) + 0.5) / (uGrid * vec2(2.0, 3.0));
}
vec3 sampleAt(vec2 cell, float i, float j) {
  return max(texture2D(tScene, sampleUv(cell, i, j)).rgb, 0.0);
}
float distAt(vec2 cell, float i, float j) {
  float d = texture2D(tDepth, sampleUv(cell, i, j) + 0.25 / (uGrid * vec2(2.0, 3.0))).r;
  return uClip.x * uClip.y / (uClip.y - d * (uClip.y - uClip.x));
}
vec3 normalAt(vec2 cell, float i, float j) {
  return texture2D(tNormal, sampleUv(cell, i, j)).rgb * 2.0 - 1.0;
}
float luma(vec3 c) {
  return dot(pow(c, vec3(0.4545)), vec3(0.299, 0.587, 0.114));
}
float edgeGlyph(vec3 ml, vec3 mr) {
  float gx = (dot(mr, vec3(1.0)) - dot(ml, vec3(1.0))) / 3.0 / 0.5;
  float gy = ((ml.z + mr.z) - (ml.x + mr.x)) / 4.0 / ROW_STEP;
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
  vec3 sl = vec3(luma(a0), luma(a1), luma(a2));
  vec3 sr = vec3(luma(b0), luma(b1), luma(b2));
  float hi = max(max(max(sl.x, sl.y), sl.z), max(max(sr.x, sr.y), sr.z));
  float lo = min(min(min(sl.x, sl.y), sl.z), min(min(sr.x, sr.y), sr.z));
  float L = (sl.x + sl.y + sl.z + sr.x + sr.y + sr.z) / 6.0;

  vec3 zl = vec3(distAt(cell, 0.0, 0.0), distAt(cell, 0.0, 1.0), distAt(cell, 0.0, 2.0));
  vec3 zr = vec3(distAt(cell, 1.0, 0.0), distAt(cell, 1.0, 1.0), distAt(cell, 1.0, 2.0));
  float zNear = min(min(min(zl.x, zl.y), zl.z), min(min(zr.x, zr.y), zr.z));
  float zFar = max(max(max(zl.x, zl.y), zl.z), max(max(zr.x, zr.y), zr.z));
  bool silhouette = zNear < uEdgeFar && zFar > zNear * (1.08 + zNear * 0.004);

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
  bool crease = zNear < uEdgeFar * 0.6 && worst < 0.55;

  float idx = 0.0;
  if (silhouette) {
    float split = sqrt(zNear * zFar);
    vec3 ml = step(zl, vec3(split));
    vec3 mr = step(zr, vec3(split));
    idx = edgeGlyph(ml, mr);
    vec3 nearLin = (a0 * ml.x + a1 * ml.y + a2 * ml.z + b0 * mr.x + b1 * mr.y + b2 * mr.z) / max(dot(ml + mr, vec3(1.0)), 1.0);
    col = pow(nearLin, vec3(0.4545));
  } else if (crease) {
    vec3 ml = vec3(step(dot(n[0], faceB), dot(n[0], faceA)), step(dot(n[1], faceB), dot(n[1], faceA)), step(dot(n[2], faceB), dot(n[2], faceA)));
    vec3 mr = vec3(step(dot(n[3], faceB), dot(n[3], faceA)), step(dot(n[4], faceB), dot(n[4], faceA)), step(dot(n[5], faceB), dot(n[5], faceA)));
    idx = edgeGlyph(ml, mr);
  } else if (hi > 0.15 && lo < 0.05 && hi - lo > 0.12
      && dot(step(vec3(hi * 0.5), sl), vec3(1.0)) + dot(step(vec3(hi * 0.5), sr), vec3(1.0)) < 1.5) {
    idx = hi > 0.38 ? float(G_STAR) : (hi > 0.24 ? float(G_PLUS) : float(G_DOT));
    col = pow(min((a0 + a1 + a2 + b0 + b1 + b2) * 3.0, vec3(1.0)), vec3(0.4545));
  } else if (hi - lo < 0.08 || hi - lo < hi * 0.4) {
    int r = int(floor(clamp(pow(L, 0.85) * uDensity, 0.0, 0.999) * float(NR)));
    for (int k = 0; k < NR; k++) if (k == r) idx = uRamp[k];
  } else {
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

// Pass 2, per screen pixel: draw each cell's glyph in its colour.
const ASCII_FRAG = /* glsl */`
uniform sampler2D tCells;
uniform sampler2D tGlyphs;
uniform vec2 uCell;
uniform vec2 uGrid;
uniform vec2 uOffset;
uniform float uGlyphCount;
uniform float uFlash;
uniform float uTint;
uniform vec3 uBg;

void main() {
  vec2 p = gl_FragCoord.xy - uOffset;
  vec2 cell = floor(p / uCell);
  if (cell.x < 0.0 || cell.y < 0.0 || cell.x >= uGrid.x || cell.y >= uGrid.y) {
    gl_FragColor = vec4(uBg, 1.0);
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
  vec3 fg = mix(vec3(1.0), hue, 0.8) * (0.42 + 0.85 * sqrt(L));
  fg = mix(fg, vec3(1.0), uFlash * 0.7);
  vec3 back = uBg + col * uTint + uFlash * 0.12;
  gl_FragColor = vec4(back + fg * ink, 1.0);
}`;

// The sky: a gradient dome with a sun and a moon, drawn behind everything.
const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const SKY_FRAG = /* glsl */`
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uSunDir;
uniform vec3 uSunCol;
uniform vec3 uMoonDir;
uniform float uMoon;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float h = max(d.y, 0.0);
  vec3 col = mix(uHorizon, uZenith, pow(h, 0.5));
  if (d.y < 0.0) col = uHorizon;
  float sd = dot(d, uSunDir);
  col += uSunCol * (smoothstep(0.9975, 0.999, sd) * 1.6 + pow(max(sd, 0.0), 18.0) * 0.28);
  float md = dot(d, uMoonDir);
  col += vec3(0.75, 0.8, 0.95) * smoothstep(0.9984, 0.9992, md) * uMoon;
  gl_FragColor = vec4(col, 1.0);
}`;

const CSS = `
.wf-root { position: relative; width: 100%; height: 100%; overflow: hidden; background: #03050a; color: #d9f2e6; font-family: "Courier New", ui-monospace, Menlo, Consolas, monospace; user-select: none; -webkit-user-select: none; touch-action: none; outline: none; }
.wf-root [hidden] { display: none !important; }
.wf-stage, .wf-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.wf-root[data-state="play"] .wf-stage { cursor: crosshair; }
.wf-hud { position: absolute; inset: 0; pointer-events: none; text-shadow: 0 0 6px #000, 0 0 2px #000; font-size: 13px; }
.wf-root:not([data-state="play"]):not([data-state="paused"]) .wf-hud { display: none; }
.wf-tl { position: absolute; left: 14px; top: 12px; max-width: 46%; }
.wf-place { color: #8ef0c8; font-weight: 700; font-size: 17px; letter-spacing: .1em; text-transform: uppercase; }
.wf-kind { color: #a9c7bb; margin-top: 3px; }
.wf-coords { color: #6f8f84; margin-top: 3px; font-size: 11px; }
.wf-compass { position: absolute; left: 50%; top: 10px; transform: translateX(-50%); white-space: pre; color: #9fd8c0; font-weight: 700; letter-spacing: .02em; }
.wf-compass b { color: #ffd27a; }
.wf-tr { position: absolute; right: 12px; top: 10px; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.wf-map { margin: 0; padding: 5px 7px; background: rgba(2, 6, 8, .72); border: 1px solid rgba(142, 240, 200, .3); font-size: 11px; line-height: 1.05; white-space: pre; font-weight: 700; }
.wf-map .rd { color: #c9c3b2; } .wf-map .wa { color: #4aa8ff; } .wf-map .ci { color: #b6c2d6; } .wf-map .vi { color: #ffb86b; }
.wf-map .fo { color: #3fbf5a; } .wf-map .me { color: #b7e05a; } .wf-map .hi { color: #b09a7a; } .wf-map .la { color: #e8d9a0; }
.wf-map .me-p { color: #fff; background: #d23b3b; } .wf-map .lm { color: #ffd27a; }
.wf-clock { color: #ffd27a; font-weight: 700; }
.wf-btns { display: flex; gap: 6px; pointer-events: auto; }
.wf-btn { font: inherit; font-size: 12px; color: #8ef0c8; background: rgba(2, 6, 8, .65); border: 1px solid rgba(142, 240, 200, .4); padding: 3px 8px; cursor: pointer; }
.wf-btn:hover, .wf-btn:focus-visible { background: rgba(142, 240, 200, .16); outline: none; }
.wf-bl { position: absolute; left: 14px; bottom: 12px; color: #a9c7bb; line-height: 1.6; }
.wf-bl b { color: #8ef0c8; }
.wf-hint { position: absolute; left: 50%; bottom: 14px; transform: translateX(-50%); color: #8aa89c; font-size: 12px; white-space: nowrap; transition: opacity .8s; }
.wf-cross { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); color: rgba(220, 255, 240, .55); font-size: 14px; }
.wf-toast { position: absolute; left: 50%; top: 22%; transform: translate(-50%, 6px); max-width: min(640px, calc(100% - 32px)); text-align: center; padding: 7px 14px; background: rgba(2, 6, 8, .8); border: 1px solid rgba(142, 240, 200, .35); color: #e6fff4; font-size: 14px; line-height: 1.5; opacity: 0; transition: opacity .35s, transform .35s; pointer-events: none; white-space: pre-line; }
.wf-toast.is-in { opacity: 1; transform: translate(-50%, 0); }
.wf-card { position: absolute; left: 0; right: 0; top: 30%; display: flex; flex-direction: column; align-items: center; text-align: center; pointer-events: none; opacity: 0; transition: opacity .8s; padding: 0 16px; text-shadow: 0 0 14px #000, 0 0 4px #000; }
.wf-card.is-in { opacity: 1; }
.wf-card small { letter-spacing: .45em; color: #9fd8c0; font-size: 13px; text-transform: uppercase; }
.wf-card h2 { margin: 10px 0 0; font-size: clamp(24px, 5vw, 48px); letter-spacing: .14em; color: #ffd27a; text-transform: uppercase; }
.wf-card h2::before, .wf-card h2::after { content: " ~ "; color: #5f9f88; }
.wf-overlay { position: absolute; inset: 0; display: none; align-items: center; justify-content: center; padding: 16px; background: rgba(1, 4, 6, .55); }
.wf-overlay.is-open { display: flex; }
.wf-panel { width: 100%; max-width: 540px; max-height: 100%; overflow: auto; background: rgba(2, 6, 8, .92); border: 3px double rgba(142, 240, 200, .45); padding: 20px 22px; box-sizing: border-box; }
.wf-title { justify-content: flex-start; background: linear-gradient(90deg, rgba(1, 4, 6, .92), rgba(1, 4, 6, .4) 60%, rgba(1, 4, 6, 0)); }
.wf-title .wf-panel { max-width: 450px; background: transparent; border: 0; padding: 8px 8px 8px clamp(8px, 4vw, 40px); }
.wf-art { margin: 0 0 6px; color: #8ef0c8; font-size: 11px; line-height: 1.05; font-weight: 700; }
.wf-logo { margin: 0; font-size: clamp(34px, 6.6vw, 62px); line-height: .95; letter-spacing: .12em; color: #ffd27a; text-shadow: 0 0 18px rgba(255, 190, 90, .4); }
.wf-sub { margin: 10px 0 14px; color: #a9d6c4; font-size: 14px; line-height: 1.5; }
.wf-seedrow { display: flex; gap: 6px; align-items: stretch; margin-top: 6px; }
.wf-seedrow label { display: block; font-size: 12px; color: #8aa89c; margin-bottom: 4px; letter-spacing: .12em; }
.wf-seed { flex: 1; min-width: 0; font: inherit; font-size: 16px; font-weight: 700; color: #ffd27a; background: rgba(0, 0, 0, .55); border: 1px solid rgba(142, 240, 200, .45); padding: 8px 10px; user-select: text; -webkit-user-select: text; }
.wf-seed:focus { outline: none; border-color: #8ef0c8; }
.wf-menu-btn { display: block; width: 100%; text-align: left; font: inherit; font-size: 15px; font-weight: 700; letter-spacing: .06em; color: #031a10; background: #8ef0c8; border: 1px solid #8ef0c8; padding: 10px 14px; margin-top: 9px; cursor: pointer; text-decoration: none; box-sizing: border-box; }
.wf-menu-btn:hover, .wf-menu-btn:focus-visible { background: #b8ffe0; outline: none; }
.wf-menu-btn.is-ghost { background: transparent; color: #8ef0c8; border-color: rgba(142, 240, 200, .45); }
.wf-menu-btn.is-ghost:hover, .wf-menu-btn.is-ghost:focus-visible { background: rgba(142, 240, 200, .14); }
.wf-dice { width: auto; margin: 0; padding: 0 12px; text-align: center; }
.wf-keys { margin-top: 16px; font-size: 12px; color: #9ab3a8; line-height: 1.8; }
.wf-keys kbd { font-family: inherit; color: #e6fff4; border: 1px solid rgba(255, 255, 255, .25); padding: 0 5px; }
.wf-h { margin: 0 0 10px; color: #ffd27a; letter-spacing: .14em; font-size: 16px; text-align: center; }
.wf-info { margin: 0 0 8px; text-align: center; color: #b9d2c8; font-size: 13px; line-height: 1.6; }
.wf-list { margin: 8px 0 0; padding: 0; list-style: none; font-size: 13px; }
.wf-list li { display: flex; justify-content: space-between; gap: 10px; padding: 4px 0; border-bottom: 1px dashed rgba(142, 240, 200, .18); color: #d9f2e6; }
.wf-list li span:last-child { color: #8aa89c; white-space: nowrap; }
.wf-list .t-city { color: #b6c2d6; } .wf-list .t-village { color: #ffb86b; } .wf-list .t-forest { color: #5fd27a; }
.wf-list .t-meadow { color: #c7e86a; } .wf-list .t-hills { color: #d0b48a; } .wf-list .t-lake { color: #6ab8ff; } .wf-list .t-landmark { color: #ffd27a; }
.wf-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 14px; margin: 10px 0; padding: 10px 0; border-top: 1px dashed rgba(142, 240, 200, .3); border-bottom: 1px dashed rgba(142, 240, 200, .3); font-size: 13px; }
.wf-stats div { display: flex; justify-content: space-between; gap: 8px; color: #9ab3a8; }
.wf-stats b { color: #8ef0c8; }
.wf-loading { position: absolute; left: 50%; bottom: 24%; transform: translateX(-50%); color: #8ef0c8; font-weight: 700; letter-spacing: .2em; display: none; }
.wf-loading.is-on { display: block; }
.wf-joy { position: absolute; left: 0; top: 0; width: 110px; height: 110px; margin: -55px 0 0 -55px; border: 2px dashed rgba(142, 240, 200, .45); border-radius: 50%; pointer-events: none; display: none; }
.wf-joy.is-on { display: block; }
.wf-joy i { position: absolute; left: 50%; top: 50%; width: 44px; height: 44px; margin: -22px 0 0 -22px; border-radius: 50%; background: rgba(142, 240, 200, .35); }
.wf-touch { position: absolute; right: 14px; bottom: 18px; display: none; flex-direction: column; gap: 10px; pointer-events: auto; }
.wf-root.is-touch[data-state="play"] .wf-touch { display: flex; }
.wf-tbtn { width: 70px; height: 52px; border-radius: 12px; border: 2px solid rgba(142, 240, 200, .6); background: rgba(2, 8, 6, .6); color: #8ef0c8; font: inherit; font-weight: 700; font-size: 12px; touch-action: none; }
.wf-tbtn.is-on { background: rgba(142, 240, 200, .3); color: #fff; }
.wf-touch-only { display: none; }
.wf-root.is-touch .wf-touch-only { display: block; }
.wf-root.is-touch .wf-desk-only { display: none; }
@media (max-width: 640px) {
  .wf-hud { font-size: 11px; }
  .wf-place { font-size: 14px; }
  .wf-map { font-size: 8px; }
  .wf-compass { top: auto; bottom: 70px; font-size: 11px; }
  .wf-art, .wf-hint { display: none; }
}
`;

const MARKUP = `
<div class="wf-stage" data-ref="stage"></div>
<div class="wf-hud">
  <div class="wf-tl">
    <div class="wf-place" data-ref="place"></div>
    <div class="wf-kind" data-ref="kind"></div>
    <div class="wf-coords" data-ref="coords"></div>
  </div>
  <div class="wf-compass" data-ref="compass"></div>
  <div class="wf-tr">
    <pre class="wf-map" data-ref="map" aria-label="Map of the area around you"></pre>
    <div class="wf-clock" data-ref="clock"></div>
    <div class="wf-btns">
      <button class="wf-btn" type="button" data-ref="journalBtn">[J] Journal</button>
      <button class="wf-btn" type="button" data-ref="pauseBtn" aria-label="Pause">[ II ]</button>
    </div>
  </div>
  <div class="wf-bl" data-ref="stats"></div>
  <div class="wf-hint" data-ref="hint"></div>
  <div class="wf-cross" aria-hidden="true">+</div>
</div>
<div class="wf-toast" data-ref="toast" aria-live="polite"></div>
<div class="wf-card" data-ref="card"><small data-ref="cardKind"></small><h2 data-ref="cardTitle"></h2></div>
<div class="wf-loading" data-ref="loading">GROWING THE WORLD ...</div>
<div class="wf-joy" data-ref="joy"><i data-ref="knob"></i></div>
<div class="wf-touch">
  <button class="wf-tbtn" type="button" data-ref="tJump">JUMP<br>/ UP</button>
  <button class="wf-tbtn" type="button" data-ref="tRun">RUN</button>
  <button class="wf-tbtn" type="button" data-ref="tFly">FLY</button>
</div>
<div class="wf-overlay wf-title is-open" data-ref="title">
  <div class="wf-panel">
<pre class="wf-art" aria-hidden="true">   _/\\_      |#|  |##|      ^  ^^
  /____\\  _  |#|__|##|_    /^\\/^^\\
  |_[]_| |=| |##||##||#|  /^^^\\^^^\\
==================================</pre>
    <h2 class="wf-logo">WAYFARER</h2>
    <p class="wf-sub">An endless open world drawn in text. Cities, highways, villages, forests, hills and lakes, grown from a seed, with no edge to reach.</p>
    <div>
      <label for="wf-seed-input" class="wf-seedrow-label" style="display:block;font-size:12px;color:#8aa89c;letter-spacing:.12em;">WORLD SEED</label>
      <div class="wf-seedrow">
        <input id="wf-seed-input" class="wf-seed" data-ref="seed" type="text" maxlength="24" spellcheck="false" autocomplete="off">
        <button class="wf-menu-btn is-ghost wf-dice" type="button" data-ref="diceBtn" aria-label="Random seed">[ ? ]</button>
      </div>
    </div>
    <button class="wf-menu-btn" type="button" data-ref="continueBtn" hidden></button>
    <button class="wf-menu-btn" type="button" data-ref="beginBtn">&gt; Begin a new journey</button>
    <div class="wf-keys">
      <div class="wf-desk-only"><kbd>Click</kbd> look around &middot; <kbd>WASD</kbd> walk &middot; <kbd>Shift</kbd> run</div>
      <div class="wf-desk-only"><kbd>F</kbd> fly &middot; <kbd>Space</kbd> jump / rise &middot; <kbd>C</kbd> sink &middot; <kbd>R</kbd> auto-walk</div>
      <div class="wf-desk-only"><kbd>T</kbd> hold to speed up time &middot; <kbd>J</kbd> journal &middot; <kbd>P</kbd> pause</div>
      <div class="wf-touch-only">Touch: left thumb walks, right thumb looks. Buttons for jump, run and fly.</div>
    </div>
  </div>
</div>
<div class="wf-overlay" data-ref="pause">
  <div class="wf-panel">
    <h3 class="wf-h">- RESTING -</h3>
    <p class="wf-info" data-ref="pauseInfo"></p>
    <div class="wf-stats" data-ref="pauseStats"></div>
    <button class="wf-menu-btn" type="button" data-ref="resumeBtn">&gt; Keep exploring</button>
    <button class="wf-menu-btn is-ghost" type="button" data-ref="bankBtn">Make camp: bank coins &amp; XP</button>
    <button class="wf-menu-btn is-ghost" type="button" data-ref="journal2Btn">Open the journal</button>
    <button class="wf-menu-btn is-ghost" type="button" data-ref="titleBtn">Back to the title (progress is saved)</button>
  </div>
</div>
<div class="wf-overlay" data-ref="journal">
  <div class="wf-panel">
    <h3 class="wf-h">- TRAVEL JOURNAL -</h3>
    <p class="wf-info" data-ref="journalInfo"></p>
    <ul class="wf-list" data-ref="journalList"></ul>
    <button class="wf-menu-btn" type="button" data-ref="journalClose">&gt; Close the journal</button>
  </div>
</div>
`;

/* ─────────────────────────── helpers ─────────────────────────── */

const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
const TYPE_LABEL = { city: 'City', village: 'Village', forest: 'Forest', meadow: 'Meadows', hills: 'Hills', lake: 'Lake' };
const NEW_LABEL = { city: 'New city discovered', village: 'New village discovered', forest: 'New forest discovered', meadow: 'New meadows discovered', hills: 'New highlands discovered', lake: 'New lake discovered' };

function randomSeed() {
  return String(100000 + Math.floor(Math.random() * 900000));
}

function readSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || typeof s.seed !== 'string' || !Number.isFinite(s.x) || !Number.isFinite(s.z)) return null;
    return s;
  } catch (e) {
    return null;
  }
}

function writeSave(data) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { /* private mode */ }
}

function fmtDist(m) {
  return m >= 1000 ? `${(m / 1000).toFixed(m >= 10000 ? 0 : 1)} km` : `${Math.round(m)} m`;
}

/* ─────────────────────────── glyphs ─────────────────────────── */

const GLYPH_FONT = '"Courier New", Courier, monospace';

function drawGlyphStrip(cw, ch) {
  const c = document.createElement('canvas');
  c.width = cw * GLYPHS.length;
  c.height = ch;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#000';
  g.fillRect(0, 0, c.width, c.height);
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
    g.save();
    g.beginPath();
    g.rect(cw * i, 0, cw, ch);
    g.clip();
    g.fillText(GLYPHS[i], cw * i + cw / 2, baseline);
    g.restore();
  }
  return c;
}

function cellWidth(cssWidth, dpr) {
  const cssCell = clamp(cssWidth / 270, 4, 7);
  return Math.max(5, Math.round(cssCell * dpr));
}

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

/* ─────────────────────────── mesh building ─────────────────────────── */

// Unit-sized shapes, flattened to plain triangle lists once. Chunks copy them
// into one big vertex-coloured mesh each, so a whole chunk is one draw call.
let PROTOS = null;
function protos() {
  if (PROTOS) return PROTOS;
  const flat = (geo) => {
    const g = geo.index ? geo.toNonIndexed() : geo;
    const arr = Float32Array.from(g.attributes.position.array);
    if (g !== geo) g.dispose();
    geo.dispose();
    return arr;
  };
  const prism = new THREE.BufferGeometry();
  const P = [
    -0.5, 0, 0.5, 0.5, 0, 0.5, 0, 1, 0.5,
    0.5, 0, -0.5, -0.5, 0, -0.5, 0, 1, -0.5,
    -0.5, 0, -0.5, -0.5, 0, 0.5, 0, 1, 0.5, -0.5, 0, -0.5, 0, 1, 0.5, 0, 1, -0.5,
    0.5, 0, 0.5, 0.5, 0, -0.5, 0, 1, -0.5, 0.5, 0, 0.5, 0, 1, -0.5, 0, 1, 0.5,
  ];
  prism.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  PROTOS = {
    box: flat(new THREE.BoxGeometry(1, 1, 1)),
    quad: flat(new THREE.PlaneGeometry(1, 1)),
    cyl: flat(new THREE.CylinderGeometry(0.5, 0.5, 1, 8)),
    cyl5: flat(new THREE.CylinderGeometry(0.5, 0.5, 1, 5)),
    taper: flat(new THREE.CylinderGeometry(0.33, 0.5, 1, 10)),
    cone: flat(new THREE.ConeGeometry(0.5, 1, 7)),
    cone4: flat(new THREE.ConeGeometry(0.71, 1, 4).rotateY(Math.PI / 4)),
    ico: flat(new THREE.IcosahedronGeometry(0.5, 0)),
    sphere: flat(new THREE.SphereGeometry(0.5, 7, 5)),
    prism: flat(prism),
  };
  return PROTOS;
}

const colorCache = new Map();
const tmpColor = new THREE.Color();
function linearHex(hex) {
  let c = colorCache.get(hex);
  if (!c) {
    tmpColor.setHex(hex);
    c = [tmpColor.r, tmpColor.g, tmpColor.b];
    colorCache.set(hex, c);
  }
  return c;
}

class MeshBuilder {
  constructor() {
    this.pos = new Float32Array(1 << 16);
    this.col = new Float32Array(1 << 16);
    this.n = 0;
  }

  reserve(k) {
    if (this.n + k <= this.pos.length) return;
    let size = this.pos.length * 2;
    while (size < this.n + k) size *= 2;
    const p = new Float32Array(size);
    p.set(this.pos.subarray(0, this.n));
    this.pos = p;
    const c = new Float32Array(size);
    c.set(this.col.subarray(0, this.n));
    this.col = c;
  }

  add(src, r, g, b, x, y, z, sx, sy, sz, ry, rz) {
    const n = src.length;
    this.reserve(n);
    const cy = Math.cos(ry);
    const sny = Math.sin(ry);
    const cz = Math.cos(rz);
    const snz = Math.sin(rz);
    const P = this.pos;
    const C = this.col;
    let o = this.n;
    for (let i = 0; i < n; i += 3) {
      let px = src[i] * sx;
      let py = src[i + 1] * sy;
      const pz = src[i + 2] * sz;
      if (rz) {
        const t = px * cz - py * snz;
        py = px * snz + py * cz;
        px = t;
      }
      P[o] = px * cy + pz * sny + x;
      P[o + 1] = py + y;
      P[o + 2] = -px * sny + pz * cy + z;
      C[o] = r;
      C[o + 1] = g;
      C[o + 2] = b;
      o += 3;
    }
    this.n = o;
  }

  vert(x, y, z, c) {
    this.reserve(3);
    const o = this.n;
    this.pos[o] = x; this.pos[o + 1] = y; this.pos[o + 2] = z;
    this.col[o] = c[0]; this.col[o + 1] = c[1]; this.col[o + 2] = c[2];
    this.n = o + 3;
  }

  build() {
    if (!this.n) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos.slice(0, this.n), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col.slice(0, this.n), 3));
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    this.n = 0;
    return geo;
  }
}

/* ─────────────────────────── module API ─────────────────────────── */

let instance = null;

export function initGame(container) {
  destroyGame();
  instance = createWayfarer(container);
}

export function destroyGame() {
  if (!instance) return;
  const running = instance;
  instance = null;
  running.destroy();
}

export function setSoundEnabled() {}

/* ─────────────────────────── the game ─────────────────────────── */

function createWayfarer(container) {
  container.innerHTML = '';
  const root = document.createElement('div');
  root.className = 'wf-root';
  root.dataset.state = 'title';
  root.tabIndex = 0;
  root.innerHTML = MARKUP;
  const style = document.createElement('style');
  style.textContent = CSS;
  root.prepend(style);
  container.appendChild(root);
  const refs = {};
  root.querySelectorAll('[data-ref]').forEach((el) => { refs[el.dataset.ref] = el; });
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) root.classList.add('is-touch');

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  } catch (err) {
    refs.title.querySelector('.wf-panel').innerHTML = '<h2 class="wf-logo">WAYFARER</h2><p class="wf-sub">This game needs WebGL, which this browser has turned off or does not support.</p>';
    return { destroy() { root.remove(); } };
  }
  renderer.setClearColor(0x000000, 1);
  const canvas = renderer.domElement;
  canvas.className = 'wf-canvas';
  refs.stage.appendChild(canvas);
  const bufSize = new THREE.Vector2();

  /* ── scene and the ASCII passes ── */
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x9cc4e4, 40, 250);
  const camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.1, 700);
  camera.rotation.order = 'YXZ';

  const rt = new THREE.WebGLRenderTarget(4, 4, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthTexture: new THREE.DepthTexture(4, 4) });
  const rtNormal = new THREE.WebGLRenderTarget(4, 4, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  const normalMat = new THREE.MeshNormalMaterial({ flatShading: true });
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
      uDensity: { value: 1.05 },
      uSharp: { value: 2.2 },
      uEdgeFar: { value: 110 },
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
    uFlash: { value: 0 },
    uTint: { value: 0.22 },
    uBg: { value: new THREE.Color(0.01, 0.013, 0.026) },
  };
  const asciiMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: ASCII_VERT, fragmentShader: ASCII_FRAG, depthTest: false, depthWrite: false });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), asciiMat);
  quad.frustumCulled = false;
  const quadScene = new THREE.Scene();
  quadScene.add(quad);
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  /* ── lights ── */
  const hemi = new THREE.HemisphereLight(0xbfd8ff, 0x4a5a3a, 1.2);
  const sun = new THREE.DirectionalLight(0xfff1d6, 2);
  const torch = new THREE.PointLight(0xffd9a0, 0, 30, 1.2);
  scene.add(hemi, sun, sun.target, torch);

  /* ── materials ── */
  const solidMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  // Windows, lamps and glowing mushrooms: lit like everything else by day, and
  // shining in their own colour by night (emissive = vertex colour x glow level).
  const glowMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, emissive: 0xffffff, emissiveIntensity: 0.2 });
  glowMat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace('vec3 totalEmissiveRadiance = emissive;', 'vec3 totalEmissiveRadiance = emissive * vColor;');
  };
  const bladeMat = new THREE.MeshLambertMaterial({ color: 0xe8e2d0, flatShading: true });
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0.5, depthWrite: false });
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff3020 });
  const waterMat = new THREE.MeshPhongMaterial({ color: 0x2a6f9a, emissive: 0x06192a, shininess: 70, specular: 0x88aacc, flatShading: true });
  const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x2a2f38, flatShading: true, fog: false });
  const smokeMat = new THREE.MeshLambertMaterial({ color: 0xb8b8b8, flatShading: true });
  const personMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const carMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const birdMat = new THREE.MeshBasicMaterial({ color: 0x1a1a22 });
  const shared = { geos: [], mats: [solidMat, glowMat, bladeMat, beamMat, beaconMat, waterMat, cloudMat, smokeMat, personMat, carMat, birdMat, normalMat] };

  const BLADE_GEO = (() => {
    const b = new MeshBuilder();
    const P = protos();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      // Each blade: a spar and a sail, radiating in the XY plane.
      const c = Math.cos(a);
      const s = Math.sin(a);
      b.add(P.box, 1, 1, 1, c * 4.5, s * 4.5, 0, 9, 0.35, 0.25, 0, a);
      b.add(P.box, 0.85, 0.82, 0.75, c * 5 - s * 0.9, s * 5 + c * 0.9, 0, 7, 1.6, 0.08, 0, a);
    }
    b.add(P.box, 0.3, 0.25, 0.2, 0, 0, -0.2, 1.2, 1.2, 1, 0, 0);
    const g = b.build();
    shared.geos.push(g);
    return g;
  })();
  const BEAM_GEO = new THREE.BoxGeometry(1.4, 1.4, 70).translate(0, 0, 36);
  const BEACON_GEO = new THREE.SphereGeometry(0.6, 6, 4);
  shared.geos.push(BEAM_GEO, BEACON_GEO);

  /* ── sky, stars, clouds, water ── */
  const skyU = {
    uZenith: { value: new THREE.Color() },
    uHorizon: { value: new THREE.Color() },
    uSunDir: { value: new THREE.Vector3(0, 1, 0) },
    uSunCol: { value: new THREE.Color(1, 0.9, 0.7) },
    uMoonDir: { value: new THREE.Vector3(0, -1, 0) },
    uMoon: { value: 0 },
  };
  const skyMat = new THREE.ShaderMaterial({ uniforms: skyU, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), skyMat);
  sky.renderOrder = -10;
  sky.frustumCulled = false;
  scene.add(sky);
  shared.geos.push(sky.geometry);
  shared.mats.push(skyMat);

  const starGeo = new THREE.BufferGeometry();
  {
    const r = mulberry32(42);
    const pts = [];
    for (let i = 0; i < 900; i++) {
      const u = r() * 2 - 1;
      const t = r() * Math.PI * 2;
      const y = Math.abs(u) * 0.95 + 0.05;
      const k = Math.sqrt(1 - y * y);
      pts.push(Math.cos(t) * k * 460, y * 460, Math.sin(t) * k * 460);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  }
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1, sizeAttenuation: false, fog: false, transparent: true, depthWrite: false });
  const stars = new THREE.Points(starGeo, starMat);
  stars.frustumCulled = false;
  stars.renderOrder = -9;
  scene.add(stars);
  shared.geos.push(starGeo);
  shared.mats.push(starMat);

  const clouds = [];
  {
    const r = mulberry32(7);
    const P = protos();
    for (let i = 0; i < 16; i++) {
      const b = new MeshBuilder();
      const n = 3 + Math.floor(r() * 4);
      for (let k = 0; k < n; k++) {
        const s = 14 + r() * 16;
        b.add(P.ico, 1, 1, 1, (k - n / 2) * 11 + r() * 6, r() * 5, r() * 12 - 6, s * 1.4, s * 0.55, s, r() * 6, 0);
      }
      const geo = b.build();
      shared.geos.push(geo);
      const mesh = new THREE.Mesh(geo, cloudMat);
      mesh.userData = { ox: (r() - 0.5) * 900, oz: (r() - 0.5) * 900, y: 95 + r() * 40, rank: r() };
      scene.add(mesh);
      clouds.push(mesh);
    }
  }

  const WATER_SIZE = 600;
  const WATER_SEG = 60;
  const waterGeo = new THREE.PlaneGeometry(WATER_SIZE, WATER_SIZE, WATER_SEG, WATER_SEG).rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.frustumCulled = false;
  scene.add(water);
  shared.geos.push(waterGeo);
  const waterBase = Float32Array.from(waterGeo.attributes.position.array);

  /* ── rain ── */
  const RAIN_N = 1400;
  const rainGeo = new THREE.BufferGeometry();
  const rainPos = new Float32Array(RAIN_N * 6);
  const rainSeed = new Float32Array(RAIN_N * 3);
  for (let i = 0; i < RAIN_N; i++) {
    rainSeed[i * 3] = Math.random() * 80 - 40;
    rainSeed[i * 3 + 1] = Math.random() * 50;
    rainSeed[i * 3 + 2] = Math.random() * 80 - 40;
  }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rainMat = new THREE.LineBasicMaterial({ color: 0xaac4e0, transparent: true, opacity: 0, depthWrite: false });
  const rain = new THREE.LineSegments(rainGeo, rainMat);
  rain.frustumCulled = false;
  scene.add(rain);
  shared.geos.push(rainGeo);
  shared.mats.push(rainMat);

  /* ── fireflies ── */
  const FLY_N = 320;
  const ffGeo = new THREE.BufferGeometry();
  const ffPos = new Float32Array(FLY_N * 3);
  ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
  const ffMat = new THREE.PointsMaterial({ color: 0xd8ff6a, size: 2, sizeAttenuation: false, transparent: true, depthWrite: false });
  const fireflies = new THREE.Points(ffGeo, ffMat);
  fireflies.frustumCulled = false;
  scene.add(fireflies);
  shared.geos.push(ffGeo);
  shared.mats.push(ffMat);
  const ffAnchor = new Float32Array(FLY_N * 4);   // x, y, z, phase
  let ffCount = 0;

  /* ── smoke puffs ── */
  const SMOKE_N = 180;
  const smokeGeo = new THREE.IcosahedronGeometry(0.5, 0);
  const smoke = new THREE.InstancedMesh(smokeGeo, smokeMat, SMOKE_N);
  smoke.frustumCulled = false;
  smoke.count = 0;
  scene.add(smoke);
  shared.geos.push(smokeGeo);
  const puffs = [];

  /* ── cars ── */
  const CAR_N = 34;
  const carGeo = (() => {
    const b = new MeshBuilder();
    const P = protos();
    b.add(P.box, 1, 1, 1, 0, 0.62, 0, 2, 0.8, 4.4, 0, 0);
    b.add(P.box, 1, 1, 1, 0, 1.25, -0.25, 1.75, 0.55, 2.3, 0, 0);
    b.add(P.box, 0.12, 0.15, 0.2, 0, 1.25, -0.25, 1.8, 0.4, 2.1, 0, 0);
    for (const [wx, wz] of [[-0.95, 1.3], [0.95, 1.3], [-0.95, -1.3], [0.95, -1.3]]) b.add(P.cyl, 0.08, 0.08, 0.08, wx, 0.38, wz, 0.75, 0.3, 0.75, 0, Math.PI / 2);
    const g = b.build();
    shared.geos.push(g);
    return g;
  })();
  const carLightGeo = (() => {
    const b = new MeshBuilder();
    const P = protos();
    for (const s of [-0.65, 0.65]) {
      b.add(P.box, 1, 0.95, 0.75, s, 0.7, 2.22, 0.45, 0.22, 0.08, 0, 0);
      b.add(P.box, 1, 0.08, 0.05, s, 0.7, -2.22, 0.45, 0.2, 0.08, 0, 0);
    }
    const g = b.build();
    shared.geos.push(g);
    return g;
  })();
  const carMesh = new THREE.InstancedMesh(carGeo, carMat, CAR_N);
  const carLights = new THREE.InstancedMesh(carLightGeo, glowMat, CAR_N);
  carMesh.frustumCulled = false;
  carLights.frustumCulled = false;
  scene.add(carMesh, carLights);
  const cars = Array.from({ length: CAR_N }, () => ({ live: false }));
  const CAR_COLORS = [0xd23b3b, 0x2d6cdf, 0xe8e8e8, 0x3a3a3a, 0xf2c230, 0x2fa36b, 0x8a8f99, 0xe07a2e, 0x7a3fb0];

  /* ── people ── */
  const PEOPLE_N = 46;
  // Two meshes per crowd: shirts take each person's colour, heads and legs keep theirs.
  const shirtGeo = (() => {
    const b = new MeshBuilder();
    b.add(protos().box, 1, 1, 1, 0, 1.15, 0, 0.56, 0.7, 0.32, 0, 0);
    const g = b.build();
    shared.geos.push(g);
    return g;
  })();
  const bodyGeo = (() => {
    const b = new MeshBuilder();
    const P = protos();
    b.add(P.box, 0.2, 0.2, 0.26, -0.14, 0.42, 0, 0.22, 0.84, 0.26, 0, 0);
    b.add(P.box, 0.2, 0.2, 0.26, 0.14, 0.42, 0, 0.22, 0.84, 0.26, 0, 0);
    b.add(P.sphere, 0.93, 0.74, 0.6, 0, 1.68, 0, 0.36, 0.38, 0.36, 0, 0);
    const g = b.build();
    shared.geos.push(g);
    return g;
  })();
  const peopleMesh = new THREE.InstancedMesh(shirtGeo, personMat, PEOPLE_N);
  const peopleBody = new THREE.InstancedMesh(bodyGeo, personMat, PEOPLE_N);
  peopleMesh.frustumCulled = false;
  peopleBody.frustumCulled = false;
  peopleMesh.count = 0;
  peopleBody.count = 0;
  scene.add(peopleMesh, peopleBody);
  const people = Array.from({ length: PEOPLE_N }, () => ({ live: false }));
  const SHIRTS = [0xd94a3a, 0x3a7ad9, 0xe8c23a, 0x3ab27a, 0xe8e8e8, 0x8a4ad9, 0xe0873a, 0x2a2a2a];

  /* ── birds ── */
  const BIRD_N = 11;
  const birdGeo = (() => {
    const b = new MeshBuilder();
    const P = protos();
    b.add(P.box, 1, 1, 1, -0.6, 0.18, 0, 1.3, 0.12, 0.4, 0, -0.45);
    b.add(P.box, 1, 1, 1, 0.6, 0.18, 0, 1.3, 0.12, 0.4, 0, 0.45);
    const g = b.build();
    shared.geos.push(g);
    return g;
  })();
  const birds = new THREE.InstancedMesh(birdGeo, birdMat, BIRD_N);
  birds.frustumCulled = false;
  scene.add(birds);
  const flock = { x: 0, z: 0, a: 0 };

  const dummy = new THREE.Object3D();
  const tmpC = new THREE.Color();

  /* ─────────────────────────── state ─────────────────────────── */

  let world = null;
  const chunks = new Map();
  const solidB = new MeshBuilder();
  const glowB = new MeshBuilder();
  let state = 'title';
  let raf = 0;
  let last = performance.now();
  let time = 0;
  let destroyed = false;
  let glyphTex = null;
  const timers = new Set();

  const player = { x: 0, z: 0, y: 0, vx: 0, vz: 0, vy: 0, yaw: 0, pitch: 0, fly: false, ground: true, swim: false, bob: 0, stepT: 0 };
  let dayT = 0.3;
  let timeWarp = 1;
  let autoWalk = false;
  let runToggle = false;
  let journey = null;            // what gets saved
  let regionKey = '';
  let regionShown = '';
  let lastCross = '';
  let toastT = 0;
  let cardT = 0;
  let mapT = 0;
  let hudT = 0;
  let saveT = 0;
  let ambT = 2;
  let rainSoundT = 0;
  let flash = 0;
  let lightningT = 12;
  let pointerLocked = false;
  const keys = new Set();
  const weather = { kind: 'clear', t: 120, cloud: 0.25, rain: 0, fog: 1, cloudT: 0.25, rainT: 0, fogT: 1 };
  const landmarksNear = [];

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
    starMat.size = 1 / dpr;
    ffMat.size = 1.6 / dpr;
    glyphTex?.dispose();
    glyphTex = makeGlyphAtlas(cw, ch);
    U.tGlyphs.value = glyphTex;
  }

  /* ─────────────────────────── chunks ─────────────────────────── */

  function buildChunk(cx, cz) {
    const P = protos();
    const chunk = { key: `${cx},${cz}`, cx, cz, group: new THREE.Group(), geos: [], circles: [], boxes: [], smoke: [], flies: [], landmarks: [], blades: [], beams: [] };
    const x0 = cx * CHUNK;
    const z0 = cz * CHUNK;

    // Ground: a 16 x 16 grid of heights and colours.
    const G = 16;
    const S = CHUNK / G;
    const hs = new Float32Array((G + 1) * (G + 1));
    const cs = new Array((G + 1) * (G + 1));
    for (let j = 0; j <= G; j++) {
      for (let i = 0; i <= G; i++) {
        const x = x0 + i * S;
        const z = z0 + j * S;
        const r = world.regionAt(x, z);
        const h = world.heightAt(x, z, r);
        const c = world.groundColor(x, z, h, r);
        tmpC.setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace);
        hs[j * (G + 1) + i] = h;
        cs[j * (G + 1) + i] = [tmpC.r, tmpC.g, tmpC.b];
      }
    }
    for (let j = 0; j < G; j++) {
      for (let i = 0; i < G; i++) {
        const a = j * (G + 1) + i;
        const b = a + 1;
        const c = a + G + 1;
        const d = c + 1;
        const ax = x0 + i * S;
        const az = z0 + j * S;
        const V = (k, ox, oz) => solidB.vert(ax + ox, hs[k], az + oz, cs[k]);
        if ((i + j) % 2 === 0) {
          V(a, 0, 0); V(c, 0, S); V(b, S, 0);
          V(b, S, 0); V(c, 0, S); V(d, S, S);
        } else {
          V(a, 0, 0); V(c, 0, S); V(d, S, S);
          V(a, 0, 0); V(d, S, S); V(b, S, 0);
        }
      }
    }

    const put = (B) => (proto, hex, x, y, z, sx, sy, sz, ry = 0, rz = 0) => {
      const c = linearHex(hex);
      // A little brightness jitter per piece, so repeated parts don't look stamped.
      const f = (Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;
      const j = 0.9 + (f < 0 ? f + 1 : f) * 0.2;
      B.add(P[proto], c[0] * j, c[1] * j, c[2] * j, x, y, z, sx, sy, sz, ry, rz);
    };
    const out = {
      solid: put(solidB),
      glow: put(glowB),
      circle: (x, z, r) => chunk.circles.push({ x, z, r }),
      box: (ax, az, bx, bz, top) => chunk.boxes.push({ x0: ax, z0: az, x1: bx, z1: bz, top }),
      landmark: (l) => chunk.landmarks.push(l),
      special: (kind, d) => {
        if (kind === 'smoke' || kind === 'fire') chunk.smoke.push({ ...d, t: Math.random() * 2, fire: kind === 'fire' });
        else if (kind === 'firefly') chunk.flies.push(d);
        else if (kind === 'blades') {
          const m = new THREE.Mesh(BLADE_GEO, bladeMat);
          m.position.set(d.x, d.y, d.z);
          chunk.group.add(m);
          chunk.blades.push(m);
        } else if (kind === 'beam') {
          const g = new THREE.Group();
          g.position.set(d.x, d.y, d.z);
          const a = new THREE.Mesh(BEAM_GEO, beamMat);
          const b = new THREE.Mesh(BEAM_GEO, beamMat);
          b.rotation.y = Math.PI;
          g.add(a, b);
          chunk.group.add(g);
          chunk.beams.push(g);
        } else if (kind === 'beacon') {
          const m = new THREE.Mesh(BEACON_GEO, beaconMat);
          m.position.set(d.x, d.y, d.z);
          if (d.big) m.scale.setScalar(2.2);
          chunk.group.add(m);
        }
      },
    };
    world.generateChunk(cx, cz, out);
    const sg = solidB.build();
    if (sg) {
      chunk.geos.push(sg);
      chunk.group.add(new THREE.Mesh(sg, solidMat));
    }
    const gg = glowB.build();
    if (gg) {
      chunk.geos.push(gg);
      chunk.group.add(new THREE.Mesh(gg, glowMat));
    }
    scene.add(chunk.group);
    chunks.set(chunk.key, chunk);
    return chunk;
  }

  function dropChunk(chunk) {
    scene.remove(chunk.group);
    chunk.geos.forEach((g) => g.dispose());
    chunks.delete(chunk.key);
  }

  function clearChunks() {
    [...chunks.values()].forEach(dropChunk);
    landmarksNear.length = 0;
  }

  function streamChunks(cx, cz, budgetMs) {
    const want = [];
    const R = VIEW_CHUNKS;
    for (let i = -R; i <= R; i++) {
      for (let j = -R; j <= R; j++) {
        if (i * i + j * j > (R + 0.5) * (R + 0.5)) continue;
        if (!chunks.has(`${cx + i},${cz + j}`)) want.push([cx + i, cz + j, i * i + j * j]);
      }
    }
    want.sort((a, b) => a[2] - b[2]);
    const t0 = performance.now();
    let built = 0;
    let dropped = 0;
    for (const [i, j] of want) {
      buildChunk(i, j);
      built++;
      if (performance.now() - t0 > budgetMs) break;
    }
    for (const c of chunks.values()) {
      const di = c.cx - cx;
      const dj = c.cz - cz;
      if (di * di + dj * dj > (R + 2) * (R + 2)) {
        dropChunk(c);
        dropped++;
      }
    }
    if (built || dropped) refreshNearby();
    return want.length - built;
  }

  // Lists the smoke, fireflies and landmarks of the loaded chunks near the player.
  function refreshNearby() {
    landmarksNear.length = 0;
    for (const c of chunks.values()) for (const l of c.landmarks) landmarksNear.push(l);
  }

  function chunkAt(x, z) {
    return chunks.get(`${Math.floor(x / CHUNK)},${Math.floor(z / CHUNK)}`);
  }

  /* ─────────────────────────── collisions ─────────────────────────── */

  function collide(feet) {
    const cx = Math.floor(player.x / CHUNK);
    const cz = Math.floor(player.z / CHUNK);
    for (let pass = 0; pass < 2; pass++) {
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const c = chunks.get(`${cx + i},${cz + j}`);
          if (!c) continue;
          for (const o of c.circles) {
            const dx = player.x - o.x;
            const dz = player.z - o.z;
            const min = o.r + PLAYER_R;
            const d2 = dx * dx + dz * dz;
            if (d2 < min * min && feet < 40) {
              const d = Math.sqrt(d2) || 0.001;
              player.x = o.x + (dx / d) * min;
              player.z = o.z + (dz / d) * min;
            }
          }
          for (const b of c.boxes) {
            if (feet > b.top - 0.2) continue;
            const ex0 = b.x0 - PLAYER_R;
            const ex1 = b.x1 + PLAYER_R;
            const ez0 = b.z0 - PLAYER_R;
            const ez1 = b.z1 + PLAYER_R;
            if (player.x <= ex0 || player.x >= ex1 || player.z <= ez0 || player.z >= ez1) continue;
            const pushes = [player.x - ex0, ex1 - player.x, player.z - ez0, ez1 - player.z];
            const m = Math.min(...pushes);
            if (m === pushes[0]) player.x = ex0;
            else if (m === pushes[1]) player.x = ex1;
            else if (m === pushes[2]) player.z = ez0;
            else player.z = ez1;
          }
        }
      }
    }
  }

  /* ─────────────────────────── journeys & saves ─────────────────────────── */

  function newJourney(seed) {
    return {
      seed,
      x: HALF_CELL + ROAD_HALF + 1.4,
      z: HALF_CELL + BLOCK * 1.5,
      yaw: 0,
      fly: false,
      dayT: 0.3,
      found: [],
      journal: [],
      marks: [],
      distance: 0,
      playTime: 0,
      banked: { distance: 0, found: 0, marks: 0 },
    };
  }

  function saveJourney() {
    if (!journey) return;
    journey.x = player.x;
    journey.z = player.z;
    journey.yaw = player.yaw;
    journey.fly = player.fly;
    journey.dayT = dayT;
    writeSave(journey);
  }

  function startJourney(j) {
    journey = j;
    if (!world || world.seedText !== j.seed) {
      clearChunks();
      world = createWorld(j.seed);
    }
    player.x = j.x;
    player.z = j.z;
    player.yaw = j.yaw || 0;
    player.pitch = 0;
    player.fly = !!j.fly;
    player.vx = 0; player.vz = 0; player.vy = 0;
    const g = world.standAt(player.x, player.z);
    player.y = player.fly ? Math.max(g + 12, 20) : g;
    dayT = Number.isFinite(j.dayT) ? j.dayT : 0.3;
    regionKey = '';
    regionShown = '';
    lastCross = '';
    // Grow the ground under the player before the first frame.
    setState('loading');
    refs.loading.classList.add('is-on');
    const t = setTimeout(() => {
      timers.delete(t);
      if (destroyed) return;
      streamChunks(Math.floor(player.x / CHUNK), Math.floor(player.z / CHUNK), 400);
      refs.loading.classList.remove('is-on');
      setState('play');
      showHint('Click the world to look around · WASD to walk · F to fly');
    }, 30);
    timers.add(t);
  }

  /* ─────────────────────────── states & overlays ─────────────────────────── */

  function setState(s) {
    state = s;
    root.dataset.state = s;
    refs.title.classList.toggle('is-open', s === 'title');
    refs.pause.classList.toggle('is-open', s === 'paused');
    refs.journal.classList.toggle('is-open', s === 'journal');
    if (s !== 'play') {
      keys.clear();
      if (document.pointerLockElement === canvas) document.exitPointerLock?.();
    }
    if (s === 'play') root.focus({ preventScroll: true });
  }

  function showTitle() {
    if (journey) saveJourney();
    journey = null;
    const save = readSave();
    refs.seed.value = save?.seed || randomSeed();
    if (save) {
      refs.continueBtn.hidden = false;
      refs.continueBtn.textContent = `> Continue: seed ${save.seed} · ${save.found?.length || 0} places`;
    } else {
      refs.continueBtn.hidden = true;
    }
    // The title screen flies over the spawn city of the chosen seed.
    if (!world || world.seedText !== refs.seed.value) {
      clearChunks();
      world = createWorld(refs.seed.value);
    }
    player.x = HALF_CELL + 2.5;
    player.z = HALF_CELL + 300;
    player.y = 26;
    player.yaw = 0;
    player.pitch = -0.16;
    player.fly = true;
    dayT = 0.3;
    streamChunks(Math.floor(player.x / CHUNK), Math.floor(player.z / CHUNK), 150);
    setState('title');
  }

  function pause() {
    if (state !== 'play') return;
    saveJourney();
    const found = journey.found.length;
    refs.pauseInfo.textContent = `Seed ${journey.seed} · ${regionShown || 'the wilds'}`;
    fillStats(refs.pauseStats);
    const delta = unbanked();
    refs.bankBtn.disabled = delta.score <= 0;
    refs.bankBtn.textContent = delta.score > 0 ? `Make camp: bank ${delta.score.toLocaleString()} points` : 'Make camp (explore more to earn rewards)';
    if (!found) refs.pauseInfo.textContent += ' · no places found yet';
    setState('paused');
  }

  function fillStats(el) {
    const rows = [
      ['Travelled', fmtDist(journey.distance)],
      ['Places found', String(journey.found.length)],
      ['Landmarks', String(journey.marks.length)],
      ['Time on the road', `${Math.floor(journey.playTime / 60)} min`],
    ];
    el.innerHTML = '';
    for (const [k, v] of rows) {
      const row = document.createElement('div');
      const a = document.createElement('span');
      a.textContent = k;
      const b = document.createElement('b');
      b.textContent = v;
      row.append(a, b);
      el.appendChild(row);
    }
  }

  function unbanked() {
    const b = journey.banked;
    const dist = Math.max(0, journey.distance - b.distance);
    const found = Math.max(0, journey.found.length - b.found);
    const marks = Math.max(0, journey.marks.length - b.marks);
    return { dist, found, marks, score: Math.floor(dist / 10) + found * 250 + marks * 400 };
  }

  function bank() {
    const d = unbanked();
    if (d.score <= 0) return;
    reportRun(root, GAME_ID, {
      score: d.score,
      coins: d.found + d.marks * 2,
      duration: journey.playTime,
      distance: Math.round(d.dist),
      perfects: d.marks,
    });
    journey.banked = { distance: journey.distance, found: journey.found.length, marks: journey.marks.length };
    saveJourney();
    refs.bankBtn.disabled = true;
    refs.bankBtn.textContent = 'Camp made. Rewards banked.';
    snd.chime();
  }

  function openJournal() {
    if (state !== 'play' && state !== 'paused') return;
    if (state === 'play') saveJourney();
    refs.journalInfo.textContent = `Seed ${journey.seed} · ${journey.found.length} places · ${journey.marks.length} landmarks · ${fmtDist(journey.distance)} travelled`;
    refs.journalList.innerHTML = '';
    const entries = journey.journal.slice().reverse();
    if (!entries.length) {
      const li = document.createElement('li');
      li.textContent = 'Nothing yet. Follow a road and see where it goes.';
      refs.journalList.appendChild(li);
    }
    for (const e of entries.slice(0, 80)) {
      const li = document.createElement('li');
      const a = document.createElement('span');
      a.className = `t-${e.type}`;
      a.textContent = e.type === 'landmark' ? `* ${e.name}` : `${e.name}`;
      const b = document.createElement('span');
      b.textContent = e.type === 'landmark' ? 'landmark' : `${TYPE_LABEL[e.type]} · ${fmtDist(e.from)} from start`;
      li.append(a, b);
      refs.journalList.appendChild(li);
    }
    setState('journal');
  }

  function toast(text, secs = 3.2) {
    refs.toast.textContent = text;
    refs.toast.classList.add('is-in');
    toastT = secs;
  }

  function card(kind, title, secs = 3.6) {
    refs.cardKind.textContent = kind;
    refs.cardTitle.textContent = title;
    refs.card.classList.add('is-in');
    cardT = secs;
  }

  let hintTimer = 0;
  function showHint(text) {
    refs.hint.textContent = text;
    refs.hint.style.opacity = '1';
    hintTimer = 9;
  }

  /* ─────────────────────────── sound ─────────────────────────── */

  const snd = {
    step(hard) { noise({ dur: 0.05, vol: 0.03, freq: hard ? 1900 : 800, freqEnd: 250 }); },
    splash() { noise({ dur: 0.18, vol: 0.04, freq: 1400, freqEnd: 400 }); },
    discover() { [523, 659, 784, 1047].forEach((f, i) => tone({ type: 'triangle', from: f, to: f, dur: 0.45, vol: 0.08, delay: i * 0.13 })); },
    chime() { [784, 1047, 1319].forEach((f, i) => tone({ type: 'sine', from: f, to: f, dur: 0.35, vol: 0.08, delay: i * 0.09 })); },
    landmark() { [392, 523, 659, 784, 1047].forEach((f, i) => tone({ type: 'sine', from: f, to: f * 1.002, dur: 0.6, vol: 0.07, delay: i * 0.1 })); },
    bird() {
      const f = 2300 + Math.random() * 1500;
      tone({ type: 'sine', from: f, to: f * 1.3, dur: 0.07, vol: 0.025 });
      tone({ type: 'sine', from: f * 1.1, to: f * 0.9, dur: 0.08, vol: 0.022, delay: 0.1 });
    },
    cricket() { for (let i = 0; i < 3; i++) tone({ type: 'square', from: 4300, to: 4400, dur: 0.025, vol: 0.008, delay: i * 0.06 }); },
    horn() { tone({ type: 'square', from: 392, to: 392, dur: 0.22, vol: 0.025 }); tone({ type: 'square', from: 494, to: 494, dur: 0.22, vol: 0.02 }); },
    thunder() { noise({ dur: 2.4, vol: 0.2, freq: 320, freqEnd: 40 }); },
    rain(a) { noise({ dur: 0.9, vol: 0.025 * a, freq: 2800, freqEnd: 1600 }); },
    wind() { noise({ dur: 2.6, vol: 0.03, freq: 520, freqEnd: 180 }); },
    whoosh(up) { noise({ dur: 0.35, vol: 0.05, freq: up ? 600 : 1600, freqEnd: up ? 1800 : 400 }); },
    ui() { tone({ type: 'sine', from: 620, to: 820, dur: 0.06, vol: 0.06 }); },
  };

  /* ─────────────────────────── input ─────────────────────────── */

  const GAME_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'ShiftLeft', 'ShiftRight', 'KeyC', 'ControlLeft', 'KeyT', 'KeyQ', 'KeyE']);

  function onKeyDown(e) {
    if (e.target && e.target.tagName === 'INPUT') {
      if (e.code === 'Enter') refs.beginBtn.click();
      return;
    }
    unlockAudio();
    if (state === 'title') {
      if (e.code === 'Enter') refs.beginBtn.click();
      return;
    }
    if (e.code === 'KeyP' || e.code === 'Escape') {
      e.preventDefault();
      if (state === 'play') pause();
      else if (state === 'paused' || state === 'journal') resume();
      return;
    }
    if (e.code === 'KeyJ' || e.code === 'Tab') {
      e.preventDefault();
      if (state === 'journal') resume();
      else openJournal();
      return;
    }
    if (state !== 'play') return;
    if (GAME_KEYS.has(e.code)) {
      e.preventDefault();
      keys.add(e.code);
    }
    if (e.repeat) return;
    if (e.code === 'KeyF') toggleFly();
    else if (e.code === 'KeyR') {
      autoWalk = !autoWalk;
      toast(autoWalk ? 'Auto-walk on. Press R again to stop.' : 'Auto-walk off.', 1.8);
    } else if (e.code === 'Space' && !player.fly && (player.ground || player.swim)) {
      player.vy = player.swim ? 5 : 8.5;
      player.ground = false;
    }
  }

  function onKeyUp(e) {
    keys.delete(e.code);
  }

  function toggleFly() {
    player.fly = !player.fly;
    if (player.fly) player.vy = 6;
    snd.whoosh(player.fly);
    refs.tFly.classList.toggle('is-on', player.fly);
    toast(player.fly ? 'Flying. Space rises, C sinks, Shift soars faster.' : 'Back on foot.', 2.2);
  }

  function resume() {
    if (state === 'paused' || state === 'journal') {
      last = performance.now();
      setState('play');
    }
  }

  // Mouse: click to capture the pointer; without pointer lock, drag to look.
  let drag = null;
  let joy = null;
  let look = null;
  const joyVec = { x: 0, y: 0 };

  function onPointerDown(e) {
    if (state !== 'play') return;
    unlockAudio();
    if (e.pointerType === 'touch') {
      const rect = root.getBoundingClientRect();
      const lx = e.clientX - rect.left;
      if (lx < rect.width * 0.45 && !joy) {
        joy = { id: e.pointerId, x: lx, y: e.clientY - rect.top };
        refs.joy.style.left = `${joy.x}px`;
        refs.joy.style.top = `${joy.y}px`;
        refs.joy.classList.add('is-on');
      } else if (!look) {
        look = { id: e.pointerId, x: e.clientX, y: e.clientY };
      }
      return;
    }
    if (!pointerLocked && canvas.requestPointerLock) {
      try {
        const p = canvas.requestPointerLock();
        if (p && p.catch) p.catch(() => {});
      } catch (err) { /* fall back to dragging */ }
    }
    drag = { x: e.clientX, y: e.clientY };
  }

  function onPointerMove(e) {
    if (state !== 'play') return;
    if (e.pointerType === 'touch') {
      if (joy && e.pointerId === joy.id) {
        const rect = root.getBoundingClientRect();
        let dx = e.clientX - rect.left - joy.x;
        let dy = e.clientY - rect.top - joy.y;
        const len = Math.hypot(dx, dy);
        if (len > 50) { dx = (dx / len) * 50; dy = (dy / len) * 50; }
        joyVec.x = dx / 50;
        joyVec.y = dy / 50;
        refs.knob.style.transform = `translate(${dx}px, ${dy}px)`;
      } else if (look && e.pointerId === look.id) {
        turn((e.clientX - look.x) * 0.006, (e.clientY - look.y) * 0.006);
        look.x = e.clientX;
        look.y = e.clientY;
      }
      return;
    }
    if (pointerLocked) turn(e.movementX * 0.0022, e.movementY * 0.0022);
    else if (drag) {
      turn((e.clientX - drag.x) * 0.005, (e.clientY - drag.y) * 0.005);
      drag.x = e.clientX;
      drag.y = e.clientY;
    }
  }

  function onPointerUp(e) {
    if (joy && e.pointerId === joy.id) {
      joy = null;
      joyVec.x = 0;
      joyVec.y = 0;
      refs.joy.classList.remove('is-on');
      refs.knob.style.transform = '';
    }
    if (look && e.pointerId === look.id) look = null;
    drag = null;
  }

  function turn(dx, dy) {
    player.yaw -= dx;
    player.pitch = clamp(player.pitch - dy, -1.45, 1.45);
  }

  function onLockChange() {
    const was = pointerLocked;
    pointerLocked = document.pointerLockElement === canvas;
    if (pointerLocked) showHint('Esc frees the mouse · Shift to run · F to fly · T to speed up time');
    // Esc while the pointer is captured releases it before the key reaches us: treat that as pause.
    if (was && !pointerLocked && state === 'play') pause();
  }

  function holdButton(el, code) {
    el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      unlockAudio();
      if (code === 'Space' && !player.fly && (player.ground || player.swim)) {
        player.vy = player.swim ? 5 : 8.5;
        player.ground = false;
      }
      keys.add(code);
    });
    const up = () => keys.delete(code);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', up);
  }

  holdButton(refs.tJump, 'Space');
  refs.tRun.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    runToggle = !runToggle;
    refs.tRun.classList.toggle('is-on', runToggle);
  });
  refs.tFly.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    toggleFly();
  });

  refs.beginBtn.addEventListener('click', () => {
    unlockAudio();
    snd.ui();
    const seed = (refs.seed.value || '').trim().slice(0, 24) || randomSeed();
    refs.seed.value = seed;
    startJourney(newJourney(seed));
    saveJourney();
  });
  refs.continueBtn.addEventListener('click', () => {
    unlockAudio();
    snd.ui();
    const save = readSave();
    if (!save) return;
    startJourney({ ...newJourney(save.seed), ...save, banked: { ...newJourney(save.seed).banked, ...(save.banked || {}) } });
  });
  refs.diceBtn.addEventListener('click', () => {
    snd.ui();
    refs.seed.value = randomSeed();
    clearChunks();
    world = createWorld(refs.seed.value);
  });
  refs.seed.addEventListener('change', () => {
    const v = refs.seed.value.trim();
    if (v && (!world || world.seedText !== v)) {
      clearChunks();
      world = createWorld(v);
    }
  });
  refs.pauseBtn.addEventListener('click', () => (state === 'play' ? pause() : resume()));
  refs.journalBtn.addEventListener('click', () => (state === 'journal' ? resume() : openJournal()));
  refs.resumeBtn.addEventListener('click', resume);
  refs.journal2Btn.addEventListener('click', openJournal);
  refs.journalClose.addEventListener('click', resume);
  refs.bankBtn.addEventListener('click', bank);
  refs.titleBtn.addEventListener('click', showTitle);

  function onBlur() { keys.clear(); }
  function onVisibility() {
    if (document.hidden) {
      if (state === 'play') pause();
      else if (journey) saveJourney();
    }
  }

  refs.stage.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  document.addEventListener('visibilitychange', onVisibility);
  document.addEventListener('pointerlockchange', onLockChange);
  const ro = new ResizeObserver(() => resize());
  ro.observe(root);

  /* ─────────────────────────── player ─────────────────────────── */

  function updatePlayer(dt) {
    let fwd = 0;
    let side = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp')) fwd += 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) fwd -= 1;
    if (keys.has('KeyA')) side -= 1;
    if (keys.has('KeyD')) side += 1;
    if (keys.has('ArrowLeft') || keys.has('KeyQ')) player.yaw += 1.9 * dt;
    if (keys.has('ArrowRight') || keys.has('KeyE')) player.yaw -= 1.9 * dt;
    fwd -= joyVec.y;
    side += joyVec.x;
    if (autoWalk && fwd === 0) fwd = 1;
    const len = Math.hypot(fwd, side);
    if (len > 1) { fwd /= len; side /= len; }
    const fast = keys.has('ShiftLeft') || keys.has('ShiftRight') || runToggle;
    const sinY = Math.sin(player.yaw);
    const cosY = Math.cos(player.yaw);
    // Forward is -z rotated by yaw.
    const dirX = -sinY * fwd + cosY * side;
    const dirZ = -cosY * fwd - sinY * side;
    const px0 = player.x;
    const pz0 = player.z;

    if (player.fly) {
      const sp = fast ? FLY_FAST : FLY;
      player.vx = damp(player.vx, dirX * sp, 3, dt);
      player.vz = damp(player.vz, dirZ * sp, 3, dt);
      let up = 0;
      if (keys.has('Space')) up += 1;
      if (keys.has('KeyC') || keys.has('ControlLeft')) up -= 1;
      // Looking up or down while moving also climbs or dives a little.
      up += Math.sin(player.pitch) * Math.abs(fwd) * 0.6;
      player.vy = damp(player.vy, up * (fast ? 30 : 16), 4, dt);
      player.x += player.vx * dt;
      player.z += player.vz * dt;
      player.y += player.vy * dt;
      const g = world.standAt(player.x, player.z);
      player.y = clamp(player.y, Math.max(g, WATER_Y) + 0.6, 400);
      player.ground = false;
      player.swim = false;
      collide(player.y);
    } else {
      const sp = player.swim ? 3.2 : fast ? RUN : WALK;
      const k = player.ground || player.swim ? 10 : 2.5;
      player.vx = damp(player.vx, dirX * sp, k, dt);
      player.vz = damp(player.vz, dirZ * sp, k, dt);
      player.x += player.vx * dt;
      player.z += player.vz * dt;
      collide(player.y);
      const g = world.standAt(player.x, player.z);
      // In deep water the player floats with their head just above the surface.
      const floatY = WATER_Y - EYE + 0.35;
      const deep = g < floatY;
      const floor = deep ? floatY : g;
      player.vy -= (deep && player.y < floatY + 0.5 ? 10 : 24) * dt;
      player.y += player.vy * dt;
      if (player.y <= floor) {
        if (!player.ground && !deep && player.vy < -9) snd.step(true);
        player.y = floor;
        player.vy = 0;
        player.ground = !deep;
        player.swim = deep;
      } else {
        if (player.y - floor > 0.25) player.ground = false;
        player.swim = deep && player.y < floatY + 0.3;
      }
      // Walking down a slope: stick to the ground instead of hopping.
      if (player.ground && !deep && player.y - g < 0.6) player.y = g;
    }

    const moved = Math.hypot(player.x - px0, player.z - pz0);
    if (moved < 20) journey.distance += moved;
    const speed = moved / Math.max(dt, 1e-4);
    if (!player.fly && (player.ground || player.swim) && speed > 0.5) {
      player.bob += speed * dt * 1.25;
      player.stepT -= speed * dt;
      if (player.stepT <= 0) {
        player.stepT = fast ? 2.8 : 2.1;
        if (player.swim) snd.splash();
        else snd.step(roadCoord(player.x) < ROAD_HALF || roadCoord(player.z) < ROAD_HALF || world.weightOf(world.regionAt(player.x, player.z), 'city') > 0.5);
      }
    }
    return speed;
  }

  /* ─────────────────────────── discovery ─────────────────────────── */

  function updateDiscovery() {
    const r = world.regionAt(player.x, player.z);
    const s = r.own >= 0.5 ? r.site : r.other;
    if (s.key !== regionKey && (s === r.site ? r.own > 0.62 : r.own < 0.38)) {
      regionKey = s.key;
      regionShown = s.name;
      if (!journey.found.includes(s.key)) {
        journey.found.push(s.key);
        journey.journal.push({ type: s.type, name: s.name, from: Math.round(Math.hypot(player.x - HALF_CELL, player.z - HALF_CELL)) });
        card(NEW_LABEL[s.type], s.name);
        snd.discover();
      } else {
        card('Entering', s.name, 2.6);
      }
    }
    for (const l of landmarksNear) {
      if (journey.marks.includes(l.key)) continue;
      const d = Math.hypot(player.x - l.x, player.z - l.z);
      if (d < (l.type === 'city' ? 30 : 26)) {
        journey.marks.push(l.key);
        journey.journal.push({ type: 'landmark', name: l.name, from: 0 });
        toast(`Landmark found: ${l.name}`, 3.6);
        snd.landmark();
      }
    }
    // Crossroads: say where each highway leads.
    const nx = Math.round((player.x - HALF_CELL) / 320);
    const nz = Math.round((player.z - HALF_CELL) / 320);
    const ix = HALF_CELL + nx * 320;
    const iz = HALF_CELL + nz * 320;
    const crossKey = `${nx},${nz}`;
    if (Math.abs(player.x - ix) < 9 && Math.abs(player.z - iz) < 9 && crossKey !== lastCross) {
      lastCross = crossKey;
      const sp = world.signpost(ix + 1, iz + 1);
      toast(`CROSSROADS\nN: ${sp.north.name}   E: ${sp.east.name}\nS: ${sp.south.name}   W: ${sp.west.name}`, 5);
    }
  }

  /* ─────────────────────────── living world ─────────────────────────── */

  function spawnCar(c, nearAlong) {
    const axis = Math.random() < 0.5 ? 'x' : 'z';
    const across = axis === 'x' ? player.x : player.z;
    const along = axis === 'x' ? player.z : player.x;
    const k = Math.round((across - HALF_CELL) / 320) + Math.floor(Math.random() * 3) - 1;
    c.axis = axis;
    c.line = HALF_CELL + k * 320;
    c.dir = Math.random() < 0.5 ? 1 : -1;
    c.along = along + (Math.random() < 0.5 ? -1 : 1) * (nearAlong ? 30 + Math.random() * 220 : 200 + Math.random() * 60);
    c.speed = 13 + Math.random() * 12;
    c.v = c.speed;
    c.color = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
    c.live = true;
    c.honk = 0;
  }

  function updateCars(dt, night) {
    let i = 0;
    for (const c of cars) {
      if (!c.live) spawnCar(c, true);
      const across = c.axis === 'x' ? player.x : player.z;
      const along = c.axis === 'x' ? player.z : player.x;
      if (Math.abs(c.along - along) > 290 || Math.abs(c.line - across) > 480) spawnCar(c, false);
      const lane = c.line - c.dir * 2.5;
      // Brake for the player standing in the lane ahead.
      const ahead = (along - c.along) * c.dir;
      const inLane = Math.abs(across - lane) < 1.8 && player.y < 3;
      const target = inLane && ahead > 0 && ahead < 16 ? 0 : c.speed;
      c.v = damp(c.v, target, inLane && ahead > 0 && ahead < 16 ? 5 : 1.2, dt);
      c.honk -= dt;
      if (inLane && ahead > 0 && ahead < 10 && c.honk <= 0) {
        snd.horn();
        c.honk = 4;
      }
      c.along += c.v * c.dir * dt;
      const x = c.axis === 'x' ? lane : c.along;
      const z = c.axis === 'x' ? c.along : lane;
      dummy.position.set(x, 0.08, z);
      dummy.rotation.set(0, c.axis === 'x' ? (c.dir > 0 ? 0 : Math.PI) : (c.dir > 0 ? Math.PI / 2 : -Math.PI / 2), 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      carMesh.setMatrixAt(i, dummy.matrix);
      carLights.setMatrixAt(i, dummy.matrix);
      carMesh.setColorAt(i, tmpC.setHex(c.color));
      // Pushed aside by a car that does not stop in time.
      const dx = player.x - x;
      const dz = player.z - z;
      if (Math.abs(c.axis === 'x' ? dx : dz) < 1.4 && Math.abs(c.axis === 'x' ? dz : dx) < 2.6 && player.y < 2) {
        if (c.axis === 'x') player.x = x + Math.sign(dx || 1) * 1.45;
        else player.z = z + Math.sign(dz || 1) * 1.45;
      }
      i++;
    }
    carMesh.count = i;
    carLights.count = i;
    carMesh.instanceMatrix.needsUpdate = true;
    carLights.instanceMatrix.needsUpdate = true;
    if (carMesh.instanceColor) carMesh.instanceColor.needsUpdate = true;
    carLights.visible = night > 0.05 || weather.rain > 0.3;
  }

  function spawnPerson(p) {
    for (let tries = 0; tries < 6; tries++) {
      const a = Math.random() * Math.PI * 2;
      const d = 25 + Math.random() * 70;
      let x = player.x + Math.cos(a) * d;
      let z = player.z + Math.sin(a) * d;
      const r = world.regionAt(x, z);
      const cw = world.weightOf(r, 'city');
      const vw = world.weightOf(r, 'village');
      if (cw > 0.6) {
        // City folk keep to the sidewalks.
        p.axis = Math.random() < 0.5 ? 'x' : 'z';
        const side = Math.random() < 0.5 ? -1 : 1;
        if (p.axis === 'x') x = HALF_CELL + BLOCK * Math.round((x - HALF_CELL) / BLOCK) + side * 5.2;
        else z = HALF_CELL + BLOCK * Math.round((z - HALF_CELL) / BLOCK) + side * 5.2;
        p.heading = p.axis === 'x' ? (Math.random() < 0.5 ? 0 : Math.PI) : (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
        p.wander = false;
      } else if (vw > 0.6) {
        p.heading = Math.random() * Math.PI * 2;
        p.wander = true;
      } else continue;
      if (world.heightAt(x, z, r) < WATER_Y + 0.2) continue;
      p.x = x;
      p.z = z;
      p.speed = 1.1 + Math.random() * 0.8;
      p.t = 4 + Math.random() * 10;
      p.color = SHIRTS[Math.floor(Math.random() * SHIRTS.length)];
      p.phase = Math.random() * 10;
      p.live = true;
      return;
    }
  }

  function updatePeople(dt, night) {
    let n = 0;
    for (const p of people) {
      if (!p.live) {
        if (Math.random() < 0.04) spawnPerson(p);
        if (!p.live) continue;
      }
      if (Math.hypot(p.x - player.x, p.z - player.z) > 130) {
        p.live = false;
        continue;
      }
      p.t -= dt;
      if (p.t <= 0) {
        p.t = 4 + Math.random() * 10;
        p.heading = p.wander ? p.heading + (Math.random() - 0.5) * 2.5 : p.heading + Math.PI;
      }
      // Stop to let the player by.
      const close = Math.hypot(p.x - player.x, p.z - player.z) < 1.6;
      const v = close ? 0 : p.speed * (night > 0.7 ? 0.7 : 1);
      p.x += Math.sin(p.heading) * v * dt;
      p.z += Math.cos(p.heading) * v * dt;
      p.phase += v * dt * 3.2;
      const y = world.standAt(p.x, p.z);
      dummy.position.set(p.x, y + Math.abs(Math.sin(p.phase)) * 0.06, p.z);
      dummy.rotation.set(0, p.heading, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      peopleMesh.setMatrixAt(n, dummy.matrix);
      peopleBody.setMatrixAt(n, dummy.matrix);
      peopleMesh.setColorAt(n, tmpC.setHex(p.color));
      n++;
    }
    peopleMesh.count = n;
    peopleBody.count = n;
    peopleMesh.instanceMatrix.needsUpdate = true;
    peopleBody.instanceMatrix.needsUpdate = true;
    if (peopleMesh.instanceColor) peopleMesh.instanceColor.needsUpdate = true;
  }

  function updateBirds(dt, day) {
    birds.visible = day > 0.4 && weather.rain < 0.5;
    if (!birds.visible) return;
    const d = Math.hypot(flock.x - player.x, flock.z - player.z);
    if (d > 260) {
      const a = player.yaw + (Math.random() - 0.5);
      flock.x = player.x - Math.sin(a) * 150;
      flock.z = player.z - Math.cos(a) * 150;
    }
    flock.a += dt * 0.25;
    flock.x += Math.cos(flock.a * 0.3) * dt * 6;
    flock.z += Math.sin(flock.a * 0.3) * dt * 6;
    for (let i = 0; i < BIRD_N; i++) {
      const a = flock.a + i * 0.5;
      const r = 14 + (i % 4) * 5;
      const x = flock.x + Math.cos(a) * r;
      const z = flock.z + Math.sin(a) * r;
      dummy.position.set(x, 52 + Math.sin(time * 0.7 + i) * 4 + (i % 3) * 3, z);
      dummy.rotation.set(0, -a, 0);
      const flap = Math.sin(time * 9 + i * 1.7);
      dummy.scale.set(1.3, 1 + flap * 1.6, 1.3);
      dummy.updateMatrix();
      birds.setMatrixAt(i, dummy.matrix);
    }
    birds.instanceMatrix.needsUpdate = true;
  }

  let nearT = 0;
  const smokeSources = [];
  function gatherNear() {
    // Re-pick the nearest smoke and firefly sources a few times a second.
    smokeSources.length = 0;
    ffCount = 0;
    const flies = [];
    for (const c of chunks.values()) {
      const dx = (c.cx + 0.5) * CHUNK - player.x;
      const dz = (c.cz + 0.5) * CHUNK - player.z;
      if (dx * dx + dz * dz > 170 * 170) continue;
      for (const s of c.smoke) smokeSources.push(s);
      for (const f of c.flies) flies.push(f);
    }
    flies.sort((a, b) => Math.hypot(a.x - player.x, a.z - player.z) - Math.hypot(b.x - player.x, b.z - player.z));
    for (const f of flies) {
      const n = f.many ? 30 : 4;
      for (let k = 0; k < n && ffCount < FLY_N; k++) {
        const o = ffCount * 4;
        const rr = f.many ? 9 : 3;
        ffAnchor[o] = f.x + (Math.random() - 0.5) * rr * 2;
        ffAnchor[o + 1] = f.y + Math.random() * 2;
        ffAnchor[o + 2] = f.z + (Math.random() - 0.5) * rr * 2;
        ffAnchor[o + 3] = Math.random() * 100;
        ffCount++;
      }
      if (ffCount >= FLY_N) break;
    }
  }

  function updateParticles(dt, night) {
    nearT -= dt;
    if (nearT <= 0) {
      nearT = 0.6;
      gatherNear();
    }
    // Fireflies, only after dusk.
    fireflies.visible = night > 0.3 && weather.rain < 0.5;
    if (fireflies.visible) {
      for (let i = 0; i < ffCount; i++) {
        const o = i * 4;
        const ph = ffAnchor[o + 3] + time * 0.6;
        ffPos[i * 3] = ffAnchor[o] + Math.sin(ph * 1.3) * 1.2;
        ffPos[i * 3 + 1] = ffAnchor[o + 1] + Math.sin(ph * 2.1) * 0.6;
        ffPos[i * 3 + 2] = ffAnchor[o + 2] + Math.cos(ph * 1.7) * 1.2;
      }
      ffGeo.setDrawRange(0, ffCount);
      ffGeo.attributes.position.needsUpdate = true;
      ffMat.opacity = Math.min(1, night * 1.4) * (0.6 + 0.4 * Math.sin(time * 3));
    }
    // Smoke from chimneys and watchtower fires.
    for (const s of smokeSources) {
      s.t -= dt;
      if (s.t <= 0 && puffs.length < SMOKE_N) {
        s.t = s.fire ? 0.35 : 0.9 + Math.random() * 0.6;
        puffs.push({ x: s.x, y: s.y, z: s.z, life: 0, max: s.fire ? 2.2 : 5 + Math.random() * 2, size: s.fire ? 0.5 : 0.7 });
      }
    }
    let n = 0;
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i];
      p.life += dt;
      if (p.life >= p.max) {
        puffs.splice(i, 1);
        continue;
      }
      p.y += dt * 1.3;
      p.x += dt * 0.9;
      p.z += dt * 0.4;
      const k = p.life / p.max;
      const s = p.size + k * 2.2;
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.life, p.life * 0.7, 0);
      dummy.scale.setScalar(s * (1 - k * k));
      dummy.updateMatrix();
      smoke.setMatrixAt(n++, dummy.matrix);
    }
    smoke.count = n;
    smoke.instanceMatrix.needsUpdate = true;
  }

  function updateRain(dt) {
    rain.visible = weather.rain > 0.02;
    if (!rain.visible) return;
    rainMat.opacity = Math.min(0.85, weather.rain);
    const cx = camera.position.x;
    const cy = camera.position.y;
    const cz = camera.position.z;
    const fall = (time * 38) % 50;
    for (let i = 0; i < RAIN_N; i++) {
      const sx = rainSeed[i * 3];
      const sz = rainSeed[i * 3 + 2];
      const wx = cx + (((sx - cx * 0.0) % 80) + 80) % 80 - 40;
      const wz = cz + (((sz - cz * 0.0) % 80) + 80) % 80 - 40;
      const y = cy + 25 - ((rainSeed[i * 3 + 1] + fall) % 50);
      const o = i * 6;
      rainPos[o] = wx;
      rainPos[o + 1] = y;
      rainPos[o + 2] = wz;
      rainPos[o + 3] = wx + 0.25;
      rainPos[o + 4] = y - 1.3;
      rainPos[o + 5] = wz;
    }
    rainGeo.attributes.position.needsUpdate = true;
    rainGeo.setDrawRange(0, Math.floor(RAIN_N * 2 * Math.min(1, weather.rain * 1.2)));
  }

  function updateWater() {
    const sx = Math.round(camera.position.x / 10) * 10;
    const sz = Math.round(camera.position.z / 10) * 10;
    water.position.set(sx, WATER_Y, sz);
    const pos = waterGeo.attributes.position.array;
    const amp = 0.09 + weather.rain * 0.08;
    for (let i = 0; i < pos.length; i += 3) {
      const x = waterBase[i] + sx;
      const z = waterBase[i + 2] + sz;
      pos[i + 1] = Math.sin(x * 0.31 + time * 1.4) * amp + Math.sin(z * 0.23 - time * 1.1) * amp + Math.sin((x + z) * 0.11 + time * 0.6) * amp * 0.8;
    }
    waterGeo.attributes.position.needsUpdate = true;
    waterGeo.computeVertexNormals();
  }

  function updateAnimated(dt, night) {
    for (const c of chunks.values()) {
      for (const b of c.blades) b.rotation.z -= dt * (0.7 + weather.rain);
      for (const g of c.beams) {
        g.rotation.y += dt * 0.9;
        g.visible = night > 0.25 || weather.fog < 0.6;
      }
    }
    beaconMat.visible = (time % 1.6) < 0.8;
  }

  /* ─────────────────────────── sky, light & weather ─────────────────────────── */

  const C = (hex) => new THREE.Color(hex);
  const SKY = {
    dayZenith: C(0x3a6db0), dayHorizon: C(0xa6c8e2),
    nightZenith: C(0x03060f), nightHorizon: C(0x0d1526),
    duskZenith: C(0x2a2a5a), duskHorizon: C(0xf08a4b),
    rainZenith: C(0x4a525c), rainHorizon: C(0x8a929a),
  };
  const zen = new THREE.Color();
  const hor = new THREE.Color();
  const tmpA = new THREE.Color();

  function pickWeather() {
    const r = Math.random();
    const kind = r < 0.42 ? 'clear' : r < 0.67 ? 'cloudy' : r < 0.86 ? 'rain' : 'mist';
    weather.kind = kind;
    weather.t = 70 + Math.random() * 110;
    weather.cloudT = { clear: 0.25, cloudy: 0.8, rain: 1, mist: 0.5 }[kind];
    weather.rainT = kind === 'rain' ? 0.6 + Math.random() * 0.4 : 0;
    weather.fogT = { clear: 1, cloudy: 0.85, rain: 0.55, mist: 0.3 }[kind];
    if (state === 'play') {
      const msg = { clear: 'The sky clears.', cloudy: 'Clouds roll in.', rain: 'Rain is coming.', mist: 'A mist settles over the land.' }[kind];
      toast(msg, 2.4);
    }
  }

  function updateSky(dt) {
    weather.t -= dt;
    if (weather.t <= 0) pickWeather();
    weather.cloud = damp(weather.cloud, weather.cloudT, 0.25, dt);
    weather.rain = damp(weather.rain, weather.rainT, 0.3, dt);
    weather.fog = damp(weather.fog, weather.fogT, 0.25, dt);

    const angle = (dayT - 0.25) * Math.PI * 2;
    const elev = Math.sin(angle);
    const sunDir = skyU.uSunDir.value.set(Math.cos(angle), elev, 0.35).normalize();
    skyU.uMoonDir.value.copy(sunDir).multiplyScalar(-1);
    const day = smoothstep(-0.12, 0.25, elev);
    const dusk = Math.exp(-((elev / 0.2) ** 2));
    const night = 1 - day;

    zen.copy(SKY.nightZenith).lerp(SKY.dayZenith, day).lerp(SKY.duskZenith, dusk * 0.5);
    hor.copy(SKY.nightHorizon).lerp(SKY.dayHorizon, day).lerp(SKY.duskHorizon, dusk * 0.65);
    const grey = weather.cloud > 0.6 ? (weather.cloud - 0.6) * 2 : 0;
    zen.lerp(tmpA.copy(SKY.rainZenith).multiplyScalar(0.2 + day * 0.8), grey * 0.8);
    hor.lerp(tmpA.copy(SKY.rainHorizon).multiplyScalar(0.2 + day * 0.8), grey * 0.8);
    // The sky stays dim so it draws as sparse characters, not a wall of @.
    skyU.uZenith.value.copy(zen).multiplyScalar(0.55);
    skyU.uHorizon.value.copy(hor).multiplyScalar(0.72);
    skyU.uSunCol.value.setRGB(1, 0.85 - dusk * 0.3, 0.6 - dusk * 0.35).multiplyScalar(1 - grey * 0.85);
    skyU.uMoon.value = night * (1 - grey * 0.8);
    scene.fog.color.copy(hor).multiplyScalar(0.72);

    // Fog closes in for rain, mist, night, and under a forest canopy.
    const r = world.regionAt(player.x, player.z);
    const forest = world.weightOf(r, 'forest');
    const far = 255 * weather.fog * (1 - forest * 0.3) * (0.8 + day * 0.2);
    scene.fog.far = damp(scene.fog.far, Math.max(60, far), 1.5, dt);
    scene.fog.near = scene.fog.far * 0.18;

    hemi.color.copy(zen).lerp(C(0xffffff), 0.35);
    hemi.groundColor.setHex(0x3a4030);
    hemi.intensity = 0.32 + day * 1.25 * (1 - grey * 0.35) + flash * 3;
    if (elev > -0.05) {
      sun.position.copy(sunDir).multiplyScalar(100).add(camera.position);
      sun.color.setRGB(1, 0.92 - dusk * 0.35, 0.8 - dusk * 0.45);
      sun.intensity = 2.3 * smoothstep(-0.05, 0.2, elev) * (1 - grey * 0.75);
    } else {
      sun.position.copy(skyU.uMoonDir.value).multiplyScalar(100).add(camera.position);
      sun.color.setHex(0x9fb4ff);
      sun.intensity = 0.55 * (1 - grey * 0.6);
    }
    sun.target.position.copy(camera.position);
    torch.position.copy(camera.position);
    torch.intensity = night * 26;
    glowMat.emissiveIntensity = 0.12 + night * 1.6 + grey * 0.3;
    starMat.opacity = night * (1 - weather.cloud * 0.9);
    stars.visible = starMat.opacity > 0.02;
    sky.position.copy(camera.position);
    stars.position.copy(camera.position);

    cloudMat.color.setRGB(1, 1, 1).multiplyScalar((0.25 + day * 0.75) * (1 - grey * 0.45));
    cloudMat.emissive.setRGB(0.05, 0.06, 0.08).multiplyScalar(1 + dusk * 2);
    for (const c of clouds) {
      const u = c.userData;
      c.visible = u.rank < weather.cloud;
      if (!c.visible) continue;
      const wx = u.ox + time * 3;
      const ox = ((((wx - camera.position.x) % 900) + 900) % 900) - 450;
      const oz = ((((u.oz - camera.position.z) % 900) + 900) % 900) - 450;
      c.position.set(camera.position.x + ox, u.y, camera.position.z + oz);
    }

    // The ASCII backdrop follows the sky, and daylight earns lighter glyphs.
    U.uBg.value.copy(hor).multiplyScalar(0.12).add(tmpA.setRGB(0.008, 0.01, 0.02));
    U.uTint.value = 0.2 + day * 0.12;
    cellMat.uniforms.uDensity.value = 1.12 - day * 0.12;

    // Lightning in heavy rain.
    if (weather.rain > 0.6) {
      lightningT -= dt;
      if (lightningT <= 0) {
        lightningT = 7 + Math.random() * 14;
        flash = 1;
        const t = setTimeout(() => { timers.delete(t); snd.thunder(); }, 400 + Math.random() * 1500);
        timers.add(t);
      }
    }
    flash = Math.max(0, flash - dt * 3.5);
    U.uFlash.value = flash > 0.5 ? flash : flash * 0.3;
    return { day, night, dusk };
  }

  /* ─────────────────────────── HUD ─────────────────────────── */

  const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  function bearing() {
    return ((((-player.yaw * 180) / Math.PI) % 360) + 360) % 360;
  }

  function updateCompass() {
    const b = bearing();
    let s = '';
    const W = 41;
    for (let i = 0; i < W; i++) {
      const deg = Math.round(b + (i - (W - 1) / 2) * 3);
      const d = ((deg % 360) + 360) % 360;
      if (d % 45 === 0) {
        const label = DIRS[d / 45];
        s += label.length === 1 ? label : label[0];
      } else if (d % 15 === 0) s += '|';
      else s += '-';
    }
    const mid = (W - 1) / 2;
    refs.compass.innerHTML = `${s.slice(0, mid)}<b>${s[mid] === '-' ? 'v' : s[mid]}</b>${s.slice(mid + 1)}`;
  }

  function updateMap() {
    const COLS = 25;
    const ROWS = 13;
    const SX = 11;
    const SZ = 20;
    const lm = landmarksNear.filter((l) => !journey.marks.includes(l.key));
    const lines = [];
    for (let j = 0; j < ROWS; j++) {
      let line = '';
      for (let i = 0; i < COLS; i++) {
        const x = player.x + (i - (COLS - 1) / 2) * SX;
        const z = player.z + (j - (ROWS - 1) / 2) * SZ;
        if (i === (COLS - 1) / 2 && j === (ROWS - 1) / 2) {
          const b = bearing();
          const arrow = b >= 315 || b < 45 ? '^' : b < 135 ? '>' : b < 225 ? 'v' : '<';
          line += `<span class="me-p">${arrow}</span>`;
          continue;
        }
        const mark = lm.find((l) => Math.abs(l.x - x) <= SX / 2 && Math.abs(l.z - z) <= SZ / 2);
        if (mark) {
          line += '<span class="lm">!</span>';
          continue;
        }
        const [g, cls] = world.mapGlyph(x, z);
        line += `<span class="${cls}">${g === '<' ? '&lt;' : g === '&' ? '&amp;' : g === '"' ? '&quot;' : g}</span>`;
      }
      lines.push(line);
    }
    refs.map.innerHTML = lines.join('\n');
  }

  function updateHud(dt, sky) {
    updateCompass();
    hudT -= dt;
    if (hudT <= 0) {
      hudT = 0.25;
      const r = world.regionAt(player.x, player.z);
      const s = r.own >= 0.5 ? r.site : r.other;
      const onRoad = roadCoord(player.x) < ROAD_HALF + 0.5 || roadCoord(player.z) < ROAD_HALF + 0.5;
      refs.place.textContent = s.name;
      const mode = player.fly ? 'flying' : player.swim ? 'swimming' : onRoad ? 'on the highway' : autoWalk ? 'walking (auto)' : 'on foot';
      refs.kind.textContent = `${TYPE_LABEL[s.type]} · ${mode}${r.own < 0.75 ? ` · near ${r.other.name}` : ''}`;
      const alt = player.fly ? ` · alt ${Math.round(player.y)} m` : '';
      refs.coords.textContent = `x ${Math.round(player.x)}  z ${Math.round(player.z)}${alt} · seed ${world.seedText}`;
      const mins = Math.floor(dayT * 24 * 60);
      const hh = String(Math.floor(mins / 60)).padStart(2, '0');
      const mm = String(mins % 60).padStart(2, '0');
      const wx = { clear: sky.night > 0.5 ? 'clear night' : 'clear', cloudy: 'cloudy', rain: 'rain', mist: 'mist' }[weather.kind];
      refs.clock.textContent = `${hh}:${mm} · ${wx}${timeWarp > 1 ? ' · >>' : ''}`;
      refs.stats.innerHTML = `<b>${fmtDist(journey.distance)}</b> travelled · <b>${journey.found.length}</b> places · <b>${journey.marks.length}</b> landmarks`;
    }
    mapT -= dt;
    if (mapT <= 0) {
      mapT = 0.35;
      updateMap();
    }
    if (toastT > 0) {
      toastT -= dt;
      if (toastT <= 0) refs.toast.classList.remove('is-in');
    }
    if (cardT > 0) {
      cardT -= dt;
      if (cardT <= 0) refs.card.classList.remove('is-in');
    }
    if (hintTimer > 0) {
      hintTimer -= dt;
      if (hintTimer <= 0) refs.hint.style.opacity = '0';
    }
  }

  function ambience(dt, sky) {
    ambT -= dt;
    if (weather.rain > 0.2) {
      rainSoundT -= dt;
      if (rainSoundT <= 0) {
        rainSoundT = 0.45;
        snd.rain(weather.rain);
      }
    }
    if (ambT > 0) return;
    ambT = 1.5 + Math.random() * 3;
    const r = world.regionAt(player.x, player.z);
    const t = r.own >= 0.5 ? r.site.type : r.other.type;
    if (player.y > 30 || t === 'hills') {
      if (Math.random() < 0.5) snd.wind();
    } else if (sky.night > 0.6) {
      if (t !== 'city') snd.cricket();
    } else if (weather.rain < 0.3 && (t === 'forest' || t === 'meadow' || t === 'village' || t === 'lake')) {
      snd.bird();
    }
  }

  /* ─────────────────────────── camera ─────────────────────────── */

  function updateCamera(dt, speed) {
    if (state === 'title') {
      // Title screen: glide up the highway over the spawn city.
      player.z -= dt * 16;
      const g = world.standAt(player.x, player.z);
      player.y = damp(player.y, Math.max(30, g + 22), 0.8, dt);
      player.yaw = Math.sin(time * 0.07) * 0.35;
      player.pitch = -0.17 + Math.sin(time * 0.11) * 0.04;
    }
    const bob = !player.fly && player.ground ? Math.sin(player.bob) * 0.05 * Math.min(1, speed / 6) : 0;
    const eye = state === 'title' ? 0 : EYE;
    camera.position.set(player.x, player.y + eye + bob, player.z);
    camera.rotation.set(player.pitch, player.yaw, 0);
    const fast = keys.has('ShiftLeft') || keys.has('ShiftRight') || runToggle;
    const fov = 70 + (player.fly ? (fast ? 14 : 7) : fast && speed > 8 ? 6 : 0);
    if (Math.abs(camera.fov - fov) > 0.05) {
      camera.fov = damp(camera.fov, fov, 4, dt);
      camera.updateProjectionMatrix();
    }
  }

  /* ─────────────────────────── main loop ─────────────────────────── */

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    if (!world) return;
    let speed = 0;
    if (state !== 'paused' && state !== 'journal' && state !== 'loading') {
      time += dt;
      timeWarp = state === 'play' && keys.has('KeyT') ? 40 : 1;
      dayT = (dayT + (dt * timeWarp) / DAY_LENGTH) % 1;
      if (state === 'play') {
        speed = updatePlayer(dt);
        journey.playTime += dt;
        updateDiscovery();
        saveT -= dt;
        if (saveT <= 0) {
          saveT = 8;
          saveJourney();
        }
      }
    }
    streamChunks(Math.floor(player.x / CHUNK), Math.floor(player.z / CHUNK), state === 'title' ? 6 : 5);
    updateCamera(dt, speed);
    const lit = updateSky(state === 'paused' || state === 'journal' ? 0 : dt);
    if (state !== 'paused' && state !== 'journal') {
      updateCars(dt, lit.night);
      updatePeople(dt, lit.night);
      updateBirds(dt, lit.day);
      updateParticles(dt, lit.night);
      updateAnimated(dt, lit.night);
      updateRain(dt);
      updateWater();
      if (state === 'play') ambience(dt, lit);
    }
    if (state === 'play' || state === 'paused') updateHud(dt, lit);

    renderer.setRenderTarget(rt);
    renderer.render(scene, camera);
    // Surface directions only: leave out the sky and the specks of light.
    const vis = [stars.visible, rain.visible, fireflies.visible];
    scene.overrideMaterial = normalMat;
    sky.visible = false;
    stars.visible = false;
    rain.visible = false;
    fireflies.visible = false;
    renderer.setRenderTarget(rtNormal);
    renderer.render(scene, camera);
    scene.overrideMaterial = null;
    sky.visible = true;
    [stars.visible, rain.visible, fireflies.visible] = vis;
    quad.material = cellMat;
    renderer.setRenderTarget(rtCells);
    renderer.render(quadScene, quadCam);
    quad.material = asciiMat;
    renderer.setRenderTarget(null);
    renderer.render(quadScene, quadCam);
  }

  function destroy() {
    if (journey) saveJourney();
    destroyed = true;
    cancelAnimationFrame(raf);
    timers.forEach((id) => clearTimeout(id));
    timers.clear();
    if (document.pointerLockElement === canvas) document.exitPointerLock?.();
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
    document.removeEventListener('visibilitychange', onVisibility);
    document.removeEventListener('pointerlockchange', onLockChange);
    ro.disconnect();
    clearChunks();
    shared.geos.forEach((g) => g.dispose());
    shared.mats.forEach((m) => m.dispose());
    carMesh.dispose();
    carLights.dispose();
    peopleMesh.dispose();
    peopleBody.dispose();
    birds.dispose();
    smoke.dispose();
    asciiMat.dispose();
    cellMat.dispose();
    quad.geometry.dispose();
    glyphTex?.dispose();
    rt.depthTexture.dispose();
    rt.dispose();
    rtNormal.dispose();
    rtCells.dispose();
    renderer.dispose();
    renderer.forceContextLoss?.();
    root.remove();
  }

  resize();
  showTitle();
  pickWeather();
  weather.kind = 'clear';
  weather.cloudT = 0.3;
  weather.rainT = 0;
  weather.fogT = 1;
  raf = requestAnimationFrame(frame);

  return { destroy };
}
