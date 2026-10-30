import React from 'react';
import { X, Scroll, Coins, Award, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Quest } from '../game/types';
import { ITEMS } from '../game/constants';
import { sounds } from '../game/audio';

interface QuestModalProps {
  quest: Quest;
  onClose: () => void;
  onClaimReward: (questId: string) => void;
}

export const QuestModal: React.FC<QuestModalProps> = ({
  quest,
  onClose,
  onClaimReward,
}) => {
  const handleClaim = () => {
    sounds.playFanfare();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
    onClaimReward(quest.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
      <div className="pixels-box w-full max-w-md rounded-lg p-5 flex flex-col gap-4 text-amber-50">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#5a3921] pb-3">
          <div className="flex items-center gap-2">
            <Scroll className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-amber-300">{quest.title}</h2>
              <p className="text-[8px] text-stone-300">Questgiver: {quest.npcName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-white rounded hover:bg-[#3a251e] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NPC Dialogue Box */}
        <div className="bg-[#1a1210] border border-[#5a3921] rounded p-3 flex gap-3">
          {/* NPC Portrait */}
          <div className="w-12 h-12 bg-[#2b1f1d] border border-amber-600 rounded flex flex-col items-center justify-center text-2xl shrink-0">
            {quest.npcName.includes('Barney') && '👨‍🌾'}
            {quest.npcName.includes('Hazel') && '👩‍🌾'}
            {quest.npcName.includes('Dale') && '🤠'}
          </div>

          <div className="flex-1 space-y-1.5 text-[8px] text-stone-200">
            {quest.npcDialogue.map((line, idx) => (
              <p key={idx} className="leading-relaxed">
                "{line}"
              </p>
            ))}
          </div>
        </div>

        {/* Objective Progress */}
        <div className="pixels-box p-3 rounded">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-amber-300 font-bold">Goal:</span>
            <span className="text-[9px] font-mono text-stone-300">
              {quest.currentCount} / {quest.targetCount}
            </span>
          </div>
          <p className="text-[8px] text-stone-200">{quest.objectiveDescription}</p>

          <div className="w-full h-2.5 bg-[#17100e] border border-[#5a3921] rounded-sm mt-2 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{
                width: `${Math.min(100, (quest.currentCount / quest.targetCount) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Rewards Section */}
        <div className="bg-[#1a1210] border border-[#5a3921] rounded p-3">
          <span className="text-[8px] text-stone-400 uppercase font-bold block mb-1.5">
            Quest Completion Rewards
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[10px] text-amber-300 font-mono font-bold">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>+{quest.rewardCoins} Coins</span>
            </div>

            <div className="flex items-center gap-1 text-[10px] text-purple-300 font-mono font-bold">
              <Award className="w-3.5 h-3.5 text-purple-400" />
              <span>+{quest.rewardXp} XP</span>
            </div>

            {quest.rewardItems?.map((rew) => {
              const itm = ITEMS[rew.itemId];
              return (
                <div key={rew.itemId} className="text-[9px] text-emerald-300 font-mono">
                  +{rew.count} {itm?.name}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        {quest.completed ? (
          <button
            onClick={handleClaim}
            className="pixels-btn w-full py-2.5 rounded text-[10px] font-bold flex items-center justify-center gap-2 animate-bounce cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>CLAIM REWARDS</span>
          </button>
        ) : (
          <button
            onClick={onClose}
            className="pixels-box w-full py-2 rounded text-[9px] text-stone-300 font-bold hover:text-white cursor-pointer"
          >
            I'm On It! (Close)
          </button>
        )}
      </div>
    </div>
  );
};
