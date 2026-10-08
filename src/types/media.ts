export type MediaType = 'movie' | 'tv' | 'anime' | 'documentary';
export type Resolution = '4K UHD' | '1080p FHD' | '720p HD' | 'Original';
export type HdrFormat = 'Dolby Vision' | 'HDR10+' | 'HDR10' | 'HLG' | 'SDR';
export type VideoCodec = 'HEVC/H.265' | 'AV1' | 'H.264/AVC' | 'VP9';
export type AudioCodec = 'Dolby Atmos TrueHD 7.1' | 'DTS-HD MA 5.1' | 'EAC3 5.1' | 'FLAC 2.0' | 'AAC 2.0';
export type HwEngine = 'NVENC' | 'Intel QSV' | 'Apple VideoToolbox' | 'VAAPI' | 'AMD AMF' | 'CPU Software';
export type PlatformStyle = 'macos' | 'windows' | 'linux';
export type AppLanguage = 'zh-CN' | 'zh-TW' | 'en' | 'ja';

export interface CastMember {
  name: string;
  character: string;
  avatar: string;
}

export interface AudioTrack {
  id: string;
  language: string;
  label: string;
  codec: AudioCodec;
  channels: string;
  isDefault?: boolean;
}

export interface SubtitleTrack {
  id: string;
  language: string;
  label: string;
  format: 'ASS' | 'SRT' | 'VTT' | 'PGS';
  isDefault?: boolean;
}

export interface MediaEpisode {
  id: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  overview: string;
  durationMinutes: number;
  thumbnailUrl: string;
  filePath: string;
  videoUrl?: string;
}

export interface MediaItem {
  id: string;
  title: string;
  originalTitle: string;
  type: MediaType;
  year: number;
  ratingDouban: number;
  ratingImdb: number;
  releaseDate: string;
  runtimeMinutes: number;
  resolution: Resolution;
  hdr: HdrFormat;
  videoCodec: VideoCodec;
  audioCodec: AudioCodec;
  audioTracks: AudioTrack[];
  subtitles: SubtitleTrack[];
  overview: string;
  genres: string[];
  director: string;
  cast: CastMember[];
  posterUrl: string;
  backdropUrl: string;
  videoUrl: string;
  filePath: string;
  fileSizeGB: number;
  bitrateMbps: number;
  nfoContent: string;
  matchedSource: 'TMDB' | 'Douban' | 'TVDb' | 'Bangumi' | 'Local NFO';
  matchScore: number;
  addedDate: string;
  watchProgressSec: number;
  isFavorite: boolean;
  episodes?: MediaEpisode[];
}

export interface StorageFolder {
  id: string;
  name: string;
  path: string;
  platform: 'windows' | 'macos' | 'linux';
  type: MediaType;
  itemCount: number;
  totalSizeGB: number;
  lastScanned: string;
  status: 'online' | 'scanning' | 'offline';
}

export interface SyncDevice {
  id: string;
  name: string;
  platform: 'macos' | 'windows' | 'linux' | 'ios' | 'android' | 'appletv';
  ip: string;
  status: 'active' | 'syncing' | 'idle';
  currentMediaId?: string;
  currentTimeSec: number;
  isPlaying: boolean;
  volume: number;
  lastPing: number;
  isCurrentDevice?: boolean;
}

export interface SyncRoom {
  roomId: string;
  roomName: string;
  hostDeviceId: string;
  mediaId: string;
  currentTimeSec: number;
  isPlaying: boolean;
  playbackRate: number;
  lastUpdated: number;
  members: SyncDevice[];
}

export interface TranscodeProfile {
  id: string;
  name: string;
  label: string;
  resolution: string;
  width: number;
  height: number;
  bitrateMbps: number;
  videoCodec: VideoCodec;
  audioCodec: string;
  hwEngine: HwEngine;
  toneMapping: boolean;
  isDirectPlay: boolean;
}

export interface TranscodeTelemetry {
  activeSessionId: string;
  mediaTitle: string;
  profileName: string;
  hwEngine: HwEngine;
  fps: number;
  speedMultiplier: number;
  gpuUtilization: number;
  vramUsedMB: number;
  vramTotalMB: number;
  bufferAheadSec: number;
  cpuUtilization: number;
  tempCelsius: number;
  outputBitrateMbps: number;
  hdrToneMappingActive: boolean;
}

export interface ScraperLog {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
  file?: string;
}
