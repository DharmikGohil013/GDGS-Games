import { DeadBody, Player, SabotageState, TaskDefinition, VentNode, WitnessEvent } from './types.ts';

export interface VoteResult {
  ejectedId: string | null;
  wasTie: boolean;
  isSkip: boolean;
  voteCounts: Record<string, number>;
}

/**
 * Tallies votes from all voting players and determines who is ejected.
 */
export function tallyVotes(
  votes: Record<string, string | 'skip'>,
  alivePlayers: Player[]
): VoteResult {
  const counts: Record<string, number> = { skip: 0 };
  for (const p of alivePlayers) {
    counts[p.id] = 0;
  }

  for (const voterId of Object.keys(votes)) {
    const target = votes[voterId];
    if (target) {
      counts[target] = (counts[target] || 0) + 1;
    }
  }

  let maxVotes = 0;
  let leaderId: string | null = null;
  let wasTie = false;

  for (const [target, count] of Object.entries(counts)) {
    if (count > maxVotes) {
      maxVotes = count;
      leaderId = target;
      wasTie = false;
    } else if (count === maxVotes && maxVotes > 0) {
      wasTie = true;
    }
  }

  if (wasTie || maxVotes === 0 || leaderId === null) {
    return { ejectedId: null, wasTie: true, isSkip: false, voteCounts: counts };
  }

  if (leaderId === 'skip') {
    return { ejectedId: null, wasTie: false, isSkip: true, voteCounts: counts };
  }

  return { ejectedId: leaderId, wasTie: false, isSkip: false, voteCounts: counts };
}

/**
 * Checks win and loss conditions:
 * - Crewmates win if:
 *   1. All impostors are eliminated (dead or ejected)
 *   2. OR Task progress reaches 100%
 * - Impostors win if:
 *   1. Number of alive impostors >= number of alive crewmates
 *   2. OR Critical Sabotage timer reaches 0
 */
export function checkGameOutcome(
  players: Player[],
  taskProgress: number,
  sabotage: SabotageState
): { gameOver: boolean; winner: 'crewmates' | 'impostors' | null; reason: string } {
  // Sabotage timer expired
  if (sabotage.active && (sabotage.type === 'reactor' || sabotage.type === 'o2') && sabotage.timer <= 0) {
    return {
      gameOver: true,
      winner: 'impostors',
      reason: `Critical ${sabotage.type.toUpperCase()} meltdown! Impostors sabotaged the ship.`,
    };
  }

  const alivePlayers = players.filter((p) => !p.isDead);
  const aliveImpostors = alivePlayers.filter((p) => p.role === 'impostor');
  const aliveCrewmates = alivePlayers.filter((p) => p.role === 'crewmate');

  // All impostors eliminated
  if (aliveImpostors.length === 0) {
    return {
      gameOver: true,
      winner: 'crewmates',
      reason: 'All Impostors were successfully discovered and ejected!',
    };
  }

  // Impostors have parity or outnumber crewmates
  if (aliveImpostors.length >= aliveCrewmates.length) {
    return {
      gameOver: true,
      winner: 'impostors',
      reason: 'Impostors overwhelmed the crew and took control of the station.',
    };
  }

  // All crewmate tasks completed
  if (taskProgress >= 100) {
    return {
      gameOver: true,
      winner: 'crewmates',
      reason: 'All maintenance and security tasks completed across The Skeld!',
    };
  }

  return { gameOver: false, winner: null, reason: '' };
}

/**
 * Computes aggregate task progress percentage from all crewmates.
 */
export function calculateTaskProgress(players: Player[]): number {
  const crewmates = players.filter((p) => p.role === 'crewmate');
  if (crewmates.length === 0) return 0;

  let totalTasks = 0;
  let totalDone = 0;

  for (const crew of crewmates) {
    totalTasks += crew.assignedTasks.length;
    totalDone += crew.completedTasks.length;
  }

  if (totalTasks === 0) return 0;
  return Math.min(100, Math.round((totalDone / totalTasks) * 100));
}

/**
 * Proximity checks
 */
export function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}

export function canInteractWithVent(player: Player, vent: VentNode, maxDist = 55): boolean {
  if (player.role !== 'impostor' || player.isDead) return false;
  return getDistance(player.x, player.y, vent.x, vent.y) <= maxDist;
}

export function getConnectedVents(ventId: string, allVents: VentNode[]): VentNode[] {
  const current = allVents.find((v) => v.id === ventId);
  if (!current) return [];
  return allVents.filter((v) => current.connectedVentIds.includes(v.id));
}

export function findNearbyBody(
  x: number,
  y: number,
  bodies: DeadBody[],
  maxDist = 65
): DeadBody | null {
  for (const b of bodies) {
    if (getDistance(x, y, b.x, b.y) <= maxDist) {
      return b;
    }
  }
  return null;
}

export function findNearbyTask(
  x: number,
  y: number,
  tasks: TaskDefinition[],
  maxDist = 60
): TaskDefinition | null {
  for (const t of tasks) {
    if (getDistance(x, y, t.x, t.y) <= maxDist) {
      return t;
    }
  }
  return null;
}

export function findNearbyVent(
  x: number,
  y: number,
  vents: VentNode[],
  maxDist = 55
): VentNode | null {
  for (const v of vents) {
    if (getDistance(x, y, v.x, v.y) <= maxDist) {
      return v;
    }
  }
  return null;
}

/**
 * Updates suspicion map of a bot based on observed events
 */
export function updateSuspicion(
  currentMap: Record<string, number>,
  event: WitnessEvent
): Record<string, number> {
  const next = { ...currentMap };
  const currentScore = next[event.targetId] || 0;

  switch (event.type) {
    case 'saw_kill':
      next[event.targetId] = 100; // Definitive proof!
      break;
    case 'saw_vent':
      next[event.targetId] = Math.max(90, currentScore + 80); // Vented!
      break;
    case 'saw_body':
      next[event.targetId] = Math.min(80, currentScore + 30); // Near body
      break;
    case 'saw_visual_task':
      next[event.targetId] = 0; // Cleared 100%!
      break;
    case 'saw_with_player':
      next[event.targetId] = Math.max(0, currentScore - 15); // Alibi
      break;
  }

  return next;
}
