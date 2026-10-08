import React, { useState } from 'react';
import { MediaItem, AppLanguage, StorageFolder } from '../types/media';
import { translations } from '../i18n/translations';
import { MediaCard } from './MediaCard';
import {
  Play,
  Info,
  Sparkles,
  Layers,
  Film,
  Tv,
  CheckCircle2,
  HardDrive,
  Heart,
  SlidersHorizontal,
  Flame
} from 'lucide-react';

interface HomeViewProps {
  mediaItems: MediaItem[];
  storageFolders?: StorageFolder[];
  language: AppLanguage;
  searchQuery: string;
  onPlay: (item: MediaItem) => void;
  onSelect: (item: MediaItem) => void;
  onToggleFavorite: (id: string) => void;
  filterType?: 'all' | 'movie' | 'tv';
}

export const HomeView: React.FC<HomeViewProps> = ({
  mediaItems,
  storageFolders = [],
  language,
  searchQuery,
  onPlay,
  onSelect,
  onToggleFavorite,
  filterType = 'all',
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | '4k' | 'hdr' | 'watching' | 'favorites'>('all');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const t = translations[language];

  // Hero featured item (first item or favorite)
  const featured = mediaItems.find((m) => m.id === 'oppenheimer-2023') || mediaItems[0];

  // Filter media items
  const filteredItems = mediaItems.filter((item) => {
    // Storage folder filter
    if (selectedFolderId !== 'all') {
      const matchFolder = item.folderId === selectedFolderId;
      const targetFolder = storageFolders.find((f) => f.id === selectedFolderId);
      const matchPath = targetFolder ? item.filePath.startsWith(targetFolder.path) : false;
      if (!matchFolder && !matchPath) return false;
    }

    // Type filter
    if (filterType === 'movie' && item.type !== 'movie' && item.type !== 'documentary') return false;
    if (filterType === 'tv' && item.type !== 'tv' && item.type !== 'anime') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q) || item.originalTitle.toLowerCase().includes(q);
      const matchDirector = item.director.toLowerCase().includes(q);
      const matchGenre = item.genres.some((g) => g.toLowerCase().includes(q));
      const matchSpec = item.resolution.toLowerCase().includes(q) || item.audioCodec.toLowerCase().includes(q);
      if (!matchTitle && !matchDirector && !matchGenre && !matchSpec) return false;
    }

    // Sub filter
    if (activeFilter === '4k' && item.resolution !== '4K UHD') return false;
    if (activeFilter === 'hdr' && item.hdr === 'SDR') return false;
    if (activeFilter === 'watching' && item.watchProgressSec === 0) return false;
    if (activeFilter === 'favorites' && !item.isFavorite) return false;

    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8">
      {/* Cinematic Hero Featured Item Banner (Only on main view without active search) */}
      {!searchQuery && filterType === 'all' && featured && (
        <div className="relative rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-2xl group">
          {/* Backdrop Image */}
          <div className="relative h-80 sm:h-96 w-full overflow-hidden">
            <img
              src={featured.backdropUrl}
              alt={featured.title}
              className="w-full h-full object-cover object-center transform group-hover:scale-102 transition-transform duration-700 brightness-75"
            />
            {/* Subtle multi-stop gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/40 to-transparent" />
          </div>

          {/* Hero Content */}
          <div className="absolute bottom-6 left-6 right-6 max-w-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-300">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-current" />
                热映焦点
              </span>
              <span className="text-neutral-500">·</span>
              <span>4K 原盘直映</span>
              <span className="text-neutral-500">·</span>
              <span className="text-emerald-400 font-semibold">{featured.matchedSource} 认证元数据</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {featured.title}
            </h2>

            <p className="text-xs sm:text-sm text-neutral-300 line-clamp-2 leading-relaxed">
              {featured.overview}
            </p>

            {/* Typography metadata with dots (NO pills) */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-300">
              <span className="text-amber-400 font-bold font-mono">★ {featured.ratingImdb.toFixed(1)} IMDb</span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span>{featured.year}</span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span>{featured.runtimeMinutes} min</span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span className="font-mono text-neutral-200">{featured.resolution}</span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span className="text-amber-300 font-mono">{featured.hdr}</span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span className="text-neutral-400 font-mono">{featured.audioCodec}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => onPlay(featured)}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs rounded-lg shadow-lg shadow-amber-500/25 transition-all hover:scale-102"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{featured.watchProgressSec > 0 ? t.resumePlay : t.playNow}</span>
              </button>

              <button
                onClick={() => onSelect(featured)}
                className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold rounded-lg border border-neutral-700/80 transition-colors"
              >
                <Info className="w-4 h-4" />
                <span>{t.details}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Interactive Filter Tabs (Buttons with click handlers) */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-900/80 rounded-lg border border-neutral-800/80 text-xs">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeFilter === 'all'
                ? 'bg-neutral-800 text-amber-300 font-semibold shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {t.filterAll}
          </button>
          <button
            onClick={() => setActiveFilter('4k')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeFilter === '4k'
                ? 'bg-neutral-800 text-amber-300 font-semibold shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {t.filter4k}
          </button>
          <button
            onClick={() => setActiveFilter('hdr')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeFilter === 'hdr'
                ? 'bg-neutral-800 text-amber-300 font-semibold shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {t.filterHdr}
          </button>
          <button
            onClick={() => setActiveFilter('watching')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeFilter === 'watching'
                ? 'bg-neutral-800 text-amber-300 font-semibold shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {t.filterWatching}
          </button>
          <button
            onClick={() => setActiveFilter('favorites')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeFilter === 'favorites'
                ? 'bg-neutral-800 text-amber-300 font-semibold shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {t.filterFavorites}
          </button>
        </div>

        {/* Right side: Source Folder Filter & Media count summary */}
        <div className="flex flex-wrap items-center gap-3">
          {storageFolders.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <span className="font-mono text-[11px]">磁盘源:</span>
              <select
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="all">全部存储源 ({storageFolders.length} 个挂载点)</option>
                {storageFolders.map((sf) => (
                  <option key={sf.id} value={sf.id}>
                    {sf.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="text-xs text-neutral-400 font-mono">
            共收录 <span className="text-neutral-200 font-semibold">{filteredItems.length}</span> 部媒体
          </div>
        </div>
      </div>

      {/* Media Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-neutral-900/40 rounded-xl border border-neutral-800 text-neutral-500 text-xs">
          未检索到符合条件的影视资源，可在「元数据刮削工坊」中添加新目录或扫描文件。
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredItems.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              language={language}
              onPlay={onPlay}
              onSelect={onSelect}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
};
