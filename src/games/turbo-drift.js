// ─── Turbo Drift — Deluxe ───
// Endless highway racer: weight-shifted steering, a real drift-scoring loop,
// near-miss bonuses that charge nitro, traffic, coins and a day/night cycle.

import * as THREE from 'three';
import { createGameShell } from '../core/gameShell.js';
import { sfx, haptic } from '../core/audio.js';
import { clamp, lerp, rand, randInt } from '../core/juice.js';

let shell = null;
let teardown = null;

const ROAD_W = 16;
const LANES = [-6, -2, 2, 6];
const SEG_LEN = 22;
const SEG_COUNT = 26;
const TRAFFIC_POOL = 14;
const COIN_POOL = 30;
const PROP_POOL = 26;

const BASE_SPEED = 44;
const MAX_SPEED = 128;
const NITRO_SPEED = 165;

const ZONES = [
  { name: 'Dusk Highway', fog: 0x1A1033, sky: 0x241546, road: 0x1C1B2E, line: 0xFFC93C, prop: 0x8B5CF6 },
  { name: 'Neon City',    fog: 0x050A1E, sky: 0x0A1636, road: 0x14182B, line: 0x22D3EE, prop: 0xF43F8E },
  { name: 'Desert Run',   fog: 0x2B1206, sky: 0x4A1F08, road: 0x2A2118, line: 0xFF9F2E, prop: 0xFFC93C },
  { name: 'Ice Pass',     fog: 0x0A1A24, sky: 0x11303F, road: 0x1B2630, line: 0x7DD3FC, prop: 0xE0F2FE },
];

