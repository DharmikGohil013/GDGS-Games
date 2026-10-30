import * as THREE from 'three';

/**
 * Creates procedural textures without any external image files.
 */
function createFeatherTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Warm golden yellow gradient base
  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, '#ffe066');
  grad.addColorStop(0.5, '#f59f00');
  grad.addColorStop(1, '#e67700');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Subtle feather barbule strokes
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 40; i++) {
    const y = Math.random() * 256;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(80, y - 10, 160, y + 15, 256, y);
    ctx.stroke();
  }

  // Darker accent strokes
  ctx.strokeStyle = 'rgba(180, 70, 0, 0.15)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 30; i++) {
    const y = Math.random() * 256;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(90, y + 10, 170, y - 10, 256, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createPipeMetalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Industrial metallic emerald green with subtle vertical streaks
  const grad = ctx.createLinearGradient(0, 0, 256, 0);
  grad.addColorStop(0, '#2b8a3e');
  grad.addColorStop(0.3, '#51cf66');
  grad.addColorStop(0.7, '#37b24d');
  grad.addColorStop(1, '#237032');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Metal sheen highlights and brushed texture
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 2;
  for (let x = 10; x < 256; x += 18) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }

  // Subtle riveted seam lines
  ctx.strokeStyle = 'rgba(0, 40, 10, 0.25)';
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, 248, 248);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createGroundTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Top lush grass band
  const grassGrad = ctx.createLinearGradient(0, 0, 0, 80);
  grassGrad.addColorStop(0, '#5c940d');
  grassGrad.addColorStop(0.3, '#74b816');
  grassGrad.addColorStop(1, '#406f0b');
  ctx.fillStyle = grassGrad;
  ctx.fillRect(0, 0, 512, 80);

  // Little grass blades
  ctx.fillStyle = '#94d82d';
  for (let i = 0; i < 512; i += 6) {
    const h = 8 + Math.random() * 12;
    ctx.beginPath();
    ctx.moveTo(i, 80);
    ctx.lineTo(i + 3, 80 - h);
    ctx.lineTo(i + 6, 80);
    ctx.fill();
  }

  // Earth/Dirt cross section
  const dirtGrad = ctx.createLinearGradient(0, 80, 0, 256);
  dirtGrad.addColorStop(0, '#b07038');
  dirtGrad.addColorStop(0.6, '#864f23');
  dirtGrad.addColorStop(1, '#563113');
  ctx.fillStyle = dirtGrad;
  ctx.fillRect(0, 80, 512, 176);

  // Pebbles and soil texture
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * 512;
    const y = 85 + Math.random() * 165;
    const r = 2 + Math.random() * 4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export interface RealisticBirdParts {
  root: THREE.Group;
  bodyMesh: THREE.Mesh;
  leftWingGroup: THREE.Group;
  rightWingGroup: THREE.Group;
  tailGroup: THREE.Group;
  headGroup: THREE.Group;
  leftEyePupil: THREE.Mesh;
  rightEyePupil: THREE.Mesh;
}

/**
 * Builds a highly detailed composite 3D Bird with feathered materials,
 * articulated wings, realistic eyes with corneal specularity, multi-part beak,
 * and feather tail.
 */
