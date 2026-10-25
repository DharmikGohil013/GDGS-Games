import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeEngineRpm,
  computeAutomaticGear,
  computeAeroDownforce,
  computeTireGripFactor,
  computeDriveForce,
  computeBrakingForce,
  updatePhysicsStep
} from './physics';
import { CarInputs, CarUpgrades, VehiclePhysicsState } from '../types/game';

test('computeEngineRpm returns idle RPM at zero speed', () => {
  const rpm = computeEngineRpm(0, 1, 'balanced');
  assert.equal(rpm, 1200);
});

test('computeEngineRpm scales with speed and gear', () => {
  const rpmGear1 = computeEngineRpm(20, 1, 'balanced');
  const rpmGear3 = computeEngineRpm(20, 3, 'balanced');
  assert.ok(rpmGear1 > rpmGear3, 'Lower gear should produce higher RPM at same speed');
});

test('computeAutomaticGear shifts up near redline', () => {
  const newGear = computeAutomaticGear(2, 11000, 35);
  assert.equal(newGear, 3);
});

test('computeAutomaticGear shifts down when RPM drops', () => {
  const newGear = computeAutomaticGear(4, 3800, 25);
  assert.equal(newGear, 3);
});

test('computeAeroDownforce reduces drag when DRS is active', () => {
  const normalAero = computeAeroDownforce(60, 1.8, false);
  const drsAero = computeAeroDownforce(60, 1.8, true);
  assert.ok(drsAero.dragForceNewtons < normalAero.dragForceNewtons, 'DRS must reduce aerodynamic drag');
});

test('computeTireGripFactor favors wet tires in rain and penalizes slicks', () => {
  const softInDry = computeTireGripFactor('soft', 'clear_day', false);
  const softInRain = computeTireGripFactor('soft', 'rain', false);
  const wetInRain = computeTireGripFactor('wet', 'rain', false);

  assert.ok(softInDry > 1.0, 'Soft compound has high dry grip');
  assert.ok(softInRain < 0.6, 'Slick tires have reduced grip in rain');
  assert.ok(wetInRain > softInRain, 'Wet tires must outperform slick tires in rain');
});

function createTestVehicleState(overrides: Partial<VehiclePhysicsState> = {}): VehiclePhysicsState {
  return {
    posX: 0,
    posY: 0.35,
    posZ: 0,
    velX: 0,
    velY: 0,
    velZ: 0,
    rotationY: 0,
    pitch: 0,
    roll: 0,
    speedMs: 0,
    steerAngle: 0,
    rpm: 1200,
    currentGear: 1,
    slipAngle: 0,
    gForceLat: 0,
    gForceLong: 0,
    drsActive: false,
    isOffTrack: false,
    isKerbRiding: false,
    isBrakingHard: false,
    isAirborne: false,
    hasCollided: false,
    collisionNormalX: 0,
    collisionNormalZ: 0,
    collisionIntensity: 0,
    ...overrides,
  };
}

test('updatePhysicsStep integrates speed forward when throttle applied', () => {
  const state = createTestVehicleState({
    speedMs: 10,
    rpm: 4000,
    currentGear: 2,
  });

  const inputs: CarInputs = {
    throttle: 1.0,
    brake: 0,
    steer: 0,
    handbrake: false,
    drs: false,
  };

  const upgrades: CarUpgrades = {
    horsepower: 900,
    downforce: 1.6,
    tireCompound: 'soft',
    suspensionStiffness: 1.4,
    brakeBias: 56,
    gearRatioPreset: 'balanced',
    paintColor: '#e10600',
    accentColor: '#ffffff',
    rimColor: '#111111',
  };

  const nextState = updatePhysicsStep(state, inputs, upgrades, 'clear_day', false, false, 0, 0.016);
  assert.ok(nextState.speedMs > state.speedMs, 'Car should accelerate when throttle is 1');
  assert.ok(nextState.posZ > state.posZ, 'Car should move along forward Z axis');
});

