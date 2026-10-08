import React, { useState } from 'react';
import { PlatformStyle, AppLanguage } from '../types/media';
import { translations } from '../i18n/translations';
import {
  Minus,
  Square,
  X,
  Maximize2,
  Tv,
  Globe,
  Radio,
  Cpu,
  Monitor
} from 'lucide-react';

interface DesktopFrameProps {
  platform: PlatformStyle;
  onPlatformChange: (p: PlatformStyle) => void;
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  activeSyncCount: number;
  hwAccelerated: boolean;
  children: React.ReactNode;
}

export const DesktopFrame: React.FC<DesktopFrameProps> = ({
  platform,
  onPlatformChange,
  language,
  onLanguageChange,
  activeSyncCount,
  hwAccelerated,
  children,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const t = translations[language];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 select-none">
      {/* Native Desktop Window Title Bar */}
      <header className="h-10 bg-neutral-900/90 border-b border-neutral-800/80 px-3 flex items-center justify-between text-xs font-sans backdrop-blur-md z-50 shrink-0">
        {/* Left Side: macOS Traffic Lights or Windows App Icon */}
        <div className="flex items-center gap-3">
          {platform === 'macos' && (
            <div className="flex items-center gap-2 group mr-2">
              <button
                type="button"
                aria-label="Close Window"
                className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center transition-colors shadow-inner"
              >
                <X className="w-2 h-2 text-red-950 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                type="button"
                aria-label="Minimize Window"
                className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 flex items-center justify-center transition-colors shadow-inner"
              >
                <Minus className="w-2 h-2 text-amber-950 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                type="button"
                aria-label="Maximize Window"
                onClick={toggleFullscreen}
                className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 flex items-center justify-center transition-colors shadow-inner"
              >
                <Maximize2 className="w-2 h-2 text-emerald-950 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          )}

          {platform === 'windows' && (
            <div className="flex items-center gap-2 text-neutral-400">
              <Tv className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-neutral-200 tracking-tight">NovaStream Local Cinema</span>
              <span className="text-neutral-600">|</span>
              <span className="text-[11px] text-neutral-400">Windows 11 Native GUI</span>
            </div>
          )}

          {platform === 'linux' && (
            <div className="flex items-center gap-2 text-neutral-400">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
              <span className="font-semibold text-neutral-200">NovaStream · GTK4 / Wayland</span>
            </div>
          )}

          {platform === 'macos' && (
            <div className="flex items-center gap-1.5 text-neutral-400">
              <span className="font-semibold text-neutral-200 tracking-tight">NovaStream</span>
              <span className="text-neutral-600">/</span>
              <span className="text-[11px] text-neutral-400 font-mono">macOS Sonoma Metal 3</span>
            </div>
          )}
        </div>

        {/* Center: System Status Indicators */}
        <div className="hidden md:flex items-center gap-4 text-[11px] text-neutral-400">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-neutral-400" />
            <span>NVENC / QSV 硬件直解:</span>
            <span className={hwAccelerated ? 'text-emerald-400 font-mono' : 'text-neutral-500'}>
              {hwAccelerated ? '0.2ms 极速转码' : '未启用'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>SyncPlay:</span>
            <span className="text-amber-300 font-mono font-medium">{activeSyncCount} 设备就绪</span>
          </div>
        </div>

        {/* Right Side: Window Platform Toggle & Language Switcher & Controls */}
        <div className="flex items-center gap-2">
          {/* Platform OS Style Selector */}
          <div className="flex items-center bg-neutral-800/80 rounded border border-neutral-700/60 p-0.5 text-[11px]">
            <button
              onClick={() => onPlatformChange('macos')}
              className={`px-2 py-0.5 rounded transition-colors ${
                platform === 'macos'
                  ? 'bg-neutral-700 text-white font-medium shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="切换至 macOS 窗体风格"
            >
              macOS
            </button>
            <button
              onClick={() => onPlatformChange('windows')}
              className={`px-2 py-0.5 rounded transition-colors ${
                platform === 'windows'
                  ? 'bg-neutral-700 text-white font-medium shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="切换至 Windows 11 风格"
            >
              Win 11
            </button>
            <button
              onClick={() => onPlatformChange('linux')}
              className={`px-2 py-0.5 rounded transition-colors ${
                platform === 'linux'
                  ? 'bg-neutral-700 text-white font-medium shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="切换至 Linux GNOME 风格"
            >
              Linux
            </button>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-neutral-800/80 rounded border border-neutral-700/60 px-2 py-0.5 text-[11px]">
            <Globe className="w-3 h-3 text-neutral-400" />
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as AppLanguage)}
              className="bg-transparent text-neutral-300 text-xs focus:outline-none cursor-pointer border-none"
            >
              <option value="zh-CN" className="bg-neutral-900 text-neutral-200">简体中文</option>
              <option value="zh-TW" className="bg-neutral-900 text-neutral-200">繁體中文</option>
              <option value="en" className="bg-neutral-900 text-neutral-200">English</option>
              <option value="ja" className="bg-neutral-900 text-neutral-200">日本語</option>
            </select>
          </div>

          {/* Windows / Linux title controls on right */}
          {platform === 'windows' && (
            <div className="flex items-center ml-2 border-l border-neutral-800 pl-1">
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                title="最小化"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                className="w-8 h-8 flex items-center justify-center hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                title="最大化 / 还原"
              >
                <Square className="w-3 h-3" />
              </button>
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center hover:bg-red-600 text-neutral-400 hover:text-white transition-colors"
                title="关闭"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {platform === 'linux' && (
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={toggleFullscreen}
                className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 overflow-hidden flex relative">
        {children}
      </div>
    </div>
  );
};
