import {
  findPath,
  getNearestNavNode,
  getRoomAt,
  NAV_NODES,
  ROOMS,
} from './mapData.ts';
import {
  canInteractWithVent,
  getConnectedVents,
  getDistance,
  updateSuspicion,
} from './rules.ts';
import {
  DeadBody,
  MeetingMessage,
  Player,
  PLAYER_COLORS,
  SabotageState,
  TaskDefinition,
  VentNode,
} from './types.ts';

export interface BotAIContext {
  dt: number;
  players: Player[];
  deadBodies: DeadBody[];
  sabotage: SabotageState;
  tasks: TaskDefinition[];
  vents: VentNode[];
  onReportBody: (reporter: Player, body: DeadBody) => void;
  onKill: (killer: Player, victim: Player) => void;
  onSabotage: (type: 'lights' | 'reactor' | 'o2') => void;
  onFixSabotage: (side: 'left' | 'right') => void;
}

/**
 * Updates bot movement and decision trees each frame.
 */
export function updateBotAI(bot: Player, ctx: BotAIContext) {
  if (bot.isDead) return;

  bot.actionTimer -= ctx.dt;

  // 1. Line-of-sight Check for Dead Bodies (Crewmates & Impostors)
  for (const body of ctx.deadBodies) {
    const dist = getDistance(bot.x, bot.y, body.x, body.y);
    if (dist < 180) {
      // Saw a dead body!
      const bodyRoom = getRoomAt(body.x, body.y);
      // Log event
      bot.witnessedEvents.push({
        time: Date.now(),
        type: 'saw_body',
        targetId: body.playerId,
        victimId: body.playerId,
        room: bodyRoom,
      });

      // Bots report bodies after a brief human-like pause (0.4s to 1.2s)
      if (bot.state !== 'reporting') {
        bot.state = 'reporting';
        bot.actionTimer = 0.5 + Math.random() * 0.8;
      } else if (bot.actionTimer <= 0) {
        ctx.onReportBody(bot, body);
        return;
      }
      return;
    }
  }

  // 2. Observe other players in line-of-sight (Witness System)
  const myRoom = getRoomAt(bot.x, bot.y);
  for (const other of ctx.players) {
    if (other.id === bot.id || other.isDead) continue;
    const d = getDistance(bot.x, bot.y, other.x, other.y);
    if (d < 160 && getRoomAt(other.x, other.y) === myRoom) {
      // Co-presence reduces suspicion
      bot.suspicionMap = updateSuspicion(bot.suspicionMap, {
        time: Date.now(),
        type: 'saw_with_player',
        targetId: other.id,
        room: myRoom,
      });
    }
  }

  // 3. React to Critical Sabotages (Reactor / O2)
  if (ctx.sabotage.active && (ctx.sabotage.type === 'reactor' || ctx.sabotage.type === 'o2')) {
    if (bot.role === 'crewmate') {
      const targetX = ctx.sabotage.type === 'reactor' ? 180 : 1450;
      const targetY = ctx.sabotage.type === 'reactor' ? 750 : 550;
      const d = getDistance(bot.x, bot.y, targetX, targetY);

      if (d < 70) {
        ctx.onFixSabotage(bot.x < targetX ? 'left' : 'right');
      } else {
        moveTowardsPoint(bot, targetX, targetY, ctx.dt);
      }
      return;
    }
  }

  // 4. Role Specific Brain
  if (bot.role === 'impostor') {
    updateImpostorBot(bot, ctx);
  } else {
    updateCrewmateBot(bot, ctx);
  }
}

/**
 * Crewmate Bot: Walks to assigned tasks, stands while working, cycles tasks.
 */
function updateCrewmateBot(bot: Player, ctx: BotAIContext) {
  // If working on a task:
  if (bot.state === 'doing_task') {
    if (bot.actionTimer <= 0) {
      // Completed current task!
      const currentTask = bot.assignedTasks[bot.currentTaskIndex];
      if (currentTask && !bot.completedTasks.includes(currentTask.id)) {
        bot.completedTasks.push(currentTask.id);
        currentTask.completed = true;
      }
      bot.currentTaskIndex = (bot.currentTaskIndex + 1) % Math.max(1, bot.assignedTasks.length);
      bot.state = 'idle';
      bot.actionTimer = 1.0 + Math.random() * 2.0;
    }
    return;
  }

  // Pick target task
  const currentTask = bot.assignedTasks[bot.currentTaskIndex];
  if (!currentTask) {
    bot.state = 'idle';
    return;
  }

  const taskDef = ctx.tasks.find((t) => t.id === currentTask.definitionId);
  if (!taskDef) {
    bot.currentTaskIndex = (bot.currentTaskIndex + 1) % bot.assignedTasks.length;
    return;
  }

  const distToTask = getDistance(bot.x, bot.y, taskDef.x, taskDef.y);

  if (distToTask <= 45) {
    // Arrived at task!
    bot.state = 'doing_task';
    bot.actionTimer = 4.0 + Math.random() * 4.0; // 4 to 8s task duration
    bot.isMoving = false;
  } else {
    // Navigate towards task
    bot.state = 'walking';
    moveTowardsPoint(bot, taskDef.x, taskDef.y, ctx.dt);
  }
}

