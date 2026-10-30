import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  MapPin,
  Scroll,
  CookingPot,
  Package,
  Zap,
  Coins,
  Gem,
  MessageSquare,
  HelpCircle,
  Sparkles,
  BookOpen,
  Compass,
} from 'lucide-react';
import { InventorySlot, Quest, ChatMessage, FarmPlot } from '../game/types';
import { ITEMS, MAX_ENERGY, TILE_SIZE, WORLD_WIDTH_TILES, WORLD_HEIGHT_TILES } from '../game/constants';
import { calculateLevel } from '../game/rules';

interface HUDProps {
  playerName: string;
  hairColor: string;
  shirtColor: string;
  energy: number;
  coins: number;
  pixelsCurrency: number;
  xp: number;
  currentMap: 'farm' | 'terravilla';
  inventory: InventorySlot[];
  activeSlotIndex: number;
  activeQuest: Quest | null;
  chatMessages: ChatMessage[];
  isMuted: boolean;
  playerPos: { x: number; y: number };
  plots?: FarmPlot[];
  onSelectSlot: (idx: number) => void;
  onUseItem: (itemId: string) => void;
  onToggleSound: () => void;
  onSwitchMap: () => void;
  onOpenStore: () => void;
  onOpenCrafting: () => void;
  onOpenBackpack: () => void;
  onOpenQuestLog: () => void;
  onOpenHelp: () => void;
  onOpenTutorial: () => void;
  onSendMessage: (text: string) => void;
  onMinimapClick?: (worldX: number, worldY: number) => void;
}

