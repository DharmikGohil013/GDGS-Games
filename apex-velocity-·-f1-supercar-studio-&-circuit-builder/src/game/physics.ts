import { CarInputs, CarUpgrades, VehiclePhysicsState, WeatherType } from '../types/game';

// Gear ratios for a modern high-performance F1/Supercar 7-speed dual-clutch transmission
const GEAR_RATIOS: Record<string, number[]> = {
  acceleration: [0, 3.4, 2.5, 1.9, 1.5, 1.25, 1.05, 0.90],
  balanced:     [0, 3.2, 2.3, 1.7, 1.35, 1.10, 0.92, 0.78],
  top_speed:    [0, 2.9, 2.1, 1.55, 1.20, 0.98, 0.82, 0.68],
};

const IDLE_RPM = 1200;
const REDLINE_RPM = 11500;
const SHIFT_UP_RPM = 10200;
const SHIFT_DOWN_RPM = 4200;

export function computeEngineRpm(
  speedMs: number,
  gear: number,
  gearPreset: CarUpgrades['gearRatioPreset']
): number {
  if (gear === 0) return IDLE_RPM;
  const ratios = GEAR_RATIOS[gearPreset] || GEAR_RATIOS.balanced;
  const ratio = ratios[gear] || 1.0;
  // wheel radius ~0.33m, final drive ~3.7
  const wheelRps = speedMs / (2 * Math.PI * 0.33);
  const calculatedRpm = wheelRps * ratio * 3.7 * 60;
  return Math.min(REDLINE_RPM, Math.max(IDLE_RPM, Math.round(calculatedRpm)));
}

export function computeAutomaticGear(
  currentGear: number,
  rpm: number,
  speedMs: number
): number {
  if (speedMs < 0.5) return 1;
  if (rpm > SHIFT_UP_RPM && currentGear < 7) {
    return currentGear + 1;
  }
  if (rpm < SHIFT_DOWN_RPM && currentGear > 1) {
    return currentGear - 1;
  }
  return currentGear;
}

export function computeAeroDownforce(
  speedMs: number,
  downforceFactor: number,
  drsActive: boolean
): { downforceNewtons: number; dragForceNewtons: number } {
  // Aero force scales with v^2
  const speedSq = speedMs * speedMs;
  const effectiveDownforce = drsActive ? downforceFactor * 0.65 : downforceFactor;
  // Downforce: high at 200+ km/h (55 m/s)
  const downforceNewtons = 0.5 * 1.225 * 1.6 * effectiveDownforce * speedSq;
  // Drag force: DRS opens rear wing, reducing drag by ~35%
  const dragCoeff = drsActive ? 0.45 : 0.72;
  const dragForceNewtons = 0.5 * 1.225 * dragCoeff * (effectiveDownforce * 0.8) * speedSq;

  return { downforceNewtons, dragForceNewtons };
}

export function computeTireGripFactor(
  compound: CarUpgrades['tireCompound'],
  weather: WeatherType,
  isOffTrack: boolean
): number {
  if (isOffTrack) {
    return 0.35; // off-track gravel / grass has severe grip penalty
  }

  const isWet = weather === 'rain' || weather === 'night_storm';

  if (isWet) {
    // Wet condition: wet tires excel; slick soft/hard lose grip heavily
    if (compound === 'wet') return 0.88;
    if (compound === 'soft') return 0.48; // aquaplaning risk
    return 0.42; // hard slick is very slippery in wet
  }

  // Dry track
  if (compound === 'soft') return 1.15; // peak qualifying grip
  if (compound === 'hard') return 0.98; // durable race compound
  return 0.78; // wet tires on dry track overheat and lose grip
}

