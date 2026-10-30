import { RectCollider, RoomArea, TaskDefinition, VentNode } from './types.ts';

export const MAP_WIDTH = 2200;
export const MAP_HEIGHT = 1600;

export const ROOMS: RoomArea[] = [
  { id: 'cafeteria', name: 'Cafeteria', x: 800, y: 150, w: 500, h: 380, floorColor: '#2b3648' },
  { id: 'weapons', name: 'Weapons', x: 1450, y: 150, w: 320, h: 280, floorColor: '#303947' },
  { id: 'o2', name: 'O2', x: 1350, y: 500, w: 250, h: 220, floorColor: '#253535' },
  { id: 'navigation', name: 'Navigation', x: 1800, y: 650, w: 320, h: 320, floorColor: '#2b3848' },
  { id: 'shields', name: 'Shields', x: 1450, y: 1050, w: 320, h: 300, floorColor: '#323c4a' },
  { id: 'comms', name: 'Communications', x: 1180, y: 1180, w: 240, h: 220, floorColor: '#2c3340' },
  { id: 'storage', name: 'Storage', x: 850, y: 850, w: 420, h: 420, floorColor: '#3a3832' },
  { id: 'admin', name: 'Admin', x: 1300, y: 780, w: 320, h: 240, floorColor: '#2e3a4e' },
  { id: 'electrical', name: 'Electrical', x: 450, y: 800, w: 320, h: 320, floorColor: '#3d3c2a' },
  { id: 'lower_engine', name: 'Lower Engine', x: 150, y: 1020, w: 260, h: 320, floorColor: '#303440' },
  { id: 'security', name: 'Security', x: 480, y: 520, w: 240, h: 220, floorColor: '#2d3844' },
  { id: 'reactor', name: 'Reactor', x: 50, y: 580, w: 260, h: 400, floorColor: '#352e42' },
  { id: 'upper_engine', name: 'Upper Engine', x: 150, y: 220, w: 260, h: 320, floorColor: '#303440' },
  { id: 'medbay', name: 'MedBay', x: 520, y: 250, w: 240, h: 240, floorColor: '#253e40' },
];

export const WALL_COLLIDERS: RectCollider[] = [
  // Outer map limits
  { x: 0, y: 0, w: MAP_WIDTH, h: 100 },
  { x: 0, y: MAP_HEIGHT - 60, w: MAP_WIDTH, h: 60 },
  { x: 0, y: 0, w: 40, h: MAP_HEIGHT },
  { x: MAP_WIDTH - 40, y: 0, w: 40, h: MAP_HEIGHT },

  // Cafeteria central emergency table
  { x: 1000, y: 290, w: 100, h: 100 },

  // Admin main table
  { x: 1400, y: 860, w: 120, h: 70 },

  // Storage crates
  { x: 920, y: 920, w: 120, h: 90 },
  { x: 1120, y: 1100, w: 90, h: 90 },

  // Reactor core structure
  { x: 120, y: 720, w: 120, h: 120 },

  // Security desk
  { x: 550, y: 590, w: 100, h: 60 },

  // Medbay scan bed divider
  { x: 580, y: 310, w: 40, h: 80 },

  // Electrical generators
  { x: 530, y: 880, w: 90, h: 110 },
  { x: 650, y: 880, w: 80, h: 110 },

  // Engine pylons
  { x: 230, y: 320, w: 100, h: 100 },
  { x: 230, y: 1120, w: 100, h: 100 },

  // Structural boundaries dividing sectors
  { x: 740, y: 100, w: 50, h: 280 },
  { x: 1320, y: 100, w: 50, h: 280 },
  { x: 420, y: 560, w: 50, h: 220 },
  { x: 780, y: 540, w: 50, h: 300 },
  { x: 1280, y: 740, w: 30, h: 260 },
  { x: 1640, y: 740, w: 30, h: 260 },
  { x: 1280, y: 1040, w: 150, h: 40 },
  { x: 780, y: 1160, w: 60, h: 180 },
];

