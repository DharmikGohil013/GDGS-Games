import * as THREE from 'three';
import { WeatherType } from '../types/game';
import { EvaluatedTrackPoint } from './trackMath';

export interface WorldEnvironmentInstance {
  group: THREE.Group;
  sunLight: THREE.DirectionalLight;
  hemiLight: THREE.HemisphereLight;
  skyMesh: THREE.Mesh;
  terrainMesh: THREE.Mesh;
  starsGroup: THREE.Points;
  rainParticles: THREE.Points;
  sprayParticles: THREE.Points;
  updateTimeAndWeather: (timeOfDay: number, weather: WeatherType, carPos: THREE.Vector3, dt: number) => void;
  updateTrackTerrain: (evaluatedTrack: EvaluatedTrackPoint[]) => void;
  triggerLightning: () => void;
}

export function createWorldEnvironment(scene: THREE.Scene): WorldEnvironmentInstance {
  const rootGroup = new THREE.Group();

  // 1. Dynamic Sun & Lighting Rig
  const sunLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 400;
  const shadowDist = 120;
  sunLight.shadow.camera.left = -shadowDist;
  sunLight.shadow.camera.right = shadowDist;
  sunLight.shadow.camera.top = shadowDist;
  sunLight.shadow.camera.bottom = -shadowDist;
  sunLight.shadow.bias = -0.0005;
  sunLight.shadow.normalBias = 0.02;
  rootGroup.add(sunLight);

  const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x164e63, 0.75);
  rootGroup.add(hemiLight);

  // 2. Sky Dome
  const skyGeo = new THREE.SphereGeometry(900, 32, 16);
  const skyMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    side: THREE.BackSide,
  });
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  rootGroup.add(skyMesh);

  // 3. Starfield for night
  const starGeo = new THREE.BufferGeometry();
  const starCount = 1200;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 880;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = Math.abs(r * Math.cos(phi)) + 10; // upper hemisphere
    const z = r * Math.sin(phi) * Math.sin(theta);
    starPositions[i * 3] = x;
    starPositions[i * 3 + 1] = y;
    starPositions[i * 3 + 2] = z;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 2.2,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const starsPoints = new THREE.Points(starGeo, starMat);
  rootGroup.add(starsPoints);

  // 4. Open-world Terrain with dynamic track-conforming corridor
  // Sized 2400x2400 to cover all Grand Prix circuits and custom Curve Studio loops
  const terrainGeo = new THREE.PlaneGeometry(2400, 2400, 80, 80);
  terrainGeo.rotateX(-Math.PI / 2);

  // Terrain grass material
  const terrainMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a1f, // Rich paddock green
    roughness: 0.95,
    metalness: 0.05,
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.position.y = 0;
  terrainMesh.receiveShadow = true;
  rootGroup.add(terrainMesh);

  // 5. Instanced Foliage (Pine Trees)
  const treeCount = 450;
  const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 3.5, 6);
  trunkGeo.translate(0, 1.75, 0);
  const crownGeo = new THREE.ConeGeometry(2.4, 6.0, 7);
  crownGeo.translate(0, 5.0, 0);

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2714, roughness: 0.9 });
  const crownMat = new THREE.MeshStandardMaterial({ color: 0x14341b, roughness: 0.85 });

  const trunkInstanced = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
  const crownInstanced = new THREE.InstancedMesh(crownGeo, crownMat, treeCount);
  trunkInstanced.castShadow = true;
  trunkInstanced.receiveShadow = true;
  crownInstanced.castShadow = true;
  crownInstanced.receiveShadow = true;
  rootGroup.add(trunkInstanced);
  rootGroup.add(crownInstanced);

  // Terrain elevation calculation: guarantees track corridor has zero hills or clipping
  function computeTerrainElevation(
    x: number,
    z: number,
    track: EvaluatedTrackPoint[]
  ): number {
    if (track.length === 0) {
      const dCenter = Math.hypot(x, z);
      if (dCenter > 300) {
        return Math.sin(x * 0.01) * Math.cos(z * 0.01) * 12 + Math.pow((dCenter - 300) / 300, 1.6) * 28;
      }
      return -0.15;
    }

    // Find nearest point along track spline
    let minDistSq = Infinity;
    let nearestY = 0;
    let nearestWidth = 15;

    const step = track.length > 250 ? 2 : 1;
    for (let j = 0; j < track.length; j += step) {
      const pt = track[j];
      const dx = x - pt.x;
      const dz = z - pt.z;
      const dSq = dx * dx + dz * dz;
      if (dSq < minDistSq) {
        minDistSq = dSq;
        nearestY = pt.y;
        nearestWidth = pt.width;
      }
    }

    const distToTrack = Math.sqrt(minDistSq);
    const halfRoad = nearestWidth * 0.5;

    // 1. Asphalt Road & Kerb corridor: strictly recessed 16cm under road surface
    if (distToTrack <= halfRoad + 4.0) {
      return nearestY - 0.16;
    }

    // 2. Graded Runoff & Barrier gravel zone (flat buffer with zero mounds or hills)
    const runoffEnd = halfRoad + 30.0;
    if (distToTrack <= runoffEnd) {
      const runoffProgress = (distToTrack - (halfRoad + 4.0)) / (runoffEnd - (halfRoad + 4.0));
      return nearestY - 0.16 + runoffProgress * 0.10;
    }

    // 3. Beyond runoff corridor: smooth, natural rolling hills
    const hillBlend = Math.min(1.0, (distToTrack - runoffEnd) / 45.0);
    const rollingHill = (Math.sin(x * 0.009) * Math.cos(z * 0.009) * 11 + Math.sin(x * 0.02 + z * 0.016) * 5) * hillBlend;

    // Distant perimeter mountain rim far away from circuit (> 220m)
    let mountainRise = 0;
    if (distToTrack > 200.0) {
      mountainRise = Math.pow((distToTrack - 200.0) / 260.0, 1.7) * 32.0;
    }

    return nearestY - 0.06 + rollingHill + mountainRise;
  }

  // Position trees in natural groves strictly outside barriers and runoffs
  function placeTreesAroundTrack(track: EvaluatedTrackPoint[]) {
    const dummy = new THREE.Object3D();
    let planted = 0;
    let attempts = 0;

    let minX = -300, maxX = 300, minZ = -300, maxZ = 300;
    if (track.length > 0) {
      minX = track[0].x; maxX = track[0].x;
      minZ = track[0].z; maxZ = track[0].z;
      for (let i = 1; i < track.length; i++) {
        const p = track[i];
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.z < minZ) minZ = p.z;
        if (p.z > maxZ) maxZ = p.z;
      }
    }

    const rangeX = Math.max(900, (maxX - minX) + 350);
    const rangeZ = Math.max(900, (maxZ - minZ) + 350);
    const centerX = (minX + maxX) * 0.5;
    const centerZ = (minZ + maxZ) * 0.5;

    while (planted < treeCount && attempts < 3000) {
      attempts++;
      const tx = centerX + (Math.random() - 0.5) * rangeX;
      const tz = centerZ + (Math.random() - 0.5) * rangeZ;

      // Minimum distance check to any track point
      let minDistSq = Infinity;
      const step = track.length > 200 ? 2 : 1;
      for (let j = 0; j < track.length; j += step) {
        const pt = track[j];
        const dx = tx - pt.x;
        const dz = tz - pt.z;
        const dSq = dx * dx + dz * dz;
        if (dSq < minDistSq) minDistSq = dSq;
      }
      const dist = Math.sqrt(minDistSq);

      // Keep trees at least 28m away from track centerline (outside barriers and runoff)
      if (dist > 28.0) {
        const ty = computeTerrainElevation(tx, tz, track);
        const scale = 0.75 + Math.random() * 0.55;
        dummy.position.set(tx, ty, tz);
        dummy.rotation.y = Math.random() * Math.PI;
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();

        trunkInstanced.setMatrixAt(planted, dummy.matrix);
        crownInstanced.setMatrixAt(planted, dummy.matrix);
        planted++;
      }
    }

    // Hide any unused instances safely beneath world
    for (let i = planted; i < treeCount; i++) {
      dummy.position.set(0, -9999, 0);
      dummy.scale.set(0, 0, 0);
      dummy.updateMatrix();
      trunkInstanced.setMatrixAt(i, dummy.matrix);
      crownInstanced.setMatrixAt(i, dummy.matrix);
    }

    trunkInstanced.instanceMatrix.needsUpdate = true;
    crownInstanced.instanceMatrix.needsUpdate = true;
  }

  function updateTrackTerrain(track: EvaluatedTrackPoint[]) {
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const elev = computeTerrainElevation(x, z, track);
      posAttr.setY(i, elev);
    }
    posAttr.needsUpdate = true;
    terrainGeo.computeVertexNormals();

    placeTreesAroundTrack(track);
  }

  // 6. Rain particle system
  const rainCount = 1800;
  const rainGeo = new THREE.BufferGeometry();
  const rainPos = new Float32Array(rainCount * 3);
  for (let i = 0; i < rainCount; i++) {
    rainPos[i * 3] = (Math.random() - 0.5) * 80;
    rainPos[i * 3 + 1] = Math.random() * 35;
    rainPos[i * 3 + 2] = (Math.random() - 0.5) * 80;
  }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rainMat = new THREE.PointsMaterial({
    color: 0xbfdbfe,
    size: 0.45,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const rainPoints = new THREE.Points(rainGeo, rainMat);
  rootGroup.add(rainPoints);

  // 7. Tire Spray Mist Particles (behind car in wet weather)
  const sprayCount = 400;
  const sprayGeo = new THREE.BufferGeometry();
  const sprayPos = new Float32Array(sprayCount * 3);
  for (let i = 0; i < sprayCount; i++) {
    sprayPos[i * 3] = 0;
    sprayPos[i * 3 + 1] = -100;
    sprayPos[i * 3 + 2] = 0;
  }
  sprayGeo.setAttribute('position', new THREE.BufferAttribute(sprayPos, 3));
  const sprayMat = new THREE.PointsMaterial({
    color: 0xe2e8f0,
    size: 1.4,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const sprayPoints = new THREE.Points(sprayGeo, sprayMat);
  rootGroup.add(sprayPoints);

  let lightningTimer = 0;
  let isLightningActive = false;

  return {
    group: rootGroup,
    sunLight,
    hemiLight,
    skyMesh,
    terrainMesh,
    starsGroup: starsPoints,
    rainParticles: rainPoints,
    sprayParticles: sprayPoints,
    updateTrackTerrain,
    triggerLightning() {
      isLightningActive = true;
      lightningTimer = 0.12;
    },
    updateTimeAndWeather(timeOfDay: number, weather: WeatherType, carPos: THREE.Vector3, dt: number) {
      // 1. Calculate Sun Angle from time (0 to 24 hours, noon at 12)
      const sunAngle = ((timeOfDay - 6) / 24) * Math.PI * 2;
      const sunY = Math.sin(sunAngle) * 300;
      const sunX = Math.cos(sunAngle) * 300;
      const sunZ = 120;

      const isSunAboveHorizon = sunY > 0;
      sunLight.position.set(carPos.x + sunX, Math.max(sunY, -50), carPos.z + sunZ);
      sunLight.target.position.copy(carPos);

      // Colors based on time & weather
      let skyColor = new THREE.Color(0x38bdf8);
      let fogColor = new THREE.Color(0x7dd3fc);
      let sunIntensity = 2.4;
      let hemiSky = new THREE.Color(0xbae6fd);
      let hemiGround = new THREE.Color(0x164e63);

      if (weather === 'sunset' || (timeOfDay >= 17.5 && timeOfDay <= 19.5)) {
        // Golden hour / sunset
        skyColor.setHex(0xf97316);
        fogColor.setHex(0xfb923c);
        sunLight.color.setHex(0xffedd5);
        sunIntensity = 1.8;
        hemiSky.setHex(0xfdba74);
        hemiGround.setHex(0x431407);
      } else if (weather === 'overcast' || weather === 'rain') {
        // Overcast / Rain
        skyColor.setHex(0x475569);
        fogColor.setHex(0x64748b);
        sunLight.color.setHex(0xcfd8dc);
        sunIntensity = 0.9;
        hemiSky.setHex(0x94a3b8);
        hemiGround.setHex(0x1e293b);
      } else if (weather === 'night_storm' || !isSunAboveHorizon) {
        // Night or storm
        skyColor.setHex(0x030712);
        fogColor.setHex(0x0b0f19);
        sunIntensity = 0.05;
        hemiSky.setHex(0x111827);
        hemiGround.setHex(0x030712);
      }

      // Lightning flash
      if (lightningTimer > 0) {
        lightningTimer -= dt;
        if (lightningTimer <= 0) {
          isLightningActive = false;
        } else {
          skyColor.setHex(0xdbeafe);
          sunIntensity = 5.0;
        }
      }

      // Random lightning during night storm
      if (weather === 'night_storm' && Math.random() < 0.003 && !isLightningActive) {
        isLightningActive = true;
        lightningTimer = 0.14;
      }

      // Apply lighting
      sunLight.intensity = sunIntensity;
      hemiLight.color.copy(hemiSky);
      hemiLight.groundColor.copy(hemiGround);
      skyMat.color.copy(skyColor);

      // Update Fog in Scene
      if (!scene.fog) {
        scene.fog = new THREE.FogExp2(fogColor.getHex(), 0.0022);
      } else {
        (scene.fog as THREE.FogExp2).color.copy(fogColor);
      }

      // Stars visibility at night
      const starOpacity = (!isSunAboveHorizon && weather !== 'rain' && weather !== 'overcast') ? 0.9 : 0;
      (starsPoints.material as THREE.PointsMaterial).opacity = starOpacity;
      starsPoints.position.copy(carPos);
      skyMesh.position.copy(carPos);

      // Rain particles
      const isRaining = weather === 'rain' || weather === 'night_storm';
      const rainMaterial = rainPoints.material as THREE.PointsMaterial;
      rainMaterial.opacity = isRaining ? 0.75 : 0;

      if (isRaining) {
        const pArray = rainGeo.attributes.position.array as Float32Array;
        rainPoints.position.set(carPos.x, 0, carPos.z);
        for (let i = 0; i < rainCount; i++) {
          pArray[i * 3 + 1] -= 55 * dt; // rain falling
          if (pArray[i * 3 + 1] < 0) {
            pArray[i * 3 + 1] = 35;
          }
        }
        rainGeo.attributes.position.needsUpdate = true;
      }

      // Tire Spray Mist
      const sprayMaterial = sprayPoints.material as THREE.PointsMaterial;
      sprayMaterial.opacity = isRaining ? 0.6 : 0;
      if (isRaining) {
        sprayPoints.position.set(carPos.x, carPos.y + 0.3, carPos.z);
        const sArray = sprayGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < sprayCount; i++) {
          sArray[i * 3 + 1] += 2.0 * dt;
          sArray[i * 3 + 2] -= 8.0 * dt;
          if (sArray[i * 3 + 1] > 2.5) {
            sArray[i * 3] = (Math.random() - 0.5) * 1.8;
            sArray[i * 3 + 1] = 0.1;
            sArray[i * 3 + 2] = -2.2 - Math.random() * 1.5;
          }
        }
        sprayGeo.attributes.position.needsUpdate = true;
      }
    }
  };
}