export function computeDriveForce(
  throttle: number,
  gear: number,
  speedMs: number,
  horsepower: number,
  gearPreset: CarUpgrades['gearRatioPreset']
): number {
  if (throttle <= 0.01 || gear < 1) return 0;
  const ratios = GEAR_RATIOS[gearPreset] || GEAR_RATIOS.balanced;
  const gearRatio = ratios[gear] || 1.0;
  
  // Power (Watts) = HP * 745.7
  const powerWatts = horsepower * 745.7 * throttle;
  // Force = Power / speed (with low speed clamp)
  const effectiveSpeed = Math.max(speedMs, 3.5);
  const rawDriveForce = (powerWatts / effectiveSpeed) * (gearRatio / 2.0);

  // Traction limit so wheels don't generate infinite force at standstill
  const maxTractionForce = 12000;
  return Math.min(rawDriveForce, maxTractionForce);
}

export function computeBrakingForce(
  brakeInput: number,
  brakeBias: number,
  speedMs: number
): number {
  if (brakeInput <= 0.01 || speedMs <= 0.05) return 0;
  // F1 carbon-carbon brakes can pull over 4-5G of deceleration
  const baseBrakingForce = 18000;
  return baseBrakingForce * brakeInput;
}

export interface TrackColliderContext {
  trackWidth: number;
  normalX: number;
  normalZ: number;
  tangentX: number;
  tangentY: number;
  tangentZ: number;
  distanceFromCenterline: number;
  signedLateralDistance: number;
}

const GRAVITY = -9.81; // m/s^2

