import React, { useState } from 'react';
import { MediaItem, AppLanguage } from '../types/media';
import { translations } from '../i18n/translations';
import {
  X,
  Play,
  Sparkles,
  FileCode,
  HardDrive,
  Film,
  Volume2,
  Subtitles,
  Calendar,
  Clock,
  Layers,
  Heart,
  Copy,
  Check,
  Radio
} from 'lucide-react';

interface MediaDetailModalProps {
  item: MediaItem;
  language: AppLanguage;
  onClose: () => void;
  onPlay: (item: MediaItem) => void;
  onRescrape: (item: MediaItem) => void;
  onToggleFavorite: (id: string) => void;
}

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  item,
  language,
  onClose,
  onPlay,
  onRescrape,
  onToggleFavorite,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'nfo' | 'mediainfo'>('overview');
  const [copiedPath, setCopiedPath] = useState(false);
  const t = translations[language];

  const handleCopyPath = () => {
    navigator.clipboard.writeText(item.filePath);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl my-8">
        {/* Backdrop Banner */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-neutral-950">
          <img
            src={item.backdropUrl}
            alt={item.title}
            className="w-full h-full object-cover object-center opacity-40 filter brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/60 to-transparent" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-neutral-950/70 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Floating Actions on Banner */}
          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {item.title}
              </h1>
              <p className="text-sm text-neutral-400 font-mono">
                {item.originalTitle} ({item.year})
              </p>

              {/* Clean Metadata Line (NO PILLS) */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-300">
                <span className="font-semibold text-amber-400">★ {item.ratingImdb.toFixed(1)} IMDb</span>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span className="text-amber-300">★ {item.ratingDouban.toFixed(1)} 豆瓣</span>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span>{item.releaseDate}</span>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span>{item.runtimeMinutes} 分钟</span>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span className="text-neutral-200 font-mono font-medium">{item.resolution}</span>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span className="text-amber-300 font-mono">{item.hdr}</span>
              </div>
            </div>

            {/* Play Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => onPlay(item)}
                className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold px-5 py-2.5 rounded-lg shadow-lg shadow-amber-500/20 transition-all hover:scale-102"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{t.playNow}</span>
              </button>

              <button
                onClick={() => onToggleFavorite(item.id)}
                className={`p-2.5 rounded-lg border transition-colors ${
                  item.isFavorite
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                    : 'bg-neutral-800/80 border-neutral-700/80 text-neutral-300 hover:text-white'
                }`}
                title="收藏"
              >
                <Heart className={`w-4 h-4 ${item.isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs for Modal */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-neutral-800 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 font-medium transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            简介与演职员
          </button>
          <button
            onClick={() => setActiveTab('mediainfo')}
            className={`pb-3 font-medium transition-colors border-b-2 ${
              activeTab === 'mediainfo'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            MediaInfo 硬件流参数
          </button>
          <button
            onClick={() => setActiveTab('nfo')}
            className={`pb-3 font-medium transition-colors border-b-2 ${
              activeTab === 'nfo'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Kodi / Emby NFO 元数据
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Overview Synopsis */}
              <div>
                <h4 className="text-xs uppercase tracking-wider text-neutral-400 mb-2 font-mono">剧情简介</h4>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  {item.overview}
                </p>
              </div>

              {/* Director & Genres */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-neutral-400 block mb-1 font-mono">导演</span>
                  <span className="text-neutral-100 font-medium">{item.director}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block mb-1 font-mono">类型标签</span>
                  <div className="flex items-center gap-2 text-neutral-200">
                    {item.genres.join(' / ')}
                  </div>
                </div>
              </div>

              {/* Cast & Crew */}
              <div>
                <h4 className="text-xs uppercase tracking-wider text-neutral-400 mb-3 font-mono">主要演职人员</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {item.cast.map((actor, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 p-2 rounded-lg bg-neutral-950/50 border border-neutral-800/60">
                      <img
                        src={actor.avatar}
                        alt={actor.name}
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-neutral-200 truncate">{actor.name}</p>
                        <p className="text-[11px] text-neutral-400 truncate">{actor.character}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TV Episodes list if present */}
              {item.episodes && item.episodes.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-neutral-400 mb-3 font-mono">选集播放列表</h4>
                  <div className="space-y-2">
                    {item.episodes.map((ep) => (
                      <div
                        key={ep.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-neutral-950/60 border border-neutral-800 hover:border-neutral-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={ep.thumbnailUrl}
                            alt={ep.title}
                            className="w-16 h-10 object-cover rounded"
                          />
                          <div>
                            <p className="text-xs font-medium text-neutral-200">{ep.title}</p>
                            <p className="text-[11px] text-neutral-400 line-clamp-1">{ep.overview}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => onPlay(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-amber-400 hover:text-neutral-950 text-neutral-200 rounded text-xs transition-colors"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>播放</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'mediainfo' && (
            <div className="space-y-4">
              <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 text-xs font-mono space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <span className="text-neutral-400 flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-amber-400" />
                    本地文件存储路径:
                  </span>
                  <button
                    onClick={handleCopyPath}
                    className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-200 px-2 py-1 bg-neutral-800 rounded transition-colors"
                  >
                    {copiedPath ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPath ? '已复制' : '复制路径'}</span>
                  </button>
                </div>
                <div className="break-all text-neutral-300 text-[11px]">
                  {item.filePath}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-[11px]">
                  <div className="p-2 bg-neutral-900 rounded border border-neutral-800/80">
                    <span className="text-neutral-400 block mb-1">文件容量</span>
                    <span className="text-neutral-200 font-semibold">{item.fileSizeGB} GB</span>
                  </div>
                  <div className="p-2 bg-neutral-900 rounded border border-neutral-800/80">
                    <span className="text-neutral-400 block mb-1">平均总码率</span>
                    <span className="text-neutral-200 font-semibold">{item.bitrateMbps} Mbps</span>
                  </div>
                  <div className="p-2 bg-neutral-900 rounded border border-neutral-800/80">
                    <span className="text-neutral-400 block mb-1">视频编码格式</span>
                    <span className="text-amber-300 font-semibold">{item.videoCodec}</span>
                  </div>
                  <div className="p-2 bg-neutral-900 rounded border border-neutral-800/80">
                    <span className="text-neutral-400 block mb-1">动态范围</span>
                    <span className="text-emerald-300 font-semibold">{item.hdr}</span>
                  </div>
                </div>
              </div>

              {/* Audio Tracks */}
              <div>
                <h5 className="text-xs uppercase font-mono text-neutral-400 mb-2 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-neutral-400" />
                  音频流轨道 (Audio Streams)
                </h5>
                <div className="space-y-1.5">
                  {item.audioTracks.map((trk) => (
                    <div key={trk.id} className="p-2.5 rounded bg-neutral-950/60 border border-neutral-800 text-xs flex items-center justify-between">
                      <span className="text-neutral-200 font-mono">{trk.label}</span>
                      <span className="text-neutral-400 text-[11px] font-mono">{trk.channels} 声道</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subtitles */}
              <div>
                <h5 className="text-xs uppercase font-mono text-neutral-400 mb-2 flex items-center gap-1.5">
                  <Subtitles className="w-3.5 h-3.5 text-neutral-400" />
                  内置与外挂字幕 (Subtitle Tracks)
                </h5>
                <div className="space-y-1.5">
                  {item.subtitles.map((sub) => (
                    <div key={sub.id} className="p-2.5 rounded bg-neutral-950/60 border border-neutral-800 text-xs flex items-center justify-between">
                      <span className="text-neutral-200">{sub.label}</span>
                      <span className="text-amber-400 font-mono text-[11px]">{sub.format} 格式</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'nfo' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>本地标准 NFO 元数据描述文件 (XML Format)</span>
                <button
                  onClick={() => onRescrape(item)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded hover:bg-amber-500/30 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>联网重新刮削并覆盖 NFO</span>
                </button>
              </div>
              <pre className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed">
                {item.nfoContent}
              </pre>
            </div>
          )}
        </div>

        {/* Footer with Rescrape Action */}
        <div className="px-6 py-4 bg-neutral-950/60 border-t border-neutral-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-neutral-400">
            <span>数据源:</span>
            <span className="text-neutral-200 font-medium">{item.matchedSource}</span>
            <span className="text-neutral-600">·</span>
            <span>匹配度:</span>
            <span className="text-emerald-400 font-mono font-medium">{item.matchScore}%</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onRescrape(item)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.rescrape}</span>
            </button>
            <button
              onClick={() => onPlay(item)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold rounded transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{t.playNow}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
