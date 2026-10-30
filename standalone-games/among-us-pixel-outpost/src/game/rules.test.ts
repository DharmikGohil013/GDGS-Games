import test from 'node:test';
import assert from 'node:assert/strict';
import {
  tallyVotes,
  checkGameOutcome,
  calculateTaskProgress,
  getConnectedVents,
  updateSuspicion,
  canInteractWithVent,
} from './rules.ts';
import { Player, SabotageState, VentNode } from './types.ts';

const mockPlayer = (id: string, role: 'crewmate' | 'impostor', isDead = false): Player => ({
  id,
  name: id,
  color: 'red',
  role,
  x: 100,
  y: 100,
  vx: 0,
  vy: 0,
  facing: 'right',
  isMoving: false,
  walkFrame: 0,
  isDead,
  inVentId: null,
  isBot: true,
  killCooldown: 0,
  completedTasks: [],
  assignedTasks: [
    { id: 't1', definitionId: 'd1', type: 'wires', name: 'Wires', room: 'Admin', completed: false },
    { id: 't2', definitionId: 'd2', type: 'card_swipe', name: 'Swipe Card', room: 'Admin', completed: false },
  ],
  state: 'idle',
  actionTimer: 0,
  currentTaskIndex: 0,
  witnessedEvents: [],
  suspicionMap: {},
  votedFor: null,
  hasVoted: false,
});

test('tallyVotes correctly identifies clear winner', () => {
  const p1 = mockPlayer('p1', 'crewmate');
  const p2 = mockPlayer('p2', 'crewmate');
  const p3 = mockPlayer('p3', 'impostor');
  const votes = {
    p1: 'p3',
    p2: 'p3',
    p3: 'p1',
  };
  const result = tallyVotes(votes, [p1, p2, p3]);
  assert.equal(result.ejectedId, 'p3');
  assert.equal(result.wasTie, false);
  assert.equal(result.isSkip, false);
  assert.equal(result.voteCounts['p3'], 2);
});

test('tallyVotes handles tie votes correctly', () => {
  const p1 = mockPlayer('p1', 'crewmate');
  const p2 = mockPlayer('p2', 'impostor');
  const votes = {
    p1: 'p2',
    p2: 'p1',
  };
  const result = tallyVotes(votes, [p1, p2]);
  assert.equal(result.ejectedId, null);
  assert.equal(result.wasTie, true);
});

test('tallyVotes handles skip majority correctly', () => {
  const p1 = mockPlayer('p1', 'crewmate');
  const p2 = mockPlayer('p2', 'crewmate');
  const p3 = mockPlayer('p3', 'impostor');
  const votes = {
    p1: 'skip',
    p2: 'skip',
    p3: 'p1',
  };
  const result = tallyVotes(votes, [p1, p2, p3]);
  assert.equal(result.ejectedId, null);
  assert.equal(result.isSkip, true);
});

test('checkGameOutcome triggers crewmate victory when all impostors are dead', () => {
  const crew = mockPlayer('c1', 'crewmate');
  const deadImp = mockPlayer('i1', 'impostor', true);
  const sabotage: SabotageState = {
    type: 'none',
    active: false,
    timer: 0,
    maxTimer: 30,
    fixedLeft: false,
    fixedRight: false,
  };

  const outcome = checkGameOutcome([crew, deadImp], 50, sabotage);
  assert.equal(outcome.gameOver, true);
  assert.equal(outcome.winner, 'crewmates');
});

test('checkGameOutcome triggers impostor victory when alive impostors equal alive crewmates', () => {
  const crew = mockPlayer('c1', 'crewmate');
  const imp = mockPlayer('i1', 'impostor');
  const sabotage: SabotageState = {
    type: 'none',
    active: false,
    timer: 0,
    maxTimer: 30,
    fixedLeft: false,
    fixedRight: false,
  };

  const outcome = checkGameOutcome([crew, imp], 50, sabotage);
  assert.equal(outcome.gameOver, true);
  assert.equal(outcome.winner, 'impostors');
});

