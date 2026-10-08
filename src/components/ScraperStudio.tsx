import React, { useState } from 'react';
import { MediaItem, AppLanguage, ScraperLog, StorageFolder } from '../types/media';
import { translations } from '../i18n/translations';
import { scrapeMetadataForFile, parseFilename } from '../services/metadataScraper';
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
  Play
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
  ]);

  const [isScraping, setIsScraping] = useState(false);
  const [scrapProgress, setScrapProgress] = useState(100);
  const [customFilename, setCustomFilename] = useState(
    'Dune.Part.Two.2024.2160p.UHD.BluRay.x265.DV.HDR10+.TrueHD.Atmos.7.1-FLUX.mkv'
  );
  const [parsedPreview, setParsedPreview] = useState(parseFilename(customFilename));
  const [selectedNfoItem, setSelectedNfoItem] = useState<MediaItem | null>(mediaItems[0] || null);
  const [lastScrapedItem, setLastScrapedItem] = useState<MediaItem | null>(null);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const t = translations[language];

  const handleFilenameChange = (val: string) => {
    setCustomFilename(val);
    setParsedPreview(parseFilename(val));
  };

  const handleTestScrape = async () => {
    setIsScraping(true);
    setAddedSuccess(false);
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
      subtitles: [
        { id: 'sub-1', language: 'zh-CN', label: '中文简体特效字幕 (ASS)', format: 'ASS', isDefault: true },
      ],
      overview: result.overview || '已成功通过智能刮削引擎从远端数据库获取元数据。',
      genres: result.genres || ['科幻', '剧情'],
      director: result.director || '未知导演',
      cast: [
        { name: '主演', character: '主角', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' },
      ],
      posterUrl: result.posterUrl || 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=600&auto=format&fit=crop&q=80',
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
        message: `已成功将新抓取的「${lastScrapedItem.title}」存入本地影音库主索引！`,
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
        message: `全量刮削完成！共校验 ${updated.length} 条媒体，已刷新 NFO 与海报缓存。`,
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>{t.scraperTitle}</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            {t.scraperDesc}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleBatchScrapeAll}
            disabled={isScraping}
            className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 font-semibold text-xs rounded-lg shadow-md transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? 'animate-spin' : ''}`} />
            <span>{isScraping ? `刮削中 (${scrapProgress}%)` : t.scrapeAllUnmatched}</span>
          </button>
        </div>
      </div>

      {/* Interactive Filename Regex Parser Test Workbench */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>本地影视文件名智能正则提取试验台</span>
          </h3>
          <span className="text-[11px] text-neutral-400 font-mono">
            支持 4K UHD · Remux · WEB-DL · Atmos · DV 标签
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
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>抓取验证</span>
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

        {/* Actionable Scraped Result Card */}
        {lastScrapedItem && (
          <div className="p-4 rounded-lg bg-neutral-950/90 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <img
                src={lastScrapedItem.posterUrl}
                alt={lastScrapedItem.title}
                className="w-12 h-16 object-cover rounded shadow-md shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white">{lastScrapedItem.title}</h4>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    ✓ {lastScrapedItem.matchedSource} 匹配成功 ({lastScrapedItem.matchScore}%)
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                  {lastScrapedItem.overview}
                </p>
                <div className="text-[10px] text-neutral-500 font-mono mt-1">
                  导演: {lastScrapedItem.director} · 评分: ★ {lastScrapedItem.ratingImdb.toFixed(1)} IMDb
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleImportScrapedItem}
                disabled={addedSuccess}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                  addedSuccess
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                    : 'bg-amber-400 hover:bg-amber-300 text-neutral-950'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{addedSuccess ? '已导入影音库' : '一键导入影音库'}</span>
              </button>

              <button
                onClick={() => onPlay(lastScrapedItem)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs transition-colors"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>立即试播</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Live Scraping Log Console & NFO Inspector */}
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
                className="flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 bg-neutral-800 px-2 py-1 rounded transition-colors"
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
                className={`px-2.5 py-1 rounded whitespace-nowrap transition-colors ${
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
