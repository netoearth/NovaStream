import React from 'react';
import { MediaItem, AppLanguage } from '../types/media';
import { translations } from '../i18n/translations';
import { Play, Info, Sparkles, Heart, FileText, CheckCircle2 } from 'lucide-react';

interface MediaCardProps {
  item: MediaItem;
  language: AppLanguage;
  onPlay: (item: MediaItem) => void;
  onSelect: (item: MediaItem) => void;
  onToggleFavorite: (id: string) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  language,
  onPlay,
  onSelect,
  onToggleFavorite,
}) => {
  const t = translations[language];

  return (
    <div className="group relative flex flex-col bg-neutral-900/50 border border-neutral-800/80 rounded-lg overflow-hidden hover:border-neutral-700 hover:shadow-xl hover:shadow-black/50 transition-all duration-200">
      {/* Poster Container with Aspect Ratio */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-950">
        <img
          src={item.posterUrl}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 ease-out"
        />

        {/* Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3.5">
          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlay(item);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold text-xs py-2 px-3 rounded shadow-md transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{t.playNow}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(item);
              }}
              className="p-2 bg-neutral-800/90 hover:bg-neutral-700 text-neutral-200 rounded transition-colors"
              title={t.details}
            >
              <Info className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(item.id);
              }}
              className={`p-2 rounded transition-colors ${
                item.isFavorite
                  ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                  : 'bg-neutral-800/90 hover:bg-neutral-700 text-neutral-300'
              }`}
              title="收藏"
            >
              <Heart className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Subtle Top corner rating & progress indicator - no pills, quiet text */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-2 pointer-events-none">
          <span className="font-mono text-xs font-semibold text-amber-300 bg-neutral-950/70 backdrop-blur-xs px-1.5 py-0.5 rounded border border-neutral-800/80">
            ★ {item.ratingImdb.toFixed(1)}
          </span>
        </div>

        {/* Watch Progress bar */}
        {item.watchProgressSec > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800">
            <div
              className="h-full bg-amber-400"
              style={{
                width: `${Math.min(100, (item.watchProgressSec / (item.runtimeMinutes * 60)) * 100)}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Information Area - Clean unboxed typography per design guidelines */}
      <div className="p-3 flex flex-col justify-between flex-1">
        <div>
          <h3
            onClick={() => onSelect(item)}
            className="text-sm font-semibold text-neutral-100 hover:text-amber-300 cursor-pointer line-clamp-1 transition-colors"
            title={item.title}
          >
            {item.title}
          </h3>

          {/* Clean metadata line with typographic separators (NO pill boxes) */}
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-1">
            <span>{item.year}</span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span>{item.runtimeMinutes} min</span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span className="font-mono text-neutral-300">{item.resolution}</span>
          </div>

          {/* Technical Specs: Video & Audio specs quietly displayed */}
          <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 mt-1.5 font-mono">
            <span className="text-neutral-400">{item.hdr}</span>
            <span aria-hidden="true" className="text-neutral-700">/</span>
            <span>{item.videoCodec.split('/')[0]}</span>
            <span aria-hidden="true" className="text-neutral-700">/</span>
            <span className="truncate">{item.audioCodec.split(' ')[0]}</span>
          </div>
        </div>

        {/* Source scrap indicator */}
        <div className="mt-3 pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[10px] text-neutral-500">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>{item.matchedSource} ({item.matchScore}%)</span>
          </span>
          <span className="font-mono text-neutral-400">{item.fileSizeGB} GB</span>
        </div>
      </div>
    </div>
  );
};
