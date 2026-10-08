import { MusicTrack } from '../types/media';
import { INITIAL_MUSIC_TRACKS } from '../data/mockMusic';

const MUSIC_STORAGE_KEY = 'novastream_music_tracks_v1';

export interface LyricLine {
  time: number;
  text: string;
}

export function parseLrc(lrcText: string): LyricLine[] {
  if (!lrcText) return [];
  const lines = lrcText.split('\n');
  const result: LyricLine[] = [];

  const timeRegex = /\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?\]/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let match;
    const timestamps: number[] = [];
    timeRegex.lastIndex = 0;

    while ((match = timeRegex.exec(trimmed)) !== null) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const msStr = match[3] || '0';
      const ms = parseInt(msStr.padEnd(3, '0').slice(0, 3), 10);
      timestamps.push(min * 60 + sec + ms / 1000);
    }

    const text = trimmed.replace(timeRegex, '').trim();
    if (text) {
      for (const time of timestamps) {
        result.push({ time, text });
      }
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

export function loadPersistedMusicTracks(): MusicTrack[] {
  try {
    const raw = localStorage.getItem(MUSIC_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load music tracks from localStorage:', e);
  }
  return INITIAL_MUSIC_TRACKS;
}

export function savePersistedMusicTracks(tracks: MusicTrack[]) {
  try {
    localStorage.setItem(MUSIC_STORAGE_KEY, JSON.stringify(tracks));
  } catch (e) {
    console.warn('Failed to save music tracks to localStorage:', e);
  }
}

// Scrape online metadata for music (MusicBrainz & NetEase schema simulator)
export async function scrapeMusicMetadata(query: string): Promise<Partial<MusicTrack>> {
  await new Promise((r) => setTimeout(r, 600));

  const q = query.toLowerCase();
  if (q.includes('cornfield') || q.includes('interstellar') || q.includes('星际')) {
    return {
      title: 'Cornfield Chase (2024 Remaster)',
      artist: 'Hans Zimmer (汉斯·季默)',
      album: 'Interstellar (Original Motion Picture Soundtrack - Expanded Edition)',
      year: 2014,
      genre: 'Soundtrack / Ambient',
      sampleRate: '192kHz / 24-bit Studio Master',
      format: 'FLAC',
      bitrateKbps: 4608,
      coverUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80',
      nfoContent: `<?xml version="1.0" encoding="UTF-8"?>
<musicvideo>
  <title>Cornfield Chase (Expanded Edition)</title>
  <artist>Hans Zimmer</artist>
  <album>Interstellar OST</album>
  <year>2014</year>
  <codec>FLAC 192kHz/24bit Studio Master</codec>
</musicvideo>`,
      lrcLyrics: `[00:00.00]Cornfield Chase - Hans Zimmer (Interstellar OST)
[00:06.00]♪ 庄严的风琴在浩瀚的玉米田间回响 ♪
[00:15.50]不要温和地走进那个良夜
[00:24.20]白昼将尽，暮年仍应燃烧咆哮
[00:33.80]怒斥，怒斥光明的消逝
[00:44.10]♪ 旋律层层攀升，管风琴音浪震撼苍穹 ♪
[00:58.30]智者在临终时知晓黑暗是必然
[01:09.50]因为他们的言辞未能激起闪电之光
[01:18.00]他们绝不温和地走进那个良夜
[01:25.00]♪ 穿过土星虫洞，跨越万千光年的时间与爱 ♪`
    };
  }

  if (q.includes('stay at your house') || q.includes('cyberpunk') || q.includes('边缘行者')) {
    return {
      title: 'I Really Want to Stay at Your House (Extended Hi-Res)',
      artist: 'Rosa Walton / Hallie Coggins',
      album: 'Cyberpunk: Edgerunners (Original Soundtrack Deluxe)',
      year: 2022,
      genre: 'Synthpop / Cyberpunk',
      sampleRate: '96kHz / 24-bit Hi-Res',
      format: 'FLAC',
      bitrateKbps: 3200,
      coverUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
      lrcLyrics: `[00:00.00]I Really Want to Stay at Your House - Rosa Walton
[00:08.50]I couldn't wait for you to come clear the cupboards
[00:14.20]But now you're gone and leaving nothing but sign
[00:20.10]Another evening I'll be sitting getting closer
[00:26.00]To the edge of the night
[00:32.40]So, get away, another way to feel what you didn't want yourself to know
[00:39.20]And let yourself go, you know you didn't lose your mind
[00:46.00]And not this time, so keep your eyes on the moon
[00:53.00]Cause I really want to stay at your house
[01:00.50]And I hope this works out
[01:06.00]♪ 大卫与露西在夜之城轻轨上的终极物语 ♪`
    };
  }

  return {
    title: query,
    artist: 'Hi-Res 精选艺术家',
    album: 'Studio Master Collection',
    year: new Date().getFullYear(),
    genre: 'Hi-Res Lossless Audio',
    sampleRate: '96kHz / 24-bit Hi-Res Master',
    format: 'FLAC',
    bitrateKbps: 2840,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    nfoContent: `<?xml version="1.0" encoding="UTF-8"?>
<musicvideo>
  <title>${query}</title>
  <artist>Hi-Res Scraped Artist</artist>
  <album>Studio Master Album</album>
  <year>${new Date().getFullYear()}</year>
  <codec>FLAC 24-bit</codec>
</musicvideo>`,
    lrcLyrics: `[00:00.00]${query} - 智能刮削同步歌词
[00:06.00]♪ 纯正高解析度数字音频流 (96kHz / 24-bit) ♪
[00:15.00]音乐是跨越时空的无声语言
[00:24.00]在每一次心跳与呼吸之间共鸣
[00:34.00]♪ 动态音符绽放绚丽色彩，母带直解输出 ♪
[00:45.00]在星光与夜色交汇的远方
[00:56.00]聆听内心深处最真实的旋律`
  };
}
