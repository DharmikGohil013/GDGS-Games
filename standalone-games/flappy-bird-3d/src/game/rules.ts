/**
 * Pure game rules, physics, collision detection, and scoring logic.
 * Decoupled from React and Three.js rendering for deterministic unit testing.
 */

export interface BirdPhysicsState {
  y: number;
  velocity: number;
  pitch: number; // in radians
  isAlive: boolean;
}

export interface PipePairData {
  id: number;
  x: number;
  gapY: number; // center height of the gap
  gapSize: number;
  width: number;
  passed: boolean;
}

export interface DifficultyConfig {
  name: string;
  gapSize: number;
  speed: number;
  gravity: number;
  flapStrength: number;
  spawnDistance: number;
}

export type DifficultyLevel = 'easy' | 'normal' | 'hard';

export const DIFFICULTY_PRESETS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    name: 'Relaxed',
    gapSize: 4.2,
    speed: 4.2,
    gravity: 19,
    flapStrength: 7.2,
    spawnDistance: 8.5,
  },
  normal: {
    name: 'Classic',
    gapSize: 3.4,
    speed: 5.2,
    gravity: 23,
    flapStrength: 8.0,
    spawnDistance: 8.0,
  },
  hard: {
    name: 'Pro',
    gapSize: 2.8,
    speed: 6.2,
    gravity: 27,
    flapStrength: 8.8,
    spawnDistance: 7.5,
  },
};

export const WORLD_BOUNDS = {
  groundY: -4.2,
  ceilingY: 5.5,
  birdX: 0,
  birdRadius: 0.42, // Collision radius
  minGapY: -2.0,
  maxGapY: 3.2,
};

export type MedalType = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';

/**
 * Calculates new velocity on flap action.
 */
export function applyFlap(currentVelocity: number, flapStrength: number): number {
  return Math.max(currentVelocity * 0.2, 0) + flapStrength;
}

/**
 * Updates bird vertical position and velocity clamped to max fall speed.
 */
export function updateBirdPhysics(
  y: number,
  velocity: number,
  dt: number,
  gravity: number,
  maxFallSpeed = 14
): { y: number; velocity: number } {
  const clampedDt = Math.min(dt, 0.05);
  const newVelocity = Math.max(velocity - gravity * clampedDt, -maxFallSpeed);
  const newY = y + newVelocity * clampedDt;
  return { y: newY, velocity: newVelocity };
}

/**
 * Calculates bird pitch rotation based on current vertical velocity.
 * Tilts up on ascent, smoothly dives nose-down on descent.
 */
export function calculateBirdPitch(velocity: number, currentPitch: number, dt: number): number {
  const clampedDt = Math.min(dt, 0.05);
  let targetPitch = 0;
  if (velocity > 0) {
    targetPitch = Math.min(velocity / 8.0, 1.0) * 0.45;
  } else {
    targetPitch = Math.max(velocity / 12.0, -1.0) * 1.35;
  }

  const smoothing = velocity > 0 ? 18 : 6;
  const t = 1 - Math.exp(-smoothing * clampedDt);
  return currentPitch + (targetPitch - currentPitch) * t;
}

/**
 * Checks for collision against ground, ceiling, and all active pipes.
 */
export function checkCollision(
  birdY: number,
  birdRadius: number,
  pipes: PipePairData[],
  groundY: number = WORLD_BOUNDS.groundY,
  ceilingY: number = WORLD_BOUNDS.ceilingY,
  birdX: number = WORLD_BOUNDS.birdX
): boolean {
  // Ground collision (bird center minus radius hits or penetrates ground)
  if (birdY - birdRadius <= groundY) {
    return true;
  }

  // Ceiling collision
  if (birdY + birdRadius >= ceilingY) {
    return true;
  }

  // Pipe collision
  for (const pipe of pipes) {
    const halfWidth = pipe.width / 2;
    const pipeMinX = pipe.x - halfWidth;
    const pipeMaxX = pipe.x + halfWidth;

    // Check if bird overlaps horizontally with pipe column
    if (birdX + birdRadius > pipeMinX && birdX - birdRadius < pipeMaxX) {
      const halfGap = pipe.gapSize / 2;
      const gapTop = pipe.gapY + halfGap;
      const gapBottom = pipe.gapY - halfGap;

      // Top pipe collision: bird top edge is higher than gap top
      if (birdY + birdRadius > gapTop) {
        return true;
      }

      // Bottom pipe collision: bird bottom edge is lower than gap bottom
      if (birdY - birdRadius < gapBottom) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Checks whether any pipes were passed by the bird and returns new score increment.
 */
export function checkPipePasses(
  birdX: number,
  pipes: PipePairData[]
): { scoreIncrement: number; newlyPassedPipeIds: number[] } {
  let increment = 0;
  const newlyPassedPipeIds: number[] = [];

  for (const pipe of pipes) {
    if (!pipe.passed && birdX > pipe.x) {
      pipe.passed = true;
      increment++;
      newlyPassedPipeIds.push(pipe.id);
    }
  }

  return { scoreIncrement: increment, newlyPassedPipeIds };
}

/**
 * Computes medal rank from final score.
 */
export function calculateMedal(score: number): MedalType {
  if (score >= 50) return 'platinum';
  if (score >= 30) return 'gold';
  if (score >= 15) return 'silver';
  if (score >= 5) return 'bronze';
  return 'none';
}

/**
 * Generates initial pipes for level start.
 */
export function createPipe(
  id: number,
  x: number,
  gapSize: number,
  minY = WORLD_BOUNDS.minGapY,
  maxY = WORLD_BOUNDS.maxGapY
): PipePairData {
  const gapY = minY + Math.random() * (maxY - minY);
  return {
    id,
    x,
    gapY,
    gapSize,
    width: 1.4,
    passed: false,
  };
}
