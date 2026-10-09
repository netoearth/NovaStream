import { MusicTrack } from '../types/media';
import { INITIAL_MUSIC_TRACKS } from '../data/mockMusic';

const MUSIC_STORAGE_KEY = 'novastream_music_tracks_v1';

export interface LyricLine {
  time: number;
  text: string;
}

export interface LyricSearchResult {
  id: string;
  title: string;
  artist: string;
  album: string;
  source: 'NetEase (网易云音乐)' | 'QQ Music (QQ音乐)' | 'LRCLIB (开源歌词库)' | 'Kugou (酷狗音乐)';
  matchScore: number;
  lrcText: string;
  previewSnippet: string;
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

// Online Lyrics Database
const KNOWN_LYRICS: Record<string, { lrc: string; artist: string; album: string }> = {
  'cornfield': {
    artist: 'Hans Zimmer (汉斯·季默)',
    album: 'Interstellar (Original Motion Picture Soundtrack - Expanded Edition)',
    lrc: `[00:00.00]Cornfield Chase - Hans Zimmer (Interstellar OST)
[00:06.00]♪ 庄严的风琴在浩瀚的玉米田间回响 ♪
[00:15.50]不要温和地走进那个良夜
[00:24.20]白昼将尽，暮年仍应燃烧咆哮
[00:33.80]怒斥，怒斥光明的消逝
[00:44.10]♪ 旋律层层攀升，管风琴音浪震撼苍穹 ♪
[00:58.30]智者在临终时知晓黑暗是必然
[01:09.50]因为他们的言辞未能激起闪电之光
[01:18.00]他们绝不温和地走进那个良夜
[01:25.00]♪ 穿过土星虫洞，跨越万千光年的时间与爱 ♪
[01:38.20]爱不是人类发明的概念，爱是唯一能跨越时间与空间的事物
[01:52.00]♪ 旋律最终平息于无限深邃的星系尽头 ♪`
  },
  'stay at your house': {
    artist: 'Rosa Walton / Hallie Coggins',
    album: 'Cyberpunk: Edgerunners (Original Soundtrack Deluxe)',
    lrc: `[00:00.00]I Really Want to Stay at Your House - Rosa Walton
[00:08.50]I couldn't wait for you to come clear the cupboards
[00:14.20]But now you're gone and leaving nothing but sign
[00:20.10]Another evening I'll be sitting getting closer
[00:26.00]To the edge of the night
[00:32.40]So, get away, another way to feel what you didn't want yourself to know
[00:39.20]And let yourself go, you know you didn't lose your mind
[00:46.00]And not this time, so keep your eyes on the moon
[00:53.00]Cause I really want to stay at your house
[01:00.50]And I hope this works out
[01:06.00]♪ 大卫与露西在夜之城轻轨上的终极物语 ♪
[01:15.50]But you know how much you mean to me
[01:22.00]I'm done running away, we'll make it to the moon
[01:30.00]♪ 夜之城霓虹在视界里缓缓暗淡 ♪`
  },
  'summer': {
    artist: '久石让 (Joe Hisaishi)',
    album: '千と千尋の神隠し サウンドトラック (Spirited Away OST)',
    lrc: `[00:00.00]One Summer's Day (あの夏へ) - 久石让
[00:07.50]♪ 清澈透明的钢琴声悄然响起，如同微风拂过绿野 ♪
[00:18.00]在那条穿过神秘树林的小路上
[00:28.00]青苔石阶，神明栖居的幽境小镇
[00:39.50]白龙送给千寻的饭团带着温暖的泪光
[00:52.00]曾经发生过的事不可能忘记
[01:05.00]只是你想不起来而已
[01:18.00]♪ 弦乐合奏涌入，带着夏日的微风与深沉思念 ♪
[01:32.00]“千寻，无论何时，都不要回头。”
[01:45.00]握紧双手，找回自己最初的名字
[01:58.00]♪ 钢琴与管弦乐交融出梦幻般的余晖 ♪`
  },
  'can you hear the music': {
    artist: 'Ludwig Göransson (路德维希·戈兰松)',
    album: 'Oppenheimer (Original Motion Picture Soundtrack)',
    lrc: `[00:00.00]Can You Hear the Music - Ludwig Göransson
[00:05.00]♪ 21次节拍骤变，小提琴极速琶音激荡量子波动 ♪
[00:14.20]你能听到这音乐吗，罗伯特？
[00:22.00]理论只能带你走这么远
[00:31.50]原子的裂变在微观宇宙中绚丽绽放
[00:42.00]♪ 琴弓在琴弦上高速跳跃，模拟连锁核反应的链式轰鸣 ♪
[00:55.00]我们正在赋予人类自我毁灭的力量
[01:06.00]普罗米修斯盗取了天火，如今我们要为其付出代价
[01:18.00]♪ 磅礴交响达到极速巅峰，量子光斑在视网膜上闪烁 ♪
[01:32.00]“我现在成了死神，世界的毁灭者。”`
  }
};

/**
 * Multi-source Online Lyrics Search & Scraper
 * Simulates searching NetEase Cloud Music, QQ Music, LRCLIB, and Kugou
 */
export async function searchOnlineLyrics(
  query: string,
  artistHint?: string
): Promise<LyricSearchResult[]> {
  await new Promise((r) => setTimeout(r, 450));

  const q = query.toLowerCase();
  const cleanQ = query.replace(/\(.*?\)/g, '').trim();

  // 1. Check known exact or partial matches
  let matchedKey = Object.keys(KNOWN_LYRICS).find((k) => q.includes(k) || k.includes(q));

  if (matchedKey) {
    const item = KNOWN_LYRICS[matchedKey];
    return [
      {
        id: `lyric-netease-${Date.now()}-1`,
        title: query,
        artist: item.artist,
        album: item.album,
        source: 'NetEase (网易云音乐)',
        matchScore: 99.6,
        lrcText: item.lrc,
        previewSnippet: item.lrc.split('\n').slice(0, 4).join('\n'),
      },
      {
        id: `lyric-lrclib-${Date.now()}-2`,
        title: `${cleanQ} (Studio Master Sync)`,
        artist: item.artist.split('(')[0].trim(),
        album: item.album,
        source: 'LRCLIB (开源歌词库)',
        matchScore: 98.4,
        lrcText: item.lrc,
        previewSnippet: item.lrc.split('\n').slice(0, 4).join('\n'),
      },
      {
        id: `lyric-qq-${Date.now()}-3`,
        title: query,
        artist: item.artist,
        album: item.album,
        source: 'QQ Music (QQ音乐)',
        matchScore: 96.8,
        lrcText: item.lrc,
        previewSnippet: item.lrc.split('\n').slice(0, 4).join('\n'),
      },
    ];
  }

  // 2. Dynamic high-fidelity synced LRC generation for any other song
  const displayArtist = artistHint || '精选艺术家';
  const generatedLrc = `[00:00.00]${cleanQ} - ${displayArtist}
[00:05.50]♪ 纯正高解析度数字音频流 (96kHz / 24-bit Hi-Res) ♪
[00:14.20]在音符流淌的每一个瞬间
[00:23.00]穿透静谧的黑夜与星尘
[00:32.50]旋律在心底泛起温柔的涟漪
[00:43.00]♪ 动态母带级声场渲染，高保真细节绽放 ♪
[00:54.20]聆听这跨越时空的深情回响
[01:06.00]无论身在何方，音乐始终与你同行
[01:18.50]♪ 渐入梦幻悠扬的终章旋律 ♪`;

  return [
    {
      id: `lyric-netease-gen-${Date.now()}-1`,
      title: cleanQ,
      artist: displayArtist,
      album: `${cleanQ} - Studio Album`,
      source: 'NetEase (网易云音乐)',
      matchScore: 95.8,
      lrcText: generatedLrc,
      previewSnippet: generatedLrc.split('\n').slice(0, 4).join('\n'),
    },
    {
      id: `lyric-lrclib-gen-${Date.now()}-2`,
      title: `${cleanQ} (Official Hi-Res Sync)`,
      artist: displayArtist,
      album: 'Global Release',
      source: 'LRCLIB (开源歌词库)',
      matchScore: 93.5,
      lrcText: generatedLrc,
      previewSnippet: generatedLrc.split('\n').slice(0, 4).join('\n'),
    },
    {
      id: `lyric-kugou-gen-${Date.now()}-3`,
      title: cleanQ,
      artist: displayArtist,
      album: 'Lossless Edition',
      source: 'Kugou (酷狗音乐)',
      matchScore: 91.2,
      lrcText: generatedLrc,
      previewSnippet: generatedLrc.split('\n').slice(0, 4).join('\n'),
    },
  ];
}

// Scrape online metadata for music (MusicBrainz & NetEase schema simulator)
export async function scrapeMusicMetadata(
  query: string,
  artistHint?: string
): Promise<Partial<MusicTrack>> {
  await new Promise((r) => setTimeout(r, 500));

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
      lrcLyrics: KNOWN_LYRICS_FALLBACK('cornfield', query)
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
      lrcLyrics: KNOWN_LYRICS_FALLBACK('stay at your house', query)
    };
  }

  if (q.includes('summer') || q.includes('千与千寻') || q.includes('久石让')) {
    return {
      title: 'One Summer\'s Day (あの夏へ - DSD Direct)',
      artist: '久石让 (Joe Hisaishi)',
      album: '千与千尋の神隠し サウンド战略大碟',
      year: 2001,
      genre: 'Classical / OST',
      sampleRate: 'DSD128 5.6MHz / 1-bit Master',
      format: 'DSD',
      bitrateKbps: 5644,
      coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      lrcLyrics: KNOWN_LYRICS_FALLBACK('summer', query)
    };
  }

  if (q.includes('music') || q.includes('oppenheimer') || q.includes('奥本海默')) {
    return {
      title: 'Can You Hear the Music (24-bit Master)',
      artist: 'Ludwig Göransson (路德维希·戈兰松)',
      album: 'Oppenheimer (Original Motion Picture Soundtrack)',
      year: 2023,
      genre: 'Cinematic / Modern Classical',
      sampleRate: '192kHz / 24-bit Hi-Res Deluxe',
      format: 'FLAC',
      bitrateKbps: 4608,
      coverUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=600&auto=format&fit=crop&q=80',
      lrcLyrics: KNOWN_LYRICS_FALLBACK('can you hear the music', query)
    };
  }

  const cleanTitle = query.replace(/\.[a-zA-Z0-9]{2,4}$/, '').trim();
  const artistName = artistHint || '精选 Hi-Res 艺术家';

  return {
    title: cleanTitle,
    artist: artistName,
    album: `${cleanTitle} - Studio Master Collection`,
    year: new Date().getFullYear(),
    genre: 'Hi-Res Lossless Audio',
    sampleRate: '96kHz / 24-bit Hi-Res Master',
    format: 'FLAC',
    bitrateKbps: 2840,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    nfoContent: `<?xml version="1.0" encoding="UTF-8"?>
<musicvideo>
  <title>${cleanTitle}</title>
  <artist>${artistName}</artist>
  <album>Studio Master Album</album>
  <year>${new Date().getFullYear()}</year>
  <codec>FLAC 24-bit / 96kHz</codec>
</musicvideo>`,
    lrcLyrics: `[00:00.00]${cleanTitle} - ${artistName}
[00:06.00]♪ 智能刮削同步歌词 (NetEase & LRCLIB 聚合匹配) ♪
[00:15.00]音乐是跨越时空的无声语言
[00:24.00]在每一次心跳与呼吸之间共鸣
[00:34.00]♪ 动态音符绽放绚丽色彩，母带直解输出 ♪
[00:45.00]在星光与夜色交汇的远方
[00:56.00]聆听内心深处最真实的旋律`
  };
}

function KNOWN_LYRICS_FALLBACK(key: string, defaultTitle: string): string {
  if (KNOWN_LYRICS[key]) {
    return KNOWN_LYRICS[key].lrc;
  }
  return `[00:00.00]${defaultTitle}\n[00:05.00]♪ 正在载入同步歌词 ♪`;
}
