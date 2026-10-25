import * as THREE from 'three';
import { CarUpgrades } from '../types/game';

export interface CarModelInstance {
  group: THREE.Group;
  drsFlap: THREE.Mesh;
  frontLeftWheel: THREE.Group;
  frontRightWheel: THREE.Group;
  rearLeftWheel: THREE.Group;
  rearRightWheel: THREE.Group;
  brakeCalipers: THREE.Mesh[];
  headlights: THREE.SpotLight[];
  rainLight: THREE.Mesh;
  updateMaterials: (upgrades: CarUpgrades) => void;
  updateWheelRotation: (speedMs: number, steerAngle: number, dt: number) => void;
  updateDrsState: (drsActive: boolean) => void;
  updateBrakeGlow: (isBrakingHard: boolean) => void;
  updateRainLight: (isRainOrNight: boolean, time: number) => void;
}

export function createSuperCar(upgrades: CarUpgrades): CarModelInstance {
  const rootGroup = new THREE.Group();

  // Materials
  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(upgrades.paintColor),
    metalness: 0.65,
    roughness: 0.18,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  const carbonMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(upgrades.accentColor),
    roughness: 0.82,
    metalness: 0.2,
  });

  const tireMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x1a1a1a),
    roughness: 0.9,
    metalness: 0.05,
  });

  const rimMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(upgrades.rimColor),
    metalness: 0.85,
    roughness: 0.25,
  });

  const brakeDiscMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x777777),
    metalness: 0.9,
    roughness: 0.35,
  });

  const brakeCaliperMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xdd2200),
    emissive: new THREE.Color(0x000000),
    roughness: 0.3,
  });

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x111122),
    roughness: 0.1,
    metalness: 0.1,
    transmission: 0.7,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });

  const rainLightMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xff0000),
    emissive: new THREE.Color(0xff0000),
    emissiveIntensity: 0.5,
  });

  // 1. Primary silhouette: Main chassis & nosecone
  const chassisGroup = new THREE.Group();

  // Low sleek aerodynamic nose & cockpit monocoque
  const noseShape = new THREE.Shape();
  noseShape.moveTo(-0.25, 2.5);
  noseShape.lineTo(0.25, 2.5);
  noseShape.lineTo(0.48, 1.0);
  noseShape.lineTo(0.58, -0.6);
  noseShape.lineTo(0.50, -1.9);
  noseShape.lineTo(-0.50, -1.9);
  noseShape.lineTo(-0.58, -0.6);
  noseShape.lineTo(-0.48, 1.0);
  noseShape.closePath();

  const extrudeSettings = {
    depth: 0.45,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.08,
    bevelThickness: 0.08,
  };

  const monocoqueGeo = new THREE.ExtrudeGeometry(noseShape, extrudeSettings);
  monocoqueGeo.rotateX(Math.PI / 2);
  const monocoqueMesh = new THREE.Mesh(monocoqueGeo, bodyMaterial);
  monocoqueMesh.position.y = 0.38;
  monocoqueMesh.castShadow = true;
  chassisGroup.add(monocoqueMesh);

  // Sidepods with sculpted radiator tunnels
  const sidepodGeo = new THREE.BoxGeometry(0.35, 0.32, 1.6);
  const leftSidepod = new THREE.Mesh(sidepodGeo, bodyMaterial);
  leftSidepod.position.set(-0.72, 0.32, -0.2);
  leftSidepod.castShadow = true;
  chassisGroup.add(leftSidepod);

  const rightSidepod = new THREE.Mesh(sidepodGeo, bodyMaterial);
  rightSidepod.position.set(0.72, 0.32, -0.2);
  rightSidepod.castShadow = true;
  chassisGroup.add(rightSidepod);

  // Carbon floor & underbody venturi tunnel
  const floorGeo = new THREE.BoxGeometry(1.85, 0.05, 4.4);
  const floorMesh = new THREE.Mesh(floorGeo, carbonMaterial);
  floorMesh.position.set(0, 0.12, 0);
  floorMesh.castShadow = true;
  chassisGroup.add(floorMesh);

  // Rear Venturi Diffuser
  const diffuserGeo = new THREE.BoxGeometry(1.2, 0.18, 0.5);
  diffuserGeo.rotateX(-0.2);
  const diffuserMesh = new THREE.Mesh(diffuserGeo, carbonMaterial);
  diffuserMesh.position.set(0, 0.22, -2.1);
  diffuserMesh.castShadow = true;
  chassisGroup.add(diffuserMesh);

  // 2. Front Aerodynamic Wing with multi-tier elements and endplates
  const frontWingGroup = new THREE.Group();
  const mainWingGeo = new THREE.BoxGeometry(1.9, 0.04, 0.45);
  const mainWingMesh = new THREE.Mesh(mainWingGeo, carbonMaterial);
  mainWingMesh.position.set(0, 0.18, 2.2);
  mainWingMesh.castShadow = true;
  frontWingGroup.add(mainWingMesh);

  // Front Wing Endplates
  const endplateGeo = new THREE.BoxGeometry(0.04, 0.24, 0.55);
  const leftEndplate = new THREE.Mesh(endplateGeo, carbonMaterial);
  leftEndplate.position.set(-0.95, 0.24, 2.2);
  const rightEndplate = new THREE.Mesh(endplateGeo, carbonMaterial);
  rightEndplate.position.set(0.95, 0.24, 2.2);
  frontWingGroup.add(leftEndplate, rightEndplate);
  chassisGroup.add(frontWingGroup);

  // 3. Cockpit, Halo safety bar & Steering Wheel
  const cockpitHoleGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.7, 16);
  cockpitHoleGeo.rotateX(Math.PI / 2);
  const cockpitMesh = new THREE.Mesh(cockpitHoleGeo, carbonMaterial);
  cockpitMesh.position.set(0, 0.46, 0.2);
  chassisGroup.add(cockpitMesh);

  // Titanium Halo structure (T-shaped curved tube)
  const haloCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.48, 0.75),
    new THREE.Vector3(0, 0.78, 0.35),
    new THREE.Vector3(-0.25, 0.72, -0.2),
  ]);
  const haloGeo = new THREE.TubeGeometry(haloCurve, 12, 0.035, 8, false);
  const haloMesh = new THREE.Mesh(haloGeo, carbonMaterial);
  chassisGroup.add(haloMesh);

  const haloRightCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.48, 0.75),
    new THREE.Vector3(0, 0.78, 0.35),
    new THREE.Vector3(0.25, 0.72, -0.2),
  ]);
  const haloRightGeo = new THREE.TubeGeometry(haloRightCurve, 12, 0.035, 8, false);
  const haloRightMesh = new THREE.Mesh(haloRightGeo, carbonMaterial);
  chassisGroup.add(haloRightMesh);

  // Aerodynamic Engine Airbox Intake above driver head
  const airboxGeo = new THREE.CylinderGeometry(0.14, 0.26, 0.65, 8);
  airboxGeo.rotateX(-0.4);
  const airboxMesh = new THREE.Mesh(airboxGeo, bodyMaterial);
  airboxMesh.position.set(0, 0.76, -0.4);
  airboxMesh.castShadow = true;
  chassisGroup.add(airboxMesh);

  // 4. Rear Wing with active DRS Flap
  const rearWingPillarsGeo = new THREE.BoxGeometry(0.04, 0.65, 0.1);
  const leftPillar = new THREE.Mesh(rearWingPillarsGeo, carbonMaterial);
  leftPillar.position.set(-0.25, 0.62, -1.75);
  const rightPillar = new THREE.Mesh(rearWingPillarsGeo, carbonMaterial);
  rightPillar.position.set(0.25, 0.62, -1.75);
  chassisGroup.add(leftPillar, rightPillar);

  // Rear Main Plane
  const rearMainPlaneGeo = new THREE.BoxGeometry(1.6, 0.05, 0.35);
  const rearMainPlaneMesh = new THREE.Mesh(rearMainPlaneGeo, carbonMaterial);
  rearMainPlaneMesh.position.set(0, 0.88, -1.82);
  rearMainPlaneMesh.castShadow = true;
  chassisGroup.add(rearMainPlaneMesh);

  // Active DRS Top Flap (rotates when DRS open)
  const drsFlapGeo = new THREE.BoxGeometry(1.56, 0.035, 0.24);
  // Shift pivot to front edge of flap
  drsFlapGeo.translate(0, 0, -0.1);
  const drsFlapMesh = new THREE.Mesh(drsFlapGeo, carbonMaterial);
  drsFlapMesh.position.set(0, 0.94, -1.74);
  drsFlapMesh.castShadow = true;
  chassisGroup.add(drsFlapMesh);

  // Rear Wing Endplates
  const rearEndplateGeo = new THREE.BoxGeometry(0.04, 0.48, 0.55);
  const leftRearEndplate = new THREE.Mesh(rearEndplateGeo, carbonMaterial);
  leftRearEndplate.position.set(-0.8, 0.82, -1.8);
  const rightRearEndplate = new THREE.Mesh(rearEndplateGeo, carbonMaterial);
  rightRearEndplate.position.set(0.8, 0.82, -1.8);
  chassisGroup.add(leftRearEndplate, rightRearEndplate);

  // Dual Titanium Exhaust Tips
  const exhaustGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.22, 12);
  exhaustGeo.rotateX(Math.PI / 2);
  const leftExhaust = new THREE.Mesh(exhaustGeo, rimMaterial);
  leftExhaust.position.set(-0.1, 0.42, -1.95);
  const rightExhaust = new THREE.Mesh(exhaustGeo, rimMaterial);
  rightExhaust.position.set(0.1, 0.42, -1.95);
  chassisGroup.add(leftExhaust, rightExhaust);

  // Rear Rain Safety LED
  const rainLightGeo = new THREE.BoxGeometry(0.18, 0.08, 0.04);
  const rainLightMesh = new THREE.Mesh(rainLightGeo, rainLightMaterial);
  rainLightMesh.position.set(0, 0.24, -2.14);
  chassisGroup.add(rainLightMesh);

  rootGroup.add(chassisGroup);

  // 5. Wheels & Suspension Setup
  const brakeCalipers: THREE.Mesh[] = [];

  function buildWheelAssembly(isFront: boolean): { wheelGroup: THREE.Group; tireMesh: THREE.Mesh; caliperMesh: THREE.Mesh } {
    const assemblyGroup = new THREE.Group();

    // Tire
    const tireGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.38, 24);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMesh = new THREE.Mesh(tireGeo, tireMaterial);
    tireMesh.castShadow = true;
    assemblyGroup.add(tireMesh);

    // Rim & Spokes
    const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.39, 16);
    rimGeo.rotateZ(Math.PI / 2);
    const rimMesh = new THREE.Mesh(rimGeo, rimMaterial);
    assemblyGroup.add(rimMesh);

    // Center lock nut
    const nutGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.41, 6);
    nutGeo.rotateZ(Math.PI / 2);
    const nutMesh = new THREE.Mesh(nutGeo, new THREE.MeshStandardMaterial({ color: 0xee2200, roughness: 0.2 }));
    assemblyGroup.add(nutMesh);

    // Brake Disc
    const discGeo = new THREE.CylinderGeometry(0.20, 0.20, 0.03, 16);
    discGeo.rotateZ(Math.PI / 2);
    const discMesh = new THREE.Mesh(discGeo, brakeDiscMaterial);
    discMesh.position.x = isFront ? 0.08 : -0.08;
    assemblyGroup.add(discMesh);

    // Brake Caliper
    const caliperGeo = new THREE.BoxGeometry(0.08, 0.12, 0.14);
    const caliperMesh = new THREE.Mesh(caliperGeo, brakeCaliperMaterial.clone());
    caliperMesh.position.set(isFront ? 0.08 : -0.08, 0.12, 0.05);
    assemblyGroup.add(caliperMesh);
    brakeCalipers.push(caliperMesh);

    return { wheelGroup: assemblyGroup, tireMesh, caliperMesh };
  }

  // Front Left
  const flKnuckle = new THREE.Group();
  flKnuckle.position.set(-0.88, 0.35, 1.4);
  const flWheel = buildWheelAssembly(true);
  flKnuckle.add(flWheel.wheelGroup);
  rootGroup.add(flKnuckle);

  // Front Right
  const frKnuckle = new THREE.Group();
  frKnuckle.position.set(0.88, 0.35, 1.4);
  const frWheel = buildWheelAssembly(false);
  frKnuckle.add(frWheel.wheelGroup);
  rootGroup.add(frKnuckle);

  // Rear Left
  const rlGroup = new THREE.Group();
  rlGroup.position.set(-0.92, 0.35, -1.4);
  const rlWheel = buildWheelAssembly(true);
  rlGroup.add(rlWheel.wheelGroup);
  rootGroup.add(rlGroup);

  // Rear Right
  const rrGroup = new THREE.Group();
  rrGroup.position.set(0.92, 0.35, -1.4);
  const rrWheel = buildWheelAssembly(false);
  rrGroup.add(rrWheel.wheelGroup);
  rootGroup.add(rrGroup);

  // 6. Working LED Headlights
  const leftHeadlight = new THREE.SpotLight(0xffffff, 45, 80, Math.PI / 6, 0.4, 1.5);
  leftHeadlight.position.set(-0.35, 0.42, 1.8);
  leftHeadlight.target.position.set(-0.35, 0.2, 20);
  rootGroup.add(leftHeadlight);
  rootGroup.add(leftHeadlight.target);

  const rightHeadlight = new THREE.SpotLight(0xffffff, 45, 80, Math.PI / 6, 0.4, 1.5);
  rightHeadlight.position.set(0.35, 0.42, 1.8);
  rightHeadlight.target.position.set(0.35, 0.2, 20);
  rootGroup.add(rightHeadlight);
  rootGroup.add(rightHeadlight.target);

  // 7. Soft Ground Contact Shadow Disc (grounding directive from threejs skill)
  const contactShadowGeo = new THREE.PlaneGeometry(2.5, 5.0);
  contactShadowGeo.rotateX(-Math.PI / 2);
  const contactShadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const contactShadow = new THREE.Mesh(contactShadowGeo, contactShadowMat);
  contactShadow.position.y = 0.015;
  rootGroup.add(contactShadow);

  let wheelRotationAngle = 0;

  return {
    group: rootGroup,
    drsFlap: drsFlapMesh,
    frontLeftWheel: flKnuckle,
    frontRightWheel: frKnuckle,
    rearLeftWheel: rlGroup,
    rearRightWheel: rrGroup,
    brakeCalipers,
    headlights: [leftHeadlight, rightHeadlight],
    rainLight: rainLightMesh,
    updateMaterials(newUpgrades: CarUpgrades) {
      bodyMaterial.color.set(newUpgrades.paintColor);
      carbonMaterial.color.set(newUpgrades.accentColor);
      rimMaterial.color.set(newUpgrades.rimColor);
    },
    updateWheelRotation(speedMs: number, steerAngle: number, dt: number) {
      // Steer knuckles
      flKnuckle.rotation.y = steerAngle;
      frKnuckle.rotation.y = steerAngle;

      // Wheel spin
      const rotationSpeed = speedMs / 0.35;
      wheelRotationAngle += rotationSpeed * dt;
      flWheel.wheelGroup.rotation.x = wheelRotationAngle;
      frWheel.wheelGroup.rotation.x = wheelRotationAngle;
      rlWheel.wheelGroup.rotation.x = wheelRotationAngle;
      rrWheel.wheelGroup.rotation.x = wheelRotationAngle;
    },
    updateDrsState(drsActive: boolean) {
      // Rotate DRS flap open (~25 degrees up)
      const targetRotationX = drsActive ? -0.45 : 0;
      drsFlapMesh.rotation.x += (targetRotationX - drsFlapMesh.rotation.x) * 0.25;
    },
    updateBrakeGlow(isBrakingHard: boolean) {
      const glowIntensity = isBrakingHard ? 2.5 : 0;
      brakeCalipers.forEach(caliper => {
        const mat = caliper.material as THREE.MeshStandardMaterial;
        mat.emissive.set(isBrakingHard ? 0xff4400 : 0x000000);
        mat.emissiveIntensity = glowIntensity;
      });
    },
    updateRainLight(isRainOrNight: boolean, time: number) {
      const mat = rainLightMesh.material as THREE.MeshStandardMaterial;
      if (isRainOrNight) {
        // High frequency 4Hz flashing for rain safety light
        const flash = (Math.sin(time * 25) > 0.0) ? 3.5 : 0.2;
        mat.emissiveIntensity = flash;
      } else {
        mat.emissiveIntensity = 0.2;
      }
    }
  };
}