export function createRealisticBird(): RealisticBirdParts {
  const root = new THREE.Group();
  const featherTexture = createFeatherTexture();

  // 1. Primary Bird Body Materials
  const plumageMaterial = new THREE.MeshStandardMaterial({
    map: featherTexture,
    color: 0xffe066,
    roughness: 0.55,
    metalness: 0.1,
  });

  const breastMaterial = new THREE.MeshStandardMaterial({
    color: 0xfff3bf, // Softer cream belly feathers
    roughness: 0.65,
    metalness: 0.05,
  });

  const beakMaterial = new THREE.MeshStandardMaterial({
    color: 0xf76707, // Vivid bright orange beak
    roughness: 0.3,
    metalness: 0.15,
  });

  const eyeWhiteMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.15,
    metalness: 0.0,
  });

  const pupilMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.05,
    metalness: 0.8,
  });

  const corneaMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.45,
    roughness: 0.05,
    metalness: 0.1,
    clearcoat: 1.0,
  });

  // 2. Main Torso (Aerodynamic egg shape)
  const bodyGeo = new THREE.SphereGeometry(0.44, 32, 24);
  bodyGeo.scale(1.2, 0.95, 0.85); // Elongate along X (forward), slightly tapered
  const bodyMesh = new THREE.Mesh(bodyGeo, plumageMaterial);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  root.add(bodyMesh);

  // Soft downy belly/chest plumage
  const bellyGeo = new THREE.SphereGeometry(0.38, 24, 16);
  bellyGeo.scale(1.05, 0.8, 0.75);
  const bellyMesh = new THREE.Mesh(bellyGeo, breastMaterial);
  bellyMesh.position.set(0.08, -0.12, 0);
  root.add(bellyMesh);

  // 3. Head & Crest
  const headGroup = new THREE.Group();
  headGroup.position.set(0.32, 0.22, 0);

  const headGeo = new THREE.SphereGeometry(0.32, 24, 20);
  headGeo.scale(1.05, 1.0, 0.9);
  const headMesh = new THREE.Mesh(headGeo, plumageMaterial);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Feathery head crest tuft
  const crestGeo = new THREE.ConeGeometry(0.09, 0.25, 12);
  crestGeo.rotateZ(-0.4);
  const crestMesh = new THREE.Mesh(crestGeo, plumageMaterial);
  crestMesh.position.set(-0.1, 0.33, 0);
  headGroup.add(crestMesh);

  // Second smaller tuft
  const crestGeo2 = new THREE.ConeGeometry(0.06, 0.18, 12);
  crestGeo2.rotateZ(-0.6);
  const crestMesh2 = new THREE.Mesh(crestGeo2, plumageMaterial);
  crestMesh2.position.set(-0.2, 0.28, 0);
  headGroup.add(crestMesh2);

  // 4. Realistic Eyes (Left & Right)
  const eyeRadius = 0.12;
  const eyeGeo = new THREE.SphereGeometry(eyeRadius, 16, 16);
  const pupilGeo = new THREE.SphereGeometry(eyeRadius * 0.55, 16, 16);
  const corneaGeo = new THREE.SphereGeometry(eyeRadius * 1.08, 16, 16);

  // Left Eye (+Z side)
  const leftEyeGroup = new THREE.Group();
  leftEyeGroup.position.set(0.18, 0.08, 0.22);
  const leftSclera = new THREE.Mesh(eyeGeo, eyeWhiteMaterial);
  const leftPupil = new THREE.Mesh(pupilGeo, pupilMaterial);
  leftPupil.position.set(0.06, 0.02, 0.04);
  const leftCornea = new THREE.Mesh(corneaGeo, corneaMaterial);
  leftEyeGroup.add(leftSclera, leftPupil, leftCornea);

  // Right Eye (-Z side)
  const rightEyeGroup = new THREE.Group();
  rightEyeGroup.position.set(0.18, 0.08, -0.22);
  const rightSclera = new THREE.Mesh(eyeGeo, eyeWhiteMaterial);
  const rightPupil = new THREE.Mesh(pupilGeo, pupilMaterial);
  rightPupil.position.set(0.06, 0.02, -0.04);
  const rightCornea = new THREE.Mesh(corneaGeo, corneaMaterial);
  rightEyeGroup.add(rightSclera, rightPupil, rightCornea);

  headGroup.add(leftEyeGroup, rightEyeGroup);

  // Cheek blush on sides (+Z and -Z)
  const blushMat = new THREE.MeshBasicMaterial({
    color: 0xff6b6b,
    transparent: true,
    opacity: 0.35,
  });
  const blushGeo = new THREE.CircleGeometry(0.08, 12);
  const leftBlush = new THREE.Mesh(blushGeo, blushMat);
  leftBlush.position.set(0.18, -0.05, 0.28);
  leftBlush.rotation.y = 0.2;
  const rightBlush = new THREE.Mesh(blushGeo, blushMat);
  rightBlush.position.set(0.18, -0.05, -0.28);
  rightBlush.rotation.y = -0.2;
  headGroup.add(leftBlush, rightBlush);

  // 5. Expressive Realistic Beak (Upper and lower jaw)
  const beakUpperGeo = new THREE.ConeGeometry(0.13, 0.35, 16);
  beakUpperGeo.rotateZ(-Math.PI / 2);
  beakUpperGeo.scale(1.0, 0.85, 1.2);
  const beakUpperMesh = new THREE.Mesh(beakUpperGeo, beakMaterial);
  beakUpperMesh.position.set(0.38, 0.02, 0);
  beakUpperMesh.castShadow = true;
  headGroup.add(beakUpperMesh);

  // Tiny beak nostrils
  const nostrilMat = new THREE.MeshBasicMaterial({ color: 0x5a2100 });
  const nostrilGeo = new THREE.SphereGeometry(0.015, 8, 8);
  const leftNostril = new THREE.Mesh(nostrilGeo, nostrilMat);
  leftNostril.position.set(0.32, 0.07, 0.04);
  const rightNostril = new THREE.Mesh(nostrilGeo, nostrilMat);
  rightNostril.position.set(0.32, 0.07, -0.04);
  headGroup.add(leftNostril, rightNostril);

  const beakLowerGeo = new THREE.ConeGeometry(0.1, 0.26, 16);
  beakLowerGeo.rotateZ(-Math.PI / 2);
  beakLowerGeo.scale(0.9, 0.7, 1.1);
  const beakLowerMesh = new THREE.Mesh(beakLowerGeo, beakMaterial);
  beakLowerMesh.position.set(0.32, -0.08, 0);
  headGroup.add(beakLowerMesh);

  root.add(headGroup);

  // 6. Articulated Wings (Left & Right)
  // Left Wing Group (+Z)
  const leftWingGroup = new THREE.Group();
  leftWingGroup.position.set(0.0, 0.05, 0.36);

  // Wing primary feather plate
  const wingGeo = new THREE.BoxGeometry(0.52, 0.06, 0.34);
  wingGeo.translate(-0.1, 0, 0.15); // Offset pivot to shoulder
  const wingMesh = new THREE.Mesh(wingGeo, plumageMaterial);
  wingMesh.rotation.y = 0.15;
  wingMesh.castShadow = true;
  leftWingGroup.add(wingMesh);

  // Wing feather tips (layered fan)
  for (let i = 0; i < 3; i++) {
    const tipGeo = new THREE.ConeGeometry(0.08, 0.25, 8);
    tipGeo.rotateX(Math.PI / 2);
    tipGeo.rotateZ(0.2 + i * 0.15);
    const tipMesh = new THREE.Mesh(tipGeo, plumageMaterial);
    tipMesh.position.set(-0.25 - i * 0.06, -0.02, 0.2 + i * 0.06);
    leftWingGroup.add(tipMesh);
  }

  // Right Wing Group (-Z)
  const rightWingGroup = new THREE.Group();
  rightWingGroup.position.set(0.0, 0.05, -0.36);

  const rightWingGeo = new THREE.BoxGeometry(0.52, 0.06, 0.34);
  rightWingGeo.translate(-0.1, 0, -0.15); // Offset pivot
  const rightWingMesh = new THREE.Mesh(rightWingGeo, plumageMaterial);
  rightWingMesh.rotation.y = -0.15;
  rightWingMesh.castShadow = true;
  rightWingGroup.add(rightWingMesh);

  for (let i = 0; i < 3; i++) {
    const tipGeo = new THREE.ConeGeometry(0.08, 0.25, 8);
    tipGeo.rotateX(-Math.PI / 2);
    tipGeo.rotateZ(0.2 + i * 0.15);
    const tipMesh = new THREE.Mesh(tipGeo, plumageMaterial);
    tipMesh.position.set(-0.25 - i * 0.06, -0.02, -0.2 - i * 0.06);
    rightWingGroup.add(tipMesh);
  }

  root.add(leftWingGroup, rightWingGroup);

  // 7. Layered Feather Tail
  const tailGroup = new THREE.Group();
  tailGroup.position.set(-0.48, 0.05, 0);

  for (let i = -1; i <= 1; i++) {
    const featherGeo = new THREE.BoxGeometry(0.38, 0.04, 0.12);
    featherGeo.translate(-0.18, 0, 0);
    const featherMesh = new THREE.Mesh(featherGeo, plumageMaterial);
    featherMesh.rotation.y = i * 0.25;
    featherMesh.rotation.z = 0.18;
    tailGroup.add(featherMesh);
  }
  root.add(tailGroup);

  // 8. Contact shadow disc underneath bird
  const shadowGeo = new THREE.CircleGeometry(0.48, 20);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.position.y = -0.65;
  root.add(shadowMesh);

  return {
    root,
    bodyMesh,
    leftWingGroup,
    rightWingGroup,
    tailGroup,
    headGroup,
    leftEyePupil: leftPupil,
    rightEyePupil: rightPupil,
  };
}

