import { MusicTrack, CoverArtOption } from '../types/media';

// Royalty-free audio tracks for testing
const SAMPLE_AUDIOS = {
  interstellarTheme: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=space-atmosphere-ambient-112199.mp3',
  cyberpunkBeat: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=cyberpunk-city-10708.mp3',
  animePiano: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=piano-moment-9835.mp3',
  orchestralEpic: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=cinematic-time-lapse-115672.mp3',
};

export const INITIAL_MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'track-interstellar-cornfield',
    title: 'Cornfield Chase (原声大碟)',
    artist: 'Hans Zimmer (汉斯·季默)',
    album: 'Interstellar (Original Motion Picture Soundtrack)',
    durationSec: 126,
    coverUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80',
    audioUrl: SAMPLE_AUDIOS.interstellarTheme,
    year: 2014,
    genre: 'Soundtrack / Ambient',
    format: 'FLAC',
    sampleRate: '96kHz / 24-bit (Studio Master)',
    bitDepth: '24-bit',
    bitrateKbps: 3120,
    isFavorite: true,
    folderId: 'folder-music-1',
    nfoContent: `<?xml version="1.0" encoding="UTF-8"?>
<musicvideo>
  <title>Cornfield Chase</title>
  <artist>Hans Zimmer</artist>
  <album>Interstellar OST</album>
  <year>2014</year>
  <codec>FLAC 96kHz/24bit</codec>
</musicvideo>`,
    lrcLyrics: `[00:00.00]Cornfield Chase - Hans Zimmer
[00:06.00]♪ 庄严的风琴在浩瀚的玉米田间回响 ♪
[00:15.50]不要温和地走进那个良夜
[00:24.20]白昼将尽，暮年仍应燃烧咆哮
[00:33.80]怒斥，怒斥光明的消逝
[00:44.10]♪ 旋律层层攀升，管风琴音浪震撼苍穹 ♪
[00:58.30]智者在临终时知晓黑暗是必然
[01:09.50]因为他们的言辞未能激起闪电之光
[01:18.00]他们绝不温和地走进那个良夜
[01:25.00]♪ 穿过虫洞，跨越万千光年的时间与爱 ♪`
  },
  {
    id: 'track-cyberpunk-stay',
    title: 'I Really Want to Stay at Your House',
    artist: 'Rosa Walton / Hallie Coggins',
    album: 'Cyberpunk: Edgerunners (Original Soundtrack)',
    durationSec: 246,
    coverUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
    audioUrl: SAMPLE_AUDIOS.cyberpunkBeat,
    year: 2022,
    genre: 'Synthpop / Cyberpunk',
    format: 'FLAC',
    sampleRate: '48kHz / 24-bit Hi-Res',
    bitDepth: '24-bit',
    bitrateKbps: 1840,
    isFavorite: true,
    folderId: 'folder-music-1',
    nfoContent: `<?xml version="1.0" encoding="UTF-8"?>
<musicvideo>
  <title>I Really Want to Stay at Your House</title>
  <artist>Rosa Walton</artist>
  <album>Cyberpunk: Edgerunners</album>
  <year>2022</year>
</musicvideo>`,
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
  },
  {
    id: 'track-spirited-one-summers-day',
    title: 'One Summer\'s Day (あの夏へ)',
    artist: '久石让 (Joe Hisaishi)',
    album: '千と千尋の神隠し サウンドトラック',
    durationSec: 184,
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    audioUrl: SAMPLE_AUDIOS.animePiano,
    year: 2001,
    genre: 'Classical / OST',
    format: 'DSD',
    sampleRate: 'DSD128 5.6MHz / 1-bit (Direct Stream)',
    bitDepth: '1-bit DSD',
    bitrateKbps: 5644,
    isFavorite: true,
    folderId: 'folder-music-1',
    nfoContent: `<?xml version="1.0" encoding="UTF-8"?>
<musicvideo>
  <title>One Summer's Day</title>
  <artist>Joe Hisaishi</artist>
  <album>Spirited Away Soundtrack</album>
  <year>2001</year>
</musicvideo>`,
    lrcLyrics: `[00:00.00]One Summer's Day (那个夏天) - 久石让
[00:07.50]♪ 清澈透明的钢琴声悄然响起 ♪
[00:18.00]在那条穿过树林的小路上
[00:28.00]青苔石阶，神明栖居的小镇
[00:39.50]白龙送给千寻的饭团带着温暖的泪光
[00:52.00]曾经发生过的事不可能忘记
[01:05.00]只是你想不起来而已
[01:18.00]♪ 弦乐合奏涌入，带着夏日的微风与思念 ♪
[01:35.00]“千寻，无论何时，都不要回头。”`
  },
  {
    id: 'track-oppenheimer-can-you-hear',
    title: 'Can You Hear the Music',
    artist: 'Ludwig Göransson (路德维希·戈兰松)',
    album: 'Oppenheimer (Original Motion Picture Soundtrack)',
    durationSec: 110,
    coverUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=600&auto=format&fit=crop&q=80',
    audioUrl: SAMPLE_AUDIOS.orchestralEpic,
    year: 2023,
    genre: 'Cinematic / Modern Classical',
    format: 'FLAC',
    sampleRate: '192kHz / 24-bit Hi-Res Deluxe',
    bitDepth: '24-bit',
    bitrateKbps: 4608,
    isFavorite: false,
    folderId: 'folder-music-1',
    nfoContent: `<?xml version="1.0" encoding="UTF-8"?>
<musicvideo>
  <title>Can You Hear the Music</title>
  <artist>Ludwig Göransson</artist>
  <album>Oppenheimer OST</album>
  <year>2023</year>
</musicvideo>`,
    lrcLyrics: `[00:00.00]Can You Hear the Music - Ludwig Göransson
[00:05.00]♪ 21次节拍骤变，小提琴极速琶音激荡量子波动 ♪
[00:14.20]你能听到这音乐吗，罗伯特？
[00:22.00]理论只能带你走这么远
[00:31.50]原子的裂变在微观宇宙中绽放
[00:42.00]♪ 琴弓在琴弦上高速跳跃，模拟连锁核反应的链式轰鸣 ♪
[00:55.00]我们正在赋予人类自我毁灭的力量
[01:06.00]普罗米修斯盗取了天火。`
  }
];

export const MOCK_COVER_OPTIONS: Record<string, CoverArtOption[]> = {
  'default': [
    { id: 'c-1', url: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=600&auto=format&fit=crop&q=80', source: 'TMDB', label: 'TMDB 官方主视觉海报 (3840x2160)' },
    { id: 'c-2', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80', source: 'Douban', label: '豆瓣电影公映纪念海报 (4K)' },
    { id: 'c-3', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80', source: 'Fanart.tv', label: 'Fanart.tv 纯净版艺术海报 (无字版)' },
    { id: 'c-4', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80', source: 'TMDB', label: 'IMAX 独家限量版壁纸海报' },
  ]
};
