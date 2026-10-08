import { MediaItem, ScraperLog, Resolution, VideoCodec, AudioCodec, HdrFormat, CoverArtOption, SubtitleOption, SubtitleTrack } from '../types/media';

export interface ParsedFilename {
  raw: string;
  cleanTitle: string;
  year?: number;
  season?: number;
  episode?: number;
  resolution: Resolution;
  videoCodec: VideoCodec;
  audioCodec: AudioCodec;
  hdr: HdrFormat;
  releaseGroup?: string;
  sourceType: string;
}

export function parseFilename(filename: string): ParsedFilename {
  // Strip extension
  const base = filename.replace(/\.[a-zA-Z0-9]{2,4}$/, '');

  let resolution: Resolution = '1080p FHD';
  if (/2160p|4k|uhd/i.test(base)) resolution = '4K UHD';
  else if (/1080p|fhd/i.test(base)) resolution = '1080p FHD';
  else if (/720p|hd/i.test(base)) resolution = '720p HD';

  let videoCodec: VideoCodec = 'H.264/AVC';
  if (/x265|hevc|h\.265/i.test(base)) videoCodec = 'HEVC/H.265';
  else if (/av1/i.test(base)) videoCodec = 'AV1';
  else if (/vp9/i.test(base)) videoCodec = 'VP9';
  else if (/x264|h\.264|avc/i.test(base)) videoCodec = 'H.264/AVC';

  let hdr: HdrFormat = 'SDR';
  if (/dv|dolby\s*vision/i.test(base)) hdr = 'Dolby Vision';
  else if (/hdr10\+/i.test(base)) hdr = 'HDR10+';
  else if (/hdr10|hdr/i.test(base)) hdr = 'HDR10';
  else if (/hlg/i.test(base)) hdr = 'HLG';

  let audioCodec: AudioCodec = 'AAC 2.0';
  if (/truehd|atmos/i.test(base)) audioCodec = 'Dolby Atmos TrueHD 7.1';
  else if (/dts-hd|dts/i.test(base)) audioCodec = 'DTS-HD MA 5.1';
  else if (/eac3|ddp|dd\+|5\.1/i.test(base)) audioCodec = 'EAC3 5.1';
  else if (/flac/i.test(base)) audioCodec = 'FLAC 2.0';

  // Extract year (1950 - 2030)
  const yearMatch = base.match(/\b(19\d{2}|20\d{2})\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : undefined;

  // Extract Season / Episode
  const seMatch = base.match(/[sS](\d{1,2})[eE](\d{1,2})/);
  const season = seMatch ? parseInt(seMatch[1], 10) : undefined;
  const episode = seMatch ? parseInt(seMatch[2], 10) : undefined;

  // Extract clean title
  let cleanTitle = base;
  if (yearMatch && yearMatch.index !== undefined) {
    cleanTitle = base.substring(0, yearMatch.index);
  } else if (seMatch && seMatch.index !== undefined) {
    cleanTitle = base.substring(0, seMatch.index);
  }
  cleanTitle = cleanTitle
    .replace(/[._\-]/g, ' ')
    .replace(/\[.*?\]|\(.*?\)/g, '')
    .trim();

  // Extract release group (e.g. -CMRG, -FLUX)
  const groupMatch = base.match(/-([A-Za-z0-9]+)$/);
  const releaseGroup = groupMatch ? groupMatch[1] : undefined;

  let sourceType = 'BluRay';
  if (/web-dl|webdl|webrip/i.test(base)) sourceType = 'WEB-DL';
  else if (/remux/i.test(base)) sourceType = 'Remux';
  else if (/bluray/i.test(base)) sourceType = 'BluRay';
  else if (/hdtv/i.test(base)) sourceType = 'HDTV';

  return {
    raw: filename,
    cleanTitle: cleanTitle || base,
    year,
    season,
    episode,
    resolution,
    videoCodec,
    audioCodec,
    hdr,
    releaseGroup,
    sourceType,
  };
}

// Online Metadata Mock Database for realistic scraping
const ONLINE_DATABASE: Record<string, Partial<MediaItem>> = {
  'oppenheimer': {
    title: '奥本海默 (Oppenheimer)',
    originalTitle: 'Oppenheimer',
    year: 2023,
    ratingDouban: 8.8,
    ratingImdb: 8.9,
    releaseDate: '2023-07-21',
    runtimeMinutes: 180,
    director: '克里斯托弗·诺兰 (Christopher Nolan)',
    genres: ['传记', '历史', '剧情'],
    overview: '聚焦“原子弹之父”罗伯特·奥本海默主导曼哈顿计划研发首枚核武器的历程及其战后受到的政治审判。',
    posterUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=80',
    matchedSource: 'TMDB',
    matchScore: 99.4,
  },
  'dune': {
    title: '沙丘2 (Dune: Part Two)',
    originalTitle: 'Dune: Part Two',
    year: 2024,
    ratingDouban: 8.3,
    ratingImdb: 8.6,
    releaseDate: '2024-03-01',
    runtimeMinutes: 166,
    director: '丹尼斯·维伦纽瓦 (Denis Villeneuve)',
    genres: ['科幻', '冒险', '剧情'],
    overview: '保罗·厄崔迪携手弗雷曼人向毁灭其家族的哈克南家族展开复仇，并面对宇宙命运的选择。',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
    matchedSource: 'TMDB',
    matchScore: 98.8,
  },
  'interstellar': {
    title: '星际穿越 (Interstellar)',
    originalTitle: 'Interstellar',
    year: 2014,
    ratingDouban: 9.4,
    ratingImdb: 8.7,
    releaseDate: '2014-11-07',
    runtimeMinutes: 169,
    director: '克里斯托弗·诺兰 (Christopher Nolan)',
    genres: ['科幻', '冒险', '悬疑'],
    overview: '地球恶化危机下，宇航员穿越土星虫洞深入未知星系寻找人类文明生存新空间。',
    posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80',
    matchedSource: 'Douban',
    matchScore: 99.8,
  },
  'cyberpunk': {
    title: '赛博朋克：边缘行者 (Cyberpunk: Edgerunners)',
    originalTitle: 'Cyberpunk: Edgerunners',
    year: 2022,
    ratingDouban: 9.0,
    ratingImdb: 8.3,
    releaseDate: '2022-09-13',
    runtimeMinutes: 240,
    director: '今石洋之 (Hiroyuki Imaishi)',
    genres: ['动画', '动作', '科幻'],
    overview: '在改造义体盛行的夜之城，底层少年大卫为了复仇成为法外佣兵的悲壮物语。',
    posterUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1600&auto=format&fit=crop&q=80',
    matchedSource: 'Bangumi',
    matchScore: 99.1,
  },
  'spirited': {
    title: '千与千寻 (Spirited Away)',
    originalTitle: '千と千尋の神隠し',
    year: 2001,
    ratingDouban: 9.4,
    ratingImdb: 8.6,
    releaseDate: '2001-07-20',
    runtimeMinutes: 125,
    director: '宫崎骏 (Hayao Miyazaki)',
    genres: ['动画', '奇幻', '冒险'],
    overview: '少女千寻误入神隐小镇，在汤婆婆手下打工并拯救变成猪的父母。',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80',
    matchedSource: 'Douban',
    matchScore: 99.6,
  },
  'blade runner': {
    title: '银翼杀手 2049 (Blade Runner 2049)',
    originalTitle: 'Blade Runner 2049',
    year: 2017,
    ratingDouban: 8.3,
    ratingImdb: 8.0,
    releaseDate: '2017-10-06',
    runtimeMinutes: 163,
    director: '丹尼斯·维伦纽瓦 (Denis Villeneuve)',
    genres: ['科幻', '悬疑', '剧情'],
    overview: '洛杉矶银翼杀手K在追查案件中发现了一个埋藏已久的绝密线索，该线索不仅关乎社会秩序甚至可能颠覆人类历史。',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1600&auto=format&fit=crop&q=80',
    matchedSource: 'TMDB',
    matchScore: 98.2,
  }
};

export function getCoverCandidatesForMedia(title: string, defaultPoster?: string): CoverArtOption[] {
  const t = title.toLowerCase();
  if (t.includes('oppenheimer') || t.includes('奥本海默')) {
    return [
      { id: 'cov-opp-1', url: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=600&auto=format&fit=crop&q=80', source: 'TMDB', label: 'TMDB 官方主视觉海报 (3840×2160 UHD)' },
      { id: 'cov-opp-2', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80', source: 'Douban', label: '豆瓣电影中国公映版海报 (4K)' },
      { id: 'cov-opp-3', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80', source: 'Fanart.tv', label: 'Fanart.tv 纯净版艺术海报 (Textless)' },
      { id: 'cov-opp-4', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80', source: 'TMDB', label: 'IMAX 独家限量纪念版海报' },
    ];
  }
  if (t.includes('dune') || t.includes('沙丘')) {
    return [
      { id: 'cov-dune-1', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80', source: 'TMDB', label: 'TMDB 官方预告主视觉海报 (4K)' },
      { id: 'cov-dune-2', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80', source: 'Douban', label: '豆瓣中国公映定档独家海报' },
      { id: 'cov-dune-3', url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&auto=format&fit=crop&q=80', source: 'Fanart.tv', label: '厄拉科斯沙漠风暴艺术纯净海报' },
      { id: 'cov-dune-4', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80', source: 'TMDB', label: 'IMAX 巨幕专属艺术壁纸' },
    ];
  }
  if (t.includes('interstellar') || t.includes('星际穿越')) {
    return [
      { id: 'cov-ist-1', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80', source: 'TMDB', label: 'TMDB 虫洞深空探索官方海报 (4K)' },
      { id: 'cov-ist-2', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80', source: 'Douban', label: '豆瓣十周年重映高分纪念海报' },
      { id: 'cov-ist-3', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80', source: 'Fanart.tv', label: '黑洞卡冈图雅 4K 纯净艺术壁纸' },
    ];
  }
  if (t.includes('cyberpunk') || t.includes('边缘行者')) {
    return [
      { id: 'cov-cp-1', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80', source: 'Bangumi', label: 'Trigger 官方动画原画主海报' },
      { id: 'cov-cp-2', url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&auto=format&fit=crop&q=80', source: 'Douban', label: '夜之城露西与大卫月面梦想海报' },
      { id: 'cov-cp-3', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80', source: 'Fanart.tv', label: '赛博霓虹纯净艺术封绘 (4K)' },
    ];
  }

  const basePoster = defaultPoster || 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=600&auto=format&fit=crop&q=80';
  return [
    { id: 'cov-gen-1', url: basePoster, source: 'TMDB', label: `TMDB 官方主海报 (3840×2160)` },
    { id: 'cov-gen-2', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80', source: 'Douban', label: '豆瓣电影公映纪念海报 (4K)' },
    { id: 'cov-gen-3', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80', source: 'Fanart.tv', label: 'Fanart.tv 纯净艺术版海报' },
    { id: 'cov-gen-4', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80', source: 'TMDB', label: '影院高保真宣传海报' },
  ];
}

export function getSubtitleCandidatesForMedia(title: string, year?: number): SubtitleOption[] {
  const displayTitle = title.split('(')[0].trim() || '电影';
  return [
    {
      id: `sub-shooter-${Date.now()}-1`,
      language: 'zh-CN / en',
      label: `${displayTitle} 蓝光原盘简英双语特效精校字幕 (射手网 Shooter API 99.8%)`,
      format: 'ASS',
      source: 'Shooter (射手网)',
      content: `1
00:00:02,500 --> 00:00:08,200
[双语特效精校] 探索浩瀚时空与真实宇宙的永恒光辉
Exploring the infinite universe and eternal brilliance

2
00:00:10,000 --> 00:00:18,500
在理论与真实的交界处，我们见证了未来的诞生。
At the junction of theory and reality, we witnessed the birth of tomorrow.`,
    },
    {
      id: `sub-subhd-${Date.now()}-2`,
      language: 'zh-CN',
      label: `${displayTitle} 官方公映听障辅助高对比简体中文 (SubHD 99.4%)`,
      format: 'SRT',
      source: 'SubHD',
      content: `1
00:00:03,000 --> 00:00:09,000
【官方公映听障辅助简体】
沉浸式多声道全频音效渲染已就绪

2
00:00:12,000 --> 00:00:19,000
不要温和地走进那个良夜，怒斥光明的消逝。`,
    },
    {
      id: `sub-opensubs-${Date.now()}-3`,
      language: 'en',
      label: `${displayTitle} English Complete Hearing Impaired SDH (OpenSubtitles 98.9%)`,
      format: 'VTT',
      source: 'OpenSubtitles',
      content: `WEBVTT

1
00:00:04.000 --> 00:00:11.000
[Dramatic orchestral crescendo swells in background]
The theoretical possibilities have now become an irrevocable reality.`,
    },
    {
      id: `sub-local-${Date.now()}-4`,
      language: 'zh-TW',
      label: `${displayTitle} 繁體中文台灣公映典藏字幕 (字幕庫 Zimuku 98.2%)`,
      format: 'ASS',
      source: 'Shooter (射手网)',
      content: `1
00:00:03,000 --> 00:00:08,500
繁體中文公映精校特效字幕
縱身躍入時間之海，尋找失落的星塵。`,
    },
  ];
}

export async function scrapeMetadataForFile(
  filename: string,
  onLog?: (log: ScraperLog) => void
): Promise<Partial<MediaItem>> {
  const parsed = parseFilename(filename);
  const now = new Date().toLocaleTimeString();

  onLog?.({
    id: Math.random().toString(),
    timestamp: now,
    level: 'info',
    message: `解析文件名规格: 提取标题 "${parsed.cleanTitle}" [${parsed.resolution} / ${parsed.videoCodec} / ${parsed.hdr}]`,
    file: filename,
  });

  // Simulate network delay to TMDB/Douban API
  await new Promise((resolve) => setTimeout(resolve, 600));

  // Find match in our mock database
  const query = parsed.cleanTitle.toLowerCase();
  let matchedKey = Object.keys(ONLINE_DATABASE).find(k => query.includes(k) || k.includes(query));

  let matchData: Partial<MediaItem>;
  if (!matchedKey) {
    onLog?.({
      id: Math.random().toString(),
      timestamp: new Date().toLocaleTimeString(),
      level: 'warn',
      message: `TMDB 模糊查询命中候选条目，自动根据文件哈希校验元数据`,
      file: filename,
    });
    matchData = {
      title: parsed.cleanTitle || '未知影视文件',
      originalTitle: parsed.cleanTitle || 'Unknown Title',
      year: parsed.year || 2024,
      resolution: parsed.resolution,
      hdr: parsed.hdr,
      videoCodec: parsed.videoCodec,
      audioCodec: parsed.audioCodec,
      matchedSource: 'TMDB',
      matchScore: 92.5,
      genres: ['动作', '剧情'],
      overview: `本地文件 "${filename}" 的自动匹配元数据。包含完整的音视频流参数及 Kodi/Jellyfin 兼容 NFO 标签。`,
      posterUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=600&auto=format&fit=crop&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=80',
    };
  } else {
    matchData = ONLINE_DATABASE[matchedKey];
  }

  // 1. Scrape Cover Options
  const coverOptions = getCoverCandidatesForMedia(matchData.title || parsed.cleanTitle, matchData.posterUrl);
  onLog?.({
    id: Math.random().toString(),
    timestamp: new Date().toLocaleTimeString(),
    level: 'success',
    message: `[封面图刮削] 已从 TMDB / 豆瓣 / Fanart.tv 匹配获取 ${coverOptions.length} 张 4K 高分辨率海报与背景图`,
    file: filename,
  });

  // 2. Scrape Subtitles Options
  const subOptions = getSubtitleCandidatesForMedia(matchData.title || parsed.cleanTitle, matchData.year || parsed.year);
  onLog?.({
    id: Math.random().toString(),
    timestamp: new Date().toLocaleTimeString(),
    level: 'success',
    message: `[字幕智能刮削] 射手网 Shooter API 哈希比对命中，成功抓取 ${subOptions.length} 套简英双语 ASS 特效与官方 SRT 字幕`,
    file: filename,
  });

  const boundSubtitles: SubtitleTrack[] = [
    {
      id: subOptions[0].id,
      language: subOptions[0].language,
      label: subOptions[0].label,
      format: subOptions[0].format,
      isDefault: true,
    },
    {
      id: subOptions[1].id,
      language: subOptions[1].language,
      label: subOptions[1].label,
      format: subOptions[1].format,
      isDefault: false,
    },
  ];

  return {
    ...matchData,
    resolution: parsed.resolution,
    hdr: parsed.hdr,
    videoCodec: parsed.videoCodec,
    audioCodec: parsed.audioCodec,
    coverOptions,
    availableSubtitles: subOptions,
    subtitles: boundSubtitles,
    nfoContent: generateNfoXml({
      title: matchData.title || parsed.cleanTitle,
      originalTitle: matchData.originalTitle || parsed.cleanTitle,
      year: matchData.year || 2024,
      director: matchData.director || 'Unknown',
      genres: matchData.genres || [],
      resolution: parsed.resolution,
      codec: parsed.videoCodec,
    }),
  };
}

export function generateNfoXml(item: {
  title: string;
  originalTitle: string;
  year: number;
  director: string;
  genres: string[];
  resolution: string;
  codec: string;
}): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<!-- Generated by NovaStream Local Media Manager -->
<movie>
  <title>${item.title}</title>
  <originaltitle>${item.originalTitle}</originaltitle>
  <year>${item.year}</year>
  <director>${item.director}</director>
  ${item.genres.map(g => `<genre>${g}</genre>`).join('\n  ')}
  <fileinfo>
    <streamdetails>
      <video>
        <codec>${item.codec}</codec>
        <resolution>${item.resolution}</resolution>
      </video>
    </streamdetails>
  </fileinfo>
</movie>`;
}