/**
 * Creates 3D Pipe pair with metallic finish, riveted rim collar, and decorative accents.
 */
export function createPipePairMesh(): {
  group: THREE.Group;
  topPipeMesh: THREE.Mesh;
  topRimMesh: THREE.Mesh;
  bottomPipeMesh: THREE.Mesh;
  bottomRimMesh: THREE.Mesh;
  updatePosition: (x: number, gapY: number, gapSize: number) => void;
} {
  const group = new THREE.Group();
  const pipeTexture = createPipeMetalTexture();

  const pipeMat = new THREE.MeshStandardMaterial({
    map: pipeTexture,
    color: 0x40c057,
    roughness: 0.35,
    metalness: 0.6,
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x2f9e44,
    roughness: 0.3,
    metalness: 0.7,
  });

  const innerCapMat = new THREE.MeshBasicMaterial({
    color: 0x0f2910,
  });

  const pipeRadius = 0.68;
  const rimRadius = 0.82;
  const rimHeight = 0.55;
  const pipeTotalHeight = 12.0;

  // Bottom Pipe (Extends downward from gapBottom)
  const bottomPipeGeo = new THREE.CylinderGeometry(pipeRadius, pipeRadius, pipeTotalHeight, 28);
  const bottomPipeMesh = new THREE.Mesh(bottomPipeGeo, pipeMat);
  bottomPipeMesh.castShadow = true;
  bottomPipeMesh.receiveShadow = true;

  const bottomRimGeo = new THREE.CylinderGeometry(rimRadius, rimRadius, rimHeight, 28);
  const bottomRimMesh = new THREE.Mesh(bottomRimGeo, rimMat);
  bottomRimMesh.castShadow = true;

  const bottomCapGeo = new THREE.CircleGeometry(pipeRadius * 0.95, 20);
  bottomCapGeo.rotateX(-Math.PI / 2);
  const bottomCapMesh = new THREE.Mesh(bottomCapGeo, innerCapMat);

  // Top Pipe (Extends upward from gapTop)
  const topPipeGeo = new THREE.CylinderGeometry(pipeRadius, pipeRadius, pipeTotalHeight, 28);
  const topPipeMesh = new THREE.Mesh(topPipeGeo, pipeMat);
  topPipeMesh.castShadow = true;
  topPipeMesh.receiveShadow = true;

  const topRimGeo = new THREE.CylinderGeometry(rimRadius, rimRadius, rimHeight, 28);
  const topRimMesh = new THREE.Mesh(topRimGeo, rimMat);
  topRimMesh.castShadow = true;

  const topCapGeo = new THREE.CircleGeometry(pipeRadius * 0.95, 20);
  topCapGeo.rotateX(Math.PI / 2);
  const topCapMesh = new THREE.Mesh(topCapGeo, innerCapMat);

  // Rivet bolts around rim collar
  const rivetMat = new THREE.MeshStandardMaterial({
    color: 0x1e7e34,
    metalness: 0.85,
    roughness: 0.2,
  });
  const rivetGeo = new THREE.SphereGeometry(0.065, 8, 8);

  const bottomRivets = new THREE.Group();
  const topRivets = new THREE.Group();
  const rivetCount = 8;
  for (let i = 0; i < rivetCount; i++) {
    const angle = (i / rivetCount) * Math.PI * 2;
    const rx = Math.cos(angle) * (rimRadius + 0.02);
    const rz = Math.sin(angle) * (rimRadius + 0.02);

    const bRivet = new THREE.Mesh(rivetGeo, rivetMat);
    bRivet.position.set(rx, 0, rz);
    bottomRivets.add(bRivet);

    const tRivet = new THREE.Mesh(rivetGeo, rivetMat);
    tRivet.position.set(rx, 0, rz);
    topRivets.add(tRivet);
  }
  bottomRimMesh.add(bottomRivets);
  topRimMesh.add(topRivets);

  group.add(bottomPipeMesh, bottomRimMesh, bottomCapMesh);
  group.add(topPipeMesh, topRimMesh, topCapMesh);

  const updatePosition = (x: number, gapY: number, gapSize: number) => {
    group.position.x = x;

    const gapHalf = gapSize / 2;
    const gapTop = gapY + gapHalf;
    const gapBottom = gapY - gapHalf;

    // Bottom pipe: rim is at gapBottom - rimHeight / 2
    bottomRimMesh.position.set(0, gapBottom - rimHeight / 2, 0);
    bottomCapMesh.position.set(0, gapBottom + 0.01, 0);
    bottomPipeMesh.position.set(0, gapBottom - rimHeight - pipeTotalHeight / 2, 0);

    // Top pipe: rim is at gapTop + rimHeight / 2
    topRimMesh.position.set(0, gapTop + rimHeight / 2, 0);
    topCapMesh.position.set(0, gapTop - 0.01, 0);
    topPipeMesh.position.set(0, gapTop + rimHeight + pipeTotalHeight / 2, 0);
  };

  return {
    group,
    topPipeMesh,
    topRimMesh,
    bottomPipeMesh,
    bottomRimMesh,
    updatePosition,
  };
}