/**
 * Impostor Bot: Fakes tasks, tracks isolated crewmates, kills in private, uses vents to flee!
 */
function updateImpostorBot(bot: Player, ctx: BotAIContext) {
  // Decrement kill cooldown
  if (bot.killCooldown > 0) {
    bot.killCooldown = Math.max(0, bot.killCooldown - ctx.dt);
  }

  // Check if inside a vent
  if (bot.inVentId) {
    bot.actionTimer -= ctx.dt;
    if (bot.actionTimer <= 0) {
      // Hop out of vent or travel to connected vent
      const connected = getConnectedVents(bot.inVentId, ctx.vents);
      if (connected.length > 0 && Math.random() < 0.6) {
        const destVent = connected[Math.floor(Math.random() * connected.length)];
        bot.x = destVent.x;
        bot.y = destVent.y;
      }
      bot.inVentId = null;
      bot.state = 'walking';
      bot.actionTimer = 2.0;
    }
    return;
  }

  // If faking a task
  if (bot.state === 'faking_task') {
    if (bot.actionTimer <= 0) {
      bot.state = 'idle';
      bot.actionTimer = 1.5 + Math.random() * 2.0;
    }
  }

  // Look for kill opportunity
  if (bot.killCooldown <= 0) {
    const nearbyCrewmates: Player[] = [];
    const otherWitnesses: Player[] = [];

    const myRoom = getRoomAt(bot.x, bot.y);

    for (const p of ctx.players) {
      if (p.id === bot.id || p.isDead) continue;
      const d = getDistance(bot.x, bot.y, p.x, p.y);

      if (p.role === 'crewmate') {
        if (d < 75) {
          nearbyCrewmates.push(p);
        }
      }

      // Anyone within 200px or in same room counts as witness
      if (d < 220 || (getRoomAt(p.x, p.y) === myRoom && d < 350)) {
        if (p.id !== bot.id && p.role !== 'impostor') {
          otherWitnesses.push(p);
        }
      }
    }

    // Stealth condition: exactly 1 crewmate near me and NO other witnesses watching!
    if (nearbyCrewmates.length === 1 && otherWitnesses.length <= 1) {
      const target = nearbyCrewmates[0];
      // Execute kill!
      ctx.onKill(bot, target);
      bot.killCooldown = 28;

      // Check for vent to escape
      const nearestVent = ctx.vents.find((v) => canInteractWithVent(bot, v, 100));
      if (nearestVent && Math.random() < 0.75) {
        bot.inVentId = nearestVent.id;
        bot.x = nearestVent.x;
        bot.y = nearestVent.y;
        bot.actionTimer = 2.5 + Math.random() * 3.0; // Stay inside vent
        return;
      }
      bot.state = 'fleeing';
      bot.actionTimer = 3.0;
    }
  }

  // Sabotage trigger: If no active sabotage and randomly ready
  if (!ctx.sabotage.active && Math.random() < 0.003) {
    const sabotageOptions: ('lights' | 'reactor' | 'o2')[] = ['lights', 'reactor', 'o2'];
    const chosen = sabotageOptions[Math.floor(Math.random() * sabotageOptions.length)];
    ctx.onSabotage(chosen);
  }

  // If not killing, wander naturally and fake tasks
  if (bot.state === 'idle' || bot.state === 'fleeing') {
    if (bot.actionTimer <= 0) {
      // Pick random room or task to fake
      const randomTask = ctx.tasks[Math.floor(Math.random() * ctx.tasks.length)];
      bot.targetPoint = { x: randomTask.x + (Math.random() * 20 - 10), y: randomTask.y + (Math.random() * 20 - 10) };
      bot.state = 'walking';
    }
  }

  if (bot.state === 'walking' && bot.targetPoint) {
    const d = getDistance(bot.x, bot.y, bot.targetPoint.x, bot.targetPoint.y);
    if (d < 45) {
      bot.state = 'faking_task';
      bot.actionTimer = 4.0 + Math.random() * 4.0;
      bot.isMoving = false;
    } else {
      moveTowardsPoint(bot, bot.targetPoint.x, bot.targetPoint.y, ctx.dt);
    }
  }
}

