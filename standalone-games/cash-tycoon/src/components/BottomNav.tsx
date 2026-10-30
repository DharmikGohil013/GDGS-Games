import React from 'react';
import { Building2, Users, TrendingUp, Crown, Sparkles } from 'lucide-react';
import { ActiveTab } from '../types/game';
import { sound } from '../game/sound';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  claimableFame: number;
  availableManagersCount: number;
  availableUpgradesCount: number;
  isWheelReady: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  claimableFame,
  availableManagersCount,
  availableUpgradesCount,
  isWheelReady,
}) => {
  const tabs = [
    { id: 'tower' as ActiveTab, label: 'Tower', icon: Building2, badge: null },
    {
      id: 'managers' as ActiveTab,
      label: 'Managers',
      icon: Users,
      badge: availableManagersCount > 0 ? availableManagersCount : null,
      badgeColor: 'bg-emerald-500',
    },
    {
      id: 'upgrades' as ActiveTab,
      label: 'Upgrades',
      icon: TrendingUp,
      badge: availableUpgradesCount > 0 ? availableUpgradesCount : null,
      badgeColor: 'bg-blue-500',
    },
    {
      id: 'fame' as ActiveTab,
      label: 'Fame',
      icon: Crown,
      badge: claimableFame > 0 ? `+${claimableFame}` : null,
      badgeColor: 'bg-amber-500 animate-pulse',
    },
    {
      id: 'wheel' as ActiveTab,
      label: 'Spin',
      icon: Sparkles,
      badge: isWheelReady ? 'FREE' : null,
      badgeColor: 'bg-yellow-400 text-slate-950 font-black animate-bounce',
    },
  ];

  return (
    <nav 
      aria-label="Game Navigation Bar" 
      className="w-full bg-slate-950/95 border-t border-slate-800 px-2 py-1.5 flex justify-around items-center select-none z-30"
    >
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = activeTab === t.id;

        return (
          <button
            key={t.id}
            onClick={() => {
              sound.playTap();
              onTabChange(t.id);
            }}
            aria-label={t.label}
            className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              isActive
                ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110 text-amber-400' : ''}`} />
              {t.badge && (
                <span
                  className={`absolute -top-1.5 -right-3 px-1 py-0.2 rounded-full text-[8px] font-bold text-white shadow-sm ${
                    t.badgeColor || 'bg-red-500'
                  }`}
                >
                  {t.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold tracking-tight mt-0.5">{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
