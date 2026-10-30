export type PlayerColor =
  | 'red'
  | 'blue'
  | 'green'
  | 'pink'
  | 'orange'
  | 'yellow'
  | 'black'
  | 'white'
  | 'purple'
  | 'cyan'
  | 'lime'
  | 'brown';

export interface PlayerColorConfig {
  name: string;
  hex: string;
  shadowHex: string;
  visorHex: string;
}

export const PLAYER_COLORS: Record<PlayerColor, PlayerColorConfig> = {
  red: { name: 'Red', hex: '#c51111', shadowHex: '#7a0838', visorHex: '#98cbe5' },
  blue: { name: 'Blue', hex: '#132ed1', shadowHex: '#09158e', visorHex: '#98cbe5' },
  green: { name: 'Green', hex: '#117f2d', shadowHex: '#0a4d1a', visorHex: '#98cbe5' },
  pink: { name: 'Pink', hex: '#ed54ba', shadowHex: '#ab2ca0', visorHex: '#98cbe5' },
  orange: { name: 'Orange', hex: '#ef7d0d', shadowHex: '#b33e15', visorHex: '#98cbe5' },
  yellow: { name: 'Yellow', hex: '#f5f557', shadowHex: '#c2870e', visorHex: '#98cbe5' },
  black: { name: 'Black', hex: '#3f474e', shadowHex: '#1e1f26', visorHex: '#98cbe5' },
  white: { name: 'White', hex: '#d6e0f0', shadowHex: '#8394bf', visorHex: '#98cbe5' },
  purple: { name: 'Purple', hex: '#6b2fbb', shadowHex: '#3b177c', visorHex: '#98cbe5' },
  cyan: { name: 'Cyan', hex: '#38fedc', shadowHex: '#24a8be', visorHex: '#98cbe5' },
  lime: { name: 'Lime', hex: '#50ef39', shadowHex: '#2a8c1f', visorHex: '#98cbe5' },
  brown: { name: 'Brown', hex: '#71491e', shadowHex: '#46270e', visorHex: '#98cbe5' },
};

export type TaskType =
  | 'wires'
  | 'card_swipe'
  | 'shields'
  | 'asteroids'
  | 'manifolds'
  | 'medbay_scan'
  | 'divert_power';

export interface TaskDefinition {
  id: string;
  type: TaskType;
  name: string;
  room: string;
  x: number;
  y: number;
  isVisual?: boolean;
}

export interface TaskInstance {
  id: string;
  definitionId: string;
  type: TaskType;
  name: string;
  room: string;
  completed: boolean;
  step?: number;
}

export interface VentNode {
  id: string;
  room: string;
  x: number;
  y: number;
  networkId: string;
  connectedVentIds: string[];
}

export interface RoomArea {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  floorColor?: string;
  labelX?: number;
  labelY?: number;
}

export interface RectCollider {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WitnessEvent {
  time: number;
  type: 'saw_kill' | 'saw_body' | 'saw_vent' | 'saw_visual_task' | 'saw_with_player';
  targetId: string;
  victimId?: string;
  room: string;
}

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  role: 'crewmate' | 'impostor';
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 'left' | 'right';
  isMoving: boolean;
  walkFrame: number;
  isDead: boolean;
  deathTime?: number;
  deathPos?: { x: number; y: number };
  inVentId: string | null;
  isBot: boolean;
  killCooldown: number;
  completedTasks: string[];
  assignedTasks: TaskInstance[];
  state: 'idle' | 'walking' | 'doing_task' | 'faking_task' | 'stalking' | 'fleeing' | 'reporting' | 'dead';
  actionTimer: number;
  targetPoint?: { x: number; y: number };
  currentTaskIndex: number;
  witnessedEvents: WitnessEvent[];
  suspicionMap: Record<string, number>;
  votedFor: string | null | 'skip';
  hasVoted: boolean;
  lastActiveRoom?: string;
}

export interface DeadBody {
  id: string;
  playerId: string;
  color: PlayerColor;
  x: number;
  y: number;
  timeOfDeath: number;
}

export type SabotageType = 'none' | 'lights' | 'reactor' | 'o2';

export interface SabotageState {
  type: SabotageType;
  active: boolean;
  timer: number;
  maxTimer: number;
  fixedLeft: boolean;
  fixedRight: boolean;
}

export interface MeetingMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: PlayerColor;
  text: string;
  timestamp: number;
  isDead?: boolean;
}

export type GamePhase =
  | 'title'
  | 'lobby'
  | 'intro'
  | 'playing'
  | 'task_modal'
  | 'sabotage_modal'
  | 'admin_modal'
  | 'cams_modal'
  | 'meeting'
  | 'ejection'
  | 'gameover';

export interface GameSettings {
  preferredRole: 'crewmate' | 'impostor' | 'random';
  impostorCount: 1 | 2;
  playerSpeed: number;
  killCooldownMax: number;
  sabotageTimerMax: number;
  meetingTimerMax: number;
  timingPreset: 'standard' | 'extended' | 'blitz';
  botDifficulty: 'normal' | 'pro';
  soundEnabled: boolean;
  playerColor?: PlayerColor;
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  deadBodies: DeadBody[];
  currentTask?: TaskInstance | null;
  sabotage: SabotageState;
  meetingReason: 'emergency' | 'body';
  reportedBodyOf?: string;
  reporterId?: string;
  chatMessages: MeetingMessage[];
  ejectedPlayer: Player | null;
  ejectionText: string;
  winner: 'crewmates' | 'impostors' | null;
  winReason: string;
  taskProgress: number; // 0 to 100
  emergencyMeetingsLeft: number;
  meetingTimer: number;
  votingConcluded: boolean;
  settings: GameSettings;
}