test('high-speed cornering maintains G-force limits and stable turning radius', () => {
  const highSpeedState = createTestVehicleState({
    speedMs: 70, // 252 km/h
    rpm: 10500,
    currentGear: 6,
  });

  const steerLeftInputs: CarInputs = {
    throttle: 1.0,
    brake: 0,
    steer: 1.0, // Left steer
    handbrake: false,
    drs: false,
  };

  const upgrades: CarUpgrades = {
    horsepower: 950,
    downforce: 2.0,
    tireCompound: 'soft',
    suspensionStiffness: 1.5,
    brakeBias: 57,
    gearRatioPreset: 'balanced',
    paintColor: '#e10600',
    accentColor: '#ffffff',
    rimColor: '#111111',
  };

  const turnedLeft = updatePhysicsStep(highSpeedState, steerLeftInputs, upgrades, 'clear_day', false, false, 0, 0.016);
  assert.ok(turnedLeft.gForceLat > 1.0 && turnedLeft.gForceLat <= 5.5, 'Lateral G-force must be within realistic F1 limits');
  assert.ok(turnedLeft.rotationY > 0, 'Turning left must produce positive rotationY');
  assert.ok(turnedLeft.posX > 0, 'Turning left must move toward positive world X (left on screen)');

  const steerRightInputs: CarInputs = {
    throttle: 1.0,
    brake: 0,
    steer: -1.0, // Right steer
    handbrake: false,
    drs: false,
  };

  const turnedRight = updatePhysicsStep(highSpeedState, steerRightInputs, upgrades, 'clear_day', false, false, 0, 0.016);
  assert.ok(turnedRight.rotationY < 0, 'Turning right must produce negative rotationY');
  assert.ok(turnedRight.posX < 0, 'Turning right must move toward negative world X (right on screen)');
});

test('sustained high-speed cornering at 220 km/h cleanly carves both left and right turns without reversal or stalling', () => {
  const upgrades: CarUpgrades = {
    horsepower: 950,
    downforce: 2.0,
    tireCompound: 'soft',
    suspensionStiffness: 1.5,
    brakeBias: 57,
    gearRatioPreset: 'balanced',
    paintColor: '#e10600',
    accentColor: '#ffffff',
    rimColor: '#111111',
  };

  // Simulate 30 frames (~0.5s) of sustained left turning at 60 m/s (~216 km/h)
  let stateLeft = createTestVehicleState({
    speedMs: 60,
    rpm: 9500,
    currentGear: 5,
  });

  const leftInput: CarInputs = { throttle: 1, brake: 0, steer: 1.0, handbrake: false, drs: false };
  for (let f = 0; f < 30; f++) {
    stateLeft = updatePhysicsStep(stateLeft, leftInput, upgrades, 'clear_day', false, false, 0, 0.016);
    assert.ok(stateLeft.posX >= 0, `Frame ${f}: Turning left must never kick negative X`);
    assert.ok(stateLeft.rotationY >= 0, `Frame ${f}: Turning left heading must remain positive`);
  }
  assert.ok(stateLeft.posX > 2.0, 'Car should have traversed significantly to the left (+X)');
  assert.ok(stateLeft.speedMs > 50, 'Car should maintain high momentum through corner without abrupt speed loss');

  // Simulate 30 frames (~0.5s) of sustained right turning at 60 m/s
  let stateRight = createTestVehicleState({
    speedMs: 60,
    rpm: 9500,
    currentGear: 5,
  });

  const rightInput: CarInputs = { throttle: 1, brake: 0, steer: -1.0, handbrake: false, drs: false };
  for (let f = 0; f < 30; f++) {
    stateRight = updatePhysicsStep(stateRight, rightInput, upgrades, 'clear_day', false, false, 0, 0.016);
    assert.ok(stateRight.posX <= 0, `Frame ${f}: Turning right must never kick positive X`);
    assert.ok(stateRight.rotationY <= 0, `Frame ${f}: Turning right heading must remain negative`);
  }
  assert.ok(stateRight.posX < -2.0, 'Car should have traversed significantly to the right (-X)');
  assert.ok(stateRight.speedMs > 50, 'Car should maintain high momentum through corner without abrupt speed loss');
});

