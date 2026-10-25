import { VehiclePhysicsState, SectorTimings, WeatherType } from '../types/game';
import { formatLapTime, formatDelta, EvaluatedTrackPoint } from '../game/trackMath';
import { Zap, CloudRain, Sun, Moon } from 'lucide-react';

interface F1TelemetryHudProps {
  physics: VehiclePhysicsState;
  sectorTimings: SectorTimings;
  weather: WeatherType;
  trackName: string;
  evaluatedTrack: EvaluatedTrackPoint[];
  cameraView: string;
  onSetTouchControls?: (controls: Partial<{ steer: number; throttle: number; brake: number; handbrake: boolean }>) => void;
  onToggleDrs?: () => void;
}

export const F1TelemetryHud: React.FC<F1TelemetryHudProps> = ({
  physics,
  sectorTimings,
  weather,
  trackName,
  evaluatedTrack,
  cameraView,
  onSetTouchControls,
  onToggleDrs,
}) => {
  const speedKmh = Math.round(physics.speedMs * 3.6);
  const rpm = physics.rpm;

  // F1 Shift lights calculation (15 LED segments: 5 Green, 5 Yellow, 5 Red/Purple)
  const rpmFraction = Math.max(0, Math.min(1, (rpm - 4000) / (11500 - 4000)));
  const litCount = Math.floor(rpmFraction * 15);
  const isRedlineBlinking = rpm > 11000;

  return (
    <div className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 md:p-6 select-none font-sans">
      {/* Top Bar: Sector Splitting, Lap Timing & Weather Badge */}
      <div className="flex items-start justify-between gap-4">
        {/* Top Left: Track & Lap timing */}
        <div className="bg-slate-950/85 border border-slate-800 rounded p-3 text-slate-100 min-w-[240px]">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 uppercase tracking-wider">
            <span className="truncate max-w-[140px] font-bold text-red-400">{trackName}</span>
            <span>LAP {sectorTimings.lapCount}</span>
          </div>

          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xs uppercase font-mono text-slate-400">CURRENT</span>
            <span className="text-2xl font-mono font-bold tracking-wider tabular-nums text-white">
              {formatLapTime(sectorTimings.currentLapTime)}
            </span>
          </div>

          <div className="flex items-baseline justify-between text-xs font-mono mt-1 text-slate-300">
            <span className="text-slate-400 uppercase">BEST</span>
            <span className="font-bold tabular-nums text-purple-400">
              {formatLapTime(sectorTimings.bestLapTime)}
            </span>
          </div>

          {/* F1 Sector 1, 2, 3 Split Tiles */}
          <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2 border-t border-slate-800 text-center font-mono">
            <div className={`py-1 rounded text-xs font-bold ${
              sectorTimings.currentSector === 1 ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50' :
              sectorTimings.sector1Time !== null ? 'bg-purple-950/60 text-purple-300 border border-purple-500/40' : 'bg-slate-900 text-slate-500'
            }`}>
              S1 {sectorTimings.sector1Time ? `${sectorTimings.sector1Time.toFixed(1)}s` : '--'}
            </div>
            <div className={`py-1 rounded text-xs font-bold ${
              sectorTimings.currentSector === 2 ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50' :
              sectorTimings.sector2Time !== null ? 'bg-green-950/60 text-green-300 border border-green-500/40' : 'bg-slate-900 text-slate-500'
            }`}>
              S2 {sectorTimings.sector2Time ? `${sectorTimings.sector2Time.toFixed(1)}s` : '--'}
            </div>
            <div className={`py-1 rounded text-xs font-bold ${
              sectorTimings.currentSector === 3 ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50' :
              sectorTimings.sector3Time !== null ? 'bg-green-950/60 text-green-300 border border-green-500/40' : 'bg-slate-900 text-slate-500'
            }`}>
              S3 {sectorTimings.sector3Time ? `${sectorTimings.sector3Time.toFixed(1)}s` : '--'}
            </div>
          </div>

          {/* Delta to Best */}
          {sectorTimings.deltaToBest !== null && (
            <div className={`mt-2 text-center text-xs font-mono font-bold py-0.5 rounded ${
              sectorTimings.deltaToBest <= 0 ? 'bg-green-950/80 text-green-400' : 'bg-red-950/80 text-red-400'
            }`}>
              DELTA: {formatDelta(sectorTimings.deltaToBest)}
            </div>
          )}
        </div>

        {/* Top Center: F1 Shift Lights Cluster */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-950/90 border border-slate-800 rounded px-3 py-1.5 flex items-center gap-1 shadow-lg">
            {Array.from({ length: 15 }).map((_, i) => {
              const isLit = i < litCount;
              let colorClass = 'bg-slate-800';
              if (isLit) {
                if (i < 5) colorClass = 'bg-emerald-400 shadow-[0_0_8px_#34d399]';
                else if (i < 10) colorClass = 'bg-red-500 shadow-[0_0_8px_#ef4444]';
                else colorClass = isRedlineBlinking ? 'bg-purple-400 shadow-[0_0_10px_#c084fc]' : 'bg-blue-500';
              }
              return (
                <div
                  key={i}
                  className={`w-2.5 sm:w-3.5 h-3 rounded-xs transition-colors duration-75 ${colorClass}`}
                />
              );
            })}
          </div>

          {/* DRS Badge */}
          <div className="mt-1.5">
            <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded text-xs font-mono font-black tracking-widest ${
              physics.drsActive
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_#10b981]'
                : 'bg-slate-900/90 text-slate-400 border border-slate-800'
            }`}>
              <Zap className="w-3 h-3 fill-current" />
              DRS {physics.drsActive ? 'ACTIVE' : 'READY [E]'}
            </span>
          </div>
        </div>

        {/* Top Right: Weather & View Angle Badge */}
        <div className="bg-slate-950/85 border border-slate-800 rounded p-2.5 text-right font-mono text-xs flex flex-col gap-1">
          <div className="flex items-center justify-end gap-1.5 text-slate-300">
            {weather === 'rain' ? (
              <CloudRain className="w-4 h-4 text-cyan-400" />
            ) : weather === 'sunset' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : weather === 'night_storm' ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : (
              <Sun className="w-4 h-4 text-yellow-400" />
            )}
            <span className="uppercase text-slate-200 font-bold">{weather.replace('_', ' ')}</span>
          </div>
          <div className="text-[11px] text-slate-400 uppercase">
            CAM: <span className="text-white font-bold">{cameraView} [C]</span>
          </div>
        </div>
      </div>

      {/* Dynamic Status / Physics Alert Banners */}
      <div className="self-center flex flex-col items-center gap-1">
        {physics.isAirborne && (
          <div className="bg-amber-500/90 text-slate-950 font-mono font-black text-xs uppercase px-3 py-1 rounded shadow-lg animate-pulse">
            ⚡ AIRBORNE · GRAVITY INERTIA
          </div>
        )}
        {physics.isOffTrack && !physics.isAirborne && (
          <div className="bg-red-600/90 text-white font-mono font-bold text-xs uppercase px-4 py-1 rounded shadow-lg animate-bounce">
            OFF TRACK LIMITS · RETURN TO ASPHALT
          </div>
        )}
      </div>

      {/* Middle/Lower: Active On-Screen Touch / Mouse Controller */}
      <div className="flex items-center justify-between w-full pointer-events-none mb-2 px-2">
        {/* Steering Buttons on the Left */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            aria-label="Steer Left"
            onPointerDown={() => onSetTouchControls?.({ steer: 1.0 })}
            onPointerUp={() => onSetTouchControls?.({ steer: 0 })}
            onPointerLeave={() => onSetTouchControls?.({ steer: 0 })}
            className="flex items-center justify-center w-14 h-12 md:w-16 md:h-14 bg-slate-900/90 active:bg-cyan-600 hover:bg-slate-800 text-white font-mono font-bold text-sm rounded-lg border border-slate-700 shadow-xl transition active:scale-95 cursor-pointer"
          >
            ◄ A
          </button>
          <button
            aria-label="Steer Right"
            onPointerDown={() => onSetTouchControls?.({ steer: -1.0 })}
            onPointerUp={() => onSetTouchControls?.({ steer: 0 })}
            onPointerLeave={() => onSetTouchControls?.({ steer: 0 })}
            className="flex items-center justify-center w-14 h-12 md:w-16 md:h-14 bg-slate-900/90 active:bg-cyan-600 hover:bg-slate-800 text-white font-mono font-bold text-sm rounded-lg border border-slate-700 shadow-xl transition active:scale-95 cursor-pointer"
          >
            D ►
          </button>
        </div>

        {/* Throttle, Brake & DRS on the Right */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            aria-label="Brake"
            onPointerDown={() => onSetTouchControls?.({ brake: 1.0 })}
            onPointerUp={() => onSetTouchControls?.({ brake: 0 })}
            onPointerLeave={() => onSetTouchControls?.({ brake: 0 })}
            className="flex items-center justify-center w-14 h-12 md:w-16 md:h-14 bg-slate-900/90 active:bg-red-600 hover:bg-slate-800 text-red-400 font-mono font-bold text-xs rounded-lg border border-slate-700 shadow-xl transition active:scale-95 cursor-pointer"
          >
            ▼ S
          </button>
          <button
            aria-label="Accelerate"
            onPointerDown={() => onSetTouchControls?.({ throttle: 1.0 })}
            onPointerUp={() => onSetTouchControls?.({ throttle: 0 })}
            onPointerLeave={() => onSetTouchControls?.({ throttle: 0 })}
            className="flex items-center justify-center w-16 h-12 md:w-20 md:h-14 bg-emerald-950/90 active:bg-emerald-600 hover:bg-emerald-900/80 text-emerald-300 font-mono font-bold text-sm rounded-lg border border-emerald-600/60 shadow-xl transition active:scale-95 cursor-pointer"
          >
            ▲ W
          </button>
          <button
            aria-label="Toggle DRS"
            onClick={() => onToggleDrs?.()}
            className={`flex items-center justify-center px-3 h-12 md:h-14 rounded-lg font-mono font-bold text-xs border shadow-xl transition active:scale-95 cursor-pointer ${
              physics.drsActive
                ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-[0_0_12px_#10b981]'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            ⚡ DRS [E]
          </button>
        </div>
      </div>

      {/* Bottom Display Cluster (Speed, Gear, RPM, G-Force) */}
      <div className="flex items-end justify-between pb-20 md:pb-22">
        {/* Bottom Left: Throttle / Brake Pedal inputs & G-Force */}
        <div className="bg-slate-950/85 border border-slate-800 rounded p-3 min-w-[150px] font-mono text-xs">
          <div className="text-slate-400 uppercase text-[10px] tracking-wider mb-1">Pedal Telemetry</div>
          <div className="space-y-1.5">
            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-0.5">
                <span>THROTTLE</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-75"
                  style={{ width: `${Math.min(100, (physics.rpm / 11500) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-0.5">
                <span>BRAKE</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-75"
                  style={{ width: `${physics.isBrakingHard ? 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-300">
              <span>LAT G-FORCE:</span>
              <span className="font-bold text-white tabular-nums">{physics.gForceLat.toFixed(1)}G</span>
            </div>
          </div>
        </div>

        {/* Bottom Center: Hero Speedometer & Big Gear Indicator */}
        <div className="flex items-center gap-4 bg-slate-950/90 border border-slate-800 px-6 py-3 rounded-lg shadow-2xl">
          {/* Gear Digit */}
          <div className="text-center pr-4 border-r border-slate-800">
            <span className="block text-[10px] font-mono uppercase text-slate-400">GEAR</span>
            <span className="text-4xl md:text-5xl font-mono font-black text-red-500 tabular-nums">
              {physics.currentGear}
            </span>
          </div>

          {/* Speed Digital Readout */}
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl md:text-6xl font-mono font-black tracking-tight text-white tabular-nums drop-shadow-md">
                {speedKmh}
              </span>
              <span className="text-sm font-mono uppercase font-bold text-slate-400">KM/H</span>
            </div>
            <div className="text-xs font-mono text-slate-400 tabular-nums">
              {rpm} <span className="text-[10px]">RPM</span>
            </div>
          </div>
        </div>

        {/* Bottom Right: Track Minimap */}
        <div className="bg-slate-950/85 border border-slate-800 rounded p-2.5 w-32 h-32 md:w-36 md:h-36 relative overflow-hidden flex items-center justify-center">
          <svg className="w-full h-full" viewBox="-300 -300 600 600">
            {evaluatedTrack.length > 2 && (
              <polyline
                fill="none"
                stroke="#334155"
                strokeWidth="24"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={evaluatedTrack.map(pt => `${pt.x},${pt.z}`).join(' ')}
              />
            )}
            {/* Player Car Position marker */}
            <circle
              cx={physics.posX}
              cy={physics.posZ}
              r="16"
              fill="#ef4444"
              stroke="#ffffff"
              strokeWidth="4"
            />
          </svg>
          <div className="absolute top-1 left-2 text-[9px] font-mono text-slate-400 uppercase">GPS MAP</div>
        </div>
      </div>
    </div>
  );
};
