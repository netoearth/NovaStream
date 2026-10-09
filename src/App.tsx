import React, { useState, useEffect } from 'react';
import {
  MediaItem,
  StorageFolder,
  PlatformStyle,
  AppLanguage,
  HwEngine,
  SyncRoom,
  MusicTrack,
} from './types/media';
import {
  INITIAL_MEDIA_ITEMS,
  INITIAL_STORAGE_FOLDERS,
} from './data/mockMedia';
import {
  loadPersistedFolders,
  savePersistedFolders,
  loadPersistedMedia,
  savePersistedMedia,
  scanCustomFolderDirectory,
  resetToDefaults,
} from './services/storageVaultService';
import {
  loadPersistedMusicTracks,
  savePersistedMusicTracks,
} from './services/musicService';
import {
  scrapeMetadataForFile,
  getCoverCandidatesForMedia,
  getSubtitleCandidatesForMedia,
} from './services/metadataScraper';
import { syncService, SyncMessage } from './services/syncService';
import { DesktopFrame } from './components/DesktopFrame';
import { Navigation, ActiveTab } from './components/Navigation';
import { HomeView } from './components/HomeView';
import { MusicLibrary, PlaybackState, ExternalMusicControl } from './components/MusicLibrary';
import { ScraperStudio } from './components/ScraperStudio';
import { TranscoderLab } from './components/TranscoderLab';
import { SyncPlayHub } from './components/SyncPlayHub';
import { StorageManager } from './components/StorageManager';
import { SettingsView } from './components/SettingsView';
import { MediaDetailModal } from './components/MediaDetailModal';
import { VideoPlayer } from './components/VideoPlayer';
import { Play, Pause, SkipBack, SkipForward, Music, ExternalLink } from 'lucide-react';

