import React, { useState } from 'react';
import { TrackConfig, TrackPoint } from '../types/game';
import { Plus, Trash2, Copy, Play, ArrowLeft, RotateCcw, Sliders, Check } from 'lucide-react';

interface TrackMakerOverlayProps {
  track: TrackConfig;
  selectedPointId: string;
  onSelectPoint: (id: string) => void;
  onUpdateTrack: (updatedTrack: TrackConfig) => void;
  onCloneTrack: () => void;
  onStartDrive: () => void;
  onClose: () => void;
}

export const TrackMakerOverlay: React.FC<TrackMakerOverlayProps> = ({
  track,
  selectedPointId,
  onSelectPoint,
  onUpdateTrack,
  onCloneTrack,
  onStartDrive,
  onClose,
}) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const selectedPoint = track.points.find((p) => p.id === selectedPointId) || track.points[0];

  const updateSelectedPoint = (updates: Partial<TrackPoint>) => {
    if (!selectedPoint) return;
    const updatedPoints = track.points.map((p) =>
      p.id === selectedPoint.id ? { ...p, ...updates } : p
    );
    onUpdateTrack({ ...track, points: updatedPoints });
  };

  const handleAddPoint = () => {
    if (!selectedPoint) return;
    const currentIndex = track.points.findIndex((p) => p.id === selectedPoint.id);
    const nextIndex = (currentIndex + 1) % track.points.length;
    const nextPoint = track.points[nextIndex];

    // Midpoint between current and next
    const newPoint: TrackPoint = {
      id: `pt_${Date.now()}`,
      x: Math.round((selectedPoint.x + nextPoint.x) * 0.5 + (Math.random() - 0.5) * 10),
      y: Math.round((selectedPoint.y + nextPoint.y) * 0.5),
      z: Math.round((selectedPoint.z + nextPoint.z) * 0.5 + (Math.random() - 0.5) * 10),
      width: selectedPoint.width || 14,
      banking: 0,
      kerb: 'both',
    };

    const newPoints = [...track.points];
    newPoints.splice(currentIndex + 1, 0, newPoint);
    onUpdateTrack({ ...track, points: newPoints });
    onSelectPoint(newPoint.id);
  };

  const handleDeletePoint = () => {
    if (track.points.length <= 4) {
      alert('A track requires at least 4 curve waypoints.');
      return;
    }
    const filteredPoints = track.points.filter((p) => p.id !== selectedPoint.id);
    onUpdateTrack({ ...track, points: filteredPoints });
    onSelectPoint(filteredPoints[0].id);
  };

  const handleExportJson = () => {
    const json = JSON.stringify(track, null, 2);
    navigator.clipboard.writeText(json);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-30 pointer-events-auto flex flex-col justify-between p-4 md:p-6 bg-slate-950/80 font-sans select-none overflow-y-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-lg shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition"
            title="Back to Race"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono tracking-widest text-cyan-400 font-bold">
                CURVES STUDIO · TRACK MAKER
              </span>
              <span className="text-xs bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-mono">
                {track.points.length} WAYPOINTS
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide">{track.name}</h2>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onCloneTrack}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/60 rounded text-xs font-mono font-semibold transition"
          >
            <Copy className="w-3.5 h-3.5" />
            CLONE TRACK
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-xs font-mono transition"
          >
            {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Sliders className="w-3.5 h-3.5" />}
            {copySuccess ? 'COPIED!' : 'EXPORT JSON'}
          </button>

          <button
            onClick={onStartDrive}
            className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold text-sm uppercase tracking-wider transition shadow-lg"
          >
            <Play className="w-4 h-4 fill-current" />
            TEST DRIVE TRACK
          </button>
        </div>
      </div>

      {/* Editor Main Controls (Split view: Waypoint strip + Curve Param Inspector) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4 max-w-5xl self-center w-full">
        {/* Left column: Waypoint List */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 max-h-[360px] flex flex-col shadow-xl">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="text-xs uppercase font-mono text-slate-400 font-bold">Curve Waypoints</span>
            <button
              onClick={handleAddPoint}
              className="flex items-center gap-1 px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-mono font-bold transition"
            >
              <Plus className="w-3 h-3" />
              ADD CURVE
            </button>
          </div>

          <div className="overflow-y-auto space-y-1.5 pr-1 flex-1">
            {track.points.map((p, idx) => {
              const isSelected = p.id === selectedPoint.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectPoint(p.id)}
                  className={`w-full flex items-center justify-between p-2 rounded text-left text-xs font-mono transition ${
                    isSelected
                      ? 'bg-cyan-950/80 border border-cyan-500 text-cyan-200'
                      : 'bg-slate-950/50 hover:bg-slate-800/60 text-slate-400 border border-slate-800/60'
                  }`}
                >
                  <span className="font-bold">
                    #{idx + 1} {idx === 0 ? '(START/FINISH)' : `Turn ${idx}`}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    X:{Math.round(p.x)} Z:{Math.round(p.z)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 2 columns: Selected Curve Inspector */}
        <div className="md:col-span-2 bg-slate-900/90 border border-slate-800 rounded-lg p-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <span className="text-xs uppercase font-mono text-cyan-400 font-bold">
                EDITING WAYPOINT #{track.points.findIndex((p) => p.id === selectedPoint.id) + 1}
              </span>
              <button
                onClick={handleDeletePoint}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-mono transition"
                title="Remove this waypoint"
              >
                <Trash2 className="w-3.5 h-3.5" />
                DELETE TURN
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono text-xs">
              {/* Position X Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>POS X (LATERAL)</span>
                  <span className="font-bold text-white">{Math.round(selectedPoint.x)}m</span>
                </div>
                <input
                  type="range"
                  min="-350"
                  max="350"
                  value={selectedPoint.x}
                  onChange={(e) => updateSelectedPoint({ x: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Position Z Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>POS Z (LONG)</span>
                  <span className="font-bold text-white">{Math.round(selectedPoint.z)}m</span>
                </div>
                <input
                  type="range"
                  min="-350"
                  max="850"
                  value={selectedPoint.z}
                  onChange={(e) => updateSelectedPoint({ z: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Elevation Y Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>ELEVATION Y</span>
                  <span className="font-bold text-emerald-400">{selectedPoint.y.toFixed(1)}m</span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="30"
                  step="0.5"
                  value={selectedPoint.y}
                  onChange={(e) => updateSelectedPoint({ y: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Banking Angle */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>BANKING ANGLE</span>
                  <span className="font-bold text-amber-400">{selectedPoint.banking || 0}°</span>
                </div>
                <input
                  type="range"
                  min="-15"
                  max="15"
                  value={selectedPoint.banking || 0}
                  onChange={(e) => updateSelectedPoint({ banking: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Road Width */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>ROAD WIDTH</span>
                  <span className="font-bold text-white">{selectedPoint.width || 14}m</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="22"
                  value={selectedPoint.width || 14}
                  onChange={(e) => updateSelectedPoint({ width: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Kerb Rumble Style */}
              <div className="space-y-1">
                <div className="text-slate-300">KERBS STRIP</div>
                <select
                  value={selectedPoint.kerb || 'none'}
                  onChange={(e) => updateSelectedPoint({ kerb: e.target.value as TrackPoint['kerb'] })}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-slate-200 text-xs font-mono"
                >
                  <option value="none">No Kerbs</option>
                  <option value="left">Left Apex Kerb</option>
                  <option value="right">Right Apex Kerb</option>
                  <option value="both">Both Sides</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Tip: Drag 3D waypoint cylinders directly on the track or use sliders.</span>
            <button
              onClick={() => updateSelectedPoint({ banking: 0, y: 0 })}
              className="flex items-center gap-1 text-slate-300 hover:text-white"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Turn Level
            </button>
          </div>
        </div>
      </div>

      {/* Footer controls hint */}
      <div className="text-center text-xs text-slate-400 font-mono py-2">
        Curves Studio Real-Time Spline Extruder · Edits reflect instantly in 3D
      </div>
    </div>
  );
};
