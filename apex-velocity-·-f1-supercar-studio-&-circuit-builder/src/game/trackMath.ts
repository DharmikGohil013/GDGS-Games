import { TrackPoint } from '../types/game';

export interface EvaluatedTrackPoint {
  x: number;
  y: number;
  z: number;
  tangentX: number;
  tangentY: number;
  tangentZ: number;
  normalX: number; // perpendicular horizontal vector
  normalZ: number;
  width: number;
  banking: number; // degrees
  kerb: 'none' | 'left' | 'right' | 'both';
  distanceAlongTrack: number;
  progressPercent: number; // 0 to 1
}

// Catmull-Rom spline point interpolation
export function catmullRom(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number
): number {
  const v0 = (p2 - p0) * 0.5;
  const v1 = (p3 - p1) * 0.5;
  const t2 = t * t;
  const t3 = t * t2;
  return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;
}

export function generateSplineTrack(
  controlPoints: TrackPoint[],
  segmentsPerSpan = 20,
  isClosed = true
): EvaluatedTrackPoint[] {
  const n = controlPoints.length;
  if (n < 3) return [];

  const rawPoints: Array<{ x: number; y: number; z: number; width: number; banking: number; kerb: TrackPoint['kerb'] }> = [];

  for (let i = 0; i < n; i++) {
    const p0 = controlPoints[(i - 1 + n) % n];
    const p1 = controlPoints[i];
    const p2 = controlPoints[(i + 1) % n];
    const p3 = controlPoints[(i + 2) % n];

    for (let s = 0; s < segmentsPerSpan; s++) {
      const t = s / segmentsPerSpan;
      const x = catmullRom(p0.x, p1.x, p2.x, p3.x, t);
      const y = catmullRom(p0.y, p1.y, p2.y, p3.y, t);
      const z = catmullRom(p0.z, p1.z, p2.z, p3.z, t);

      const w0 = p1.width ?? 14;
      const w1 = p2.width ?? 14;
      const width = w0 + (w1 - w0) * t;

      const b0 = p1.banking ?? 0;
      const b1 = p2.banking ?? 0;
      const banking = b0 + (b1 - b0) * t;

      const kerb = t < 0.5 ? (p1.kerb ?? 'none') : (p2.kerb ?? 'none');

      rawPoints.push({ x, y, z, width, banking, kerb });
    }
  }

  // Calculate cumulative distances and tangents
  const result: EvaluatedTrackPoint[] = [];
  let cumulativeDist = 0;

  for (let i = 0; i < rawPoints.length; i++) {
    const cur = rawPoints[i];
    const next = rawPoints[(i + 1) % rawPoints.length];

    const dx = next.x - cur.x;
    const dy = next.y - cur.y;
    const dz = next.z - cur.z;
    const segLen = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const tangentX = segLen > 0.0001 ? dx / segLen : 0;
    const tangentY = segLen > 0.0001 ? dy / segLen : 0;
    const tangentZ = segLen > 0.0001 ? dz / segLen : 1;

    // Horizontal perpendicular normal (for track width extrusion)
    const normalX = -tangentZ;
    const normalZ = tangentX;

    result.push({
      x: cur.x,
      y: cur.y,
      z: cur.z,
      tangentX,
      tangentY,
      tangentZ,
      normalX,
      normalZ,
      width: cur.width,
      banking: cur.banking,
      kerb: cur.kerb ?? 'none',
      distanceAlongTrack: cumulativeDist,
      progressPercent: 0,
    });

    cumulativeDist += segLen;
  }

  // Normalize progress percent
  const totalLength = cumulativeDist > 0 ? cumulativeDist : 1;
  for (let i = 0; i < result.length; i++) {
    result[i].progressPercent = result[i].distanceAlongTrack / totalLength;
  }

  return result;
}

export function findClosestTrackPoint(
  x: number,
  z: number,
  evaluatedTrack: EvaluatedTrackPoint[]
): {
  closestIndex: number;
  closestPoint: EvaluatedTrackPoint;
  distanceFromCenterline: number;
  isOffTrack: boolean;
  isKerbRiding: boolean;
} {
  if (evaluatedTrack.length === 0) {
    return {
      closestIndex: 0,
      closestPoint: {
        x: 0, y: 0, z: 0,
        tangentX: 0, tangentY: 0, tangentZ: 1,
        normalX: 1, normalZ: 0,
        width: 14, banking: 0, kerb: 'none',
        distanceAlongTrack: 0, progressPercent: 0
      },
      distanceFromCenterline: 0,
      isOffTrack: false,
      isKerbRiding: false,
    };
  }

  let minDistSq = Infinity;
  let closestIndex = 0;

  for (let i = 0; i < evaluatedTrack.length; i++) {
    const pt = evaluatedTrack[i];
    const dx = x - pt.x;
    const dz = z - pt.z;
    const distSq = dx * dx + dz * dz;
    if (distSq < minDistSq) {
      minDistSq = distSq;
      closestIndex = i;
    }
  }

  // Check segment projection around closest point for precision
  const pA = evaluatedTrack[closestIndex];
  const nextIdx = (closestIndex + 1) % evaluatedTrack.length;
  const pB = evaluatedTrack[nextIdx];
  const prevIdx = (closestIndex - 1 + evaluatedTrack.length) % evaluatedTrack.length;
  const pPrev = evaluatedTrack[prevIdx];

  // Project point onto segment
  function distToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
    const abx = bx - ax;
    const abz = bz - az;
    const abLenSq = abx * abx + abz * abz;
    if (abLenSq < 0.0001) return Math.hypot(px - ax, pz - az);
    const t = Math.max(0, Math.min(1, ((px - ax) * abx + (pz - az) * abz) / abLenSq));
    const projX = ax + t * abx;
    const projZ = az + t * abz;
    return Math.hypot(px - projX, pz - projZ);
  }

  const distFwd = distToSegment(x, z, pA.x, pA.z, pB.x, pB.z);
  const distBack = distToSegment(x, z, pPrev.x, pPrev.z, pA.x, pA.z);
  const distFromCenterline = Math.min(distFwd, distBack);

  const closest = pA;
  const halfRoadWidth = closest.width * 0.5;
  const kerbWidth = 1.6;

  const isOffTrack = distFromCenterline > (halfRoadWidth + kerbWidth);
  const isKerbRiding =
    !isOffTrack &&
    distFromCenterline > (halfRoadWidth - 0.4) &&
    distFromCenterline <= (halfRoadWidth + kerbWidth) &&
    closest.kerb !== 'none';

  return {
    closestIndex,
    closestPoint: closest,
    distanceFromCenterline: distFromCenterline,
    isOffTrack,
    isKerbRiding,
  };
}

export function getSectorForProgress(progressPercent: number): 1 | 2 | 3 {
  if (progressPercent < 0.333) return 1;
  if (progressPercent < 0.666) return 2;
  return 3;
}

export function formatLapTime(timeInSeconds: number | null): string {
  if (timeInSeconds === null || timeInSeconds <= 0 || !Number.isFinite(timeInSeconds)) {
    return '--:--.---';
  }
  const mins = Math.floor(timeInSeconds / 60);
  const secs = Math.floor(timeInSeconds % 60);
  const ms = Math.floor((timeInSeconds % 1) * 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

export function formatDelta(deltaSeconds: number | null): string {
  if (deltaSeconds === null || !Number.isFinite(deltaSeconds)) return '+0.000';
  const sign = deltaSeconds <= 0 ? '-' : '+';
  const abs = Math.abs(deltaSeconds);
  return `${sign}${abs.toFixed(3)}`;
}