export default function App() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => loadPersistedMedia());
  const [storageFolders, setStorageFolders] = useState<StorageFolder[]>(() => loadPersistedFolders());
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>(() => loadPersistedMusicTracks());
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [platform, setPlatform] = useState<PlatformStyle>('macos');
  const [language, setLanguage] = useState<AppLanguage>('zh-CN');
  const [hwEngine, setHwEngine] = useState<HwEngine>('NVENC');
  const [searchQuery, setSearchQuery] = useState('');

  // Global Music Playback State (to keep music playing & controlled when navigating across tabs)
  const [globalMusicState, setGlobalMusicState] = useState<PlaybackState | null>(null);
  const [globalMusicControl, setGlobalMusicControl] = useState<ExternalMusicControl | null>(null);

  // Persist media items, storage folders, and music tracks
  useEffect(() => {
    savePersistedMedia(mediaItems);
  }, [mediaItems]);

  useEffect(() => {
    savePersistedFolders(storageFolders);
  }, [storageFolders]);

  useEffect(() => {
    savePersistedMusicTracks(musicTracks);
  }, [musicTracks]);

  // Selected item for modal details
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  // Active playing item for player view
  const [playingItem, setPlayingItem] = useState<MediaItem | null>(null);

  // Sync Room state
  const [syncRoom, setSyncRoom] = useState<SyncRoom | null>({
    roomId: 'room-alpha',
    roomName: '全屋影院同步影厅',
    hostDeviceId: syncService.getLocalDevice().id,
    mediaId: INITIAL_MEDIA_ITEMS[0]?.id || '',
    currentTimeSec: 4210,
    isPlaying: false,
    playbackRate: 1.0,
    lastUpdated: Date.now(),
    members: [syncService.getLocalDevice()],
  });

  // Number of active sync nodes
  const [activeSyncCount, setActiveSyncCount] = useState(3);

  // Subscribe to BroadcastChannel messages for real-time play synchronization
  useEffect(() => {
    const unsubscribe = syncService.subscribe((msg: SyncMessage) => {
      if (msg.type === 'PLAY') {
        if (playingItem && playingItem.id === msg.mediaId) {
          // Sync play head
        }
      } else if (msg.type === 'REMOTE_COMMAND') {
        if (msg.targetDeviceId === syncService.getLocalDevice().id) {
          if (msg.command === 'play' && selectedItem) {
            setPlayingItem(selectedItem);
          } else if (msg.command === 'pause') {
            // handle remote pause
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [playingItem, selectedItem]);

  const handleToggleFavorite = (id: string) => {
    setMediaItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isFavorite: !item.isFavorite } : item))
    );
  };

  const handlePlayMedia = (item: MediaItem) => {
    setPlayingItem(item);
    syncService.broadcastPlay(item.id, item.watchProgressSec);
  };

  // Truly rescrape media metadata, subtitles and cover art
  const handleRescrapeMedia = async (item: MediaItem): Promise<MediaItem> => {
    const scraped = await scrapeMetadataForFile(item.filePath);
    const coverCandidates = scraped.coverOptions || getCoverCandidatesForMedia(scraped.title || item.title, scraped.posterUrl);
    const subCandidates = scraped.availableSubtitles || getSubtitleCandidatesForMedia(scraped.title || item.title, scraped.year || item.year);
    
    // Choose updated high-res scraped poster or new cover candidate
    // If the old poster already matched coverCandidates[0], cycle or pick the high-res official one
    let targetPoster = scraped.posterUrl || coverCandidates[0]?.url || item.posterUrl;
    if (coverCandidates.length > 1 && targetPoster === item.posterUrl) {
      targetPoster = coverCandidates[1].url;
    }

    const updated: MediaItem = {
      ...item,
      ...scraped,
      posterUrl: targetPoster,
      backdropUrl: scraped.backdropUrl || item.backdropUrl,
      coverOptions: coverCandidates,
      availableSubtitles: subCandidates,
      subtitles: scraped.subtitles && scraped.subtitles.length > 0 ? scraped.subtitles : item.subtitles,
      matchScore: scraped.matchScore || 99.8,
      matchedSource: scraped.matchedSource || 'TMDB',
      addedDate: new Date().toISOString().split('T')[0],
    };

    setMediaItems((prev) => {
      const nextList = prev.map((m) => (m.id === item.id ? updated : m));
      savePersistedMedia(nextList);
      return nextList;
    });

    if (selectedItem?.id === item.id) {
      setSelectedItem(updated);
    }
    return updated;
  };

  const handleUpdateMediaItem = (updatedItem: MediaItem) => {
    setMediaItems((prev) => {
      const nextList = prev.map((m) => (m.id === updatedItem.id ? updatedItem : m));
      savePersistedMedia(nextList);
      return nextList;
    });
    if (selectedItem?.id === updatedItem.id) {
      setSelectedItem(updatedItem);
    }
  };

  const handleAddFolderWithItems = (folder: StorageFolder, newItems: MediaItem[]) => {
    setStorageFolders((prev) => [folder, ...prev]);
    if (newItems.length > 0) {
      setMediaItems((prev) => [...newItems, ...prev]);
    }
  };

  const handleRescanFolder = async (folderId: string) => {
    const folder = storageFolders.find((f) => f.id === folderId);
    if (!folder) return;
    const { updatedFolder, newItems } = await scanCustomFolderDirectory(folder);
    setStorageFolders((prev) => prev.map((f) => (f.id === folderId ? updatedFolder : f)));
    if (newItems.length > 0) {
      setMediaItems((prev) => {
        const existingTitles = new Set(prev.map((m) => m.title));
        const additions = newItems.filter((m) => !existingTitles.has(m.title));
        return [...additions, ...prev];
      });
    }
  };

  const handleRemoveFolder = (folderId: string) => {
    setStorageFolders((prev) => prev.filter((f) => f.id !== folderId));
    setMediaItems((prev) => prev.filter((m) => m.folderId !== folderId));
  };

  const handleResetDefaults = () => {
    const def = resetToDefaults();
    setStorageFolders(def.folders);
    setMediaItems(def.media);
  };

  const formatSecs = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <DesktopFrame
      platform={platform}
      onPlatformChange={setPlatform}
      language={language}
      onLanguageChange={setLanguage}
      activeSyncCount={activeSyncCount}
      hwAccelerated={true}
    >
      {/* Sidebar Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        language={language}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        unmatchedCount={0}
      />

      {/* Main Content Area based on Active Tab */}
      <main className="flex-1 overflow-hidden flex flex-col bg-neutral-950 relative">
        {activeTab === 'home' && (
          <HomeView
            mediaItems={mediaItems}
            storageFolders={storageFolders}
            language={language}
            searchQuery={searchQuery}
            onPlay={handlePlayMedia}
            onSelect={setSelectedItem}
            onToggleFavorite={handleToggleFavorite}
            filterType="all"
          />
        )}

        {activeTab === 'movies' && (
          <HomeView
            mediaItems={mediaItems}
            storageFolders={storageFolders}
            language={language}
            searchQuery={searchQuery}
            onPlay={handlePlayMedia}
            onSelect={setSelectedItem}
            onToggleFavorite={handleToggleFavorite}
            filterType="movie"
          />
        )}

        {activeTab === 'tv' && (
          <HomeView
            mediaItems={mediaItems}
            storageFolders={storageFolders}
            language={language}
            searchQuery={searchQuery}
            onPlay={handlePlayMedia}
            onSelect={setSelectedItem}
            onToggleFavorite={handleToggleFavorite}
            filterType="tv"
          />
        )}

        {/* Music Library is KEPT MOUNTED in the DOM to avoid music stopping on tab change */}
        <div className={`flex-1 flex flex-col h-full overflow-hidden ${activeTab === 'music' ? '' : 'hidden'}`}>
          <MusicLibrary
            tracks={musicTracks}
            language={language}
            onUpdateTracks={setMusicTracks}
            onPlaybackChange={setGlobalMusicState}
            externalControl={globalMusicControl}
          />
        </div>

        {activeTab === 'scraper' && (
          <ScraperStudio
            mediaItems={mediaItems}
            storageFolders={storageFolders}
            language={language}
            onUpdateMedia={setMediaItems}
            onPlay={handlePlayMedia}
            onNavigateToLibrary={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'transcoder' && (
          <TranscoderLab
            language={language}
            selectedHwEngine={hwEngine}
            onSelectHwEngine={setHwEngine}
          />
        )}

        {activeTab === 'syncplay' && (
          <SyncPlayHub
            mediaItems={mediaItems}
            language={language}
            onPlayMedia={handlePlayMedia}
          />
        )}

        {activeTab === 'storage' && (
          <StorageManager
            folders={storageFolders}
            mediaItems={mediaItems}
            language={language}
            onAddFolderWithItems={handleAddFolderWithItems}
            onRescanFolder={handleRescanFolder}
            onRemoveFolder={handleRemoveFolder}
            onNavigateToMovies={() => setActiveTab('movies')}
            onPlayMedia={handlePlayMedia}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            platform={platform}
            onPlatformChange={setPlatform}
            language={language}
            onLanguageChange={setLanguage}
            hwEngine={hwEngine}
            onHwEngineChange={setHwEngine}
            onResetDefaults={handleResetDefaults}
          />
        )}

        {/* Floating Global Mini Music Player Bar (Active when user navigates away from Music tab) */}
        {activeTab !== 'music' && globalMusicState && (
          <div className="h-16 bg-neutral-900/95 border-t border-neutral-800/90 px-5 flex items-center justify-between shrink-0 select-none z-30 shadow-2xl backdrop-blur-md">
            {/* Song info and quick jump */}
            <div
              onClick={() => setActiveTab('music')}
              className="flex items-center gap-3 cursor-pointer group min-w-0 w-64"
              title="点击返回音乐馆"
            >
              <div className="relative w-10 h-10 rounded overflow-hidden shrink-0 border border-neutral-700 bg-neutral-800">
                <img
                  src={globalMusicState.track.coverUrl}
                  alt={globalMusicState.track.title}
                  className="w-full h-full object-cover"
                />
                {globalMusicState.isPlaying && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-semibold text-neutral-200 truncate group-hover:text-amber-300 transition-colors">
                    {globalMusicState.track.title}
                  </h4>
                  <span className="text-[10px] bg-neutral-800 text-amber-300 px-1 py-0.5 rounded font-mono font-semibold">
                    {globalMusicState.track.format}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 truncate">
                  {globalMusicState.track.artist}
                </p>
              </div>
            </div>

            {/* Playback Controls & Progress bar */}
            <div className="flex flex-col items-center gap-1 max-w-md w-full px-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() =>
                    setGlobalMusicControl({ action: 'prev', nonce: Date.now() })
                  }
                  className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="上一首"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() =>
                    setGlobalMusicControl({
                      action: globalMusicState.isPlaying ? 'pause' : 'play',
                      nonce: Date.now(),
                    })
                  }
                  className="p-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-950 transition-colors shadow-md cursor-pointer"
                >
                  {globalMusicState.isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() =>
                    setGlobalMusicControl({ action: 'next', nonce: Date.now() })
                  }
                  className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="下一首"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Mini scrubber */}
              <div className="flex items-center gap-2 w-full text-[10px] font-mono text-neutral-500">
                <span>{formatSecs(globalMusicState.currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={globalMusicState.duration || 100}
                  step={0.5}
                  value={globalMusicState.currentTime}
                  onChange={(e) =>
                    setGlobalMusicControl({
                      action: 'seek',
                      value: parseFloat(e.target.value),
                      nonce: Date.now(),
                    })
                  }
                  className="flex-1 h-1 bg-neutral-700 appearance-none cursor-pointer accent-amber-400 rounded"
                />
                <span>{formatSecs(globalMusicState.duration)}</span>
              </div>
            </div>

            {/* Jump to Music Library Button */}
            <div className="flex items-center justify-end w-64">
              <button
                onClick={() => setActiveTab('music')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded-lg border border-neutral-700 transition-colors cursor-pointer font-medium"
              >
                <Music className="w-3.5 h-3.5 text-amber-400" />
                <span>返回音乐馆</span>
                <ExternalLink className="w-3 h-3 text-neutral-400" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Media Detail Modal */}
      {selectedItem && (
        <MediaDetailModal
          item={selectedItem}
          language={language}
          onClose={() => setSelectedItem(null)}
          onPlay={(item) => {
            setSelectedItem(null);
            handlePlayMedia(item);
          }}
          onRescrape={handleRescrapeMedia}
          onToggleFavorite={handleToggleFavorite}
          onUpdateItem={handleUpdateMediaItem}
        />
      )}

      {/* Immersive Video Player */}
      {playingItem && (
        <VideoPlayer
          item={playingItem}
          language={language}
          onClose={() => setPlayingItem(null)}
          syncRoom={syncRoom}
          onSyncPlay={(time) => syncService.broadcastPlay(playingItem.id, time)}
          onSyncPause={(time) => syncService.broadcastPause(playingItem.id, time)}
          onSyncSeek={(time) => syncService.broadcastSeek(playingItem.id, time)}
        />
      )}
    </DesktopFrame>
  );
}
