import React from 'react';
import { Sparkles, ArrowRight, ArrowLeft, XCircle, CheckCircle2 } from 'lucide-react';
import { sounds } from '../game/audio';

export interface TutorialStep {
  title: string;
  badge: string;
  instructions: string;
  highlightAction: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Welcome to Pixels Farmstead!',
    badge: 'Step 1/5 · Basics',
    instructions:
      'Welcome to Terra Villa! You control your farmer with WASD or Arrow Keys. Walk west towards the open soil plots beside the house to get started.',
    highlightAction: 'Tip: Use WASD / Arrows to walk',
  },
  {
    title: 'Tilling the Soil with Rusty Hoe',
    badge: 'Step 2/5 · Soil Preparation',
    instructions:
      'Equip your Rusty Hoe by pressing [1] or clicking Slot 1 on your hotbar. Walk up to a dry brown plot and press Space or Click to till the ground into fertile soil.',
    highlightAction: 'Hotbar Slot [1] · Rusty Hoe (-2 ⚡)',
  },
  {
    title: 'Planting Juicy Popberries',
    badge: 'Step 3/5 · Sowing Seeds',
    instructions:
      'Select your Popberry Seeds by pressing [5]. Click or press Space while facing any tilled plot to sow your seeds. They only grow once they receive water!',
    highlightAction: 'Hotbar Slot [5] · Popberry Seeds 🌱',
  },
  {
    title: 'Watering & Harvest Bounty',
    badge: 'Step 4/5 · Hydration & Harvest',
    instructions:
      'Select your Watering Can by pressing [2] and water the sprout. Crops mature in ~10 seconds! When you see bright red berries and sparkle stars, click or press Space to harvest.',
    highlightAction: 'Hotbar Slot [2] · Watering Can 💧',
  },
  {
    title: 'Energy, Sauna & Terra Villa',
    badge: 'Step 5/5 · Town & Economy',
    instructions:
      'Every farm action consumes Energy ⚡. If tired, visit the hot springs Sauna in Terra Villa to rapidly recharge, or eat tarts in your Bag [E]. Visit Hazel’s Store in Terra Villa to sell crops for coins!',
    highlightAction: 'Top Bar: Fast Travel to Terra Villa 🏛️',
  },
];

interface TutorialOverlayProps {
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  currentStep,
  onNext,
  onPrev,
  onSkip,
}) => {
  const step = TUTORIAL_STEPS[currentStep] || TUTORIAL_STEPS[0];
  const isLast = currentStep === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    sounds.playCoin();
    onNext();
  };

  const handlePrev = () => {
    sounds.playTill();
    onPrev();
  };

  const handleSkip = () => {
    sounds.playPlant();
    onSkip();
  };

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-lg pointer-events-auto">
      <div className="pixels-box p-4 rounded-lg shadow-2xl border-4 border-[#825835] bg-[#241715]/95 text-amber-50">
        {/* Top bar with Guide badge & Skip option */}
        <div className="flex items-center justify-between border-b border-[#5a3921] pb-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">👨‍🌾</span>
            <div>
              <span className="text-[10px] text-amber-300 font-bold tracking-wide block">
                Farmer Barney’s Guide
              </span>
              <span className="text-[8px] text-stone-400 font-mono">{step.badge}</span>
            </div>
          </div>

          {/* Explicit Skip Tutorial Button */}
          <button
            onClick={handleSkip}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#3a1d1d] hover:bg-[#522525] border border-red-700/60 text-red-200 text-[9px] font-bold cursor-pointer transition-colors"
            title="Dismiss tutorial and play freely"
          >
            <XCircle className="w-3.5 h-3.5 text-red-400" />
            <span>Skip Tutorial</span>
          </button>
        </div>

        {/* Step Title & Instruction Body */}
        <div className="mb-3">
          <h3 className="text-xs font-bold text-amber-300 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{step.title}</span>
          </h3>
          <p className="text-[9px] text-stone-200 leading-relaxed font-mono">
            {step.instructions}
          </p>

          {/* Action Clue Pill */}
          <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#160f0d] border border-[#5a3921] text-[8px] text-amber-300 font-bold">
            <span>🎯 {step.highlightAction}</span>
          </div>
        </div>

        {/* Bottom Navigation & Step Pips */}
        <div className="flex items-center justify-between pt-2 border-t border-[#5a3921]">
          {/* Step Progress Dots */}
          <div className="flex items-center gap-1.5">
            {TUTORIAL_STEPS.map((_, idx) => (
              <span
                key={idx}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentStep
                    ? 'bg-amber-400 scale-125'
                    : idx < currentStep
                    ? 'bg-emerald-500'
                    : 'bg-stone-600'
                }`}
              />
            ))}
          </div>

          {/* Prev / Next Action Controls */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="pixels-box px-3 py-1.5 rounded text-[8px] text-stone-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="pixels-btn px-4 py-1.5 rounded text-[9px] font-bold flex items-center gap-1 cursor-pointer"
            >
              {isLast ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-900" />
                  <span>Start Farming!</span>
                </>
              ) : (
                <>
                  <span>Next Step</span>
                  <ArrowRight className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