export const TASKS: TaskDefinition[] = [
  // 1. Swipe Card (Admin)
  { id: 'task_admin_swipe', type: 'card_swipe', name: 'Swipe Card', room: 'Admin', x: 1460, y: 840 },
  // 2. Fix Wiring (Admin)
  { id: 'task_admin_wires', type: 'wires', name: 'Fix Wiring', room: 'Admin', x: 1340, y: 980 },
  // 3. Fix Wiring (Electrical)
  { id: 'task_elec_wires', type: 'wires', name: 'Fix Wiring', room: 'Electrical', x: 490, y: 830 },
  // 4. Divert Power (Electrical)
  { id: 'task_elec_divert', type: 'divert_power', name: 'Divert Power', room: 'Electrical', x: 710, y: 840 },
  // 5. Submit Scan (MedBay) - Visual task!
  { id: 'task_medbay_scan', type: 'medbay_scan', name: 'Submit Scan', room: 'MedBay', x: 640, y: 350, isVisual: true },
  // 6. Clear Asteroids (Weapons) - Visual lasers!
  { id: 'task_weapons_asteroids', type: 'asteroids', name: 'Clear Asteroids', room: 'Weapons', x: 1660, y: 220, isVisual: true },
  // 7. Prime Shields (Shields) - Visual shields!
  { id: 'task_shields_prime', type: 'shields', name: 'Prime Shields', room: 'Shields', x: 1640, y: 1220, isVisual: true },
  // 8. Fix Wiring (Navigation)
  { id: 'task_nav_wires', type: 'wires', name: 'Fix Wiring', room: 'Navigation', x: 1980, y: 720 },
  // 9. Unlock Manifolds (Reactor)
  { id: 'task_reactor_manifolds', type: 'manifolds', name: 'Unlock Manifolds', room: 'Reactor', x: 120, y: 640 },
  // 10. Fix Wiring (Storage)
  { id: 'task_storage_wires', type: 'wires', name: 'Fix Wiring', room: 'Storage', x: 920, y: 1220 },
  // 11. Divert Power (Upper Engine)
  { id: 'task_upper_divert', type: 'divert_power', name: 'Accept Power', room: 'Upper Engine', x: 240, y: 250 },
  // 12. Fix Wiring (Cafeteria)
  { id: 'task_cafeteria_wires', type: 'wires', name: 'Fix Wiring', room: 'Cafeteria', x: 1240, y: 190 },
];

export const VENTS: VentNode[] = [
  // Network 1: Cafeteria - Admin - Hallway O2
  { id: 'vent_cafe', room: 'Cafeteria', x: 1240, y: 240, networkId: 'net_cafe', connectedVentIds: ['vent_admin', 'vent_hallway_o2'] },
  { id: 'vent_admin', room: 'Admin', x: 1560, y: 960, networkId: 'net_cafe', connectedVentIds: ['vent_cafe', 'vent_hallway_o2'] },
  { id: 'vent_hallway_o2', room: 'O2', x: 1400, y: 480, networkId: 'net_cafe', connectedVentIds: ['vent_cafe', 'vent_admin'] },

  // Network 2: MedBay - Security - Electrical
  { id: 'vent_medbay', room: 'MedBay', x: 550, y: 440, networkId: 'net_med', connectedVentIds: ['vent_security', 'vent_elec'] },
  { id: 'vent_security', room: 'Security', x: 520, y: 550, networkId: 'net_med', connectedVentIds: ['vent_medbay', 'vent_elec'] },
  { id: 'vent_elec', room: 'Electrical', x: 720, y: 1060, networkId: 'net_med', connectedVentIds: ['vent_medbay', 'vent_security'] },

  // Network 3: Reactor - Upper Engine - Lower Engine
  { id: 'vent_reactor_top', room: 'Reactor', x: 90, y: 620, networkId: 'net_reactor', connectedVentIds: ['vent_upper_eng'] },
  { id: 'vent_upper_eng', room: 'Upper Engine', x: 180, y: 480, networkId: 'net_reactor', connectedVentIds: ['vent_reactor_top'] },
  { id: 'vent_reactor_bot', room: 'Reactor', x: 90, y: 920, networkId: 'net_reactor_bot', connectedVentIds: ['vent_lower_eng'] },
  { id: 'vent_lower_eng', room: 'Lower Engine', x: 180, y: 1060, networkId: 'net_reactor_bot', connectedVentIds: ['vent_reactor_bot'] },

  // Network 4: Weapons - Navigation - Shields
  { id: 'vent_weapons', room: 'Weapons', x: 1720, y: 380, networkId: 'net_east', connectedVentIds: ['vent_nav_top'] },
  { id: 'vent_nav_top', room: 'Navigation', x: 1950, y: 690, networkId: 'net_east', connectedVentIds: ['vent_weapons'] },
  { id: 'vent_nav_bot', room: 'Navigation', x: 1950, y: 910, networkId: 'net_east_bot', connectedVentIds: ['vent_shields'] },
  { id: 'vent_shields', room: 'Shields', x: 1720, y: 1100, networkId: 'net_east_bot', connectedVentIds: ['vent_nav_bot'] },
];

export const EMERGENCY_BUTTON_POS = { x: 1050, y: 340, radius: 65 };
export const ADMIN_TABLE_POS = { x: 1460, y: 895, radius: 55 };
export const SECURITY_CAMS_POS = { x: 600, y: 620, radius: 55 };

// Bot Navigation Graph Nodes (Waypoints)
export interface NavNode {
  id: string;
  x: number;
  y: number;
  neighbors: string[];
}