export const HUD: React.FC<HUDProps> = ({
  playerName,
  hairColor,
  shirtColor,
  energy,
  coins,
  pixelsCurrency,
  xp,
  currentMap,
  inventory,
  activeSlotIndex,
  activeQuest,
  chatMessages,
  isMuted,
  playerPos,
  plots = [],
  onSelectSlot,
  onUseItem,
  onToggleSound,
  onSwitchMap,
  onOpenStore,
  onOpenCrafting,
  onOpenBackpack,
  onOpenQuestLog,
  onOpenHelp,
  onOpenTutorial,
  onSendMessage,
  onMinimapClick,
}) => {
  const [chatInput, setChatInput] = useState('');
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isMinimapExpanded, setIsMinimapExpanded] = useState(true);

  const levelInfo = calculateLevel(xp);
  const energyPercent = Math.min(100, Math.max(0, (energy / MAX_ENERGY) * 100));

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  const handleQuickEmote = (emote: string) => {
    onSendMessage(emote);
  };

  const activeSlot = inventory[activeSlotIndex];
  const activeItem = activeSlot ? ITEMS[activeSlot.itemId] : null;

  const handleMinimapCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onMinimapClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const normX = clickX / rect.width;
    const normY = clickY / rect.height;
    const worldX = normX * WORLD_WIDTH_TILES * TILE_SIZE;
    const worldY = normY * WORLD_HEIGHT_TILES * TILE_SIZE;
    onMinimapClick(worldX, worldY);
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-30 select-none flex flex-col justify-between p-2.5 sm:p-4">
      {/* ================= TOP BAR ================= */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Player Profile & Currencies */}
        <div className="pointer-events-auto flex flex-col gap-2">
          {/* Profile Card */}
          <div className="pixels-box p-2.5 rounded flex items-center gap-3">
            {/* Avatar Head */}
            <div className="w-10 h-10 bg-[#160f0d] border border-[#5a3921] rounded flex flex-col items-center justify-center relative overflow-hidden shrink-0">
              <div className="w-6 h-2 rounded-t" style={{ backgroundColor: hairColor }} />
              <div className="w-5 h-3 bg-[#fcd34d] flex items-center justify-around px-0.5">
                <div className="w-1 h-1 bg-black rounded-full" />
                <div className="w-1 h-1 bg-black rounded-full" />
              </div>
              <div className="w-7 h-4 rounded-t mt-0.5" style={{ backgroundColor: shirtColor }} />
            </div>

            {/* Name, Level, XP Bar, Energy Bar */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-amber-200 font-bold tracking-wide">
                  {playerName}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 bg-amber-600/90 text-amber-100 rounded font-bold">
                  Lv.{levelInfo.level}
                </span>
              </div>

              {/* XP Progress Bar */}
              <div className="flex items-center gap-1.5">
                <span className="text-[7px] text-amber-300 font-bold">XP</span>
                <div className="w-32 sm:w-44 h-1.5 bg-[#17100e] border border-[#5a3921] rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${Math.round(levelInfo.progressRatio * 100)}%` }}
                  />
                </div>
                <span className="text-[7px] text-stone-300 font-mono">
                  {levelInfo.currentLevelXp}/{levelInfo.nextLevelXp}
                </span>
              </div>

              {/* Energy Bar */}
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                <div className="w-32 sm:w-44 h-3.5 bg-[#17100e] border border-[#5a3921] rounded-sm relative overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                    style={{ width: `${energyPercent}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-bold text-amber-50 drop-shadow">
                    {Math.round(energy)} / {MAX_ENERGY}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Currencies Bar */}
          <div className="flex items-center gap-2">
            <div className="pixels-box px-2.5 py-1.5 rounded flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] text-amber-100 font-mono font-bold tabular-nums">
                {coins}
              </span>
            </div>

            <div className="pixels-box px-2.5 py-1.5 rounded flex items-center gap-1.5">
              <Gem className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[10px] text-purple-200 font-mono font-bold tabular-nums">
                {pixelsCurrency} $PIXEL
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Buttons, Minimap Radar & Quest Tracker */}
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          {/* Quick Nav Controls */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <button
              onClick={onSwitchMap}
              className="pixels-btn px-2.5 py-1.5 text-[9px] font-bold flex items-center gap-1 cursor-pointer bg-gradient-to-r from-amber-700 to-amber-600"
              title="Fast travel between Farmstead and Terra Villa"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-300" />
              <span>{currentMap === 'farm' ? 'Warp to Town' : 'Warp to Farm'}</span>
            </button>

            <button
              onClick={onOpenStore}
              className="pixels-btn px-2.5 py-1.5 text-[9px] font-bold flex items-center gap-1 cursor-pointer"
              title="Hazel's General Store"
            >
              <Coins className="w-3.5 h-3.5 text-yellow-400" />
              <span>Store</span>
            </button>

            <button
              onClick={onOpenCrafting}
              className="pixels-btn px-2.5 py-1.5 text-[9px] font-bold flex items-center gap-1 cursor-pointer"
              title="Crafting Bench & Bakery"
            >
              <CookingPot className="w-3.5 h-3.5 text-orange-400" />
              <span>Craft</span>
            </button>

            <button
              onClick={onOpenBackpack}
              className="pixels-btn px-2.5 py-1.5 text-[9px] font-bold flex items-center gap-1 cursor-pointer"
              title="Inventory Backpack [E / B]"
            >
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bag</span>
            </button>

            <button
              onClick={onToggleSound}
              className="pixels-box p-1.5 rounded hover:border-amber-400 text-amber-300 cursor-pointer"
              title="Toggle Audio [M]"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              onClick={onOpenTutorial}
              className="pixels-btn px-2.5 py-1.5 text-[9px] font-bold flex items-center gap-1 cursor-pointer"
              title="Interactive Beginner Tutorial [T]"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              <span>Tutorial</span>
            </button>

            <button
              onClick={onOpenHelp}
              className="pixels-box p-1.5 rounded hover:border-amber-400 text-amber-300 cursor-pointer"
              title="Controls & Guide [H]"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

          {/* Minimap Radar of the 70x50 Big Ground */}
          <div className="pixels-box p-1.5 rounded flex flex-col items-end">
            <div className="flex items-center justify-between w-full pb-1 text-[7px] font-mono text-amber-300 border-b border-[#5a3921] mb-1">
              <span className="flex items-center gap-1">
                <Compass className="w-2.5 h-2.5 text-amber-400" />
                <span>{currentMap === 'farm' ? 'FARM MAP' : 'TERRA VILLA'}</span>
              </span>
              <button
                onClick={() => setIsMinimapExpanded(!isMinimapExpanded)}
                className="text-stone-400 hover:text-white"
              >
                {isMinimapExpanded ? '−' : '+'}
              </button>
            </div>

            {isMinimapExpanded && (
              <div
                onClick={handleMinimapCanvasClick}
                className="relative w-36 h-24 rounded border border-[#5a3921] overflow-hidden cursor-crosshair"
                style={{
                  backgroundColor: currentMap === 'farm' ? '#356926' : '#4b5563',
                }}
                title="Click anywhere on the minimap to auto-walk!"
              >
                {/* Central Road lines on minimap */}
                <div className="absolute left-[48%] top-0 bottom-0 w-1 bg-[#8a5c32]/60" />
                <div className="absolute top-[48%] left-0 right-0 h-1 bg-[#8a5c32]/60" />

                {/* Farm plots representation */}
                {currentMap === 'farm' && (
                  <>
                    <div className="absolute left-[16%] top-[28%] w-8 h-5 bg-[#613b1f] border border-[#a16207]/40 rounded-xs" />
                    <div className="absolute right-[16%] top-[28%] w-8 h-5 bg-[#613b1f] border border-[#a16207]/40 rounded-xs" />
                  </>
                )}

                {/* Sauna representation on town map */}
                {currentMap === 'terravilla' && (
                  <div className="absolute left-[10%] top-[55%] w-6 h-6 bg-cyan-600/70 border border-cyan-400 rounded-xs" />
                )}

                {/* Fountain on town map */}
                {currentMap === 'terravilla' && (
                  <div className="absolute left-[47%] top-[47%] w-3 h-3 bg-sky-400 rounded-full" />
                )}

                {/* Player Current Position Marker (Pulsing Yellow Dot) */}
                <div
                  className="absolute w-2.5 h-2.5 bg-yellow-300 border border-black rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-ping"
                  style={{
                    left: `${(playerPos.x / (WORLD_WIDTH_TILES * TILE_SIZE)) * 100}%`,
                    top: `${(playerPos.y / (WORLD_HEIGHT_TILES * TILE_SIZE)) * 100}%`,
                  }}
                />
                <div
                  className="absolute w-2 h-2 bg-yellow-400 border border-black rounded-full transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${(playerPos.x / (WORLD_WIDTH_TILES * TILE_SIZE)) * 100}%`,
                    top: `${(playerPos.y / (WORLD_HEIGHT_TILES * TILE_SIZE)) * 100}%`,
                  }}
                />
              </div>
            )}
          </div>

          {/* Active Quest Tracker Widget */}
          {activeQuest && (
            <div
              onClick={onOpenQuestLog}
              className="pixels-box p-2.5 rounded max-w-xs text-left cursor-pointer hover:border-amber-400 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[9px] text-amber-400 font-bold uppercase flex items-center gap-1">
                  <Scroll className="w-3 h-3" />
                  <span>{activeQuest.title}</span>
                </span>
                <span className="text-[8px] text-stone-300 font-mono">
                  {activeQuest.currentCount}/{activeQuest.targetCount}
                </span>
              </div>
              <p className="text-[8px] text-stone-200 line-clamp-2 leading-tight">
                {activeQuest.objectiveDescription}
              </p>
              {activeQuest.completed && (
                <div className="mt-1 text-[8px] text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Complete! Click to claim rewards</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ================= BOTTOM BAR ================= */}
      <div className="flex flex-col sm:flex-row items-end sm:items-end justify-between w-full gap-2">
        {/* Bottom Left: MMO Chat Box */}
        <div className="pointer-events-auto w-full sm:w-80 flex flex-col">
          {/* Chat Messages Log */}
          <div
            className={`pixels-box p-2 rounded-t transition-all duration-200 overflow-y-auto flex flex-col gap-1 text-[8px] font-mono ${
              isChatExpanded ? 'h-40' : 'h-24'
            }`}
          >
            <div className="flex items-center justify-between text-[7px] text-amber-400 font-bold border-b border-[#5a3921] pb-1 mb-1">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-2.5 h-2.5" />
                <span>TERRA VILLA CHAT</span>
              </span>
              <button
                onClick={() => setIsChatExpanded(!isChatExpanded)}
                className="text-stone-400 hover:text-white"
              >
                {isChatExpanded ? '▼ Min' : '▲ Max'}
              </button>
            </div>
            {chatMessages.slice(-6).map((msg) => (
              <div key={msg.id} className="leading-tight">
                <span className={msg.isPlayer ? 'text-amber-400 font-bold' : 'text-sky-300 font-bold'}>
                  {msg.sender}:{' '}
                </span>
                <span className="text-stone-200">{msg.text}</span>
              </div>
            ))}
          </div>

          {/* Chat Input & Quick Emotes */}
          <div className="pixels-box p-1.5 rounded-b border-t-0 flex items-center gap-1">
            <form onSubmit={handleSendChat} className="flex-1 flex">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Chat here... (Enter)"
                className="w-full bg-[#18100e] text-[8px] text-stone-100 px-2 py-1.5 rounded border border-[#5a3921] outline-none font-mono focus:border-amber-400"
              />
            </form>
            <div className="flex gap-0.5">
              {['👋', '❤️', '💃', '🌾'].map((emote) => (
                <button
                  key={emote}
                  onClick={() => handleQuickEmote(emote)}
                  className="px-1.5 py-1 text-[10px] bg-[#3a251e] hover:bg-[#52352b] rounded cursor-pointer"
                >
                  {emote}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Center: Hotbar (Slots 1 - 8) */}
        <div className="pointer-events-auto flex flex-col items-center mx-auto pb-1">
          {/* Action Prompt or Tooltip for Active/Hovered Item */}
          {activeItem && (
            <div className="pixels-box px-3 py-1 rounded mb-1.5 flex items-center gap-2 pointer-events-auto animate-fadeIn">
              <span className="text-[9px] text-amber-300 font-bold">
                {activeItem.name}
              </span>
              {activeItem.energyRestore && (
                <button
                  onClick={() => onUseItem(activeItem.id)}
                  className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[8px] font-bold cursor-pointer"
                >
                  Eat (+{activeItem.energyRestore}⚡)
                </button>
              )}
              {activeItem.energyCost && (
                <span className="text-[7px] text-amber-200">
                  (-{activeItem.energyCost}⚡)
                </span>
              )}
            </div>
          )}

          {/* The 8 Hotbar Slots */}
          <div className="pixels-box p-1.5 rounded-lg flex items-center gap-1.5">
            {Array.from({ length: 8 }).map((_, idx) => {
              const slot = inventory[idx];
              const item = slot ? ITEMS[slot.itemId] : null;
              const isActive = activeSlotIndex === idx;

              return (
                <button
                  key={idx}
                  onClick={() => onSelectSlot(idx)}
                  onMouseEnter={() => setHoveredItem(item?.id || null)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`pixels-slot relative w-11 h-11 sm:w-12 sm:h-12 rounded flex flex-col items-center justify-center cursor-pointer transition-transform ${
                    isActive ? 'active scale-105' : 'hover:border-stone-500'
                  }`}
                >
                  {/* Slot Key Number */}
                  <span className="absolute top-0.5 left-1 text-[7px] font-mono text-stone-400">
                    {idx + 1}
                  </span>

                  {/* Item Icon */}
                  {item ? (
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-base sm:text-lg select-none">
                        {item.icon === 'hoe' && '⛏️'}
                        {item.icon === 'water_can' && '💧'}
                        {item.icon === 'axe' && '🪓'}
                        {item.icon === 'shears' && '✂️'}
                        {item.icon === 'fertilizer' && '✨'}
                        {item.icon === 'popberry_seed' && '🌱'}
                        {item.icon === 'butterberry_seed' && '🟡'}
                        {item.icon === 'clover_seed' && '☘️'}
                        {item.icon === 'carrot_seed' && '🥕'}
                        {item.icon === 'sunpetal_seed' && '🌻'}
                        {item.icon === 'pumpkin_seed' && '🎃'}
                        {item.icon === 'popberry' && '🍓'}
                        {item.icon === 'butterberry' && '🧈'}
                        {item.icon === 'clover' && '🍀'}
                        {item.icon === 'carrot' && '🥕'}
                        {item.icon === 'sunpetal' && '🌻'}
                        {item.icon === 'pumpkin' && '🎃'}
                        {item.icon === 'wood' && '🪵'}
                        {item.icon === 'egg' && '🥚'}
                        {item.icon === 'flour' && '🌾'}
                        {item.icon === 'popberry_tart' && '🥧'}
                        {item.icon === 'energy_smoothie' && '🧃'}
                        {item.icon === 'carrot_cake' && '🍰'}
                      </span>

                      {/* Stack Count Badge */}
                      {slot.count > 1 && (
                        <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold text-amber-200">
                          {slot.count}
                        </span>
                      )}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Spacer */}
        <div className="hidden sm:block w-80 pointer-events-none" />
      </div>
    </div>
  );
};