test('gravity pulls airborne vehicle downward at -9.81 m/s^2', () => {
  const upgrades: CarUpgrades = {
    horsepower: 900,
    downforce: 1.5,
    tireCompound: 'soft',
    suspensionStiffness: 1.4,
    brakeBias: 56,
    gearRatioPreset: 'balanced',
    paintColor: '#e10600',
    accentColor: '#ffffff',
    rimColor: '#111111',
  };

  // Car launched into air with upward velocity 5 m/s at 2m elevation
  const airborneState: VehiclePhysicsState = {
    posX: 0,
    posY: 2.0,
    posZ: 0,
    velX: 0,
    velY: 5.0,
    velZ: 30.0,
    rotationY: 0,
    pitch: 0,
    roll: 0,
    speedMs: 30,
    steerAngle: 0,
    rpm: 7000,
    currentGear: 3,
    slipAngle: 0,
    gForceLat: 0,
    gForceLong: 0,
    drsActive: false,
    isOffTrack: false,
    isKerbRiding: false,
    isBrakingHard: false,
    isAirborne: true,
    hasCollided: false,
    collisionNormalX: 0,
    collisionNormalZ: 0,
    collisionIntensity: 0,
  };

  const inputs: CarInputs = { throttle: 1, brake: 0, steer: 0, handbrake: false, drs: false };
  const next = updatePhysicsStep(airborneState, inputs, upgrades, 'clear_day', false, false, 0, 0.016);

  assert.ok(next.isAirborne, 'Vehicle should be flagged as airborne when above ground');
  assert.ok(next.velY < airborneState.velY, 'Gravity must reduce vertical velocity');
  assert.ok(next.posY > airborneState.posY, 'Vehicle should still rise when initial velY is positive');
});

test('rigid-body barrier collider pushes car back and reflects normal velocity', () => {
  const upgrades: CarUpgrades = {
    horsepower: 900,
    downforce: 1.5,
    tireCompound: 'soft',
    suspensionStiffness: 1.4,
    brakeBias: 56,
    gearRatioPreset: 'balanced',
    paintColor: '#e10600',
    accentColor: '#ffffff',
    rimColor: '#111111',
  };

  // Car driving right toward the right barrier (+12m lateral distance, where barrier is at 7m + 2.5m = 9.5m)
  const barrierHitState: VehiclePhysicsState = {
    posX: 12.0,
    posY: 0.35,
    posZ: 0,
    velX: 15.0,
    velY: 0,
    velZ: 25.0,
    rotationY: 0.5,
    pitch: 0,
    roll: 0,
    speedMs: 29,
    steerAngle: 0,
    rpm: 7000,
    currentGear: 3,
    slipAngle: 0,
    gForceLat: 0,
    gForceLong: 0,
    drsActive: false,
    isOffTrack: true,
    isKerbRiding: false,
    isBrakingHard: false,
    isAirborne: false,
    hasCollided: false,
    collisionNormalX: 0,
    collisionNormalZ: 0,
    collisionIntensity: 0,
  };

  const colliderCtx = {
    trackWidth: 14,
    normalX: 1, // normal points to right
    normalZ: 0,
    tangentX: 0,
    tangentY: 0,
    tangentZ: 1,
    distanceFromCenterline: 12.0,
    signedLateralDistance: 12.0, // on right side, past 9.5m barrier
  };

  const inputs: CarInputs = { throttle: 1, brake: 0, steer: 0, handbrake: false, drs: false };
  const postCollision = updatePhysicsStep(barrierHitState, inputs, upgrades, 'clear_day', false, false, 0, 0.016, colliderCtx);

  assert.ok(postCollision.hasCollided, 'Collision flag must be true upon barrier penetration');
  assert.ok(postCollision.collisionIntensity > 0, 'Collision intensity should be non-zero');
  assert.ok(postCollision.posX < barrierHitState.posX, 'Positional correction must push car inward away from barrier');
});
