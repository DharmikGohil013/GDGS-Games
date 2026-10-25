import React from 'react';
import { CarUpgrades, TireCompound, GearRatioPreset } from '../types/game';
import { Wrench, Shield, Gauge, Zap, ArrowLeft, Palette } from 'lucide-react';

interface PerformanceGarageProps {
  upgrades: CarUpgrades;
  onUpdateUpgrades: (upgrades: CarUpgrades) => void;
  onClose: () => void;
  onStartDrive: () => void;
}

const LIVERY_PRESETS = [
  { name: 'Rosso Corsa', paint: '#e10600', accent: '#111111', rim: '#e5e7eb' },
  { name: 'Gulf Apex', paint: '#0284c7', accent: '#f97316', rim: '#ffffff' },
  { name: 'British Racing', paint: '#065f46', accent: '#f59e0b', rim: '#d4af37' },
  { name: 'Stealth Carbon', paint: '#18181b', accent: '#dc2626', rim: '#27272a' },
  { name: 'Papaya Orange', paint: '#ea580c', accent: '#0284c7', rim: '#111111' },
  { name: 'Silver Arrow', paint: '#94a3b8', accent: '#06b6d4', rim: '#334155' },
];

export const PerformanceGarage: React.FC<PerformanceGarageProps> = ({
  upgrades,
  onUpdateUpgrades,
  onClose,
  onStartDrive,
}) => {
  // Estimated stats based on current upgrades
  const estTopSpeed = Math.round(310 + (upgrades.horsepower - 700) * 0.11 - (upgrades.downforce - 1.0) * 16);
  const estZeroToHundred = (2.9 - (upgrades.horsepower - 700) * 0.0018 + (upgrades.tireCompound === 'soft' ? -0.2 : 0)).toFixed(2);
  const estMaxG = (1.4 * (upgrades.tireCompound === 'soft' ? 1.15 : upgrades.tireCompound === 'hard' ? 0.98 : 0.88) + upgrades.downforce * 0.6).toFixed(1);
  const estBrakingDist = Math.round(32 - (upgrades.downforce - 1.0) * 4);

  return (
    <div className="fixed inset-0 z-30 pointer-events-auto flex flex-col justify-between p-4 md:p-8 bg-slate-950/85 font-sans select-none overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-4 rounded-lg shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition"
            title="Return to Track"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono tracking-widest text-amber-400 font-bold">
                PERFORMANCE TUNING & UPGRADES
              </span>
              <span className="text-xs bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-mono">
                {upgrades.horsepower} BHP
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide">Apex GT Hypercar Performance Suite</h2>
          </div>
        </div>

        <button
          onClick={onStartDrive}
          className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold text-sm uppercase tracking-wider transition shadow-lg"
        >
          DRIVE TUNED CAR
        </button>
      </div>

      {/* Main Grid: Telemetry Estimates Card & Tuning Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 my-4 max-w-6xl self-center w-full">
        {/* Left Column: Live Dyno Performance Readout */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-amber-400 font-mono text-xs font-bold uppercase">
            <Gauge className="w-4 h-4" />
            Dyno Performance Benchmarks
          </div>

          <div className="space-y-3 font-mono">
            <div className="bg-slate-950/70 p-3 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase block">EST. TOP SPEED</span>
              <div className="text-2xl font-black text-white tabular-nums">
                {estTopSpeed} <span className="text-xs text-slate-400">KM/H</span>
              </div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase block">0-100 KM/H SPRINT</span>
              <div className="text-2xl font-black text-emerald-400 tabular-nums">
                {estZeroToHundred} <span className="text-xs text-slate-400">SEC</span>
              </div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase block">CORNERING LATERAL G</span>
              <div className="text-2xl font-black text-purple-400 tabular-nums">
                {estMaxG} <span className="text-xs text-slate-400">G-FORCE</span>
              </div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase block">100-0 KM/H BRAKING</span>
              <div className="text-2xl font-black text-cyan-400 tabular-nums">
                {estBrakingDist} <span className="text-xs text-slate-400">METERS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 3 Columns: Tuning Modules */}
        <div className="md:col-span-3 bg-slate-900/90 border border-slate-800 rounded-lg p-5 shadow-xl space-y-6">
          {/* Engine & Aerodynamics */}
          <div>
            <div className="text-xs font-mono font-bold uppercase text-slate-400 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-red-400" />
              Power Unit & Aerodynamic Package
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              <div className="space-y-1 bg-slate-950/50 p-3 rounded border border-slate-800">
                <div className="flex justify-between text-slate-300">
                  <span>ENGINE HORSEPOWER</span>
                  <span className="font-bold text-red-400">{upgrades.horsepower} BHP</span>
                </div>
                <input
                  type="range"
                  min="700"
                  max="1100"
                  step="10"
                  value={upgrades.horsepower}
                  onChange={(e) => onUpdateUpgrades({ ...upgrades, horsepower: parseInt(e.target.value, 10) })}
                  className="w-full accent-red-500 cursor-pointer"
                />
                <div className="text-[10px] text-slate-400 mt-1">Twin-turbocharged 1.6L V6 hybrid powertrain</div>
              </div>

              <div className="space-y-1 bg-slate-950/50 p-3 rounded border border-slate-800">
                <div className="flex justify-between text-slate-300">
                  <span>AERO DOWNFORCE WING ANGLE</span>
                  <span className="font-bold text-cyan-400">{upgrades.downforce.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="2.5"
                  step="0.1"
                  value={upgrades.downforce}
                  onChange={(e) => onUpdateUpgrades({ ...upgrades, downforce: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="text-[10px] text-slate-400 mt-1">Higher downforce = higher corner grip, more drag</div>
              </div>
            </div>
          </div>

          {/* Tires, Suspension & Brakes */}
          <div>
            <div className="text-xs font-mono font-bold uppercase text-slate-400 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              Tire Compounds, Transmission & Braking
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
              {/* Tire Compound Selection */}
              <div className="space-y-1 bg-slate-950/50 p-3 rounded border border-slate-800">
                <span className="text-slate-300 block mb-1">TIRE COMPOUND</span>
                <div className="grid grid-cols-3 gap-1">
                  {(['soft', 'hard', 'wet'] as TireCompound[]).map((compound) => (
                    <button
                      key={compound}
                      onClick={() => onUpdateUpgrades({ ...upgrades, tireCompound: compound })}
                      className={`p-1.5 rounded uppercase text-[11px] font-bold border transition ${
                        upgrades.tireCompound === compound
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {compound}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {upgrades.tireCompound === 'soft' && 'Maximum peak grip for dry qualifying laps'}
                  {upgrades.tireCompound === 'hard' && 'Durable consistent race pace compound'}
                  {upgrades.tireCompound === 'wet' && 'Grooved tread channels water during rain storms'}
                </div>
              </div>

              {/* Gear Ratio Preset */}
              <div className="space-y-1 bg-slate-950/50 p-3 rounded border border-slate-800">
                <span className="text-slate-300 block mb-1">GEARBOX RATIO PRESET</span>
                <select
                  value={upgrades.gearRatioPreset}
                  onChange={(e) => onUpdateUpgrades({ ...upgrades, gearRatioPreset: e.target.value as GearRatioPreset })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-200 text-xs font-mono"
                >
                  <option value="acceleration">Short / Fast Acceleration</option>
                  <option value="balanced">Balanced Grand Prix</option>
                  <option value="top_speed">Long / Monza Top Speed</option>
                </select>
                <div className="text-[10px] text-slate-400 mt-1">7-speed seamless shift dual-clutch transmission</div>
              </div>

              {/* Brake Bias */}
              <div className="space-y-1 bg-slate-950/50 p-3 rounded border border-slate-800">
                <div className="flex justify-between text-slate-300">
                  <span>BRAKE BIAS</span>
                  <span className="font-bold text-amber-400">{upgrades.brakeBias}% Front</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="65"
                  value={upgrades.brakeBias}
                  onChange={(e) => onUpdateUpgrades({ ...upgrades, brakeBias: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="text-[10px] text-slate-400 mt-1">Front/rear brake distribution control</div>
              </div>
            </div>
          </div>

          {/* Custom Livery Colors */}
          <div>
            <div className="text-xs font-mono font-bold uppercase text-slate-400 mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4 text-cyan-400" />
              Racing Livery & Finish Studio
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {LIVERY_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => onUpdateUpgrades({
                    ...upgrades,
                    paintColor: preset.paint,
                    accentColor: preset.accent,
                    rimColor: preset.rim,
                  })}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded transition font-mono text-xs text-slate-200"
                >
                  <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: preset.paint }} />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-400 font-mono py-2">
        Aerodynamic & Power tuning alters vehicle kinematics & top speed in real time
      </div>
    </div>
  );
};
