export type WeatherType = 'clear_day' | 'sunset' | 'overcast' | 'rain' | 'night_storm';

export type TireCompound = 'soft' | 'hard' | 'wet';

export type GearRatioPreset = 'acceleration' | 'balanced' | 'top_speed';

export type CameraViewMode = 'chase' | 'cockpit' | 'hood' | 'cinematic';

export interface CarUpgrades {
  horsepower: number; // 700 to 1100 bhp
  downforce: number; // 1.0 to 2.5 aero multiplier
  tireCompound: TireCompound;
  suspensionStiffness: number; // 1.0 to 2.0
  brakeBias: number; // 50 to 65 (% front)
  gearRatioPreset: GearRatioPreset;
  paintColor: string;
  accentColor: string;
  rimColor: string;
}

export interface TrackPoint {
  id: string;
  x: number;
  y: number; // elevation
  z: number;
  width?: number; // road width, default 14m
  banking?: number; // degrees, -15 to +15
  kerb?: 'none' | 'left' | 'right' | 'both';
  hasDrs?: boolean;
}

export interface TrackConfig {
  id: string;
  name: string;
  location: string;
  description: string;
  points: TrackPoint[];
  isLoop: boolean;
  surfaceGrip: number; // 0.8 to 1.1
  drsZoneStartDist?: number;
  drsZoneEndDist?: number;
}

export interface CarInputs {
  throttle: number; // 0 to 1
  brake: number; // 0 to 1
  steer: number; // -1 to 1
  handbrake: boolean;
  drs: boolean;
}

export interface VehiclePhysicsState {
  posX: number;
  posY: number;
  posZ: number;
  velX: number; // 3D rigid-body world velocity X (m/s)
  velY: number; // 3D rigid-body vertical velocity (gravity, suspension, air flight)
  velZ: number; // 3D rigid-body world velocity Z (m/s)
  rotationY: number; // heading angle in radians
  pitch: number; // chassis pitch angle (dive under braking, squat under accel)
  roll: number; // chassis roll angle (centrifugal lean in turns)
  speedMs: number; // forward speed in m/s
  steerAngle: number;
  rpm: number;
  currentGear: number;
  slipAngle: number; // lateral drift slip in radians
  gForceLat: number;
  gForceLong: number;
  drsActive: boolean;
  isOffTrack: boolean;
  isKerbRiding: boolean;
  isBrakingHard: boolean;
  isAirborne: boolean; // car is flying off a hill/crest/kerb under gravity
  hasCollided: boolean; // rigid-body barrier or obstacle collision occurred
  collisionNormalX: number; // contact normal vector for spark burst
  collisionNormalZ: number;
  collisionIntensity: number; // 0 to 1 for sound, camera shake, and spark density
}

export interface LapRecord {
  id: string;
  trackId: string;
  driverName: string;
  lapTimeSeconds: number;
  sector1Seconds: number;
  sector2Seconds: number;
  sector3Seconds: number;
  topSpeedKmh: number;
  weather: WeatherType;
  compound: TireCompound;
  carBhp: number;
  date: string;
}

export interface SectorTimings {
  currentSector: 1 | 2 | 3;
  lapStartTime: number;
  currentLapTime: number;
  sector1Time: number | null;
  sector2Time: number | null;
  sector3Time: number | null;
  lastLapTime: number | null;
  bestLapTime: number | null;
  bestSector1: number | null;
  bestSector2: number | null;
  bestSector3: number | null;
  deltaToBest: number | null;
  lapCount: number;
  cleanLap: boolean;
}