/**
 * Moves bot along waypoint path towards a destination coordinate.
 */
function moveTowardsPoint(bot: Player, targetX: number, targetY: number, dt: number) {
  const directDist = getDistance(bot.x, bot.y, targetX, targetY);

  // If close enough or in same open room, walk directly
  if (directDist < 120 || getRoomAt(bot.x, bot.y) === getRoomAt(targetX, targetY)) {
    applyVelocity(bot, targetX, targetY, dt);
    return;
  }

  // Otherwise, use waypoint graph
  const startNode = getNearestNavNode(bot.x, bot.y);
  const endNode = getNearestNavNode(targetX, targetY);
  const path = findPath(startNode, endNode);

  const nextWaypointId = path.length > 1 ? path[1] : path[0];
  const waypoint = NAV_NODES[nextWaypointId];

  if (waypoint) {
    applyVelocity(bot, waypoint.x, waypoint.y, dt);
  } else {
    applyVelocity(bot, targetX, targetY, dt);
  }
}

function applyVelocity(bot: Player, destX: number, destY: number, dt: number) {
  const dx = destX - bot.x;
  const dy = destY - bot.y;
  const len = Math.sqrt(dx * dx + dy * dy);

  if (len < 5) {
    bot.isMoving = false;
    return;
  }

  const speed = 140; // Pixels per second
  bot.vx = (dx / len) * speed;
  bot.vy = (dy / len) * speed;

  bot.x += bot.vx * dt;
  bot.y += bot.vy * dt;

  bot.facing = bot.vx < 0 ? 'left' : 'right';
  bot.isMoving = true;
  bot.walkFrame = (bot.walkFrame + dt * 10) % 4;
}

/**
 * Generates natural bot dialogue during emergency meetings and body reports.
 */
export function generateBotMeetingDialogue(
  bot: Player,
  meetingReason: 'emergency' | 'body',
  reporter: Player | undefined,
  bodyVictim: Player | undefined,
  allPlayers: Player[]
): string {
  const isReporter = reporter?.id === bot.id;
  const myRoom = bot.lastActiveRoom || 'Cafeteria';

  if (isReporter) {
    if (meetingReason === 'body' && bodyVictim) {
      const killerWitness = bot.witnessedEvents.find((e) => e.type === 'saw_kill' && e.victimId === bodyVictim.id);
      if (killerWitness) {
        const killer = allPlayers.find((p) => p.id === killerWitness.targetId);
        return `I SAW ${killer?.color.toUpperCase() || 'SOMEONE'} KILL ${bodyVictim.color.toUpperCase()} IN ${killerWitness.room.toUpperCase()}! VOTE THEM!`;
      }
      const bodyWitness = bot.witnessedEvents.find((e) => e.type === 'saw_body' && e.victimId === bodyVictim.id);
      const reportRoom = bodyWitness?.room || myRoom;
      return `I found ${bodyVictim.color.toUpperCase()}'s body in ${reportRoom.toUpperCase()}! Did anyone see who was nearby?`;
    } else {
      return `Emergency meeting called! I saw some suspicious movements around ${myRoom}.`;
    }
  }

  // Check if bot witnessed a vent
  const ventWitness = bot.witnessedEvents.find((e) => e.type === 'saw_vent');
  if (ventWitness) {
    const ventedPlayer = allPlayers.find((p) => p.id === ventWitness.targetId);
    return `Wait! I saw ${ventedPlayer?.color.toUpperCase()} jump out of a vent in ${ventWitness.room.toUpperCase()}!`;
  }

  // Check if bot has high suspicion on anyone
  const highestSuspect = Object.entries(bot.suspicionMap).sort((a, b) => b[1] - a[1])[0];
  if (highestSuspect && highestSuspect[1] >= 80) {
    const suspect = allPlayers.find((p) => p.id === highestSuspect[0]);
    if (suspect && !suspect.isDead) {
      return `${suspect.color.toUpperCase()} is acting super suspicious. They were hovering around right before this.`;
    }
  }

  // Alibi statements
  const random = Math.random();
  if (random < 0.35) {
    return `I was in ${myRoom} doing tasks. Anyone with me?`;
  } else if (random < 0.65) {
    return `Where was the body found?`;
  } else if (random < 0.85) {
    return `Not enough info yet. Skip vote for now?`;
  } else {
    return `I vote to skip unless someone has hard proof.`;
  }
}
