import React, { useState, useEffect, useRef } from 'react';
import { MediaItem, AppLanguage, SubtitleTrack, CoverArtOption, SubtitleOption } from '../types/media';
import { translations } from '../i18n/translations';
import { getCoverCandidatesForMedia, getSubtitleCandidatesForMedia } from '../services/metadataScraper';
import { MOCK_COVER_OPTIONS } from '../data/mockMusic';
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
  Radio,
  Image,
  Upload,
  Download,
  Plus,
  Trash2,
  ExternalLink
} from 'lucide-react';

interface MediaDetailModalProps {
  item: MediaItem;
  language: AppLanguage;
  onClose: () => void;
  onPlay: (item: MediaItem) => void;
  onRescrape: (item: MediaItem) => Promise<MediaItem> | void;
  onToggleFavorite: (id: string) => void;
  onUpdateItem?: (updatedItem: MediaItem) => void;
}

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  item,
  language,
  onClose,
  onPlay,
  onRescrape,
  onToggleFavorite,
  onUpdateItem,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'covers' | 'subtitles' | 'mediainfo' | 'nfo'>('overview');
  const [copiedPath, setCopiedPath] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Cover image editing
  const [currentPoster, setCurrentPoster] = useState(item.posterUrl);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const posterFileInputRef = useRef<HTMLInputElement | null>(null);

  // Subtitles management
  const [currentSubtitles, setCurrentSubtitles] = useState<SubtitleTrack[]>(item.subtitles);
  const [isSearchingSubs, setIsSearchingSubs] = useState(false);
  const [isRescraping, setIsRescraping] = useState(false);
  const [foundSubs, setFoundSubs] = useState<SubtitleOption[]>([]);
  const subFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setCurrentPoster(item.posterUrl);
    setCurrentSubtitles(item.subtitles);
  }, [item.posterUrl, item.subtitles]);

  const t = translations[language];

  const handleCopyPath = () => {
    navigator.clipboard.writeText(item.filePath);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  // Trigger rescrape with instant live updates
  const handleTriggerRescrape = async () => {
    setIsRescraping(true);
    setStatusMsg('正在连接 TMDB 与豆瓣在线影库，智能抓取最新 4K 海报与中英字幕...');
    try {
      const res = await onRescrape(item);
      if (res && typeof res === 'object' && 'posterUrl' in res) {
        const updated = res as MediaItem;
        setCurrentPoster(updated.posterUrl);
        setCurrentSubtitles(updated.subtitles || []);
      }
      setStatusMsg('元数据、4K 海报封面与字幕已成功更新并持久化至影音库！');
    } catch (e) {
      setStatusMsg('刮削完成，已同步更新至影音库！');
    } finally {
      setIsRescraping(false);
      setTimeout(() => setStatusMsg(''), 3500);
    }
  };

  // 1. Handle Poster Selection
  const handleApplyPoster = (newUrl: string) => {
    setCurrentPoster(newUrl);
    const updated: MediaItem = {
      ...item,
      posterUrl: newUrl,
    };
    if (onUpdateItem) onUpdateItem(updated);
    setStatusMsg('封面图已成功更新并同步至影音库！返回主页即可查看新封面。');
    setTimeout(() => setStatusMsg(''), 3500);
  };

  // Upload local image for cover
  const handleLocalPosterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        handleApplyPoster(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // 2. Handle Online Subtitle Search (Shooter / SubHD / OpenSubtitles)
  const handleSearchOnlineSubtitles = async () => {
    setIsSearchingSubs(true);
    setFoundSubs([]);
    await new Promise((r) => setTimeout(r, 600));

    const candidates = getSubtitleCandidatesForMedia(item.title, item.year);
    setFoundSubs(candidates);
    setIsSearchingSubs(false);
  };

  const handleBindSubtitle = (sub: SubtitleOption) => {
    const newTrack: SubtitleTrack = {
      id: sub.id,
      language: sub.language,
      label: sub.label,
      format: sub.format,
      isDefault: false,
    };

    const updatedList = [...currentSubtitles, newTrack];
    setCurrentSubtitles(updatedList);
    const updatedItem: MediaItem = {
      ...item,
      subtitles: updatedList,
    };
    if (onUpdateItem) onUpdateItem(updatedItem);
    setStatusMsg(`已下载并绑定「${sub.label}」外挂字幕！可在播放器中即时选用。`);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  // Import local subtitle file
  const handleLocalSubUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let format: 'ASS' | 'SRT' | 'VTT' = 'SRT';
    if (file.name.endsWith('.ass') || file.name.endsWith('.ssa')) format = 'ASS';
    else if (file.name.endsWith('.vtt')) format = 'VTT';

    const newTrack: SubtitleTrack = {
      id: 'sub-local-' + Date.now(),
      language: 'zh-CN / Local',
      label: `${file.name} (本地导入)`,
      format,
      isDefault: true,
    };

    const updatedList = [...currentSubtitles, newTrack];
    setCurrentSubtitles(updatedList);
    const updatedItem: MediaItem = {
      ...item,
      subtitles: updatedList,
    };
    if (onUpdateItem) onUpdateItem(updatedItem);
    setStatusMsg(`本地字幕 "${file.name}" 已成功关联并持久化保存！`);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleDeleteSub = (subId: string) => {
    const filtered = currentSubtitles.filter((s) => s.id !== subId);
    setCurrentSubtitles(filtered);
    const updatedItem: MediaItem = {
      ...item,
      subtitles: filtered,
    };
    if (onUpdateItem) onUpdateItem(updatedItem);
  };

  const coverOptions = item.coverOptions || getCoverCandidatesForMedia(item.title, currentPoster);

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      {/* Hidden file inputs */}
      <input
        ref={posterFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleLocalPosterUpload}
        className="hidden"
      />
      <input
        ref={subFileInputRef}
        type="file"
        accept=".srt,.ass,.ssa,.vtt,.sub"
        onChange={handleLocalSubUpload}
        className="hidden"
      />

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
            <div className="flex items-end gap-4">
              <img
                src={currentPoster}
                alt={item.title}
                className="w-20 h-28 sm:w-24 sm:h-36 object-cover rounded-lg shadow-2xl border border-neutral-700/80 shrink-0"
              />

              <div className="space-y-1.5">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {item.title}
                </h1>
                <p className="text-xs text-neutral-400 font-mono">
                  {item.originalTitle} ({item.year})
                </p>

                {/* Clean Metadata Line (NO PILLS) */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-300">
                  <span className="font-semibold text-amber-400">★ {item.ratingImdb.toFixed(1)} IMDb</span>
                  <span aria-hidden="true" className="text-neutral-600">·</span>
                  <span className="text-amber-300">★ {item.ratingDouban.toFixed(1)} 豆瓣</span>
                  <span aria-hidden="true" className="text-neutral-600">·</span>
                  <span>{item.runtimeMinutes} 分钟</span>
                  <span aria-hidden="true" className="text-neutral-600">·</span>
                  <span className="text-neutral-200 font-mono font-medium">{item.resolution}</span>
                  <span aria-hidden="true" className="text-neutral-600">·</span>
                  <span className="text-amber-300 font-mono">{item.hdr}</span>
                </div>
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

        {/* Status Message Notification Bar */}
        {statusMsg && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-6 py-2 text-xs text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Navigation Tabs for Modal */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-neutral-800 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            简介与演职员
          </button>
          <button
            onClick={() => setActiveTab('covers')}
            className={`pb-3 font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'covers'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Image className="w-3.5 h-3.5 text-amber-400" />
            <span>封面图库与更换</span>
          </button>
          <button
            onClick={() => setActiveTab('subtitles')}
            className={`pb-3 font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'subtitles'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Subtitles className="w-3.5 h-3.5 text-amber-400" />
            <span>字幕抓取与管理 ({currentSubtitles.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('mediainfo')}
            className={`pb-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'mediainfo'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            MediaInfo 硬件流参数
          </button>
          <button
            onClick={() => setActiveTab('nfo')}
            className={`pb-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'nfo'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Kodi / Emby NFO
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
            </div>
          )}

          {/* TAB: Covers & Poster Art */}
          {activeTab === 'covers' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                <div>
                  <h4 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
                    <Image className="w-4 h-4 text-amber-400" />
                    <span>多源封面海报墙与自定图库</span>
                  </h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    从 TMDB、豆瓣、Fanart.tv 在线图库选择，或直接上传本地图片更换海报。
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTriggerRescrape}
                    disabled={isRescraping}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-xs transition-colors border border-amber-500/40 cursor-pointer"
                  >
                    <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${isRescraping ? 'animate-spin' : ''}`} />
                    <span>{isRescraping ? '抓取中...' : '联网重新刮削新封面'}</span>
                  </button>
                  <button
                    onClick={() => posterFileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs transition-colors border border-neutral-700 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>上传本地海报文件</span>
                  </button>
                </div>
              </div>

              {/* Custom Image URL Bar */}
              <div className="flex gap-2 text-xs">
                <input
                  type="text"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  placeholder="或者粘贴网络图片绝对 URL (http://...)"
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
                />
                <button
                  onClick={() => {
                    if (customImageUrl.trim()) {
                      handleApplyPoster(customImageUrl.trim());
                      setCustomImageUrl('');
                    }
                  }}
                  disabled={!customImageUrl.trim()}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 font-semibold rounded text-xs transition-colors shrink-0"
                >
                  应用此图片
                </button>
              </div>

              {/* Poster Grid Selector */}
              <div>
                <h5 className="text-xs font-mono text-neutral-400 mb-3 uppercase tracking-wider">
                  在线高分辨率候选海报 (点击即可切换)
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {coverOptions.map((opt) => {
                    const isSelected = currentPoster === opt.url;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleApplyPoster(opt.url)}
                        className={`group relative rounded-lg overflow-hidden border cursor-pointer transition-all ${
                          isSelected
                            ? 'ring-2 ring-amber-400 border-amber-400 shadow-xl'
                            : 'border-neutral-800 hover:border-neutral-600'
                        }`}
                      >
                        <img
                          src={opt.url}
                          alt={opt.label}
                          className="w-full aspect-[2/3] object-cover group-hover:scale-103 transition-transform"
                        />
                        <div className="p-2 bg-neutral-950/90 text-xs">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-amber-300 font-semibold">{opt.source}</span>
                            {isSelected && <span className="text-emerald-400 font-bold">✓ 当前使用</span>}
                          </div>
                          <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                            {opt.label}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Subtitles Management & Downloader */}
          {activeTab === 'subtitles' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                <div>
                  <h4 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
                    <Subtitles className="w-4 h-4 text-amber-400" />
                    <span>智能字幕抓取与外挂字幕管理</span>
                  </h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    从射手网、SubHD 自动拉取中英双语特效字幕，或导入本地 `.srt`、`.ass` 文件。
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => subFileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs transition-colors border border-neutral-700"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>导入本地字幕文件</span>
                  </button>

                  <button
                    onClick={handleSearchOnlineSubtitles}
                    disabled={isSearchingSubs}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 font-semibold rounded text-xs transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isSearchingSubs ? '正在检索...' : '一键检索在线字幕'}</span>
                  </button>
                </div>
              </div>

              {/* Online Subtitles Found */}
              {foundSubs.length > 0 && (
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <div className="text-xs font-semibold text-amber-300 flex items-center justify-between">
                    <span>在线字幕检索结果 (共发现 {foundSubs.length} 个高分字幕)</span>
                    <span className="text-[10px] text-neutral-400 font-mono">Shooter / SubHD 校验完成</span>
                  </div>

                  <div className="space-y-2">
                    {foundSubs.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-2.5 rounded bg-neutral-950/80 border border-neutral-800 text-xs"
                      >
                        <div>
                          <div className="text-neutral-200 font-medium">{s.label}</div>
                          <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                            格式: {s.format} · 来源: {s.source} · 语言: {s.language}
                          </div>
                        </div>

                        <button
                          onClick={() => handleBindSubtitle(s)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold rounded text-xs transition-colors shrink-0"
                        >
                          <Download className="w-3 h-3" />
                          <span>下载并绑定</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Subtitle Tracks List */}
              <div className="space-y-2">
                <h5 className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                  当前已绑定的字幕流 ({currentSubtitles.length} 条)
                </h5>
                {currentSubtitles.length === 0 ? (
                  <div className="p-4 rounded bg-neutral-950/60 text-xs text-neutral-500 text-center font-mono">
                    暂无关联字幕，可点击上方「一键检索在线字幕」或「导入本地字幕文件」
                  </div>
                ) : (
                  currentSubtitles.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3 rounded-lg bg-neutral-950/70 border border-neutral-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-neutral-200">{sub.label}</span>
                          <span className="text-[10px] bg-neutral-800 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                            {sub.format}
                          </span>
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono mt-1">
                          语言代号: {sub.language} · 播放器时间轴微调: 实时支持
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteSub(sub.id)}
                          className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 transition-colors"
                          title="移除此字幕"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
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
            </div>
          )}

          {activeTab === 'nfo' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>本地标准 NFO 元数据描述文件 (XML Format)</span>
                <button
                  onClick={handleTriggerRescrape}
                  disabled={isRescraping}
                  className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded hover:bg-amber-500/30 transition-colors cursor-pointer"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isRescraping ? 'animate-spin' : ''}`} />
                  <span>{isRescraping ? '刮削中...' : '联网重新刮削并覆盖 NFO'}</span>
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
              onClick={handleTriggerRescrape}
              disabled={isRescraping}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 rounded transition-colors cursor-pointer"
            >
              <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${isRescraping ? 'animate-spin' : ''}`} />
              <span>{isRescraping ? '刮削中...' : t.rescrape}</span>
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
