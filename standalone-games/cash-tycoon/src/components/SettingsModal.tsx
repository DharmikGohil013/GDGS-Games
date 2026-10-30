import React, { useState } from 'react';
import { GameState } from '../types/game';
import { exportSaveCode, importSaveCode } from '../game/storage';
import { sound } from '../game/sound';
import { X, Save, Copy, Check, AlertOctagon, Volume2, VolumeX, Upload } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  onManualSave: () => void;
  onImportState: (newState: GameState) => void;
  onResetGame: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  gameState,
  onManualSave,
  onImportState,
  onResetGame,
  soundEnabled,
  onToggleSound,
}) => {
  const [copied, setCopied] = useState(false);
  const [savedTick, setSavedTick] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleManualSave = () => {
    sound.playCash();
    onManualSave();
    setSavedTick(true);
    setTimeout(() => setSavedTick(false), 2000);
  };

  const handleExport = () => {
    sound.playTap();
    const code = exportSaveCode(gameState);
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleImport = () => {
    sound.playTap();
    setImportError(null);
    if (!importText.trim()) {
      setImportError('Please paste your save string code first.');
      return;
    }
    const state = importSaveCode(importText);
    if (state) {
      sound.playLevelUp();
      onImportState(state);
      setImportText('');
      onClose();
    } else {
      setImportError('Invalid save string. Please verify and try again.');
    }
  };

  const handleHardReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    sound.playTap();
    onResetGame();
    setConfirmReset(false);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden select-none"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <h2 className="text-base font-bold text-white tracking-wide">Settings & Save Data</h2>
          <button
            onClick={onClose}
            aria-label="Close settings modal"
            className="p-1.5 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Sound Toggle */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-500" />
              )}
              <span className="text-xs font-bold text-white">Audio & Synth Sound FX</span>
            </div>
            <button
              onClick={onToggleSound}
              aria-label="Toggle sound effects"
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                soundEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {soundEnabled ? 'ENABLED' : 'MUTED'}
            </button>
          </div>

          {/* Save Status & Button */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Autosave:</span>
              <span className="text-emerald-400 font-bold font-mono">Active (every 3s)</span>
            </div>

            <button
              onClick={handleManualSave}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {savedTick ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
              <span>{savedTick ? 'Progress Saved to Disk!' : 'Save Progress Now'}</span>
            </button>
          </div>

          {/* Export Save Data */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Cloud / Backup Save Code</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Copy your encrypted progress string to backup your empire or transfer between devices.
            </p>
            <button
              onClick={handleExport}
              className="w-full py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Save Code Copied to Clipboard!' : 'Export & Copy Save Code'}</span>
            </button>
          </div>

          {/* Import Save Data */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-white">Import Save Data</span>
            <input
              type="text"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste backup code here..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 font-mono"
            />
            {importError && <p className="text-[10px] text-red-400">{importError}</p>}
            <button
              onClick={handleImport}
              className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Load Save Code</span>
            </button>
          </div>

          {/* Hard Reset */}
          <div className="pt-2 border-t border-slate-800">
            {confirmReset && (
              <p className="text-[10px] text-red-400 mb-2 text-center">
                WARNING: This wipes all businesses, cash, and lifetime fame completely!
              </p>
            )}
            <button
              onClick={handleHardReset}
              className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                confirmReset
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-red-950/30 border border-red-500/20 text-red-400 hover:bg-red-950/50'
              }`}
            >
              <AlertOctagon className="w-4 h-4" />
              <span>{confirmReset ? 'Confirm Permanent Reset' : 'Reset All Progress'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
