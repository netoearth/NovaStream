import React, { useState, useEffect } from 'react';
import { SyncDevice, SyncRoom, MediaItem, AppLanguage } from '../types/media';
import { translations } from '../i18n/translations';
import { syncService, SyncMessage } from '../services/syncService';
import {
  Radio,
  Tv,
  Smartphone,
  Laptop,
  Monitor,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Share2,
  ExternalLink,
  QrCode,
  Check,
  Copy,
  Users,
  Wifi,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface SyncPlayHubProps {
  mediaItems: MediaItem[];
  language: AppLanguage;
  onPlayMedia: (item: MediaItem) => void;
}

export const SyncPlayHub: React.FC<SyncPlayHubProps> = ({
  mediaItems,
  language,
  onPlayMedia,
}) => {
  const [localDevice] = useState<SyncDevice>(syncService.getLocalDevice());
  const [roomCode, setRoomCode] = useState('782910');
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inputJoinCode, setInputJoinCode] = useState('');
  const [newRoomTitle, setNewRoomTitle] = useState('私人专属家庭影院');

  // Synced Room State
  const [currentRoom, setCurrentRoom] = useState<SyncRoom>({
    roomId: 'room-alpha',
    roomName: '客厅与全屋家庭影院',
    hostDeviceId: localDevice.id,
    mediaId: mediaItems[0]?.id || '',
    currentTimeSec: 4210,
    isPlaying: true,
    playbackRate: 1.0,
    lastUpdated: Date.now(),
    members: [
      localDevice,
      {
        id: 'dev-tv-living',
        name: '客厅 Apple TV 4K (tvOS)',
        platform: 'appletv',
        ip: '192.168.1.108',
        status: 'syncing',
        currentTimeSec: 4210,
        isPlaying: true,
        volume: 75,
        lastPing: Date.now(),
      },
      {
        id: 'dev-win-gaming',
        name: '书房主机 (Windows 11 / RTX 4090)',
        platform: 'windows',
        ip: '192.168.1.142',
        status: 'syncing',
        currentTimeSec: 4210,
        isPlaying: true,
        volume: 85,
        lastPing: Date.now(),
      },
      {
        id: 'dev-macbook-pro',
        name: 'MacBook Pro M3 Max (macOS)',
        platform: 'macos',
        ip: '192.168.1.189',
        status: 'syncing',
        currentTimeSec: 4210,
        isPlaying: true,
        volume: 90,
        lastPing: Date.now(),
      },
    ],
  });

  const [activeMedia, setActiveMedia] = useState<MediaItem>(
    mediaItems.find((m) => m.id === currentRoom.mediaId) || mediaItems[0]
  );

  const t = translations[language];

  // Subscribe to real-time BroadcastChannel messages
  useEffect(() => {
    const unsubscribe = syncService.subscribe((msg: SyncMessage) => {
      if (msg.type === 'PLAY') {
        setCurrentRoom((prev) => ({
          ...prev,
          currentTimeSec: msg.time,
          isPlaying: true,
        }));
      } else if (msg.type === 'PAUSE') {
        setCurrentRoom((prev) => ({
          ...prev,
          currentTimeSec: msg.time,
          isPlaying: false,
        }));
      } else if (msg.type === 'SEEK') {
        setCurrentRoom((prev) => ({
          ...prev,
          currentTimeSec: msg.time,
        }));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleToggleRoomPlay = () => {
    const nextState = !currentRoom.isPlaying;
    setCurrentRoom((prev) => ({ ...prev, isPlaying: nextState }));
    if (nextState) {
      syncService.broadcastPlay(currentRoom.mediaId, currentRoom.currentTimeSec);
    } else {
      syncService.broadcastPause(currentRoom.mediaId, currentRoom.currentTimeSec);
    }
  };

  const handleRoomSeek = (delta: number) => {
    const newTime = Math.max(0, currentRoom.currentTimeSec + delta);
    setCurrentRoom((prev) => ({ ...prev, currentTimeSec: newTime }));
    syncService.broadcastSeek(currentRoom.mediaId, newTime);
  };

  const handleSelectRoomMedia = (item: MediaItem) => {
    setActiveMedia(item);
    setCurrentRoom((prev) => ({ ...prev, mediaId: item.id, currentTimeSec: 0 }));
    syncService.broadcastPlay(item.id, 0);
  };

  const openNewTestWindow = () => {
    window.open(window.location.href, '_blank', 'width=1100,height=750');
  };

  const getPlatformIcon = (plat: string) => {
    switch (plat) {
      case 'appletv':
      case 'tv':
        return Tv;
      case 'ios':
      case 'android':
        return Smartphone;
      case 'macos':
        return Laptop;
      case 'linux':
      case 'windows':
      default:
        return Monitor;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
            <span>{t.syncTitle}</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            {t.syncDesc}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded-lg border border-neutral-700 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.createRoom}</span>
          </button>

          <button
            onClick={() => setShowJoinModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded-lg border border-neutral-700 transition-colors"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.joinRoom}</span>
          </button>

          <button
            onClick={openNewTestWindow}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded-lg border border-neutral-700 transition-colors"
            title="在新标签页中打开以检验多客户端亚秒级同步效果"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.openNewWindowTest}</span>
          </button>

          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold text-xs rounded-lg transition-colors"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>手机扫码入房</span>
          </button>
        </div>
      </div>

      {/* Active Sync Room Control Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800/80">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-md shadow-emerald-500/50" />
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                {currentRoom.roomName}
              </h3>
              <p className="text-[11px] text-neutral-400 font-mono">
                局域网组播总线：novastream_sync_bus · 延迟 &lt; 18ms
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 font-mono">房间同步识别码:</span>
            <div className="flex items-center gap-1 px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded text-amber-300 font-mono font-bold text-xs">
              <span>{roomCode}</span>
              <button
                onClick={handleCopyCode}
                className="hover:text-white transition-colors ml-1"
                title="复制房间码"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Current Playing Synced Movie Showcase */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-neutral-950/70 p-4 rounded-lg border border-neutral-800/80">
          <img
            src={activeMedia.posterUrl}
            alt={activeMedia.title}
            className="w-16 h-24 sm:w-20 sm:h-28 object-cover rounded shadow-md shrink-0"
          />

          <div className="flex-1 space-y-2 w-full">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-neutral-100">{activeMedia.title}</h4>
                <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono mt-0.5">
                  <span>{activeMedia.resolution}</span>
                  <span>·</span>
                  <span className="text-amber-400">{activeMedia.hdr}</span>
                  <span>·</span>
                  <span>进度: {formatTime(currentRoom.currentTimeSec)}</span>
                </div>
              </div>

              <button
                onClick={() => onPlayMedia(activeMedia)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold rounded transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>本机进入全屏影院</span>
              </button>
            </div>

            {/* Room Global Timeline & Controls */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleToggleRoomPlay}
                className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-100 transition-colors"
                title="同步播放 / 暂停"
              >
                {currentRoom.isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
              <button
                onClick={() => handleRoomSeek(-15)}
                className="p-1.5 text-neutral-400 hover:text-white transition-colors"
                title="所有设备后退 15 秒"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleRoomSeek(15)}
                className="p-1.5 text-neutral-400 hover:text-white transition-colors"
                title="所有设备快进 15 秒"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <span className="text-xs text-neutral-400 font-mono ml-2">
                主控机心跳正常 · 当前状态: {currentRoom.isPlaying ? '全端同播中' : '全端已暂停'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Connected LAN Devices List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span>局域网内已协同接入终端 ({currentRoom.members.length} 台设备就绪)</span>
          </h3>
          <span className="text-xs text-neutral-400 font-mono">自动 mDNS 组网发现</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentRoom.members.map((member) => {
            const Icon = getPlatformIcon(member.platform);
            const isSelf = member.id === localDevice.id;

            return (
              <div
                key={member.id}
                className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between gap-3 hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-300 shrink-0">
                    <Icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-neutral-200">{member.name}</h4>
                      {isSelf && (
                        <span className="text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded font-mono">
                          本机
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono mt-0.5">
                      <span>IP: {member.ip}</span>
                      <span>·</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Wifi className="w-3 h-3" />
                        亚秒级就绪
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      syncService.sendRemoteCommand(member.id, currentRoom.isPlaying ? 'pause' : 'play');
                    }}
                    className="p-2 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                    title="单独遥控此终端"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onPlayMedia(activeMedia)}
                    className="text-xs px-2.5 py-1.5 bg-neutral-800 hover:bg-amber-400 hover:text-neutral-950 text-neutral-300 rounded font-medium transition-colors"
                  >
                    接力
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Switch Synchronized Media Picker */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral-200">
          更换同步影厅当前片目
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {mediaItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelectRoomMedia(item)}
              className={`p-2 rounded-lg border cursor-pointer transition-all ${
                activeMedia.id === item.id
                  ? 'bg-amber-500/15 border-amber-400 shadow-md'
                  : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <img
                src={item.posterUrl}
                alt={item.title}
                className="w-full aspect-[2/3] object-cover rounded mb-2"
              />
              <p className="text-xs font-semibold text-neutral-200 truncate">{item.title}</p>
              <p className="text-[10px] text-neutral-400 font-mono">{item.year} · {item.resolution}</p>
            </div>
          ))}
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-sm w-full text-center space-y-4">
            <h4 className="text-sm font-bold text-white">手机/平板扫码同步同播</h4>
            <p className="text-xs text-neutral-400">
              同局域网下用 Safari 或 Chrome 扫描二维码，即可加入「{currentRoom.roomName}」
            </p>

            {/* Stylized Native SVG QR Code Matrix */}
            <div className="w-48 h-48 mx-auto bg-white p-3 rounded-lg flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 100 100" className="w-full h-full text-neutral-950">
                <rect x="0" y="0" width="30" height="30" fill="currentColor" />
                <rect x="5" y="5" width="20" height="20" fill="white" />
                <rect x="10" y="10" width="10" height="10" fill="currentColor" />

                <rect x="70" y="0" width="30" height="30" fill="currentColor" />
                <rect x="75" y="5" width="20" height="20" fill="white" />
                <rect x="80" y="10" width="10" height="10" fill="currentColor" />

                <rect x="0" y="70" width="30" height="30" fill="currentColor" />
                <rect x="5" y="75" width="20" height="20" fill="white" />
                <rect x="10" y="80" width="10" height="10" fill="currentColor" />

                {/* Pattern dots */}
                <rect x="35" y="10" width="10" height="10" fill="currentColor" />
                <rect x="50" y="10" width="15" height="5" fill="currentColor" />
                <rect x="35" y="35" width="30" height="30" fill="currentColor" />
                <rect x="40" y="40" width="20" height="20" fill="white" />
                <rect x="45" y="45" width="10" height="10" fill="currentColor" />
                <rect x="10" y="45" width="15" height="10" fill="currentColor" />
                <rect x="75" y="45" width="15" height="15" fill="currentColor" />
                <rect x="45" y="75" width="20" height="10" fill="currentColor" />
                <rect x="75" y="75" width="15" height="15" fill="currentColor" />
              </svg>
            </div>

            <div className="font-mono text-xs text-amber-300 font-bold">
              PIN: {roomCode}
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>新建局域网协同影厅 (SyncPlay Room)</span>
            </h4>
            <div className="space-y-1">
              <label className="text-xs text-neutral-400">影厅名称</label>
              <input
                type="text"
                value={newRoomTitle}
                onChange={(e) => setNewRoomTitle(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="text-xs text-neutral-400">
              创建后将自动生成 6 位房间同步 PIN 码，同局域网内任意客户端均可输入 PIN 码或扫描二维码即时加入。
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
                  setRoomCode(newCode);
                  setCurrentRoom((prev) => ({
                    ...prev,
                    roomName: newRoomTitle,
                  }));
                  setShowCreateModal(false);
                }}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold rounded-lg transition-colors"
              >
                立即创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-sm w-full space-y-4">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>输入 6 位房间 PIN 码加入</span>
            </h4>
            <div className="space-y-1">
              <input
                type="text"
                maxLength={6}
                value={inputJoinCode}
                onChange={(e) => setInputJoinCode(e.target.value.replace(/\D/g, ''))}
                placeholder="例如: 782910"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-3 text-center text-lg font-mono font-bold tracking-widest text-amber-300 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowJoinModal(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  if (inputJoinCode.length === 6) {
                    setRoomCode(inputJoinCode);
                    setShowJoinModal(false);
                    setInputJoinCode('');
                  }
                }}
                disabled={inputJoinCode.length !== 6}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 text-xs font-semibold rounded-lg transition-colors"
              >
                加入同步
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
