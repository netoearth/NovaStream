import React, { useState, useRef } from 'react';
import { MediaItem, AppLanguage, ScraperLog, StorageFolder, CoverArtOption, SubtitleOption, SubtitleTrack } from '../types/media';
import { translations } from '../i18n/translations';
import {
  scrapeMetadataForFile,
  parseFilename,
  getCoverCandidatesForMedia,
  getSubtitleCandidatesForMedia
} from '../services/metadataScraper';
import {
  Sparkles,
  FolderSearch,
  FileCode,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Terminal,
  Download,
  Search,
  HardDrive,
  FileText,
  Sliders,
  Play,
  Image as ImageIcon,
  Subtitles,
  Upload,
  Check,
  Eye,
  Plus,
  Trash2,
  ExternalLink
} from 'lucide-react';

interface ScraperStudioProps {
  mediaItems: MediaItem[];
  storageFolders: StorageFolder[];
  language: AppLanguage;
  onUpdateMedia: (items: MediaItem[]) => void;
  onPlay: (item: MediaItem) => void;
}

export const ScraperStudio: React.FC<ScraperStudioProps> = ({
  mediaItems,
  storageFolders,
  language,
  onUpdateMedia,
  onPlay,
}) => {
  const [logs, setLogs] = useState<ScraperLog[]>([
    {
      id: 'log-1',
      timestamp: '03:12:05',
      level: 'info',
      message: '元数据刮削引擎启动完成。支持 TMDB v3 API、豆瓣影视开放协议、AniList 聚合源。',
    },
    {
      id: 'log-2',
      timestamp: '03:12:06',
      level: 'success',
      message: '已加载本地 NFO 规范解析器 (Kodi / Jellyfin / Infuse XML 1.0 Strict Schema)。',
    },
    {
      id: 'log-3',
      timestamp: '03:12:07',
      level: 'success',
      message: '射手网 (Shooter) 与 SubHD 在线字幕自动比对通道已就绪，支持 ASS 特效与 SRT 字幕。',
    },
  ]);

  const [isScraping, setIsScraping] = useState(false);
  const [scrapProgress, setScrapProgress] = useState(100);
  const [customFilename, setCustomFilename] = useState(
    'Dune.Part.Two.2024.2160p.UHD.BluRay.x265.DV.HDR10+.TrueHD.Atmos.7.1-FLUX.mkv'
  );
  const [parsedPreview, setParsedPreview] = useState(parseFilename(customFilename));
  const [selectedNfoItem, setSelectedNfoItem] = useState<MediaItem | null>(mediaItems[0] || null);
  
  // Last scraped result state
  const [lastScrapedItem, setLastScrapedItem] = useState<MediaItem | null>(null);
  const [resultActiveTab, setResultActiveTab] = useState<'overview' | 'covers' | 'subtitles' | 'nfo'>('overview');
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [customCoverInput, setCustomCoverInput] = useState('');
  const [expandedSubPreviewId, setExpandedSubPreviewId] = useState<string | null>(null);
  const [statusNotification, setStatusNotification] = useState('');

  // Hidden file inputs
  const localCoverInputRef = useRef<HTMLInputElement | null>(null);
  const localSubInputRef = useRef<HTMLInputElement | null>(null);

  const t = translations[language];

  const handleFilenameChange = (val: string) => {
    setCustomFilename(val);
    setParsedPreview(parseFilename(val));
  };

  const handleTestScrape = async () => {
    setIsScraping(true);
    setAddedSuccess(false);
    setStatusNotification('');

    const newLog: ScraperLog = {
      id: Math.random().toString(),
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      message: `开始测试刮削文件: "${customFilename}"`,
    };
    setLogs((prev) => [newLog, ...prev]);

    const result = await scrapeMetadataForFile(customFilename, (log) => {
      setLogs((prev) => [log, ...prev]);
    });

    const parsed = parseFilename(customFilename);
    const coverCandidates = result.coverOptions || getCoverCandidatesForMedia(result.title || parsed.cleanTitle, result.posterUrl);
    const subCandidates = result.availableSubtitles || getSubtitleCandidatesForMedia(result.title || parsed.cleanTitle, result.year || parsed.year);

    const fullItem: MediaItem = {
      id: 'scraped-' + Date.now(),
      title: result.title || parsed.cleanTitle,
      originalTitle: result.originalTitle || parsed.cleanTitle,
      type: 'movie',
      year: result.year || parsed.year || 2024,
      ratingDouban: result.ratingDouban || 8.5,
      ratingImdb: result.ratingImdb || 8.6,
      releaseDate: result.releaseDate || '2024-01-01',
      runtimeMinutes: result.runtimeMinutes || 135,
      resolution: parsed.resolution,
      hdr: parsed.hdr,
      videoCodec: parsed.videoCodec,
      audioCodec: parsed.audioCodec,
      audioTracks: [
        { id: 'trk-1', language: 'Original', label: `原声音轨 (${parsed.audioCodec})`, codec: parsed.audioCodec, channels: '5.1', isDefault: true },
      ],
      coverOptions: coverCandidates,
      availableSubtitles: subCandidates,
      subtitles: result.subtitles && result.subtitles.length > 0 ? result.subtitles : [
        { id: subCandidates[0]?.id || 'sub-1', language: subCandidates[0]?.language || 'zh-CN / en', label: subCandidates[0]?.label || '中文简体特效字幕 (ASS)', format: subCandidates[0]?.format || 'ASS', isDefault: true },
      ],
      overview: result.overview || '已成功通过智能刮削引擎从远端数据库获取元数据。',
      genres: result.genres || ['科幻', '剧情'],
      director: result.director || '未知导演',
      cast: [
        { name: '主演', character: '主角', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' },
      ],
      posterUrl: result.posterUrl || coverCandidates[0]?.url || 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=600&auto=format&fit=crop&q=80',
      backdropUrl: result.backdropUrl || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=80',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      filePath: customFilename,
      fileSizeGB: 34.2,
      bitrateMbps: 38.5,
      nfoContent: result.nfoContent || '',
      matchedSource: result.matchedSource || 'TMDB',
      matchScore: result.matchScore || 98.5,
      addedDate: new Date().toISOString().split('T')[0],
      watchProgressSec: 0,
      isFavorite: false,
    };

    setLastScrapedItem(fullItem);
    setIsScraping(false);
    setResultActiveTab('overview');
  };

  // Select cover candidate
  const handleSelectCover = (coverUrl: string) => {
    if (!lastScrapedItem) return;
    setLastScrapedItem({
      ...lastScrapedItem,
      posterUrl: coverUrl,
    });
    setStatusNotification('已选择此封面图为主海报');
    setTimeout(() => setStatusNotification(''), 2500);
  };

  // Upload local image as cover
  const handleLocalCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !lastScrapedItem) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const newCoverOpt: CoverArtOption = {
          id: 'user-cov-' + Date.now(),
          url: dataUrl,
          source: 'User',
          label: `本地上传封面 (${file.name})`,
        };
        const currentOpts = lastScrapedItem.coverOptions || [];
        setLastScrapedItem({
          ...lastScrapedItem,
          posterUrl: dataUrl,
          coverOptions: [newCoverOpt, ...currentOpts],
        });
        setStatusNotification(`本地封面 "${file.name}" 已上传并设为主海报！`);
        setTimeout(() => setStatusNotification(''), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  // Apply custom cover URL
  const handleApplyCustomCoverUrl = () => {
    if (!customCoverInput.trim() || !lastScrapedItem) return;
    const newCoverOpt: CoverArtOption = {
      id: 'custom-url-' + Date.now(),
      url: customCoverInput.trim(),
      source: 'User',
      label: '自定义网络海报链接',
    };
    const currentOpts = lastScrapedItem.coverOptions || [];
    setLastScrapedItem({
      ...lastScrapedItem,
      posterUrl: customCoverInput.trim(),
      coverOptions: [newCoverOpt, ...currentOpts],
    });
    setCustomCoverInput('');
    setStatusNotification('已应用自定义海报链接！');
    setTimeout(() => setStatusNotification(''), 2500);
  };

  // Toggle mounting of subtitle track
  const handleToggleMountSubtitle = (subOption: SubtitleOption) => {
    if (!lastScrapedItem) return;
    const isMounted = lastScrapedItem.subtitles.some((s) => s.id === subOption.id);

    let updatedSubs: SubtitleTrack[];
    if (isMounted) {
      updatedSubs = lastScrapedItem.subtitles.filter((s) => s.id !== subOption.id);
      setStatusNotification(`已取消挂载字幕「${subOption.label}」`);
    } else {
      const newTrack: SubtitleTrack = {
        id: subOption.id,
        language: subOption.language,
        label: subOption.label,
        format: subOption.format,
        isDefault: lastScrapedItem.subtitles.length === 0,
      };
      updatedSubs = [...lastScrapedItem.subtitles, newTrack];
      setStatusNotification(`已成功下载并挂载「${subOption.label}」字幕！`);
    }

    setLastScrapedItem({
      ...lastScrapedItem,
      subtitles: updatedSubs,
    });
    setTimeout(() => setStatusNotification(''), 2500);
  };

  // Upload local subtitle file (.srt, .ass, .vtt)
  const handleLocalSubUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !lastScrapedItem) return;

    let format: 'ASS' | 'SRT' | 'VTT' = 'SRT';
    if (file.name.endsWith('.ass') || file.name.endsWith('.ssa')) format = 'ASS';
    else if (file.name.endsWith('.vtt')) format = 'VTT';

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      const newTrack: SubtitleTrack = {
        id: 'local-sub-' + Date.now(),
        language: 'zh-CN / Local',
        label: `${file.name} (本地导入)`,
        format,
        isDefault: true,
      };

      const newOption: SubtitleOption = {
        id: newTrack.id,
        language: newTrack.language,
        label: newTrack.label,
        format,
        source: 'Local File',
        content: text.slice(0, 300) || '本地字幕内容已就绪',
      };

      const existingOptions = lastScrapedItem.availableSubtitles || [];
      setLastScrapedItem({
        ...lastScrapedItem,
        subtitles: [newTrack, ...lastScrapedItem.subtitles],
        availableSubtitles: [newOption, ...existingOptions],
      });

      setStatusNotification(`本地字幕 "${file.name}" 已成功解析并挂载！`);
      setTimeout(() => setStatusNotification(''), 3000);
    };
    reader.readAsText(file);
  };

  const handleImportScrapedItem = () => {
    if (!lastScrapedItem) return;
    onUpdateMedia([lastScrapedItem, ...mediaItems]);
    setAddedSuccess(true);
    setLogs((prev) => [
      {
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        level: 'success',
        message: `已成功将新抓取的「${lastScrapedItem.title}」连同所选 ${lastScrapedItem.subtitles.length} 条字幕及高清封面存入影音库主索引！`,
      },
      ...prev,
    ]);
  };

  const handleBatchScrapeAll = async () => {
    setIsScraping(true);
    setScrapProgress(0);

    const updated = [...mediaItems];
    for (let i = 0; i < updated.length; i++) {
      const item = updated[i];
      const result = await scrapeMetadataForFile(item.filePath, (log) => {
        setLogs((prev) => [log, ...prev]);
      });

      updated[i] = {
        ...item,
        ...result,
      };
      setScrapProgress(Math.round(((i + 1) / updated.length) * 100));
    }

    onUpdateMedia(updated);
    setIsScraping(false);

    setLogs((prev) => [
      {
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        level: 'success',
        message: `全量刮削完成！共校验 ${updated.length} 条媒体，已自动下载并关联中英字幕、高分辨率海报与 NFO 归档。`,
      },
      ...prev,
    ]);
  };

  const handleDownloadNfo = (item: MediaItem) => {
    const blob = new Blob([item.nfoContent], { type: 'text/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.title}.nfo`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Hidden file inputs */}
      <input
        ref={localCoverInputRef}
        type="file"
        accept="image/*"
        onChange={handleLocalCoverUpload}
        className="hidden"
      />
      <input
        ref={localSubInputRef}
        type="file"
        accept=".srt,.ass,.ssa,.vtt,.sub"
        onChange={handleLocalSubUpload}
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>{t.scraperTitle}</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            {t.scraperDesc} · 集成射手网/SubHD 字幕检索与 TMDB/豆瓣高清海报画廊
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleBatchScrapeAll}
            disabled={isScraping}
            className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 font-semibold text-xs rounded-lg shadow-md transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? 'animate-spin' : ''}`} />
            <span>{isScraping ? `全量刮削中 (${scrapProgress}%)` : '一键全库自动抓取 (海报/字幕/NFO)'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Filename Regex Parser Test Workbench */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>本地影视文件名智能正则提取与多源刮削试验台</span>
          </h3>
          <span className="text-[11px] text-neutral-400 font-mono">
            支持 4K UHD · Remux · WEB-DL · Atmos · DV · 射手网字幕 · 豆瓣/TMDB 封面
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={customFilename}
            onChange={(e) => handleFilenameChange(e.target.value)}
            placeholder="输入或粘贴媒体文件名 (如: Movie.2024.2160p.UHD.x265.mkv)"
            className="flex-1 bg-neutral-950 border border-neutral-700/80 rounded-lg px-3 py-2 text-xs font-mono text-neutral-200 focus:outline-none focus:border-amber-400"
          />
          <button
            onClick={handleTestScrape}
            disabled={isScraping}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>抓取验证 (含字幕/封面)</span>
          </button>
        </div>

        {/* Real-time Parsed Metadata Tokens - Typography over pills */}
        <div className="bg-neutral-950/80 p-3.5 rounded-lg border border-neutral-800/80">
          <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-mono mb-2">
            提取流属性解析结果
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div>
              <span className="text-neutral-500 block text-[10px] font-mono">识别影视名称</span>
              <span className="text-amber-300 font-medium truncate block">{parsedPreview.cleanTitle}</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] font-mono">发行年份</span>
              <span className="text-neutral-200 font-mono">{parsedPreview.year || '未标注'}</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] font-mono">分辨率规格</span>
              <span className="text-neutral-200 font-mono font-medium">{parsedPreview.resolution}</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] font-mono">视频编码 / HDR</span>
              <span className="text-emerald-400 font-mono">{parsedPreview.videoCodec} · {parsedPreview.hdr}</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] font-mono">音频编码标准</span>
              <span className="text-neutral-200 font-mono">{parsedPreview.audioCodec}</span>
            </div>
          </div>
        </div>

        {/* Status Toast in Scraper Studio */}
        {statusNotification && (
          <div className="bg-emerald-950/90 border border-emerald-500/50 p-2.5 rounded-lg text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{statusNotification}</span>
          </div>
        )}

        {/* Actionable Scraped Result Hub with Full Cover Gallery and Subtitle Matcher */}
        {lastScrapedItem && (
          <div className="p-5 rounded-xl bg-neutral-950/95 border border-amber-500/50 shadow-2xl space-y-4 animate-in fade-in">
            {/* Top Bar: Title & Primary Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-4">
                <img
                  src={lastScrapedItem.posterUrl}
                  alt={lastScrapedItem.title}
                  className="w-14 h-20 object-cover rounded-lg shadow-lg border border-neutral-700 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{lastScrapedItem.title}</h4>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      ✓ {lastScrapedItem.matchedSource} 匹配成功 ({lastScrapedItem.matchScore}%)
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 line-clamp-1 mt-1">
                    {lastScrapedItem.overview}
                  </p>
                  <div className="text-[11px] text-neutral-500 font-mono mt-1 flex items-center gap-2">
                    <span>导演: {lastScrapedItem.director}</span>
                    <span>·</span>
                    <span className="text-amber-400">★ {lastScrapedItem.ratingImdb.toFixed(1)} IMDb</span>
                    <span>·</span>
                    <span className="text-emerald-400 font-semibold">{lastScrapedItem.subtitles.length} 条已挂载字幕</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={handleImportScrapedItem}
                  disabled={addedSuccess}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    addedSuccess
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                      : 'bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-md shadow-amber-400/20'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{addedSuccess ? '已成功存入本地影音库' : '一键存入影音库'}</span>
                </button>

                <button
                  onClick={() => onPlay(lastScrapedItem)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-neutral-700"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
                  <span>立即试播 (检验字幕)</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs for Scraped Assets */}
            <div className="flex items-center gap-2 border-b border-neutral-800/80 text-xs">
              <button
                onClick={() => setResultActiveTab('overview')}
                className={`pb-2.5 font-medium transition-colors border-b-2 ${
                  resultActiveTab === 'overview'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                基础影视信息
              </button>

              <button
                onClick={() => setResultActiveTab('covers')}
                className={`pb-2.5 font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
                  resultActiveTab === 'covers'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>封面海报画廊 ({lastScrapedItem.coverOptions?.length || 0})</span>
              </button>

              <button
                onClick={() => setResultActiveTab('subtitles')}
                className={`pb-2.5 font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
                  resultActiveTab === 'subtitles'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Subtitles className="w-3.5 h-3.5 text-amber-400" />
                <span>字幕自动匹配与管理 ({lastScrapedItem.subtitles.length} 条已挂载)</span>
              </button>

              <button
                onClick={() => setResultActiveTab('nfo')}
                className={`pb-2.5 font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
                  resultActiveTab === 'nfo'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-amber-400" />
                <span>Kodi/Emby NFO 归档</span>
              </button>
            </div>

            {/* TAB 1: Overview */}
            {resultActiveTab === 'overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
                <div className="sm:col-span-2 space-y-2">
                  <span className="text-neutral-500 font-mono text-[11px] block">剧情简介</span>
                  <p className="text-neutral-300 leading-relaxed bg-neutral-900/60 p-3 rounded-lg border border-neutral-800">
                    {lastScrapedItem.overview}
                  </p>
                </div>
                <div className="space-y-2 bg-neutral-900/60 p-3 rounded-lg border border-neutral-800">
                  <span className="text-neutral-500 font-mono text-[11px] block">流参数概要</span>
                  <div className="space-y-1 font-mono text-[11px]">
                    <div className="text-neutral-300">格式: <span className="text-amber-300 font-semibold">{lastScrapedItem.resolution}</span></div>
                    <div className="text-neutral-300">编码: <span className="text-emerald-400">{lastScrapedItem.videoCodec}</span></div>
                    <div className="text-neutral-300">HDR: <span className="text-amber-300">{lastScrapedItem.hdr}</span></div>
                    <div className="text-neutral-300">音频: <span className="text-neutral-200">{lastScrapedItem.audioCodec}</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Cover Art Gallery */}
            {resultActiveTab === 'covers' && (
              <div className="space-y-4 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <p className="text-neutral-400">
                    已从 TMDB、豆瓣电影、Fanart.tv 刮削获取候选海报。点击即可切换为当前主海报：
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => localCoverInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>上传本地海报图片</span>
                    </button>
                  </div>
                </div>

                {/* Candidate Poster Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {lastScrapedItem.coverOptions?.map((cov) => {
                    const isSelected = lastScrapedItem.posterUrl === cov.url;
                    return (
                      <div
                        key={cov.id}
                        onClick={() => handleSelectCover(cov.url)}
                        className={`group relative rounded-lg overflow-hidden border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-lg shadow-amber-400/20'
                            : 'border-neutral-800 hover:border-neutral-600'
                        }`}
                      >
                        <div className="aspect-[2/3] w-full overflow-hidden bg-neutral-900">
                          <img
                            src={cov.url}
                            alt={cov.label}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>

                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-amber-400 text-neutral-950 p-1 rounded-full shadow-md">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}

                        <div className="p-2 bg-neutral-900/90 border-t border-neutral-800 text-[10px]">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-neutral-200">{cov.source}</span>
                            <span className="text-amber-400">{isSelected ? '✓ 当前主海报' : '点击选用'}</span>
                          </div>
                          <p className="text-neutral-400 truncate mt-0.5">{cov.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Custom URL Input */}
                <div className="flex gap-2 pt-2 border-t border-neutral-800">
                  <input
                    type="text"
                    value={customCoverInput}
                    onChange={(e) => setCustomCoverInput(e.target.value)}
                    placeholder="输入自定义网络海报图片 URL (https://...)"
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={handleApplyCustomCoverUrl}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded transition-colors cursor-pointer"
                  >
                    应用网络图片
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: Subtitles Scraper & Matcher */}
            {resultActiveTab === 'subtitles' && (
              <div className="space-y-4 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-neutral-300 font-semibold">射手网 (Shooter API) / SubHD / OpenSubtitles 聚合抓取结果</span>
                    <p className="text-neutral-500 text-[11px] mt-0.5">
                      系统已通过视频文件哈希值精准匹配字幕。可自由勾选挂载或导入本地字幕文件：
                    </p>
                  </div>

                  <button
                    onClick={() => localSubInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs transition-colors cursor-pointer shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>导入本地字幕 (.srt / .ass)</span>
                  </button>
                </div>

                {/* Subtitles List */}
                <div className="space-y-2">
                  {lastScrapedItem.availableSubtitles?.map((sub) => {
                    const isMounted = lastScrapedItem.subtitles.some((s) => s.id === sub.id);
                    const isExpanded = expandedSubPreviewId === sub.id;

                    return (
                      <div
                        key={sub.id}
                        className={`p-3 rounded-lg border transition-all ${
                          isMounted
                            ? 'bg-neutral-900/90 border-emerald-500/40 shadow-sm'
                            : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                                sub.format === 'ASS'
                                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                                  : sub.format === 'SRT'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : 'bg-sky-950 text-sky-300 border border-sky-800'
                              }`}
                            >
                              {sub.format}
                            </span>

                            <div className="min-w-0">
                              <h5 className="text-xs font-semibold text-neutral-200 truncate">
                                {sub.label}
                              </h5>
                              <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono mt-0.5">
                                <span>语种: {sub.language}</span>
                                <span>·</span>
                                <span>来源: {sub.source}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {sub.content && (
                              <button
                                onClick={() => setExpandedSubPreviewId(isExpanded ? null : sub.id)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[11px] transition-colors cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>{isExpanded ? '收起预览' : '预览对白'}</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleToggleMountSubtitle(sub)}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                                isMounted
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40'
                                  : 'bg-amber-400 hover:bg-amber-300 text-neutral-950'
                              }`}
                            >
                              <Check className="w-3 h-3" />
                              <span>{isMounted ? '已挂载到视频' : '下载并挂载'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Expanded Subtitle Content Preview */}
                        {isExpanded && sub.content && (
                          <div className="mt-2.5 p-2.5 bg-neutral-950 rounded border border-neutral-800 text-[11px] font-mono text-emerald-400 leading-relaxed whitespace-pre-line animate-in fade-in">
                            <div className="text-[10px] text-neutral-500 mb-1">字幕时间轴与对白样本 (片头示例):</div>
                            {sub.content}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: NFO File */}
            {resultActiveTab === 'nfo' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Kodi / Jellyfin / Emby 标准 NFO XML 标签:</span>
                  <button
                    onClick={() => handleDownloadNfo(lastScrapedItem)}
                    className="flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200 bg-neutral-800 px-2.5 py-1 rounded transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>导出 .nfo 文件</span>
                  </button>
                </div>
                <div className="bg-neutral-950 p-3 rounded border border-neutral-800 text-xs font-mono text-emerald-400 max-h-48 overflow-y-auto leading-relaxed">
                  {lastScrapedItem.nfoContent || '无 NFO 内容'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Grid: Live Scraping Log Console & Library Item Deep-Scrape Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Terminal Logs */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 flex flex-col h-96">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <span className="text-xs font-semibold text-neutral-300 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.scraperLogs}</span>
            </span>
            <span className="text-[10px] font-mono text-neutral-500">
              {logs.length} 条记录
            </span>
          </div>

          <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1 font-mono text-xs">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-2 rounded bg-neutral-950/70 border border-neutral-800/60 flex items-start gap-2"
              >
                <span className="text-neutral-500 text-[10px] shrink-0 mt-0.5">{log.timestamp}</span>
                <span
                  className={`text-[10px] px-1 py-0.5 rounded font-bold uppercase shrink-0 ${
                    log.level === 'success'
                      ? 'text-emerald-400 bg-emerald-950/60'
                      : log.level === 'warn'
                      ? 'text-amber-400 bg-amber-950/60'
                      : 'text-sky-400 bg-sky-950/60'
                  }`}
                >
                  {log.level}
                </span>
                <span className="text-neutral-300 break-all">{log.message}</span>
              </div>
            ))}
          </div>
        </div>

        {/* NFO Standards Viewer & Download */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 flex flex-col h-96">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-neutral-300">
                NFO 归档文件生成器 (Kodi / Jellyfin 兼容)
              </span>
            </div>

            {selectedNfoItem && (
              <button
                onClick={() => handleDownloadNfo(selectedNfoItem)}
                className="flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 bg-neutral-800 px-2 py-1 rounded transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>导出 .nfo</span>
              </button>
            )}
          </div>

          {/* Quick Item Selector */}
          <div className="flex items-center gap-2 py-2 overflow-x-auto text-xs">
            {mediaItems.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedNfoItem(m)}
                className={`px-2.5 py-1 rounded whitespace-nowrap transition-colors cursor-pointer ${
                  selectedNfoItem?.id === m.id
                    ? 'bg-amber-500/20 text-amber-300 font-semibold'
                    : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {m.title}
              </button>
            ))}
          </div>

          {/* Code display */}
          <div className="flex-1 overflow-auto bg-neutral-950 p-3 rounded border border-neutral-800 text-xs font-mono text-emerald-400 leading-relaxed">
            {selectedNfoItem ? selectedNfoItem.nfoContent : '暂无选中文件'}
          </div>
        </div>
      </div>
    </div>
  );
};
