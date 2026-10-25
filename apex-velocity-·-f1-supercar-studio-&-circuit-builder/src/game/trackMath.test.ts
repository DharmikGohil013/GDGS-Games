import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateSplineTrack,
  findClosestTrackPoint,
  getSectorForProgress,
  formatLapTime,
  formatDelta
} from './trackMath';
import { TrackPoint } from '../types/game';

const mockTrackPoints: TrackPoint[] = [
  { id: '1', x: 0, y: 0, z: 0, width: 14, kerb: 'left' },
  { id: '2', x: 100, y: 0, z: 0, width: 14, kerb: 'none' },
  { id: '3', x: 100, y: 0, z: 100, width: 14, kerb: 'right' },
  { id: '4', x: 0, y: 0, z: 100, width: 14, kerb: 'both' },
];

test('generateSplineTrack generates smooth continuous path from control points', () => {
  const evaluated = generateSplineTrack(mockTrackPoints, 8, true);
  assert.equal(evaluated.length, 32); // 4 points * 8 segments
  assert.ok(evaluated[evaluated.length - 1].distanceAlongTrack > 300, 'Track length should be > 300m');
});

test('findClosestTrackPoint identifies centerline distance and on-track status', () => {
  const evaluated = generateSplineTrack(mockTrackPoints, 8, true);
  
  // Test with point directly on track centerline
  const ptOnTrack = evaluated[4];
  const onTrackResult = findClosestTrackPoint(ptOnTrack.x, ptOnTrack.z, evaluated);
  assert.equal(onTrackResult.isOffTrack, false);
  assert.ok(onTrackResult.distanceFromCenterline < 0.1, 'Should be right at centerline');

  // Point far off track
  const offTrackResult = findClosestTrackPoint(300, 300, evaluated);
  assert.equal(offTrackResult.isOffTrack, true);
});

test('getSectorForProgress divides track into three sectors', () => {
  assert.equal(getSectorForProgress(0.1), 1);
  assert.equal(getSectorForProgress(0.5), 2);
  assert.equal(getSectorForProgress(0.85), 3);
});

test('formatLapTime and formatDelta format times correctly', () => {
  assert.equal(formatLapTime(84.382), '1:24.382');
  assert.equal(formatLapTime(null), '--:--.---');
  assert.equal(formatDelta(-0.412), '-0.412');
  assert.equal(formatDelta(0.824), '+0.824');
});
