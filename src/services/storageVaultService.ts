import { MediaItem, StorageFolder, MediaType } from '../types/media';
import { parseFilename, scrapeMetadataForFile } from './metadataScraper';
import { INITIAL_MEDIA_ITEMS, INITIAL_STORAGE_FOLDERS } from '../data/mockMedia';

const STORAGE_MEDIA_KEY = 'novastream_media_items_v2';
const STORAGE_FOLDERS_KEY = 'novastream_storage_folders_v2';

// Royalty-free playable fallback sample streams
const STREAM_SAMPLES = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
];

// Presets of simulated files found in user custom local directories
const PRESET_FOLDER_CANDIDATES: Record<string, string[]> = {
  movie: [
    'Blade.Runner.2049.2017.2160p.UHD.BluRay.x265.DV.HDR10+.TrueHD.Atmos.7.1-FLUX.mkv',
    'The.Dark.Knight.2008.IMAX.2160p.UHD.BluRay.x265.DTS-HD.MA.5.1-CMRG.mkv',
    'Avatar.The.Way.Of.Water.2022.2160p.UHD.BluRay.x265.DV.Atmos.7.1.mkv',
    'Top.Gun.Maverick.2022.2160p.UHD.BluRay.x265.DV.TrueHD.Atmos.7.1.mkv',
    'Spider.Man.Across.The.Spider.Verse.2023.2160p.UHD.x265.DV.Atmos.mkv',
  ],
  tv: [
    'Severance.S01E01.2160p.ATVP.WEB-DL.DDP5.1.Atmos.DV.H.265.mkv',
    'The.Last.Of.Us.S01E01.2160p.UHD.BluRay.x265.TrueHD.Atmos.7.1.mkv',
    'Shogun.2024.S01E01.2160p.DSNP.WEB-DL.DDP5.1.Atmos.DV.H.265.mkv',
  ],
  anime: [
    'Suzume.2022.1080p.BluRay.x264.FLAC.2.0-VCB-Studio.mkv',
    'Frieren.Beyond.Journeys.End.S01E01.1080p.CR.WEB-DL.AAC2.0.x264.mkv',
    'Your.Name.2016.2160p.UHD.BluRay.x265.HDR.FLAC.5.1.mkv',
  ],
  documentary: [
    'Our.Planet.II.2023.2160p.NF.WEB-DL.DDP5.1.Atmos.DV.H.265.mkv',
    'Blue.Planet.II.2017.2160p.UHD.BluRay.x265.HDR.DTS-HD.MA.5.1.mkv',
  ],
};

export function loadPersistedFolders(): StorageFolder[] {
  try {
    const raw = localStorage.getItem(STORAGE_FOLDERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load persisted folders:', e);
  }
  return INITIAL_STORAGE_FOLDERS;
}

export function savePersistedFolders(folders: StorageFolder[]) {
  try {
    localStorage.setItem(STORAGE_FOLDERS_KEY, JSON.stringify(folders));
  } catch (e) {
    console.warn('Failed to save folders to localStorage:', e);
  }
}

export function loadPersistedMedia(): MediaItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_MEDIA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load persisted media:', e);
  }
  return INITIAL_MEDIA_ITEMS;
}

