import * as THREE from 'three';

export interface SparkEmitterInstance {
  points: THREE.Points;
  triggerBurst: (
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    intensity: number
  ) => void;
  update: (dt: number) => void;
}

export function createSparkEmitter(): SparkEmitterInstance {
  const MAX_SPARKS = 250;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(MAX_SPARKS * 3);
  const colors = new Float32Array(MAX_SPARKS * 3);

  // Hidden initially under the scene
  for (let i = 0; i < MAX_SPARKS; i++) {
    positions[i * 3] = 0;
    positions[i * 3 + 1] = -999;
    positions[i * 3 + 2] = 0;

    colors[i * 3] = 1.0;
    colors[i * 3 + 1] = 0.65;
    colors[i * 3 + 2] = 0.15;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.28,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);

  interface SparkParticle {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    life: number;
    maxLife: number;
    active: boolean;
  }

  const sparks: SparkParticle[] = [];
  for (let i = 0; i < MAX_SPARKS; i++) {
    sparks.push({
      x: 0,
      y: -999,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      maxLife: 0.35,
      active: false,
    });
  }

  let nextIndex = 0;

  function triggerBurst(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    intensity: number
  ) {
    const count = Math.min(60, Math.floor(15 + intensity * 45));
    for (let c = 0; c < count; c++) {
      const p = sparks[nextIndex];
      nextIndex = (nextIndex + 1) % MAX_SPARKS;

      p.active = true;
      p.x = origin.x + (Math.random() - 0.5) * 0.3;
      p.y = origin.y + Math.random() * 0.2;
      p.z = origin.z + (Math.random() - 0.5) * 0.3;

      // Spray velocity primarily along normal + backward spray + random spray
      const speed = 6 + Math.random() * (12 + intensity * 15);
      p.vx = direction.x * speed * 0.5 + (Math.random() - 0.5) * 8;
      p.vy = 2.0 + Math.random() * 6.5; // upward bounce
      p.vz = direction.z * speed * 0.5 + (Math.random() - 0.5) * 8;

      p.maxLife = 0.15 + Math.random() * 0.25;
      p.life = p.maxLife;
    }
  }

  function update(dt: number) {
    const posArr = geometry.attributes.position.array as Float32Array;
    const colArr = geometry.attributes.color.array as Float32Array;
    let anyActive = false;

    for (let i = 0; i < MAX_SPARKS; i++) {
      const p = sparks[i];
      if (!p.active) continue;

      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        posArr[i * 3 + 1] = -999;
        continue;
      }

      anyActive = true;
      // Gravity deceleration on sparks
      p.vy -= 18.0 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;

      // Ground bounce
      if (p.y < 0.05) {
        p.y = 0.05;
        p.vy = -p.vy * 0.35;
        p.vx *= 0.7;
        p.vz *= 0.7;
      }

      posArr[i * 3] = p.x;
      posArr[i * 3 + 1] = p.y;
      posArr[i * 3 + 2] = p.z;

      // Fade from incandescent white-yellow to deep orange-red
      const ratio = p.life / p.maxLife;
      colArr[i * 3] = 1.0;
      colArr[i * 3 + 1] = 0.2 + ratio * 0.7;
      colArr[i * 3 + 2] = ratio * 0.4;
    }

    if (anyActive) {
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
    }
  }

  return {
    points,
    triggerBurst,
    update,
  };
}