/**
 * Creates scrolling layered ground with lush grass, cross-section earth, and flowers.
 */
export function createGroundMesh(): {
  mesh: THREE.Mesh;
  updateScroll: (speed: number, dt: number) => void;
} {
  const groundTexture = createGroundTexture();
  groundTexture.repeat.set(16, 1);

  const mat = new THREE.MeshStandardMaterial({
    map: groundTexture,
    roughness: 0.85,
    metalness: 0.05,
  });

  const geo = new THREE.BoxGeometry(80, 2.8, 14);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, -4.2 - 1.4, 0);
  mesh.receiveShadow = true;

  const updateScroll = (speed: number, dt: number) => {
    groundTexture.offset.x = (groundTexture.offset.x + (speed * dt * 0.12)) % 1;
  };

  return { mesh, updateScroll };
}

/**
 * Creates realistic 3D volumetric cloud clusters drifting in the sky.
 */
export function createCloudCluster(scale = 1.0): THREE.Group {
  const cloudGroup = new THREE.Group();
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0.0,
    transparent: true,
    opacity: 0.92,
  });

  const puffCount = 5 + Math.floor(Math.random() * 4);
  for (let i = 0; i < puffCount; i++) {
    const r = (0.7 + Math.random() * 0.8) * scale;
    const puffGeo = new THREE.SphereGeometry(r, 14, 14);
    const puff = new THREE.Mesh(puffGeo, cloudMat);
    puff.position.set(
      (i * 0.7 - puffCount * 0.35 + (Math.random() - 0.5) * 0.4) * scale,
      (Math.random() - 0.5) * 0.5 * scale,
      (Math.random() - 0.5) * 0.6 * scale
    );
    cloudGroup.add(puff);
  }

  return cloudGroup;
}