export function initGame(container) {
  destroyGame();

  shell = createGameShell(container, {
    id: 'turbo-drift',
    title: 'Turbo Drift',
    accent: 'blue',
    accent2: 'cyan',
    tagline: 'Slide · Chain · Boost',
    howTo: [
      { key: '← →', label: 'Steer (A / D works too)' },
      { key: 'Hold', label: 'Keep steering at speed to drift and score' },
      { key: 'Space', label: 'Burn nitro — charged by drifts and near misses' },
      { key: 'Near miss', label: 'Shave past traffic for bonus points' },
    ],
    stats: [
      { key: 'score', label: 'Score' },
      { key: 'best', label: 'Best' },
      { key: 'speed', label: 'km/h' },
      { key: 'coins', label: 'Coins' },
    ],
    onStart: startRun,
    onRestart: startRun,
    onPause: () => { paused = true; },
    onResume: () => { paused = false; clock.getDelta(); },
    onDestroy: cleanup,
  });

  shell.setControls(`
    <div class="td-controls">
      <button class="td-btn td-left" data-steer="-1" aria-label="Steer left">◀</button>
      <button class="td-btn td-nitro" data-nitro aria-label="Nitro">
        <span>NITRO</span>
        <i class="td-nitro-fill" data-nitro-fill></i>
      </button>
      <button class="td-btn td-right" data-steer="1" aria-label="Steer right">▶</button>
    </div>
  `);

  /* ── renderer ── */
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(shell.stage.clientWidth || 800, shell.stage.clientHeight || 600);
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  shell.stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(72, 16 / 9, 0.1, 460);
  const clock = new THREE.Clock();

  let zone = ZONES[0];
  scene.background = new THREE.Color(zone.sky);
  scene.fog = new THREE.Fog(zone.fog, 70, 330);

  const hemi = new THREE.HemisphereLight(0xB8CCFF, 0x1A1030, 1.05);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 1.15);
  key.position.set(-18, 34, 22);
  scene.add(key);
  const rim = new THREE.PointLight(0x22D3EE, 2.2, 90);
  scene.add(rim);

  /* ── shared materials & geometry ── */
  const mat = {
    road: new THREE.MeshLambertMaterial({ color: zone.road }),
    line: new THREE.MeshBasicMaterial({ color: zone.line }),
    edge: new THREE.MeshBasicMaterial({ color: 0x22D3EE }),
    ground: new THREE.MeshLambertMaterial({ color: 0x0B0D18 }),
    coin: new THREE.MeshBasicMaterial({ color: 0xFFC93C }),
    prop: new THREE.MeshLambertMaterial({ color: zone.prop }),
    glass: new THREE.MeshLambertMaterial({ color: 0x0E1526 }),
  };
  const TRAFFIC_COLORS = [0xFF5F4D, 0x1FC98B, 0xFFC93C, 0xF43F8E, 0xE7EAF4, 0xA78BFA];

  const geo = {
    road: new THREE.PlaneGeometry(ROAD_W, SEG_LEN),
    ground: new THREE.PlaneGeometry(260, SEG_LEN),
    line: new THREE.PlaneGeometry(0.34, SEG_LEN * 0.42),
    edge: new THREE.BoxGeometry(0.3, 0.34, SEG_LEN),
    coin: new THREE.CylinderGeometry(0.62, 0.62, 0.14, 14),
    body: new THREE.BoxGeometry(1.9, 0.62, 4.1),
    cabin: new THREE.BoxGeometry(1.5, 0.52, 1.9),
    wheel: new THREE.CylinderGeometry(0.34, 0.34, 0.26, 12),
    prop: new THREE.BoxGeometry(1.1, 7.5, 1.1),
  };

  function buildCar(color, isPlayer) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(geo.body, new THREE.MeshLambertMaterial({ color }));
    body.position.y = 0.52;
    g.add(body);

    const cabin = new THREE.Mesh(geo.cabin, mat.glass);
    cabin.position.set(0, 0.96, isPlayer ? -0.25 : 0.25);
    g.add(cabin);

    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x11131F });
    [[-0.98, 1.42], [0.98, 1.42], [-0.98, -1.42], [0.98, -1.42]].forEach(([x, z]) => {
      const w = new THREE.Mesh(geo.wheel, wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(x, 0.34, z);
      g.add(w);
    });

    // Light bar: headlights forward for the player, tail lights for traffic.
    const lightGeo = new THREE.BoxGeometry(1.5, 0.14, 0.1);
    const lightMat = new THREE.MeshBasicMaterial({ color: isPlayer ? 0xFFFFFF : 0xFF3B3B });
    const lights = new THREE.Mesh(lightGeo, lightMat);
    lights.position.set(0, 0.62, isPlayer ? -2.02 : 2.02);
    g.add(lights);

    return g;
  }

  /* ── world objects ── */
  const segments = [];
  for (let i = 0; i < SEG_COUNT; i++) {
    const g = new THREE.Group();

    const road = new THREE.Mesh(geo.road, mat.road);
    road.rotation.x = -Math.PI / 2;
    g.add(road);

    const ground = new THREE.Mesh(geo.ground, mat.ground);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.14;
    g.add(ground);

    [-2, 2].forEach((x) => {
      const line = new THREE.Mesh(geo.line, mat.line);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x + (x > 0 ? 2 : -2), 0.02, 0);
      g.add(line);
    });

    [-ROAD_W / 2, ROAD_W / 2].forEach((x) => {
      const e = new THREE.Mesh(geo.edge, mat.edge);
      e.position.set(x, 0.17, 0);
      g.add(e);
    });

    g.position.z = -i * SEG_LEN;
    scene.add(g);
    segments.push(g);
  }

  const props = [];
  for (let i = 0; i < PROP_POOL; i++) {
    const p = new THREE.Mesh(geo.prop, mat.prop);
    p.position.set(0, -50, 0);
    scene.add(p);
    props.push({ mesh: p, active: false });
  }

  const traffic = [];
  for (let i = 0; i < TRAFFIC_POOL; i++) {
    const car = buildCar(TRAFFIC_COLORS[i % TRAFFIC_COLORS.length], false);
    car.position.set(0, -60, 0);
    scene.add(car);
    traffic.push({ mesh: car, active: false, lane: 0, speed: 0, passed: false, nearMissed: false });
  }

  const coins = [];
  for (let i = 0; i < COIN_POOL; i++) {
    const c = new THREE.Mesh(geo.coin, mat.coin);
    c.rotation.x = Math.PI / 2;
    c.position.set(0, -60, 0);
    scene.add(c);
    coins.push({ mesh: c, active: false });
  }

  const player = buildCar(0xFF5F4D, true);
  scene.add(player);

  // Simple sprite-free speed streaks for the nitro effect.
  const streakGeo = new THREE.BufferGeometry();
  const STREAKS = 90;
  const streakPos = new Float32Array(STREAKS * 6);
  streakGeo.setAttribute('position', new THREE.BufferAttribute(streakPos, 3));
  const streakMat = new THREE.LineBasicMaterial({ color: 0x9BE7FF, transparent: true, opacity: 0 });
  const streaks = new THREE.LineSegments(streakGeo, streakMat);
  scene.add(streaks);

  /* ── state ── */
  let distance = 0;
  let speed = BASE_SPEED;
  let lateral = 0;
  let lateralVel = 0;
  let steerInput = 0;
  let touchSteer = 0;
  let driftAmount = 0;
  let driftTimer = 0;
  let driftScore = 0;
  let driftCombo = 0;
  let bestDriftCombo = 0;
  let nitro = 0;
  let nitroActive = 0;
  let nearMisses = 0;
  let coinsGot = 0;
  let paused = false;
  let running = false;
  let over = false;
  let rafId = null;
  let zoneIndex = 0;
  let spawnTimer = 0;
  let coinTimer = 0;
  let shakeAmt = 0;
  let scoreAcc = 0;

  const keys = { left: false, right: false, nitro: false };

  function resize() {
    const w = shell.stage.clientWidth || 800;
    const h = shell.stage.clientHeight || 600;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(shell.stage);

  /* ── zone theming ── */
  function applyZone(index) {
    zoneIndex = index;
    zone = ZONES[index % ZONES.length];
    scene.background = new THREE.Color(zone.sky);
    scene.fog.color = new THREE.Color(zone.fog);
    mat.road.color.setHex(zone.road);
    mat.line.color.setHex(zone.line);
    mat.prop.color.setHex(zone.prop);
    shell.toast(`Entering ${zone.name}`, 'good');
    sfx.reward();
  }

  /* ── run ── */
  function startRun() {
    distance = 0;
    speed = BASE_SPEED;
    lateral = 0;
    lateralVel = 0;
    steerInput = 0;
    touchSteer = 0;
    driftAmount = 0;
    driftTimer = 0;
    driftScore = 0;
    driftCombo = 0;
    bestDriftCombo = 0;
    nitro = 0;
    nitroActive = 0;
    nearMisses = 0;
    coinsGot = 0;
    spawnTimer = 0.9;
    coinTimer = 1.6;
    shakeAmt = 0;
    scoreAcc = 0;
    paused = false;
    over = false;
    running = true;

    traffic.forEach((t) => { t.active = false; t.mesh.position.y = -60; });
    coins.forEach((c) => { c.active = false; c.mesh.position.y = -60; });
    props.forEach((p) => { p.active = false; p.mesh.position.y = -50; });
    segments.forEach((s, i) => { s.position.z = -i * SEG_LEN; });

    player.position.set(0, 0, 0);
    player.rotation.set(0, 0, 0);
    if (zoneIndex !== 0) {
      zoneIndex = 0;
      zone = ZONES[0];
      scene.background = new THREE.Color(zone.sky);
      scene.fog.color = new THREE.Color(zone.fog);
      mat.road.color.setHex(zone.road);
      mat.line.color.setHex(zone.line);
      mat.prop.color.setHex(zone.prop);
    }

    shell.setStat('speed', 0);
    shell.setCombo(0);
    clock.getDelta();
    if (!rafId) rafId = requestAnimationFrame(frame);
  }

  /* ── spawning ── */
  function spawnTraffic() {
    const slot = traffic.find((t) => !t.active);
    if (!slot) return;
    const lane = LANES[randInt(0, LANES.length - 1)];
    // Do not drop a car right on top of another in the same lane.
    const tooClose = traffic.some((t) => t.active && Math.abs(t.lane - lane) < 1 && t.mesh.position.z > -330);
    if (tooClose) return;

    slot.active = true;
    slot.lane = lane;
    slot.passed = false;
    slot.nearMissed = false;
    slot.speed = rand(0.32, 0.6) * speed;
    slot.mesh.position.set(lane, 0, -330);
    slot.mesh.rotation.y = 0;
  }

  function spawnCoinRun() {
    const lane = LANES[randInt(0, LANES.length - 1)];
    const count = randInt(3, 6);
    let placed = 0;
    for (const c of coins) {
      if (c.active) continue;
      c.active = true;
      c.mesh.position.set(lane, 1.1, -320 - placed * 7);
      placed++;
      if (placed >= count) break;
    }
  }

  function spawnProp() {
    const slot = props.find((p) => !p.active);
    if (!slot) return;
    slot.active = true;
    const side = Math.random() < 0.5 ? -1 : 1;
    slot.mesh.position.set(side * rand(ROAD_W / 2 + 3, ROAD_W / 2 + 16), 3.6, -340);
    slot.mesh.scale.y = rand(0.6, 1.9);
  }

  /* ── input ── */
  function onKeyDown(e) {
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') { keys.left = true; e.preventDefault(); }
    if (k === 'arrowright' || k === 'd') { keys.right = true; e.preventDefault(); }
    if (e.code === 'Space') { keys.nitro = true; e.preventDefault(); }
  }
  function onKeyUp(e) {
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') keys.left = false;
    if (k === 'arrowright' || k === 'd') keys.right = false;
    if (e.code === 'Space') keys.nitro = false;
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  const controls = container.querySelector('.td-controls');
  function onCtrlDown(e) {
    const steer = e.target.closest('[data-steer]');
    const nitroBtn = e.target.closest('[data-nitro]');
    if (steer) { e.preventDefault(); touchSteer = Number(steer.dataset.steer); }
    if (nitroBtn) { e.preventDefault(); keys.nitro = true; }
  }
  function onCtrlUp() {
    touchSteer = 0;
    keys.nitro = false;
  }
  controls?.addEventListener('pointerdown', onCtrlDown);
  window.addEventListener('pointerup', onCtrlUp);
  window.addEventListener('pointercancel', onCtrlUp);

  // Drag anywhere on the canvas to steer on touch devices.
  let dragId = null;
  let dragX = 0;
  function onCanvasDown(e) {
    if (e.target.closest('.gs-overlay, .gs-hud, button, a')) return;
    dragId = e.pointerId;
    dragX = e.clientX;
  }
  function onCanvasMove(e) {
    if (dragId !== e.pointerId) return;
    const dx = e.clientX - dragX;
    touchSteer = clamp(dx / 60, -1, 1);
  }
  function onCanvasUp(e) {
    if (dragId !== e.pointerId) return;
    dragId = null;
    touchSteer = 0;
  }
  renderer.domElement.addEventListener('pointerdown', onCanvasDown);
  renderer.domElement.addEventListener('pointermove', onCanvasMove);
  renderer.domElement.addEventListener('pointerup', onCanvasUp);

  /* ── drift scoring ── */
  function bankDrift() {
    if (driftScore < 60) { driftScore = 0; driftTimer = 0; return; }
    driftCombo++;
    bestDriftCombo = Math.max(bestDriftCombo, driftCombo);
    const mult = 1 + Math.min(driftCombo, 10) * 0.35;
    const gained = Math.round(driftScore * mult);
    shell.addScore(gained, { pop: true });
    shell.setCombo(driftCombo + 1, 1);
    shell.toast(`Drift banked +${gained.toLocaleString()}`, 'good');
    nitro = clamp(nitro + driftScore / 900, 0, 1);
    sfx.combo(driftCombo);
    driftScore = 0;
    driftTimer = 0;
  }

  function crash(what) {
    if (over) return;
    over = true;
    running = false;
    shakeAmt = 1;
    sfx.crash();
    haptic([40, 60, 80]);
    setTimeout(() => {
      shell.gameOver({
        bestCombo: bestDriftCombo + 1,
        distance: Math.floor(distance),
        eyebrow: what === 'wall' ? 'Into the barrier' : 'Rear-ended',
        stats: [
          { label: 'Distance', value: `${Math.floor(distance)} m` },
          { label: 'Near misses', value: nearMisses },
          { label: 'Top speed', value: `${Math.round(speed * 2.4)} km/h` },
        ],
      });
    }, 620);
  }

  /* ── update ── */
  function update(dt) {
    const d = Math.min(dt, 0.05);

    // Steering input with smoothing so it feels weighted, not twitchy.
    const rawSteer = (keys.left ? -1 : 0) + (keys.right ? 1 : 0) + touchSteer;
    steerInput = lerp(steerInput, clamp(rawSteer, -1, 1), 1 - Math.pow(0.0001, d));

    // Nitro
    if (keys.nitro && nitro > 0.02 && nitroActive <= 0) {
      nitroActive = 1.6;
      nitro = Math.max(0, nitro - 0.34);
      shell.addPowerup('nitro', { label: 'Nitro', icon: '🔥', color: '#22D3EE', duration: 1600 });
      sfx.powerup();
      haptic(20);
    }
    if (nitroActive > 0) nitroActive -= d;

    const targetSpeed = nitroActive > 0
      ? NITRO_SPEED
      : Math.min(MAX_SPEED, BASE_SPEED + distance * 0.016);
    speed = lerp(speed, targetSpeed, 1 - Math.pow(nitroActive > 0 ? 0.0002 : 0.02, d));

    distance += speed * d;
    shell.setDistance(distance);

    // Lateral physics: grip falls off with speed, which is what creates drift.
    const grip = clamp(1.25 - speed / 190, 0.36, 1);
    lateralVel += steerInput * 62 * d * grip;
    lateralVel *= Math.pow(0.055, d);
    lateral += lateralVel * d;

    const limit = ROAD_W / 2 - 1.2;
    if (lateral < -limit || lateral > limit) {
      lateral = clamp(lateral, -limit, limit);
      lateralVel *= -0.25;
      return crash('wall');
    }

    // Drift is the gap between where the car points and where it travels.
    const slip = Math.abs(lateralVel) / 26;
    const wantDrift = slip > 0.5 && speed > BASE_SPEED * 1.15 && Math.abs(steerInput) > 0.35;
    driftAmount = lerp(driftAmount, wantDrift ? clamp(slip, 0, 1.5) : 0, 1 - Math.pow(0.004, d));

    if (driftAmount > 0.35) {
      driftTimer += d;
      driftScore += driftAmount * speed * d * 2.4;
      nitro = clamp(nitro + d * 0.1, 0, 1);
    } else if (driftTimer > 0) {
      bankDrift();
    }

    // Losing the drift chain after a quiet stretch keeps pressure on.
    if (driftAmount <= 0.35 && driftCombo > 0) {
      driftTimer -= d * 0.35;
      if (driftTimer < -2.4) {
        driftCombo = 0;
        driftTimer = 0;
        shell.setCombo(0);
      }
    }

    // Passive distance scoring, accumulated as a float so slow frames do not
    // round away the fractional points.
    scoreAcc += speed * d * 0.9 * (nitroActive > 0 ? 1.6 : 1);
    if (scoreAcc >= 1) {
      const whole = Math.floor(scoreAcc);
      scoreAcc -= whole;
      shell.addScore(whole);
    }
    shell.setStat('speed', Math.round(speed * 2.4));

    // ── scroll the world ──
    const dz = speed * d;
    segments.forEach((s) => {
      s.position.z += dz;
      if (s.position.z > SEG_LEN) s.position.z -= SEG_COUNT * SEG_LEN;
    });

    props.forEach((p) => {
      if (!p.active) return;
      p.mesh.position.z += dz;
      if (p.mesh.position.z > 22) { p.active = false; p.mesh.position.y = -50; }
    });

    traffic.forEach((t) => {
      if (!t.active) return;
      t.mesh.position.z += (speed - t.speed) * d;

      const dzAbs = Math.abs(t.mesh.position.z);
      const dxAbs = Math.abs(t.lane - lateral);

      if (dzAbs < 3.4 && dxAbs < 2.1) {
        return crash('traffic');
      }

      // Near miss: close pass without contact.
      if (!t.nearMissed && dzAbs < 4.2 && dxAbs < 3.4) {
        t.nearMissed = true;
        nearMisses++;
        const bonus = Math.round(120 + speed);
        shell.addScore(bonus, { pop: true });
        nitro = clamp(nitro + 0.12, 0, 1);
        shell.toast(`Near miss +${bonus}`, 'warn');
        sfx.pickup();
        haptic(10);
      }

      if (t.mesh.position.z > 26) { t.active = false; t.mesh.position.y = -60; }
    });

    coins.forEach((c) => {
      if (!c.active) return;
      c.mesh.position.z += dz;
      c.mesh.rotation.z += d * 6;
      if (Math.abs(c.mesh.position.z) < 2.6 && Math.abs(c.mesh.position.x - lateral) < 1.9) {
        c.active = false;
        c.mesh.position.y = -60;
        coinsGot++;
        shell.addCoins(1);
        shell.addScore(25);
        sfx.coin();
      } else if (c.mesh.position.z > 22) {
        c.active = false;
        c.mesh.position.y = -60;
      }
    });

    // ── spawns ──
    spawnTimer -= d;
    if (spawnTimer <= 0) {
      spawnTraffic();
      spawnProp();
      spawnTimer = clamp(1.5 - distance / 9000, 0.42, 1.5) * rand(0.75, 1.3);
    }
    coinTimer -= d;
    if (coinTimer <= 0) {
      spawnCoinRun();
      coinTimer = rand(2.6, 5.2);
    }

    // ── zones every 2500m ──
    const wantZone = Math.floor(distance / 2500) % ZONES.length;
    if (wantZone !== zoneIndex) applyZone(wantZone);

    // ── car & camera pose ──
    player.position.x = lerp(player.position.x, lateral, 1 - Math.pow(0.0005, d));
    player.rotation.y = lerp(player.rotation.y, -steerInput * 0.22 - Math.sign(lateralVel) * driftAmount * 0.34, 1 - Math.pow(0.002, d));
    player.rotation.z = lerp(player.rotation.z, -steerInput * 0.09, 1 - Math.pow(0.002, d));

    if (shakeAmt > 0) shakeAmt = Math.max(0, shakeAmt - d * 2);
    const sx = shakeAmt * rand(-1, 1) * 0.9;
    const sy = shakeAmt * rand(-1, 1) * 0.6;

    const camLag = nitroActive > 0 ? 9.4 : 8.2;
    camera.position.x = lerp(camera.position.x, lateral * 0.62 + sx, 1 - Math.pow(0.002, d));
    camera.position.y = lerp(camera.position.y, 4.3 + (nitroActive > 0 ? 0.5 : 0) + sy, 1 - Math.pow(0.01, d));
    camera.position.z = camLag;
    camera.lookAt(lateral * 0.35, 1.3, -26);
    camera.fov = lerp(camera.fov, nitroActive > 0 ? 88 : 72 + driftAmount * 6, 1 - Math.pow(0.01, d));
    camera.updateProjectionMatrix();

    rim.position.set(lateral, 3, 4);
    rim.color.setHex(nitroActive > 0 ? 0x22D3EE : driftAmount > 0.35 ? 0xFFC93C : 0x22D3EE);
    rim.intensity = nitroActive > 0 ? 5 : 2.2 + driftAmount * 2;

    // Speed streaks during nitro.
    const streakAlpha = clamp((speed - MAX_SPEED * 0.82) / 60, 0, 0.75);
    streakMat.opacity = streakAlpha;
    if (streakAlpha > 0.01) {
      for (let i = 0; i < STREAKS; i++) {
        const o = i * 6;
        if (streakPos[o + 2] > 12 || streakPos[o + 2] === 0) {
          streakPos[o] = rand(-30, 30);
          streakPos[o + 1] = rand(0.5, 14);
          streakPos[o + 2] = rand(-260, -40);
          streakPos[o + 3] = streakPos[o];
          streakPos[o + 4] = streakPos[o + 1];
          streakPos[o + 5] = streakPos[o + 2] + 9;
        }
        streakPos[o + 2] += dz * 1.5;
        streakPos[o + 5] += dz * 1.5;
      }
      streakGeo.attributes.position.needsUpdate = true;
    }

    // Live drift readout drives the nitro button fill.
    const fill = container.querySelector('[data-nitro-fill]');
    if (fill) fill.style.transform = `scaleY(${nitro.toFixed(3)})`;
  }

  function frame() {
    rafId = requestAnimationFrame(frame);
    const dt = clock.getDelta();
    if (running && !paused && !over) update(dt);
    renderer.render(scene, camera);
  }
  rafId = requestAnimationFrame(frame);

  function cleanup() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    ro.disconnect();
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('pointerup', onCtrlUp);
    window.removeEventListener('pointercancel', onCtrlUp);
    controls?.removeEventListener('pointerdown', onCtrlDown);
    renderer.domElement.removeEventListener('pointerdown', onCanvasDown);
    renderer.domElement.removeEventListener('pointermove', onCanvasMove);
    renderer.domElement.removeEventListener('pointerup', onCanvasUp);

    // Release GPU resources — this scene holds a lot of them.
    Object.values(geo).forEach((g) => g.dispose());
    Object.values(mat).forEach((m) => m.dispose());
    streakGeo.dispose();
    streakMat.dispose();
    scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.geometry?.dispose?.();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose?.());
        else obj.material?.dispose?.();
      }
    });
    renderer.dispose();
    renderer.forceContextLoss?.();
  }

  teardown = cleanup;
}

export function destroyGame() {
  if (teardown) { teardown(); teardown = null; }
  if (shell) { shell.destroy(); shell = null; }
}
