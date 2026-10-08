import { MediaItem, StorageFolder, TranscodeProfile } from '../types/media';

// Sample royalty-free direct streamable video sources (open movies)
const SAMPLE_VIDEOS = {
  tearsOfSteel: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  bigBuckBunny: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  sintel: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  elephantDream: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  forBiggerBlazes: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
};

export const INITIAL_MEDIA_ITEMS: MediaItem[] = [
  {
    id: 'oppenheimer-2023',
    title: '奥本海默 (Oppenheimer)',
    originalTitle: 'Oppenheimer',
    type: 'movie',
    year: 2023,
    ratingDouban: 8.8,
    ratingImdb: 8.9,
    releaseDate: '2023-07-21',
    runtimeMinutes: 180,
    resolution: '4K UHD',
    hdr: 'Dolby Vision',
    videoCodec: 'HEVC/H.265',
    audioCodec: 'Dolby Atmos TrueHD 7.1',
    audioTracks: [
      { id: 'en-atmos', language: 'English', label: 'English Dolby Atmos TrueHD 7.1 (48kHz/24-bit)', codec: 'Dolby Atmos TrueHD 7.1', channels: '7.1', isDefault: true },
      { id: 'zh-dub', language: 'Chinese', label: '国语配音 DTS-HD MA 5.1 (长影公映译制)', codec: 'DTS-HD MA 5.1', channels: '5.1' },
      { id: 'commentary', language: 'English', label: 'Director Christopher Nolan Commentary', codec: 'AAC 2.0', channels: '2.0' },
    ],
    subtitles: [
      { id: 'sub-zh-en', language: 'zh-CN / en', label: '中英双语特效精校 (ASS)', format: 'ASS', isDefault: true },
      { id: 'sub-zh-sc', language: 'zh-CN', label: '中文简体官方字幕 (SRT)', format: 'SRT' },
      { id: 'sub-en-sdh', language: 'en', label: 'English SDH (VTT)', format: 'VTT' },
    ],
    overview: '本片聚焦于“原子弹之父”罗伯特·奥本海默的主导下，曼哈顿计划如何在美国绝密建立洛斯阿拉莫斯实验室并制造出首枚核武器，以及战后他在麦卡锡主义政治风暴中所面临的忠诚听证审查与道德困境。',
    genres: ['传记', '历史', '剧情'],
    director: '克里斯托弗·诺兰 (Christopher Nolan)',
    cast: [
      { name: '基里安·墨菲', character: 'J. Robert Oppenheimer', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
      { name: '艾米莉·布朗特', character: 'Katherine Oppenheimer', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
      { name: '小罗伯特·唐尼', character: 'Lewis Strauss', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
      { name: '马特·达蒙', character: 'Leslie Groves', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
    ],
    posterUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=80',
    videoUrl: SAMPLE_VIDEOS.tearsOfSteel,
    filePath: '/Volumes/MediaNAS/Movies/Oppenheimer (2023)/Oppenheimer.2023.IMAX.2160p.UHD.BluRay.x265.DV.HDR10.TrueHD.Atmos.7.1-CMRG.mkv',
    fileSizeGB: 58.4,
    bitrateMbps: 45.2,
    nfoContent: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<movie>
  <title>奥本海默</title>
  <originaltitle>Oppenheimer</originaltitle>
  <sorttitle>Oppenheimer</sorttitle>
  <year>2023</year>
  <rating>8.9</rating>
  <votes>720194</votes>
  <premiered>2023-07-21</premiered>
  <runtime>180</runtime>
  <genre>Biography</genre>
  <genre>Drama</genre>
  <genre>History</genre>
  <director>Christopher Nolan</director>
  <fileinfo>
    <streamdetails>
      <video>
        <codec>hevc</codec>
        <aspect>2.20</aspect>
        <width>3840</width>
        <height>2160</height>
        <durationinseconds>10842</durationinseconds>
        <stereomode>2D</stereomode>
        <hdrtype>Dolby Vision / HDR10</hdrtype>
      </video>
      <audio>
        <codec>truehd</codec>
        <language>eng</language>
        <channels>8</channels>
      </audio>
    </streamdetails>
  </fileinfo>
</movie>`,
    matchedSource: 'TMDB',
    matchScore: 99.4,
    addedDate: '2026-10-01',
    watchProgressSec: 4210,
    isFavorite: true,
  },
  {
    id: 'dune-part-two-2024',
    title: '沙丘2 (Dune: Part Two)',
    originalTitle: 'Dune: Part Two',
    type: 'movie',
    year: 2024,
    ratingDouban: 8.3,
    ratingImdb: 8.6,
    releaseDate: '2024-03-01',
    runtimeMinutes: 166,
    resolution: '4K UHD',
    hdr: 'Dolby Vision',
    videoCodec: 'HEVC/H.265',
    audioCodec: 'Dolby Atmos TrueHD 7.1',
    audioTracks: [
      { id: 'en-atmos', language: 'English', label: 'English Dolby Atmos TrueHD 7.1', codec: 'Dolby Atmos TrueHD 7.1', channels: '7.1', isDefault: true },
      { id: 'zh-dub', language: 'Chinese', label: '普通话配音 杜比数字 5.1', codec: 'EAC3 5.1', channels: '5.1' },
    ],
    subtitles: [
      { id: 'sub-zh-bilingual', language: 'zh-CN / en', label: '中英双语特效字幕 (ASS)', format: 'ASS', isDefault: true },
      { id: 'sub-en', language: 'en', label: 'English Full (SRT)', format: 'SRT' },
    ],
    overview: '保罗·厄崔迪携手契妮与弗雷曼人，向毁灭其家族的阴谋者展开复仇。在面对爱情与宇宙命运的终极抉择时，他必须竭力阻止那场唯有他能预见的可怖圣战。',
    genres: ['科幻', '冒险', '剧情'],
    director: '丹尼斯·维伦纽瓦 (Denis Villeneuve)',
    cast: [
      { name: '提莫西·查拉梅', character: 'Paul Atreides', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80' },
      { name: '赞达亚', character: 'Chani', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80' },
      { name: '丽贝卡·弗格森', character: 'Lady Jessica', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
      { name: '奥斯汀·巴特勒', character: 'Feyd-Rautha', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80' },
    ],
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
    videoUrl: SAMPLE_VIDEOS.bigBuckBunny,
    filePath: 'D:\\Media\\Movies\\Dune.Part.Two.2024.2160p.UHD.BluRay.x265.TrueHD.Atmos.7.1-FLUX.mkv',
    fileSizeGB: 64.2,
    bitrateMbps: 52.8,
    nfoContent: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<movie>
  <title>沙丘2</title>
  <originaltitle>Dune: Part Two</originaltitle>
  <year>2024</year>
  <rating>8.6</rating>
  <runtime>166</runtime>
  <genre>Sci-Fi</genre>
  <genre>Adventure</genre>
  <director>Denis Villeneuve</director>
</movie>`,
    matchedSource: 'TMDB',
    matchScore: 98.8,
    addedDate: '2026-09-28',
    watchProgressSec: 1200,
    isFavorite: true,
  },
  {
    id: 'cyberpunk-edgerunners',
    title: '赛博朋克：边缘行者 (Cyberpunk: Edgerunners)',
    originalTitle: 'サイバーパンク エッジランナーズ',
    type: 'anime',
    year: 2022,
    ratingDouban: 9.0,
    ratingImdb: 8.3,
    releaseDate: '2022-09-13',
    runtimeMinutes: 240,
    resolution: '1080p FHD',
    hdr: 'SDR',
    videoCodec: 'AV1',
    audioCodec: 'FLAC 2.0',
    audioTracks: [
      { id: 'ja-flac', language: 'Japanese', label: '日本語 FLAC 2.0 (Studio Hi-Res Master)', codec: 'FLAC 2.0', channels: '2.0', isDefault: true },
      { id: 'en-eac3', language: 'English', label: 'English 5.1 EAC3', codec: 'EAC3 5.1', channels: '5.1' },
    ],
    subtitles: [
      { id: 'sub-zh-ass', language: 'zh-CN', label: '繁化姬 / 极影字幕社 动态歌词双语 (ASS)', format: 'ASS', isDefault: true },
      { id: 'sub-ja', language: 'ja', label: '日本語字幕 (SRT)', format: 'SRT' },
    ],
    overview: '在充满腐败和网络机体改造的未来都市“夜之城”中，生活在底层的街头小子大卫·马丁内斯在一场突如其来的悲剧中失去了一切。为了生存，他选择成为一名“边缘行者”——法外雇佣兵。',
    genres: ['动画', '动作', '科幻'],
    director: '今石洋之 (Hiroyuki Imaishi)',
    cast: [
      { name: '大卫·马丁内斯', character: 'David Martinez', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' },
      { name: '露西', character: 'Lucy', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
    ],
    posterUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1600&auto=format&fit=crop&q=80',
    videoUrl: SAMPLE_VIDEOS.sintel,
    filePath: '/mnt/storage/Anime/Cyberpunk Edgerunners (2022)/[VCB-Studio] Cyberpunk Edgerunners [1080p][Ma10p_AV1_FLAC].mkv',
    fileSizeGB: 18.2,
    bitrateMbps: 16.4,
    nfoContent: `<?xml version="1.0" encoding="UTF-8"?>
<tvshow>
  <title>赛博朋克：边缘行者</title>
  <originaltitle>Cyberpunk: Edgerunners</originaltitle>
  <year>2022</year>
  <rating>9.0</rating>
  <genre>Animation</genre>
  <genre>Sci-Fi</genre>
</tvshow>`,
    matchedSource: 'Bangumi',
    matchScore: 99.1,
    addedDate: '2026-10-04',
    watchProgressSec: 0,
    isFavorite: true,
    episodes: [
      {
        id: 'cpe-ep1',
        seasonNumber: 1,
        episodeNumber: 1,
        title: '第 1 话：因果报应 (Let You Down)',
        overview: '身处夜之城最底层的大卫因为无力支付荒坂学院的高额系统维护费而遭受冷眼，直到母亲在一场突发帮派火拼车祸中罹难。',
        durationMinutes: 24,
        thumbnailUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400&auto=format&fit=crop&q=80',
        filePath: 'Cyberpunk.Edgerunners.S01E01.mkv',
      },
      {
        id: 'cpe-ep2',
        seasonNumber: 1,
        episodeNumber: 2,
        title: '第 2 话：义体狂暴 (Like a Boy)',
        overview: '安装了军规级斯安威逊神经脊柱植入体的大卫回到学校复仇，并在轻轨列车上偶遇神秘的黑客少女露西。',
        durationMinutes: 24,
        thumbnailUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=400&auto=format&fit=crop&q=80',
        filePath: 'Cyberpunk.Edgerunners.S01E02.mkv',
      }
    ]
  },
  {
    id: 'interstellar-2014',
    title: '星际穿越 (Interstellar)',
    originalTitle: 'Interstellar',
    type: 'movie',
    year: 2014,
    ratingDouban: 9.4,
    ratingImdb: 8.7,
    releaseDate: '2014-11-07',
    runtimeMinutes: 169,
    resolution: '4K UHD',
    hdr: 'HDR10+',
    videoCodec: 'HEVC/H.265',
    audioCodec: 'DTS-HD MA 5.1',
    audioTracks: [
      { id: 'en-dts', language: 'English', label: 'English DTS-HD MA 5.1', codec: 'DTS-HD MA 5.1', channels: '5.1', isDefault: true },
      { id: 'zh-eac3', language: 'Chinese', label: '国语公映译配 5.1', codec: 'EAC3 5.1', channels: '5.1' },
    ],
    subtitles: [
      { id: 'sub-zh', language: 'zh-CN', label: '中文简体特效字幕 (ASS)', format: 'ASS', isDefault: true },
      { id: 'sub-en', language: 'en', label: 'English (SRT)', format: 'SRT' },
    ],
    overview: '在不远的未来，地球环境恶化导致农作物凋枯与沙尘暴肆虐。前宇航员库珀受命带领一支探险队穿过土星附近的神秘虫洞，前往遥远未知的星系寻找人类文明的新家园。',
    genres: ['科幻', '冒险', '悬疑'],
    director: '克里斯托弗·诺兰 (Christopher Nolan)',
    cast: [
      { name: '马修·麦康纳', character: 'Cooper', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
      { name: '安妮·海瑟薇', character: 'Brand', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
      { name: '杰西卡·查斯坦', character: 'Murph', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    ],
    posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80',
    videoUrl: SAMPLE_VIDEOS.elephantDream,
    filePath: '/Volumes/MediaNAS/Movies/Interstellar (2014)/Interstellar.2014.IMAX.2160p.UHD.BluRay.x265.HDR10+.DTS-HD.MA.5.1-TERMiNAL.mkv',
    fileSizeGB: 52.6,
    bitrateMbps: 41.5,
    nfoContent: `<?xml version="1.0" encoding="UTF-8"?>
<movie>
  <title>星际穿越</title>
  <originaltitle>Interstellar</originaltitle>
  <year>2014</year>
  <rating>9.4</rating>
  <genre>Sci-Fi</genre>
  <genre>Adventure</genre>
</movie>`,
    matchedSource: 'Douban',
    matchScore: 99.8,
    addedDate: '2026-09-15',
    watchProgressSec: 5120,
    isFavorite: true,
  },
  {
    id: 'spirited-away-2001',
    title: '千与千寻 (Spirited Away)',
    originalTitle: '千と千尋の神隠し',
    type: 'anime',
    year: 2001,
    ratingDouban: 9.4,
    ratingImdb: 8.6,
    releaseDate: '2001-07-20',
    runtimeMinutes: 125,
    resolution: '1080p FHD',
    hdr: 'SDR',
    videoCodec: 'H.264/AVC',
    audioCodec: 'FLAC 2.0',
    audioTracks: [
      { id: 'ja-flac', language: 'Japanese', label: '日本語 FLAC 2.0 (LPCM Remaster)', codec: 'FLAC 2.0', channels: '2.0', isDefault: true },
      { id: 'zh-dub', language: 'Chinese', label: '国语公映配音 2.0', codec: 'AAC 2.0', channels: '2.0' },
    ],
    subtitles: [
      { id: 'sub-zh', language: 'zh-CN', label: '澄空学园 精校双语 (ASS)', format: 'ASS', isDefault: true },
    ],
    overview: '10岁的少女千寻与父母搬家途中误入神秘幽灵小镇。父母因贪食贡品变成了猪，千寻为了解救父母，在神秘少年白龙的指引下进入掌管神明汤屋的汤婆婆手下打工。',
    genres: ['动画', '奇幻', '冒险'],
    director: '宫崎骏 (Hayao Miyazaki)',
    cast: [
      { name: '柊瑠美', character: '荻野千尋', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
      { name: '入野自由', character: 'ハク / 白龙', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    ],
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80',
    videoUrl: SAMPLE_VIDEOS.forBiggerBlazes,
    filePath: 'D:\\Media\\Anime\\Spirited Away (2001)\\[Miyazaki Collection] Spirited Away.1080p.BluRay.x264.FLAC.mkv',
    fileSizeGB: 11.8,
    bitrateMbps: 13.2,
    nfoContent: `<?xml version="1.0" encoding="UTF-8"?>
<movie>
  <title>千与千寻</title>
  <originaltitle>千と千尋の神隠し</originaltitle>
  <year>2001</year>
  <rating>9.4</rating>
  <genre>Animation</genre>
  <genre>Fantasy</genre>
</movie>`,
    matchedSource: 'Douban',
    matchScore: 99.6,
    addedDate: '2026-09-10',
    watchProgressSec: 0,
    isFavorite: false,
  },
  {
    id: 'planet-earth-iii-2023',
    title: '地球脉动 第三季 (Planet Earth III)',
    originalTitle: 'Planet Earth III',
    type: 'documentary',
    year: 2023,
    ratingDouban: 9.7,
    ratingImdb: 9.1,
    releaseDate: '2023-10-22',
    runtimeMinutes: 480,
    resolution: '4K UHD',
    hdr: 'Dolby Vision',
    videoCodec: 'HEVC/H.265',
    audioCodec: 'Dolby Atmos TrueHD 7.1',
    audioTracks: [
      { id: 'en-atmos', language: 'English', label: 'English Dolby Atmos (David Attenborough)', codec: 'Dolby Atmos TrueHD 7.1', channels: '7.1', isDefault: true },
      { id: 'zh-dub', language: 'Chinese', label: '中央广播电视总台 国语解说 5.1', codec: 'EAC3 5.1', channels: '5.1' },
    ],
    subtitles: [
      { id: 'sub-zh', language: 'zh-CN', label: '中英双语科普注释 (ASS)', format: 'ASS', isDefault: true },
    ],
    overview: 'BBC 自然历史部历时近五年潜心制作，探访全球最遥远的角落，展示生灵在迅速变化的环境中的坚韧生息与绝境生存智慧。',
    genres: ['纪录片'],
    director: '迈克尔·冈顿 (Michael Gunton)',
    cast: [
      { name: '戴维·阿滕伯勒', character: '旁白解说 (Narrator)', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
    ],
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600&auto=format&fit=crop&q=80',
    videoUrl: SAMPLE_VIDEOS.tearsOfSteel,
    filePath: '/mnt/nas/Documentary/Planet.Earth.III.2023.2160p.UHD.BluRay.x265.DV.TrueHD.Atmos.7.1.mkv',
    fileSizeGB: 92.5,
    bitrateMbps: 68.4,
    nfoContent: `<?xml version="1.0" encoding="UTF-8"?>
<tvshow>
  <title>地球脉动 第三季</title>
  <originaltitle>Planet Earth III</originaltitle>
  <year>2023</year>
  <rating>9.7</rating>
  <genre>Documentary</genre>
</tvshow>`,
    matchedSource: 'TMDB',
    matchScore: 99.9,
    addedDate: '2026-09-02',
    watchProgressSec: 2800,
    isFavorite: true,
  }
];

export const INITIAL_STORAGE_FOLDERS: StorageFolder[] = [
  {
    id: 'folder-1',
    name: 'NAS 高清电影库 (4K HDR Remux)',
    path: '/Volumes/MediaNAS/Movies',
    platform: 'macos',
    type: 'movie',
    itemCount: 412,
    totalSizeGB: 18450,
    lastScanned: '2026-10-08 02:45',
    status: 'online',
  },
  {
    id: 'folder-2',
    name: '本地快速缓存盘 (NVMe SSD D:)',
    path: 'D:\\Media\\Movies',
    platform: 'windows',
    type: 'movie',
    itemCount: 86,
    totalSizeGB: 4200,
    lastScanned: '2026-10-08 03:12',
    status: 'online',
  },
  {
    id: 'folder-3',
    name: 'Linux 影视阵列 (/mnt/storage/Anime)',
    path: '/mnt/storage/Anime',
    platform: 'linux',
    type: 'anime',
    itemCount: 230,
    totalSizeGB: 8900,
    lastScanned: '2026-10-07 23:10',
    status: 'online',
  },
  {
    id: 'folder-4',
    name: '纪录片与演唱会蓝光原盘 (NFS Mount)',
    path: '/mnt/nas/Documentary',
    platform: 'linux',
    type: 'documentary',
    itemCount: 45,
    totalSizeGB: 3800,
    lastScanned: '2026-10-06 14:20',
    status: 'online',
  }
];

export const TRANSCODE_PROFILES: TranscodeProfile[] = [
  {
    id: 'direct-play',
    name: 'Direct Play (原始直接输出)',
    label: '原始 4K/1080p 规格直通，零延迟，0% GPU 解码消耗',
    resolution: 'Original',
    width: 3840,
    height: 2160,
    bitrateMbps: 0,
    videoCodec: 'HEVC/H.265',
    audioCodec: 'Passthrough',
    hwEngine: 'CPU Software',
    toneMapping: false,
    isDirectPlay: true,
  },
  {
    id: 'nvenc-4k-hevc',
    name: '4K HEVC 28Mbps (NVIDIA NVENC)',
    label: '4K 高码率硬件转码，支持 RTX 40/30 架构，HDR10 色调保持',
    resolution: '4K UHD',
    width: 3840,
    height: 2160,
    bitrateMbps: 28.0,
    videoCodec: 'HEVC/H.265',
    audioCodec: 'Dolby Digital Plus (EAC3) 5.1',
    hwEngine: 'NVENC',
    toneMapping: true,
    isDirectPlay: false,
  },
  {
    id: 'intel-1080p-av1',
    name: '1080p AV1 12Mbps (Intel QuickSync)',
    label: '次世代 AV1 硬件编码，极高压缩比，广色域映射 BT.709',
    resolution: '1080p FHD',
    width: 1920,
    height: 1080,
    bitrateMbps: 12.0,
    videoCodec: 'AV1',
    audioCodec: 'AAC 2.0 Stereo',
    hwEngine: 'Intel QSV',
    toneMapping: true,
    isDirectPlay: false,
  },
  {
    id: 'apple-1080p-hevc',
    name: '1080p HEVC 10Mbps (Apple VideoToolbox)',
    label: 'Apple M 系列芯片神经加速，Metal 3 硬件管线，低发热省电',
    resolution: '1080p FHD',
    width: 1920,
    height: 1080,
    bitrateMbps: 10.0,
    videoCodec: 'HEVC/H.265',
    audioCodec: 'AAC 2.0 Stereo',
    hwEngine: 'Apple VideoToolbox',
    toneMapping: true,
    isDirectPlay: false,
  },
  {
    id: 'vaapi-720p-fast',
    name: '720p H.264 4Mbps (VA-API / 外网移动低延迟)',
    label: '高兼容度 H.264，移动网络流畅播放，双声道下混 (Downmix)',
    resolution: '720p HD',
    width: 1280,
    height: 720,
    bitrateMbps: 4.0,
    videoCodec: 'H.264/AVC',
    audioCodec: 'AAC 2.0 Stereo',
    hwEngine: 'VAAPI',
    toneMapping: true,
    isDirectPlay: false,
  }
];
