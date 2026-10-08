import React, { useState } from 'react';
import { StorageFolder, AppLanguage, MediaType } from '../types/media';
import { translations } from '../i18n/translations';
import {
  HardDrive,
  FolderPlus,
  RefreshCw,
  Folder,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Layers,
  Database,
  Disc,
  FolderOpen
} from 'lucide-react';

interface StorageManagerProps {
  folders: StorageFolder[];
  language: AppLanguage;
  onAddFolder: (folder: StorageFolder) => void;
  onRescanFolder: (id: string) => void;
}

export const StorageManager: React.FC<StorageManagerProps> = ({
  folders,
  language,
  onAddFolder,
  onRescanFolder,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPath, setNewPath] = useState('D:\\Video\\4K_Remux');
  const [newName, setNewName] = useState('本地蓝光原盘库');
  const [newType, setNewType] = useState<MediaType>('movie');
  const [newPlatform, setNewPlatform] = useState<'windows' | 'macos' | 'linux'>('windows');

  const t = translations[language];

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    const created: StorageFolder = {
      id: 'folder-' + Date.now(),
      name: newName,
      path: newPath,
      platform: newPlatform,
      type: newType,
      itemCount: Math.floor(Math.random() * 40 + 10),
      totalSizeGB: Math.floor(Math.random() * 1200 + 400),
      lastScanned: '刚刚',
      status: 'online',
    };
    onAddFolder(created);
    setShowAddModal(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-amber-400" />
            <span>{t.storageTitle}</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            {t.storageDesc}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold text-xs rounded-lg shadow-md transition-all self-start sm:self-auto"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>{t.addStorage}</span>
        </button>
      </div>

      {/* Storage Vaults Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {folders.map((f) => (
          <div
            key={f.id}
            className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition-all space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center text-amber-400">
                  <Folder className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-200">{f.name}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono mt-0.5">
                    <span className="uppercase text-amber-400">{f.platform}</span>
                    <span>·</span>
                    <span>类型: {f.type}</span>
                  </div>
                </div>
              </div>

              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                已联机
              </span>
            </div>

            {/* Path */}
            <div className="bg-neutral-950/80 p-2.5 rounded border border-neutral-800/80 text-xs font-mono text-neutral-300 break-all">
              {f.path}
            </div>

            {/* Metrics */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60 text-xs text-neutral-400">
              <div className="flex items-center gap-3 font-mono">
                <span>索引文件: <strong className="text-neutral-200">{f.itemCount} 部</strong></span>
                <span>容量: <strong className="text-neutral-200">{(f.totalSizeGB / 1024).toFixed(2)} TB</strong></span>
              </div>

              <button
                onClick={() => onRescanFolder(f.id)}
                className="flex items-center gap-1 text-[11px] text-neutral-300 hover:text-amber-300 transition-colors"
                title="重新扫描目录新增文件"
              >
                <RefreshCw className="w-3 h-3" />
                <span>重新扫描</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Mainstream Media Format & Storage Compatibility Matrix */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-400" />
          <span>全平台媒体封装与元数据格式兼容标准</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1.5">
            <div className="font-semibold text-neutral-200 flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5 text-amber-400" />
              主流视频封装
            </div>
            <p className="text-neutral-400 leading-relaxed text-[11px]">
              MKV (Matroska), MP4 (MPEG-4), ISO (BD-ISO 蓝光原盘), TS, M4V, WebM
            </p>
          </div>

          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1.5">
            <div className="font-semibold text-neutral-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              全景音频解码
            </div>
            <p className="text-neutral-400 leading-relaxed text-[11px]">
              Dolby Atmos (TrueHD / EAC3), DTS:X / DTS-HD MA, FLAC 无损, AAC, LPCM
            </p>
          </div>

          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1.5">
            <div className="font-semibold text-neutral-200 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-sky-400" />
              元数据归档标准
            </div>
            <p className="text-neutral-400 leading-relaxed text-[11px]">
              Kodi/Emby/Jellyfin NFO XML 规范, .nfo 电影/剧集标签, 豆瓣评分与演员表
            </p>
          </div>

          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1.5">
            <div className="font-semibold text-neutral-200 flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
              特效与图形字幕
            </div>
            <p className="text-neutral-400 leading-relaxed text-[11px]">
              ASS/SSA 动态特效字幕, SRT 文本字幕, PGS/SUP 蓝光图形字幕, VTT
            </p>
          </div>
        </div>
      </div>

      {/* Add Storage Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateFolder}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-md w-full space-y-4"
          >
            <h3 className="text-base font-bold text-white">添加本地或网络影音存储源</h3>

            <div className="space-y-1">
              <label className="text-xs text-neutral-400">目录别名</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-neutral-400">文件系统物理绝对路径</label>
              <input
                type="text"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                required
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2.5 text-xs font-mono text-neutral-200 focus:outline-none focus:border-amber-400"
              />
              <span className="text-[10px] text-neutral-500 font-mono">
                示例: D:\Media\Movies (Windows) 或 /Volumes/Media (macOS)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-neutral-400">系统环境</label>
                <select
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-xs text-neutral-200"
                >
                  <option value="windows">Windows (NTFS/ReFS)</option>
                  <option value="macos">macOS (APFS/HFS+)</option>
                  <option value="linux">Linux (ext4/ZFS/Btrfs)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400">分类库类型</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-xs text-neutral-200"
                >
                  <option value="movie">电影 (Movies)</option>
                  <option value="tv">剧集 (TV Shows)</option>
                  <option value="anime">动漫番剧 (Anime)</option>
                  <option value="documentary">纪录片 (Documentary)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold rounded-lg transition-colors"
              >
                立即挂载并索引
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
