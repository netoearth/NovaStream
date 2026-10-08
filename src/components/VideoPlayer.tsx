import React, { useState, useEffect, useRef } from 'react';
import {
  MediaItem,
  AppLanguage,
  TranscodeProfile,
  TranscodeTelemetry,
  AudioTrack,
  SubtitleTrack,
  SyncRoom,
} from '../types/media';
import { translations } from '../i18n/translations';
import { TRANSCODE_PROFILES } from '../data/mockMedia';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Sliders,
  Radio,
  Subtitles,
  Volume1,
  Cpu,
  ArrowLeft,
  Activity,
  Check,
  Settings2,
  Sparkles,
  Zap,
  Upload
} from 'lucide-react';

interface VideoPlayerProps {
  item: MediaItem;
  language: AppLanguage;
  onClose: () => void;
  syncRoom?: SyncRoom | null;
  onSyncPlay?: (time: number) => void;
  onSyncPause?: (time: number) => void;
  onSyncSeek?: (time: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  item,
  language,
  onClose,
  syncRoom,
  onSyncPlay,
  onSyncPause,
  onSyncSeek,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hideControlsTimerRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(item.watchProgressSec || 0);
  const [duration, setDuration] = useState(item.runtimeMinutes * 60);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Settings dropdowns
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [showTelemetryHUD, setShowTelemetryHUD] = useState(false);

  // Active selections
  const [currentProfile, setCurrentProfile] = useState<TranscodeProfile>(TRANSCODE_PROFILES[0]);
  const [currentAudio, setCurrentAudio] = useState<AudioTrack>(item.audioTracks[0] || { id: 'default', language: 'Default', label: 'Default', codec: item.audioCodec, channels: '2.0' });
  const [currentSubtitle, setCurrentSubtitle] = useState<SubtitleTrack | null>(item.subtitles[0] || null);
  const [subDelayMs, setSubDelayMs] = useState(0);
  const [subFontSize, setSubFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [playerSubtitles, setPlayerSubtitles] = useState<SubtitleTrack[]>(item.subtitles || []);
  const playerSubFileRef = useRef<HTMLInputElement | null>(null);

  const handlePlayerLocalSubUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    let format: 'ASS' | 'SRT' | 'VTT' = 'SRT';
    if (file.name.endsWith('.ass') || file.name.endsWith('.ssa')) format = 'ASS';
    else if (file.name.endsWith('.vtt')) format = 'VTT';

    const newSub: SubtitleTrack = {
      id: 'player-local-' + Date.now(),
      language: 'zh-CN / Local',
      label: `${file.name} (播放器本地载入)`,
      format,
      isDefault: true,
    };
    setPlayerSubtitles((prev) => [newSub, ...prev]);
    setCurrentSubtitle(newSub);
    setShowSubMenu(false);
  };

  const getSubtitleTextAtTime = (sec: number, sub: SubtitleTrack): string => {
    const normalized = Math.max(0, sec + subDelayMs / 1000);
    const cycle = Math.floor(normalized / 10) % 6;
    if (normalized < 6) {
      return `${item.title} · ${sub.label}`;
    }
    switch (cycle) {
      case 0:
        return `[双语精校] 探索浩瀚时空与真实宇宙的永恒光辉 / Exploring the infinite universe`;
      case 1:
        return `在理论与真实的交界处，我们见证了未来的诞生 / At the junction of theory and reality, we witnessed tomorrow`;
      case 2:
        return `“不要温和地走进那个良夜，怒斥光明的消逝。” / Do not go gentle into that good night`;
      case 3:
        return `当星辰在暗夜中闪烁，那是人类不屈的目光 / Stars in the void mirror humanity's unyielding gaze`;
      case 4:
        return `[高保真音轨] 跨越光年与维度的交响，此刻与宇宙同频共振。`;
      default:
        return `“原子的裂变在微观宇宙中绽放，普罗米修斯盗取了天火。”`;
    }
  };

  // Real-time simulated hardware telemetry
  const [telemetry, setTelemetry] = useState<TranscodeTelemetry>({
    activeSessionId: 'tx-' + Math.random().toString(36).substring(2, 7),
    mediaTitle: item.title,
    profileName: currentProfile.name,
    hwEngine: currentProfile.hwEngine,
    fps: 144,
    speedMultiplier: 3.8,
    gpuUtilization: 32,
    vramUsedMB: 1840,
    vramTotalMB: 8192,
    bufferAheadSec: 45.2,
    cpuUtilization: 4.8,
    tempCelsius: 49,
    outputBitrateMbps: currentProfile.bitrateMbps || item.bitrateMbps,
    hdrToneMappingActive: currentProfile.toneMapping,
  });

  const t = translations[language];

  // Auto hide controls
  const handleUserActivity = () => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      window.clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowQualityMenu(false);
        setShowAudioMenu(false);
        setShowSubMenu(false);
      }
    }, 3500);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      handleUserActivity();

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        skip(-10);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        skip(10);
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        adjustVolume(0.05);
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        adjustVolume(-0.05);
      } else if (e.code === 'KeyM') {
        setIsMuted((prev) => !prev);
      } else if (e.code === 'KeyF') {
        toggleFullscreen();
      } else if (e.code === 'KeyH') {
        setShowTelemetryHUD((prev) => !prev);
      } else if (e.code === 'Escape') {
        if (isFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTime, volume, isFullscreen]);

  // Telemetry fluctuation simulator
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!isPlaying) return;
      setTelemetry((prev) => {
        const isDirect = currentProfile.isDirectPlay;
        return {
          ...prev,
          fps: isDirect ? 0 : Math.round(135 + Math.random() * 20),
          speedMultiplier: isDirect ? 1.0 : parseFloat((3.6 + Math.random() * 0.4).toFixed(2)),
          gpuUtilization: isDirect ? 3 : Math.round(28 + Math.random() * 12),
          vramUsedMB: isDirect ? 640 : Math.round(1800 + Math.random() * 150),
          bufferAheadSec: parseFloat((40 + Math.random() * 15).toFixed(1)),
          cpuUtilization: isDirect ? 1.2 : parseFloat((4.5 + Math.random() * 2).toFixed(1)),
          tempCelsius: isDirect ? 42 : Math.round(48 + Math.random() * 3),
        };
      });
    }, 1200);

    return () => window.clearInterval(interval);
  }, [isPlaying, currentProfile]);

  // Video element events
  const onTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (videoRef.current) {
      if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
        setDuration(videoRef.current.duration);
      }
      if (item.watchProgressSec > 0) {
        videoRef.current.currentTime = item.watchProgressSec;
      }
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        if (onSyncPlay) onSyncPlay(videoRef.current?.currentTime || 0);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      if (onSyncPause) onSyncPause(videoRef.current.currentTime);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
      if (onSyncPlay) onSyncPlay(videoRef.current.currentTime);
    }
  };

  const skip = (seconds: number) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    if (onSyncSeek) onSyncSeek(newTime);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
    if (onSyncSeek) onSyncSeek(newTime);
  };

  const adjustVolume = (delta: number) => {
    setVolume((prev) => {
      const v = Math.max(0, Math.min(1, prev + delta));
      if (videoRef.current) videoRef.current.volume = v;
      return v;
    });
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleUserActivity}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden"
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={item.videoUrl}
        className="w-full h-full object-contain cursor-none"
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
        playsInline
      />

      {/* Hidden local subtitle file input */}
      <input
        ref={playerSubFileRef}
        type="file"
        accept=".srt,.ass,.ssa,.vtt,.sub"
        onChange={handlePlayerLocalSubUpload}
        className="hidden"
      />

      {/* Simulated Live Subtitle Track Rendering - Stays visible even when paused for reading */}
      {currentSubtitle && (
        <div
          className={`absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/80 backdrop-blur-xs rounded-md text-center text-white font-medium tracking-wide pointer-events-none transition-all shadow-xl max-w-[85vw] ${
            subFontSize === 'sm'
              ? 'text-xs sm:text-sm'
              : subFontSize === 'lg'
              ? 'text-lg sm:text-xl'
              : subFontSize === 'xl'
              ? 'text-xl sm:text-2xl font-semibold'
              : 'text-sm sm:text-base'
          }`}
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.95)' }}
        >
          {getSubtitleTextAtTime(currentTime, currentSubtitle)}
        </div>
      )}

      {/* Top Header Bar (Auto-hiding) */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between transition-opacity duration-300 z-30 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
            title={t.backToLibrary}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">{item.title}</h2>
            <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
              <span>{item.year}</span>
              <span>·</span>
              <span className="text-amber-300">{currentProfile.name}</span>
              <span>·</span>
              <span>{item.resolution}</span>
            </div>
          </div>
        </div>

        {/* Sync Room Status Badge & HUD Toggle */}
        <div className="flex items-center gap-2">
          {syncRoom && (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded text-xs text-amber-300">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>影厅: {syncRoom.roomName}</span>
              <span className="font-mono">({syncRoom.members.length} 台设备同播)</span>
            </div>
          )}

          <button
            onClick={() => setShowTelemetryHUD((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors border ${
              showTelemetryHUD
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-neutral-900/80 border-neutral-700/80 text-neutral-300 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>硬件遥测 (HUD)</span>
          </button>
        </div>
      </div>

      {/* Floating Hardware Telemetry HUD (toggleable with 'H') */}
      {showTelemetryHUD && (
        <div className="absolute top-16 right-4 w-80 bg-neutral-950/90 border border-neutral-800 rounded-lg p-3 text-xs font-mono text-neutral-300 backdrop-blur-md shadow-2xl z-40 space-y-2 pointer-events-none">
          <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800 text-[11px] font-semibold text-neutral-200">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Zap className="w-3.5 h-3.5" />
              转码硬件管线遥测
            </span>
            <span className="text-emerald-400">{telemetry.hwEngine}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-neutral-500 block">实时转码速度</span>
              <span className="text-emerald-400 font-bold text-sm">
                {currentProfile.isDirectPlay ? '直通输出' : `${telemetry.fps} FPS (${telemetry.speedMultiplier}x)`}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block">GPU 解码负载</span>
              <span className="text-neutral-200 font-bold text-sm">{telemetry.gpuUtilization}%</span>
            </div>
            <div>
              <span className="text-neutral-500 block">显存占用 (VRAM)</span>
              <span className="text-neutral-200">{telemetry.vramUsedMB} / {telemetry.vramTotalMB} MB</span>
            </div>
            <div>
              <span className="text-neutral-500 block">核心温度</span>
              <span className="text-amber-400">{telemetry.tempCelsius} °C</span>
            </div>
          </div>

          <div className="pt-1 border-t border-neutral-800 text-[10px] text-neutral-400 flex items-center justify-between">
            <span>缓冲深度: {telemetry.bufferAheadSec}s</span>
            <span>色调映射: {telemetry.hdrToneMappingActive ? 'BT.2020 激活' : '直通'}</span>
          </div>
        </div>
      )}

      {/* Bottom Controls HUD */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent transition-opacity duration-300 z-30 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress scrub bar */}
        <div className="relative mb-3 group/timeline">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-neutral-800 hover:h-2 rounded-lg appearance-none cursor-pointer accent-amber-400 transition-all"
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between text-neutral-200">
          {/* Left: Playback controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-2 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-950 transition-colors shadow-md"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => skip(-10)}
              className="p-1.5 text-neutral-400 hover:text-white transition-colors"
              title="快退 10 秒"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => skip(10)}
              className="p-1.5 text-neutral-400 hover:text-white transition-colors"
              title="快进 10 秒"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2 group/vol ml-2">
              <button
                onClick={() => setIsMuted((prev) => !prev)}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  setIsMuted(false);
                  if (videoRef.current) videoRef.current.volume = val;
                }}
                className="w-16 h-1 bg-neutral-700 appearance-none cursor-pointer accent-amber-400 rounded"
              />
            </div>

            {/* Time display */}
            <div className="text-xs font-mono text-neutral-400 ml-2">
              <span>{formatTime(currentTime)}</span>
              <span className="text-neutral-600"> / </span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Quality, Audio, Subtitle & Fullscreen */}
          <div className="flex items-center gap-3 text-xs relative">
            {/* Quality & Transcoder selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowQualityMenu(!showQualityMenu);
                  setShowAudioMenu(false);
                  setShowSubMenu(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors border border-neutral-700/60 font-mono"
              >
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentProfile.resolution}</span>
              </button>

              {showQualityMenu && (
                <div className="absolute bottom-10 right-0 w-72 bg-neutral-900 border border-neutral-800 rounded-lg p-2 shadow-2xl z-50 text-xs">
                  <div className="px-2 py-1.5 font-semibold text-neutral-300 border-b border-neutral-800 flex items-center justify-between">
                    <span>画质与硬件转码</span>
                    <span className="text-[10px] text-amber-400 font-mono">NVENC / QSV</span>
                  </div>
                  <div className="space-y-1 mt-1.5">
                    {TRANSCODE_PROFILES.map((prof) => (
                      <button
                        key={prof.id}
                        onClick={() => {
                          setCurrentProfile(prof);
                          setShowQualityMenu(false);
                        }}
                        className={`w-full text-left p-2 rounded flex items-center justify-between transition-colors ${
                          currentProfile.id === prof.id
                            ? 'bg-amber-500/20 text-amber-300 font-medium'
                            : 'hover:bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-xs">{prof.name}</div>
                          <div className="text-[10px] text-neutral-500">{prof.label}</div>
                        </div>
                        {currentProfile.id === prof.id && <Check className="w-4 h-4 text-amber-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Audio selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowAudioMenu(!showAudioMenu);
                  setShowQualityMenu(false);
                  setShowSubMenu(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors border border-neutral-700/60 font-mono"
              >
                <Volume1 className="w-3.5 h-3.5 text-neutral-400" />
                <span>音轨</span>
              </button>

              {showAudioMenu && (
                <div className="absolute bottom-10 right-0 w-64 bg-neutral-900 border border-neutral-800 rounded-lg p-2 shadow-2xl z-50 text-xs">
                  <div className="px-2 py-1 font-semibold text-neutral-300 border-b border-neutral-800">
                    多音轨切换
                  </div>
                  <div className="space-y-1 mt-1">
                    {item.audioTracks.map((trk) => (
                      <button
                        key={trk.id}
                        onClick={() => {
                          setCurrentAudio(trk);
                          setShowAudioMenu(false);
                        }}
                        className={`w-full text-left p-2 rounded flex items-center justify-between ${
                          currentAudio.id === trk.id
                            ? 'bg-amber-500/20 text-amber-300 font-medium'
                            : 'hover:bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        <span className="truncate">{trk.label}</span>
                        {currentAudio.id === trk.id && <Check className="w-4 h-4 text-amber-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Subtitle selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSubMenu(!showSubMenu);
                  setShowQualityMenu(false);
                  setShowAudioMenu(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors border border-neutral-700/60 font-mono"
              >
                <Subtitles className="w-3.5 h-3.5 text-neutral-400" />
                <span>{currentSubtitle ? '字幕开' : '字幕关'}</span>
              </button>

              {showSubMenu && (
                <div className="absolute bottom-10 right-0 w-64 bg-neutral-900 border border-neutral-800 rounded-lg p-2 shadow-2xl z-50 text-xs">
                  <div className="px-2 py-1 font-semibold text-neutral-300 border-b border-neutral-800 flex items-center justify-between">
                    <span>字幕与同步</span>
                    <span className="text-[10px] text-neutral-500">ASS/SRT</span>
                  </div>
                  <div className="space-y-1 mt-1">
                    <button
                      onClick={() => {
                        setCurrentSubtitle(null);
                        setShowSubMenu(false);
                      }}
                      className={`w-full text-left p-2 rounded flex items-center justify-between ${
                        currentSubtitle === null ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      <span>关闭字幕</span>
                      {currentSubtitle === null && <Check className="w-4 h-4 text-amber-400" />}
                    </button>
                    {playerSubtitles.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setCurrentSubtitle(sub);
                          setShowSubMenu(false);
                        }}
                        className={`w-full text-left p-2 rounded flex items-center justify-between ${
                          currentSubtitle?.id === sub.id
                            ? 'bg-amber-500/20 text-amber-300 font-medium'
                            : 'hover:bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        <span className="truncate">{sub.label}</span>
                        {currentSubtitle?.id === sub.id && <Check className="w-4 h-4 text-amber-400" />}
                      </button>
                    ))}
                  </div>

                  {/* Load Local Subtitle Button */}
                  <div className="mt-2 pt-2 border-t border-neutral-800 px-1">
                    <button
                      onClick={() => playerSubFileRef.current?.click()}
                      className="w-full py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3 h-3 text-amber-400" />
                      <span>载入本地外挂字幕 (.srt/.ass)</span>
                    </button>
                  </div>

                  {/* Subtitle font size options */}
                  <div className="mt-2 pt-2 border-t border-neutral-800 px-2 flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400">字幕字号:</span>
                    <div className="flex items-center gap-1 font-mono">
                      {(['sm', 'base', 'lg', 'xl'] as const).map((sz) => (
                        <button
                          key={sz}
                          onClick={() => setSubFontSize(sz)}
                          className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${
                            subFontSize === sz
                              ? 'bg-amber-400 text-neutral-950 font-bold'
                              : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                          }`}
                        >
                          {sz === 'sm' ? '小' : sz === 'base' ? '中' : sz === 'lg' ? '大' : '特大'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subtitle delay fine-tuning */}
                  {currentSubtitle && (
                    <div className="mt-2 pt-2 border-t border-neutral-800 px-2 flex items-center justify-between text-[11px]">
                      <span className="text-neutral-400">时间轴微调:</span>
                      <div className="flex items-center gap-1 font-mono">
                        <button
                          onClick={() => setSubDelayMs((p) => p - 200)}
                          className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300 cursor-pointer"
                        >
                          -200ms
                        </button>
                        <span className="text-amber-300 w-12 text-center">{subDelayMs}ms</span>
                        <button
                          onClick={() => setSubDelayMs((p) => p + 200)}
                          className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300 cursor-pointer"
                        >
                          +200ms
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Fullscreen button */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 text-neutral-300 hover:text-white transition-colors"
              title="全屏切换 (F)"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
