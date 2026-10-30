import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyFlap,
  updateBirdPhysics,
  calculateBirdPitch,
  checkCollision,
  checkPipePasses,
  calculateMedal,
  DIFFICULTY_PRESETS,
  PipePairData,
} from './rules';

test('applyFlap provides upward velocity boost', () => {
  const result1 = applyFlap(0, 8.0);
  assert.equal(result1, 8.0);

  // If bird was falling downwards (-5), applying flap should give clean upward kick
  const result2 = applyFlap(-5, 8.0);
  assert.equal(result2, 8.0);

  // If bird already moving upwards (+4), adds boost
  const result3 = applyFlap(4, 8.0);
  assert.equal(result3, 4 * 0.2 + 8.0);
});

test('updateBirdPhysics applies gravity and limits fall speed', () => {
  const dt = 0.016;
  const gravity = 20;
  const initialY = 0;
  const initialV = 5;

  const step1 = updateBirdPhysics(initialY, initialV, dt, gravity);
  assert.ok(step1.velocity < initialV);
  assert.ok(step1.y > initialY);

  // Severe fall should be clamped to maxFallSpeed (-14)
  const severeFall = updateBirdPhysics(0, -20, dt, gravity, 14);
  assert.equal(severeFall.velocity, -14);
});

test('calculateBirdPitch pitches up on ascent and dives down on descent', () => {
  const pitchAscent = calculateBirdPitch(8.0, 0, 0.05);
  assert.ok(pitchAscent > 0, 'Bird should pitch upwards when ascending');

  const pitchDescent = calculateBirdPitch(-8.0, 0, 0.05);
  assert.ok(pitchDescent < 0, 'Bird should pitch downwards when diving');
});

test('checkCollision detects ground and ceiling contacts', () => {
  const pipes: PipePairData[] = [];
  const radius = 0.42;

  // Safe middle altitude
  assert.equal(checkCollision(0, radius, pipes, -4.0, 5.0), false);

  // Hits ground
  assert.equal(checkCollision(-3.8, radius, pipes, -4.0, 5.0), true);

  // Hits ceiling
  assert.equal(checkCollision(4.8, radius, pipes, -4.0, 5.0), true);
});

test('checkCollision detects pipe collisions and safe gap navigation', () => {
  const radius = 0.42;
  const testPipes: PipePairData[] = [
    {
      id: 1,
      x: 0, // centered on bird
      gapY: 1.0,
      gapSize: 3.0, // gap extends from -0.5 to +2.5
      width: 1.4,
      passed: false,
    },
  ];

  // Inside safe gap (center is 1.0)
  assert.equal(checkCollision(1.0, radius, testPipes, -4.0, 5.0, 0), false);

  // Too high: hits top pipe (top gap is 2.5, bird top at 2.6 + 0.42 = 3.02)
  assert.equal(checkCollision(2.4, radius, testPipes, -4.0, 5.0, 0), true);

  // Too low: hits bottom pipe (bottom gap is -0.5, bird bottom at -0.3 - 0.42 = -0.72)
  assert.equal(checkCollision(-0.2, radius, testPipes, -4.0, 5.0, 0), true);

  // Bird is far away horizontally (x = 5) -> no collision even at bad altitude
  assert.equal(checkCollision(-2.0, radius, [{ ...testPipes[0], x: 5.0 }], -4.0, 5.0, 0), false);
});

test('checkPipePasses registers newly passed pipes once', () => {
  const pipes: PipePairData[] = [
    { id: 101, x: -0.5, gapY: 0, gapSize: 3, width: 1.4, passed: false },
    { id: 102, x: 2.0, gapY: 0, gapSize: 3, width: 1.4, passed: false },
  ];

  const pass1 = checkPipePasses(0, pipes);
  assert.equal(pass1.scoreIncrement, 1);
  assert.deepEqual(pass1.newlyPassedPipeIds, [101]);
  assert.equal(pipes[0].passed, true);

  // Second check with no new passes
  const pass2 = checkPipePasses(0, pipes);
  assert.equal(pass2.scoreIncrement, 0);
});

test('calculateMedal awards correct medals', () => {
  assert.equal(calculateMedal(0), 'none');
  assert.equal(calculateMedal(4), 'none');
  assert.equal(calculateMedal(5), 'bronze');
  assert.equal(calculateMedal(14), 'bronze');
  assert.equal(calculateMedal(15), 'silver');
  assert.equal(calculateMedal(29), 'silver');
  assert.equal(calculateMedal(30), 'gold');
  assert.equal(calculateMedal(49), 'gold');
  assert.equal(calculateMedal(50), 'platinum');
  assert.equal(calculateMedal(120), 'platinum');
});

test('difficulty presets have proper balanced gaps and speeds', () => {
  assert.ok(DIFFICULTY_PRESETS.easy.gapSize > DIFFICULTY_PRESETS.normal.gapSize);
  assert.ok(DIFFICULTY_PRESETS.normal.gapSize > DIFFICULTY_PRESETS.hard.gapSize);
  assert.ok(DIFFICULTY_PRESETS.hard.speed > DIFFICULTY_PRESETS.normal.speed);
});