export const NAV_NODES: Record<string, NavNode> = {
  // Cafeteria
  cafe_center: { id: 'cafe_center', x: 1050, y: 220, neighbors: ['cafe_left', 'cafe_right', 'cafe_bottom', 'weapons_hall'] },
  cafe_left: { id: 'cafe_left', x: 880, y: 280, neighbors: ['cafe_center', 'medbay_hall'] },
  cafe_right: { id: 'cafe_right', x: 1220, y: 280, neighbors: ['cafe_center', 'admin_hall'] },
  cafe_bottom: { id: 'cafe_bottom', x: 1050, y: 480, neighbors: ['cafe_center', 'storage_top'] },

  // Hallways
  medbay_hall: { id: 'medbay_hall', x: 760, y: 340, neighbors: ['cafe_left', 'medbay_center', 'upper_engine_hall'] },
  weapons_hall: { id: 'weapons_hall', x: 1380, y: 240, neighbors: ['cafe_center', 'weapons_center'] },
  admin_hall: { id: 'admin_hall', x: 1360, y: 420, neighbors: ['cafe_right', 'admin_center', 'o2_center'] },
  storage_top: { id: 'storage_top', x: 1050, y: 720, neighbors: ['cafe_bottom', 'storage_center'] },

  // Weapons & East
  weapons_center: { id: 'weapons_center', x: 1600, y: 260, neighbors: ['weapons_hall', 'o2_center'] },
  o2_center: { id: 'o2_center', x: 1470, y: 600, neighbors: ['admin_hall', 'weapons_center', 'nav_hall_top'] },
  nav_hall_top: { id: 'nav_hall_top', x: 1720, y: 720, neighbors: ['o2_center', 'nav_center'] },
  nav_center: { id: 'nav_center', x: 1950, y: 800, neighbors: ['nav_hall_top', 'nav_hall_bot'] },
  nav_hall_bot: { id: 'nav_hall_bot', x: 1720, y: 950, neighbors: ['nav_center', 'shields_center'] },
  shields_center: { id: 'shields_center', x: 1600, y: 1180, neighbors: ['nav_hall_bot', 'comms_hall'] },
  comms_hall: { id: 'comms_hall', x: 1380, y: 1240, neighbors: ['shields_center', 'comms_center', 'storage_bot_right'] },
  comms_center: { id: 'comms_center', x: 1300, y: 1290, neighbors: ['comms_hall'] },

  // Storage
  storage_center: { id: 'storage_center', x: 1050, y: 1020, neighbors: ['storage_top', 'storage_bot_right', 'storage_left', 'admin_center'] },
  storage_bot_right: { id: 'storage_bot_right', x: 1220, y: 1150, neighbors: ['storage_center', 'comms_hall'] },
  storage_left: { id: 'storage_left', x: 800, y: 1020, neighbors: ['storage_center', 'electrical_hall', 'lower_engine_hall'] },
  admin_center: { id: 'admin_center', x: 1450, y: 920, neighbors: ['admin_hall', 'storage_center'] },

  // Electrical & Medbay
  electrical_hall: { id: 'electrical_hall', x: 740, y: 920, neighbors: ['storage_left', 'electrical_center'] },
  electrical_center: { id: 'electrical_center', x: 600, y: 950, neighbors: ['electrical_hall'] },
  medbay_center: { id: 'medbay_center', x: 640, y: 350, neighbors: ['medbay_hall', 'security_hall'] },
  security_hall: { id: 'security_hall', x: 600, y: 500, neighbors: ['medbay_center', 'security_center', 'reactor_hall'] },
  security_center: { id: 'security_center', x: 600, y: 630, neighbors: ['security_hall'] },

  // Reactor & Engines
  reactor_hall: { id: 'reactor_hall', x: 380, y: 720, neighbors: ['security_hall', 'reactor_center', 'upper_engine_center', 'lower_engine_center'] },
  reactor_center: { id: 'reactor_center', x: 180, y: 750, neighbors: ['reactor_hall'] },
  upper_engine_hall: { id: 'upper_engine_hall', x: 450, y: 340, neighbors: ['medbay_hall', 'upper_engine_center'] },
  upper_engine_center: { id: 'upper_engine_center', x: 280, y: 380, neighbors: ['upper_engine_hall', 'reactor_hall'] },
  lower_engine_hall: { id: 'lower_engine_hall', x: 450, y: 1150, neighbors: ['storage_left', 'lower_engine_center'] },
  lower_engine_center: { id: 'lower_engine_center', x: 280, y: 1180, neighbors: ['lower_engine_hall', 'reactor_hall'] },
};

/**
 * Finds the nearest navigation node to a given world coordinate.
 */
export function getNearestNavNode(x: number, y: number): string {
  let closestId = 'cafe_center';
  let minDist = Infinity;
  for (const [id, node] of Object.entries(NAV_NODES)) {
    const d = (node.x - x) ** 2 + (node.y - y) ** 2;
    if (d < minDist) {
      minDist = d;
      closestId = id;
    }
  }
  return closestId;
}

/**
 * Pathfinding via Breadth-First Search on the waypoint graph.
 */
export function findPath(startNodeId: string, endNodeId: string): string[] {
  if (startNodeId === endNodeId) return [startNodeId];

  const queue: string[][] = [[startNodeId]];
  const visited = new Set<string>([startNodeId]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];

    if (current === endNodeId) {
      return path;
    }

    const neighbors = NAV_NODES[current]?.neighbors || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }

  return [startNodeId, endNodeId];
}

/**
 * Helper to identify which room an (x, y) point is inside
 */
export function getRoomAt(x: number, y: number): string {
  for (const r of ROOMS) {
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
      return r.name;
    }
  }
  return 'Hallway';
}