export function savePersistedMedia(items: MediaItem[]) {
  try {
    localStorage.setItem(STORAGE_MEDIA_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Failed to save media to localStorage:', e);
  }
}

export function resetToDefaults(): { folders: StorageFolder[]; media: MediaItem[] } {
  try {
    localStorage.removeItem(STORAGE_FOLDERS_KEY);
    localStorage.removeItem(STORAGE_MEDIA_KEY);
  } catch (e) {}
  return {
    folders: INITIAL_STORAGE_FOLDERS,
    media: INITIAL_MEDIA_ITEMS,
  };
}

/**
 * Scans a folder path specified by the user (e.g. D:\Movies or /mnt/storage)
 * and generates matching indexed MediaItems that automatically appear in the library.
 */
export async function scanCustomFolderDirectory(
  folder: StorageFolder
): Promise<{ updatedFolder: StorageFolder; newItems: MediaItem[] }> {
  const candidates = PRESET_FOLDER_CANDIDATES[folder.type] || PRESET_FOLDER_CANDIDATES.movie;
  const newItems: MediaItem[] = [];
  let totalGB = 0;

  for (let i = 0; i < candidates.length; i++) {
    const filename = candidates[i];
    const parsed = parseFilename(filename);
    const scraped = await scrapeMetadataForFile(filename);

    const sizeGB = parseFloat((12.5 + Math.random() * 45).toFixed(1));
    totalGB += sizeGB;

    const fullPath = folder.platform === 'windows'
      ? `${folder.path}\\${filename}`
      : `${folder.path}/${filename}`;

    const item: MediaItem = {
      id: `media-${folder.id}-${i}-${Date.now()}`,
      title: scraped.title || parsed.cleanTitle,
      originalTitle: scraped.originalTitle || parsed.cleanTitle,
      type: folder.type,
      year: scraped.year || parsed.year || 2023,
      ratingDouban: scraped.ratingDouban || 8.4,
      ratingImdb: scraped.ratingImdb || 8.5,
      releaseDate: scraped.releaseDate || '2023-01-01',
      runtimeMinutes: scraped.runtimeMinutes || 135,
      resolution: parsed.resolution,
      hdr: parsed.hdr,
      videoCodec: parsed.videoCodec,
      audioCodec: parsed.audioCodec,
      audioTracks: [
        {
          id: `trk-${i}-1`,
          language: 'Original',
          label: `原始无损音频 (${parsed.audioCodec})`,
          codec: parsed.audioCodec,
          channels: '5.1',
          isDefault: true,
        },
      ],
      subtitles: [
        {
          id: `sub-${i}-1`,
          language: 'zh-CN',
          label: '中文简体官方特效字幕 (ASS)',
          format: 'ASS',
          isDefault: true,
        },
      ],
      overview: scraped.overview || `已在挂载目录 ${folder.path} 中完成索引与 NFO 元数据绑定。`,
      genres: scraped.genres || ['动作', '科幻'],
      director: scraped.director || '未知导演',
      cast: [
        { name: '主演', character: '角色', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' },
      ],
      posterUrl: scraped.posterUrl || 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
      backdropUrl: scraped.backdropUrl || 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1600&auto=format&fit=crop&q=80',
      videoUrl: STREAM_SAMPLES[i % STREAM_SAMPLES.length],
      filePath: fullPath,
      fileSizeGB: sizeGB,
      bitrateMbps: parseFloat((25 + Math.random() * 35).toFixed(1)),
      nfoContent: scraped.nfoContent || '',
      matchedSource: scraped.matchedSource || 'TMDB',
      matchScore: scraped.matchScore || 98.4,
      addedDate: new Date().toISOString().split('T')[0],
      watchProgressSec: 0,
      isFavorite: false,
      folderId: folder.id,
    };

    newItems.push(item);
  }

  const updatedFolder: StorageFolder = {
    ...folder,
    itemCount: newItems.length,
    totalSizeGB: Math.round(totalGB),
    lastScanned: new Date().toLocaleTimeString(),
    status: 'online',
  };

  return { updatedFolder, newItems };
}

/**
 * Scans real local files selected through HTML5 Directory input or native Directory Picker
 */
export async function scanRealLocalFiles(
  files: File[],
  folderName: string,
  folderPath: string
): Promise<{ folder: StorageFolder; items: MediaItem[] }> {
  const videoExtensions = /\.(mkv|mp4|webm|avi|mov|m4v|ts|iso)$/i;
  const videoFiles = files.filter((f) => videoExtensions.test(f.name));

  const folderId = 'folder-native-' + Date.now();
  let totalGB = 0;
  const items: MediaItem[] = [];

  for (let i = 0; i < videoFiles.length; i++) {
    const file = videoFiles[i];
    const sizeGB = parseFloat((file.size / (1024 * 1024 * 1024)).toFixed(2));
    totalGB += sizeGB;

    const parsed = parseFilename(file.name);
    const scraped = await scrapeMetadataForFile(file.name);
    // Real browser playable Blob URL
    const realVideoUrl = URL.createObjectURL(file);

    const item: MediaItem = {
      id: `local-file-${folderId}-${i}`,
      title: scraped.title || parsed.cleanTitle || file.name,
      originalTitle: scraped.originalTitle || parsed.cleanTitle,
      type: 'movie',
      year: scraped.year || parsed.year || new Date().getFullYear(),
      ratingDouban: scraped.ratingDouban || 8.5,
      ratingImdb: scraped.ratingImdb || 8.6,
      releaseDate: scraped.releaseDate || '2024-01-01',
      runtimeMinutes: scraped.runtimeMinutes || 120,
      resolution: parsed.resolution,
      hdr: parsed.hdr,
      videoCodec: parsed.videoCodec,
      audioCodec: parsed.audioCodec,
      audioTracks: [
        {
          id: `trk-local-${i}`,
          language: 'Original',
          label: `本地原生音频 (${parsed.audioCodec})`,
          codec: parsed.audioCodec,
          channels: '5.1',
          isDefault: true,
        },
      ],
      subtitles: [
        {
          id: `sub-local-${i}`,
          language: 'zh-CN',
          label: '内置/同目录自动探测字幕',
          format: 'SRT',
          isDefault: true,
        },
      ],
      overview: scraped.overview || `本地磁盘真实挂载文件: ${file.name} (${sizeGB} GB)`,
      genres: scraped.genres || ['本地影音'],
      director: scraped.director || '本地媒体',
      cast: scraped.cast || [
        { name: '演职员', character: '演员', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' },
      ],
      posterUrl: scraped.posterUrl || 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=600&auto=format&fit=crop&q=80',
      backdropUrl: scraped.backdropUrl || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=80',
      videoUrl: realVideoUrl,
      filePath: (file as any).webkitRelativePath || `${folderPath}/${file.name}`,
      fileSizeGB: sizeGB,
      bitrateMbps: parseFloat((sizeGB > 0 ? (sizeGB * 8 * 1024) / (120 * 60) : 15).toFixed(1)),
      nfoContent: scraped.nfoContent || '',
      matchedSource: scraped.matchedSource || 'Local NFO',
      matchScore: scraped.matchScore || 99.0,
      addedDate: new Date().toISOString().split('T')[0],
      watchProgressSec: 0,
      isFavorite: false,
      folderId,
    };

    items.push(item);
  }

  const folder: StorageFolder = {
    id: folderId,
    name: folderName || '本地选择磁盘源',
    path: folderPath || 'Local Filesystem',
    platform: typeof navigator !== 'undefined' && navigator.userAgent.includes('Win') ? 'windows' : 'macos',
    type: 'movie',
    itemCount: items.length,
    totalSizeGB: Math.round(totalGB),
    lastScanned: '刚刚',
    status: 'online',
  };

  return { folder, items };
}
