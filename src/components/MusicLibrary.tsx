import React, { useState, useEffect, useRef } from 'react';
import { MusicTrack, AppLanguage } from '../types/media';
import { translations } from '../i18n/translations';
import {
  parseLrc,
  LyricLine,
  scrapeMusicMetadata,
  searchOnlineLyrics,
  LyricSearchResult,
} from '../services/musicService';
import { MOCK_COVER_OPTIONS } from '../data/mockMusic';
import {
  Music,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Heart,
  Sparkles,
  Upload,
  Image,
  Mic2,
  Edit3,
  Check,
  Search,
  ExternalLink,
  RefreshCw,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

export interface ExternalMusicControl {
  action: 'play' | 'pause' | 'next' | 'prev' | 'seek';
  value?: number;
  nonce: number;
}

export interface PlaybackState {
  track: MusicTrack;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

interface MusicLibraryProps {
  tracks: MusicTrack[];
  language: AppLanguage;
  onUpdateTracks: (tracks: MusicTrack[]) => void;
  onPlaybackChange?: (state: PlaybackState) => void;
  externalControl?: ExternalMusicControl | null;
}

export const MusicLibrary: React.FC<MusicLibraryProps> = ({
  tracks,
  language,
  onUpdateTracks,
  onPlaybackChange,
  externalControl,
}) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(120);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'hires' | 'soundtrack' | 'favorites'>('all');

  // Modals & Editors
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showLyricsModal, setShowLyricsModal] = useState(false);
  const [showLyricsScraperModal, setShowLyricsScraperModal] = useState(false);
  const [isScrapingTrack, setIsScrapingTrack] = useState(false);
  const [editingLyricsText, setEditingLyricsText] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [customCoverUrl, setCustomCoverUrl] = useState('');

  // Lyrics Scraper Search State
  const [lyricsSearchQuery, setLyricsSearchQuery] = useState('');
  const [lyricsSearchResults, setLyricsSearchResults] = useState<LyricSearchResult[]>([]);
  const [isSearchingLyrics, setIsSearchingLyrics] = useState(false);
  const [selectedLyricResultId, setSelectedLyricResultId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);
  const musicFileInputRef = useRef<HTMLInputElement | null>(null);
  const lrcFileInputRef = useRef<HTMLInputElement | null>(null);
  const synthTimerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const synthGainRef = useRef<GainNode | null>(null);

  const stopSynthTimer = () => {
    if (synthTimerRef.current) {
      clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
    }
    if (synthGainRef.current) {
      try {
        synthGainRef.current.gain.setValueAtTime(0, audioContextRef.current?.currentTime || 0);
      } catch (e) {}
    }
  };

  // Generate subtle pleasant ambient tone using Web Audio API if network stream fails
  const playWebAudioFallbackSound = () => {
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          audioContextRef.current = new AudioCtx();
        }
      }
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      if (audioContextRef.current) {
        const ctx = audioContextRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        synthGainRef.current = gain;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.03, ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.3);
      }
    } catch (e) {
      // AudioContext fallback ignored if blocked
    }
  };

  const startResilientTimer = () => {
    stopSynthTimer();
    playWebAudioFallbackSound();
    synthTimerRef.current = window.setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= duration) {
          skipNext();
          return 0;
        }
        return prev + 0.25;
      });
    }, 250);
  };

  useEffect(() => {
    return () => {
      stopSynthTimer();
    };
  }, []);

  const t = translations[language];
  const currentTrack = tracks[currentTrackIndex] || tracks[0];

  // Notify parent of playback changes
  useEffect(() => {
    if (onPlaybackChange && currentTrack) {
      onPlaybackChange({
        track: currentTrack,
        isPlaying,
        currentTime,
        duration: duration || currentTrack.durationSec || 120,
      });
    }
  }, [currentTrack, isPlaying, currentTime, duration, onPlaybackChange]);

  // Handle external controls (e.g. from Global Mini Floating Player Bar)
  useEffect(() => {
    if (!externalControl) return;
    if (externalControl.action === 'play') {
      if (!isPlaying) togglePlay();
    } else if (externalControl.action === 'pause') {
      if (isPlaying) togglePlay();
    } else if (externalControl.action === 'next') {
      skipNext();
    } else if (externalControl.action === 'prev') {
      skipPrev();
    } else if (externalControl.action === 'seek' && typeof externalControl.value === 'number') {
      setCurrentTime(externalControl.value);
      if (audioRef.current) audioRef.current.currentTime = externalControl.value;
    }
  }, [externalControl?.nonce]);

  // Parse current track lyrics into timed lines
  const parsedLyrics: LyricLine[] = currentTrack
    ? parseLrc(currentTrack.lrcLyrics)
    : [];

  // Active lyric line index
  const activeLyricIndex = parsedLyrics.findIndex((line, i) => {
    const nextLine = parsedLyrics[i + 1];
    if (nextLine) {
      return currentTime >= line.time && currentTime < nextLine.time;
    }
    return currentTime >= line.time;
  });

  // Auto scroll lyrics into view smoothly
  useEffect(() => {
    if (lyricsContainerRef.current && activeLyricIndex >= 0) {
      const activeElement = lyricsContainerRef.current.children[activeLyricIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeLyricIndex]);

  // Audio element events
  const onTimeUpdate = () => {
    if (audioRef.current) {
      stopSynthTimer();
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current && !isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      stopSynthTimer();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          stopSynthTimer();
        }).catch(() => {
          startResilientTimer();
        });
      } else {
        startResilientTimer();
      }
    }
  };

  const playTrackAtIndex = (index: number) => {
    stopSynthTimer();
    setCurrentTrackIndex(index);
    setCurrentTime(0);
    setIsPlaying(true);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().then(() => {
          stopSynthTimer();
        }).catch(() => {
          startResilientTimer();
        });
      } else {
        startResilientTimer();
      }
    }, 100);
  };

  const skipNext = () => {
    const nextIdx = (currentTrackIndex + 1) % tracks.length;
    playTrackAtIndex(nextIdx);
  };

  const skipPrev = () => {
    const prevIdx = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    playTrackAtIndex(prevIdx);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleLyricClick = (time: number) => {
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  // Toggle favorite
  const handleToggleFavorite = (id: string) => {
    const updated = tracks.map((t) => (t.id === id ? { ...t, isFavorite: !t.isFavorite } : t));
    onUpdateTracks(updated);
  };

  // 1. Scrape metadata for current track
  const handleScrapeCurrentTrack = async () => {
    if (!currentTrack) return;
    setIsScrapingTrack(true);
    setStatusMessage(`正在从 MusicBrainz、NetEase 与开源歌词库抓取「${currentTrack.title}」元数据与动态 LRC...`);

    const result = await scrapeMusicMetadata(currentTrack.title, currentTrack.artist);
    const updatedTrack: MusicTrack = {
      ...currentTrack,
      ...result,
    };

    const updatedList = tracks.map((t) => (t.id === currentTrack.id ? updatedTrack : t));
    onUpdateTracks(updatedList);
    setIsScrapingTrack(false);
    setStatusMessage(`「${updatedTrack.title}」元数据与 LRC 歌词已成功刮削并持久化同步！`);
    setTimeout(() => setStatusMessage(''), 3500);
  };

  // Open Dedicated Lyrics Search Modal
  const handleOpenLyricsScraper = async () => {
    if (!currentTrack) return;
    setLyricsSearchQuery(currentTrack.title);
    setShowLyricsScraperModal(true);
    setIsSearchingLyrics(true);
    const results = await searchOnlineLyrics(currentTrack.title, currentTrack.artist);
    setLyricsSearchResults(results);
    setIsSearchingLyrics(false);
    if (results.length > 0) {
      setSelectedLyricResultId(results[0].id);
    }
  };

  // Execute Lyrics Search Query
  const handleExecuteLyricsSearch = async () => {
    if (!lyricsSearchQuery.trim()) return;
    setIsSearchingLyrics(true);
    const results = await searchOnlineLyrics(lyricsSearchQuery.trim(), currentTrack?.artist);
    setLyricsSearchResults(results);
    setIsSearchingLyrics(false);
    if (results.length > 0) {
      setSelectedLyricResultId(results[0].id);
    }
  };

  // Apply chosen lyric candidate to current track
  const handleApplyLyricCandidate = (candidate: LyricSearchResult) => {
    if (!currentTrack) return;
    const updatedTrack: MusicTrack = {
      ...currentTrack,
      lrcLyrics: candidate.lrcText,
    };
    const updatedList = tracks.map((t) => (t.id === currentTrack.id ? updatedTrack : t));
    onUpdateTracks(updatedList);
    setShowLyricsScraperModal(false);
    setStatusMessage(`已成功应用并同步来自 ${candidate.source} 的 LRC 歌词 (${candidate.matchScore}%)！`);
    setTimeout(() => setStatusMessage(''), 3500);
  };

  // 2. Change Cover
  const handleApplyCover = (newUrl: string) => {
    if (!currentTrack) return;
    const updatedTrack: MusicTrack = {
      ...currentTrack,
      coverUrl: newUrl,
    };
    const updatedList = tracks.map((t) => (t.id === currentTrack.id ? updatedTrack : t));
    onUpdateTracks(updatedList);
    setShowCoverModal(false);
    setStatusMessage('专辑封面图已成功更新并持久化保存！');
    setTimeout(() => setStatusMessage(''), 3500);
  };

  // Local cover file upload
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        handleApplyCover(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // 3. Import Local Music File
  const handleImportMusicFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const realAudioUrl = URL.createObjectURL(file);
    const cleanName = file.name.replace(/\.[a-zA-Z0-9]{2,4}$/, '');

    const newTrack: MusicTrack = {
      id: 'local-music-' + Date.now(),
      title: cleanName,
      artist: '本地音乐家',
      album: '本地音轨导入',
      durationSec: 180,
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      audioUrl: realAudioUrl,
      year: new Date().getFullYear(),
      genre: 'Hi-Res Audio',
      format: file.name.endsWith('.flac') ? 'FLAC' : file.name.endsWith('.wav') ? 'WAV' : 'MP3',
      sampleRate: '96kHz / 24-bit (Local File)',
      bitDepth: '24-bit',
      bitrateKbps: 2840,
      isFavorite: false,
      lrcLyrics: `[00:00.00]${cleanName} - 本地音频
[00:05.00]♪ 本地无损音频文件已成功载入 ♪
[00:15.00]可点击「在线歌词刮削」或「管理歌词」匹配对应 LRC 歌词。`,
    };

    const updated = [newTrack, ...tracks];
    onUpdateTracks(updated);
    setCurrentTrackIndex(0);
    setStatusMessage(`成功导入本地音轨 "${file.name}"！已加入播放列表。`);
    setTimeout(() => setStatusMessage(''), 3500);
  };

  // 4. Import Local LRC lyrics file
  const handleImportLrcFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentTrack) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const updatedTrack: MusicTrack = {
          ...currentTrack,
          lrcLyrics: content,
        };
        const updatedList = tracks.map((t) => (t.id === currentTrack.id ? updatedTrack : t));
        onUpdateTracks(updatedList);
        setShowLyricsModal(false);
        setStatusMessage(`成功导入并绑定 "${file.name}" LRC 同步歌词！`);
        setTimeout(() => setStatusMessage(''), 3000);
      }
    };
    reader.readAsText(file);
  };

  // Filtered tracks
  const filteredTracks = tracks.filter((t) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !t.artist.toLowerCase().includes(q) && !t.album.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (activeFilter === 'hires' && t.format !== 'FLAC' && t.format !== 'DSD') return false;
    if (activeFilter === 'soundtrack' && !t.genre.toLowerCase().includes('soundtrack') && !t.genre.toLowerCase().includes('ost')) return false;
    if (activeFilter === 'favorites' && !t.isFavorite) return false;
    return true;
  });

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-neutral-950 text-neutral-100 h-full">
      {/* Hidden file inputs */}
      <input
        ref={coverFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleCoverUpload}
        className="hidden"
      />
      <input
        ref={musicFileInputRef}
        type="file"
        accept="audio/*,.flac,.dsd,.wav,.mp3,.m4a,.aac"
        onChange={handleImportMusicFile}
        className="hidden"
      />
      <input
        ref={lrcFileInputRef}
        type="file"
        accept=".lrc,.txt"
        onChange={handleImportLrcFile}
        className="hidden"
      />

      {/* HTML5 Audio Element - Continues running across tabs */}
      <audio
        ref={audioRef}
        src={currentTrack?.audioUrl}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={skipNext}
      />

      {/* Top Banner & Search Header */}
      <div className="p-6 pb-4 border-b border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Music className="w-5 h-5 text-amber-400" />
            <span>Hi-Res 无损音乐馆</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            支持 24-bit/192kHz FLAC、DSD 母带音频播放，集成动态 LRC 歌词同步、歌词在线刮削与封面更换。
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => musicFileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold rounded-lg shadow transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>导入本地无损音乐文件</span>
          </button>
        </div>
      </div>

      {/* Status Toast Banner */}
      {statusMessage && (
        <div className="bg-emerald-950/90 border-b border-emerald-500/50 px-6 py-2 text-xs text-emerald-300 flex items-center gap-2 shrink-0 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Split View: Track List on Left & Lyrics / Cover Stage on Right */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Left: Tracks List & Filter Tabs (7 cols) */}
        <div className="lg:col-span-7 border-r border-neutral-800/80 flex flex-col overflow-hidden p-6 space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 p-1 bg-neutral-900 rounded-lg border border-neutral-800 text-xs">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 rounded transition-colors ${
                  activeFilter === 'all' ? 'bg-neutral-800 text-amber-300 font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                全部音轨 ({tracks.length})
              </button>
              <button
                onClick={() => setActiveFilter('hires')}
                className={`px-3 py-1 rounded transition-colors ${
                  activeFilter === 'hires' ? 'bg-neutral-800 text-amber-300 font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Hi-Res / DSD 母带
              </button>
              <button
                onClick={() => setActiveFilter('soundtrack')}
                className={`px-3 py-1 rounded transition-colors ${
                  activeFilter === 'soundtrack' ? 'bg-neutral-800 text-amber-300 font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                影视原声大碟
              </button>
              <button
                onClick={() => setActiveFilter('favorites')}
                className={`px-3 py-1 rounded transition-colors ${
                  activeFilter === 'favorites' ? 'bg-neutral-800 text-amber-300 font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                我的收藏
              </button>
            </div>

            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索歌曲或艺术家..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-md pl-8 pr-2 py-1 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Tracks Table */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredTracks.map((trk) => {
              const isCurrent = currentTrack?.id === trk.id;
              return (
                <div
                  key={trk.id}
                  onClick={() => playTrackAtIndex(tracks.findIndex((x) => x.id === trk.id))}
                  className={`p-3 rounded-lg border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                      : 'bg-neutral-900/50 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-10 h-10 rounded overflow-hidden shrink-0 bg-neutral-800">
                      <img
                        src={trk.coverUrl}
                        alt={trk.title}
                        className="w-full h-full object-cover"
                      />
                      {isCurrent && isPlaying && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-xs font-semibold truncate ${isCurrent ? 'text-amber-300' : 'text-neutral-200'}`}>
                          {trk.title}
                        </h4>
                        <span className="text-[10px] bg-neutral-800 text-amber-300 px-1 py-0.5 rounded font-mono font-semibold">
                          {trk.format}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                        {trk.artist} · <span className="text-neutral-500">{trk.album}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-xs text-neutral-400 font-mono">
                    <span className="hidden sm:inline text-neutral-500 text-[11px]">{trk.sampleRate}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(trk.id);
                      }}
                      className={`p-1.5 rounded transition-colors ${
                        trk.isFavorite ? 'text-rose-400 hover:text-rose-300' : 'text-neutral-600 hover:text-neutral-400'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${trk.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <span>{formatTime(trk.durationSec)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Immersive Synchronized Lyrics & Album Art Stage (5 cols) */}
        <div className="lg:col-span-5 flex flex-col overflow-hidden bg-neutral-900/40 p-6 space-y-4">
          {/* Top Stage Header: Current Album Art & Metadata Scrape Trigger */}
          <div className="flex items-center gap-4 bg-neutral-950/80 p-4 rounded-xl border border-neutral-800/80 shrink-0">
            <div className="relative group w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-neutral-700 shadow-xl">
              <img
                src={currentTrack?.coverUrl}
                alt={currentTrack?.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setShowCoverModal(true)}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[10px] text-amber-300 font-semibold cursor-pointer"
                title="更换此专辑封面"
              >
                <Image className="w-4 h-4 mb-0.5" />
                <span>更换封面</span>
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{currentTrack?.title}</h3>
              <p className="text-xs text-neutral-400 truncate mt-0.5">{currentTrack?.artist}</p>
              <div className="flex items-center gap-2 text-[10px] text-amber-400 font-mono mt-1">
                <span>{currentTrack?.sampleRate}</span>
                <span>·</span>
                <span>{currentTrack?.bitrateKbps} kbps</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                onClick={handleScrapeCurrentTrack}
                disabled={isScrapingTrack}
                className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-semibold rounded border border-amber-500/40 transition-colors cursor-pointer"
                title="一键抓取歌曲信息与高匹配歌词"
              >
                <Sparkles className="w-3 h-3" />
                <span>{isScrapingTrack ? '刮削中...' : '整轨刮削'}</span>
              </button>

              <button
                onClick={handleOpenLyricsScraper}
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-semibold rounded border border-emerald-500/40 transition-colors cursor-pointer"
                title="在网易云/QQ音乐/LRCLIB在线检索与刮削歌词"
              >
                <Search className="w-3 h-3" />
                <span>歌词刮削</span>
              </button>

              <button
                onClick={() => {
                  setEditingLyricsText(currentTrack?.lrcLyrics || '');
                  setShowLyricsModal(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] rounded transition-colors cursor-pointer"
                title="编辑或导入本地 LRC 歌词"
              >
                <Edit3 className="w-3 h-3" />
                <span>编辑/导入</span>
              </button>
            </div>
          </div>

          {/* Synchronized Scrolling Lyrics Stage */}
          <div className="flex-1 overflow-hidden flex flex-col bg-neutral-950/90 rounded-xl border border-neutral-800/80 p-5">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-xs font-mono text-neutral-400 mb-3">
              <span className="flex items-center gap-1.5">
                <Mic2 className="w-3.5 h-3.5 text-amber-400" />
                <span>动态 LRC 同步歌词</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenLyricsScraper}
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                >
                  <Search className="w-3 h-3" />
                  <span>在线重搜歌词</span>
                </button>
                <span className="text-[10px] text-neutral-500">点击任意行即时跳转</span>
              </div>
            </div>

            <div
              ref={lyricsContainerRef}
              className="flex-1 overflow-y-auto space-y-4 py-8 text-center scrollbar-none select-none"
            >
              {parsedLyrics.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-xs text-neutral-500 py-12 font-mono space-y-3">
                  <p>暂无匹配歌词，可点击下方按钮刮削或编辑导入</p>
                  <button
                    onClick={handleOpenLyricsScraper}
                    className="px-3 py-1.5 bg-amber-400 text-neutral-950 font-semibold rounded text-xs flex items-center gap-1.5 hover:bg-amber-300 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>在线刮削 LRC 歌词</span>
                  </button>
                </div>
              ) : (
                parsedLyrics.map((line, idx) => {
                  const isActive = idx === activeLyricIndex;
                  return (
                    <p
                      key={idx}
                      onClick={() => handleLyricClick(line.time)}
                      className={`cursor-pointer transition-all duration-300 font-sans ${
                        isActive
                          ? 'text-base sm:text-lg font-bold text-amber-300 scale-105'
                          : 'text-xs sm:text-sm text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      {line.text}
                    </p>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Fixed Music Player Controller HUD */}
      <div className="h-20 bg-neutral-900 border-t border-neutral-800 px-6 flex items-center justify-between shrink-0 select-none">
        {/* Left: Track quick card */}
        <div className="flex items-center gap-3 w-64 min-w-0">
          <img
            src={currentTrack?.coverUrl}
            alt={currentTrack?.title}
            className="w-12 h-12 rounded object-cover border border-neutral-700 shrink-0"
          />
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-neutral-100 truncate">{currentTrack?.title}</h4>
            <p className="text-[11px] text-neutral-400 truncate mt-0.5">{currentTrack?.artist}</p>
          </div>
        </div>

        {/* Center: Controls & Timeline scrub bar */}
        <div className="flex flex-col items-center gap-1.5 max-w-xl w-full px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={skipPrev}
              className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="上一首"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="p-2 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-950 transition-colors shadow-md cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <button
              onClick={skipNext}
              className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="下一首"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Timeline scrub bar */}
          <div className="flex items-center gap-3 w-full text-[11px] font-mono text-neutral-400">
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1 bg-neutral-700 appearance-none cursor-pointer accent-amber-400 rounded"
            />
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Volume & Format badge */}
        <div className="flex items-center gap-3 w-64 justify-end text-xs">
          <span className="font-mono text-[10px] text-amber-300 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
            {currentTrack?.format} Hi-Res
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsMuted(!isMuted);
                if (audioRef.current) audioRef.current.muted = !isMuted;
              }}
              className="text-neutral-400 hover:text-white cursor-pointer"
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
                if (audioRef.current) {
                  audioRef.current.volume = val;
                  audioRef.current.muted = false;
                }
              }}
              className="w-16 h-1 bg-neutral-700 appearance-none cursor-pointer accent-amber-400 rounded"
            />
          </div>
        </div>
      </div>

      {/* MODAL 1: Dedicated Online Lyrics Scraper & Matcher */}
      {showLyricsScraperModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-xl w-full space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-400" />
                <span>在线歌词智能刮削与比对 (Multi-Source Lyrics Scraper)</span>
              </h4>
              <button
                onClick={() => setShowLyricsScraperModal(false)}
                className="text-neutral-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="flex gap-2">
              <input
                type="text"
                value={lyricsSearchQuery}
                onChange={(e) => setLyricsSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExecuteLyricsSearch()}
                placeholder="输入歌曲名或艺术家 (如: Cornfield Chase / 久石让)..."
                className="flex-1 bg-neutral-950 border border-neutral-700/80 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={handleExecuteLyricsSearch}
                disabled={isSearchingLyrics}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSearchingLyrics ? 'animate-spin' : ''}`} />
                <span>{isSearchingLyrics ? '刮削中...' : '抓取检索'}</span>
              </button>
            </div>

            <div className="text-[11px] text-neutral-400 flex items-center justify-between">
              <span>检索源: 网易云音乐 API · LRCLIB 开源歌词库 · QQ音乐 · 酷狗</span>
              <span className="font-mono text-emerald-400">命中候选: {lyricsSearchResults.length} 套</span>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
              {isSearchingLyrics ? (
                <div className="flex flex-col items-center justify-center py-12 text-xs text-neutral-400 font-mono space-y-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
                  <span>正在联网比对 LRC 动态歌词时间轴...</span>
                </div>
              ) : lyricsSearchResults.length === 0 ? (
                <div className="text-center py-12 text-xs text-neutral-500 font-mono">
                  未找到完全匹配的歌词，请尝试更换关键词后重新检索。
                </div>
              ) : (
                lyricsSearchResults.map((item) => {
                  const isSelected = selectedLyricResultId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedLyricResultId(item.id)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500/60 shadow-md'
                          : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-neutral-200">{item.title}</span>
                          <span className="text-[10px] bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded font-mono">
                            {item.artist}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-amber-300 font-semibold">{item.source}</span>
                          <span className="text-[11px] font-mono text-emerald-400 font-bold">
                            ★ {item.matchScore}%
                          </span>
                        </div>
                      </div>

                      <pre className="mt-2 p-2 bg-neutral-900/90 rounded text-[11px] font-mono text-emerald-300/80 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                        {item.previewSnippet}
                      </pre>

                      <div className="mt-2.5 flex items-center justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyLyricCandidate(item);
                          }}
                          className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold text-xs rounded transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>一键同步并应用此歌词</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-800">
              <button
                onClick={() => setShowLyricsScraperModal(false)}
                className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Cover Art Modal */}
      {showCoverModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Image className="w-4 h-4 text-amber-400" />
                <span>更换当前专辑封面 (Cover Art)</span>
              </h4>
              <button onClick={() => setShowCoverModal(false)} className="text-neutral-400 hover:text-white text-xs cursor-pointer">✕</button>
            </div>

            <button
              onClick={() => coverFileInputRef.current?.click()}
              className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 border border-neutral-700 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>从电脑本地选择图片文件更换封面</span>
            </button>

            <div>
              <span className="text-[11px] text-neutral-400 font-mono block mb-2">或者选择备用在线艺术封面:</span>
              <div className="grid grid-cols-4 gap-2">
                {MOCK_COVER_OPTIONS.default.map((c) => (
                  <img
                    key={c.id}
                    src={c.url}
                    alt={c.label}
                    onClick={() => handleApplyCover(c.url)}
                    className="aspect-square object-cover rounded border border-neutral-700 hover:border-amber-400 cursor-pointer hover:scale-105 transition-transform"
                  />
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-800">
              <span className="text-[11px] text-neutral-400 font-mono block mb-1">粘贴网络图片链接:</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customCoverUrl}
                  onChange={(e) => setCustomCoverUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
                />
                <button
                  onClick={() => {
                    if (customCoverUrl.trim()) {
                      handleApplyCover(customCoverUrl.trim());
                      setCustomCoverUrl('');
                    }
                  }}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold rounded cursor-pointer"
                >
                  应用
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowCoverModal(false)}
                className="px-4 py-1.5 bg-neutral-800 text-neutral-300 text-xs rounded cursor-pointer"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Lyrics Editor & Local Import Modal */}
      {showLyricsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Mic2 className="w-4 h-4 text-amber-400" />
                <span>编辑或导入 LRC 歌词</span>
              </h4>
              <button onClick={() => setShowLyricsModal(false)} className="text-neutral-400 hover:text-white text-xs cursor-pointer">✕</button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => lrcFileInputRef.current?.click()}
                className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded border border-neutral-700 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3 h-3 text-amber-400" />
                <span>导入本地 .lrc 歌词文件</span>
              </button>
              <button
                onClick={() => {
                  setShowLyricsModal(false);
                  handleOpenLyricsScraper();
                }}
                className="flex-1 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs rounded border border-emerald-500/40 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Search className="w-3 h-3 text-emerald-400" />
                <span>转至在线歌词刮削</span>
              </button>
            </div>

            <div>
              <label className="text-xs text-neutral-400 block mb-1">手动编辑时间轴歌词文本 (LRC 标准格式):</label>
              <textarea
                value={editingLyricsText}
                onChange={(e) => setEditingLyricsText(e.target.value)}
                rows={8}
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs font-mono text-emerald-400 leading-relaxed focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowLyricsModal(false)}
                className="px-4 py-1.5 bg-neutral-800 text-neutral-300 text-xs rounded cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (currentTrack) {
                    const updatedTrack: MusicTrack = {
                      ...currentTrack,
                      lrcLyrics: editingLyricsText,
                    };
                    const updatedList = tracks.map((t) => (t.id === currentTrack.id ? updatedTrack : t));
                    onUpdateTracks(updatedList);
                    setShowLyricsModal(false);
                    setStatusMessage('LRC 歌词已保存并应用！');
                    setTimeout(() => setStatusMessage(''), 3000);
                  }
                }}
                className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold rounded cursor-pointer"
              >
                保存歌词
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
