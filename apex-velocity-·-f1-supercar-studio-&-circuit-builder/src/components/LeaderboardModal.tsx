import React, { useState } from 'react';
import { LapRecord, TrackConfig } from '../types/game';
import { formatLapTime } from '../game/trackMath';
import { Trophy, ArrowLeft, Trash2, Gauge, CloudRain, Sun, Moon } from 'lucide-react';

interface LeaderboardModalProps {
  records: LapRecord[];
  tracks: TrackConfig[];
  selectedTrackId: string;
  onClearRecords: (trackId: string) => void;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  records,
  tracks,
  selectedTrackId,
  onClearRecords,
  onClose,
}) => {
  const [activeTabTrackId, setActiveTabTrackId] = useState(selectedTrackId);

  const filteredRecords = records
    .filter((r) => r.trackId === activeTabTrackId)
    .sort((a, b) => a.lapTimeSeconds - b.lapTimeSeconds);

  return (
    <div className="fixed inset-0 z-40 pointer-events-auto flex items-center justify-center p-4 md:p-8 bg-slate-950/85 font-sans select-none">
      <div className="w-full max-w-4xl bg-slate-900/95 border border-slate-800 rounded-lg p-6 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-bold text-white tracking-wide">
                CIRCUIT TELEMETRY & LAP RECORD LEADERBOARD
              </h2>
            </div>
          </div>

          <button
            onClick={() => onClearRecords(activeTabTrackId)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-red-950/50 hover:text-red-400 text-slate-400 rounded text-xs font-mono transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Track Laps
          </button>
        </div>

        {/* Track Tab Bar */}
        <div className="flex items-center gap-2 overflow-x-auto py-3 border-b border-slate-800/80">
          {tracks.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTabTrackId(t.id)}
              className={`px-3.5 py-1.5 rounded text-xs font-mono uppercase whitespace-nowrap transition border ${
                activeTabTrackId === t.id
                  ? 'bg-red-950/60 border-red-500 text-white font-bold'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* Records Table */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-16 text-slate-400 font-mono text-sm">
              No lap times logged on this circuit yet. Complete a lap to set the record!
            </div>
          ) : (
            <table className="w-full text-left font-mono text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                  <th className="py-2.5 px-3">POS</th>
                  <th className="py-2.5 px-3">DRIVER</th>
                  <th className="py-2.5 px-3">LAP TIME</th>
                  <th className="py-2.5 px-3">S1 / S2 / S3</th>
                  <th className="py-2.5 px-3">TOP SPEED</th>
                  <th className="py-2.5 px-3">WEATHER</th>
                  <th className="py-2.5 px-3">COMPOUND</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredRecords.map((rec, index) => (
                  <tr
                    key={rec.id}
                    className={`hover:bg-slate-800/30 transition ${
                      index === 0 ? 'bg-yellow-500/10' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-bold text-white">
                      {index === 0 ? '🥇 #1' : index === 1 ? '🥈 #2' : index === 2 ? '🥉 #3' : `#${index + 1}`}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-100">{rec.driverName}</td>
                    <td className="py-3 px-3 font-bold text-emerald-400 text-sm tabular-nums">
                      {formatLapTime(rec.lapTimeSeconds)}
                    </td>
                    <td className="py-3 px-3 text-slate-400 tabular-nums">
                      {rec.sector1Seconds.toFixed(1)}s / {rec.sector2Seconds.toFixed(1)}s / {rec.sector3Seconds.toFixed(1)}s
                    </td>
                    <td className="py-3 px-3 text-slate-200 tabular-nums font-bold">
                      {Math.round(rec.topSpeedKmh)} km/h
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] uppercase text-slate-300">
                        {rec.weather === 'rain' ? (
                          <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                        ) : rec.weather === 'night_storm' ? (
                          <Moon className="w-3.5 h-3.5 text-indigo-400" />
                        ) : (
                          <Sun className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        {rec.weather.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-slate-700 bg-slate-950">
                        {rec.compound} ({rec.carBhp} bhp)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 mt-2 border-t border-slate-800 flex items-center justify-between font-mono text-xs text-slate-400">
          <span>Times stored persistently in browser storage</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded font-bold uppercase transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
