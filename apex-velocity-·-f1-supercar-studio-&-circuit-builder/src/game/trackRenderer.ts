import * as THREE from 'three';
import { EvaluatedTrackPoint } from './trackMath';
import { TrackPoint } from '../types/game';

export interface TrackSceneObjects {
  group: THREE.Group;
  roadMesh: THREE.Mesh;
  kerbMesh: THREE.Mesh;
  barriersGroup: THREE.Group;
  gantryGroup: THREE.Group;
  floodlights: THREE.SpotLight[];
  editorWaypointsGroup: THREE.Group;
  rebuildTrack: (evaluated: EvaluatedTrackPoint[], controlPoints: TrackPoint[], isEditorMode: boolean, selectedPointId?: string) => void;
  updateLighting: (isNightOrStorm: boolean) => void;
}

// Procedural CanvasTexture for race track asphalt & markings
function createRoadCanvasTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Dark asphalt base
  ctx.fillStyle = '#222326';
  ctx.fillRect(0, 0, 1024, 1024);

  // Noise / asphalt grain
  const imgData = ctx.getImageData(0, 0, 1024, 1024);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 18;
    data[i] = Math.min(255, Math.max(0, data[i] + grain));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain));
  }
  ctx.putImageData(imgData, 0, 0);

  // Outer white track border lines
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(40, 0, 24, 1024); // Left white line
  ctx.fillRect(960, 0, 24, 1024); // Right white line

  // Subtle racing tire groove wear in braking zone
  const gradient = ctx.createLinearGradient(0, 0, 1024, 0);
  gradient.addColorStop(0.25, 'rgba(15, 15, 17, 0.4)');
  gradient.addColorStop(0.35, 'transparent');
  gradient.addColorStop(0.65, 'transparent');
  gradient.addColorStop(0.75, 'rgba(15, 15, 17, 0.4)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 1024);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 24);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural Kerb CanvasTexture (Red & White alternating rumble strips)
function createKerbCanvasTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const stripeH = 64;
  for (let y = 0; y < 256; y += stripeH) {
    ctx.fillStyle = ((y / stripeH) % 2 === 0) ? '#e10600' : '#ffffff';
    ctx.fillRect(0, y, 256, stripeH);
  }

  // 3D bevel shading across width
  const grad = ctx.createLinearGradient(0, 0, 256, 0);
  grad.addColorStop(0, 'rgba(0,0,0,0.4)');
  grad.addColorStop(0.3, 'rgba(255,255,255,0.2)');
  grad.addColorStop(0.8, 'rgba(0,0,0,0.1)');
  grad.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 40);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createTrackRenderer(): TrackSceneObjects {
  const rootGroup = new THREE.Group();
  const barriersGroup = new THREE.Group();
  const gantryGroup = new THREE.Group();
  const editorWaypointsGroup = new THREE.Group();
  const floodlights: THREE.SpotLight[] = [];

  const roadTexture = createRoadCanvasTexture();
  const kerbTexture = createKerbCanvasTexture();

  const roadMaterial = new THREE.MeshStandardMaterial({
    map: roadTexture,
    roughness: 0.85,
    metalness: 0.1,
  });

  const kerbMaterial = new THREE.MeshStandardMaterial({
    map: kerbTexture,
    roughness: 0.6,
    metalness: 0.1,
  });

  const barrierMaterial = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.7,
    roughness: 0.35,
  });

  const sponsorBoardMat1 = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // "CURVES STUDIO" Cyan
    roughness: 0.4,
  });

  const sponsorBoardMat2 = new THREE.MeshStandardMaterial({
    color: 0xe10600, // "APEX VELOCITY" Racing Red
    roughness: 0.4,
  });

  // Reusable mesh placeholders
  let roadMesh = new THREE.Mesh(new THREE.BufferGeometry(), roadMaterial);
  roadMesh.receiveShadow = true;
  rootGroup.add(roadMesh);

  let kerbMesh = new THREE.Mesh(new THREE.BufferGeometry(), kerbMaterial);
  kerbMesh.receiveShadow = true;
  rootGroup.add(kerbMesh);

  rootGroup.add(barriersGroup);
  rootGroup.add(gantryGroup);
  rootGroup.add(editorWaypointsGroup);

  function rebuildTrack(
    evaluated: EvaluatedTrackPoint[],
    controlPoints: TrackPoint[],
    isEditorMode: boolean,
    selectedPointId?: string
  ) {
    if (evaluated.length < 3) return;

    // 1. Generate Road Geometry by extruding left and right along evaluated track points
    const roadVertices: number[] = [];
    const roadUvs: number[] = [];
    const roadIndices: number[] = [];

    const kerbVertices: number[] = [];
    const kerbUvs: number[] = [];
    const kerbIndices: number[] = [];

    const count = evaluated.length;

    for (let i = 0; i < count; i++) {
      const pt = evaluated[i];
      const halfW = pt.width * 0.5;

      // Road points (offset by normal vector + banking)
      const bankingRad = (pt.banking * Math.PI) / 180;
      const bankOffsetY = Math.sin(bankingRad) * halfW;

      const lx = pt.x - pt.normalX * halfW;
      const ly = pt.y - bankOffsetY + 0.02; // +0.02 to prevent Z-fighting with terrain
      const lz = pt.z - pt.normalZ * halfW;

      const rx = pt.x + pt.normalX * halfW;
      const ry = pt.y + bankOffsetY + 0.02;
      const rz = pt.z + pt.normalZ * halfW;

      roadVertices.push(lx, ly, lz);
      roadVertices.push(rx, ry, rz);

      const vProgress = pt.progressPercent * 24;
      roadUvs.push(0, vProgress);
      roadUvs.push(1, vProgress);

      // Indices for road quad strip
      if (i < count) {
        const nextI = (i + 1) % count;
        const i0 = i * 2;
        const i1 = i * 2 + 1;
        const i2 = nextI * 2;
        const i3 = nextI * 2 + 1;

        roadIndices.push(i0, i1, i2);
        roadIndices.push(i1, i3, i2);
      }

      // 2. Curbs generation
      const kerbWidth = 1.6;
      const kerbHeight = 0.08;

      if (pt.kerb === 'left' || pt.kerb === 'both') {
        const kl0x = lx;
        const kl0y = ly;
        const kl0z = lz;

        const kl1x = lx - pt.normalX * kerbWidth;
        const kl1y = ly + kerbHeight;
        const kl1z = lz - pt.normalZ * kerbWidth;

        const kStart = kerbVertices.length / 3;
        kerbVertices.push(kl0x, kl0y, kl0z);
        kerbVertices.push(kl1x, kl1y, kl1z);
        kerbUvs.push(0, pt.progressPercent * 40);
        kerbUvs.push(1, pt.progressPercent * 40);

        if (i < count - 1) {
          const nextKStart = kStart + 2;
          kerbIndices.push(kStart, kStart + 1, nextKStart);
          kerbIndices.push(kStart + 1, nextKStart + 1, nextKStart);
        }
      }

      if (pt.kerb === 'right' || pt.kerb === 'both') {
        const kr0x = rx;
        const kr0y = ry;
        const kr0z = rz;

        const kr1x = rx + pt.normalX * kerbWidth;
        const kr1y = ry + kerbHeight;
        const kr1z = rz + pt.normalZ * kerbWidth;

        const kStart = kerbVertices.length / 3;
        kerbVertices.push(kr0x, kr0y, kr0z);
        kerbVertices.push(kr1x, kr1y, kr1z);
        kerbUvs.push(0, pt.progressPercent * 40);
        kerbUvs.push(1, pt.progressPercent * 40);

        if (i < count - 1) {
          const nextKStart = kStart + 2;
          kerbIndices.push(kStart, kStart + 1, nextKStart);
          kerbIndices.push(kStart + 1, nextKStart + 1, nextKStart);
        }
      }
    }

    // Update Road BufferGeometry
    const newRoadGeo = new THREE.BufferGeometry();
    newRoadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVertices, 3));
    newRoadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
    newRoadGeo.setIndex(roadIndices);
    newRoadGeo.computeVertexNormals();

    roadMesh.geometry.dispose();
    roadMesh.geometry = newRoadGeo;

    // Update Kerb BufferGeometry
    if (kerbVertices.length > 0) {
      const newKerbGeo = new THREE.BufferGeometry();
      newKerbGeo.setAttribute('position', new THREE.Float32BufferAttribute(kerbVertices, 3));
      newKerbGeo.setAttribute('uv', new THREE.Float32BufferAttribute(kerbUvs, 2));
      newKerbGeo.setIndex(kerbIndices);
      newKerbGeo.computeVertexNormals();

      kerbMesh.geometry.dispose();
      kerbMesh.geometry = newKerbGeo;
      kerbMesh.visible = true;
    } else {
      kerbMesh.visible = false;
    }

    // 3. Clear and rebuild barriers, sponsor signs, and floodlights along corners
    while (barriersGroup.children.length > 0) {
      const obj = barriersGroup.children[0];
      barriersGroup.remove(obj);
    }
    floodlights.length = 0;

    const barrierInterval = Math.max(1, Math.floor(count / 30));
    for (let i = 0; i < count; i += barrierInterval) {
      const pt = evaluated[i];
      const halfW = pt.width * 0.5 + 2.5;

      // Outer barrier post & rail
      const bx = pt.x + pt.normalX * halfW;
      const by = pt.y + 0.45;
      const bz = pt.z + pt.normalZ * halfW;

      const railGeo = new THREE.BoxGeometry(0.2, 0.8, 12);
      const rail = new THREE.Mesh(railGeo, barrierMaterial);
      rail.position.set(bx, by, bz);
      rail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(pt.tangentX, pt.tangentY, pt.tangentZ));
      rail.castShadow = true;
      rail.receiveShadow = true;
      barriersGroup.add(rail);

      // Sponsor board occasionally
      if (i % (barrierInterval * 3) === 0) {
        const boardGeo = new THREE.BoxGeometry(0.1, 1.2, 8);
        const mat = (i % 2 === 0) ? sponsorBoardMat1 : sponsorBoardMat2;
        const board = new THREE.Mesh(boardGeo, mat);
        board.position.set(bx, by + 0.3, bz);
        board.quaternion.copy(rail.quaternion);
        barriersGroup.add(board);
      }

      // Stadium floodlight towers every 80-100 meters
      if (i % (barrierInterval * 4) === 0) {
        const poleGeo = new THREE.CylinderGeometry(0.25, 0.35, 14, 8);
        const pole = new THREE.Mesh(poleGeo, barrierMaterial);
        const poleX = pt.x - pt.normalX * (halfW + 4);
        const poleZ = pt.z - pt.normalZ * (halfW + 4);
        pole.position.set(poleX, pt.y + 7, poleZ);
        pole.castShadow = true;
        barriersGroup.add(pole);

        // Floodlight head
        const headGeo = new THREE.BoxGeometry(2.5, 1.0, 1.2);
        const head = new THREE.Mesh(headGeo, barrierMaterial);
        head.position.set(poleX, pt.y + 14, poleZ);
        head.lookAt(pt.x, pt.y, pt.z);
        barriersGroup.add(head);

        const spot = new THREE.SpotLight(0xffffff, 80, 120, Math.PI / 4, 0.5, 1.2);
        spot.position.set(poleX, pt.y + 13.8, poleZ);
        spot.target.position.set(pt.x, pt.y, pt.z);
        barriersGroup.add(spot);
        barriersGroup.add(spot.target);
        floodlights.push(spot);
      }
    }

    // 4. Start / Finish Gantry at index 0
    while (gantryGroup.children.length > 0) {
      gantryGroup.remove(gantryGroup.children[0]);
    }

    if (evaluated.length > 0) {
      const p0 = evaluated[0];
      const halfW = p0.width * 0.5 + 3.0;

      const pLeft = new THREE.Vector3(p0.x - p0.normalX * halfW, p0.y, p0.z - p0.normalZ * halfW);
      const pRight = new THREE.Vector3(p0.x + p0.normalX * halfW, p0.y, p0.z + p0.normalZ * halfW);

      // Support pillars
      const pillarGeo = new THREE.BoxGeometry(0.6, 7.5, 0.6);
      const leftPillar = new THREE.Mesh(pillarGeo, barrierMaterial);
      leftPillar.position.set(pLeft.x, pLeft.y + 3.75, pLeft.z);
      const rightPillar = new THREE.Mesh(pillarGeo, barrierMaterial);
      rightPillar.position.set(pRight.x, pRight.y + 3.75, pRight.z);
      gantryGroup.add(leftPillar, rightPillar);

      // Overhead beam across the road
      const spanDistance = pLeft.distanceTo(pRight);
      const beamGeo = new THREE.BoxGeometry(spanDistance, 0.9, 1.2);
      const beam = new THREE.Mesh(beamGeo, sponsorBoardMat1);
      const midX = (pLeft.x + pRight.x) * 0.5;
      const midY = (pLeft.y + pRight.y) * 0.5 + 6.8;
      const midZ = (pLeft.z + pRight.z) * 0.5;
      beam.position.set(midX, midY, midZ);
      
      // Orient beam so width runs from left pillar to right pillar
      const beamDir = new THREE.Vector3().subVectors(pRight, pLeft).normalize();
      beam.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), beamDir);
      gantryGroup.add(beam);

      // 5 Red F1 Start Lights
      for (let s = -2; s <= 2; s++) {
        const lightHousing = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 0.7, 0.35),
          new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 })
        );
        lightHousing.position.set(s * 1.0, -0.65, 0);
        beam.add(lightHousing);

        const redBulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 12, 12),
          new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2.5 })
        );
        redBulb.position.set(0, 0, 0.2);
        lightHousing.add(redBulb);
      }
    }

    // 5. Editor Waypoint Handles (Visible when in Curves Studio Track Maker mode)
    while (editorWaypointsGroup.children.length > 0) {
      editorWaypointsGroup.remove(editorWaypointsGroup.children[0]);
    }

    if (isEditorMode) {
      controlPoints.forEach((cp, idx) => {
        const isSelected = cp.id === selectedPointId;
        const markerGeo = new THREE.CylinderGeometry(isSelected ? 1.4 : 1.0, isSelected ? 1.4 : 1.0, 3.5, 16);
        const markerMat = new THREE.MeshStandardMaterial({
          color: isSelected ? 0xf59e0b : 0x06b6d4, // Amber if selected, cyan otherwise
          emissive: isSelected ? 0xf59e0b : 0x0891b2,
          emissiveIntensity: 0.6,
          metalness: 0.3,
          roughness: 0.2,
        });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.set(cp.x, cp.y + 1.75, cp.z);
        marker.userData = { pointId: cp.id, index: idx };
        editorWaypointsGroup.add(marker);
      });
      editorWaypointsGroup.visible = true;
    } else {
      editorWaypointsGroup.visible = false;
    }
  }

  return {
    group: rootGroup,
    roadMesh,
    kerbMesh,
    barriersGroup,
    gantryGroup,
    floodlights,
    editorWaypointsGroup,
    rebuildTrack,
    updateLighting(isNightOrStorm: boolean) {
      const intensity = isNightOrStorm ? 90 : 0;
      floodlights.forEach(fl => {
        fl.intensity = intensity;
      });
    }
  };
}
