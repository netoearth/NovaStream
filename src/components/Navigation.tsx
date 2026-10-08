import React from 'react';
import { AppLanguage } from '../types/media';
import { translations } from '../i18n/translations';
import {
  Film,
  Tv,
  Sparkles,
  Cpu,
  Radio,
  HardDrive,
  Settings,
  Layers,
  Search,
  Sliders,
  ShieldCheck
} from 'lucide-react';

export type ActiveTab = 'home' | 'movies' | 'tv' | 'scraper' | 'transcoder' | 'syncplay' | 'storage' | 'settings';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  language: AppLanguage;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  unmatchedCount: number;
}

interface NavItemConfig {
  id: ActiveTab;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  language,
  searchQuery,
  onSearchChange,
  unmatchedCount,
}) => {
  const t = translations[language];

  const navItems: NavItemConfig[] = [
    { id: 'home', label: t.navHome, icon: Layers },
    { id: 'movies', label: t.navMovies, icon: Film },
    { id: 'tv', label: t.navSeries, icon: Tv },
    { id: 'scraper', label: t.navScraper, icon: Sparkles, badge: unmatchedCount > 0 ? unmatchedCount : undefined },
    { id: 'transcoder', label: t.navTranscoder, icon: Cpu },
    { id: 'syncplay', label: t.navSyncPlay, icon: Radio },
    { id: 'storage', label: t.navStorage, icon: HardDrive },
    { id: 'settings', label: t.navSettings, icon: Settings },
  ];

  return (
    <aside className="w-64 bg-neutral-925 bg-neutral-900/60 border-r border-neutral-800/80 flex flex-col justify-between shrink-0 select-none backdrop-blur-md">
      {/* Top Branding & Search */}
      <div className="p-4 space-y-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-neutral-950">
            <Film className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-neutral-100 tracking-tight leading-none">
              NovaStream
            </h1>
            <p className="text-[11px] text-neutral-400 mt-1 leading-none">
              Local Cinema Hub v2.8
            </p>
          </div>
        </div>

        {/* Global Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-neutral-950/80 border border-neutral-800 text-neutral-200 placeholder-neutral-500 text-xs rounded-md pl-8 pr-3 py-2 focus:outline-none focus:border-amber-500/60 transition-colors"
          />
        </div>

        {/* Navigation list */}
        <nav className="space-y-1 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-300 font-semibold border-l-2 border-amber-400 pl-[10px]'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-neutral-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-semibold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Storage & Health Telemetry Card */}
      <div className="p-4 border-t border-neutral-800/80 space-y-3 bg-neutral-950/40">
        <div className="flex items-center justify-between text-[11px] text-neutral-400">
          <span className="flex items-center gap-1.5 font-medium text-neutral-300">
            <HardDrive className="w-3.5 h-3.5 text-neutral-400" />
            存储池状态
          </span>
          <span className="font-mono text-neutral-400">35.35 / 48.0 TB</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full w-[73%]" />
        </div>

        <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
          <span>NVMe 缓存: 1.2 TB 可用</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            HW 加速正常
          </span>
        </div>
      </div>
    </aside>
  );
};