/**
 * Particle Ring Buffer Pool for score sparkles and feather puffs.
 */
export class ParticleSystem {
  public group: THREE.Group = new THREE.Group();
  private maxParticles = 120;
  private positions: Float32Array;
  private velocities: Float32Array;
  private colors: Float32Array;
  private lifetimes: Float32Array;
  private maxLifetimes: Float32Array;
  private scales: Float32Array;
  private geometry: THREE.BufferGeometry;
  private pointsMesh: THREE.Points;
  private activeCount = 0;

  constructor() {
    this.positions = new Float32Array(this.maxParticles * 3);
    this.velocities = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.lifetimes = new Float32Array(this.maxParticles);
    this.maxLifetimes = new Float32Array(this.maxParticles);
    this.scales = new Float32Array(this.maxParticles);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    // Particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.4, 'rgba(255, 230, 100, 0.85)');
    grad.addColorStop(1, 'rgba(255, 180, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, Math.PI * 2);
    ctx.fill();

    const particleTexture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.45,
      map: particleTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.pointsMesh = new THREE.Points(this.geometry, material);
    this.group.add(this.pointsMesh);
  }

  public burst(x: number, y: number, z: number, count: number, type: 'spark' | 'feather') {
    const startIdx = this.activeCount;
    const num = Math.min(count, this.maxParticles - startIdx);

    for (let i = 0; i < num; i++) {
      const idx = (startIdx + i) % this.maxParticles;
      const pIdx = idx * 3;

      this.positions[pIdx] = x + (Math.random() - 0.5) * 0.3;
      this.positions[pIdx + 1] = y + (Math.random() - 0.5) * 0.3;
      this.positions[pIdx + 2] = z + (Math.random() - 0.5) * 0.3;

      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      this.velocities[pIdx] = Math.cos(angle) * speed;
      this.velocities[pIdx + 1] = Math.sin(angle) * speed + 1.0;
      this.velocities[pIdx + 2] = (Math.random() - 0.5) * speed;

      if (type === 'spark') {
        // Golden sparkling star
        this.colors[pIdx] = 1.0;
        this.colors[pIdx + 1] = 0.85 + Math.random() * 0.15;
        this.colors[pIdx + 2] = 0.2;
      } else {
        // Yellow-orange feather
        this.colors[pIdx] = 1.0;
        this.colors[pIdx + 1] = 0.65;
        this.colors[pIdx + 2] = 0.1;
      }

      this.lifetimes[idx] = 0;
      this.maxLifetimes[idx] = 0.6 + Math.random() * 0.5;
    }

    this.activeCount = Math.min(this.maxParticles, this.activeCount + num);
  }

  public update(dt: number) {
    const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;

    let living = 0;
    for (let i = 0; i < this.activeCount; i++) {
      this.lifetimes[i] += dt;
      if (this.lifetimes[i] < this.maxLifetimes[i]) {
        const pIdx = i * 3;
        this.positions[pIdx] += this.velocities[pIdx] * dt;
        this.positions[pIdx + 1] += this.velocities[pIdx + 1] * dt;
        this.positions[pIdx + 2] += this.velocities[pIdx + 2] * dt;

        // Apply drag & gravity
        this.velocities[pIdx] *= 0.94;
        this.velocities[pIdx + 1] -= 5.0 * dt;
        this.velocities[pIdx + 2] *= 0.94;

        // Fade color
        const progress = this.lifetimes[i] / this.maxLifetimes[i];
        const fade = 1 - progress;
        this.colors[pIdx] = Math.max(0, this.colors[pIdx] * fade);
        this.colors[pIdx + 1] = Math.max(0, this.colors[pIdx + 1] * fade);
        this.colors[pIdx + 2] = Math.max(0, this.colors[pIdx + 2] * fade);

        living++;
      } else {
        // Move offscreen
        const pIdx = i * 3;
        this.positions[pIdx + 1] = -999;
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    if (living === 0) {
      this.activeCount = 0;
    }
  }
}