test('checkGameOutcome triggers impostor victory on critical sabotage timer expiry', () => {
  const crew1 = mockPlayer('c1', 'crewmate');
  const crew2 = mockPlayer('c2', 'crewmate');
  const crew3 = mockPlayer('c3', 'crewmate');
  const imp = mockPlayer('i1', 'impostor');
  const sabotage: SabotageState = {
    type: 'reactor',
    active: true,
    timer: 0,
    maxTimer: 30,
    fixedLeft: false,
    fixedRight: false,
  };

  const outcome = checkGameOutcome([crew1, crew2, crew3, imp], 50, sabotage);
  assert.equal(outcome.gameOver, true);
  assert.equal(outcome.winner, 'impostors');
});

test('calculateTaskProgress computes percentage across crewmates correctly', () => {
  const crew = mockPlayer('c1', 'crewmate');
  crew.completedTasks = ['t1']; // 1 of 2 done
  const imp = mockPlayer('i1', 'impostor'); // impostors don't count towards crew task progress

  const progress = calculateTaskProgress([crew, imp]);
  assert.equal(progress, 50);
});

test('canInteractWithVent only allows alive impostors within distance', () => {
  const imp = mockPlayer('i1', 'impostor');
  const crew = mockPlayer('c1', 'crewmate');
  const vent: VentNode = {
    id: 'v1',
    room: 'Admin',
    x: 100,
    y: 110,
    networkId: 'net1',
    connectedVentIds: ['v2'],
  };

  assert.equal(canInteractWithVent(imp, vent, 50), true);
  assert.equal(canInteractWithVent(crew, vent, 50), false);

  const farVent: VentNode = {
    id: 'v2',
    room: 'Cafeteria',
    x: 900,
    y: 900,
    networkId: 'net1',
    connectedVentIds: ['v1'],
  };
  assert.equal(canInteractWithVent(imp, farVent, 50), false);
});

test('getConnectedVents returns connected vents in same network', () => {
  const v1: VentNode = { id: 'v1', room: 'Admin', x: 100, y: 100, networkId: 'net1', connectedVentIds: ['v2', 'v3'] };
  const v2: VentNode = { id: 'v2', room: 'Cafeteria', x: 200, y: 100, networkId: 'net1', connectedVentIds: ['v1'] };
  const v3: VentNode = { id: 'v3', room: 'Hallway', x: 300, y: 100, networkId: 'net1', connectedVentIds: ['v1'] };
  const v4: VentNode = { id: 'v4', room: 'MedBay', x: 500, y: 500, networkId: 'net2', connectedVentIds: [] };

  const connected = getConnectedVents('v1', [v1, v2, v3, v4]);
  assert.equal(connected.length, 2);
  assert.deepEqual(connected.map(v => v.id).sort(), ['v2', 'v3']);
});

test('updateSuspicion handles saw_kill and clears on visual task', () => {
  let map: Record<string, number> = {};
  map = updateSuspicion(map, { time: 100, type: 'saw_kill', targetId: 'p2', room: 'Electrical' });
  assert.equal(map['p2'], 100);

  map = updateSuspicion(map, { time: 200, type: 'saw_visual_task', targetId: 'p3', room: 'MedBay' });
  assert.equal(map['p3'], 0);
});

test('findPath finds route across waypoint graph', async () => {
  const { findPath, getRoomAt } = await import('./mapData.ts');
  const path = findPath('cafe_center', 'electrical_center');
  assert.ok(path.length > 2);
  assert.equal(path[0], 'cafe_center');
  assert.equal(path[path.length - 1], 'electrical_center');

  assert.equal(getRoomAt(1050, 300), 'Cafeteria');
  assert.equal(getRoomAt(1450, 900), 'Admin');
});

