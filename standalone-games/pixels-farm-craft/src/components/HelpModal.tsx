import React from 'react';
import { X, HelpCircle, Zap, Sparkles, MapPin, Compass, RotateCcw } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
  onStartTutorial?: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose, onStartTutorial }) => {
  const handleResetSave = () => {
    if (window.confirm('Reset all saved farm progress and restart fresh?')) {
      localStorage.removeItem('pixels_save_game_v2');
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
      <div className="pixels-box w-full max-w-lg rounded-lg p-5 flex flex-col gap-4 text-amber-50 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#5a3921] pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-amber-300">How to Play Pixels</h2>
              <p className="text-[8px] text-stone-300">Complete Guide, Auto-Walk & Hotkeys</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-white rounded hover:bg-[#3a251e] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content sections */}
        <div className="space-y-3 text-[9px] leading-relaxed">
          <div className="bg-[#1a1210] p-3 rounded border border-[#5a3921]">
            <h3 className="text-amber-400 font-bold mb-1 uppercase flex items-center gap-1.5">
              <span>🎮 Movement & Smart Auto-Walk</span>
            </h3>
            <ul className="list-disc list-inside space-y-1 text-stone-300">
              <li><strong className="text-white">Click-to-Move / Auto-Walk:</strong> Click anywhere on the ground or on an object (plots, trees, chickens, NPCs) to automatically walk over and interact!</li>
              <li><strong className="text-white">WASD / Arrow Keys:</strong> Manual walking anytime. Pressing keys instantly takes priority over auto-walk.</li>
              <li><strong className="text-white">Minimap Radar:</strong> Click anywhere on the top-right radar to walk across the 70x50 big map.</li>
              <li><strong className="text-white">1 - 8 Keys:</strong> Select your active tool, seed, or fertilizer from the hotbar.</li>
              <li><strong className="text-white">Eat Food from Hotbar:</strong> Click any food in your hotbar to eat and restore Energy instantly!</li>
              <li><strong className="text-white">T Key:</strong> Toggle Barney's Beginner Tutorial.</li>
              <li><strong className="text-white">B / E Key:</strong> Open your 24-slot Backpack.</li>
            </ul>
          </div>

          <div className="bg-[#1a1210] p-3 rounded border border-[#5a3921]">
            <h3 className="text-amber-400 font-bold mb-1 uppercase flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>⚡ Energy System & Saunas</span>
            </h3>
            <p className="text-stone-300 mb-1.5">
              Farming, chopping trees, and cooking consumes Energy. If your energy gets low:
            </p>
            <ul className="list-disc list-inside space-y-1 text-stone-300">
              <li><strong className="text-white">Visit Terra Villa Sauna:</strong> Step into the steaming hot springs pool for rapid +45⚡/s recovery!</li>
              <li><strong className="text-white">Bake & Eat:</strong> Cook Popberry Tarts (+120⚡) or Berry Smoothies (+250⚡) at the bakery.</li>
            </ul>
          </div>

          <div className="bg-[#1a1210] p-3 rounded border border-[#5a3921]">
            <h3 className="text-amber-400 font-bold mb-1 uppercase flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>🌱 48 Farming Plots & Economy</span>
            </h3>
            <ul className="list-disc list-inside space-y-1 text-stone-300">
              <li>Till soil plots with your <strong className="text-white">Hoe [1]</strong>.</li>
              <li>Plant <strong className="text-white">Popberry, Butterberry, Carrot, Clover, Sunpetal, or Pumpkin</strong> seeds.</li>
              <li>Water with your <strong className="text-white">Watering Can [2]</strong> to start growth!</li>
              <li>Harvest mature crops for XP & coins, or sell to <strong className="text-white">Hazel</strong> in Terra Villa!</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#5a3921]">
          {onStartTutorial && (
            <button
              onClick={() => {
                onClose();
                onStartTutorial();
              }}
              className="pixels-box flex-1 py-2.5 rounded text-[10px] font-bold text-amber-300 hover:text-white hover:border-amber-400 cursor-pointer text-center"
            >
              Start Tutorial 👨‍🌾
            </button>
          )}
          <button
            onClick={handleResetSave}
            className="pixels-box py-2.5 px-3 rounded text-[9px] font-bold text-red-400 hover:text-red-200 hover:border-red-500 cursor-pointer flex items-center justify-center gap-1"
            title="Reset saved farm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Save</span>
          </button>
          <button
            onClick={onClose}
            className="pixels-btn flex-1 py-2.5 rounded text-[10px] font-bold cursor-pointer"
          >
            Play Now!
          </button>
        </div>
      </div>
    </div>
  );
};
