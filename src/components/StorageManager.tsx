import React, { useState, useRef } from 'react';
import { StorageFolder, AppLanguage, MediaType, MediaItem } from '../types/media';
import { translations } from '../i18n/translations';
import { scanCustomFolderDirectory, scanRealLocalFiles } from '../services/storageVaultService';
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
  FolderOpen,
  Upload,
  Play,
  Trash2,
  ExternalLink,
  ChevronRight,
  Film
} from 'lucide-react';

interface StorageManagerProps {
  folders: StorageFolder[];
  mediaItems: MediaItem[];
  language: AppLanguage;
  onAddFolderWithItems: (folder: StorageFolder, newItems: MediaItem[]) => void;
  onRescanFolder: (folderId: string) => Promise<void>;
  onRemoveFolder: (folderId: string) => void;
  onNavigateToMovies: () => void;
  onPlayMedia: (item: MediaItem) => void;
}

export const StorageManager: React.FC<StorageManagerProps> = ({
  folders,
  mediaItems,
  language,
  onAddFolderWithItems,
  onRescanFolder,
  onRemoveFolder,
  onNavigateToMovies,
  onPlayMedia,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPath, setNewPath] = useState('D:\\Video\\4K_Remux');
  const [newName, setNewName] = useState('本地蓝光原盘库');
  const [newType, setNewType] = useState<MediaType>('movie');
  const [newPlatform, setNewPlatform] = useState<'windows' | 'macos' | 'linux'>('windows');

  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const t = translations[language];

  // Manual path mounting
  const handleCreateFolderByPath = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScanning(true);
    setScanMessage(`正在挂载并扫描磁盘目录 "${newPath}"...`);

    const folderId = 'folder-' + Date.now();
    const tempFolder: StorageFolder = {
      id: folderId,
      name: newName,
      path: newPath,
      platform: newPlatform,
      type: newType,
      itemCount: 0,
      totalSizeGB: 0,
      lastScanned: '正在扫描',
      status: 'scanning',
    };

    try {
      const { updatedFolder, newItems } = await scanCustomFolderDirectory(tempFolder);
      onAddFolderWithItems(updatedFolder, newItems);
      setScanMessage(`挂载成功！已在 "${newName}" 中自动索引 ${newItems.length} 部影片并生成 NFO。`);
      setTimeout(() => {
        setIsScanning(false);
        setShowAddModal(false);
      }, 1200);
    } catch (err) {
      console.error(err);
      setIsScanning(false);
    }
  };

  // Real native directory selection
  const handleNativeFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsScanning(true);
    setShowAddModal(true);
    setScanMessage(`正在读取本地真实文件夹文件列表 (共 ${files.length} 个文件)...`);

    try {
      const fileList = Array.from(files);
      const firstPath = fileList[0]?.webkitRelativePath || '';
      const folderName = firstPath ? firstPath.split('/')[0] : '本地真实电影库';
      const folderPath = firstPath ? `LocalDisk:/${folderName}` : 'D:\\Media\\Selected';

      const { folder, items } = await scanRealLocalFiles(fileList, folderName, folderPath);

      onAddFolderWithItems(folder, items);
      setScanMessage(`成功挂载本地磁盘！已发现并索引 ${items.length} 个视频文件，支持直接在影院播放！`);

      setTimeout(() => {
        setIsScanning(false);
        setShowAddModal(false);
      }, 1500);
    } catch (err) {
      console.error('Error scanning real files:', err);
      setIsScanning(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Hidden WebKit directory input for real disk folder browsing */}
      <input
        ref={fileInputRef}
        type="file"
        // @ts-ignore
        webkitdirectory="true"
        directory="true"
        multiple
        onChange={handleNativeFolderSelect}
        className="hidden"
      />

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

        <div className="flex flex-wrap items-center gap-2">
          {/* Button 1: Browse real disk folder */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs rounded-lg border border-neutral-700 transition-colors shadow-sm"
            title="通过系统文件对话框选择本地电脑上的真实文件夹"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>选择本地电脑文件夹 (真实挂载)</span>
          </button>

          {/* Button 2: Manual path mount */}
          <button
            onClick={() => {
              setShowAddModal(true);
              setScanMessage('');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold text-xs rounded-lg shadow-md transition-all"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>{t.addStorage}</span>
          </button>
        </div>
      </div>

      {/* Notice Banner explaining instant sync */}
      <div className="p-3.5 rounded-lg bg-neutral-900/80 border border-neutral-800 flex items-center justify-between text-xs text-neutral-300">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            已激活本地持久化存储 (`localStorage`)。无论添加新磁盘源、重新扫描还是按 F5 刷新，所有挂载目录与影视索引均持久保存。
          </span>
        </div>
        <button
          onClick={onNavigateToMovies}
          className="flex items-center gap-1 text-amber-300 hover:text-amber-200 font-semibold shrink-0 ml-3"
        >
          <span>查看电影库</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Storage Vaults Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {folders.map((f) => {
          // Get items belonging to this folder or matching path
          const folderItems = mediaItems.filter(
            (m) => m.folderId === f.id || m.filePath.startsWith(f.path)
          );
          const isExpanded = expandedFolderId === f.id;

          return (
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

                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    已联机
                  </span>

                  {folders.length > 1 && (
                    <button
                      onClick={() => onRemoveFolder(f.id)}
                      className="p-1 rounded text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
                      title="卸载此挂载点"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Path */}
              <div className="bg-neutral-950/80 p-2.5 rounded border border-neutral-800/80 text-xs font-mono text-neutral-300 break-all flex items-center justify-between">
                <span>{f.path}</span>
                <span className="text-[10px] text-neutral-500 font-mono ml-2 shrink-0">
                  上次扫描: {f.lastScanned}
                </span>
              </div>

              {/* Metrics */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60 text-xs text-neutral-400">
                <div className="flex items-center gap-3 font-mono">
                  <span>已索引: <strong className="text-neutral-200">{folderItems.length || f.itemCount} 部</strong></span>
                  <span>容量: <strong className="text-neutral-200">{(f.totalSizeGB / 1024).toFixed(2)} TB</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedFolderId(isExpanded ? null : f.id)}
                    className="flex items-center gap-1 text-[11px] text-neutral-300 hover:text-amber-300 transition-colors px-2 py-1 bg-neutral-800 rounded"
                  >
                    <Film className="w-3 h-3 text-amber-400" />
                    <span>{isExpanded ? '收起影片' : `包含影片 (${folderItems.length})`}</span>
                  </button>

                  <button
                    onClick={() => onRescanFolder(f.id)}
                    className="flex items-center gap-1 text-[11px] text-neutral-300 hover:text-amber-300 transition-colors px-2 py-1 bg-neutral-800 rounded"
                    title="重新扫描目录新增文件"
                  >
                    <RefreshCw className="w-3 h-3 text-emerald-400" />
                    <span>增量扫描</span>
                  </button>
                </div>
              </div>

              {/* Expanded list of movies under this folder */}
              {isExpanded && (
                <div className="pt-3 border-t border-neutral-800/60 space-y-2 max-h-48 overflow-y-auto">
                  <div className="text-[11px] text-neutral-400 font-semibold mb-1 flex items-center justify-between">
                    <span>收录影片清单</span>
                    <button
                      onClick={onNavigateToMovies}
                      className="text-amber-400 hover:underline text-[10px]"
                    >
                      在媒体库中全部显示 →
                    </button>
                  </div>
                  {folderItems.length === 0 ? (
                    <div className="text-xs text-neutral-500 py-2 text-center font-mono">
                      暂无索引文件，请点击「增量扫描」
                    </div>
                  ) : (
                    folderItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded bg-neutral-950/70 border border-neutral-800 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={item.posterUrl}
                            alt={item.title}
                            className="w-6 h-8 object-cover rounded shrink-0"
                          />
                          <div className="truncate">
                            <span className="text-neutral-200 font-medium truncate block">
                              {item.title}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              {item.resolution} · {item.videoCodec.split('/')[0]} · {item.fileSizeGB} GB
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => onPlayMedia(item)}
                          className="flex items-center gap-1 px-2 py-1 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded text-[11px] font-semibold shrink-0 ml-2"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>播放</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
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
            onSubmit={handleCreateFolderByPath}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-md w-full space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">添加本地影音存储源与挂载点</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            {/* Quick action: browse real files */}
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
              <div className="font-semibold text-amber-300">快速选项：选择真实本地电脑文件夹</div>
              <p className="text-neutral-300 text-[11px]">
                直接点击下方按钮打开系统文件对话框，选择您电脑硬盘中的任意影片文件夹，系统将自动读取真实文件并提取元数据：
              </p>
              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold rounded text-xs transition-colors flex items-center justify-center gap-2"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>立即浏览本地真实磁盘文件夹</span>
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-neutral-800"></div>
              <span className="flex-shrink mx-3 text-neutral-500 text-[11px] font-mono">或者手动指定目录路径</span>
              <div className="flex-grow border-t border-neutral-800"></div>
            </div>

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
              <label className="text-xs text-neutral-400">本地或网络磁盘物理路径</label>
              <input
                type="text"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                required
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2.5 text-xs font-mono text-neutral-200 focus:outline-none focus:border-amber-400"
              />
              <div className="flex items-center gap-1.5 pt-1 text-[10px] text-neutral-400">
                <span>常用快捷预设:</span>
                <button
                  type="button"
                  onClick={() => setNewPath('D:\\Video\\Movies')}
                  className="hover:text-amber-300 underline"
                >
                  D:\Video
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setNewPath('/Volumes/MediaNAS/4K')}
                  className="hover:text-amber-300 underline"
                >
                  /Volumes/Media
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setNewPath('/mnt/storage/Films')}
                  className="hover:text-amber-300 underline"
                >
                  /mnt/storage
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-neutral-400">系统环境</label>
                <select
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-xs text-neutral-200"
                >
                  <option value="windows">Windows (NTFS / ReFS)</option>
                  <option value="macos">macOS (APFS / HFS+)</option>
                  <option value="linux">Linux (ext4 / ZFS / Btrfs)</option>
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

            {/* Scanning status banner */}
            {isScanning && (
              <div className="p-3 rounded bg-neutral-950 border border-amber-500/40 text-xs text-amber-300 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                <span>{scanMessage || '正在挂载并深度索引目录下的媒体文件...'}</span>
              </div>
            )}

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
                disabled={isScanning}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-neutral-950 text-xs font-semibold rounded-lg transition-colors"
              >
                {isScanning ? '正在挂载扫描...' : '立即挂载并索引'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
