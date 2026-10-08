import React, { useState, useEffect } from 'react';
import {
  MediaItem,
  StorageFolder,
  PlatformStyle,
  AppLanguage,
  HwEngine,
  SyncRoom,
} from './types/media';
import {
  INITIAL_MEDIA_ITEMS,
  INITIAL_STORAGE_FOLDERS,
} from './data/mockMedia';
import { syncService, SyncMessage } from './services/syncService';
import { DesktopFrame } from './components/DesktopFrame';
import { Navigation, ActiveTab } from './components/Navigation';
import { HomeView } from './components/HomeView';
import { ScraperStudio } from './components/ScraperStudio';
import { TranscoderLab } from './components/TranscoderLab';
import { SyncPlayHub } from './components/SyncPlayHub';
import { StorageManager } from './components/StorageManager';
import { SettingsView } from './components/SettingsView';
import { MediaDetailModal } from './components/MediaDetailModal';
import { VideoPlayer } from './components/VideoPlayer';

export default function App() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(INITIAL_MEDIA_ITEMS);
  const [storageFolders, setStorageFolders] = useState<StorageFolder[]>(INITIAL_STORAGE_FOLDERS);
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [platform, setPlatform] = useState<PlatformStyle>('macos');
  const [language, setLanguage] = useState<AppLanguage>('zh-CN');
  const [hwEngine, setHwEngine] = useState<HwEngine>('NVENC');
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleRescrapeMedia = (item: MediaItem) => {
    setMediaItems((prev) =>
      prev.map((m) =>
        m.id === item.id
          ? {
              ...m,
              matchScore: 99.8,
              matchedSource: 'TMDB',
              addedDate: new Date().toISOString().split('T')[0],
            }
          : m
      )
    );
    if (selectedItem?.id === item.id) {
      setSelectedItem((prev) => (prev ? { ...prev, matchScore: 99.8 } : null));
    }
  };

  const handleAddStorageFolder = (folder: StorageFolder) => {
    setStorageFolders((prev) => [folder, ...prev]);
  };

  const handleRescanFolder = (id: string) => {
    setStorageFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, lastScanned: '刚刚', itemCount: f.itemCount + 3 } : f))
    );
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
      <main className="flex-1 overflow-hidden flex flex-col bg-neutral-950">
        {activeTab === 'home' && (
          <HomeView
            mediaItems={mediaItems}
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
            language={language}
            searchQuery={searchQuery}
            onPlay={handlePlayMedia}
            onSelect={setSelectedItem}
            onToggleFavorite={handleToggleFavorite}
            filterType="tv"
          />
        )}

        {activeTab === 'scraper' && (
          <ScraperStudio
            mediaItems={mediaItems}
            storageFolders={storageFolders}
            language={language}
            onUpdateMedia={setMediaItems}
            onPlay={handlePlayMedia}
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
            language={language}
            onAddFolder={handleAddStorageFolder}
            onRescanFolder={handleRescanFolder}
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
          />
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