export function updatePhysicsStep(
  state: VehiclePhysicsState,
  inputs: CarInputs,
  upgrades: CarUpgrades,
  weather: WeatherType,
  isOffTrack: boolean,
  isKerbRiding: boolean,
  roadElevation: number,
  dt: number,
  colliderContext?: TrackColliderContext
): VehiclePhysicsState {
  // Clamp delta time to avoid tunneling on frame drops
  const clampedDt = Math.min(Math.max(dt, 0.001), 0.05);

  const mass = 798; // F1 minimum weight in kg (car + driver)
  const isAirbornePrev = state.isAirborne ?? false;
  // Reduced tire grip while airborne (wheels off tarmac)
  const baseGrip = computeTireGripFactor(upgrades.tireCompound, weather, isOffTrack);
  const gripFactor = isAirbornePrev ? baseGrip * 0.15 : baseGrip;
  const aero = computeAeroDownforce(state.speedMs, upgrades.downforce, inputs.drs);

  // Compute drive or brake forces
  const driveForce = computeDriveForce(
    inputs.throttle,
    state.currentGear,
    state.speedMs,
    upgrades.horsepower,
    upgrades.gearRatioPreset
  );

  const brakeForce = computeBrakingForce(inputs.brake, upgrades.brakeBias, state.speedMs);
  const rollingResistance = (isOffTrack ? 450 : 80) * (isKerbRiding ? 1.8 : 1.0);

  // Net longitudinal force
  let netLongForce = driveForce - brakeForce - aero.dragForceNewtons - rollingResistance;

  if (inputs.handbrake) {
    netLongForce -= 8000;
  }

  // Prevent reversing if braking from small speed
  if (state.speedMs < 0.2 && inputs.brake > 0) {
    netLongForce = 0;
  }

  // Acceleration a = F / m
  const accel = netLongForce / mass;
  let newSpeedMs = Math.max(0, state.speedMs + accel * clampedDt);

  // Top speed aerodynamic terminal velocity clamp
  const maxPossibleSpeedMs = upgrades.horsepower > 950 ? 98 : 90; // ~350 km/h
  if (newSpeedMs > maxPossibleSpeedMs) {
    newSpeedMs = maxPossibleSpeedMs;
  }

  // 1. GRAVITY & 3D RIGID-BODY VERTICAL SUSPENSION DYNAMICS
  const targetGroundY = roadElevation + (isKerbRiding ? 0.08 * Math.sin(Date.now() * 0.04) : 0);
  const restRideHeight = 0.35;
  const targetChassisY = targetGroundY + restRideHeight;

  let posY = state.posY || targetChassisY;
  let velY = state.velY || 0;
  let isAirborne = false;

  const kSpring = 52000 * upgrades.suspensionStiffness;
  const cDamper = 4000 * upgrades.suspensionStiffness;
  const suspensionDeflection = targetChassisY - posY;

  if (posY <= targetChassisY + 0.05) {
    // Ground contact: suspension spring-damper + gravity + downforce
    const suspForce = kSpring * suspensionDeflection - cDamper * velY;
    const netVerticalForce = suspForce + mass * GRAVITY - aero.downforceNewtons;
    const accelY = netVerticalForce / mass;

    velY += accelY * clampedDt;
    posY += velY * clampedDt;

    // Hard ground floor collider: prevents sinking beneath asphalt
    if (posY < targetGroundY + 0.16) {
      posY = targetGroundY + 0.16;
      if (velY < -1.5) {
        velY = -velY * 0.20; // slight chassis rebound
      } else {
        velY = 0;
      }
    }

    // Launch off crest or curb:
    if (posY > targetChassisY + 0.08 && velY > 0.4) {
      isAirborne = true;
    }
  } else {
    // AIRBORNE BALLISTIC FLIGHT UNDER GRAVITY
    isAirborne = true;
    const netVerticalForce = mass * GRAVITY - aero.downforceNewtons * 0.35;
    const accelY = netVerticalForce / mass;

    velY += accelY * clampedDt;
    posY += velY * clampedDt;

    // Landing contact with ground
    if (posY <= targetChassisY) {
      posY = targetChassisY;
      velY = -velY * 0.16; // impact shock absorption
      isAirborne = false;
    }
  }

  // 2. Progressive High-Speed Steering Sensitivity (F1 Dynamic Steering Rack)
  const speedKmh = newSpeedMs * 3.6;
  const steerSensitivity = Math.max(0.42, 1.0 - Math.pow(Math.min(speedKmh, 330) / 360, 1.1) * 0.58);
  const maxLockAngle = 0.48; // ~27.5 degrees
  const targetSteerAngle = inputs.steer * maxLockAngle * steerSensitivity;

  // Steering response speed (crisp turn-in, fast return-to-center for zero wobble)
  const steerRate = Math.abs(inputs.steer) > 0.01 ? 16.0 : 28.0;
  const newSteerAngle = state.steerAngle + (targetSteerAngle - state.steerAngle) * Math.min(1.0, steerRate * clampedDt);

  // Aerodynamic downforce lateral grip boost (up to 5.2G at high speed)
  const downforceG = (aero.downforceNewtons / (mass * 9.81)) * 1.35;
  const totalMaxG = Math.min(5.5, Math.max(1.8, (2.2 * gripFactor) + downforceG));
  const maxLatAcc = totalMaxG * 9.81;

  // Ackermann kinematic turning rate: omega = (v / L) * tan(delta)
  const wheelbase = 3.2;
  const absSteer = Math.abs(newSteerAngle);
  const kinematicYawRate = (newSpeedMs / wheelbase) * Math.tan(absSteer);

  // High-speed cornering authority bounded by aerodynamic grip envelope
  const maxGripYawRate = maxLatAcc / Math.max(newSpeedMs, 1.0);
  const idealYawRate = Math.min(kinematicYawRate, maxGripYawRate * 1.06) * Math.sign(newSteerAngle);

  // Actual lateral centripetal acceleration
  const centripetalAcc = newSpeedMs * Math.abs(idealYawRate);
  const actualG = centripetalAcc / 9.81;

  // Progressive lateral slip angle at the grip limit
  let lateralSlip = 0;
  if (actualG > totalMaxG * 0.90 && newSpeedMs > 6) {
    const excessG = Math.max(0, actualG - totalMaxG * 0.90);
    const excessRatio = Math.min(1.0, excessG / 2.0);
    lateralSlip = excessRatio * 0.025 * Math.sign(newSteerAngle);
    newSpeedMs = Math.max(0, newSpeedMs - excessRatio * 0.6 * clampedDt);
  }

  // Heading rotation integration (yaw)
  let newRotationY = state.rotationY + idealYawRate * clampedDt;

  // Authentic vehicle course angle (body heading minus slip angle)
  const courseAngle = newRotationY - lateralSlip;
  let velX = newSpeedMs * Math.sin(courseAngle);
  let velZ = newSpeedMs * Math.cos(courseAngle);

  let newPosX = state.posX + velX * clampedDt;
  let newPosZ = state.posZ + velZ * clampedDt;

  // 3. RIGID-BODY COLLIDER SYSTEM (Armco Barriers & Track Runoff Limits)
  let hasCollided = false;
  let collisionNormalX = 0;
  let collisionNormalZ = 0;
  let collisionIntensity = 0;

  if (colliderContext) {
    const halfWidth = colliderContext.trackWidth * 0.5;
    const barrierDist = halfWidth + 2.5;
    const latDist = colliderContext.signedLateralDistance;
    const penetration = Math.abs(latDist) - barrierDist;

    if (penetration > 0) {
      // Barrier contact! Normal points from wall inward toward track centerline
      const nX = latDist > 0 ? -colliderContext.normalX : colliderContext.normalX;
      const nZ = latDist > 0 ? -colliderContext.normalZ : colliderContext.normalZ;

      // Rigid-body positional correction (resolve overlap)
      newPosX += nX * (penetration + 0.05);
      newPosZ += nZ * (penetration + 0.05);

      // Normal velocity component
      const vNormal = velX * nX + velZ * nZ;
      if (vNormal < 0) {
        hasCollided = true;
        collisionIntensity = Math.min(1.0, Math.abs(vNormal) / 16.0);
        collisionNormalX = nX;
        collisionNormalZ = nZ;

        // Elastic restitution impulse (coefficient of restitution e = 0.35)
        const restitution = 0.35;
        const vNxNew = -restitution * vNormal * nX;
        const vNzNew = -restitution * vNormal * nZ;

        // Tangential velocity with metallic friction drag
        const vTx = velX - vNormal * nX;
        const vTz = velZ - vNormal * nZ;
        const friction = 0.82;
        const vTxNew = vTx * friction;
        const vTzNew = vTz * friction;

        // Post-impact rigid-body velocity
        velX = vTxNew + vNxNew;
        velZ = vTzNew + vNzNew;
        newSpeedMs = Math.hypot(velX, velZ);
        newRotationY = Math.atan2(velX, velZ);
      }
    }
  }

  // 4. Rigid-Body chassis weight transfer (pitch & roll inertia)
  const targetPitch = Math.max(-0.06, Math.min(0.06, -accel * 0.008 + (isAirborne ? -velY * 0.02 : 0)));
  const targetRoll = Math.max(-0.07, Math.min(0.07, -(actualG / totalMaxG) * Math.sign(newSteerAngle) * 0.048));

  const newPitch = state.pitch + (targetPitch - state.pitch) * 12.0 * clampedDt;
  const newRoll = state.roll + (targetRoll - state.roll) * 12.0 * clampedDt;

  // Compute RPM and gear
  const newRpm = computeEngineRpm(newSpeedMs, state.currentGear, upgrades.gearRatioPreset);
  const newGear = computeAutomaticGear(state.currentGear, newRpm, newSpeedMs);

  return {
    posX: newPosX,
    posY: posY,
    posZ: newPosZ,
    velX,
    velY,
    velZ,
    rotationY: newRotationY,
    pitch: newPitch,
    roll: newRoll,
    speedMs: Math.max(0, newSpeedMs),
    steerAngle: newSteerAngle,
    rpm: newRpm,
    currentGear: newGear,
    slipAngle: lateralSlip,
    gForceLat: Math.min(5.5, actualG),
    gForceLong: accel / 9.81,
    drsActive: inputs.drs && newSpeedMs > 25,
    isOffTrack,
    isKerbRiding,
    isBrakingHard: inputs.brake > 0.6 && newSpeedMs > 10,
    isAirborne,
    hasCollided,
    collisionNormalX,
    collisionNormalZ,
    collisionIntensity,
  };
}
